// Painel Admin · Notícias: a fila do que a busca automática trouxe. O
// administrador aprova, recusa ou corrige, e só o que ele aprova aparece na
// página Notícias.
//
// Os dados chegam só por noticias-dados.js (os roteiros de teste trocam esse
// arquivo por uma cópia de mentira). Título, resumo, link e imagem vêm de
// sites de fora: passam por escapeHtml, linkSeguro e imagemSegura antes de
// entrar na página.
import {
    LIMITE_RESUMO, LIMITE_TITULO, aprovarNoticias, buscarNoticiasAgora, contarFila, devolverParaPendentes,
    lerUltimaColeta, limparRecusadasAntigas, listarFila, listarNoticiasPropriasPendentes, observarAdmin, recusarNoticias,
    sairDaConta, salvarEdicao
} from './noticias-dados.js';
import {
    capaDesenhada, dataCurta, dominioDoLink, escapeHtml, imagemSegura, linkSeguro, rotulosDaNoticia, tempoRelativo
} from './noticias-util.js';
import { haQuantoTempo } from './noticias-proprias-util.js';

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
        gravar: devolverParaPendentes,
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

// Ícone de traço de "abre outro site", o mesmo da página Notícias.
const ICONE_SAIR = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
    stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M18 13.5V18a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4.5M14 4h6v6M20 4l-9 9"/></svg>`;

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
    relogioDaPrevia: 0
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
    if (!(aba in ABAS)) return;
    estado.aba = aba;
    estado.selecionadas.clear();
    el('noticias-recusadas-acoes').hidden = aba !== 'recusada';

    document.querySelectorAll('.noticias-aba').forEach((botao) => {
        const ativa = botao.dataset.aba === aba;
        botao.classList.toggle('noticias-aba--ativa', ativa);
        botao.setAttribute('aria-selected', String(ativa));
        botao.tabIndex = ativa ? 0 : -1;
    });
    el('painel-noticias').setAttribute('aria-labelledby', `aba-${aba}`);

    carregarPropriasPendentes(aba === 'pendente');
    carregarLista();
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

function itemHtml(noticia) {
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

    const botoes = ABAS[estado.aba].botoes
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

// Foto que não carregou: entra a capa desenhada no lugar.
function trocarFotoQuebrada(evento) {
    const caixa = evento.target instanceof HTMLImageElement ? evento.target.closest('.noticia-item-capa') : null;
    if (!caixa) return;
    caixa.innerHTML = capaDesenhada(noticiaDoItem(caixa) || {});
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
    if (acao === 'editar') abrirEdicao(noticia, botao);
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
    mostrarStatus(ids.length === 1 ? acao.uma(entreAspas(tituloDe(noticias[0]))) : acao.varias(ids.length), 'ok');

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

    fecharEdicao();
    mostrarStatus(salva?.status === 'aprovada'
        ? 'Alterações salvas. A notícia no site já foi atualizada.'
        : 'Alterações salvas.', 'ok');
}
