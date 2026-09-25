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
    // Fatec: "Curso Superior de Tecnologia Presencial/EaD", "Curso Superior Bacharelado"...
    if (texto.includes('curso superior')) return 'superior';
    return 'outro';
}

export function formatosDoCurso(curso) {
    return new Set((curso.modalidades || []).map(tipoDaModalidade));
}

// Quem está no 9º ano só pode entrar no médio integrado — nem técnico
// avulso nem superior (Fatec) fazem sentido ainda, então a escolha de
// formato é ignorada nesse caso. Quem já está no médio (cursando ou
// concluído) pode ver técnico e/ou superior — quem ainda está cursando
// recebe um aviso na carta e no resultado, porque a Fatec só matricula com
// o médio já concluído (avisarPrecisaConcluirMedio faz essa conta).
// Especialização fica de fora do teste: ela exige um curso técnico concluído.
export function formatosPermitidos({ escolaridade, formato }) {
    if (escolaridade === 'fundamental') return ['integrado'];
    if (formato === 'tecnico') return ['tecnico'];
    if (formato === 'superior') return ['superior'];
    if (formato === 'integrado') return ['integrado'];
    return ['tecnico', 'superior'];
}

// Curso superior (Fatec) só matricula com o médio já concluído — quem ainda
// está cursando pode ver a carta, mas precisa saber disso antes de se
// animar com um curso que ainda não pode começar.
export function avisarPrecisaConcluirMedio(curso, { escolaridade }) {
    return curso.nivel === 'superior' && escolaridade === 'medio_cursando';
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
// a pessoa disse não gostar — mas o botão "Ver mais cursos" pode abrir mais
// áreas aos poucos para quem quiser continuar explorando.
export const EIXOS_NAS_CARTAS = 4;

// Cursos técnico e superior às vezes têm o mesmo nome ("Logística",
// "Marketing"...) mas são grades diferentes — sem isso, a contagem de
// unidades de um contaria unidades do outro.
export function chaveOferta(nome, nivel, normalizar) {
    const base = normalizar ? normalizar(nome) : nome;
    return nivel === 'superior' ? `${base}::superior` : base;
}

// catalogo: cursos com eixos/modalidades/descrição.
// unidadesPorCurso: Map de nome normalizado -> quantidade de unidades.
// avaliar: função opcional que devolve { km, ordem } de uma unidade.
export function escolherCartas(catalogo, notas, situacao, { unidadesPorCurso, normalizar, limite = MAXIMO_CARTAS, numAreas = EIXOS_NAS_CARTAS } = {}) {
    const ranking = ranquearEixos(notas);
    const posicao = Object.fromEntries(ranking.map((eixo, i) => [eixo, i]));

    const candidatos = catalogo
        .filter((curso) => cursoCabeNaSituacao(curso, situacao))
        .filter((curso) => (curso.eixos || []).length)
        .map((curso) => {
            // um curso em dois eixos entra pelo eixo em que a pessoa foi melhor
            const eixo = [...curso.eixos].sort((a, b) => (posicao[a] ?? 99) - (posicao[b] ?? 99))[0];
            const unidades = unidadesPorCurso?.get(chaveOferta(curso.nome, curso.nivel, normalizar)) || 0;
            return { curso, eixo, nota: notas[eixo] || 0, unidades };
        })
        // só faz sentido sugerir curso que alguma unidade do cadastro oferece
        .filter((item) => item.unidades > 0);

    const porEixo = new Map();
    candidatos.forEach((item) => {
        if (!porEixo.has(item.eixo)) porEixo.set(item.eixo, []);
        porEixo.get(item.eixo).push(item);
    });

    // Dentro de cada área, intercala técnico e superior por oferta — a rede
    // Etec é muito maior que a Fatec, então ordenar só por unidades faria o
    // técnico lotar a área inteira antes de um curso superior aparecer,
    // mesmo quando os dois cabem na situação da pessoa (ex.: "Desenvolvimento
    // de Sistemas" técnico e "Análise e Desenvolvimento de Sistemas" Fatec).
    porEixo.forEach((lista, eixo) => {
        const ordenarPorOferta = (itens) => itens
            .sort((a, b) => b.unidades - a.unidades || a.curso.nome.localeCompare(b.curso.nome, 'pt-BR'));
        const tecnicos = ordenarPorOferta(lista.filter((i) => i.curso.nivel !== 'superior'));
        const superiores = ordenarPorOferta(lista.filter((i) => i.curso.nivel === 'superior'));

        const intercalado = [];
        for (let i = 0; i < Math.max(tecnicos.length, superiores.length); i++) {
            if (tecnicos[i]) intercalado.push(tecnicos[i]);
            if (superiores[i]) intercalado.push(superiores[i]);
        }
        porEixo.set(eixo, intercalado);
    });

    // Reveza entre as áreas mais fortes em vez de encher as cartas com uma
    // só: quem gosta de tecnologia e de indústria precisa ver as duas para
    // poder comparar.
    const areas = ranking.filter((eixo) => porEixo.has(eixo)).slice(0, numAreas);
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
