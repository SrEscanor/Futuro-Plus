// Cópia exata de webApp/assets/js/card-unidade.js (só a função normalizar) —
// mantenha os dois iguais se um dia essa função mudar lá.
function normalizar(texto) {
    return (texto || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9]+/g, ' ')
        .trim();
}

module.exports = { normalizar };
