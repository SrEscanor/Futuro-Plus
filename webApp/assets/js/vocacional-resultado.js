// Contas do Teste Vocacional, separadas da tela para poderem ser testadas
// sozinhas: nada aqui toca o DOM nem o Firestore.

import {
    EIXOS,
    AFIRMACOES_INTERESSE,
    PERGUNTAS_ESTILO,
    PESO_ESTILO,
    MAXIMO_CARTAS,
    PESO_RESPOSTA_CARTA
} from './perguntas-vocacional.js';

// ------------------------------------------------------------------
// Nota de cada área
// ------------------------------------------------------------------

// interesse: array com a nota de 1 a 5 de cada afirmação, na ordem do banco.
// estilo: { idDaPergunta: valorEscolhido }.
export function pontuarEixos(interesse, estilo) {
    const soma = Object.fromEntries(EIXOS.map((e) => [e, { pontos: 0, itens: 0 }]));

    AFIRMACOES_INTERESSE.forEach((afirmacao, i) => {
        const nota = Number(interesse[i]);
        if (!nota) return;
        const alvo = soma[afirmacao.eixo];
        alvo.pontos += nota;
        alvo.itens += 1;
    });

    // de 1..5 para 0..100, para a nota não depender de quantas afirmações o eixo tem
    const notas = {};
    EIXOS.forEach((eixo) => {
        const { pontos, itens } = soma[eixo];
        notas[eixo] = itens ? ((pontos / itens) - 1) / 4 * 100 : 0;
    });

    // o jeito de trabalhar empurra um pouco os eixos que combinam com ele
    PERGUNTAS_ESTILO.forEach((pergunta) => {
        const escolha = pergunta.opcoes.find((o) => o.valor === estilo?.[pergunta.id]);
        escolha?.eixos.forEach((eixo) => {
            if (notas[eixo] != null) notas[eixo] = Math.min(100, notas[eixo] * (1 + PESO_ESTILO));
        });
    });

    return notas;
}

export function ranquearEixos(notas) {
    return [...EIXOS].sort((a, b) => notas[b] - notas[a] || a.localeCompare(b, 'pt-BR'));
}

// ------------------------------------------------------------------
// Quais cursos cabem na situação da pessoa
// ------------------------------------------------------------------

export function tipoDaModalidade(modalidade) {
    const texto = (modalidade || '').toLowerCase();
    if (texto.includes('especializa')) return 'especializacao';
    if (texto.includes('articula')) return 'integrado';
    if (texto.includes('ensino médio integrado') || texto.includes('ensino medio integrado')) return 'integrado';
    if (texto.includes('cursos técnicos') || texto.includes('cursos tecnicos')) return 'tecnico';
    return 'outro';
}

export function formatosDoCurso(curso) {
    return new Set((curso.modalidades || []).map(tipoDaModalidade));
}

// Quem está no 9º ano só pode entrar no médio integrado; quem já está no
// ensino médio (ou terminou) entra no técnico. Especialização fica de fora
// do teste: ela exige um curso técnico concluído.
export function formatosPermitidos({ escolaridade, formato }) {
    const porEscolaridade = escolaridade === 'fundamental' ? ['integrado'] : ['tecnico'];
    if (formato === 'integrado' && porEscolaridade.includes('integrado')) return ['integrado'];
    if (formato === 'tecnico' && porEscolaridade.includes('tecnico')) return ['tecnico'];
    return porEscolaridade;
}

export function cursoCabeNaSituacao(curso, situacao) {
    const formatos = formatosDoCurso(curso);
    if (formatos.has('especializacao') && formatos.size === 1) return false;
    return formatosPermitidos(situacao).some((f) => formatos.has(f));
}

// ------------------------------------------------------------------
// As cartas de curso
// ------------------------------------------------------------------

// De quantas áreas as cartas podem vir. Mais que isso já entra em área que
// a pessoa disse não gostar.
const EIXOS_NAS_CARTAS = 4;

// catalogo: cursos com eixos/modalidades/descrição.
// unidadesPorCurso: Map de nome normalizado -> quantidade de unidades.
// avaliar: função opcional que devolve { km, ordem } de uma unidade.
export function escolherCartas(catalogo, notas, situacao, { unidadesPorCurso, normalizar, limite = MAXIMO_CARTAS } = {}) {
    const ranking = ranquearEixos(notas);
    const posicao = Object.fromEntries(ranking.map((eixo, i) => [eixo, i]));

    const candidatos = catalogo
        .filter((curso) => cursoCabeNaSituacao(curso, situacao))
        .filter((curso) => (curso.eixos || []).length)
        .map((curso) => {
            // um curso em dois eixos entra pelo eixo em que a pessoa foi melhor
            const eixo = [...curso.eixos].sort((a, b) => (posicao[a] ?? 99) - (posicao[b] ?? 99))[0];
            const unidades = unidadesPorCurso?.get(normalizar ? normalizar(curso.nome) : curso.nome) || 0;
            return { curso, eixo, nota: notas[eixo] || 0, unidades };
        })
        // só faz sentido sugerir curso que alguma unidade do cadastro oferece
        .filter((item) => item.unidades > 0);

    const porEixo = new Map();
    candidatos
        .sort((a, b) => b.unidades - a.unidades || a.curso.nome.localeCompare(b.curso.nome, 'pt-BR'))
        .forEach((item) => {
            if (!porEixo.has(item.eixo)) porEixo.set(item.eixo, []);
            porEixo.get(item.eixo).push(item);
        });

    // Reveza entre as áreas mais fortes em vez de encher as cartas com uma
    // só: quem gosta de tecnologia e de indústria precisa ver as duas para
    // poder comparar.
    const areas = ranking.filter((eixo) => porEixo.has(eixo)).slice(0, EIXOS_NAS_CARTAS);
    const cartas = [];
    for (let volta = 0; cartas.length < limite; volta++) {
        const antes = cartas.length;
        for (const eixo of areas) {
            const item = porEixo.get(eixo)[volta];
            if (item && cartas.length < limite) cartas.push(item);
        }
        if (cartas.length === antes) break;
    }

    return cartas;
}

// ------------------------------------------------------------------
// Resultado final
// ------------------------------------------------------------------

// respostasCartas: { slug: 'quero' | 'talvez' | 'nao' }
export function montarResultado(cartas, respostasCartas, notas) {
    const avaliados = cartas.map((item) => {
        const resposta = respostasCartas[item.curso.slug] || 'talvez';
        const peso = PESO_RESPOSTA_CARTA[resposta] ?? 1;
        // o empurrão da oferta é pequeno e só desempata cursos parecidos
        const fatorOferta = 1 + Math.min(0.1, item.unidades / 1000);
        return { ...item, resposta, pontuacao: (notas[item.eixo] || 0) * peso * fatorOferta };
    });

    const combinam = avaliados
        .filter((a) => a.resposta !== 'nao')
        .sort((a, b) => b.pontuacao - a.pontuacao);

    return {
        combinam: combinam.slice(0, 5),
        descartados: avaliados.filter((a) => a.resposta === 'nao'),
        eixosFortes: ranquearEixos(notas).slice(0, 3)
    };
}

export function motivoDaRecomendacao({ eixo, resposta }, eixosFortes = []) {
    const principal = eixosFortes[0] === eixo;
    if (resposta === 'quero') {
        return principal
            ? `Você marcou que quer, e é da sua área mais forte: ${eixo}.`
            : `Você marcou que quer, em ${eixo}, uma das áreas que mais combinam com você.`;
    }
    return `Você ficou em dúvida, e o curso é de ${eixo}, uma das suas áreas fortes.`;
}
