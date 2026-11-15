// "Destaques para você" na Início: um carrossel de até 3 destaques, cada um
// com imagem, etiqueta, título, texto e botão.
//
// Por enquanto os destaques são fixos (DESTAQUES_PADRAO) e só apontam para
// partes do próprio site. Quando a parte lógica existir (por exemplo,
// destaques cadastrados no painel), é só chamar montarDestaques(lista) com
// itens neste formato:
//
//   { etiqueta: 'Instituições', titulo: '...', texto: '...',
//     imagem: 'https://...' ou '/arquivo.webp', link: 'pagina.html' ou 'https://...',
//     botao: 'Saiba mais' }
//
// A imagem aparece cortada em 16:9; botao vazio vira "Saiba mais"; sem link,
// o destaque fica sem botão. Lista vazia mantém os destaques padrão.
import { escapeHtml } from './card-unidade.js';

export const DESTAQUES_PADRAO = [
    {
        etiqueta: 'Testes',
        titulo: 'Descubra a área que combina com você',
        texto: 'Faça um teste e veja cursos de verdade das Etecs e Fatecs ligados ao seu perfil.',
        imagem: '/cerebro-testes.webp',
        link: 'testes.html',
        botao: 'Fazer um teste'
    },
    {
        etiqueta: 'Cursos',
        titulo: 'Conheça os cursos técnicos e superiores',
        texto: 'Veja o que se aprende em cada curso, quanto tempo dura e onde estudar.',
        imagem: '/cursos-formatura.webp',
        link: 'cursos.html',
        botao: 'Ver cursos'
    },
    {
        etiqueta: 'Instituições',
        titulo: 'Encontre uma Etec ou Fatec perto de você',
        texto: 'Busque as unidades do Centro Paula Souza e os cursos de cada uma.',
        imagem: '/central-cps.webp',
        link: 'instituicoes.html',
        botao: 'Ver instituições'
    }
];

const MAXIMO = 3;
const INTERVALO = 8000;

const secao = document.getElementById('destaques-inicio');
const trilho = document.getElementById('destaques-trilho');
const pontos = document.getElementById('destaques-pontos');
const anterior = document.getElementById('destaques-anterior');
const proximo = document.getElementById('destaques-proximo');
const menosMovimento = matchMedia('(prefers-reduced-motion: reduce)');

let total = 0;
let atual = 0;
let pausado = false;     // mouse em cima ou foco dentro do carrossel
let parouDeVez = false;  // a pessoa já mexeu: não troca mais sozinho

// Só endereço da web ou página do próprio site; nada de "javascript:".
function linkSeguro(link) {
    const texto = String(link || '').trim();
    if (/^https?:\/\//i.test(texto)) return texto;
    if (texto && !texto.includes(':') && !texto.startsWith('//')) return texto;
    return '';
}

function slide(destaque, indice, quantos) {
    const link = linkSeguro(destaque.link);
    const imagem = String(destaque.imagem || '').trim();
    return `
        <article class="destaque" role="group" aria-roledescription="destaque" aria-label="${indice + 1} de ${quantos}">
            <div class="destaque-imagem">
                ${imagem ? `<img src="${escapeHtml(imagem)}" alt="" decoding="async">` : ''}
                ${destaque.etiqueta ? `<span class="destaque-etiqueta">${escapeHtml(destaque.etiqueta)}</span>` : ''}
            </div>
            <div class="destaque-texto">
                <h4 class="destaque-titulo-item">${escapeHtml(destaque.titulo || '')}</h4>
                ${destaque.texto ? `<p>${escapeHtml(destaque.texto)}</p>` : ''}
                ${link ? `<a class="destaque-botao" href="${escapeHtml(link)}">${escapeHtml(destaque.botao || 'Saiba mais')}
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg></a>` : ''}
            </div>
        </article>`;
}

function marcarPonto() {
    pontos.querySelectorAll('.destaques-ponto').forEach((ponto, indice) => {
        ponto.setAttribute('aria-current', indice === atual ? 'true' : 'false');
    });
}

function irPara(indice, animar = true) {
    if (!total) return;
    atual = (indice + total) % total;
    trilho.scrollTo({
        left: atual * trilho.clientWidth,
        behavior: animar && !menosMovimento.matches ? 'smooth' : 'auto'
    });
    marcarPonto();
}

export function montarDestaques(lista) {
    if (!secao || !trilho) return;
    const itens = (Array.isArray(lista) && lista.length ? lista : DESTAQUES_PADRAO).slice(0, MAXIMO);
    total = itens.length;
    trilho.innerHTML = itens.map((destaque, indice) => slide(destaque, indice, total)).join('');
    pontos.innerHTML = itens.map((_, indice) => `
        <button type="button" class="destaques-ponto" data-indice="${indice}"
            aria-label="Ver o destaque ${indice + 1} de ${total}"></button>`).join('');
    const umSo = total < 2;
    pontos.hidden = umSo;
    anterior.hidden = umSo;
    proximo.hidden = umSo;
    irPara(0, false);
}

if (secao && trilho) {
    // Arrastou com o dedo ou o trackpad: descobre qual destaque ficou na tela.
    let quadro = 0;
    trilho.addEventListener('scroll', () => {
        cancelAnimationFrame(quadro);
        quadro = requestAnimationFrame(() => {
            const indice = Math.round(trilho.scrollLeft / Math.max(1, trilho.clientWidth));
            if (indice !== atual && indice < total) {
                atual = indice;
                marcarPonto();
            }
        });
    });

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

    montarDestaques(DESTAQUES_PADRAO);
}
