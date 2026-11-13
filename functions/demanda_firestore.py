"""Grava no Firestore o resultado de uma coleta de demanda (demanda.coletar).

Fica num módulo à parte porque duas coisas gravam do mesmo jeito: a Cloud
Function coletar_demanda (main.py) e o script local atualizar_demanda_local.py
— usado quando o site do vestibular bloqueia as requisições vindas da nuvem
(IP de datacenter) mas aceita as de uma rede comum.
"""
import re
from datetime import datetime, timezone

import demanda


def gravar_coleta(db, site, semestre, coleta):
    """Soma a coleta por curso (merge no histórico de cursos/{id}.demanda) e
    grava o detalhe por unidade em demanda/{site}-{semestre}/unidades.
    Devolve o resumo gravado em demanda/{site}-{semestre}."""
    cursos = {doc_curso.id: (doc_curso.to_dict() or {}) for doc_curso in db.collection("cursos").stream()}
    catalogo = [{"id": id_curso, "nome": c.get("nome"), "nivel": c.get("nivel")} for id_curso, c in cursos.items()]
    por_curso, sem_par = demanda.somar_por_curso(coleta, catalogo)

    agora = datetime.now(timezone.utc).isoformat()
    periodo = f"{semestre[:4]}-{semestre[4]}"
    escritas = []

    for id_curso, soma in por_curso.items():
        historico = [
            h for h in ((cursos[id_curso].get("demanda") or {}).get("historico") or [])
            if h.get("periodo") != periodo
        ]
        historico.append({"periodo": periodo, **soma})
        historico.sort(key=lambda h: h["periodo"])
        escritas.append((
            db.collection("cursos").document(id_curso),
            {"demanda": {"historico": historico, "atualizadoEm": agora}},
            True,
        ))

    registro = db.collection("demanda").document(f"{site}-{semestre}")
    for unidade in coleta["unidades"]:
        id_unidade = re.sub(r"[^a-zA-Z0-9_-]+", "_", demanda.normalizar(unidade["codigo"]))[:120] or "sem-codigo"
        escritas.append((registro.collection("unidades").document(id_unidade), unidade, False))

    resumo = {
        "site": site,
        "semestre": semestre,
        "coletadoEm": agora,
        "unidades": len(coleta["unidades"]),
        "linhas": sum(len(u["cursos"]) for u in coleta["unidades"]),
        "cursos": len(por_curso),
        # nomes que o site publica e o catálogo não tem, para revisão
        "semPar": sem_par[:60],
        "falhas": coleta["falhas"][:60],
    }
    escritas.append((registro, resumo, False))

    _gravar_em_lotes(db, escritas)
    return resumo


def _gravar_em_lotes(db, escritas, tamanho=400):
    """escritas: lista de (referência, dados, merge)."""
    for inicio in range(0, len(escritas), tamanho):
        lote = db.batch()
        for referencia, dados, merge in escritas[inicio:inicio + tamanho]:
            lote.set(referencia, dados, merge=merge)
        lote.commit()
