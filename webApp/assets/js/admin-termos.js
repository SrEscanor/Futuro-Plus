import { auth, db } from './firebase-config.js';
import {
    onAuthStateChanged, signOut, EmailAuthProvider, GoogleAuthProvider,
    reauthenticateWithCredential, reauthenticateWithPopup
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { TERMOS_PADRAO, PRIVACIDADE_PADRAO } from './conteudo-legal-padrao.js';

const DOCS = {
    termos: { colecaoId: 'termos-de-uso', textareaId: 'conteudo-termos', versaoId: 'versao-termos', padrao: TERMOS_PADRAO },
    privacidade: { colecaoId: 'politica-privacidade', textareaId: 'conteudo-privacidade', versaoId: 'versao-privacidade', padrao: PRIVACIDADE_PADRAO }
};

let usuarioAtual = null;
const versoesAtuais = { termos: 0, privacidade: 0 };

async function carregarDocumento(chave) {
    const { colecaoId, textareaId, versaoId, padrao } = DOCS[chave];
    const snap = await getDoc(doc(db, 'configuracoes', colecaoId));
    const dados = snap.exists() ? snap.data() : null;

    versoesAtuais[chave] = dados?.versao || 0;
    document.getElementById(textareaId).value = dados?.html || padrao;
    document.getElementById(versaoId).textContent = dados?.versao
        ? `versão atual publicada: ${dados.versao}`
        : 'ainda não publicado (mostrando o texto padrão)';
}

function mostrarStatus(mensagem, tipo) {
    const status = document.getElementById('status-publicacao');
    status.style.display = 'block';
    status.textContent = mensagem;
    status.className = tipo ? `status-importacao status-importacao--${tipo}` : 'status-importacao';
}

// Pede a senha de novo (ou confirmação via Google) antes de uma ação que
// afeta todo mundo — mesma ideia da "danger zone" do GitHub.
async function reautenticar(senha) {
    const provedor = usuarioAtual.providerData[0]?.providerId;
    if (provedor === 'google.com') {
        await reauthenticateWithPopup(usuarioAtual, new GoogleAuthProvider());
        return;
    }
    if (!senha) throw Object.assign(new Error('Senha necessária'), { code: 'senha-necessaria' });
    await reauthenticateWithCredential(usuarioAtual, EmailAuthProvider.credential(usuarioAtual.email, senha));
}

async function publicar() {
    const senha = document.getElementById('confirmar-senha-admin').value;

    if (!confirm('Isso publica os textos atuais como a nova versão oficial. Toda conta que já aceitou uma versão anterior vai precisar aceitar de novo pra continuar usando o site. Confirma?')) {
        return;
    }

    mostrarStatus('Confirmando sua identidade...', null);
    try {
        await reautenticar(senha);
    } catch (erro) {
        console.error('Erro ao reautenticar:', erro);
        mostrarStatus(
            erro.code === 'senha-necessaria' ? 'Digite sua senha para confirmar.' : 'Senha incorreta ou confirmação cancelada.',
            'erro'
        );
        return;
    }

    mostrarStatus('Publicando...', null);
    try {
        const agora = new Date().toISOString();
        await setDoc(doc(db, 'configuracoes', 'termos-de-uso'), {
            versao: versoesAtuais.termos + 1,
            html: document.getElementById('conteudo-termos').value,
            atualizadoEm: agora,
            atualizadoPor: usuarioAtual.uid
        });
        await setDoc(doc(db, 'configuracoes', 'politica-privacidade'), {
            versao: versoesAtuais.privacidade + 1,
            html: document.getElementById('conteudo-privacidade').value,
            atualizadoEm: agora,
            atualizadoPor: usuarioAtual.uid
        });

        document.getElementById('confirmar-senha-admin').value = '';
        mostrarStatus('Publicado! A partir de agora, quem já tinha aceitado uma versão anterior vai ver o aviso pra aceitar de novo.', 'ok');
        await Promise.all([carregarDocumento('termos'), carregarDocumento('privacidade')]);
    } catch (erro) {
        console.error('Erro ao publicar termos:', erro);
        mostrarStatus('Não consegui publicar agora. Tente de novo.', 'erro');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    onAuthStateChanged(auth, async (user) => {
        if (!user) {
            window.location.href = 'login.html';
            return;
        }

        try {
            const snap = await getDoc(doc(db, 'usuarios', user.uid));
            if (!snap.exists() || snap.data().admin !== true) {
                document.getElementById('admin-app').style.display = 'none';
                document.getElementById('acesso-negado').style.display = 'flex';
                return;
            }

            usuarioAtual = user;
            document.getElementById('admin-email').textContent = user.email || '';
            document.getElementById('admin-app').style.display = 'block';

            // Quem entrou com Google confirma pelo popup do Google, não por senha.
            if (user.providerData[0]?.providerId === 'google.com') {
                document.getElementById('campo-senha-admin').hidden = true;
            }

            await Promise.all([carregarDocumento('termos'), carregarDocumento('privacidade')]);
        } catch (err) {
            console.error('Erro ao verificar acesso de administrador:', err);
            document.getElementById('admin-app').style.display = 'none';
            document.getElementById('acesso-negado').style.display = 'flex';
        }
    });

    document.getElementById('logout-btn').addEventListener('click', async () => {
        await signOut(auth);
        window.location.href = 'login.html';
    });

    document.getElementById('btn-publicar-termos').addEventListener('click', publicar);
});
