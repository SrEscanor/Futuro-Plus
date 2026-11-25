"""Grava na fila de aprovação (coleção noticias_fila) o que noticias.coletar()
trouxe.

Só entra o que é novo. Uma notícia já vista — pendente, aprovada ou recusada
— nunca é regravada: é isso que impede uma recusada de voltar na coleta
seguinte e uma aprovada de perder o que o administrador revisou.

Usado pelas duas funções de main.py: coletar_noticias (botão do painel
Admin · Notícias) e coletar_noticias_agendada (roda sozinha).
"""
from datetime import datetime, timedelta, timezone

import noticias

FILA = "noticias_fila"
PUBLICADAS = "noticias"
REGISTRO_DA_COLETA = ("noticias_coleta", "ultima")
# o carrossel "Destaques para você" da Início e as fixadas no alto da página
# Notícias (as duas escolhidas no painel Admin · Notícias)
DESTAQUES_DA_INICIO = ("configuracoes", "destaques_inicio")
FIXADAS_DA_PAGINA = ("configuracoes", "noticias_fixadas")

# Por quanto tempo um título já coletado barra outro igual vindo de outro
# site. Passado isso, um título repetido pode ser notícia nova de verdade
# ("Inscrições do Vestibulinho terminam hoje" acontece todo semestre).
DIAS_DE_TITULO_REPETIDO = 30

# Por quanto tempo uma notícia recusada fica guardada antes de ser apagada de
# vez. Ela é mantida até aqui só pra não deixar a mesma notícia voltar na
# próxima coleta (ver repetida() abaixo) — depois disso não serve mais pra
# nada. Como coletadaEm é sempre <= recusadaEm, uma recusada com mais de 30
# dias já caiu fora da janela de DIAS_DE_TITULO_REPETIDO de qualquer forma,
# então apagar aqui não reabre brecha pra repetição.
DIAS_PARA_APAGAR_RECUSADA = 30

# Por quanto tempo uma notícia de outro site fica no site depois de
# publicada. A página Notícias só mostra as 60 mais novas, então as antigas
# ficavam guardadas sem ninguém ver. 90 dias cobrem um ciclo inteiro de
# inscrição, prova, resultado e matrícula. Como a coleta já ignora notícia com
# mais de noticias.DIAS_VALIDOS (45) dias, a que é apagada aqui não volta.
DIAS_NO_SITE = 90


def coletar_e_gravar(db, origem):
    """origem: "painel" (botão) ou "agendada". Devolve o resumo da coleta."""
    return gravar_coleta(db, noticias.coletar(), origem)


def gravar_coleta(db, coleta, origem):
    agora = datetime.now(timezone.utc)
    fila = db.collection(FILA)
    candidatas = coleta["noticias"]

    ja_vistas = set()
    if candidatas:
        referencias = [fila.document(noticia["id"]) for noticia in candidatas]
        ja_vistas = {registro.id for registro in db.get_all(referencias) if registro.exists}

    desde = noticias.em_iso(agora - timedelta(days=DIAS_DE_TITULO_REPETIDO))
    titulos_recentes = {
        (registro.to_dict() or {}).get("chaveTitulo") or ""
        for registro in fila.where("coletadaEm", ">=", desde).select(["chaveTitulo"]).stream()
    }
    recentes_em_palavras = [noticias.palavras_do_titulo(chave) for chave in titulos_recentes]

    def repetida(noticia):
        if noticia["id"] in ja_vistas or noticia["chaveTitulo"] in titulos_recentes:
            return True
        # o que vem da busca aberta também cai fora quando o título é quase
        # igual ao de uma notícia que já está na fila
        return noticia.get("feed") in noticias.FEEDS_AGREGADORES and noticias.titulo_parecido(
            noticias.palavras_do_titulo(noticia["chaveTitulo"]), recentes_em_palavras
        )

    novas = [noticia for noticia in candidatas if not repetida(noticia)]
    noticias.completar_imagens(novas)

    coletada_em = noticias.em_iso(agora)
    for inicio in range(0, len(novas), 400):
        lote = db.batch()
        for noticia in novas[inicio:inicio + 400]:
            dados = {campo: valor for campo, valor in noticia.items() if campo != "id"}
            lote.set(fila.document(noticia["id"]), {**dados, "status": "pendente", "coletadaEm": coletada_em})
        lote.commit()

    resumo = {
        "coletadaEm": coletada_em,
        "origem": origem,
        "novas": len(novas),
        "repetidas": len(candidatas) - len(novas),
        "fontes": coleta["fontes"],
    }
    # o painel mostra isto como "última busca"
    db.collection(REGISTRO_DA_COLETA[0]).document(REGISTRO_DA_COLETA[1]).set(resumo)
    return resumo


def apagar_recusadas_antigas(db):
    """Apaga de vez as notícias recusadas há mais de DIAS_PARA_APAGAR_RECUSADA
    dias. Chamada só pela coleta agendada (main.py), pra não atrasar o botão
    "Buscar notícias agora" do painel com uma varredura que não precisa ser na
    hora. Devolve quantas foram apagadas.

    Só filtra por "recusadaEm" (sem "status =="): esse campo só existe em
    quem foi recusada (noticias-dados.js apaga ele ao aprovar/devolver), então
    a comparação já exclui sozinha quem não é recusada — e evita precisar de
    um índice composto no Firestore (mesmo truque de listarFila('recusada')
    no painel, que ordena por recusadaEm em vez de filtrar por status)."""
    limite = noticias.em_iso(datetime.now(timezone.utc) - timedelta(days=DIAS_PARA_APAGAR_RECUSADA))
    antigas = list(db.collection(FILA).where("recusadaEm", "<=", limite).stream())

    for inicio in range(0, len(antigas), 400):
        lote = db.batch()
        for registro in antigas[inicio:inicio + 400]:
            lote.delete(registro.reference)
        lote.commit()

    return len(antigas)


def _ids_da_lista(db, caminho):
    registro = db.collection(caminho[0]).document(caminho[1]).get()
    itens = (registro.to_dict() or {}).get("itens") if registro.exists else None
    return {str(item.get("id")) for item in (itens or []) if isinstance(item, dict) and item.get("id")}


def ids_no_carrossel(db):
    """Os ids das notícias que estão no carrossel da Início."""
    return _ids_da_lista(db, DESTAQUES_DA_INICIO)


def ids_fixadas(db):
    """Os ids das notícias fixadas no alto da página Notícias."""
    return _ids_da_lista(db, FIXADAS_DA_PAGINA)


def deve_sair_do_site(registro, escolhidas):
    """A notícia (já com mais de DIAS_NO_SITE dias) sai do site? Ficam as do
    Futuro+, que o painel Notícias próprias cuida, e as escolhidas no painel
    (carrossel da Início e fixadas da página Notícias): essas saem na
    primeira limpeza depois de deixarem a lista."""
    dados = registro.to_dict() or {}
    return not dados.get("propria") and registro.id not in escolhidas


def apagar_noticias_antigas_do_site(db):
    """Apaga de vez as notícias de outros sites publicadas há mais de
    DIAS_NO_SITE dias: a cópia do site (noticias) e o registro da fila de
    aprovação (noticias_fila). Chamada só pela coleta agendada (main.py), como
    apagar_recusadas_antigas. Devolve quantas foram apagadas."""
    limite = noticias.em_iso(datetime.now(timezone.utc) - timedelta(days=DIAS_NO_SITE))
    escolhidas = ids_no_carrossel(db) | ids_fixadas(db)
    antigas = [
        registro for registro in db.collection(PUBLICADAS).where("publicadaEm", "<=", limite).stream()
        if deve_sair_do_site(registro, escolhidas)
    ]

    # duas exclusões por notícia; um lote aceita 500
    for inicio in range(0, len(antigas), 200):
        lote = db.batch()
        for registro in antigas[inicio:inicio + 200]:
            lote.delete(registro.reference)
            lote.delete(db.collection(FILA).document(registro.id))
        lote.commit()

    return len(antigas)
