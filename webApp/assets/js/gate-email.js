// Bloqueia o uso do site até a pessoa confirmar o e-mail da conta (link
// enviado no cadastro). Mesmo padrão do gate-termos.js: modal não fechável,
// só dá pra sair da conta ou confirmar. Contas do Google já chegam com
// e-mail verificado, então nunca veem essa tela.
import { sendEmailVerification, signOut } from 'firebase/auth';
import { auth } from './firebase-config.js';

function injetarEstilos() {
    if (document.getElementById('ge-estilos')) return;
    const estilo = document.createElement('style');
    estilo.id = 'ge-estilos';
    estilo.textContent = `
        .ge-modal {
            border: none;
            border-radius: 18px;
            padding: 0;
            width: min(440px, 92vw);
            box-shadow: 0 24px 60px -20px rgba(20, 24, 60, 0.45);
            font-family: 'Inter', 'Segoe UI', Arial, sans-serif;
            color: var(--ink, #1b1f3b);
        }
        .ge-modal::backdrop { background: rgba(23, 27, 58, 0.65); }
        .ge-modal[open] { display: flex; flex-direction: column; }
        .ge-corpo { padding: 26px 24px 22px; text-align: center; }
        .ge-icone { font-size: 40px; margin-bottom: 6px; }
        .ge-corpo h2 {
            font-family: 'Sora', 'Segoe UI', Arial, sans-serif;
            font-size: 18px;
            font-weight: 800;
            margin-bottom: 8px;
        }
        .ge-corpo p { font-size: 13.5px; line-height: 1.55; color: var(--ink-soft, #5b6084); margin-bottom: 6px; }
        .ge-email { font-weight: 700; color: var(--ink, #1b1f3b); }
        .ge-status { font-size: 12.5px; margin: 12px 0 4px; min-height: 16px; }
        .ge-status.ok { color: #21a85c; font-weight: 600; }
        .ge-status.erro { color: var(--red, #dc2626); font-weight: 600; }
        .ge-acoes { display: flex; flex-direction: column; gap: 8px; margin-top: 14px; }
        .ge-btn-primario, .ge-btn-secundario, .ge-btn-terciario {
            padding: 12px 18px; border-radius: 99px; font-family: 'Sora', sans-serif;
            font-size: 13.5px; font-weight: 700; cursor: pointer; border: none;
        }
        .ge-btn-primario { background: var(--blue, #4e6ee8); color: #fff; }
        .ge-btn-primario:disabled { opacity: 0.6; cursor: not-allowed; }
        .ge-btn-secundario { background: none; border: 1.5px solid var(--line, #e6e8f5); color: var(--ink-soft, #5b6084); }
        .ge-btn-terciario { background: none; color: var(--ink-soft, #5b6084); font-weight: 600; text-decoration: underline; padding: 4px; cursor: pointer; }
    `;
    document.head.appendChild(estilo);
}

function montarModal(email) {
    const modal = document.createElement('dialog');
    modal.id = 'ge-modal';
    modal.className = 'ge-modal';
    modal.innerHTML = `
        <div class="ge-corpo">
            <div class="ge-icone">📩</div>
            <h2>Confirme seu e-mail</h2>
            <p>Mandamos um link de confirmação para <span class="ge-email">${email}</span>. Abra sua caixa de entrada (e o spam, por garantia) e clique no link antes de continuar.</p>
            <div id="ge-status" class="ge-status"></div>
            <div class="ge-acoes">
                <button type="button" id="ge-ja-confirmei" class="ge-btn-primario">Já confirmei, continuar</button>
                <button type="button" id="ge-reenviar" class="ge-btn-terciario">Reenviar e-mail</button>
                <button type="button" id="ge-sair" class="ge-btn-secundario">Sair da conta</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    return modal;
}

// Devolve true se pode seguir usando o site, false se travou no modal
// (a própria função cuida de fechar o modal e recarregar quando confirmar).
export async function verificarEmailConfirmado(user) {
    if (user.emailVerified) return true;

    injetarEstilos();
    const modal = document.getElementById('ge-modal') || montarModal(user.email);
    const status = modal.querySelector('#ge-status');
    const botaoConfirmei = modal.querySelector('#ge-ja-confirmei');
    const botaoReenviar = modal.querySelector('#ge-reenviar');
    const botaoSair = modal.querySelector('#ge-sair');

    botaoConfirmei.addEventListener('click', async () => {
        status.textContent = '';
        status.className = 'ge-status';
        botaoConfirmei.disabled = true;
        botaoConfirmei.textContent = 'Verificando...';
        try {
            await user.reload();
            if (auth.currentUser.emailVerified) {
                modal.close();
                modal.remove();
                window.location.reload();
                return;
            }
            status.textContent = 'Ainda não encontramos a confirmação. Clique no link do e-mail e tente de novo.';
            status.className = 'ge-status erro';
        } catch (erro) {
            console.error('Erro ao checar confirmação de e-mail:', erro);
            status.textContent = 'Não consegui checar agora. Tente de novo.';
            status.className = 'ge-status erro';
        } finally {
            botaoConfirmei.disabled = false;
            botaoConfirmei.textContent = 'Já confirmei, continuar';
        }
    });

    botaoReenviar.addEventListener('click', async () => {
        botaoReenviar.disabled = true;
        const textoOriginal = botaoReenviar.textContent;
        botaoReenviar.textContent = 'Enviando...';
        try {
            await sendEmailVerification(user);
            status.textContent = 'E-mail reenviado!';
            status.className = 'ge-status ok';
        } catch (erro) {
            console.error('Erro ao reenviar e-mail de verificação:', erro);
            status.textContent = erro.code === 'auth/too-many-requests'
                ? 'Muitas tentativas — espera um pouco antes de reenviar de novo.'
                : 'Não consegui reenviar agora. Tente de novo em instantes.';
            status.className = 'ge-status erro';
        } finally {
            botaoReenviar.disabled = false;
            botaoReenviar.textContent = textoOriginal;
        }
    });

    botaoSair.addEventListener('click', async () => {
        await signOut(auth);
        window.location.href = 'login.html';
    });

    // Não dá pra fechar no Esc: só confirmando ou saindo. O preventDefault
    // no 'cancel' já deveria bastar, mas em alguns navegadores o Esc fecha
    // o <dialog> mesmo assim — o listener de 'close' reabre na hora se
    // ainda não confirmou, pra garantir que não tem brecha.
    modal.addEventListener('cancel', (e) => e.preventDefault());
    modal.addEventListener('close', () => {
        if (!auth.currentUser?.emailVerified) modal.showModal();
    });
    modal.showModal();
    return false;
}
