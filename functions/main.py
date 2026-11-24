import io
import json
import re
import zipfile
from datetime import datetime, timezone
from urllib.parse import quote, urlparse

import requests
import firebase_admin
from firebase_admin import firestore, auth as firebase_auth, storage, messaging
from firebase_functions import https_fn, options, scheduler_fn, firestore_fn

import comunidade

# Inicializa o Firebase apenas uma vez e de forma leve
if not firebase_admin._apps:
    firebase_admin.initialize_app()

# Quantas mensagens cada conta pode mandar ao chatbot por dia. Sem isso, uma
# única conta autenticada chamando a função em loop gastaria crédito de
# OpenAI/Tavily sem limite nenhum (max_instances só limita quantas cópias da
# função rodam ao mesmo tempo, não o total por conta ao longo do dia).
LIMITE_MENSAGENS_CHAT_POR_DIA = 60


def _dentro_do_limite_diario(db, uid):
    """True se a conta ainda não passou do limite de mensagens do chatbot
    hoje; já incrementa o contador antes de devolver. Usa uma transação para
    não perder contagem se a mesma conta mandar duas mensagens ao mesmo
    tempo."""
    hoje = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    referencia = db.collection("chat_limites").document(uid)

    @firestore.transactional
    def atualizar(transacao):
        documento = referencia.get(transaction=transacao)
        dados = documento.to_dict() or {}
        contagem = dados.get("contagem", 0) if dados.get("data") == hoje else 0
        if contagem >= LIMITE_MENSAGENS_CHAT_POR_DIA:
            return False
        transacao.set(referencia, {"data": hoje, "contagem": contagem + 1})
        return True

    return atualizar(db.transaction())


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

    db = firestore.client()
    if not _dentro_do_limite_diario(db, id_usuario):
        return https_fn.Response(
            json.dumps({"erro": "Você atingiu o limite de mensagens do assistente por hoje. Tente de novo mais tarde."}),
            status=429,
        )

    try:
        # 1. Importamos o seu chatbot AQUI DENTRO para não travar a inicialização do Firebase!
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
        return https_fn.Response(json.dumps({"erro": "Erro interno. Tente novamente em alguns minutos."}), status=500)


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

        # Confere o host de verdade (não uma substring da URL inteira): sem
        # isso, "https://blob.core.windows.net.atacante.com/x.zip" também
        # passaria, porque a string permitida aparece em algum lugar da URL
        # mesmo o domínio de verdade sendo outro.
        host = (urlparse(zip_url).hostname or "").lower()
        dominio_valido = any(
            host == dominio or host.endswith(f".{dominio}") for dominio in DOMINIOS_ZIP_PERMITIDOS
        )
        if not zip_url.lower().startswith("https://") or not dominio_valido:
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
        print(f"Erro ao baixar o arquivo de origem: {e}")
        return https_fn.Response(json.dumps({"erro": "Não foi possível baixar o arquivo de origem."}), status=502)
    except zipfile.BadZipFile:
        return https_fn.Response(json.dumps({"erro": "O arquivo baixado não é um .zip válido."}), status=422)
    except Exception as e:
        print(f"Erro ao extrair logo: {e}")
        return https_fn.Response(json.dumps({"erro": "Erro interno. Tente novamente em alguns minutos."}), status=500)


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

def _link_seguro_da_notificacao(link):
    """O link que vai no push: uma página do próprio site ("noticia.html?id=...",
    ou "instituicao.html?u=...#duvidas" já na parte certa) ou um endereço
    https (notícia de outro site). Qualquer outra coisa vira vazio, e o clique
    só abre o Futuro+. Mesma regra de notificacoes-util.js."""
    texto = str(link or "").strip()
    if re.fullmatch(r"[a-z0-9-]+\.html(\?[^\s#]*)?(#[a-z0-9-]+)?", texto, flags=re.IGNORECASE):
        return texto
    if re.fullmatch(r"https://[^\s]+", texto, flags=re.IGNORECASE) and len(texto) <= 1000:
        return texto
    return ""


@firestore_fn.on_document_created(
    document="notificacoes/{id}",
    region=options.SupportedRegion.SOUTHAMERICA_EAST1,
    memory=options.MemoryOption.MB_256,
)
def enviar_push_da_notificacao(event: firestore_fn.Event) -> None:
    """Dispara um push de verdade (Firebase Cloud Messaging) pra quem já
    autorizou notificações no navegador (perfil.html), toda vez que o painel
    Admin · Notificações cria um aviso novo — só quando o admin marcou a
    opção "Notificação no dispositivo" (enviarPush), que é opcional; sem ela,
    o aviso continua valendo só como modal/sino, igual sempre foi. Respeita
    também "ativo" e "publicarEm": se nascer desativado ou agendado pro
    futuro, não manda nada agora (agendamento que dispara o push exatamente
    na hora ainda não existe — fica pra outra hora se for preciso)."""
    dados = event.data.to_dict() if event.data else None
    if not dados or not dados.get("enviarPush") or dados.get("ativo") is False:
        return

    publicar_em = dados.get("publicarEm")
    if publicar_em and publicar_em > datetime.now(timezone.utc).isoformat():
        return

    db = firestore.client()
    publico = dados.get("publico") or "logados"

    def vale(token_doc):
        tem_uid = bool((token_doc.to_dict() or {}).get("uid"))
        if publico == "todos":
            return True
        return tem_uid if publico == "logados" else not tem_uid

    tokens = [registro.id for registro in db.collection("fcm_tokens").stream() if vale(registro)]
    if not tokens:
        return

    enviados, invalidos = _enviar_push(db, tokens, dados.get("titulo") or "Futuro+", dados.get("mensagem"), dados.get("link"))
    print(f"Push da notificação enviado pra {enviados} token(s); {invalidos} inválido(s) removido(s).")


def _enviar_push(db, tokens, titulo, corpo, link):
    """Manda o push para os aparelhos (tokens do FCM) e apaga os tokens que
    não valem mais. Devolve (quantos tokens, quantos inválidos)."""
    titulo = str(titulo or "Futuro+")[:200]
    corpo = str(corpo or "")[:400]
    link = _link_seguro_da_notificacao(link)
    invalidos = []

    for inicio in range(0, len(tokens), 500):
        lote = tokens[inicio:inicio + 500]
        resposta = messaging.send_each_for_multicast(messaging.MulticastMessage(
            # Só "data", sem "notification": com "notification", o SDK do
            # Firebase desenha uma notificação sozinho e ainda chama o
            # onBackgroundMessage do service worker, que desenhava outra (saía
            # repetida, e nenhuma das duas abria nada). Assim quem desenha é
            # só o firebase-messaging-sw.js, que guarda o link (a notícia,
            # quando o aviso tem uma) e abre no clique.
            data={"titulo": titulo, "mensagem": corpo, "link": link},
            webpush=messaging.WebpushConfig(headers={"Urgency": "high"}),
            tokens=lote,
        ))
        for token, resultado in zip(lote, resposta.responses):
            if not resultado.success and "not-registered" in str(resultado.exception).lower():
                invalidos.append(token)

    # token inválido (app desinstalado, permissão revogada no sistema) nunca
    # mais vai funcionar — limpa pra não tentar de novo nos próximos avisos
    for inicio in range(0, len(invalidos), 400):
        lote_apagar = db.batch()
        for token in invalidos[inicio:inicio + 400]:
            lote_apagar.delete(db.collection("fcm_tokens").document(token))
        lote_apagar.commit()

    return len(tokens), len(invalidos)


def _push_para_os_admins(db, tokens, titulo, corpo, link):
    enviados, invalidos = _enviar_push(db, tokens, titulo, corpo, link)
    print(f"Aviso da comunidade enviado pra {enviados} aparelho(s) de admin; {invalidos} inválido(s) removido(s).")


# Comentários (com nota) e dúvidas das páginas das instituições: cada um que
# nasce, muda ou é apagado vira um registro no histórico do painel Admin ·
# Comunidade, com uma cópia do conteúdo e de quem fez (o "auth context" do
# evento diz qual conta gravou). Avaliação e dúvida novas também viram aviso
# para os admins (aba Novidades, sino do site e push). Ver comunidade.py.
@firestore_fn.on_document_written_with_auth_context(
    document="instituicoes/{unidadeId}/comentarios/{comentarioId}",
    region=options.SupportedRegion.SOUTHAMERICA_EAST1,
    memory=options.MemoryOption.MB_256,
)
def historico_dos_comentarios(event) -> None:
    comunidade.processar_comentario(firestore.client(), event, _push_para_os_admins)


@firestore_fn.on_document_written_with_auth_context(
    document="instituicoes/{unidadeId}/perguntas/{perguntaId}",
    region=options.SupportedRegion.SOUTHAMERICA_EAST1,
    memory=options.MemoryOption.MB_256,
)
def historico_das_duvidas(event) -> None:
    comunidade.processar_duvida(firestore.client(), event, _push_para_os_admins)


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


def _registrar_historico_noticias(db, acao, detalhe, uid=None):
    """Grava no histórico do painel Admin · Notícias (noticias_historico) o
    que o servidor faz: a busca do botão, a limpeza das recusadas e a saída
    das notícias antigas do site. As ações
    do painel (aprovar, recusar...) quem grava é o próprio painel. uid None =
    feito sozinho pelo agendamento. Um erro aqui não desfaz a ação, só fica
    no log."""
    try:
        email = "automático"
        if uid:
            try:
                email = firebase_auth.get_user(uid).email or ""
            except Exception:
                email = ""
        db.collection("noticias_historico").add({
            "noticiaId": "",
            "titulo": "",
            "acao": acao,
            "detalhe": detalhe,
            "email": email,
            "uid": uid or "",
            "em": firestore.SERVER_TIMESTAMP,
        })
    except Exception as erro:
        print(f"Erro ao registrar no histórico das notícias: {erro}")


def _texto_quantas(quantas, uma, varias, nenhuma):
    """"nenhuma ...", "1 ..." ou "N ...", para o detalhe do histórico."""
    if not quantas:
        return nenhuma
    return f"1 {uma}" if quantas == 1 else f"{quantas} {varias}"


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
        print(f"O site do vestibular não respondeu: {e}")
        return https_fn.Response(
            json.dumps({"erro": "O site do vestibular não respondeu. Tente novamente mais tarde."}),
            status=502, headers=cabecalho_json,
        )
    except Exception as e:
        print(f"Erro ao coletar demanda: {e}")
        return https_fn.Response(json.dumps({"erro": "Erro interno. Tente novamente em alguns minutos."}), status=500, headers=cabecalho_json)


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
        return responder({"erro": "Erro interno. Tente novamente em alguns minutos."}, 500)


TIPOS_DE_IMAGEM_NOTICIA = {"image/webp": "webp", "image/jpeg": "jpg", "image/png": "png"}
TAMANHO_MAXIMO_IMAGEM_NOTICIA = 4 * 1024 * 1024


@https_fn.on_request(
    cors=options.CorsOptions(cors_origins="*", cors_methods=["get", "post"]),
    region=options.SupportedRegion.SOUTHAMERICA_EAST1,
    max_instances=3,
    memory=options.MemoryOption.MB_256,
)
def enviar_imagem_noticia(req: https_fn.Request) -> https_fn.Response:
    """Imagens das notícias próprias (painel Admin · Notícias próprias), no
    mesmo esquema de enviar_capa: o navegador reduz a imagem e manda aqui, e
    só administrador passa.

    Sem "acao": guarda a imagem em noticias-proprias/<id da notícia>/ com um
    nome novo e devolve o endereço público. acao "apagar": apaga a pasta
    inteira da notícia (quando ela é excluída do painel)."""
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
        identificador = re.sub(r"[^A-Za-z0-9_-]", "", (dados.get("id") or "").strip())[:80]
        if not identificador:
            return responder({"erro": "Informe o 'id' da notícia."}, 400)

        bucket = storage.bucket("futuroplus-bce54.firebasestorage.app")
        pasta = f"noticias-proprias/{identificador}"

        if dados.get("acao") == "apagar":
            apagadas = 0
            for blob in bucket.list_blobs(prefix=f"{pasta}/"):
                blob.delete()
                apagadas += 1
            return responder({"apagadas": apagadas})

        tipo = (dados.get("tipo") or "").strip().lower()
        if tipo not in TIPOS_DE_IMAGEM_NOTICIA:
            return responder({"erro": "Envie uma imagem WebP, JPG ou PNG."}, 400)

        import base64
        import binascii
        import uuid
        try:
            conteudo = base64.b64decode(dados.get("imagem") or "", validate=True)
        except (binascii.Error, ValueError):
            return responder({"erro": "A imagem chegou corrompida. Tente enviar de novo."}, 400)
        if not conteudo:
            return responder({"erro": "Nenhuma imagem recebida."}, 400)
        if len(conteudo) > TAMANHO_MAXIMO_IMAGEM_NOTICIA:
            return responder({"erro": "A imagem passa de 4 MB."}, 413)

        # Cada imagem ganha um nome novo: trocar a de um bloco não mexe nas
        # outras, e o navegador nunca mostra uma versão antiga guardada.
        blob = bucket.blob(f"{pasta}/{uuid.uuid4().hex}.{TIPOS_DE_IMAGEM_NOTICIA[tipo]}")
        blob.cache_control = "public, max-age=31536000, immutable"
        blob.upload_from_string(conteudo, content_type=tipo)
        blob.make_public()
        return responder({"url": blob.public_url})

    except Exception as e:
        print(f"Erro ao enviar imagem de notícia: {e}")
        return responder({"erro": "Erro interno. Tente novamente em alguns minutos."}, 500)


@https_fn.on_request(
    cors=options.CorsOptions(cors_origins="*", cors_methods=["get", "post"]),
    region=options.SupportedRegion.SOUTHAMERICA_EAST1,
    # Só o painel admin chama, e uma busca por vez.
    max_instances=2,
    memory=options.MemoryOption.MB_256,
    # São quatro feeds e a capa de cada notícia nova: leva segundos num dia
    # normal, mas o padrão de 60 s ficaria justo com um dos sites lento.
    timeout_sec=180,
)
def coletar_noticias(req: https_fn.Request) -> https_fn.Response:
    """Busca agora as notícias de Etecs e Fatecs nos feeds (noticias.py) e põe
    as novas na fila de aprovação. Chamada pelo botão "Buscar notícias agora"
    do painel Admin · Notícias; devolve o resumo da coleta."""
    if req.method == "OPTIONS":
        return https_fn.Response(status=204)

    cabecalho_json = {"Content-Type": "application/json"}
    try:
        db = firestore.client()
        uid, erro = _exigir_admin(req, db)
        if erro:
            return erro

        import noticias_firestore

        resumo = noticias_firestore.coletar_e_gravar(db, "painel")
        novas = resumo.get("novas", 0) if isinstance(resumo, dict) else 0
        _registrar_historico_noticias(
            db, "buscou", _texto_quantas(novas, "nova na fila", "novas na fila", "nenhuma notícia nova"), uid)
        return https_fn.Response(json.dumps(resumo), status=200, headers=cabecalho_json)

    except Exception as e:
        print(f"Erro ao coletar notícias: {e}")
        return https_fn.Response(json.dumps({"erro": "Erro interno. Tente novamente em alguns minutos."}), status=500, headers=cabecalho_json)


@https_fn.on_request(
    cors=options.CorsOptions(cors_origins="*", cors_methods=["get", "post"]),
    region=options.SupportedRegion.SOUTHAMERICA_EAST1,
    max_instances=2,
    memory=options.MemoryOption.MB_256,
    timeout_sec=60,
)
def limpar_noticias_recusadas(req: https_fn.Request) -> https_fn.Response:
    """Apaga agora as notícias recusadas há mais de 30 dias, sem esperar a
    próxima coleta agendada (que já faz isso sozinha). Chamada pelo botão
    "Limpar recusadas antigas" da aba Recusadas do painel Admin · Notícias."""
    if req.method == "OPTIONS":
        return https_fn.Response(status=204)

    cabecalho_json = {"Content-Type": "application/json"}
    try:
        db = firestore.client()
        uid, erro = _exigir_admin(req, db)
        if erro:
            return erro

        import noticias_firestore

        apagadas = noticias_firestore.apagar_recusadas_antigas(db)
        _registrar_historico_noticias(db, "limpou", _texto_quantas(
            apagadas, "recusada com mais de 30 dias", "recusadas com mais de 30 dias",
            "nenhuma recusada com mais de 30 dias"), uid)
        return https_fn.Response(json.dumps({"apagadas": apagadas}), status=200, headers=cabecalho_json)

    except Exception as e:
        print(f"Erro ao limpar notícias recusadas: {e}")
        return https_fn.Response(json.dumps({"erro": "Erro interno. Tente novamente em alguns minutos."}), status=500, headers=cabecalho_json)


@scheduler_fn.on_schedule(
    # Os sites publicam poucas notícias por dia: quatro buscas diárias deixam
    # a fila em dia e ficam dentro da faixa gratuita.
    schedule="every 6 hours",
    region=options.SupportedRegion.SOUTHAMERICA_EAST1,
    memory=options.MemoryOption.MB_256,
    timeout_sec=180,
)
def coletar_noticias_agendada(event: scheduler_fn.ScheduledEvent) -> None:
    """A mesma busca do botão, rodando sozinha. Nada vai para o site sem
    aprovação: as notícias novas só entram na fila do painel. Aproveita essa
    mesma agenda (a cada 6h) pra também apagar notícias recusadas há mais de
    30 dias e tirar do site as notícias de outros sites com mais de 90 dias,
    sem precisar de um agendamento novo só para isso."""
    import noticias_firestore

    db = firestore.client()
    resumo = noticias_firestore.coletar_e_gravar(db, "agendada")
    print(json.dumps({"coleta_noticias": True, **resumo}, ensure_ascii=False))

    try:
        apagadas = noticias_firestore.apagar_recusadas_antigas(db)
        if apagadas:
            print(f"{apagadas} notícia(s) recusada(s) há mais de 30 dias foram apagadas.")
            # apagar é o que precisa ficar registrado; a busca automática em si,
            # quatro vezes por dia, só encheria o histórico
            _registrar_historico_noticias(db, "limpou", _texto_quantas(
                apagadas, "recusada com mais de 30 dias", "recusadas com mais de 30 dias", ""))
    except Exception as erro:
        print(f"Erro ao apagar notícias recusadas antigas: {erro}")

    # as do Futuro+ e as que estão no carrossel da Início ficam
    try:
        dias = noticias_firestore.DIAS_NO_SITE
        antigas = noticias_firestore.apagar_noticias_antigas_do_site(db)
        if antigas:
            print(f"{antigas} notícia(s) de outros sites com mais de {dias} dias saíram do site.")
            _registrar_historico_noticias(db, "tirou_antigas", _texto_quantas(
                antigas, f"notícia com mais de {dias} dias", f"notícias com mais de {dias} dias", ""))
    except Exception as erro:
        print(f"Erro ao tirar do site as notícias antigas: {erro}")


@https_fn.on_request(
    region=options.SupportedRegion.SOUTHAMERICA_EAST1,
    max_instances=5,
    memory=options.MemoryOption.MB_256,
)
def sitemap_dinamico(req: https_fn.Request) -> https_fn.Response:
    """Sitemap com o endereço de cada instituição e de cada curso do
    catálogo, montado na hora a partir do Firestore — o sitemap.xml estático
    (webApp/public/sitemap.xml) só lista as páginas fixas do site. Sem este
    aqui, o Google só acha a página de cada Etec/Fatec e de cada curso
    seguindo link por link a partir de cursos.html/instituicoes.html, o que
    demora muito mais pra indexar tudo. Servido em /sitemap-conteudo.xml por
    um rewrite do Hosting (firebase.json) e referenciado em robots.txt."""
    db = firestore.client()
    base = "https://futuroplus.com.br"

    enderecos = [f"{base}/instituicao.html?u={quote(doc.id, safe='')}" for doc in db.collection("instituicoes").stream()]
    enderecos += [f"{base}/curso.html?c={quote(doc.id, safe='')}" for doc in db.collection("cursos").stream()]

    agora = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    itens = "".join(
        f"<url><loc>{endereco}</loc><lastmod>{agora}</lastmod><changefreq>monthly</changefreq></url>"
        for endereco in enderecos
    )
    xml = (
        '<?xml version="1.0" encoding="UTF-8"?>'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' + itens + '</urlset>'
    )

    return https_fn.Response(xml, status=200, headers={
        "Content-Type": "application/xml; charset=utf-8",
        # 1h de cache: o catálogo não muda de hora em hora, e assim o
        # Googlebot batendo várias vezes não gera leitura nova no Firestore
        # toda hora.
        "Cache-Control": "public, max-age=3600",
    })
