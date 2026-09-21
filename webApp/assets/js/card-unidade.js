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

// As categorias do cadastro são longas ("Ensino Médio integrado ao técnico no
// período noturno (M-Tec-N)"). Para os filtros, elas viram poucos grupos com
// nome curto. A ordem aqui é a ordem dos filtros na tela.
const MODALIDADES = [
    { chave: 'medio', rotulo: 'Médio + Técnico', combina: (c) => c.includes('ensino medio') && !c.includes('superior') },
    { chave: 'tecnico', rotulo: 'Técnico', combina: (c) => c.includes('tecnicos') && c.includes('presencial') && !c.includes('semipresencial') },
    { chave: 'especializacao', rotulo: 'Especialização', combina: (c) => c.includes('especializacao') },
    { chave: 'ead', rotulo: 'EaD / Online', combina: (c) => c.includes('online') || c.includes('ead') || c.includes('distancia') },
    { chave: 'semipresencial', rotulo: 'Semipresencial', combina: (c) => c.includes('semipresencial') },
    { chave: 'ams', rotulo: 'Médio + Superior (AMS)', combina: (c) => c.includes('superior') },
    { chave: 'outros', rotulo: 'Outros', combina: () => true }
];

export function modalidadeDaCategoria(categoria) {
    const texto = normalizar(categoria);
    return MODALIDADES.find((m) => m.combina(texto)) || MODALIDADES.at(-1);
}

export function rotuloDaModalidade(chave) {
    return MODALIDADES.find((m) => m.chave === chave)?.rotulo || chave;
}

export function ordemDaModalidade(chave) {
    const indice = MODALIDADES.findIndex((m) => m.chave === chave);
    return indice === -1 ? MODALIDADES.length : indice;
}

// modalidades: conjunto de chaves a exibir (null mostra todas).
// Identificador do curso na coleção "cursos" (e no endereço de curso.html).
// Tem que casar com o slug usado na importação do catálogo oficial.
export function paginaDoCurso(nome) {
    return normalizar(nome).replace(/\s+/g, '-');
}

function agruparCursosPorCategoria(cursos, modalidades) {
    const mapa = new Map();
    (cursos || []).forEach((c) => {
        if (!c || !c.nome) return;
        const categoria = c.categoria || 'Outros cursos';
        if (modalidades && !modalidades.has(modalidadeDaCategoria(categoria).chave)) return;
        if (!mapa.has(categoria)) mapa.set(categoria, []);
        mapa.get(categoria).push(c.nome);
    });
    return mapa;
}

// destaque: faixa de distância em evidência (ex.: "A 4,8 km de você").
// termoCurso: termo já normalizado; os cursos que o contêm ficam realçados.
// modalidades: conjunto de chaves de modalidade a exibir (null mostra todas).
export function renderizarCardUnidade(unidade, { destaque = '', termoCurso = '', modalidades = null } = {}) {
    const logo = unidade.logotipoUrl ? escapeHtml(unidade.logotipoUrl) : LOGO_PADRAO;
    const local = [unidade.municipio, unidade.regiao].filter(Boolean).join(' · ');
    const grupos = agruparCursosPorCategoria(unidade.cursos, modalidades);

    const blocosCategorias = [...grupos.entries()].map(([categoria, nomes]) => `
        <div class="grupo-categoria">
            <div class="categoria-label">${escapeHtml(categoria)}</div>
            <div class="tags-cursos">
                ${nomes.map((nome) => {
                    const realcado = termoCurso && normalizar(nome).includes(termoCurso);
                    // leva para a página do curso, com a descrição oficial
                    const endereco = `curso.html?c=${encodeURIComponent(paginaDoCurso(nome))}`;
                    return `<a class="tag-curso${realcado ? ' tag-curso--destaque' : ''}" href="${endereco}">${escapeHtml(nome)}</a>`;
                }).join('')}
            </div>
        </div>
    `).join('');

    const tipo = (unidade.tipo || '').trim();

    return `
    <article class="card-unidade">
        <div class="card-unidade-topo">
            <img class="logo-unidade" src="${logo}" alt="" onerror="this.onerror=null;this.src='${LOGO_FALLBACK}';">
            <div>
                <h3 class="nome-unidade">${escapeHtml(unidade.nome)}</h3>
                <div class="local-unidade">
                    ${tipo ? `<span class="tipo-instituicao">${escapeHtml(tipo)}</span>` : ''}
                    ${escapeHtml(local)}
                </div>
            </div>
        </div>
        ${destaque ? `<div class="faixa-distancia"><span aria-hidden="true">📍</span> ${escapeHtml(destaque)}</div>` : ''}
        <div class="card-unidade-cursos">
            ${blocosCategorias || '<p class="sem-cursos">Nenhum curso cadastrado ainda.</p>'}
        </div>
    </article>`;
}
