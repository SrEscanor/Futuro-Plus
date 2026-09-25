// Bloqueia o uso do site até a pessoa aceitar uma versão nova dos Termos de
// Uso / Política de Privacidade. Chamado por dashboard.js em toda página
// logada — por isso constrói o próprio HTML e CSS em vez de depender de
// marcação already presente na página (evitaria editar as 9 páginas que
// usam a barra de topo).
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { auth, db } from './firebase-config.js';
import { TERMOS_PADRAO, PRIVACIDADE_PADRAO } from './conteudo-legal-padrao.js';

const DOCS = {
    termos: { colecaoId: 'termos-de-uso', titulo: 'Termos de Uso', padrao: TERMOS_PADRAO },
    privacidade: { colecaoId: 'politica-privacidade', titulo: 'Política de Privacidade', padrao: PRIVACIDADE_PADRAO }
};

async function buscarVersaoAtual(chave) {
    const { colecaoId, padrao } = DOCS[chave];
    try {
        const snap = await getDoc(doc(db, 'configuracoes', colecaoId));
        return snap.exists() && snap.data().versao
            ? { versao: snap.data().versao, html: snap.data().html || padrao }
            : { versao: 1, html: padrao };
    } catch (erro) {
        console.error(`Erro ao buscar ${colecaoId}:`, erro);
        return { versao: 1, html: padrao };
    }
}

function injetarEstilos() {
    if (document.getElementById('gt-estilos')) return;
    const estilo = document.createElement('style');
    estilo.id = 'gt-estilos';
    estilo.textContent = `
        .gt-modal {
            border: none;
            border-radius: 18px;
            padding: 0;
            width: min(640px, 92vw);
            max-height: 88vh;
            box-shadow: 0 24px 60px -20px rgba(20, 24, 60, 0.45);
            font-family: 'Inter', 'Segoe UI', Arial, sans-serif;
            color: var(--ink, #1b1f3b);
        }
        .gt-modal::backdrop { background: rgba(23, 27, 58, 0.65); }
        .gt-modal[open] { display: flex; flex-direction: column; }
        .gt-cabecalho {
            padding: 20px 22px 8px;
            flex-shrink: 0;
        }
        .gt-cabecalho h2 {
            font-family: 'Sora', 'Segoe UI', Arial, sans-serif;
            font-size: 18px;
            font-weight: 800;
        }
        .gt-tela { padding: 4px 22px 22px; overflow: auto; }
        .gt-tela p { font-size: 14px; line-height: 1.55; color: var(--ink-soft, #5b6084); margin-bottom: 14px; }
        .gt-botoes { display: flex; flex-direction: column; gap: 8px; margin-bottom: 14px; }
        .gt-btn-ler {
            display: flex; align-items: center; gap: 8px;
            padding: 11px 14px; border: 1.5px solid var(--line, #e6e8f5); border-radius: 12px;
            background: var(--bg, #f6f7fc); color: var(--ink, #1b1f3b);
            font-family: inherit; font-size: 13px; font-weight: 600; text-align: left; cursor: pointer;
        }
        .gt-btn-ler:hover { border-color: var(--blue, #4e6ee8); }
        .gt-btn-ler--lido { border-color: #21a85c; background: #e8faf0; }
        .gt-aceite { display: flex; align-items: flex-start; gap: 10px; margin-bottom: 16px; }
        .gt-aceite input[type="checkbox"] { width: 20px; height: 20px; flex-shrink: 0; margin-top: 1px; cursor: pointer; }
        .gt-aceite input[type="checkbox"]:disabled { cursor: not-allowed; }
        .gt-aceite label { font-size: 12.5px; line-height: 1.5; color: var(--ink-soft, #5b6084); }
        .gt-aceite a { color: var(--blue, #4e6ee8); font-weight: 600; }
        .gt-acoes { display: flex; gap: 10px; }
        .gt-btn-primario, .gt-btn-secundario {
            padding: 12px 18px; border-radius: 99px; font-family: 'Sora', sans-serif;
            font-size: 13.5px; font-weight: 700; cursor: pointer; border: none;
        }
        .gt-btn-primario { flex: 1; background: var(--blue, #4e6ee8); color: #fff; }
        .gt-btn-primario:disabled { opacity: 0.5; cursor: not-allowed; }
        .gt-btn-secundario { background: none; border: 1.5px solid var(--line, #e6e8f5); color: var(--ink-soft, #5b6084); }
        .gt-voltar {
            border: none; background: none; color: var(--blue, #4e6ee8); font-weight: 700;
            font-size: 13px; cursor: pointer; padding: 0 0 12px; display: block;
        }
        .gt-scroll {
            max-height: 44vh; overflow-y: auto; padding-right: 6px;
            border-top: 1px solid var(--line, #e6e8f5); border-bottom: 1px solid var(--line, #e6e8f5);
            margin-bottom: 10px; font-size: 13.5px; line-height: 1.6;
        }
        .gt-scroll h1 { font-size: 19px; margin: 14px 0 6px; }
        .gt-scroll h2 { font-size: 15px; margin: 18px 0 6px; }
        .gt-scroll p, .gt-scroll li { margin-bottom: 8px; }
        .gt-scroll .legal-atualizado { font-size: 11.5px; color: var(--ink-soft, #5b6084); }
        .gt-rodape { font-size: 12px; color: var(--ink-soft, #5b6084); text-align: center; }
        .gt-rodape.lido { color: #21a85c; font-weight: 600; }
    `;
    document.head.appendChild(estilo);
}

function montarModal() {
    const modal = document.createElement('dialog');
    modal.id = 'gt-modal';
    modal.className = 'gt-modal';
    modal.innerHTML = `
        <div class="gt-cabecalho"><h2>Atualizamos nossos termos</h2></div>
        <div id="gt-tela-menu" class="gt-tela">
            <p>Para continuar usando o Futuro+, leia e aceite os documentos atualizados abaixo.</p>
            <div class="gt-botoes">
                <button type="button" class="gt-btn-ler" id="gt-btn-termos" data-chave="termos">○ Ler Termos de Uso</button>
                <button type="button" class="gt-btn-ler" id="gt-btn-privacidade" data-chave="privacidade">○ Ler Política de Privacidade</button>
            </div>
            <div class="gt-aceite">
                <input type="checkbox" id="gt-checkbox" disabled>
                <label id="gt-checkbox-label" for="gt-checkbox">Abra e leia os dois documentos acima até o fim para poder aceitar.</label>
            </div>
            <div class="gt-acoes">
                <button type="button" id="gt-sair" class="gt-btn-secundario">Sair da conta</button>
                <button type="button" id="gt-continuar" class="gt-btn-primario" disabled>Continuar usando o site</button>
            </div>
        </div>
        <div id="gt-tela-leitura" class="gt-tela" hidden>
            <button type="button" id="gt-voltar" class="gt-voltar">← Voltar</button>
            <div id="gt-leitura-conteudo" class="gt-scroll"></div>
            <div id="gt-leitura-aviso" class="gt-rodape">Role o texto até o fim para marcar como lido.</div>
        </div>
    `;
    document.body.appendChild(modal);
    return modal;
}

export async function verificarTermosAtualizados(dados) {
    const [termosAtual, privacidadeAtual] = await Promise.all([
        buscarVersaoAtual('termos'),
        buscarVersaoAtual('privacidade')
    ]);

    const aceito = dados.termosAceitos || {};
    const pendencias = {
        termos: (aceito.termos || 0) < termosAtual.versao,
        privacidade: (aceito.privacidade || 0) < privacidadeAtual.versao
    };
    if (!pendencias.termos && !pendencias.privacidade) return;

    injetarEstilos();
    const modal = document.getElementById('gt-modal') || montarModal();

    const conteudo = { termos: termosAtual, privacidade: privacidadeAtual };
    const lidos = { termos: !pendencias.termos, privacidade: !pendencias.privacidade };
    let chaveAberta = null;

    const checkbox = modal.querySelector('#gt-checkbox');
    const checkboxLabel = modal.querySelector('#gt-checkbox-label');
    const botaoContinuar = modal.querySelector('#gt-continuar');
    const telaMenu = modal.querySelector('#gt-tela-menu');
    const telaLeitura = modal.querySelector('#gt-tela-leitura');
    const leituraConteudo = modal.querySelector('#gt-leitura-conteudo');
    const leituraAviso = modal.querySelector('#gt-leitura-aviso');

    function atualizarLiberacao() {
        const tudoLido = lidos.termos && lidos.privacidade;
        checkbox.disabled = !tudoLido;
        if (tudoLido) {
            checkboxLabel.innerHTML = 'Li e concordo com os <a href="termos-de-uso.html" target="_blank">Termos de Uso</a> e a <a href="privacidade.html" target="_blank">Política de Privacidade</a> atualizados.';
        }
    }

    function marcarComoLido(chave) {
        if (!chave || lidos[chave]) return;
        lidos[chave] = true;
        modal.querySelector(`#gt-btn-${chave === 'termos' ? 'termos' : 'privacidade'}`).classList.add('gt-btn-ler--lido');
        if (chaveAberta === chave) {
            leituraAviso.textContent = 'Lido! Você já pode voltar.';
            leituraAviso.classList.add('lido');
        }
        atualizarLiberacao();
    }

    function aoRolar() {
        const faltam = leituraConteudo.scrollHeight - (leituraConteudo.scrollTop + leituraConteudo.clientHeight);
        if (faltam < 40) marcarComoLido(chaveAberta);
    }

    function abrirLeitura(chave) {
        chaveAberta = chave;
        leituraConteudo.innerHTML = conteudo[chave].html;
        leituraConteudo.scrollTop = 0;
        leituraAviso.classList.remove('lido');
        leituraAviso.textContent = lidos[chave] ? 'Lido! Você já pode voltar.' : 'Role o texto até o fim para marcar como lido.';
        telaMenu.hidden = true;
        telaLeitura.hidden = false;
        aoRolar();
    }

    modal.querySelector('#gt-btn-termos').addEventListener('click', () => abrirLeitura('termos'));
    modal.querySelector('#gt-btn-privacidade').addEventListener('click', () => abrirLeitura('privacidade'));
    modal.querySelector('#gt-voltar').addEventListener('click', () => {
        telaLeitura.hidden = true;
        telaMenu.hidden = false;
    });
    leituraConteudo.addEventListener('scroll', aoRolar);

    checkbox.addEventListener('change', () => {
        botaoContinuar.disabled = !checkbox.checked;
    });

    modal.querySelector('#gt-sair').addEventListener('click', async () => {
        await signOut(auth);
        window.location.href = 'login.html';
    });

    botaoContinuar.addEventListener('click', async () => {
        botaoContinuar.disabled = true;
        botaoContinuar.textContent = 'Salvando...';
        try {
            await setDoc(doc(db, 'usuarios', auth.currentUser.uid), {
                termosAceitos: {
                    termos: termosAtual.versao,
                    privacidade: privacidadeAtual.versao,
                    aceitoEm: new Date().toISOString()
                }
            }, { merge: true });
            modal.close();
            modal.remove();
        } catch (erro) {
            console.error('Erro ao registrar aceite dos termos:', erro);
            botaoContinuar.disabled = false;
            botaoContinuar.textContent = 'Continuar usando o site';
            alert('Não consegui registrar seu aceite agora. Tente de novo.');
        }
    });

    // Não dá pra fechar no Esc nem clicando fora: só aceitando ou saindo.
    modal.addEventListener('cancel', (e) => e.preventDefault());

    atualizarLiberacao();
    modal.showModal();
}
