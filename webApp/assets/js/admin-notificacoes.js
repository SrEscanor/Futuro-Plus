// Painel Admin · Notificações: os avisos que aparecem como modal ao entrar,
// na lista do sino e (opcional) como notificação no dispositivo. Cada aviso
// pode levar para uma notícia do site: no sino e no modal ele vira link, e no
// push tocar abre a matéria. Tudo o que é feito fica no histórico, com o
// e-mail de quem fez (aba Histórico).
//
// Os dados chegam só por notificacoes-dados.js (os roteiros de teste trocam
// esse arquivo por uma cópia de mentira). O painel Notícias manda para cá
// com ?noticia=<id> para criar um aviso já ligado à notícia.
import {
    excluirNotificacao, lerNoticiaDoSite, listarHistorico, listarNoticiasDoSite, listarNotificacoes, novoId,
    observarAdmin, sairDaConta, salvarNotificacao
} from './notificacoes-dados.js';
import {
    ACOES_NOTIFICACAO, linkDaNoticia, noticiaLigada, oQueMudou, textoSugerido
} from './notificacoes-util.js';
import { dataHora } from './noticias-proprias-util.js';

let notificacoesCache = [];
let editandoId = null;
let iniciado = false;

// a notícia ligada ao aviso que está no formulário (o que fica guardado nele)
let noticiaDoFormulario = null;
// as notícias do site para escolher (lidas uma vez, na primeira escolha)
let noticiasDoSite = null;

const el = (id) => document.getElementById(id);

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

function dataCurta(iso) {
    const data = new Date(iso || '');
    if (Number.isNaN(data.getTime())) return '';
    return data.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

// "há 13 horas", "há 2 dias"
function haQuantoTempo(iso) {
    const data = new Date(iso || '');
    if (Number.isNaN(data.getTime())) return '';
    const minutos = Math.max(0, Math.round((Date.now() - data) / 60000));
    if (minutos < 2) return 'agora há pouco';
    if (minutos < 60) return `há ${minutos} minutos`;
    const horas = Math.round(minutos / 60);
    if (horas < 24) return `há ${horas} ${horas === 1 ? 'hora' : 'horas'}`;
    const dias = Math.round(horas / 24);
    return dias === 1 ? 'há 1 dia' : `há ${dias} dias`;
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
    const status = el('status-notificacoes');
    status.style.display = 'block';
    status.textContent = mensagem;
    status.className = tipo ? `status-importacao status-importacao--${tipo}` : 'status-importacao';
}

// ========================================================
// Lista de notificações
// ========================================================

async function carregarNotificacoes() {
    notificacoesCache = await listarNotificacoes();
    renderizarTabela();
}

// "Leva para: título da notícia" (ou o endereço, se não tiver a notícia guardada)
function levaParaHtml(n) {
    if (!n.link) return '';
    const nome = n.noticia?.titulo || n.link;
    return `<span class="notif-leva" title="${escapeHtml(nome)}"><b>Leva para:</b><span>${escapeHtml(nome)}</span></span>`;
}

function renderizarTabela() {
    const corpo = el('tabela-notificacoes-corpo');

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
            <td>${escapeHtml((n.mensagem || '').slice(0, 80))}${(n.mensagem || '').length > 80 ? '…' : ''}${levaParaHtml(n)}</td>
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

// ========================================================
// Histórico
// ========================================================

const COR_DA_ACAO = {
    criou: 'positiva',
    ativou: 'positiva',
    editou: 'neutra',
    desativou: 'negativa',
    excluiu: 'negativa'
};

function linhaDoHistorico(registro) {
    const acao = ACOES_NOTIFICACAO[registro.acao] || registro.acao;
    return `
        <tr>
            <td class="historico-quando"><strong>${escapeHtml(dataHora(registro.em))}</strong><small>${escapeHtml(haQuantoTempo(registro.em))}</small></td>
            <td class="historico-quem">${escapeHtml(registro.email || '—')}</td>
            <td><span class="historico-acao historico-acao--${COR_DA_ACAO[registro.acao] || 'neutra'}">${escapeHtml(acao)}</span>${registro.detalhe
                ? ` <small class="historico-detalhe">${escapeHtml(registro.detalhe)}</small>` : ''}</td>
            <td>${escapeHtml(registro.titulo || '')}</td>
        </tr>`;
}

async function carregarHistorico() {
    const corpo = el('historico-corpo');
    corpo.innerHTML = '<tr><td colspan="4" class="tabela-vazia">Carregando histórico...</td></tr>';
    try {
        const registros = await listarHistorico({ quantos: 100 });
        corpo.innerHTML = registros.length
            ? registros.map(linhaDoHistorico).join('')
            : '<tr><td colspan="4" class="tabela-vazia">Nada registrado ainda. O histórico começa na próxima notificação salva.</td></tr>';
    } catch (erro) {
        console.error('Erro ao carregar o histórico das notificações:', erro);
        corpo.innerHTML = '<tr><td colspan="4" class="tabela-vazia">Não foi possível carregar o histórico agora.</td></tr>';
    }
}

function abrirAba(aba) {
    const abas = ['avisos', 'historico'];
    if (!abas.includes(aba)) return;
    for (const nome of abas) {
        const botao = el(`aba-${nome}`);
        const ativa = nome === aba;
        botao.classList.toggle('aba-admin--ativa', ativa);
        botao.setAttribute('aria-selected', String(ativa));
        botao.tabIndex = ativa ? 0 : -1;
        el(`painel-${nome}`).hidden = !ativa;
    }
    if (aba === 'historico') carregarHistorico();
}

// ========================================================
// Gravação
// ========================================================

async function salvarFormulario(event) {
    event.preventDefault();

    const titulo = el('f-titulo').value.trim();
    const mensagem = el('f-mensagem').value.trim();
    if (!titulo || !mensagem) {
        alert('Preencha o título e a mensagem da notificação.');
        return;
    }

    const publicarEm = deDatetimeLocal(el('f-agendar').value);
    // Só barra data no futuro próximo demais — uma já publicada no passado
    // (editando uma notificação antiga sem mexer no agendamento) não conta.
    if (publicarEm && publicarEm > new Date().toISOString() && publicarEm < minimoAgendamentoIso()) {
        alert('O agendamento precisa ser pelo menos 1 hora à frente do horário atual.');
        return;
    }

    const existente = editandoId ? notificacoesCache.find((n) => n.id === editandoId) : null;
    const id = editandoId || novoId();

    const dados = {
        titulo,
        mensagem,
        publico: document.querySelector('input[name="f-publico"]:checked').value,
        // agendada não pode virar modal (o checkbox já fica travado na tela,
        // isso aqui é só reforço contra um estado de formulário desatualizado)
        mostrarModal: publicarEm ? false : el('f-modal').checked,
        mostrarSino: el('f-sino').checked,
        enviarPush: el('f-push').checked,
        ativo: el('f-ativa').checked,
        publicarEm,
        // a notícia para onde o aviso leva (link vazio = não leva a lugar nenhum)
        link: noticiaDoFormulario ? linkDaNoticia(noticiaDoFormulario) : '',
        noticia: noticiaDoFormulario ? noticiaLigada(noticiaDoFormulario) : null,
        criadoEm: existente?.criadoEm || new Date().toISOString(),
        // a nova recebe o uid de quem está logado em salvarNotificacao()
        criadoPor: existente?.criadoPor || null
    };

    const historico = oQueMudou(existente, dados);
    if (!historico) {
        fecharFormulario();
        mostrarStatus('Nada mudou nesta notificação.', '');
        return;
    }

    const botao = document.querySelector('#form-notificacao [type="submit"]');
    botao.disabled = true;
    try {
        await salvarNotificacao(id, dados, historico);
        fecharFormulario();
        await carregarNotificacoes();
        mostrarStatus(existente ? 'Notificação salva.' : 'Notificação criada.', 'ok');
    } catch (err) {
        console.error('Erro ao salvar notificação:', err);
        alert('Erro ao salvar a notificação: ' + err.message);
    } finally {
        botao.disabled = false;
    }
}

async function excluir(id) {
    const notificacao = notificacoesCache.find((n) => n.id === id);
    if (!notificacao) return;
    if (!confirm(`Excluir a notificação "${notificacao.titulo}"? Ela some do site, mas o registro no histórico continua guardado.`)) return;
    try {
        await excluirNotificacao(notificacao);
        await carregarNotificacoes();
        mostrarStatus('Notificação excluída.', 'ok');
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
    const agendada = !!el('f-agendar').value;
    const checkboxModal = el('f-modal');
    checkboxModal.disabled = agendada;
    if (agendada) checkboxModal.checked = false;
}

// noticiaInicial: a notícia já escolhida (vinda do painel Notícias)
function abrirFormulario(notificacao, noticiaInicial = null) {
    editandoId = notificacao ? notificacao.id : null;
    el('form-titulo').textContent = notificacao ? 'Editar notificação' : 'Nova notificação';
    el('form-notificacao').reset();

    el('f-titulo').value = notificacao?.titulo || '';
    el('f-mensagem').value = notificacao?.mensagem || '';
    el(`f-publico-${notificacao?.publico || 'logados'}`).checked = true;
    // Se já tem uma data agendada no passado (notificação já publicada), o
    // "min" não pode ficar maior que o valor atual, senão o navegador marca
    // o campo como inválido só por mostrar o que já estava salvo.
    const minimo = notificacao?.publicarEm && notificacao.publicarEm < minimoAgendamentoIso()
        ? notificacao.publicarEm
        : minimoAgendamentoIso();
    el('f-agendar').min = paraDatetimeLocal(minimo);
    el('f-agendar').value = paraDatetimeLocal(notificacao?.publicarEm);
    el('f-modal').checked = notificacao?.mostrarModal || false;
    el('f-sino').checked = notificacao ? !!notificacao.mostrarSino : true;
    el('f-push').checked = notificacao?.enviarPush || false;
    el('f-ativa').checked = notificacao ? notificacao.ativo !== false : true;
    atualizarDisponibilidadeModal();

    // a notícia guardada no aviso (com o link que ele já tinha)
    noticiaDoFormulario = notificacao?.noticia && notificacao.link
        ? { ...notificacao.noticia, link: notificacao.link }
        : null;
    fecharEscolhaDeNoticia();
    if (noticiaInicial) escolherNoticia(noticiaInicial);
    else desenharNoticiaEscolhida();

    el('modal-form').classList.add('aberto');
    // título já preenchido (vindo da notícia): o cursor vai para o começo,
    // senão o campo mostra só o fim do texto
    el('f-titulo').focus();
    el('f-titulo').setSelectionRange(0, 0);
    el('f-titulo').scrollLeft = 0;
}

function fecharFormulario() {
    el('modal-form').classList.remove('aberto');
    editandoId = null;
    noticiaDoFormulario = null;
}

// ---- a notícia para onde o aviso leva ----

// https (Storage e sites de notícia), arquivo do próprio site ("/capa.webp")
// e, no computador de quem desenvolve, http://localhost
function capaHtml(imagem) {
    const texto = String(imagem || '');
    return /^https:\/\//i.test(texto) || /^\/[^/]/.test(texto) || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?\//i.test(texto)
        ? `<img class="noticia-capa" src="${escapeHtml(imagem)}" alt="" loading="lazy" referrerpolicy="no-referrer">`
        : '<span class="noticia-capa" aria-hidden="true"></span>';
}

function fonteHtml(noticia) {
    return noticia.propria
        ? '<span class="noticia-fonte noticia-fonte--propria">Futuro+</span>'
        : `<span class="noticia-fonte">${escapeHtml(noticia.fonte || 'Outro site')}</span>`;
}

function desenharNoticiaEscolhida() {
    const caixa = el('f-noticia-escolhida');
    const botao = el('f-noticia-escolher');
    if (!noticiaDoFormulario) {
        caixa.hidden = true;
        caixa.innerHTML = '';
        botao.hidden = false;
        return;
    }
    const link = linkDaNoticia(noticiaDoFormulario) || noticiaDoFormulario.link || '';
    caixa.innerHTML = `
        ${capaHtml(noticiaDoFormulario.imagem)}
        <div class="noticia-escolhida-texto">
            ${fonteHtml(noticiaDoFormulario)}
            <strong>${escapeHtml(noticiaDoFormulario.titulo || 'Notícia')}</strong>
            ${link ? `<a href="${escapeHtml(link)}" target="_blank" rel="noopener noreferrer">Abrir a matéria ↗</a>` : ''}
        </div>
        <div class="noticia-escolhida-acoes">
            <button type="button" class="btn btn-secundario noticia-botao" data-acao="trocar-noticia">Trocar notícia</button>
            <button type="button" class="btn btn-secundario noticia-botao" data-acao="tirar-noticia">Não levar para notícia</button>
        </div>`;
    caixa.hidden = false;
    botao.hidden = true;
}

function escolherNoticia(noticia) {
    noticiaDoFormulario = noticia;
    // título e mensagem vazios ganham os da notícia
    const sugerido = textoSugerido(noticia);
    if (!el('f-titulo').value.trim()) el('f-titulo').value = sugerido.titulo;
    if (!el('f-mensagem').value.trim()) el('f-mensagem').value = sugerido.mensagem;
    fecharEscolhaDeNoticia();
    desenharNoticiaEscolhida();
}

function opcoesHtml(lista) {
    if (!lista.length) return '<li class="noticia-opcoes-aviso">Nenhuma notícia com esse título.</li>';
    return lista.map((noticia) => `
        <li>
            <button type="button" class="noticia-opcao" data-id="${escapeHtml(noticia.id)}">
                ${capaHtml(noticia.imagem)}
                <span>
                    ${fonteHtml(noticia)}<small>${escapeHtml(dataCurta(noticia.publicadaEm))}</small>
                    <strong>${escapeHtml(noticia.titulo || 'Notícia sem título')}</strong>
                </span>
            </button>
        </li>`).join('');
}

function desenharOpcoes() {
    const filtro = el('f-noticia-filtro').value.trim().toLowerCase();
    // só as que têm para onde levar (a de fora precisa de um link https)
    const lista = (noticiasDoSite || [])
        .filter((noticia) => linkDaNoticia(noticia))
        .filter((noticia) => !filtro || String(noticia.titulo || '').toLowerCase().includes(filtro));
    el('f-noticia-lista').innerHTML = opcoesHtml(lista);
}

async function abrirEscolhaDeNoticia() {
    el('f-noticia-busca').hidden = false;
    el('f-noticia-escolher').hidden = true;
    el('f-noticia-escolhida').hidden = true;
    el('f-noticia-filtro').value = '';
    el('f-noticia-filtro').focus();
    if (noticiasDoSite) {
        desenharOpcoes();
        return;
    }
    el('f-noticia-lista').innerHTML = '<li class="noticia-opcoes-aviso">Carregando as notícias do site...</li>';
    try {
        noticiasDoSite = await listarNoticiasDoSite(80);
        desenharOpcoes();
    } catch (erro) {
        console.error('Erro ao carregar as notícias do site:', erro);
        el('f-noticia-lista').innerHTML = '<li class="noticia-opcoes-aviso">Não foi possível carregar as notícias agora.</li>';
    }
}

function fecharEscolhaDeNoticia() {
    el('f-noticia-busca').hidden = true;
}

// Veio do painel Notícias com ?noticia=<id>: abre uma notificação nova já
// ligada a ela.
async function abrirComNoticiaDoEndereco() {
    const id = new URLSearchParams(location.search).get('noticia');
    if (!id) return;
    // recarregar a página não abre o formulário de novo
    history.replaceState(null, '', location.pathname);
    try {
        const noticia = await lerNoticiaDoSite(id);
        if (noticia && linkDaNoticia(noticia)) abrirFormulario(null, noticia);
        else mostrarStatus('Essa notícia não está no site (ou não tem um link para abrir).', 'erro');
    } catch (erro) {
        console.error('Erro ao ler a notícia:', erro);
        mostrarStatus('Não foi possível abrir essa notícia agora.', 'erro');
    }
}

// ========================================================
// Inicialização
// ========================================================

async function aoMudarLogin({ usuario, ehAdmin }) {
    if (!usuario) {
        window.location.href = 'login.html';
        return;
    }
    if (!ehAdmin) {
        el('admin-app').style.display = 'none';
        el('acesso-negado').style.display = 'flex';
        return;
    }

    el('acesso-negado').style.display = 'none';
    el('admin-email').textContent = usuario.email || '';
    el('admin-app').style.display = 'block';

    if (iniciado) return;
    iniciado = true;
    try {
        await carregarNotificacoes();
    } catch (err) {
        console.error('Erro ao carregar as notificações:', err);
        el('tabela-notificacoes-corpo').innerHTML = '<tr><td colspan="9" class="tabela-vazia">Não foi possível carregar as notificações agora.</td></tr>';
    }
    abrirComNoticiaDoEndereco();
}

function ligarEventos() {
    el('logout-btn').addEventListener('click', async () => {
        await sairDaConta();
        window.location.href = 'login.html';
    });

    el('btn-nova-notificacao').addEventListener('click', () => abrirFormulario(null));
    el('btn-fechar-form').addEventListener('click', fecharFormulario);
    el('btn-cancelar-form').addEventListener('click', fecharFormulario);
    el('form-notificacao').addEventListener('submit', salvarFormulario);
    el('f-agendar').addEventListener('input', atualizarDisponibilidadeModal);

    el('tabela-notificacoes-corpo').addEventListener('click', (e) => {
        const btn = e.target.closest('.btn-icone');
        if (!btn) return;
        const id = btn.dataset.id;
        if (btn.dataset.acao === 'editar') {
            const notificacao = notificacoesCache.find((n) => n.id === id);
            if (notificacao) abrirFormulario(notificacao);
        } else if (btn.dataset.acao === 'excluir') {
            excluir(id);
        }
    });

    // abas: clique ou setas do teclado
    const abas = [...document.querySelectorAll('.aba-admin')];
    abas.forEach((aba, indice) => {
        aba.addEventListener('click', () => abrirAba(aba.dataset.aba));
        aba.addEventListener('keydown', (evento) => {
            const passo = { ArrowRight: 1, ArrowLeft: -1 }[evento.key];
            if (!passo) return;
            evento.preventDefault();
            const vizinha = abas[(indice + passo + abas.length) % abas.length];
            vizinha.focus();
            abrirAba(vizinha.dataset.aba);
        });
    });

    // escolha da notícia
    el('f-noticia-escolher').addEventListener('click', abrirEscolhaDeNoticia);
    el('f-noticia-filtro').addEventListener('input', desenharOpcoes);
    el('f-noticia-filtro').addEventListener('keydown', (evento) => {
        // Enter na busca não pode enviar o formulário; Esc fecha a lista
        if (evento.key === 'Enter') evento.preventDefault();
        if (evento.key === 'Escape') {
            evento.preventDefault();
            evento.stopPropagation();
            fecharEscolhaDeNoticia();
            desenharNoticiaEscolhida();
        }
    });
    el('f-noticia-lista').addEventListener('click', (evento) => {
        const opcao = evento.target.closest('.noticia-opcao');
        const noticia = opcao && (noticiasDoSite || []).find((n) => n.id === opcao.dataset.id);
        if (noticia) escolherNoticia(noticia);
    });
    el('f-noticia-escolhida').addEventListener('click', (evento) => {
        const botao = evento.target.closest('[data-acao]');
        if (!botao) return;
        if (botao.dataset.acao === 'trocar-noticia') abrirEscolhaDeNoticia();
        if (botao.dataset.acao === 'tirar-noticia') {
            noticiaDoFormulario = null;
            desenharNoticiaEscolhida();
        }
    });
}

ligarEventos();
observarAdmin(aoMudarLogin);
