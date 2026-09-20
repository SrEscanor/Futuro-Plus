import math
import re
import time
import unicodedata
from dataclasses import dataclass
from urllib.parse import quote

import requests
from agents import RunContextWrapper, function_tool
from firebase_admin import firestore

from contexto_chat import ContextoChat

ACAO_PEDIR_PERMISSAO_LOCALIZACAO = "pedir_permissao_localizacao"
MAXIMO_UNIDADES_NA_RESPOSTA = 3
USER_AGENT = "FuturoPlus/1.0 (contato.futuromais@gmail.com)"

# O cadastro de unidades muda pouco; guardamos em memória por 10 minutos para
# não reler as 229 unidades a cada mensagem (a instância da função é reusada
# entre chamadas enquanto está "quente").
_SEGUNDOS_CACHE_UNIDADES = 600
_cache_unidades: dict = {"carregado_em": 0.0, "unidades": []}
_cache_cidades: dict[str, tuple[float, float] | None] = {}
_cache_ruas: dict[str, tuple[float, float] | None] = {}


@dataclass
class Origem:
    """Ponto de partida para medir distâncias.

    so_centro_da_cidade=True quando só se sabe a cidade: aí o km até as
    unidades dessa mesma cidade não significa nada e não é informado.
    """
    coordenada: tuple[float, float]
    cidade: str
    descricao: str
    so_centro_da_cidade: bool


# Perguntas em que a resposta depende do cadastro atual de unidades. Nelas o
# modelo é obrigado a consultar a ferramenta: com o histórico da conversa
# salvo, ele tendia a copiar uma resposta antiga (ex.: de antes de as Etecs
# serem localizadas no mapa) em vez de buscar de novo.
_PADROES_BUSCA_DE_UNIDADES = re.compile(
    r"mais proxim|perto d[aeo]|proxim[oa] d[aeo] mim|na minha regiao|perto de casa"
    r"|onde (fica|ficam|tem|posso|consigo|da pra|da para)"
    r"|quais? (e a |sao as )?etecs?|que etecs?|etecs? que (tem|oferec)"
    r"|localizacao do meu perfil|minha localizacao"
)


def e_busca_de_unidades(mensagem: str) -> bool:
    return bool(_PADROES_BUSCA_DE_UNIDADES.search(normalizar(mensagem)))


# O botão só existe quando uma ferramenta o monta, mas o modelo às vezes
# responde pelo histórico e cita "o botão abaixo" sem ter chamado nenhuma.
# Nesses casos (ou quando o usuário pede a página dos cursos), o botão geral
# é incluído para a tela nunca prometer algo que não mostra.
_PADROES_RESPOSTA_CITA_BOTAO = re.compile(r"\bbotao\b.*\babaixo\b|\babaixo\b.*\bbotao\b")
_PADROES_PEDIDO_DA_PAGINA = re.compile(
    r"\b(pagina|link|site)\s+(com |de |dos |das )?(todos os |todas as )?(cursos|etecs|unidades)\b"
)


def garantir_botao_da_pagina_de_cursos(contexto: ContextoChat, mensagem: str, resposta: str) -> None:
    if contexto.links_para_interface:
        return
    if _PADROES_RESPOSTA_CITA_BOTAO.search(normalizar(resposta)) or _PADROES_PEDIDO_DA_PAGINA.search(normalizar(mensagem)):
        contexto.sugerir_link("Ver todos os cursos das Etecs", "cursos.html")


def normalizar(texto: str) -> str:
    sem_acento = "".join(
        c for c in unicodedata.normalize("NFD", texto or "") if unicodedata.category(c) != "Mn"
    )
    return re.sub(r"[^a-z0-9]+", " ", sem_acento.lower()).strip()


def distancia_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Distância em linha reta (Haversine)."""
    rad = math.radians
    d_lat = rad(lat2 - lat1)
    d_lng = rad(lng2 - lng1)
    h = math.sin(d_lat / 2) ** 2 + math.cos(rad(lat1)) * math.cos(rad(lat2)) * math.sin(d_lng / 2) ** 2
    return 2 * 6371 * math.asin(math.sqrt(h))


# ------------------------------------------------------------------
# Dados das unidades
# ------------------------------------------------------------------
def _carregar_unidades() -> list[dict]:
    agora = time.time()
    if _cache_unidades["unidades"] and agora - _cache_unidades["carregado_em"] < _SEGUNDOS_CACHE_UNIDADES:
        return _cache_unidades["unidades"]

    unidades = []
    for documento in firestore.client().collection("etecs").stream():
        dados = documento.to_dict() or {}
        localizacao = dados.get("localizacao") or {}
        unidades.append({
            "nome": dados.get("nome", ""),
            "municipio": dados.get("municipio", ""),
            "endereco": dados.get("endereco", ""),
            "telefone": dados.get("telefone", ""),
            "cursos": [c for c in (dados.get("cursos") or []) if isinstance(c, dict) and c.get("nome")],
            "lat": localizacao.get("lat"),
            "lng": localizacao.get("lng"),
            "precisao": localizacao.get("precisao"),
        })

    _cache_unidades.update(carregado_em=agora, unidades=unidades)
    return unidades


# ------------------------------------------------------------------
# Geocodificação (OpenStreetMap / ViaCEP)
# ------------------------------------------------------------------
def _nominatim(parametros: dict) -> list[dict]:
    try:
        resposta = requests.get(
            "https://nominatim.openstreetmap.org/search",
            params={"format": "jsonv2", "limit": 3, "addressdetails": 1, "countrycodes": "br", **parametros},
            headers={"User-Agent": USER_AGENT},
            timeout=8,
        )
        return resposta.json() if resposta.ok else []
    except (requests.RequestException, ValueError):
        return []


def _mesma_cidade_do_resultado(resultado: dict, cidade: str) -> bool:
    endereco = resultado.get("address") or {}
    nome = endereco.get("city") or endereco.get("town") or endereco.get("village") or endereco.get("municipality") or ""
    return normalizar(nome) == normalizar(cidade)


def _coordenadas_da_cidade(cidade: str) -> tuple[float, float] | None:
    chave = normalizar(cidade)
    if chave not in _cache_cidades:
        achado = next((r for r in _nominatim({"city": cidade, "state": "São Paulo"})
                       if _mesma_cidade_do_resultado(r, cidade)), None)
        _cache_cidades[chave] = (float(achado["lat"]), float(achado["lon"])) if achado else None
    return _cache_cidades[chave]


def _coordenadas_da_rua(rua: str, cidade: str) -> tuple[float, float] | None:
    # Só rua e cidade, nunca o número da casa; arredondado a ~100 m.
    chave = f"{normalizar(rua)}|{normalizar(cidade)}"
    if chave not in _cache_ruas:
        achado = next((r for r in _nominatim({"street": rua, "city": cidade, "state": "São Paulo"})
                       if _mesma_cidade_do_resultado(r, cidade)), None)
        _cache_ruas[chave] = (round(float(achado["lat"]), 3), round(float(achado["lon"]), 3)) if achado else None
    return _cache_ruas[chave]


def _endereco_pelo_cep(cep: str) -> tuple[str, str]:
    """Devolve (cidade, rua) a partir do CEP, ou ("", "")."""
    digitos = re.sub(r"\D", "", cep or "")
    if len(digitos) != 8:
        return "", ""
    try:
        resposta = requests.get(f"https://viacep.com.br/ws/{digitos}/json/", timeout=6)
        dados = resposta.json() if resposta.ok else {}
        if dados.get("erro"):
            return "", ""
        return dados.get("localidade", ""), dados.get("logradouro", "")
    except (requests.RequestException, ValueError):
        return "", ""


# ------------------------------------------------------------------
# Ponto de partida
# ------------------------------------------------------------------
def _origem_da_cidade(cidade: str, descricao: str) -> Origem | None:
    coordenada = _coordenadas_da_cidade(cidade)
    return Origem(coordenada, cidade, descricao, so_centro_da_cidade=True) if coordenada else None


def _origem_do_usuario(contexto: ContextoChat) -> tuple[Origem | None, str]:
    """Devolve (origem, "") ou (None, mensagem para o modelo)."""
    perfil = firestore.client().collection("usuarios").document(contexto.id_usuario).get()
    dados = (perfil.to_dict() or {}) if perfil.exists else {}

    permissao = (dados.get("permissoes") or {}).get("localizacaoChatbot") or {}
    if permissao.get("concedida") is not True:
        contexto.pedir_acao(ACAO_PEDIR_PERMISSAO_LOCALIZACAO)
        return None, (
            "PERMISSAO_NECESSARIA: o usuário ainda não autorizou o assistente a usar a localização do perfil. "
            "Não use, não deduza e não invente a localização dele. Em uma frase curta, explique que precisa dessa "
            "permissão para encontrar as Etecs mais próximas e que a tela vai mostrar os botões Permitir e Agora não. "
            "Diga também que, se preferir, ele pode apenas informar a cidade."
        )

    cidade = dados.get("cidade", "")
    rua = dados.get("rua", "")
    if not cidade or not rua:
        cidade_cep, rua_cep = _endereco_pelo_cep(dados.get("cep", ""))
        cidade = cidade or cidade_cep
        rua = rua or rua_cep

    localizacao = dados.get("localizacao") or {}
    if localizacao.get("lat") is not None and localizacao.get("precisao") != "cidade":
        return Origem((localizacao["lat"], localizacao["lng"]), cidade, "do endereço do perfil do usuário", False), ""

    # Contas antigas só têm o CEP/rua: localiza a rua aqui mesmo, sem depender
    # de a pessoa ter visitado a home do site antes.
    if rua and cidade:
        coordenada = _coordenadas_da_rua(rua, cidade)
        if coordenada:
            return Origem(coordenada, cidade, "do endereço do perfil do usuário", False), ""

    if cidade:
        origem = _origem_da_cidade(cidade, f"da cidade do perfil do usuário ({cidade})")
        if origem:
            return origem, ""

    return None, (
        "O perfil do usuário não tem endereço suficiente para calcular distâncias. "
        "Peça para ele informar a cidade onde mora."
    )


# ------------------------------------------------------------------
# Formatação
# ------------------------------------------------------------------
def _formatar_km(km: float) -> str:
    return "a menos de 1 km" if km < 1 else ("a " + f"{km:.1f} km".replace(".", ","))


def _bairro(endereco: str) -> str:
    # "Rua Nova Granada, 35 - Casa Verde - CEP: 02522-050 - São Paulo/SP" -> "Casa Verde"
    for trecho in re.split(r"\s[-–]\s", endereco or "")[1:]:
        trecho = trecho.strip()
        if trecho and "cep" not in trecho.lower() and not re.search(r"\d{5}-?\d{3}|/SP", trecho):
            return trecho
    return ""


def _descrever_unidade(unidade: dict, cursos_encontrados: list[dict], km: float | None) -> str:
    local = ", ".join(filter(None, [_bairro(unidade["endereco"]), unidade["municipio"]]))
    partes = [f"- {unidade['nome']}", local]
    if km is not None:
        partes.append(_formatar_km(km))
    modalidades = sorted({c.get("categoria", "") for c in cursos_encontrados if c.get("categoria")})
    if modalidades:
        partes.append("modalidades: " + "; ".join(modalidades))
    if unidade["telefone"]:
        partes.append(f"tel. {unidade['telefone']}")
    return " | ".join(filter(None, partes))


AVISO_BOTAO = "A tela mostra um botão abaixo da resposta que abre a página do site com todas as unidades; mencione isso sem escrever o endereço."


def _sugerir_pagina_de_cursos(contexto: ContextoChat, termo_curso: str, candidatas: list, cidade: str) -> None:
    """Botão para cursos.html já filtrada (a página ordena pela distância para quem está logado)."""
    if termo_curso:
        nomes = [c["nome"] for _, encontrados in candidatas for c in encontrados]
        exato = next((n for n in nomes if normalizar(n) == termo_curso), None)
        # sem nome exato (ex.: "informática" pega também "Informática para Internet"),
        # o termo digitado filtra todas as variações na página
        filtro = exato or termo_curso
        rotulo = exato or termo_curso.title()
        contexto.sugerir_link(f"Ver todas as Etecs com {rotulo}", f"cursos.html?curso={quote(filtro)}")
    elif cidade:
        contexto.sugerir_link(f"Ver as Etecs de {cidade}", f"cursos.html?curso={quote(cidade)}")


# ------------------------------------------------------------------
# Ferramenta
# ------------------------------------------------------------------
@function_tool
def buscar_etecs_com_curso(
    ctx: RunContextWrapper[ContextoChat],
    curso: str = "",
    cidade: str = "",
    perto_do_usuario: bool = False,
) -> str:
    """Consulta o cadastro oficial de unidades Etec do Futuro+ e devolve as que oferecem um curso, das mais próximas para as mais distantes quando houver um ponto de referência.

    Args:
        curso: Nome do curso como o usuário escreveu (ex.: "enfermagem", "desenvolvimento de sistemas"). Vazio para não filtrar por curso.
        cidade: Cidade citada pelo usuário na conversa (ex.: "Santos"). Vazio se ele não citou cidade.
        perto_do_usuario: true quando o usuário pedir Etecs perto dele ("perto de mim", "mais próxima") sem informar a cidade.
    """
    termo = normalizar(curso)
    candidatas = []
    for unidade in _carregar_unidades():
        encontrados = [c for c in unidade["cursos"] if termo in normalizar(c["nome"])] if termo else []
        if encontrados or not termo:
            candidatas.append((unidade, encontrados))

    if not candidatas:
        ctx.context.sugerir_link("Ver todos os cursos das Etecs", "cursos.html")
        return (
            f"Nenhuma Etec do cadastro oferece um curso chamado '{curso}'. Sugira conferir o nome do curso. "
            + AVISO_BOTAO
        )

    descricao_curso = f" oferecem '{curso}'" if termo else " foram encontradas"
    total = f"{len(candidatas)} unidade(s){descricao_curso} no cadastro."

    origem = None
    if cidade.strip():
        origem = _origem_da_cidade(cidade.strip(), f"da cidade {cidade.strip()}")
        if origem is None:
            na_cidade = [(u, c) for u, c in candidatas if normalizar(u["municipio"]) == normalizar(cidade)]
            if not na_cidade:
                return f"Não encontrei a cidade '{cidade}'. Peça para o usuário conferir o nome da cidade."
            _sugerir_pagina_de_cursos(ctx.context, termo, na_cidade, cidade.strip())
            linhas = [_descrever_unidade(u, c, None) for u, c in sorted(na_cidade, key=lambda i: i[0]["nome"])]
            return f"{total} Em {cidade}:\n" + "\n".join(linhas[:MAXIMO_UNIDADES_NA_RESPOSTA]) + "\n" + AVISO_BOTAO
    elif perto_do_usuario:
        origem, mensagem = _origem_do_usuario(ctx.context)
        if origem is None:
            return mensagem

    _sugerir_pagina_de_cursos(ctx.context, termo, candidatas, cidade.strip())

    if origem is None:
        linhas = [_descrever_unidade(u, c, None) for u, c in sorted(candidatas, key=lambda i: i[0]["nome"])]
        return (
            f"{total} Exemplos:\n" + "\n".join(linhas[:MAXIMO_UNIDADES_NA_RESPOSTA])
            + "\nPara indicar as mais próximas, pergunte a cidade do usuário ou se ele quer usar a localização do perfil. "
            + AVISO_BOTAO
        )

    # Separa as unidades em: distância conhecida, mesma cidade sem distância
    # útil e distância desconhecida. As desconhecidas nunca entram como
    # "mais próximas": sem coordenada, qualquer ordem seria arbitrária.
    com_km, mesma_cidade, desconhecidas = [], [], []
    for unidade, encontrados in candidatas:
        na_mesma_cidade = normalizar(unidade["municipio"]) == normalizar(origem.cidade)
        # coordenada que é só o centro da cidade (da pessoa ou da unidade) não
        # diz nada sobre distância dentro dessa própria cidade
        if na_mesma_cidade and (origem.so_centro_da_cidade or unidade.get("precisao") == "cidade"):
            mesma_cidade.append((None, unidade, encontrados))
        elif unidade["lat"] is not None:
            km = distancia_km(origem.coordenada[0], origem.coordenada[1], unidade["lat"], unidade["lng"])
            com_km.append((km, unidade, encontrados))
        elif na_mesma_cidade:
            mesma_cidade.append((None, unidade, encontrados))
        else:
            desconhecidas.append(unidade)

    com_km.sort(key=lambda item: item[0])
    mesma_cidade.sort(key=lambda item: item[1]["nome"])

    # Unidades da mesma cidade sem distância só entram se couberem todas na
    # resposta (cidade pequena). Numa cidade como São Paulo, com dezenas de
    # Etecs, escolher 3 sem saber a distância seria arbitrário.
    mesma_cidade_cabe_inteira = len(mesma_cidade) <= MAXIMO_UNIDADES_NA_RESPOSTA
    if mesma_cidade and not mesma_cidade_cabe_inteira and (origem.so_centro_da_cidade or not com_km):
        return (
            f"{total} Há {len(mesma_cidade)} delas em {origem.cidade}, mas "
            + ("sem um endereço não dá para saber quais ficam mais perto. Sugira permitir o uso da localização do perfil "
               if origem.so_centro_da_cidade else
               "as unidades ainda não foram localizadas no mapa, então não dá para dizer quais são as mais próximas agora. Diga isso com honestidade ")
            + "e diga que o botão abaixo da resposta abre a página do site com todas elas (sem escrever o endereço)."
        )

    if origem.so_centro_da_cidade:
        selecionadas = mesma_cidade + com_km
    else:
        selecionadas = com_km + (mesma_cidade if mesma_cidade_cabe_inteira else [])
    selecionadas = selecionadas[:MAXIMO_UNIDADES_NA_RESPOSTA]

    if not selecionadas:
        return (
            f"{total} Mas as unidades ainda não foram localizadas no mapa, então não dá para dizer quais são as mais "
            "próximas agora. Diga isso ao usuário com honestidade. " + AVISO_BOTAO
        )

    linhas = [_descrever_unidade(u, c, km) for km, u, c in selecionadas]
    resposta = f"{total} As mais próximas {origem.descricao}:\n" + "\n".join(linhas)

    ficou_de_fora_sem_localizacao = bool(desconhecidas) or (not mesma_cidade_cabe_inteira and not origem.so_centro_da_cidade)
    if ficou_de_fora_sem_localizacao:
        resposta += (
            "\nAtenção: parte das unidades ainda não tem localização precisa no mapa, então a ordem pode não estar completa. "
            "Mencione isso em poucas palavras."
        )
    return resposta + "\nDistâncias em linha reta, não o trajeto. " + AVISO_BOTAO
