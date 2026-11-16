// "Destaques para você" na Início: um carrossel de até 3 destaques, cada um
// com imagem, etiqueta, título, texto e botão.
//
// Quem escolhe é o painel Admin · Notícias (aba No site, botão Destacar): as
// notícias escolhidas vêm primeiro, na ordem de lá, e as vagas que sobram
// mostram os destaques padrão (DESTAQUES_PADRAO, em destaques-util.js, que
// também tem o formato de cada destaque). Enquanto a lista chega aparece um
// esqueleto; com erro ou sem resposta em 5 s, ficam os destaques padrão.
// Custa 1 leitura do Firestore por visita, mais 1 por notícia escolhida.
//
// A imagem aparece cortada em 16:9; botao vazio vira "Saiba mais"; sem link,
// o destaque fica sem botão. Notícia sem foto (ou com foto que não carrega)
// mostra a capa desenhada, como na página Notícias.
import { listarDestaquesDaInicio } from './noticias-dados.js';
import { MAXIMO_DESTAQUES, destaquesDoCarrossel } from './destaques-util.js';
import { escapeHtml } from './noticias-util.js';

const INTERVALO = 8000;
const ESPERA_MAXIMA = 5000;

const secao = document.getElementById('destaques-inicio');
const trilho = document.getElementById('destaques-trilho');
const pontos = document.getElementById('destaques-pontos');
const anterior = document.getElementById('destaques-anterior');
const proximo = document.getElementById('destaques-proximo');
const menosMovimento = matchMedia('(prefers-reduced-motion: reduce)');

let destaquesNaTela = [];
let total = 0;
let atual = 0;
let pausado = false;     // mouse em cima ou foco dentro do carrossel
let parouDeVez = false;  // a pessoa já mexeu: não troca mais sozinho

const ICONE_SEGUIR = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"
    stroke-linejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg>`;
// o mesmo "abre outro site" da página Notícias
const ICONE_SAIR = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"
    stroke-linejoin="round" aria-hidden="true"><path d="M18 13.5V18a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4.5M14 4h6v6M20 4l-9 9" /></svg>`;

// Do mesmo tamanho de um destaque, para nada pular quando a lista chega.
const ESQUELETO = `
    <article class="destaque destaque--esqueleto" aria-hidden="true">
        <div class="destaque-imagem"></div>
        <div class="destaque-texto">
            <span class="destaque-esqueleto-linha destaque-esqueleto-linha--curta"></span>
            <span class="destaque-esqueleto-linha"></span>
            <span class="destaque-esqueleto-linha destaque-esqueleto-linha--media"></span>
        </div>
    </article>`;

// Só endereço da web ou página do próprio site; nada de "javascript:".
function linkDoDestaque(link) {
    const texto = String(link || '').trim();
    if (/^https?:\/\//i.test(texto)) return texto;
    if (texto && !texto.includes(':') && !texto.startsWith('//')) return texto;
    return '';
}

function botaoHtml(destaque, link) {
    const texto = escapeHtml(destaque.botao || 'Saiba mais');
    // notícia de outro site abre em outra aba, como na página Notícias
    if (destaque.externo && /^https?:/i.test(link)) {
        return `<a class="destaque-botao" href="${escapeHtml(link)}" target="_blank" rel="noopener noreferrer">${texto}
            ${ICONE_SAIR}<span class="so-leitor"> (abre o site de origem em outra aba)</span></a>`;
    }
    return `<a class="destaque-botao" href="${escapeHtml(link)}">${texto} ${ICONE_SEGUIR}</a>`;
}

function slide(destaque, indice, quantos) {
    const link = linkDoDestaque(destaque.link);
    const imagem = String(destaque.imagem || '').trim();
    // a capa desenhada é um SVG feito por capaDesenhada(), sem nada de fora
    const capa = imagem
        ? `<img src="${escapeHtml(imagem)}" alt="" decoding="async"${destaque.arte ? ' referrerpolicy="no-referrer"' : ''}>`
        : destaque.arte || '';
    return `
        <article class="destaque" role="group" aria-roledescription="destaque" aria-label="${indice + 1} de ${quantos}"
            data-indice="${indice}">
            <div class="destaque-imagem">
                ${capa}
                ${destaque.etiqueta ? `<span class="destaque-etiqueta">${escapeHtml(destaque.etiqueta)}</span>` : ''}
            </div>
            <div class="destaque-texto">
                <h4 class="destaque-titulo-item">${escapeHtml(destaque.titulo || '')}</h4>
                ${destaque.texto ? `<p>${escapeHtml(destaque.texto)}</p>` : ''}
                ${destaque.meta ? `<span class="destaque-meta">${escapeHtml(destaque.meta)}</span>` : ''}
                ${link ? botaoHtml(destaque, link) : ''}
            </div>
        </article>`;
}

function marcarPonto() {
    pontos.querySelectorAll('.destaques-ponto').forEach((ponto, indice) => {
        ponto.setAttribute('aria-current', indice === atual ? 'true' : 'false');
    });
}

// De um destaque para o outro: a largura do trilho mais o vão entre eles
// (inicio.css), medida na tela para valer em qualquer zoom.
function passo() {
    const [primeiro, segundo] = trilho.children;
    if (!segundo) return Math.max(1, trilho.clientWidth);
    return Math.max(1, segundo.getBoundingClientRect().left - primeiro.getBoundingClientRect().left);
}

function irPara(indice, animar = true) {
    if (!total) return;
    atual = (indice + total) % total;
    trilho.scrollTo({
        left: atual * passo(),
        behavior: animar && !menosMovimento.matches ? 'smooth' : 'auto'
    });
    marcarPonto();
}

function mostrarControles(mostrar) {
    pontos.hidden = !mostrar;
    anterior.hidden = !mostrar;
    proximo.hidden = !mostrar;
}

// lista: destaques no formato de destaques-util.js. Vazia, ficam os padrão.
export function montarDestaques(lista) {
    if (!secao || !trilho) return;
    const itens = (Array.isArray(lista) && lista.length ? lista : destaquesDoCarrossel([])).slice(0, MAXIMO_DESTAQUES);
    destaquesNaTela = itens;
    total = itens.length;
    trilho.removeAttribute('aria-busy');
    trilho.innerHTML = itens.map((destaque, indice) => slide(destaque, indice, total)).join('');
    pontos.innerHTML = itens.map((_, indice) => `
        <button type="button" class="destaques-ponto" data-indice="${indice}"
            aria-label="Ver o destaque ${indice + 1} de ${total}"></button>`).join('');
    mostrarControles(total > 1);
    irPara(0, false);
}

function mostrarEsqueleto() {
    destaquesNaTela = [];
    total = 0;
    trilho.setAttribute('aria-busy', 'true');
    trilho.innerHTML = ESQUELETO;
    pontos.innerHTML = '';
    mostrarControles(false);
}

async function carregar() {
    mostrarEsqueleto();
    let noticias = [];
    try {
        noticias = await Promise.race([
            listarDestaquesDaInicio(),
            new Promise((_, desistir) => {
                setTimeout(() => desistir(new Error('a lista demorou demais para chegar')), ESPERA_MAXIMA);
            })
        ]);
    } catch (erro) {
        console.error('Erro ao carregar os destaques da Início:', erro);
    }
    montarDestaques(destaquesDoCarrossel(noticias));
}

if (secao && trilho) {
    // Arrastou com o dedo ou o trackpad: descobre qual destaque ficou na tela.
    let quadro = 0;
    trilho.addEventListener('scroll', () => {
        cancelAnimationFrame(quadro);
        quadro = requestAnimationFrame(() => {
            const indice = Math.round(trilho.scrollLeft / passo());
            if (indice !== atual && indice < total) {
                atual = indice;
                marcarPonto();
            }
        });
    });

    // Foto de notícia que não carregou (endereço quebrado, site fora do ar):
    // entra a capa desenhada. O "error" de imagem não sobe, por isso a captura.
    trilho.addEventListener('error', (evento) => {
        const foto = evento.target;
        if (!(foto instanceof HTMLImageElement)) return;
        const destaque = destaquesNaTela[Number(foto.closest('.destaque')?.dataset.indice)];
        if (!destaque?.arte) return;
        foto.insertAdjacentHTML('beforebegin', destaque.arte);
        foto.remove();
    }, true);

    const interagiu = () => { parouDeVez = true; };
    anterior.addEventListener('click', () => { interagiu(); irPara(atual - 1); });
    proximo.addEventListener('click', () => { interagiu(); irPara(atual + 1); });
    pontos.addEventListener('click', (evento) => {
        const ponto = evento.target.closest('.destaques-ponto');
        if (!ponto) return;
        interagiu();
        irPara(Number(ponto.dataset.indice));
    });
    trilho.addEventListener('pointerdown', interagiu);
    trilho.addEventListener('wheel', (evento) => {
        if (Math.abs(evento.deltaX) > Math.abs(evento.deltaY)) interagiu();
    }, { passive: true });

    secao.addEventListener('mouseenter', () => { pausado = true; });
    secao.addEventListener('mouseleave', () => { pausado = false; });
    secao.addEventListener('focusin', () => { pausado = true; });
    secao.addEventListener('focusout', (evento) => {
        if (!secao.contains(evento.relatedTarget)) pausado = false;
    });

    // Troca sozinho a cada 8 s, como vitrine. Não troca com o mouse ou o foco
    // nele, com a aba escondida, para quem pediu menos movimento no sistema,
    // nem depois que a pessoa mexeu no carrossel.
    setInterval(() => {
        if (parouDeVez || pausado || document.hidden || menosMovimento.matches || total < 2) return;
        irPara(atual + 1);
    }, INTERVALO);

    // A janela mudou de tamanho: o destaque da vez continua enquadrado.
    addEventListener('resize', () => irPara(atual, false));

    carregar();
}
