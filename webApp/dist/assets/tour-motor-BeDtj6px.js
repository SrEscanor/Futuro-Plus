function j(){if(document.getElementById("tb-estilos"))return;const o=document.createElement("style");o.id="tb-estilos",o.textContent=`
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
    `,document.head.appendChild(o)}function O(){const o=document.createElement("div");return o.id="tb-overlay",o.className="tb-overlay",o.innerHTML=`
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
    `,document.body.appendChild(o),o}function _(){return window.matchMedia("(min-width: 1024px)").matches}function A(o){const i=_()&&o.seletorDesktop;return{seletor:i?o.seletorDesktop:o.seletor,texto:i?o.textoDesktop:o.texto}}function V({chaveVisto:o,passos:i,forcar:P=!1}={}){function k(){try{return localStorage.getItem(o)==="1"}catch{return!1}}function B(){try{localStorage.setItem(o,"1")}catch{}window.__tourAtivo=!1}if(k()&&!P||!i||!i.length)return!1;document.getElementById("tb-overlay")&&(document.getElementById("tb-overlay").remove(),document.documentElement.style.overflow="",document.body.style.overflow="",document.documentElement.style.touchAction="",document.body.style.touchAction="");const T=document.documentElement.style.overflow,z=document.body.style.overflow,L=document.documentElement.style.touchAction,I=document.body.style.touchAction;document.documentElement.style.overflow="hidden",document.body.style.overflow="hidden",document.documentElement.style.touchAction="none",document.body.style.touchAction="none";function h(t){t.preventDefault()}window.__tourAtivo=!0,j();const a=O();a.addEventListener("touchmove",h,{passive:!1});const s=a.querySelector("#tb-recorte"),y=a.querySelector(".tb-fundo-simples"),r=a.querySelector("#tb-balao"),g=a.querySelector("#tb-passo"),v=a.querySelector("#tb-titulo"),m=a.querySelector("#tb-texto"),b=a.querySelector("#tb-proximo"),$=a.querySelector("#tb-pular");let c=0;function D(){return i.filter(t=>t.tipo!=="boas-vindas").length}function M(){return i.slice(0,c+1).filter(t=>t.tipo!=="boas-vindas").length}function p(t){if(!t){r.style.top="",r.style.bottom="";return}const e=16,n=r.offsetHeight,l=window.innerHeight-t.bottom,u=t.top;if(r.style.bottom="auto",l>=n+e||l>=u){const d=Math.min(t.bottom+e,window.innerHeight-n-e);r.style.top=`${Math.max(e,d)}px`}else{const d=Math.max(e,t.top-n-e);r.style.top=`${d}px`}}let f=0;function R(t){const e=++f;return new Promise(n=>{let l=null,u=0,d=0;function S(){if(e!==f)return;const x=t.getBoundingClientRect();if(u=l!==null&&Math.abs(x.top-l)<.5?u+1:0,l=x.top,d+=1,u>=4||d>=90){n(x);return}requestAnimationFrame(S)}requestAnimationFrame(S)})}function H(t){const n=window.scrollY+t.getBoundingClientRect().top-84;window.scrollTo({top:Math.max(0,n),behavior:"smooth"})}function w(t){const e=document.querySelector(t);if(!e){f+=1,s.hidden=!0,p(null);return}H(e),R(e).then(n=>{s.hidden=!1,s.style.top=`${n.top-8}px`,s.style.left=`${n.left-8}px`,s.style.width=`${n.width+16}px`,s.style.height=`${n.height+16}px`,p(n)})}function E(){const t=i[c];if(t.tipo==="boas-vindas")s.hidden=!0,y.hidden=!1,r.classList.add("tb-balao--centro"),p(null),g.textContent=t.passoRotulo||"Bem-vindo(a)",v.textContent=t.titulo,m.textContent=t.texto,b.textContent="Começar";else{y.hidden=!0,r.classList.remove("tb-balao--centro");const e=A(t);g.textContent=`Passo ${M()} de ${D()}`,v.textContent=t.titulo,m.textContent=e.texto,b.textContent=c===i.length-1?"Concluir":"Próximo",w(e.seletor)}}function q(){const t=i[c];if(t.tipo!=="boas-vindas"){const e=A(t);m.textContent=e.texto,w(e.seletor)}}function C(){B(),window.removeEventListener("resize",q),a.removeEventListener("touchmove",h),document.documentElement.style.overflow=T,document.body.style.overflow=z,document.documentElement.style.touchAction=L,document.body.style.touchAction=I,a.remove()}return b.addEventListener("click",()=>{if(c===i.length-1){C();return}c+=1,E()}),$.addEventListener("click",C),window.addEventListener("resize",q),E(),!0}export{V as i};
