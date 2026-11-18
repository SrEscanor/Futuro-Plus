"""Histórico e avisos da comunidade das páginas das instituições
(instituicao.html): comentários com nota de quem estudou lá, dúvidas e as
respostas delas.

As funções historico_dos_comentarios e historico_das_duvidas (main.py)
chamam este módulo toda vez que um comentário ou uma dúvida nasce, muda ou é
apagado, seja pelo próprio autor, por um admin ou pelo servidor. O que fica
no Firestore (regras em firestore.rules: só admin lê, ninguém grava pelo
site):

  comunidade_historico/{id do evento}
      um registro por acontecimento, com quem fez e uma cópia do texto, da
      nota e do resto do conteúdo, inclusive do que foi apagado (depois de
      apagado, é o único lugar onde ele continua existindo). Aparece no
      painel Admin · Comunidade, aba Histórico.
  avisos_admin/{avaliacao|duvida}_{unidade}_{item}
      avaliação ou dúvida nova, para a aba Novidades do mesmo painel, para o
      sino do site (só de admin) e para o push dos admins. Acompanha o que
      acontece depois: comentário editado, dúvida respondida, algo apagado.
"""
import re
from urllib.parse import quote

from firebase_admin import auth as firebase_auth
from firebase_admin import firestore

HISTORICO = "comunidade_historico"
AVISOS = "avisos_admin"


def _texto(valor, limite=1000):
    return str(valor or "").strip()[:limite]


def _inteiro(valor):
    return valor if isinstance(valor, int) and not isinstance(valor, bool) else None


def _nota(valor):
    nota = _inteiro(valor)
    return nota if nota is not None and 1 <= nota <= 5 else None


def _sem_vazios(dados):
    return {chave: valor for chave, valor in dados.items() if valor is not None and valor != ""}


def estrelas(nota):
    cheias = _nota(nota) or 0
    return "★" * cheias + "☆" * (5 - cheias)


def _eh_etec_ou_fatec(nome):
    return bool(re.match(r"(etec|fatec)\b", nome or "", flags=re.IGNORECASE))


def na_unidade(nome):
    """"na Etec Jorge Street", mas "em Instituto Federal..." (outras escolas)."""
    return f"na {nome}" if _eh_etec_ou_fatec(nome) else f"em {nome}"


def sobre_a_unidade(nome):
    return f"sobre a {nome}" if _eh_etec_ou_fatec(nome) else f"sobre {nome}"


def link_da_unidade(unidade_id, ancora):
    """Página da instituição já aberta na parte certa (quem-estudou ou
    duvidas); instituicao.js rola até ela depois de desenhar."""
    return f"instituicao.html?u={quote(str(unidade_id), safe='')}#{ancora}"


def _dados(retrato):
    if retrato is None or getattr(retrato, "exists", True) is False:
        return None
    return retrato.to_dict() or {}


def uid_do_evento(evento):
    """O uid de quem gravou, quando foi uma conta do site. Conta de serviço
    (Console do Firebase, as próprias funções) chega como e-mail, e aí não é
    ninguém do site: fica vazio e o histórico mostra "Sistema"."""
    tipo = str(getattr(evento, "auth_type", "") or "")
    uid = str(getattr(evento, "auth_id", "") or "").strip()
    if tipo in ("service_account", "api_key", "system") or not uid or "@" in uid:
        return ""
    return uid[:128]


class Contas:
    """Lê cada conta uma vez por execução: o nome do perfil, se é admin e,
    só de admin, o e-mail (o mesmo que os outros históricos do painel
    mostram). De quem não é admin o histórico guarda só o nome."""

    def __init__(self, db):
        self.db, self.lidas = db, {}

    def _conta(self, uid):
        if uid not in self.lidas:
            perfil = self.db.collection("usuarios").document(uid).get()
            dados = (perfil.to_dict() or {}) if perfil.exists else {}
            admin = dados.get("admin") is True
            email = ""
            if admin:
                try:
                    email = firebase_auth.get_user(uid).email or ""
                except Exception as erro:
                    print(f"Não deu para ler o e-mail do admin {uid}: {erro}")
            self.lidas[uid] = {"nome": _texto(dados.get("nome"), 120), "admin": admin, "email": email}
        return self.lidas[uid]

    def quem(self, uid, nome_de_reserva=""):
        if not uid:
            return {"uid": "", "nome": "Sistema", "email": "", "admin": False, "sistema": True}
        conta = self._conta(uid)
        return {"uid": uid, "nome": conta["nome"] or nome_de_reserva, "email": conta["email"],
                "admin": conta["admin"], "sistema": False}


def _registro(contexto, quem, acao, tipo, conteudo):
    return _sem_vazios({
        "acao": acao,
        "tipo": tipo,
        "em": firestore.SERVER_TIMESTAMP,
        "unidadeId": contexto["unidadeId"],
        "unidadeNome": contexto["unidadeNome"],
        "itemId": contexto["itemId"],
        "uid": quem["uid"],
        "nome": quem["nome"],
        "email": quem["email"],
        "admin": quem["admin"],
        "sistema": quem["sistema"],
        # quem fez é quem escreveu (apagou o próprio comentário, por exemplo)
        "propria": bool(quem["uid"]) and quem["uid"] == conteudo.get("autorUid"),
        **conteudo,
    })


# ---------------------------------------------------------------- comentários

def _conteudo_do_comentario(dados, comentario_id):
    return _sem_vazios({
        # comentário de antes de um certificado dar direito a um comentário
        # não tem o campo "uid": o id do documento é o próprio uid
        "autorUid": _texto(dados.get("uid") or comentario_id.split("_")[0], 128),
        "autorNome": _texto(dados.get("nome"), 120),
        "texto": _texto(dados.get("texto")),
        "nota": _nota(dados.get("nota")),
        "curso": _texto(dados.get("curso"), 200),
        "ano": _inteiro(dados.get("ano")),
        "escritoEm": dados.get("criadoEm"),
    })


def registros_do_comentario(antes, depois, contexto, uid, contas):
    item = contexto["itemId"]
    if depois is not None:
        conteudo = _conteudo_do_comentario(depois, item)
        # quem cria ou edita é sempre o autor (as regras conferem)
        quem = contas.quem(uid or conteudo.get("autorUid", ""), conteudo.get("autorNome", ""))
        if antes is None:
            return [_registro(contexto, quem, "comentou", "comentario", conteudo)]
        anterior = _conteudo_do_comentario(antes, item)
        if (conteudo.get("texto"), conteudo.get("nota")) == (anterior.get("texto"), anterior.get("nota")):
            return []
        return [_registro(contexto, quem, "editou_comentario", "comentario", {
            **conteudo, "textoAntes": anterior.get("texto"), "notaAntes": anterior.get("nota"),
        })]
    if antes is not None:
        conteudo = _conteudo_do_comentario(antes, item)
        quem = contas.quem(uid, conteudo.get("autorNome", "") if uid == conteudo.get("autorUid") else "")
        return [_registro(contexto, quem, "apagou_comentario", "comentario", conteudo)]
    return []


# ------------------------------------------------------- dúvidas e respostas

def _conteudo_da_duvida(dados):
    return _sem_vazios({
        "autorUid": _texto(dados.get("autorUid"), 128),
        "autorNome": _texto(dados.get("nome"), 120),
        "texto": _texto(dados.get("texto")),
        "escritoEm": dados.get("criadaEm"),
    })


def _respostas(dados):
    respostas = (dados or {}).get("respostas")
    return respostas if isinstance(respostas, dict) else {}


def _conteudo_da_resposta(uid, resposta):
    resposta = resposta if isinstance(resposta, dict) else {}
    return _sem_vazios({
        "autorUid": _texto(uid, 128),
        "autorNome": _texto(resposta.get("nome"), 120),
        "texto": _texto(resposta.get("texto")),
        "equipe": resposta.get("equipe") is True,
        "curso": _texto(resposta.get("curso"), 200),
        "ano": _inteiro(resposta.get("ano")),
        "escritoEm": resposta.get("em"),
    })


def _momento(valor):
    """Para ordenar as respostas apagadas junto com a dúvida (datas do
    Firestore e textos misturados não se comparam)."""
    return valor.timestamp() if hasattr(valor, "timestamp") else 0


def registros_da_duvida(antes, depois, contexto, uid, contas):
    if antes is None and depois is not None:
        conteudo = _conteudo_da_duvida(depois)
        quem = contas.quem(uid or conteudo.get("autorUid", ""), conteudo.get("autorNome", ""))
        return [_registro(contexto, quem, "perguntou", "duvida", conteudo)]

    if antes is not None and depois is None:
        conteudo = _conteudo_da_duvida(antes)
        respostas = [_conteudo_da_resposta(chave, valor) for chave, valor in _respostas(antes).items()]
        respostas.sort(key=lambda r: _momento(r.get("escritoEm")))
        quem = contas.quem(uid, conteudo.get("autorNome", "") if uid == conteudo.get("autorUid") else "")
        return [_registro(contexto, quem, "apagou_duvida", "duvida", {**conteudo, "respostasApagadas": respostas})]

    if antes is None or depois is None:
        return []

    # a dúvida só muda nas respostas: uma por conta, em respostas.{uid}
    pergunta = _sem_vazios({
        "perguntaTexto": _texto(depois.get("texto"), 300),
        "perguntaAutorNome": _texto(depois.get("nome"), 120),
    })
    velhas, novas = _respostas(antes), _respostas(depois)
    registros = []
    for chave in sorted(set(velhas) | set(novas)):
        velha, nova = velhas.get(chave), novas.get(chave)
        if nova is not None and velha is None:
            conteudo = _conteudo_da_resposta(chave, nova)
            quem = contas.quem(uid or chave, conteudo.get("autorNome", ""))
            registros.append(_registro(contexto, quem, "respondeu", "resposta", {**conteudo, **pergunta}))
        elif nova is None and velha is not None:
            conteudo = _conteudo_da_resposta(chave, velha)
            quem = contas.quem(uid, conteudo.get("autorNome", "") if uid == chave else "")
            registros.append(_registro(contexto, quem, "apagou_resposta", "resposta", {**conteudo, **pergunta}))
        elif nova is not None and _texto((nova or {}).get("texto")) != _texto((velha or {}).get("texto")):
            conteudo = _conteudo_da_resposta(chave, nova)
            quem = contas.quem(uid or chave, conteudo.get("autorNome", ""))
            registros.append(_registro(contexto, quem, "editou_resposta", "resposta", {
                **conteudo, **pergunta, "textoAntes": _texto((velha or {}).get("texto")),
            }))
    return registros


# ------------------------------------------------------------------- avisos

def id_do_aviso(tipo, unidade_id, item_id):
    return f"{tipo}_{unidade_id}_{item_id}"[:1400]


def aviso_da_avaliacao(contexto, dados):
    conteudo = _conteudo_do_comentario(dados, contexto["itemId"])
    return _sem_vazios({
        "tipo": "avaliacao",
        "em": firestore.SERVER_TIMESTAMP,
        "unidadeId": contexto["unidadeId"],
        "unidadeNome": contexto["unidadeNome"],
        "itemId": contexto["itemId"],
        "autorUid": conteudo.get("autorUid"),
        "nome": conteudo.get("autorNome"),
        "texto": conteudo.get("texto"),
        "nota": conteudo.get("nota"),
        "curso": conteudo.get("curso"),
        "ano": conteudo.get("ano"),
        "apagada": False,
        "link": link_da_unidade(contexto["unidadeId"], "quem-estudou"),
    })


def aviso_da_duvida(contexto, dados):
    conteudo = _conteudo_da_duvida(dados)
    return _sem_vazios({
        "tipo": "duvida",
        "em": firestore.SERVER_TIMESTAMP,
        "unidadeId": contexto["unidadeId"],
        "unidadeNome": contexto["unidadeNome"],
        "itemId": contexto["itemId"],
        "autorUid": conteudo.get("autorUid"),
        "nome": conteudo.get("autorNome"),
        "texto": conteudo.get("texto"),
        "respostas": len(_respostas(dados)),
        "apagada": False,
        "link": link_da_unidade(contexto["unidadeId"], "duvidas"),
    })


def _trecho(texto, limite):
    texto = " ".join(str(texto or "").split())
    return texto if len(texto) <= limite else texto[:limite - 1].rstrip() + "…"


def push_do_aviso(aviso):
    """(título, mensagem) do push que vai para os aparelhos dos admins."""
    nome = aviso.get("nome") or "Alguém"
    unidade = aviso.get("unidadeNome") or "uma instituição"
    if aviso["tipo"] == "avaliacao":
        curso = f" · {aviso['curso']}" if aviso.get("curso") else ""
        return (f"Nova avaliação {na_unidade(unidade)}",
                f"{estrelas(aviso.get('nota'))} {nome}{curso}: “{_trecho(aviso.get('texto'), 140)}”")
    return (f"Nova dúvida {sobre_a_unidade(unidade)}", f"{nome}: “{_trecho(aviso.get('texto'), 160)}”")


def tokens_dos_admins(db, menos_uid=""):
    """Aparelhos dos admins que ativaram as notificações no Perfil (menos
    os de quem escreveu, se for admin)."""
    admins = [conta.id for conta in db.collection("usuarios").where("admin", "==", True).stream()
              if conta.id != menos_uid]
    tokens = []
    for inicio in range(0, len(admins), 30):  # o "in" do Firestore aceita até 30 valores
        consulta = db.collection("fcm_tokens").where("uid", "in", admins[inicio:inicio + 30])
        tokens.extend(registro.id for registro in consulta.stream())
    return tokens


# ------------------------------------------------------------- quem chama

def _nome_da_unidade(db, unidade_id):
    try:
        doc = db.collection("instituicoes").document(unidade_id).get()
        return _texto((doc.to_dict() or {}).get("nome"), 200) if doc.exists else ""
    except Exception as erro:
        print(f"Não deu para ler o nome da unidade {unidade_id}: {erro}")
        return ""


def _gravar_registros(db, evento, registros):
    for numero, registro in enumerate(registros):
        # o id do evento evita registro repetido se o Firebase entregar o
        # mesmo evento duas vezes
        db.collection(HISTORICO).document(f"{evento.id}-{numero}").set(registro)


def _atualizar_aviso_se_existir(db, id_aviso, campos):
    ref = db.collection(AVISOS).document(id_aviso)
    if ref.get().exists:
        ref.set(campos, merge=True)


def _avisar(db, aviso, id_aviso, enviar_push):
    db.collection(AVISOS).document(id_aviso).set(aviso)
    titulo, mensagem = push_do_aviso(aviso)
    tokens = tokens_dos_admins(db, menos_uid=aviso.get("autorUid", ""))
    if tokens:
        enviar_push(db, tokens, titulo, mensagem, aviso["link"])


def _passo(descricao, acao):
    """Cada parte é independente: um erro no push não pode levar junto o
    registro do histórico."""
    try:
        acao()
    except Exception as erro:
        print(f"Erro ao {descricao}: {erro}")


def processar_comentario(db, evento, enviar_push):
    unidade_id, item = evento.params["unidadeId"], evento.params["comentarioId"]
    antes, depois = _dados(evento.data.before), _dados(evento.data.after)
    contexto = {"unidadeId": unidade_id, "unidadeNome": _nome_da_unidade(db, unidade_id) or unidade_id, "itemId": item}
    uid = uid_do_evento(evento)
    registros = registros_do_comentario(antes, depois, contexto, uid, Contas(db))
    _passo("gravar o histórico do comentário", lambda: _gravar_registros(db, evento, registros))

    id_aviso = id_do_aviso("avaliacao", unidade_id, item)
    if antes is None and depois is not None:
        _passo("avisar os admins da avaliação",
               lambda: _avisar(db, aviso_da_avaliacao(contexto, depois), id_aviso, enviar_push))
    elif antes is not None and depois is None:
        _passo("marcar o aviso como apagado", lambda: _atualizar_aviso_se_existir(db, id_aviso, {"apagada": True}))
    elif registros:
        conteudo = _conteudo_do_comentario(depois, item)
        _passo("atualizar o aviso do comentário editado", lambda: _atualizar_aviso_se_existir(db, id_aviso, {
            "texto": conteudo.get("texto", ""), "nota": conteudo.get("nota"), "editada": True,
        }))
    return registros


def processar_duvida(db, evento, enviar_push):
    unidade_id, item = evento.params["unidadeId"], evento.params["perguntaId"]
    antes, depois = _dados(evento.data.before), _dados(evento.data.after)
    contexto = {"unidadeId": unidade_id, "unidadeNome": _nome_da_unidade(db, unidade_id) or unidade_id, "itemId": item}
    uid = uid_do_evento(evento)
    registros = registros_da_duvida(antes, depois, contexto, uid, Contas(db))
    _passo("gravar o histórico da dúvida", lambda: _gravar_registros(db, evento, registros))

    id_aviso = id_do_aviso("duvida", unidade_id, item)
    if antes is None and depois is not None:
        _passo("avisar os admins da dúvida",
               lambda: _avisar(db, aviso_da_duvida(contexto, depois), id_aviso, enviar_push))
    elif antes is not None and depois is None:
        _passo("marcar o aviso como apagado", lambda: _atualizar_aviso_se_existir(db, id_aviso, {"apagada": True}))
    elif registros:
        _passo("contar as respostas no aviso",
               lambda: _atualizar_aviso_se_existir(db, id_aviso, {"respostas": len(_respostas(depois))}))
    return registros
