const questions = [
    {
        text: "1. Como você prefere receber as instruções para montar um equipamento novo?",
        options: [
            { text: "Lendo o manual passo a passo cuidadosamente.", category: "linguistica" },
            { text: "Olhando os diagramas, fotos e esquemas visuais.", category: "espacial" },
            { text: "Começando a montar e descobrindo como as peças se encaixam na prática.", category: "corporal" },
            { text: "Buscando a lógica por trás do funcionamento antes de tocar nas peças.", category: "logica" }
        ]
    },
    {
        text: "2. Em uma discussão em grupo, qual é o seu ponto forte?",
        options: [
            { text: "Organizar as falas e garantir que todos se sintam ouvidos.", category: "interpessoal" },
            { text: "Apresentar argumentos lógicos e baseados em dados concretos.", category: "logica" },
            { text: "Expressar meus pontos de vista com vocabulário rico e persuasivo.", category: "linguistica" },
            { text: "Observar silenciosamente até ter certeza da minha própria conclusão.", category: "intrapessoal" }
        ]
    },
    {
        text: "3. O que chama mais a sua atenção em um filme ou série?",
        options: [
            { text: "A trilha sonora e os efeitos sonoros marcantes.", category: "musical" },
            { text: "A fotografia cinematográfica e a paleta de cores das cenas.", category: "espacial" },
            { text: "Os diálogos complexos e o roteiro bem construído.", category: "linguistica" },
            { text: "A evolução psicológica dos personagens e suas motivações profundas.", category: "intrapessoal" }
        ]
    },
    {
        text: "4. Qual é a sua forma favorita de passar o tempo livre ao ar livre?",
        options: [
            { text: "Praticar esportes coletivos ou atividades físicas intensas.", category: "corporal" },
            { text: "Fazer trilhas, observar pássaros ou cuidar de um jardim.", category: "naturalista" },
            { text: "Fazer um piquenique com uma grande roda de amigos.", category: "interpessoal" },
            { text: "Ler um bom livro embaixo de uma árvore, em silêncio.", category: "intrapessoal" }
        ]
    },
    {
        text: "5. Quando você se depara com um erro no computador, como reage?",
        options: [
            { text: "Leio a mensagem de erro e procuro a descrição exata na internet.", category: "linguistica" },
            { text: "Tento investigar o padrão do erro para deduzir a falha do sistema.", category: "logica" },
            { text: "Ligo ou mando mensagem para alguém que saiba como resolver.", category: "interpessoal" },
            { text: "Tento reiniciar, desconectar cabos ou apertar botões para ver se volta.", category: "corporal" }
        ]
    },
    {
        text: "6. Qual tipo de documentário você acharia mais fascinante?",
        options: [
            { text: "A vida selvagem da Amazônia e os ecossistemas ocultos.", category: "naturalista" },
            { text: "A biografia de um grande compositor de música clássica.", category: "musical" },
            { text: "Como as grandes pontes e arranha-céus foram projetados.", category: "espacial" },
            { text: "Os mistérios matemáticos do universo e teorias da física.", category: "logica" }
        ]
    },
    {
        text: "7. Como você se sente ao planejar uma viagem?",
        options: [
            { text: "Gosto de criar uma planilha rigorosa de gastos e cronogramas.", category: "logica" },
            { text: "Gosto de ver o mapa da cidade e desenhar mentalmente o trajeto das ruas.", category: "espacial" },
            { text: "Gosto de garantir que o clima do grupo estará bom e todos vão concordar com o destino.", category: "interpessoal" },
            { text: "Prefiro viajar sozinho ou para lugares onde eu possa refletir e ter privacidade.", category: "intrapessoal" }
        ]
    },
    {
        text: "8. Se pedissem para você dar uma aula amanhã, sobre o que seria?",
        options: [
            { text: "Como tocar um instrumento musical ou compor batidas.", category: "musical" },
            { text: "Dicas de jardinagem, biologia ou sustentabilidade.", category: "naturalista" },
            { text: "Dicas de oratória, escrita criativa ou debate de ideias.", category: "linguistica" },
            { text: "Como resolver um cubo mágico ou técnicas de xadrez.", category: "logica" }
        ]
    },
    {
        text: "9. O que ajuda você a se concentrar melhor?",
        options: [
            { text: "Ouvir uma playlist específica de música instrumental ou lofi.", category: "musical" },
            { text: "Caminhar pelo quarto enquanto penso no problema.", category: "corporal" },
            { text: "Estar em um ambiente completamente silencioso, sozinho.", category: "intrapessoal" },
            { text: "Estar cercado por plantas ou com uma janela aberta para a natureza.", category: "naturalista" }
        ]
    },
    {
        text: "10. Você acaba de entrar em uma nova escola/faculdade. Qual sua atitude no primeiro dia?",
        options: [
            { text: "Tento logo descobrir quem são as pessoas e puxar assunto.", category: "interpessoal" },
            { text: "Tento me situar no mapa do campus, gravando onde ficam os prédios e salas.", category: "espacial" },
            { text: "Fico analisando silenciosamente o ambiente e meus próprios sentimentos.", category: "intrapessoal" },
            { text: "Presto muita atenção na explicação dos professores e no conteúdo escrito.", category: "linguistica" }
        ]
    },
    {
        text: "11. Como você lida com as suas emoções em um momento de estresse?",
        options: [
            { text: "Preciso falar com um amigo próximo para desabafar.", category: "interpessoal" },
            { text: "Preciso me isolar para processar o que estou sentindo sozinho.", category: "intrapessoal" },
            { text: "Preciso correr, ir para a academia ou fazer um trabalho braçal.", category: "corporal" },
            { text: "Ouço minhas músicas favoritas no volume máximo para relaxar.", category: "musical" }
        ]
    },
    {
        text: "12. Qual desafio parece mais estimulante para você?",
        options: [
            { text: "Entender o mercado financeiro e aprender a investir dinheiro.", category: "logica" },
            { text: "Aprender a esculpir madeira ou consertar um motor de carro.", category: "corporal" },
            { text: "Aprender um idioma novo com um alfabeto totalmente diferente.", category: "linguistica" },
            { text: "Aprender a catalogar espécies de insetos, aves ou minerais.", category: "naturalista" }
        ]
    },
    {
        text: "13. O que mais incomoda você em um ambiente de trabalho?",
        options: [
            { text: "A falta de clareza nas metas e regras desorganizadas.", category: "logica" },
            { text: "Um ambiente cinza, sem janelas, sem decoração ou plantas.", category: "espacial" },
            { text: "Fofocas, intrigas e falta de união na equipe.", category: "interpessoal" },
            { text: "Poluição sonora persistente, como alarmes, obras ou ruídos repetitivos.", category: "musical" }
        ]
    },
    {
        text: "14. Você foi convidado para ser voluntário em uma ONG. Que vaga escolhe?",
        options: [
            { text: "Guia ecológico em um parque de preservação ambiental.", category: "naturalista" },
            { text: "Apresentador de palco ou coral em eventos beneficentes.", category: "musical" },
            { text: "Professor de atividades físicas ou artes cênicas para jovens.", category: "corporal" },
            { text: "Designer encarregado de criar a identidade visual das campanhas.", category: "espacial" }
        ]
    },
    {
        text: "15. Se você estivesse tentando memorizar as capitais dos países, como faria?",
        options: [
            { text: "Criaria uma canção ou melodia com o nome das cidades.", category: "musical" },
            { text: "Visualizaria o mapa-múndi e a posição exata de cada país.", category: "espacial" },
            { text: "Leria e escreveria a lista até fixar as palavras.", category: "linguistica" },
            { text: "Associaria a capital a um animal ou paisagem típica daquela região.", category: "naturalista" }
        ]
    }
];


// ============================================================
// PONTUAÇÃO
// ============================================================

let scores = {
    logica: 0,
    interpessoal: 0,
    espacial: 0,
    corporal: 0,
    linguistica: 0,
    intrapessoal: 0,
    musical: 0,
    naturalista: 0
};

let currentQuestionIndex = 0;


// ============================================================
// ELEMENTOS DA INTERFACE
// ============================================================

const questionTitle = document.getElementById("question-title");
const optionsContainer = document.getElementById("options-container");
const progressText = document.getElementById("progress");
const progressFill = document.getElementById("progress-fill");
const quizContainer = document.getElementById("quiz-container");
const resultContainer = document.getElementById("result-container");


// ============================================================
// CARREGAR PERGUNTA
// ============================================================

function loadQuestion() {
    optionsContainer.innerHTML = "";

    const q = questions[currentQuestionIndex];

    questionTitle.textContent = q.text;

    progressText.textContent =
        `Pergunta ${currentQuestionIndex + 1} de ${questions.length}`;

    const porcentagem =
        ((currentQuestionIndex + 1) / questions.length) * 100;

    if (progressFill) {
        progressFill.style.width = `${porcentagem}%`;
    }

    q.options.forEach(option => {
        const btn = document.createElement("button");

        btn.textContent = option.text;

        btn.onclick = () => selectOption(option.category);

        optionsContainer.appendChild(btn);
    });
}


// ============================================================
// SELECIONAR RESPOSTA
// ============================================================

function selectOption(category) {

    // Soma um ponto para a categoria escolhida
    if (scores.hasOwnProperty(category)) {
        scores[category]++;
    }

    currentQuestionIndex++;

    if (currentQuestionIndex < questions.length) {
        loadQuestion();
    } else {
        showResult();
    }
}


// ============================================================
// DADOS DOS RESULTADOS
// ============================================================

const resultData = {

    logica: {
        title: "Inteligência Lógico-Matemática",
        desc: "Você tem facilidade com lógica, números, padrões e programação. Seu perfil é analítico e focado na resolução de problemas complexos.<br><br><strong>🎯 Cursos que podem combinar com esse perfil:</strong><br><strong>Etec:</strong> Desenvolvimento de Sistemas, Contabilidade<br><strong>Fatec:</strong> Análise e Desenvolvimento de Sistemas (ADS)"
    },

    interpessoal: {
        title: "Inteligência Interpessoal",
        desc: "Você entende bem as pessoas, tem empatia e perfil de liderança. Excelente em trabalhos de equipe e comunicação humana.<br><br><strong>🎯 Cursos que podem combinar com esse perfil:</strong><br><strong>Etec:</strong> Administração, Recursos Humanos<br><strong>Fatec:</strong> Gestão de Recursos Humanos, Gestão Empresarial"
    },

    espacial: {
        title: "Inteligência Espacial",
        desc: "Você percebe o mundo visualmente com clareza e entende o espaço físico, proporções e estética.<br><br><strong>🎯 Cursos que podem combinar com esse perfil:</strong><br><strong>Etec:</strong> Design Gráfico, Edificações<br><strong>Fatec:</strong> Jogos Digitais, Construção de Edifícios"
    },

    corporal: {
        title: "Inteligência Corporal-Cinestésica",
        desc: "Você usa seu corpo e o tato de forma muito expressiva e habilidosa, aprendendo melhor na prática e na experimentação.<br><br><strong>🎯 Cursos que podem combinar com esse perfil:</strong><br><strong>Etec:</strong> Enfermagem, Mecatrônica<br><strong>Fatec:</strong> Mecatrônica Industrial, Logística"
    },

    linguistica: {
        title: "Inteligência Linguística",
        desc: "Você domina a comunicação oral e escrita com facilidade. Sabe persuadir, explicar e criar através das palavras.<br><br><strong>🎯 Cursos que podem combinar com esse perfil:</strong><br><strong>Etec:</strong> Marketing, Secretariado<br><strong>Fatec:</strong> Gestão Comercial, Secretariado Executivo"
    },

    intrapessoal: {
        title: "Inteligência Intrapessoal",
        desc: "Você tem alto autoconhecimento, foco e trabalha muito bem de forma autônoma. Tem forte perfil analítico e empreendedor.<br><br><strong>🎯 Cursos que podem combinar com esse perfil:</strong><br><strong>Etec:</strong> Administração, Marketing<br><strong>Fatec:</strong> Gestão Empresarial, Gestão Financeira"
    },

    musical: {
        title: "Inteligência Musical",
        desc: "Você tem uma sensibilidade gigante para sons, ritmos e tons. Capta padrões sonoros que a maioria não percebe.<br><br><strong>🎯 Cursos que podem combinar com esse perfil:</strong><br><strong>Etec:</strong> Canto, Dança (Etec de Artes), Eventos<br><strong>Fatec:</strong> Produção Fonográfica, Eventos"
    },

    naturalista: {
        title: "Inteligência Naturalista",
        desc: "Você tem forte conexão com o meio ambiente, biologia e seres vivos, notando padrões na natureza com facilidade.<br><br><strong>🎯 Cursos que podem combinar com esse perfil:</strong><br><strong>Etec:</strong> Meio Ambiente, Agropecuária<br><strong>Fatec:</strong> Agronegócio, Gestão Ambiental"
    }
};


// ============================================================
// RESULTADO
// ============================================================

function showResult() {

    quizContainer.style.display = "none";
    resultContainer.style.display = "block";

    // --------------------------------------------------------
    // Descobrir quantas perguntas existem para cada categoria
    // --------------------------------------------------------

    const categoryQuestionCount = {};

    Object.keys(scores).forEach(category => {
        categoryQuestionCount[category] = 0;
    });

    questions.forEach(question => {
        question.options.forEach(option => {

            if (categoryQuestionCount.hasOwnProperty(option.category)) {
                categoryQuestionCount[option.category]++;
            }

        });
    });


    // --------------------------------------------------------
    // Criar pontuação percentual
    // --------------------------------------------------------

    const percentages = {};

    Object.keys(scores).forEach(category => {

        const maxPossible = categoryQuestionCount[category];

        if (maxPossible > 0) {
            percentages[category] =
                (scores[category] / maxPossible) * 100;
        } else {
            percentages[category] = 0;
        }

    });


    // --------------------------------------------------------
    // Ordenar categorias da maior para a menor
    // --------------------------------------------------------

    const ranking = Object.keys(percentages).sort((a, b) => {

        if (percentages[b] !== percentages[a]) {
            return percentages[b] - percentages[a];
        }

        // Desempate usando a pontuação bruta
        return scores[b] - scores[a];

    });


    // --------------------------------------------------------
    // Pegar a principal e a secundária
    // --------------------------------------------------------

    const primaryCategory = ranking[0];

    const secondaryCategory =
        ranking.length > 1 ? ranking[1] : null;


    // --------------------------------------------------------
    // Título principal
    // --------------------------------------------------------

    let combinedTitle =
        resultData[primaryCategory].title;


    // --------------------------------------------------------
    // Montar descrição principal
    // --------------------------------------------------------

    let combinedDesc = `
        <div style="margin-bottom: 25px;">

            <h3>${resultData[primaryCategory].title}</h3>

            <div style="
                font-size: 20px;
                font-weight: bold;
                margin: 15px 0;
            ">
                ${Math.round(percentages[primaryCategory])}% de afinidade
            </div>

            ${resultData[primaryCategory].desc}

        </div>
    `;


    // --------------------------------------------------------
    // Adicionar inteligência secundária
    // --------------------------------------------------------

    if (
        secondaryCategory &&
        percentages[secondaryCategory] > 0
    ) {

        combinedDesc += `
            <hr style="
                border:0;
                border-top:1px solid #ddd;
                margin:25px 0;
            ">

            <div style="margin-bottom: 25px;">

                <h3>
                    Perfil complementar:
                    ${resultData[secondaryCategory].title}
                </h3>

                <div style="
                    font-size: 18px;
                    font-weight: bold;
                    margin: 10px 0;
                ">
                    ${Math.round(percentages[secondaryCategory])}% de afinidade
                </div>

                ${resultData[secondaryCategory].desc}

            </div>
        `;
    }


    // --------------------------------------------------------
    // Ranking completo
    // --------------------------------------------------------

    combinedDesc += `
        <hr style="
            border:0;
            border-top:1px solid #ddd;
            margin:25px 0;
        ">

        <h3>📊 Seu perfil completo</h3>

        <div style="margin-top: 15px;">
    `;


    ranking.forEach((category, index) => {

        const percentage =
            Math.round(percentages[category]);

        combinedDesc += `
            <div style="
                margin-bottom: 15px;
            ">

                <div style="
                    display:flex;
                    justify-content:space-between;
                    margin-bottom:5px;
                    font-weight:bold;
                ">

                    <span>
                        ${index + 1}º -
                        ${resultData[category].title}
                    </span>

                    <span>
                        ${percentage}%
                    </span>

                </div>

                <div style="
                    width:100%;
                    height:10px;
                    background:#e5e5e5;
                    border-radius:10px;
                    overflow:hidden;
                ">

                    <div style="
                        width:${percentage}%;
                        height:100%;
                        background:currentColor;
                        border-radius:10px;
                    "></div>

                </div>

            </div>
        `;

    });


    combinedDesc += `
        </div>

        <p style="
            margin-top:25px;
            font-size:14px;
            opacity:0.75;
        ">
            💡 O resultado representa um perfil de afinidade
            com base nas respostas escolhidas. Ele não determina
            sozinho uma profissão ou curso ideal.
        </p>
    `;


    // --------------------------------------------------------
    // Colocar resultado na página
    // --------------------------------------------------------

    document.getElementById("result-title").textContent =
        combinedTitle;

    document.getElementById("result-desc").innerHTML =
        combinedDesc;
}


// ============================================================
// INICIAR O QUIZ
// ============================================================

loadQuestion();