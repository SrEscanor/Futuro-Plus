import{s as $,f as L,a as P,d as B,b as D,e as j,o as J,I as K}from"./firebase-config-XD2rgtmE.js";import{P as Q,T as X}from"./conteudo-legal-padrao-DB74JH29.js";const Y={termos:{colecaoId:"termos-de-uso",titulo:"Termos de Uso",padrao:X},privacidade:{colecaoId:"politica-privacidade",titulo:"Política de Privacidade",padrao:Q}};async function R(s){const{colecaoId:l,padrao:c}=Y[s];try{const d=await j(B(D,"configuracoes",l));return d.exists()&&d.data().versao?{versao:d.data().versao,html:d.data().html||c}:{versao:1,html:c}}catch(d){return console.error(`Erro ao buscar ${l}:`,d),{versao:1,html:c}}}function Z(){if(document.getElementById("gt-estilos"))return;const s=document.createElement("style");s.id="gt-estilos",s.textContent=`
        .gt-modal {
            border: none;
            border-radius: 18px;
            padding: 0;
            width: min(640px, 92vw);
            max-height: 88vh;
            box-shadow: 0 24px 60px -20px rgba(20, 24, 60, 0.45);
            font-family: 'Inter', 'Segoe UI', Arial, sans-serif;
            color: var(--ink, #1b1f3b);
        }
        .gt-modal::backdrop { background: rgba(23, 27, 58, 0.65); }
        .gt-modal[open] { display: flex; flex-direction: column; }
        .gt-cabecalho {
            padding: 20px 22px 8px;
            flex-shrink: 0;
        }
        .gt-cabecalho h2 {
            font-family: 'Sora', 'Segoe UI', Arial, sans-serif;
            font-size: 18px;
            font-weight: 800;
        }
        .gt-tela { padding: 4px 22px 22px; overflow: auto; }
        .gt-tela p { font-size: 14px; line-height: 1.55; color: var(--ink-soft, #5b6084); margin-bottom: 14px; }
        .gt-botoes { display: flex; flex-direction: column; gap: 8px; margin-bottom: 14px; }
        .gt-btn-ler {
            display: flex; align-items: center; gap: 8px;
            padding: 11px 14px; border: 1.5px solid var(--line, #e6e8f5); border-radius: 12px;
            background: var(--bg, #f6f7fc); color: var(--ink, #1b1f3b);
            font-family: inherit; font-size: 13px; font-weight: 600; text-align: left; cursor: pointer;
        }
        .gt-btn-ler:hover { border-color: var(--blue, #4e6ee8); }
        .gt-btn-ler--lido { border-color: #21a85c; background: #e8faf0; }
        .gt-aceite { display: flex; align-items: flex-start; gap: 10px; margin-bottom: 16px; }
        .gt-aceite input[type="checkbox"] { width: 20px; height: 20px; flex-shrink: 0; margin-top: 1px; cursor: pointer; }
        .gt-aceite input[type="checkbox"]:disabled { cursor: not-allowed; }
        .gt-aceite label { font-size: 12.5px; line-height: 1.5; color: var(--ink-soft, #5b6084); }
        .gt-aceite a { color: var(--blue, #4e6ee8); font-weight: 600; }
        .gt-acoes { display: flex; gap: 10px; }
        .gt-btn-primario, .gt-btn-secundario {
            padding: 12px 18px; border-radius: 99px; font-family: 'Sora', sans-serif;
            font-size: 13.5px; font-weight: 700; cursor: pointer; border: none;
        }
        .gt-btn-primario { flex: 1; background: var(--blue, #4e6ee8); color: #fff; }
        .gt-btn-primario:disabled { opacity: 0.5; cursor: not-allowed; }
        .gt-btn-secundario { background: none; border: 1.5px solid var(--line, #e6e8f5); color: var(--ink-soft, #5b6084); }
        .gt-voltar {
            border: none; background: none; color: var(--blue, #4e6ee8); font-weight: 700;
            font-size: 13px; cursor: pointer; padding: 0 0 12px; display: block;
        }
        .gt-scroll {
            max-height: 44vh; overflow-y: auto; padding-right: 6px;
            border-top: 1px solid var(--line, #e6e8f5); border-bottom: 1px solid var(--line, #e6e8f5);
            margin-bottom: 10px; font-size: 13.5px; line-height: 1.6;
        }
        .gt-scroll h1 { font-size: 19px; margin: 14px 0 6px; }
        .gt-scroll h2 { font-size: 15px; margin: 18px 0 6px; }
        .gt-scroll p, .gt-scroll li { margin-bottom: 8px; }
        .gt-scroll .legal-atualizado { font-size: 11.5px; color: var(--ink-soft, #5b6084); }
        .gt-rodape { font-size: 12px; color: var(--ink-soft, #5b6084); text-align: center; }
        .gt-rodape.lido { color: #21a85c; font-weight: 600; }
    `,document.head.appendChild(s)}function ee(){const s=document.createElement("dialog");return s.id="gt-modal",s.className="gt-modal",s.innerHTML=`
        <div class="gt-cabecalho"><h2>Atualizamos nossos termos</h2></div>
        <div id="gt-tela-menu" class="gt-tela">
            <p>Para continuar usando o Futuro+, leia e aceite os documentos atualizados abaixo.</p>
            <div class="gt-botoes">
                <button type="button" class="gt-btn-ler" id="gt-btn-termos" data-chave="termos">○ Ler Termos de Uso</button>
                <button type="button" class="gt-btn-ler" id="gt-btn-privacidade" data-chave="privacidade">○ Ler Política de Privacidade</button>
            </div>
            <div class="gt-aceite">
                <input type="checkbox" id="gt-checkbox" disabled>
                <label id="gt-checkbox-label" for="gt-checkbox">Abra e leia os dois documentos acima até o fim para poder aceitar.</label>
            </div>
            <div class="gt-acoes">
                <button type="button" id="gt-sair" class="gt-btn-secundario">Sair da conta</button>
                <button type="button" id="gt-continuar" class="gt-btn-primario" disabled>Continuar usando o site</button>
            </div>
        </div>
        <div id="gt-tela-leitura" class="gt-tela" hidden>
            <button type="button" id="gt-voltar" class="gt-voltar">← Voltar</button>
            <div id="gt-leitura-conteudo" class="gt-scroll"></div>
            <div id="gt-leitura-aviso" class="gt-rodape">Role o texto até o fim para marcar como lido.</div>
        </div>
    `,document.body.appendChild(s),s}async function te(s){const[l,c]=await Promise.all([R("termos"),R("privacidade")]),d=s.termosAceitos||{},v={termos:(d.termos||0)<l.versao,privacidade:(d.privacidade||0)<c.versao};if(!v.termos&&!v.privacidade)return;Z();const a=document.getElementById("gt-modal")||ee(),g={termos:l,privacidade:c},f={termos:!v.termos,privacidade:!v.privacidade};let E=null;const k=a.querySelector("#gt-checkbox"),z=a.querySelector("#gt-checkbox-label"),b=a.querySelector("#gt-continuar"),w=a.querySelector("#gt-tela-menu"),C=a.querySelector("#gt-tela-leitura"),u=a.querySelector("#gt-leitura-conteudo"),x=a.querySelector("#gt-leitura-aviso");function n(){const o=f.termos&&f.privacidade;k.disabled=!o,o&&(z.innerHTML='Li e concordo com os <a href="termos-de-uso.html" target="_blank">Termos de Uso</a> e a <a href="privacidade.html" target="_blank">Política de Privacidade</a> atualizados.')}function A(o){!o||f[o]||(f[o]=!0,a.querySelector(`#gt-btn-${o==="termos"?"termos":"privacidade"}`).classList.add("gt-btn-ler--lido"),E===o&&(x.textContent="Lido! Você já pode voltar.",x.classList.add("lido")),n())}function I(){u.scrollHeight-(u.scrollTop+u.clientHeight)<40&&A(E)}function T(o){E=o,u.innerHTML=g[o].html,u.scrollTop=0,x.classList.remove("lido"),x.textContent=f[o]?"Lido! Você já pode voltar.":"Role o texto até o fim para marcar como lido.",w.hidden=!0,C.hidden=!1,I()}a.querySelector("#gt-btn-termos").addEventListener("click",()=>T("termos")),a.querySelector("#gt-btn-privacidade").addEventListener("click",()=>T("privacidade")),a.querySelector("#gt-voltar").addEventListener("click",()=>{C.hidden=!0,w.hidden=!1}),u.addEventListener("scroll",I),k.addEventListener("change",()=>{b.disabled=!k.checked}),a.querySelector("#gt-sair").addEventListener("click",async()=>{await $(L),window.location.href="login.html"}),b.addEventListener("click",async()=>{b.disabled=!0,b.textContent="Salvando...";try{await P(B(D,"usuarios",L.currentUser.uid),{termosAceitos:{termos:l.versao,privacidade:c.versao,aceitoEm:new Date().toISOString()}},{merge:!0}),a.close(),a.remove()}catch(o){console.error("Erro ao registrar aceite dos termos:",o),b.disabled=!1,b.textContent="Continuar usando o site",alert("Não consegui registrar seu aceite agora. Tente de novo.")}}),a.addEventListener("cancel",o=>o.preventDefault()),n(),a.showModal()}document.addEventListener("DOMContentLoaded",()=>{"serviceWorker"in navigator&&navigator.serviceWorker.getRegistrations().then(e=>{for(let t of e)t.unregister()});function s(e){return(e||"?").trim().split(/\s+/).filter(Boolean).slice(0,2).map(r=>r[0].toUpperCase()).join("")||"?"}J(L,async e=>{const t=document.getElementById("nomeUsuario"),r=document.getElementById("avatar-menu"),m=document.getElementById("avatar-iniciais"),i=document.getElementById("nav-auth");if(e){console.log("Usuário logado UID:",e.uid);let S="";try{const y=B(D,"usuarios",e.uid),h=await j(y);if(h.exists()){const p=h.data();console.log("Dados encontrados no Firestore:",p),p.exclusao&&(await P(y,{exclusao:K()},{merge:!0}),alert("Você tinha pedido para excluir sua conta. Como você entrou de novo, esse pedido foi cancelado e sua conta continua normal.")),te(p).catch(q=>console.error("Erro ao checar termos:",q)),S=[p.nome,p.sobrenome].filter(Boolean).join(" ").trim(),p.nome&&t?t.textContent=p.nome:p.nome||console.warn("O campo 'nome' não existe no documento do Firestore."),p.admin===!0&&document.querySelectorAll(".menu-admin-area").forEach(q=>{q.hidden=!1}),H(p.permissoes?.localizacaoChatbot?.concedida===!0)}else console.warn("Nenhum documento encontrado na coleção 'usuarios' para este UID.")}catch(y){console.error("Erro ao buscar dados no Firestore:",y)}m&&(m.textContent=s(S||e.email)),r&&(r.hidden=!1),i&&(i.hidden=!0)}else console.log("Nenhum usuário logado. Modo visitante ativado."),t&&(t.textContent="ESTUDANTE"),r&&(r.hidden=!0),i&&(i.hidden=!1),d()});const l=document.getElementById("avatar-botao"),c=document.getElementById("avatar-dropdown");function d(){!c||c.hidden||(c.hidden=!0,l?.setAttribute("aria-expanded","false"))}l&&c&&(l.addEventListener("click",e=>{e.stopPropagation();const t=c.hidden;c.hidden=!t,l.setAttribute("aria-expanded",String(t))}),document.addEventListener("click",e=>{!c.hidden&&!e.target.closest("#avatar-menu")&&d()}),document.addEventListener("keydown",e=>{e.key==="Escape"&&d()}));const v=document.querySelector(".hamburger"),a=document.querySelector(".menu-panel"),g=document.createElement("div");g.classList.add("menu-overlay"),document.body.appendChild(g);function f(){a&&a.classList.toggle("aberto"),g&&g.classList.toggle("ativo")}v&&g&&(v.addEventListener("click",f),g.addEventListener("click",f),document.addEventListener("keydown",e=>{e.key==="Escape"&&a?.classList.contains("aberto")&&f()}));const E=window.matchMedia("(min-width: 1024px)"),k=()=>{E.matches&&(a?.classList.remove("aberto"),g?.classList.remove("ativo"))};E.addEventListener("change",k),k();const z=document.getElementById("logout-btn");z&&z.addEventListener("click",async()=>{try{await $(L),window.location.href="login.html"}catch(e){console.error("Erro ao fazer logout:",e),alert("Não foi possível encerrar a sessão. Tente novamente.")}});const b=document.getElementById("chatbot-toggle"),w=document.getElementById("chatbot-window"),C=document.getElementById("close-chat"),u=document.getElementById("chat-input"),x=document.getElementById("send-chat"),n=document.getElementById("chat-messages"),A=()=>{w&&w.classList.toggle("oculta")};b&&b.addEventListener("click",A),C&&C.addEventListener("click",A);function I(e){return e.replace(/\[([^\]]*)\]\((https?:\/\/[^)\s]+)\)/g,"$2").replace(/^#{1,6}\s+/gm,"").replace(/\*\*(.*?)\*\*/g,"$1").replace(/\*(.*?)\*/g,"$1").replace(/`([^`]+)`/g,"$1")}function T(e,t){t.split(/(https?:\/\/[^\s<>"')\]]+)/g).forEach((m,i)=>{if(i%2===0){m&&e.appendChild(document.createTextNode(m));return}const[,S,y]=m.match(/^(.*?)([.,;:!?]*)$/),h=document.createElement("a");h.href=S,h.textContent=S,h.target="_blank",h.rel="noopener noreferrer",e.appendChild(h),y&&e.appendChild(document.createTextNode(y))})}function o(e,t){if(!e.trim()||!n)return;const r=document.createElement("div");r.classList.add("msg",t),t==="bot"?T(r,I(e)):r.textContent=e,n.appendChild(r),n.scrollTop=n.scrollHeight}function V(e){if(!n||!Array.isArray(e)||!e.length)return;const t=document.createElement("div");t.className="chat-links-site",e.forEach(({texto:r,url:m})=>{if(typeof m!="string"||!/^[a-z0-9-]+\.html(\?[^\s<>"']*)?$/i.test(m))return;const i=document.createElement("a");i.className="chat-link-site",i.href=m,i.textContent=`${r} →`,t.appendChild(i)}),t.children.length&&(n.appendChild(t),n.scrollTop=n.scrollHeight)}function F(){if(!n)return;const e=document.createElement("div");e.classList.add("msg","bot"),e.textContent="Digitando...",e.id="typing-indicator",n.appendChild(e),n.scrollTop=n.scrollHeight}function M(){document.getElementById("typing-indicator")?.remove()}const W=location.hostname==="localhost"||location.hostname==="127.0.0.1"?"http://127.0.0.1:5001/futuroplus-bce54/southamerica-east1/chat_bot":"https://southamerica-east1-futuroplus-bce54.cloudfunctions.net/chat_bot";async function N(e){o(e,"user");const t=L.currentUser;if(!t){o("Você precisa estar logado para usar o assistente.","bot");return}F();try{const r=await t.getIdToken(),i=await(await fetch(W,{method:"POST",headers:{"Content-Type":"application/json",Authorization:"Bearer "+r},body:JSON.stringify({mensagem:e})})).json();M(),o(i.resposta||i.erro||"Erro ao obter resposta.","bot"),V(i.links),Array.isArray(i.acoes)&&i.acoes.includes("pedir_permissao_localizacao")&&G()}catch(r){console.error("Erro ao chamar o chatbot:",r),M(),o("Não consegui me conectar agora. Tente novamente.","bot")}}const U=()=>{const e=u.value.trim();e&&(u.value="",N(e))};async function O(e){const t=L.currentUser;if(!t)return!1;try{return await P(B(D,"usuarios",t.uid),{permissoes:{localizacaoChatbot:{concedida:e,atualizadoEm:new Date().toISOString()}}},{merge:!0}),H(e),!0}catch(r){return console.error("Erro ao salvar a permissão de localização:",r),o("Não consegui salvar sua escolha agora. Tente novamente.","bot"),!1}}function G(){if(!n||document.getElementById("cartao-permissao-localizacao"))return;const e=document.createElement("div");e.id="cartao-permissao-localizacao",e.className="msg bot cartao-permissao",e.innerHTML=`
            <p><strong>📍 Usar a localização do seu perfil?</strong></p>
            <p>O assistente usa só a distância até as unidades. Seu endereço não aparece na conversa, e você pode desativar quando quiser.</p>
            <div class="cartao-permissao-botoes">
                <button type="button" class="btn-permitir">Permitir</button>
                <button type="button" class="btn-agora-nao">Agora não</button>
            </div>
        `,e.querySelector(".btn-permitir").addEventListener("click",async()=>{e.querySelectorAll("button").forEach(t=>{t.disabled=!0}),await O(!0)?(e.remove(),N("Pode usar a localização do meu perfil.")):e.querySelectorAll("button").forEach(t=>{t.disabled=!1})}),e.querySelector(".btn-agora-nao").addEventListener("click",()=>{e.remove(),o("Tudo bem! Se preferir, me diga a sua cidade que eu procuro as unidades de lá.","bot")}),n.appendChild(e),n.scrollTop=n.scrollHeight}function H(e){const t=document.getElementById("chat-permissao-localizacao");t&&(t.hidden=!e)}const _=document.getElementById("desativar-localizacao-chat");_&&_.addEventListener("click",async()=>{await O(!1)&&o("Pronto, não vou mais usar a localização do seu perfil. Se quiser, é só me dizer uma cidade.","bot")}),x&&x.addEventListener("click",U),u&&u.addEventListener("keypress",e=>{e.key==="Enter"&&U()})});
