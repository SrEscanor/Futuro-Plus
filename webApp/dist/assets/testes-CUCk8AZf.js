import{o as b,g as P,d as R,b as E,a as T}from"./firebase-config-h-KQCxoQ.js";import"./dashboard-CTg4YrJA.js";/* empty css                    */import{c as h}from"./compartilhar-resultado-CMOPY2do.js";import"./tour-pagina-auto-DRxfIOeD.js";import{e as i}from"./card-unidade-HXCo-LZz.js";import{d as p}from"./descricoes-inteligencias-D_icd3AV.js";import{h as q}from"./recomendacao-cursos-C-DR0fsf.js";import{a as A,e as I}from"./resultado-teste-xMN1ahPz.js";import{c as m}from"./categorias-teste-82RqXHiT.js";import"./preload-helper-PPVm8Dsz.js";import"./conteudo-legal-padrao-DcxCgRAC.js";import"./notificacoes-util-BE-pPj56.js";import"./tour-paginas-CDKwbsfw.js";import"./tour-motor-BeDtj6px.js";import"./geocodificacao-BRsqdGk3.js";const u=document.getElementById("resultados-testes");function g(e){if(!e)return"";const t=new Date(e);return Number.isNaN(t.getTime())?"":t.toLocaleDateString("pt-BR")}function v(e){return e.length?`
        <ol class="resultado-teste-podio">
            ${e.map((t,a)=>`
                <li class="resultado-teste-podio-item resultado-teste-podio-item--${a+1}">
                    <span class="resultado-teste-posicao">${a+1}º</span>
                    <span class="resultado-teste-podio-nome">${i(t.nome)}</span>
                    ${Number.isFinite(t.porcentagem)?`<span class="resultado-teste-podio-pct">${t.porcentagem}%</span>`:""}
                </li>`).join("")}
        </ol>`:""}function $(e){return`
        <div class="resultado-teste-compartilhar">
            <p class="resultado-teste-compartilhar-texto">
                <strong>Leve seu resultado pros stories</strong>
                <span>Artes prontas no visual do @futuroplus_, é só escolher e postar.</span>
            </p>
            <div id="${e}" class="resultado-teste-compartilhar-slot"></div>
        </div>`}function x(e){if(!e)return"";const t=(e.eixosFortes||[]).slice(0,3).map(a=>({nome:a}));return`
    <article class="resultado-teste-bloco" data-ver-resultado="teste-vocacional.html?ver=1">
        <header>
            <h3>Teste Vocacional</h3>
            <span class="resultado-teste-data">feito em ${i(g(e.concluidoEm))}</span>
        </header>

        <h4 class="resultado-teste-subtitulo">Suas áreas mais fortes</h4>
        ${v(t)}

        <h4 class="resultado-teste-subtitulo">Cursos que combinam com você</h4>
        <ol class="resultado-teste-cursos">
            ${(e.cursos||[]).map(a=>`
                <li>
                    <a href="curso.html?c=${encodeURIComponent(a.slug)}">${i(a.nome)}</a>
                    <span class="resultado-teste-eixo">${i(a.eixo||"")}</span>
                    ${a.resposta==="quero"?'<span class="voc-selo">você quis</span>':""}
                </li>`).join("")}
        </ol>

        <p class="resultado-teste-creditos">Feito pela equipe do Futuro+ com a inteligência artificial
            Claude (Anthropic) e revisão humana das perguntas — IA e pessoas juntas para o resultado
            chegar mais perto de você.</p>

        <div class="resultado-teste-acoes">
            <a class="btn-resultado-teste" href="instituicoes.html">Ver onde estudar</a>
            <a class="btn-resultado-teste btn-resultado-teste--verde" href="teste-vocacional.html?editar=1">✏️ Editar minhas escolhas</a>
            <a class="btn-resultado-teste btn-resultado-teste--secundario" href="teste-vocacional.html">Refazer o teste</a>
        </div>

        ${$("compartilhar-resultado-slot-vocacional")}
    </article>`}const C={gardner:"quiz-gardner.html",afinidades:"teste-afinidades.html"},F={gardner:"Teste rápido de perfil",afinidades:"Teste de Afinidades"};function L(e,t){if(!e)return"";const a=p[e.categoriaPrincipal],r=Math.round(e.porcentagens?.[e.categoriaPrincipal]||0),d=(e.ranking||[]).slice(0,3).map(l=>({nome:m[l]||p[l]?.title||l,porcentagem:Math.round(e.porcentagens?.[l]||0)})),s=C[t]||"quiz-gardner.html";return`
    <article class="resultado-teste-bloco" data-ver-resultado="${s}?ver=1">
        <header>
            <h3>${i(F[t]||"Teste rápido de perfil")}</h3>
            <span class="resultado-teste-data">feito em ${i(g(e.concluidoEm))}</span>
        </header>

        <p class="resultado-teste-principal">
            ${i(a?.title||e.categoriaPrincipal)}
            <span class="resultado-teste-porcentagem">${r}% de afinidade</span>
        </p>
        <p class="resultado-teste-desc">${i(a?.desc||"")}</p>

        <h4 class="resultado-teste-subtitulo">Seu pódio</h4>
        ${v(d)}

        <div id="recomendacoes-do-perfil"></div>

        <div class="resultado-teste-acoes">
            <a class="btn-resultado-teste btn-resultado-teste--secundario" href="${s}">Refazer o teste</a>
        </div>

        ${$("compartilhar-resultado-slot-perfil")}
    </article>`}b(T,async e=>{if(!(!u||!e))try{const t=await P(R(E,"usuarios",e.uid)),a=t.exists()?t.data():null,r=A(a),d=I(a),s=d?.resultado||null,l=d?.chaveTeste||null;if(!r&&!s)return;if(u.hidden=!1,u.innerHTML=`
            <h2 class="resultados-testes-titulo">Seus resultados</h2>
            <div class="resultados-testes-grade">
                ${x(r)}
                ${L(s,l)}
            </div>`,u.querySelectorAll("[data-ver-resultado]").forEach(n=>{n.addEventListener("click",o=>{o.target.closest("a, button, .compartilhar-resultado, .resultado-teste-compartilhar")||(location.href=n.dataset.verResultado)})}),r){const n=document.getElementById("compartilhar-resultado-slot-vocacional");n&&n.appendChild(h({etiquetaTopo:"Resultado do teste vocacional",titulo:(r.eixosFortes||[])[0]||"",numero:null,numeroLabel:null,frase:"Descobri minha área mais forte no Futuro+.",cursos:(r.cursos||[]).slice(0,3).map(o=>({nome:o.nome,rotulo:o.eixo,escolhido:o.resposta==="quero"})),ranking:(r.eixosFortes||[]).slice(0,3).map(o=>({nome:o}))},{nomeArquivoBase:"futuroplus-teste-vocacional"}))}if(s){const n=await q(document.getElementById("recomendacoes-do-perfil"),s,{uid:e.uid}),o=document.getElementById("compartilhar-resultado-slot-perfil");if(o){const f=p[s.categoriaPrincipal];o.appendChild(h({etiquetaTopo:l==="afinidades"?"Resultado do teste de afinidades":"Resultado do teste rápido",titulo:f?.title||s.categoriaPrincipal,numero:`${Math.round(s.porcentagens[s.categoriaPrincipal])}%`,numeroLabel:"de afinidade",frase:f?.frase,cursos:(n||[]).slice(0,3).map(c=>({nome:c.nome,rotulo:`${Math.round(s.porcentagens[c.motivo]||0)}% · ${m[c.motivo]||""}`})),ranking:(s.ranking||[]).slice(0,3).map(c=>({nome:m[c]||c,porcentagem:Math.round(s.porcentagens?.[c]||0)}))},{nomeArquivoBase:"futuroplus-resultado-perfil"}))}}}catch(t){console.error("Erro ao carregar seus resultados:",t)}});
