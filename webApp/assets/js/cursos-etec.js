import { db } from './firebase-config.js';
import { collection, getDocs } from 'firebase/firestore';

const LOGO_PADRAO = '/etec-logo-padrao.png';
const LOGO_FALLBACK = '/logo.png';

let unidadesCache = [];

function escapeHtml(str) {
    return String(str ?? '').replace(/[&<>"']/g, (c) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
}

function normalizar(str) {
    return (str || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '');
}

function agruparCursosPorCategoria(cursos) {
    const mapa = new Map();
    (cursos || []).forEach((c) => {
        if (!c || !c.nome) return;
        const categoria = c.categoria || 'Outros cursos';
        if (!mapa.has(categoria)) mapa.set(categoria, []);
        mapa.get(categoria).push(c.nome);
    });
    return mapa;
}

function renderizarCard(unidade) {
    const logo = unidade.logotipoUrl ? escapeHtml(unidade.logotipoUrl) : LOGO_PADRAO;
    const local = [unidade.municipio, unidade.regiao].filter(Boolean).join(' · ');
    const grupos = agruparCursosPorCategoria(unidade.cursos);

    const blocosCategorias = [...grupos.entries()].map(([categoria, nomes]) => `
        <div class="grupo-categoria">
            <div class="categoria-label">${escapeHtml(categoria)}</div>
            <div class="tags-cursos">
                ${nomes.map((nome) => `<span class="tag-curso">${escapeHtml(nome)}</span>`).join('')}
            </div>
        </div>
    `).join('');

    return `
    <article class="card-unidade">
        <div class="card-unidade-topo">
            <img class="logo-unidade" src="${logo}" alt="" onerror="this.onerror=null;this.src='${LOGO_FALLBACK}';">
            <div>
                <h3 class="nome-unidade">${escapeHtml(unidade.nome)}</h3>
                <div class="local-unidade">${escapeHtml(local)}</div>
            </div>
        </div>
        <div class="card-unidade-cursos">
            ${blocosCategorias || '<p class="sem-cursos">Nenhum curso cadastrado ainda.</p>'}
        </div>
    </article>`;
}

function renderizarUnidades() {
    const campoBusca = document.getElementById('busca-cursos');
    const container = document.getElementById('grid-unidades');
    const contagem = document.getElementById('contagem-resultados');
    const termo = normalizar(campoBusca.value);

    const filtradas = unidadesCache.filter((u) => {
        if (!termo) return true;
        const alvo = normalizar([
            u.nome, u.municipio, u.regiao,
            ...(u.cursos || []).map((c) => c.nome)
        ].filter(Boolean).join(' '));
        return alvo.includes(termo);
    });

    contagem.textContent = `${filtradas.length} unidade${filtradas.length === 1 ? '' : 's'} encontrada${filtradas.length === 1 ? '' : 's'}`;

    if (!filtradas.length) {
        container.innerHTML = '<p class="sem-resultados">Nenhuma unidade encontrada para essa busca.</p>';
        return;
    }

    container.innerHTML = filtradas.map(renderizarCard).join('');
}

async function carregarUnidades() {
    const container = document.getElementById('grid-unidades');
    try {
        const snap = await getDocs(collection(db, 'etecs'));
        unidadesCache = snap.docs
            .map((d) => ({ id: d.id, ...d.data() }))
            .sort((a, b) => (a.nome || '').localeCompare(b.nome || '', 'pt-BR'));
        renderizarUnidades();
    } catch (err) {
        console.error('Erro ao carregar unidades ETEC:', err);
        container.innerHTML = '<p class="sem-resultados">Não foi possível carregar os cursos agora. Tente novamente mais tarde.</p>';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    carregarUnidades();
    document.getElementById('busca-cursos').addEventListener('input', renderizarUnidades);
});
