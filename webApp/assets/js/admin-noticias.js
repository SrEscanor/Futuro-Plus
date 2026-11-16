// Painel Admin · Notícias: a fila do que a busca automática trouxe. O
// administrador aprova, recusa ou corrige, e só o que ele aprova aparece na
// página Notícias.
//
// Os dados chegam só por noticias-dados.js (os roteiros de teste trocam esse
// arquivo por uma cópia de mentira). Título, resumo, link e imagem vêm de
// sites de fora: passam por escapeHtml, linkSeguro e imagemSegura antes de
// entrar na página.
//
// A aba No site mostra também as notícias do Futuro+ (painel Notícias
// próprias), com o card azul: elas não têm os botões das de fora, porque
// tirar do site e editar são lá, onde fica o histórico delas. Toda notícia no
// site tem "Notificar", que abre o painel Notificações com ela escolhida, e
// "Destacar", que põe ela no carrossel "Destaques para você" da Início (até
// 3; o quadro no alto da aba mostra a ordem e as vagas livres). A aba
// Histórico mostra quem fez o quê, com o e-mail.
import {
    LIMITE_RESUMO, LIMITE_TITULO, aprovarNoticias, buscarNoticiasAgora, contarFila, devolverParaPendentes,
    lerDestaques, lerUltimaColeta, limparRecusadasAntigas, listarFila, listarHistoricoNoticias,
    listarNoticiasPropriasPendentes, mudarDestaques, observarAdmin, recusarNoticias, sairDaConta, salvarEdicao,
    tirarDoSite
} from './noticias-dados.js';
import {
    capaDesenhada, dataCurta, dominioDoLink, escapeHtml, imagemSegura, linkSeguro, rotulosDaNoticia, tempoRelativo
} from './noticias-util.js';
import { ETIQUETAS, dataHora, haQuantoTempo, linkDaMateria } from './noticias-proprias-util.js';
import { MAXIMO_DESTAQUES, destaquesDoCarrossel, estaNoSite } from './destaques-util.js';

// O que cada aba diz quando está vazia e os botões de cada notícia dela:
// [ação, texto do botão, classes].
const ABAS = {
    pendente: {
        vazio: 'Nada para aprovar agora.',
        dica: 'As próximas chegam sozinhas na busca automática. Se quiser, use “Buscar notícias agora”.',
        botoes: [
            ['aprovar', 'Aprovar', 'btn-primario'],
            ['recusar', 'Recusar', 'btn-secundario btn-recusar'],
            ['editar', 'Editar', 'btn-secundario']
        ]
    },
    aprovada: {
        vazio: 'Nenhuma notícia no site ainda.',
        dica: 'Aprove alguma na aba Pendentes e ela aparece na página Notícias.',
        botoes: [
            ['tirar', 'Tirar do site', 'btn-secundario btn-recusar'],
            ['editar', 'Editar', 'btn-secundario']
        ]
    },
    recusada: {
        vazio: 'Nenhuma notícia recusada.',
        dica: 'As recusadas ficam guardadas aqui para não voltarem nas próximas buscas.',
        botoes: [['devolver', 'Voltar para pendentes', 'btn-secundario']]
    }
};

// O que cada ação grava, como mexe nos números das abas e o que avisa depois.
// "Tirar do site" e "Voltar para pendentes" gravam a mesma coisa; só mudam a
// aba de onde a notícia sai e o aviso.
const ACOES = {
    aprovar: {
        gravar: aprovarNoticias,
        numeros: { pendente: -1, aprovada: 1 },
        gravando: 'Aprovando…',
        uma: (titulo) => `Aprovada e já no site: ${titulo}`,
        varias: (quantas) => `${quantas} notícias aprovadas e já no site.`
    },
    recusar: {
        gravar: recusarNoticias,
        numeros: { pendente: -1, recusada: 1 },
        gravando: 'Recusando…',
        uma: (titulo) => `Recusada: ${titulo}`,
        varias: (quantas) => `${quantas} notícias recusadas.`
    },
    tirar: {
        gravar: tirarDoSite,
        numeros: { aprovada: -1, pendente: 1 },
        gravando: 'Tirando…',
        uma: (titulo) => `Fora do site e de volta nas pendentes: ${titulo}`,
        varias: (quantas) => `${quantas} notícias fora do site e de volta nas pendentes.`
    },
    devolver: {
        gravar: devolverParaPendentes,
        numeros: { recusada: -1, pendente: 1 },
        gravando: 'Voltando…',
        uma: (titulo) => `De volta nas pendentes: ${titulo}`,
        varias: (quantas) => `${quantas} notícias de volta nas pendentes.`
    }
};

// Histórico: o texto de cada ação e a cor (verde, vermelho ou azul).
const ACOES_HISTORICO = {
    aprovou: ['aprovou e pôs no site', 'positiva'],
    recusou: ['recusou', 'negativa'],
    tirou: ['tirou do site', 'negativa'],
    voltou: ['voltou para as pendentes', 'neutra'],
    editou: ['editou', 'neutra'],
    buscou: ['buscou notícias agora', 'neutra'],
    limpou: ['apagou recusadas antigas', 'negativa'],
    destacou: ['pôs no carrossel da Início', 'positiva'],
    tirou_destaque: ['tirou do carrossel da Início', 'negativa'],
    reordenou: ['mudou a ordem do carrossel', 'neutra']
};

// Ícone de traço de "abre outro site", o mesmo da página Notícias.
const ICONE_SAIR = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
    stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M18 13.5V18a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4.5M14 4h6v6M20 4l-9 9"/></svg>`;

// Carrossel da Início: a estrela do botão Destacar (vazia ou cheia) e os
// ícones de mover e tirar das vagas. No celular as vagas ficam uma embaixo
// da outra e as setas giram para cima e para baixo (admin-noticias.css).
const ESTRELA = (cheia) => `<svg viewBox="0 0 24 24" fill="${cheia ? 'currentColor' : 'none'}" stroke="currentColor"
    stroke-width="2" stroke-linejoin="round" aria-hidden="true">
    <path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5-4.8-4.6 6.6-.9z"/></svg>`;
const ICONE_VAGA = {
    antes: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
    depois: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    tirar: '<path d="M7 7l10 10M17 7L7 17"/>'
};
const iconeDaVaga = (acao) => `<svg class="destaque-vaga-icone destaque-vaga-icone--${acao}" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONE_VAGA[acao]}</svg>`;

const ESQUELETO = `
    <li class="noticia-item noticia-item--esqueleto" aria-hidden="true">
        <span class="noticia-esqueleto-capa"></span>
        <span class="noticia-item-topo noticia-esqueleto-linhas">
            <span class="noticia-esqueleto-linha noticia-esqueleto-linha--curta"></span>
            <span class="noticia-esqueleto-linha"></span>
        </span>
        <span class="noticia-item-texto noticia-esqueleto-linhas">
            <span class="noticia-esqueleto-linha"></span>
            <span class="noticia-esqueleto-linha noticia-esqueleto-linha--curta"></span>
        </span>
    </li>`;

const estado = {
    iniciado: false,
    aba: 'pendente',
    situacao: 'carregando',     // da lista aberta: 'carregando', 'pronta' ou 'erro'
    erro: '',
    lista: [],
    numeros: { pendente: null, aprovada: null, recusada: null },
    selecionadas: new Set(),    // ids marcados na aba Pendentes
    ocupadas: new Set(),        // ids com uma gravação em andamento
    pedido: 0,
    buscando: false,
    editando: null,
    salvando: false,
    focoAntesDoModal: null,
    relogioDoStatus: 0,
    relogioDaPrevia: 0,
    // o carrossel da Início (aba No site)
    destaques: {
        situacao: 'carregando', // 'carregando', 'pronta' ou 'erro'
        itens: [],              // [{ id, titulo, noticia }] na ordem do carrossel; noticia null = saiu do site
        gravando: false,
        pedido: 0
    }
};

// O navegador (e o roteiro de teste) carrega este arquivo com a página já
// pronta, então iniciar() costuma rodar nesta linha mesmo. Por isso as
// constantes ficam acima dela.
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
else iniciar();

function el(id) {
    return document.getElementById(id);
}

function idDe(noticia) {
    return String(noticia?.id ?? '');
}

function tituloDe(noticia) {
    return String(noticia?.titulo || '').trim() || 'Notícia sem título';
}

function entreAspas(texto) {
    return `“${texto.length > 90 ? `${texto.slice(0, 87).trimEnd()}…` : texto}”`;
}

function semAnimacao() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function iniciar() {
    if (!el('admin-app')) return;

    el('f-titulo').maxLength = LIMITE_TITULO;
    el('f-resumo').maxLength = LIMITE_RESUMO;

    el('logout-btn').addEventListener('click', sair);
    el('btn-buscar').addEventListener('click', buscarAgora);
    el('btn-limpar-recusadas').addEventListener('click', limparRecusadas);
    el('btn-fechar-status').addEventListener('click', esconderStatus);

    // abas: clique ou setas do teclado
    const abas = [...document.querySelectorAll('.noticias-aba')];
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

    el('destaques-vagas').addEventListener('click', aoClicarNasVagas);
    el('destaques-vagas').addEventListener('error', trocarFotoQuebrada, true);

    const lista = el('lista-noticias');
    lista.addEventListener('click', aoClicarNaLista);
    lista.addEventListener('change', aoMarcarNaLista);
    // O "error" de uma imagem não sobe pela página como o clique: de fora,
    // só dá para ouvir na fase de captura (o "true" no fim).
    lista.addEventListener('error', trocarFotoQuebrada, true);

    el('selecionar-todas').addEventListener('change', (evento) => selecionarTodas(evento.target.checked));
    el('btn-aprovar-selecionadas').addEventListener('click', () => agirNasSelecionadas('aprovar'));
    el('btn-recusar-selecionadas').addEventListener('click', () => agirNasSelecionadas('recusar'));

    el('form-editar').addEventListener('submit', salvarFormulario);
    el('btn-fechar-editar').addEventListener('click', fecharEdicao);
    el('btn-cancelar-editar').addEventListener('click', fecharEdicao);
    el('modal-editar').addEventListener('keydown', teclasDoModal);
    el('f-titulo').addEventListener('input', atualizarContadores);
    el('f-resumo').addEventListener('input', atualizarContadores);
    // título é uma linha só: o Enter não quebra linha
    el('f-titulo').addEventListener('keydown', (evento) => {
        if (evento.key === 'Enter') evento.preventDefault();
    });
    el('f-imagem').addEventListener('input', () => {
        clearTimeout(estado.relogioDaPrevia);
        estado.relogioDaPrevia = setTimeout(atualizarPrevia, 400);
    });
    el('f-etec').addEventListener('change', atualizarPrevia);
    el('f-fatec').addEventListener('change', atualizarPrevia);

    window.addEventListener('resize', medirTopo);
    medirTopo();

    observarAdmin(aoMudarLogin);
}

// O aviso e a barra de seleção ficam presos logo abaixo do cabeçalho. No
// computador o cabeçalho também é preso e a altura dele muda com a tela; no
// celular ele rola junto com a página (ver admin-instituicoes.css).
function medirTopo() {
    const topo = document.querySelector('.topo-admin');
    const preso = topo && getComputedStyle(topo).position === 'sticky';
    document.documentElement.style.setProperty('--topo-admin', `${preso ? topo.offsetHeight : 0}px`);
}

// ========================================================
// Login
// ========================================================

function aoMudarLogin({ usuario, ehAdmin }) {
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
    medirTopo();

    if (estado.iniciado) return;
    estado.iniciado = true;
    atualizarNumeros();
    carregarColeta();
    abrirAba('pendente');
}

async function sair() {
    try {
        await sairDaConta();
        window.location.href = 'login.html';
    } catch (erro) {
        console.error('Erro ao sair da conta:', erro);
        mostrarStatus('Não foi possível sair da conta. Tente de novo.', 'erro');
    }
}

// ========================================================
// Aviso do que acabou de acontecer
// ========================================================

// tipo: 'ok', 'erro' ou vazio (aviso neutro, de espera)
function mostrarStatus(mensagem, tipo = '') {
    const caixa = el('status-noticias');
    caixa.className = tipo ? `status-importacao status-importacao--${tipo}` : 'status-importacao';
    caixa.querySelector('.status-texto').textContent = mensagem;
    caixa.style.display = 'flex';

    // o que deu certo some sozinho; erro fica até ser fechado ou trocado
    clearTimeout(estado.relogioDoStatus);
    if (tipo === 'ok') estado.relogioDoStatus = setTimeout(esconderStatus, 10000);
}

function esconderStatus() {
    clearTimeout(estado.relogioDoStatus);
    el('status-noticias').style.display = 'none';
}

// ========================================================
// Números das abas
// ========================================================

async function atualizarNumeros() {
    try {
        estado.numeros = { ...estado.numeros, ...(await contarFila()) };
    } catch (erro) {
        console.error('Erro ao contar as notícias:', erro);
    }
    desenharNumeros();
}

function desenharNumeros() {
    Object.entries(estado.numeros).forEach(([aba, numero]) => {
        const alvo = el(`numero-${aba}`);
        if (alvo) alvo.textContent = numero ?? '–';
    });
}

// mudancas: { pendente: -1, aprovada: 1 }, vezes a quantidade de notícias
function mexerNosNumeros(mudancas, quantas) {
    Object.entries(mudancas).forEach(([aba, passo]) => {
        if (estado.numeros[aba] == null) return;
        estado.numeros[aba] = Math.max(0, estado.numeros[aba] + passo * quantas);
    });
    desenharNumeros();
}

// ========================================================
// Busca
// ========================================================

async function carregarColeta() {
    try {
        desenharColeta(await lerUltimaColeta());
    } catch (erro) {
        console.error('Erro ao ler a última busca:', erro);
        el('coleta-resumo').textContent = `Não deu para ler a última busca: ${erro?.message || 'erro desconhecido'}`;
        el('coleta-fontes').hidden = true;
    }
}

// coleta: o resumo de lerUltimaColeta() ou buscarNoticiasAgora(); null se
// nenhuma busca rodou ainda.
function desenharColeta(coleta) {
    const resumo = el('coleta-resumo');
    const fontes = el('coleta-fontes');

    if (!coleta) {
        resumo.textContent = 'Ainda não houve nenhuma busca. A primeira roda sozinha em até 6 horas, ou comece agora pelo botão.';
        fontes.innerHTML = '';
        fontes.hidden = true;
        return;
    }

    const novas = Number(coleta.novas) || 0;
    const textoNovas = novas === 0 ? 'nenhuma nova' : novas === 1 ? '1 nova' : `${novas} novas`;
    const origem = coleta.origem === 'painel' ? 'pelo painel' : 'automática';
    const quando = tempoRelativo(coleta.coletadaEm) || 'em data desconhecida';
    resumo.innerHTML = `<strong>Última busca:</strong> ${escapeHtml(quando)} (${origem}) · ${textoNovas}`;

    // as que falharam primeiro, com o motivo
    const lista = (Array.isArray(coleta.fontes) ? [...coleta.fontes] : [])
        .sort((a, b) => Boolean(b.erro) - Boolean(a.erro));
    fontes.innerHTML = lista.map((fonte) => {
        const nome = escapeHtml(fonte.nome || fonte.id || 'Fonte');
        return fonte.erro
            ? `<li class="coleta-fonte coleta-fonte--erro"><strong>${nome} falhou:</strong> ${escapeHtml(fonte.erro)}</li>`
            : `<li class="coleta-fonte">${nome} <strong>${Number(fonte.encontradas) || 0}</strong></li>`;
    }).join('');
    fontes.hidden = !lista.length;
}

async function buscarAgora() {
    if (estado.buscando) return;
    estado.buscando = true;

    const botao = el('btn-buscar');
    botao.disabled = true;
    botao.classList.add('btn--esperando');
    botao.setAttribute('aria-busy', 'true');
    botao.textContent = 'Buscando…';
    mostrarStatus('Buscando notícias nos sites. Isso pode levar uns 20 segundos…');

    try {
        const coleta = await buscarNoticiasAgora();
        desenharColeta(coleta);

        const novas = Number(coleta?.novas) || 0;
        const falharam = (coleta?.fontes || []).filter((fonte) => fonte.erro).length;
        let mensagem = 'Nenhuma notícia nova.';
        if (novas === 1) mensagem = '1 notícia nova na fila.';
        if (novas > 1) mensagem = `${novas} notícias novas na fila.`;
        if (falharam === 1) mensagem += ' Uma fonte falhou (veja no bloco da busca).';
        if (falharam > 1) mensagem += ` ${falharam} fontes falharam (veja no bloco da busca).`;
        mostrarStatus(mensagem, 'ok');

        // números das abas e, se for a aba aberta, a lista de pendentes
        await Promise.all([atualizarNumeros(), estado.aba === 'pendente' ? carregarLista() : null]);
    } catch (erro) {
        console.error('Erro ao buscar notícias:', erro);
        mostrarStatus(erro?.message || 'Não deu para buscar agora. Tente de novo.', 'erro');
    } finally {
        estado.buscando = false;
        botao.disabled = false;
        botao.classList.remove('btn--esperando');
        botao.removeAttribute('aria-busy');
        botao.textContent = 'Buscar notícias agora';
    }
}

// Apaga na hora as recusadas com mais de 30 dias (a mesma limpeza que já
// roda sozinha a cada coleta agendada).
async function limparRecusadas() {
    const botao = el('btn-limpar-recusadas');
    const textoOriginal = botao.textContent;
    botao.disabled = true;
    botao.textContent = 'Limpando…';
    mostrarStatus('Apagando recusadas com mais de 30 dias…');

    try {
        const { apagadas } = await limparRecusadasAntigas();
        mostrarStatus(apagadas
            ? `${apagadas} notícia(s) recusada(s) há mais de 30 dias foram apagadas.`
            : 'Nenhuma recusada com mais de 30 dias ainda.', 'ok');
        await atualizarNumeros();
        if (estado.aba === 'recusada') await carregarLista();
    } catch (erro) {
        console.error('Erro ao limpar notícias recusadas:', erro);
        mostrarStatus(erro?.message || 'Não deu para limpar agora. Tente de novo.', 'erro');
    } finally {
        botao.disabled = false;
        botao.textContent = textoOriginal;
    }
}

// ========================================================
// Abas e lista
// ========================================================

function abrirAba(aba) {
    if (!(aba in ABAS) && aba !== 'historico') return;
    estado.aba = aba;
    estado.selecionadas.clear();
    el('noticias-recusadas-acoes').hidden = aba !== 'recusada';

    document.querySelectorAll('.noticias-aba').forEach((botao) => {
        const ativa = botao.dataset.aba === aba;
        botao.classList.toggle('noticias-aba--ativa', ativa);
        botao.setAttribute('aria-selected', String(ativa));
        botao.tabIndex = ativa ? 0 : -1;
    });

    // Histórico: uma tabela no lugar da lista
    const historico = aba === 'historico';
    el('painel-noticias').hidden = historico;
    el('painel-historico').hidden = !historico;
    carregarPropriasPendentes(aba === 'pendente');

    // o quadro do carrossel da Início fica no alto da aba No site
    el('destaques-painel').hidden = aba !== 'aprovada';
    if (aba === 'aprovada' && !estado.destaques.gravando) carregarDestaques();
    if (historico) {
        estado.pedido += 1; // uma lista que ainda estava chegando não desenha mais
        desenharSelecao();
        carregarHistorico();
        return;
    }
    el('painel-noticias').setAttribute('aria-labelledby', `aba-${aba}`);
    carregarLista();
}

// ========================================================
// Histórico
// ========================================================

function linhaDoHistorico(registro) {
    const [texto, cor] = ACOES_HISTORICO[registro.acao] || [registro.acao, 'neutra'];
    // a busca e a limpeza não são de uma notícia só
    const alvo = registro.titulo || (registro.acao === 'buscou' || registro.acao === 'limpou' ? '—' : '');
    const quem = registro.email === 'automático' ? 'Automático (a cada 6 horas)' : registro.email || '—';
    return `
        <tr>
            <td class="historico-quando"><strong>${escapeHtml(dataHora(registro.em))}</strong><small>${escapeHtml(haQuantoTempo(registro.em))}</small></td>
            <td class="historico-quem">${escapeHtml(quem)}</td>
            <td><span class="historico-acao historico-acao--${cor}">${escapeHtml(texto)}</span>${registro.detalhe
                ? ` <small class="historico-detalhe">${escapeHtml(registro.detalhe)}</small>` : ''}</td>
            <td>${escapeHtml(alvo)}</td>
        </tr>`;
}

async function carregarHistorico() {
    const corpo = el('historico-corpo');
    corpo.innerHTML = '<tr><td colspan="4" class="tabela-vazia">Carregando histórico...</td></tr>';
    try {
        const registros = await listarHistoricoNoticias({ quantos: 100 });
        if (estado.aba !== 'historico') return;
        corpo.innerHTML = registros.length
            ? registros.map(linhaDoHistorico).join('')
            : '<tr><td colspan="4" class="tabela-vazia">Nada registrado ainda. O histórico começa na próxima aprovação, recusa ou edição.</td></tr>';
    } catch (erro) {
        console.error('Erro ao carregar o histórico das notícias:', erro);
        corpo.innerHTML = '<tr><td colspan="4" class="tabela-vazia">Não foi possível carregar o histórico agora.</td></tr>';
    }
}

// As notícias próprias que esperam aprovação ficam no alto da aba Pendentes,
// sempre em primeiro, com o card azul. A revisão é no painel Notícias
// próprias (o botão leva direto para ela).
async function carregarPropriasPendentes(mostrar) {
    const secao = el('proprias-pendentes');
    if (!mostrar) {
        secao.hidden = true;
        return;
    }
    try {
        const lista = await listarNoticiasPropriasPendentes();
        if (estado.aba !== 'pendente') return;
        el('proprias-pendentes-numero').textContent = `(${lista.length})`;
        el('proprias-pendentes-lista').innerHTML = lista.map(cartaoPropriaPendente).join('');
        secao.hidden = !lista.length;
    } catch (erro) {
        console.error('Erro ao carregar as notícias próprias pendentes:', erro);
        secao.hidden = true;
    }
}

function cartaoPropriaPendente(noticia) {
    const imagem = imagemSegura(noticia.imagem?.url);
    // o mesmo "há 40 minutos" do painel Notícias próprias
    const quando = haQuantoTempo(noticia.enviadaEm);
    return `
        <li class="propria-pendente">
            <span class="propria-pendente-capa">${imagem ? `<img src="${escapeHtml(imagem)}" alt="" loading="lazy">` : ''}</span>
            <div class="propria-pendente-texto">
                <span class="propria-pendente-selo">Notícia do Futuro+ · pendente</span>
                <strong>${escapeHtml(noticia.titulo || '(sem título)')}</strong>
                <span class="propria-pendente-meta">Enviada ${escapeHtml(quando || '')}${noticia.enviadaPor ? ` por ${escapeHtml(noticia.enviadaPor)}` : ''}</span>
            </div>
            <a class="btn propria-pendente-revisar" href="admin-noticias-proprias.html?revisar=${encodeURIComponent(noticia.id)}">Revisar e aprovar</a>
        </li>`;
}

// A lista é lida de novo toda vez que a aba abre: o que foi aprovado ou
// recusado em outra aba já aparece no lugar certo.
async function carregarLista() {
    const pedido = estado.pedido += 1;
    const aba = estado.aba;
    estado.situacao = 'carregando';
    estado.lista = [];
    desenharLista();

    try {
        const lista = await listarFila(aba);
        if (pedido !== estado.pedido) return;
        estado.lista = Array.isArray(lista) ? lista : [];
        estado.situacao = 'pronta';
        // a lista de pendentes vem inteira, então ela é a contagem certa
        if (aba === 'pendente' || estado.numeros[aba] == null) {
            estado.numeros[aba] = estado.lista.length;
            desenharNumeros();
        }
    } catch (erro) {
        if (pedido !== estado.pedido) return;
        console.error('Erro ao carregar a lista de notícias:', erro);
        estado.erro = erro?.message || '';
        estado.situacao = 'erro';
    }
    desenharLista();
}

function desenharLista() {
    const lista = el('lista-noticias');
    lista.setAttribute('aria-busy', String(estado.situacao === 'carregando'));

    if (estado.situacao === 'carregando') {
        lista.innerHTML = ESQUELETO.repeat(3);
    } else if (estado.situacao === 'erro') {
        lista.innerHTML = avisoHtml('Não deu para carregar esta lista',
            estado.erro || 'Confira sua internet e tente de novo.', true);
    } else if (!estado.lista.length) {
        lista.innerHTML = avisoHtml(ABAS[estado.aba].vazio, ABAS[estado.aba].dica, false);
    } else {
        lista.innerHTML = estado.lista.map(itemHtml).join('');
        marcarOcupadas();
        return;
    }
    desenharSelecao();
}

function avisoHtml(titulo, texto, comBotao) {
    return `
        <li class="noticias-aviso">
            <strong>${escapeHtml(titulo)}</strong>
            <p>${escapeHtml(texto)}</p>
            ${comBotao ? '<button type="button" class="btn btn-primario" data-acao="tentar">Tentar de novo</button>' : ''}
        </li>`;
}

// "Notificar": abre o painel Notificações com uma notificação nova já ligada
// a esta notícia (quem clicar no aviso vai para ela).
function botaoNotificarHtml(noticia) {
    return `<a class="btn btn-secundario" href="admin-notificacoes.html?noticia=${encodeURIComponent(idDe(noticia))}">Notificar</a>`;
}

// Notícia do Futuro+ na aba No site: card azul, com o link da matéria no
// próprio site. Tirar do site e editar são no painel Notícias próprias (que
// também cuida da cópia do site e do histórico dela).
function itemProprioHtml(noticia) {
    const titulo = tituloDe(noticia);
    const resumo = String(noticia.resumo || '').trim();
    const foto = imagemSegura(noticia.imagem);
    const etiquetas = (noticia.instituicoes || []).filter((id) => id in ETIQUETAS)
        .map((id) => `<span class="noticia-etiqueta noticia-etiqueta--${id}">${escapeHtml(ETIQUETAS[id])}</span>`)
        .join('');
    const data = dataCurta(noticia.publicadaEm);
    const relativo = tempoRelativo(noticia.publicadaEm);
    const quando = data && relativo && relativo !== data ? `${data} (${relativo})` : data;
    return `
        <li class="noticia-item noticia-item--propria" data-id="${escapeHtml(idDe(noticia))}" tabindex="-1">
            <div class="noticia-item-capa">${foto
                ? `<img src="${escapeHtml(foto)}" alt="" loading="lazy" decoding="async">`
                : capaDesenhada(noticia)}</div>
            <div class="noticia-item-topo">
                <div class="noticia-item-etiquetas"><span class="noticia-etiqueta noticia-etiqueta--propria">Notícia do Futuro+</span>${etiquetas}</div>
                <p class="noticia-item-meta"><strong>${escapeHtml(noticia.autor || 'Futuro+')}</strong>${quando ? ` · ${escapeHtml(quando)}` : ''}</p>
            </div>
            <div class="noticia-item-texto">
                <h3 class="noticia-item-titulo">${escapeHtml(titulo)}</h3>
                <p class="noticia-item-resumo">${resumo ? escapeHtml(resumo) : '<em>Sem linha de apoio.</em>'}</p>
                <p class="noticia-item-origem">
                    <a class="noticia-item-link" href="${escapeHtml(linkDaMateria(idDe(noticia)))}" target="_blank" rel="noopener">Ver no site ${ICONE_SAIR}</a>
                </p>
            </div>
            <div class="noticia-item-acoes">
                ${botaoDestacarHtml(noticia)}
                ${botaoNotificarHtml(noticia)}
                <a class="btn btn-primario" href="admin-noticias-proprias.html?revisar=${encodeURIComponent(idDe(noticia))}">Abrir em Notícias próprias</a>
            </div>
        </li>`;
}

function itemHtml(noticia) {
    if (noticia.propria) return itemProprioHtml(noticia);
    const comCaixa = estado.aba === 'pendente';
    const marcada = comCaixa && estado.selecionadas.has(idDe(noticia));
    const titulo = tituloDe(noticia);
    const resumo = String(noticia.resumo || '').trim();
    const fonte = String(noticia.fonte || '').trim() || 'Fonte não informada';
    const link = linkSeguro(noticia.link);
    const foto = imagemSegura(noticia.imagem);

    const etiquetas = rotulosDaNoticia(noticia)
        .map((rotulo) => `<span class="noticia-etiqueta noticia-etiqueta--${rotulo.id}">${escapeHtml(rotulo.texto)}</span>`)
        .join('');

    // "13 de nov. de 2026 (há 3 horas)"; depois de uma semana, só a data
    const data = dataCurta(noticia.publicadaEm);
    const relativo = tempoRelativo(noticia.publicadaEm);
    const quando = data && relativo && relativo !== data ? `${data} (${relativo})` : data;
    let linhaRevisao = '';
    if (estado.aba === 'recusada' && noticia.recusadaEm) {
        linhaRevisao = `Recusada${noticia.recusadaPor ? ` por ${escapeHtml(noticia.recusadaPor)}` : ''} em ${escapeHtml(dataCurta(noticia.recusadaEm))}`;
    } else if (estado.aba === 'aprovada' && noticia.aprovadaEm) {
        linhaRevisao = `Aprovada${noticia.aprovadaPor ? ` por ${escapeHtml(noticia.aprovadaPor)}` : ''} em ${escapeHtml(dataCurta(noticia.aprovadaEm))}`;
    }

    const origem = link
        ? `<a class="noticia-item-link" href="${escapeHtml(link)}" target="_blank" rel="noopener noreferrer">Abrir matéria ${ICONE_SAIR}</a>
           <span>${escapeHtml(dominioDoLink(link))}</span>`
        : 'Sem link válido: não dá para aprovar.';

    const botoes = (estado.aba === 'aprovada' ? botaoDestacarHtml(noticia) + botaoNotificarHtml(noticia) : '') + ABAS[estado.aba].botoes
        .map(([acao, texto, classes]) => `<button type="button" class="btn ${classes}" data-acao="${acao}">${texto}</button>`)
        .join('');

    return `
        <li class="noticia-item${comCaixa ? ' noticia-item--com-caixa' : ''}${marcada ? ' noticia-item--marcada' : ''}"
            data-id="${escapeHtml(idDe(noticia))}" tabindex="-1">
            ${comCaixa ? `<label class="noticia-item-caixa">
                <input type="checkbox"${marcada ? ' checked' : ''} aria-label="Selecionar: ${escapeHtml(titulo)}">
            </label>` : ''}
            <div class="noticia-item-capa">${foto
                ? `<img src="${escapeHtml(foto)}" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer">`
                : capaDesenhada(noticia)}</div>
            <div class="noticia-item-topo">
                <div class="noticia-item-etiquetas">${etiquetas}</div>
                <p class="noticia-item-meta"><strong>${escapeHtml(fonte)}</strong>${quando ? ` · ${escapeHtml(quando)}` : ''}</p>
                ${linhaRevisao ? `<p class="noticia-item-meta">${linhaRevisao}</p>` : ''}
            </div>
            <div class="noticia-item-texto">
                <h3 class="noticia-item-titulo">${escapeHtml(titulo)}</h3>
                <p class="noticia-item-resumo">${resumo ? escapeHtml(resumo) : '<em>Sem resumo.</em>'}</p>
                <p class="noticia-item-origem${link ? '' : ' noticia-item-origem--sem-link'}">${origem}</p>
            </div>
            <div class="noticia-item-acoes">${botoes}</div>
        </li>`;
}

function itensDaTela() {
    return [...document.querySelectorAll('#lista-noticias .noticia-item[data-id]')];
}

function noticiaDoItem(elemento) {
    const id = elemento?.closest('.noticia-item')?.dataset.id;
    return id === undefined ? null : estado.lista.find((noticia) => idDe(noticia) === id) || null;
}

// Foto que não carregou: entra a capa desenhada no lugar (no card ou na vaga
// do carrossel).
function trocarFotoQuebrada(evento) {
    const caixa = evento.target instanceof HTMLImageElement
        ? evento.target.closest('.noticia-item-capa, .destaque-vaga-capa')
        : null;
    if (!caixa) return;
    const noticia = caixa.classList.contains('destaque-vaga-capa')
        ? itemDoCarrossel(caixa.closest('.destaque-vaga')?.dataset.id)?.noticia
        : noticiaDoItem(caixa);
    caixa.innerHTML = capaDesenhada(noticia || {});
}

// ========================================================
// Ações
// ========================================================

function aoClicarNaLista(evento) {
    const botao = evento.target.closest('button[data-acao]');
    if (!botao) return;

    const acao = botao.dataset.acao;
    if (acao === 'tentar') {
        carregarLista();
        return;
    }

    const noticia = noticiaDoItem(botao);
    if (!noticia) return;
    if (acao === 'destacar') mexerNoCarrossel(posicaoNoCarrossel(noticia) === -1 ? 'destacar' : 'tirar', noticia);
    else if (acao === 'editar') abrirEdicao(noticia, botao);
    else if (acao in ACOES) executar(acao, [noticia], botao);
}

// Grava a ação e, se der certo, tira as notícias da lista sem recarregar
// nada. Se der erro, elas continuam onde estavam e o motivo aparece no aviso.
async function executar(nome, noticias, botao) {
    const acao = ACOES[nome];
    const ids = noticias.map(idDe);
    if (!acao || !ids.length || ids.some((id) => estado.ocupadas.has(id))) return;

    const abaDaAcao = estado.aba;
    const itemComFoco = document.activeElement?.closest?.('.noticia-item') || null;
    const textoDoBotao = botao?.textContent;

    ids.forEach((id) => estado.ocupadas.add(id));
    marcarOcupadas();
    if (botao) botao.textContent = acao.gravando;

    try {
        await acao.gravar(noticias);
    } catch (erro) {
        console.error(`Erro ao gravar (${nome}):`, erro);
        ids.forEach((id) => estado.ocupadas.delete(id));
        if (botao) botao.textContent = textoDoBotao;
        marcarOcupadas();
        mostrarStatus(erro?.message || 'Não foi possível gravar. Tente de novo.', 'erro');
        return;
    }

    ids.forEach((id) => {
        estado.ocupadas.delete(id);
        estado.selecionadas.delete(id);
    });
    mexerNosNumeros(acao.numeros, ids.length);
    const mensagem = ids.length === 1 ? acao.uma(entreAspas(tituloDe(noticias[0]))) : acao.varias(ids.length);
    mostrarStatus(mensagem, 'ok');
    if (nome === 'tirar') tirarDoCarrossel(noticias, mensagem);

    // a pessoa trocou de aba enquanto gravava: a lista aberta é lida de novo
    if (abaDaAcao !== estado.aba) {
        carregarLista();
        return;
    }
    estado.lista = estado.lista.filter((noticia) => !ids.includes(idDe(noticia)));
    tirarDaTela(ids, itemComFoco);
}

function marcarOcupadas() {
    itensDaTela().forEach((item) => {
        const ocupada = estado.ocupadas.has(item.dataset.id);
        item.classList.toggle('noticia-item--ocupada', ocupada);
        if (ocupada) item.setAttribute('aria-busy', 'true');
        else item.removeAttribute('aria-busy');
        item.querySelectorAll('button, input').forEach((controle) => { controle.disabled = ocupada; });
    });
    atualizarBotoesDestacar();
    desenharSelecao();
}

function tirarDaTela(ids, itemComFoco) {
    const saindo = itensDaTela().filter((item) => ids.includes(item.dataset.id));

    // quem usa teclado não pode perder o lugar: o foco vai para a notícia
    // seguinte (ou a anterior, ou a lista)
    let destino = null;
    if (itemComFoco && saindo.includes(itemComFoco)) {
        const fica = (item) => item && !saindo.includes(item);
        let vizinho = itemComFoco.nextElementSibling;
        while (vizinho && !fica(vizinho)) vizinho = vizinho.nextElementSibling;
        if (!vizinho) {
            vizinho = itemComFoco.previousElementSibling;
            while (vizinho && !fica(vizinho)) vizinho = vizinho.previousElementSibling;
        }
        destino = vizinho || el('painel-noticias');
    }

    const terminar = () => {
        saindo.forEach((item) => item.remove());
        if (!estado.lista.length && estado.situacao === 'pronta') desenharLista();
        else desenharSelecao();
        if (destino?.isConnected) destino.focus({ preventScroll: true });
    };

    if (!saindo.length || semAnimacao()) {
        terminar();
        return;
    }
    saindo.forEach((item) => item.classList.add('noticia-item--saindo'));
    setTimeout(terminar, 200);
}

// ========================================================
// Seleção de várias (aba Pendentes)
// ========================================================

function aoMarcarNaLista(evento) {
    if (!evento.target.matches('.noticia-item-caixa input')) return;
    const item = evento.target.closest('.noticia-item');
    const noticia = noticiaDoItem(item);
    if (!noticia) return;

    if (evento.target.checked) estado.selecionadas.add(idDe(noticia));
    else estado.selecionadas.delete(idDe(noticia));
    item.classList.toggle('noticia-item--marcada', evento.target.checked);
    desenharSelecao();
}

function selecionarTodas(marcar) {
    estado.selecionadas = new Set(marcar ? estado.lista.map(idDe) : []);
    itensDaTela().forEach((item) => {
        const caixa = item.querySelector('.noticia-item-caixa input');
        if (!caixa) return;
        caixa.checked = marcar;
        item.classList.toggle('noticia-item--marcada', marcar);
    });
    desenharSelecao();
}

function desenharSelecao() {
    const visivel = estado.aba === 'pendente' && estado.situacao === 'pronta' && estado.lista.length > 0;
    el('barra-selecao').hidden = !visivel;

    // o que saiu da lista sai da seleção
    const naLista = new Set(estado.lista.map(idDe));
    estado.selecionadas.forEach((id) => {
        if (!naLista.has(id)) estado.selecionadas.delete(id);
    });

    const quantas = estado.selecionadas.size;
    const todas = el('selecionar-todas');
    todas.checked = quantas > 0 && quantas === estado.lista.length;
    todas.indeterminate = quantas > 0 && quantas < estado.lista.length;

    // No celular só cabe "Aprovar (3)"; o nome inteiro continua no aria-label.
    const gravando = [...estado.selecionadas].some((id) => estado.ocupadas.has(id));
    [['btn-aprovar-selecionadas', 'Aprovar'], ['btn-recusar-selecionadas', 'Recusar']].forEach(([id, verbo]) => {
        const botao = el(id);
        botao.innerHTML = `${verbo}<span class="so-largo"> selecionadas</span> (${quantas})`;
        botao.setAttribute('aria-label', `${verbo} selecionadas (${quantas})`);
        botao.disabled = quantas === 0 || gravando;
    });
}

function agirNasSelecionadas(acao) {
    const noticias = estado.lista.filter((noticia) => estado.selecionadas.has(idDe(noticia)));
    if (!noticias.length) return;

    if (acao === 'recusar' && noticias.length > 1) {
        const pergunta = `Recusar ${noticias.length} notícias de uma vez?\n\n`
            + 'Elas não vão para o site e ficam guardadas na aba Recusadas.';
        if (!window.confirm(pergunta)) return;
    }
    executar(acao, noticias);
}

// ========================================================
// Editar (modal)
// ========================================================

function abrirEdicao(noticia, origem) {
    estado.editando = noticia;
    estado.focoAntesDoModal = origem || null;

    el('f-titulo').value = String(noticia.titulo || '');
    el('f-resumo').value = String(noticia.resumo || '');
    el('f-imagem').value = String(noticia.imagem || '');
    el('f-etec').checked = (noticia.instituicoes || []).includes('etec');
    el('f-fatec').checked = (noticia.instituicoes || []).includes('fatec');

    mostrarErroDoFormulario('');
    atualizarContadores();
    atualizarPrevia();

    el('modal-editar').classList.add('aberto');
    document.body.classList.add('modal-aberto');
    el('f-titulo').focus();
}

function fecharEdicao() {
    if (estado.salvando) return;
    clearTimeout(estado.relogioDaPrevia);
    el('modal-editar').classList.remove('aberto');
    document.body.classList.remove('modal-aberto');
    el('previa-imagem').innerHTML = '';
    estado.editando = null;

    const voltarPara = estado.focoAntesDoModal;
    estado.focoAntesDoModal = null;
    if (voltarPara?.isConnected) voltarPara.focus();
}

// Esc fecha; Tab dá a volta dentro do formulário em vez de ir para a página atrás.
function teclasDoModal(evento) {
    if (evento.key === 'Escape') {
        evento.preventDefault();
        fecharEdicao();
        return;
    }
    if (evento.key !== 'Tab') return;

    const focaveis = [...el('modal-editar').querySelectorAll('button, input, textarea')]
        .filter((controle) => !controle.disabled && controle.offsetParent !== null);
    if (!focaveis.length) return;
    const primeiro = focaveis[0];
    const ultimo = focaveis[focaveis.length - 1];
    if (evento.shiftKey && document.activeElement === primeiro) {
        evento.preventDefault();
        ultimo.focus();
    } else if (!evento.shiftKey && document.activeElement === ultimo) {
        evento.preventDefault();
        primeiro.focus();
    }
}

function etiquetasMarcadas() {
    return ['etec', 'fatec'].filter((id) => el(`f-${id}`).checked);
}

function atualizarContadores() {
    [['f-titulo', LIMITE_TITULO], ['f-resumo', LIMITE_RESUMO]].forEach(([id, limite]) => {
        const usados = el(id).value.length;
        const contador = el(`${id}-contador`);
        contador.textContent = `${usados}/${limite}`;
        contador.classList.toggle('campo-contador--cheio', usados >= limite);
    });
}

// Mostra como a capa vai ficar no cartão: a imagem do endereço digitado ou,
// se ele estiver vazio, errado ou a imagem não carregar, a capa desenhada.
function atualizarPrevia() {
    if (!estado.editando) return;
    const caixa = el('previa-imagem');
    const legenda = el('previa-legenda');
    const desenhada = capaDesenhada({ ...estado.editando, instituicoes: etiquetasMarcadas() });
    const dizer = (texto, aviso) => {
        legenda.textContent = texto;
        legenda.classList.toggle('previa-legenda--aviso', aviso);
    };

    const digitado = el('f-imagem').value.trim();
    if (!digitado) {
        caixa.innerHTML = desenhada;
        dizer('Sem imagem, o cartão mostra esta capa desenhada.', false);
        return;
    }

    const segura = imagemSegura(digitado);
    if (!segura) {
        caixa.innerHTML = desenhada;
        dizer('O endereço da imagem precisa começar com https://', true);
        return;
    }

    caixa.innerHTML = `<img src="${escapeHtml(segura)}" alt="" referrerpolicy="no-referrer">`;
    dizer('É assim que a imagem aparece no cartão.', false);
    caixa.querySelector('img').addEventListener('error', () => {
        caixa.innerHTML = desenhada;
        dizer('Essa imagem não carregou. Se salvar assim, o cartão mostra a capa desenhada.', true);
    }, { once: true });
}

function mostrarErroDoFormulario(mensagem) {
    const caixa = el('status-editar');
    caixa.textContent = mensagem;
    caixa.style.display = mensagem ? 'block' : 'none';
}

async function salvarFormulario(evento) {
    evento.preventDefault();
    const noticia = estado.editando;
    if (!noticia || estado.salvando) return;

    const campos = {
        titulo: el('f-titulo').value.replace(/\s+/g, ' ').trim(),
        resumo: el('f-resumo').value.replace(/\s+/g, ' ').trim(),
        imagem: el('f-imagem').value.trim(),
        instituicoes: etiquetasMarcadas()
    };

    const botao = el('btn-salvar-editar');
    estado.salvando = true;
    botao.disabled = true;
    botao.textContent = 'Salvando…';
    mostrarErroDoFormulario('');

    let salva;
    try {
        salva = await salvarEdicao(noticia, campos);
    } catch (erro) {
        console.error('Erro ao salvar a notícia:', erro);
        mostrarErroDoFormulario(erro?.message || 'Não foi possível salvar. Tente de novo.');
        return;
    } finally {
        estado.salvando = false;
        botao.disabled = false;
        botao.textContent = 'Salvar';
    }

    // o cartão da lista é trocado pelo novo, sem recarregar a aba
    const id = idDe(noticia);
    const indice = estado.lista.findIndex((item) => idDe(item) === id);
    if (indice !== -1) {
        estado.lista[indice] = salva;
        const antigo = itensDaTela().find((item) => item.dataset.id === id);
        if (antigo) {
            antigo.insertAdjacentHTML('afterend', itemHtml(salva));
            estado.focoAntesDoModal = antigo.nextElementSibling.querySelector('[data-acao="editar"]');
            antigo.remove();
        }
    }

    // no carrossel, a vaga dela mostra o título e a imagem novos
    const destacada = itemDoCarrossel(id);
    if (destacada?.noticia) {
        destacada.noticia = { ...destacada.noticia, ...salva };
        desenharDestaques();
    }

    fecharEdicao();
    mostrarStatus(salva?.status === 'aprovada'
        ? 'Alterações salvas. A notícia no site já foi atualizada.'
        : 'Alterações salvas.', 'ok');
}

// ========================================================
// Carrossel "Destaques para você" da Início (aba No site)
// ========================================================
// O quadro no alto da aba mostra as 3 vagas do carrossel, na ordem; cada
// card tem o botão Destacar (ou "Na Início (2)", que tira). Cada mudança é
// gravada na hora, com o registro do histórico (noticias-dados.js). Vaga
// livre mostra um destaque padrão do site (destaques-util.js).

function itemDoCarrossel(id) {
    return estado.destaques.itens.find((item) => item.id === String(id ?? '')) || null;
}

function posicaoNoCarrossel(noticia) {
    const id = idDe(noticia);
    return estado.destaques.itens.findIndex((item) => item.id === id);
}

// Enquanto a lista não chegou ou uma mudança está sendo gravada, os botões
// do carrossel ficam parados.
function carrosselTravado() {
    return estado.destaques.situacao !== 'pronta' || estado.destaques.gravando;
}

async function carregarDestaques() {
    const destaques = estado.destaques;
    const pedido = destaques.pedido += 1;
    destaques.situacao = 'carregando';
    desenharDestaques();
    try {
        const { itens } = await lerDestaques();
        if (pedido !== destaques.pedido) return;
        destaques.itens = itens;
        destaques.situacao = 'pronta';
    } catch (erro) {
        if (pedido !== destaques.pedido) return;
        console.error('Erro ao ler o carrossel da Início:', erro);
        destaques.situacao = 'erro';
    }
    desenharDestaques();
}

// ---- botão dos cards ----

function estadoDoBotaoDestacar(posicao) {
    if (posicao === -1) {
        return { classe: '', conteudo: `${ESTRELA(false)}Destacar`, rotulo: 'Destacar no carrossel da Início', dica: '' };
    }
    return {
        classe: ' btn-destacar--ativo',
        conteudo: `${ESTRELA(true)}Na Início (${posicao + 1})`,
        rotulo: `Na vaga ${posicao + 1} do carrossel da Início. Tirar do carrossel`,
        dica: 'Tirar do carrossel da Início'
    };
}

function botaoDestacarHtml(noticia) {
    const { classe, conteudo, rotulo, dica } = estadoDoBotaoDestacar(posicaoNoCarrossel(noticia));
    return `<button type="button" class="btn btn-destacar${classe}" data-acao="destacar" aria-label="${rotulo}"${
        dica ? ` title="${dica}"` : ''}${carrosselTravado() ? ' disabled' : ''}>${conteudo}</button>`;
}

// Atualiza o botão no lugar (sem trocar o elemento): quem usa teclado não
// perde o foco ao destacar ou tirar.
function atualizarBotoesDestacar() {
    const travado = carrosselTravado();
    itensDaTela().forEach((item) => {
        const botao = item.querySelector('.btn-destacar');
        if (!botao) return;
        const { classe, conteudo, rotulo, dica } = estadoDoBotaoDestacar(posicaoNoCarrossel({ id: item.dataset.id }));
        botao.className = `btn btn-destacar${classe}`;
        botao.innerHTML = conteudo;
        botao.setAttribute('aria-label', rotulo);
        if (dica) botao.title = dica;
        else botao.removeAttribute('title');
        botao.disabled = travado || estado.ocupadas.has(item.dataset.id);
    });
}

// ---- o quadro com as vagas ----

function desenharDestaques() {
    const { situacao, itens } = estado.destaques;
    const vagas = el('destaques-vagas');
    el('destaques-contagem').textContent = situacao === 'pronta' ? `${itens.length} de ${MAXIMO_DESTAQUES}` : '';

    if (situacao === 'carregando') {
        vagas.innerHTML = '<li class="destaques-vagas-aviso">Lendo o carrossel da Início…</li>';
    } else if (situacao === 'erro') {
        vagas.innerHTML = `
            <li class="destaques-vagas-aviso">Não deu para ler o carrossel agora.
                <button type="button" class="btn btn-secundario" data-vaga="tentar">Tentar de novo</button></li>`;
    } else {
        const agora = new Date();
        // o que a Início mostra em cada posição: diz qual destaque padrão
        // aparece na vaga livre
        const naInicio = destaquesDoCarrossel(itens.map((item) => item.noticia), agora);
        vagas.innerHTML = Array.from({ length: MAXIMO_DESTAQUES }, (_, posicao) => (itens[posicao]
            ? vagaHtml(itens[posicao], posicao, itens.length, agora)
            : vagaLivreHtml(posicao, naInicio[posicao]))).join('');
    }
    atualizarBotoesDestacar();
}

function vagaHtml(item, posicao, quantas, agora) {
    const noticia = item.noticia;
    const titulo = String(noticia?.titulo || item.titulo || '').trim() || 'Notícia sem título';
    let selo;
    let aviso = '';
    if (!noticia) {
        selo = '<span class="destaque-vaga-selo destaque-vaga-selo--aviso">Saiu do site</span>';
        aviso = 'Não aparece no carrossel. Tire daqui para liberar a vaga.';
    } else if (!estaNoSite(noticia, agora)) {
        selo = '<span class="destaque-vaga-selo destaque-vaga-selo--aviso">Agendada</span>';
        aviso = `Entra no carrossel quando for publicada (${dataHora(noticia.publicarEm)}).`;
    } else if (noticia.propria) {
        selo = '<span class="destaque-vaga-selo destaque-vaga-selo--propria">Futuro+</span>';
    } else {
        selo = `<span class="destaque-vaga-selo">${escapeHtml(String(noticia.fonte || '').trim() || 'Notícia')}</span>`;
    }

    const foto = noticia ? imagemSegura(noticia.imagem) : '';
    const capa = noticia
        ? `<span class="destaque-vaga-capa">${foto
            ? `<img src="${escapeHtml(foto)}" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer">`
            : capaDesenhada(noticia)}</span>`
        : '';

    const travado = carrosselTravado();
    const nome = entreAspas(titulo);
    const botao = (acao, texto, rotulo, desligado) => `
        <button type="button" class="btn destaque-vaga-botao destaque-vaga-botao--${acao}" data-vaga="${acao}"
            aria-label="${escapeHtml(rotulo)}"${desligado || travado ? ' disabled' : ''}>${acao === 'depois'
            ? `<span>${texto}</span>${iconeDaVaga(acao)}` : `${iconeDaVaga(acao)}<span>${texto}</span>`}</button>`;

    return `
        <li class="destaque-vaga${noticia ? '' : ' destaque-vaga--fora'}" data-id="${escapeHtml(item.id)}">
            <span class="destaque-vaga-numero" aria-hidden="true">${posicao + 1}</span>
            ${capa}
            <div class="destaque-vaga-texto">
                ${selo}
                <strong>${escapeHtml(titulo)}</strong>
                ${aviso ? `<small>${escapeHtml(aviso)}</small>` : ''}
            </div>
            <div class="destaque-vaga-botoes">
                ${botao('antes', 'Antes', `Passar ${nome} para a vaga ${posicao}`, posicao === 0)}
                ${botao('depois', 'Depois', `Passar ${nome} para a vaga ${posicao + 2}`, posicao >= quantas - 1)}
                ${botao('tirar', 'Tirar', `Tirar ${nome} do carrossel`, false)}
            </div>
        </li>`;
}

function vagaLivreHtml(posicao, padrao) {
    return `
        <li class="destaque-vaga destaque-vaga--livre">
            <span class="destaque-vaga-numero" aria-hidden="true">${posicao + 1}</span>
            <div class="destaque-vaga-texto">
                <b>Vaga livre</b>
                <small>Enquanto estiver livre, o carrossel mostra o destaque padrão
                    “${escapeHtml(padrao?.titulo || '')}”.</small>
            </div>
        </li>`;
}

function aoClicarNasVagas(evento) {
    const botao = evento.target.closest('button[data-vaga]');
    if (!botao || botao.disabled) return;
    const acao = botao.dataset.vaga;
    if (acao === 'tentar') {
        carregarDestaques();
        return;
    }
    const item = itemDoCarrossel(botao.closest('.destaque-vaga')?.dataset.id);
    if (!item) return;
    mexerNoCarrossel(acao, item.noticia || { id: item.id, titulo: item.titulo }, { foco: acao });
}

// ---- gravação ----

// A lista que volta da gravação só tem { id, titulo }: a notícia de cada um
// vem do que o quadro já tinha ou da lista da aba No site.
function juntarComNoticias(itens) {
    const conhecidas = new Map(estado.destaques.itens.map((item) => [item.id, item.noticia]));
    if (estado.aba === 'aprovada') estado.lista.forEach((noticia) => conhecidas.set(idDe(noticia), noticia));
    return itens.map((item) => ({ ...item, noticia: conhecidas.get(item.id) ?? null }));
}

function avisoDoCarrossel(acao, noticia) {
    const nome = entreAspas(tituloDe(noticia));
    const posicao = posicaoNoCarrossel(noticia);
    if (acao === 'tirar') return `Fora do carrossel da Início: ${nome}`;
    if (posicao === -1) return `O carrossel da Início foi atualizado.`;
    if (acao === 'destacar') return `Na vaga ${posicao + 1} do carrossel da Início: ${nome}`;
    return `${nome} agora está na vaga ${posicao + 1} do carrossel.`;
}

// acao: 'destacar', 'tirar', 'antes' ou 'depois'. opcoes: { motivo (vai
// para o histórico), quieto (sem aviso), foco (botão da vaga que volta a ter
// o foco) }. Devolve true se gravou.
async function mexerNoCarrossel(acao, noticia, opcoes = {}) {
    const destaques = estado.destaques;
    if (carrosselTravado()) return false;
    if (acao === 'destacar' && posicaoNoCarrossel(noticia) === -1 && destaques.itens.length >= MAXIMO_DESTAQUES) {
        mostrarStatus(`O carrossel da Início já tem ${MAXIMO_DESTAQUES} notícias. Tire uma delas no quadro do `
            + 'carrossel, no alto desta aba, para destacar esta.', 'erro');
        return false;
    }

    destaques.gravando = true;
    desenharDestaques();
    try {
        const itens = await mudarDestaques(acao, noticia, { motivo: opcoes.motivo || '' });
        destaques.itens = juntarComNoticias(itens);
    } catch (erro) {
        console.error('Erro ao mudar o carrossel da Início:', erro);
        destaques.gravando = false;
        desenharDestaques();
        if (!opcoes.quieto) mostrarStatus(erro?.message || 'Não foi possível mudar o carrossel. Tente de novo.', 'erro');
        return false;
    }
    destaques.gravando = false;
    desenharDestaques();
    if (opcoes.foco) devolverFocoNaVaga(idDe(noticia), opcoes.foco);
    if (!opcoes.quieto) mostrarStatus(avisoDoCarrossel(acao, noticia), 'ok');
    return true;
}

// Depois de mover ou tirar, o quadro é desenhado de novo: o foco volta para
// o mesmo botão (a notícia mudou de vaga), para o outro de mover ou para o
// quadro, em vez de sumir.
function devolverFocoNaVaga(id, acao) {
    const vaga = [...el('destaques-vagas').querySelectorAll('.destaque-vaga[data-id]')]
        .find((elemento) => elemento.dataset.id === id);
    const alvo = vaga && [acao, acao === 'antes' ? 'depois' : 'antes', 'tirar']
        .map((nome) => vaga.querySelector(`[data-vaga="${nome}"]`))
        .find((botao) => botao && !botao.disabled);
    (alvo || el('destaques-painel')).focus();
}

// Notícia que sai do site sai também do carrossel da Início. Se não der para
// tirar, o quadro mostra a vaga como "Saiu do site" e a Início já não mostra
// a notícia (ela não está mais no site).
async function tirarDoCarrossel(noticias, mensagem) {
    const ids = noticias.map(idDe);
    estado.destaques.itens.forEach((item) => {
        if (ids.includes(item.id)) item.noticia = null;
    });
    const destacadas = noticias.filter((noticia) => posicaoNoCarrossel(noticia) !== -1);
    if (!destacadas.length) return;

    let deuCerto = true;
    for (const noticia of destacadas) {
        deuCerto = (await mexerNoCarrossel('tirar', noticia, { motivo: 'saiu do site', quieto: true })) && deuCerto;
    }
    desenharDestaques();
    const frase = /[.!?]$/.test(mensagem) ? mensagem : `${mensagem}.`;
    if (deuCerto) {
        mostrarStatus(`${frase} ${destacadas.length === 1 ? 'Ela também saiu' : 'Elas também saíram'} do carrossel da Início.`, 'ok');
    } else {
        mostrarStatus(`${frase} Mas não deu para tirar do carrossel da Início: use “Tirar” no quadro do carrossel.`, 'erro');
    }
}
