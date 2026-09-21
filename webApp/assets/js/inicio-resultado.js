import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "./firebase-config.js";
import { categoriasTeste } from "./categorias-teste.js";
import { extrairResultadoMaisRecente, extrairResultadoVocacional } from "./resultado-teste.js";
import { escapeHtml } from "./card-unidade.js";

// A home mostra os dois testes lado a lado: o vocacional à esquerda e o de
// perfil à direita. Cada card tem o estado "ainda não fez" e o estado com
// resultado.

const arcos = ["arco-1", "arco-2", "arco-3"].map((id) => document.getElementById(id));
const perfilComDados = document.getElementById("resultado-com-dados");
const perfilVazio = document.getElementById("resultado-vazio");
const vocacionalComDados = document.getElementById("vocacional-com-dados");
const vocacionalVazio = document.getElementById("vocacional-vazio");

function formatarPtBr(numero) {
    return numero.toLocaleString("pt-BR", { maximumFractionDigits: 1 });
}

function mostrar(bloco, visivel) {
    if (bloco) bloco.hidden = !visivel;
}

// ------------------------------------------------------------------
// Teste de perfil (Gardner / Afinidades)
// ------------------------------------------------------------------

function mostrarPerfil(resultado) {
    mostrar(perfilVazio, !resultado);
    mostrar(perfilComDados, Boolean(resultado));
    if (!resultado) return;

    const top3 = resultado.ranking.slice(0, 3);
    const soma = top3.reduce((total, categoria) => total + (resultado.porcentagens[categoria] || 0), 0);

    // Normaliza os 3 primeiros pra somar 100% (proporção entre eles),
    // senão os arcos do gráfico não fecham o círculo direito.
    const fatias = top3.map((categoria) =>
        soma > 0 ? ((resultado.porcentagens[categoria] || 0) / soma) * 100 : 0);

    let offset = 0;
    arcos.forEach((arco, i) => {
        const fatia = fatias[i] || 0;
        arco.setAttribute("stroke-dasharray", `${fatia} 100`);
        arco.setAttribute("stroke-dashoffset", `${-offset}`);
        offset += fatia;
    });

    const nomeCurto = categoriasTeste[resultado.categoriaPrincipal] || resultado.categoriaPrincipal;
    document.getElementById("resultado-titulo").textContent = `Índice para ${nomeCurto}`;
    document.getElementById("resultado-percentual").textContent = `${formatarPtBr(fatias[0] || 0)}%`;
    document.getElementById("resultado-link").innerHTML =
        '<a href="quiz-gardner.html">Clique aqui</a> e refaça o teste rápido';
}

// ------------------------------------------------------------------
// Teste vocacional
// ------------------------------------------------------------------

function mostrarVocacional(resultado) {
    mostrar(vocacionalVazio, !resultado);
    mostrar(vocacionalComDados, Boolean(resultado));
    if (!resultado) return;

    document.getElementById("vocacional-areas").innerHTML =
        `Suas áreas: <strong>${(resultado.eixosFortes || []).slice(0, 2).map(escapeHtml).join(" · ")}</strong>`;

    document.getElementById("vocacional-cursos").innerHTML = (resultado.cursos || [])
        .slice(0, 3)
        .map((curso) => `
            <li>
                <a href="curso.html?c=${encodeURIComponent(curso.slug)}">${escapeHtml(curso.nome)}</a>
                ${curso.resposta === "quero" ? '<span class="voc-selo">você quis</span>' : ""}
            </li>`)
        .join("");

    document.getElementById("vocacional-link").innerHTML =
        '<a href="teste-vocacional.html">Clique aqui</a> e refaça o teste vocacional';
}

onAuthStateChanged(auth, async (usuario) => {
    if (!usuario) {
        mostrarPerfil(null);
        mostrarVocacional(null);
        return;
    }

    try {
        const snap = await getDoc(doc(db, "usuarios", usuario.uid));
        const dados = snap.exists() ? snap.data() : null;

        mostrarPerfil(extrairResultadoMaisRecente(dados));
        mostrarVocacional(extrairResultadoVocacional(dados));
    } catch (erro) {
        console.error("Erro ao carregar resultado dos testes:", erro);
        mostrarPerfil(null);
        mostrarVocacional(null);
    }
});
