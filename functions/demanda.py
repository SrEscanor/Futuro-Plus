"""Coleta a demanda (inscritos por vaga) publicada pelos sites do Vestibulinho
das Etecs e do Vestibular das Fatecs.

Os dois sites funcionam igual, em dois passos, sempre com POST no mesmo
endereço:
  1. envia o semestre           -> devolve a lista de unidades
  2. envia o semestre e a unidade -> devolve a tabela Curso / Período /
     Inscritos / Vagas / Demanda

Este arquivo só busca e organiza os números; quem grava no Firestore é a
função em main.py. Também roda sozinho, para conferir o resultado sem gravar
nada:

    python demanda.py etec 20261 --saida demanda-etec.json
"""
import html
import json
import re
import sys
import unicodedata
from concurrent.futures import ThreadPoolExecutor

import requests

SITES = {
    "etec": {
        "url": "https://vestibulinho.etec.sp.gov.br/demanda/demanda.asp",
        "indice": "https://vestibulinho.etec.sp.gov.br/demanda/",
        "campo_unidade": "CodEtec",
        "campo_validacao": "V_REQCodEtec",
    },
    "fatec": {
        "url": "https://vestibular.fatec.sp.gov.br/demanda/demanda.asp",
        "indice": "https://vestibular.fatec.sp.gov.br/demanda/",
        "campo_unidade": "FATEC",
        "campo_validacao": "V_REQCodFatec",
    },
}

# Identifica o Futuro+ para quem administra os sites, em vez de se passar por
# um navegador.
CABECALHOS = {"User-Agent": "FuturoPlus-Demanda/1.0 (projeto escolar; coleta semestral)"}

# Poucas consultas ao mesmo tempo: a coleta inteira são umas 400 páginas e não
# precisa ser rápida a ponto de pesar no site.
CONSULTAS_SIMULTANEAS = 4
TEMPO_LIMITE = 30


def _texto(trecho):
    """Tira as tags e os espaços repetidos de um pedaço de HTML."""
    sem_tags = re.sub(r"<[^>]+>", " ", trecho)
    return re.sub(r"\s+", " ", html.unescape(sem_tags)).strip()


def _decodificar(resposta):
    """Os sites não declaram a codificação; quase sempre é UTF-8, mas páginas
    antigas vêm em Windows-1252."""
    try:
        return resposta.content.decode("utf-8")
    except UnicodeDecodeError:
        return resposta.content.decode("windows-1252", errors="replace")


def _post(sessao, site, dados):
    resposta = sessao.post(SITES[site]["url"], data=dados, headers=CABECALHOS, timeout=TEMPO_LIMITE)
    resposta.raise_for_status()
    return _decodificar(resposta)


def listar_semestres(site, sessao=None):
    """Semestres que o site oferece, do mais novo para o mais antigo ("20261")."""
    sessao = sessao or requests.Session()
    resposta = sessao.get(SITES[site]["indice"], headers=CABECALHOS, timeout=TEMPO_LIMITE)
    resposta.raise_for_status()
    return re.findall(r'<option[^>]*value="(\d{5})"', _decodificar(resposta))


def listar_unidades(site, semestre, sessao=None):
    """Unidades (e classes descentralizadas) que tiveram processo seletivo no
    semestre: lista de {"codigo", "nome"}."""
    sessao = sessao or requests.Session()
    pagina = _post(sessao, site, {"ano-sem": semestre})
    campo = SITES[site]["campo_unidade"]
    select = re.search(rf'<select[^>]*name="{campo}"[^>]*>(.*?)</select>', pagina, re.S | re.I)
    if not select:
        return []

    unidades = []
    for valor, rotulo in re.findall(r'<option[^>]*value="([^"]*)"[^>]*>(.*?)</option>', select.group(1), re.S | re.I):
        valor = html.unescape(valor).strip()
        if valor:
            unidades.append({"codigo": valor, "nome": _texto(rotulo)})
    return unidades


def _numero(texto):
    """"1.234" -> 1234. Devolve None quando a célula não é um número."""
    limpo = texto.replace(".", "").strip()
    return int(limpo) if limpo.isdigit() else None


def demanda_da_unidade(site, semestre, unidade, sessao=None):
    """Linhas da tabela de uma unidade:
    [{"curso", "periodo", "inscritos", "vagas"}]."""
    sessao = sessao or requests.Session()
    config = SITES[site]
    pagina = _post(sessao, site, {
        config["campo_unidade"]: unidade["codigo"],
        config["campo_validacao"]: "",
        "ano-sem": semestre,
    })

    linhas = []
    for tabela in re.findall(r"<table.*?</table>", pagina, re.S | re.I):
        for linha in re.findall(r"<tr.*?</tr>", tabela, re.S | re.I):
            celulas = [_texto(c) for c in re.findall(r"<t[dh][^>]*>(.*?)</t[dh]>", linha, re.S | re.I)]
            if len(celulas) < 5:
                continue
            inscritos, vagas = _numero(celulas[2]), _numero(celulas[3])
            # o cabeçalho ("Curso", "Período"...) cai fora aqui
            if inscritos is None or vagas is None:
                continue
            linhas.append({
                "curso": celulas[0],
                "periodo": celulas[1],
                "inscritos": inscritos,
                "vagas": vagas,
            })
    return linhas


def coletar(site, semestre, ao_progredir=None):
    """Coleta o semestre inteiro de um site.

    Devolve {"site", "semestre", "unidades": [{"codigo", "nome", "cursos"}],
    "falhas": [nomes das unidades que não responderam]}."""
    if site not in SITES:
        raise ValueError(f"site desconhecido: {site}")
    if not re.fullmatch(r"\d{4}[12]", str(semestre)):
        raise ValueError(f"semestre inválido: {semestre}")

    sessao = requests.Session()
    unidades = listar_unidades(site, semestre, sessao)
    resultado, falhas = [], []

    def buscar(unidade):
        # Uma tentativa extra resolve a maior parte das falhas passageiras.
        for tentativa in (1, 2):
            try:
                return unidade, demanda_da_unidade(site, semestre, unidade, sessao)
            except requests.RequestException:
                if tentativa == 2:
                    return unidade, None

    with ThreadPoolExecutor(max_workers=CONSULTAS_SIMULTANEAS) as executor:
        for feitas, (unidade, cursos) in enumerate(executor.map(buscar, unidades), start=1):
            if cursos is None:
                falhas.append(unidade["nome"])
            elif cursos:
                resultado.append({**unidade, "cursos": cursos})
            if ao_progredir:
                ao_progredir(feitas, len(unidades))

    return {"site": site, "semestre": str(semestre), "unidades": resultado, "falhas": falhas}


# ---------------------------------------------------------------------------
# Casar o nome do site com o curso do catálogo
# ---------------------------------------------------------------------------

def normalizar(texto):
    """Mesma regra do site (admin-cursos.js): minúsculas, sem acento, só
    letras e números."""
    sem_acento = unicodedata.normalize("NFD", (texto or "").lower())
    sem_acento = "".join(c for c in sem_acento if unicodedata.category(c) != "Mn")
    return re.sub(r"[^a-z0-9]+", " ", sem_acento).strip()


# Como o Vestibulinho escreve cada forma de oferta. O que vem depois do
# prefixo é o nome do curso; o que vem depois de " - " são siglas da oferta
# (M-TEC, PI, N, AMS...) e parcerias, que não fazem parte do nome.
PREFIXOS_ETEC = [
    r"ensino medio com habilitacao profissional de tecnico em",
    r"ensino medio com habilitacao profissional de",
    r"ensino medio com qualificacao profissional de",
    r"ensino medio com qualificacao profissional em",
    r"ensino medio com itinerario formativo(?: de| em)?",
    r"ensino medio integrado ao tecnico em",
    r"especializacao tecnica(?: de nivel medio)? em",
    r"especializacao(?: profissional)?(?: tecnica)?(?: de nivel medio)? em",
    r"tecnico em",
    r"habilitacao profissional de tecnico em",
]


def _sem_prefixo(site, base):
    if site != "etec":
        return base
    for prefixo in PREFIXOS_ETEC:
        sem_prefixo = re.sub(rf"^{prefixo}\s+", "", base)
        if sem_prefixo != base:
            return sem_prefixo
    return base


def nomes_possiveis(site, curso):
    """Formas de escrever o nome do curso, da mais completa para a mais curta,
    já normalizadas.

    O traço tanto separa a sigla da oferta ("... AGROPECUÁRIA - M-TEC - PI")
    quanto faz parte de alguns nomes ("Urgência e Emergência - APH",
    "Mecânica - Processos de Soldagem"). Por isso a busca começa pelo nome
    inteiro e vai tirando um pedaço do fim de cada vez."""
    partes = re.split(r"\s+[-–]\s+", curso or "")
    nomes = []
    for quantas in range(len(partes), 0, -1):
        trecho = " ".join(partes[:quantas])
        for versao in (trecho, re.sub(r"\([^)]*\)", " ", trecho)):
            base = _sem_prefixo(site, normalizar(versao))
            if base and base not in nomes:
                nomes.append(base)
    return nomes


def nome_base(site, curso):
    """Nome mais curto do curso, sem a forma de oferta.

    "ENSINO MÉDIO COM HABILITAÇÃO PROFISSIONAL DE TÉCNICO EM AGROPECUÁRIA -
    M-TEC - PI" -> "agropecuaria"."""
    nomes = nomes_possiveis(site, curso)
    return nomes[-1] if nomes else ""


def somar_por_curso(coleta, catalogo):
    """Soma inscritos e vagas de todas as unidades para cada curso do catálogo.

    catalogo: lista de {"id", "nome", "nivel"} (os documentos de "cursos").
    Devolve (por_curso, sem_par):
      por_curso: {id: {"inscritos", "vagas", "unidades"}}
      sem_par:   [{"curso", "inscritos", "vagas", "unidades"}], do maior para
                 o menor, para a revisão manual."""
    site = coleta["site"]
    quer_superior = site == "fatec"

    indice = {}
    for curso in catalogo:
        if (curso.get("nivel") == "superior") != quer_superior:
            continue
        indice.setdefault(normalizar(curso.get("nome")), curso["id"])

    por_curso, sem_par = {}, {}
    # Uma Etec aparece várias vezes na lista do site: a sede ("E0063.S0000")
    # e cada classe descentralizada ("E0063.F0291"). Para contar em quantas
    # unidades o curso existe, todas valem como a mesma escola.
    vistos_por_escola = {}
    for unidade in coleta["unidades"]:
        escola = unidade["codigo"].split(".")[0] if site == "etec" else unidade["codigo"]
        vistos = vistos_por_escola.setdefault(escola, set())
        for linha in unidade["cursos"]:
            # "Treineiro" (Fatec) é inscrição para treinar a prova: não é
            # curso e não tem vaga.
            if not linha["vagas"]:
                continue
            nomes = nomes_possiveis(site, linha["curso"])
            id_curso = next((indice[n] for n in nomes if n in indice), None)
            if id_curso:
                destino = por_curso.setdefault(id_curso, {"inscritos": 0, "vagas": 0, "unidades": 0})
                chave = id_curso
            else:
                # Etec: junta as variações de oferta do mesmo curso numa linha
                # só; Fatec: o traço costuma ser do próprio nome.
                base = (nomes[-1] if site == "etec" else nomes[0]) if nomes else ""
                destino = sem_par.setdefault(base, {
                    "curso": linha["curso"], "inscritos": 0, "vagas": 0, "unidades": 0,
                })
                chave = "?" + base
            destino["inscritos"] += linha["inscritos"]
            destino["vagas"] += linha["vagas"]
            if chave not in vistos:
                destino["unidades"] += 1
                vistos.add(chave)

    pendentes = sorted(sem_par.values(), key=lambda c: c["inscritos"], reverse=True)
    return por_curso, pendentes


if __name__ == "__main__":
    import argparse

    sys.stdout.reconfigure(encoding="utf-8")
    argumentos = argparse.ArgumentParser(description="Coleta a demanda sem gravar no Firestore.")
    argumentos.add_argument("site", choices=sorted(SITES))
    argumentos.add_argument("semestre", help='ano e semestre juntos, ex.: "20261"')
    argumentos.add_argument("--saida", help="arquivo JSON para guardar o resultado")
    argumentos.add_argument("--limite", type=int, help="coleta só as primeiras N unidades (teste)")
    opcoes = argumentos.parse_args()

    if opcoes.limite:
        original = listar_unidades
        listar_unidades = lambda *a, **k: original(*a, **k)[:opcoes.limite]  # noqa: E731

    dados = coletar(opcoes.site, opcoes.semestre,
                    lambda feitas, total: print(f"\r{feitas} de {total} unidades", end="", file=sys.stderr))
    print(file=sys.stderr)
    linhas = sum(len(u["cursos"]) for u in dados["unidades"])
    print(f"{len(dados['unidades'])} unidades com dados, {linhas} linhas, {len(dados['falhas'])} falhas")
    if opcoes.saida:
        with open(opcoes.saida, "w", encoding="utf-8") as arquivo:
            json.dump(dados, arquivo, ensure_ascii=False)
        print("gravado em", opcoes.saida)
