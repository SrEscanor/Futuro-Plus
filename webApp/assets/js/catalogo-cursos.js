import { db } from './firebase-config.js';
import { collection, getDocs } from 'firebase/firestore';
import { escapeHtml, normalizar } from './card-unidade.js';

const CURSOS_COLLECTION = 'cursos';
const CATALOGO_OFICIAL = '/dados/catalogo-cursos.json';

let cursosCache = [];
const filtros = { nivel: '', eixo: '', busca: '' };

async function carregarCursos() {
    const snap = await getDocs(collection(db, CURSOS_COLLECTION));
    if (snap.size) return snap.docs.map((d) => ({ id: d.id, ...d.data() }));

    // Enquanto o catálogo não foi importado no Painel Admin, cai no arquivo
    // oficial (o mesmo usado em curso.html), para a página nunca ficar vazia.
    const resposta = await fetch(CATALOGO_OFICIAL);
    if (!resposta.ok) return [];
    const catalogo = await resposta.json();
    return catalogo.map((c) => ({ id: c.slug, ...c }));
}

function nivelDoCurso(curso) {
    return curso.nivel === 'superior' ? 'superior' : 'tecnico';
}

function rotuloNivel(nivel) {
    return nivel === 'superior' ? 'Superior (Fatec)' : 'Técnico (Etec)';
}

function eixosDisponiveis() {
    const chaves = new Set();
    cursosCache.forEach((c) => (c.eixos || []).forEach((e) => e && chaves.add(e)));
    return [...chaves].sort((a, b) => a.localeCompare(b, 'pt-BR'));
}

function niveisDisponiveis() {
    return [...new Set(cursosCache.map(nivelDoCurso))];
}

function criarChip({ rotulo, ativo, aoClicar }) {
    const botao = document.createElement('button');
    botao.type = 'button';
    botao.className = 'chip-filtro' + (ativo ? ' chip-filtro--ativo' : '');
    botao.setAttribute('aria-pressed', String(ativo));
    botao.textContent = rotulo;
    botao.addEventListener('click', aoClicar);
    return botao;
}

function montarFiltros() {
    const grupoNivel = document.getElementById('chips-nivel');
    const grupoEixo = document.getElementById('chips-eixo');

    const niveis = niveisDisponiveis();
    grupoNivel.innerHTML = '';
    if (niveis.length > 1) {
        [{ valor: '', rotulo: 'Todos' }, ...niveis.map((n) => ({ valor: n, rotulo: rotuloNivel(n) }))]
            .forEach(({ valor, rotulo }) => grupoNivel.appendChild(criarChip({
                rotulo,
                ativo: filtros.nivel === valor,
                aoClicar: () => { filtros.nivel = valor; montarFiltros(); renderizarCursos(); }
            })));
    }

    const eixos = eixosDisponiveis();
    grupoEixo.innerHTML = '';
    [{ valor: '', rotulo: 'Todos os eixos' }, ...eixos.map((e) => ({ valor: e, rotulo: e }))]
        .forEach(({ valor, rotulo }) => grupoEixo.appendChild(criarChip({
            rotulo,
            ativo: filtros.eixo === valor,
            aoClicar: () => { filtros.eixo = valor; montarFiltros(); renderizarCursos(); }
        })));
}

function cursosFiltrados() {
    const busca = normalizar(filtros.busca);
    return cursosCache
        .filter((c) => !filtros.nivel || nivelDoCurso(c) === filtros.nivel)
        .filter((c) => !filtros.eixo || (c.eixos || []).includes(filtros.eixo))
        .filter((c) => !busca
            || normalizar(c.nome).includes(busca)
            || (c.eixos || []).some((e) => normalizar(e).includes(busca)))
        .sort((a, b) => (a.nome || '').localeCompare(b.nome || '', 'pt-BR'));
}

function cardCurso(curso) {
    const nivel = nivelDoCurso(curso);
    return `
    <a class="card-curso-catalogo" href="curso.html?c=${encodeURIComponent(curso.id)}">
        <div class="card-curso-catalogo-faixa-titulo card-curso-catalogo-faixa-titulo--${nivel}">
            <span class="nome-unidade">${escapeHtml(curso.nome)}</span>
            <span class="badge-nivel">${rotuloNivel(nivel)}</span>
        </div>
        <div class="card-curso-catalogo-eixos">
            ${(curso.eixos || []).map((e) => `<span class="tag-curso">${escapeHtml(e)}</span>`).join('')}
        </div>
        ${curso.descricao ? `
        <div class="card-curso-catalogo-descricao">
            <span class="card-curso-catalogo-descricao-rotulo">O que você aprende</span>
            <p>${escapeHtml(curso.descricao)}</p>
        </div>
        <span class="card-curso-catalogo-ler-mais">Ler mais &rarr;</span>` : ''}
    </a>`;
}

function renderizarCursos() {
    const grid = document.getElementById('grid-cursos');
    const contagem = document.getElementById('contagem-resultados');
    const lista = cursosFiltrados();

    contagem.textContent = lista.length === 1 ? '1 curso encontrado' : `${lista.length} cursos encontrados`;

    grid.innerHTML = lista.length
        ? lista.map(cardCurso).join('')
        : '<p class="sem-resultados">Nenhum curso encontrado com esses filtros.</p>';
}

async function iniciar() {
    const grid = document.getElementById('grid-cursos');
    try {
        cursosCache = await carregarCursos();
    } catch (erro) {
        console.error('Erro ao carregar catálogo de cursos:', erro);
        grid.innerHTML = '<p class="sem-resultados">Não foi possível carregar os cursos agora. Tente novamente mais tarde.</p>';
        return;
    }

    montarFiltros();
    renderizarCursos();

    document.getElementById('busca-cursos-catalogo').addEventListener('input', (e) => {
        filtros.busca = e.target.value;
        renderizarCursos();
    });
}

document.addEventListener('DOMContentLoaded', iniciar);
