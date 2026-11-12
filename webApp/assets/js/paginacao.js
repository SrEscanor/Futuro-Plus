// Paginação numerada, usada no catálogo de cursos e na lista de instituições.

// Mostra todos os números enquanto couber (poucas páginas) e só colapsa em
// "…" quando a lista cresce: primeira, última e as vizinhas da atual.
export function numerosDaPaginacao(paginaAtual, totalPaginas) {
    if (totalPaginas <= 8) {
        return Array.from({ length: totalPaginas }, (_, i) => i + 1);
    }
    const numeros = new Set([1, totalPaginas, paginaAtual, paginaAtual - 1, paginaAtual + 1]);
    return [...numeros].filter((n) => n >= 1 && n <= totalPaginas).sort((a, b) => a - b);
}

function seta(direcao, pagina, desligada) {
    const anterior = direcao === 'anterior';
    const desenho = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="${anterior ? 'M15 5l-7 7 7 7' : 'M9 5l7 7-7 7'}"/></svg>`;
    const texto = `<span class="pagina-seta-texto">${anterior ? 'Anterior' : 'Próxima'}</span>`;
    return `<button type="button" class="pagina-botao pagina-botao--seta" data-pagina="${pagina}"
        aria-label="${anterior ? 'Página anterior' : 'Próxima página'}"${desligada ? ' disabled' : ''}>
        ${anterior ? desenho + texto : texto + desenho}</button>`;
}

// containers: elementos que recebem os botões (topo e/ou rodapé). O mesmo
// conteúdo vai para os dois; o CSS deixa o do topo mais enxuto (classe
// "paginacao--topo" no elemento).
// aoMudar: chamado com o número da página clicada.
export function renderizarPaginacao(containers, paginaAtual, totalPaginas, aoMudar) {
    const alvos = containers.filter(Boolean);
    if (totalPaginas <= 1) {
        alvos.forEach((c) => { c.innerHTML = ''; });
        return;
    }

    let numeros = '';
    let ultimo = 0;
    numerosDaPaginacao(paginaAtual, totalPaginas).forEach((n) => {
        if (n - ultimo > 1) numeros += '<span class="pagina-reticencias" aria-hidden="true">…</span>';
        numeros += `<button type="button" class="pagina-botao${n === paginaAtual ? ' pagina-botao--ativo' : ''}"
            data-pagina="${n}" aria-label="Página ${n}"${n === paginaAtual ? ' aria-current="page"' : ''}>${n}</button>`;
        ultimo = n;
    });

    const html = `
        <span class="pagina-resumo">Página <strong>${paginaAtual}</strong> de ${totalPaginas}</span>
        <div class="pagina-botoes">
            ${seta('anterior', paginaAtual - 1, paginaAtual === 1)}
            ${numeros}
            ${seta('proxima', paginaAtual + 1, paginaAtual === totalPaginas)}
        </div>`;

    alvos.forEach((container) => {
        container.setAttribute('role', 'navigation');
        if (!container.hasAttribute('aria-label')) container.setAttribute('aria-label', 'Páginas');
        container.innerHTML = html;
        container.querySelectorAll('[data-pagina]').forEach((botao) => {
            botao.addEventListener('click', () => aoMudar(Number(botao.dataset.pagina)));
        });
    });
}
