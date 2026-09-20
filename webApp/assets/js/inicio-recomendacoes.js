import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "./firebase-config.js";
import { categoriasTeste } from "./categorias-teste.js";
import { escapeHtml } from "./card-unidade.js";
import { extrairResultadoMaisRecente } from "./resultado-teste.js";
import {
    carregarOfertaCursos,
    carregarRegioesSP,
    resolverLocalizacaoUsuario,
    calcularRecomendacoes,
    cursosMaisOferecidos,
    textoMotivo,
    textoOferta,
    linkCurso
} from "./recomendacao-cursos.js";

const titulo = document.getElementById("recomendados-titulo");
const subtitulo = document.getElementById("recomendados-sub");
const trilho = document.getElementById("recomendados-scroll");

function cardCurso(recomendacao, localizacao) {
    const motivo = textoMotivo(recomendacao);
    return `
        <div class="course-card-mini">
            <div class="inst-logo">
                <img class="inst-logo-img" src="/etec-logo.png" alt="Etec - Escola Técnica Estadual">
            </div>
            <div class="course-title">${escapeHtml(recomendacao.nome)}</div>
            ${motivo ? `<div class="course-motivo">${escapeHtml(motivo)}</div>` : ""}
            <div class="course-meta">${escapeHtml(textoOferta(recomendacao, localizacao))}</div>
            <a class="btn-saiba" href="${linkCurso(recomendacao.nome)}">Ver unidades</a>
        </div>`;
}

function descreverPerfil(resultado) {
    const principal = categoriasTeste[resultado.ranking?.[0]];
    const secundaria = categoriasTeste[resultado.ranking?.[1]];
    return secundaria ? `${principal} e ${secundaria}` : principal;
}

onAuthStateChanged(auth, async (usuario) => {
    if (!trilho) return;

    try {
        let dadosUsuario = null;
        if (usuario) {
            const snap = await getDoc(doc(db, "usuarios", usuario.uid));
            dadosUsuario = snap.exists() ? snap.data() : null;
        }

        const resultado = extrairResultadoMaisRecente(dadosUsuario);
        const [oferta, localizacao] = await Promise.all([
            carregarOfertaCursos(),
            resolverLocalizacaoUsuario(usuario?.uid, dadosUsuario)
        ]);
        const regioes = localizacao ? await carregarRegioesSP().catch(() => null) : null;

        let lista = resultado
            ? calcularRecomendacoes(resultado, { oferta, localizacao, regioes, limite: 8 })
            : [];

        if (lista.length) {
            titulo.textContent = "Recomendados para você";
            subtitulo.textContent = `Com base no seu perfil ${descreverPerfil(resultado)}`
                + (localizacao ? `, priorizando Etecs perto de ${localizacao.cidade}.` : ".");
        } else {
            lista = cursosMaisOferecidos(oferta, { localizacao, regioes, limite: 8 });
            titulo.textContent = "Cursos mais oferecidos nas Etecs";
            subtitulo.innerHTML = `<a href="testes.html">Faça o teste de perfil</a> e receba recomendações feitas para você.`;
        }

        trilho.innerHTML = lista.length
            ? lista.map((r) => cardCurso(r, localizacao)).join("")
            : `<p class="recomendacoes-carregando">Nenhum curso cadastrado ainda.</p>`;

    } catch (erro) {
        console.error("Erro ao carregar recomendações de cursos:", erro);
        trilho.innerHTML = `<p class="recomendacoes-carregando">Não foi possível carregar as recomendações agora.</p>`;
    }
});
