import{o as v,f as $,d as b,c as R,a as E}from"./firebase-config-BVis2Pi9.js";import"./dashboard-D2hP6CDR.js";/* empty css                    */import{c as f}from"./compartilhar-resultado-xVtl4xGF.js";import"./tour-pagina-auto-CU98x62v.js";import{e as s}from"./card-unidade-C3eEs3Rs.js";import{d as u}from"./descricoes-inteligencias-BL6ywoXi.js";import{h as P}from"./recomendacao-cursos-5UazaiUW.js";import{a as T,d as I}from"./resultado-teste-CuWDcDvT.js";import{c as h}from"./categorias-teste-82RqXHiT.js";import"./preload-helper-PPVm8Dsz.js";import"./conteudo-legal-padrao-DcxCgRAC.js";import"./tour-paginas-COru7OUt.js";import"./tour-motor-BeDtj6px.js";import"./geocodificacao-Dyu2Eb0t.js";const d=document.getElementById("resultados-testes");function g(e){if(!e)return"";const t=new Date(e);return Number.isNaN(t.getTime())?"":t.toLocaleDateString("pt-BR")}function q(e){return e?`
    <article class="resultado-teste-bloco" data-ver-resultado="teste-vocacional.html?ver=1">
        <header>
            <h3>Teste Vocacional</h3>
            <span class="resultado-teste-data">feito em ${s(g(e.concluidoEm))}</span>
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

        <div id="compartilhar-resultado-slot-vocacional"></div>

        <div class="resultado-teste-acoes">
            <a class="btn-resultado-teste" href="instituicoes.html">Ver onde estudar</a>
            <a class="btn-resultado-teste btn-resultado-teste--verde" href="teste-vocacional.html?editar=1">✏️ Editar minhas escolhas</a>
            <a class="btn-resultado-teste btn-resultado-teste--secundario" href="teste-vocacional.html">Refazer o teste</a>
        </div>
    </article>`:""}const A={gardner:"quiz-gardner.html",afinidades:"teste-afinidades.html"},x={gardner:"Teste rápido de perfil",afinidades:"Teste de Afinidades"};function C(e,t){if(!e)return"";const n=u[e.categoriaPrincipal],r=(e.ranking||[]).slice(0,3).map(a=>u[a]?.title||a),c=A[t]||"quiz-gardner.html";return`
    <article class="resultado-teste-bloco" data-ver-resultado="${c}?ver=1">
        <header>
            <h3>${s(x[t]||"Teste rápido de perfil")}</h3>
            <span class="resultado-teste-data">feito em ${s(g(e.concluidoEm))}</span>
        </header>

        <p class="resultado-teste-linha"><strong>${s(n?.title||e.categoriaPrincipal)}</strong></p>
        <p class="resultado-teste-desc">${s(n?.desc||"")}</p>
        <p class="resultado-teste-linha">Seu pódio: ${r.map(s).join(" · ")}</p>

        <div id="recomendacoes-do-perfil"></div>
        <div id="compartilhar-resultado-slot-perfil"></div>

        <div class="resultado-teste-acoes">
            <a class="btn-resultado-teste btn-resultado-teste--secundario" href="${c}">Refazer o teste</a>
        </div>
    </article>`}v(E,async e=>{if(!(!d||!e))try{const t=await $(b(R,"usuarios",e.uid)),n=t.exists()?t.data():null,r=T(n),c=I(n),a=c?.resultado||null,p=c?.chaveTeste||null;if(!r&&!a)return;if(d.hidden=!1,d.innerHTML=`
            <h2 class="resultados-testes-titulo">Seus resultados</h2>
            <div class="resultados-testes-grade">
                ${q(r)}
                ${C(a,p)}
            </div>`,d.querySelectorAll("[data-ver-resultado]").forEach(i=>{i.addEventListener("click",o=>{o.target.closest("a, button, .compartilhar-resultado")||(location.href=i.dataset.verResultado)})}),r){const i=document.getElementById("compartilhar-resultado-slot-vocacional");i&&i.appendChild(f({etiquetaTopo:"Resultado do teste vocacional",titulo:(r.eixosFortes||[])[0]||"",numero:null,numeroLabel:null,frase:"Descobri minha área mais forte no Futuro+.",cursos:(r.cursos||[]).slice(0,3).map(o=>({nome:o.nome,rotulo:o.eixo,escolhido:o.resposta==="quero"})),ranking:(r.eixosFortes||[]).slice(0,3).map(o=>({nome:o}))},{nomeArquivoBase:"futuroplus-teste-vocacional"}))}if(a){const i=await P(document.getElementById("recomendacoes-do-perfil"),a,{uid:e.uid}),o=document.getElementById("compartilhar-resultado-slot-perfil");if(o){const m=u[a.categoriaPrincipal];o.appendChild(f({etiquetaTopo:p==="afinidades"?"Resultado do teste de afinidades":"Resultado do teste rápido",titulo:m?.title||a.categoriaPrincipal,numero:`${Math.round(a.porcentagens[a.categoriaPrincipal])}%`,numeroLabel:"de afinidade",frase:m?.frase,cursos:(i||[]).slice(0,3).map(l=>({nome:l.nome,rotulo:`${Math.round(a.porcentagens[l.motivo]||0)}% · ${h[l.motivo]||""}`})),ranking:(a.ranking||[]).slice(0,3).map(l=>({nome:h[l]||l,porcentagem:Math.round(a.porcentagens?.[l]||0)}))},{nomeArquivoBase:"futuroplus-resultado-perfil"}))}}}catch(t){console.error("Erro ao carregar seus resultados:",t)}});
