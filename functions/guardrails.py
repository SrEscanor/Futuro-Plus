from typing import Union
from agents import (
    GuardrailFunctionOutput,
    TResponseInputItem,
    input_guardrail,
    output_guardrail,
)

from seguranca_chat import parece_injecao, parece_vazamento_de_instrucoes, tem_chave_de_api


def _texto_ultima_mensagem_usuario(user_input: Union[str, list[TResponseInputItem]]) -> str:
    """
    Com `session`, o `user_input` recebido pelo guardrail é o histórico inteiro
    da conversa + a mensagem nova no final (não só a mensagem atual). Se os
    guardrails checarem a string inteira, uma frase de um turno antigo (ex: um
    teste de prompt injection feito há 10 mensagens) continua "presente" e
    bloqueia todas as mensagens seguintes para sempre. Por isso extraímos aqui
    apenas o texto da ÚLTIMA mensagem com role="user".
    """
    if isinstance(user_input, str):
        return user_input

    for item in reversed(user_input):
        role = item.get("role") if isinstance(item, dict) else getattr(item, "role", None)
        if role != "user":
            continue

        conteudo = item.get("content") if isinstance(item, dict) else getattr(item, "content", None)

        if isinstance(conteudo, str):
            return conteudo

        if isinstance(conteudo, list):
            partes = []
            for pedaco in conteudo:
                texto = pedaco.get("text") if isinstance(pedaco, dict) else getattr(pedaco, "text", None)
                if texto:
                    partes.append(texto)
            return " ".join(partes)

    # fallback de segurança: não deveria cair aqui, mas evita quebrar o guardrail
    return str(user_input)


@input_guardrail(run_in_parallel=False)
def bloquear_injecao_prompt(ctx, agent, user_input: Union[str, list[TResponseInputItem]]) -> GuardrailFunctionOutput:
    # Antes eram 5 frases exatas ("ignore as instruções anteriores"...): sem
    # acento, em inglês ou com outra palavra já passava. parece_injecao()
    # (seguranca_chat.py) pega as variações sem barrar pergunta normal; os
    # exemplos dos dois lados estão em functions/testes/testar_seguranca_chat.py.
    encontrou = parece_injecao(_texto_ultima_mensagem_usuario(user_input))
    return GuardrailFunctionOutput(
        output_info="Tentativa de injeção de prompt detectada" if encontrou else "Entrada permitida",
        tripwire_triggered=encontrou,
    )

@input_guardrail(run_in_parallel=False)
def bloquear_linguagem_inapropriada_entrada(ctx, agent, user_input: Union[str, list[TResponseInputItem]]) -> GuardrailFunctionOutput:
    texto = _texto_ultima_mensagem_usuario(user_input).lower()
    palavroes = ["porra", "fuder", "foder", "caralho", "merda", "puta", "cacete"]
    encontrou = any(p in texto for p in palavroes)
    return GuardrailFunctionOutput(
        output_info="Linguagem inapropriada detectada na entrada" if encontrou else "Entrada permitida",
        tripwire_triggered=encontrou,
    )

@output_guardrail
def bloquear_vazamento_chaves_api(ctx, agent, agent_output: str) -> GuardrailFunctionOutput:
    # só a chave inteira conta: o "sk-" solto de antes barrava "risk-free"
    encontrou = tem_chave_de_api(agent_output)
    return GuardrailFunctionOutput(
        output_info="Vazamento de chave de API detectado na saída" if encontrou else "Saída permitida",
        tripwire_triggered=encontrou,
    )


@output_guardrail
def bloquear_vazamento_de_instrucoes(ctx, agent, agent_output: str) -> GuardrailFunctionOutput:
    """Barra a resposta que repete pedaços das instruções dos agentes (o
    "prompt"), caso alguma tentativa de extração passe pelo guardrail de
    entrada."""
    encontrou = parece_vazamento_de_instrucoes(agent_output)
    return GuardrailFunctionOutput(
        output_info="Resposta repetindo as instruções do assistente" if encontrou else "Saída permitida",
        tripwire_triggered=encontrou,
    )