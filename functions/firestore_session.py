"""
Sessão de conversa do Agents SDK usando o Firestore como armazenamento.

Por padrão, a SDK oferece a `SQLiteSession`, que grava o histórico num arquivo
local (ex: /tmp/sessions.db). Isso funciona, mas em Cloud Functions o /tmp é
"por instância": se a função escala para uma nova instância ou sofre um cold
start, o histórico daquele usuário simplesmente some.

Esta classe implementa a mesma interface (get_items, add_items, pop_item,
clear_session) só que gravando cada conversa como um documento no Firestore,
identificado pelo id_usuario. Assim:

- Cada usuário tem seu próprio histórico, isolado dos demais.
- O histórico sobrevive a cold starts, deploys e múltiplas instâncias.
- Não depende de disco local nem de nenhum serviço externo além do Firestore
  que o projeto já usa.
"""

# Quantidade máxima de mensagens guardadas por usuário. Evita que o
# documento cresça sem limite e que o contexto enviado ao modelo fique
# gigante (o que aumenta custo e tempo de resposta).
MAX_ITEMS = 40


def _sem_resultado_orfao(itens: list) -> list:
    """Remove um `function_call_output` cujo `function_call` correspondente
    (mesmo call_id) não está mais na lista.

    Uma chamada de ferramenta é sempre gravada como dois itens seguidos: o
    pedido (`function_call`) e o resultado (`function_call_output`). Cortar
    a lista só por quantidade (`[-MAX_ITEMS:]`) pode cair bem no meio desse
    par — cortando o pedido mas mantendo o resultado —, e a OpenAI rejeita a
    conversa inteira nesse caso ("No tool call found for function call
    output..."), quebrando o chat até o histórico ser limpo. Rodar isso a
    cada leitura também "cura" sozinho um documento que já ficou corrompido
    antes dessa correção existir.
    """
    ids_com_chamada = {
        item.get("call_id") for item in itens
        if isinstance(item, dict) and item.get("type") == "function_call"
    }
    return [
        item for item in itens
        if not (isinstance(item, dict) and item.get("type") == "function_call_output"
                and item.get("call_id") not in ids_com_chamada)
    ]


class FirestoreSession:
    """Implementação de Session (Agents SDK) apoiada no Firestore."""

    def __init__(self, session_id: str, db):
        self.session_id = session_id
        self._doc_ref = db.collection("chat_sessions").document(session_id)

    async def get_items(self, limit: int | None = None) -> list:
        snap = self._doc_ref.get()
        itens = snap.to_dict().get("items", []) if snap.exists else []
        itens = _sem_resultado_orfao(itens)
        if limit is not None:
            return itens[-limit:]
        return itens

    async def add_items(self, items: list) -> None:
        if not items:
            return
        snap = self._doc_ref.get()
        itens_atuais = snap.to_dict().get("items", []) if snap.exists else []
        itens_atualizados = _sem_resultado_orfao((itens_atuais + list(items))[-MAX_ITEMS:])
        self._doc_ref.set({"items": itens_atualizados}, merge=True)

    async def pop_item(self):
        snap = self._doc_ref.get()
        itens_atuais = snap.to_dict().get("items", []) if snap.exists else []
        if not itens_atuais:
            return None
        ultimo_item = itens_atuais.pop()
        self._doc_ref.set({"items": itens_atuais}, merge=True)
        return ultimo_item

    async def clear_session(self) -> None:
        self._doc_ref.delete()
