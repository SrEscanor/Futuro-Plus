import{o as v,f as g,d as $,c as b,a as R}from"./firebase-config-BVis2Pi9.js";import"./dashboard-D2hP6CDR.js";/* empty css                    */import"./tour-pagina-auto-CU98x62v.js";import{e as o}from"./card-unidade-C3eEs3Rs.js";import{d as u}from"./descricoes-inteligencias-BL6ywoXi.js";import{h as E}from"./recomendacao-cursos-5UazaiUW.js";import{a as P,d as T}from"./resultado-teste-CuWDcDvT.js";import{c as I}from"./categorias-teste-82RqXHiT.js";import{c as f}from"./compartilhar-resultado-D4GwBtR8.js";import"./preload-helper-PPVm8Dsz.js";import"./conteudo-legal-padrao-DcxCgRAC.js";import"./tour-paginas-COru7OUt.js";import"./tour-motor-BeDtj6px.js";import"./geocodificacao-Dyu2Eb0t.js";const c=document.getElementById("resultados-testes");function h(e){if(!e)return"";const t=new Date(e);return Number.isNaN(t.getTime())?"":t.toLocaleDateString("pt-BR")}function A(e){return e?`
    <article class="resultado-teste-bloco" data-ver-resultado="teste-vocacional.html?ver=1">
        <header>
            <h3>Teste Vocacional</h3>
            <span class="resultado-teste-data">feito em ${o(h(e.concluidoEm))}</span>
        </header>

        <p class="resultado-teste-linha">Suas áreas mais fortes:
            <strong>${(e.eixosFortes||[]).slice(0,3).map(o).join(" · ")}</strong></p>

        <ol class="resultado-teste-cursos">
            ${(e.cursos||[]).map(t=>`
                <li>
                    <a href="curso.html?c=${encodeURIComponent(t.slug)}">${o(t.nome)}</a>
                    <span class="resultado-teste-eixo">${o(t.eixo||"")}</span>
                    ${t.resposta==="quero"?'<span class="voc-selo">você quis</span>':""}
                </li>`).join("")}
        </ol>

        <p class="resultado-teste-creditos">Feito pela equipe do Futuro+ com a inteligência artificial
            Claude (Anthropic) e revisão humana das perguntas — IA e pessoas juntas para o resultado
            chegar mais perto de você.</p>

        <div id="compartilhar-resultado-slot-vocacional"></div>

        <div class="resultado-teste-acoes">
            <a class="btn-resultado-teste" href="instituicoes.html">Ver onde estudar</a>
            <a class="btn-resultado-teste btn-resultado-teste--verde" href="teste-vocacional.html?editar=1">✏️ Editar minhas escolhas</a>
            <a class="btn-resultado-teste btn-resultado-teste--secundario" href="teste-vocacional.html">Refazer o teste</a>
        </div>
    </article>`:""}const q={gardner:"quiz-gardner.html",afinidades:"teste-afinidades.html"},C={gardner:"Teste rápido de perfil",afinidades:"Teste de Afinidades"};function x(e,t){if(!e)return"";const l=u[e.categoriaPrincipal],s=(e.ranking||[]).slice(0,3).map(a=>u[a]?.title||a),n=q[t]||"quiz-gardner.html";return`
    <article class="resultado-teste-bloco" data-ver-resultado="${n}?ver=1">
        <header>
            <h3>${o(C[t]||"Teste rápido de perfil")}</h3>
            <span class="resultado-teste-data">feito em ${o(h(e.concluidoEm))}</span>
        </header>

        <p class="resultado-teste-linha"><strong>${o(l?.title||e.categoriaPrincipal)}</strong></p>
        <p class="resultado-teste-desc">${o(l?.desc||"")}</p>
        <p class="resultado-teste-linha">Seu pódio: ${s.map(o).join(" · ")}</p>

        <div id="recomendacoes-do-perfil"></div>
        <div id="compartilhar-resultado-slot-perfil"></div>

        <div class="resultado-teste-acoes">
            <a class="btn-resultado-teste btn-resultado-teste--secundario" href="${n}">Refazer o teste</a>
        </div>
    </article>`}v(R,async e=>{if(!(!c||!e))try{const t=await g($(b,"usuarios",e.uid)),l=t.exists()?t.data():null,s=P(l),n=T(l),a=n?.resultado||null,p=n?.chaveTeste||null;if(!s&&!a)return;if(c.hidden=!1,c.innerHTML=`
            <h2 class="resultados-testes-titulo">Seus resultados</h2>
            <div class="resultados-testes-grade">
                ${A(s)}
                ${x(a,p)}
            </div>`,c.querySelectorAll("[data-ver-resultado]").forEach(r=>{r.addEventListener("click",i=>{i.target.closest("a, button, .compartilhar-resultado")||(location.href=r.dataset.verResultado)})}),s){const r=document.getElementById("compartilhar-resultado-slot-vocacional");r&&r.appendChild(f({etiquetaTopo:"Resultado do teste vocacional",titulo:(s.eixosFortes||[])[0]||"",numero:null,numeroLabel:null,frase:"Descobri minha área mais forte no Futuro+.",cursos:(s.cursos||[]).slice(0,3).map(i=>({nome:i.nome,rotulo:i.eixo}))},{nomeArquivoBase:"futuroplus-teste-vocacional"}))}if(a){const r=await E(document.getElementById("recomendacoes-do-perfil"),a,{uid:e.uid}),i=document.getElementById("compartilhar-resultado-slot-perfil");if(i){const m=u[a.categoriaPrincipal];i.appendChild(f({etiquetaTopo:p==="afinidades"?"Resultado do teste de afinidades":"Resultado do teste rápido",titulo:m?.title||a.categoriaPrincipal,numero:`${Math.round(a.porcentagens[a.categoriaPrincipal])}%`,numeroLabel:"de afinidade",frase:m?.frase,cursos:(r||[]).slice(0,3).map(d=>({nome:d.nome,rotulo:`${Math.round(a.porcentagens[d.motivo]||0)}% · ${I[d.motivo]||""}`}))},{nomeArquivoBase:"futuroplus-resultado-perfil"}))}}}catch(t){console.error("Erro ao carregar seus resultados:",t)}});
