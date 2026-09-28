import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "./firebase-config.js";
import { categoriasTeste } from "./categorias-teste.js";
import { escapeHtml, normalizar, logoPadraoPorTipo, LOGO_FALLBACK } from "./card-unidade.js";
import { extrairResultadoMaisRecente, extrairResultadoVocacional } from "./resultado-teste.js";
import {
    carregarOfertaCursos,
    carregarRegioesSP,
    resolverLocalizacaoUsuario,
    calcularRecomendacoes,
    recomendacoesDoVocacional,
    cursosMaisOferecidos,
    textoMotivo,
    textoOferta,
    linkCurso
} from "./recomendacao-cursos.js";

const titulo = document.getElementById("recomendados-titulo");
const subtitulo = document.getElementById("recomendados-sub");
const trilho = document.getElementById("recomendados-scroll");

// Embaralha (Fisher-Yates) pra a vitrine mostrar uma seleção diferente a
// cada visita, em vez de sempre as mesmas recomendações na mesma ordem.
function embaralhar(lista) {
    const copia = [...lista];
    for (let i = copia.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copia[i], copia[j]] = [copia[j], copia[i]];
    }
    return copia;
}

function cardCurso(recomendacao, localizacao) {
    const motivo = recomendacao.motivoTexto || textoMotivo(recomendacao);
    // a logo mostrada é da unidade mais perto (a mesma destacada no texto de
    // oferta abaixo) — um curso pode ser oferecido por Etecs e Fatecs juntas,
    // então não dá pra escolher uma logo fixa pro card inteiro.
    const maisPerto = recomendacao.unidades[0];
    const logo = maisPerto?.logotipoUrl || logoPadraoPorTipo(maisPerto?.tipo);
    return `
        <div class="course-card-mini">
            <div class="inst-logo">
                <img class="inst-logo-img" src="${escapeHtml(logo)}" alt="${escapeHtml(maisPerto?.tipo || 'Futuro+')}"
                    onerror="this.onerror=null;this.src='${LOGO_FALLBACK}';">
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

        const resultadoPerfil = extrairResultadoMaisRecente(dadosUsuario);
        const resultadoVocacional = extrairResultadoVocacional(dadosUsuario);
        const [oferta, localizacao] = await Promise.all([
            carregarOfertaCursos(),
            resolverLocalizacaoUsuario(usuario?.uid, dadosUsuario)
        ]);
        const regioes = localizacao ? await carregarRegioesSP().catch(() => null) : null;

        const listaVocacional = resultadoVocacional
            ? recomendacoesDoVocacional(resultadoVocacional, { oferta, localizacao, regioes, limite: 8 })
            : [];
        // Um curso pode vir sugerido pelos dois testes ao mesmo tempo — conta
        // só uma vez, priorizando o do Vocacional (é o mais específico).
        const nomesDoVocacional = new Set(listaVocacional.map((r) => normalizar(r.nome)));
        const listaPerfil = (resultadoPerfil
            ? calcularRecomendacoes(resultadoPerfil, { oferta, localizacao, regioes, limite: 8 })
            : []
        ).filter((r) => !nomesDoVocacional.has(normalizar(r.nome)));

        let lista = embaralhar([...listaVocacional, ...listaPerfil]).slice(0, 8);

        if (lista.length) {
            titulo.textContent = "Recomendados para você";
            let baseTexto;
            if (listaVocacional.length && resultadoPerfil) {
                baseTexto = `Com base no seu Teste Vocacional e no seu perfil ${descreverPerfil(resultadoPerfil)}`;
            } else if (listaVocacional.length) {
                baseTexto = "Com base no seu Teste Vocacional";
            } else {
                baseTexto = `Com base no seu perfil ${descreverPerfil(resultadoPerfil)}`;
            }
            subtitulo.textContent = baseTexto
                + (localizacao ? `, priorizando unidades perto de ${localizacao.cidade}.` : ".");
        } else {
            lista = cursosMaisOferecidos(oferta, { localizacao, regioes, limite: 8 });
            titulo.textContent = "Cursos mais oferecidos nas unidades";
            subtitulo.innerHTML = `<a href="testes.html">Faça um teste</a> e receba recomendações feitas para você.`;
        }

        trilho.innerHTML = lista.length
            ? lista.map((r) => cardCurso(r, localizacao)).join("")
            : `<p class="recomendacoes-carregando">Nenhum curso cadastrado ainda.</p>`;

    } catch (erro) {
        console.error("Erro ao carregar recomendações de cursos:", erro);
        trilho.innerHTML = `<p class="recomendacoes-carregando">Não foi possível carregar as recomendações agora.</p>`;
    }
});
