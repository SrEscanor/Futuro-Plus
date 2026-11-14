// Funções puras usadas pela página Notícias e pelo painel Admin · Notícias.
// Nada aqui toca no Firebase, então dá para reaproveitar e testar à vontade.

// As etiquetas que uma notícia pode ter. Notícia sem nenhuma é geral do
// Centro Paula Souza (ver rotulosDaNoticia).
export const INSTITUICOES = { etec: 'Etec', fatec: 'Fatec' };

export function escapeHtml(texto) {
    return String(texto ?? '').replace(/[&<>"']/g, (c) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
}

// Título, link e imagem vêm de sites de fora (coleta automática). Um
// endereço só vira link se for http(s): "javascript:..." nunca passa.
export function linkSeguro(url) {
    try {
        const alvo = new URL(String(url || '').trim());
        return ['https:', 'http:'].includes(alvo.protocol) ? alvo.href : '';
    } catch {
        return '';
    }
}

// Imagem só por https (http seria barrada pelo navegador numa página https)
// ou vinda do próprio site.
export function imagemSegura(url) {
    const texto = String(url || '').trim();
    if (!texto) return '';
    try {
        const alvo = new URL(texto, location.href);
        if (alvo.protocol === 'https:' || alvo.origin === location.origin) return alvo.href;
    } catch {
        // endereço mal formado: fica sem imagem
    }
    return '';
}

// [{ id: 'etec', texto: 'Etec' }, ...]. Sem etiqueta nenhuma, a notícia é do
// Centro Paula Souza como um todo.
export function rotulosDaNoticia(noticia) {
    const rotulos = (noticia?.instituicoes || [])
        .filter((id) => id in INSTITUICOES)
        .map((id) => ({ id, texto: INSTITUICOES[id] }));
    return rotulos.length ? rotulos : [{ id: 'cps', texto: 'CPS' }];
}

// "cps.sp.gov.br" a partir do link, para mostrar de onde a notícia vem.
export function dominioDoLink(url) {
    try {
        return new URL(url).hostname.replace(/^www\./, '');
    } catch {
        return '';
    }
}

// "13 de nov. de 2026"
export function dataCurta(iso) {
    const data = new Date(iso || '');
    if (Number.isNaN(data.getTime())) return '';
    return data.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' });
}

// "há 3 horas", "ontem", "há 5 dias"; depois de uma semana, a data.
export function tempoRelativo(iso, agora = new Date()) {
    const data = new Date(iso || '');
    if (Number.isNaN(data.getTime())) return '';

    const minutos = Math.round((agora - data) / 60000);
    if (minutos < 60) return 'agora há pouco';
    const horas = Math.round(minutos / 60);
    if (horas < 24) return `há ${horas} ${horas === 1 ? 'hora' : 'horas'}`;
    const dias = Math.round(horas / 24);
    if (dias === 1) return 'ontem';
    if (dias <= 7) return `há ${dias} dias`;
    return dataCurta(iso);
}

// ========================================================
// Capa desenhada
// ========================================================
// Muita notícia chega sem imagem (as do Google Notícias, por exemplo) ou com
// uma imagem que não carrega. No lugar entra uma capa desenhada: a cor e o
// nome mudam com a etiqueta (Etec, Fatec ou CPS) e o enfeite do fundo tem
// três variações, escolhidas pelo id da notícia, para duas capas vizinhas da
// mesma etiqueta não saírem idênticas.
//
// É um SVG só, que não depende de folha de estilo: o mesmo desenho serve no
// cartão da página pública, na miniatura do painel e na prévia do formulário,
// em qualquer tamanho. O que importa (o nome) fica no meio, porque quando a
// caixa é mais quadrada que 16:9 as laterais são cortadas.

// cores: do lado escuro para o claro, como em capas-eixos.js.
const CAPAS = {
    etec: { cores: ['#8f2038', '#d94f62'], nome: 'Etec', legenda: 'Escola Técnica Estadual' },
    fatec: { cores: ['#25357e', '#4e6ee8'], nome: 'Fatec', legenda: 'Faculdade de Tecnologia' },
    cps: { cores: ['#222d44', '#4a5d82'], nome: 'CPS', legenda: 'Centro Paula Souza' }
};

// Formas brancas quase transparentes, num quadro de 320 x 180. O "+" é o do
// nome Futuro+.
const ENFEITES = [
    `<circle cx="52" cy="-8" r="74" fill="#fff" opacity=".07"/>
     <circle cx="296" cy="26" r="34" fill="#fff" opacity=".06"/>
     <path d="M0 146c56-18 104 16 164-4s104-22 156-4v42H0z" fill="#fff" opacity=".08"/>
     <path d="M0 162c64-14 122 12 188-2s92-12 132-2v22H0z" fill="#fff" opacity=".12"/>
     <path d="M258 62h12M264 56v12" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".45"/>`,
    `<circle cx="276" cy="-14" r="82" fill="#fff" opacity=".07"/>
     <circle cx="14" cy="64" r="30" fill="#fff" opacity=".06"/>
     <path d="M0 152c70 16 118-22 190-6s96 10 130-6v40H0z" fill="#fff" opacity=".08"/>
     <path d="M0 168c80 8 150-16 214-6s80 6 106 0v18H0z" fill="#fff" opacity=".12"/>
     <path d="M48 34h12M54 28v12" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".45"/>`,
    `<circle cx="34" cy="152" r="58" fill="none" stroke="#fff" stroke-width="16" opacity=".07"/>
     <circle cx="292" cy="18" r="46" fill="none" stroke="#fff" stroke-width="12" opacity=".07"/>
     <path d="M0 160c60-10 110 10 170 0s100-12 150 0v20H0z" fill="#fff" opacity=".1"/>
     <path d="M270 124h12M276 118v12" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".45"/>
     <circle cx="50" cy="38" r="4" fill="#fff" opacity=".35"/>`
];

// Um número que sai sempre igual para o mesmo texto.
function numeroDoTexto(texto) {
    let numero = 0;
    for (const letra of String(texto ?? '')) numero = (numero * 31 + letra.codePointAt(0)) % 9973;
    return numero;
}

// 'etec', 'fatec' ou 'cps'. Notícia das duas (ou de nenhuma) é do Centro
// Paula Souza como um todo.
export function tipoDaCapa(noticia) {
    const rotulos = rotulosDaNoticia(noticia);
    return rotulos.length === 1 ? rotulos[0].id : 'cps';
}

// O SVG da capa desenhada, pronto para entrar no HTML. Quem usa só precisa
// dar tamanho a ".noticia-arte" (largura e altura de 100% da caixa).
export function capaDesenhada(noticia) {
    const tipo = tipoDaCapa(noticia);
    const { cores, nome, legenda } = CAPAS[tipo];
    const enfeite = ENFEITES[numeroDoTexto(noticia?.id || noticia?.titulo) % ENFEITES.length];
    return `<svg class="noticia-arte" data-capa="${tipo}" viewBox="0 0 320 180" preserveAspectRatio="xMidYMid slice"
        style="background:linear-gradient(120deg,${cores[0]},${cores[1]})" aria-hidden="true" focusable="false">
        ${enfeite}
        <text x="160" y="97" text-anchor="middle" fill="#fff" font-family="Sora, 'Segoe UI', Arial, sans-serif"
            font-size="54" font-weight="700" letter-spacing="-1.5">${nome}</text>
        <text x="160" y="119" text-anchor="middle" fill="#fff" opacity=".9" font-family="Inter, 'Segoe UI', Arial, sans-serif"
            font-size="10.5" font-weight="600" letter-spacing=".2">${legenda}</text>
    </svg>`;
}
