// Dispara sozinho o mini-tour da página (Testes, Cursos, Instituições,
// Notícias, Mural ou Perfil) na primeira vez que a pessoa entra nela. Ver
// tour-paginas.js.
import { iniciarTourDaPagina } from './tour-paginas.js';

document.addEventListener('DOMContentLoaded', () => {
    iniciarTourDaPagina({ forcar: false });
});
