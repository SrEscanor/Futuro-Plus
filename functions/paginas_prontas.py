"""Páginas de curso e de instituição já preenchidas, para o Google e para a
prévia de link no WhatsApp e nas redes.

O site monta curso.html e instituicao.html no navegador: o HTML que chega
traz só o título genérico e "Carregando...", e o conteúdo vem do Firestore
pelo JavaScript. O Google roda JavaScript numa segunda etapa, mais tarde, e
nem sempre espera os dados chegarem. A função pagina_pronta (main.py) pega o
mesmo HTML do site (o build guarda uma cópia em dist/modelos/, ver
webApp/scripts/separar-modelos.cjs) e devolve com o título, a descrição, o
endereço canônico, a prévia de link (Open Graph), os dados estruturados e o
texto principal já dentro da página. O JavaScript continua igual: quando os
dados chegam, ele redesenha a página por cima, com o resto (demanda, matriz,
distância, comentários...).

Aqui só há funções puras, sem Firebase: recebem o HTML-modelo e os dados e
devolvem o HTML pronto (ou None, se o modelo não tiver os pontos de encaixe;
aí a função entrega o modelo como está). Testes em
functions/testes/testar_paginas_prontas.py.
"""
import html
import json
import re
import unicodedata
from urllib.parse import quote

SITE = "https://futuroplus.com.br"
IMAGEM_PADRAO = f"{SITE}/og-banner.jpg"
# quantas unidades a página do curso lista antes do "Ver as outras" (igual a curso-detalhe.js)
MAXIMO_UNIDADES = 8
LIMITE_DESCRICAO = 155

# o "Carregando..." de cada página, onde entra o conteúdo pronto
_ESPERA_CURSO = re.compile(r'<p class="carregando-cursos">[^<]*</p>')
_ESPERA_INSTITUICAO = re.compile(r'<p class="inst-carregando" id="inst-carregando">[^<]*</p>')


def normalizar(texto) -> str:
    """Igual ao normalizar() do site (card-unidade.js): minúsculas, sem acento
    e só letras e números separados por um espaço."""
    decomposto = unicodedata.normalize("NFD", str(texto or "").lower())
    sem_acento = "".join(c for c in decomposto if not unicodedata.combining(c))
    return re.sub(r"[^a-z0-9]+", " ", sem_acento).strip()


def slugificar(texto) -> str:
    """Igual ao slugificar() de curso-detalhe.js: o id do curso no Firestore."""
    return normalizar(texto).replace(" ", "-")


def slug_do_curso_na_unidade(nome, tipo) -> str:
    """Igual ao paginaDoCurso() de card-unidade.js: curso de Fatec (ou de
    outro tipo que não Etec) tem a página "superior-...", porque o mesmo nome
    pode existir como técnico e como superior."""
    t = str(tipo or "").strip().lower()
    base = slugificar(nome)
    return f"superior-{base}" if t and t != "etec" else base


def _e(texto) -> str:
    return html.escape(str(texto or ""), quote=True)


def _url(texto) -> str:
    return quote(str(texto or ""), safe="")


def _resumo(texto, limite=LIMITE_DESCRICAO) -> str:
    """Corta no fim de uma palavra, com reticências, para a descrição do
    Google não terminar no meio de uma palavra."""
    limpo = re.sub(r"\s+", " ", str(texto or "")).strip()
    if len(limpo) <= limite:
        return limpo
    corte = limpo[:limite - 1].rsplit(" ", 1)[0].rstrip(" ,;:.")
    return f"{corte}…"


def _json_ld(dados) -> str:
    # dentro de <script>, "<", ">" e "&" vão como <...: um texto do
    # cadastro com "</script>" ou "<!--" não fecha nem confunde a tag, e o
    # JSON continua o mesmo para quem lê
    return (json.dumps(dados, ensure_ascii=False)
            .replace("<", "\\u003c").replace(">", "\\u003e").replace("&", "\\u0026"))


def _trocar_cabecalho(modelo, *, titulo, descricao, canonico, imagem, tipo_og, dados_estruturados):
    """Põe título, descrição, endereço canônico, Open Graph e dados
    estruturados no <head>, tirando os que o modelo já tivesse."""
    if "</head>" not in modelo or "<title>" not in modelo:
        return None
    pagina = re.sub(r"<title>.*?</title>", lambda _m: f"<title>{_e(titulo)}</title>", modelo, count=1, flags=re.S)
    for velho in (
        r'\s*<meta\s+name="description"[^>]*>',
        r'\s*<link\s+rel="canonical"[^>]*>',
        r'\s*<meta\s+(?:property="og:[^"]*"|name="twitter:[^"]*")[^>]*>',
        r'\s*<script[^>]*id="dados-estruturados-pagina"[^>]*>.*?</script>',
    ):
        pagina = re.sub(velho, "", pagina, flags=re.S | re.I)
    descricao = _resumo(descricao)
    novas = [
        f'<meta name="description" content="{_e(descricao)}">',
        f'<link rel="canonical" href="{_e(canonico)}">',
        '<meta property="og:site_name" content="Futuro+">',
        '<meta property="og:locale" content="pt_BR">',
        f'<meta property="og:type" content="{_e(tipo_og)}">',
        f'<meta property="og:title" content="{_e(titulo)}">',
        f'<meta property="og:description" content="{_e(descricao)}">',
        f'<meta property="og:url" content="{_e(canonico)}">',
        f'<meta property="og:image" content="{_e(imagem)}">',
        '<meta name="twitter:card" content="summary_large_image">',
        # mesmo id que o JavaScript usa (definirDadosEstruturados), que troca este em vez de criar outro
        f'<script type="application/ld+json" id="dados-estruturados-pagina">{_json_ld(dados_estruturados)}</script>',
    ]
    return pagina.replace("</head>", "    " + "\n    ".join(novas) + "\n</head>", 1)


# ---- curso ----

def descricao_do_curso(curso) -> str:
    """A mesma de curso-detalhe.js: a descrição do catálogo, ou uma frase com
    o nome quando o catálogo não tem."""
    descricao = str(curso.get("descricao") or "").strip()
    if descricao:
        return descricao
    tipo = "superior de tecnologia" if curso.get("nivel") == "superior" else "técnico"
    return f"{curso.get('nome', '')}: veja onde cursar, pré-requisitos e tudo sobre o curso {tipo} nas Etecs e Fatecs."


def unidades_do_curso(curso, unidades) -> list:
    """As unidades que oferecem o curso, com a mesma regra da página: o nome
    igual e, como técnico e superior podem ter o mesmo nome, curso superior
    só em Fatec e técnico só fora dela. Em ordem de nome."""
    termo = normalizar(curso.get("nome"))
    superior = curso.get("nivel") == "superior"
    escolhidas = []
    for unidade in unidades or []:
        # os cursos da unidade vêm como no cadastro ({"nome", "categoria"}) ou só o nome
        nomes = (c.get("nome") if isinstance(c, dict) else c for c in unidade.get("cursos") or [])
        if not any(normalizar(nome) == termo for nome in nomes):
            continue
        eh_fatec = str(unidade.get("tipo") or "").strip().lower() == "fatec"
        if eh_fatec == superior:
            escolhidas.append(unidade)
    return sorted(escolhidas, key=lambda u: normalizar(u.get("nome")))


def _horas(curso) -> int:
    try:
        return int(float(curso.get("cargaHoraria") or 0))
    except (TypeError, ValueError):
        return 0


def html_do_curso(curso, unidades) -> str:
    """O conteúdo principal, com as mesmas classes de curso-detalhe.js, para a
    troca pela página completa quase não aparecer."""
    nome = curso.get("nome", "")
    modalidades = "".join(f'<span class="tag-modalidade">{_e(m)}</span>' for m in curso.get("modalidades") or [])
    horas = _horas(curso)
    ficha = [
        ("Duração", curso.get("duracao")),
        ("Carga horária", f"{horas:,} horas".replace(",", ".") if horas else ""),
        ("Eixo tecnológico", ", ".join(curso.get("eixos") or [])),
    ]
    itens_da_ficha = "".join(
        f'<div class="curso-ficha-item"><div><span class="curso-ficha-rotulo">{_e(rotulo)}</span>'
        f"<strong>{_e(valor)}</strong></div></div>"
        for rotulo, valor in ficha if valor
    )
    blocos = [
        ("O que você aprende", curso.get("descricao")),
        ("O que o profissional faz", curso.get("atuacao")),
        ("Onde se trabalha", curso.get("ondeTrabalhar")),
    ]
    textos = "".join(
        f'<section class="curso-bloco"><h2>{_e(titulo)}</h2><p>{_e(texto)}</p></section>'
        for titulo, texto in blocos if texto
    )
    if unidades:
        itens = "".join(
            f'<li><a class="curso-unidade-nome" href="instituicao.html?u={_url(u.get("id"))}">{_e(u.get("nome"))}</a> '
            f'<span class="curso-unidade-cidade">{_e(u.get("municipio"))}</span></li>'
            for u in unidades[:MAXIMO_UNIDADES]
        )
        restantes = len(unidades) - MAXIMO_UNIDADES
        ver_todas = (
            f'<a class="curso-ver-todas" href="instituicoes.html?curso={_url(nome)}">'
            f"Ver as outras {restantes} unidades &rarr;</a>"
        ) if restantes > 0 else ""
        onde = f'<ul class="curso-unidades">{itens}</ul>{ver_todas}'
    else:
        onde = '<p class="sem-cursos">Nenhuma unidade do cadastro oferece este curso no momento.</p>'
    return (
        f'<header class="curso-topo"><div class="curso-topo-texto"><h1>{_e(nome)}</h1>'
        f'<div class="curso-modalidades">{modalidades}</div></div></header>'
        + (f'<div class="curso-ficha">{itens_da_ficha}</div>' if itens_da_ficha else "")
        + f'<div class="curso-grade{"" if textos else " curso-grade--unica"}">'
        + (f'<div class="curso-cartao curso-textos">{textos}</div>' if textos else "")
        + f'<section class="curso-cartao curso-onde-estudar"><h2>Onde estudar</h2>{onde}</section></div>'
        + '<p class="curso-fonte">Informações do catálogo oficial do Centro Paula Souza, mantidas no Futuro+.</p>'
    )


def pagina_do_curso(modelo, curso, slug, unidades):
    """curso.html já preenchido, ou None se o modelo não tiver onde encaixar."""
    nome = str(curso.get("nome") or "").strip()
    if not nome or not _ESPERA_CURSO.search(modelo or ""):
        return None
    superior = curso.get("nivel") == "superior"
    tipo = "Superior de Tecnologia (Fatec)" if superior else "Técnico (Etec)"
    titulo = f"{nome} — Curso {tipo} | Futuro+"
    descricao = descricao_do_curso(curso)
    canonico = f"{SITE}/curso.html?c={_url(slug)}"
    dados = {
        "@context": "https://schema.org",
        "@type": "Course",
        "name": nome,
        "description": descricao,
        "url": canonico,
        "provider": {"@type": "Organization", "name": "Centro Paula Souza", "sameAs": "https://www.cps.sp.gov.br/"},
        "educationalLevel": "Superior de Tecnologia" if superior else "Técnico",
    }
    pagina = _trocar_cabecalho(modelo, titulo=titulo, descricao=descricao, canonico=canonico,
                               imagem=IMAGEM_PADRAO, tipo_og="website", dados_estruturados=dados)
    if pagina is None:
        return None
    conteudo = html_do_curso({**curso, "nome": nome}, unidades_do_curso(curso, unidades))
    return _ESPERA_CURSO.sub(lambda _m: conteudo, pagina, count=1)


# ---- instituição ----

def cursos_da_unidade(unidade) -> list:
    """Cada curso uma vez só, com a página dele (cursosDaUnidade, em
    instituicao-util.js), em ordem de nome."""
    por_nome = {}
    for curso in unidade.get("cursos") or []:
        nome = str((curso or {}).get("nome") or "").strip() if isinstance(curso, dict) else ""
        if nome and normalizar(nome) not in por_nome:
            por_nome[normalizar(nome)] = {"nome": nome, "slug": slug_do_curso_na_unidade(nome, unidade.get("tipo"))}
    return [por_nome[chave] for chave in sorted(por_nome)]


def _com_ponto(frase) -> str:
    limpa = str(frase or "").strip()
    return limpa if not limpa or limpa[-1] in ".!?" else f"{limpa}."


def texto_sobre(unidade, cursos) -> str:
    """A mesma ideia do textoSobre() de instituicao-util.js (lá ele também
    lista as modalidades, que vêm de outra tabela do site)."""
    tipo = str(unidade.get("tipo") or "").strip().lower()
    o_que = {
        "fatec": "uma faculdade de tecnologia pública e gratuita do Centro Paula Souza",
        "etec": "uma escola técnica estadual, pública e gratuita, do Centro Paula Souza",
    }.get(tipo, "uma instituição de ensino")
    artigo = "A " if tipo in ("etec", "fatec") else ""
    onde = f", em {unidade['municipio']}" if unidade.get("municipio") else ""
    frases = [f"{artigo}{unidade.get('nome', '')} é {o_que}{onde}."]
    if unidade.get("historico"):
        frases.append(_com_ponto(unidade["historico"]))
    if cursos:
        frases.append("Hoje oferece 1 curso." if len(cursos) == 1 else f"Hoje oferece {len(cursos)} cursos.")
    return " ".join(frases)


def _link_https(url) -> str:
    texto = str(url or "").strip()
    return texto if re.fullmatch(r"https://[^\s\"'<>]+", texto) else ""


def html_da_instituicao(unidade, cursos, descricao) -> str:
    """Fica no lugar do "Carregando instituição..." (com o mesmo id): quando o
    JavaScript monta a página, ele esconde este bloco, como fazia com o aviso."""
    tipo = str(unidade.get("tipo") or "").strip()
    local = " · ".join(parte for parte in (tipo, unidade.get("municipio")) if parte)
    endereco = re.sub(r"\s+", " ", str(unidade.get("endereco") or "")).strip()
    lista = "".join(
        f'<li><a href="curso.html?c={_url(c["slug"])}">{_e(c["nome"])}</a></li>' for c in cursos
    )
    return (
        '<div class="inst-carregando inst-pronta" id="inst-carregando">'
        f"<h1>{_e(unidade.get('nome'))}</h1>"
        + (f'<p class="inst-pronta-local">{_e(local)}</p>' if local else "")
        + (f'<p class="inst-pronta-endereco">{_e(endereco)}</p>' if endereco else "")
        + f"<h2>Sobre a instituição</h2><p>{_e(descricao)}</p>"
        + (f'<h2>Cursos oferecidos</h2><ul class="inst-pronta-cursos">{lista}</ul>' if lista else "")
        + "</div>"
    )


def titulo_da_instituicao(unidade) -> str:
    """O mesmo de instituicao.js: o nome primeiro, que é o que se pesquisa."""
    return f"{unidade.get('nome', '')}: cursos, endereço e avaliações | Futuro+"


def pagina_da_instituicao(modelo, unidade, unidade_id):
    """instituicao.html já preenchido, ou None se o modelo não tiver onde encaixar."""
    nome = str(unidade.get("nome") or "").strip()
    if not nome or not _ESPERA_INSTITUICAO.search(modelo or ""):
        return None
    unidade = {**unidade, "nome": nome}
    cursos = cursos_da_unidade(unidade)
    descricao = texto_sobre(unidade, cursos)
    canonico = f"{SITE}/instituicao.html?u={_url(unidade_id)}"
    tipo = str(unidade.get("tipo") or "").strip().lower()
    dados = {
        "@context": "https://schema.org",
        "@type": "CollegeOrUniversity" if tipo == "fatec" else "School",
        "name": nome,
        "description": descricao,
        "url": canonico,
        "parentOrganization": {"@type": "Organization", "name": "Centro Paula Souza", "sameAs": "https://www.cps.sp.gov.br/"},
    }
    if unidade.get("municipio"):
        dados["address"] = {"@type": "PostalAddress", "addressLocality": unidade["municipio"],
                            "addressRegion": "SP", "addressCountry": "BR"}
    localizacao = unidade.get("localizacao") or {}
    if isinstance(localizacao, dict) and localizacao.get("lat") is not None and localizacao.get("lng") is not None:
        dados["geo"] = {"@type": "GeoCoordinates", "latitude": localizacao["lat"], "longitude": localizacao["lng"]}
    pagina = _trocar_cabecalho(modelo, titulo=titulo_da_instituicao(unidade), descricao=descricao,
                               canonico=canonico, imagem=_link_https(unidade.get("foto")) or IMAGEM_PADRAO,
                               tipo_og="website", dados_estruturados=dados)
    if pagina is None:
        return None
    conteudo = html_da_instituicao(unidade, cursos, descricao)
    return _ESPERA_INSTITUICAO.sub(lambda _m: conteudo, pagina, count=1)
