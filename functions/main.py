import io
import json
import re
import zipfile
from datetime import datetime, timezone

import requests
import firebase_admin
from firebase_admin import firestore, auth as firebase_auth, storage
from firebase_functions import https_fn, options, scheduler_fn

# Inicializa o Firebase apenas uma vez e de forma leve
if not firebase_admin._apps:
    firebase_admin.initialize_app()

@https_fn.on_request(
    cors=options.CorsOptions(cors_origins="*", cors_methods=["get", "post"]),
    # São Paulo em vez do padrão (Iowa, EUA) — reduz a latência de rede pra
    # quem acessa do Brasil.
    region=options.SupportedRegion.SOUTHAMERICA_EAST1,
    # Limita quantas cópias da função podem rodar ao mesmo tempo. Evita que um
    # pico de acessos (ou uso malicioso) gere uma fatura alta de uma vez.
    # Ajuste esse número conforme o uso real do site crescer.
    max_instances=10,
    # O padrão (256 MiB) não é suficiente para essa stack (openai-agents,
    # google-cloud, grpcio) — os logs mostravam "Memory limit exceeded"
    # derrubando a instância no meio de várias respostas.
    memory=options.MemoryOption.MB_512,
    secrets=["OPENAI_API_KEY", "TAVILY_API_KEY", "ASSISTANT_ID", "VECTOR_STORE_ID"],
)
def chat_bot(req: https_fn.Request) -> https_fn.Response:
    if req.method == "OPTIONS":
        return https_fn.Response(status=204)

    # Exige login: só quem está autenticado no site (Firebase Auth) pode
    # chamar o chatbot. Sem isso, qualquer pessoa que descobrisse essa URL
    # conseguiria usar sem passar pelo site, gastando seu crédito de API.
    cabecalho_auth = req.headers.get("Authorization", "")
    if not cabecalho_auth.startswith("Bearer "):
        return https_fn.Response(json.dumps({"erro": "Não autenticado."}), status=401)

    token = cabecalho_auth.removeprefix("Bearer ").strip()
    try:
        token_decodificado = firebase_auth.verify_id_token(token)
        id_usuario = token_decodificado["uid"]
    except Exception:
        return https_fn.Response(json.dumps({"erro": "Sessão inválida ou expirada. Faça login novamente."}), status=401)

    try:
        # 1. Deixamos a conexão do banco para acontecer só quando a função for chamada
        db = firestore.client()

        # 2. Importamos o seu chatbot AQUI DENTRO para não travar a inicialização do Firebase!
        from agents import Runner, RunConfig, ModelSettings, InputGuardrailTripwireTriggered, OutputGuardrailTripwireTriggered
        from agentes import agente_orquestrador
        from firestore_session import FirestoreSession
        from contexto_chat import ContextoChat
        from ferramentas_unidades import e_busca_de_unidades, garantir_botao_da_pagina_de_cursos
        from tools import garantir_botao_de_inscricao

        dados = req.get_json()
        if not dados:
            return https_fn.Response(json.dumps({"erro": "Nenhum dado recebido"}), status=400)

        mensagem = dados.get("mensagem", "")

        if not mensagem:
            return https_fn.Response(json.dumps({"erro": "A mensagem não pode estar vazia"}), status=400)

        # Um objeto Agent da SDK não é chamável diretamente (ex: agente(msg) dava
        # erro "'Agent' object is not callable"). É preciso executá-lo com Runner.
        # A sessão fica gravada no Firestore, um documento por id_usuario, então
        # o histórico de cada aluno persiste na nuvem entre chamadas — sem
        # depender de arquivo local, que se perde a cada cold start da função.
        session = FirestoreSession(session_id=id_usuario, db=db)

        # O contexto leva o uid até as ferramentas (ex.: ler a localização do
        # perfil) e traz de volta pedidos para a tela (ex.: botões de permissão).
        contexto = ContextoChat(id_usuario=id_usuario)

        # Em perguntas sobre localizar Etecs, obriga a consultar o cadastro
        # atual em vez de repetir uma resposta antiga do histórico. O SDK
        # desliga essa obrigação sozinho depois da primeira chamada da
        # ferramenta, então não há risco de ficar chamando em loop.
        configuracao = None
        if e_busca_de_unidades(mensagem):
            configuracao = RunConfig(model_settings=ModelSettings(tool_choice="buscar_etecs_com_curso"))

        try:
            resultado = Runner.run_sync(
                agente_orquestrador, mensagem, session=session, context=contexto, run_config=configuracao
            )
        except InputGuardrailTripwireTriggered:
            return https_fn.Response(
                json.dumps({"resposta": "Desculpe, não posso ajudar com esse tipo de mensagem. Posso te ajudar com dúvidas sobre o vestibular da ETEC ou FATEC?"}),
                status=200,
                headers={"Content-Type": "application/json"}
            )
        except OutputGuardrailTripwireTriggered:
            return https_fn.Response(
                json.dumps({"resposta": "Desculpe, não consegui gerar uma resposta segura para essa pergunta. Pode tentar reformular?"}),
                status=200,
                headers={"Content-Type": "application/json"}
            )

        # Extrai a resposta final do agente
        resposta_texto = getattr(resultado, "final_output", None) or str(resultado)
        garantir_botao_de_inscricao(contexto, resposta_texto)
        garantir_botao_da_pagina_de_cursos(contexto, mensagem, resposta_texto)

        # Registra só o caminho da execução (agente final, handoffs e ferramentas
        # chamadas), sem o conteúdo da conversa, para diagnosticar roteamento
        # pelos logs da função.
        try:
            etapas = [
                f"{type(item).__name__}:{item.raw_item.name}"
                for item in resultado.new_items
                if type(item).__name__ in ("ToolCallItem", "HandoffCallItem") and getattr(item.raw_item, "name", None)
            ]
            print(json.dumps({
                "diagnostico_chat": True,
                "agente_final": resultado.last_agent.name,
                "etapas": etapas,
                "acoes": contexto.acoes_para_interface,
                "links": [link["url"] for link in contexto.links_para_interface],
            }))
        except Exception as erro_diagnostico:
            print(f"Não foi possível resumir a execução: {erro_diagnostico}")

        return https_fn.Response(
            json.dumps({
                "resposta": resposta_texto,
                "acoes": contexto.acoes_para_interface,
                "links": contexto.links_para_interface,
            }),
            status=200,
            headers={"Content-Type": "application/json"}
        )

    except Exception as e:
        print(f"Erro no servidor: {e}")
        return https_fn.Response(json.dumps({"erro": f"Erro interno: {str(e)}"}), status=500)


# Domínio oficial do CPS onde os pacotes .zip de logotipo das Etecs ficam
# hospedados. Só baixamos arquivos desse domínio para essa função não virar
# um proxy aberto para baixar qualquer URL arbitrária.
DOMINIOS_ZIP_PERMITIDOS = ("blob.core.windows.net",)


@https_fn.on_request(
    cors=options.CorsOptions(cors_origins="*", cors_methods=["get", "post"]),
    region=options.SupportedRegion.SOUTHAMERICA_EAST1,
    max_instances=10,
    memory=options.MemoryOption.MB_256,
)
def extrair_logo_etec(req: https_fn.Request) -> https_fn.Response:
    """Baixa o .zip de logotipo de uma Etec (hospedado no CPS), extrai a
    versão colorida (\"_cor.png\") e sobe pro Firebase Storage, retornando a
    URL pública da imagem. Usado pelo CMS de unidades ETEC para preencher o
    logotipo automaticamente durante a importação do CSV."""
    if req.method == "OPTIONS":
        return https_fn.Response(status=204)

    cabecalho_auth = req.headers.get("Authorization", "")
    if not cabecalho_auth.startswith("Bearer "):
        return https_fn.Response(json.dumps({"erro": "Não autenticado."}), status=401)

    token = cabecalho_auth.removeprefix("Bearer ").strip()
    try:
        token_decodificado = firebase_auth.verify_id_token(token)
        id_usuario = token_decodificado["uid"]
    except Exception:
        return https_fn.Response(json.dumps({"erro": "Sessão inválida ou expirada. Faça login novamente."}), status=401)

    try:
        db = firestore.client()
        perfil = db.collection("usuarios").document(id_usuario).get()
        if not perfil.exists or perfil.to_dict().get("admin") is not True:
            return https_fn.Response(json.dumps({"erro": "Acesso restrito a administradores."}), status=403)

        dados = req.get_json(silent=True) or {}
        zip_url = (dados.get("zipUrl") or "").strip()
        codigo = (dados.get("codigo") or "").strip()

        if not zip_url or not codigo:
            return https_fn.Response(json.dumps({"erro": "Parâmetros 'zipUrl' e 'codigo' são obrigatórios."}), status=400)

        if not zip_url.lower().startswith("https://") or not any(dominio in zip_url for dominio in DOMINIOS_ZIP_PERMITIDOS):
            return https_fn.Response(json.dumps({"erro": "URL de origem não permitida."}), status=400)

        codigo_seguro = re.sub(r"[^a-zA-Z0-9_-]", "_", codigo)

        resposta = requests.get(zip_url, timeout=25)
        resposta.raise_for_status()

        with zipfile.ZipFile(io.BytesIO(resposta.content)) as arquivo_zip:
            candidatos = [
                nome for nome in arquivo_zip.namelist()
                if not nome.startswith("__MACOSX") and nome.lower().endswith(".png")
            ]
            escolhido = (
                next((n for n in candidatos if re.search(r"_cor\.png$", n, re.IGNORECASE)), None)
                or next((n for n in candidatos if re.search(r"_pb\.png$", n, re.IGNORECASE)), None)
                or (candidatos[0] if candidatos else None)
            )

            if not escolhido:
                return https_fn.Response(json.dumps({"erro": "Nenhuma imagem PNG encontrada no arquivo."}), status=404)

            conteudo_imagem = arquivo_zip.read(escolhido)

        bucket = storage.bucket("futuroplus-bce54.firebasestorage.app")
        blob = bucket.blob(f"etecs-logos/{codigo_seguro}.png")
        blob.upload_from_string(conteudo_imagem, content_type="image/png")
        blob.make_public()

        return https_fn.Response(
            json.dumps({"url": blob.public_url}),
            status=200,
            headers={"Content-Type": "application/json"}
        )

    except requests.RequestException as e:
        return https_fn.Response(json.dumps({"erro": f"Erro ao baixar o arquivo de origem: {str(e)}"}), status=502)
    except zipfile.BadZipFile:
        return https_fn.Response(json.dumps({"erro": "O arquivo baixado não é um .zip válido."}), status=422)
    except Exception as e:
        print(f"Erro ao extrair logo: {e}")
        return https_fn.Response(json.dumps({"erro": f"Erro interno: {str(e)}"}), status=500)


def _excluir_conta_por_completo(db, uid):
    """Apaga os certificados (Firestore + Storage) e remove o perfil e a
    conta de Auth. Usa o Admin SDK, que não exige login recente —
    diferente do delete que o próprio usuário faria pelo navegador, aqui
    ninguém está logado para reautenticar."""
    bucket = storage.bucket("futuroplus-bce54.firebasestorage.app")

    certificados_ref = db.collection("usuarios").document(uid).collection("certificados")
    for cert_doc in certificados_ref.stream():
        caminho = (cert_doc.to_dict() or {}).get("caminho")
        if caminho:
            try:
                bucket.blob(caminho).delete()
            except Exception as erro_storage:
                print(f"Erro ao apagar certificado {caminho} de {uid}: {erro_storage}")
        cert_doc.reference.delete()

    db.collection("usuarios").document(uid).delete()

    try:
        firebase_auth.delete_user(uid)
    except firebase_auth.UserNotFoundError:
        pass


@scheduler_fn.on_schedule(
    # Uma vez por dia é suficiente pra um prazo de 30 dias, e mantém o custo
    # da função (Cloud Scheduler + execuções) praticamente zero.
    schedule="every 24 hours",
    region=options.SupportedRegion.SOUTHAMERICA_EAST1,
    memory=options.MemoryOption.MB_256,
)
def excluir_contas_agendadas(event: scheduler_fn.ScheduledEvent) -> None:
    """Apaga de vez as contas cujo prazo de 30 dias pedido pelo próprio
    usuário (perfil.js) já venceu. Quem volta a logar antes do prazo tem o
    pedido cancelado por dashboard.js, então só sobra aqui quem não voltou."""
    db = firestore.client()
    agora = datetime.now(timezone.utc).isoformat()

    consulta = db.collection("usuarios").where("exclusao.executarEm", "<=", agora).stream()
    for doc_usuario in consulta:
        try:
            _excluir_conta_por_completo(db, doc_usuario.id)
            print(f"Conta {doc_usuario.id} excluída (prazo de exclusão vencido).")
        except Exception as erro:
            print(f"Erro ao excluir a conta {doc_usuario.id}: {erro}")

def _exigir_admin(req, db):
    """Devolve (uid, None) quando quem chama é administrador, ou (None,
    resposta de erro) para devolver na hora."""
    cabecalho_auth = req.headers.get("Authorization", "")
    if not cabecalho_auth.startswith("Bearer "):
        return None, https_fn.Response(json.dumps({"erro": "Não autenticado."}), status=401)

    try:
        uid = firebase_auth.verify_id_token(cabecalho_auth.removeprefix("Bearer ").strip())["uid"]
    except Exception:
        return None, https_fn.Response(json.dumps({"erro": "Sessão inválida ou expirada. Faça login novamente."}), status=401)

    perfil = db.collection("usuarios").document(uid).get()
    if not perfil.exists or perfil.to_dict().get("admin") is not True:
        return None, https_fn.Response(json.dumps({"erro": "Acesso restrito a administradores."}), status=403)
    return uid, None


@https_fn.on_request(
    cors=options.CorsOptions(cors_origins="*", cors_methods=["get", "post"]),
    region=options.SupportedRegion.SOUTHAMERICA_EAST1,
    # Só o painel admin chama, e uma coleta por vez.
    max_instances=2,
    memory=options.MemoryOption.MB_256,
    # Um semestre da Etec são umas 400 páginas; leva menos de um minuto, mas
    # o padrão de 60 s ficaria no limite num dia em que o site estiver lento.
    timeout_sec=300,
)
def coletar_demanda(req: https_fn.Request) -> https_fn.Response:
    """Busca a demanda (inscritos por vaga) nos sites do Vestibulinho das
    Etecs e do Vestibular das Fatecs e grava no Firestore. Chamada pelo botão
    "Atualizar demanda" do painel Admin · Cursos.

    acao "situacao": quais semestres os sites oferecem e quais já foram
    coletados. acao "coletar" (com "site" e "semestre"): coleta um semestre de
    um site, soma por curso e grava em cursos/{id}.demanda; o detalhe por
    unidade fica em demanda/{site}-{semestre}/unidades."""
    if req.method == "OPTIONS":
        return https_fn.Response(status=204)

    cabecalho_json = {"Content-Type": "application/json"}
    try:
        db = firestore.client()
        _, erro = _exigir_admin(req, db)
        if erro:
            return erro

        import demanda
        import demanda_firestore

        dados = req.get_json(silent=True) or {}
        acao = dados.get("acao") or "situacao"

        if acao == "situacao":
            coletados = {}
            for registro in db.collection("demanda").stream():
                info = registro.to_dict() or {}
                if info.get("site") and info.get("semestre"):
                    coletados.setdefault(info["site"], {})[info["semestre"]] = {
                        "coletadoEm": info.get("coletadoEm"),
                        "cursos": info.get("cursos", 0),
                        "unidades": info.get("unidades", 0),
                        "semPar": info.get("semPar", []),
                    }
            disponiveis = {site: demanda.listar_semestres(site) for site in demanda.SITES}
            return https_fn.Response(
                json.dumps({"disponiveis": disponiveis, "coletados": coletados}),
                status=200, headers=cabecalho_json,
            )

        if acao != "coletar":
            return https_fn.Response(json.dumps({"erro": "Ação desconhecida."}), status=400)

        site = (dados.get("site") or "").strip().lower()
        semestre = str(dados.get("semestre") or "").strip()
        if site not in demanda.SITES or not re.fullmatch(r"\d{4}[12]", semestre):
            return https_fn.Response(json.dumps({"erro": "Informe 'site' (etec ou fatec) e 'semestre' (ex.: 20261)."}), status=400)

        coleta = demanda.coletar(site, semestre)
        if not coleta["unidades"]:
            return https_fn.Response(
                json.dumps({"erro": "O site não devolveu nenhuma unidade para esse semestre."}),
                status=502, headers=cabecalho_json,
            )

        resumo = demanda_firestore.gravar_coleta(db, site, semestre, coleta)

        return https_fn.Response(json.dumps(resumo), status=200, headers=cabecalho_json)

    except requests.RequestException as e:
        return https_fn.Response(
            json.dumps({"erro": f"O site do vestibular não respondeu: {str(e)}"}),
            status=502, headers=cabecalho_json,
        )
    except Exception as e:
        print(f"Erro ao coletar demanda: {e}")
        return https_fn.Response(json.dumps({"erro": f"Erro interno: {str(e)}"}), status=500, headers=cabecalho_json)


# Capas da página do curso: uma por eixo tecnológico e, se quiser, uma só de
# um curso. Formatos que o navegador mostra direto; o painel já manda a imagem
# reduzida e em WebP, então 4 MB é folga.
TIPOS_DE_CAPA = {"image/webp": "webp", "image/jpeg": "jpg", "image/png": "png"}
TAMANHO_MAXIMO_CAPA = 4 * 1024 * 1024


@https_fn.on_request(
    cors=options.CorsOptions(cors_origins="*", cors_methods=["get", "post"]),
    region=options.SupportedRegion.SOUTHAMERICA_EAST1,
    max_instances=3,
    memory=options.MemoryOption.MB_256,
)
def enviar_capa(req: https_fn.Request) -> https_fn.Response:
    """Guarda no Storage a imagem de capa enviada pelo painel Admin · Cursos e
    devolve o endereço público dela.

    alvo "eixo": a capa vale para todos os cursos do eixo, e o endereço fica
    em configuracoes/capas (lido pela página do curso). acao "remover" tira a
    imagem do eixo, que volta para a capa desenhada.
    alvo "curso": só devolve o endereço; quem grava no curso é o formulário
    do painel, ao salvar."""
    if req.method == "OPTIONS":
        return https_fn.Response(status=204)

    cabecalho_json = {"Content-Type": "application/json"}

    def responder(dados, status=200):
        return https_fn.Response(json.dumps(dados), status=status, headers=cabecalho_json)

    try:
        db = firestore.client()
        _, erro = _exigir_admin(req, db)
        if erro:
            return erro

        dados = req.get_json(silent=True) or {}
        alvo = (dados.get("alvo") or "").strip()
        identificador = re.sub(r"[^a-z0-9-]", "", (dados.get("id") or "").strip().lower())[:120]
        if alvo not in ("eixo", "curso") or not identificador:
            return responder({"erro": "Informe 'alvo' (eixo ou curso) e 'id'."}, 400)

        bucket = storage.bucket("futuroplus-bce54.firebasestorage.app")
        pasta = f"capas/{alvo}s"
        registro = db.collection("configuracoes").document("capas")

        if dados.get("acao") == "remover":
            if alvo != "eixo":
                return responder({"erro": "Só a capa de um eixo é removida por aqui."}, 400)
            for extensao in TIPOS_DE_CAPA.values():
                try:
                    bucket.blob(f"{pasta}/{identificador}.{extensao}").delete()
                except Exception:
                    pass  # não existia nesse formato
            registro.set({"eixos": {identificador: firestore.DELETE_FIELD}}, merge=True)
            return responder({"removida": True})

        tipo = (dados.get("tipo") or "").strip().lower()
        if tipo not in TIPOS_DE_CAPA:
            return responder({"erro": "Envie uma imagem WebP, JPG ou PNG."}, 400)

        import base64
        import binascii
        try:
            conteudo = base64.b64decode(dados.get("imagem") or "", validate=True)
        except (binascii.Error, ValueError):
            return responder({"erro": "A imagem chegou corrompida. Tente enviar de novo."}, 400)
        if not conteudo:
            return responder({"erro": "Nenhuma imagem recebida."}, 400)
        if len(conteudo) > TAMANHO_MAXIMO_CAPA:
            return responder({"erro": "A imagem passa de 4 MB."}, 413)

        blob = bucket.blob(f"{pasta}/{identificador}.{TIPOS_DE_CAPA[tipo]}")
        blob.cache_control = "public, max-age=86400"
        blob.upload_from_string(conteudo, content_type=tipo)
        blob.make_public()

        # O arquivo mantém o nome ao ser trocado; o "?v=" faz o navegador
        # buscar a versão nova em vez de mostrar a antiga guardada.
        agora = datetime.now(timezone.utc)
        url = f"{blob.public_url}?v={int(agora.timestamp())}"

        if alvo == "eixo":
            registro.set(
                {"eixos": {identificador: {"url": url, "atualizadoEm": agora.isoformat()}}},
                merge=True,
            )

        return responder({"url": url})

    except Exception as e:
        print(f"Erro ao enviar capa: {e}")
        return responder({"erro": f"Erro interno: {str(e)}"}, 500)
