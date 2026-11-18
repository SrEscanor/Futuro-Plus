import"./firebase-config-XQh5hlny.js";/* empty css              */import"./dashboard-DlCsTCaU.js";/* empty css                    */import{n as A}from"./noticias-dados-Cjfx2sye.js";import{e as o,m as q,f as T,j as y,r as P,g as L,E as h,l as C,i as H}from"./destaques-util-CLcdY04S.js";import{r as $}from"./paginacao-DpXuoZxp.js";import"./preload-helper-PPVm8Dsz.js";import"./conteudo-legal-padrao-DcxCgRAC.js";import"./resultado-teste-BcjYGcG_.js";import"./notificacoes-util-BMqxtxne.js";const u=12,S={etec:"Etec",fatec:"Fatec"},N={sair:'<path d="M18 13.5V18a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4.5M14 4h6v6M20 4l-9 9"/>',seguir:'<path d="M5 12h14M13 6l6 6-6 6"/>',jornal:'<path d="M5 4h12v14a2 2 0 0 0 2 2H7a2 2 0 0 1-2-2zM17 9h2a1 1 0 0 1 1 1v8a2 2 0 0 1-2 2M8.5 8.5h5M8.5 12h5M8.5 15.5h3"/>',alerta:'<path d="M12 4.5 3.5 19h17zM12 10.5v4M12 17h.01"/>',lupa:'<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/>'},F=`
    <li class="noticia-esqueleto" aria-hidden="true">
        <span class="noticia-esqueleto-capa"></span>
        <span class="noticia-esqueleto-linha noticia-esqueleto-linha--curta"></span>
        <span class="noticia-esqueleto-linha"></span>
        <span class="noticia-esqueleto-linha noticia-esqueleto-linha--media"></span>
    </li>`,i={noticias:[],filtro:"todas",pagina:1,situacao:"carregando",erro:"",pedido:0};document.readyState==="loading"?document.addEventListener("DOMContentLoaded",v):v();function v(){const a=document.getElementById("noticias-grade");a&&(document.querySelectorAll(".noticias-filtros [data-filtro]").forEach(t=>{t.addEventListener("click",()=>M(t.dataset.filtro))}),a.addEventListener("error",B,!0),a.addEventListener("click",t=>{const e=t.target.closest("[data-acao]");e&&(e.dataset.acao==="tentar"&&E(),e.dataset.acao==="ver-todas"&&M("todas"))}),E())}async function E(){const a=i.pedido+=1;i.situacao="carregando",l();try{const t=await A();if(a!==i.pedido)return;i.noticias=Array.isArray(t)?t:[],i.situacao="pronta"}catch(t){if(a!==i.pedido)return;console.error("Erro ao carregar as notícias:",t),i.erro=t?.message||"",i.situacao="erro"}l()}function M(a){a===i.filtro||a!=="todas"&&!(a in S)||(i.filtro=a,i.pagina=1,document.querySelectorAll(".noticias-filtros [data-filtro]").forEach(t=>{const e=t.dataset.filtro===a;t.classList.toggle("chip-filtro--ativo",e),t.setAttribute("aria-pressed",String(e))}),l())}function b(a){i.pagina=a,l();const t=window.matchMedia("(prefers-reduced-motion: reduce)").matches;document.getElementById("noticias-barra")?.scrollIntoView({behavior:t?"auto":"smooth",block:"start"})}function j(){return i.filtro==="todas"?i.noticias:i.noticias.filter(a=>(a.instituicoes||[]).includes(i.filtro))}function l(){const a=document.getElementById("noticias-grade"),t=document.getElementById("noticias-barra"),e=document.getElementById("noticias-contagem"),n=[document.getElementById("noticias-paginacao-topo"),document.getElementById("noticias-paginacao-rodape")],r=()=>$(n,1,1,b);if(a.classList.remove("noticias-grade--destaque"),a.setAttribute("aria-busy",String(i.situacao==="carregando")),i.situacao==="carregando"){t.hidden=!1,e.textContent="Carregando notícias…",a.innerHTML=F.repeat(6),r();return}if(i.situacao==="erro"){t.hidden=!0,e.textContent="",a.innerHTML=p({icone:"alerta",titulo:"Não deu para carregar as notícias",texto:"Confira sua internet e tente de novo.",botao:["tentar","Tentar de novo"]}),r();return}if(!i.noticias.length){t.hidden=!0,e.textContent="",a.innerHTML=p({icone:"jornal",titulo:"Ainda não há notícias por aqui",texto:"Quando sair alguma novidade das Etecs e Fatecs, ela aparece nesta página."}),r();return}t.hidden=!1;const s=j(),c=i.filtro==="todas"?"":` sobre ${S[i.filtro]}`;if(e.textContent=`${s.length} ${s.length===1?"notícia":"notícias"}${c}`,!s.length){a.innerHTML=p({icone:"lupa",titulo:`Nenhuma notícia${c} por enquanto`,texto:"Veja as outras notícias enquanto isso.",botao:["ver-todas","Ver todas"]}),r();return}const d=Math.ceil(s.length/u);i.pagina=Math.min(Math.max(1,i.pagina),d);const g=(i.pagina-1)*u,f=i.pagina===1;a.classList.toggle("noticias-grade--destaque",f),a.innerHTML=s.slice(g,g+u).map((I,k)=>`<li>${O(I,f&&k===0)}</li>`).join(""),$(n,i.pagina,d,b)}function m(a,t=18){return`<svg width="${t}" height="${t}" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${N[a]}</svg>`}function p({icone:a,titulo:t,texto:e,botao:n}){return`
        <li class="noticias-estado">
            <span class="noticias-estado-icone">${m(a,28)}</span>
            <h2>${o(t)}</h2>
            <p>${o(e)}</p>
            ${n?`<button type="button" class="noticias-botao" data-acao="${n[0]}">${o(n[1])}</button>`:""}
        </li>`}function x(a){const t=H(a.imagem),e=t?`<img src="${o(t)}" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer">`:q(a);return`<div class="noticia-capa" data-noticia="${o(a.id)}">${e}</div>`}function B(a){const t=a.target instanceof HTMLImageElement?a.target.closest(".noticia-capa"):null;if(!t)return;const e=i.noticias.find(n=>String(n.id)===t.dataset.noticia);t.innerHTML=q(e||{})}function w(a,t){const e=String(a.resumo||"").trim(),n=y(a.publicadaEm),r=(a.instituicoes||[]).filter(s=>s in h).map(s=>`<span class="noticia-etiqueta noticia-etiqueta--${s}">${h[s]}</span>`).join("");return`
        <a class="noticia-card noticia-card--propria" href="${o(C(a.id))}">
            ${x(a)}
            <div class="noticia-corpo">
                <div class="noticia-etiquetas">
                    ${t?'<span class="noticia-recente">Mais recente</span>':""}
                    <span class="noticia-etiqueta noticia-etiqueta--propria">Notícia do Futuro+</span>
                    ${r}
                </div>
                <h2 class="noticia-titulo">${o(String(a.titulo||"").trim()||"Notícia sem título")}</h2>
                ${e?`<p class="noticia-resumo">${o(e)}</p>`:""}
                <div class="noticia-rodape">
                    <span class="noticia-fonte">Por ${o(String(a.autor||"").trim()||"Equipe Futuro+")}</span>
                    ${n?`<time class="noticia-data" datetime="${o(a.publicadaEm)}"
                        title="${o(L(a.publicadaEm))}">${o(n)}</time>`:""}
                    <span class="noticia-sair">${m("seguir",16)}</span>
                </div>
            </div>
        </a>`}function O(a,t){if(a.propria)return w(a,t);const e=T(a.link),n=String(a.resumo||"").trim(),r=y(a.publicadaEm),s=P(a).map(d=>`<span class="noticia-etiqueta noticia-etiqueta--${d.id}">${o(d.texto)}</span>`).join(""),c=`
        ${x(a)}
        <div class="noticia-corpo">
            <div class="noticia-etiquetas">
                ${t?'<span class="noticia-recente">Mais recente</span>':""}
                ${s}
            </div>
            <h2 class="noticia-titulo">${o(String(a.titulo||"").trim()||"Notícia sem título")}</h2>
            ${n?`<p class="noticia-resumo">${o(n)}</p>`:""}
            <div class="noticia-rodape">
                <span class="noticia-fonte">${o(String(a.fonte||"").trim()||"Fonte não informada")}</span>
                ${r?`<time class="noticia-data" datetime="${o(a.publicadaEm)}"
                    title="${o(L(a.publicadaEm))}">${o(r)}</time>`:""}
                ${e?`<span class="noticia-sair">${m("sair",16)}</span>`:""}
            </div>
        </div>`;return e?`
        <a class="noticia-card" href="${o(e)}" target="_blank" rel="noopener noreferrer">
            ${c}
            <span class="noticias-so-leitor">Abre o site de origem em outra aba.</span>
        </a>`:`<article class="noticia-card">${c}</article>`}
