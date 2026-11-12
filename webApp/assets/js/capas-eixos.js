// Capa padronizada de cada eixo tecnológico, usada no topo da página do curso.
//
// Todo eixo tem uma capa desenhada: mesma composição, com a cor e o ícone do
// eixo. No painel Admin · Cursos dá para enviar uma imagem por eixo, que
// passa a valer no lugar do desenho para todos os cursos daquele eixo; o
// endereço de cada uma fica em configuracoes/capas.
import { db } from './firebase-config.js';
import { doc, getDoc } from 'firebase/firestore';

// Tamanho que o painel recomenda para as imagens. A capa aparece larga e
// baixa (de 2,5 a 5 vezes mais larga que alta, conforme a tela) e a imagem é
// cortada para caber, então o assunto principal precisa estar no centro.
export const CAPA_RECOMENDADA = { largura: 1600, altura: 500 };

// "Informação e Comunicação" -> "informacao-e-comunicacao"
export function slugDoEixo(eixo) {
    return (eixo || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

// Imagens enviadas pelo painel: { slug do eixo: endereço }. Sem conexão ou
// sem nenhuma imagem enviada, devolve {} e a página usa as capas desenhadas.
export async function carregarFotosDosEixos() {
    try {
        const snap = await getDoc(doc(db, 'configuracoes', 'capas'));
        const eixos = snap.exists() ? (snap.data().eixos || {}) : {};
        return Object.fromEntries(Object.entries(eixos)
            .filter(([, capa]) => capa?.url)
            .map(([slug, capa]) => [slug, capa.url]));
    } catch (erro) {
        console.warn('Não foi possível carregar as capas dos eixos:', erro);
        return {};
    }
}

// cores: do lado escuro (onde fica o nome do eixo, em branco) para o claro.
// icone: traços num quadro de 24 x 24.
const PADRAO = {
    cores: ['#25357e', '#4e6ee8'],
    icone: '<path d="m2 9 10-5 10 5-10 5z"/><path d="M6 11.5V16c0 1.5 2.7 3 6 3s6-1.5 6-3v-4.5M22 9v5"/>'
};

const EIXOS = {
    'ambiente-e-saude': {
        cores: ['#0b6b63', '#1fa890'],
        icone: '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/><path d="M8 11.5h2.2l1-2.2 1.6 4.4 1-2.2H16"/>'
    },
    'controle-e-processos-industriais': {
        cores: ['#2f3f7d', '#5a73c7'],
        icone: '<circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="6.5"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1"/>'
    },
    'desenvolvimento-educacional-e-social': {
        cores: ['#5a3299', '#8a63d2'],
        icone: '<circle cx="9" cy="8" r="3"/><path d="M3 20a6 6 0 0 1 12 0M16 5.2a3 3 0 0 1 0 5.6M17 14.3a6 6 0 0 1 4 5.7"/>'
    },
    'gestao-e-negocios': {
        cores: ['#25357e', '#4e6ee8'],
        icone: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 13h18"/>'
    },
    'informacao-e-comunicacao': {
        cores: ['#17458f', '#2e86d6'],
        icone: '<path d="m8 8-4 4 4 4M16 8l4 4-4 4M13.5 5l-3 14"/>'
    },
    'infraestrutura': {
        cores: ['#7a4a12', '#bd8126'],
        icone: '<path d="M4 21V6l8-3v18M12 9l8 2v10M2 21h20M7.5 9h.01M7.5 13h.01M7.5 17h.01M16 14h.01M16 17.5h.01"/>'
    },
    'producao-alimenticia': {
        cores: ['#a03d20', '#dc6b3a'],
        icone: '<path d="M7 3v8M4.5 3v4.5a2.5 2.5 0 0 0 5 0V3M7 11v10M17 3c-2 1.5-3 4-3 7h3zM17 3v18"/>'
    },
    'producao-cultural-e-design': {
        cores: ['#962b6f', '#d4539f'],
        icone: '<path d="M12 3a9 9 0 1 0 0 18c1.4 0 2-1 2-2 0-1.4-1-1.6-1-2.8 0-1 .8-1.7 1.8-1.7H17a4 4 0 0 0 4-4c0-4.2-4-7.5-9-7.5z"/><path d="M7.5 12h.01M9.5 8h.01M14 7h.01"/>'
    },
    'producao-industrial': {
        cores: ['#225a69', '#3f97ab'],
        icone: '<path d="M3 21V10l6 4v-4l6 4V5h4v16zM3 21h18M7.5 17.5h.01M12 17.5h.01M16.5 17.5h.01"/>'
    },
    'recursos-naturais': {
        cores: ['#256b2d', '#4fa043'],
        icone: '<path d="M5 19c0-8 5-13 15-14 0 9-4 14.5-12 14.5M5 19c2-5 5.5-8 10-10M5 19v2"/>'
    },
    'seguranca': {
        cores: ['#222d44', '#4a5d82'],
        icone: '<path d="M12 3 5 6v5.5c0 4.5 3 8 7 9.5 4-1.5 7-5 7-9.5V6z"/><path d="m9 12 2.2 2.2L15 10.5"/>'
    },
    'turismo-hospitalidade-e-lazer': {
        cores: ['#0b6f90', '#27a9c6'],
        icone: '<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5z"/>'
    }
};

// fotos: o que carregarFotosDosEixos() devolveu.
// Devolve { slug, foto, cores, icone }; "foto" é null enquanto ninguém enviou
// uma imagem para o eixo.
export function capaDoEixo(eixo, fotos = {}) {
    const slug = slugDoEixo(eixo);
    const desenho = EIXOS[slug] || PADRAO;
    return { slug, foto: fotos[slug] || null, ...desenho };
}
