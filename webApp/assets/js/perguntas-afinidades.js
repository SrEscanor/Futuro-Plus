// Teste de Afinidades: a pessoa avalia de 0 a 10 o quanto cada
// característica combina com ela (em vez de escolher 1 opção só).
//
// Cada bloco tem 8 linhas (A-H) e cada letra representa SEMPRE a mesma
// inteligência em todos os blocos — isso é o que garante que, no final,
// toda categoria teve exatamente 4 notas (uma por bloco) e a pontuação
// entre elas fica comparável.
export const blocosAfinidades = [
    {
        titulo: "Coisas que eu mais gosto de fazer",
        linhas: [
            { letra: "A", texto: "Praticar esportes e atividades físicas", categoria: "corporal" },
            { letra: "B", texto: "Desenhar, montar quebra-cabeças visuais ou observar mapas", categoria: "espacial" },
            { letra: "C", texto: "Interagir e conversar com pessoas novas", categoria: "interpessoal" },
            { letra: "D", texto: "Refletir sobre meus próprios sentimentos e pensamentos", categoria: "intrapessoal" },
            { letra: "E", texto: "Participar de discussões e debates de ideias", categoria: "linguistica" },
            { letra: "F", texto: "Jogos de raciocínio lógico e estratégia", categoria: "logica" },
            { letra: "G", texto: "Cantar e ouvir diferentes gêneros musicais", categoria: "musical" },
            { letra: "H", texto: "Aproveitar a natureza ao ar livre", categoria: "naturalista" }
        ]
    },
    {
        titulo: "Tenho facilidade em...",
        linhas: [
            { letra: "A", texto: "Aprender novas atividades físicas", categoria: "corporal" },
            { letra: "B", texto: "Ler mapas e me localizar nos espaços", categoria: "espacial" },
            { letra: "C", texto: "Trabalhar em equipe", categoria: "interpessoal" },
            { letra: "D", texto: "Controlar minhas emoções", categoria: "intrapessoal" },
            { letra: "E", texto: "Aprender novos idiomas", categoria: "linguistica" },
            { letra: "F", texto: "Fazer cálculos e resolver problemas técnicos", categoria: "logica" },
            { letra: "G", texto: "Aprender a tocar instrumentos", categoria: "musical" },
            { letra: "H", texto: "Interagir com animais", categoria: "naturalista" }
        ]
    },
    {
        titulo: "Eu me considero alguém...",
        linhas: [
            { letra: "A", texto: "Ágil e habilidoso fisicamente", categoria: "corporal" },
            { letra: "B", texto: "Observador de detalhes visuais e do espaço ao redor", categoria: "espacial" },
            { letra: "C", texto: "Sociável, que faz amizade com facilidade", categoria: "interpessoal" },
            { letra: "D", texto: "Introspectivo e em contato com os próprios sentimentos", categoria: "intrapessoal" },
            { letra: "E", texto: "Bom de conversa e argumentação", categoria: "linguistica" },
            { letra: "F", texto: "Racional e analítico na hora de decidir", categoria: "logica" },
            { letra: "G", texto: "Sensível a ritmos, sons e melodias", categoria: "musical" },
            { letra: "H", texto: "Conectado com a natureza e os animais", categoria: "naturalista" }
        ]
    },
    {
        titulo: "Me sinto melhor aprendendo através de",
        linhas: [
            { letra: "A", texto: "Atividades práticas, colocando a mão na massa", categoria: "corporal" },
            { letra: "B", texto: "Mapas, diagramas e organização visual da informação", categoria: "espacial" },
            { letra: "C", texto: "Estudos em grupo", categoria: "interpessoal" },
            { letra: "D", texto: "Estudos individuais, no meu próprio ritmo", categoria: "intrapessoal" },
            { letra: "E", texto: "Palestras, leituras e estudos de caso", categoria: "linguistica" },
            { letra: "F", texto: "Exercícios com dados, números e análise", categoria: "logica" },
            { letra: "G", texto: "Músicas ou ritmos que me ajudam a memorizar", categoria: "musical" },
            { letra: "H", texto: "Observação da natureza e de padrões ao meu redor", categoria: "naturalista" }
        ]
    }
];
