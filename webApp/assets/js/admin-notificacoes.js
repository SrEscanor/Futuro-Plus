import { auth, db } from './firebase-config.js';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import {
    collection, doc, getDoc, getDocs, setDoc, deleteDoc
} from 'firebase/firestore';

const COLECAO = 'notificacoes';

let notificacoesCache = [];
let editandoId = null;

function escapeHtml(str) {
    return String(str ?? '').replace(/[&<>"']/g, (c) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
}

function formatarDataHora(iso) {
    const data = new Date(iso || '');
    if (Number.isNaN(data.getTime())) return '';
    return data.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

const LABEL_PUBLICO = {
    logados: 'Quem tem conta',
    deslogados: 'Visitante',
    todos: 'Todo mundo'
};

function mostrarStatus(mensagem, tipo) {
    const status = document.getElementById('status-notificacoes');
    status.style.display = 'block';
    status.textContent = mensagem;
    status.className = tipo ? `status-importacao status-importacao--${tipo}` : 'status-importacao';
}

// ========================================================
// Firestore
// ========================================================

async function carregarNotificacoes() {
    const snap = await getDocs(collection(db, COLECAO));
    notificacoesCache = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (b.criadoEm || '').localeCompare(a.criadoEm || ''));
    renderizarTabela();
}

function renderizarTabela() {
    const corpo = document.getElementById('tabela-notificacoes-corpo');

    if (!notificacoesCache.length) {
        corpo.innerHTML = `<tr><td colspan="8" class="tabela-vazia">Nenhuma notificação cadastrada ainda.</td></tr>`;
        return;
    }

    corpo.innerHTML = notificacoesCache.map((n) => `
        <tr>
            <td>${escapeHtml(n.titulo)}</td>
            <td>${escapeHtml((n.mensagem || '').slice(0, 80))}${(n.mensagem || '').length > 80 ? '…' : ''}</td>
            <td>${escapeHtml(LABEL_PUBLICO[n.publico || 'logados'])}</td>
            <td>${n.mostrarModal ? '✓' : '—'}</td>
            <td>${n.mostrarSino ? '✓' : '—'}</td>
            <td>${n.ativo !== false ? '✓' : '—'}</td>
            <td>${formatarDataHora(n.criadoEm)}</td>
            <td class="col-acoes">
                <button type="button" class="btn-icone" data-acao="editar" data-id="${escapeHtml(n.id)}" title="Editar">✏️</button>
                <button type="button" class="btn-icone" data-acao="excluir" data-id="${escapeHtml(n.id)}" title="Excluir">🗑️</button>
            </td>
        </tr>`).join('');
}

async function salvarNotificacao(event) {
    event.preventDefault();

    const titulo = document.getElementById('f-titulo').value.trim();
    const mensagem = document.getElementById('f-mensagem').value.trim();
    if (!titulo || !mensagem) {
        alert('Preencha o título e a mensagem da notificação.');
        return;
    }

    const existente = editandoId ? notificacoesCache.find((n) => n.id === editandoId) : null;
    const id = editandoId || doc(collection(db, COLECAO)).id;

    const dados = {
        titulo,
        mensagem,
        publico: document.querySelector('input[name="f-publico"]:checked').value,
        mostrarModal: document.getElementById('f-modal').checked,
        mostrarSino: document.getElementById('f-sino').checked,
        ativo: document.getElementById('f-ativa').checked,
        criadoEm: existente?.criadoEm || new Date().toISOString(),
        criadoPor: existente?.criadoPor || auth.currentUser.uid
    };

    try {
        await setDoc(doc(db, COLECAO, id), dados);
        fecharFormulario();
        await carregarNotificacoes();
        mostrarStatus('Notificação salva.', 'ok');
    } catch (err) {
        console.error('Erro ao salvar notificação:', err);
        alert('Erro ao salvar a notificação: ' + err.message);
    }
}

async function excluirNotificacao(id) {
    const notificacao = notificacoesCache.find((n) => n.id === id);
    if (!confirm(`Excluir a notificação "${notificacao ? notificacao.titulo : id}"? Essa ação não pode ser desfeita.`)) return;
    try {
        await deleteDoc(doc(db, COLECAO, id));
        await carregarNotificacoes();
    } catch (err) {
        console.error('Erro ao excluir notificação:', err);
        alert('Erro ao excluir a notificação: ' + err.message);
    }
}

// ========================================================
// Formulário (modal)
// ========================================================

function abrirFormulario(notificacao) {
    editandoId = notificacao ? notificacao.id : null;
    document.getElementById('form-titulo').textContent = notificacao ? 'Editar notificação' : 'Nova notificação';
    document.getElementById('form-notificacao').reset();

    document.getElementById('f-titulo').value = notificacao?.titulo || '';
    document.getElementById('f-mensagem').value = notificacao?.mensagem || '';
    document.getElementById(`f-publico-${notificacao?.publico || 'logados'}`).checked = true;
    document.getElementById('f-modal').checked = notificacao?.mostrarModal || false;
    document.getElementById('f-sino').checked = notificacao ? !!notificacao.mostrarSino : true;
    document.getElementById('f-ativa').checked = notificacao ? notificacao.ativo !== false : true;

    document.getElementById('modal-form').classList.add('aberto');
}

function fecharFormulario() {
    document.getElementById('modal-form').classList.remove('aberto');
    editandoId = null;
}

// ========================================================
// Inicialização
// ========================================================

document.addEventListener('DOMContentLoaded', () => {

    onAuthStateChanged(auth, async (user) => {
        if (!user) {
            window.location.href = 'login.html';
            return;
        }

        try {
            const snap = await getDoc(doc(db, 'usuarios', user.uid));
            const ehAdmin = snap.exists() && snap.data().admin === true;

            if (!ehAdmin) {
                document.getElementById('admin-app').style.display = 'none';
                document.getElementById('acesso-negado').style.display = 'flex';
                return;
            }

            document.getElementById('admin-email').textContent = user.email || '';
            document.getElementById('admin-app').style.display = 'block';
            await carregarNotificacoes();
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

    document.getElementById('btn-nova-notificacao').addEventListener('click', () => abrirFormulario(null));
    document.getElementById('btn-fechar-form').addEventListener('click', fecharFormulario);
    document.getElementById('btn-cancelar-form').addEventListener('click', fecharFormulario);
    document.getElementById('form-notificacao').addEventListener('submit', salvarNotificacao);

    document.getElementById('tabela-notificacoes-corpo').addEventListener('click', (e) => {
        const btn = e.target.closest('.btn-icone');
        if (!btn) return;
        const id = btn.dataset.id;
        if (btn.dataset.acao === 'editar') {
            const notificacao = notificacoesCache.find((n) => n.id === id);
            if (notificacao) abrirFormulario(notificacao);
        } else if (btn.dataset.acao === 'excluir') {
            excluirNotificacao(id);
        }
    });
});
