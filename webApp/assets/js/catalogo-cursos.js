import { db } from './firebase-config.js';
import { collection, getDocs } from 'firebase/firestore';
import { escapeHtml, normalizar, logoPadraoPorTipo } from './card-unidade.js';

const CURSOS_COLLECTION = 'cursos';
const CATALOGO_OFICIAL = '/dados/catalogo-cursos.json';
const CURSOS_POR_PAGINA = 24;

let cursosCache = [];
const filtros = { nivel: '', eixo: '', busca: '', pagina: 1 };
let eixosExpandidos = false;

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
                aoClicar: () => { filtros.nivel = valor; filtros.pagina = 1; montarFiltros(); renderizarCursos(); }
            })));
    }

    // Com todos os eixos abertos, os chips empurravam os cursos pra fora da
    // primeira tela (no celular eram 7 linhas só de filtro). Mostra os
    // primeiros e recolhe o resto atrás de "Ver mais"; o eixo selecionado
    // continua à vista mesmo recolhido, pra pessoa não perder o que filtrou.
    const eixos = eixosDisponiveis();
    const limite = window.matchMedia('(max-width: 640px)').matches ? 3 : 6;
    const recolhivel = eixos.length > limite;
    const visiveis = !recolhivel || eixosExpandidos
        ? eixos
        : eixos.filter((e, i) => i < limite || e === filtros.eixo);

    grupoEixo.innerHTML = '';
    [{ valor: '', rotulo: 'Todos os eixos' }, ...visiveis.map((e) => ({ valor: e, rotulo: e }))]
        .forEach(({ valor, rotulo }) => grupoEixo.appendChild(criarChip({
            rotulo,
            ativo: filtros.eixo === valor,
            aoClicar: () => { filtros.eixo = valor; filtros.pagina = 1; montarFiltros(); renderizarCursos(); }
        })));

    if (recolhivel) {
        const alternar = document.createElement('button');
        alternar.type = 'button';
        alternar.className = 'chip-filtro chip-filtro--alternar';
        alternar.setAttribute('aria-expanded', String(eixosExpandidos));
        alternar.textContent = eixosExpandidos ? 'Ver menos' : `Ver mais (+${eixos.length - visiveis.length})`;
        alternar.addEventListener('click', () => { eixosExpandidos = !eixosExpandidos; montarFiltros(); });
        grupoEixo.appendChild(alternar);
    }
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
    const logo = logoPadraoPorTipo(nivel === 'superior' ? 'fatec' : 'etec');
    const eixosExtras = (curso.eixos || []).length - 1;
    return `
    <a class="card-curso-catalogo" href="curso.html?c=${encodeURIComponent(curso.id)}">
        <div class="card-curso-catalogo-cabecalho">
            <img class="card-curso-catalogo-logo" src="${logo}" alt="">
            <span class="badge-nivel badge-nivel--${nivel}">${rotuloNivel(nivel)}</span>
        </div>
        <h3 class="card-curso-catalogo-titulo">${escapeHtml(curso.nome)}</h3>
        <div class="card-curso-catalogo-eixos">
            ${(curso.eixos || []).slice(0, 1).map((e) => `<span class="tag-curso">${escapeHtml(e)}</span>`).join('')}
            ${eixosExtras > 0 ? `<span class="tag-curso tag-curso--mais">+${eixosExtras}</span>` : ''}
        </div>
        ${curso.descricao ? `
        <div class="card-curso-catalogo-descricao">
            <span class="card-curso-catalogo-descricao-rotulo">O que você aprende</span>
            <p>${escapeHtml(curso.descricao)}</p>
        </div>` : ''}
        <div class="card-curso-catalogo-rodape">
            <span class="card-curso-catalogo-ler-mais">Ver detalhes &rarr;</span>
        </div>
    </a>`;
}

// Mostra todos os números até caber (poucas páginas), e colapsa em "..."
// só quando o catálogo crescer o bastante pra isso virar necessário —
// com o tamanho de hoje (~150 cursos) nunca passa de 7-8 páginas.
function numerosDaPaginacao(paginaAtual, totalPaginas) {
    if (totalPaginas <= 8) {
        return Array.from({ length: totalPaginas }, (_, i) => i + 1);
    }
    const numeros = new Set([1, totalPaginas, paginaAtual, paginaAtual - 1, paginaAtual + 1]);
    return [...numeros].filter((n) => n >= 1 && n <= totalPaginas).sort((a, b) => a - b);
}

function renderizarPaginacao(paginaAtual, totalPaginas) {
    const containers = [document.getElementById('paginacao-topo'), document.getElementById('paginacao-rodape')];
    if (totalPaginas <= 1) {
        containers.forEach((c) => c && (c.innerHTML = ''));
        return;
    }

    const numeros = numerosDaPaginacao(paginaAtual, totalPaginas);
    let html = '';
    let ultimo = 0;
    numeros.forEach((n) => {
        if (n - ultimo > 1) html += '<span class="pagina-reticencias">…</span>';
        html += `<button type="button" class="pagina-botao${n === paginaAtual ? ' pagina-botao--ativo' : ''}" data-pagina="${n}">${n}</button>`;
        ultimo = n;
    });

    containers.forEach((container) => {
        if (!container) return;
        container.innerHTML = html;
        container.querySelectorAll('[data-pagina]').forEach((botao) => {
            botao.addEventListener('click', () => {
                filtros.pagina = Number(botao.dataset.pagina);
                renderizarCursos();
                document.querySelector('.filtros-cursos')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            });
        });
    });
}

function renderizarCursos() {
    const grid = document.getElementById('grid-cursos');
    const contagem = document.getElementById('contagem-resultados');
    const lista = cursosFiltrados();
    const totalPaginas = Math.max(1, Math.ceil(lista.length / CURSOS_POR_PAGINA));
    filtros.pagina = Math.min(filtros.pagina, totalPaginas);

    contagem.textContent = lista.length === 1 ? '1 curso encontrado' : `${lista.length} cursos encontrados`;

    const inicio = (filtros.pagina - 1) * CURSOS_POR_PAGINA;
    const pagina = lista.slice(inicio, inicio + CURSOS_POR_PAGINA);

    grid.innerHTML = pagina.length
        ? pagina.map(cardCurso).join('')
        : '<p class="sem-resultados">Nenhum curso encontrado com esses filtros.</p>';

    renderizarPaginacao(filtros.pagina, totalPaginas);
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
        filtros.pagina = 1;
        renderizarCursos();
    });
}

document.addEventListener('DOMContentLoaded', iniciar);
