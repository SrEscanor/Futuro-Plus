"""Testa as funções coletar_demanda e enviar_capa sem tocar no Firebase nem nos
sites do vestibular: Firestore, Auth, Storage e a coleta são simulados.

Como rodar, da pasta do projeto:

    functions/venv/Scripts/python.exe functions/testes/testar_funcoes.py

Termina com "TUDO CERTO" ou para no primeiro teste que falhar.

Para conferir a coleta de verdade (acessa os sites, não grava nada):

    functions/venv/Scripts/python.exe functions/demanda.py etec 20261 --limite 8
"""
import base64
import json
import sys
from pathlib import Path
from unittest import mock

sys.stdout.reconfigure(encoding="utf-8")
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import firebase_admin  # noqa: E402

with mock.patch.object(firebase_admin, "initialize_app"):
    import main  # noqa: E402
import demanda  # noqa: E402
import flask  # noqa: E402

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


class Lote:
    def __init__(self, banco):
        self.banco, self.pendentes = banco, []

    def set(self, ref, dados, merge=False):
        self.pendentes.append((ref, dados, merge))

    def commit(self):
        assert len(self.pendentes) <= 500, "o Firestore aceita no máximo 500 escritas por lote"
        for ref, dados, merge in self.pendentes:
            ref.set(dados, merge=merge)


class Banco:
    def __init__(self, dados):
        self.dados = dados

    def collection(self, nome):
        return Colecao(self.dados, nome)

    def batch(self):
        return Lote(self.dados)


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


if __name__ == "__main__":
    testar_nomes()
    testar_demanda()
    testar_capas()
    print("TUDO CERTO")
