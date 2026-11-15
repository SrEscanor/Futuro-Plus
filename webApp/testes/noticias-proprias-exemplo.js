// Notícias próprias de exemplo para os roteiros de teste: uma no site (que
// foi atualizada depois), uma pendente de aprovação, uma agendada para
// amanhã e um rascunho, com o histórico de cada uma. As imagens são
// ilustrações do próprio site.
import { camposPublicos } from '../assets/js/noticias-proprias-util.js';

const HORA = 3600 * 1000;

export function noticiasPropriasDeExemplo() {
    const agora = Date.now();
    const iso = (horas) => new Date(agora + horas * HORA).toISOString();
    const imagem = (arquivo, legenda, credito = 'Arte: Futuro+') => ({ url: `${location.origin}/${arquivo}`, legenda, credito });

    const publicada = {
        id: 'np-publicada',
        titulo: 'Futuro+ lança teste que termina mostrando cursos de verdade das Etecs',
        linhaApoio: 'O novo teste vocacional cruza as respostas com o catálogo oficial do Centro Paula Souza e já indica onde cada curso é oferecido.',
        autor: 'Equipe Futuro+',
        etiquetas: ['etec'],
        imagem: imagem('cursos-formatura.webp', 'Formatura de um curso técnico: o teste sugere cursos e as unidades onde eles são oferecidos.'),
        blocos: [
            { tipo: 'paragrafo', texto: 'Escolher um curso técnico aos 14 ou 15 anos não é simples. Para ajudar nessa decisão, o Futuro+ passou a oferecer um teste vocacional completo, com cerca de 40 perguntas, que leva uns 10 minutos para responder.' },
            { tipo: 'paragrafo', texto: 'No fim, em vez de mostrar só um perfil, o teste sugere cursos reais das Etecs e Fatecs, com o que se aprende em cada um e as unidades mais próximas.' },
            { tipo: 'intertitulo', texto: 'Como o resultado é montado' },
            { tipo: 'paragrafo', texto: 'As respostas são comparadas com os eixos tecnológicos do catálogo oficial do Centro Paula Souza. Os cursos com mais afinidade aparecem primeiro, e dá para marcar os que chamaram mais atenção.' },
            { tipo: 'imagem', ...imagem('central-cps.webp', 'As unidades de cada curso aparecem na página Instituições.') },
            { tipo: 'paragrafo', texto: 'O teste fica na Central de Testes e pede login, para o resultado ficar salvo no perfil.' }
        ],
        status: 'publicada',
        publicadaEm: iso(-26),
        publicarEm: null,
        atualizadaEm: iso(-13),
        enviadaEm: iso(-14),
        enviadaPor: 'ana@teste',
        aprovadaEm: iso(-13),
        aprovadaPor: 'victor@teste',
        criadaEm: iso(-30),
        criadaPor: 'victor@teste',
        alteradaEm: iso(-13),
        alteradaPor: 'victor@teste'
    };

    const pendente = {
        id: 'np-pendente',
        titulo: 'Como funciona a lista de espera das Etecs',
        linhaApoio: 'Quem não passou na primeira chamada ainda pode ser chamado: veja como acompanhar.',
        autor: 'Ana, da equipe Futuro+',
        etiquetas: ['etec'],
        imagem: imagem('central-cps.webp', 'As chamadas saem no site do Vestibulinho.'),
        blocos: [{ tipo: 'paragrafo', texto: 'Depois da primeira chamada, as Etecs publicam novas listas conforme as vagas sobram. Vale acompanhar o site do Vestibulinho todos os dias.' }],
        status: 'pendente',
        publicadaEm: null,
        publicarEm: null,
        atualizadaEm: null,
        enviadaEm: iso(-3),
        enviadaPor: 'ana@teste',
        criadaEm: iso(-6),
        criadaPor: 'ana@teste',
        alteradaEm: iso(-3),
        alteradaPor: 'ana@teste'
    };

    const agendada = {
        id: 'np-agendada',
        titulo: 'Vestibulinho: o que estudar nas últimas semanas',
        linhaApoio: 'Um roteiro de revisão com os assuntos que mais caem na prova das Etecs.',
        autor: 'Equipe Futuro+',
        etiquetas: ['etec'],
        imagem: imagem('cerebro-testes.webp', 'Organizar a revisão por assunto ajuda a chegar mais tranquilo na prova.'),
        blocos: [{ tipo: 'paragrafo', texto: 'Faltando poucas semanas para a prova, vale mais revisar bem os assuntos que mais aparecem do que tentar ver tudo de novo.' }],
        status: 'agendada',
        publicadaEm: iso(26),
        publicarEm: iso(26),
        atualizadaEm: null,
        enviadaEm: iso(-4),
        enviadaPor: 'victor@teste',
        aprovadaEm: iso(-2),
        aprovadaPor: 'ana@teste',
        criadaEm: iso(-5),
        criadaPor: 'victor@teste',
        alteradaEm: iso(-2),
        alteradaPor: 'ana@teste'
    };

    const rascunho = {
        id: 'np-rascunho',
        titulo: 'Fatecs abrem inscrições para cursos gratuitos de férias',
        linhaApoio: '',
        autor: 'Equipe Futuro+',
        etiquetas: ['fatec'],
        imagem: null,
        blocos: [{ tipo: 'paragrafo', texto: 'Texto ainda em escrita.' }],
        status: 'rascunho',
        publicadaEm: null,
        publicarEm: null,
        atualizadaEm: null,
        criadaEm: iso(-1),
        criadaPor: 'ana@teste',
        alteradaEm: iso(-0.5),
        alteradaPor: 'ana@teste'
    };

    const historico = [
        ['np-publicada', publicada.titulo, 'criou', '', 'victor@teste', -30],
        ['np-publicada', publicada.titulo, 'enviou', '', 'victor@teste', -28],
        ['np-publicada', publicada.titulo, 'publicou', '', 'ana@teste', -26],
        ['np-publicada', publicada.titulo, 'enviou', '', 'ana@teste', -14],
        ['np-publicada', publicada.titulo, 'publicou', 'as alterações', 'victor@teste', -13],
        ['np-pendente', pendente.titulo, 'criou', '', 'ana@teste', -6],
        ['np-pendente', pendente.titulo, 'enviou', '', 'ana@teste', -3],
        ['np-agendada', agendada.titulo, 'criou', '', 'victor@teste', -5],
        ['np-agendada', agendada.titulo, 'enviou', '', 'victor@teste', -4],
        ['np-agendada', agendada.titulo, 'agendou', 'para amanhã', 'ana@teste', -2],
        ['np-rascunho', rascunho.titulo, 'criou', '', 'ana@teste', -1],
        ['np-antiga', 'Notícia de teste que foi apagada', 'excluiu', '', 'victor@teste', -48]
    ].map(([noticiaId, titulo, acao, detalhe, email, horas], indice) => ({
        id: `h${indice + 1}`, noticiaId, titulo, acao, detalhe, email, uid: 'u1', em: iso(horas)
    }));

    const proprias = new Map([publicada, pendente, agendada, rascunho].map((n) => [n.id, n]));
    // o site só tem cópia das aprovadas (a no ar e a agendada)
    const publicadas = new Map([publicada, agendada].map((n) => [n.id, { id: n.id, ...camposPublicos(n) }]));
    return { proprias, publicadas, historico };
}
