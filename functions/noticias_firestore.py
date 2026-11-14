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
REGISTRO_DA_COLETA = ("noticias_coleta", "ultima")

# Por quanto tempo um título já coletado barra outro igual vindo de outro
# site. Passado isso, um título repetido pode ser notícia nova de verdade
# ("Inscrições do Vestibulinho terminam hoje" acontece todo semestre).
DIAS_DE_TITULO_REPETIDO = 30


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
