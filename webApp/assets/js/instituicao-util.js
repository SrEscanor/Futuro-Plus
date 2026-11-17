// Regras e textos da página de uma instituição (instituicao.html), sem
// Firebase, para dar para testar no Node. Quem desenha a página é
// instituicao-visao.js; quem lê e grava no banco é instituicao-dados.js.
import { modalidadeDaCategoria, normalizar, ordemDaModalidade, paginaDoCurso } from './card-unidade.js';

// Tamanhos aceitos. As regras do Firestore repetem os mesmos números.
export const LIMITES = {
    comentario: { min: 10, max: 600 },
    pergunta: { min: 10, max: 300 },
    resposta: { min: 5, max: 600 }
};

export const COMENTARIOS_POR_VEZ = 5;
export const PERGUNTAS_POR_VEZ = 5;
export const CURSOS_VISIVEIS = 8;

// Capa das unidades que ainda não têm foto no site do CPS
export const FOTO_PADRAO = '/central-cps.webp';


// Link no texto vira propaganda: comentário, pergunta e resposta não aceitam.
const TEM_LINK = /(https?:\/\/|www\.|\b[\w-]+\.(com|net|org|br|io|me|ly|gg)\b)/i;

export function problemaNoTexto(texto, { min, max }) {
    const limpo = String(texto || '').trim();
    if (limpo.length < min) return `Escreva pelo menos ${min} caracteres.`;
    if (limpo.length > max) return `Use no máximo ${max} caracteres.`;
    if (TEM_LINK.test(limpo)) return 'Tire o link do texto: aqui só vale texto.';
    return '';
}

export function primeiroNome(nome) {
    return String(nome || '').trim().split(/\s+/)[0] || '';
}

function artigoDaUnidade(unidade) {
    const tipo = (unidade.tipo || '').trim().toLowerCase();
    return tipo === 'etec' || tipo === 'fatec' ? 'A ' : '';
}

function comPonto(frase) {
    const limpa = String(frase || '').trim();
    return !limpa || /[.!?]$/.test(limpa) ? limpa : `${limpa}.`;
}

// Cada curso uma vez só, com as modalidades em que a unidade oferece
// (o mesmo nome pode vir como técnico e como médio integrado).
export function cursosDaUnidade(unidade) {
    const tipo = (unidade.tipo || '').trim();
    const porNome = new Map();
    for (const curso of unidade.cursos || []) {
        if (!curso?.nome) continue;
        const chave = normalizar(curso.nome);
        if (!porNome.has(chave)) {
            porNome.set(chave, { nome: curso.nome.trim(), slug: paginaDoCurso(curso.nome, tipo), modalidades: [] });
        }
        const modalidade = modalidadeDaCategoria(curso.categoria || '');
        const item = porNome.get(chave);
        if (!item.modalidades.some((m) => m.chave === modalidade.chave)) {
            item.modalidades.push({ chave: modalidade.chave, rotulo: modalidade.rotulo });
        }
    }
    const lista = [...porNome.values()];
    lista.forEach((c) => c.modalidades.sort((a, b) => ordemDaModalidade(a.chave) - ordemDaModalidade(b.chave)));
    return lista.sort((a, b) => ordemDaModalidade(a.modalidades[0].chave) - ordemDaModalidade(b.modalidades[0].chave)
        || a.nome.localeCompare(b.nome, 'pt-BR'));
}

function juntar(itens) {
    if (itens.length <= 1) return itens.join('');
    return `${itens.slice(0, -1).join(', ')} e ${itens.at(-1)}`;
}

// Os três selos do topo: nível, pública e forma das aulas.
export function selosDaUnidade(unidade, cursos = cursosDaUnidade(unidade)) {
    const chaves = new Set(cursos.flatMap((c) => c.modalidades.map((m) => m.chave)));
    const tipo = (unidade.tipo || '').trim().toLowerCase();
    const niveis = [];
    if (tipo === 'fatec' || chaves.has('superior')) niveis.push('Ensino Superior');
    if (['tecnico', 'especializacao', 'medio', 'ams', 'semipresencial', 'ead'].some((k) => chaves.has(k)) && tipo !== 'fatec') {
        niveis.push('Técnico');
    }
    if ((chaves.has('medio') || chaves.has('ams')) && tipo !== 'fatec') niveis.push('Ensino Médio');

    const categorias = (unidade.cursos || []).map((c) => normalizar(c?.categoria));
    const distancia = categorias.some((c) => /\b(ead|online|distancia)\b/.test(c));
    const semi = categorias.some((c) => c.includes('semipresencial'));
    const presencial = categorias.some((c) => !/\b(ead|online|distancia)\b/.test(c) && !c.includes('semipresencial'));
    const formas = [presencial && 'Presencial', semi && 'Semipresencial', distancia && 'EaD'].filter(Boolean);

    return [
        niveis.length ? { icone: 'nivel', texto: juntar(niveis) } : null,
        tipo === 'etec' || tipo === 'fatec' ? { icone: 'publica', texto: 'Pública e gratuita' } : null,
        formas.length ? { icone: 'forma', texto: juntar(formas) } : null
    ].filter(Boolean);
}

const MODALIDADE_NO_TEXTO = {
    medio: 'ensino médio com técnico',
    tecnico: 'cursos técnicos',
    especializacao: 'especialização técnica',
    ead: 'cursos a distância',
    semipresencial: 'cursos semipresenciais',
    ams: 'AMS (médio, técnico e superior em sequência)',
    superior: 'cursos superiores de tecnologia'
};

// Parágrafo do "Sobre": só o que o cadastro sabe, sem inventar elogio.
export function textoSobre(unidade, cursos = cursosDaUnidade(unidade)) {
    const tipo = (unidade.tipo || '').trim().toLowerCase();
    const oQue = tipo === 'fatec'
        ? 'uma faculdade de tecnologia pública e gratuita do Centro Paula Souza'
        : tipo === 'etec'
            ? 'uma escola técnica estadual, pública e gratuita, do Centro Paula Souza'
            : 'uma instituição de ensino';
    const onde = unidade.municipio ? `, em ${unidade.municipio}` : '';
    const frases = [`${artigoDaUnidade(unidade)}${unidade.nome} é ${oQue}${onde}.`];
    if (unidade.historico) frases.push(comPonto(unidade.historico));
    if (cursos.length) {
        const chaves = [...new Set(cursos.flatMap((c) => c.modalidades.map((m) => m.chave)))]
            .sort((a, b) => ordemDaModalidade(a) - ordemDaModalidade(b))
            .map((k) => MODALIDADE_NO_TEXTO[k])
            .filter(Boolean);
        const quantos = cursos.length === 1 ? '1 curso' : `${cursos.length} cursos`;
        frases.push(chaves.length ? `Hoje oferece ${quantos}, entre ${juntar(chaves)}.` : `Hoje oferece ${quantos}.`);
    }
    return frases.join(' ');
}

// "Alameda Nothmann, 598 - Campos Elíseos - São Paulo/SP - CEP: 01216-000"
// vira rua na primeira linha e bairro e cidade na segunda.
export function partesDoEndereco(unidade) {
    const cidadePadrao = unidade.municipio ? `${unidade.municipio} - SP` : '';
    const bruto = String(unidade.endereco || '').replace(/\s+/g, ' ').trim();
    if (!bruto) return { rua: '', resto: cidadePadrao, cep: '' };
    let cep = '';
    const partes = bruto.split(/ - /).filter((parte) => {
        const achado = parte.match(/^CEP:?\s*([\d.-]+)/i);
        if (achado) cep = achado[1];
        return !achado;
    });
    const indiceCidade = partes.findIndex((p) => /\/\s*[A-Z]{2}$/.test(p));
    const cidade = indiceCidade >= 0 ? partes[indiceCidade].replace(/\s*\/\s*/, ' - ') : cidadePadrao;
    const antes = indiceCidade >= 0 ? partes.slice(0, indiceCidade) : partes;
    const bairro = antes.length > 1 ? antes.at(-1) : '';
    const rua = antes.length > 1 ? antes.slice(0, -1).join(' - ') : (antes[0] || '');
    return { rua, resto: [bairro, cidade].filter(Boolean).join(' · '), cep };
}

// Abre o Google Maps já na escola: pelo nome e endereço o Google costuma
// achar o próprio lugar (com fotos e horário); sem endereço, vão as coordenadas.
export function linkDoMapa(unidade) {
    const texto = [unidade.nome, unidade.endereco].filter(Boolean).join(', ').replace(/\s+/g, ' ').trim();
    const { lat, lng } = unidade.localizacao || {};
    const consulta = unidade.endereco ? texto : (lat != null && lng != null ? `${lat},${lng}` : texto);
    return consulta ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(consulta)}` : '';
}

export function linkDoTelefone(telefone) {
    const achado = String(telefone || '').match(/\(?(\d{2})\)?\s*(\d{4,5})[-\s]?(\d{4})/);
    return achado ? `tel:+55${achado[1]}${achado[2]}${achado[3]}` : '';
}

// Primeiro número do campo (alguns cadastros trazem dois)
export function telefonePrincipal(telefone) {
    const achado = String(telefone || '').match(/\(?\d{2}\)?\s*\d{4,5}[-\s]?\d{4}/);
    return achado ? achado[0].trim() : String(telefone || '').trim();
}

export function linkSeguro(url) {
    const texto = String(url || '').trim();
    if (!texto) return '';
    const comProtocolo = /^https?:\/\//i.test(texto) ? texto : `https://${texto}`;
    try {
        const endereco = new URL(comProtocolo);
        return endereco.protocol === 'https:' || endereco.protocol === 'http:' ? endereco.href : '';
    } catch {
        return '';
    }
}

export function siteSemProtocolo(url) {
    return String(url || '').replace(/^https?:\/\//i, '').replace(/^www\./i, '').replace(/\/$/, '');
}

export function fotoDaUnidade(unidade) {
    const url = unidade.foto?.url || '';
    return /^https:\/\//i.test(url) ? url : '';
}

// ---- Notas ----

export function textoDaNota(media) {
    return Number(media || 0).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

// Cinco estrelas: 'cheia', 'meia' ou 'vazia' (meia a partir de ,25; cheia a partir de ,75)
export function estrelasDaNota(media) {
    const valor = Math.max(0, Math.min(5, Number(media) || 0));
    return [1, 2, 3, 4, 5].map((posicao) => {
        const sobra = valor - (posicao - 1);
        if (sobra >= 0.75) return 'cheia';
        if (sobra >= 0.25) return 'meia';
        return 'vazia';
    });
}

export function quantasAvaliacoes(total) {
    return total === 1 ? '1 avaliação' : `${total} avaliações`;
}

// ---- Datas ----

function comoData(valor) {
    if (!valor) return null;
    if (typeof valor.toDate === 'function') return valor.toDate();
    const data = valor instanceof Date ? valor : new Date(valor);
    return Number.isNaN(data.getTime()) ? null : data;
}

export function dataCurta(valor) {
    const data = comoData(valor);
    return data ? data.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
}

// ---- Quem pode o quê ----
// conta: { logado, uid, nome, admin, certificado } (certificado: o do Mural
// cuja leitura achou esta unidade, ou null)

export const podeComentar = (conta) => Boolean(conta?.certificado);
export const podeResponder = (conta) => Boolean(conta?.certificado || conta?.admin);
export const podePerguntar = (conta) => Boolean(conta?.logado);

// O que aparece embaixo do nome: curso e ano do certificado, ou equipe
export function rotuloDoAutor(item) {
    if (item.equipe) return 'Equipe Futuro+';
    const curso = String(item.curso || '').trim();
    const ano = item.ano ? `concluiu em ${item.ano}` : '';
    return [curso, ano].filter(Boolean).join(' · ') || 'Estudou aqui';
}

// Respostas guardadas no documento da pergunta, por conta (uid -> resposta),
// em ordem de chegada
export function respostasEmOrdem(pergunta) {
    return Object.entries(pergunta?.respostas || {})
        .map(([uid, resposta]) => ({ uid, ...resposta }))
        .sort((a, b) => (comoData(a.em)?.getTime() || 0) - (comoData(b.em)?.getTime() || 0));
}

// Três dúvidas que valem para qualquer unidade, respondidas pelo próprio
// Futuro+: aparecem antes das perguntas da comunidade.
export function perguntasFixas(unidade, cursos = cursosDaUnidade(unidade)) {
    const fatec = (unidade.tipo || '').trim().toLowerCase() === 'fatec';
    const processo = fatec
        ? 'Pelo Vestibular Fatec. As inscrições, as datas e o manual ficam no site vestibular.fatec.sp.gov.br.'
        : 'Pelo Vestibulinho Etec. As inscrições, as datas e o manual ficam no site vestibulinho.etec.sp.gov.br.';
    const nomes = cursos.map((c) => c.nome);
    const listaDeCursos = nomes.length
        ? `${nomes.length === 1 ? 'Hoje é 1 curso' : `Hoje são ${nomes.length} cursos`}: ${juntar(nomes)}. A lista completa, com o que se aprende em cada um, fica em "Cursos oferecidos", nesta página.`
        : 'O cadastro desta unidade ainda não tem a lista de cursos.';
    return [
        { id: 'fixa-ingresso', texto: 'Como faço para estudar aqui?', fixa: true,
            respostas: { futuro: { equipe: true, nome: 'Futuro+', texto: processo } } },
        { id: 'fixa-gratuita', texto: 'Precisa pagar pelo curso?', fixa: true,
            respostas: { futuro: { equipe: true, nome: 'Futuro+', texto: 'Não. As Etecs e Fatecs são escolas públicas do Centro Paula Souza, do Governo do Estado de São Paulo, e os cursos são gratuitos. As regras da inscrição ficam no manual de cada processo seletivo.' } } },
        { id: 'fixa-cursos', texto: 'Quais cursos tem aqui?', fixa: true,
            respostas: { futuro: { equipe: true, nome: 'Futuro+', texto: listaDeCursos } } }
    ];
}
