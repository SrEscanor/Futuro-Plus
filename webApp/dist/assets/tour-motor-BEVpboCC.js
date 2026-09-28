function R(){if(document.getElementById("tb-estilos"))return;const e=document.createElement("style");e.id="tb-estilos",e.textContent=`
        .tb-overlay {
            position: fixed;
            inset: 0;
            z-index: 2000;
            font-family: 'Inter', 'Segoe UI', Arial, sans-serif;
            touch-action: none;
        }
        .tb-recorte {
            position: fixed;
            border-radius: 16px;
            box-shadow: 0 0 0 9999px rgba(15, 20, 45, 0.72);
            transition: top 0.35s ease, left 0.35s ease, width 0.35s ease, height 0.35s ease;
        }
        .tb-recorte[hidden] {
            display: none;
        }
        .tb-fundo-simples {
            position: fixed;
            inset: 0;
            background: rgba(15, 20, 45, 0.72);
        }
        .tb-balao {
            position: fixed;
            left: 50%;
            bottom: 22px;
            transform: translateX(-50%);
            width: min(380px, 92vw);
            max-height: min(70vh, 520px);
            overflow-y: auto;
            background: #fff;
            border-radius: 18px;
            padding: 18px 20px;
            box-shadow: 0 20px 50px -15px rgba(0, 0, 0, 0.5);
        }
        .tb-balao--centro {
            bottom: auto;
            top: 50%;
            transform: translate(-50%, -50%);
            text-align: center;
        }
        .tb-passo {
            font-size: 11.5px;
            font-weight: 700;
            color: #4e6ee8;
            text-transform: uppercase;
            letter-spacing: 0.04em;
            margin-bottom: 6px;
        }
        .tb-titulo {
            font-family: 'Sora', 'Segoe UI', Arial, sans-serif;
            font-size: 17px;
            font-weight: 800;
            color: #1b1f3b;
            margin-bottom: 6px;
        }
        .tb-texto {
            font-size: 13.5px;
            line-height: 1.55;
            color: #5b6084;
            margin-bottom: 16px;
        }
        .tb-acoes {
            display: flex;
            gap: 10px;
            justify-content: flex-end;
        }
        .tb-balao--centro .tb-acoes {
            justify-content: center;
        }
        .tb-btn-primario,
        .tb-btn-secundario {
            padding: 10px 18px;
            border-radius: 99px;
            font-family: 'Sora', sans-serif;
            font-size: 13px;
            font-weight: 700;
            cursor: pointer;
            border: none;
        }
        .tb-btn-primario {
            background: #4e6ee8;
            color: #fff;
        }
        .tb-btn-secundario {
            background: none;
            color: #5b6084;
        }
        /* Telas pequenas: balão mais compacto (menos padding/fonte), pra
           sobrar mais espaço de tela mostrando o que ele está explicando.
           Precisa vir depois das regras de cima pra ganhar no empate de
           especificidade (mesma classe, então quem vem por último manda). */
        @media (max-width: 480px) {
            .tb-balao {
                padding: 14px 16px;
            }
            .tb-titulo {
                font-size: 15.5px;
            }
            .tb-texto {
                font-size: 12.5px;
                line-height: 1.45;
                margin-bottom: 12px;
            }
        }
    `,document.head.appendChild(e)}function j(){const e=document.createElement("div");return e.id="tb-overlay",e.className="tb-overlay",e.innerHTML=`
        <div class="tb-fundo-simples"></div>
        <div id="tb-recorte" class="tb-recorte" hidden></div>
        <div id="tb-balao" class="tb-balao">
            <div id="tb-passo" class="tb-passo"></div>
            <h3 id="tb-titulo" class="tb-titulo"></h3>
            <p id="tb-texto" class="tb-texto"></p>
            <div class="tb-acoes">
                <button type="button" id="tb-pular" class="tb-btn-secundario">Pular tour</button>
                <button type="button" id="tb-proximo" class="tb-btn-primario">Começar</button>
            </div>
        </div>
    `,document.body.appendChild(e),e}function O(){return window.matchMedia("(min-width: 1024px)").matches}function A(e){const n=O()&&e.seletorDesktop;return{seletor:n?e.seletorDesktop:e.seletor,texto:n?e.textoDesktop:e.texto}}function V({chaveVisto:e,passos:n,forcar:P=!1}={}){function k(){try{return localStorage.getItem(e)==="1"}catch{return!1}}function z(){try{localStorage.setItem(e,"1")}catch{}window.__tourAtivo=!1}if(k()&&!P||!n||!n.length)return!1;document.getElementById("tb-overlay")&&(document.getElementById("tb-overlay").remove(),document.documentElement.style.overflow="",document.body.style.overflow="",document.documentElement.style.touchAction="",document.body.style.touchAction="");const B=document.documentElement.style.overflow,I=document.body.style.overflow,L=document.documentElement.style.touchAction,$=document.body.style.touchAction;document.documentElement.style.overflow="hidden",document.body.style.overflow="hidden",document.documentElement.style.touchAction="none",document.body.style.touchAction="none";function h(t){t.preventDefault()}window.__tourAtivo=!0,R();const i=j();i.addEventListener("touchmove",h,{passive:!1});const s=i.querySelector("#tb-recorte"),y=i.querySelector(".tb-fundo-simples"),r=i.querySelector("#tb-balao"),g=i.querySelector("#tb-passo"),v=i.querySelector("#tb-titulo"),m=i.querySelector("#tb-texto"),b=i.querySelector("#tb-proximo"),D=i.querySelector("#tb-pular");let c=0;function T(){return n.filter(t=>t.tipo!=="boas-vindas").length}function H(){return n.slice(0,c+1).filter(t=>t.tipo!=="boas-vindas").length}function p(t){if(!t){r.style.top="",r.style.bottom="";return}const o=16,a=r.offsetHeight,l=window.innerHeight-t.bottom,u=t.top;if(r.style.bottom="auto",l>=a+o||l>=u){const d=Math.min(t.bottom+o,window.innerHeight-a-o);r.style.top=`${Math.max(o,d)}px`}else{const d=Math.max(o,t.top-a-o);r.style.top=`${d}px`}}let f=0;function M(t){const o=++f;return new Promise(a=>{let l=null,u=0,d=0;function S(){if(o!==f)return;const x=t.getBoundingClientRect();if(u=l!==null&&Math.abs(x.top-l)<.5?u+1:0,l=x.top,d+=1,u>=4||d>=90){a(x);return}requestAnimationFrame(S)}requestAnimationFrame(S)})}function w(t){const o=document.querySelector(t);if(!o){f+=1,s.hidden=!0,p(null);return}o.scrollIntoView({behavior:"smooth",block:"center"}),M(o).then(a=>{s.hidden=!1,s.style.top=`${a.top-8}px`,s.style.left=`${a.left-8}px`,s.style.width=`${a.width+16}px`,s.style.height=`${a.height+16}px`,p(a)})}function E(){const t=n[c];if(t.tipo==="boas-vindas")s.hidden=!0,y.hidden=!1,r.classList.add("tb-balao--centro"),p(null),g.textContent=t.passoRotulo||"Bem-vindo(a)",v.textContent=t.titulo,m.textContent=t.texto,b.textContent="Começar";else{y.hidden=!0,r.classList.remove("tb-balao--centro");const o=A(t);g.textContent=`Passo ${H()} de ${T()}`,v.textContent=t.titulo,m.textContent=o.texto,b.textContent=c===n.length-1?"Concluir":"Próximo",w(o.seletor)}}function q(){const t=n[c];if(t.tipo!=="boas-vindas"){const o=A(t);m.textContent=o.texto,w(o.seletor)}}function C(){z(),window.removeEventListener("resize",q),i.removeEventListener("touchmove",h),document.documentElement.style.overflow=B,document.body.style.overflow=I,document.documentElement.style.touchAction=L,document.body.style.touchAction=$,i.remove()}return b.addEventListener("click",()=>{if(c===n.length-1){C();return}c+=1,E()}),D.addEventListener("click",C),window.addEventListener("resize",q),E(),!0}export{V as i};
