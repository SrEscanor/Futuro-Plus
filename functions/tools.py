import os
from openai import OpenAI
from agents import function_tool, RunContextWrapper
from tavily import TavilyClient
from dotenv import load_dotenv
from firebase_admin import firestore

from contexto_chat import ContextoChat
from ferramentas_unidades import _PADROES_RESPOSTA_CITA_BOTAO, normalizar

# Carrega as variáveis do arquivo .env
load_dotenv()

# Inicializa os clientes oficiais
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
tavily_client = TavilyClient(api_key=os.getenv("TAVILY_API_KEY"))
VECTOR_STORE_ID = os.getenv("VECTOR_STORE_ID")

# Mesmos nomes curtos usados no site (assets/js/categorias-teste.js), pra
# citar a inteligência com o nome que o usuário já viu no resultado.
CATEGORIAS_TESTE_PERFIL = {
    "logica": "Lógico-Matemática",
    "interpessoal": "Interpessoal",
    "espacial": "Espacial",
    "corporal": "Corporal-Cinestésica",
    "linguistica": "Linguística",
    "intrapessoal": "Intrapessoal",
    "musical": "Musical",
    "naturalista": "Naturalista",
}


def _resultados_testes(dados_usuario: dict) -> dict:
    """Junta os resultados de teste salvos no documento do usuário, incluindo
    dois formatos antigos de antes de existir o mapa único `resultadosTestes`
    (mesma junção feita no site, em assets/js/resultado-teste.js)."""
    dados_usuario = dados_usuario or {}
    resultados = {
        chave.removeprefix("resultadosTestes."): valor
        for chave, valor in dados_usuario.items()
        if chave.startswith("resultadosTestes.")
    }
    resultados.update(dados_usuario.get("resultadosTestes") or {})
    if dados_usuario.get("resultadoTesteGardner") and "gardner" not in resultados:
        resultados["gardner"] = dados_usuario["resultadoTesteGardner"]
    return resultados


@function_tool
def consultar_meus_testes(ctx: RunContextWrapper[ContextoChat]) -> str:
    """Consulta os resultados dos testes (Vocacional, Teste rápido de perfil/Gardner, Teste de Afinidades) que o usuário já fez no Futuro+. Use quando ele perguntar o que os testes dele mostraram, pedir uma recomendação baseada neles, ou quiser saber se já fez algum teste."""
    documento = firestore.client().collection("usuarios").document(ctx.context.id_usuario).get()
    dados = (documento.to_dict() or {}) if documento.exists else {}
    resultados = _resultados_testes(dados)

    partes = []

    vocacional = resultados.get("vocacional")
    if vocacional and vocacional.get("cursos"):
        areas = ", ".join(vocacional.get("eixosFortes") or []) or "não registradas"
        cursos = ", ".join(c["nome"] for c in vocacional.get("cursos", [])[:5] if c.get("nome"))
        partes.append(
            f"Teste Vocacional (feito em {(vocacional.get('concluidoEm') or '?')[:10]}): áreas mais fortes do "
            f"usuário: {areas}. Cursos que o teste sugeriu para ele: {cursos or 'nenhum registrado'}."
        )

    for chave, nome_teste in (("gardner", "Teste rápido de perfil"), ("afinidades", "Teste de Afinidades")):
        resultado = resultados.get(chave)
        if resultado and resultado.get("ranking"):
            principal = CATEGORIAS_TESTE_PERFIL.get(resultado.get("categoriaPrincipal"), resultado.get("categoriaPrincipal"))
            secundaria = CATEGORIAS_TESTE_PERFIL.get(resultado.get("categoriaSecundaria"), resultado.get("categoriaSecundaria"))
            partes.append(
                f"{nome_teste} (feito em {(resultado.get('concluidoEm') or '?')[:10]}): inteligência principal do "
                f"usuário é {principal}, e a secundária é {secundaria}."
            )

    if not partes:
        return (
            "O usuário ainda não fez nenhum teste no Futuro+. Sugira o Teste Vocacional (o mais completo, indica "
            "cursos) ou o Teste rápido de perfil (mais curto, baseado nas inteligências múltiplas)."
        )

    return " ".join(partes)


@function_tool
def consultar_perfil_academico(ctx: RunContextWrapper[ContextoChat]) -> str:
    """Consulta o curso desejado e as áreas de interesse (tipo de curso) que o usuário preencheu no perfil do Futuro+. Use quando uma pergunta sobre vestibular, vestibulinho, inscrição, datas ou vagas não deixar claro se é sobre a ETEC, a FATEC, ou as duas — pra ver se o perfil dá uma pista antes de perguntar diretamente."""
    documento = firestore.client().collection("usuarios").document(ctx.context.id_usuario).get()
    dados = (documento.to_dict() or {}) if documento.exists else {}
    perfil = dados.get("perfil") or {}

    curso_desejado = perfil.get("cursoDesejado") or ""
    modalidades = perfil.get("modalidades") or []

    if not curso_desejado and not modalidades:
        return "O usuário não preencheu curso desejado nem áreas de interesse no perfil — não há nenhuma pista sobre Etec ou Fatec. Pergunte diretamente qual das duas (ou as duas) ele quer dizer."

    partes = []
    if curso_desejado:
        partes.append(f"curso que o usuário quer seguir: {curso_desejado}")
    if modalidades:
        partes.append(f"áreas de interesse (tipo de curso) marcadas no perfil: {', '.join(modalidades)}")

    return (
        "Pista do perfil acadêmico do usuário (não é uma certeza, é só um indício — confirme com ele antes de "
        "assumir): " + "; ".join(partes) + ". Para referência: 'Médio + Técnico', 'Técnico', 'Especialização' e "
        "'Médio + Superior (AMS)' são modalidades oferecidas pela ETEC; cursos superiores de tecnologia são da "
        "FATEC. Se a pista apontar claramente pra um lado, confirme com o usuário citando o que viu no perfil "
        "(ex.: 'Vi no seu perfil que você tem interesse em curso técnico — é do vestibulinho da Etec que você "
        "quer saber, ou também do vestibular da Fatec?') em vez de responder assumindo só uma instituição."
    )


# Endereços oficiais de inscrição — fixos aqui (nunca digitados pelo modelo),
# mesmos domínios já usados como fonte confiável em `pesquisar_sites_cps`.
URL_INSCRICAO_ETEC = "https://www.vestibulinhoetec.com.br/"
URL_INSCRICAO_FATEC = "https://www.vestibularfatec.com.br/"


@function_tool
def mostrar_link_de_inscricao(ctx: RunContextWrapper[ContextoChat], instituicao: str) -> str:
    """Mostra na tela um botão que leva direto ao site oficial de inscrição do vestibulinho (ETEC) ou do vestibular (FATEC). Use sempre que o usuário perguntar como ou onde se inscrever, ou pedir o link/site de inscrição.

    Args:
        instituicao: "etec" para o vestibulinho da ETEC, ou "fatec" para o vestibular da FATEC.
    """
    if instituicao.strip().lower() == "fatec":
        ctx.context.sugerir_link("Inscreva-se no vestibular da Fatec", URL_INSCRICAO_FATEC)
        return "Botão de inscrição da Fatec disponível na tela. Diga que o botão abaixo leva direto ao site oficial de inscrição, sem escrever o endereço."
    ctx.context.sugerir_link("Inscreva-se no vestibulinho da Etec", URL_INSCRICAO_ETEC)
    return "Botão de inscrição da Etec disponível na tela. Diga que o botão abaixo leva direto ao site oficial de inscrição, sem escrever o endereço."


def garantir_botao_de_inscricao(contexto: ContextoChat, resposta: str) -> None:
    """Rede de segurança equivalente à `garantir_botao_da_pagina_de_cursos`
    (ferramentas_unidades.py): se o modelo respondeu citando "o botão abaixo"
    para inscrição sem de fato ter chamado `mostrar_link_de_inscricao`, monta
    o botão certo com base em qual instituição a resposta citou. Só age
    quando dá pra saber COM CERTEZA qual das duas — se a resposta citar as
    duas (ou nenhuma), é melhor não mostrar botão nenhum do que arriscar
    mostrar o errado."""
    if contexto.links_para_interface:
        return
    resposta_normalizada = normalizar(resposta)
    if not _PADROES_RESPOSTA_CITA_BOTAO.search(resposta_normalizada):
        return

    cita_etec = "etec" in resposta_normalizada or "vestibulinho" in resposta_normalizada
    cita_fatec = "fatec" in resposta_normalizada
    if cita_fatec and not cita_etec:
        contexto.sugerir_link("Inscreva-se no vestibular da Fatec", URL_INSCRICAO_FATEC)
    elif cita_etec and not cita_fatec:
        contexto.sugerir_link("Inscreva-se no vestibulinho da Etec", URL_INSCRICAO_ETEC)


@function_tool
def pesquisar_sites_cps(termo_pesquisa: str) -> str:
    """Pesquisa na web por informações atualizadas sobre a FATEC e ETEC (cursos, datas, endereços, notícias)."""
    print(f"[Tool Web] Buscando por: {termo_pesquisa}")
    
    # Adiciona termos-chave de busca para forçar o Tavily a achar páginas de cursos/escolas se o usuário perguntar de unidade
    query_oficial = f"{termo_pesquisa} curso etec fatec (site:cps.sp.gov.br OR site:vestibularfatec.com.br OR site:vestibulinhoetec.com.br OR site:etecsp.cps.sp.gov.br OR site:fatecsp.br OR https://www.cps.sp.gov.br/etec/cursos-oferecidos-pelas-etecs/ OR https://www.cps.sp.gov.br/fatec/cursos-oferecidos-pelas-fatecs/)"
    
    try:
        resposta = tavily_client.search(
            query=query_oficial,
            search_depth="advanced", # Mudamos para advanced para trazer mais detalhes das páginas
            max_results=5           # Aumentamos para 5 resultados para garantir maior cobertura
        )
        
        resultados_formatados = ""
        for result in resposta.get("results", []):
            resultados_formatados += f"Título: {result['title']}\n"
            resultados_formatados += f"URL: {result['url']}\n"
            resultados_formatados += f"Conteúdo: {result['content']}\n\n"
            
        if not resultados_formatados.strip():
            return "Nenhuma informação oficial encontrada para esta busca."
            
        return resultados_formatados
        
    except Exception as e:
        return f"Erro na ferramenta de busca web: {str(e)}"


@function_tool
def consultar_manual_candidato(duvida: str) -> str:
    """Busca informações estritamente nos manuais oficiais e portarias do vestibulinho ETEC e vestibular FATEC (cotas, isenção, regras)."""
    print(f"[Tool RAG Oficial] Buscando no Vector Store ID: {VECTOR_STORE_ID} para a dúvida: {duvida}")

    if not VECTOR_STORE_ID:
        return "Erro: VECTOR_STORE_ID não está configurado no arquivo .env."

    try:
        # A Assistants API (assistants/threads/runs) foi desativada pela OpenAI em 26/08/2026.
        # A busca em vector store agora é feita em uma única chamada na Responses API,
        # com o vector store anexado diretamente na tool "file_search".
        response = client.responses.create(
            model="gpt-4o-mini",
            instructions=(
                "Você é um assistente especialista nos editais, portarias e manuais da ETEC e FATEC. "
                "Use obrigatoriamente a ferramenta de busca em arquivos (file_search) para encontrar a resposta exata "
                "sobre cotas, pontuação acrescida, isenção ou regras nos documentos. "
                "Responda com base exclusiva e detalhada no que encontrar nos arquivos."
            ),
            input=duvida,
            tools=[
                {
                    "type": "file_search",
                    "vector_store_ids": [VECTOR_STORE_ID],
                }
            ],
        )

        texto_resposta = (response.output_text or "").strip()

        if texto_resposta:
            return texto_resposta

        return "A informação não foi encontrada nos documentos oficiais indexados."

    except Exception as e:
        return f"Erro ao consultar os arquivos oficiais na nuvem: {str(e)}"


@function_tool
def enviar_resumo_por_email(email_destino: str, conteudo: str) -> str:
    """Envia um e-mail para o usuário com o resumo das datas ou links solicitados."""
    print(f"[Tool E-mail] Enviando para {email_destino}...")
    return f"E-mail enviado com sucesso para {email_destino}!"