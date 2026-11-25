// O carrossel "Destaques para você" da Início: até 3 destaques. As notícias
// escolhidas no painel Admin · Notícias (aba No site, botão Destacar) vêm
// primeiro, na ordem de lá; as vagas que sobram mostram os destaques padrão,
// na ordem deles. Funções puras: a Início, o painel e os roteiros de teste
// usam as mesmas.
//
// No Firestore (configuracoes/destaques_inicio, ver noticias-dados.js) fica
// só a lista { itens: [{ id, titulo }] }. O título guardado serve para o
// painel e o histórico dizerem qual era a notícia mesmo depois que ela sai do
// site; o carrossel sempre mostra a notícia como ela está no site agora.
//
// As fixadas da página Notícias funcionam do mesmo jeito: até 5, escolhidas
// com o botão Fixar (painel Notícias, aba No site, ou Blog), em
// configuracoes/noticias_fixadas, no mesmo formato. Elas abrem a lista da
// página, na ordem de lá, antes das outras.
import { capaDesenhada, imagemSegura, linkSeguro, rotulosDaNoticia, tempoRelativo } from './noticias-util.js';
import { linkDaMateria } from './noticias-proprias-util.js';

export const MAXIMO_DESTAQUES = 3;
export const MAXIMO_FIXADAS = 5;

// Onde cada lista fica no Firestore: doc(db, ...DOC_DESTAQUES)
export const DOC_DESTAQUES = ['configuracoes', 'destaques_inicio'];
export const DOC_FIXADAS = ['configuracoes', 'noticias_fixadas'];

// O que muda de uma lista para a outra: o tamanho, o nome da ação de pôr
// na lista e o que vai para o histórico (noticias_historico).
const LISTAS = {
    destaques: {
        maximo: MAXIMO_DESTAQUES,
        entrar: 'destacar',
        historico: { entrou: 'destacou', saiu: 'tirou_destaque', ordem: 'reordenou' },
        cheia: `O carrossel da Início já tem ${MAXIMO_DESTAQUES} notícias. Tire uma delas para destacar esta.`
    },
    fixadas: {
        maximo: MAXIMO_FIXADAS,
        entrar: 'fixar',
        historico: { entrou: 'fixou', saiu: 'desafixou', ordem: 'reordenou_fixadas' },
        cheia: `A página Notícias já tem ${MAXIMO_FIXADAS} notícias fixadas. Desafixe uma delas para fixar esta.`
    }
};

// Os destaques de sempre, que apontam para partes do próprio site. Cada
// destaque do carrossel tem este formato (o das notícias também, ver
// destaqueDaNoticia):
//
//   { etiqueta, titulo, texto, imagem: '/arquivo.webp' ou 'https://...',
//     link: 'pagina.html' ou 'https://...', botao: 'Saiba mais' }
//
// e, só nas notícias: meta (fonte e data), arte (a capa desenhada, que entra
// quando não há foto ou ela não carrega) e externo (abre em outra aba).
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

const LIMITE_TITULO = 200;

// A lista guardada, limpa: sem id vazio nem repetido, no máximo `maximo`.
function itensDaLista(lista, maximo) {
    const vistos = new Set();
    return (Array.isArray(lista) ? lista : [])
        .map((item) => ({
            id: String(item?.id ?? '').trim(),
            titulo: String(item?.titulo || '').trim().slice(0, LIMITE_TITULO)
        }))
        .filter((item) => {
            if (!item.id || vistos.has(item.id)) return false;
            vistos.add(item.id);
            return true;
        })
        .slice(0, maximo);
}

// no máximo 3 no carrossel e 5 fixadas
export const itensDosDestaques = (lista) => itensDaLista(lista, MAXIMO_DESTAQUES);
export const itensDasFixadas = (lista) => itensDaLista(lista, MAXIMO_FIXADAS);

// A notícia está no site agora? A notícia própria agendada já está na
// coleção do site, mas só aparece quando chega a hora (publicarEm).
export function estaNoSite(noticia, agora = new Date()) {
    if (!noticia) return false;
    return !noticia.publicarEm || String(noticia.publicarEm) <= agora.toISOString();
}

// Uma mudança feita no painel numa das listas ('destaques' ou 'fixadas').
// acao: 'destacar' (carrossel) ou 'fixar' (fixadas), 'tirar', 'antes' ou
// 'depois'; opcoes.motivo vai para o histórico no lugar do detalhe padrão
// ("saiu do site", por exemplo). Devolve { itens, titulo, acao, detalhe } —
// acao e detalhe são os do histórico — ou null quando nada muda (a notícia
// já estava lá, já é a primeira...). Lista cheia dá erro.
function mudarLista(qual, itens, acao, noticia, { motivo = '' } = {}) {
    const regras = LISTAS[qual];
    const lista = itensDaLista(itens, regras.maximo);
    const id = String(noticia?.id ?? '').trim();
    const posicao = lista.findIndex((item) => item.id === id);
    const titulo = String(noticia?.titulo || '').trim().slice(0, LIMITE_TITULO)
        || lista[posicao]?.titulo || '';
    if (!id) return null;

    if (acao === regras.entrar) {
        if (posicao !== -1) return null;
        if (lista.length >= regras.maximo) throw new Error(regras.cheia);
        return {
            itens: [...lista, { id, titulo }],
            titulo,
            acao: regras.historico.entrou,
            detalhe: motivo || `na vaga ${lista.length + 1}`
        };
    }

    if (posicao === -1) return null;

    if (acao === 'tirar') {
        return {
            itens: lista.filter((item) => item.id !== id),
            titulo,
            acao: regras.historico.saiu,
            detalhe: motivo || `estava na vaga ${posicao + 1}`
        };
    }

    const passo = { antes: -1, depois: 1 }[acao];
    const destino = posicao + (passo || 0);
    if (!passo || destino < 0 || destino >= lista.length) return null;
    const nova = [...lista];
    [nova[posicao], nova[destino]] = [nova[destino], nova[posicao]];
    return {
        itens: nova,
        titulo,
        acao: regras.historico.ordem,
        detalhe: motivo || `da vaga ${posicao + 1} para a ${destino + 1}`
    };
}

// acao: 'destacar', 'tirar', 'antes' ou 'depois'
export const mudarListaDeDestaques = (itens, acao, noticia, opcoes) => mudarLista('destaques', itens, acao, noticia, opcoes);
// acao: 'fixar', 'tirar', 'antes' ou 'depois'
export const mudarListaDeFixadas = (itens, acao, noticia, opcoes) => mudarLista('fixadas', itens, acao, noticia, opcoes);

// Notícia do Futuro+ que sai do site (painel Notícias próprias) sai junto do
// carrossel da Início e das fixadas da página Notícias. No histórico dela a
// ação ganha o complemento: "tirou do site e do carrossel da Início",
// "excluiu e tirou das fixadas da página Notícias". saiu: { carrossel,
// fixadas }, de onde ela saiu (sem nenhum, o detalhe fica como estava).
export function detalheComSaidaDasListas(acaoHistorico, detalhe = '', { carrossel = false, fixadas = false } = {}) {
    const listas = [carrossel && 'do carrossel da Início', fixadas && 'das fixadas da página Notícias'].filter(Boolean);
    if (!listas.length) return detalhe;
    const extra = `${acaoHistorico === 'despublicou' ? 'e' : 'e tirou'} ${listas.join(' e ')}`;
    return detalhe ? `${detalhe}, ${extra}` : extra;
}

// Uma notícia no formato de destaque do carrossel. A do Futuro+ abre a
// matéria aqui no site; as outras, o site de origem em outra aba.
export function destaqueDaNoticia(noticia) {
    const propria = Boolean(noticia?.propria);
    const rotulos = rotulosDaNoticia(noticia).map((rotulo) => rotulo.texto).join(' e ');
    // "há 3 horas", "ontem"; depois de uma semana, a data
    const quando = tempoRelativo(noticia?.publicadaEm);
    // a do Futuro+ já diz de onde vem na etiqueta: "Publicada ontem"
    const publicada = quando ? `Publicada ${/^\d/.test(quando) ? `em ${quando}` : quando}` : '';
    return {
        etiqueta: propria ? 'Notícia do Futuro+' : `Notícia · ${rotulos}`,
        titulo: String(noticia?.titulo || '').trim() || 'Notícia sem título',
        texto: String(noticia?.resumo || '').trim(),
        meta: propria ? publicada : [String(noticia?.fonte || '').trim(), quando].filter(Boolean).join(' · '),
        imagem: imagemSegura(noticia?.imagem),
        arte: capaDesenhada(noticia || {}),
        link: propria ? linkDaMateria(String(noticia?.id ?? '')) : linkSeguro(noticia?.link),
        externo: !propria,
        botao: 'Ler a notícia'
    };
}

// Os destaques do carrossel, na ordem: as notícias (só as que estão no site)
// e, nas vagas que sobram, os destaques padrão.
export function destaquesDoCarrossel(noticias = [], agora = new Date()) {
    const dasNoticias = (Array.isArray(noticias) ? noticias : [])
        .filter((noticia) => estaNoSite(noticia, agora))
        .slice(0, MAXIMO_DESTAQUES)
        .map(destaqueDaNoticia);
    return [...dasNoticias, ...DESTAQUES_PADRAO.slice(0, MAXIMO_DESTAQUES - dasNoticias.length)];
}
