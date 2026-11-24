"""Testa as páginas de curso e de instituição já preenchidas
(functions/paginas_prontas.py e a função pagina_pronta do main.py), sem
tocar no Firebase nem no site: o Firestore e o download do modelo são
simulados. Os modelos são os HTML de verdade do site (o do build, se já
houver um, ou o do código).

Como rodar, da pasta do projeto:

    functions/venv/Scripts/python.exe functions/testes/testar_paginas_prontas.py

Termina com "TUDO CERTO" ou lista o que falhou.
"""
import json
import re
import sys
from pathlib import Path
from unittest import mock

sys.stdout.reconfigure(encoding="utf-8")
PASTA_FUNCOES = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PASTA_FUNCOES))

import paginas_prontas as pp  # noqa: E402

WEBAPP = PASTA_FUNCOES.parent / "webApp"
falhas = []


def conferir(condicao, descricao):
    if not condicao:
        falhas.append(descricao)


def modelo(nome):
    for caminho in (WEBAPP / "dist" / "modelos" / nome, WEBAPP / "dist" / nome, WEBAPP / nome):
        if caminho.exists():
            return caminho.read_text(encoding="utf-8")
    raise FileNotFoundError(nome)


def meta(pagina, atributo, valor):
    achado = re.search(rf'<meta {atributo}="{re.escape(valor)}" content="([^"]*)">', pagina)
    return achado.group(1) if achado else None


def dados_estruturados(pagina):
    achado = re.search(r'<script type="application/ld\+json" id="dados-estruturados-pagina">(.*?)</script>', pagina, re.S)
    return json.loads(achado.group(1)) if achado else None


MODELO_CURSO = modelo("curso.html")
MODELO_INSTITUICAO = modelo("instituicao.html")

# ---- nomes e endereços: iguais aos do JavaScript do site ----
conferir(pp.normalizar("  Açúcar e Álcool!! ") == "acucar e alcool", "normalizar diferente do site")
conferir(pp.slugificar("Desenvolvimento de Sistemas") == "desenvolvimento-de-sistemas", "slug do curso diferente do site")
conferir(pp.slug_do_curso_na_unidade("Logística", "Fatec") == "superior-logistica", "curso de Fatec sem o 'superior-'")
conferir(pp.slug_do_curso_na_unidade("Logística", "Etec") == "logistica", "curso de Etec com 'superior-'")
conferir(pp.slug_do_curso_na_unidade("Logística", "") == "logistica", "curso sem tipo de unidade virou superior")

# ---- curso técnico ----
UNIDADES = [
    {"id": "002", "nome": "Etec Zona Leste", "tipo": "Etec", "municipio": "São Paulo", "cursos": ["Desenvolvimento de Sistemas"]},
    {"id": "001", "nome": "Etec Americana", "tipo": "Etec", "municipio": "Americana", "cursos": ["desenvolvimento  de sistemas!"]},
    {"id": "F01", "nome": "Fatec São Paulo", "tipo": "Fatec", "municipio": "São Paulo", "cursos": ["Desenvolvimento de Sistemas"]},
    {"id": "003", "nome": "Etec Química", "tipo": "Etec", "municipio": "Santos", "cursos": ["Química"]},
]
CURSO = {
    "nome": "Desenvolvimento de Sistemas",
    "modalidades": ["Presencial", "Médio-Técnico"],
    "eixos": ["Informação e Comunicação"],
    "duracao": "3 semestres",
    "cargaHoraria": 1200,
    "descricao": "Aprende a programar, modelar bancos de dados e criar sistemas web e para celular. " * 3,
    "atuacao": "Desenvolve e mantém sistemas.",
    "ondeTrabalhar": "Empresas de software.",
}
pagina = pp.pagina_do_curso(MODELO_CURSO, CURSO, "desenvolvimento-de-sistemas", UNIDADES)
conferir(pagina is not None, "a página do curso não foi montada")
if pagina:
    conferir("<title>Desenvolvimento de Sistemas — Curso Técnico (Etec) | Futuro+</title>" in pagina, "título do curso errado")
    conferir(pagina.count("<title>") == 1, "a página ficou com dois títulos")
    descricao = meta(pagina, "name", "description") or ""
    conferir(descricao.startswith("Aprende a programar") and len(descricao) <= pp.LIMITE_DESCRICAO and descricao.endswith("…"),
             f"descrição do curso errada: {descricao!r}")
    conferir(pagina.count('name="description"') == 1, "a página ficou com duas descrições")
    conferir('<link rel="canonical" href="https://futuroplus.com.br/curso.html?c=desenvolvimento-de-sistemas">' in pagina,
             "endereço canônico do curso errado")
    conferir(meta(pagina, "property", "og:title") == "Desenvolvimento de Sistemas — Curso Técnico (Etec) | Futuro+",
             "prévia de link (og:title) errada")
    dados = dados_estruturados(pagina) or {}
    conferir(dados.get("@type") == "Course" and dados.get("educationalLevel") == "Técnico", "dados estruturados do curso errados")
    conferir("Carregando curso" not in pagina, "o 'Carregando curso...' continuou na página")
    conferir("<h1>Desenvolvimento de Sistemas</h1>" in pagina, "o nome do curso não está no HTML")
    conferir("O que você aprende" in pagina and "3 semestres" in pagina and "1.200 horas" in pagina,
             "faltou texto, duração ou carga horária")
    conferir('href="instituicao.html?u=001"' in pagina and 'href="instituicao.html?u=002"' in pagina,
             "faltou unidade que oferece o curso")
    conferir("F01" not in pagina, "curso técnico listou uma Fatec")
    conferir("Etec Química" not in pagina, "listou unidade que não oferece o curso")
    conferir(pagina.index("Etec Americana") < pagina.index("Etec Zona Leste"), "unidades fora da ordem de nome")
    conferir('<script type="module"' in pagina, "a página perdeu o JavaScript do site")

# mais de 8 unidades: as 8 primeiras e o "Ver as outras"
muitas = [{"id": f"{i:03d}", "nome": f"Etec {i:02d}", "tipo": "Etec", "municipio": "X", "cursos": ["Química"]} for i in range(11)]
pagina = pp.pagina_do_curso(MODELO_CURSO, {"nome": "Química"}, "quimica", muitas) or ""
conferir(pagina.count('class="curso-unidade-nome"') == 8 and "Ver as outras 3 unidades" in pagina,
         "lista de unidades não parou em 8 com o 'Ver as outras'")
conferir('id="dados-estruturados-pagina"' in pagina and "veja onde cursar" in (meta(pagina, "name", "description") or ""),
         "curso sem descrição ficou sem a frase padrão")

# curso superior: só Fatec
SUPERIOR = {"nome": "Desenvolvimento de Sistemas", "nivel": "superior", "descricao": "Curso da Fatec."}
pagina = pp.pagina_do_curso(MODELO_CURSO, SUPERIOR, "superior-desenvolvimento-de-sistemas", UNIDADES) or ""
conferir("Curso Superior de Tecnologia (Fatec) | Futuro+" in pagina, "título do curso superior errado")
conferir('href="instituicao.html?u=F01"' in pagina and "Etec Zona Leste" not in pagina, "curso superior listou Etec")

# texto perigoso vindo do cadastro não vira HTML nem fecha o <script>
PERIGOSO = {"nome": "Curso <script>alert(1)</script>", "descricao": 'Texto </script><script>alert(2)</script> "aspas"'}
pagina = pp.pagina_do_curso(MODELO_CURSO, PERIGOSO, "x", []) or ""
conferir("<script>alert" not in pagina, "texto do cadastro entrou como HTML na página")
conferir(dados_estruturados(pagina) is not None, "os dados estruturados quebraram com '</script>' no texto")

# modelo sem o lugar de encaixe: nada pronto, a função entrega o modelo
conferir(pp.pagina_do_curso("<html><head><title>x</title></head><body></body></html>", CURSO, "x", []) is None,
         "montou página num modelo sem o 'Carregando...'")
conferir(pp.pagina_do_curso(MODELO_CURSO, {"nome": "  "}, "x", []) is None, "montou página de curso sem nome")

# ---- instituição ----
UNIDADE = {
    "nome": "Etec Jorge Street",
    "tipo": "Etec",
    "municipio": "São Caetano do Sul",
    "endereco": "Rua Bell Aliance, 149 -  Jardim São Caetano",
    "historico": "Fundada em 1946",
    "foto": "https://www.cps.sp.gov.br/fachada.jpg",
    "localizacao": {"lat": -23.6, "lng": -46.5},
    "cursos": [{"nome": "Química", "categoria": "Técnico"}, {"nome": "química"}, {"nome": "Mecânica"}],
}
pagina = pp.pagina_da_instituicao(MODELO_INSTITUICAO, UNIDADE, "078")
conferir(pagina is not None, "a página da instituição não foi montada")
if pagina:
    conferir("<title>Etec Jorge Street: cursos, endereço e avaliações | Futuro+</title>" in pagina, "título da instituição errado")
    conferir('<link rel="canonical" href="https://futuroplus.com.br/instituicao.html?u=078">' in pagina,
             "endereço canônico da instituição errado")
    conferir(meta(pagina, "property", "og:image") == "https://www.cps.sp.gov.br/fachada.jpg", "a prévia não usou a foto da fachada")
    dados = dados_estruturados(pagina) or {}
    conferir(dados.get("@type") == "School" and dados.get("geo", {}).get("latitude") == -23.6
             and dados.get("address", {}).get("addressLocality") == "São Caetano do Sul",
             "dados estruturados da instituição errados")
    conferir('id="inst-carregando"' in pagina and "Carregando instituição" not in pagina,
             "o bloco pronto perdeu o id que o JavaScript esconde (ou o 'Carregando' ficou)")
    conferir("<h1>Etec Jorge Street</h1>" in pagina and "Rua Bell Aliance, 149 - Jardim São Caetano" in pagina,
             "faltou nome ou endereço")
    conferir("A Etec Jorge Street é uma escola técnica estadual" in pagina and "Fundada em 1946." in pagina
             and "Hoje oferece 2 cursos." in pagina, "texto 'Sobre a instituição' errado")
    conferir('href="curso.html?c=quimica"' in pagina and 'href="curso.html?c=mecanica"' in pagina
             and pagina.count('href="curso.html?c=quimica"') == 1, "lista de cursos da instituição errada (ou repetida)")

fatec = pp.pagina_da_instituicao(MODELO_INSTITUICAO, {"nome": "Fatec Zona Sul", "tipo": "Fatec", "foto": "http://inseguro/x.jpg",
                                                      "cursos": [{"nome": "Logística"}]}, "F02") or ""
conferir('href="curso.html?c=superior-logistica"' in fatec, "curso de Fatec sem a página 'superior-'")
conferir((dados_estruturados(fatec) or {}).get("@type") == "CollegeOrUniversity", "Fatec não virou CollegeOrUniversity")
conferir(meta(fatec, "property", "og:image") == pp.IMAGEM_PADRAO, "usou foto sem https na prévia")

# ---- a função pagina_pronta (main.py) ----
try:
    import firebase_admin
    import flask
    with mock.patch.object(firebase_admin, "initialize_app"):
        import main
except Exception as erro:  # noqa: BLE001
    falhas.append(f"não deu para importar main.py: {erro}")
else:
    class Documento:
        def __init__(self, id_doc, dados):
            self.id, self._dados = id_doc, dados

        @property
        def exists(self):
            return self._dados is not None

        def to_dict(self):
            return dict(self._dados) if self._dados is not None else None

    class Colecao:
        def __init__(self, documentos):
            self.documentos = documentos

        def document(self, id_doc):
            return mock.Mock(get=lambda: Documento(id_doc, self.documentos.get(id_doc)))

        def select(self, _campos):
            return self

        def stream(self):
            return [Documento(i, d) for i, d in self.documentos.items()]

    class Banco:
        leituras_de_unidades = 0

        def __init__(self):
            self.colecoes = {
                "cursos": {"desenvolvimento-de-sistemas": CURSO},
                "instituicoes": {u["id"]: {**u, "cursos": [{"nome": c} for c in u["cursos"]]} for u in UNIDADES} | {"078": UNIDADE},
            }

        def collection(self, nome):
            if nome == "instituicoes":
                Banco.leituras_de_unidades += 1
            return Colecao(self.colecoes.get(nome, {}))

    pedidos = []

    def baixar(url, timeout=None):
        pedidos.append(url)
        if url.endswith("/modelos/curso.html"):
            return mock.Mock(status_code=200, text=MODELO_CURSO)
        if url.endswith("/modelos/instituicao.html"):
            return mock.Mock(status_code=200, text=MODELO_INSTITUICAO)
        if url.endswith("/dados/catalogo-cursos.json"):
            return mock.Mock(status_code=200, text=json.dumps([{"slug": "agrimensura", "nome": "Agrimensura", "descricao": "Mede terrenos."}]))
        return mock.Mock(status_code=404, text="")

    def abrir(endereco, host="futuroplus.com.br"):
        with flask.Flask("teste").test_request_context(endereco, headers={"X-Forwarded-Host": host}):
            resposta = main.pagina_pronta(flask.request)
        return resposta.status_code, resposta.headers.get("Cache-Control", ""), resposta.get_data(as_text=True)

    banco = Banco()
    main._CACHE_PAGINAS.clear()
    with mock.patch.object(main.firestore, "client", return_value=banco), mock.patch.object(main.requests, "get", side_effect=baixar):
        status, cache, corpo = abrir("/curso.html?c=desenvolvimento-de-sistemas")
        conferir(status == 200 and "<h1>Desenvolvimento de Sistemas</h1>" in corpo, "a função não devolveu o curso pronto")
        conferir("s-maxage=21600" in cache, "página pronta sem o cache da rede")
        conferir(pedidos[0] == "https://futuroplus.com.br/modelos/curso.html", "buscou o modelo no lugar errado")

        abrir("/curso.html?c=desenvolvimento-de-sistemas")
        conferir(Banco.leituras_de_unidades == 1, "leu todas as unidades de novo a cada página (devia guardar por 1h)")

        status, _, corpo = abrir("/curso.html?c=Agrimensura")
        conferir(status == 200 and "<h1>Agrimensura</h1>" in corpo, "curso só do catálogo oficial não foi montado")

        status, cache, corpo = abrir("/curso.html?c=nao-existe")
        conferir(status == 404 and "Carregando curso" in corpo and "s-maxage=60" in cache,
                 "curso que não existe devia dar 404 com a página normal e cache curto")

        status, _, corpo = abrir("/curso.html")
        conferir(status == 200 and "Carregando curso" in corpo, "sem ?c= devia entregar a página normal")

        status, _, corpo = abrir("/instituicao.html?u=078")
        conferir(status == 200 and "<h1>Etec Jorge Street</h1>" in corpo, "a função não devolveu a instituição pronta")

        status, _, _ = abrir("/instituicao.html?u=nao-existe")
        conferir(status == 404, "instituição que não existe devia dar 404")

        pedidos.clear()
        abrir("/curso.html?c=desenvolvimento-de-sistemas", host="site-de-fora.com")
        conferir(pedidos and pedidos[0].startswith("https://futuroplus.com.br/"), "buscou o modelo num site de fora")

    # Firestore fora do ar: entrega a página normal, que o JavaScript monta como antes
    def banco_quebrado():
        raise RuntimeError("Firestore fora do ar")

    main._CACHE_PAGINAS.clear()
    with mock.patch.object(main.firestore, "client", side_effect=banco_quebrado), mock.patch.object(main.requests, "get", side_effect=baixar):
        status, cache, corpo = abrir("/curso.html?c=desenvolvimento-de-sistemas")
        conferir(status == 200 and "Carregando curso" in corpo and "s-maxage=60" in cache,
                 "com o Firestore fora do ar devia entregar a página normal, com cache curto")

    # modelo fora do ar: aviso que tenta de novo, sem cache
    with mock.patch.object(main.requests, "get", return_value=mock.Mock(status_code=500, text="")):
        status, cache, corpo = abrir("/curso.html?c=desenvolvimento-de-sistemas")
        conferir(status == 503 and cache == "no-store" and 'http-equiv="refresh"' in corpo,
                 "sem o modelo devia dar 503 com o aviso que recarrega")

if falhas:
    print(f"{len(falhas)} problema(s):")
    for falha in falhas:
        print(" -", falha)
    sys.exit(1)
print("TUDO CERTO")
