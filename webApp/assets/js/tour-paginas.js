// Mini-tours de cada página: mesmo motor de destaque do tour da home, só que
// explicando o que tem naquela tela específica. Cada página tem sua própria
// chave de "já visto" no localStorage (fazer o tour de Testes não esconde o
// de Cursos, por exemplo).
//
// Abrem sozinhos na primeira visita só nas páginas do menu, que carregam
// tour-pagina-auto.js (Testes, Cursos, Instituições, Notícias, Mural e
// Perfil). Na matéria, no curso, na instituição e nos três testes o tour só
// abre pelo botão "Tour guiado": quem chega por um link quer ler, e quem está
// no meio de um teste não pode ser interrompido.
//
// Cada passo: { seletor, titulo, texto } e, se precisar, seletorDesktop e
// textoDesktop (outro alvo e texto no computador, ver tour-motor.js). Passo
// cujo alvo não está na tela fica de fora (ex.: a paginação quando só há uma
// página). "passos" também pode ser uma função, quando a ordem depende do
// layout. "variantes" serve para a mesma página com telas diferentes (com e
// sem login): vale a primeira cujo "quando" aparecer.
import { iniciarTourSpotlight } from './tour-motor.js';

const OCULTAR_PROGRESSO = {
    seletor: '#foco-olho',
    titulo: 'Ocultar progresso',
    texto: 'Prefere responder sem ver o andamento? Toque aqui pra esconder o progresso (ou mostrar de novo). A escolha vale pros três testes.'
};

const CONFIGS = {
    testes: {
        chaveVisto: 'futuroplus_tour_testes_visto',
        guarda: '#card-teste-vocacional-pag',
        passos: [
            {
                seletor: '#card-teste-vocacional-pag',
                titulo: 'Teste Vocacional',
                texto: 'O mais completo: cerca de 40 perguntas que terminam sugerindo cursos de verdade pra você seguir. Precisa estar logado.'
            },
            {
                seletor: '#card-teste-rapido-pag',
                titulo: 'Teste rápido de perfil',
                texto: 'Baseado na teoria de Howard Gardner: poucas perguntas, resultado na hora.'
            },
            {
                seletor: '#card-teste-afinidades-pag',
                titulo: 'Teste de Afinidades',
                texto: 'Mesma teoria do teste rápido, avaliando de 0 a 10 cada característica, dá o mesmo tipo de resultado, é só escolher o formato que você prefere.'
            }
        ]
    },
    cursos: {
        chaveVisto: 'futuroplus_tour_cursos_catalogo_visto',
        guarda: '.filtros-cursos',
        passos: [
            {
                seletor: '.filtros-cursos',
                titulo: 'Busque e filtre',
                texto: 'Digite o nome de um curso ou eixo tecnológico, ou use os filtros de instituição e eixo pra achar rapidinho.'
            },
            {
                seletor: '#grid-cursos .card-curso-catalogo',
                titulo: 'Cursos do catálogo',
                texto: 'Cada card é um curso, vermelho é técnico (Etec), azul é superior (Fatec). Clique pra ver os detalhes e quais instituições oferecem.'
            }
        ]
    },
    instituicoes: {
        chaveVisto: 'futuroplus_tour_cursos_visto',
        guarda: '.filtros-cursos',
        passos: [
            {
                seletor: '.filtros-cursos',
                titulo: 'Busque e filtre',
                texto: 'Digite o nome de um curso, cidade ou instituição, ou use os filtros de proximidade, tipo e modalidade pra achar rapidinho.'
            },
            {
                seletor: '#grid-unidades .card-unidade',
                titulo: 'Instituições e cursos',
                texto: 'Cada card é uma Etec, Fatec ou outra instituição, com um resumo dos cursos. Clique em "Ver instituição" pra ver todos os cursos dela, as outras aparecem do mesmo jeito, é só rolar a tela.'
            }
        ]
    },
    noticias: {
        chaveVisto: 'futuroplus_tour_noticias_visto',
        // as notícias chegam do Firestore: espera os cartões aparecerem
        esperarVisivel: '#noticias-grade .noticia-card',
        tentativas: 48,
        passos: [
            {
                seletor: '.noticias-filtros',
                titulo: 'Filtre as notícias',
                texto: 'Veja todas ou só as das Etecs ou das Fatecs.'
            },
            {
                seletor: '#noticias-grade > li:first-child',
                titulo: 'As notícias',
                texto: 'As mais novas vêm primeiro, e as fixadas, com o alfinete, ficam no alto. As do Futuro+ abrem aqui no site; as outras abrem no site de origem, em outra aba.'
            },
            {
                seletor: '#noticias-paginacao-rodape',
                titulo: 'Mais páginas',
                texto: 'São 10 notícias por página. Use os números pra ver as anteriores.'
            }
        ]
    },
    noticia: {
        chaveVisto: 'futuroplus_tour_noticia_visto',
        // a matéria tira o aria-busy quando termina de carregar (ou de avisar)
        esperarVisivel: '#materia:not([aria-busy])',
        tentativas: 48,
        // a lateral fica do lado da matéria a partir de 1180 px (noticia.css):
        // aí ela vem primeiro e o compartilhar, que fica no fim, por último
        passos: () => {
            const compartilhar = {
                seletor: '.materia-partilha',
                titulo: 'Compartilhe',
                texto: 'Gostou da notícia? O botão Compartilhar manda ela pelo WhatsApp e outras redes, já com uma mensagem pronta.'
            };
            const lateral = [
                {
                    seletor: '.lateral-cartao[aria-labelledby="lateral-insta-titulo"]',
                    titulo: 'O Futuro+ no Instagram',
                    texto: 'As últimas postagens aparecem aqui. Toque em uma pra abrir no Instagram, ou siga o perfil pelo botão Seguir.'
                },
                {
                    seletor: '.lateral-cartao[aria-labelledby="lateral-noticias-titulo"]',
                    titulo: 'Mais notícias',
                    texto: 'As últimas notícias do site, pra continuar lendo.'
                },
                {
                    seletor: '.lateral-cartao[aria-labelledby="lateral-sugestoes-titulo"]',
                    titulo: 'Sugestões para você',
                    texto: 'Cursos que combinam com o resultado dos seus testes. Sem teste feito, aparecem os mais oferecidos.'
                }
            ];
            return window.matchMedia('(min-width: 1180px)').matches
                ? [...lateral, compartilhar]
                : [compartilhar, ...lateral];
        }
    },
    curso: {
        chaveVisto: 'futuroplus_tour_curso_visto',
        esperarVisivel: '#curso-detalhe .curso-topo',
        tentativas: 48,
        passos: [
            {
                seletor: '.curso-ficha',
                titulo: 'Ficha do curso',
                texto: 'Duração, carga horária e eixo tecnológico, pra comparar com outros cursos.'
            },
            {
                seletor: '.curso-textos',
                titulo: 'Sobre o curso',
                texto: 'O que você aprende, o que o profissional faz e onde trabalha.'
            },
            {
                seletor: '.curso-onde-estudar',
                titulo: 'Onde estudar',
                texto: 'As Etecs e Fatecs que oferecem o curso. Com o endereço no seu perfil, as mais perto aparecem primeiro.'
            },
            {
                seletor: '.curso-demanda',
                titulo: 'Concorrência',
                texto: 'Quantas pessoas se inscreveram por vaga no último processo seletivo.'
            },
            {
                // a matriz interativa é mais alta que a tela: destaca só o topo dela
                seletor: '.mi-topo, .curso-matriz',
                titulo: 'Matriz curricular',
                texto: 'As disciplinas do curso, etapa por etapa. Toque em uma disciplina ou abra a matriz completa pra ver os detalhes.'
            }
        ]
    },
    instituicao: {
        chaveVisto: 'futuroplus_tour_instituicao_visto',
        esperarVisivel: '#inst-conteudo',
        tentativas: 48,
        passos: [
            {
                seletor: '#inst-numeros',
                titulo: 'Resumo',
                texto: 'Quantos cursos a unidade oferece, telefone, site, endereço no mapa e a nota de quem estudou lá, quando houver.'
            },
            {
                seletor: '#inst-cursos',
                titulo: 'Cursos oferecidos',
                texto: 'Toque em um curso pra ver o que se aprende, a matriz e a concorrência.'
            },
            // estes dois blocos podem passar da altura da tela: destaca o título
            {
                seletor: '#duvidas .inst-cartao-topo',
                titulo: 'Dúvidas frequentes',
                texto: 'Qualquer pessoa com conta pode perguntar. Quem estudou lá e a equipe do Futuro+ respondem.'
            },
            {
                seletor: '#quem-estudou .inst-cartao-topo',
                titulo: 'Quem estudou aqui',
                texto: 'Comentários e notas de quem tem o certificado desta unidade conferido no Mural.'
            }
        ]
    },
    mural: {
        chaveVisto: 'futuroplus_tour_mural_visto',
        variantes: [
            {
                // o botão só aparece para quem está logado
                quando: '#btn-novo-certificado',
                passos: [
                    {
                        seletor: '#btn-novo-certificado',
                        titulo: 'Adicione um certificado',
                        texto: 'Fez algum curso extra? Clique aqui pra pendurar o certificado no seu mural, o CPF é borrado automaticamente antes de enviar.'
                    },
                    {
                        seletor: '.mural-parede',
                        titulo: 'Seu mural',
                        texto: 'Seus certificados ficam guardados aqui, de forma privada, mostrando suas conquistas.'
                    }
                ]
            },
            {
                // visitante: no lugar do botão fica o quadro de "Entrar"
                quando: '#mural-quadro-entrar',
                chaveVisto: 'futuroplus_tour_mural_visitante_visto',
                passos: [
                    {
                        seletor: '#mural-quadro-entrar',
                        titulo: 'Seu mural de certificados',
                        texto: 'Guarde aqui os certificados dos cursos extras que você fez. Entre ou crie uma conta pra começar; só você vê o seu mural.'
                    }
                ]
            }
        ]
    },
    // na ordem da tela (perfil-visao.js); o bloco de Minhas instituições só
    // existe para quem já tem formação, e aí o passo dele fica de fora
    perfil: {
        chaveVisto: 'futuroplus_tour_perfil_visto',
        esperarVisivel: '#perfil-visualizacao',
        passos: [
            {
                seletor: '#btn-editar-perfil',
                titulo: 'Complete seu perfil',
                texto: 'Clique aqui pra contar suas áreas de interesse, curso desejado e objetivo, isso ajuda a melhorar suas recomendações.'
            },
            {
                seletor: '.perfil-passo',
                titulo: 'Perfil completo',
                texto: 'A barra mostra quanto do seu perfil já está preenchido, e o próximo passo sugere o que fazer agora.'
            },
            {
                seletor: '#formacoes',
                titulo: 'Formações',
                texto: 'Os cursos que você já concluiu. Eles entram aqui pelos certificados conferidos no Mural.'
            },
            {
                seletor: '.perfil-sobre',
                titulo: 'Sobre mim',
                texto: 'O curso que você quer seguir, seu estilo de aprendizado e suas áreas de interesse, do jeito que você contou no Editar perfil.'
            },
            {
                seletor: '#mural',
                titulo: 'Seu mural',
                texto: 'Uma prévia dos certificados que você pendurou no Mural.'
            },
            {
                // no celular, com os dois testes feitos, o cartão passa da
                // altura da tela: lá o destaque fica no título
                seletor: '#perfil-cartao-testes .perfil-cartao-topo',
                seletorDesktop: '#perfil-cartao-testes',
                titulo: 'Seus testes',
                texto: 'O resultado dos seus testes aparece aqui, sempre que quiser conferir de novo.',
                textoDesktop: 'O resultado dos seus testes aparece aqui, sempre que quiser conferir de novo.'
            },
            {
                seletor: '.perfil-conquistas',
                titulo: 'Conquistas',
                texto: 'Selos que você ganha completando o perfil, fazendo o Teste Vocacional, pendurando o primeiro certificado e se formando numa Etec ou Fatec.'
            },
            {
                seletor: '.perfil-instituicoes',
                titulo: 'Minhas instituições',
                texto: 'As escolas onde você se formou. Dá pra comentar sobre cada uma, e o comentário aparece na página dela.'
            },
            {
                seletor: '#perfil-cartao-push',
                titulo: 'Notificações',
                texto: 'Aqui você ativa os avisos do Futuro+ no navegador, pra receber mesmo com o site fechado.'
            }
        ]
    },
    'teste-rapido': {
        chaveVisto: 'futuroplus_tour_teste_rapido_visto',
        esperarVisivel: '#options-container .opcao-grande',
        passos: [
            {
                // o painel tem a altura da tela: destaca só o bloco do progresso
                seletor: '#foco-progresso',
                titulo: 'Seu andamento',
                texto: 'Aqui você vê em que pergunta está e as áreas que o teste avalia. Com uma conta, o seu perfil vai se formando a cada resposta.'
            },
            OCULTAR_PROGRESSO,
            {
                seletor: '#options-container',
                seletorDesktop: '#options-container',
                titulo: 'Responda',
                texto: 'Toque na opção que mais combina com você. Não existe resposta certa.',
                textoDesktop: 'Clique na opção que mais combina com você, ou use as teclas de 1 a 4. Não existe resposta certa.'
            }
        ]
    },
    'teste-afinidades': {
        chaveVisto: 'futuroplus_tour_teste_afinidades_visto',
        esperarVisivel: '#afinidades-linhas .ordem-opcao',
        passos: [
            {
                // no celular as 8 atividades ficam uma embaixo da outra, mais
                // altas que a tela: destaca a primeira
                seletor: '#afinidades-linhas .ordem-opcao',
                seletorDesktop: '#afinidades-linhas',
                titulo: 'Coloque em ordem',
                texto: 'Toque nas atividades da que você mais gosta pra que menos gosta. Tocou errado? Toque de novo pra tirar.',
                // com seletorDesktop, o motor usa o textoDesktop no computador
                textoDesktop: 'Clique nas atividades da que você mais gosta pra que menos gosta. Clicou errado? Clique de novo pra tirar.'
            },
            {
                seletor: '.ordem-acoes',
                titulo: 'Desfazer ou recomeçar',
                texto: 'Volte o último toque ou recomece o bloco quando quiser.'
            },
            OCULTAR_PROGRESSO,
            {
                seletor: '#afinidades-avancar',
                titulo: 'Próximo bloco',
                texto: 'Com as 8 atividades em ordem, este botão libera o próximo bloco. São 4 ao todo.'
            }
        ]
    },
    'teste-vocacional': {
        chaveVisto: 'futuroplus_tour_teste_vocacional_visto',
        variantes: [
            {
                // com login: a primeira parte do teste já desenhada
                quando: '#voc-teste:not([hidden]) #voc-conteudo > *',
                passos: [
                    {
                        seletor: '.foco-anel-linha',
                        seletorDesktop: '#foco-etapas',
                        titulo: 'As 4 partes',
                        texto: 'O anel mostra em que parte do teste você está. São 4: sua situação, o que combina com você, seu jeito de trabalhar e os cursos.',
                        textoDesktop: 'O teste tem 4 partes: sua situação, o que combina com você, seu jeito de trabalhar e os cursos. Aqui você vê em qual está.'
                    },
                    {
                        seletor: '#voc-conteudo .voc-pergunta, #voc-conteudo .voc-carta',
                        titulo: 'Responda',
                        texto: 'Marque o que mais combina com você. Na última parte aparecem cursos de verdade pra você dizer se combinam.'
                    },
                    OCULTAR_PROGRESSO,
                    {
                        seletor: '.voc-navegacao',
                        titulo: 'Continuar',
                        texto: 'Avance quando terminar cada parte. Dá pra voltar e mudar as respostas.'
                    }
                ]
            },
            {
                // sem login: o cartão que explica o teste e pede para entrar
                quando: '#voc-precisa-login',
                chaveVisto: 'futuroplus_tour_teste_vocacional_visitante_visto',
                passos: [
                    {
                        seletor: '#foco-progresso',
                        titulo: 'Como é o teste',
                        texto: 'São 4 partes e uns 10 minutos. No fim aparecem cursos das Etecs e Fatecs que combinam com você.'
                    },
                    {
                        // o cartão tem a altura da tela: destaca só os botões
                        seletor: '#voc-precisa-login .voc-acoes-resultado',
                        titulo: 'Entre pra fazer o teste',
                        texto: 'O resultado fica guardado no seu perfil, por isso o teste pede login. Entre ou crie uma conta pra começar.'
                    }
                ]
            }
        ]
    }
};

function paginaAtual() {
    // os três testes primeiro: são telas próprias, sem nada das outras
    if (document.getElementById('quiz-container')) return 'teste-rapido';
    if (document.getElementById('afinidades-container')) return 'teste-afinidades';
    if (document.getElementById('voc-teste')) return 'teste-vocacional';
    if (document.getElementById('grid-cursos')) return 'cursos';
    if (document.getElementById('grid-unidades') && document.querySelector('.filtros-cursos')) return 'instituicoes';
    if (document.querySelector('.teste-card')) return 'testes';
    if (document.getElementById('mural-quadros')) return 'mural';
    if (document.getElementById('perfil-visualizacao')) return 'perfil';
    if (document.getElementById('noticias-grade')) return 'noticias';
    if (document.getElementById('materia')) return 'noticia';
    if (document.getElementById('curso-detalhe')) return 'curso';
    if (document.getElementById('inst-pagina')) return 'instituicao';
    return null;
}

// Esta página tem tour? (o botão "Tour guiado" só manda para o da Início
// quando não tem; se tem e ainda não deu para abrir, não tira a pessoa daqui)
export function temTourNaPagina() {
    return paginaAtual() !== null;
}

// na tela e com tamanho (uma paginação vazia, sem nenhuma página, não conta)
function elementoVisivel(el) {
    if (!el || el.offsetParent === null) return false;
    const caixa = el.getBoundingClientRect();
    return caixa.width > 0 && caixa.height > 0;
}

const visivel = (seletor) => elementoVisivel(document.querySelector(seletor));

// O conteúdo de várias páginas só aparece depois de carregar (ou de confirmar
// o login): espera um pouco por ele em vez de destacar o que ainda não está
// lá. Devolve o índice do primeiro seletor que aparecer, ou -1.
function esperarAlgumVisivel(seletores, { tentativas = 20, intervalo = 250 } = {}) {
    return new Promise((resolve) => {
        let tentativa = 0;
        (function checar() {
            const indice = seletores.findIndex(visivel);
            if (indice !== -1 || ++tentativa >= tentativas) {
                resolve(indice);
                return;
            }
            setTimeout(checar, intervalo);
        })();
    });
}

// o alvo do passo no tamanho de tela atual (o mesmo critério do tour-motor.js)
function alvoNaTela(passo) {
    const desktop = window.matchMedia('(min-width: 1024px)').matches && passo.seletorDesktop;
    return visivel(desktop ? passo.seletorDesktop : passo.seletor);
}

// forcar: true quando a pessoa clica no botão de repetir tour manualmente.
export async function iniciarTourDaPagina({ forcar = false } = {}) {
    const pagina = paginaAtual();
    if (!pagina) return false;
    let cfg = CONFIGS[pagina];
    const espera = { tentativas: cfg.tentativas };

    if (cfg.variantes) {
        const indice = await esperarAlgumVisivel(cfg.variantes.map((v) => v.quando), espera);
        if (indice === -1) return false; // nenhuma das telas apareceu
        cfg = { ...cfg, ...cfg.variantes[indice] };
    } else if (cfg.esperarVisivel) {
        if (await esperarAlgumVisivel([cfg.esperarVisivel], espera) === -1) return false;
    } else if (cfg.guarda && !document.querySelector(cfg.guarda)) {
        return false;
    }

    const lista = typeof cfg.passos === 'function' ? cfg.passos() : cfg.passos;
    const passos = lista.filter((passo) => passo.tipo === 'boas-vindas' || alvoNaTela(passo));
    if (!passos.length) return false;

    return iniciarTourSpotlight({ chaveVisto: cfg.chaveVisto, passos, forcar });
}
