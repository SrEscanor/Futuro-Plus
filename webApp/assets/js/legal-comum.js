// Busca o conteúdo publicado no admin (configuracoes/{colecaoId}) e mostra
// na página. Se ainda ninguém publicou nada por lá, cai no texto padrão.
import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase-config.js';

export async function carregarDocumentoLegal(colecaoId, htmlPadrao) {
    const alvo = document.getElementById('conteudo-legal');
    try {
        const snap = await getDoc(doc(db, 'configuracoes', colecaoId));
        alvo.innerHTML = snap.exists() && snap.data().html ? snap.data().html : htmlPadrao;
    } catch (erro) {
        console.error(`Erro ao carregar ${colecaoId}:`, erro);
        alvo.innerHTML = htmlPadrao;
    }
}
