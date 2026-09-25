import{o as n,e as d,d as u,b as p,f as m}from"./firebase-config-jeiW0dIw.js";import"./dashboard-99sClNh6.js";/* empty css                    */import{e as s}from"./card-unidade-CA2qFmKO.js";import{d as c}from"./descricoes-inteligencias-xaPm0-jR.js";import{g as f}from"./recomendacao-cursos-h1nXKPja.js";import{e as h,a as g}from"./resultado-teste-BJf2aI9i.js";import"./categorias-teste-82RqXHiT.js";import"./geocodificacao-GFhpmzSl.js";const i=document.getElementById("resultados-testes");function l(e){if(!e)return"";const t=new Date(e);return Number.isNaN(t.getTime())?"":t.toLocaleDateString("pt-BR")}function v(e){return e?`
    <article class="resultado-teste-bloco">
        <header>
            <h3>Teste Vocacional</h3>
            <span class="resultado-teste-data">feito em ${s(l(e.concluidoEm))}</span>
        </header>

        <p class="resultado-teste-linha">Suas áreas mais fortes:
            <strong>${(e.eixosFortes||[]).slice(0,3).map(s).join(" · ")}</strong></p>

        <ol class="resultado-teste-cursos">
            ${(e.cursos||[]).map(t=>`
                <li>
                    <a href="curso.html?c=${encodeURIComponent(t.slug)}">${s(t.nome)}</a>
                    <span class="resultado-teste-eixo">${s(t.eixo||"")}</span>
                    ${t.resposta==="quero"?'<span class="voc-selo">você quis</span>':""}
                </li>`).join("")}
        </ol>

        <p class="resultado-teste-creditos">Feito pela equipe do Futuro+ com a inteligência artificial
            Claude (Anthropic) e revisão humana das perguntas — IA e pessoas juntas para o resultado
            chegar mais perto de você.</p>

        <div class="resultado-teste-acoes">
            <a class="btn-resultado-teste" href="cursos.html">Ver onde estudar</a>
            <a class="btn-resultado-teste btn-resultado-teste--verde" href="teste-vocacional.html?editar=1">✏️ Editar minhas escolhas</a>
            <a class="btn-resultado-teste btn-resultado-teste--secundario" href="teste-vocacional.html">Refazer o teste</a>
        </div>
    </article>`:""}function b(e){if(!e)return"";const t=c[e.categoriaPrincipal],o=(e.ranking||[]).slice(0,3).map(a=>c[a]?.title||a);return`
    <article class="resultado-teste-bloco">
        <header>
            <h3>Teste rápido de perfil</h3>
            <span class="resultado-teste-data">feito em ${s(l(e.concluidoEm))}</span>
        </header>

        <p class="resultado-teste-linha"><strong>${s(t?.title||e.categoriaPrincipal)}</strong></p>
        <p class="resultado-teste-desc">${s(t?.desc||"")}</p>
        <p class="resultado-teste-linha">Seu pódio: ${o.map(s).join(" · ")}</p>

        <div id="recomendacoes-do-perfil"></div>

        <div class="resultado-teste-acoes">
            <a class="btn-resultado-teste btn-resultado-teste--secundario" href="quiz-gardner.html">Refazer o teste</a>
        </div>
    </article>`}n(m,async e=>{if(!(!i||!e))try{const t=await d(u(p,"usuarios",e.uid)),o=t.exists()?t.data():null,a=h(o),r=g(o);if(!a&&!r)return;i.hidden=!1,i.innerHTML=`
            <h2 class="resultados-testes-titulo">Seus resultados</h2>
            <div class="resultados-testes-grade">
                ${v(a)}
                ${b(r)}
            </div>`,r&&f(document.getElementById("recomendacoes-do-perfil"),r,{uid:e.uid})}catch(t){console.error("Erro ao carregar seus resultados:",t)}});
