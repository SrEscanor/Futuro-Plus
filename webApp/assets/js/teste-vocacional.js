import { auth, db } from './firebase-config.js';
import { collection, doc, getDoc, getDocs } from 'firebase/firestore';
import { salvarResultadoNoPerfil } from './resultado-teste.js';
import { escapeHtml, normalizar } from './card-unidade.js';
import {
    PERGUNTAS_SITUACAO,
    AFIRMACOES_INTERESSE,
    ESCALA_INTERESSE,
    PERGUNTAS_ESTILO
} from './perguntas-vocacional.js';
import {
    pontuarEixos,
    escolherCartas,
    montarResultado,
    motivoDaRecomendacao,
    ranquearEixos
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

// Cada etapa sabe se está completa e o que desenhar.
function etapas() {
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

function renderCartas() {
    if (!cartas.length) {
        return '<p class="voc-intro">Não encontrei cursos para a sua situação. Tente rever o primeiro bloco.</p>';
    }

    return `
    <p class="voc-intro">Agora o mais importante: leia o que se aprende em cada curso e diga o que acha.
    São ${cartas.length} cursos das áreas que mais combinaram com você.</p>
    ${cartas.map(({ curso, eixo }) => `
        <article class="voc-carta ${respostas.cartas[curso.slug] ? 'voc-carta--respondida' : ''}">
            <header>
                <span class="voc-carta-eixo">${escapeHtml(eixo)}</span>
                <h3>${escapeHtml(curso.nome)}</h3>
            </header>
            <p class="voc-carta-descricao">${escapeHtml((curso.descricao || '').slice(0, 320))}${(curso.descricao || '').length > 320 ? '…' : ''}</p>
            ${curso.ondeTrabalhar ? `<p class="voc-carta-onde"><strong>Onde se trabalha:</strong> ${escapeHtml(curso.ondeTrabalhar.slice(0, 160))}</p>` : ''}
            ${avisosDoCurso(curso).length ? `<p class="voc-carta-ficha">${avisosDoCurso(curso).map((a) => `<span>${escapeHtml(a)}</span>`).join('')}</p>` : ''}
            <div class="voc-carta-botoes">
                ${[['quero', 'Quero esse'], ['talvez', 'Talvez'], ['nao', 'Não é pra mim']].map(([valor, texto]) => `
                    <label class="voc-resposta voc-resposta--${valor} ${respostas.cartas[curso.slug] === valor ? 'voc-resposta--ativa' : ''}">
                        <input type="radio" name="carta-${escapeHtml(curso.slug)}" value="${valor}"
                            data-tipo="carta" data-id="${escapeHtml(curso.slug)}"
                            ${respostas.cartas[curso.slug] === valor ? 'checked' : ''}>
                        ${texto}
                    </label>`).join('')}
            </div>
        </article>`).join('')}`;
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
    input.closest('.voc-carta')?.classList.add('voc-carta--respondida');
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

function prepararCartas() {
    const notas = pontuarEixos(respostas.interesse, respostas.estilo);
    cartas = escolherCartas(catalogo, notas, respostas.situacao, { unidadesPorCurso, normalizar });
    respostas.cartas = {};
}

// ------------------------------------------------------------------
// Resultado
// ------------------------------------------------------------------

async function mostrarResultado() {
    const notas = pontuarEixos(respostas.interesse, respostas.estilo);
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
        getDocs(collection(db, 'etecs'))
    ]);

    const oficial = await resposta.json();
    const porSlug = new Map(oficial.map((c) => [c.slug, c]));

    // o que o painel já editou vale mais que o arquivo
    const cursosSnap = await getDocs(collection(db, 'cursos')).catch(() => null);
    cursosSnap?.docs.forEach((d) => porSlug.set(d.id, { slug: d.id, ...porSlug.get(d.id), ...d.data() }));
    catalogo = [...porSlug.values()];

    unidadesPorCurso = new Map();
    unidadesSnap.docs.forEach((d) => {
        (d.data().cursos || []).forEach((c) => {
            if (!c?.nome) return;
            const chave = normalizar(c.nome);
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

    desenhar();

    document.getElementById('voc-conteudo').addEventListener('change', (e) => {
        if (e.target.matches('input[type="radio"]')) registrarResposta(e.target);
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
