import { iniciarTourBoasVindas } from './tour-boas-vindas.js';

document.addEventListener('DOMContentLoaded', () => {
    const parametros = new URLSearchParams(location.search);
    const forcar = parametros.get('tour') === '1';

    if (forcar) {
        // Some o "?tour=1" da barra de endereço pra recarregar a página não
        // reabrir o tour sozinho de novo.
        parametros.delete('tour');
        const resto = parametros.toString();
        history.replaceState(null, '', location.pathname + (resto ? `?${resto}` : ''));
    }

    iniciarTourBoasVindas({ forcar });
});
