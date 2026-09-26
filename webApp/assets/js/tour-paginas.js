// Mini-tours de cada página (Testes, Cursos, Mural, Perfil): mesmo motor de
// destaque do tour da home, só que explicando o que tem naquela tela
// específica. Cada página tem sua própria chave de "já visto" no
// localStorage — fazer o tour de Testes não esconde o de Cursos, por
// exemplo.
import { iniciarTourSpotlight } from './tour-motor.js';

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
                texto: 'Mesma teoria do teste rápido, avaliando de 0 a 10 cada característica — dá o mesmo tipo de resultado, é só escolher o formato que você prefere.'
            }
        ]
    },
    cursos: {
        chaveVisto: 'futuroplus_tour_cursos_visto',
        guarda: '.filtros-cursos',
        passos: [
            {
                seletor: '.filtros-cursos',
                titulo: 'Busque e filtre',
                texto: 'Digite o nome de um curso, cidade ou instituição, ou use os filtros de proximidade, tipo e modalidade pra achar rapidinho.'
            },
            {
                seletor: '#grid-unidades',
                titulo: 'Unidades e cursos',
                texto: 'Aqui aparecem as Etecs, Fatecs e outras instituições com os cursos que oferecem. Clique em "Ver unidades" pra ver os detalhes de cada uma.'
            }
        ]
    },
    mural: {
        chaveVisto: 'futuroplus_tour_mural_visto',
        esperarVisivel: '#mural-app',
        passos: [
            {
                seletor: '#btn-novo-certificado',
                titulo: 'Adicione um certificado',
                texto: 'Fez algum curso extra? Clique aqui pra pendurar o certificado no seu mural — o CPF é borrado automaticamente antes de enviar.'
            },
            {
                seletor: '.mural-parede',
                titulo: 'Seu mural',
                texto: 'Seus certificados ficam guardados aqui, de forma privada, mostrando suas conquistas.'
            }
        ]
    },
    perfil: {
        chaveVisto: 'futuroplus_tour_perfil_visto',
        esperarVisivel: '#perfil-visualizacao',
        passos: [
            {
                seletor: '#btn-editar-perfil',
                titulo: 'Complete seu perfil',
                texto: 'Clique aqui pra contar suas áreas de interesse, curso desejado e objetivo — isso ajuda a melhorar suas recomendações.'
            },
            {
                seletor: '#perfil-cartao-testes',
                titulo: 'Seus testes',
                texto: 'O resultado dos seus testes aparece aqui, sempre que quiser conferir de novo.'
            }
        ]
    }
};

function paginaAtual() {
    if (document.getElementById('grid-unidades') && document.querySelector('.filtros-cursos')) return 'cursos';
    if (document.querySelector('.teste-card')) return 'testes';
    if (document.getElementById('mural-quadros')) return 'mural';
    if (document.getElementById('perfil-visualizacao')) return 'perfil';
    return null;
}

function elementoVisivel(el) {
    return !!el && el.offsetParent !== null;
}

// Mural e Perfil só mostram o conteúdo de verdade depois de confirmar login
// (senão é a tela de "entre na sua conta"); espera um pouco pra não tentar
// destacar um elemento que ainda está escondido.
function esperarElementoVisivel(seletor, { tentativas = 20, intervalo = 250 } = {}) {
    return new Promise((resolve) => {
        let tentativa = 0;
        (function checar() {
            const el = document.querySelector(seletor);
            if (elementoVisivel(el)) {
                resolve(true);
                return;
            }
            tentativa += 1;
            if (tentativa >= tentativas) {
                resolve(false);
                return;
            }
            setTimeout(checar, intervalo);
        })();
    });
}

// forcar: true quando a pessoa clica no botão de repetir tour manualmente.
export async function iniciarTourDaPagina({ forcar = false } = {}) {
    const pagina = paginaAtual();
    if (!pagina) return false;
    const cfg = CONFIGS[pagina];

    if (cfg.esperarVisivel) {
        const apareceu = await esperarElementoVisivel(cfg.esperarVisivel);
        if (!apareceu) return false; // provavelmente a pessoa não está logada
    } else if (cfg.guarda && !document.querySelector(cfg.guarda)) {
        return false;
    }

    return iniciarTourSpotlight({ chaveVisto: cfg.chaveVisto, passos: cfg.passos, forcar });
}
