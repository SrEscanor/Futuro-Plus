import json
import firebase_admin
from firebase_admin import firestore
from firebase_functions import https_fn, options

# Inicializa o Firebase apenas uma vez e de forma leve
if not firebase_admin._apps:
    firebase_admin.initialize_app()

@https_fn.on_request(cors=options.CorsOptions(cors_origins="*", cors_methods=["get", "post"]))
def chat_bot(req: https_fn.Request) -> https_fn.Response:
    if req.method == "OPTIONS":
        return https_fn.Response(status=204)
        
    try:
        # 1. Deixamos a conexão do banco para acontecer só quando a função for chamada
        db = firestore.client()

        # 2. Importamos o seu chatbot AQUI DENTRO para não travar a inicialização do Firebase!
        from agents import Runner
        from agentes import agente_orquestrador
        from firestore_session import FirestoreSession

        dados = req.get_json()
        if not dados:
            return https_fn.Response(json.dumps({"erro": "Nenhum dado recebido"}), status=400)

        id_usuario = dados.get("id_usuario", "aluno_padrao")
        mensagem = dados.get("mensagem", "")

        if not mensagem:
            return https_fn.Response(json.dumps({"erro": "A mensagem não pode estar vazia"}), status=400)

        # Um objeto Agent da SDK não é chamável diretamente (ex: agente(msg) dava
        # erro "'Agent' object is not callable"). É preciso executá-lo com Runner.
        # A sessão fica gravada no Firestore, um documento por id_usuario, então
        # o histórico de cada aluno persiste na nuvem entre chamadas — sem
        # depender de arquivo local, que se perde a cada cold start da função.
        session = FirestoreSession(session_id=id_usuario, db=db)
        resultado = Runner.run_sync(agente_orquestrador, mensagem, session=session)

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