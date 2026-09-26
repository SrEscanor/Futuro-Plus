const y="futuroplus_tour_visto",i=[{tipo:"boas-vindas"},{seletor:".hamburger",seletorDesktop:".menu-panel",titulo:"Menu",texto:"Por aqui você navega entre Início, Testes, Cursos, Mural e Perfil quando quiser.",textoDesktop:"No computador o menu já fica fixo na lateral — é só clicar em Início, Testes, Cursos, Mural ou Perfil quando quiser."},{seletor:"#card-vocacional",titulo:"Teste Vocacional",texto:"O mais completo: descobre as áreas que combinam com você e já termina mostrando cursos de verdade pra seguir."},{seletor:"#card-perfil",titulo:"Teste rápido de perfil",texto:'Baseado na teoria das inteligências múltiplas de Howard Gardner: descobre qual o seu tipo de inteligência mais forte (lógica, linguística, espacial, interpessoal, entre outras) e sugere áreas ligadas a ela. Dica: dá o MESMO resultado do "Teste de Afinidades" — só muda o jeito de responder. Não precisa fazer os dois.'},{seletor:".mural-cta",titulo:"Mural",texto:"Guarde aqui os certificados de cursos extras que você já fez."},{seletor:"#chatbot-toggle",titulo:"Assistente virtual",texto:"Tem uma dúvida? Pergunte aqui a qualquer momento — sobre cursos, vestibulinho ou qualquer coisa do site."}];function S(){try{return localStorage.getItem(y)==="1"}catch{return!1}}function C(){try{localStorage.setItem(y,"1")}catch{}window.__tourAtivo=!1}function k(){if(document.getElementById("tb-estilos"))return;const o=document.createElement("style");o.id="tb-estilos",o.textContent=`
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
    `,document.head.appendChild(o)}function P(){const o=document.createElement("div");return o.id="tb-overlay",o.className="tb-overlay",o.innerHTML=`
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
    `,document.body.appendChild(o),o}function T({forcar:o=!1}={}){if(S()&&!o||!document.querySelector(".hamburger"))return;document.getElementById("tb-overlay")?.remove(),window.__tourAtivo=!0,k();const r=P(),n=r.querySelector("#tb-recorte"),u=r.querySelector(".tb-fundo-simples"),b=r.querySelector("#tb-balao"),p=r.querySelector("#tb-passo"),m=r.querySelector("#tb-titulo"),c=r.querySelector("#tb-texto"),d=r.querySelector("#tb-proximo"),q=r.querySelector("#tb-pular");let s=0;function w(){return window.matchMedia("(min-width: 1024px)").matches}function f(t){const e=w()&&t.seletorDesktop;return{seletor:e?t.seletorDesktop:t.seletor,texto:e?t.textoDesktop:t.texto}}function x(t){const e=document.querySelector(t);if(!e){n.hidden=!0;return}e.scrollIntoView({behavior:"smooth",block:"center"}),setTimeout(()=>{const a=e.getBoundingClientRect(),l=8;n.hidden=!1,n.style.top=`${a.top-l}px`,n.style.left=`${a.left-l}px`,n.style.width=`${a.width+l*2}px`,n.style.height=`${a.height+l*2}px`},380)}function g(){const t=i[s];if(t.tipo==="boas-vindas")n.hidden=!0,u.hidden=!1,b.classList.add("tb-balao--centro"),p.textContent="Bem-vindo(a) ao Futuro+",m.textContent="Quer um tour rápido?",c.textContent="Leva uns 30 segundos e mostra onde ficam os testes, o mural e o assistente virtual.",d.textContent="Começar";else{u.hidden=!0,b.classList.remove("tb-balao--centro");const e=f(t);p.textContent=`Passo ${s} de ${i.length-1}`,m.textContent=t.titulo,c.textContent=e.texto,d.textContent=s===i.length-1?"Concluir":"Próximo",x(e.seletor)}}function v(){const t=i[s];if(t.tipo!=="boas-vindas"){const e=f(t);c.textContent=e.texto,x(e.seletor)}}function h(){C(),window.removeEventListener("resize",v),r.remove()}d.addEventListener("click",()=>{if(s===i.length-1){h();return}s+=1,g()}),q.addEventListener("click",h),window.addEventListener("resize",v),g()}export{T as iniciarTourBoasVindas};
