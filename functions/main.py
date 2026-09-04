import json
from firebase_functions import https_fn, options
from firebase_admin import initialize_app, firestore

# Inicializa o Firebase Admin
initialize_app()
db = firestore.client()

# Importa o orquestrador dos seus agentes que agora estão dentro da pasta functions
from agentes import agente_orquestrador

@https_fn.on_request(cors=options.CorsOptions(cors_origins="*", cors_methods=["get", "post"]))
def chat_bot(req: https_fn.Request) -> https_fn.Response:
    if req.method == "OPTIONS":
        return https_fn.Response(status=204)
        
    try:
        dados = req.get_json()
        if not dados:
            return https_fn.Response(json.dumps({"erro": "Nenhum dado recebido"}), status=400)

        id_usuario = dados.get("id_usuario", "aluno_padrao")
        mensagem = dados.get("mensagem", "")

        if not mensagem:
            return https_fn.Response(json.dumps({"erro": "A mensagem não pode estar vazia"}), status=400)

        # Chama o seu agente orquestrador
        resultado = agente_orquestrador(mensagem, id_usuario)
        
        # Extrai a resposta final do agente
        if isinstance(resultado, dict):
            resposta_texto = resultado.get("final_output", str(resultado))
        else:
            resposta_texto = str(resultado)

        return https_fn.Response(
            json.dumps({"resposta": resposta_texto}),
            status=200,
            headers={"Content-Type": "application/json"}
        )

    except Exception as e:
        print(f"Erro no servidor: {e}")
        return https_fn.Response(json.dumps({"erro": f"Erro interno: {str(e)}"}), status=500)