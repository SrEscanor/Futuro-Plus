// Banco de perguntas do Teste Vocacional do Futuro+.
//
// Ele não é baseado nas inteligências de Gardner (isso é o Teste de Perfil).
// Aqui a pergunta é outra: com que ÁREA a pessoa se identifica, como ela
// gosta de trabalhar, e — no fim — o que ela acha de cada curso depois de
// ler o que se aprende nele.
//
// As áreas são os 12 eixos tecnológicos oficiais do Centro Paula Souza, os
// mesmos que vêm no catálogo de cursos. Assim o resultado cai direto em
// cursos reais, sem precisar de tabela de equivalência.

export const EIXOS = [
    'Ambiente e Saúde',
    'Controle e Processos Industriais',
    'Desenvolvimento Educacional e Social',
    'Gestão e Negócios',
    'Infraestrutura',
    'Informação e Comunicação',
    'Produção Alimentícia',
    'Produção Cultural e Design',
    'Produção Industrial',
    'Recursos Naturais',
    'Segurança',
    'Turismo, Hospitalidade e Lazer'
];

// ------------------------------------------------------------------
// Bloco 1 — Situação: filtra o que faz sentido oferecer.
// ------------------------------------------------------------------
export const PERGUNTAS_SITUACAO = [
    {
        id: 'escolaridade',
        pergunta: 'Em que ponto dos estudos você está?',
        opcoes: [
            { valor: 'fundamental', texto: 'Estou no 9º ano (ou antes)' },
            { valor: 'medio_cursando', texto: 'Estou cursando o ensino médio' },
            { valor: 'medio_concluido', texto: 'Já terminei o ensino médio' }
        ]
    },
    {
        id: 'formato',
        pergunta: 'Como você prefere estudar?',
        opcoes: [
            { valor: 'integrado', texto: 'Ensino médio e curso técnico juntos, na mesma escola' },
            { valor: 'tecnico', texto: 'Só o curso técnico' },
            { valor: 'superior', texto: 'Curso superior de tecnologia (Fatec), depois do ensino médio' },
            { valor: 'ambos', texto: 'Técnico e superior juntos — quero ver as duas opções' },
            { valor: 'tanto_faz', texto: 'Tanto faz, não tenho preferência' }
        ]
    },
    {
        id: 'distancia',
        pergunta: 'Até onde dá para ir todo dia para estudar?',
        opcoes: [
            { valor: 'perto', texto: 'Só perto de casa (uns 10 km)' },
            { valor: 'cidade', texto: 'Qualquer lugar da minha cidade ou região' },
            { valor: 'longe', texto: 'Topo ir longe se o curso valer a pena' }
        ]
    }
];

// ------------------------------------------------------------------
// Bloco 2 — Interesse por área: duas afirmações por eixo, de 1 a 5.
// Duas (e não uma) para o resultado não depender de uma frase que a
// pessoa entendeu de um jeito diferente.
// ------------------------------------------------------------------
export const AFIRMACOES_INTERESSE = [
    { eixo: 'Ambiente e Saúde', texto: 'Não me assusta cuidar de alguém que está passando mal.' },
    { eixo: 'Ambiente e Saúde', texto: 'Tenho curiosidade sobre como o corpo humano funciona.' },

    { eixo: 'Controle e Processos Industriais', texto: 'Tenho vontade de entender como as máquinas funcionam por dentro.' },
    { eixo: 'Controle e Processos Industriais', texto: 'Mexer com eletricidade, motores ou automação me parece interessante.' },

    { eixo: 'Desenvolvimento Educacional e Social', texto: 'Gosto de ensinar e explicar as coisas para os outros.' },
    { eixo: 'Desenvolvimento Educacional e Social', texto: 'Me interesso por projetos que ajudam a comunidade onde eu moro.' },

    { eixo: 'Gestão e Negócios', texto: 'Gosto de organizar as coisas e manter tudo em ordem.' },
    { eixo: 'Gestão e Negócios', texto: 'Tenho curiosidade sobre como uma empresa ganha e controla dinheiro.' },

    { eixo: 'Infraestrutura', texto: 'Presto atenção em como prédios, pontes e estradas são construídos.' },
    { eixo: 'Infraestrutura', texto: 'Gostaria de trabalhar numa obra, acompanhando o que está sendo feito.' },

    { eixo: 'Informação e Comunicação', texto: 'Gosto de mexer em computador e resolver problemas de tecnologia.' },
    { eixo: 'Informação e Comunicação', texto: 'Ficaria à vontade aprendendo a programar ou a montar uma rede.' },

    { eixo: 'Produção Alimentícia', texto: 'Tenho curiosidade sobre como a comida é produzida e conservada.' },
    { eixo: 'Produção Alimentícia', texto: 'Gostaria de trabalhar garantindo a qualidade do que as pessoas comem.' },

    { eixo: 'Produção Cultural e Design', texto: 'Gosto de criar: desenhar, filmar, tocar, dançar ou escrever.' },
    { eixo: 'Produção Cultural e Design', texto: 'As pessoas costumam elogiar as ideias que eu invento.' },

    { eixo: 'Produção Industrial', texto: 'Me interesso por como as coisas são fabricadas em grande quantidade.' },
    { eixo: 'Produção Industrial', texto: 'Trabalhar dentro de uma fábrica não me incomodaria.' },

    { eixo: 'Recursos Naturais', texto: 'Gosto de estar no campo, lidando com plantas ou animais.' },
    { eixo: 'Recursos Naturais', texto: 'Me preocupo com o meio ambiente e queria trabalhar cuidando dele.' },

    { eixo: 'Segurança', texto: 'Numa emergência, eu consigo manter a calma para ajudar.' },
    { eixo: 'Segurança', texto: 'Me interesso por evitar acidentes e proteger as pessoas no trabalho.' },

    { eixo: 'Turismo, Hospitalidade e Lazer', texto: 'Gosto de receber e atender pessoas.' },
    { eixo: 'Turismo, Hospitalidade e Lazer', texto: 'Viagens, eventos e cozinha são assuntos que me animam.' }
];

export const ESCALA_INTERESSE = [
    { valor: 1, texto: 'Nada a ver comigo' },
    { valor: 2, texto: 'Pouco' },
    { valor: 3, texto: 'Mais ou menos' },
    { valor: 4, texto: 'Bastante' },
    { valor: 5, texto: 'É a minha cara' }
];

// ------------------------------------------------------------------
// Bloco 3 — Jeito de trabalhar: separa cursos da MESMA área.
// Cada resposta dá um empurrãozinho nos eixos combinam com ela.
// ------------------------------------------------------------------
export const PERGUNTAS_ESTILO = [
    {
        id: 'contato',
        pergunta: 'No trabalho, você prefere...',
        opcoes: [
            { valor: 'pessoas', texto: 'Estar com pessoas o tempo todo', eixos: ['Ambiente e Saúde', 'Turismo, Hospitalidade e Lazer', 'Desenvolvimento Educacional e Social'] },
            { valor: 'tarefa', texto: 'Ficar concentrado na minha tarefa', eixos: ['Informação e Comunicação', 'Produção Industrial', 'Controle e Processos Industriais'] }
        ]
    },
    {
        id: 'ritmo',
        pergunta: 'Um bom dia de trabalho para você é...',
        opcoes: [
            { valor: 'rotina', texto: 'Um dia organizado, parecido com o de ontem', eixos: ['Gestão e Negócios', 'Produção Industrial', 'Produção Alimentícia'] },
            { valor: 'variado', texto: 'Um dia diferente do outro, com imprevistos', eixos: ['Segurança', 'Turismo, Hospitalidade e Lazer', 'Produção Cultural e Design'] }
        ]
    },
    {
        id: 'maos',
        pergunta: 'Você aprende e rende melhor...',
        opcoes: [
            { valor: 'pratica', texto: 'Colocando a mão na massa, mexendo nas coisas', eixos: ['Controle e Processos Industriais', 'Infraestrutura', 'Produção Industrial', 'Recursos Naturais'] },
            { valor: 'analise', texto: 'Analisando, planejando e organizando informações', eixos: ['Gestão e Negócios', 'Informação e Comunicação', 'Ambiente e Saúde'] }
        ]
    },
    {
        id: 'ambiente',
        pergunta: 'Onde você preferiria passar o dia?',
        opcoes: [
            { valor: 'dentro', texto: 'Dentro de um lugar fechado, com estrutura', eixos: ['Informação e Comunicação', 'Gestão e Negócios', 'Produção Alimentícia'] },
            { valor: 'fora', texto: 'Na rua, no campo ou circulando por aí', eixos: ['Recursos Naturais', 'Infraestrutura', 'Segurança', 'Turismo, Hospitalidade e Lazer'] }
        ]
    },
    {
        id: 'regras',
        pergunta: 'Você trabalha melhor quando...',
        opcoes: [
            { valor: 'procedimento', texto: 'Existe um procedimento certo a seguir', eixos: ['Ambiente e Saúde', 'Segurança', 'Produção Alimentícia', 'Produção Industrial'] },
            { valor: 'invencao', texto: 'Posso inventar o meu próprio jeito', eixos: ['Produção Cultural e Design', 'Informação e Comunicação', 'Desenvolvimento Educacional e Social'] }
        ]
    },
    {
        id: 'papel',
        pergunta: 'Daqui a alguns anos, você se vê...',
        opcoes: [
            { valor: 'especialista', texto: 'Sendo muito bom numa tarefa específica', eixos: ['Controle e Processos Industriais', 'Informação e Comunicação', 'Produção Cultural e Design'] },
            { valor: 'lideranca', texto: 'Coordenando uma equipe ou um negócio', eixos: ['Gestão e Negócios', 'Turismo, Hospitalidade e Lazer', 'Desenvolvimento Educacional e Social'] }
        ]
    }
];

// Quanto cada resposta de estilo mexe na nota da área (10%). É de propósito
// um empurrãozinho: o interesse declarado continua mandando no resultado.
export const PESO_ESTILO = 0.1;

// Bloco 4 — as cartas de curso. Quantas mostrar e quanto cada resposta vale.
export const MAXIMO_CARTAS = 12;

// Quantas cartas a mais o botão "Ver mais cursos" carrega por clique, e de
// quantas em quantas áreas ele abre quando as áreas atuais se esgotam.
export const LOTE_VER_MAIS = 12;
export const AREAS_POR_EXPANSAO = 4;
export const PESO_RESPOSTA_CARTA = { quero: 1.6, talvez: 1, nao: 0 };
