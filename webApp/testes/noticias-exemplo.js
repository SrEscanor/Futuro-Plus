// Notícias de exemplo para os roteiros pagina-noticias.js e painel-noticias.js.
// São inventadas, mas imitam o que a coleta automática traz, incluindo os casos que
// costumam quebrar layout: título comprido, palavra sem espaço, sem resumo,
// sem imagem, imagem que não carrega, sem etiqueta de Etec/Fatec.
//
// As datas são contadas a partir de agora, para "há 3 horas" e "ontem"
// aparecerem de verdade.

const HORA = 3600 * 1000;

// Imagens que já existem em webApp/public, para não depender de site de fora.
const FOTOS = ['/cursos-formatura.webp', '/central-cps.webp', '/mural-parede.webp', '/cerebro-testes.webp'];

const CPS = 'Centro Paula Souza';
const AGENCIA = 'Agência SP';

// [status, horas atrás, fonte, etiquetas, imagem, título, resumo]
// imagem: número = índice em FOTOS, '' = sem imagem, texto = endereço
const LINHAS = [
    ['pendente', 2, CPS, ['etec'], 0,
        'Desafio de inglês premia estudantes de três Etecs por projetos de aprendizagem',
        'Equipes vencedoras foram reconhecidas em cerimônia em São Paulo e ganham intercâmbio de quatro semanas.'],
    ['pendente', 5, AGENCIA, ['fatec'], 1,
        'Centro Paula Souza prorroga inscrições para o Vestibular das Fatecs até 16 de novembro',
        'Processo seletivo oferece mais de 13 mil vagas em cursos superiores gratuitos; 12 novas opções de formação estão previstas para 2027.'],
    ['pendente', 9, 'G1', ['etec'], '',
        'Vestibulinho das Etecs: veja como consultar o local de prova',
        ''],
    ['pendente', 20, CPS, ['etec', 'fatec'], 2,
        'Alunos de Etecs e Fatecs podem concorrer a mais de 500 bolsas para estudar inglês ou espanhol no exterior durante quatro semanas em 2027, com passagem, hospedagem e curso pagos pelo programa de intercâmbio cultural',
        'O programa de intercâmbio cultural do Centro Paula Souza seleciona estudantes com melhor desempenho escolar. As inscrições são feitas pela internet, e o resultado sai em dezembro. Os aprovados embarcam entre janeiro e julho para países como Estados Unidos, Canadá, Reino Unido, Irlanda, Chile, Argentina e Espanha, com tudo pago.'],
    ['pendente', 26, CPS, [], 'https://exemplo.invalid/foto-que-nao-existe.jpg',
        'Centro Paula Souza é destaque em prêmio nacional de transformação digital',
        'Premiação reconhece iniciativas inovadoras que contribuem para a transformação digital no País.'],
    ['pendente', 30, 'Portal do Município de Piracicaba', ['fatec'], '',
        'Piracema de Sabores apresenta criações de alunos da Fatec https://www.piracicaba.sp.gov.br/noticias/2026/11/piracema-de-sabores-apresenta-criacoes-de-alunos',
        'Evento gastronômico reúne pratos criados por estudantes do curso de Alimentos.'],
    ['pendente', 49, AGENCIA, ['etec'], 3,
        'Etec abre 40 vagas para curso técnico gratuito de Desenvolvimento de Sistemas',
        'Aulas começam em fevereiro, no período noturno.'],
    ['pendente', 75, 'Hora Brasil', ['fatec'], '',
        'Fatec prorroga inscrições para graduações gratuitas em Segurança e Gestão',
        ''],

    ['aprovada', 1, CPS, ['fatec'], 1,
        'Inscritos no Provão Paulista têm até dia 27 para escolher cursos',
        'Fatecs oferecem cerca de 8 mil vagas para ingresso em 2027 por meio do Provão Paulista.'],
    ['aprovada', 4, AGENCIA, ['etec'], 0,
        'Inscrições para o Vestibulinho das Etecs terminam às 20h desta terça-feira',
        'Processo seletivo oferece cerca de 90 mil vagas gratuitas para o primeiro semestre de 2027; a participação só é confirmada após o pagamento da taxa.'],
    ['aprovada', 22, CPS, ['fatec'], 2,
        'Fatec Pompeia firma parceria com multinacional do agronegócio',
        'Acordo prevê estágios, visitas técnicas e projetos de pesquisa com os alunos.'],
    ['aprovada', 28, 'G1', ['etec'], '',
        'Etec de Carapicuíba recebe feira de profissões aberta ao público',
        ''],
    ['aprovada', 50, CPS, ['etec', 'fatec'], 3,
        'Etecs e Fatecs abrem as portas para visitação de estudantes do ensino fundamental e médio',
        'Unidades de todo o estado recebem visitantes para apresentar cursos, laboratórios e projetos.'],
    ['aprovada', 72, CPS, [], 1,
        'Centro Paula Souza divulga calendário escolar de 2027',
        'Documento traz as datas de início das aulas, recessos e períodos de matrícula.'],
    ['aprovada', 98, AGENCIA, ['fatec'], 'https://exemplo.invalid/outra-foto-quebrada.jpg',
        'Estação Suzano recebe ação informativa da Fatec sobre vestibulares gratuitos',
        'Passageiros poderão tirar dúvidas sobre os cursos superiores oferecidos na região.'],
    ['aprovada', 130, CPS, ['etec'], 0,
        'Estudantes de Etec criam aplicativo que ajuda idosos a lembrar dos remédios',
        'Projeto de conclusão de curso foi apresentado na feira tecnológica e já tem versão de testes.'],
    ['aprovada', 170, 'Folha da Região', ['etec'], '',
        'Etec de Araçatuba tem recorde de inscritos no Vestibulinho, com o curso de Enfermagem liderando a procura pela terceira vez seguida',
        'Unidade registrou mais de 2 mil candidatos.'],
    ['aprovada', 200, CPS, ['fatec'], 2,
        'Fatec lança curso superior de tecnologia em Inteligência Artificial',
        'Novo curso tem duração de três anos e 40 vagas por semestre.'],
    ['aprovada', 260, AGENCIA, ['etec', 'fatec'], 3,
        'Governo de SP anuncia dez novas unidades de Etecs e Fatecs para 2027',
        'Expansão vai criar mais de 5 mil vagas em cursos técnicos e superiores gratuitos.'],
    ['aprovada', 300, CPS, ['etec'], 1,
        'Vestibulinho 2027: confira o que cai na prova',
        'Exame terá 50 questões de múltipla escolha com conteúdo do ensino fundamental.'],
    ['aprovada', 420, CPS, [], '',
        'Professores do Centro Paula Souza participam de capacitação em metodologias ativas',
        'Formação reuniu docentes de 60 unidades.'],
    ['aprovada', 600, 'Diário do Grande ABC', ['fatec'], 0,
        'Fatec de São Bernardo recebe semana de tecnologia com palestras gratuitas',
        'Programação inclui oficinas de robótica, programação e empreendedorismo.'],

    ['recusada', 8, 'Blog do Concurso', ['etec'], '',
        'Concurso para professor de Etec: veja salários e como se inscrever',
        'Edital prevê vagas para diversas disciplinas.'],
    ['recusada', 40, 'Hora Brasil', ['fatec'], '',
        'Fatec: curso pago promete aprovação no vestibular',
        ''],
    ['recusada', 90, 'G1', [], 2,
        'Trânsito é desviado na região da Etec por causa de obra',
        'Mudança vale até o fim do mês.']
];

export function noticiasDeExemplo() {
    const agora = Date.now();
    return LINHAS.map(([status, horas, fonte, instituicoes, imagem, titulo, resumo], indice) => {
        const publicadaEm = new Date(agora - horas * HORA).toISOString();
        const noticia = {
            id: `n${String(indice + 1).padStart(2, '0')}`,
            titulo,
            resumo,
            link: fonte === 'G1' || fonte === 'Hora Brasil'
                ? `https://news.google.com/rss/articles/exemplo-${indice + 1}`
                : `https://www.exemplo.sp.gov.br/noticias/exemplo-${indice + 1}/`,
            imagem: typeof imagem === 'number' ? FOTOS[imagem] : imagem,
            fonte,
            instituicoes,
            publicadaEm,
            coletadaEm: new Date(agora - Math.max(horas - 1, 0) * HORA).toISOString(),
            status
        };
        if (status === 'recusada') noticia.recusadaEm = new Date(agora - (horas / 2) * HORA).toISOString();
        return noticia;
    });
}
