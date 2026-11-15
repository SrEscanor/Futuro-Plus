// "Últimas notícias" da Início: as aprovadas mais recentes, com a mesma capa
// da página Notícias (a foto, ou a capa desenhada quando não há foto ou ela
// não carrega). Cada uma abre o site de origem em outra aba, como lá.
//
// Busca 6, mas mostra só as que cabem: no computador o quadro tem a altura
// do carrossel ao lado (3 numa tela de 1440 px, 4 numa de 1920); no celular,
// até 4 (ver inicio.css). Custa 6 leituras do Firestore por visita.
import { listarNoticiasPublicadas } from './noticias-dados.js';
import {
    capaDesenhada, dataCurta, escapeHtml, imagemSegura, linkSeguro, rotulosDaNoticia, tempoRelativo
} from './noticias-util.js';

const QUANTAS = 6;
const lista = document.getElementById('noticias-inicio-lista');
let noticiasNaTela = [];

function capa(noticia) {
    const foto = imagemSegura(noticia.imagem);
    const dentro = foto
        ? `<img src="${escapeHtml(foto)}" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer">`
        : capaDesenhada(noticia);
    return `<span class="noticia-mini-capa" data-noticia="${escapeHtml(noticia.id)}">${dentro}</span>`;
}

function item(noticia) {
    const link = linkSeguro(noticia.link);
    const titulo = String(noticia.titulo || '').trim() || 'Notícia sem título';
    const etiquetas = rotulosDaNoticia(noticia).map((rotulo) => rotulo.texto).join(' e ');
    const quando = tempoRelativo(noticia.publicadaEm);
    const meta = [
        `<span class="noticia-mini-etiqueta">${escapeHtml(etiquetas)}</span>`,
        quando
            ? `<time datetime="${escapeHtml(noticia.publicadaEm)}" title="${escapeHtml(dataCurta(noticia.publicadaEm))}">${escapeHtml(quando)}</time>`
            : ''
    ].filter(Boolean).join(' · ');

    const conteudo = `
        ${capa(noticia)}
        <span class="noticia-mini-texto">
            <span class="noticia-mini-titulo">${escapeHtml(titulo)}</span>
            <span class="noticia-mini-meta">${meta}</span>
        </span>`;

    // sem link válido a notícia aparece, mas não é clicável
    if (!link) return `<li><div class="noticia-mini">${conteudo}</div></li>`;
    return `
        <li><a class="noticia-mini" href="${escapeHtml(link)}" target="_blank" rel="noopener noreferrer">
            ${conteudo}
            <span class="so-leitor">Abre o site de origem em outra aba.</span>
        </a></li>`;
}

function aviso(texto) {
    return `<li class="noticias-inicio-aviso">${escapeHtml(texto)}</li>`;
}

export function montarNoticias(noticias) {
    if (!lista) return;
    noticiasNaTela = noticias;
    lista.innerHTML = noticias.length
        ? noticias.map(item).join('')
        : aviso('Ainda não há notícias publicadas.');
    requestAnimationFrame(marcarAsQueSobraram);
}

// No computador, a notícia que não coube quebra para uma coluna escondida
// (inicio.css). Ela fica "inert": sem isso o Tab ainda chegaria no link
// invisível e a lista rolaria de lado para mostrá-lo.
function marcarAsQueSobraram() {
    const borda = lista.getBoundingClientRect().right - 1;
    let sobrouAlguma = false;
    lista.querySelectorAll(':scope > li').forEach((noticia) => {
        noticia.inert = noticia.getBoundingClientRect().left >= borda;
        sobrouAlguma ||= noticia.inert;
    });
    // quadro cheio: o pedaço que não dá outra notícia vira espaço entre elas,
    // em vez de uma faixa vazia embaixo
    lista.classList.toggle('noticias-inicio-lista--cheia', sobrouAlguma);
}

if (lista && 'ResizeObserver' in window) {
    new ResizeObserver(marcarAsQueSobraram).observe(lista);
    document.fonts?.ready.then(marcarAsQueSobraram);
}

// Foto que não carregou (endereço quebrado, site fora do ar): entra a capa
// desenhada no lugar. O evento "error" de imagem não sobe, por isso a captura.
lista?.addEventListener('error', (evento) => {
    const caixa = evento.target instanceof HTMLImageElement ? evento.target.closest('.noticia-mini-capa') : null;
    if (!caixa) return;
    const noticia = noticiasNaTela.find((n) => String(n.id) === caixa.dataset.noticia);
    caixa.innerHTML = capaDesenhada(noticia || {});
}, true);

async function carregar() {
    if (!lista) return;
    try {
        montarNoticias(await listarNoticiasPublicadas(QUANTAS));
    } catch (erro) {
        console.error('Erro ao carregar as últimas notícias:', erro);
        lista.innerHTML = aviso('Não foi possível carregar as notícias agora.');
    }
}

carregar();
