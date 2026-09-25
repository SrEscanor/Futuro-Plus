import { auth, db } from './firebase-config.js';
import { collection, doc, getDoc, getDocs } from 'firebase/firestore';
import { salvarResultadoNoPerfil, extrairResultadoVocacional } from './resultado-teste.js';
import { escapeHtml, normalizar } from './card-unidade.js';
import {
    PERGUNTAS_SITUACAO,
    AFIRMACOES_INTERESSE,
    ESCALA_INTERESSE,
    PERGUNTAS_ESTILO,
    MAXIMO_CARTAS,
    LOTE_VER_MAIS,
    AREAS_POR_EXPANSAO,
    EIXOS
} from './perguntas-vocacional.js';
import {
    pontuarEixos,
    escolherCartas,
    montarResultado,
    motivoDaRecomendacao,
    ranquearEixos,
    chaveOferta,
    avisarPrecisaConcluirMedio,
    EIXOS_NAS_CARTAS
} from './vocacional-resultado.js';

const CATALOGO_OFICIAL = '/dados/catalogo-cursos.json';
const AFIRMACOES_POR_TELA = 6;

// O teste é longo de propósito; o estado fica aqui e vai para o perfil só
// no fim, quando existe resultado para mostrar.
const respostas = {
    situacao: {},
    interesse: new Array(AFIRMACOES_INTERESSE.length).fill(null),
    estilo: {},
    cartas: {}
};

let catalogo = [];
let unidadesPorCurso = new Map();
let cartas = [];
let etapa = 0;

// Modo edição: pula direto para as cartas, reaproveitando a área e a
// situação já calculadas antes — não faz sentido pedir de novo as 24
// afirmações de interesse só para trocar um "talvez" por um "quero".
let modoEditar = false;
let notasSalvas = null;

// "Ver mais cursos": começa nas 4 áreas mais fortes e 12 cartas, como
// sempre foi. Cada clique busca todos os candidatos disponíveis nas áreas
// já abertas, descarta os que já apareceram e só ACRESCENTA os novos no
// final — nunca reordena as cartas que a pessoa já estava vendo/respondendo.
// Quando as áreas atuais não têm mais nada novo, abre mais áreas.
const SEM_LIMITE_PRATICO = 999;
let areasCartas = EIXOS_NAS_CARTAS;
let semMaisCartas = false;

function notasAtuais() {
    return modoEditar ? notasSalvas : pontuarEixos(respostas.interesse, respostas.estilo);
}

// Cada etapa sabe se está completa e o que desenhar.
function etapas() {
    if (modoEditar) {
        return [
            { bloco: 4, titulo: 'Seus cursos', render: renderCartas, completa: () => cartas.every((c) => respostas.cartas[c.curso.slug]) }
        ];
    }

    const telasInteresse = Math.ceil(AFIRMACOES_INTERESSE.length / AFIRMACOES_POR_TELA);
    const lista = [
        { bloco: 1, titulo: 'Sua situação', render: renderSituacao, completa: () => PERGUNTAS_SITUACAO.every((p) => respostas.situacao[p.id]) }
    ];

    for (let i = 0; i < telasInteresse; i++) {
        const inicio = i * AFIRMACOES_POR_TELA;
        const fim = Math.min(inicio + AFIRMACOES_POR_TELA, AFIRMACOES_INTERESSE.length);
        lista.push({
            bloco: 2,
            titulo: 'O que combina com você',
            render: () => renderInteresse(inicio, fim),
            completa: () => respostas.interesse.slice(inicio, fim).every((n) => n)
        });
    }

    lista.push({
        bloco: 3,
        titulo: 'Seu jeito de trabalhar',
        render: renderEstilo,
        completa: () => PERGUNTAS_ESTILO.every((p) => respostas.estilo[p.id])
    });
    lista.push({
        bloco: 4,
        titulo: 'Os cursos',
        render: renderCartas,
        completa: () => cartas.length > 0 && cartas.every((c) => respostas.cartas[c.curso.slug])
    });
    return lista;
}

// ------------------------------------------------------------------
// Telas
// ------------------------------------------------------------------

function renderSituacao() {
    return `
    <p class="voc-intro">Três perguntas rápidas para não sugerir curso em que você ainda não pode entrar.</p>
    ${PERGUNTAS_SITUACAO.map((p) => `
        <fieldset class="voc-pergunta">
            <legend>${escapeHtml(p.pergunta)}</legend>
            ${p.opcoes.map((o) => `
                <label class="voc-opcao ${respostas.situacao[p.id] === o.valor ? 'voc-opcao--ativa' : ''}">
                    <input type="radio" name="sit-${p.id}" value="${o.valor}"
                        data-tipo="situacao" data-id="${p.id}"
                        ${respostas.situacao[p.id] === o.valor ? 'checked' : ''}>
                    ${escapeHtml(o.texto)}
                </label>`).join('')}
        </fieldset>`).join('')}`;
}

function renderInteresse(inicio, fim) {
    return `
    <p class="voc-intro">O quanto cada frase combina com você?</p>
    ${AFIRMACOES_INTERESSE.slice(inicio, fim).map((a, i) => {
        const indice = inicio + i;
        return `
        <fieldset class="voc-pergunta">
            <legend>${escapeHtml(a.texto)}</legend>
            <div class="voc-escala">
                ${ESCALA_INTERESSE.map((e) => `
                    <label class="voc-nota ${respostas.interesse[indice] === e.valor ? 'voc-nota--ativa' : ''}">
                        <input type="radio" name="int-${indice}" value="${e.valor}"
                            data-tipo="interesse" data-id="${indice}"
                            ${respostas.interesse[indice] === e.valor ? 'checked' : ''}>
                        <span class="voc-nota-numero">${e.valor}</span>
                        <span class="voc-nota-texto">${escapeHtml(e.texto)}</span>
                    </label>`).join('')}
            </div>
        </fieldset>`;
    }).join('')}`;
}

function renderEstilo() {
    return `
    <p class="voc-intro">Não existe resposta certa: é sobre como você gosta de trabalhar.</p>
    ${PERGUNTAS_ESTILO.map((p) => `
        <fieldset class="voc-pergunta">
            <legend>${escapeHtml(p.pergunta)}</legend>
            ${p.opcoes.map((o) => `
                <label class="voc-opcao ${respostas.estilo[p.id] === o.valor ? 'voc-opcao--ativa' : ''}">
                    <input type="radio" name="est-${p.id}" value="${o.valor}"
                        data-tipo="estilo" data-id="${p.id}"
                        ${respostas.estilo[p.id] === o.valor ? 'checked' : ''}>
                    ${escapeHtml(o.texto)}
                </label>`).join('')}
        </fieldset>`).join('')}`;
}

function avisosDoCurso(curso) {
    const avisos = [];
    if (curso.duracao) avisos.push(curso.duracao);
    if (curso.cargaHoraria) avisos.push(`${curso.cargaHoraria} horas`);
    if (curso.provaAptidao) avisos.push('tem prova de aptidão');
    return avisos;
}

// Corta a descrição, mas sem deixar sem saída: com <details> nativo, "ler
// mais" abre o texto completo sem precisar de JS nem sair da carta.
const CORTE_DESCRICAO = 220;
function blocoDescricao(curso) {
    const texto = curso.descricao || '';
    if (!texto) return '';
    if (texto.length <= CORTE_DESCRICAO) {
        return `<p class="voc-carta-descricao">${escapeHtml(texto)}</p>`;
    }
    const resumo = texto.slice(0, CORTE_DESCRICAO).trim();
    return `
        <details class="voc-carta-descricao">
            <summary>
                <span class="voc-carta-resumo">${escapeHtml(resumo)}…</span>
                <span class="voc-carta-ler-mais">ler mais</span>
                <span class="voc-carta-ler-menos">ler menos</span>
            </summary>
            <p>${escapeHtml(texto)}</p>
        </details>`;
}

function renderCartas() {
    if (!cartas.length) {
        return '<p class="voc-intro">Não encontrei cursos para a sua situação. Tente rever o primeiro bloco.</p>';
    }

    return `
    <p class="voc-intro">${modoEditar
        ? `Reveja o que você respondeu e troque à vontade. São ${cartas.length} cursos das áreas que mais combinaram com você.`
        : `Agora o mais importante: leia o que se aprende em cada curso e diga o que acha. São ${cartas.length} cursos das áreas que mais combinaram com você.`}</p>
    ${cartas.map(({ curso, eixo }) => {
        const nivel = curso.nivel === 'superior' ? 'superior' : 'tecnico';
        const resposta = respostas.cartas[curso.slug];
        return `
        <article class="voc-carta voc-carta--${nivel} ${resposta === 'nao' ? 'voc-carta--resp-nao' : ''}" data-slug="${escapeHtml(curso.slug)}">
            <header>
                <div class="voc-carta-badges">
                    <span class="voc-carta-nivel voc-carta-nivel--${nivel}">${nivel === 'superior' ? 'Superior' : 'Técnico'}</span>
                    <span class="voc-carta-eixo">${escapeHtml(eixo)}</span>
                </div>
                <h3>${escapeHtml(curso.nome)}</h3>
            </header>
            ${blocoDescricao(curso)}
            ${curso.ondeTrabalhar ? `<p class="voc-carta-onde"><strong>Onde se trabalha:</strong> ${escapeHtml(curso.ondeTrabalhar.slice(0, 160))}</p>` : ''}
            ${avisarPrecisaConcluirMedio(curso, respostas.situacao) ? '<p class="voc-carta-aviso-medio">⚠️ Curso superior (Fatec): a matrícula só acontece depois que você concluir o ensino médio.</p>' : ''}
            ${avisosDoCurso(curso).length ? `<p class="voc-carta-ficha">${avisosDoCurso(curso).map((a) => `<span>${escapeHtml(a)}</span>`).join('')}</p>` : ''}
            <div class="voc-carta-botoes">
                ${[['quero', 'Quero esse'], ['talvez', 'Talvez'], ['nao', 'Não é pra mim']].map(([valor, texto]) => `
                    <label class="voc-resposta voc-resposta--${valor} ${resposta === valor ? 'voc-resposta--ativa' : ''}">
                        <input type="radio" name="carta-${escapeHtml(curso.slug)}" value="${valor}"
                            data-tipo="carta" data-id="${escapeHtml(curso.slug)}"
                            ${resposta === valor ? 'checked' : ''}>
                        ${texto}
                    </label>`).join('')}
            </div>
        </article>`;
    }).join('')}
    ${semMaisCartas
        ? '<p class="voc-fim-cartas">Não tem mais nenhum curso pra sua situação além desses.</p>'
        : `<button type="button" id="voc-ver-mais" class="btn-voc btn-voc--secundario voc-ver-mais">Ver mais cursos</button>`}`;
}

// ------------------------------------------------------------------
// Navegação
// ------------------------------------------------------------------

function desenhar() {
    const lista = etapas();
    const atual = lista[etapa];

    document.getElementById('voc-titulo-bloco').textContent = atual.titulo;
    document.getElementById('voc-progresso-texto').textContent =
        `Parte ${etapa + 1} de ${lista.length} · bloco ${atual.bloco} de 4`;
    document.getElementById('voc-progresso-fill').style.width = `${((etapa + 1) / lista.length) * 100}%`;
    document.getElementById('voc-conteudo').innerHTML = atual.render();

    document.getElementById('voc-voltar').style.visibility = etapa === 0 ? 'hidden' : 'visible';
    const avancar = document.getElementById('voc-avancar');
    avancar.textContent = etapa === lista.length - 1 ? 'Ver meu resultado' : 'Continuar';
    avancar.disabled = false;
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function registrarResposta(input) {
    const { tipo, id } = input.dataset;
    if (tipo === 'situacao') respostas.situacao[id] = input.value;
    if (tipo === 'estilo') respostas.estilo[id] = input.value;
    if (tipo === 'interesse') respostas.interesse[Number(id)] = Number(input.value);
    if (tipo === 'carta') respostas.cartas[id] = input.value;

    // marca visualmente a opção escolhida sem redesenhar a tela inteira
    const grupo = document.getElementsByName(input.name);
    [...grupo].forEach((outro) => {
        const alvo = outro.closest('.voc-opcao, .voc-nota, .voc-resposta');
        alvo?.classList.toggle('voc-opcao--ativa', outro === input && alvo.classList.contains('voc-opcao'));
        alvo?.classList.toggle('voc-nota--ativa', outro === input && alvo.classList.contains('voc-nota'));
        alvo?.classList.toggle('voc-resposta--ativa', outro === input && alvo.classList.contains('voc-resposta'));
    });
    if (tipo === 'carta') {
        input.closest('.voc-carta')?.classList.toggle('voc-carta--resp-nao', input.value === 'nao');
    }
}

async function avancar() {
    const lista = etapas();
    const atual = lista[etapa];

    if (!atual.completa()) {
        const aviso = document.getElementById('voc-aviso');
        aviso.textContent = atual.bloco === 4
            ? 'Responda todos os cursos para ver o resultado.'
            : 'Responda todas as perguntas desta tela para continuar.';
        aviso.hidden = false;

        if (atual.bloco === 4) irParaCartaSemResposta();
        return;
    }
    document.getElementById('voc-aviso').hidden = true;

    // ao sair do bloco 3, as cartas passam a existir
    if (atual.bloco === 3) prepararCartas();

    if (etapa === lista.length - 1) {
        await mostrarResultado();
        return;
    }
    etapa += 1;
    desenhar();
}

// Rola até a primeira carta sem resposta e pisca a borda dela, pra não
// precisar caçar qual das 12 ficou faltando.
function irParaCartaSemResposta() {
    const semResposta = cartas.find((c) => !respostas.cartas[c.curso.slug]);
    if (!semResposta) return;

    const elemento = document.querySelector(`.voc-carta[data-slug="${CSS.escape(semResposta.curso.slug)}"]`);
    if (!elemento) return;

    elemento.scrollIntoView({ behavior: 'smooth', block: 'center' });
    elemento.classList.add('voc-carta--destacada');
    setTimeout(() => elemento.classList.remove('voc-carta--destacada'), 2200);
}

function prepararCartas() {
    areasCartas = EIXOS_NAS_CARTAS;
    semMaisCartas = false;
    cartas = escolherCartas(catalogo, notasAtuais(), respostas.situacao, { unidadesPorCurso, normalizar, limite: MAXIMO_CARTAS, numAreas: areasCartas });
    respostas.cartas = {};
}

// Chamada pelo botão "Ver mais cursos". Busca todo mundo que cabe nas
// áreas já abertas, descarta quem já está na tela e acrescenta só os
// novos no final — as cartas existentes nunca mudam de lugar. Se não
// sobrar ninguém novo, abre mais áreas antes de desistir de vez.
function verMaisCartas() {
    const jaMostrados = new Set(cartas.map((c) => c.curso.slug));

    const buscarNovos = () => escolherCartas(
        catalogo, notasAtuais(), respostas.situacao,
        { unidadesPorCurso, normalizar, limite: SEM_LIMITE_PRATICO, numAreas: areasCartas }
    ).filter((item) => !jaMostrados.has(item.curso.slug));

    let disponiveis = buscarNovos();
    if (!disponiveis.length && areasCartas < EIXOS.length) {
        areasCartas = Math.min(EIXOS.length, areasCartas + AREAS_POR_EXPANSAO);
        disponiveis = buscarNovos();
    }

    const acrescentar = disponiveis.slice(0, LOTE_VER_MAIS);
    cartas = [...cartas, ...acrescentar];
    semMaisCartas = acrescentar.length === 0;
    // atualiza só o conteúdo (sem usar desenhar(), que rolaria pro topo)
    document.getElementById('voc-conteudo').innerHTML = renderCartas();

    if (acrescentar.length) {
        const primeiraNova = document.querySelector(`.voc-carta[data-slug="${CSS.escape(acrescentar[0].curso.slug)}"]`);
        primeiraNova?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// ------------------------------------------------------------------
// Resultado
// ------------------------------------------------------------------

async function mostrarResultado() {
    // No modo edição não refizemos o bloco de interesse/estilo, então a nota
    // de cada área continua sendo a que já foi salva da primeira vez.
    const notas = notasAtuais();
    const resultado = montarResultado(cartas, respostas.cartas, notas);

    document.getElementById('voc-teste').hidden = true;
    const container = document.getElementById('voc-resultado');
    container.hidden = false;

    container.innerHTML = `
        <h2>Seu resultado</h2>
        <p class="voc-intro">Suas áreas mais fortes: <strong>${resultado.eixosFortes.map(escapeHtml).join(' · ')}</strong>.</p>

        <ol class="voc-lista-resultado">
            ${resultado.combinam.map(({ curso, eixo, resposta }) => `
                <li>
                    <a href="curso.html?c=${encodeURIComponent(curso.slug)}">
                        <span class="voc-resultado-nome">${escapeHtml(curso.nome)}</span>
                        <span class="voc-resultado-motivo">${escapeHtml(motivoDaRecomendacao({ eixo, resposta }, resultado.eixosFortes))}</span>
                        ${avisarPrecisaConcluirMedio(curso, respostas.situacao) ? '<span class="voc-resultado-aviso">⚠️ Fatec: matrícula só depois de concluir o ensino médio</span>' : ''}
                        <span class="voc-resultado-link">ver o curso e onde estudar →</span>
                    </a>
                </li>`).join('')}
        </ol>

        ${resultado.descartados.length ? `
            <p class="voc-descartados">Você descartou: ${resultado.descartados.map((d) => escapeHtml(d.curso.nome)).join(', ')}.
            Saber o que não quer também é resultado.</p>` : ''}

        <p class="voc-observacao">As especializações técnicas não entram aqui porque exigem um curso técnico já
        concluído. Quando você terminar o seu, elas passam a fazer sentido.</p>

        <div class="voc-acoes-resultado">
            <a class="btn-voc" href="cursos.html">Ver todos os cursos</a>
            <a class="btn-voc btn-voc--secundario" href="index.html">Voltar ao início</a>
        </div>
        <p id="voc-status-salvo" class="voc-observacao"></p>

        <p class="voc-creditos">Como este resultado foi montado: as perguntas, as áreas e a forma de pontuar foram criadas pela equipe do Futuro+ junto com a inteligência artificial Claude, da Anthropic, e revisadas uma a uma por pessoas — a IA ajuda na amplitude, a revisão humana garante que faz sentido para quem vai escolher um curso. As descrições dos cursos são do catálogo oficial do Centro Paula Souza.</p>`;

    window.scrollTo({ top: 0, behavior: 'smooth' });

    const usuario = auth.currentUser;
    if (!usuario) return;

    try {
        await salvarResultadoNoPerfil(usuario.uid, 'vocacional', {
            versao: 1,
            situacao: respostas.situacao,
            eixos: notas,
            eixosFortes: resultado.eixosFortes,
            cursos: resultado.combinam.map(({ curso, eixo, resposta }) => ({ slug: curso.slug, nome: curso.nome, eixo, resposta })),
            descartados: resultado.descartados.map((d) => d.curso.slug),
            // o mapa cru de todas as cartas respondidas (não só o top 5 do
            // "combinam"), pra dar pra reabrir e editar exatamente do jeito
            // que ficou, sem perder nada por causa do corte do ranking.
            respostasCartas: respostas.cartas,
            concluidoEm: new Date().toISOString()
        });
        document.getElementById('voc-status-salvo').textContent = 'Resultado salvo no seu perfil.';
    } catch (erro) {
        console.error('Erro ao salvar o resultado do teste vocacional:', erro);
        document.getElementById('voc-status-salvo').textContent =
            'Não consegui salvar no seu perfil agora, mas o resultado acima está valendo.';
    }
}

// ------------------------------------------------------------------
// Início
// ------------------------------------------------------------------

async function carregarDados() {
    const [resposta, unidadesSnap] = await Promise.all([
        fetch(CATALOGO_OFICIAL),
        getDocs(collection(db, 'instituicoes'))
    ]);

    const oficial = await resposta.json();
    const porSlug = new Map(oficial.map((c) => [c.slug, c]));

    // o que o painel já editou vale mais que o arquivo
    const cursosSnap = await getDocs(collection(db, 'cursos')).catch(() => null);
    cursosSnap?.docs.forEach((d) => porSlug.set(d.id, { slug: d.id, ...porSlug.get(d.id), ...d.data() }));
    catalogo = [...porSlug.values()];

    unidadesPorCurso = new Map();
    unidadesSnap.docs.forEach((d) => {
        const dados = d.data();
        // Etec é o único tipo técnico hoje; qualquer outro tipo (Fatec, ou um
        // tipo novo cadastrado nas unidades) conta como oferta de nível superior.
        const tipo = (dados.tipo || '').trim().toLowerCase();
        const nivel = tipo && tipo !== 'etec' ? 'superior' : 'tecnico';
        (dados.cursos || []).forEach((c) => {
            if (!c?.nome) return;
            const chave = chaveOferta(c.nome, nivel, normalizar);
            unidadesPorCurso.set(chave, (unidadesPorCurso.get(chave) || 0) + 1);
        });
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    await auth.authStateReady();
    if (!auth.currentUser) {
        // o teste é longo e o resultado fica salvo no perfil: sem login não há onde guardar
        document.getElementById('voc-precisa-login').hidden = false;
        document.getElementById('voc-teste').hidden = true;
        return;
    }

    try {
        await carregarDados();
    } catch (erro) {
        console.error('Erro ao carregar o catálogo de cursos:', erro);
        document.getElementById('voc-conteudo').innerHTML =
            '<p class="voc-intro">Não consegui carregar os cursos agora. Tente novamente mais tarde.</p>';
        return;
    }

    if (new URLSearchParams(location.search).get('editar')) {
        try {
            const snap = await getDoc(doc(db, 'usuarios', auth.currentUser.uid));
            const salvo = extrairResultadoVocacional(snap.exists() ? snap.data() : null);
            if (salvo?.situacao && salvo?.eixos) {
                modoEditar = true;
                notasSalvas = salvo.eixos;
                respostas.situacao = { ...salvo.situacao };
                cartas = escolherCartas(catalogo, notasSalvas, respostas.situacao, { unidadesPorCurso, normalizar, limite: MAXIMO_CARTAS, numAreas: areasCartas });
                // resultado salvo antes dessa funcionalidade existir não tem o
                // mapa completo — reconstrói o que dá do "combinam" (top 5) e
                // dos descartados; o resto das cartas some sem resposta, e é
                // só responder de novo essas (bem menos que o teste inteiro).
                respostas.cartas = salvo.respostasCartas
                    ? { ...salvo.respostasCartas }
                    : Object.fromEntries([
                        ...(salvo.cursos || []).map((c) => [c.slug, c.resposta]),
                        ...(salvo.descartados || []).map((slug) => [slug, 'nao'])
                    ]);
            }
        } catch (erro) {
            console.error('Erro ao carregar o resultado salvo para editar:', erro);
            // segue no teste normal — editar é um atalho, não uma etapa obrigatória
        }
    }

    desenhar();

    document.getElementById('voc-conteudo').addEventListener('change', (e) => {
        if (e.target.matches('input[type="radio"]')) registrarResposta(e.target);
    });
    document.getElementById('voc-conteudo').addEventListener('click', (e) => {
        if (e.target.closest('#voc-ver-mais')) verMaisCartas();
    });
    document.getElementById('voc-avancar').addEventListener('click', avancar);
    document.getElementById('voc-voltar').addEventListener('click', () => {
        if (etapa === 0) return;
        etapa -= 1;
        document.getElementById('voc-aviso').hidden = true;
        desenhar();
    });
});

// exportados para poderem ser exercitados fora da tela (testes)
export { respostas, prepararCartas, etapas, carregarDados, mostrarResultado };
