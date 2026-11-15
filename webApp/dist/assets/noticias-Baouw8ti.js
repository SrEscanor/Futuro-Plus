import"./firebase-config-DZ7_vqDZ.js";/* empty css              */import"./dashboard-j0_VvYFf.js";/* empty css                    */import{q as S,e as n,g as M,c as x,t as I,r as k,d as A,i as C}from"./noticias-dados-CLLgc4U3.js";import{r as f}from"./paginacao-DpXuoZxp.js";import"./preload-helper-PPVm8Dsz.js";import"./conteudo-legal-padrao-DcxCgRAC.js";import"./resultado-teste-DG2OeZfm.js";const u=12,b={etec:"Etec",fatec:"Fatec"},H={sair:'<path d="M18 13.5V18a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4.5M14 4h6v6M20 4l-9 9"/>',jornal:'<path d="M5 4h12v14a2 2 0 0 0 2 2H7a2 2 0 0 1-2-2zM17 9h2a1 1 0 0 1 1 1v8a2 2 0 0 1-2 2M8.5 8.5h5M8.5 12h5M8.5 15.5h3"/>',alerta:'<path d="M12 4.5 3.5 19h17zM12 10.5v4M12 17h.01"/>',lupa:'<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/>'},T=`
    <li class="noticia-esqueleto" aria-hidden="true">
        <span class="noticia-esqueleto-capa"></span>
        <span class="noticia-esqueleto-linha noticia-esqueleto-linha--curta"></span>
        <span class="noticia-esqueleto-linha"></span>
        <span class="noticia-esqueleto-linha noticia-esqueleto-linha--media"></span>
    </li>`,e={noticias:[],filtro:"todas",pagina:1,situacao:"carregando",erro:"",pedido:0};document.readyState==="loading"?document.addEventListener("DOMContentLoaded",h):h();function h(){const a=document.getElementById("noticias-grade");a&&(document.querySelectorAll(".noticias-filtros [data-filtro]").forEach(t=>{t.addEventListener("click",()=>v(t.dataset.filtro))}),a.addEventListener("error",N,!0),a.addEventListener("click",t=>{const i=t.target.closest("[data-acao]");i&&(i.dataset.acao==="tentar"&&$(),i.dataset.acao==="ver-todas"&&v("todas"))}),$())}async function $(){const a=e.pedido+=1;e.situacao="carregando",l();try{const t=await S();if(a!==e.pedido)return;e.noticias=Array.isArray(t)?t:[],e.situacao="pronta"}catch(t){if(a!==e.pedido)return;console.error("Erro ao carregar as notícias:",t),e.erro=t?.message||"",e.situacao="erro"}l()}function v(a){a===e.filtro||a!=="todas"&&!(a in b)||(e.filtro=a,e.pagina=1,document.querySelectorAll(".noticias-filtros [data-filtro]").forEach(t=>{const i=t.dataset.filtro===a;t.classList.toggle("chip-filtro--ativo",i),t.setAttribute("aria-pressed",String(i))}),l())}function E(a){e.pagina=a,l();const t=window.matchMedia("(prefers-reduced-motion: reduce)").matches;document.getElementById("noticias-barra")?.scrollIntoView({behavior:t?"auto":"smooth",block:"start"})}function P(){return e.filtro==="todas"?e.noticias:e.noticias.filter(a=>(a.instituicoes||[]).includes(e.filtro))}function l(){const a=document.getElementById("noticias-grade"),t=document.getElementById("noticias-barra"),i=document.getElementById("noticias-contagem"),o=[document.getElementById("noticias-paginacao-topo"),document.getElementById("noticias-paginacao-rodape")],s=()=>f(o,1,1,E);if(a.classList.remove("noticias-grade--destaque"),a.setAttribute("aria-busy",String(e.situacao==="carregando")),e.situacao==="carregando"){t.hidden=!1,i.textContent="Carregando notícias…",a.innerHTML=T.repeat(6),s();return}if(e.situacao==="erro"){t.hidden=!0,i.textContent="",a.innerHTML=p({icone:"alerta",titulo:"Não deu para carregar as notícias",texto:"Confira sua internet e tente de novo.",botao:["tentar","Tentar de novo"]}),s();return}if(!e.noticias.length){t.hidden=!0,i.textContent="",a.innerHTML=p({icone:"jornal",titulo:"Ainda não há notícias por aqui",texto:"Quando sair alguma novidade das Etecs e Fatecs, ela aparece nesta página."}),s();return}t.hidden=!1;const r=P(),c=e.filtro==="todas"?"":` sobre ${b[e.filtro]}`;if(i.textContent=`${r.length} ${r.length===1?"notícia":"notícias"}${c}`,!r.length){a.innerHTML=p({icone:"lupa",titulo:`Nenhuma notícia${c} por enquanto`,texto:"Veja as outras notícias enquanto isso.",botao:["ver-todas","Ver todas"]}),s();return}const d=Math.ceil(r.length/u);e.pagina=Math.min(Math.max(1,e.pagina),d);const g=(e.pagina-1)*u,m=e.pagina===1;a.classList.toggle("noticias-grade--destaque",m),a.innerHTML=r.slice(g,g+u).map((y,L)=>`<li>${w(y,m&&L===0)}</li>`).join(""),f(o,e.pagina,d,E)}function q(a,t=18){return`<svg width="${t}" height="${t}" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${H[a]}</svg>`}function p({icone:a,titulo:t,texto:i,botao:o}){return`
        <li class="noticias-estado">
            <span class="noticias-estado-icone">${q(a,28)}</span>
            <h2>${n(t)}</h2>
            <p>${n(i)}</p>
            ${o?`<button type="button" class="noticias-botao" data-acao="${o[0]}">${n(o[1])}</button>`:""}
        </li>`}function B(a){const t=C(a.imagem),i=t?`<img src="${n(t)}" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer">`:M(a);return`<div class="noticia-capa" data-noticia="${n(a.id)}">${i}</div>`}function N(a){const t=a.target instanceof HTMLImageElement?a.target.closest(".noticia-capa"):null;if(!t)return;const i=e.noticias.find(o=>String(o.id)===t.dataset.noticia);t.innerHTML=M(i||{})}function w(a,t){const i=x(a.link),o=String(a.resumo||"").trim(),s=I(a.publicadaEm),r=k(a).map(d=>`<span class="noticia-etiqueta noticia-etiqueta--${d.id}">${n(d.texto)}</span>`).join(""),c=`
        ${B(a)}
        <div class="noticia-corpo">
            <div class="noticia-etiquetas">
                ${t?'<span class="noticia-recente">Mais recente</span>':""}
                ${r}
            </div>
            <h2 class="noticia-titulo">${n(String(a.titulo||"").trim()||"Notícia sem título")}</h2>
            ${o?`<p class="noticia-resumo">${n(o)}</p>`:""}
            <div class="noticia-rodape">
                <span class="noticia-fonte">${n(String(a.fonte||"").trim()||"Fonte não informada")}</span>
                ${s?`<time class="noticia-data" datetime="${n(a.publicadaEm)}"
                    title="${n(A(a.publicadaEm))}">${n(s)}</time>`:""}
                ${i?`<span class="noticia-sair">${q("sair",16)}</span>`:""}
            </div>
        </div>`;return i?`
        <a class="noticia-card" href="${n(i)}" target="_blank" rel="noopener noreferrer">
            ${c}
            <span class="noticias-so-leitor">Abre o site de origem em outra aba.</span>
        </a>`:`<article class="noticia-card">${c}</article>`}
