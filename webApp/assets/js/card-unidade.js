// Card de unidade ETEC, usado tanto na página de cursos quanto na
// prévia da home.

export const LOGO_PADRAO = '/etec-logo-padrao.png';
export const LOGO_FALLBACK = '/logo.png';

export function escapeHtml(str) {
    return String(str ?? '').replace(/[&<>"']/g, (c) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
}

// Minúsculas, sem acento e sem pontuação: usado para comparar nomes de
// cursos e cidades vindos de fontes diferentes (CSV, IBGE, busca).
export function normalizar(texto) {
    return (texto || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9]+/g, ' ')
        .trim();
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

// destaque: selo opcional abaixo da cidade (ex.: "📍 Na sua cidade").
// termoCurso: termo já normalizado; os cursos que o contêm ficam realçados.
export function renderizarCardUnidade(unidade, { destaque = '', termoCurso = '' } = {}) {
    const logo = unidade.logotipoUrl ? escapeHtml(unidade.logotipoUrl) : LOGO_PADRAO;
    const local = [unidade.municipio, unidade.regiao].filter(Boolean).join(' · ');
    const grupos = agruparCursosPorCategoria(unidade.cursos);

    const blocosCategorias = [...grupos.entries()].map(([categoria, nomes]) => `
        <div class="grupo-categoria">
            <div class="categoria-label">${escapeHtml(categoria)}</div>
            <div class="tags-cursos">
                ${nomes.map((nome) => {
                    const realcado = termoCurso && normalizar(nome).includes(termoCurso);
                    return `<span class="tag-curso${realcado ? ' tag-curso--destaque' : ''}">${escapeHtml(nome)}</span>`;
                }).join('')}
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
                ${destaque ? `<div class="selo-proximidade">${escapeHtml(destaque)}</div>` : ''}
            </div>
        </div>
        <div class="card-unidade-cursos">
            ${blocosCategorias || '<p class="sem-cursos">Nenhum curso cadastrado ainda.</p>'}
        </div>
    </article>`;
}
