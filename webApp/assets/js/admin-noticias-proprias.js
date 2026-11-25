// Painel Admin · Notícias próprias: as notícias que a equipe do Futuro+
// escreve. Tem as abas (Em aprovação, Rascunhos, No site e Histórico), o
// editor (título, linha de apoio, autoria, imagem principal e o texto em
// blocos: parágrafo, intertítulo e imagem com legenda) e a aprovação.
//
// O caminho: a notícia é salva como Rascunho (para continuar depois) ou
// Pendente de aprovação (só se estiver completa). Nada vai ao site sem
// passar pela aprovação, que publica na hora ou agenda (com a mesma regra
// de 1 hora das notificações). Tudo fica no histórico, com o e-mail de quem
// fez. O painel Admin · Notícias mostra as pendentes no alto da aba
// Pendentes e manda para cá com ?revisar=<id>.
//
// Os dados chegam só por noticias-proprias-dados.js (os roteiros de teste
// trocam esse arquivo por uma cópia de mentira).
import {
    enviarImagemNoticia, excluirNoticiaPropria, lerFixadas, listarHistorico, listarHistoricoPagina,
    listarNoticiasProprias, mudarFixadas, novoId, observarAdmin, sairDaConta, salvarNoticiaPropria
} from './noticias-proprias-dados.js';
import { campoAcao, campoQuem, historicoComFiltros } from './historico-filtros.js';
import {
    ACOES, AUTOR_PADRAO, ETIQUETAS, LIMITES, MINIMO_AGENDAMENTO_MS, agendadaParaDepois, dataHora, deDatetimeLocal,
    enderecoDoLink, haQuantoTempo, linkDaMateria, linkNoTexto, marcacaoDoLink, noSite, oQueFalta, paraDatetimeLocal,
    situacao, textoCurto
} from './noticias-proprias-util.js';
import { escapeHtml } from './noticias-util.js';
import { MAXIMO_FIXADAS } from './destaques-util.js';
import { htmlDaMateria } from './noticia-materia.js';

const el = (id) => document.getElementById(id);

const ABAS = ['pendentes', 'rascunhos', 'nosite', 'historico'];

const estado = {
    iniciado: false,
    noticias: [],
    aba: 'pendentes',
    editando: null,     // a notícia aberta no editor, com o que já estava guardado
    salvo: '',          // o conteúdo como estava salvo (para saber se mudou)
    destino: 'rascunho', // o que "Salvar" faz: 'rascunho' ou 'pendente'
    quando: 'agora',    // aprovação: 'agora' ou 'agendar'
    alvoImagem: null,   // 'principal' ou o índice do bloco que está escolhendo imagem
    enviando: new Set(),
    ocupado: false,
    // as fixadas da página Notícias (a mesma lista do painel Notícias): os
    // ids, na ordem; null enquanto não chegou ou se não deu para ler
    fixadas: null,
    fixando: false,
    link: null          // o link sendo escrito: { campo, de, ate, existente }
};

// A corrente do botão de link do parágrafo (a mesma do "Copiar link" da matéria)
const ICONE_LINK = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" '
    + 'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 14a5 5 0 0 0 7.07 0l3-3a5 5 0 0 0-7.07-7.07l-1 1"/>'
    + '<path d="M14 10a5 5 0 0 0-7.07 0l-3 3a5 5 0 0 0 7.07 7.07l1-1"/></svg>';

// O alfinete do botão Fixar (o mesmo do painel Notícias e da página Notícias)
const ALFINETE = (cheio) => `<svg width="16" height="16" viewBox="0 0 24 24" fill="${cheio ? 'currentColor' : 'none'}"
    stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M9 3h6l-.8 5.5 2.8 3V14H7v-2.5l2.8-3z"/><path d="M12 14v7" fill="none"/></svg>`;

const ICONE_LIXO = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" '
    + 'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-12M9 7V4h6v3"/></svg>';
const ICONE_IMAGEM = '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" '
    + 'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2.5"/>'
    + '<circle cx="8.5" cy="9.5" r="1.8"/><path d="m21 16-5-5-9 9"/></svg>';

// ========================================================
// Mensagens
// ========================================================

// tipo: 'ok', 'erro' ou vazio (aviso neutro)
function mostrarStatus(texto, tipo = '') {
    const caixa = el('np-status');
    caixa.textContent = texto;
    caixa.className = `status-importacao np-aviso${tipo ? ` status-importacao--${tipo}` : ''}`;
    caixa.hidden = !texto;
}

function listaBonita(itens) {
    return itens.length < 2 ? itens.join('') : `${itens.slice(0, -1).join(', ')} e ${itens.at(-1)}`;
}

// ========================================================
// Situação de cada notícia
// ========================================================

const SELOS = {
    rascunho: ['Rascunho', ''],
    pendente: ['Pendente de aprovação', 'np-status--pendente'],
    agendada: ['Agendada', 'np-status--agendada'],
    publicada: ['No site', 'np-status--publicada']
};

function selos(noticia) {
    const qual = situacao(noticia);
    const [texto, classe] = SELOS[qual] || SELOS.rascunho;
    // a que está no ar e tem mudanças esperando ganha os dois selos
    const extra = qual !== 'publicada' && noSite(noticia)
        ? '<span class="np-status np-status--publicada">No site</span>' : '';
    return `<span class="np-selos"><span class="np-status ${classe}">${texto}</span>${extra}</span>`;
}

function resumoDaSituacao(noticia) {
    const qual = situacao(noticia);
    const partes = [];
    if (qual === 'pendente') {
        partes.push(`Enviada ${haQuantoTempo(noticia.enviadaEm)}${noticia.enviadaPor ? ` por ${noticia.enviadaPor}` : ''}`);
    } else if (qual === 'agendada') {
        partes.push(`Vai ao ar ${dataHora(noticia.publicarEm)}${noticia.aprovadaPor ? ` · aprovada por ${noticia.aprovadaPor}` : ''}`);
    } else if (qual === 'publicada') {
        partes.push(`No site desde ${dataHora(noticia.publicadaEm)}${noticia.aprovadaPor ? ` · aprovada por ${noticia.aprovadaPor}` : ''}`);
        if (noticia.atualizadaEm) partes.push(`atualizada ${haQuantoTempo(noticia.atualizadaEm)}`);
    } else {
        partes.push(`Salva ${haQuantoTempo(noticia.alteradaEm)}${noticia.alteradaPor ? ` por ${noticia.alteradaPor}` : ''}`);
    }
    if (qual !== 'publicada' && noSite(noticia)) partes.push('o site mostra a versão aprovada');
    return partes.join(' · ');
}

// Em que aba cada uma aparece. A que está no site e tem mudanças esperando
// aparece também na aba dela (Rascunhos ou Em aprovação).
function daAba(noticia, aba) {
    const qual = situacao(noticia);
    if (aba === 'pendentes') return qual === 'pendente';
    if (aba === 'rascunhos') return qual === 'rascunho';
    if (aba === 'nosite') return qual === 'publicada' || qual === 'agendada' || noSite(noticia);
    return false;
}

// ========================================================
// Lista e histórico
// ========================================================

const VAZIO = {
    pendentes: 'Nenhuma notícia esperando aprovação.',
    rascunhos: 'Nenhum rascunho. Clique em <strong>+ Nova notícia</strong> para começar uma.',
    nosite: 'Nenhuma notícia própria no site ainda.'
};

function desenharLista() {
    for (const aba of ['pendentes', 'rascunhos', 'nosite']) {
        el(`np-contagem-${aba}`).textContent = `(${estado.noticias.filter((n) => daAba(n, aba)).length})`;
    }
    if (estado.aba === 'historico') return;

    const lista = el('np-lista');
    const itens = estado.noticias.filter((n) => daAba(n, estado.aba));
    // a fila de aprovação anda por ordem de chegada; as outras, a mexida por último primeiro
    if (estado.aba === 'pendentes') {
        itens.sort((a, b) => String(a.enviadaEm || '').localeCompare(String(b.enviadaEm || '')));
    }
    if (!itens.length) {
        lista.innerHTML = `<li class="np-vazio">${VAZIO[estado.aba]}</li>`;
        return;
    }
    lista.innerHTML = itens.map((noticia) => {
        const titulo = noticia.titulo || '(sem título)';
        const pendente = situacao(noticia) === 'pendente';
        const botaoPrincipal = pendente ? 'Revisar' : 'Editar';
        return `
            <li class="np-item${pendente ? ' np-item--pendente' : ''}">
                <span class="np-item-capa">${noticia.imagem?.url
                    ? `<img src="${escapeHtml(noticia.imagem.url)}" alt="" loading="lazy">` : ICONE_IMAGEM}</span>
                <div class="np-item-texto">
                    ${selos(noticia)}
                    <strong class="np-item-titulo">${escapeHtml(titulo)}</strong>
                    <span class="np-item-meta">${escapeHtml(resumoDaSituacao(noticia))}</span>
                </div>
                <div class="np-item-acoes">
                    <button type="button" class="btn ${pendente ? 'btn-primario' : 'btn-secundario'}" data-acao="editar"
                        data-id="${escapeHtml(noticia.id)}">${botaoPrincipal}</button>
                    ${estado.aba === 'nosite' ? botaoFixarHtml(noticia) : ''}
                    ${noSite(noticia) ? `<a class="btn btn-secundario" href="${escapeHtml(linkDaMateria(noticia.id))}" target="_blank" rel="noopener">Ver no site</a>` : ''}
                    <button type="button" class="np-excluir" data-acao="excluir" data-id="${escapeHtml(noticia.id)}"
                        aria-label="Excluir ${escapeHtml(titulo)}" title="Excluir">${ICONE_LIXO}</button>
                </div>
            </li>`;
    }).join('');
}

function linhaDoHistorico(registro) {
    const acao = ACOES[registro.acao] || registro.acao;
    return `
        <tr>
            <td><strong>${escapeHtml(dataHora(registro.em))}</strong><small>${escapeHtml(haQuantoTempo(registro.em))}</small></td>
            <td class="np-quem">${escapeHtml(registro.email || '—')}</td>
            <td><span class="np-acao np-acao--${escapeHtml(registro.acao)}">${escapeHtml(acao)}</span>${registro.detalhe
                ? ` <small>${escapeHtml(registro.detalhe)}</small>` : ''}</td>
            <td>${escapeHtml(registro.titulo || '')}</td>
        </tr>`;
}

function desenharHistorico(registros, { filtrando, carregando, erro }) {
    const vazio = (texto) => `<tr><td colspan="4" class="tabela-vazia">${texto}</td></tr>`;
    let html;
    if (carregando) html = vazio('Carregando histórico...');
    else if (erro) html = vazio('Não foi possível carregar o histórico agora.');
    else if (registros.length) html = registros.map(linhaDoHistorico).join('');
    else html = vazio(filtrando ? 'Nenhum registro com esses filtros.' : 'Nada registrado ainda.');
    el('np-historico-corpo').innerHTML = html;
}

async function carregarLista() {
    el('np-lista').innerHTML = '<li class="np-vazio">Carregando notícias...</li>';
    try {
        estado.noticias = await listarNoticiasProprias();
        desenharLista();
    } catch (erro) {
        console.error('Erro ao carregar as notícias próprias:', erro);
        el('np-lista').innerHTML = '<li class="np-vazio">Não foi possível carregar as notícias agora.</li>';
    }
}

// A barra de filtros (Quando, Quem, O que fez e busca pelo título) é montada
// na primeira vez que a aba abre; nas outras, só lê de novo.
let historico = null;
function carregarHistorico() {
    historico ||= historicoComFiltros({
        barra: el('np-historico-filtros'),
        botaoMais: el('np-historico-mais'),
        buscarPagina: (cursor) => listarHistoricoPagina({ depois: cursor }),
        desenhar: desenharHistorico,
        busca: { dica: 'Título da notícia…', texto: (r) => `${r.titulo || ''} ${r.detalhe || ''}` },
        campos: [campoQuem(), campoAcao(ACOES)]
    });
    historico.recarregar();
}

function abrirAba(aba) {
    if (!ABAS.includes(aba)) return;
    estado.aba = aba;
    for (const nome of ABAS) {
        const ativa = nome === aba;
        el(`np-aba-${nome}`).setAttribute('aria-selected', String(ativa));
        el(`np-aba-${nome}`).classList.toggle('np-aba--ativa', ativa);
    }
    el('np-painel-noticias').hidden = aba === 'historico';
    el('np-painel-historico').hidden = aba !== 'historico';
    if (aba === 'historico') carregarHistorico();
    else desenharLista();
    // alguém pode ter mexido nas fixadas pelo painel Notícias: lê de novo
    if (aba === 'nosite') carregarFixadas();
}

// ---- fixadas da página Notícias (botão Fixar da aba No site) ----

function estadoDoFixar(id) {
    const posicao = estado.fixadas ? estado.fixadas.indexOf(id) : -1;
    return posicao === -1
        ? { ativo: false, texto: 'Fixar', rotulo: 'Fixar no alto da página Notícias' }
        : {
            ativo: true,
            texto: `Fixada (${posicao + 1})`,
            rotulo: `Na vaga ${posicao + 1} das fixadas da página Notícias. Desafixar`
        };
}

// Só a notícia que está no ar tem o botão, e só depois que a lista chegou.
function botaoFixarHtml(noticia) {
    if (!estado.fixadas || !noSite(noticia)) return '';
    const { ativo, texto, rotulo } = estadoDoFixar(noticia.id);
    return `<button type="button" class="btn np-fixar${ativo ? ' np-fixar--ativo' : ''}" data-acao="fixar"
        data-id="${escapeHtml(noticia.id)}" aria-label="${rotulo}"${ativo ? ' title="Desafixar da página Notícias"' : ''}${
        estado.fixando ? ' disabled' : ''}>${ALFINETE(ativo)}${texto}</button>`;
}

// Troca o botão no lugar (sem redesenhar a lista): o foco não se perde.
function atualizarBotoesFixar() {
    el('np-lista').querySelectorAll('[data-acao="fixar"]').forEach((botao) => {
        const { ativo, texto, rotulo } = estadoDoFixar(botao.dataset.id);
        botao.classList.toggle('np-fixar--ativo', ativo);
        botao.innerHTML = `${ALFINETE(ativo)}${texto}`;
        botao.setAttribute('aria-label', rotulo);
        if (ativo) botao.title = 'Desafixar da página Notícias';
        else botao.removeAttribute('title');
        botao.disabled = estado.fixando;
    });
}

async function carregarFixadas() {
    if (estado.fixando) return;
    try {
        const { itens } = await lerFixadas();
        estado.fixadas = itens.map((item) => item.id);
    } catch (erro) {
        console.error('Erro ao ler as fixadas da página Notícias:', erro);
        estado.fixadas = null;
    }
    // os botões só existem com a lista em mãos: a aba No site é desenhada de novo
    if (estado.aba === 'nosite') desenharLista();
}

async function alternarFixada(id) {
    const noticia = estado.noticias.find((n) => n.id === id);
    if (!noticia || !estado.fixadas || estado.fixando) return;
    const fixada = estado.fixadas.includes(id);
    if (!fixada && estado.fixadas.length >= MAXIMO_FIXADAS) {
        mostrarStatus(`A página Notícias já tem ${MAXIMO_FIXADAS} notícias fixadas. Tire uma delas no painel `
            + 'Notícias (aba No site) para fixar esta.', 'erro');
        return;
    }
    const nome = `“${noticia.titulo || '(sem título)'}”`;
    estado.fixando = true;
    atualizarBotoesFixar();
    try {
        const itens = await mudarFixadas(fixada ? 'tirar' : 'fixar', { id, titulo: noticia.titulo });
        estado.fixadas = itens.map((item) => item.id);
        const posicao = estado.fixadas.indexOf(id);
        mostrarStatus(posicao === -1
            ? `Desafixada da página Notícias: ${nome}`
            : `Fixada na vaga ${posicao + 1} da página Notícias: ${nome}. A ordem das fixadas muda no painel Notícias.`, 'ok');
    } catch (erro) {
        console.error('Erro ao mudar as fixadas:', erro);
        mostrarStatus(erro?.message || 'Não foi possível mudar as fixadas. Tente de novo.', 'erro');
    } finally {
        estado.fixando = false;
        atualizarBotoesFixar();
        // o botão ficou desligado enquanto gravava e perdeu o foco: devolve
        const botao = [...el('np-lista').querySelectorAll('[data-acao="fixar"]')].find((b) => b.dataset.id === id);
        if (botao && (!document.activeElement || document.activeElement === document.body)) botao.focus();
    }
}

// A notícia estava no carrossel da Início ou nas fixadas da página Notícias
// (painel Notícias) e saiu do site: saiu delas também.
function avisoDasListas({ saiuDoCarrossel, saiuDasFixadas } = {}, id = '') {
    if (saiuDasFixadas && estado.fixadas) estado.fixadas = estado.fixadas.filter((fixada) => fixada !== id);
    const de = [saiuDoCarrossel && 'do carrossel da Início', saiuDasFixadas && 'das fixadas da página Notícias'];
    const listas = de.filter(Boolean);
    return listas.length ? ` Ela também saiu ${listas.join(' e ')}.` : '';
}

async function excluir(id) {
    const noticia = estado.noticias.find((n) => n.id === id);
    if (!noticia) return;
    const pergunta = `Excluir a notícia "${noticia.titulo || '(sem título)'}"?`
        + (noSite(noticia) || agendadaParaDepois(noticia) ? ' Ela sai do site na hora.' : '')
        + ' O registro no histórico continua guardado.';
    if (!confirm(pergunta)) return;
    try {
        const saiu = (await excluirNoticiaPropria(noticia)) || {};
        estado.noticias = estado.noticias.filter((n) => n.id !== id);
        const aviso = avisoDasListas(saiu, id);
        desenharLista();
        mostrarStatus(`Notícia excluída.${aviso}`, 'ok');
    } catch (erro) {
        console.error('Erro ao excluir a notícia:', erro);
        mostrarStatus(`Não foi possível excluir: ${erro.message}`, 'erro');
    }
}

// ========================================================
// Editor
// ========================================================

function trocarTela(tela) {
    el('np-lista-tela').hidden = tela !== 'lista';
    el('np-editor-tela').hidden = tela !== 'editor';
    window.scrollTo({ top: 0 });
}

// O que importa para saber se a pessoa mexeu em algo.
function conteudoDoEditor() {
    const { titulo, linhaApoio, autor, etiquetas, imagem, blocos } = estado.editando;
    return JSON.stringify({ titulo, linhaApoio, autor, etiquetas, imagem, blocos });
}

function temMudanca() {
    return Boolean(estado.editando) && conteudoDoEditor() !== estado.salvo;
}

function marcarComoSalvo() {
    estado.salvo = conteudoDoEditor();
}

function crescer(campo) {
    campo.style.height = 'auto';
    campo.style.height = `${campo.scrollHeight + 2}px`;
}

function contar(idCampo, idContador, limite) {
    el(idContador).textContent = `${el(idCampo).value.length} / ${limite}`;
}

function novaNoticia() {
    return {
        id: novoId(),
        titulo: '',
        linhaApoio: '',
        autor: AUTOR_PADRAO,
        etiquetas: [],
        imagem: null,
        blocos: [{ tipo: 'paragrafo', texto: '' }],
        status: 'rascunho'
    };
}

function abrirEditor(noticia) {
    estado.editando = structuredClone(noticia);
    estado.editando.blocos = Array.isArray(estado.editando.blocos) && estado.editando.blocos.length
        ? estado.editando.blocos : [{ tipo: 'paragrafo', texto: '' }];
    estado.destino = situacao(noticia) === 'pendente' ? 'pendente' : 'rascunho';
    estado.quando = 'agora';

    const nova = !noticia.criadaEm;
    el('np-editor-titulo').textContent = nova ? 'Nova notícia'
        : situacao(noticia) === 'pendente' ? 'Revisar notícia' : 'Editar notícia';
    el('np-titulo').value = noticia.titulo || '';
    el('np-apoio').value = noticia.linhaApoio || '';
    el('np-autor').value = noticia.autor || AUTOR_PADRAO;
    el('np-data').value = '';
    document.querySelectorAll('[data-etiqueta]').forEach((chip) => {
        chip.setAttribute('aria-pressed', String((noticia.etiquetas || []).includes(chip.dataset.etiqueta)));
    });

    contar('np-titulo', 'np-titulo-contador', LIMITES.titulo);
    contar('np-apoio', 'np-apoio-contador', LIMITES.linhaApoio);
    desenharImagemPrincipal();
    desenharBlocos();
    desenharSituacao();
    desenharMini();
    marcarComoSalvo();
    mostrarStatus('');
    trocarTela('editor');
    // só dá para medir a altura do texto com a tela à vista
    crescer(el('np-titulo'));
    crescer(el('np-apoio'));
    el('np-blocos').querySelectorAll('textarea').forEach(crescer);
    carregarHistoricoDaNoticia();
    if (nova) el('np-titulo').focus();
}

function voltarParaLista() {
    if (temMudanca() && !confirm('Sair sem salvar? O que você mudou nesta notícia vai se perder.')) return;
    estado.editando = null;
    mostrarStatus('');
    trocarTela('lista');
    desenharLista();
}

// ---- imagem (a principal e a dos blocos usam o mesmo desenho) ----

function htmlDaImagem(imagem, alvo) {
    const carregando = estado.enviando.has(String(alvo));
    if (!imagem?.url) {
        return `
            <button type="button" class="np-soltar" data-acao="escolher-imagem" data-alvo="${alvo}"${carregando ? ' disabled' : ''}>
                ${ICONE_IMAGEM}
                <strong>${carregando ? 'Enviando a imagem...' : 'Escolher imagem'}</strong>
                <span>JPG, PNG ou WebP. Ela é reduzida antes de subir.</span>
            </button>`;
    }
    return `
        <figure class="np-figura${carregando ? ' np-figura--enviando' : ''}">
            <img src="${escapeHtml(imagem.url)}" alt="">
            <div class="np-figura-trocar">
                <button type="button" class="np-botao-imagem" data-acao="escolher-imagem" data-alvo="${alvo}">${carregando ? 'Enviando...' : 'Trocar'}</button>
                <button type="button" class="np-botao-imagem" data-acao="remover-imagem" data-alvo="${alvo}">Remover</button>
            </div>
        </figure>
        <div class="np-legenda">
            <input type="text" data-campo="legenda" data-alvo="${alvo}" maxlength="${LIMITES.legenda}"
                value="${escapeHtml(imagem.legenda || '')}" placeholder="Legenda (o que aparece na foto)" aria-label="Legenda da imagem">
            <input type="text" data-campo="credito" data-alvo="${alvo}" maxlength="${LIMITES.credito}"
                value="${escapeHtml(imagem.credito || '')}" placeholder="Crédito (ex.: Foto: CPS)" aria-label="Crédito da imagem">
        </div>`;
}

function desenharImagemPrincipal() {
    el('np-imagem-principal').innerHTML = htmlDaImagem(estado.editando.imagem, 'principal');
}

// ---- blocos do texto ----

const TIPOS_DE_BLOCO = {
    paragrafo: { sinal: '&para;', nome: 'Parágrafo' },
    intertitulo: { sinal: 'H', nome: 'Intertítulo' },
    imagem: { sinal: '&#9635;', nome: 'Imagem com legenda' }
};

function htmlDoBloco(bloco, indice, total) {
    const tipo = TIPOS_DE_BLOCO[bloco.tipo];
    // só o parágrafo tem negrito, itálico e link (o intertítulo já é todo destacado)
    const marcas = bloco.tipo === 'paragrafo'
        ? `<button type="button" class="np-controle np-controle--negrito" data-acao="negrito" data-indice="${indice}"
                aria-label="Negrito no trecho selecionado" title="Negrito no trecho selecionado (Ctrl+B)">B</button>
            <button type="button" class="np-controle np-controle--italico" data-acao="italico" data-indice="${indice}"
                aria-label="Itálico no trecho selecionado" title="Itálico no trecho selecionado (Ctrl+I)">I</button>
            <button type="button" class="np-controle np-controle--link" data-acao="link" data-indice="${indice}"
                aria-label="Link no trecho selecionado" title="Link no trecho selecionado (Ctrl+K)">${ICONE_LINK}</button>`
        : '';
    const controles = `
        <div class="np-bloco-controles">
            ${marcas}
            <button type="button" class="np-controle" data-acao="subir" data-indice="${indice}"${indice === 0 ? ' disabled' : ''}
                aria-label="Subir ${tipo.nome.toLowerCase()}" title="Subir">&uarr;</button>
            <button type="button" class="np-controle" data-acao="descer" data-indice="${indice}"${indice === total - 1 ? ' disabled' : ''}
                aria-label="Descer ${tipo.nome.toLowerCase()}" title="Descer">&darr;</button>
            <button type="button" class="np-controle np-controle--excluir" data-acao="remover-bloco" data-indice="${indice}"
                aria-label="Remover ${tipo.nome.toLowerCase()}" title="Remover">&times;</button>
        </div>`;
    let conteudo;
    if (bloco.tipo === 'paragrafo') {
        conteudo = `<textarea class="np-bloco-texto" data-campo="texto" data-indice="${indice}" rows="3" maxlength="${LIMITES.paragrafo}"
            placeholder="Escreva o parágrafo..." aria-label="Parágrafo ${indice + 1}">${escapeHtml(bloco.texto || '')}</textarea>`;
    } else if (bloco.tipo === 'intertitulo') {
        conteudo = `<input type="text" class="np-bloco-intertitulo" data-campo="texto" data-indice="${indice}" maxlength="${LIMITES.intertitulo}"
            value="${escapeHtml(bloco.texto || '')}" placeholder="Intertítulo" aria-label="Intertítulo">`;
    } else {
        conteudo = `<div class="np-bloco-imagem">${htmlDaImagem(bloco, indice)}</div>`;
    }
    return `
        <div class="np-bloco np-bloco--${bloco.tipo}">
            <span class="np-bloco-tipo" title="${tipo.nome}" aria-hidden="true">${tipo.sinal}</span>
            <div class="np-bloco-conteudo">${conteudo}</div>
            ${controles}
        </div>`;
}

function desenharBlocos() {
    const blocos = estado.editando.blocos;
    el('np-blocos').innerHTML = blocos.map((bloco, indice) => htmlDoBloco(bloco, indice, blocos.length)).join('');
    el('np-blocos').querySelectorAll('textarea').forEach(crescer);
    el('np-adicionar').querySelectorAll('button').forEach((botao) => { botao.disabled = blocos.length >= LIMITES.blocos; });
}

function adicionarBloco(tipo) {
    const blocos = estado.editando.blocos;
    if (blocos.length >= LIMITES.blocos) return;
    blocos.push(tipo === 'imagem' ? { tipo, url: '', legenda: '', credito: '' } : { tipo, texto: '' });
    desenharBlocos();
    el('np-blocos').lastElementChild?.querySelector('textarea, input')?.focus();
    if (tipo === 'imagem') escolherImagem(blocos.length - 1);
}

// Negrito e itálico no parágrafo: põe (ou tira, se já tiver) a marca em
// volta do trecho selecionado, ** para negrito e _ para itálico, e a página
// da notícia mostra o trecho formatado. Sem nada selecionado, vale a palavra
// onde está o cursor; num espaço vazio, deixa as duas marcas com o cursor no
// meio, para já digitar formatado. Com os dois juntos (_**assim**_), passa
// por cima da outra marca para achar a sua. Usa o insertText do navegador
// para o Ctrl+Z desfazer (e o "input" atualizar a notícia).
const MARCAS = { negrito: '**', italico: '_' };
const LETRA = /[\p{L}\p{N}]/u;

function aplicarMarca(campo, marca) {
    if (!campo) return;
    const texto = campo.value;
    const n = marca.length;
    let inicio = campo.selectionStart;
    let fim = campo.selectionEnd;
    if (inicio === fim) {
        while (inicio > 0 && LETRA.test(texto[inicio - 1])) inicio -= 1;
        while (fim < texto.length && LETRA.test(texto[fim])) fim += 1;
    }
    // espaço nas pontas fica fora: "** palavra**" não seria negrito
    while (inicio < fim && /\s/.test(texto[inicio])) inicio += 1;
    while (fim > inicio && /\s/.test(texto[fim - 1])) fim -= 1;
    const trecho = texto.slice(inicio, fim);

    // a marca logo em volta do trecho, passando por cima da outra
    const envolve = (de, ate, m) => de >= m.length
        && texto.slice(de - m.length, de) === m && texto.slice(ate, ate + m.length) === m;
    const outras = Object.values(MARCAS).filter((m) => m !== marca);
    let de = inicio;
    let ate = fim;
    while (!envolve(de, ate, marca)) {
        const outra = outras.find((m) => envolve(de, ate, m));
        if (!outra) break;
        de -= outra.length;
        ate += outra.length;
    }

    let troca;
    if (envolve(de, ate, marca)) {
        // já tinha a marca, fora da seleção: tira (o que está dentro fica)
        troca = { de: de - n, ate: ate + n, por: texto.slice(de, ate), selecao: [inicio - n, fim - n] };
    } else if (trecho.length >= 2 * n && trecho.startsWith(marca) && trecho.endsWith(marca)) {
        // a seleção pegou as marcas junto: tira
        troca = { de: inicio, ate: fim, por: trecho.slice(n, -n), selecao: [inicio, fim - 2 * n] };
    } else {
        troca = { de: inicio, ate: fim, por: `${marca}${trecho}${marca}`, selecao: [inicio + n, fim + n] };
    }
    if (texto.length - (troca.ate - troca.de) + troca.por.length > LIMITES.paragrafo) return;

    trocarTrecho(campo, troca.de, troca.ate, troca.por);
    campo.setSelectionRange(...troca.selecao);
}

// Troca um trecho do parágrafo com o insertText do navegador, para o Ctrl+Z
// desfazer (e o "input" atualizar a notícia).
function trocarTrecho(campo, de, ate, por) {
    campo.focus();
    campo.setSelectionRange(de, ate);
    const trocou = por ? document.execCommand('insertText', false, por) : document.execCommand('delete');
    if (!trocou) {
        campo.setRangeText(por, de, ate, 'end');
        campo.dispatchEvent(new Event('input', { bubbles: true }));
    }
}

// ---- link no parágrafo ----
// O botão de link (e o Ctrl+K) abre a janelinha com o trecho selecionado
// como texto do link. Com a seleção (ou o cursor) num link que já existe,
// ela vem com o endereço dele e o botão "Tirar o link". O parágrafo guarda
// [texto](endereço), e a matéria mostra o link (ver formatacaoEmHtml).

function abrirLink(campo) {
    if (!campo) return;
    const texto = campo.value;
    let de = campo.selectionStart;
    let ate = campo.selectionEnd;
    const existente = linkNoTexto(texto, de, ate);
    let rotulo = '';
    let endereco = '';
    if (existente) {
        ({ de, ate, rotulo, endereco } = existente);
    } else {
        // espaço nas pontas fica fora do link
        while (de < ate && /\s/.test(texto[de])) de += 1;
        while (ate > de && /\s/.test(texto[ate - 1])) ate -= 1;
        rotulo = texto.slice(de, ate);
        if (rotulo.includes('\n')) {
            mostrarStatus('O link vale para um trecho de uma linha só. Selecione só as palavras que vão virar link.', 'erro');
            return;
        }
        // selecionou um endereço: ele já entra no campo do endereço
        if (/[./@]/.test(rotulo) && enderecoDoLink(rotulo)) endereco = rotulo;
    }
    estado.link = { indice: Number(campo.dataset.indice), texto, de, ate, existente: Boolean(existente) };
    el('np-link-texto').value = rotulo;
    el('np-link-endereco').value = endereco;
    mostrarErroDoLink('');
    el('np-link-tirar').hidden = !existente;
    el('np-link-salvar').textContent = existente ? 'Salvar o link' : 'Pôr o link';
    el('np-link').classList.add('aberto');
    (rotulo && !endereco ? el('np-link-endereco') : el('np-link-texto')).focus();
}

function mostrarErroDoLink(texto, campo) {
    el('np-link-erro').textContent = texto;
    el('np-link-erro').hidden = !texto;
    for (const id of ['np-link-texto', 'np-link-endereco']) {
        el(id).toggleAttribute('aria-invalid', Boolean(texto) && id === campo);
    }
    if (campo) el(campo).focus();
}

// O parágrafo do link, se ele continua como estava quando a janelinha abriu.
function campoDoLink() {
    const link = estado.link;
    const campo = link && el('np-blocos').querySelector(`textarea[data-indice="${link.indice}"]`);
    return campo && campo.value === link.texto ? campo : null;
}

function fecharLink() {
    const campo = campoDoLink();
    el('np-link').classList.remove('aberto');
    estado.link = null;
    campo?.focus();
}

function salvarLink(evento) {
    evento.preventDefault();
    const link = estado.link;
    const campo = campoDoLink();
    if (!link || !campo) {
        fecharLink();
        return;
    }
    const rotulo = el('np-link-texto').value.trim();
    const endereco = enderecoDoLink(el('np-link-endereco').value);
    if (!rotulo) {
        mostrarErroDoLink('Escreva o texto do link: é o trecho que aparece sublinhado na notícia.', 'np-link-texto');
        return;
    }
    if (!endereco) {
        mostrarErroDoLink(el('np-link-endereco').value.trim()
            ? 'Esse endereço não parece um link. Cole o endereço inteiro da página, como https://www.cps.sp.gov.br.'
            : 'Cole o endereço da página para onde o link leva.', 'np-link-endereco');
        return;
    }
    const por = marcacaoDoLink(rotulo, endereco);
    if (link.texto.length - (link.ate - link.de) + por.length > LIMITES.paragrafo) {
        mostrarErroDoLink(`Com esse link o parágrafo passaria de ${LIMITES.paragrafo} caracteres. Divida o texto em dois parágrafos.`);
        return;
    }
    el('np-link').classList.remove('aberto');
    estado.link = null;
    trocarTrecho(campo, link.de, link.ate, por);
    // o cursor fica logo depois do link, para continuar escrevendo
    campo.setSelectionRange(link.de + por.length, link.de + por.length);
}

// Tira o link e deixa só o texto dele, selecionado.
function tirarLink() {
    const link = estado.link;
    const campo = campoDoLink();
    const achado = campo && link.existente ? linkNoTexto(campo.value, link.de, link.ate) : null;
    if (!achado) {
        fecharLink();
        return;
    }
    el('np-link').classList.remove('aberto');
    estado.link = null;
    trocarTrecho(campo, achado.de, achado.ate, achado.rotulo);
    campo.setSelectionRange(achado.de, achado.de + achado.rotulo.length);
}

function moverBloco(indice, passo) {
    const blocos = estado.editando.blocos;
    const destino = indice + passo;
    if (destino < 0 || destino >= blocos.length) return;
    [blocos[indice], blocos[destino]] = [blocos[destino], blocos[indice]];
    desenharBlocos();
    el('np-blocos').children[destino]?.querySelector(`[data-acao="${passo < 0 ? 'subir' : 'descer'}"]:not(:disabled)`)?.focus();
}

function removerBloco(indice) {
    const bloco = estado.editando.blocos[indice];
    const temConteudo = bloco && (bloco.texto || bloco.url);
    if (temConteudo && !confirm(`Remover este ${TIPOS_DE_BLOCO[bloco.tipo].nome.toLowerCase()}?`)) return;
    estado.editando.blocos.splice(indice, 1);
    if (!estado.editando.blocos.length) estado.editando.blocos.push({ tipo: 'paragrafo', texto: '' });
    desenharBlocos();
}

// ---- envio de imagem ----

function escolherImagem(alvo) {
    estado.alvoImagem = alvo;
    el('np-arquivo').value = '';
    el('np-arquivo').click();
}

function redesenharAlvo(alvo) {
    if (alvo === 'principal') {
        desenharImagemPrincipal();
        desenharMini();
    } else {
        desenharBlocos();
    }
}

async function enviarArquivo(alvo, arquivo) {
    if (!arquivo || estado.enviando.has(String(alvo))) return;
    const noticiaId = estado.editando.id;
    estado.enviando.add(String(alvo));
    redesenharAlvo(alvo);
    mostrarStatus('Enviando a imagem...');
    try {
        const url = await enviarImagemNoticia(noticiaId, arquivo);
        // a pessoa pode ter saído do editor enquanto a imagem subia
        if (estado.editando?.id !== noticiaId) return;
        if (alvo === 'principal') {
            estado.editando.imagem = { ...(estado.editando.imagem || {}), url };
        } else if (estado.editando.blocos[alvo]) {
            estado.editando.blocos[alvo].url = url;
        }
        mostrarStatus('Imagem enviada.', 'ok');
    } catch (erro) {
        console.error('Erro ao enviar a imagem:', erro);
        mostrarStatus(`A imagem não subiu: ${erro.message}`, 'erro');
    } finally {
        estado.enviando.delete(String(alvo));
        if (estado.editando?.id === noticiaId) redesenharAlvo(alvo);
    }
}

function removerImagem(alvo) {
    if (alvo === 'principal') {
        estado.editando.imagem = null;
    } else if (estado.editando.blocos[alvo]) {
        Object.assign(estado.editando.blocos[alvo], { url: '', legenda: '', credito: '' });
    }
    redesenharAlvo(alvo);
}

// ---- situação, aprovação e o que já está no site ----

function desenharSituacao() {
    const noticia = estado.editando;
    const qual = situacao(noticia);
    const pendente = qual === 'pendente';
    const estaNoSite = noSite(noticia);
    const agendada = agendadaParaDepois(noticia);

    el('np-selo-editor').innerHTML = selos(noticia);
    el('np-destino-rascunho').checked = estado.destino === 'rascunho';
    el('np-destino-pendente').checked = estado.destino === 'pendente';

    // um aviso do que está valendo agora
    const avisos = [];
    if (estaNoSite) avisos.push('Esta notícia está no site. O que você mudar aqui só entra no ar depois de aprovado; até lá o site mostra a versão aprovada.');
    if (agendada) avisos.push(`Aprovada para ir ao ar ${dataHora(noticia.publicarEm)}. Se você salvar mudanças, o agendamento cai e ela precisa ser aprovada de novo.`);
    el('np-aviso-situacao').innerHTML = avisos.map((texto) => `<p>${escapeHtml(texto)}</p>`).join('');
    el('np-aviso-situacao').hidden = !avisos.length;

    el('np-salvar').textContent = estado.destino === 'pendente'
        ? (pendente ? 'Salvar e manter pendente' : 'Enviar para aprovação') : 'Salvar rascunho';
    // na pendente o botão forte é o de aprovar, no cartão de cima
    el('np-salvar').classList.toggle('btn-primario', !pendente);
    el('np-salvar').classList.toggle('btn-secundario', pendente);
    el('np-desagendar').hidden = !agendada;
    el('np-despublicar').hidden = !estaNoSite;

    const linhas = [
        ['No site desde', estaNoSite ? dataHora(noticia.publicadaEm) : '—'],
        ['Atualizada', noticia.atualizadaEm ? dataHora(noticia.atualizadaEm) : '—'],
        ['Criada por', noticia.criadaPor || 'você, ao salvar']
    ];
    el('np-datas').innerHTML = linhas
        .map(([rotulo, valor]) => `<span>${rotulo}</span><strong>${escapeHtml(valor)}</strong>`).join('');

    // cartão de aprovação: só para a pendente
    el('np-cartao-aprovacao').hidden = !pendente;
    if (pendente) {
        el('np-enviada').textContent = `Enviada ${haQuantoTempo(noticia.enviadaEm)}`
            + `${noticia.enviadaPor ? ` por ${noticia.enviadaPor}` : ''} (${dataHora(noticia.enviadaEm)}).`;
        el('np-quando-agora').checked = estado.quando === 'agora';
        el('np-quando-agendar').checked = estado.quando === 'agendar';
        // a que já está no site não pode ser "agendada": as mudanças entram na hora
        el('np-quando-agendar').disabled = estaNoSite;
        el('np-opcao-agendar').classList.toggle('np-opcao-travada', estaNoSite);
        el('np-quando').hidden = estado.quando !== 'agendar';
        el('np-data').min = paraDatetimeLocal(new Date(Date.now() + MINIMO_AGENDAMENTO_MS));
        el('np-aprovar').textContent = estado.quando === 'agendar' ? 'Aprovar e agendar'
            : estaNoSite ? 'Aprovar e publicar as mudanças' : 'Aprovar e publicar';
    }
}

function desenharMini() {
    const noticia = estado.editando;
    el('np-mini').innerHTML = `
        ${noticia.imagem?.url ? `<img src="${escapeHtml(noticia.imagem.url)}" alt="">` : `<span class="np-mini-sem">${ICONE_IMAGEM}</span>`}
        <div><span>Notícia do Futuro+</span><strong>${escapeHtml(noticia.titulo || 'Título da notícia')}</strong></div>`;
}

async function carregarHistoricoDaNoticia() {
    const noticia = estado.editando;
    const corpo = el('np-historico-noticia');
    if (!noticia.criadaEm) {
        corpo.innerHTML = '<p class="np-historico-vazio">O histórico começa quando você salvar.</p>';
        return;
    }
    corpo.innerHTML = '<p class="np-historico-vazio">Carregando...</p>';
    try {
        const registros = await listarHistorico({ noticiaId: noticia.id, quantos: 20 });
        if (estado.editando?.id !== noticia.id) return;
        corpo.innerHTML = registros.length
            ? `<ol class="np-linha-do-tempo">${registros.map((registro) => `
                <li>
                    <strong>${escapeHtml(registro.email || '—')}</strong>
                    <span>${escapeHtml(ACOES[registro.acao] || registro.acao)}${registro.detalhe ? ` ${escapeHtml(registro.detalhe)}` : ''}</span>
                    <time>${escapeHtml(dataHora(registro.em))}</time>
                </li>`).join('')}</ol>`
            : '<p class="np-historico-vazio">Nada registrado ainda.</p>';
    } catch (erro) {
        console.error('Erro ao carregar o histórico da notícia:', erro);
        corpo.innerHTML = '<p class="np-historico-vazio">Não foi possível carregar o histórico.</p>';
    }
}

function travar(ocupado) {
    estado.ocupado = ocupado;
    ['np-salvar', 'np-ver', 'np-aprovar', 'np-devolver', 'np-desagendar', 'np-despublicar'].forEach((id) => {
        el(id).disabled = ocupado;
    });
}

const MENSAGENS = {
    rascunho: 'Rascunho salvo. Ele está na aba Rascunhos.',
    enviar: 'Enviada para aprovação. Ela aparece em primeiro no painel Notícias, na aba Pendentes.',
    aprovar: 'Aprovada e publicada! Ela já aparece na página Notícias.',
    agendar: 'Aprovada e agendada.',
    devolver: 'Devolvida para rascunho.',
    desagendar: 'Agendamento cancelado. A notícia voltou para aprovação.',
    despublicar: 'A notícia saiu do site e voltou a ser rascunho.'
};

async function salvar(acao, opcoes = {}) {
    if (estado.ocupado) return;
    if (estado.enviando.size) {
        mostrarStatus('Espere a imagem terminar de subir antes de salvar.', 'erro');
        return;
    }
    travar(true);
    mostrarStatus('Salvando...');
    try {
        // saiuDoCarrossel e saiuDasFixadas não são da notícia: ficam fora do que o editor guarda
        const { saiuDoCarrossel, saiuDasFixadas, ...salva } = await salvarNoticiaPropria(estado.editando, acao, opcoes);
        estado.editando = { ...estado.editando, ...salva };
        // o que foi guardado vem limpo (parágrafo vazio sai): a tela volta a
        // mostrar exatamente isso, para os campos não ficarem fora de ordem
        if (!estado.editando.blocos.length) estado.editando.blocos = [{ tipo: 'paragrafo', texto: '' }];
        estado.destino = situacao(salva) === 'pendente' ? 'pendente' : 'rascunho';
        estado.quando = 'agora';
        el('np-data').value = '';
        desenharImagemPrincipal();
        desenharBlocos();
        desenharMini();
        const indice = estado.noticias.findIndex((n) => n.id === salva.id);
        if (indice >= 0) estado.noticias.splice(indice, 1);
        estado.noticias.unshift(structuredClone(salva));
        el('np-editor-titulo').textContent = situacao(salva) === 'pendente' ? 'Revisar notícia' : 'Editar notícia';
        desenharSituacao();
        marcarComoSalvo();
        const chave = acao === 'aprovar' && opcoes.quando === 'agendar' ? 'agendar' : acao;
        const extra = chave === 'agendar' ? ` Ela vai ao ar ${dataHora(salva.publicarEm)}.` : '';
        mostrarStatus(MENSAGENS[chave] + extra + avisoDasListas({ saiuDoCarrossel, saiuDasFixadas }, salva.id), 'ok');
        carregarHistoricoDaNoticia();
    } catch (erro) {
        console.error('Erro ao salvar a notícia:', erro);
        mostrarStatus(`Não foi possível salvar: ${erro.message}`, 'erro');
    } finally {
        travar(false);
    }
}

// "Salvar": rascunho ou pendente, conforme o que está marcado
function aoSalvar() {
    const noticia = estado.editando;
    if (!textoCurto(noticia.titulo, LIMITES.titulo)) {
        mostrarStatus('Escreva pelo menos o título para salvar.', 'erro');
        el('np-titulo').focus();
        return;
    }
    // sem mudança, salvar de novo só faria barulho no histórico (e, na
    // agendada, derrubaria o agendamento sem querer)
    const qual = situacao(noticia);
    if (!temMudanca() && (qual === estado.destino || qual === 'publicada' || qual === 'agendada')) {
        mostrarStatus(qual === 'agendada'
            ? 'Nada mudou desde a aprovação. Para tirar o agendamento, use "Cancelar agendamento".'
            : 'Nada mudou desde o último salvamento.');
        return;
    }
    if (estado.destino === 'pendente') {
        const falta = oQueFalta(noticia);
        if (falta.length) {
            mostrarStatus(`Para enviar para aprovação, falta ${listaBonita(falta)}. Se ainda não terminou, salve como rascunho.`, 'erro');
            return;
        }
        salvar('enviar');
        return;
    }
    if (qual === 'pendente'
        && !confirm('Tirar esta notícia da aprovação e guardar como rascunho?')) return;
    salvar('rascunho');
}

function aoAprovar() {
    const falta = oQueFalta(estado.editando);
    if (falta.length) {
        mostrarStatus(`Para aprovar, falta ${listaBonita(falta)}.`, 'erro');
        return;
    }
    if (estado.quando === 'agendar') {
        const publicarEm = deDatetimeLocal(el('np-data').value);
        if (!publicarEm) {
            mostrarStatus('Escolha a data e a hora da publicação.', 'erro');
            return;
        }
        if (new Date(publicarEm) - Date.now() < MINIMO_AGENDAMENTO_MS) {
            mostrarStatus('O agendamento precisa ser pelo menos 1 hora à frente do horário atual.', 'erro');
            return;
        }
        salvar('aprovar', { quando: 'agendar', publicarEm, ajustes: temMudanca() });
        return;
    }
    // ajustes: quem aprova mexeu no texto antes de aprovar (vai para o histórico)
    salvar('aprovar', { quando: 'agora', ajustes: temMudanca() });
}

function aoDevolver() {
    const motivo = prompt('Devolver para rascunho. Quer deixar um motivo? (aparece no histórico; pode ficar em branco)', '');
    if (motivo === null) return;
    salvar('devolver', { motivo });
}

// ---- "Ver como fica" ----

function abrirPrevia() {
    const noticia = {
        ...estado.editando,
        instituicoes: estado.editando.etiquetas,
        publicadaEm: estado.editando.publicadaEm
            || (estado.quando === 'agendar' ? deDatetimeLocal(el('np-data').value) : null)
    };
    el('np-previa-conteudo').innerHTML = `<article class="materia">${htmlDaMateria(noticia, { botaoCopiar: false })}</article>`;
    el('np-previa').classList.add('aberto');
    el('np-fechar-previa').focus();
}

function fecharPrevia() {
    el('np-previa').classList.remove('aberto');
    el('np-ver').focus();
}

// ========================================================
// Eventos
// ========================================================

function ligarEventos() {
    el('logout-btn').addEventListener('click', async () => {
        try {
            await sairDaConta();
            window.location.href = 'login.html';
        } catch (erro) {
            console.error('Erro ao sair da conta:', erro);
        }
    });

    el('np-nova').addEventListener('click', () => abrirEditor(novaNoticia()));
    el('np-voltar').addEventListener('click', voltarParaLista);
    for (const aba of ABAS) el(`np-aba-${aba}`).addEventListener('click', () => abrirAba(aba));

    el('np-lista').addEventListener('click', (evento) => {
        const botao = evento.target.closest('[data-acao]');
        if (!botao) return;
        if (botao.dataset.acao === 'editar') {
            const noticia = estado.noticias.find((n) => n.id === botao.dataset.id);
            if (noticia) abrirEditor(noticia);
        }
        if (botao.dataset.acao === 'excluir') excluir(botao.dataset.id);
        if (botao.dataset.acao === 'fixar' && !botao.disabled) alternarFixada(botao.dataset.id);
    });

    // campos fixos do editor
    el('np-titulo').addEventListener('input', () => {
        estado.editando.titulo = el('np-titulo').value;
        contar('np-titulo', 'np-titulo-contador', LIMITES.titulo);
        crescer(el('np-titulo'));
        desenharMini();
    });
    el('np-apoio').addEventListener('input', () => {
        estado.editando.linhaApoio = el('np-apoio').value;
        contar('np-apoio', 'np-apoio-contador', LIMITES.linhaApoio);
        crescer(el('np-apoio'));
    });
    el('np-autor').addEventListener('input', () => { estado.editando.autor = el('np-autor').value; });
    document.querySelectorAll('[data-etiqueta]').forEach((chip) => {
        chip.addEventListener('click', () => {
            const id = chip.dataset.etiqueta;
            const atuais = new Set(estado.editando.etiquetas || []);
            if (atuais.has(id)) atuais.delete(id); else atuais.add(id);
            estado.editando.etiquetas = [...atuais].filter((etiqueta) => etiqueta in ETIQUETAS);
            chip.setAttribute('aria-pressed', String(atuais.has(id)));
        });
    });

    // imagem principal e blocos: um ouvinte só para cada área
    const aoDigitar = (evento) => {
        const campo = evento.target.closest('[data-campo]');
        if (!campo) return;
        const alvo = campo.dataset.alvo ?? campo.dataset.indice;
        const destino = alvo === 'principal' ? estado.editando.imagem : estado.editando.blocos[Number(alvo)];
        if (!destino) return;
        destino[campo.dataset.campo] = campo.value;
        if (campo.tagName === 'TEXTAREA') crescer(campo);
    };
    const aoClicar = (evento) => {
        const botao = evento.target.closest('[data-acao]');
        if (!botao || botao.disabled) return;
        const alvo = botao.dataset.alvo === 'principal' ? 'principal' : Number(botao.dataset.alvo ?? botao.dataset.indice);
        const acoes = {
            'escolher-imagem': () => escolherImagem(alvo),
            'remover-imagem': () => removerImagem(alvo),
            subir: () => moverBloco(alvo, -1),
            descer: () => moverBloco(alvo, 1),
            'remover-bloco': () => removerBloco(alvo),
            negrito: () => aplicarMarca(el('np-blocos').querySelector(`textarea[data-indice="${alvo}"]`), MARCAS.negrito),
            italico: () => aplicarMarca(el('np-blocos').querySelector(`textarea[data-indice="${alvo}"]`), MARCAS.italico),
            link: () => abrirLink(el('np-blocos').querySelector(`textarea[data-indice="${alvo}"]`))
        };
        acoes[botao.dataset.acao]?.();
    };
    // o B, o I e o link não tiram o foco do parágrafo, senão a seleção se perderia no clique
    el('np-blocos').addEventListener('mousedown', (evento) => {
        if (evento.target.closest('[data-acao="negrito"], [data-acao="italico"], [data-acao="link"]')) evento.preventDefault();
    });
    // Ctrl+B, Ctrl+I e Ctrl+K (o atalho de link dos editores de texto)
    const ATALHOS = { b: MARCAS.negrito, i: MARCAS.italico, k: 'link' };
    el('np-blocos').addEventListener('keydown', (evento) => {
        const campo = evento.target.closest('textarea.np-bloco-texto');
        const atalho = ATALHOS[evento.key?.toLowerCase()];
        if (!campo || !atalho || !(evento.ctrlKey || evento.metaKey) || evento.altKey || evento.shiftKey) return;
        evento.preventDefault();
        if (atalho === 'link') abrirLink(campo);
        else aplicarMarca(campo, atalho);
    });
    // a janelinha do link
    el('np-link-form').addEventListener('submit', salvarLink);
    el('np-link-tirar').addEventListener('click', tirarLink);
    el('np-link-cancelar').addEventListener('click', fecharLink);
    el('np-link-fechar').addEventListener('click', fecharLink);
    el('np-link').addEventListener('click', (evento) => {
        if (evento.target === el('np-link')) fecharLink();
    });
    for (const id of ['np-link-texto', 'np-link-endereco']) {
        el(id).addEventListener('input', () => mostrarErroDoLink(''));
    }
    for (const area of [el('np-imagem-principal'), el('np-blocos')]) {
        area.addEventListener('input', aoDigitar);
        area.addEventListener('click', aoClicar);
        // arrastar uma imagem do computador para a área de envio
        area.addEventListener('dragover', (evento) => {
            if (evento.target.closest('.np-soltar')) evento.preventDefault();
        });
        area.addEventListener('drop', (evento) => {
            const zona = evento.target.closest('.np-soltar');
            if (!zona) return;
            evento.preventDefault();
            const alvo = zona.dataset.alvo === 'principal' ? 'principal' : Number(zona.dataset.alvo);
            enviarArquivo(alvo, evento.dataTransfer.files?.[0]);
        });
    }
    el('np-arquivo').addEventListener('change', () => {
        const arquivo = el('np-arquivo').files?.[0];
        if (arquivo && estado.alvoImagem !== null) enviarArquivo(estado.alvoImagem, arquivo);
    });

    el('np-adicionar').addEventListener('click', (evento) => {
        const botao = evento.target.closest('[data-tipo]');
        if (botao) adicionarBloco(botao.dataset.tipo);
    });

    // situação: rascunho ou pendente (só um dos dois)
    el('np-destino-rascunho').addEventListener('change', () => { estado.destino = 'rascunho'; desenharSituacao(); });
    el('np-destino-pendente').addEventListener('change', () => { estado.destino = 'pendente'; desenharSituacao(); });
    el('np-salvar').addEventListener('click', aoSalvar);
    el('np-ver').addEventListener('click', abrirPrevia);
    el('np-desagendar').addEventListener('click', () => {
        if (confirm('Cancelar o agendamento? A notícia volta para aprovação e não vai mais ao ar na data marcada.')) salvar('desagendar');
    });
    el('np-despublicar').addEventListener('click', () => {
        if (confirm('Tirar esta notícia do site? Ela some da página Notícias e volta a ser rascunho.')) salvar('despublicar');
    });

    // aprovação
    el('np-quando-agora').addEventListener('change', () => { estado.quando = 'agora'; desenharSituacao(); });
    el('np-quando-agendar').addEventListener('change', () => {
        estado.quando = 'agendar';
        desenharSituacao();
        el('np-data').focus();
    });
    el('np-aprovar').addEventListener('click', aoAprovar);
    el('np-devolver').addEventListener('click', aoDevolver);

    // prévia
    el('np-fechar-previa').addEventListener('click', fecharPrevia);
    el('np-previa').addEventListener('click', (evento) => {
        if (evento.target === el('np-previa')) fecharPrevia();
        // na prévia os links não levam a lugar nenhum
        if (evento.target.closest('a')) evento.preventDefault();
    });
    document.addEventListener('keydown', (evento) => {
        if (evento.key === 'Escape' && el('np-link').classList.contains('aberto')) fecharLink();
        else if (evento.key === 'Escape' && el('np-previa').classList.contains('aberto')) fecharPrevia();
    });

    window.addEventListener('beforeunload', (evento) => {
        if (temMudanca()) evento.preventDefault();
    });
    window.addEventListener('resize', medirTopo);
    medirTopo();
}

// O aviso e a coluna da direita ficam presos logo abaixo do cabeçalho, que
// no computador também é preso e muda de altura com a largura da tela (a
// navegação quebra em mais linhas). No celular ele rola junto com a página
// (ver admin-instituicoes.css). Igual ao painel Notícias.
function medirTopo() {
    const topo = document.querySelector('.topo-admin');
    const preso = topo && getComputedStyle(topo).position === 'sticky';
    document.documentElement.style.setProperty('--topo-admin', `${preso ? topo.offsetHeight : 0}px`);
}

// ========================================================
// Login
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
    medirTopo();

    if (estado.iniciado) return;
    estado.iniciado = true;
    await carregarLista();
    // o botão Fixar da aba No site aparece quando a lista das fixadas chega
    carregarFixadas();

    // veio do painel Notícias para revisar uma pendente
    const revisar = new URLSearchParams(location.search).get('revisar');
    const alvo = revisar && estado.noticias.find((n) => n.id === revisar);
    if (alvo) abrirEditor(alvo);
}

ligarEventos();
observarAdmin(aoMudarLogin);
