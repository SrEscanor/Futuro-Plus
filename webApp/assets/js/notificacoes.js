// Avisos que o admin manda (admin-notificacoes.html): um modal opcional
// (uma vez por conta/visitante) e/ou uma entrada no sino do topo. Cada
// notificação escolhe o público: só quem tem conta, só visitante (sem
// login) ou todo mundo. Chamado por dashboard.js em toda página logada.
import { collection, getDocs, doc, setDoc, updateDoc, arrayUnion, limit, orderBy, query } from 'firebase/firestore';
import { auth, db } from './firebase-config.js';
import { calcularCompletudePerfil } from './perfil-completude.js';
import { ehLinkExterno, linkSeguroDaNotificacao } from './notificacoes-util.js';

const COLECAO = 'notificacoes';

// Quem não tem conta não tem documento no Firestore para guardar o que já
// viu, então esse controle fica no navegador mesmo (não sincroniza entre
// aparelhos, mas para um aviso de visitante isso não é problema).
const CHAVE_MODAL_VISTAS_VISITANTE = 'futuroplus_notif_vistas';
const CHAVE_LIMPAS_EM_VISITANTE = 'futuroplus_notif_limpas_em';
const CHAVE_SINO_VISTAS_EM_VISITANTE = 'futuroplus_notif_sino_vistas_em';

function escapeHtml(str) {
    return String(str ?? '').replace(/[&<>"']/g, (c) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
}

function formatarData(iso) {
    const data = new Date(iso || '');
    if (Number.isNaN(data.getTime())) return '';
    return data.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

function lerVistasVisitante() {
    try {
        return JSON.parse(localStorage.getItem(CHAVE_MODAL_VISTAS_VISITANTE)) || [];
    } catch {
        return [];
    }
}

function marcarVistaVisitante(id) {
    try {
        const atuais = lerVistasVisitante();
        if (!atuais.includes(id)) {
            atuais.push(id);
            localStorage.setItem(CHAVE_MODAL_VISTAS_VISITANTE, JSON.stringify(atuais));
        }
    } catch {
        // localStorage bloqueado (modo privado etc.) — sem problema, só não lembra pra próxima visita
    }
}

function lerLimpasEmVisitante() {
    try {
        return localStorage.getItem(CHAVE_LIMPAS_EM_VISITANTE) || '';
    } catch {
        return '';
    }
}

function salvarLimpasEmVisitante(iso) {
    try {
        localStorage.setItem(CHAVE_LIMPAS_EM_VISITANTE, iso);
    } catch {
        // idem: sem localStorage, a lista só não fica limpa na próxima visita
    }
}

function lerSinoVistasEmVisitante() {
    try {
        return localStorage.getItem(CHAVE_SINO_VISTAS_EM_VISITANTE) || '';
    } catch {
        return '';
    }
}

function salvarSinoVistasEmVisitante(iso) {
    try {
        localStorage.setItem(CHAVE_SINO_VISTAS_EM_VISITANTE, iso);
    } catch {
        // idem: sem localStorage, volta a contar como não lida na próxima visita
    }
}

// Cache simples: modal e sino são chamados juntos no carregamento da
// página, então uma busca só no Firestore basta para os dois.
let cachePromise = null;

function carregarNotificacoes() {
    if (!cachePromise) {
        const agora = new Date().toISOString();
        cachePromise = getDocs(collection(db, COLECAO)).then((snap) => snap.docs
            .map((d) => ({ id: d.id, ...d.data() }))
            .filter((n) => n.ativo !== false)
            // agendada pro futuro: fica fora do site inteiro até a data chegar
            .filter((n) => !n.publicarEm || n.publicarEm <= agora)
            .sort((a, b) => (b.criadoEm || '').localeCompare(a.criadoEm || '')));
    }
    return cachePromise;
}

// "logados" / "deslogados" / "todos" — documentos antigos sem o campo
// (de antes desse controle existir) continuam valendo só para quem já
// tinha conta, que era o único público possível até então.
function valeParaEstado(n, logado) {
    const alvo = n.publico || 'logados';
    if (alvo === 'todos') return true;
    return logado ? alvo === 'logados' : alvo === 'deslogados';
}

// ---------------------------------------------------------
// Modal (aviso leve, mostrado uma vez por conta/visitante)
// ---------------------------------------------------------

function injetarEstilosModal() {
    if (document.getElementById('nt-estilos')) return;
    const estilo = document.createElement('style');
    estilo.id = 'nt-estilos';
    estilo.textContent = `
        .nt-modal {
            border: none;
            border-radius: 18px;
            padding: 0;
            width: min(480px, 92vw);
            max-height: 80vh;
            box-shadow: 0 24px 60px -20px rgba(20, 24, 60, 0.45);
            font-family: 'Inter', 'Segoe UI', Arial, sans-serif;
            color: var(--ink, #1b1f3b);
        }
        .nt-modal::backdrop { background: rgba(23, 27, 58, 0.65); }
        .nt-modal[open] { display: flex; flex-direction: column; margin: auto; }
        .nt-cabecalho { padding: 22px 22px 4px; flex-shrink: 0; }
        .nt-cabecalho h2 {
            font-family: 'Sora', 'Segoe UI', Arial, sans-serif;
            font-size: 18px;
            font-weight: 800;
        }
        .nt-corpo {
            padding: 4px 22px 22px;
            overflow: auto;
            font-size: 14px;
            line-height: 1.55;
            color: var(--ink-soft, #5b6084);
            white-space: pre-line;
        }
        .nt-acoes { display: flex; flex-direction: column; gap: 8px; padding: 0 22px 22px; }
        .nt-btn-primario,
        .nt-btn-secundario {
            display: block;
            width: 100%;
            padding: 12px 18px;
            border-radius: 99px;
            border: none;
            background: var(--blue, #4e6ee8);
            color: #fff;
            font-family: 'Sora', sans-serif;
            font-size: 13.5px;
            font-weight: 700;
            text-align: center;
            text-decoration: none;
            cursor: pointer;
        }
        .nt-btn-secundario {
            background: transparent;
            color: var(--ink-soft, #5b6084);
            box-shadow: inset 0 0 0 1.5px var(--line, #e6e8f5);
        }
        .nt-btn-primario[hidden] { display: none; }
    `;
    document.head.appendChild(estilo);
}

function montarModal() {
    const modal = document.createElement('dialog');
    modal.id = 'nt-modal';
    modal.className = 'nt-modal';
    modal.innerHTML = `
        <div class="nt-cabecalho"><h2 id="nt-titulo"></h2></div>
        <div class="nt-corpo" id="nt-corpo"></div>
        <div class="nt-acoes">
            <a id="nt-ler" class="nt-btn-primario" hidden>Ler a notícia</a>
            <button type="button" id="nt-fechar" class="nt-btn-primario">Entendi</button>
        </div>
    `;
    document.body.appendChild(modal);
    return modal;
}

// Mostra a primeira notificação pendente (mostrarModal=true, já filtrada
// pelo público certo e ainda não vista). As próximas, se houver mais de
// uma pendente, aparecem nos próximos carregamentos de página, uma de
// cada vez. `vistas` é o conjunto de ids já vistos e `marcarVista(id)`
// grava esse id como visto (Firestore para conta, localStorage para
// visitante) — é só isso que muda entre os dois casos.
async function mostrarModalPendente(notificacoes, vistas, marcarVista) {
    const pendente = notificacoes.find((n) => !vistas.has(n.id));
    if (!pendente) return;

    injetarEstilosModal();
    const modal = document.getElementById('nt-modal') || montarModal();
    modal.querySelector('#nt-titulo').textContent = pendente.titulo || 'Aviso';
    modal.querySelector('#nt-corpo').textContent = pendente.mensagem || '';

    let fechando = false;
    async function fechar() {
        if (fechando) return;
        fechando = true;
        modal.close();
        modal.remove();
        try {
            await marcarVista(pendente.id);
        } catch (erro) {
            console.error('Erro ao marcar notificação como vista:', erro);
        }
    }

    modal.querySelector('#nt-fechar').addEventListener('click', fechar);
    modal.addEventListener('cancel', (e) => { e.preventDefault(); fechar(); });

    // Aviso que leva para uma notícia: "Ler a notícia" em destaque e o
    // fechar vira "Agora não". Antes de sair da página, espera o "já vi"
    // ser gravado (no máximo 1,5 s), senão o aviso voltaria na próxima.
    const link = linkSeguroDaNotificacao(pendente.link);
    if (link) {
        const ler = modal.querySelector('#nt-ler');
        const botaoFechar = modal.querySelector('#nt-fechar');
        ler.href = link;
        ler.hidden = false;
        botaoFechar.textContent = 'Agora não';
        botaoFechar.className = 'nt-btn-secundario';
        if (ehLinkExterno(link)) {
            // abre em outra aba: o site continua aqui, só fecha o aviso
            ler.target = '_blank';
            ler.rel = 'noopener noreferrer';
            // fecha logo depois do clique, com o link ainda na página
            ler.addEventListener('click', () => { setTimeout(fechar, 0); });
        } else {
            ler.addEventListener('click', async (evento) => {
                evento.preventDefault();
                await Promise.race([fechar(), new Promise((r) => setTimeout(r, 1500))]);
                window.location.href = link;
            });
        }
    }
    modal.showModal();
}

// Para quem já tem conta: `dados` é o documento de usuarios/{uid} lido em
// dashboard.js.
export async function verificarNotificacaoModal(dados) {
    const notificacoes = (await carregarNotificacoes()).filter((n) => n.mostrarModal && valeParaEstado(n, true));
    const vistas = new Set(dados.notificacoesModalVistas || []);
    await mostrarModalPendente(notificacoes, vistas, (id) => updateDoc(doc(db, 'usuarios', auth.currentUser.uid), {
        notificacoesModalVistas: arrayUnion(id)
    }));
}

// Para visitante (sem login): mesma ideia, guardando o "já visto" no
// localStorage do navegador em vez de num documento de usuário.
export async function verificarNotificacaoModalVisitante() {
    const notificacoes = (await carregarNotificacoes()).filter((n) => n.mostrarModal && valeParaEstado(n, false));
    const vistas = new Set(lerVistasVisitante());
    await mostrarModalPendente(notificacoes, vistas, (id) => marcarVistaVisitante(id));
}

// ---------------------------------------------------------
// Lembrete de perfil incompleto — não vem do admin, é calculado na hora a
// partir do próprio documento da conta. Ganha um `criadoEm` de "agora" de
// propósito: assim ele volta a contar como não lida a cada carregamento de
// página (mesmo que a pessoa já tenha aberto o sino antes), enquanto o
// perfil continuar incompleto. Dentro do mesmo carregamento, abrir o sino
// ainda marca como visto normalmente — só volta no próximo.
function notificacaoPerfilIncompleto(dados) {
    const { completo, faltando } = calcularCompletudePerfil(dados);
    if (completo) return null;
    return {
        id: 'perfil-incompleto',
        titulo: 'Complete seu perfil',
        mensagem: `Falta ${faltando.join(', ')}. Perfis completos recebem recomendações de curso e de unidade mais certeiras.`,
        criadoEm: new Date().toISOString(),
        link: 'perfil.html'
    };
}

// Lembrete pra quem ainda não tem conta — com os próprios botões de Entrar
// e Criar conta dentro do aviso (em vez de só apontar pro topo da tela).
// Mesmo criadoEm "de agora" do lembrete de perfil: volta a aparecer a cada
// carregamento enquanto a pessoa continuar sem conta.
function notificacaoCriarConta() {
    return {
        id: 'visitante-criar-conta',
        titulo: 'Crie sua conta ou entre',
        mensagem: 'Salve os resultados dos seus testes e receba recomendações de curso e unidade personalizadas.',
        criadoEm: new Date().toISOString(),
        acoes: [
            { rotulo: 'Entrar', href: 'login.html' },
            { rotulo: 'Criar conta', href: 'cadastro.html', destaque: true }
        ]
    };
}

// ---------------------------------------------------------
// Sino do topo (lista + marca vermelha + limpar)
// ---------------------------------------------------------

function acoesHtml(acoes) {
    if (!acoes?.length) return '';
    return `<div class="notif-item-acoes">${acoes.map((a) => `
        <a class="notif-item-botao${a.destaque ? ' notif-item-botao--destaque' : ''}" href="${escapeHtml(a.href)}">${escapeHtml(a.rotulo)}</a>`).join('')}</div>`;
}

function estrelasHtml(nota) {
    const cheias = Math.max(0, Math.min(5, Number(nota) || 0));
    return cheias
        ? `<span class="notif-item-estrelas" role="img" aria-label="nota ${cheias} de 5">${'★'.repeat(cheias)}<i>${'★'.repeat(5 - cheias)}</i></span> `
        : '';
}

function itemHtml(n) {
    // link do aviso: perfil.html (lembrete do perfil), a notícia escolhida no
    // painel ou, nos avisos da equipe, a página da instituição; qualquer outra
    // coisa é ignorada (ver notificacoes-util.js)
    const link = linkSeguroDaNotificacao(n.link);
    const conteudo = `
            ${n.equipe ? '<span class="notif-item-tag">Para a equipe</span>' : ''}
            <strong class="notif-item-titulo">${escapeHtml(n.titulo || 'Aviso')}</strong>
            <p class="notif-item-mensagem">${estrelasHtml(n.estrelas)}${escapeHtml(n.mensagem || '')}</p>
            ${acoesHtml(n.acoes)}
            ${link && n.noticia ? '<span class="notif-item-ler">Ler a notícia →</span>' : ''}
            ${link && n.chamada ? `<span class="notif-item-ler">${escapeHtml(n.chamada)}</span>` : ''}
            <span class="notif-item-data">${n.equipe ? quandoFoi(n.criadoEm) : formatarData(n.criadoEm)}</span>`;
    // Um item com botões próprios não pode virar link (não dá pra aninhar
    // <a> dentro de <a>, e os botões já cobrem a ação). Notícia de outro
    // site abre em outra aba.
    const outraAba = ehLinkExterno(link) ? ' target="_blank" rel="noopener noreferrer"' : '';
    const classes = `notif-item${n.equipe ? ' notif-item--equipe' : ''}`;
    return link && !n.acoes
        ? `<a class="${classes} notif-item--link" href="${escapeHtml(link)}"${outraAba}>${conteudo}</a>`
        : `<div class="${classes}">${conteudo}</div>`;
}

// "há 12 min", "há 3 h" ou a data, para os avisos da equipe
function quandoFoi(iso) {
    const minutos = Math.round((Date.now() - new Date(iso || '').getTime()) / 60000);
    if (Number.isNaN(minutos)) return '';
    if (minutos < 2) return 'agora há pouco';
    if (minutos < 60) return `há ${minutos} min`;
    if (minutos < 24 * 60) return `há ${Math.round(minutos / 60)} h`;
    return formatarData(iso);
}

function trecho(texto, limite) {
    const limpo = String(texto || '').replace(/\s+/g, ' ').trim();
    return limpo.length <= limite ? limpo : `${limpo.slice(0, limite - 1).trimEnd()}…`;
}

// Para quem é admin: as avaliações e dúvidas novas das páginas das
// instituições (avisos_admin, gravados pelo servidor, ver
// functions/comunidade.py) entram no sino marcadas "Para a equipe". Contam
// como lidas as de antes do último "visto" (avisosAdminVistosEm, o mesmo do
// painel Admin · Comunidade).
async function avisosDaEquipe(dados) {
    if (dados.admin !== true) return [];
    try {
        const snap = await getDocs(query(collection(db, 'avisos_admin'), orderBy('em', 'desc'), limit(5)));
        const vistosEm = dados.avisosAdminVistosEm || '';
        return snap.docs.map((d) => ({ id: d.id, ...d.data() })).filter((a) => !a.apagada).map((aviso) => {
            const criadoEm = aviso.em?.toDate ? aviso.em.toDate().toISOString() : '';
            const unidade = aviso.unidadeNome || 'uma instituição';
            const etecOuFatec = /^(etec|fatec)\b/i.test(unidade);
            const avaliacao = aviso.tipo === 'avaliacao';
            const nome = aviso.nome || 'Alguém';
            return {
                id: `equipe-${aviso.id}`,
                equipe: true,
                jaVista: Boolean(vistosEm) && criadoEm <= vistosEm,
                titulo: avaliacao
                    ? `Nova avaliação ${etecOuFatec ? 'na' : 'em'} ${unidade}`
                    : `Nova dúvida ${etecOuFatec ? 'sobre a' : 'sobre'} ${unidade}`,
                estrelas: avaliacao ? aviso.nota : 0,
                mensagem: avaliacao
                    ? `${nome}${aviso.curso ? ` · ${aviso.curso}` : ''}: “${trecho(aviso.texto, 120)}”`
                    : `${nome}: “${trecho(aviso.texto, 140)}”`,
                chamada: !avaliacao && !Number(aviso.respostas) ? 'Responder →' : '',
                criadoEm,
                link: aviso.link || ''
            };
        });
    } catch (erro) {
        console.error('Erro ao ler os avisos da equipe:', erro);
        return [];
    }
}

const VAZIO_HTML = '<p class="notif-vazio">Nenhuma notificação por enquanto.</p>';

// Preenche o balão do sino com as notificações ainda não "limpas"
// (comparando a data de criação com `limpasEm`) e devolve uma função
// `marcarComoVisto`, pra ser chamada quando a pessoa abrir o balão —
// aí sim conta como lida (bolha e cor do sino somem) e fica assim mesmo
// depois de recarregar a página, já que vira uma data (`vistasEm`) gravada
// de verdade (Firestore para conta, localStorage para visitante), não só
// um estado temporário na tela.
// `aoLimpar`/`aoVisualizar` gravam essas datas — únicas partes que mudam
// entre conta logada e visitante.
async function preencherSino(notificacoes, limpasEm, vistasEmInicial, aoLimpar, aoVisualizar) {
    const lista = document.getElementById('notif-lista');
    const ponto = document.getElementById('notif-ponto');
    const botao = document.getElementById('notif-botao');
    const botaoLimpar = document.getElementById('notif-limpar');
    if (!lista || !ponto || !botaoLimpar) return async () => {};

    const visiveis = notificacoes.filter((n) => (n.criadoEm || '') > limpasEm);
    let vistasEm = vistasEmInicial;

    // aviso da equipe já visto no painel Admin · Comunidade não conta de novo
    const naoLida = (n) => !n.jaVista && (n.criadoEm || '') > vistasEm;

    function renderizar() {
        const naoLidas = visiveis.filter(naoLida).length;
        lista.innerHTML = visiveis.length ? visiveis.map(itemHtml).join('') : VAZIO_HTML;
        ponto.textContent = naoLidas > 9 ? '9+' : String(naoLidas);
        ponto.hidden = naoLidas === 0;
        botao?.classList.toggle('bell-icon--tem-notificacao', naoLidas > 0);
        botaoLimpar.hidden = visiveis.length === 0;
        botaoLimpar.textContent = `Limpar (${visiveis.length})`;
    }

    renderizar();

    botaoLimpar.onclick = async () => {
        if (!confirm('Isso limpa todas as notificações da lista. Você pode continuar recebendo novas depois. Confirma?')) return;
        botaoLimpar.disabled = true;
        try {
            const agora = new Date().toISOString();
            await aoLimpar(agora);
            visiveis.length = 0;
            renderizar();
        } catch (erro) {
            console.error('Erro ao limpar notificações:', erro);
            alert('Não consegui limpar as notificações agora. Tente de novo.');
        } finally {
            botaoLimpar.disabled = false;
        }
    };

    return async function marcarComoVisto() {
        if (!visiveis.some(naoLida)) return;
        const agora = new Date().toISOString();
        vistasEm = agora;
        renderizar();
        try {
            await aoVisualizar(agora);
        } catch (erro) {
            console.error('Erro ao marcar notificações como vistas:', erro);
        }
    };
}

export async function configurarSino(uid, dados) {
    const [todasDoAdmin, equipe] = await Promise.all([carregarNotificacoes(), avisosDaEquipe(dados)]);
    const notificacoes = [...equipe, ...todasDoAdmin.filter((n) => n.mostrarSino && valeParaEstado(n, true))]
        .sort((a, b) => (b.criadoEm || '').localeCompare(a.criadoEm || ''));
    const lembretePerfil = notificacaoPerfilIncompleto(dados);
    const todas = lembretePerfil ? [lembretePerfil, ...notificacoes] : notificacoes;
    // abrir o sino conta como visto também no painel Admin · Comunidade
    const vistas = (agora) => (equipe.length || dados.admin === true
        ? { notificacoesVistasEm: agora, avisosAdminVistosEm: agora }
        : { notificacoesVistasEm: agora });
    return preencherSino(
        todas,
        dados.notificacoesLimpasEm || '',
        dados.notificacoesVistasEm || '',
        (agora) => setDoc(doc(db, 'usuarios', uid), { notificacoesLimpasEm: agora }, { merge: true }),
        (agora) => setDoc(doc(db, 'usuarios', uid), vistas(agora), { merge: true })
    );
}

export async function configurarSinoVisitante() {
    const notificacoes = (await carregarNotificacoes()).filter((n) => n.mostrarSino && valeParaEstado(n, false));
    const lembreteConta = notificacaoCriarConta();
    const todas = [lembreteConta, ...notificacoes];
    return preencherSino(
        todas,
        lerLimpasEmVisitante(),
        lerSinoVistasEmVisitante(),
        async (agora) => salvarLimpasEmVisitante(agora),
        async (agora) => salvarSinoVistasEmVisitante(agora)
    );
}
