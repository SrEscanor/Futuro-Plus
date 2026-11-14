"""Coleta notícias sobre Etecs e Fatecs nos feeds (RSS) do Centro Paula Souza,
da Agência SP e do Google Notícias, e deixa cada uma no formato da fila de
aprovação do painel Admin · Notícias.

Ler feed é de graça e não usa IA: cada site já publica a lista das últimas
notícias com título, link e data.

Este arquivo só busca e organiza; quem grava no Firestore é
noticias_firestore.py. Também roda sozinho, para ver o que os feeds trazem
sem gravar nada:

    python noticias.py
    python noticias.py --imagens     (busca também a imagem de capa de cada uma)
"""
import hashlib
import html
import re
import sys
import unicodedata
import xml.etree.ElementTree as ET
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta, timezone
from email.utils import parsedate_to_datetime
from urllib.parse import parse_qsl, quote_plus, urlencode, urlsplit, urlunsplit

import requests

# "Etec" e "Fatec" também são nomes de escolas de outros estados, que não são
# do Centro Paula Souza: a Fatec Ivaiporã é do Paraná e a Etec Canguçu, do Rio
# Grande do Sul. Notícia que cite um destes nomes fica de fora da busca aberta.
# Apareceu outra escola de fora na fila? É só acrescentar o nome aqui.
OUTRAS_INSTITUICOES = ("Ivaiporã", "Canguçu")

# "Vestibulinho" fica de fora da busca de propósito: institutos federais e
# escolas particulares usam a mesma palavra, e as notícias do Vestibulinho
# das Etecs já citam "Etec".
BUSCA_DO_GOOGLE = " ".join([
    'Etec OR Fatec OR "Centro Paula Souza"',
    *(f'-"{nome}"' if " " in nome else f"-{nome}" for nome in OUTRAS_INSTITUICOES),
    "when:7d",
])

def _busca_do_bing(termo):
    return ("https://www.bing.com/news/search?q=" + quote_plus(termo)
            + "&format=rss&cc=br&setlang=pt-br&qft=" + quote_plus('sortbydate="1"'))


# Do mais oficial para o mais geral: quando a mesma notícia aparece em mais de
# uma fonte, fica a da primeira.
#   nome       o que aparece na notícia como origem
#   rotulo     o nome desta fonte no resumo da coleta (padrão: o nome)
#   feeds      os endereços lidos; a fonte só conta como falha se nenhum responder
#   agregador  junta notícias de outros sites: o nome do site vem em cada item
#   buscador   (em cada feed de um agregador) de qual buscador é o endereço
#
# A imprensa é buscada em dois buscadores porque o servidor do Firebase às
# vezes é recusado por um deles: o Google respondeu 503 aos pedidos vindos de
# lá, mesmo funcionando de um computador comum. Basta um dos dois responder.
FONTES = [
    {"id": "cps", "nome": "Centro Paula Souza", "feeds": [{"url": "https://www.cps.sp.gov.br/feed/"}]},
    {"id": "agenciasp-etec", "nome": "Agência SP", "rotulo": "Agência SP · Etec",
     "feeds": [{"url": "https://www.agenciasp.sp.gov.br/tag/etec/feed/"}]},
    {"id": "agenciasp-fatec", "nome": "Agência SP", "rotulo": "Agência SP · Fatec",
     "feeds": [{"url": "https://www.agenciasp.sp.gov.br/tag/fatec/feed/"}]},
    {"id": "imprensa", "nome": "Imprensa", "agregador": True, "feeds": [
        # o Bing vem antes porque entrega o link direto da notícia e um resumo
        {"buscador": "Bing Notícias", "url": _busca_do_bing("Etec")},
        {"buscador": "Bing Notícias", "url": _busca_do_bing("Fatec")},
        {"buscador": "Bing Notícias", "url": _busca_do_bing('"Centro Paula Souza"')},
        {"buscador": "Google Notícias",
         "url": "https://news.google.com/rss/search?q=" + quote_plus(BUSCA_DO_GOOGLE) + "&hl=pt-BR&gl=BR&ceid=BR:pt-419"},
    ]},
]
FEEDS_AGREGADORES = frozenset(fonte["id"] for fonte in FONTES if fonte.get("agregador"))

# Identifica o Futuro+ para quem administra os sites, em vez de se passar por
# um navegador.
CABECALHOS = {"User-Agent": "FuturoPlus-Noticias/1.0 (projeto escolar; leitura de feed)"}

# Para os buscadores, a mesma identificação no formato que os robôs conhecidos
# usam ("Mozilla/5.0 (compatible; ...)"), mais o idioma.
CABECALHOS_DE_BUSCADOR = {
    "User-Agent": "Mozilla/5.0 (compatible; FuturoPlus-Noticias/1.0; projeto escolar; leitura de feed)",
    "Accept-Language": "pt-BR,pt;q=0.9",
}

TEMPO_LIMITE = 20
TAMANHO_MAXIMO_DO_FEED = 3_000_000
TAMANHO_LIDO_DA_PAGINA = 400_000   # a imagem de capa fica no começo da página

# Notícia mais velha que isso não entra: na primeira coleta o feed traria
# meses de coisa vencida (inscrições que já fecharam, por exemplo).
DIAS_VALIDOS = 45
ITENS_POR_FEED = 40
LIMITE_TITULO = 200
LIMITE_RESUMO = 400
LIMITE_ENDERECO = 1000

# Só abrimos a página da notícia (para achar a imagem de capa) nestes sites.
SITES_COM_IMAGEM = ("cps.sp.gov.br", "agenciasp.sp.gov.br")
IMAGENS_POR_COLETA = 40
CONSULTAS_SIMULTANEAS = 4

# Uma busca aberta como a do Google traz de tudo; só passa o que cita o assunto.
ASSUNTO = re.compile(r"\b(etecs?|fatecs?|vestibulinho|paula souza|cps)\b")

# Na busca aberta a mesma notícia vem de vários jornais, cada um com o título
# um pouco diferente. Dois títulos com metade das palavras em comum contam
# como a mesma notícia (só para o que vem do agregador: notícia de site
# oficial nunca é descartada por parecer com outra).
SEMELHANCA_DE_REPETIDA = 0.5
PALAVRAS_VAZIAS = frozenset(
    "a o as os de da do das dos e em no na nos nas para por com um uma ao aos que se sp veja como".split()
)

PARAMETRO_DE_RASTREIO = re.compile(r"^(utm_.+|fbclid|gclid|oc|ref|ref_src)$", re.I)


# --------------------------------------------------------------------------
# Texto, endereços e datas
# --------------------------------------------------------------------------

def normalizar(texto):
    """Minúsculas, sem acento, só letras e números: serve para comparar."""
    sem_acento = unicodedata.normalize("NFKD", texto or "").encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]+", " ", sem_acento.lower()).strip()


def limpar_texto(trecho, limite=None):
    """Texto puro de um pedaço de HTML: sem tags e sem espaços repetidos.
    Com `limite`, corta numa palavra inteira e põe reticências."""
    sem_tags = re.sub(r"<[^>]+>", " ", trecho or "")
    texto = re.sub(r"\s+", " ", html.unescape(sem_tags)).strip()
    # sobras comuns nos feeds de sites feitos em WordPress
    texto = re.sub(r"\s*\[(?:…|\.\.\.)\]$", "", texto)
    texto = re.sub(r"\s*(?:O post|The post) .+ (?:apareceu primeiro em|appeared first on) .+$", "", texto)
    # os buscadores cortam o resumo com três pontos soltos
    texto = re.sub(r"\s*\.\.\.$", "…", texto)
    if limite and len(texto) > limite:
        texto = texto[:limite - 1].rsplit(" ", 1)[0].rstrip(" ,;:.-") + "…"
    return texto


def limpar_link(link):
    """Endereço http(s) sem os parâmetros de rastreio ("" se não for válido)."""
    try:
        partes = urlsplit((link or "").strip())
    except ValueError:
        return ""
    if partes.scheme not in ("http", "https") or not partes.netloc:
        return ""
    consulta = urlencode([
        (chave, valor) for chave, valor in parse_qsl(partes.query, keep_blank_values=True)
        if not PARAMETRO_DE_RASTREIO.match(chave)
    ])
    limpo = urlunsplit((partes.scheme, partes.netloc.lower(), partes.path, consulta, ""))
    return limpo if len(limpo) <= LIMITE_ENDERECO else ""


def link_de_dentro(link):
    """O Bing entrega o link da notícia embrulhado num endereço dele
    (.../news/apiclick.aspx?...&url=<endereço da notícia>...). Devolve o de
    dentro; qualquer outro link volta como veio."""
    try:
        partes = urlsplit((link or "").strip())
    except ValueError:
        return link
    if (partes.hostname or "").lower().endswith("bing.com") and "apiclick" in partes.path.lower():
        for chave, valor in parse_qsl(partes.query):
            if chave == "url" and valor:
                return valor
    return link


def id_da_noticia(link):
    """Identificador fixo a partir do link: a mesma notícia coletada de novo
    cai no mesmo documento, e é assim que a coleta sabe que já viu."""
    partes = urlsplit(link)
    chave = partes.netloc.lower() + partes.path.rstrip("/") + ("?" + partes.query if partes.query else "")
    return hashlib.sha1(chave.encode("utf-8")).hexdigest()[:24]


def imagem_https(endereco):
    """Endereço de imagem que o site consegue mostrar: completo e por https
    ("" se não der). Página https não carrega imagem por http."""
    endereco = html.unescape((endereco or "").strip())
    if endereco.startswith("//"):
        endereco = "https:" + endereco
    if endereco.startswith("http://"):
        endereco = "https://" + endereco[len("http://"):]
    try:
        partes = urlsplit(endereco)
    except ValueError:
        return ""
    if partes.scheme != "https" or not partes.netloc or len(endereco) > LIMITE_ENDERECO:
        return ""
    return endereco


def data_do_feed(texto, agora):
    """Data do item ("Fri, 13 Nov 2026 18:58:48 +0000"). Sem data, ou com
    data no futuro, vale o momento da coleta."""
    try:
        data = parsedate_to_datetime((texto or "").strip())
    except (TypeError, ValueError, IndexError):
        return agora
    if data.tzinfo is None:
        data = data.replace(tzinfo=timezone.utc)
    return min(data.astimezone(timezone.utc), agora)


def em_iso(data):
    """Mesmo formato em todos os documentos, para a ordenação por texto bater
    com a ordem das datas."""
    return data.astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def etiquetas(texto):
    """["etec", "fatec"] conforme o que o texto cita. Vestibulinho é o
    processo seletivo das Etecs. Lista vazia: notícia geral do Centro Paula
    Souza."""
    base = normalizar(texto)
    achadas = []
    if re.search(r"\b(etecs?|vestibulinho)\b", base):
        achadas.append("etec")
    if re.search(r"\bfatecs?\b", base):
        achadas.append("fatec")
    return achadas


def palavras_do_titulo(chave):
    """As palavras que contam num título já normalizado (o "chaveTitulo")."""
    return frozenset(palavra for palavra in chave.split() if len(palavra) > 2 and palavra not in PALAVRAS_VAZIAS)


def titulo_parecido(palavras, outros):
    """O título (como conjunto de palavras) é quase igual a algum dos outros?"""
    for outro in outros:
        todas = len(palavras | outro)
        if todas and len(palavras & outro) / todas >= SEMELHANCA_DE_REPETIDA:
            return True
    return False


def primeira_imagem(conteudo_html):
    achada = re.search(r"""<img\b[^>]*?\bsrc\s*=\s*["']([^"']+)["']""", conteudo_html or "", re.I)
    return achada.group(1) if achada else ""


def imagem_da_pagina(pagina_html):
    """A imagem de capa que a própria página indica para quem compartilha o
    link (og:image). Os sites escrevem a tag de jeitos diferentes: aspas
    simples ou duplas, e os atributos em qualquer ordem."""
    for tag in re.findall(r"<meta\b[^>]*>", pagina_html or "", re.I):
        if re.search(r"""\b(?:property|name)\s*=\s*["'](?:og:image(?::secure_url)?|twitter:image)["']""", tag, re.I):
            endereco = re.search(r"""\bcontent\s*=\s*["']([^"']+)["']""", tag, re.I)
            if endereco:
                return endereco.group(1)
    return ""


# --------------------------------------------------------------------------
# Leitura dos feeds
# --------------------------------------------------------------------------

def _baixar(endereco, sessao=None, limite=TAMANHO_MAXIMO_DO_FEED, cabecalhos=None):
    """Conteúdo de um endereço. Para de ler em `limite`, para um site com
    problema não encher a memória da função."""
    resposta = (sessao or requests).get(endereco, headers=cabecalhos or CABECALHOS, timeout=TEMPO_LIMITE, stream=True)
    try:
        resposta.raise_for_status()
        partes, total = [], 0
        for pedaco in resposta.iter_content(65536):
            partes.append(pedaco)
            total += len(pedaco)
            if total >= limite:
                break
        return b"".join(partes)
    finally:
        resposta.close()


def ler_feed(conteudo):
    """Itens de um feed RSS, ainda crus: [{"titulo", "link", "data",
    "descricao", "categorias", "origem", "conteudo"}]."""
    # alguns sites mandam uma linha em branco antes do "<?xml", o que o leitor não aceita
    raiz = ET.fromstring(conteudo.lstrip(b"\xef\xbb\xbf \t\r\n"))
    itens = []
    for item in raiz.iter("item"):
        # Cada campo é achado pelo nome sem o prefixo: o Google escreve
        # <source> e o Bing, <News:Source>, com um prefixo que muda a cada
        # busca. O texto da notícia nos sites oficiais vem em <content:encoded>.
        campos, categorias = {}, []
        for filho in item:
            nome = filho.tag.rsplit("}", 1)[-1].lower()
            if nome == "category":
                categorias.append(filho.text or "")
            else:
                campos.setdefault(nome, filho.text or "")
        itens.append({
            "titulo": campos.get("title", ""),
            "link": campos.get("link", ""),
            "data": campos.get("pubdate", ""),
            "descricao": campos.get("description", ""),
            "categorias": categorias,
            "origem": campos.get("source", ""),
            "conteudo": campos.get("encoded", ""),
        })
    return itens


def preparar(item, fonte, agora):
    """Deixa um item do feed no formato da fila de aprovação. Devolve
    (notícia, None) ou (None, motivo de ter ficado de fora)."""
    titulo = limpar_texto(item["titulo"])
    resumo = limpar_texto(item["descricao"], LIMITE_RESUMO)
    nome_da_fonte = fonte["nome"]

    if fonte.get("agregador"):
        # o título vem como "Manchete - Nome do site", e a descrição é só o
        # link repetido
        origem = limpar_texto(item["origem"])
        if origem:
            nome_da_fonte = origem
            if titulo.endswith(f" - {origem}"):
                titulo = titulo[:-len(origem) - 3].rstrip()
        # a "descrição" do Google é o título repetido; a do Bing é um resumo de verdade
        if normalizar(resumo).startswith(normalizar(titulo)[:60]):
            resumo = ""
        # O assunto precisa estar no título. Pelo resumo entraria muita coisa
        # que só cita a Fatec de passagem ("o evento será ao lado da Fatec").
        chave = normalizar(titulo)
        if not ASSUNTO.search(chave) or any(normalizar(nome) in chave for nome in OUTRAS_INSTITUICOES):
            return None, "fora do assunto"

    link = limpar_link(link_de_dentro(item["link"]))
    if not titulo or not link:
        return None, "sem título ou link"

    publicada = data_do_feed(item["data"], agora)
    if agora - publicada > timedelta(days=DIAS_VALIDOS):
        return None, "antiga"

    if normalizar(resumo) == normalizar(titulo):
        resumo = ""

    return {
        "id": id_da_noticia(link),
        "titulo": limpar_texto(titulo, LIMITE_TITULO),
        "resumo": resumo,
        "link": link,
        "imagem": imagem_https(primeira_imagem(item["conteudo"])),
        "fonte": nome_da_fonte[:80],
        "instituicoes": etiquetas(" ".join([titulo, resumo, *item["categorias"]])),
        "publicadaEm": em_iso(publicada),
        # a mesma notícia chega por sites diferentes, com links diferentes: o
        # título sem acento nem pontuação é o que mostra que é a mesma
        "chaveTitulo": normalizar(titulo)[:150],
        # por qual feed ela chegou ("cps", "google"...)
        "feed": fonte["id"],
    }, None


def _explicar(erro):
    if isinstance(erro, requests.HTTPError) and erro.response is not None:
        return f"o site respondeu com erro {erro.response.status_code}"
    if isinstance(erro, requests.Timeout):
        return "o site demorou demais para responder"
    if isinstance(erro, requests.RequestException):
        return "não foi possível conectar ao site"
    return "o feed veio num formato que não deu para ler"


def coletar(sessao=None, agora=None):
    """Lê todas as fontes. Devolve {"noticias": [...], "fontes": [{"id",
    "nome", "encontradas", "erro"}]}. Uma fonte fora do ar não derruba as
    outras: o erro dela vai em "fontes"."""
    sessao = sessao or requests.Session()
    agora = agora or datetime.now(timezone.utc)
    noticias, fontes = [], []
    ids, titulos, titulos_em_palavras = set(), set(), []

    for fonte in FONTES:
        situacao = {"id": fonte["id"], "nome": fonte.get("rotulo") or fonte["nome"], "encontradas": 0, "erro": None}
        fontes.append(situacao)

        itens, falhas, responderam, algum_respondeu = [], [], [], False
        for feed in fonte["feeds"]:
            buscador = feed.get("buscador")
            try:
                conteudo = _baixar(feed["url"], sessao, cabecalhos=CABECALHOS_DE_BUSCADOR if buscador else None)
                itens.extend(ler_feed(conteudo)[:ITENS_POR_FEED])
                algum_respondeu = True
                if buscador and buscador not in responderam:
                    responderam.append(buscador)
            except (requests.RequestException, ET.ParseError) as erro:
                falha = f"{buscador}: {_explicar(erro)}" if buscador else _explicar(erro)
                if falha not in falhas:
                    falhas.append(falha)

        if not algum_respondeu:
            situacao["erro"] = "; ".join(falhas)
            continue
        if responderam:
            situacao["nome"] = f"{fonte['nome']} ({' e '.join(responderam)})"
        if falhas:
            # um buscador recusou, mas outro respondeu: não é falha da fonte;
            # fica anotado para quem for olhar os registros da função
            situacao["semResposta"] = falhas

        for item in itens:
            noticia, _motivo = preparar(item, fonte, agora)
            if not noticia or noticia["id"] in ids or noticia["chaveTitulo"] in titulos:
                continue
            palavras = palavras_do_titulo(noticia["chaveTitulo"])
            if fonte.get("agregador") and titulo_parecido(palavras, titulos_em_palavras):
                continue
            ids.add(noticia["id"])
            titulos.add(noticia["chaveTitulo"])
            titulos_em_palavras.append(palavras)
            noticias.append(noticia)
            situacao["encontradas"] += 1

    return {"noticias": noticias, "fontes": fontes}


# --------------------------------------------------------------------------
# Imagem de capa
# --------------------------------------------------------------------------

def _site_com_imagem(link):
    dominio = (urlsplit(link).hostname or "").lower()
    return any(dominio == site or dominio.endswith("." + site) for site in SITES_COM_IMAGEM)


def buscar_imagem(link, sessao=None):
    """Imagem de capa indicada pela página da notícia ("" quando não há ou a
    página não abre)."""
    try:
        pagina = _baixar(link, sessao, TAMANHO_LIDO_DA_PAGINA).decode("utf-8", errors="replace")
    except requests.RequestException:
        return ""
    return imagem_https(imagem_da_pagina(pagina))


def completar_imagens(noticias, sessao=None):
    """Preenche "imagem" das notícias dos sites oficiais com a capa que a
    página indica; sem capa, fica a primeira imagem do texto (se houver).
    Só é chamada para as notícias novas, para não abrir de novo as mesmas
    páginas a cada coleta. Muda a própria lista."""
    alvos = [noticia for noticia in noticias if _site_com_imagem(noticia["link"])][:IMAGENS_POR_COLETA]
    if not alvos:
        return
    sessao = sessao or requests.Session()
    with ThreadPoolExecutor(max_workers=CONSULTAS_SIMULTANEAS) as executor:
        capas = executor.map(lambda noticia: buscar_imagem(noticia["link"], sessao), alvos)
        for noticia, capa in zip(alvos, capas):
            if capa:
                noticia["imagem"] = capa


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    coleta = coletar()
    if "--imagens" in sys.argv:
        completar_imagens(coleta["noticias"])

    for fonte in coleta["fontes"]:
        print(f"{fonte['nome']}: {fonte['erro'] or str(fonte['encontradas']) + ' notícia(s)'}")
        for falha in fonte.get("semResposta", []):
            print(f"    (não respondeu) {falha}")
    print()
    for noticia in coleta["noticias"]:
        marcas = "/".join(noticia["instituicoes"]) or "cps"
        print(f"[{marcas:10}] {noticia['publicadaEm'][:10]}  {noticia['titulo'][:95]}")
        print(f"             {noticia['fonte']}{'  (com imagem)' if noticia['imagem'] else ''}")
    print(f"\n{len(coleta['noticias'])} notícia(s) no total. Nada foi gravado.")
