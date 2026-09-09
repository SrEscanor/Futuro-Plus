import json
import firebase_admin
from firebase_admin import firestore, auth as firebase_auth
from firebase_functions import https_fn, options

# Inicializa o Firebase apenas uma vez e de forma leve
if not firebase_admin._apps:
    firebase_admin.initialize_app()

@https_fn.on_request(
    cors=options.CorsOptions(cors_origins="*", cors_methods=["get", "post"]),
    # Limita quantas cópias da função podem rodar ao mesmo tempo. Evita que um
    # pico de acessos (ou uso malicioso) gere uma fatura alta de uma vez.
    # Ajuste esse número conforme o uso real do site crescer.
    max_instances=10,
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
        from agents import Runner, InputGuardrailTripwireTriggered, OutputGuardrailTripwireTriggered
        from agentes import agente_orquestrador
        from firestore_session import FirestoreSession

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

        try:
            resultado = Runner.run_sync(agente_orquestrador, mensagem, session=session)
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

        return https_fn.Response(
            json.dumps({"resposta": resposta_texto}),
            status=200,
            headers={"Content-Type": "application/json"}
        )

    except Exception as e:
        print(f"Erro no servidor: {e}")
        return https_fn.Response(json.dumps({"erro": f"Erro interno: {str(e)}"}), status=500)