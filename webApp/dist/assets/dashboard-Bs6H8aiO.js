const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["./tour-boas-vindas-BSlPDG-R.js","./tour-motor-DQB6t-MH.js","./tour-paginas-Bwk8Bj9d.js"])))=>i.map(i=>d[i]);
import{s as R,f as w,a as O,d as D,b as N,e as oe,l as le,o as de,K as ue}from"./firebase-config-BtrRUHdO.js";import{P as me,T as ge}from"./conteudo-legal-padrao-DB74JH29.js";const pe="modulepreload",fe=function(n,o){return new URL(n,o).href},Y={},Z=function(o,a,l){let d=Promise.resolve();if(a&&a.length>0){let L=function(v){return Promise.all(v.map(p=>Promise.resolve(p).then(y=>({status:"fulfilled",value:y}),y=>({status:"rejected",reason:y}))))};const u=document.getElementsByTagName("link"),i=document.querySelector("meta[property=csp-nonce]"),E=i?.nonce||i?.getAttribute("nonce");d=L(a.map(v=>{if(v=fe(v,l),v in Y)return;Y[v]=!0;const p=v.endsWith(".css"),y=p?'[rel="stylesheet"]':"";if(l)for(let f=u.length-1;f>=0;f--){const x=u[f];if(x.href===v&&(!p||x.rel==="stylesheet"))return}else if(document.querySelector(`link[href="${v}"]${y}`))return;const g=document.createElement("link");if(g.rel=p?"stylesheet":pe,p||(g.as="script"),g.crossOrigin="",g.href=v,E&&g.setAttribute("nonce",E),document.head.appendChild(g),p)return new Promise((f,x)=>{g.addEventListener("load",f),g.addEventListener("error",()=>x(new Error(`Unable to preload CSS for ${v}`)))})}))}function c(u){const i=new Event("vite:preloadError",{cancelable:!0});if(i.payload=u,window.dispatchEvent(i),!i.defaultPrevented)throw u}return d.then(u=>{for(const i of u||[])i.status==="rejected"&&c(i.reason);return o().catch(c)})},be={termos:{colecaoId:"termos-de-uso",titulo:"Termos de Uso",padrao:ge},privacidade:{colecaoId:"politica-privacidade",titulo:"Política de Privacidade",padrao:me}};async function ee(n){const{colecaoId:o,padrao:a}=be[n];try{const l=await oe(D(N,"configuracoes",o));return l.exists()&&l.data().versao?{versao:l.data().versao,html:l.data().html||a}:{versao:1,html:a}}catch(l){return console.error(`Erro ao buscar ${o}:`,l),{versao:1,html:a}}}function he(){if(document.getElementById("gt-estilos"))return;const n=document.createElement("style");n.id="gt-estilos",n.textContent=`
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
    `,document.head.appendChild(n)}function ve(){const n=document.createElement("dialog");return n.id="gt-modal",n.className="gt-modal",n.innerHTML=`
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
    `,document.body.appendChild(n),n}async function ye(n){const[o,a]=await Promise.all([ee("termos"),ee("privacidade")]),l=n.termosAceitos||{},d={termos:(l.termos||0)<o.versao,privacidade:(l.privacidade||0)<a.versao};if(!d.termos&&!d.privacidade)return;he();const c=document.getElementById("gt-modal")||ve(),u={termos:o,privacidade:a},i={termos:!d.termos,privacidade:!d.privacidade};let E=null;const L=c.querySelector("#gt-checkbox"),v=c.querySelector("#gt-checkbox-label"),p=c.querySelector("#gt-continuar"),y=c.querySelector("#gt-tela-menu"),g=c.querySelector("#gt-tela-leitura"),f=c.querySelector("#gt-leitura-conteudo"),x=c.querySelector("#gt-leitura-aviso");function T(){const m=i.termos&&i.privacidade;L.disabled=!m,m&&(v.innerHTML='Li e concordo com os <a href="termos-de-uso.html" target="_blank">Termos de Uso</a> e a <a href="privacidade.html" target="_blank">Política de Privacidade</a> atualizados.')}function I(m){!m||i[m]||(i[m]=!0,c.querySelector(`#gt-btn-${m==="termos"?"termos":"privacidade"}`).classList.add("gt-btn-ler--lido"),E===m&&(x.textContent="Lido! Você já pode voltar.",x.classList.add("lido")),T())}function B(){f.scrollHeight-(f.scrollTop+f.clientHeight)<40&&I(E)}function z(m){E=m,f.innerHTML=u[m].html,f.scrollTop=0,x.classList.remove("lido"),x.textContent=i[m]?"Lido! Você já pode voltar.":"Role o texto até o fim para marcar como lido.",y.hidden=!0,g.hidden=!1,B()}c.querySelector("#gt-btn-termos").addEventListener("click",()=>z("termos")),c.querySelector("#gt-btn-privacidade").addEventListener("click",()=>z("privacidade")),c.querySelector("#gt-voltar").addEventListener("click",()=>{g.hidden=!0,y.hidden=!1}),f.addEventListener("scroll",B),L.addEventListener("change",()=>{p.disabled=!L.checked}),c.querySelector("#gt-sair").addEventListener("click",async()=>{await R(w),window.location.href="login.html"}),p.addEventListener("click",async()=>{p.disabled=!0,p.textContent="Salvando...";try{await O(D(N,"usuarios",w.currentUser.uid),{termosAceitos:{termos:o.versao,privacidade:a.versao,aceitoEm:new Date().toISOString()}},{merge:!0}),c.close(),c.remove()}catch(m){console.error("Erro ao registrar aceite dos termos:",m),p.disabled=!1,p.textContent="Continuar usando o site",alert("Não consegui registrar seu aceite agora. Tente de novo.")}}),c.addEventListener("cancel",m=>m.preventDefault()),T(),c.showModal()}function xe(){if(document.getElementById("ge-estilos"))return;const n=document.createElement("style");n.id="ge-estilos",n.textContent=`
        .ge-modal {
            border: none;
            border-radius: 18px;
            padding: 0;
            width: min(440px, 92vw);
            box-shadow: 0 24px 60px -20px rgba(20, 24, 60, 0.45);
            font-family: 'Inter', 'Segoe UI', Arial, sans-serif;
            color: var(--ink, #1b1f3b);
        }
        .ge-modal::backdrop { background: rgba(23, 27, 58, 0.65); }
        .ge-modal[open] { display: flex; flex-direction: column; }
        .ge-corpo { padding: 26px 24px 22px; text-align: center; }
        .ge-icone { font-size: 40px; margin-bottom: 6px; }
        .ge-corpo h2 {
            font-family: 'Sora', 'Segoe UI', Arial, sans-serif;
            font-size: 18px;
            font-weight: 800;
            margin-bottom: 8px;
        }
        .ge-corpo p { font-size: 13.5px; line-height: 1.55; color: var(--ink-soft, #5b6084); margin-bottom: 6px; }
        .ge-email { font-weight: 700; color: var(--ink, #1b1f3b); }
        .ge-status { font-size: 12.5px; margin: 12px 0 4px; min-height: 16px; }
        .ge-status.ok { color: #21a85c; font-weight: 600; }
        .ge-status.erro { color: var(--red, #dc2626); font-weight: 600; }
        .ge-acoes { display: flex; flex-direction: column; gap: 8px; margin-top: 14px; }
        .ge-btn-primario, .ge-btn-secundario, .ge-btn-terciario {
            padding: 12px 18px; border-radius: 99px; font-family: 'Sora', sans-serif;
            font-size: 13.5px; font-weight: 700; cursor: pointer; border: none;
        }
        .ge-btn-primario { background: var(--blue, #4e6ee8); color: #fff; }
        .ge-btn-primario:disabled { opacity: 0.6; cursor: not-allowed; }
        .ge-btn-secundario { background: none; border: 1.5px solid var(--line, #e6e8f5); color: var(--ink-soft, #5b6084); }
        .ge-btn-terciario { background: none; color: var(--ink-soft, #5b6084); font-weight: 600; text-decoration: underline; padding: 4px; cursor: pointer; }
    `,document.head.appendChild(n)}function Ee(n){const o=document.createElement("dialog");return o.id="ge-modal",o.className="ge-modal",o.innerHTML=`
        <div class="ge-corpo">
            <div class="ge-icone">📩</div>
            <h2>Confirme seu e-mail</h2>
            <p>Mandamos um link de confirmação para <span class="ge-email">${n}</span>. Abra sua caixa de entrada (e o spam, por garantia) e clique no link antes de continuar.</p>
            <div id="ge-status" class="ge-status"></div>
            <div class="ge-acoes">
                <button type="button" id="ge-ja-confirmei" class="ge-btn-primario">Já confirmei, continuar</button>
                <button type="button" id="ge-reenviar" class="ge-btn-terciario">Reenviar e-mail</button>
                <button type="button" id="ge-sair" class="ge-btn-secundario">Sair da conta</button>
            </div>
        </div>
    `,document.body.appendChild(o),o}async function ke(n){if(n.emailVerified)return!0;xe();const o=document.getElementById("ge-modal")||Ee(n.email),a=o.querySelector("#ge-status"),l=o.querySelector("#ge-ja-confirmei"),d=o.querySelector("#ge-reenviar"),c=o.querySelector("#ge-sair");return l.addEventListener("click",async()=>{a.textContent="",a.className="ge-status",l.disabled=!0,l.textContent="Verificando...";try{if(await n.reload(),w.currentUser.emailVerified){o.close(),o.remove(),window.location.reload();return}a.textContent="Ainda não encontramos a confirmação. Clique no link do e-mail e tente de novo.",a.className="ge-status erro"}catch(u){console.error("Erro ao checar confirmação de e-mail:",u),a.textContent="Não consegui checar agora. Tente de novo.",a.className="ge-status erro"}finally{l.disabled=!1,l.textContent="Já confirmei, continuar"}}),d.addEventListener("click",async()=>{d.disabled=!0;const u=d.textContent;d.textContent="Enviando...";try{await le(n),a.textContent="E-mail reenviado!",a.className="ge-status ok"}catch(i){console.error("Erro ao reenviar e-mail de verificação:",i),a.textContent=i.code==="auth/too-many-requests"?"Muitas tentativas — espera um pouco antes de reenviar de novo.":"Não consegui reenviar agora. Tente de novo em instantes.",a.className="ge-status erro"}finally{d.disabled=!1,d.textContent=u}}),c.addEventListener("click",async()=>{await R(w),window.location.href="login.html"}),o.addEventListener("cancel",u=>u.preventDefault()),o.addEventListener("close",()=>{w.currentUser?.emailVerified||o.showModal()}),o.showModal(),!1}const ae="futuroplus_chat_ja_abriu",we=45e3,Le=0,Ce=8e3;function P(){try{return localStorage.getItem(ae)==="1"}catch{return!1}}function te(){try{localStorage.setItem(ae,"1")}catch{}}function Ae({pausar:n=()=>!1}={}){const o=document.getElementById("chatbot-toggle");if(!o||P())return;const a=document.createElement("span");a.className="chat-notificacao-bolinha",o.appendChild(a);function l(){if(P()||n()||document.getElementById("chat-balao-fala"))return;const i=document.createElement("div");i.id="chat-balao-fala",i.className="chat-balao-fala",i.innerHTML='👋 Posso te ajudar a achar seu curso! <button type="button" class="chat-balao-fechar" aria-label="Fechar">×</button>',document.body.appendChild(i),i.querySelector(".chat-balao-fechar").addEventListener("click",E=>{E.stopPropagation(),i.remove(),te(),a.remove(),clearTimeout(d),clearInterval(u)}),setTimeout(()=>i.remove(),Ce)}let d;function c(){if(!P()){if(n()){d=setTimeout(c,1e3);return}d=setTimeout(l,Le)}}c();const u=setInterval(()=>{P()||n()||(o.classList.add("chat-btn-aceno"),setTimeout(()=>o.classList.remove("chat-btn-aceno"),900))},we);o.addEventListener("click",()=>{te(),a.remove(),document.getElementById("chat-balao-fala")?.remove(),clearTimeout(d),clearInterval(u)},{once:!0})}document.addEventListener("DOMContentLoaded",()=>{"serviceWorker"in navigator&&navigator.serviceWorker.getRegistrations().then(e=>{for(let t of e)t.unregister()});function n(e){return(e||"?").trim().split(/\s+/).filter(Boolean).slice(0,2).map(r=>r[0].toUpperCase()).join("")||"?"}de(w,async e=>{const t=document.getElementById("nomeUsuario"),r=document.getElementById("avatar-menu"),h=document.getElementById("avatar-iniciais"),s=document.getElementById("nav-auth"),S=document.getElementById("menu-nav-auth");if(e){if(console.log("Usuário logado UID:",e.uid),!await ke(e))return;let C="";try{const q=D(N,"usuarios",e.uid),X=await oe(q);if(X.exists()){const k=X.data();console.log("Dados encontrados no Firestore:",k),k.exclusao&&(await O(q,{exclusao:ue()},{merge:!0}),alert("Você tinha pedido para excluir sua conta. Como você entrou de novo, esse pedido foi cancelado e sua conta continua normal.")),ye(k).catch(U=>console.error("Erro ao checar termos:",U)),C=[k.nome,k.sobrenome].filter(Boolean).join(" ").trim(),k.nome&&t?t.textContent=k.nome:k.nome||console.warn("O campo 'nome' não existe no documento do Firestore."),k.admin===!0&&document.querySelectorAll(".menu-admin-area").forEach(U=>{U.hidden=!1}),K(k.permissoes?.localizacaoChatbot?.concedida===!0)}else console.warn("Nenhum documento encontrado na coleção 'usuarios' para este UID.")}catch(q){console.error("Erro ao buscar dados no Firestore:",q)}h&&(h.textContent=n(C||e.email)),r&&(r.hidden=!1),s&&(s.hidden=!0),S&&(S.hidden=!0),L()}else console.log("Nenhum usuário logado. Modo visitante ativado."),t&&(t.textContent="ESTUDANTE"),r&&(r.hidden=!0),s&&(s.hidden=!1),S&&(S.hidden=!1),l(),v()});const o=document.getElementById("avatar-botao"),a=document.getElementById("avatar-dropdown");function l(){!a||a.hidden||(a.hidden=!0,o?.setAttribute("aria-expanded","false"))}o&&a&&(o.addEventListener("click",e=>{e.stopPropagation();const t=a.hidden;a.hidden=!t,o.setAttribute("aria-expanded",String(t))}),document.addEventListener("click",e=>{!a.hidden&&!e.target.closest("#avatar-menu")&&l()}),document.addEventListener("keydown",e=>{e.key==="Escape"&&l()})),Ae({pausar:()=>window.__tourAtivo===!0});async function d(){if(document.getElementById("card-vocacional")){const{iniciarTourBoasVindas:r}=await Z(async()=>{const{iniciarTourBoasVindas:h}=await import("./tour-boas-vindas-BSlPDG-R.js");return{iniciarTourBoasVindas:h}},__vite__mapDeps([0,1]),import.meta.url);r({forcar:!0});return}const{iniciarTourDaPagina:e}=await Z(async()=>{const{iniciarTourDaPagina:r}=await import("./tour-paginas-Bwk8Bj9d.js");return{iniciarTourDaPagina:r}},__vite__mapDeps([2,1]),import.meta.url);await e({forcar:!0})||(window.location.href="index.html?tour=1")}document.getElementById("btn-repetir-tour")?.addEventListener("click",d),document.getElementById("btn-tour-menu")?.addEventListener("click",()=>{y?.classList.contains("aberto")&&f(),d()});const c="futuroplus_tour_dica_fechada",u=[document.getElementById("btn-repetir-tour"),document.getElementById("btn-tour-menu")].filter(Boolean);let i=!1;function E(){try{return localStorage.getItem(c)==="1"}catch{return!1}}function L(){u.forEach(e=>e.classList.remove("tour-cta-destaque"))}function v(){if(E()||(u.forEach(s=>s.classList.add("tour-cta-destaque")),i))return;i=!0;const e=document.getElementById("btn-repetir-tour");if(!e||window.__tourAtivo||document.getElementById("tour-dica-balao"))return;const t=document.createElement("div");t.id="tour-dica-balao",t.className="tour-dica-balao",t.innerHTML='Clique em mim 😎 <span class="tour-dica-fechar" role="button" tabindex="0" aria-label="Fechar">×</span>',e.appendChild(t);const r=s=>{s.stopPropagation(),t.remove();try{localStorage.setItem(c,"1")}catch{}L()},h=t.querySelector(".tour-dica-fechar");h.addEventListener("click",r),h.addEventListener("keydown",s=>{(s.key==="Enter"||s.key===" ")&&r(s)}),e.addEventListener("click",()=>t.remove(),{once:!0}),setTimeout(()=>t.remove(),8e3)}const p=document.querySelector(".hamburger"),y=document.querySelector(".menu-panel"),g=document.createElement("div");g.classList.add("menu-overlay"),document.body.appendChild(g);function f(){y&&y.classList.toggle("aberto"),g&&g.classList.toggle("ativo")}p&&g&&(p.addEventListener("click",f),g.addEventListener("click",f),document.addEventListener("keydown",e=>{e.key==="Escape"&&y?.classList.contains("aberto")&&f()}));const x=window.matchMedia("(min-width: 1024px)"),T=()=>{x.matches&&(y?.classList.remove("aberto"),g?.classList.remove("ativo"))};x.addEventListener("change",T),T();const I=document.getElementById("busca-topo");if(I){let e=function(){const t=I.value.trim();if(!t)return;const r=document.getElementById("busca-cursos");r?(r.value=t,r.dispatchEvent(new Event("input")),r.scrollIntoView({behavior:"smooth",block:"center"})):window.location.href=`cursos.html?curso=${encodeURIComponent(t)}`};I.addEventListener("keydown",t=>{t.key==="Enter"&&e()}),I.parentElement.querySelector("svg")?.addEventListener("click",e)}const B=document.getElementById("logout-btn");B&&B.addEventListener("click",async()=>{try{await R(w),window.location.href="login.html"}catch(e){console.error("Erro ao fazer logout:",e),alert("Não foi possível encerrar a sessão. Tente novamente.")}});const z=document.getElementById("chatbot-toggle"),m=document.getElementById("chatbot-window"),V=document.getElementById("close-chat"),_=document.getElementById("chat-input"),$=document.getElementById("send-chat"),b=document.getElementById("chat-messages"),j=()=>{m&&m.classList.toggle("oculta")};z&&z.addEventListener("click",j),V&&V.addEventListener("click",j);function ne(e){return e.replace(/\[([^\]]*)\]\((https?:\/\/[^)\s]+)\)/g,"$2").replace(/^#{1,6}\s+/gm,"").replace(/\*\*(.*?)\*\*/g,"$1").replace(/\*(.*?)\*/g,"$1").replace(/`([^`]+)`/g,"$1")}function re(e,t){t.split(/(https?:\/\/[^\s<>"')\]]+)/g).forEach((h,s)=>{if(s%2===0){h&&e.appendChild(document.createTextNode(h));return}const[,S,M]=h.match(/^(.*?)([.,;:!?]*)$/),C=document.createElement("a");C.href=S,C.textContent=S,C.target="_blank",C.rel="noopener noreferrer",e.appendChild(C),M&&e.appendChild(document.createTextNode(M))})}function A(e,t){if(!e.trim()||!b)return;const r=document.createElement("div");r.classList.add("msg",t),t==="bot"?re(r,ne(e)):r.textContent=e,b.appendChild(r),b.scrollTop=b.scrollHeight}function H(e){if(!b||!Array.isArray(e)||!e.length)return;const t=document.createElement("div");t.className="chat-links-site",e.forEach(({texto:r,url:h})=>{if(typeof h!="string"||!/^[a-z0-9-]+\.html(\?[^\s<>"']*)?$/i.test(h))return;const s=document.createElement("a");s.className="chat-link-site",s.href=h,s.textContent=`${r} →`,t.appendChild(s)}),t.children.length&&(b.appendChild(t),b.scrollTop=b.scrollHeight)}function ie(){if(!b)return;const e=document.createElement("div");e.classList.add("msg","bot"),e.textContent="Digitando...",e.id="typing-indicator",b.appendChild(e),b.scrollTop=b.scrollHeight}function F(){document.getElementById("typing-indicator")?.remove()}const ce=location.hostname==="localhost"||location.hostname==="127.0.0.1"?"http://127.0.0.1:5001/futuroplus-bce54/southamerica-east1/chat_bot":"https://southamerica-east1-futuroplus-bce54.cloudfunctions.net/chat_bot";async function J(e){A(e,"user");const t=w.currentUser;if(!t){A("Opa, essa parte eu só consigo fazer com você logado 😊 Entra na sua conta rapidinho que te ajudo na hora!","bot"),H([{texto:"Entrar na conta",url:"login.html"}]);return}ie();try{const r=await t.getIdToken(),s=await(await fetch(ce,{method:"POST",headers:{"Content-Type":"application/json",Authorization:"Bearer "+r},body:JSON.stringify({mensagem:e})})).json();F(),A(s.resposta||s.erro||"Erro ao obter resposta.","bot"),H(s.links),Array.isArray(s.acoes)&&s.acoes.includes("pedir_permissao_localizacao")&&se()}catch(r){console.error("Erro ao chamar o chatbot:",r),F(),A("Não consegui me conectar agora. Tente novamente.","bot")}}const W=()=>{const e=_.value.trim();e&&(_.value="",J(e))};async function G(e){const t=w.currentUser;if(!t)return!1;try{return await O(D(N,"usuarios",t.uid),{permissoes:{localizacaoChatbot:{concedida:e,atualizadoEm:new Date().toISOString()}}},{merge:!0}),K(e),!0}catch(r){return console.error("Erro ao salvar a permissão de localização:",r),A("Não consegui salvar sua escolha agora. Tente novamente.","bot"),!1}}function se(){if(!b||document.getElementById("cartao-permissao-localizacao"))return;const e=document.createElement("div");e.id="cartao-permissao-localizacao",e.className="msg bot cartao-permissao",e.innerHTML=`
            <p><strong>📍 Usar a localização do seu perfil?</strong></p>
            <p>O assistente usa só a distância até as unidades. Seu endereço não aparece na conversa, e você pode desativar quando quiser.</p>
            <div class="cartao-permissao-botoes">
                <button type="button" class="btn-permitir">Permitir</button>
                <button type="button" class="btn-agora-nao">Agora não</button>
            </div>
        `,e.querySelector(".btn-permitir").addEventListener("click",async()=>{e.querySelectorAll("button").forEach(t=>{t.disabled=!0}),await G(!0)?(e.remove(),J("Pode usar a localização do meu perfil.")):e.querySelectorAll("button").forEach(t=>{t.disabled=!1})}),e.querySelector(".btn-agora-nao").addEventListener("click",()=>{e.remove(),A("Tudo bem! Se preferir, me diga a sua cidade que eu procuro as unidades de lá.","bot")}),b.appendChild(e),b.scrollTop=b.scrollHeight}function K(e){const t=document.getElementById("chat-permissao-localizacao");t&&(t.hidden=!e)}const Q=document.getElementById("desativar-localizacao-chat");Q&&Q.addEventListener("click",async()=>{await G(!1)&&A("Pronto, não vou mais usar a localização do seu perfil. Se quiser, é só me dizer uma cidade.","bot")}),$&&$.addEventListener("click",W),_&&_.addEventListener("keypress",e=>{e.key==="Enter"&&W()})});
