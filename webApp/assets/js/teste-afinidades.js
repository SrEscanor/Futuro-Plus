import { auth, db } from "./firebase-config.js";
import { doc, getDoc } from "firebase/firestore";
import {
    salvarResultadoPendente, salvarResultadoNoPerfil, resultadosSalvos, resultadoDePerfilValido
} from "./resultado-teste.js";
import { descricoesInteligencias } from "./descricoes-inteligencias.js";
import { renderizarRecomendacoesTeste } from "./recomendacao-cursos.js";
import { blocosAfinidades } from "./perguntas-afinidades.js";
import { categoriasTeste } from "./categorias-teste.js";
import { criarPainelCompartilhar } from "./compartilhar-resultado.js";
import { atualizarAnel, ligarOlhoDoProgresso } from "./teste-foco.js";

const containerTeste = document.getElementById("afinidades-container");
const containerResultado = document.getElementById("afinidades-resultado");
const progressoTexto = document.getElementById("afinidades-progresso");
const progressoFill = document.getElementById("afinidades-progresso-fill");
const tituloBloco = document.getElementById("afinidades-titulo-bloco");
const linhasContainer = document.getElementById("afinidades-linhas");
const botaoVoltar = document.getElementById("afinidades-voltar");
const botaoAvancar = document.getElementById("afinidades-avancar");
const faltamTexto = document.getElementById("afinidades-faltam");
const ordemLista = document.getElementById("ordem-lista");
const botaoDesfazer = document.getElementById("ordem-desfazer");
const botaoRecomecar = document.getElementById("ordem-recomecar");

let blocoAtual = 0;

// notasPorBloco[indiceDoBloco][letra] = posição de 1 a 8 dada pela pessoa
// (ranking: cada número só pode ser usado uma vez dentro do bloco; 8 é a que
// mais combina). É o que a conta do resultado usa.
const notasPorBloco = blocosAfinidades.map(() => ({}));

// ordemPorBloco[indiceDoBloco] = as letras na ordem em que a pessoa tocou:
// a primeira é a que ela mais gosta. As notas saem daqui (a 1ª tocada vale
// 8, a 2ª vale 7...).
const ordemPorBloco = blocosAfinidades.map(() => []);


// ============================================================
// RENDERIZAR O BLOCO ATUAL
// ============================================================

function renderizarBloco() {
    const bloco = blocosAfinidades[blocoAtual];

    progressoTexto.textContent = `Bloco ${blocoAtual + 1} de ${blocosAfinidades.length}`;
    progressoFill.style.width = `${((blocoAtual + 1) / blocosAfinidades.length) * 100}%`;
    tituloBloco.textContent = bloco.titulo;
    atualizarAnel(blocoAtual + 1, blocosAfinidades.length, `Bloco ${blocoAtual + 1} de ${blocosAfinidades.length}`,
        bloco.titulo);

    // cada atividade é um cartão: tocar põe na ordem (ou tira, se já estava)
    linhasContainer.innerHTML = "";
    bloco.linhas.forEach(linha => {
        const botao = document.createElement("button");
        botao.type = "button";
        botao.className = "ordem-opcao";
        botao.dataset.letra = linha.letra;
        botao.innerHTML = '<span class="ordem-num" aria-hidden="true"></span><span class="ordem-texto"></span>';
        botao.querySelector(".ordem-texto").textContent = linha.texto;
        botao.addEventListener("click", () => alternarNaOrdem(linha.letra));
        linhasContainer.appendChild(botao);
    });

    botaoVoltar.style.visibility = blocoAtual === 0 ? "hidden" : "visible";
    atualizarOrdem();
}

// Toca uma atividade: entra no fim da ordem ou, se já estava, sai dela (e as
// de depois sobem uma posição).
function alternarNaOrdem(letra) {
    const ordem = ordemPorBloco[blocoAtual];
    const posicao = ordem.indexOf(letra);
    if (posicao === -1) ordem.push(letra);
    else ordem.splice(posicao, 1);
    atualizarOrdem();
}

function escapar(texto) {
    return String(texto ?? "").replace(/[&<>"']/g, (c) => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));
}

// Mostra a ordem nos cartões e no painel, e refaz as notas do bloco.
function atualizarOrdem() {
    const bloco = blocosAfinidades[blocoAtual];
    const ordem = ordemPorBloco[blocoAtual];
    const total = bloco.linhas.length;

    notasPorBloco[blocoAtual] = Object.fromEntries(ordem.map((letra, indice) => [letra, total - indice]));

    linhasContainer.querySelectorAll(".ordem-opcao").forEach(botao => {
        const posicao = ordem.indexOf(botao.dataset.letra);
        const texto = botao.querySelector(".ordem-texto").textContent;
        botao.classList.toggle("ordem-opcao--escolhida", posicao !== -1);
        botao.querySelector(".ordem-num").textContent = posicao === -1 ? "" : String(posicao + 1);
        botao.setAttribute("aria-pressed", String(posicao !== -1));
        botao.setAttribute("aria-label", posicao === -1
            ? `${texto}. Tocar para pôr na posição ${ordem.length + 1}`
            : `${texto}. Posição ${posicao + 1}. Tocar para tirar`);
    });

    const textoDe = (letra) => bloco.linhas.find(linha => linha.letra === letra)?.texto || "";
    ordemLista.innerHTML = ordem.map((letra, indice) => `<li><b>${indice + 1}</b>${escapar(textoDe(letra))}</li>`).join("")
        + (ordem.length < total ? `<li class="ordem-falta"><b>${ordem.length + 1}</b>Toque na próxima…</li>` : "");
    botaoDesfazer.disabled = !ordem.length;
    botaoRecomecar.disabled = !ordem.length;

    const faltam = total - ordem.length;
    faltamTexto.textContent = faltam ? `${ordem.length} de ${total} em ordem` : "Tudo em ordem!";
    botaoAvancar.textContent = blocoAtual === blocosAfinidades.length - 1 ? "Ver meu resultado" : "Próximo bloco →";
    botaoAvancar.disabled = !blocoEstaCompleto();
}

function blocoEstaCompleto() {
    const bloco = blocosAfinidades[blocoAtual];
    return bloco.linhas.every(
        linha => notasPorBloco[blocoAtual][linha.letra] !== undefined
    );
}

botaoDesfazer.addEventListener("click", () => {
    ordemPorBloco[blocoAtual].pop();
    atualizarOrdem();
});

botaoRecomecar.addEventListener("click", () => {
    ordemPorBloco[blocoAtual].length = 0;
    atualizarOrdem();
});


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
        const posicaoMaxima = bloco.linhas.length;

        bloco.linhas.forEach(linha => {
            const posicao = notasPorBloco[indiceBloco][linha.letra] || 0;
            somaPorCategoria[linha.categoria] = (somaPorCategoria[linha.categoria] || 0) + posicao;
            maxPorCategoria[linha.categoria] = (maxPorCategoria[linha.categoria] || 0) + posicaoMaxima;
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

    const dadosResultado = {
        categoriaPrincipal,
        categoriaSecundaria,
        porcentagens,
        ranking,
        concluidoEm: new Date().toISOString()
    };

    mostrarResultado(dadosResultado, { aoVivo: true });
}

// aoVivo:false é usado quando a página abre direto num resultado já salvo
// (?ver=1, via tentarMostrarResultadoSalvo) — nesse caso não grava de novo,
// só mostra (quem chama já garantiu que a pessoa está logada e que o
// resultado existe).
async function mostrarResultado(dadosResultado, { aoVivo = true } = {}) {
    const { categoriaPrincipal, categoriaSecundaria, porcentagens, ranking } = dadosResultado;

    containerTeste.style.display = "none";
    containerResultado.style.display = "block";

    // o painel fecha o teste: a ordem do bloco já não serve mais
    atualizarAnel(blocosAfinidades.length, blocosAfinidades.length, "Teste concluído", "O resultado está ao lado");
    document.querySelectorAll(".foco-painel .foco-subtitulo, #ordem-lista, .foco-painel .ordem-acoes")
        .forEach(elemento => { elemento.hidden = true; });

    const usuarioLogado = auth.currentUser;

    if (usuarioLogado) {
        if (aoVivo) {
            salvarResultadoNoPerfil(usuarioLogado.uid, "afinidades", dadosResultado)
                .then(() => marcarResultadoComoSalvo())
                .catch(erro => console.error("Erro ao salvar resultado no perfil:", erro));
        } else {
            marcarResultadoComoSalvo();
        }
    } else if (aoVivo) {
        salvarResultadoPendente("afinidades", dadosResultado);
    }

    let descricao = `
        <div style="margin-bottom: 25px;">
            <h3>${descricoesInteligencias[categoriaPrincipal].title}</h3>
            <div style="font-size: 20px; font-weight: bold; margin: 15px 0;">
                ${Math.round(porcentagens[categoriaPrincipal])}% de afinidade
            </div>
            ${descricoesInteligencias[categoriaPrincipal].desc}
        </div>
        <div id="recomendacoes-teste"></div>
    `;

    // Perfil complementar + ranking completo: só pra quem está logado.
    // Sem login, mostra só o resultado principal e um convite pra ver o resto.
    if (auth.currentUser) {

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

    } else {

        descricao += `
            <hr style="border:0; border-top:1px solid #ddd; margin:25px 0;">
            <p style="font-size: 14.5px; line-height: 1.6;">
                🔒 <strong>Crie sua conta ou faça login</strong> para ver seu
                perfil complementar e o ranking completo das suas 8 inteligências.
            </p>
        `;

    }

    document.getElementById("afinidades-resultado-titulo").textContent =
        descricoesInteligencias[categoriaPrincipal].title;

    document.getElementById("afinidades-resultado-desc").innerHTML = descricao;

    const recomendacoes = await renderizarRecomendacoesTeste(
        document.getElementById("recomendacoes-teste"),
        dadosResultado,
        { uid: usuarioLogado?.uid }
    );

    const slotCompartilhar = document.getElementById("compartilhar-resultado-slot");
    if (slotCompartilhar) {
        slotCompartilhar.innerHTML = "";
        slotCompartilhar.appendChild(criarPainelCompartilhar({
            etiquetaTopo: "Resultado do teste de afinidades",
            titulo: descricoesInteligencias[categoriaPrincipal].title,
            numero: `${Math.round(porcentagens[categoriaPrincipal])}%`,
            numeroLabel: "de afinidade",
            frase: descricoesInteligencias[categoriaPrincipal].frase,
            cursos: (recomendacoes || []).slice(0, 3).map((r) => ({
                nome: r.nome,
                rotulo: `${Math.round(porcentagens[r.motivo] || 0)}% · ${categoriasTeste[r.motivo] || ""}`
            })),
            // pódio da arte da porcentagem: só pra quem está logado, igual ao
            // perfil complementar e ao ranking completo desta tela
            ranking: usuarioLogado
                ? (ranking || []).slice(0, 3).map((categoria) => ({
                    nome: categoriasTeste[categoria] || categoria,
                    porcentagem: Math.round(porcentagens[categoria] || 0)
                }))
                : null
        }, { nomeArquivoBase: "futuroplus-teste-afinidades" }));
    }
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
// ABRIR DIRETO NO RESULTADO JÁ SALVO (?ver=1)
// ============================================================
// Link usado pela tela de resultados salvos (testes.html), pra abrir aqui
// já mostrando o resultado em vez de começar o teste do zero. Sem ?ver=1,
// sem login ou sem resultado salvo, cai no teste normal.

async function tentarMostrarResultadoSalvo() {
    if (!new URLSearchParams(location.search).get("ver")) return false;

    await auth.authStateReady();
    if (!auth.currentUser) return false;

    try {
        const snap = await getDoc(doc(db, "usuarios", auth.currentUser.uid));
        const salvo = resultadosSalvos(snap.exists() ? snap.data() : null).afinidades;
        if (!resultadoDePerfilValido(salvo)) return false;

        await mostrarResultado(salvo, { aoVivo: false });
        return true;
    } catch (erro) {
        console.error("Erro ao carregar o resultado salvo do teste de afinidades:", erro);
        return false;
    }
}


// ============================================================
// INICIAR O TESTE
// ============================================================

ligarOlhoDoProgresso();

tentarMostrarResultadoSalvo().then((mostrou) => {
    if (!mostrou) renderizarBloco();
});
