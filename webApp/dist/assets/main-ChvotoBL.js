import{o as D,g as j,d as U,b as M,a as R,c as F,e as Q}from"./firebase-config-h-KQCxoQ.js";/* empty css              */import"./dashboard-CTg4YrJA.js";/* empty css                    */import{c as I}from"./categorias-teste-82RqXHiT.js";import{d as x}from"./descricoes-inteligencias-D_icd3AV.js";import{a as ue}from"./capas-eixos-GInZ-sis.js";import{e as me,a as X,b as pe}from"./resultado-teste-xMN1ahPz.js";import{e as d,l as G,n as k,L as ge}from"./card-unidade-I-oVmKo3.js";import{r as fe}from"./demanda-curso-Bz72gXLF.js";import{b as he,r as ve,c as $e,d as Ee,e as be,f as ye,t as Le,g as Ie,l as qe}from"./recomendacao-cursos-2jPMRLhP.js";import{p as Me,n as xe}from"./noticias-dados-MU-iwzNx.js";import{b as Y,M as Te,e as s,c as W,l as Be,r as Ce,t as K,d as J,i as Ae}from"./destaques-util-enNUxLIo.js";import{l as De}from"./noticias-proprias-util-hJONuzA2.js";import{iniciarTourBoasVindas as Re}from"./tour-boas-vindas-Bosq5K8y.js";import"./preload-helper-PPVm8Dsz.js";import"./conteudo-legal-padrao-DcxCgRAC.js";import"./notificacoes-util-BE-pPj56.js";import"./geocodificacao-BkfVnwNK.js";import"./historico-paginas-CB2wGtFd.js";import"./tour-motor-BeDtj6px.js";const Se=["arco-1","arco-2","arco-3"].map(e=>document.getElementById(e)),ke=document.getElementById("resultado-com-dados"),He=document.getElementById("resultado-vazio"),Pe=document.getElementById("vocacional-com-dados"),we=document.getElementById("vocacional-vazio"),H=["#4e6ee8","#f5a623","#2ecc71"],Ve={gardner:"quiz-gardner.html",afinidades:"teste-afinidades.html"},Ne={gardner:"Teste rápido de perfil",afinidades:"Teste de Afinidades"};function P(e){return e.toLocaleString("pt-BR",{maximumFractionDigits:1})}function q(e,t){e&&(e.hidden=!t)}function Z(e,t){const a=document.getElementById(e);if(!a)return;const o=t?new Date(t):null,n=o&&!Number.isNaN(o.getTime());a.textContent=n?`feito em ${o.toLocaleDateString("pt-BR")}`:"",a.hidden=!n}function T(e){const t=e?.resultado||null;if(q(He,!t),q(ke,!!t),Z("perfil-data",t?.concluidoEm),!t)return;const a=e.chaveTeste,o=Ve[a]||"quiz-gardner.html";document.getElementById("perfil-nome-teste").textContent=Ne[a]||"Teste rápido de perfil",document.getElementById("perfil-refazer").href=o,document.getElementById("perfil-ver").href=`${o}?ver=1`;const n=t.ranking.slice(0,3),i=n.reduce((m,c)=>m+(t.porcentagens[c]||0),0),u=n.map(m=>i>0?(t.porcentagens[m]||0)/i*100:0);let f=0;Se.forEach((m,c)=>{const r=u[c]||0;m.setAttribute("stroke-dasharray",`${r} 100`),m.setAttribute("stroke-dashoffset",`${-f}`),f+=r});const $=t.categoriaPrincipal;document.getElementById("resultado-titulo").textContent=x[$]?.title||`Inteligência ${I[$]||$}`,document.getElementById("resultado-percentual").textContent=`${P(u[0]||0)}%`,document.getElementById("perfil-desc").textContent=x[$]?.desc||"",document.getElementById("perfil-legenda").innerHTML=n.map((m,c)=>{const r=I[m]||x[m]?.title||m,de=u[0]>0?Math.round(u[c]/u[0]*100):0;return`
            <li>
                <i style="background:${H[c]}"></i>
                <span>${c+1}º ${d(r)}</span>
                <b>${P(u[c]||0)}%</b>
                <div class="perfil-legenda-barra"><span style="width:${de}%;background:${H[c]}"></span></div>
            </li>`}).join("")}function Oe(e){const{cores:t,icone:a}=ue(e);return`<span class="curso-resultado-icone" style="background:linear-gradient(135deg,${t[0]},${t[1]})">
        <svg viewBox="0 0 24 24" aria-hidden="true">${a}</svg></span>`}function B(e){q(we,!e),q(Pe,!!e),Z("vocacional-data",e?.concluidoEm),e&&(document.getElementById("vocacional-areas").innerHTML=(e.eixosFortes||[]).slice(0,2).map((t,a)=>`<span class="area-forte"><b>${a+1}º</b>${d(t)}</span>`).join(""),document.getElementById("vocacional-cursos").innerHTML=(e.cursos||[]).slice(0,3).map(t=>`
            <li class="curso-resultado">
                ${Oe(t.eixo)}
                <span class="curso-resultado-texto">
                    <a href="curso.html?c=${encodeURIComponent(t.slug)}">${d(t.nome)}</a>
                    ${t.eixo?`<span>${d(t.eixo)}</span>`:""}
                </span>
                ${t.resposta==="quero"?'<span class="voc-selo">você quis</span>':""}
            </li>`).join(""))}D(R,async e=>{if(!e){T(null),B(null);return}try{const t=await j(U(M,"usuarios",e.uid)),a=t.exists()?t.data():null;T(me(a)),B(X(a))}catch(t){console.error("Erro ao carregar resultado dos testes:",t),T(null),B(null)}});function ee(e){e&&e.addEventListener("wheel",t=>{Math.abs(t.deltaX)>=Math.abs(t.deltaY)||(t.preventDefault(),e.scrollLeft+=t.deltaY)},{passive:!1})}const ze=8;function _e(e){return e.nivel==="superior"?"superior":"tecnico"}function je(e){return e==="superior"?"Superior (Fatec)":"Técnico (Etec)"}function Ue(e,t){const a=_e(e),o=G(a==="superior"?"fatec":"etec"),n=(e.eixos||[]).length-1;return`
    <a class="card-curso-catalogo" href="curso.html?c=${encodeURIComponent(e.id)}">
        <div class="card-curso-catalogo-cabecalho">
            <img class="card-curso-catalogo-logo" src="${o}" alt="">
            <span class="badge-nivel badge-nivel--${a}">${je(a)}</span>
        </div>
        <h3 class="card-curso-catalogo-titulo">${d(e.nome)}</h3>
        <div class="card-curso-catalogo-eixos">
            ${(e.eixos||[]).slice(0,1).map(i=>`<span class="tag-curso">${d(i)}</span>`).join("")}
            ${n>0?`<span class="tag-curso tag-curso--mais">+${n}</span>`:""}
        </div>
        ${e.descricao?`
        <div class="card-curso-catalogo-descricao">
            <span class="card-curso-catalogo-descricao-rotulo">O que você aprende</span>
            <p>${d(e.descricao)}</p>
        </div>`:""}
        <div class="card-curso-catalogo-rodape card-curso-catalogo-rodape--demanda">
            <span class="badge-demanda badge-demanda--${t.nivel.chave}">${t.porVagaTexto} cand./vaga</span>
            <span class="card-curso-catalogo-ler-mais">Ver mais &rarr;</span>
        </div>
    </a>`}document.addEventListener("DOMContentLoaded",async()=>{const e=document.getElementById("preview-cursos-demanda");if(e){ee(e);try{const a=(await F(Q(M,"cursos"))).docs.map(o=>({id:o.id,...o.data()})).map(o=>({curso:o,resumo:fe(o.demanda)})).filter(o=>o.resumo).sort((o,n)=>n.resumo.porVaga-o.resumo.porVaga).slice(0,ze);if(!a.length){e.innerHTML='<p class="sem-resultados">Ainda não há demanda coletada para os cursos.</p>';return}e.innerHTML=a.map(({curso:o,resumo:n})=>Ue(o,n)).join("")}catch(t){console.error("Erro ao carregar cursos com maior demanda:",t),e.innerHTML='<p class="sem-resultados">Não foi possível carregar os cursos agora.</p>'}}});const w=document.getElementById("recomendados-titulo"),V=document.getElementById("recomendados-sub"),L=document.getElementById("recomendados-scroll");ee(L);function Fe(e){const t=[...e];for(let a=t.length-1;a>0;a--){const o=Math.floor(Math.random()*(a+1));[t[a],t[o]]=[t[o],t[a]]}return t}function Qe(e,t){const a=e.motivoTexto||Le(e),o=e.unidades[0],n=o?.logotipoUrl||G(o?.tipo);return`
        <div class="course-card-mini">
            <div class="inst-logo">
                <img class="inst-logo-img" src="${d(n)}" alt="${d(o?.tipo||"Futuro+")}"
                    onerror="this.onerror=null;this.src='${ge}';">
            </div>
            <div class="course-title">${d(e.nome)}</div>
            ${a?`<div class="course-motivo">${d(a)}</div>`:""}
            <div class="course-meta">${d(Ie(e,t))}</div>
            <a class="btn-saiba" href="${qe(e.nome)}">Ver unidades</a>
        </div>`}function N(e){const t=I[e.ranking?.[0]],a=I[e.ranking?.[1]];return a?`${t} e ${a}`:t}D(R,async e=>{if(L)try{let t=null;if(e){const r=await j(U(M,"usuarios",e.uid));t=r.exists()?r.data():null}const a=pe(t),o=X(t),[n,i]=await Promise.all([he(),ve(e?.uid,t)]),u=i?await $e().catch(()=>null):null,f=o?Ee(o,{oferta:n,localizacao:i,regioes:u,limite:8}):[],$=new Set(f.map(r=>k(r.nome))),m=(a?be(a,{oferta:n,localizacao:i,regioes:u,limite:8}):[]).filter(r=>!$.has(k(r.nome)));let c=Fe([...f,...m]).slice(0,8);if(c.length){w.textContent="Recomendados para você";let r;f.length&&a?r=`Com base no seu Teste Vocacional e no seu perfil ${N(a)}`:f.length?r="Com base no seu Teste Vocacional":r=`Com base no seu perfil ${N(a)}`,V.textContent=r+(i?`, priorizando unidades perto de ${i.cidade}.`:".")}else c=ye(n,{localizacao:i,regioes:u,limite:8}),w.textContent="Cursos mais oferecidos nas unidades",V.innerHTML='<a href="testes.html">Faça um teste</a> e receba recomendações feitas para você.';L.innerHTML=c.length?c.map(r=>Qe(r,i)).join(""):'<p class="recomendacoes-carregando">Nenhum curso cadastrado ainda.</p>'}catch(t){console.error("Erro ao carregar recomendações de cursos:",t),L.innerHTML='<p class="recomendacoes-carregando">Não foi possível carregar as recomendações agora.</p>'}});const Xe=8e3,Ge=5e3,v=document.getElementById("destaques-inicio"),l=document.getElementById("destaques-trilho"),y=document.getElementById("destaques-pontos"),te=document.getElementById("destaques-anterior"),ae=document.getElementById("destaques-proximo"),oe=matchMedia("(prefers-reduced-motion: reduce)");let S=[],p=0,h=0,b=!1,O=!1;const Ye=`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"
    stroke-linejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg>`,We=`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"
    stroke-linejoin="round" aria-hidden="true"><path d="M18 13.5V18a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4.5M14 4h6v6M20 4l-9 9" /></svg>`,Ke=`
    <article class="destaque destaque--esqueleto" aria-hidden="true">
        <div class="destaque-imagem"></div>
        <div class="destaque-texto">
            <span class="destaque-esqueleto-linha destaque-esqueleto-linha--curta"></span>
            <span class="destaque-esqueleto-linha"></span>
            <span class="destaque-esqueleto-linha destaque-esqueleto-linha--media"></span>
        </div>
    </article>`;function Je(e){const t=String(e||"").trim();return/^https?:\/\//i.test(t)||t&&!t.includes(":")&&!t.startsWith("//")?t:""}function Ze(e,t){const a=s(e.botao||"Saiba mais");return e.externo&&/^https?:/i.test(t)?`<a class="destaque-botao" href="${s(t)}" target="_blank" rel="noopener noreferrer">${a}
            ${We}<span class="so-leitor"> (abre o site de origem em outra aba)</span></a>`:`<a class="destaque-botao" href="${s(t)}">${a} ${Ye}</a>`}function et(e,t,a){const o=Je(e.link),n=String(e.imagem||"").trim(),i=n?`<img src="${s(n)}" alt="" decoding="async"${e.arte?' referrerpolicy="no-referrer"':""}>`:e.arte||"";return`
        <article class="destaque" role="group" aria-roledescription="destaque" aria-label="${t+1} de ${a}"
            data-indice="${t}">
            <div class="destaque-imagem">
                ${i}
                ${e.etiqueta?`<span class="destaque-etiqueta">${s(e.etiqueta)}</span>`:""}
            </div>
            <div class="destaque-texto">
                <h4 class="destaque-titulo-item">${s(e.titulo||"")}</h4>
                ${e.texto?`<p>${s(e.texto)}</p>`:""}
                ${e.meta?`<span class="destaque-meta">${s(e.meta)}</span>`:""}
                ${o?Ze(e,o):""}
            </div>
        </article>`}function ne(){y.querySelectorAll(".destaques-ponto").forEach((e,t)=>{e.setAttribute("aria-current",t===h?"true":"false")})}function se(){const[e,t]=l.children;return t?Math.max(1,t.getBoundingClientRect().left-e.getBoundingClientRect().left):Math.max(1,l.clientWidth)}function E(e,t=!0){p&&(h=(e+p)%p,l.scrollTo({left:h*se(),behavior:t&&!oe.matches?"smooth":"auto"}),ne())}function re(e){y.hidden=!e,te.hidden=!e,ae.hidden=!e}function tt(e){if(!v||!l)return;const t=(Array.isArray(e)&&e.length?e:Y([])).slice(0,Te);S=t,p=t.length,l.removeAttribute("aria-busy"),l.innerHTML=t.map((a,o)=>et(a,o,p)).join(""),y.innerHTML=t.map((a,o)=>`
        <button type="button" class="destaques-ponto" data-indice="${o}"
            aria-label="Ver o destaque ${o+1} de ${p}"></button>`).join(""),re(p>1),E(0,!1)}function at(){S=[],p=0,l.setAttribute("aria-busy","true"),l.innerHTML=Ke,y.innerHTML="",re(!1)}async function ot(){at();let e=[];try{e=await Promise.race([Me(),new Promise((t,a)=>{setTimeout(()=>a(new Error("a lista demorou demais para chegar")),Ge)})])}catch(t){console.error("Erro ao carregar os destaques da Início:",t)}tt(Y(e))}if(v&&l){let e=0;l.addEventListener("scroll",()=>{cancelAnimationFrame(e),e=requestAnimationFrame(()=>{const a=Math.round(l.scrollLeft/se());a!==h&&a<p&&(h=a,ne())})}),l.addEventListener("error",a=>{const o=a.target;if(!(o instanceof HTMLImageElement))return;const n=S[Number(o.closest(".destaque")?.dataset.indice)];n?.arte&&(o.insertAdjacentHTML("beforebegin",n.arte),o.remove())},!0);const t=()=>{O=!0};te.addEventListener("click",()=>{t(),E(h-1)}),ae.addEventListener("click",()=>{t(),E(h+1)}),y.addEventListener("click",a=>{const o=a.target.closest(".destaques-ponto");o&&(t(),E(Number(o.dataset.indice)))}),l.addEventListener("pointerdown",t),l.addEventListener("wheel",a=>{Math.abs(a.deltaX)>Math.abs(a.deltaY)&&t()},{passive:!0}),v.addEventListener("mouseenter",()=>{b=!0}),v.addEventListener("mouseleave",()=>{b=!1}),v.addEventListener("focusin",()=>{b=!0}),v.addEventListener("focusout",a=>{v.contains(a.relatedTarget)||(b=!1)}),setInterval(()=>{O||b||document.hidden||oe.matches||p<2||E(h+1)},Xe),addEventListener("resize",()=>E(h,!1)),ot()}const nt=6,g=document.getElementById("noticias-inicio-lista");let ie=[];function ce(e){const t=Ae(e.imagem),a=t?`<img src="${s(t)}" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer">`:W(e);return`<span class="noticia-mini-capa" data-noticia="${s(e.id)}">${a}</span>`}function st(e){if(e.propria)return rt(e);const t=Be(e.link),a=String(e.titulo||"").trim()||"Notícia sem título",o=Ce(e).map(f=>f.texto).join(" e "),n=K(e.publicadaEm),i=[`<span class="noticia-mini-etiqueta">${s(o)}</span>`,n?`<time datetime="${s(e.publicadaEm)}" title="${s(J(e.publicadaEm))}">${s(n)}</time>`:""].filter(Boolean).join(" · "),u=`
        ${ce(e)}
        <span class="noticia-mini-texto">
            <span class="noticia-mini-titulo">${s(a)}</span>
            <span class="noticia-mini-meta">${i}</span>
        </span>`;return t?`
        <li><a class="noticia-mini" href="${s(t)}" target="_blank" rel="noopener noreferrer">
            ${u}
            <span class="so-leitor">Abre o site de origem em outra aba.</span>
        </a></li>`:`<li><div class="noticia-mini">${u}</div></li>`}function rt(e){const t=K(e.publicadaEm);return`
        <li><a class="noticia-mini noticia-mini--propria" href="${s(De(e.id))}">
            ${ce(e)}
            <span class="noticia-mini-texto">
                <span class="noticia-mini-titulo">${s(String(e.titulo||"").trim()||"Notícia sem título")}</span>
                <span class="noticia-mini-meta"><span class="noticia-mini-etiqueta">Futuro+</span>${t?` · <time datetime="${s(e.publicadaEm)}" title="${s(J(e.publicadaEm))}">${s(t)}</time>`:""}</span>
            </span>
        </a></li>`}function le(e){return`<li class="noticias-inicio-aviso">${s(e)}</li>`}function it(e){g&&(ie=e,g.innerHTML=e.length?e.map(st).join(""):le("Ainda não há notícias publicadas."),requestAnimationFrame(A))}function A(){const e=g.getBoundingClientRect().right-1;let t=!1;g.querySelectorAll(":scope > li").forEach(a=>{a.inert=a.getBoundingClientRect().left>=e,t||=a.inert}),g.classList.toggle("noticias-inicio-lista--cheia",t)}g&&"ResizeObserver"in window&&(new ResizeObserver(A).observe(g),document.fonts?.ready.then(A));g?.addEventListener("error",e=>{const t=e.target instanceof HTMLImageElement?e.target.closest(".noticia-mini-capa"):null;if(!t)return;const a=ie.find(o=>String(o.id)===t.dataset.noticia);t.innerHTML=W(a||{})},!0);async function ct(){if(g)try{it(await xe(nt))}catch(e){console.error("Erro ao carregar as últimas notícias:",e),g.innerHTML=le("Não foi possível carregar as notícias agora.")}}ct();const lt=3,z=document.getElementById("mural-mini"),dt=document.getElementById("mural-mini-quadros"),ut=document.getElementById("mural-mini-contagem"),_=document.getElementById("mural-cta");function C(e){if(!z||!_)return;const t=e.length>0;z.hidden=!t,_.hidden=t,t&&(ut.textContent=`${e.length} certificado${e.length>1?"s":""} no seu mural`,dt.innerHTML=e.slice(0,lt).map(a=>`
        <li class="mural-mini-quadro">
            <div class="mural-moldura">
                <img src="${d(a.url)}" alt="${d(a.titulo||"Certificado")}"
                    loading="lazy" decoding="async">
            </div>
        </li>`).join(""))}D(R,async e=>{if(!e){C([]);return}try{const a=(await F(Q(M,"usuarios",e.uid,"certificados"))).docs.map(o=>({id:o.id,...o.data()})).filter(o=>o.url).sort((o,n)=>(n.criadoEm||"").localeCompare(o.criadoEm||""));C(a)}catch(t){console.error("Erro ao carregar o mini mural:",t),C([])}});document.addEventListener("DOMContentLoaded",()=>{const e=new URLSearchParams(location.search),t=e.get("tour")==="1";if(t){e.delete("tour");const a=e.toString();history.replaceState(null,"",location.pathname+(a?`?${a}`:""))}Re({forcar:t})});
