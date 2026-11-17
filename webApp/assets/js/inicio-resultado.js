import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "./firebase-config.js";
import { categoriasTeste } from "./categorias-teste.js";
import { descricoesInteligencias } from "./descricoes-inteligencias.js";
import { capaDoEixo } from "./capas-eixos.js";
import { extrairTesteDePerfilMaisRecente, extrairResultadoVocacional } from "./resultado-teste.js";
import { escapeHtml } from "./card-unidade.js";

// A home mostra os dois testes lado a lado, dentro do card "Testes": o
// vocacional à esquerda e o de perfil à direita. Cada lado tem o estado
// "ainda não fez" e o estado com resultado.

const arcos = ["arco-1", "arco-2", "arco-3"].map((id) => document.getElementById(id));
const perfilComDados = document.getElementById("resultado-com-dados");
const perfilVazio = document.getElementById("resultado-vazio");
const vocacionalComDados = document.getElementById("vocacional-com-dados");
const vocacionalVazio = document.getElementById("vocacional-vazio");

// mesmas cores dos arcos do gráfico (1º, 2º e 3º)
const CORES_PODIO = ["#4e6ee8", "#f5a623", "#2ecc71"];

const PAGINA_POR_CHAVE_PERFIL = { gardner: "quiz-gardner.html", afinidades: "teste-afinidades.html" };
const TITULO_POR_CHAVE_PERFIL = { gardner: "Teste rápido de perfil", afinidades: "Teste de Afinidades" };

function formatarPtBr(numero) {
    return numero.toLocaleString("pt-BR", { maximumFractionDigits: 1 });
}

function mostrar(bloco, visivel) {
    if (bloco) bloco.hidden = !visivel;
}

function mostrarData(id, iso) {
    const elemento = document.getElementById(id);
    if (!elemento) return;

    const data = iso ? new Date(iso) : null;
    const valida = data && !Number.isNaN(data.getTime());
    elemento.textContent = valida ? `feito em ${data.toLocaleDateString("pt-BR")}` : "";
    elemento.hidden = !valida;
}

// ------------------------------------------------------------------
// Teste de perfil (Gardner / Afinidades)
// ------------------------------------------------------------------

function mostrarPerfil(teste) {
    const resultado = teste?.resultado || null;
    mostrar(perfilVazio, !resultado);
    mostrar(perfilComDados, Boolean(resultado));
    mostrarData("perfil-data", resultado?.concluidoEm);
    if (!resultado) return;

    const chave = teste.chaveTeste;
    const pagina = PAGINA_POR_CHAVE_PERFIL[chave] || "quiz-gardner.html";
    document.getElementById("perfil-nome-teste").textContent = TITULO_POR_CHAVE_PERFIL[chave] || "Teste rápido de perfil";
    document.getElementById("perfil-refazer").href = pagina;
    document.getElementById("perfil-ver").href = `${pagina}?ver=1`;

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

    const principal = resultado.categoriaPrincipal;
    document.getElementById("resultado-titulo").textContent =
        descricoesInteligencias[principal]?.title || `Inteligência ${categoriasTeste[principal] || principal}`;
    document.getElementById("resultado-percentual").textContent = `${formatarPtBr(fatias[0] || 0)}%`;
    document.getElementById("perfil-desc").textContent = descricoesInteligencias[principal]?.desc || "";

    // legenda: o mesmo número de cada arco, com barra proporcional ao 1º
    document.getElementById("perfil-legenda").innerHTML = top3.map((categoria, i) => {
        const nome = categoriasTeste[categoria] || descricoesInteligencias[categoria]?.title || categoria;
        const largura = fatias[0] > 0 ? Math.round((fatias[i] / fatias[0]) * 100) : 0;
        return `
            <li>
                <i style="background:${CORES_PODIO[i]}"></i>
                <span>${i + 1}º ${escapeHtml(nome)}</span>
                <b>${formatarPtBr(fatias[i] || 0)}%</b>
                <div class="perfil-legenda-barra"><span style="width:${largura}%;background:${CORES_PODIO[i]}"></span></div>
            </li>`;
    }).join("");
}

// ------------------------------------------------------------------
// Teste vocacional
// ------------------------------------------------------------------

// Quadradinho com o ícone e as cores do eixo do curso (mesmo desenho da capa).
function iconeDoEixo(eixo) {
    const { cores, icone } = capaDoEixo(eixo);
    return `<span class="curso-resultado-icone" style="background:linear-gradient(135deg,${cores[0]},${cores[1]})">
        <svg viewBox="0 0 24 24" aria-hidden="true">${icone}</svg></span>`;
}

function mostrarVocacional(resultado) {
    mostrar(vocacionalVazio, !resultado);
    mostrar(vocacionalComDados, Boolean(resultado));
    mostrarData("vocacional-data", resultado?.concluidoEm);
    if (!resultado) return;

    document.getElementById("vocacional-areas").innerHTML = (resultado.eixosFortes || [])
        .slice(0, 2)
        .map((area, i) => `<span class="area-forte"><b>${i + 1}º</b>${escapeHtml(area)}</span>`)
        .join("");

    document.getElementById("vocacional-cursos").innerHTML = (resultado.cursos || [])
        .slice(0, 3)
        .map((curso) => `
            <li class="curso-resultado">
                ${iconeDoEixo(curso.eixo)}
                <span class="curso-resultado-texto">
                    <a href="curso.html?c=${encodeURIComponent(curso.slug)}">${escapeHtml(curso.nome)}</a>
                    ${curso.eixo ? `<span>${escapeHtml(curso.eixo)}</span>` : ""}
                </span>
                ${curso.resposta === "quero" ? '<span class="voc-selo">você quis</span>' : ""}
            </li>`)
        .join("");
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

        mostrarPerfil(extrairTesteDePerfilMaisRecente(dados));
        mostrarVocacional(extrairResultadoVocacional(dados));
    } catch (erro) {
        console.error("Erro ao carregar resultado dos testes:", erro);
        mostrarPerfil(null);
        mostrarVocacional(null);
    }
});
