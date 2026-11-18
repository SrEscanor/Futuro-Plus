// Uma página de um histórico do painel admin, do registro mais novo para o
// mais antigo. Usado pelos módulos de dados de cada painel
// (notificacoes-dados.js, noticias-dados.js, noticias-proprias-dados.js e
// comunidade-dados.js); a barra de filtros (historico-filtros.js) pede uma
// página por vez, passando o cursor que a anterior devolveu.
import { db } from './firebase-config.js';
import { collection, getDocs, limit, orderBy, query, startAfter } from 'firebase/firestore';

// datas do Firestore viram texto ISO, como o resto do painel espera
const iso = (valor) => (valor?.toDate ? valor.toDate().toISOString() : valor ?? null);

function comDatasEmTexto(registro) {
    const pronto = { ...registro, em: iso(registro.em) };
    if ('escritoEm' in pronto) pronto.escritoEm = iso(pronto.escritoEm);
    if (Array.isArray(pronto.respostasApagadas)) {
        pronto.respostasApagadas = pronto.respostasApagadas.map((r) => ({ ...r, escritoEm: iso(r.escritoEm) }));
    }
    return pronto;
}

export async function paginaDoHistorico(nomeDaColecao, { quantos = 100, depois = null } = {}) {
    const partes = [orderBy('em', 'desc')];
    if (depois) partes.push(startAfter(depois));
    // um a mais para saber se ainda tem depois desta página
    partes.push(limit(quantos + 1));
    const snap = await getDocs(query(collection(db, nomeDaColecao), ...partes));
    const docs = snap.docs.slice(0, quantos);
    return {
        registros: docs.map((d) => comDatasEmTexto({ id: d.id, ...d.data() })),
        cursor: docs.at(-1) || null,
        haMais: snap.docs.length > quantos
    };
}
