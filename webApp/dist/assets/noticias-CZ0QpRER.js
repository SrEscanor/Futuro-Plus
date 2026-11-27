import"./firebase-config-jDGsFXrl.js";/* empty css              */import"./dashboard-Bvb9LxQg.js";/* empty css                    */import{E as I,N as P,e as n,u as q,n as N,t as x,r as T,p as y,j as w}from"./noticias-dados-BXHC1ZQF.js";import{r as h}from"./paginacao-DpXuoZxp.js";import{E as $,f as C}from"./noticias-proprias-util-6DILIAFS.js";import"./preload-helper-PPVm8Dsz.js";import"./conteudo-legal-padrao-BqhUlQtQ.js";import"./resultado-teste-DDM5ddzJ.js";import"./notificacoes-util-BE-pPj56.js";import"./vlibras-_gXUT26Z.js";import"./historico-paginas-Br3pVUgp.js";const u=10,H=`<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor"
    stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M9 3h6l-.8 5.5 2.8 3V14H7v-2.5l2.8-3z"/><path d="M12 14v7" fill="none"/></svg>`,S={etec:"Etec",fatec:"Fatec"},j={sair:'<path d="M18 13.5V18a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4.5M14 4h6v6M20 4l-9 9"/>',seguir:'<path d="M5 12h14M13 6l6 6-6 6"/>',jornal:'<path d="M5 4h12v14a2 2 0 0 0 2 2H7a2 2 0 0 1-2-2zM17 9h2a1 1 0 0 1 1 1v8a2 2 0 0 1-2 2M8.5 8.5h5M8.5 12h5M8.5 15.5h3"/>',alerta:'<path d="M12 4.5 3.5 19h17zM12 10.5v4M12 17h.01"/>',lupa:'<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/>'},B=`
    <li class="noticia-esqueleto" aria-hidden="true">
        <span class="noticia-esqueleto-capa"></span>
        <span class="noticia-esqueleto-linha noticia-esqueleto-linha--curta"></span>
        <span class="noticia-esqueleto-linha"></span>
        <span class="noticia-esqueleto-linha noticia-esqueleto-linha--media"></span>
    </li>`,e={noticias:[],filtro:"todas",pagina:1,situacao:"carregando",erro:"",pedido:0};document.readyState==="loading"?document.addEventListener("DOMContentLoaded",v):v();function v(){const a=document.getElementById("noticias-grade");a&&(document.querySelectorAll(".noticias-filtros [data-filtro]").forEach(t=>{t.addEventListener("click",()=>M(t.dataset.filtro))}),a.addEventListener("error",V,!0),a.addEventListener("click",t=>{const i=t.target.closest("[data-acao]");i&&(i.dataset.acao==="tentar"&&E(),i.dataset.acao==="ver-todas"&&M("todas"))}),E())}async function E(){const a=e.pedido+=1;e.situacao="carregando",l();try{const[t,i]=await Promise.all([I(),P().catch(o=>(console.warn("Não deu para ler as notícias fixadas:",o),[]))]);if(a!==e.pedido)return;e.noticias=D(Array.isArray(t)?t:[],i),e.situacao="pronta"}catch(t){if(a!==e.pedido)return;console.error("Erro ao carregar as notícias:",t),e.erro=t?.message||"",e.situacao="erro"}l()}function D(a,t){const i=(Array.isArray(t)?t:[]).filter(r=>r&&r.id!==void 0),o=new Set(i.map(r=>String(r.id)));return[...i.map(r=>({...r,fixada:!0})),...a.filter(r=>!o.has(String(r.id)))]}function M(a){a===e.filtro||a!=="todas"&&!(a in S)||(e.filtro=a,e.pagina=1,document.querySelectorAll(".noticias-filtros [data-filtro]").forEach(t=>{const i=t.dataset.filtro===a;t.classList.toggle("chip-filtro--ativo",i),t.setAttribute("aria-pressed",String(i))}),l())}function b(a){e.pagina=a,l();const t=window.matchMedia("(prefers-reduced-motion: reduce)").matches;document.getElementById("noticias-barra")?.scrollIntoView({behavior:t?"auto":"smooth",block:"start"})}function O(){return e.filtro==="todas"?e.noticias:e.noticias.filter(a=>(a.instituicoes||[]).includes(e.filtro))}function l(){const a=document.getElementById("noticias-grade"),t=document.getElementById("noticias-barra"),i=document.getElementById("noticias-contagem"),o=[document.getElementById("noticias-paginacao-topo"),document.getElementById("noticias-paginacao-rodape")],r=()=>h(o,1,1,b);if(a.classList.remove("noticias-grade--destaque"),a.setAttribute("aria-busy",String(e.situacao==="carregando")),e.situacao==="carregando"){t.hidden=!1,i.textContent="Carregando notícias…",a.innerHTML=B.repeat(6),r();return}if(e.situacao==="erro"){t.hidden=!0,i.textContent="",a.innerHTML=p({icone:"alerta",titulo:"Não deu para carregar as notícias",texto:"Confira sua internet e tente de novo.",botao:["tentar","Tentar de novo"]}),r();return}if(!e.noticias.length){t.hidden=!0,i.textContent="",a.innerHTML=p({icone:"jornal",titulo:"Ainda não há notícias por aqui",texto:"Quando sair alguma novidade das Etecs e Fatecs, ela aparece nesta página."}),r();return}t.hidden=!1;const s=O(),c=e.filtro==="todas"?"":` sobre ${S[e.filtro]}`;if(i.textContent=`${s.length} ${s.length===1?"notícia":"notícias"}${c}`,!s.length){a.innerHTML=p({icone:"lupa",titulo:`Nenhuma notícia${c} por enquanto`,texto:"Veja as outras notícias enquanto isso.",botao:["ver-todas","Ver todas"]}),r();return}const d=Math.ceil(s.length/u);e.pagina=Math.min(Math.max(1,e.pagina),d);const g=(e.pagina-1)*u,A=e.pagina===1;a.classList.add("noticias-grade--destaque"),a.innerHTML=s.slice(g,g+u).map((f,F)=>`<li>${Q(f,A&&F===0&&!f.fixada)}</li>`).join(""),h(o,e.pagina,d,b)}function m(a,t=18){return`<svg width="${t}" height="${t}" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${j[a]}</svg>`}function p({icone:a,titulo:t,texto:i,botao:o}){return`
        <li class="noticias-estado">
            <span class="noticias-estado-icone">${m(a,28)}</span>
            <h2>${n(t)}</h2>
            <p>${n(i)}</p>
            ${o?`<button type="button" class="noticias-botao" data-acao="${o[0]}">${n(o[1])}</button>`:""}
        </li>`}function L(a){const t=w(a.imagem),i=t?`<img src="${n(t)}" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer">`:q(a);return`<div class="noticia-capa" data-noticia="${n(a.id)}">${i}</div>`}function V(a){const t=a.target instanceof HTMLImageElement?a.target.closest(".noticia-capa"):null;if(!t)return;const i=e.noticias.find(o=>String(o.id)===t.dataset.noticia);t.innerHTML=q(i||{})}function k(a){return a.fixada?`<span class="noticia-fixada">${H}Fixada</span>`:""}function z(a,t){const i=String(a.resumo||"").trim(),o=x(a.publicadaEm),r=(a.instituicoes||[]).filter(s=>s in $).map(s=>`<span class="noticia-etiqueta noticia-etiqueta--${s}">${$[s]}</span>`).join("");return`
        <a class="noticia-card noticia-card--propria" href="${n(C(a.id))}">
            ${L(a)}
            <div class="noticia-corpo">
                <div class="noticia-etiquetas">
                    ${t?'<span class="noticia-recente">Mais recente</span>':""}
                    ${k(a)}
                    <span class="noticia-etiqueta noticia-etiqueta--propria">Notícia do Futuro+</span>
                    ${r}
                </div>
                <h2 class="noticia-titulo">${n(String(a.titulo||"").trim()||"Notícia sem título")}</h2>
                ${i?`<p class="noticia-resumo">${n(i)}</p>`:""}
                <div class="noticia-rodape">
                    <span class="noticia-fonte">Por ${n(String(a.autor||"").trim()||"Equipe Futuro+")}</span>
                    ${o?`<time class="noticia-data" datetime="${n(a.publicadaEm)}"
                        title="${n(y(a.publicadaEm))}">${n(o)}</time>`:""}
                    <span class="noticia-sair">${m("seguir",16)}</span>
                </div>
            </div>
        </a>`}function Q(a,t){if(a.propria)return z(a,t);const i=N(a.link),o=String(a.resumo||"").trim(),r=x(a.publicadaEm),s=T(a).map(d=>`<span class="noticia-etiqueta noticia-etiqueta--${d.id}">${n(d.texto)}</span>`).join(""),c=`
        ${L(a)}
        <div class="noticia-corpo">
            <div class="noticia-etiquetas">
                ${t?'<span class="noticia-recente">Mais recente</span>':""}
                ${k(a)}
                ${s}
            </div>
            <h2 class="noticia-titulo">${n(String(a.titulo||"").trim()||"Notícia sem título")}</h2>
            ${o?`<p class="noticia-resumo">${n(o)}</p>`:""}
            <div class="noticia-rodape">
                <span class="noticia-fonte">${n(String(a.fonte||"").trim()||"Fonte não informada")}</span>
                ${r?`<time class="noticia-data" datetime="${n(a.publicadaEm)}"
                    title="${n(y(a.publicadaEm))}">${n(r)}</time>`:""}
                ${i?`<span class="noticia-sair">${m("sair",16)}</span>`:""}
            </div>
        </div>`;return i?`
        <a class="noticia-card" href="${n(i)}" target="_blank" rel="noopener noreferrer">
            ${c}
            <span class="noticias-so-leitor">Abre o site de origem em outra aba.</span>
        </a>`:`<article class="noticia-card">${c}</article>`}
