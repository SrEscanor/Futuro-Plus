import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "./firebase-config.js";
import { categoriasTeste } from "./categorias-teste.js";

const arco1 = document.getElementById("arco-1");
const arco2 = document.getElementById("arco-2");
const arco3 = document.getElementById("arco-3");
const titulo = document.getElementById("resultado-titulo");
const percentual = document.getElementById("resultado-percentual");
const link = document.getElementById("resultado-link");
const blocoComDados = document.getElementById("resultado-com-dados");
const blocoVazio = document.getElementById("resultado-vazio");

function formatarPtBr(numero) {
    return numero.toLocaleString("pt-BR", { maximumFractionDigits: 1 });
}

function mostrarSemResultado() {
    if (!blocoComDados) return;

    blocoComDados.style.display = "none";
    blocoVazio.style.display = "flex";
}

function mostrarResultado(dadosResultado) {
    if (!blocoComDados) return;

    blocoVazio.style.display = "none";
    blocoComDados.style.display = "flex";

    const top3 = dadosResultado.ranking.slice(0, 3);
    const somaTop3 = top3.reduce(
        (soma, categoria) => soma + (dadosResultado.porcentagens[categoria] || 0),
        0
    );

    // Normaliza os 3 primeiros pra somar 100% (proporção entre eles),
    // senão os arcos do gráfico não fecham o círculo direito.
    const fatias = top3.map(categoria =>
        somaTop3 > 0
            ? ((dadosResultado.porcentagens[categoria] || 0) / somaTop3) * 100
            : 0
    );

    const arcos = [arco1, arco2, arco3];
    let offsetAcumulado = 0;

    arcos.forEach((arco, indice) => {
        const fatia = fatias[indice] || 0;
        arco.setAttribute("stroke-dasharray", `${fatia} 100`);
        arco.setAttribute("stroke-dashoffset", `${-offsetAcumulado}`);
        offsetAcumulado += fatia;
    });

    const categoriaPrincipal = dadosResultado.categoriaPrincipal;
    const nomeCurto = categoriasTeste[categoriaPrincipal] || categoriaPrincipal;

    titulo.textContent = `Índice para ${nomeCurto}`;
    percentual.textContent = `${formatarPtBr(fatias[0] || 0)}%`;
    link.innerHTML = `<a href="testes.html">Clique aqui</a> e refaça o teste de perfil`;
}

// Quando existir mais de um teste feito, mostra sempre o mais recente
// (comparando a data de conclusão de cada um).
function obterResultadoMaisRecente(resultadosTestes) {
    if (!resultadosTestes) return null;

    const resultados = Object.values(resultadosTestes);
    if (resultados.length === 0) return null;

    return resultados.reduce((maisRecente, atual) =>
        !maisRecente || atual.concluidoEm > maisRecente.concluidoEm
            ? atual
            : maisRecente
    , null);
}

onAuthStateChanged(auth, async (usuario) => {
    if (!usuario) {
        mostrarSemResultado();
        return;
    }

    try {
        const snap = await getDoc(doc(db, "usuarios", usuario.uid));
        const dados = snap.exists() ? snap.data() : null;

        // "resultadoTesteGardner" era o nome antigo (de antes de suportar
        // vários testes). Quem fez o teste naquela época ainda tem o
        // resultado guardado só ali — incluímos ele aqui pra não "sumir".
        const resultadosTestes = {
            ...(dados?.resultadosTestes || {}),
            ...(dados?.resultadoTesteGardner && !dados?.resultadosTestes?.gardner
                ? { gardner: dados.resultadoTesteGardner }
                : {})
        };

        const dadosResultado = obterResultadoMaisRecente(resultadosTestes);

        if (dadosResultado) {
            mostrarResultado(dadosResultado);
        } else {
            mostrarSemResultado();
        }
    } catch (erro) {
        console.error("Erro ao carregar resultado do teste:", erro);
        mostrarSemResultado();
    }
});
