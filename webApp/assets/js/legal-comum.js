// Busca o conteúdo publicado no admin (configuracoes/{colecaoId}) e mostra
// na página. Se ainda ninguém publicou nada por lá, cai no texto padrão.
import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase-config.js';

// O "← Voltar" do topo: volta para onde a pessoa estava (o rodapé da
// Início, o cadastro...). Aberta numa aba nova a partir do site, leva para a
// página que abriu; sem saber de onde veio, para a Início.
export function ligarBotaoVoltar() {
    const voltar = document.querySelector('.legal-topo a');
    if (!voltar) return;
    // dentro da janelinha de leitura do cadastro (iframe) não há para onde voltar
    if (window.self !== window.top) {
        voltar.hidden = true;
        return;
    }
    let deOndeVeio = '';
    try {
        const origem = new URL(document.referrer);
        if (origem.origin === location.origin && origem.pathname !== location.pathname) deOndeVeio = origem.href;
    } catch {
        // sem referrer: fica a Início
    }
    voltar.href = deOndeVeio || 'index.html';
    if (deOndeVeio && history.length > 1) {
        voltar.addEventListener('click', (evento) => {
            evento.preventDefault();
            history.back();
        });
    }
}

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
