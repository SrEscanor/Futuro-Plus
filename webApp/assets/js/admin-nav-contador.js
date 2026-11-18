// Contador do item "Comunidade" no menu de todas as páginas do painel admin:
// quantas avaliações e dúvidas novas chegaram depois da última vez que esta
// conta marcou como visto (aba Novidades do painel Comunidade, ou abrindo o
// sino do site).
import { observarNovidades } from './comunidade-dados.js';

observarNovidades((quantos) => {
    document.querySelectorAll('.admin-nav-item[href="admin-comunidade.html"] .admin-nav-contador').forEach((contador) => {
        contador.textContent = quantos > 99 ? '99+' : String(quantos);
        contador.setAttribute('aria-label', quantos === 1 ? '1 novidade' : `${quantos} novidades`);
        contador.hidden = quantos === 0;
    });
});
