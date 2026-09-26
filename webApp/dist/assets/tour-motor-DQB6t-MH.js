function E(){if(document.getElementById("tb-estilos"))return;const t=document.createElement("style");t.id="tb-estilos",t.textContent=`
        .tb-overlay {
            position: fixed;
            inset: 0;
            z-index: 2000;
            font-family: 'Inter', 'Segoe UI', Arial, sans-serif;
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
    `,document.head.appendChild(t)}function P(){const t=document.createElement("div");return t.id="tb-overlay",t.className="tb-overlay",t.innerHTML=`
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
    `,document.body.appendChild(t),t}function I(){return window.matchMedia("(min-width: 1024px)").matches}function g(t){const o=I()&&t.seletorDesktop;return{seletor:o?t.seletorDesktop:t.seletor,texto:o?t.textoDesktop:t.texto}}function z({chaveVisto:t,passos:o,forcar:y=!1}={}){function w(){try{return localStorage.getItem(t)==="1"}catch{return!1}}function C(){try{localStorage.setItem(t,"1")}catch{}window.__tourAtivo=!1}if(w()&&!y||!o||!o.length)return!1;document.getElementById("tb-overlay")?.remove(),window.__tourAtivo=!0,E();const n=P(),r=n.querySelector("#tb-recorte"),b=n.querySelector(".tb-fundo-simples"),u=n.querySelector("#tb-balao"),f=n.querySelector("#tb-passo"),p=n.querySelector("#tb-titulo"),c=n.querySelector("#tb-texto"),d=n.querySelector("#tb-proximo"),S=n.querySelector("#tb-pular");let s=0;function k(){return o.filter(e=>e.tipo!=="boas-vindas").length}function q(){return o.slice(0,s+1).filter(e=>e.tipo!=="boas-vindas").length}function x(e){const i=document.querySelector(e);if(!i){r.hidden=!0;return}i.scrollIntoView({behavior:"smooth",block:"center"}),setTimeout(()=>{const a=i.getBoundingClientRect(),l=8;r.hidden=!1,r.style.top=`${a.top-l}px`,r.style.left=`${a.left-l}px`,r.style.width=`${a.width+l*2}px`,r.style.height=`${a.height+l*2}px`},380)}function m(){const e=o[s];if(e.tipo==="boas-vindas")r.hidden=!0,b.hidden=!1,u.classList.add("tb-balao--centro"),f.textContent=e.passoRotulo||"Bem-vindo(a)",p.textContent=e.titulo,c.textContent=e.texto,d.textContent="Começar";else{b.hidden=!0,u.classList.remove("tb-balao--centro");const i=g(e);f.textContent=`Passo ${q()} de ${k()}`,p.textContent=e.titulo,c.textContent=i.texto,d.textContent=s===o.length-1?"Concluir":"Próximo",x(i.seletor)}}function h(){const e=o[s];if(e.tipo!=="boas-vindas"){const i=g(e);c.textContent=i.texto,x(i.seletor)}}function v(){C(),window.removeEventListener("resize",h),n.remove()}return d.addEventListener("click",()=>{if(s===o.length-1){v();return}s+=1,m()}),S.addEventListener("click",v),window.addEventListener("resize",h),m(),!0}export{z as i};
