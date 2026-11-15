// Página Notícias (pública): mostra as notícias que o administrador aprovou,
// da mais nova para a mais antiga. O texto da matéria não é reproduzido aqui:
// cada cartão leva ao site de origem, em outra aba.
//
// Os dados chegam só por noticias-dados.js (os roteiros de teste trocam esse
// arquivo por uma cópia de mentira). Tudo o que vem de uma notícia é texto de
// sites de fora, então passa por escapeHtml, linkSeguro e imagemSegura antes
// de entrar na página.
import { listarNoticiasPublicadas } from './noticias-dados.js';
import {
    capaDesenhada, dataCurta, escapeHtml, imagemSegura, linkSeguro, rotulosDaNoticia, tempoRelativo
} from './noticias-util.js';
import { renderizarPaginacao } from './paginacao.js';
import { ETIQUETAS, linkDaMateria } from './noticias-proprias-util.js';

// Com 12 a grade fecha sem buraco em 1, 2, 3 ou 4 colunas (ver noticias.css).
const POR_PAGINA = 12;

// "Todas" inclui as notícias gerais do Centro Paula Souza, que não têm etiqueta.
const NOME_DO_FILTRO = { etec: 'Etec', fatec: 'Fatec' };

// Ícones de traço, no mesmo estilo dos de curso-detalhe.js.
const ICONES = {
    sair: '<path d="M18 13.5V18a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4.5M14 4h6v6M20 4l-9 9"/>',
    seguir: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    jornal: '<path d="M5 4h12v14a2 2 0 0 0 2 2H7a2 2 0 0 1-2-2zM17 9h2a1 1 0 0 1 1 1v8a2 2 0 0 1-2 2M8.5 8.5h5M8.5 12h5M8.5 15.5h3"/>',
    alerta: '<path d="M12 4.5 3.5 19h17zM12 10.5v4M12 17h.01"/>',
    lupa: '<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/>'
};

const ESQUELETO = `
    <li class="noticia-esqueleto" aria-hidden="true">
        <span class="noticia-esqueleto-capa"></span>
        <span class="noticia-esqueleto-linha noticia-esqueleto-linha--curta"></span>
        <span class="noticia-esqueleto-linha"></span>
        <span class="noticia-esqueleto-linha noticia-esqueleto-linha--media"></span>
    </li>`;

// situacao: 'carregando', 'pronta' ou 'erro'
const estado = { noticias: [], filtro: 'todas', pagina: 1, situacao: 'carregando', erro: '', pedido: 0 };

// O navegador (e o roteiro de teste) carrega este arquivo com a página já
// pronta, então iniciar() costuma rodar nesta linha mesmo. Por isso as
// constantes ficam acima dela.
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
else iniciar();

function iniciar() {
    const grade = document.getElementById('noticias-grade');
    if (!grade) return;

    document.querySelectorAll('.noticias-filtros [data-filtro]').forEach((chip) => {
        chip.addEventListener('click', () => escolherFiltro(chip.dataset.filtro));
    });

    // O "error" de uma imagem não sobe pela página como o clique: de fora,
    // só dá para ouvir na fase de captura (o "true" no fim).
    grade.addEventListener('error', trocarFotoQuebrada, true);

    // botões dos avisos: "Tentar de novo" e "Ver todas"
    grade.addEventListener('click', (evento) => {
        const botao = evento.target.closest('[data-acao]');
        if (!botao) return;
        if (botao.dataset.acao === 'tentar') carregar();
        if (botao.dataset.acao === 'ver-todas') escolherFiltro('todas');
    });

    carregar();
}

async function carregar() {
    const pedido = estado.pedido += 1;
    estado.situacao = 'carregando';
    desenhar();

    try {
        const noticias = await listarNoticiasPublicadas();
        if (pedido !== estado.pedido) return;
        estado.noticias = Array.isArray(noticias) ? noticias : [];
        estado.situacao = 'pronta';
    } catch (erro) {
        if (pedido !== estado.pedido) return;
        console.error('Erro ao carregar as notícias:', erro);
        estado.erro = erro?.message || '';
        estado.situacao = 'erro';
    }
    desenhar();
}

function escolherFiltro(filtro) {
    if (filtro === estado.filtro || (filtro !== 'todas' && !(filtro in NOME_DO_FILTRO))) return;
    estado.filtro = filtro;
    estado.pagina = 1;

    document.querySelectorAll('.noticias-filtros [data-filtro]').forEach((chip) => {
        const ativo = chip.dataset.filtro === filtro;
        chip.classList.toggle('chip-filtro--ativo', ativo);
        chip.setAttribute('aria-pressed', String(ativo));
    });
    desenhar();
}

function irParaPagina(pagina) {
    estado.pagina = pagina;
    desenhar();
    const semAnimacao = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    document.getElementById('noticias-barra')
        ?.scrollIntoView({ behavior: semAnimacao ? 'auto' : 'smooth', block: 'start' });
}

function noticiasDoFiltro() {
    if (estado.filtro === 'todas') return estado.noticias;
    return estado.noticias.filter((noticia) => (noticia.instituicoes || []).includes(estado.filtro));
}

// ========================================================
// Desenho da página
// ========================================================

function desenhar() {
    const grade = document.getElementById('noticias-grade');
    const barra = document.getElementById('noticias-barra');
    const contagem = document.getElementById('noticias-contagem');
    const paginacoes = [
        document.getElementById('noticias-paginacao-topo'),
        document.getElementById('noticias-paginacao-rodape')
    ];
    const semPaginas = () => renderizarPaginacao(paginacoes, 1, 1, irParaPagina);

    grade.classList.remove('noticias-grade--destaque');
    grade.setAttribute('aria-busy', String(estado.situacao === 'carregando'));

    if (estado.situacao === 'carregando') {
        barra.hidden = false;
        contagem.textContent = 'Carregando notícias…';
        grade.innerHTML = ESQUELETO.repeat(6);
        semPaginas();
        return;
    }

    if (estado.situacao === 'erro') {
        barra.hidden = true;
        contagem.textContent = '';
        grade.innerHTML = aviso({
            icone: 'alerta',
            titulo: 'Não deu para carregar as notícias',
            // o motivo técnico (em inglês, vindo do Firebase) fica só no console
            texto: 'Confira sua internet e tente de novo.',
            botao: ['tentar', 'Tentar de novo']
        });
        semPaginas();
        return;
    }

    if (!estado.noticias.length) {
        barra.hidden = true;
        contagem.textContent = '';
        grade.innerHTML = aviso({
            icone: 'jornal',
            titulo: 'Ainda não há notícias por aqui',
            texto: 'Quando sair alguma novidade das Etecs e Fatecs, ela aparece nesta página.'
        });
        semPaginas();
        return;
    }

    barra.hidden = false;
    const lista = noticiasDoFiltro();
    const sobre = estado.filtro === 'todas' ? '' : ` sobre ${NOME_DO_FILTRO[estado.filtro]}`;
    contagem.textContent = `${lista.length} ${lista.length === 1 ? 'notícia' : 'notícias'}${sobre}`;

    if (!lista.length) {
        grade.innerHTML = aviso({
            icone: 'lupa',
            titulo: `Nenhuma notícia${sobre} por enquanto`,
            texto: 'Veja as outras notícias enquanto isso.',
            botao: ['ver-todas', 'Ver todas']
        });
        semPaginas();
        return;
    }

    const totalPaginas = Math.ceil(lista.length / POR_PAGINA);
    estado.pagina = Math.min(Math.max(1, estado.pagina), totalPaginas);
    const inicio = (estado.pagina - 1) * POR_PAGINA;
    const primeiraPagina = estado.pagina === 1;

    // Na primeira página, em tela grande, a mais nova ganha destaque (o CSS
    // decide a partir de que largura).
    grade.classList.toggle('noticias-grade--destaque', primeiraPagina);
    grade.innerHTML = lista.slice(inicio, inicio + POR_PAGINA)
        .map((noticia, indice) => `<li>${cartao(noticia, primeiraPagina && indice === 0)}</li>`)
        .join('');

    renderizarPaginacao(paginacoes, estado.pagina, totalPaginas, irParaPagina);
}

function icone(nome, tamanho = 18) {
    return `<svg width="${tamanho}" height="${tamanho}" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONES[nome]}</svg>`;
}

// botao: [ação, texto]
function aviso({ icone: nomeDoIcone, titulo, texto, botao }) {
    return `
        <li class="noticias-estado">
            <span class="noticias-estado-icone">${icone(nomeDoIcone, 28)}</span>
            <h2>${escapeHtml(titulo)}</h2>
            <p>${escapeHtml(texto)}</p>
            ${botao ? `<button type="button" class="noticias-botao" data-acao="${botao[0]}">${escapeHtml(botao[1])}</button>` : ''}
        </li>`;
}

// A foto da notícia ou, quando não há foto, a capa desenhada.
function capa(noticia) {
    const foto = imagemSegura(noticia.imagem);
    const dentro = foto
        ? `<img src="${escapeHtml(foto)}" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer">`
        : capaDesenhada(noticia);
    return `<div class="noticia-capa" data-noticia="${escapeHtml(noticia.id)}">${dentro}</div>`;
}

// Foto que não carregou (endereço quebrado, site fora do ar): entra a capa
// desenhada no lugar.
function trocarFotoQuebrada(evento) {
    const caixa = evento.target instanceof HTMLImageElement ? evento.target.closest('.noticia-capa') : null;
    if (!caixa) return;
    const noticia = estado.noticias.find((n) => String(n.id) === caixa.dataset.noticia);
    caixa.innerHTML = capaDesenhada(noticia || {});
}

// Notícia escrita pelo próprio Futuro+ (painel Admin · Notícias próprias):
// card azul, e abre a matéria aqui mesmo, em noticia.html.
function cartaoProprio(noticia, maisRecente) {
    const resumo = String(noticia.resumo || '').trim();
    const quando = tempoRelativo(noticia.publicadaEm);
    const extras = (noticia.instituicoes || [])
        .filter((id) => id in ETIQUETAS)
        .map((id) => `<span class="noticia-etiqueta noticia-etiqueta--${id}">${ETIQUETAS[id]}</span>`)
        .join('');

    return `
        <a class="noticia-card noticia-card--propria" href="${escapeHtml(linkDaMateria(noticia.id))}">
            ${capa(noticia)}
            <div class="noticia-corpo">
                <div class="noticia-etiquetas">
                    ${maisRecente ? '<span class="noticia-recente">Mais recente</span>' : ''}
                    <span class="noticia-etiqueta noticia-etiqueta--propria">Notícia do Futuro+</span>
                    ${extras}
                </div>
                <h2 class="noticia-titulo">${escapeHtml(String(noticia.titulo || '').trim() || 'Notícia sem título')}</h2>
                ${resumo ? `<p class="noticia-resumo">${escapeHtml(resumo)}</p>` : ''}
                <div class="noticia-rodape">
                    <span class="noticia-fonte">Por ${escapeHtml(String(noticia.autor || '').trim() || 'Equipe Futuro+')}</span>
                    ${quando ? `<time class="noticia-data" datetime="${escapeHtml(noticia.publicadaEm)}"
                        title="${escapeHtml(dataCurta(noticia.publicadaEm))}">${escapeHtml(quando)}</time>` : ''}
                    <span class="noticia-sair">${icone('seguir', 16)}</span>
                </div>
            </div>
        </a>`;
}

// O cartão inteiro é o link para o site de origem. Sem um link válido, a
// notícia aparece, mas não é clicável.
function cartao(noticia, maisRecente) {
    if (noticia.propria) return cartaoProprio(noticia, maisRecente);
    const link = linkSeguro(noticia.link);
    const resumo = String(noticia.resumo || '').trim();
    const quando = tempoRelativo(noticia.publicadaEm);

    const etiquetas = rotulosDaNoticia(noticia)
        .map((rotulo) => `<span class="noticia-etiqueta noticia-etiqueta--${rotulo.id}">${escapeHtml(rotulo.texto)}</span>`)
        .join('');

    const conteudo = `
        ${capa(noticia)}
        <div class="noticia-corpo">
            <div class="noticia-etiquetas">
                ${maisRecente ? '<span class="noticia-recente">Mais recente</span>' : ''}
                ${etiquetas}
            </div>
            <h2 class="noticia-titulo">${escapeHtml(String(noticia.titulo || '').trim() || 'Notícia sem título')}</h2>
            ${resumo ? `<p class="noticia-resumo">${escapeHtml(resumo)}</p>` : ''}
            <div class="noticia-rodape">
                <span class="noticia-fonte">${escapeHtml(String(noticia.fonte || '').trim() || 'Fonte não informada')}</span>
                ${quando ? `<time class="noticia-data" datetime="${escapeHtml(noticia.publicadaEm)}"
                    title="${escapeHtml(dataCurta(noticia.publicadaEm))}">${escapeHtml(quando)}</time>` : ''}
                ${link ? `<span class="noticia-sair">${icone('sair', 16)}</span>` : ''}
            </div>
        </div>`;

    if (!link) return `<article class="noticia-card">${conteudo}</article>`;
    return `
        <a class="noticia-card" href="${escapeHtml(link)}" target="_blank" rel="noopener noreferrer">
            ${conteudo}
            <span class="noticias-so-leitor">Abre o site de origem em outra aba.</span>
        </a>`;
}
