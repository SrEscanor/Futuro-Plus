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

// containers: elementos que recebem os botões (topo e/ou rodapé).
// aoMudar: chamado com o número da página clicada.
export function renderizarPaginacao(containers, paginaAtual, totalPaginas, aoMudar) {
    const alvos = containers.filter(Boolean);
    if (totalPaginas <= 1) {
        alvos.forEach((c) => { c.innerHTML = ''; });
        return;
    }

    let html = '';
    let ultimo = 0;
    numerosDaPaginacao(paginaAtual, totalPaginas).forEach((n) => {
        if (n - ultimo > 1) html += '<span class="pagina-reticencias">…</span>';
        html += `<button type="button" class="pagina-botao${n === paginaAtual ? ' pagina-botao--ativo' : ''}"
            data-pagina="${n}"${n === paginaAtual ? ' aria-current="page"' : ''}>${n}</button>`;
        ultimo = n;
    });

    alvos.forEach((container) => {
        container.innerHTML = html;
        container.querySelectorAll('[data-pagina]').forEach((botao) => {
            botao.addEventListener('click', () => aoMudar(Number(botao.dataset.pagina)));
        });
    });
}
