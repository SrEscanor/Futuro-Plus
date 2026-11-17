// Dentro de uma vitrine horizontal (cards lado a lado com scroll), a roda do
// mouse por padrão só rola a página inteira no eixo vertical. Com o ponteiro
// em cima da vitrine, isso redireciona essa rolagem para o eixo horizontal
// dela mesma. Trackpad já manda deltaX sozinho nesse caso, então só entra em
// ação quando o movimento é mesmo vertical (roda de mouse comum).
export function ativarScrollHorizontalComMouse(elemento) {
    if (!elemento) return;
    elemento.addEventListener('wheel', (evento) => {
        if (Math.abs(evento.deltaX) >= Math.abs(evento.deltaY)) return;
        evento.preventDefault();
        elemento.scrollLeft += evento.deltaY;
    }, { passive: false });
}
