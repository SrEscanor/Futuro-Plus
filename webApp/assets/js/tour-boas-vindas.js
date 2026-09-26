// Tour guiado de primeira visita à home: destaca partes da página e explica
// pra que servem, uma "missão" (passo) de cada vez — só na primeira vez que
// alguém visita o site nesse navegador, e pode ser pulado a qualquer hora.
const CHAVE_TOUR_VISTO = 'futuroplus_tour_visto';

const PASSOS = [
    { tipo: 'boas-vindas' },
    {
        seletor: '.hamburger',
        seletorDesktop: '.menu-panel',
        titulo: 'Menu',
        texto: 'Por aqui você navega entre Início, Testes, Cursos, Mural e Perfil quando quiser.',
        textoDesktop: 'No computador o menu já fica fixo na lateral — é só clicar em Início, Testes, Cursos, Mural ou Perfil quando quiser.'
    },
    {
        seletor: '#card-vocacional',
        titulo: 'Teste Vocacional',
        texto: 'O mais completo: descobre as áreas que combinam com você e já termina mostrando cursos de verdade pra seguir.'
    },
    {
        seletor: '#card-perfil',
        titulo: 'Teste rápido de perfil',
        texto: 'Baseado na teoria das inteligências múltiplas de Howard Gardner: descobre qual o seu tipo de inteligência mais forte (lógica, linguística, espacial, interpessoal, entre outras) e sugere áreas ligadas a ela. Dica: dá o MESMO resultado do "Teste de Afinidades" — só muda o jeito de responder. Não precisa fazer os dois.'
    },
    {
        seletor: '.mural-cta',
        titulo: 'Mural',
        texto: 'Guarde aqui os certificados de cursos extras que você já fez.'
    },
    {
        seletor: '#chatbot-toggle',
        titulo: 'Assistente virtual',
        texto: 'Tem uma dúvida? Pergunte aqui a qualquer momento — sobre cursos, vestibulinho ou qualquer coisa do site.'
    }
];

function jaViu() {
    try {
        return localStorage.getItem(CHAVE_TOUR_VISTO) === '1';
    } catch {
        return false;
    }
}

function marcarComoVisto() {
    try {
        localStorage.setItem(CHAVE_TOUR_VISTO, '1');
    } catch {
        // sem localStorage (modo privado etc.): o tour volta a aparecer na próxima visita, sem problema
    }
    window.__tourAtivo = false;
}

function injetarEstilos() {
    if (document.getElementById('tb-estilos')) return;
    const estilo = document.createElement('style');
    estilo.id = 'tb-estilos';
    estilo.textContent = `
        .tb-overlay {
            position: fixed;
            inset: 0;
            z-index: 2000;
            font-family: 'Inter', 'Segoe UI', Arial, sans-serif;
        }
        .tb-recorte {
            position: fixed;
            border-radius: 16px;
            box-shadow: 0 0 0 9999px rgba(15, 20, 45, 0.72);
            transition: top 0.35s ease, left 0.35s ease, width 0.35s ease, height 0.35s ease;
        }
        .tb-recorte[hidden] {
            display: none;
        }
        .tb-fundo-simples {
            position: fixed;
            inset: 0;
            background: rgba(15, 20, 45, 0.72);
        }
        .tb-balao {
            position: fixed;
            left: 50%;
            bottom: 22px;
            transform: translateX(-50%);
            width: min(380px, 92vw);
            background: #fff;
            border-radius: 18px;
            padding: 18px 20px;
            box-shadow: 0 20px 50px -15px rgba(0, 0, 0, 0.5);
        }
        .tb-balao--centro {
            bottom: auto;
            top: 50%;
            transform: translate(-50%, -50%);
            text-align: center;
        }
        .tb-passo {
            font-size: 11.5px;
            font-weight: 700;
            color: #4e6ee8;
            text-transform: uppercase;
            letter-spacing: 0.04em;
            margin-bottom: 6px;
        }
        .tb-titulo {
            font-family: 'Sora', 'Segoe UI', Arial, sans-serif;
            font-size: 17px;
            font-weight: 800;
            color: #1b1f3b;
            margin-bottom: 6px;
        }
        .tb-texto {
            font-size: 13.5px;
            line-height: 1.55;
            color: #5b6084;
            margin-bottom: 16px;
        }
        .tb-acoes {
            display: flex;
            gap: 10px;
            justify-content: flex-end;
        }
        .tb-balao--centro .tb-acoes {
            justify-content: center;
        }
        .tb-btn-primario,
        .tb-btn-secundario {
            padding: 10px 18px;
            border-radius: 99px;
            font-family: 'Sora', sans-serif;
            font-size: 13px;
            font-weight: 700;
            cursor: pointer;
            border: none;
        }
        .tb-btn-primario {
            background: #4e6ee8;
            color: #fff;
        }
        .tb-btn-secundario {
            background: none;
            color: #5b6084;
        }
    `;
    document.head.appendChild(estilo);
}

function montarDom() {
    const overlay = document.createElement('div');
    overlay.id = 'tb-overlay';
    overlay.className = 'tb-overlay';
    overlay.innerHTML = `
        <div class="tb-fundo-simples"></div>
        <div id="tb-recorte" class="tb-recorte" hidden></div>
        <div id="tb-balao" class="tb-balao">
            <div id="tb-passo" class="tb-passo"></div>
            <h3 id="tb-titulo" class="tb-titulo"></h3>
            <p id="tb-texto" class="tb-texto"></p>
            <div class="tb-acoes">
                <button type="button" id="tb-pular" class="tb-btn-secundario">Pular tour</button>
                <button type="button" id="tb-proximo" class="tb-btn-primario">Começar</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
    return overlay;
}

// forcar: true quando a pessoa pede pra repetir o tour pelo botão do topo —
// nesse caso, ignora o "já viu" do localStorage.
export function iniciarTourBoasVindas({ forcar = false } = {}) {
    if (jaViu() && !forcar) return;
    if (!document.querySelector('.hamburger')) return; // segurança: só faz sentido na home
    document.getElementById('tb-overlay')?.remove(); // se já tinha um aberto, começa do zero

    window.__tourAtivo = true;
    injetarEstilos();
    const overlay = montarDom();
    const recorte = overlay.querySelector('#tb-recorte');
    const fundoSimples = overlay.querySelector('.tb-fundo-simples');
    const balao = overlay.querySelector('#tb-balao');
    const elPasso = overlay.querySelector('#tb-passo');
    const elTitulo = overlay.querySelector('#tb-titulo');
    const elTexto = overlay.querySelector('#tb-texto');
    const btnProximo = overlay.querySelector('#tb-proximo');
    const btnPular = overlay.querySelector('#tb-pular');

    let indice = 0;

    // No desktop o menu já fica fixo na lateral (.menu-panel) em vez do botão
    // sanduíche (.hamburger), que fica escondido — ver @media (min-width:1024px)
    // em dashboard.css. Passos com seletorDesktop se adaptam ao tamanho de tela.
    function ehDesktop() {
        return window.matchMedia('(min-width: 1024px)').matches;
    }

    function alvoDoPasso(passo) {
        const desktop = ehDesktop() && passo.seletorDesktop;
        return {
            seletor: desktop ? passo.seletorDesktop : passo.seletor,
            texto: desktop ? passo.textoDesktop : passo.texto
        };
    }

    function posicionarRecorte(seletor) {
        const alvo = document.querySelector(seletor);
        if (!alvo) {
            recorte.hidden = true;
            return;
        }
        alvo.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(() => {
            const r = alvo.getBoundingClientRect();
            const folga = 8;
            recorte.hidden = false;
            recorte.style.top = `${r.top - folga}px`;
            recorte.style.left = `${r.left - folga}px`;
            recorte.style.width = `${r.width + folga * 2}px`;
            recorte.style.height = `${r.height + folga * 2}px`;
        }, 380);
    }

    function mostrarPasso() {
        const passo = PASSOS[indice];
        if (passo.tipo === 'boas-vindas') {
            recorte.hidden = true;
            fundoSimples.hidden = false;
            balao.classList.add('tb-balao--centro');
            elPasso.textContent = 'Bem-vindo(a) ao Futuro+';
            elTitulo.textContent = 'Quer um tour rápido?';
            elTexto.textContent = 'Leva uns 30 segundos e mostra onde ficam os testes, o mural e o assistente virtual.';
            btnProximo.textContent = 'Começar';
        } else {
            // O recorte já escurece a tela toda sozinho (via box-shadow); com
            // as duas camadas juntas, o "buraco" do destaque ficava escuro
            // também.
            fundoSimples.hidden = true;
            balao.classList.remove('tb-balao--centro');
            const alvo = alvoDoPasso(passo);
            elPasso.textContent = `Passo ${indice} de ${PASSOS.length - 1}`;
            elTitulo.textContent = passo.titulo;
            elTexto.textContent = alvo.texto;
            btnProximo.textContent = indice === PASSOS.length - 1 ? 'Concluir' : 'Próximo';
            posicionarRecorte(alvo.seletor);
        }
    }

    function aoRedimensionar() {
        const passo = PASSOS[indice];
        if (passo.tipo !== 'boas-vindas') {
            const alvo = alvoDoPasso(passo);
            elTexto.textContent = alvo.texto;
            posicionarRecorte(alvo.seletor);
        }
    }

    function encerrar() {
        marcarComoVisto();
        window.removeEventListener('resize', aoRedimensionar);
        overlay.remove();
    }

    btnProximo.addEventListener('click', () => {
        if (indice === PASSOS.length - 1) {
            encerrar();
            return;
        }
        indice += 1;
        mostrarPasso();
    });
    btnPular.addEventListener('click', encerrar);
    window.addEventListener('resize', aoRedimensionar);

    mostrarPasso();
}
