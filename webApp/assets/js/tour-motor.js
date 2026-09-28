// Motor genérico de tour com destaque (spotlight): escurece a tela, recorta
// um "buraco" ao redor do elemento do passo atual e mostra um balão
// explicando, com botão de pular a qualquer momento. Usado tanto pelo tour
// de boas-vindas da home quanto pelos mini-tours de cada página — cada um
// só muda a lista de passos e a chave de "já vi" no localStorage.

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
            touch-action: none;
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
            max-height: min(70vh, 520px);
            overflow-y: auto;
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
        /* Telas pequenas: balão mais compacto (menos padding/fonte), pra
           sobrar mais espaço de tela mostrando o que ele está explicando.
           Precisa vir depois das regras de cima pra ganhar no empate de
           especificidade (mesma classe, então quem vem por último manda). */
        @media (max-width: 480px) {
            .tb-balao {
                padding: 14px 16px;
            }
            .tb-titulo {
                font-size: 15.5px;
            }
            .tb-texto {
                font-size: 12.5px;
                line-height: 1.45;
                margin-bottom: 12px;
            }
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

// chaveVisto: chave do localStorage que marca esse tour específico como já
// visto (cada mini-tour de página tem a sua, independente das outras).
// passos: array de passos — opcionalmente o primeiro pode ser
// { tipo: 'boas-vindas' } pra mostrar um cartão de abertura centralizado
// antes do primeiro destaque.
// forcar: ignora a checagem de "já visto" (usado quando a pessoa clica no
// botão de repetir tour).
export function iniciarTourSpotlight({ chaveVisto, passos, forcar = false } = {}) {
    function jaViu() {
        try {
            return localStorage.getItem(chaveVisto) === '1';
        } catch {
            return false;
        }
    }

    function marcarComoVisto() {
        try {
            localStorage.setItem(chaveVisto, '1');
        } catch {
            // sem localStorage (modo privado etc.): o tour volta a aparecer na próxima visita, sem problema
        }
        window.__tourAtivo = false;
    }

    if (jaViu() && !forcar) return false;
    if (!passos || !passos.length) return false;
    if (document.getElementById('tb-overlay')) {
        // já tinha um aberto (instância anterior não fechada direito):
        // começa do zero e desfaz o bloqueio de rolagem que ela tinha posto,
        // senão a "posição original" abaixo seria capturada já travada.
        document.getElementById('tb-overlay').remove();
        document.documentElement.style.overflow = '';
        document.body.style.overflow = '';
        document.documentElement.style.touchAction = '';
        document.body.style.touchAction = '';
    }

    // Bloqueia mesmo a rolagem por baixo do tour: sem isso, no celular dava
    // pra arrastar o dedo e rolar a página por trás do overlay, saindo do
    // tour sem confirmar as etapas nem clicar em "Pular". Trava tanto o
    // <html> quanto o <body> — as regras globais dão scroll pros dois
    // (html, body { overflow-y: auto }), então travar só um não bastava:
    // o outro ainda rolava a página por baixo. `touch-action: none` reforça
    // pro celular (o overflow:hidden sozinho não bloqueia o "puxar com o
    // dedo" com a mesma confiança em todo navegador). Só sai daqui
    // completando o tour ou clicando em "Pular tour".
    const overflowOriginalHtml = document.documentElement.style.overflow;
    const overflowOriginalBody = document.body.style.overflow;
    const toqueOriginalHtml = document.documentElement.style.touchAction;
    const toqueOriginalBody = document.body.style.touchAction;
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    document.documentElement.style.touchAction = 'none';
    document.body.style.touchAction = 'none';
    function bloquearToque(e) { e.preventDefault(); }

    window.__tourAtivo = true;
    injetarEstilos();
    const overlay = montarDom();
    overlay.addEventListener('touchmove', bloquearToque, { passive: false });
    const recorte = overlay.querySelector('#tb-recorte');
    const fundoSimples = overlay.querySelector('.tb-fundo-simples');
    const balao = overlay.querySelector('#tb-balao');
    const elPasso = overlay.querySelector('#tb-passo');
    const elTitulo = overlay.querySelector('#tb-titulo');
    const elTexto = overlay.querySelector('#tb-texto');
    const btnProximo = overlay.querySelector('#tb-proximo');
    const btnPular = overlay.querySelector('#tb-pular');

    let indice = 0;

    function totalPassosVisiveis() {
        return passos.filter((p) => p.tipo !== 'boas-vindas').length;
    }

    function passoVisivelAtual() {
        return passos.slice(0, indice + 1).filter((p) => p.tipo !== 'boas-vindas').length;
    }

    // Sem isso, o balão ficava sempre grudado no rodapé da tela — no
    // celular, com o alvo destacado ocupando boa parte da altura (ex.: os
    // cards da tela de Testes, empilhados), o balão acabava cobrindo o
    // próprio card que devia explicar. Aqui ele encaixa embaixo do destaque
    // quando cabe, ou em cima quando não cabe.
    function posicionarBalao(rectAlvo) {
        if (!rectAlvo) {
            balao.style.top = '';
            balao.style.bottom = '';
            return;
        }
        const margem = 16;
        const alturaBalao = balao.offsetHeight;
        const espacoAbaixo = window.innerHeight - rectAlvo.bottom;
        const espacoAcima = rectAlvo.top;

        balao.style.bottom = 'auto';
        if (espacoAbaixo >= alturaBalao + margem || espacoAbaixo >= espacoAcima) {
            const top = Math.min(rectAlvo.bottom + margem, window.innerHeight - alturaBalao - margem);
            balao.style.top = `${Math.max(margem, top)}px`;
        } else {
            const top = Math.max(margem, rectAlvo.top - alturaBalao - margem);
            balao.style.top = `${top}px`;
        }
    }

    // Um tempo fixo (era 380ms) pra esperar o "scrollIntoView" suave
    // terminar dava errado no celular: em telas mais lentas, ou quando a
    // rolagem precisa andar mais longe, a animação ainda não tinha
    // terminado — a posição era medida no meio do caminho, e o destaque
    // ficava "sobrando" mais pra baixo (ou pra cima) do que o elemento de
    // verdade. Em vez de adivinhar um tempo, espera o retângulo do alvo
    // parar de se mover entre um quadro e outro (com um teto de segurança).
    let geracaoRolagem = 0;
    function aguardarRolagemParar(alvo) {
        const minhaGeracao = ++geracaoRolagem;
        return new Promise((resolve) => {
            let ultimoTop = null;
            let quadrosParado = 0;
            let tentativas = 0;

            function checar() {
                if (minhaGeracao !== geracaoRolagem) return; // um passo mais novo já começou
                const r = alvo.getBoundingClientRect();
                quadrosParado = (ultimoTop !== null && Math.abs(r.top - ultimoTop) < 0.5) ? quadrosParado + 1 : 0;
                ultimoTop = r.top;
                tentativas += 1;
                if (quadrosParado >= 4 || tentativas >= 90) { // ~4 quadros parados, ou ~1,5s de teto
                    resolve(r);
                    return;
                }
                requestAnimationFrame(checar);
            }
            requestAnimationFrame(checar);
        });
    }

    function posicionarRecorte(seletor) {
        const alvo = document.querySelector(seletor);
        if (!alvo) {
            geracaoRolagem += 1; // invalida qualquer espera de rolagem pendente
            recorte.hidden = true;
            posicionarBalao(null);
            return;
        }
        alvo.scrollIntoView({ behavior: 'smooth', block: 'center' });
        aguardarRolagemParar(alvo).then((r) => {
            const folga = 8;
            recorte.hidden = false;
            recorte.style.top = `${r.top - folga}px`;
            recorte.style.left = `${r.left - folga}px`;
            recorte.style.width = `${r.width + folga * 2}px`;
            recorte.style.height = `${r.height + folga * 2}px`;
            posicionarBalao(r);
        });
    }

    function mostrarPasso() {
        const passo = passos[indice];
        if (passo.tipo === 'boas-vindas') {
            recorte.hidden = true;
            fundoSimples.hidden = false;
            balao.classList.add('tb-balao--centro');
            posicionarBalao(null);
            elPasso.textContent = passo.passoRotulo || 'Bem-vindo(a)';
            elTitulo.textContent = passo.titulo;
            elTexto.textContent = passo.texto;
            btnProximo.textContent = 'Começar';
        } else {
            // O recorte já escurece a tela toda sozinho (via box-shadow); com
            // as duas camadas juntas, o "buraco" do destaque ficava escuro
            // também.
            fundoSimples.hidden = true;
            balao.classList.remove('tb-balao--centro');
            const alvo = alvoDoPasso(passo);
            elPasso.textContent = `Passo ${passoVisivelAtual()} de ${totalPassosVisiveis()}`;
            elTitulo.textContent = passo.titulo;
            elTexto.textContent = alvo.texto;
            btnProximo.textContent = indice === passos.length - 1 ? 'Concluir' : 'Próximo';
            posicionarRecorte(alvo.seletor);
        }
    }

    function aoRedimensionar() {
        const passo = passos[indice];
        if (passo.tipo !== 'boas-vindas') {
            const alvo = alvoDoPasso(passo);
            elTexto.textContent = alvo.texto;
            posicionarRecorte(alvo.seletor);
        }
    }

    function encerrar() {
        marcarComoVisto();
        window.removeEventListener('resize', aoRedimensionar);
        overlay.removeEventListener('touchmove', bloquearToque);
        document.documentElement.style.overflow = overflowOriginalHtml;
        document.body.style.overflow = overflowOriginalBody;
        document.documentElement.style.touchAction = toqueOriginalHtml;
        document.body.style.touchAction = toqueOriginalBody;
        overlay.remove();
    }

    btnProximo.addEventListener('click', () => {
        if (indice === passos.length - 1) {
            encerrar();
            return;
        }
        indice += 1;
        mostrarPasso();
    });
    btnPular.addEventListener('click', encerrar);
    window.addEventListener('resize', aoRedimensionar);

    mostrarPasso();
    return true;
}
