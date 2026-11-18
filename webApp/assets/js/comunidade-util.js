// Regras e textos do painel Admin · Comunidade (aba Novidades e Histórico),
// sem tela e sem Firestore, para os testes chamarem direto. Os registros e
// avisos são gravados pelas funções do servidor (functions/comunidade.py),
// com estes campos:
//
//   registro do histórico: acao, tipo (comentario | duvida | resposta), em,
//     unidadeId, unidadeNome, itemId, quem fez (uid, nome, email só de admin,
//     admin, sistema, propria = foi o próprio autor) e o conteúdo (autorUid,
//     autorNome, texto, nota, curso, ano, equipe, escritoEm, textoAntes,
//     notaAntes, perguntaTexto, perguntaAutorNome, respostasApagadas)
//   aviso: tipo (avaliacao | duvida), em, unidadeId, unidadeNome, itemId,
//     nome, texto, nota, curso, ano, respostas, apagada, editada, link
import { normalizar } from './historico-filtros.js';

// [texto, cor] de cada ação (as cores são as dos outros históricos)
export const ACOES_COMUNIDADE = {
    comentou: ['comentou e deu nota', 'positiva'],
    editou_comentario: ['editou o comentário', 'neutra'],
    apagou_comentario: ['apagou o comentário', 'negativa'],
    perguntou: ['perguntou', 'neutra'],
    apagou_duvida: ['apagou a dúvida', 'negativa'],
    respondeu: ['respondeu', 'positiva'],
    editou_resposta: ['editou a resposta', 'neutra'],
    apagou_resposta: ['apagou a resposta', 'negativa']
};

export const APAGADOS = ['apagou_comentario', 'apagou_duvida', 'apagou_resposta'];

const PROPRIA = {
    apagou_comentario: 'apagou o próprio comentário',
    apagou_duvida: 'apagou a própria dúvida',
    apagou_resposta: 'apagou a própria resposta'
};

export function textoDaAcao(registro) {
    if (registro.propria && PROPRIA[registro.acao]) return PROPRIA[registro.acao];
    return (ACOES_COMUNIDADE[registro.acao] || [registro.acao || 'fez algo'])[0];
}

export const corDaAcao = (registro) => (ACOES_COMUNIDADE[registro.acao] || [null, 'neutra'])[1];

// o complemento miúdo ao lado da ação ("de Caio Ramos", "nota 3 → 4 e texto"...)
export function detalheDaAcao(registro) {
    const de = !registro.propria && registro.autorNome ? `de ${registro.autorNome}` : '';
    switch (registro.acao) {
        case 'apagou_comentario':
        case 'apagou_resposta':
            return de;
        case 'apagou_duvida': {
            const respostas = (registro.respostasApagadas || []).length;
            const junto = respostas ? `e ${respostas === 1 ? 'a resposta dela' : `as ${respostas} respostas dela`}` : '';
            return [de, junto].filter(Boolean).join(', ');
        }
        case 'respondeu':
            return registro.equipe ? 'como Equipe Futuro+' : '';
        case 'editou_comentario': {
            const mudouNota = registro.notaAntes && registro.nota && registro.notaAntes !== registro.nota;
            const mudouTexto = (registro.textoAntes || '') !== (registro.texto || '');
            if (mudouNota && mudouTexto) return `nota ${registro.notaAntes} → ${registro.nota} e texto`;
            if (mudouNota) return `nota ${registro.notaAntes} → ${registro.nota}`;
            return mudouTexto ? 'texto' : '';
        }
        default:
            return '';
    }
}

// "avaliou ... na Etec X" / "perguntou sobre a Fatec Y", mas "em" e "sobre"
// sem artigo para outras escolas (o servidor usa a mesma regra no push)
const ehEtecOuFatec = (nome) => /^(etec|fatec)\b/i.test(String(nome || '').trim());
export const preposicaoNa = (nome) => (ehEtecOuFatec(nome) ? 'na' : 'em');
export const preposicaoSobre = (nome) => (ehEtecOuFatec(nome) ? 'sobre a' : 'sobre');

export function linkDaUnidade(unidadeId, ancora) {
    return `instituicao.html?u=${encodeURIComponent(unidadeId || '')}${ancora ? `#${ancora}` : ''}`;
}

// Mesma pessoa, mesmo item, mesma hora em que foi escrito: é o que liga o
// "comentou" ao "apagou" do mesmo comentário (o id de um comentário pode
// voltar a existir depois de apagado, por isso a hora entra junto).
export function chaveDoConteudo(registro) {
    const tipo = registro.tipo || '';
    const autor = tipo === 'resposta' ? registro.autorUid || '' : '';
    return [tipo, registro.unidadeId, registro.itemId, autor, registro.escritoEm || ''].join('|');
}

// chaves de tudo o que foi apagado entre os registros carregados
export function chavesApagadas(registros) {
    return new Set(registros.filter((r) => APAGADOS.includes(r.acao)).map(chaveDoConteudo));
}

// onde a busca procura: nomes, e-mail, instituição, curso e os textos
export function textoDeBusca(registro) {
    const respostas = (registro.respostasApagadas || []).map((r) => `${r.autorNome || ''} ${r.texto || ''}`);
    return [
        registro.nome, registro.email, registro.autorNome, registro.unidadeNome, registro.curso,
        registro.texto, registro.textoAntes, registro.perguntaTexto, registro.perguntaAutorNome, ...respostas
    ].filter(Boolean).join(' ');
}

export const contemTexto = (registro, termo) => normalizar(textoDeBusca(registro)).includes(normalizar(termo));

// "Hoje", "Ontem" ou "16 de novembro" (separa a aba Novidades por dia)
export function diaDoAviso(valor, agora = new Date()) {
    const data = new Date(valor || 0);
    if (Number.isNaN(data.getTime()) || !valor) return 'Sem data';
    const inicio = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    const dias = Math.round((inicio(agora) - inicio(data)) / (24 * 60 * 60 * 1000));
    if (dias === 0) return 'Hoje';
    if (dias === 1) return 'Ontem';
    const texto = data.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' });
    return data.getFullYear() === agora.getFullYear() ? texto : `${texto} de ${data.getFullYear()}`;
}

// situação de uma dúvida na aba Novidades
export function situacaoDaDuvida(aviso) {
    if (aviso.apagada) return ['Apagada', 'apagada'];
    const respostas = Number(aviso.respostas) || 0;
    if (!respostas) return ['Sem resposta', 'sem'];
    return [respostas === 1 ? '1 resposta' : `${respostas} respostas`, 'ok'];
}

export const avisoNovo = (aviso, vistosEm) => Boolean(aviso.em) && (!vistosEm || String(aviso.em) > String(vistosEm));
