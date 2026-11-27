// Compartilhar uma notícia própria (noticia.html). O botão azul fica no fim
// da matéria (noticia-materia.js). No celular ele abre o menu de compartilhar
// do aparelho (WhatsApp, Instagram, TikTok...); no computador abre as opções
// na própria página. Em todos os casos vai uma mensagem pronta com o título,
// o link da matéria e um convite para seguir o Futuro+ nas redes.
//
// As frases ficam em primeira pessoa e sem marca de gênero: quem manda é a
// própria pessoa, e o site não sabe o gênero de quem lê.

// as mesmas redes do rodapé da Início (index.html)
export const REDES_FUTUROPLUS = [
    { nome: 'Instagram', emoji: '📸', url: 'https://www.instagram.com/futuroplus_' },
    { nome: 'TikTok', emoji: '🎵', url: 'https://www.tiktok.com/@futuroplus_' },
    { nome: 'LinkedIn', emoji: '💼', url: 'https://www.linkedin.com/in/futuroplus' }
];

const ICONES = {
    whatsapp: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>',
    facebook: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>',
    linkedin: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>',
    x: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z"/></svg>',
    email: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>',
    copiar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h9"/></svg>'
};

const escapar = (texto) => String(texto ?? '').replace(/[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// A mensagem que vai junto (WhatsApp, e-mail, menu do celular e "Copiar
// mensagem"). O link da matéria vem antes das redes: o WhatsApp monta a
// prévia com o primeiro link do texto.
export function mensagemDaNoticia({ titulo, linhaApoio }, link) {
    const linhas = [`📰 ${titulo}`];
    if (linhaApoio) linhas.push('', linhaApoio);
    linhas.push('', 'Vi essa notícia no Futuro+ e achei que vale a leitura 👀', `👉 ${link}`);
    linhas.push('', '✨ Siga o Futuro+ nas redes:');
    REDES_FUTUROPLUS.forEach(({ nome, emoji, url }) => linhas.push(`${emoji} ${nome}: ${url}`));
    return linhas.join('\n');
}

// Onde cada opção leva. Facebook e LinkedIn só aceitam o link (eles montam a
// prévia sozinhos); o X tem limite de caracteres, então vai uma frase curta.
export function opcoesDeCompartilhar(noticia, link) {
    const mensagem = mensagemDaNoticia(noticia, link);
    const e = encodeURIComponent;
    return [
        { id: 'whatsapp', rotulo: 'WhatsApp', href: `https://wa.me/?text=${e(mensagem)}` },
        { id: 'facebook', rotulo: 'Facebook', href: `https://www.facebook.com/sharer/sharer.php?u=${e(link)}` },
        { id: 'linkedin', rotulo: 'LinkedIn', href: `https://www.linkedin.com/sharing/share-offsite/?url=${e(link)}` },
        { id: 'x', rotulo: 'X', href: `https://twitter.com/intent/tweet?text=${e(`📰 ${noticia.titulo}\nVi no Futuro+ 👀`)}&url=${e(link)}` },
        { id: 'email', rotulo: 'E-mail', href: `mailto:?subject=${e(noticia.titulo)}&body=${e(mensagem)}` },
        { id: 'copiar', rotulo: 'Copiar mensagem' }
    ];
}

function htmlDaOpcao({ id, rotulo, href }) {
    const classe = `materia-partilha-opcao materia-partilha-opcao--${id}`;
    if (!href) {
        return `<button type="button" class="${classe}" data-opcao="${id}">${ICONES[id]}<span>${rotulo}</span></button>`;
    }
    const novaAba = href.startsWith('mailto:') ? '' : ' target="_blank" rel="noopener noreferrer"';
    return `<a class="${classe}" href="${escapar(href)}"${novaAba}>${ICONES[id]}<span>${rotulo}</span></a>`;
}

// No celular (tela de toque com o menu do aparelho) o botão abre direto o
// menu de compartilhar do sistema, que já traz WhatsApp, Instagram, TikTok...
function usarMenuDoAparelho() {
    return typeof navigator.share === 'function' && window.matchMedia('(pointer: coarse)').matches;
}

// Liga o botão "Compartilhar" que htmlDaMateria() pôs na página.
export function ligarCompartilhar(caixa, noticia, link) {
    const botao = caixa?.querySelector('[data-acao="compartilhar"]');
    const opcoes = caixa?.querySelector('.materia-partilha-opcoes');
    if (!botao || !opcoes) return;

    const mensagem = mensagemDaNoticia(noticia, link);
    opcoes.innerHTML = opcoesDeCompartilhar(noticia, link).map(htmlDaOpcao).join('')
        + '<p class="materia-partilha-nota">A mensagem já vai com o link da notícia e das redes do Futuro+ ✨</p>';

    const mostrarOpcoes = (abrir) => {
        opcoes.hidden = !abrir;
        botao.setAttribute('aria-expanded', String(abrir));
    };

    botao.addEventListener('click', async () => {
        if (usarMenuDoAparelho()) {
            try {
                await navigator.share({ title: noticia.titulo, text: mensagem });
                return;
            } catch (erro) {
                // fechou o menu sem escolher: não faz nada
                if (erro?.name === 'AbortError') return;
                // o aparelho recusou: mostra as opções da página
            }
        }
        mostrarOpcoes(opcoes.hidden);
    });

    opcoes.addEventListener('click', async (evento) => {
        const copiar = evento.target.closest('[data-opcao="copiar"]');
        if (!copiar) return;
        const texto = copiar.querySelector('span');
        try {
            await navigator.clipboard.writeText(mensagem);
            texto.textContent = 'Mensagem copiada!';
        } catch {
            texto.textContent = 'Não deu para copiar';
        }
        setTimeout(() => { texto.textContent = 'Copiar mensagem'; }, 2500);
    });
}
