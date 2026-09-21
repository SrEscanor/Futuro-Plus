import{o as l,e as d,d as u,b as p,f as m}from"./firebase-config-vU8gAbDc.js";import"./dashboard-BxxGHgqt.js";/* empty css                    */import{e as t}from"./card-unidade-Bgq-fhAV.js";import{d as c}from"./descricoes-inteligencias-xaPm0-jR.js";import{g as f}from"./recomendacao-cursos-xAr-dSXz.js";import{e as h,a as g}from"./resultado-teste-oGlQb90c.js";import"./categorias-teste-82RqXHiT.js";import"./geocodificacao-Da0jM7Fw.js";const i=document.getElementById("resultados-testes");function n(e){if(!e)return"";const s=new Date(e);return Number.isNaN(s.getTime())?"":s.toLocaleDateString("pt-BR")}function v(e){return e?`
    <article class="resultado-teste-bloco">
        <header>
            <h3>Teste Vocacional</h3>
            <span class="resultado-teste-data">feito em ${t(n(e.concluidoEm))}</span>
        </header>

        <p class="resultado-teste-linha">Suas áreas mais fortes:
            <strong>${(e.eixosFortes||[]).slice(0,3).map(t).join(" · ")}</strong></p>

        <ol class="resultado-teste-cursos">
            ${(e.cursos||[]).map(s=>`
                <li>
                    <a href="curso.html?c=${encodeURIComponent(s.slug)}">${t(s.nome)}</a>
                    <span class="resultado-teste-eixo">${t(s.eixo||"")}</span>
                    ${s.resposta==="quero"?'<span class="voc-selo">você quis</span>':""}
                </li>`).join("")}
        </ol>

        <p class="resultado-teste-creditos">Feito pela equipe do Futuro+ com a inteligência artificial
            Claude (Anthropic) e revisão humana das perguntas — IA e pessoas juntas para o resultado
            chegar mais perto de você.</p>

        <div class="resultado-teste-acoes">
            <a class="btn-resultado-teste" href="cursos.html">Ver onde estudar</a>
            <a class="btn-resultado-teste btn-resultado-teste--secundario" href="teste-vocacional.html">Refazer o teste</a>
        </div>
    </article>`:""}function $(e){if(!e)return"";const s=c[e.categoriaPrincipal],o=(e.ranking||[]).slice(0,3).map(a=>c[a]?.title||a);return`
    <article class="resultado-teste-bloco">
        <header>
            <h3>Teste rápido de perfil</h3>
            <span class="resultado-teste-data">feito em ${t(n(e.concluidoEm))}</span>
        </header>

        <p class="resultado-teste-linha"><strong>${t(s?.title||e.categoriaPrincipal)}</strong></p>
        <p class="resultado-teste-desc">${t(s?.desc||"")}</p>
        <p class="resultado-teste-linha">Seu pódio: ${o.map(t).join(" · ")}</p>

        <div id="recomendacoes-do-perfil"></div>

        <div class="resultado-teste-acoes">
            <a class="btn-resultado-teste btn-resultado-teste--secundario" href="quiz-gardner.html">Refazer o teste</a>
        </div>
    </article>`}l(m,async e=>{if(!(!i||!e))try{const s=await d(u(p,"usuarios",e.uid)),o=s.exists()?s.data():null,a=h(o),r=g(o);if(!a&&!r)return;i.hidden=!1,i.innerHTML=`
            <h2 class="resultados-testes-titulo">Seus resultados</h2>
            <div class="resultados-testes-grade">
                ${v(a)}
                ${$(r)}
            </div>`,r&&f(document.getElementById("recomendacoes-do-perfil"),r,{uid:e.uid})}catch(s){console.error("Erro ao carregar seus resultados:",s)}});
