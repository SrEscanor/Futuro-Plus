import { auth } from "./firebase-config.js";
import { salvarResultadoPendente, salvarResultadoNoPerfil } from "./resultado-teste.js";
import { descricoesInteligencias } from "./descricoes-inteligencias.js";
import { blocosAfinidades } from "./perguntas-afinidades.js";

const containerTeste = document.getElementById("afinidades-container");
const containerResultado = document.getElementById("afinidades-resultado");
const progressoTexto = document.getElementById("afinidades-progresso");
const progressoFill = document.getElementById("afinidades-progresso-fill");
const tituloBloco = document.getElementById("afinidades-titulo-bloco");
const linhasContainer = document.getElementById("afinidades-linhas");
const botaoVoltar = document.getElementById("afinidades-voltar");
const botaoAvancar = document.getElementById("afinidades-avancar");

let blocoAtual = 0;

// notasPorBloco[indiceDoBloco][letra] = nota de 0 a 10 que a pessoa deu
const notasPorBloco = blocosAfinidades.map(() => ({}));


// ============================================================
// RENDERIZAR O BLOCO ATUAL
// ============================================================

function renderizarBloco() {
    const bloco = blocosAfinidades[blocoAtual];

    progressoTexto.textContent = `Bloco ${blocoAtual + 1} de ${blocosAfinidades.length}`;
    progressoFill.style.width = `${((blocoAtual + 1) / blocosAfinidades.length) * 100}%`;
    tituloBloco.textContent = bloco.titulo;

    linhasContainer.innerHTML = "";

    bloco.linhas.forEach(linha => {
        const linhaEl = document.createElement("div");
        linhaEl.className = "linha-afinidade";

        const letraEl = document.createElement("div");
        letraEl.className = "linha-afinidade-letra";
        letraEl.textContent = linha.letra;

        const textoEl = document.createElement("div");
        textoEl.className = "linha-afinidade-texto";
        textoEl.textContent = linha.texto;

        const notaEl = document.createElement("select");
        notaEl.className = "linha-afinidade-nota";
        notaEl.setAttribute("aria-label", `Nota de 0 a 10 para: ${linha.texto}`);

        const opcaoVazia = document.createElement("option");
        opcaoVazia.value = "";
        opcaoVazia.textContent = "–";
        opcaoVazia.disabled = true;
        notaEl.appendChild(opcaoVazia);

        for (let nota = 0; nota <= 10; nota++) {
            const opcao = document.createElement("option");
            opcao.value = String(nota);
            opcao.textContent = String(nota);
            notaEl.appendChild(opcao);
        }

        const notaSalva = notasPorBloco[blocoAtual][linha.letra];
        notaEl.value = notaSalva !== undefined ? String(notaSalva) : "";

        notaEl.addEventListener("change", () => {
            notasPorBloco[blocoAtual][linha.letra] = Number(notaEl.value);
        });

        linhaEl.appendChild(letraEl);
        linhaEl.appendChild(textoEl);
        linhaEl.appendChild(notaEl);
        linhasContainer.appendChild(linhaEl);
    });

    botaoVoltar.style.visibility = blocoAtual === 0 ? "hidden" : "visible";
    botaoAvancar.textContent =
        blocoAtual === blocosAfinidades.length - 1 ? "Enviar teste" : "Próximo";
}

function blocoEstaCompleto() {
    const bloco = blocosAfinidades[blocoAtual];
    return bloco.linhas.every(
        linha => notasPorBloco[blocoAtual][linha.letra] !== undefined
    );
}


// ============================================================
// NAVEGAÇÃO ENTRE BLOCOS
// ============================================================

botaoAvancar.addEventListener("click", () => {
    if (!blocoEstaCompleto()) {
        alert("Avalie todas as características antes de continuar.");
        return;
    }

    if (blocoAtual < blocosAfinidades.length - 1) {
        blocoAtual++;
        renderizarBloco();
    } else {
        finalizarTeste();
    }
});

botaoVoltar.addEventListener("click", () => {
    if (blocoAtual > 0) {
        blocoAtual--;
        renderizarBloco();
    }
});


// ============================================================
// CALCULAR E MOSTRAR RESULTADO
// ============================================================

function finalizarTeste() {
    const somaPorCategoria = {};
    const maxPorCategoria = {};

    blocosAfinidades.forEach((bloco, indiceBloco) => {
        bloco.linhas.forEach(linha => {
            const nota = notasPorBloco[indiceBloco][linha.letra] || 0;
            somaPorCategoria[linha.categoria] = (somaPorCategoria[linha.categoria] || 0) + nota;
            maxPorCategoria[linha.categoria] = (maxPorCategoria[linha.categoria] || 0) + 10;
        });
    });

    const porcentagens = {};
    Object.keys(somaPorCategoria).forEach(categoria => {
        porcentagens[categoria] =
            (somaPorCategoria[categoria] / maxPorCategoria[categoria]) * 100;
    });

    const ranking = Object.keys(porcentagens).sort((a, b) => {
        if (porcentagens[b] !== porcentagens[a]) {
            return porcentagens[b] - porcentagens[a];
        }
        return somaPorCategoria[b] - somaPorCategoria[a];
    });

    const categoriaPrincipal = ranking[0];
    const categoriaSecundaria = ranking.length > 1 ? ranking[1] : null;

    mostrarResultado({ categoriaPrincipal, categoriaSecundaria, porcentagens, ranking });

    const dadosResultado = {
        categoriaPrincipal,
        categoriaSecundaria,
        porcentagens,
        ranking,
        concluidoEm: new Date().toISOString()
    };

    const usuarioLogado = auth.currentUser;

    if (usuarioLogado) {
        salvarResultadoNoPerfil(usuarioLogado.uid, "afinidades", dadosResultado)
            .then(() => marcarResultadoComoSalvo())
            .catch(erro => console.error("Erro ao salvar resultado no perfil:", erro));
    } else {
        salvarResultadoPendente("afinidades", dadosResultado);
    }
}

function mostrarResultado({ categoriaPrincipal, categoriaSecundaria, porcentagens, ranking }) {
    containerTeste.style.display = "none";
    containerResultado.style.display = "block";

    let descricao = `
        <div style="margin-bottom: 25px;">
            <h3>${descricoesInteligencias[categoriaPrincipal].title}</h3>
            <div style="font-size: 20px; font-weight: bold; margin: 15px 0;">
                ${Math.round(porcentagens[categoriaPrincipal])}% de afinidade
            </div>
            ${descricoesInteligencias[categoriaPrincipal].desc}
        </div>
    `;

    if (categoriaSecundaria && porcentagens[categoriaSecundaria] > 0) {
        descricao += `
            <hr style="border:0; border-top:1px solid #ddd; margin:25px 0;">
            <div style="margin-bottom: 25px;">
                <h3>Perfil complementar: ${descricoesInteligencias[categoriaSecundaria].title}</h3>
                <div style="font-size: 18px; font-weight: bold; margin: 10px 0;">
                    ${Math.round(porcentagens[categoriaSecundaria])}% de afinidade
                </div>
                ${descricoesInteligencias[categoriaSecundaria].desc}
            </div>
        `;
    }

    descricao += `
        <hr style="border:0; border-top:1px solid #ddd; margin:25px 0;">
        <h3>📊 Seu perfil completo</h3>
        <div style="margin-top: 15px;">
    `;

    ranking.forEach((categoria, indice) => {
        const percentual = Math.round(porcentagens[categoria]);
        descricao += `
            <div style="margin-bottom: 15px;">
                <div style="display:flex; justify-content:space-between; margin-bottom:5px; font-weight:bold;">
                    <span>${indice + 1}º - ${descricoesInteligencias[categoria].title}</span>
                    <span>${percentual}%</span>
                </div>
                <div style="width:100%; height:10px; background:#e5e5e5; border-radius:10px; overflow:hidden;">
                    <div style="width:${percentual}%; height:100%; background:currentColor; border-radius:10px;"></div>
                </div>
            </div>
        `;
    });

    descricao += `
        </div>
        <p style="margin-top:25px; font-size:14px; opacity:0.75;">
            💡 O resultado representa um perfil de afinidade com base nas notas dadas.
            Ele não determina sozinho uma profissão ou curso ideal.
        </p>
    `;

    document.getElementById("afinidades-resultado-titulo").textContent =
        descricoesInteligencias[categoriaPrincipal].title;

    document.getElementById("afinidades-resultado-desc").innerHTML = descricao;
}

function marcarResultadoComoSalvo() {
    const cta = document.getElementById("result-cta");
    if (!cta) return;

    cta.innerHTML = `
        <p style="font-size: 14.5px; line-height: 1.5;">
            <strong>✅ Resultado salvo no seu perfil!</strong>
        </p>
    `;
}


// ============================================================
// INICIAR O TESTE
// ============================================================

renderizarBloco();
