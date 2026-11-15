// O HTML da matéria de uma notícia própria, o mesmo na página noticia.html
// e no "Ver como fica" do painel. Tudo o que vem da notícia passa por
// escapeHtml antes de entrar na página.
import { escapeHtml } from './noticias-util.js';
import { ETIQUETAS, dataHora, haQuantoTempo, paraData } from './noticias-proprias-util.js';

const ICONE_LINK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" '
    + 'stroke-linejoin="round" aria-hidden="true"><path d="M10 14a5 5 0 0 0 7.07 0l3-3a5 5 0 0 0-7.07-7.07l-1 1"/>'
    + '<path d="M14 10a5 5 0 0 0-7.07 0l-3 3a5 5 0 0 0 7.07 7.07l1-1"/></svg>';

// A imagem principal vem como objeto no painel ({ url, legenda, credito }) e
// em campos soltos na cópia pública (imagem, imagemLegenda, imagemCredito).
function imagemPrincipal(noticia) {
    if (noticia.imagem && typeof noticia.imagem === 'object') return noticia.imagem;
    return { url: noticia.imagem || '', legenda: noticia.imagemLegenda || '', credito: noticia.imagemCredito || '' };
}

function figura({ url, legenda, credito }, principal = false) {
    if (!url) return '';
    const textoDaLegenda = [
        legenda ? escapeHtml(legenda) : '',
        credito ? `<span class="materia-credito">${escapeHtml(credito)}</span>` : ''
    ].filter(Boolean).join(' ');
    return `
        <figure class="materia-figura${principal ? ' materia-figura--principal' : ''}">
            <img src="${escapeHtml(url)}" alt="${escapeHtml(legenda || '')}" decoding="async"${principal ? '' : ' loading="lazy"'}>
            ${textoDaLegenda ? `<figcaption>${textoDaLegenda}</figcaption>` : ''}
        </figure>`;
}

function bloco(item) {
    if (item.tipo === 'paragrafo') return `<p>${escapeHtml(item.texto).replace(/\n/g, '<br>')}</p>`;
    if (item.tipo === 'intertitulo') return `<h2>${escapeHtml(item.texto)}</h2>`;
    if (item.tipo === 'imagem') return figura(item);
    return '';
}

// "15/11/2026 03h00 · Atualizado há 13 horas" (a parte do "Atualizado" só
// quando a notícia mudou depois de publicada)
export function linhaDeDatas(noticia, agora = new Date()) {
    const publicada = paraData(noticia.publicadaEm);
    const atualizada = paraData(noticia.atualizadaEm);
    const partes = [publicada
        ? `<time datetime="${escapeHtml(publicada.toISOString())}">${dataHora(publicada)}</time>`
        : 'Ainda não publicada'];
    if (atualizada && (!publicada || atualizada > publicada)) {
        partes.push(`<span title="${escapeHtml(dataHora(atualizada))}">Atualizado ${haQuantoTempo(atualizada, agora)}</span>`);
    }
    return partes.join(' · ');
}

// opcoes.botaoCopiar: mostra o "Copiar link" (a página pública liga o clique)
export function htmlDaMateria(noticia, { agora = new Date(), botaoCopiar = true } = {}) {
    const etiquetas = (noticia.instituicoes || noticia.etiquetas || [])
        .filter((id) => id in ETIQUETAS)
        .map((id) => `<span class="materia-selo materia-selo--extra">${ETIQUETAS[id]}</span>`)
        .join('');
    const blocos = (Array.isArray(noticia.blocos) ? noticia.blocos : []).map(bloco).join('');

    return `
        <nav class="materia-trilha" aria-label="Você está em">
            <a href="noticias.html">Notícias</a> <span aria-hidden="true">&rsaquo;</span> <span>Futuro+</span>
        </nav>
        <div class="materia-selos"><span class="materia-selo">Notícia do Futuro+</span>${etiquetas}</div>
        <h1 class="materia-titulo">${escapeHtml(noticia.titulo || 'Notícia sem título')}</h1>
        ${noticia.linhaApoio ? `<p class="materia-apoio">${escapeHtml(noticia.linhaApoio)}</p>` : ''}
        <div class="materia-assinatura">
            <img class="materia-assinatura-logo" src="/logo.png" alt="" width="44" height="44">
            <div class="materia-assinatura-texto">
                <span class="materia-autor">Por ${escapeHtml(noticia.autor || 'Equipe Futuro+')}</span>
                <span class="materia-datas">${linhaDeDatas(noticia, agora)}</span>
            </div>
            ${botaoCopiar ? `<button type="button" class="materia-compartilhar" data-acao="copiar-link">${ICONE_LINK}<span>Copiar link</span></button>` : ''}
        </div>
        ${figura(imagemPrincipal(noticia), true)}
        <div class="materia-corpo">${blocos}</div>
        <a class="materia-voltar" href="noticias.html">&larr; Voltar para Notícias</a>`;
}
