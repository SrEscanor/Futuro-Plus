// Assistente de Libras: o VLibras, ferramenta gratuita e de código aberto do
// governo federal (gov.br/vlibras). Ele põe um botão azul fixo na borda
// direita da tela (no celular, no canto de baixo à esquerda); quem clica abre um avatar 3D que traduz para Libras o
// texto em que a pessoa clicar na página.
//
// Aqui só entra o carregador oficial (uns 2 KB), depois que a página termina
// de carregar, para não atrasar o que a pessoa veio ver. O resto (o avatar)
// só é baixado quando alguém clica no botão. O botão fica num shadow DOM do
// próprio VLibras, então o CSS do site não mexe nele, nem ele no site.
//
// Entra nas páginas públicas (dashboard.js, login, cadastro e as páginas de
// Termos e Privacidade), não nos painéis de admin.
const ENDERECO = 'https://vlibras.gov.br/app';

// No celular e no tablet (menu de hambúrguer, abaixo de 1024 px) o botão sai
// do meio da borda direita, onde tampava o texto, e vai para o canto de baixo
// à esquerda, na mesma altura do botão do assistente (que fica no canto
// direito: 60 px no celular, 80 px no tablet, a 25 px da borda). O VLibras só
// oferece "direita" ou "esquerda" no meio da tela, então o ajuste entra como
// um <style> a mais dentro do shadow DOM dele (que é aberto). Se uma versão
// nova mudar os ids, o ajuste só deixa de valer e o botão volta ao lugar de
// sempre. Com o menu aberto o botão some (dashboard.css).
const AJUSTE_NO_CELULAR = `
    @media (max-width: 1023px) {
        #vlibras-access {
            top: auto;
            right: auto;
            bottom: 45px;
            left: 25px;
            flex-direction: row-reverse;
        }

        #vlibras-button {
            right: auto;
            left: 0;
        }
    }

    @media (max-width: 640px) {
        #vlibras-access {
            bottom: 35px;
        }
    }`;

function ajustarPosicao() {
    const raiz = document.getElementById('vlibras-access-wrapper')?.shadowRoot;
    if (!raiz || raiz.getElementById('futuroplus-posicao')) return Boolean(raiz);
    const estilo = document.createElement('style');
    estilo.id = 'futuroplus-posicao';
    estilo.textContent = AJUSTE_NO_CELULAR;
    raiz.appendChild(estilo);
    return true;
}

export function ativarVLibras() {
    // uma vez só por página, mesmo que dois scripts chamem
    if (document.getElementById('vlibras-carregador')) return;

    const carregar = () => {
        const script = document.createElement('script');
        script.id = 'vlibras-carregador';
        script.src = `${ENDERECO}/vlibras-plugin.js`;
        script.async = true;
        script.onload = () => {
            // o carregador também se monta sozinho; o Widget só confirma o
            // endereço e monta o botão na hora, já com a posição do celular
            if (window.VLibras?.Widget) new window.VLibras.Widget(ENDERECO);
            if (!ajustarPosicao()) setTimeout(ajustarPosicao, 300);
        };
        // sem internet ou com o site do governo fora do ar, a página segue sem o botão
        script.onerror = () => console.warn('Não deu para carregar o VLibras agora.');
        document.head.appendChild(script);
    };

    if (document.readyState === 'complete') setTimeout(carregar, 0);
    else window.addEventListener('load', carregar, { once: true });
}
