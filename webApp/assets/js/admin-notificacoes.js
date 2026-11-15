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

// <input type="datetime-local"> trabalha em horário local, sem fuso — as
// duas funções abaixo convertem pra ida e volta do ISO (UTC) que fica salvo.
function paraDatetimeLocal(iso) {
    const data = new Date(iso || '');
    if (Number.isNaN(data.getTime())) return '';
    const dois = (n) => String(n).padStart(2, '0');
    return `${data.getFullYear()}-${dois(data.getMonth() + 1)}-${dois(data.getDate())}T${dois(data.getHours())}:${dois(data.getMinutes())}`;
}

function deDatetimeLocal(valor) {
    if (!valor) return null;
    const data = new Date(valor);
    return Number.isNaN(data.getTime()) ? null : data.toISOString();
}

// Agendamento precisa de pelo menos 1h de folga — não faz sentido "agendar"
// pra daqui a 2 minutos (isso é só publicar direto) nem pro passado.
const MINIMO_AGENDAMENTO_MS = 60 * 60 * 1000;

function minimoAgendamentoIso() {
    return new Date(Date.now() + MINIMO_AGENDAMENTO_MS).toISOString();
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
        corpo.innerHTML = `<tr><td colspan="9" class="tabela-vazia">Nenhuma notificação cadastrada ainda.</td></tr>`;
        return;
    }

    const agora = new Date().toISOString();

    corpo.innerHTML = notificacoesCache.map((n) => {
        const agendadaFutura = n.publicarEm && n.publicarEm > agora;
        const colPublicacao = !n.publicarEm
            ? 'Imediata'
            : agendadaFutura
                ? `<span class="pendencia pendencia--info">Agendada: ${formatarDataHora(n.publicarEm)}</span>`
                : `Publicada ${formatarDataHora(n.publicarEm)}`;

        return `
        <tr>
            <td>${escapeHtml(n.titulo)}</td>
            <td>${escapeHtml((n.mensagem || '').slice(0, 80))}${(n.mensagem || '').length > 80 ? '…' : ''}</td>
            <td>${escapeHtml(LABEL_PUBLICO[n.publico || 'logados'])}</td>
            <td>${n.mostrarModal ? '✓' : '—'}</td>
            <td>${n.mostrarSino ? '✓' : '—'}</td>
            <td>${n.ativo !== false ? '✓' : '—'}</td>
            <td>${colPublicacao}</td>
            <td>${formatarDataHora(n.criadoEm)}</td>
            <td class="col-acoes">
                <button type="button" class="btn-icone" data-acao="editar" data-id="${escapeHtml(n.id)}" title="Editar">✏️</button>
                <button type="button" class="btn-icone" data-acao="excluir" data-id="${escapeHtml(n.id)}" title="Excluir">🗑️</button>
            </td>
        </tr>`;
    }).join('');
}

async function salvarNotificacao(event) {
    event.preventDefault();

    const titulo = document.getElementById('f-titulo').value.trim();
    const mensagem = document.getElementById('f-mensagem').value.trim();
    if (!titulo || !mensagem) {
        alert('Preencha o título e a mensagem da notificação.');
        return;
    }

    const publicarEm = deDatetimeLocal(document.getElementById('f-agendar').value);
    // Só barra data no futuro próximo demais — uma já publicada no passado
    // (editando uma notificação antiga sem mexer no agendamento) não conta.
    if (publicarEm && publicarEm > new Date().toISOString() && publicarEm < minimoAgendamentoIso()) {
        alert('O agendamento precisa ser pelo menos 1 hora à frente do horário atual.');
        return;
    }

    const existente = editandoId ? notificacoesCache.find((n) => n.id === editandoId) : null;
    const id = editandoId || doc(collection(db, COLECAO)).id;

    const dados = {
        titulo,
        mensagem,
        publico: document.querySelector('input[name="f-publico"]:checked').value,
        // agendada não pode virar modal (o checkbox já fica travado na tela,
        // isso aqui é só reforço contra um estado de formulário desatualizado)
        mostrarModal: publicarEm ? false : document.getElementById('f-modal').checked,
        mostrarSino: document.getElementById('f-sino').checked,
        enviarPush: document.getElementById('f-push').checked,
        ativo: document.getElementById('f-ativa').checked,
        publicarEm,
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

// Notificação agendada não pode aparecer como modal (ver campo-dica no
// formulário) — trava o checkbox e desmarca enquanto houver data escolhida.
function atualizarDisponibilidadeModal() {
    const agendada = !!document.getElementById('f-agendar').value;
    const checkboxModal = document.getElementById('f-modal');
    checkboxModal.disabled = agendada;
    if (agendada) checkboxModal.checked = false;
}

function abrirFormulario(notificacao) {
    editandoId = notificacao ? notificacao.id : null;
    document.getElementById('form-titulo').textContent = notificacao ? 'Editar notificação' : 'Nova notificação';
    document.getElementById('form-notificacao').reset();

    document.getElementById('f-titulo').value = notificacao?.titulo || '';
    document.getElementById('f-mensagem').value = notificacao?.mensagem || '';
    document.getElementById(`f-publico-${notificacao?.publico || 'logados'}`).checked = true;
    // Se já tem uma data agendada no passado (notificação já publicada), o
    // "min" não pode ficar maior que o valor atual, senão o navegador marca
    // o campo como inválido só por mostrar o que já estava salvo.
    const minimo = notificacao?.publicarEm && notificacao.publicarEm < minimoAgendamentoIso()
        ? notificacao.publicarEm
        : minimoAgendamentoIso();
    document.getElementById('f-agendar').min = paraDatetimeLocal(minimo);
    document.getElementById('f-agendar').value = paraDatetimeLocal(notificacao?.publicarEm);
    document.getElementById('f-modal').checked = notificacao?.mostrarModal || false;
    document.getElementById('f-sino').checked = notificacao ? !!notificacao.mostrarSino : true;
    document.getElementById('f-push').checked = notificacao?.enviarPush || false;
    document.getElementById('f-ativa').checked = notificacao ? notificacao.ativo !== false : true;
    atualizarDisponibilidadeModal();

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
    document.getElementById('f-agendar').addEventListener('input', atualizarDisponibilidadeModal);

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
