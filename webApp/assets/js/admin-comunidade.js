// Painel Admin · Comunidade: o que acontece nos comentários (com nota) e nas
// dúvidas das páginas das instituições.
//
//   Novidades  avaliações e dúvidas novas (as que chegaram depois do último
//              "Marcar tudo como visto" ficam em destaque), com atalho para
//              responder na página da instituição.
//   Histórico  tudo, inclusive o que foi apagado (com o texto guardado) e
//              quem apagou, com busca e filtros (Quando, Quem, O que fez e
//              Instituição). Abre direto com admin-comunidade.html#historico.
//
// Quem grava é o servidor (functions/comunidade.py). Os dados chegam só por
// comunidade-dados.js (o roteiro de teste troca esse arquivo por uma cópia
// de mentira).
import { listarAvisos, listarHistoricoPagina, marcarAvisosVistos, observarAdmin, sairDaConta } from './comunidade-dados.js';
import {
    ACOES_COMUNIDADE, APAGADOS, avisoNovo, chaveDoConteudo, chavesApagadas, corDaAcao, detalheDaAcao, diaDoAviso,
    linkDaUnidade, preposicaoNa, preposicaoSobre, situacaoDaDuvida, textoDaAcao, textoDeBusca
} from './comunidade-util.js';
import { historicoComFiltros, unicos } from './historico-filtros.js';
import { dataHora, haQuantoTempo } from './noticias-proprias-util.js';

const el = (id) => document.getElementById(id);

const estado = {
    iniciado: false,
    vistosEm: '',
    avisos: [],
    cursorAvisos: null,
    haMaisAvisos: false,
    carregandoAvisos: false,
    erroAvisos: false,
    mostrar: 'tudo',
    historico: null
};

function escapeHtml(texto) {
    return String(texto ?? '').replace(/[&<>"']/g, (c) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
}

function estrelas(nota, rotulo = true) {
    const cheias = Math.max(0, Math.min(5, Number(nota) || 0));
    if (!cheias) return '';
    const aria = rotulo ? ` role="img" aria-label="nota ${cheias} de 5"` : ' aria-hidden="true"';
    return `<span class="com-estrelas"${aria}>${'★'.repeat(cheias)}<i>${'★'.repeat(5 - cheias)}</i></span>`;
}

function trecho(texto, limite) {
    const limpo = String(texto || '').replace(/\s+/g, ' ').trim();
    return limpo.length <= limite ? limpo : `${limpo.slice(0, limite - 1).trimEnd()}…`;
}

const linkExterno = (href, texto, classe = '') => `<a${classe ? ` class="${classe}"` : ''} href="${escapeHtml(href)}" target="_blank" rel="noopener">${texto}</a>`;

// ========================================================
// Novidades
// ========================================================

function cartaoDoAviso(aviso) {
    const avaliacao = aviso.tipo === 'avaliacao';
    const nova = avisoNovo(aviso, estado.vistosEm);
    const unidade = escapeHtml(aviso.unidadeNome || 'a instituição');
    const pagina = aviso.link || linkDaUnidade(aviso.unidadeId, avaliacao ? 'quem-estudou' : 'duvidas');
    const nome = `<strong>${escapeHtml(aviso.nome || 'Alguém')}</strong>`;
    const linkDaPagina = linkExterno(pagina, unidade);

    let titulo;
    let extra;
    let acoes = linkExterno(pagina, 'Ver na página', 'btn btn-secundario');
    if (avaliacao) {
        const curso = aviso.curso ? ` <strong>${escapeHtml(aviso.curso)}</strong>${aviso.ano ? ` (${escapeHtml(aviso.ano)})` : ''}` : '';
        titulo = `${nome} avaliou${curso} ${preposicaoNa(aviso.unidadeNome)} ${linkDaPagina}`;
        extra = estrelas(aviso.nota)
            + (aviso.apagada ? '<span class="com-situacao com-situacao--apagada">Apagada</span>' : '')
            + (aviso.editada && !aviso.apagada ? '<span class="com-editada">editada</span>' : '');
    } else {
        const [situacao, classe] = situacaoDaDuvida(aviso);
        titulo = `${nome} perguntou ${preposicaoSobre(aviso.unidadeNome)} ${linkDaPagina}`;
        extra = `<span class="com-situacao com-situacao--${classe}">${situacao}</span>`;
        if (classe === 'sem') acoes = linkExterno(pagina, 'Responder', 'btn btn-primario') + acoes;
    }

    return `
        <li class="com-novidade${nova ? ' com-novidade--nova' : ''}${aviso.apagada ? ' com-novidade--apagada' : ''}">
            <span class="com-novidade-icone com-novidade-icone--${avaliacao ? 'avaliacao' : 'duvida'}" aria-hidden="true">${avaliacao ? '★' : '?'}</span>
            <div class="com-novidade-corpo">
                <div class="com-novidade-topo">
                    <span class="com-tipo com-tipo--${avaliacao ? 'avaliacao' : 'duvida'}">${avaliacao ? 'Avaliação' : 'Dúvida'}</span>
                    ${extra}
                    ${nova ? '<span class="com-nova">Nova</span>' : ''}
                    <time datetime="${escapeHtml(aviso.em || '')}" title="${escapeHtml(dataHora(aviso.em))}">${escapeHtml(haQuantoTempo(aviso.em))}</time>
                </div>
                <p class="com-novidade-titulo">${titulo}</p>
                ${aviso.texto ? `<p class="com-texto">${escapeHtml(aviso.texto)}</p>` : ''}
            </div>
            <div class="com-novidade-acoes">${acoes}</div>
        </li>`;
}

const semResposta = (aviso) => aviso.tipo === 'duvida' && !aviso.apagada && !Number(aviso.respostas);

function avisosVisiveis() {
    if (estado.mostrar === 'avaliacoes') return estado.avisos.filter((a) => a.tipo === 'avaliacao');
    if (estado.mostrar === 'sem-resposta') return estado.avisos.filter(semResposta);
    return estado.avisos;
}

function desenharContadores() {
    const novas = estado.avisos.filter((a) => avisoNovo(a, estado.vistosEm)).length;
    const texto = novas && novas === estado.avisos.length && estado.haMaisAvisos ? `${novas}+` : String(novas);
    const contador = el('com-aba-contador');
    contador.textContent = texto;
    contador.hidden = novas === 0;
    el('com-marcar-vistos').disabled = novas === 0;
    const pendentes = estado.avisos.filter(semResposta).length;
    el('com-sem-resposta').textContent = pendentes ? `(${pendentes})` : '';
}

function desenharNovidades() {
    const lista = el('com-novidades');
    desenharContadores();
    el('com-novidades-mais').hidden = !estado.haMaisAvisos || estado.erroAvisos;
    el('com-novidades-mais').disabled = estado.carregandoAvisos;

    if (estado.carregandoAvisos && !estado.avisos.length) {
        lista.innerHTML = '<p class="com-vazio">Carregando novidades...</p>';
        return;
    }
    if (estado.erroAvisos && !estado.avisos.length) {
        lista.innerHTML = '<p class="com-vazio">Não foi possível carregar as novidades agora.</p>';
        return;
    }
    const avisos = avisosVisiveis();
    if (!avisos.length) {
        const vazio = {
            tudo: 'Nenhuma avaliação ou dúvida ainda. Elas aparecem aqui assim que alguém escrever na página de uma instituição.',
            avaliacoes: 'Nenhuma avaliação entre as novidades carregadas.',
            'sem-resposta': 'Nenhuma dúvida esperando resposta. 🎉'
        };
        lista.innerHTML = `<p class="com-vazio">${vazio[estado.mostrar]}</p>`;
        return;
    }

    // separadas por dia: Hoje, Ontem, 16 de novembro...
    const grupos = [];
    for (const aviso of avisos) {
        const dia = diaDoAviso(aviso.em);
        if (grupos.at(-1)?.dia !== dia) grupos.push({ dia, avisos: [] });
        grupos.at(-1).avisos.push(aviso);
    }
    lista.innerHTML = grupos.map((g) => `
        <h3 class="com-dia">${escapeHtml(g.dia)}</h3>
        <ul class="com-novidades">${g.avisos.map(cartaoDoAviso).join('')}</ul>`).join('');
}

async function carregarAvisos({ doZero = false } = {}) {
    if (estado.carregandoAvisos) return;
    if (doZero) {
        estado.avisos = [];
        estado.cursorAvisos = null;
    }
    estado.carregandoAvisos = true;
    estado.erroAvisos = false;
    desenharNovidades();
    try {
        const pagina = await listarAvisos({ depois: estado.cursorAvisos });
        estado.avisos.push(...pagina.registros);
        estado.cursorAvisos = pagina.cursor;
        estado.haMaisAvisos = Boolean(pagina.haMais);
    } catch (erro) {
        console.error('Erro ao carregar as novidades da comunidade:', erro);
        estado.erroAvisos = true;
    } finally {
        estado.carregandoAvisos = false;
        desenharNovidades();
    }
}

async function marcarTudoComoVisto() {
    const botao = el('com-marcar-vistos');
    botao.disabled = true;
    try {
        estado.vistosEm = await marcarAvisosVistos();
        document.querySelectorAll('.admin-nav-contador').forEach((c) => { c.hidden = true; });
    } catch (erro) {
        console.error('Erro ao marcar as novidades como vistas:', erro);
        alert('Não consegui marcar como visto agora. Tente de novo.');
    }
    desenharNovidades();
}

// ========================================================
// Histórico
// ========================================================

function quemFez(registro) {
    if (registro.sistema) return '<span class="com-nome">Sistema</span> <small>Console do Firebase ou servidor</small>';
    if (registro.admin) {
        return `${escapeHtml(registro.email || registro.nome || '—')} <span class="com-papel">admin</span>`;
    }
    return `<span class="com-nome">${escapeHtml(registro.nome || 'Conta sem nome')}</span>`;
}

function conteudo(registro, apagadoDepois) {
    const unidade = linkExterno(linkDaUnidade(registro.unidadeId, registro.tipo === 'comentario' ? 'quem-estudou' : 'duvidas'),
        escapeHtml(registro.unidadeNome || 'Instituição'), 'com-unidade');
    const tag = apagadoDepois ? '<span class="com-apagado-depois">apagado depois</span>' : '';
    const meta = (partes) => {
        const texto = partes.filter(Boolean).join(' · ');
        return texto ? `<span class="com-meta">${texto}</span>` : '';
    };
    const cursoEAno = [escapeHtml(registro.curso), registro.ano ? escapeHtml(registro.ano) : ''];
    const naDuvida = registro.perguntaTexto
        ? `na dúvida de ${escapeHtml(registro.perguntaAutorNome || 'alguém')}: “${escapeHtml(trecho(registro.perguntaTexto, 140))}”`
        : '';
    const citacao = (texto) => (texto ? `<p class="com-citacao">“${escapeHtml(trecho(texto, 260))}”</p>` : '');
    const apagado = (rotulo, partes) => `
        <div class="com-apagado">
            <span class="com-apagado-rotulo">${rotulo}</span>
            ${registro.texto ? `<p>“${escapeHtml(registro.texto)}”</p>` : ''}
            ${meta(partes)}
        </div>`;
    const escrito = (palavra) => (registro.escritoEm ? `${palavra} em ${escapeHtml(dataHora(registro.escritoEm))}` : '');

    switch (registro.acao) {
        case 'comentou':
            return `${unidade}${tag}${citacao(registro.texto)}${meta(cursoEAno)}`;
        case 'editou_comentario':
            return `${unidade}${citacao(registro.texto)}${meta([
                registro.textoAntes && registro.textoAntes !== registro.texto ? `antes: “${escapeHtml(trecho(registro.textoAntes, 140))}”` : '',
                ...cursoEAno
            ])}`;
        case 'apagou_comentario':
            return unidade + apagado(`Comentário apagado${registro.nota ? ` · nota ${estrelas(registro.nota, false)}` : ''}`,
                [escapeHtml(registro.autorNome), ...cursoEAno, escrito('escrito')]);
        case 'perguntou':
            return `${unidade}${tag}${citacao(registro.texto)}`;
        case 'apagou_duvida': {
            const respostas = registro.respostasApagadas || [];
            const lista = respostas.length ? `
                <details class="com-respostas-apagadas">
                    <summary>Ver ${respostas.length === 1 ? 'a resposta apagada' : `as ${respostas.length} respostas apagadas`}</summary>
                    <ul>${respostas.map((r) => `
                        <li><strong>${escapeHtml(r.equipe ? `${r.autorNome || 'Equipe'} (Equipe Futuro+)` : r.autorNome || 'Alguém')}</strong>
                            “${escapeHtml(r.texto || '')}”
                            ${r.escritoEm ? `<small>${escapeHtml(dataHora(r.escritoEm))}</small>` : ''}</li>`).join('')}</ul>
                </details>` : '';
            return unidade + apagado('Dúvida apagada', [escapeHtml(registro.autorNome), escrito('perguntou')]) + lista;
        }
        case 'respondeu':
            return `${unidade}${tag}${citacao(registro.texto)}${meta([naDuvida])}`;
        case 'editou_resposta':
            return `${unidade}${citacao(registro.texto)}${meta([
                registro.textoAntes ? `antes: “${escapeHtml(trecho(registro.textoAntes, 140))}”` : '', naDuvida
            ])}`;
        case 'apagou_resposta':
            return unidade + apagado('Resposta apagada', [escapeHtml(registro.autorNome), naDuvida, escrito('escrita')]);
        default:
            return `${unidade}${citacao(registro.texto)}`;
    }
}

function linhaDoHistorico(registro, apagados) {
    const detalhe = detalheDaAcao(registro);
    const comNota = registro.acao === 'comentou' ? ` ${estrelas(registro.nota)}` : '';
    const apagadoDepois = !APAGADOS.includes(registro.acao) && apagados.has(chaveDoConteudo(registro));
    return `
        <tr>
            <td class="historico-quando"><strong>${escapeHtml(dataHora(registro.em))}</strong><small>${escapeHtml(haQuantoTempo(registro.em))}</small></td>
            <td class="historico-quem">${quemFez(registro)}</td>
            <td><span class="historico-acao historico-acao--${corDaAcao(registro)}">${escapeHtml(textoDaAcao(registro))}</span>${comNota}${detalhe
                ? ` <small class="historico-detalhe">${escapeHtml(detalhe)}</small>` : ''}</td>
            <td class="com-conteudo">${conteudo(registro, apagadoDepois)}</td>
        </tr>`;
}

function desenharHistorico(registros, { filtrando, carregando, erro }) {
    const vazio = (texto) => `<tr><td colspan="4" class="tabela-vazia">${texto}</td></tr>`;
    const apagados = chavesApagadas(estado.historico ? estado.historico.registros : registros);
    let html;
    if (carregando) html = vazio('Carregando histórico...');
    else if (erro) html = vazio('Não foi possível carregar o histórico agora.');
    else if (registros.length) html = registros.map((r) => linhaDoHistorico(r, apagados)).join('');
    else html = vazio(filtrando ? 'Nenhum registro com esses filtros.'
        : 'Nada registrado ainda. O histórico começa no próximo comentário, nota ou dúvida das instituições.');
    el('historico-corpo').innerHTML = html;
}

const maiuscula = (texto) => texto.charAt(0).toUpperCase() + texto.slice(1);

const CAMPOS = [
    {
        chave: 'quem',
        rotulo: 'Quem',
        todos: 'Todo mundo',
        opcoes: (registros) => [
            ['equipe', 'Só a equipe (admins)'],
            ...unicos(registros.filter((r) => r.admin).map((r) => r.email)).sort((a, b) => a.localeCompare(b)).map((e) => [e, e])
        ],
        testar: (registro, valor) => (valor === 'equipe' ? registro.admin === true : registro.email === valor)
    },
    {
        chave: 'acao',
        rotulo: 'O que fez',
        todos: 'Tudo',
        opcoes: () => [
            ['apagados', 'Tudo o que foi apagado'],
            ...Object.entries(ACOES_COMUNIDADE).map(([chave, [texto]]) => [chave, maiuscula(texto)])
        ],
        testar: (registro, valor) => (valor === 'apagados' ? APAGADOS.includes(registro.acao) : registro.acao === valor)
    },
    {
        chave: 'unidade',
        rotulo: 'Instituição',
        todos: 'Todas',
        opcoes: (registros) => {
            const nomes = new Map(registros.map((r) => [r.unidadeId, r.unidadeNome || r.unidadeId]));
            return [...nomes].filter(([id]) => id).sort((a, b) => a[1].localeCompare(b[1]));
        },
        testar: (registro, valor) => registro.unidadeId === valor
    }
];

function carregarHistorico() {
    estado.historico ||= historicoComFiltros({
        barra: el('historico-filtros'),
        botaoMais: el('historico-mais'),
        buscarPagina: (cursor) => listarHistoricoPagina({ depois: cursor }),
        desenhar: desenharHistorico,
        busca: { dica: 'Nome, instituição, curso ou texto…', texto: textoDeBusca },
        campos: CAMPOS
    });
    estado.historico.recarregar();
}

// ========================================================
// Abas
// ========================================================

function abrirAba(aba, { focar = false } = {}) {
    const abas = ['novidades', 'historico'];
    if (!abas.includes(aba)) return;
    for (const nome of abas) {
        const botao = el(`aba-${nome}`);
        const ativa = nome === aba;
        botao.classList.toggle('aba-admin--ativa', ativa);
        botao.setAttribute('aria-selected', String(ativa));
        botao.tabIndex = ativa ? 0 : -1;
        el(`painel-${nome}`).hidden = !ativa;
        if (ativa && focar) botao.focus();
    }
    history.replaceState(null, '', aba === 'historico' ? '#historico' : location.pathname + location.search);
    if (aba === 'historico') carregarHistorico();
    else carregarAvisos({ doZero: true });
}

// ========================================================
// Inicialização
// ========================================================

function aoMudarLogin({ usuario, ehAdmin, vistosEm }) {
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

    if (estado.iniciado) return;
    estado.iniciado = true;
    estado.vistosEm = vistosEm || '';
    abrirAba(location.hash === '#historico' ? 'historico' : 'novidades');
}

function ligarEventos() {
    el('logout-btn').addEventListener('click', async () => {
        await sairDaConta();
        window.location.href = 'login.html';
    });

    document.querySelectorAll('.aba-admin').forEach((botao) => {
        botao.addEventListener('click', () => abrirAba(botao.dataset.aba));
    });
    // setas trocam de aba, como nos outros painéis
    document.querySelector('.abas-admin').addEventListener('keydown', (evento) => {
        if (!['ArrowLeft', 'ArrowRight'].includes(evento.key)) return;
        const atual = el('aba-novidades').getAttribute('aria-selected') === 'true' ? 'novidades' : 'historico';
        abrirAba(atual === 'novidades' ? 'historico' : 'novidades', { focar: true });
    });

    document.querySelectorAll('.com-chip').forEach((chip) => {
        chip.addEventListener('click', () => {
            estado.mostrar = chip.dataset.mostrar;
            document.querySelectorAll('.com-chip').forEach((outro) => {
                const ativo = outro === chip;
                outro.classList.toggle('com-chip--ativo', ativo);
                outro.setAttribute('aria-pressed', String(ativo));
            });
            desenharNovidades();
        });
    });

    el('com-marcar-vistos').addEventListener('click', marcarTudoComoVisto);
    el('com-novidades-mais').addEventListener('click', () => carregarAvisos());
}

ligarEventos();
observarAdmin(aoMudarLogin);
