// Assistente de Libras: o VLibras, ferramenta gratuita e de código aberto do
// governo federal (gov.br/vlibras). Ele põe um botão azul fixo na borda
// direita da tela; quem clica abre um avatar 3D que traduz para Libras o
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

export function ativarVLibras() {
    // uma vez só por página, mesmo que dois scripts chamem
    if (document.getElementById('vlibras-carregador')) return;

    const carregar = () => {
        const script = document.createElement('script');
        script.id = 'vlibras-carregador';
        script.src = `${ENDERECO}/vlibras-plugin.js`;
        script.async = true;
        script.onload = () => {
            // o carregador também se monta sozinho; o Widget só confirma o endereço
            if (window.VLibras?.Widget) new window.VLibras.Widget(ENDERECO);
        };
        // sem internet ou com o site do governo fora do ar, a página segue sem o botão
        script.onerror = () => console.warn('Não deu para carregar o VLibras agora.');
        document.head.appendChild(script);
    };

    if (document.readyState === 'complete') setTimeout(carregar, 0);
    else window.addEventListener('load', carregar, { once: true });
}
