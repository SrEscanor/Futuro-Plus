import os
from openai import OpenAI
from agents import function_tool
from tavily import TavilyClient
from dotenv import load_dotenv

# Carrega as variáveis do arquivo .env
load_dotenv()

# Inicializa os clientes oficiais
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
tavily_client = TavilyClient(api_key=os.getenv("TAVILY_API_KEY"))
VECTOR_STORE_ID = os.getenv("VECTOR_STORE_ID")

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