// Card de unidade ETEC, usado tanto na página de cursos quanto na
// prévia da home.

// Logo mostrada quando a unidade ainda não tem a própria (nem extraída do
// pacote oficial, nem cadastrada à mão): a marca-texto oficial do tipo dela.
// Para tipos além de Etec/Fatec, cai no logo do Futuro+ mesmo.
export const LOGO_ETEC_PADRAO = '/etec-logo.png';
export const LOGO_FATEC_PADRAO = '/fatec-logo.png';
export const LOGO_FALLBACK = '/logo.png';

export function logoPadraoPorTipo(tipo) {
    const t = (tipo || '').trim().toLowerCase();
    if (t === 'fatec') return LOGO_FATEC_PADRAO;
    if (t === 'etec') return LOGO_ETEC_PADRAO;
    return LOGO_FALLBACK;
}

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
    { chave: 'ead', rotulo: 'EaD / Online', combina: (c) => !c.includes('superior') && (c.includes('online') || c.includes('ead') || c.includes('distancia')) },
    { chave: 'semipresencial', rotulo: 'Semipresencial', combina: (c) => c.includes('semipresencial') },
    // AMS é a articulação do médio-técnico da Etec com o superior da Fatec;
    // precisa vir antes de "superior", senão os cursos superiores de
    // tecnologia das Fatecs (presenciais e EaD) apareciam todos como AMS.
    { chave: 'ams', rotulo: 'Médio + Superior (AMS)', combina: (c) => c.includes('superior') && (c.includes('articulacao') || c.includes('medio') || /\bams\b/.test(c)) },
    { chave: 'superior', rotulo: 'Superior', combina: (c) => c.includes('superior') },
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
// Cursos superiores (Fatec, e no futuro outras faculdades parceiras) e
// técnicos (Etec) às vezes têm o mesmo nome ("Logística", "Marketing"...)
// mas são grades bem diferentes — por isso o slug de nível superior ganha o
// prefixo "superior-", igual à importação do CSV faz. Etec é o único tipo
// técnico hoje, então qualquer outro tipo (Fatec, ou um novo tipo digitado
// no cadastro de unidades) já cai como superior sem precisar mexer aqui.
export function paginaDoCurso(nome, tipo) {
    const base = normalizar(nome).replace(/\s+/g, '-');
    const t = (tipo || '').trim().toLowerCase();
    return t && t !== 'etec' ? `superior-${base}` : base;
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
export function logoDaUnidade(unidade) {
    return unidade.logotipoUrl ? escapeHtml(unidade.logotipoUrl) : logoPadraoPorTipo((unidade.tipo || '').trim());
}

// Todos os cursos da unidade, agrupados pela categoria do cadastro, cada um
// levando à página do curso.
export function renderizarCursosPorCategoria(unidade, { termoCurso = '', modalidades = null } = {}) {
    const tipo = (unidade.tipo || '').trim();
    const grupos = agruparCursosPorCategoria(unidade.cursos, modalidades);

    return [...grupos.entries()].map(([categoria, nomes]) => `
        <div class="grupo-categoria">
            <div class="categoria-label">${escapeHtml(categoria)}</div>
            <div class="tags-cursos">
                ${nomes.map((nome) => {
                    const realcado = termoCurso && normalizar(nome).includes(termoCurso);
                    const endereco = `curso.html?c=${encodeURIComponent(paginaDoCurso(nome, tipo))}`;
                    return `<a class="tag-curso${realcado ? ' tag-curso--destaque' : ''}" href="${endereco}">${escapeHtml(nome)}</a>`;
                }).join('')}
            </div>
        </div>
    `).join('');
}

const ICONE_LOCAL = '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a7 7 0 0 0-7 7c0 5.2 7 13 7 13s7-7.800 7-13a7 7 0 0 0-7-7zm0 9.500A2.500 2.500 0 1 1 12 6.500a2.500 2.500 0 0 1 0 5z"/></svg>';
const ICONE_CURSOS = '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 3 1 9l11 6 9-4.910V17h2V9L12 3zm-7 9.180V16c0 1.660 3.130 3 7 3s7-1.340 7-3v-3.820l-7 3.820-7-3.820z"/></svg>';
const ICONE_SETA = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.200" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';

// Card da lista de instituições: logo em destaque, um resumo com até três
// cursos e o botão que abre o painel com a lista completa.
// destaque: texto de distância ("A 4,8 km de você"), quando dá pra medir.
// cursosDestaque: nomes já escolhidos por quem chama (os que casam com a
// busca vêm primeiro). totalCursos: quantos cursos diferentes a unidade tem.
export function renderizarCardInstituicao(unidade, { destaque = '', cursosDestaque = [], totalCursos = 0 } = {}) {
    const tipo = (unidade.tipo || '').trim();
    const local = unidade.municipio ? `${unidade.municipio} - SP` : '';

    return `
    <article class="card-unidade card-instituicao">
        <div class="card-instituicao-topo">
            <img class="card-instituicao-logo" src="${logoDaUnidade(unidade)}" alt="" onerror="this.onerror=null;this.src='${LOGO_FALLBACK}';">
            <span class="card-instituicao-divisor" aria-hidden="true"></span>
            <h3 class="nome-unidade">${escapeHtml(unidade.nome)}</h3>
        </div>
        <div class="card-instituicao-info">
            ${local ? `<div class="card-instituicao-local">${ICONE_LOCAL}<span>${escapeHtml(local)}</span></div>` : ''}
            <div class="card-instituicao-selos">
                ${tipo ? `<span class="selo-instituicao">${escapeHtml(tipo)}</span>` : ''}
                ${destaque ? `<span class="selo-instituicao selo-instituicao--perto">${escapeHtml(destaque)}</span>` : ''}
            </div>
        </div>
        <div class="card-instituicao-cursos">
            <div class="card-instituicao-total">${ICONE_CURSOS}<span><strong>${totalCursos}</strong> ${totalCursos === 1 ? 'curso disponível' : 'cursos disponíveis'}</span></div>
            ${cursosDestaque.length ? `
            <div class="card-instituicao-destaques">
                <span>Cursos em destaque:</span>
                <ul>${cursosDestaque.map((nome) => `<li>${escapeHtml(nome)}</li>`).join('')}</ul>
            </div>` : '<p class="sem-cursos">Nenhum curso cadastrado ainda.</p>'}
        </div>
        <button type="button" class="btn-ver-instituicao" data-unidade="${escapeHtml(unidade.id)}">Ver instituição ${ICONE_SETA}</button>
    </article>`;
}

export function renderizarCardUnidade(unidade, { destaque = '', termoCurso = '', modalidades = null } = {}) {
    const tipo = (unidade.tipo || '').trim();
    const logo = unidade.logotipoUrl ? escapeHtml(unidade.logotipoUrl) : logoPadraoPorTipo(tipo);
    const local = [unidade.municipio, unidade.regiao].filter(Boolean).join(' · ');
    const grupos = agruparCursosPorCategoria(unidade.cursos, modalidades);

    const blocosCategorias = [...grupos.entries()].map(([categoria, nomes]) => `
        <div class="grupo-categoria">
            <div class="categoria-label">${escapeHtml(categoria)}</div>
            <div class="tags-cursos">
                ${nomes.map((nome) => {
                    const realcado = termoCurso && normalizar(nome).includes(termoCurso);
                    // leva para a página do curso, com a descrição oficial
                    const endereco = `curso.html?c=${encodeURIComponent(paginaDoCurso(nome, tipo))}`;
                    return `<a class="tag-curso${realcado ? ' tag-curso--destaque' : ''}" href="${endereco}">${escapeHtml(nome)}</a>`;
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
