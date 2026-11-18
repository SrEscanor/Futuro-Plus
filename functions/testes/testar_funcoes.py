"""Testa as funções coletar_demanda, enviar_capa e coletar_noticias sem tocar no
Firebase nem nos sites de fora: Firestore, Auth, Storage e as coletas são
simulados.

Como rodar, da pasta do projeto:

    functions/venv/Scripts/python.exe functions/testes/testar_funcoes.py

Termina com "TUDO CERTO" ou para no primeiro teste que falhar.

Para conferir a coleta de verdade (acessa os sites, não grava nada):

    functions/venv/Scripts/python.exe functions/demanda.py etec 20261 --limite 8
"""
import base64
import copy
import json
import sys
from datetime import datetime, timedelta, timezone
from email.utils import format_datetime
from pathlib import Path
from types import SimpleNamespace
from unittest import mock

sys.stdout.reconfigure(encoding="utf-8")
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import firebase_admin  # noqa: E402

with mock.patch.object(firebase_admin, "initialize_app"):
    import main  # noqa: E402
import comunidade  # noqa: E402
import demanda  # noqa: E402
import noticias  # noqa: E402
import flask  # noqa: E402
import requests  # noqa: E402

APAGAR = main.firestore.DELETE_FIELD


# --------------------------------------------------------------------------
# Firebase de mentira
# --------------------------------------------------------------------------

def fundir(destino, novo):
    """Mesma regra do set(merge=True): mapas se misturam, o resto substitui."""
    for chave, valor in novo.items():
        if valor is APAGAR:
            destino.pop(chave, None)
        elif isinstance(valor, dict):
            if not isinstance(destino.get(chave), dict):
                destino[chave] = {}
            fundir(destino[chave], valor)
        else:
            destino[chave] = valor


class Doc:
    def __init__(self, banco, caminho):
        self.banco, self.caminho = banco, caminho
        self.id = caminho.split("/")[-1]

    @property
    def exists(self):
        return self.caminho in self.banco

    def to_dict(self):
        return self.banco.get(self.caminho)

    def get(self):
        return self

    def set(self, dados, merge=False):
        if merge:
            fundir(self.banco.setdefault(self.caminho, {}), dados)
        else:
            self.banco[self.caminho] = dados

    def collection(self, nome):
        return Colecao(self.banco, f"{self.caminho}/{nome}")


class Colecao:
    def __init__(self, banco, caminho):
        self.banco, self.caminho = banco, caminho

    def document(self, id_doc):
        return Doc(self.banco, f"{self.caminho}/{id_doc}")

    def stream(self):
        nivel = self.caminho.count("/") + 1
        return [Doc(self.banco, c) for c in list(self.banco)
                if c.startswith(self.caminho + "/") and c.count("/") == nivel]

    def where(self, campo, operador, valor):
        return Consulta(self, [(campo, operador, valor)])


class Consulta:
    """O bastante de uma consulta do Firestore para os testes: filtros com
    ==, >= e <=. Documento sem o campo fica de fora, como no Firestore."""
    COMPARAR = {
        "==": lambda a, b: a == b,
        ">=": lambda a, b: a is not None and a >= b,
        "<=": lambda a, b: a is not None and a <= b,
        "in": lambda a, b: a is not None and a in b,
    }

    def __init__(self, colecao, filtros):
        self.colecao, self.filtros = colecao, filtros

    def where(self, campo, operador, valor):
        return Consulta(self.colecao, [*self.filtros, (campo, operador, valor)])

    def select(self, _campos):
        return self

    def stream(self):
        return [doc for doc in self.colecao.stream()
                if all(self.COMPARAR[operador]((doc.to_dict() or {}).get(campo), valor)
                       for campo, operador, valor in self.filtros)]


class Lote:
    def __init__(self, banco):
        self.banco, self.pendentes = banco, []

    def set(self, ref, dados, merge=False):
        self.pendentes.append((ref, dados, merge))

    def delete(self, ref):
        self.pendentes.append((ref, None, "apagar"))

    def commit(self):
        assert len(self.pendentes) <= 500, "o Firestore aceita no máximo 500 escritas por lote"
        for ref, dados, merge in self.pendentes:
            if merge == "apagar":
                self.banco.pop(ref.caminho, None)
            else:
                ref.set(dados, merge=merge)


class Banco:
    def __init__(self, dados):
        self.dados = dados

    def collection(self, nome):
        return Colecao(self.dados, nome)

    def batch(self):
        return Lote(self.dados)

    def get_all(self, referencias):
        return [referencia.get() for referencia in referencias]


class Blob:
    def __init__(self, arquivos, nome):
        self.arquivos, self.nome, self.cache_control = arquivos, nome, None
        self.public_url = f"https://storage.googleapis.com/balde/{nome}"

    def upload_from_string(self, conteudo, content_type=None):
        self.arquivos[self.nome] = {"bytes": len(conteudo), "tipo": content_type, "cache": self.cache_control}

    def make_public(self):
        pass

    def delete(self):
        del self.arquivos[self.nome]  # KeyError quando não existe, como o NotFound de verdade


def ambiente(docs, arquivos, coleta=None, semestres=("20262", "20261", "20251")):
    balde = type("Balde", (), {"blob": lambda _s, nome: Blob(arquivos, nome)})()
    return [
        mock.patch.object(main.firestore, "client", return_value=Banco(docs)),
        mock.patch.object(main.firebase_auth, "verify_id_token", side_effect=lambda token: {"uid": token}),
        mock.patch.object(main.storage, "bucket", return_value=balde),
        mock.patch.object(demanda, "coletar", return_value=coleta),
        mock.patch.object(demanda, "listar_semestres", return_value=list(semestres)),
    ]


def chamar(funcao, corpo, token="admin1"):
    cabecalhos = {"Authorization": f"Bearer {token}"} if token else {}
    with flask.Flask("teste").test_request_context(method="POST", json=corpo, headers=cabecalhos):
        resposta = funcao(flask.request)
    return resposta.status_code, json.loads(resposta.get_data(as_text=True) or "{}")


def conferir(descricao, condicao, detalhe=""):
    if not condicao:
        print(f"FALHOU: {descricao} {detalhe}")
        sys.exit(1)
    print(f"  ok  {descricao}")


# --------------------------------------------------------------------------
# Demanda
# --------------------------------------------------------------------------

def testar_nomes():
    print("nomes dos cursos nos sites do vestibular")
    casos = {
        "ENSINO MÉDIO COM HABILITAÇÃO PROFISSIONAL DE TÉCNICO EM AGROPECUÁRIA - M-TEC - PI": "agropecuaria",
        "ENSINO MÉDIO COM HABILITAÇÃO PROFISSIONAL DE TÉCNICO EM AGROPECUÁRIA - M-TEC-N": "agropecuaria",
        "CONTABILIDADE": "contabilidade",
        "ADMINISTRAÇÃO - 20% ONLINE": "administracao",
    }
    for site_escreve, esperado in casos.items():
        conferir(f"{site_escreve[:60]!r} -> {esperado}", demanda.nome_base("etec", site_escreve) == esperado,
                 demanda.nome_base("etec", site_escreve))

    # o traço também faz parte de alguns nomes: o nome inteiro é tentado primeiro
    nomes = demanda.nomes_possiveis("etec", "ESPECIALIZAÇÃO EM URGÊNCIA E EMERGÊNCIA - APH - ATENDIMENTO PRÉ-HOSPITALAR")
    conferir("nome com traço é tentado inteiro antes de ser cortado",
             nomes[0] == "urgencia e emergencia aph atendimento pre hospitalar" and nomes[-1] == "urgencia e emergencia", nomes)


def testar_demanda():
    print("coletar_demanda")
    coleta = {"site": "etec", "semestre": "20261", "falhas": [], "unidades": [
        {"codigo": "E0001.S0000", "nome": "Cidade - ETEC UM", "cursos": [
            {"curso": "ADMINISTRAÇÃO", "periodo": "Noite", "inscritos": 100, "vagas": 40},
            {"curso": "ENSINO MÉDIO COM HABILITAÇÃO PROFISSIONAL DE TÉCNICO EM ADMINISTRAÇÃO - M-TEC", "periodo": "Manhã",
             "inscritos": 300, "vagas": 40},
            {"curso": "ENSINO MÉDIO COM ITINERÁRIO FORMATIVO DE LINGUAGENS E SUAS TECNOLOGIAS", "periodo": "Manhã",
             "inscritos": 90, "vagas": 30},
        ]},
        # classe descentralizada da mesma escola: soma os números, mas conta como uma unidade só
        {"codigo": "E0001.F0002", "nome": "Cidade - ETEC UM - EXTENSÃO", "cursos": [
            {"curso": "ADMINISTRAÇÃO", "periodo": "Noite", "inscritos": 50, "vagas": 40},
        ]},
        {"codigo": "E0002.S0000", "nome": "Outra - ETEC DOIS", "cursos": [
            {"curso": "QUÍMICA", "periodo": "Tarde", "inscritos": 60, "vagas": 40},
            {"curso": "Treineiro", "periodo": "Treineiro", "inscritos": 9, "vagas": 0},
        ]},
    ]}
    docs = {
        "usuarios/admin1": {"admin": True},
        "usuarios/aluno1": {"admin": False},
        "cursos/administracao": {"nome": "Administração", "duracao": "3 semestres", "demanda": {"historico": [
            {"periodo": "2025-1", "inscritos": 10, "vagas": 5, "unidades": 1},
            {"periodo": "2026-1", "inscritos": 1, "vagas": 1, "unidades": 1},
        ]}},
        "cursos/quimica": {"nome": "Química"},
        # mesmo nome de um curso técnico: a demanda da Etec não pode cair aqui
        "cursos/superior-quimica": {"nome": "Química", "nivel": "superior"},
    }
    arquivos = {}
    simulacoes = ambiente(docs, arquivos, coleta)
    for s in simulacoes:
        s.start()
    try:
        conferir("sem login devolve 401", chamar(main.coletar_demanda, {"acao": "situacao"}, token=None)[0] == 401)
        conferir("quem não é admin recebe 403", chamar(main.coletar_demanda, {"acao": "situacao"}, token="aluno1")[0] == 403)
        conferir("semestre mal escrito devolve 400",
                 chamar(main.coletar_demanda, {"acao": "coletar", "site": "etec", "semestre": "2026"})[0] == 400)

        status, antes = chamar(main.coletar_demanda, {"acao": "situacao"})
        conferir("situação começa sem nada coletado", status == 200 and antes["coletados"] == {}, antes)

        status, resumo = chamar(main.coletar_demanda, {"acao": "coletar", "site": "etec", "semestre": "20261"})
        conferir("a coleta responde 200", status == 200, resumo)
        conferir("dois cursos do catálogo receberam números", resumo["cursos"] == 2, resumo)
        conferir("o itinerário formativo fica na lista 'sem par'",
                 len(resumo["semPar"]) == 1 and "ITINERÁRIO" in resumo["semPar"][0]["curso"], resumo["semPar"])

        historico = docs["cursos/administracao"]["demanda"]["historico"]
        conferir("o ano antigo continua no histórico", historico[0] == {"periodo": "2025-1", "inscritos": 10, "vagas": 5, "unidades": 1})
        conferir("o ano coletado substitui o que havia: soma das ofertas e da extensão",
                 historico[1] == {"periodo": "2026-1", "inscritos": 450, "vagas": 120, "unidades": 1}, historico[1])
        conferir("os outros campos do curso não são tocados", docs["cursos/administracao"]["duracao"] == "3 semestres")
        conferir("o curso superior de mesmo nome não recebe demanda da Etec", "demanda" not in docs["cursos/superior-quimica"])
        conferir("'Treineiro' (sem vagas) não entra na soma",
                 docs["cursos/quimica"]["demanda"]["historico"] == [{"periodo": "2026-1", "inscritos": 60, "vagas": 40, "unidades": 1}])
        conferir("o detalhe de cada unidade é guardado",
                 sum(1 for c in docs if c.startswith("demanda/etec-20261/unidades/")) == 3)

        _, depois = chamar(main.coletar_demanda, {"acao": "situacao"})
        conferir("a situação passa a listar o semestre coletado", "20261" in depois["coletados"].get("etec", {}), depois)
    finally:
        for s in simulacoes:
            s.stop()


# --------------------------------------------------------------------------
# Capas
# --------------------------------------------------------------------------

def testar_capas():
    print("enviar_capa")
    docs = {"usuarios/admin1": {"admin": True}, "usuarios/aluno1": {"admin": False}}
    arquivos = {}
    imagem = base64.b64encode(b"RIFF....WEBP" * 50).decode()
    simulacoes = ambiente(docs, arquivos)
    for s in simulacoes:
        s.start()
    try:
        envio = {"alvo": "eixo", "id": "gestao-e-negocios", "tipo": "image/webp", "imagem": imagem}
        conferir("sem login devolve 401", chamar(main.enviar_capa, envio, token=None)[0] == 401)
        conferir("quem não é admin recebe 403", chamar(main.enviar_capa, envio, token="aluno1")[0] == 403)
        conferir("id só com caracteres proibidos devolve 400", chamar(main.enviar_capa, {**envio, "id": "../.."})[0] == 400)
        conferir("SVG é recusado", chamar(main.enviar_capa, {**envio, "tipo": "image/svg+xml"})[0] == 400)
        conferir("imagem corrompida devolve 400", chamar(main.enviar_capa, {**envio, "imagem": "@@@"})[0] == 400)
        grande = base64.b64encode(b"x" * (4 * 1024 * 1024 + 1)).decode()
        conferir("imagem acima de 4 MB devolve 413", chamar(main.enviar_capa, {**envio, "imagem": grande})[0] == 413)

        status, resposta = chamar(main.enviar_capa, {**envio, "id": "Gestao-e-Negocios"})
        conferir("a capa do eixo é guardada", status == 200 and "capas/eixos/gestao-e-negocios.webp" in arquivos, resposta)
        conferir("o endereço volta com '?v=' para o navegador não mostrar a versão antiga", "?v=" in resposta["url"])
        conferir("o endereço fica em configuracoes/capas",
                 docs["configuracoes/capas"]["eixos"]["gestao-e-negocios"]["url"] == resposta["url"])

        status, resposta = chamar(main.enviar_capa, {"alvo": "curso", "id": "enfermagem", "tipo": "image/jpeg", "imagem": imagem})
        conferir("a capa de um curso é guardada e não mexe na lista de eixos",
                 status == 200 and "capas/cursos/enfermagem.jpg" in arquivos
                 and list(docs["configuracoes/capas"]["eixos"]) == ["gestao-e-negocios"])

        conferir("remover a capa de um curso por aqui devolve 400",
                 chamar(main.enviar_capa, {"alvo": "curso", "id": "enfermagem", "acao": "remover"})[0] == 400)
        status, _ = chamar(main.enviar_capa, {"alvo": "eixo", "id": "gestao-e-negocios", "acao": "remover"})
        conferir("remover a capa do eixo apaga o arquivo e o registro",
                 status == 200 and "capas/eixos/gestao-e-negocios.webp" not in arquivos
                 and docs["configuracoes/capas"]["eixos"] == {})
    finally:
        for s in simulacoes:
            s.stop()


# --------------------------------------------------------------------------
# Notícias
# --------------------------------------------------------------------------

def _feed(itens):
    """Um feed RSS com os itens dados: [(título, link, quando, resto em XML)].
    Começa com uma linha em branco, como o feed de verdade do CPS."""
    corpo = "".join(
        f"<item><title>{titulo}</title><link>{link}</link><pubDate>{format_datetime(quando)}</pubDate>{resto}</item>"
        for titulo, link, quando, resto in itens
    )
    return ('\n<?xml version="1.0" encoding="UTF-8"?><rss version="2.0" '
            'xmlns:content="http://purl.org/rss/1.0/modules/content/" '
            'xmlns:News="https://www.bing.com/news/search?q=teste&amp;format=rss"><channel><title>Feed</title>'
            f"{corpo}</channel></rss>").encode("utf-8")


def testar_noticias():
    print("notícias: organização do que vem dos feeds")
    agora = datetime.now(timezone.utc)

    conferir("o link perde o rastreio e a âncora",
             noticias.limpar_link("https://Site.com.br/a/?utm_source=x&id=7&fbclid=abc#topo") == "https://site.com.br/a/?id=7",
             noticias.limpar_link("https://Site.com.br/a/?utm_source=x&id=7&fbclid=abc#topo"))
    conferir("endereço que não é http(s) é recusado", noticias.limpar_link("javascript:alert(1)") == "")
    conferir("a mesma notícia por http, https ou com barra no fim tem o mesmo identificador",
             noticias.id_da_noticia("http://site.com.br/noticia/") == noticias.id_da_noticia("https://site.com.br/noticia"))
    conferir("links diferentes têm identificadores diferentes",
             noticias.id_da_noticia("https://site.com.br/a") != noticias.id_da_noticia("https://site.com.br/b"))
    conferir("Vestibulinho conta como Etec",
             noticias.etiquetas("Inscrições do Vestibulinho e das Fatecs") == ["etec", "fatec"])
    conferir("sem citar Etec nem Fatec, fica sem etiqueta", noticias.etiquetas("Centro Paula Souza é premiado") == [])
    conferir("palavra que só contém 'etec' não vira etiqueta", noticias.etiquetas("Feira de biotecnologia e mecatrônica") == [])
    conferir("capa da página escrita com aspas simples",
             noticias.imagem_da_pagina("<meta property='og:image' content='https://a.com/f.jpg'>") == "https://a.com/f.jpg")
    conferir("capa da página com os atributos em outra ordem",
             noticias.imagem_da_pagina('<meta content="https://a.com/g.jpg" property="og:image" />') == "https://a.com/g.jpg")
    conferir("imagem por http passa a https", noticias.imagem_https("http://a.com/f.jpg") == "https://a.com/f.jpg")
    conferir("imagem embutida (data:) é recusada", noticias.imagem_https("data:image/png;base64,AAAA") == "")
    cortado = noticias.limpar_texto("<p>" + "palavra " * 100 + "</p>", 400)
    conferir("resumo comprido é cortado numa palavra inteira, com reticências",
             len(cortado) <= 400 and cortado.endswith("palavra…"), cortado[-30:])

    recente, velha = agora - timedelta(hours=3), agora - timedelta(days=90)
    feeds = {
        "cps.sp.gov.br": _feed([
            ("Etec de Cubatão ganha prêmio", "https://www.cps.sp.gov.br/etec-cubatao-ganha-premio/?utm_source=feed", recente,
             "<description><![CDATA[<p>Projeto de bioplástico foi o vencedor.</p>]]></description><category>Etec</category>"
             '<content:encoded><![CDATA[<p><img src="http://www.cps.sp.gov.br/foto.jpg"></p>]]></content:encoded>'),
            ("Notícia de três meses atrás", "https://www.cps.sp.gov.br/antiga/", velha, ""),
            ("Centro Paula Souza divulga calendário", "https://www.cps.sp.gov.br/calendario/", recente, ""),
        ]),
        "tag/etec": _feed([
            # a mesma notícia do CPS, publicada também em outro site
            ("Etec de Cubatão ganha prêmio", "https://www.agenciasp.sp.gov.br/educacao/etec-cubatao/", recente, ""),
            ("Vestibulinho recebe inscrições", "https://www.agenciasp.sp.gov.br/educacao/vestibulinho/", recente, ""),
        ]),
        # um site fora do ar não pode derrubar os outros
        "tag/fatec": requests.HTTPError(response=type("Resposta", (), {"status_code": 500})()),
        # um dos buscadores recusa o servidor: o outro basta
        "bing.com": requests.HTTPError(response=type("Resposta", (), {"status_code": 503})()),
        "news.google.com": _feed([
            ("Fatec abre vagas em Sorocaba - G1", "https://news.google.com/rss/articles/ABC123?oc=5", recente,
             '<source url="https://g1.globo.com">G1</source>'
             '<description>&lt;a href="x"&gt;Fatec abre vagas em Sorocaba&lt;/a&gt;</description>'),
            ("Prefeitura anuncia obras no centro - Jornal da Cidade", "https://news.google.com/rss/articles/DEF456?oc=5", recente,
             '<source url="https://jornal.com">Jornal da Cidade</source>'),
            # a notícia do CPS contada por outro jornal, com o título um pouco diferente
            ("Etec de Cubatão ganha prêmio em feira estadual - Jornal da Baixada",
             "https://news.google.com/rss/articles/GHI789?oc=5", recente,
             '<source url="https://baixada.com">Jornal da Baixada</source>'),
            # "Fatec" de outro estado, que não é do Centro Paula Souza
            ("Fatec Ivaiporã abre inscrições - Jornal do Vale", "https://news.google.com/rss/articles/JKL012?oc=5", recente,
             '<source url="https://vale.com">Jornal do Vale</source>'),
        ]),
    }

    pedidos = []

    def baixar(endereco, sessao=None, limite=None, cabecalhos=None):
        pedidos.append((endereco, cabecalhos))
        for trecho, conteudo in feeds.items():
            if trecho in endereco:
                if isinstance(conteudo, Exception):
                    raise conteudo
                return conteudo
        raise AssertionError(f"endereço inesperado: {endereco}")

    with mock.patch.object(noticias, "_baixar", side_effect=baixar):
        coleta = noticias.coletar(agora=agora)

    titulos = [n["titulo"] for n in coleta["noticias"]]
    conferir("ficam 4 notícias: sem a antiga, as repetidas, a de outro assunto e a escola de outro estado",
             titulos == ["Etec de Cubatão ganha prêmio", "Centro Paula Souza divulga calendário",
                         "Vestibulinho recebe inscrições", "Fatec abre vagas em Sorocaba"], titulos)
    premio, calendario, _, fatec = coleta["noticias"]
    conferir("a notícia repetida em dois sites fica com a do mais oficial", premio["fonte"] == "Centro Paula Souza", premio["fonte"])
    conferir("o link é guardado sem o rastreio", premio["link"] == "https://www.cps.sp.gov.br/etec-cubatao-ganha-premio/", premio["link"])
    conferir("o resumo vem sem as tags", premio["resumo"] == "Projeto de bioplástico foi o vencedor.", premio["resumo"])
    conferir("a imagem do texto serve de reserva, já por https", premio["imagem"] == "https://www.cps.sp.gov.br/foto.jpg", premio["imagem"])
    conferir("etiqueta de Etec", premio["instituicoes"] == ["etec"], premio["instituicoes"])
    conferir("notícia geral do CPS fica sem etiqueta", calendario["instituicoes"] == [], calendario["instituicoes"])
    conferir("no Google Notícias o nome do site sai do título e vira a fonte",
             fatec["titulo"] == "Fatec abre vagas em Sorocaba" and fatec["fonte"] == "G1" and fatec["resumo"] == "", fatec)
    conferir("o link do Google fica sem o parâmetro de rastreio",
             fatec["link"] == "https://news.google.com/rss/articles/ABC123", fatec["link"])
    conferir("cada notícia guarda por qual feed chegou", (premio["feed"], fatec["feed"]) == ("cps", "imprensa"))

    palavras = noticias.palavras_do_titulo
    conferir("títulos de jornais diferentes sobre o mesmo fato contam como parecidos",
             noticias.titulo_parecido(palavras("alunos da etec lauro gomes sao premiados em simposio academico"),
                                      [palavras("etec lauro gomes conquista premio em simposio academico")]))
    conferir("prazo da Fatec e prazo da Etec não são a mesma notícia",
             not noticias.titulo_parecido(palavras("inscricoes para o vestibular das fatecs terminam nesta segunda feira"),
                                          [palavras("inscricoes para o vestibulinho das etecs terminam nesta terca feira")]))

    situacao = {f["id"]: f for f in coleta["fontes"]}
    conferir("o resumo conta as notícias de cada fonte",
             [situacao[i]["encontradas"] for i in ("cps", "agenciasp-etec", "imprensa")] == [2, 1, 1], coleta["fontes"])
    conferir("a fonte que falhou aparece com o motivo, e as outras seguem",
             situacao["agenciasp-fatec"]["erro"] == "o site respondeu com erro 500", situacao["agenciasp-fatec"])
    imprensa = situacao["imprensa"]
    conferir("com um buscador recusando o servidor, a imprensa vem pelo outro e não conta como falha",
             imprensa["erro"] is None and imprensa["nome"] == "Imprensa (Google Notícias)"
             and imprensa.get("semResposta") == ["Bing Notícias: o site respondeu com erro 503"], imprensa)
    conferir("os buscadores recebem a identificação no formato deles; os sites oficiais, a de sempre",
             all((cabecalhos is noticias.CABECALHOS_DE_BUSCADOR) == ("bing.com" in endereco or "news.google.com" in endereco)
                 for endereco, cabecalhos in pedidos), pedidos)

    # o contrário, que foi o que aconteceu no servidor de verdade: o Google recusa e o Bing responde
    recusa = requests.HTTPError(response=type("Resposta", (), {"status_code": 503})())
    feeds["news.google.com"] = recusa
    feeds["bing.com"] = _feed([
        ("Etec de Mogi vence olimpíada de robótica",
         "http://www.bing.com/news/apiclick.aspx?ref=FexRss&amp;aid=&amp;url=https%3a%2f%2fwww.jornal.com.br%2fetec-mogi-robotica%2f&amp;c=1&amp;mkt=pt-br",
         recente,
         "<description>Equipe da escola ficou em primeiro lugar na etapa estadual ...</description>"
         "<News:Source>Jornal de Mogi</News:Source><News:Image>http://www.bing.com/th?id=ON.1&amp;pid=News</News:Image>"),
        # só a descrição cita "e-Tec", que é outra rede: fica de fora
        ("Senar abre vagas em cursos técnicos",
         "http://www.bing.com/news/apiclick.aspx?url=https%3a%2f%2fwww.outro.com.br%2fsenar%2f", recente,
         "<description>Formações oferecidas pela Rede e-Tec do Senar.</description><News:Source>Outro</News:Source>"),
    ])
    with mock.patch.object(noticias, "_baixar", side_effect=baixar):
        pelo_bing = noticias.coletar(agora=agora)
    imprensa = [f for f in pelo_bing["fontes"] if f["id"] == "imprensa"][0]
    conferir("com o Google recusando, a imprensa vem pelo Bing, sem aparecer como falha",
             imprensa["erro"] is None and imprensa["nome"] == "Imprensa (Bing Notícias)" and imprensa["encontradas"] == 1
             and imprensa.get("semResposta") == ["Google Notícias: o site respondeu com erro 503"], imprensa)
    do_bing = pelo_bing["noticias"][-1]
    conferir("do Bing sai o link direto da notícia, não o endereço do buscador",
             do_bing["link"] == "https://www.jornal.com.br/etec-mogi-robotica/", do_bing["link"])
    conferir("do Bing vêm o nome do jornal e um resumo de verdade",
             do_bing["fonte"] == "Jornal de Mogi"
             and do_bing["resumo"] == "Equipe da escola ficou em primeiro lugar na etapa estadual…", do_bing)
    conferir("a notícia do Bing leva a etiqueta e o feed certos",
             (do_bing["instituicoes"], do_bing["feed"]) == (["etec"], "imprensa"), do_bing)
    conferir("o que só cita 'e-Tec' não entra", len(pelo_bing["noticias"]) == 4, [n["titulo"] for n in pelo_bing["noticias"]])

    feeds["bing.com"] = requests.Timeout()
    with mock.patch.object(noticias, "_baixar", side_effect=baixar):
        sem_imprensa = noticias.coletar(agora=agora)
    imprensa = [f for f in sem_imprensa["fontes"] if f["id"] == "imprensa"][0]
    conferir("com os dois buscadores fora, a imprensa aparece como falha, com o motivo de cada um",
             imprensa["nome"] == "Imprensa" and imprensa["erro"] == "Bing Notícias: o site demorou demais para responder; "
             "Google Notícias: o site respondeu com erro 503", imprensa)
    conferir("...e as notícias dos sites oficiais chegam do mesmo jeito", len(sem_imprensa["noticias"]) == 3)

    print("coletar_noticias")
    ids = [n["id"] for n in coleta["noticias"]]
    # mais uma da busca aberta, com o título quase igual ao de uma que já está na fila
    coleta["noticias"].append({**fatec, "id": "parecida-do-google", "titulo": "Vestibulinho recebe inscrições até sexta",
                               "chaveTitulo": "vestibulinho recebe inscricoes ate sexta",
                               "link": "https://news.google.com/rss/articles/MNO345"})
    docs = {
        "usuarios/admin1": {"admin": True},
        "usuarios/aluno1": {"admin": False},
        # recusada numa coleta anterior: não pode voltar para pendente
        f"noticias_fila/{ids[0]}": {"titulo": "Etec de Cubatão ganha prêmio", "status": "recusada",
                                    "chaveTitulo": "etec de cubatao ganha premio",
                                    "coletadaEm": noticias.em_iso(agora - timedelta(days=2))},
        # o mesmo título, coletado há 5 dias por outro link: barra a notícia
        "noticias_fila/outro-link": {"titulo": "Vestibulinho recebe inscrições", "status": "aprovada",
                                     "chaveTitulo": "vestibulinho recebe inscricoes",
                                     "coletadaEm": noticias.em_iso(agora - timedelta(days=5))},
        # título quase igual ao do calendário do CPS: como a nova vem de site oficial, entra mesmo assim
        "noticias_fila/parecida-com-oficial": {"titulo": "Centro Paula Souza divulga calendário escolar", "status": "pendente",
                                               "chaveTitulo": "centro paula souza divulga calendario escolar",
                                               "coletadaEm": noticias.em_iso(agora - timedelta(days=3))},
        # o mesmo título, mas de 40 dias atrás: já pode ser notícia nova
        "noticias_fila/bem-antiga": {"titulo": "Fatec abre vagas em Sorocaba", "status": "aprovada",
                                     "chaveTitulo": "fatec abre vagas em sorocaba",
                                     "coletadaEm": noticias.em_iso(agora - timedelta(days=40))},
    }

    def capas(novas, sessao=None):
        for noticia in novas:
            if "cps.sp.gov.br" in noticia["link"]:
                noticia["imagem"] = "https://www.cps.sp.gov.br/capa.jpg"

    simulacoes = [
        mock.patch.object(main.firestore, "client", return_value=Banco(docs)),
        mock.patch.object(main.firebase_auth, "verify_id_token", side_effect=lambda token: {"uid": token}),
        mock.patch.object(noticias, "coletar", side_effect=lambda: copy.deepcopy(coleta)),
        mock.patch.object(noticias, "completar_imagens", side_effect=capas),
    ]
    for s in simulacoes:
        s.start()
    try:
        conferir("sem login devolve 401", chamar(main.coletar_noticias, {}, token=None)[0] == 401)
        conferir("quem não é admin recebe 403", chamar(main.coletar_noticias, {}, token="aluno1")[0] == 403)
        conferir("nada foi gravado pelas chamadas recusadas", "noticias_coleta/ultima" not in docs)

        status, resumo = chamar(main.coletar_noticias, {})
        conferir("a coleta responde 200", status == 200, resumo)
        conferir("2 novas e 3 repetidas", (resumo["novas"], resumo["repetidas"]) == (2, 3), resumo)
        conferir("o resumo diz que veio do botão do painel e traz as 4 fontes",
                 resumo["origem"] == "painel" and len(resumo["fontes"]) == 4, resumo)

        conferir("a recusada continua recusada", docs[f"noticias_fila/{ids[0]}"]["status"] == "recusada")
        conferir("título igual coletado há pouco não entra de novo", f"noticias_fila/{ids[2]}" not in docs)
        conferir("da busca aberta, título quase igual a um da fila também não entra",
                 "noticias_fila/parecida-do-google" not in docs)
        conferir("de site oficial, título parecido com um da fila entra do mesmo jeito",
                 docs.get(f"noticias_fila/{ids[1]}", {}).get("feed") == "cps")
        nova = docs.get(f"noticias_fila/{ids[1]}", {})
        conferir("a notícia nova entra como pendente, com a data da coleta",
                 nova.get("status") == "pendente" and nova.get("coletadaEm") == resumo["coletadaEm"], nova)
        conferir("a nova ganha a capa da página", nova.get("imagem") == "https://www.cps.sp.gov.br/capa.jpg", nova.get("imagem"))
        conferir("o identificador é o nome do documento, não um campo", "id" not in nova)
        conferir("título igual a um de 40 dias atrás entra como notícia nova",
                 docs.get(f"noticias_fila/{ids[3]}", {}).get("status") == "pendente")
        conferir("o resumo fica guardado para o painel", docs["noticias_coleta/ultima"]["novas"] == 2)

        status, de_novo = chamar(main.coletar_noticias, {})
        conferir("buscar de novo não duplica nada", status == 200 and (de_novo["novas"], de_novo["repetidas"]) == (0, 5), de_novo)

        # aprovada pelo painel entre uma coleta e outra: a coleta não mexe nela
        docs[f"noticias_fila/{ids[1]}"]["status"] = "aprovada"
        main.coletar_noticias_agendada.__wrapped__(None)
        conferir("a busca agendada grava o resumo dela", docs["noticias_coleta/ultima"]["origem"] == "agendada")
        conferir("a aprovada continua aprovada depois da busca agendada", docs[f"noticias_fila/{ids[1]}"]["status"] == "aprovada")
    finally:
        for s in simulacoes:
            s.stop()


# --------------------------------------------------------------------------
# Comunidade: histórico e avisos dos comentários e dúvidas das instituições
# --------------------------------------------------------------------------

class Retrato:
    """O DocumentSnapshot que o evento do Firestore entrega (antes/depois)."""

    def __init__(self, dados):
        self.dados, self.exists = dados, dados is not None

    def to_dict(self):
        return copy.deepcopy(self.dados)


def evento(id_evento, colecao, item, antes, depois, uid="", tipo="unknown"):
    chave = "comentarioId" if colecao == "comentarios" else "perguntaId"
    return SimpleNamespace(
        id=id_evento,
        params={"unidadeId": "u1", chave: item},
        data=SimpleNamespace(before=Retrato(antes) if antes is not None else None,
                             after=Retrato(depois) if depois is not None else None),
        auth_type=tipo, auth_id=uid)


def testar_comunidade():
    print("histórico e avisos da comunidade (comentários e dúvidas)")
    agora = datetime(2026, 11, 18, 14, 32, tzinfo=timezone.utc)
    docs = {
        "instituicoes/u1": {"nome": "Etec Jorge Street"},
        "usuarios/aluno1": {"nome": "Marina Souza"},
        "usuarios/aluno2": {"nome": "João Pedro Lima"},
        "usuarios/aluno3": {"nome": "Duda Martins"},
        "usuarios/admin1": {"nome": "Ana", "admin": True},
        "usuarios/admin2": {"nome": "Rui", "admin": True},
        "fcm_tokens/tok-admin1": {"uid": "admin1"},
        "fcm_tokens/tok-admin2": {"uid": "admin2"},
        "fcm_tokens/tok-aluno1": {"uid": "aluno1"},
        "fcm_tokens/tok-visitante": {"uid": None},
    }
    pushes = []

    def enviar(mensagem):
        pushes.append({"tokens": sorted(mensagem.tokens), **mensagem.data})
        return SimpleNamespace(responses=[SimpleNamespace(success=True, exception=None) for _ in mensagem.tokens])

    def conta(uid):
        if uid in ("admin1", "admin2"):
            return SimpleNamespace(email=f"{uid}@exemplo.com")
        raise firebase_admin.auth.UserNotFoundError("não existe")

    simulacoes = [
        mock.patch.object(main.firestore, "client", return_value=Banco(docs)),
        mock.patch.object(main.messaging, "send_each_for_multicast", side_effect=enviar),
        mock.patch.object(comunidade.firebase_auth, "get_user", side_effect=conta),
    ]
    for s in simulacoes:
        s.start()
    comentarios = main.historico_dos_comentarios.__wrapped__
    duvidas = main.historico_das_duvidas.__wrapped__
    historico = lambda id_evento: docs.get(f"comunidade_historico/{id_evento}", {})  # noqa: E731
    try:
        comentario = {"texto": "Professores muito atenciosos.", "nota": 5, "nome": "Marina Souza",
                      "curso": "Desenvolvimento de Sistemas", "ano": 2024, "certificadoId": "c1",
                      "uid": "aluno1", "criadoEm": agora}
        comentarios(evento("e1", "comentarios", "aluno1_c1", None, comentario, uid="aluno1"))
        novo = historico("e1-0")
        conferir("comentário novo vira registro com quem fez, nota, curso e unidade",
                 (novo.get("acao"), novo.get("nome"), novo.get("nota"), novo.get("curso"), novo.get("unidadeNome"))
                 == ("comentou", "Marina Souza", 5, "Desenvolvimento de Sistemas", "Etec Jorge Street"), novo)
        conferir("de quem não é admin o histórico não guarda e-mail", "email" not in novo and novo.get("admin") is False, novo)
        conferir("a hora do registro é a do servidor", novo.get("em") is main.firestore.SERVER_TIMESTAMP)
        aviso = docs.get("avisos_admin/avaliacao_u1_aluno1_c1", {})
        conferir("a avaliação nova vira aviso com link para a parte certa da página",
                 aviso.get("tipo") == "avaliacao" and aviso.get("link") == "instituicao.html?u=u1#quem-estudou"
                 and aviso.get("apagada") is False, aviso)
        conferir("o push vai só para os aparelhos dos admins", len(pushes) == 1
                 and pushes[0]["tokens"] == ["tok-admin1", "tok-admin2"], pushes)
        conferir("título e texto do push da avaliação",
                 pushes[0]["titulo"] == "Nova avaliação na Etec Jorge Street"
                 and pushes[0]["mensagem"].startswith("★★★★★ Marina Souza · Desenvolvimento de Sistemas: “Professores")
                 and pushes[0]["link"] == "instituicao.html?u=u1#quem-estudou", pushes[0])

        comentarios(evento("e1", "comentarios", "aluno1_c1", None, comentario, uid="aluno1"))
        conferir("o mesmo evento entregue duas vezes não repete o registro",
                 sum(c.startswith("comunidade_historico/e1") for c in docs) == 1)

        editado = {**comentario, "texto": "Professores atenciosos, mas faltou laboratório.", "nota": 4, "editadoEm": agora}
        comentarios(evento("e2", "comentarios", "aluno1_c1", comentario, editado, uid="aluno1"))
        edicao = historico("e2-0")
        conferir("edição guarda o texto e a nota de antes",
                 (edicao.get("acao"), edicao.get("notaAntes"), edicao.get("nota"), edicao.get("textoAntes"))
                 == ("editou_comentario", 5, 4, "Professores muito atenciosos."), edicao)
        conferir("o aviso acompanha a edição", docs["avisos_admin/avaliacao_u1_aluno1_c1"].get("nota") == 4
                 and docs["avisos_admin/avaliacao_u1_aluno1_c1"].get("editada") is True)
        comentarios(evento("e3", "comentarios", "aluno1_c1", editado, {**editado, "editadoEm": agora}, uid="aluno1"))
        conferir("salvar sem mudar texto nem nota não vira registro", "comunidade_historico/e3-0" not in docs)

        comentarios(evento("e4", "comentarios", "aluno1_c1", editado, None, uid="admin1"))
        apagado = historico("e4-0")
        conferir("comentário apagado por admin guarda o conteúdo, o e-mail e que não foi o autor",
                 (apagado.get("acao"), apagado.get("texto"), apagado.get("nota"), apagado.get("email"),
                  apagado.get("admin"), apagado.get("propria"), apagado.get("autorNome"))
                 == ("apagou_comentario", editado["texto"], 4, "admin1@exemplo.com", True, False, "Marina Souza"), apagado)
        conferir("o aviso fica marcado como apagado", docs["avisos_admin/avaliacao_u1_aluno1_c1"]["apagada"] is True)

        antigo = {"texto": "Comentário de antes da conta por certificado.", "nota": 3, "nome": "Duda Martins",
                  "curso": "Administração", "ano": 2021, "criadoEm": agora}
        comentarios(evento("e5", "comentarios", "aluno3", antigo, None, uid="aluno3"))
        proprio = historico("e5-0")
        conferir("comentário antigo (id = uid) apagado pelo autor conta como próprio",
                 proprio.get("autorUid") == "aluno3" and proprio.get("propria") is True
                 and proprio.get("nome") == "Duda Martins", proprio)

        comentarios(evento("e6", "comentarios", "aluno2_c9", {**antigo, "uid": "aluno2"}, None,
                           uid="firebase-adminsdk@projeto.iam.gserviceaccount.com", tipo="service_account"))
        conferir("apagado pelo Console ou pelo servidor aparece como Sistema",
                 historico("e6-0").get("nome") == "Sistema" and historico("e6-0").get("sistema") is True)

        pushes.clear()
        do_admin = {**comentario, "uid": "admin1", "nome": "Ana", "certificadoId": "c2"}
        comentarios(evento("e7", "comentarios", "admin1_c2", None, do_admin, uid="admin1"))
        conferir("quem é admin e comenta não recebe push do próprio comentário",
                 len(pushes) == 1 and pushes[0]["tokens"] == ["tok-admin2"], pushes)

        pushes.clear()
        pergunta = {"texto": "Precisa fazer prova para entrar?", "autorUid": "aluno2", "nome": "João Pedro Lima",
                    "criadaEm": agora, "respostas": {}}
        duvidas(evento("e8", "perguntas", "p1", None, pergunta, uid="aluno2"))
        conferir("dúvida nova vira registro", historico("e8-0").get("acao") == "perguntou"
                 and historico("e8-0").get("autorNome") == "João Pedro Lima")
        aviso = docs.get("avisos_admin/duvida_u1_p1", {})
        conferir("e aviso sem resposta, com link para as dúvidas",
                 aviso.get("respostas") == 0 and aviso.get("link") == "instituicao.html?u=u1#duvidas", aviso)
        conferir("push da dúvida", len(pushes) == 1 and pushes[0]["titulo"] == "Nova dúvida sobre a Etec Jorge Street"
                 and pushes[0]["mensagem"] == "João Pedro Lima: “Precisa fazer prova para entrar?”", pushes)

        respondida = {**pergunta, "respostas": {
            "admin1": {"texto": "Sim, pelo Vestibulinho.", "nome": "Ana", "equipe": True, "em": agora},
            "aluno3": {"texto": "Acho que não precisa.", "nome": "Duda Martins", "curso": "Enfermagem",
                       "ano": 2023, "certificadoId": "c5", "equipe": False, "em": agora - timedelta(minutes=5)},
        }}
        duvidas(evento("e9", "perguntas", "p1", pergunta, respondida, uid="admin1"))
        resposta = historico("e9-0")
        conferir("resposta da equipe vira registro com o e-mail do admin e a pergunta junto",
                 (resposta.get("acao"), resposta.get("equipe"), resposta.get("email"), resposta.get("perguntaTexto"))
                 == ("respondeu", True, "admin1@exemplo.com", "Precisa fazer prova para entrar?"), resposta)
        conferir("as respostas aparecem no aviso", docs["avisos_admin/duvida_u1_p1"]["respostas"] == 2)

        sem_a_duda = {**respondida, "respostas": {"admin1": respondida["respostas"]["admin1"]}}
        duvidas(evento("e10", "perguntas", "p1", respondida, sem_a_duda, uid="aluno3"))
        conferir("quem apaga a própria resposta", historico("e10-0").get("acao") == "apagou_resposta"
                 and historico("e10-0").get("propria") is True and historico("e10-0").get("texto") == "Acho que não precisa.")

        duvidas(evento("e11", "perguntas", "p1", respondida, None, uid="admin2"))
        apagada = historico("e11-0")
        conferir("dúvida apagada guarda as respostas que sumiram junto, da mais antiga para a mais nova",
                 apagada.get("acao") == "apagou_duvida" and [r["autorNome"] for r in apagada.get("respostasApagadas", [])]
                 == ["Duda Martins", "Ana"] and apagada.get("email") == "admin2@exemplo.com", apagada)
        conferir("e o aviso da dúvida fica marcado como apagado", docs["avisos_admin/duvida_u1_p1"]["apagada"] is True)

        conferir("outra escola: 'em' e 'sobre' sem artigo",
                 comunidade.na_unidade("Instituto Federal de SP") == "em Instituto Federal de SP"
                 and comunidade.sobre_a_unidade("Fatec Carapicuíba") == "sobre a Fatec Carapicuíba")
        conferir("o link do push aceita a parte da página, mas nada além de letras e hífen",
                 main._link_seguro_da_notificacao("instituicao.html?u=u1#duvidas") == "instituicao.html?u=u1#duvidas"
                 and main._link_seguro_da_notificacao("instituicao.html#<script>") == ""
                 and main._link_seguro_da_notificacao("javascript:alert(1)") == "")
    finally:
        for s in simulacoes:
            s.stop()


if __name__ == "__main__":
    testar_nomes()
    testar_demanda()
    testar_capas()
    testar_noticias()
    testar_comunidade()
    print("TUDO CERTO")
