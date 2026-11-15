const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["./tour-boas-vindas-Bosq5K8y.js","./tour-motor-BeDtj6px.js","./tour-paginas-COru7OUt.js"])))=>i.map(i=>d[i]);
import{_ as de}from"./preload-helper-PPVm8Dsz.js";import{s as G,a as S,b as D,d as z,c as _,f as fe,l as Be,g as Ne,e as ze,u as Me,O as qe,o as Ve,N as De}from"./firebase-config-DZ7_vqDZ.js";import{P as Oe,T as Pe}from"./conteudo-legal-padrao-DcxCgRAC.js";import{a as He,e as Re}from"./resultado-teste-DG2OeZfm.js";const Ue={termos:{colecaoId:"termos-de-uso",titulo:"Termos de Uso",padrao:Pe},privacidade:{colecaoId:"politica-privacidade",titulo:"Política de Privacidade",padrao:Oe}};async function ue(e){const{colecaoId:o,padrao:n}=Ue[e];try{const r=await fe(z(_,"configuracoes",o));return r.exists()&&r.data().versao?{versao:r.data().versao,html:r.data().html||n}:{versao:1,html:n}}catch(r){return console.error(`Erro ao buscar ${o}:`,r),{versao:1,html:n}}}function $e(){if(document.getElementById("gt-estilos"))return;const e=document.createElement("style");e.id="gt-estilos",e.textContent=`
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
        .gt-modal[open] { display: flex; flex-direction: column; margin: auto; }
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
    `,document.head.appendChild(e)}function je(){const e=document.createElement("dialog");return e.id="gt-modal",e.className="gt-modal",e.innerHTML=`
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
    `,document.body.appendChild(e),e}async function Fe(e){const[o,n]=await Promise.all([ue("termos"),ue("privacidade")]),r=e.termosAceitos||{},s={termos:(r.termos||0)<o.versao,privacidade:(r.privacidade||0)<n.versao};if(!s.termos&&!s.privacidade)return;$e();const i=document.getElementById("gt-modal")||je(),m={termos:o,privacidade:n},l={termos:!s.termos,privacidade:!s.privacidade};let g=null;const v=i.querySelector("#gt-checkbox"),C=i.querySelector("#gt-checkbox-label"),y=i.querySelector("#gt-continuar"),h=i.querySelector("#gt-tela-menu"),L=i.querySelector("#gt-tela-leitura"),E=i.querySelector("#gt-leitura-conteudo"),M=i.querySelector("#gt-leitura-aviso");function q(){const f=l.termos&&l.privacidade;v.disabled=!f,f&&(C.innerHTML='Li e concordo com os <a href="termos-de-uso.html" target="_blank">Termos de Uso</a> e a <a href="privacidade.html" target="_blank">Política de Privacidade</a> atualizados.')}function B(f){!f||l[f]||(l[f]=!0,i.querySelector(`#gt-btn-${f==="termos"?"termos":"privacidade"}`).classList.add("gt-btn-ler--lido"),g===f&&(M.textContent="Lido! Você já pode voltar.",M.classList.add("lido")),q())}function x(){E.scrollHeight-(E.scrollTop+E.clientHeight)<40&&B(g)}function N(f){g=f,E.innerHTML=m[f].html,E.scrollTop=0,M.classList.remove("lido"),M.textContent=l[f]?"Lido! Você já pode voltar.":"Role o texto até o fim para marcar como lido.",h.hidden=!0,L.hidden=!1,x()}i.querySelector("#gt-btn-termos").addEventListener("click",()=>N("termos")),i.querySelector("#gt-btn-privacidade").addEventListener("click",()=>N("privacidade")),i.querySelector("#gt-voltar").addEventListener("click",()=>{L.hidden=!0,h.hidden=!1}),E.addEventListener("scroll",x),v.addEventListener("change",()=>{y.disabled=!v.checked}),i.querySelector("#gt-sair").addEventListener("click",async()=>{await G(S),window.location.href="login.html"}),y.addEventListener("click",async()=>{y.disabled=!0,y.textContent="Salvando...";try{await D(z(_,"usuarios",S.currentUser.uid),{termosAceitos:{termos:o.versao,privacidade:n.versao,aceitoEm:new Date().toISOString()}},{merge:!0}),i.close(),i.remove()}catch(f){console.error("Erro ao registrar aceite dos termos:",f),y.disabled=!1,y.textContent="Continuar usando o site",alert("Não consegui registrar seu aceite agora. Tente de novo.")}}),i.addEventListener("cancel",f=>f.preventDefault()),q(),i.showModal()}function Je(){if(document.getElementById("ge-estilos"))return;const e=document.createElement("style");e.id="ge-estilos",e.textContent=`
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
        .ge-modal[open] { display: flex; flex-direction: column; margin: auto; }
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
    `,document.head.appendChild(e)}function Ge(e){const o=document.createElement("dialog");return o.id="ge-modal",o.className="ge-modal",o.innerHTML=`
        <div class="ge-corpo">
            <div class="ge-icone">📩</div>
            <h2>Confirme seu e-mail</h2>
            <p>Mandamos um link de confirmação para <span class="ge-email">${e}</span>. Abra sua caixa de entrada (e o spam, por garantia) e clique no link antes de continuar.</p>
            <div id="ge-status" class="ge-status"></div>
            <div class="ge-acoes">
                <button type="button" id="ge-ja-confirmei" class="ge-btn-primario">Já confirmei, continuar</button>
                <button type="button" id="ge-reenviar" class="ge-btn-terciario">Reenviar e-mail</button>
                <button type="button" id="ge-sair" class="ge-btn-secundario">Sair da conta</button>
            </div>
        </div>
    `,document.body.appendChild(o),o}async function We(e){if(e.emailVerified)return!0;Je();const o=document.getElementById("ge-modal")||Ge(e.email),n=o.querySelector("#ge-status"),r=o.querySelector("#ge-ja-confirmei"),s=o.querySelector("#ge-reenviar"),i=o.querySelector("#ge-sair");return r.addEventListener("click",async()=>{n.textContent="",n.className="ge-status",r.disabled=!0,r.textContent="Verificando...";try{if(await e.reload(),S.currentUser.emailVerified){o.close(),o.remove(),window.location.reload();return}n.textContent="Ainda não encontramos a confirmação. Clique no link do e-mail e tente de novo.",n.className="ge-status erro"}catch(m){console.error("Erro ao checar confirmação de e-mail:",m),n.textContent="Não consegui checar agora. Tente de novo.",n.className="ge-status erro"}finally{r.disabled=!1,r.textContent="Já confirmei, continuar"}}),s.addEventListener("click",async()=>{s.disabled=!0;const m=s.textContent;s.textContent="Enviando...";try{await Be(e),n.textContent="E-mail reenviado!",n.className="ge-status ok"}catch(l){console.error("Erro ao reenviar e-mail de verificação:",l),n.textContent=l.code==="auth/too-many-requests"?"Muitas tentativas — espera um pouco antes de reenviar de novo.":"Não consegui reenviar agora. Tente de novo em instantes.",n.className="ge-status erro"}finally{s.disabled=!1,s.textContent=m}}),i.addEventListener("click",async()=>{await G(S),window.location.href="login.html"}),o.addEventListener("cancel",m=>m.preventDefault()),o.addEventListener("close",()=>{S.currentUser?.emailVerified||o.showModal()}),o.showModal(),!1}const Ze=[{rotulo:"cidade no cadastro",completo:e=>!!(e.cadastro.cidade||e.cadastro.cep)},{rotulo:"seu momento nos estudos",completo:e=>!!e.perfil.escolaridade},{rotulo:"sua formação",completo:e=>!!(e.perfil.formacao||e.perfil.semFormacao)},{rotulo:"o curso que você quer",completo:e=>!!e.perfil.cursoDesejado},{rotulo:"suas áreas de interesse",completo:e=>(e.perfil.modalidades||[]).length>0},{rotulo:"seu estilo de aprendizado",completo:e=>(e.perfil.estilos||[]).length>0},{rotulo:"seu objetivo",completo:e=>!!e.perfil.objetivo},{rotulo:"fazer um teste",completo:e=>!!e.temTeste}];function Ke(e){const o={modalidades:[],estilos:[],...e?.perfil||{}},n=!!(He(e)||Re(e)),r={cadastro:e||{},perfil:o,temTeste:n},s=Ze.filter(i=>!i.completo(r)).map(i=>i.rotulo);return{completo:s.length===0,faltando:s}}const Qe="notificacoes",pe="futuroplus_notif_vistas",ge="futuroplus_notif_limpas_em",he="futuroplus_notif_sino_vistas_em";function V(e){return String(e??"").replace(/[&<>"']/g,o=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[o])}function Xe(e){const o=new Date(e||"");return Number.isNaN(o.getTime())?"":o.toLocaleDateString("pt-BR",{day:"2-digit",month:"short"})}function be(){try{return JSON.parse(localStorage.getItem(pe))||[]}catch{return[]}}function Ye(e){try{const o=be();o.includes(e)||(o.push(e),localStorage.setItem(pe,JSON.stringify(o)))}catch{}}function et(){try{return localStorage.getItem(ge)||""}catch{return""}}function tt(e){try{localStorage.setItem(ge,e)}catch{}}function ot(){try{return localStorage.getItem(he)||""}catch{return""}}function at(e){try{localStorage.setItem(he,e)}catch{}}let J=null;function U(){return J||(J=Ne(ze(_,Qe)).then(e=>e.docs.map(o=>({id:o.id,...o.data()})).filter(o=>o.ativo!==!1).sort((o,n)=>(n.criadoEm||"").localeCompare(o.criadoEm||"")))),J}function $(e,o){const n=e.publico||"logados";return n==="todos"?!0:o?n==="logados":n==="deslogados"}function nt(){if(document.getElementById("nt-estilos"))return;const e=document.createElement("style");e.id="nt-estilos",e.textContent=`
        .nt-modal {
            border: none;
            border-radius: 18px;
            padding: 0;
            width: min(480px, 92vw);
            max-height: 80vh;
            box-shadow: 0 24px 60px -20px rgba(20, 24, 60, 0.45);
            font-family: 'Inter', 'Segoe UI', Arial, sans-serif;
            color: var(--ink, #1b1f3b);
        }
        .nt-modal::backdrop { background: rgba(23, 27, 58, 0.65); }
        .nt-modal[open] { display: flex; flex-direction: column; margin: auto; }
        .nt-cabecalho { padding: 22px 22px 4px; flex-shrink: 0; }
        .nt-cabecalho h2 {
            font-family: 'Sora', 'Segoe UI', Arial, sans-serif;
            font-size: 18px;
            font-weight: 800;
        }
        .nt-corpo {
            padding: 4px 22px 22px;
            overflow: auto;
            font-size: 14px;
            line-height: 1.55;
            color: var(--ink-soft, #5b6084);
            white-space: pre-line;
        }
        .nt-acoes { padding: 0 22px 22px; }
        .nt-btn-primario {
            width: 100%;
            padding: 12px 18px;
            border-radius: 99px;
            border: none;
            background: var(--blue, #4e6ee8);
            color: #fff;
            font-family: 'Sora', sans-serif;
            font-size: 13.5px;
            font-weight: 700;
            cursor: pointer;
        }
    `,document.head.appendChild(e)}function rt(){const e=document.createElement("dialog");return e.id="nt-modal",e.className="nt-modal",e.innerHTML=`
        <div class="nt-cabecalho"><h2 id="nt-titulo"></h2></div>
        <div class="nt-corpo" id="nt-corpo"></div>
        <div class="nt-acoes"><button type="button" id="nt-fechar" class="nt-btn-primario">Entendi</button></div>
    `,document.body.appendChild(e),e}async function ve(e,o,n){const r=e.find(l=>!o.has(l.id));if(!r)return;nt();const s=document.getElementById("nt-modal")||rt();s.querySelector("#nt-titulo").textContent=r.titulo||"Aviso",s.querySelector("#nt-corpo").textContent=r.mensagem||"";let i=!1;async function m(){if(!i){i=!0,s.close(),s.remove();try{await n(r.id)}catch(l){console.error("Erro ao marcar notificação como vista:",l)}}}s.querySelector("#nt-fechar").addEventListener("click",m),s.addEventListener("cancel",l=>{l.preventDefault(),m()}),s.showModal()}async function it(e){const o=(await U()).filter(r=>r.mostrarModal&&$(r,!0)),n=new Set(e.notificacoesModalVistas||[]);await ve(o,n,r=>Me(z(_,"usuarios",S.currentUser.uid),{notificacoesModalVistas:qe(r)}))}async function st(){const e=(await U()).filter(n=>n.mostrarModal&&$(n,!1)),o=new Set(be());await ve(e,o,n=>Ye(n))}function ct(e){const{completo:o,faltando:n}=Ke(e);return o?null:{id:"perfil-incompleto",titulo:"Complete seu perfil",mensagem:`Falta ${n.join(", ")}. Perfis completos recebem recomendações de curso e de unidade mais certeiras.`,criadoEm:new Date().toISOString(),link:"perfil.html"}}function lt(){return{id:"visitante-criar-conta",titulo:"Crie sua conta ou entre",mensagem:"Salve os resultados dos seus testes e receba recomendações de curso e unidade personalizadas.",criadoEm:new Date().toISOString(),acoes:[{rotulo:"Entrar",href:"login.html"},{rotulo:"Criar conta",href:"cadastro.html",destaque:!0}]}}function dt(e){return e?.length?`<div class="notif-item-acoes">${e.map(o=>`
        <a class="notif-item-botao${o.destaque?" notif-item-botao--destaque":""}" href="${V(o.href)}">${V(o.rotulo)}</a>`).join("")}</div>`:""}function ut(e){const o=`
            <strong class="notif-item-titulo">${V(e.titulo||"Aviso")}</strong>
            <p class="notif-item-mensagem">${V(e.mensagem||"")}</p>
            ${dt(e.acoes)}
            <span class="notif-item-data">${Xe(e.criadoEm)}</span>`;return e.link&&!e.acoes?`<a class="notif-item notif-item--link" href="${V(e.link)}">${o}</a>`:`<div class="notif-item">${o}</div>`}const mt='<p class="notif-vazio">Nenhuma notificação por enquanto.</p>';async function ye(e,o,n,r,s){const i=document.getElementById("notif-lista"),m=document.getElementById("notif-ponto"),l=document.getElementById("notif-botao"),g=document.getElementById("notif-limpar");if(!i||!m||!g)return async()=>{};const v=e.filter(h=>(h.criadoEm||"")>o);let C=n;function y(){const h=v.filter(L=>(L.criadoEm||"")>C).length;i.innerHTML=v.length?v.map(ut).join(""):mt,m.textContent=h>9?"9+":String(h),m.hidden=h===0,l?.classList.toggle("bell-icon--tem-notificacao",h>0),g.hidden=v.length===0,g.textContent=`Limpar (${v.length})`}return y(),g.onclick=async()=>{if(confirm("Isso limpa todas as notificações da lista. Você pode continuar recebendo novas depois. Confirma?")){g.disabled=!0;try{const h=new Date().toISOString();await r(h),v.length=0,y()}catch(h){console.error("Erro ao limpar notificações:",h),alert("Não consegui limpar as notificações agora. Tente de novo.")}finally{g.disabled=!1}}},async function(){if(!v.some(E=>(E.criadoEm||"")>C))return;const L=new Date().toISOString();C=L,y();try{await s(L)}catch(E){console.error("Erro ao marcar notificações como vistas:",E)}}}async function ft(e,o){const n=(await U()).filter(i=>i.mostrarSino&&$(i,!0)),r=ct(o),s=r?[r,...n]:n;return ye(s,o.notificacoesLimpasEm||"",o.notificacoesVistasEm||"",i=>D(z(_,"usuarios",e),{notificacoesLimpasEm:i},{merge:!0}),i=>D(z(_,"usuarios",e),{notificacoesVistasEm:i},{merge:!0}))}async function pt(){const e=(await U()).filter(r=>r.mostrarSino&&$(r,!1)),n=[lt(),...e];return ye(n,et(),ot(),async r=>tt(r),async r=>at(r))}const Ee="futuroplus_chat_ja_abriu",gt=45e3,ht=0,bt=8e3;function R(){try{return sessionStorage.getItem(Ee)==="1"}catch{return!1}}function me(){try{sessionStorage.setItem(Ee,"1")}catch{}}function vt({pausar:e=()=>!1}={}){const o=document.getElementById("chatbot-toggle");if(!o||R())return;const n=document.createElement("span");n.className="chat-notificacao-bolinha",o.appendChild(n),o.classList.add("chat-btn-pulsando");function r(){if(R()||e()||document.getElementById("chat-balao-fala"))return;const l=document.createElement("div");l.id="chat-balao-fala",l.className="chat-balao-fala",l.innerHTML='👋 Posso te ajudar a achar seu curso! <button type="button" class="chat-balao-fechar" aria-label="Fechar">×</button>',document.body.appendChild(l),l.querySelector(".chat-balao-fechar").addEventListener("click",g=>{g.stopPropagation(),l.remove(),me(),n.remove(),o.classList.remove("chat-btn-pulsando"),clearTimeout(s),clearInterval(m)}),setTimeout(()=>l.remove(),bt)}let s;function i(){if(!R()){if(e()){s=setTimeout(i,1e3);return}s=setTimeout(r,ht)}}i();const m=setInterval(()=>{R()||e()||(o.classList.add("chat-btn-aceno"),setTimeout(()=>o.classList.remove("chat-btn-aceno"),900))},gt);o.addEventListener("click",()=>{me(),n.remove(),o.classList.remove("chat-btn-pulsando"),document.getElementById("chat-balao-fala")?.remove(),clearTimeout(s),clearInterval(m)},{once:!0})}document.addEventListener("DOMContentLoaded",()=>{"serviceWorker"in navigator&&navigator.serviceWorker.getRegistrations().then(t=>{for(let a of t)a.unregister()});function e(t){return(t||"?").trim().split(/\s+/).filter(Boolean).slice(0,2).map(c=>c[0].toUpperCase()).join("")||"?"}let o=async()=>{};function n(t,a=""){const c=document.getElementById("saudacao");c&&(t==="visitante"?c.innerHTML='Boas-vindas ao <span class="marca-futuro">Futuro<span class="marca-mais">+</span><span class="marca-exclamacao">!</span></span>':c.textContent=a?`Olá, ${a} 👋`:"Olá! 👋",document.body.dataset.sessao=t)}Ve(S,async t=>{const a=document.getElementById("avatar-menu"),c=document.getElementById("avatar-iniciais"),d=document.getElementById("nav-auth"),u=document.getElementById("menu-nav-auth"),w=document.getElementById("notif-menu");if(t){if(console.log("Usuário logado UID:",t.uid),!await We(t))return;let T="",F="";try{const H=z(_,"usuarios",t.uid),le=await fe(H);if(le.exists()){const I=le.data();console.log("Dados encontrados no Firestore:",I),I.exclusao&&(await D(H,{exclusao:De()},{merge:!0}),alert("Você tinha pedido para excluir sua conta. Como você entrou de novo, esse pedido foi cancelado e sua conta continua normal.")),Fe(I).catch(k=>console.error("Erro ao checar termos:",k)),it(I).catch(k=>console.error("Erro ao checar notificações:",k)),ft(t.uid,I).then(k=>{o=k}).catch(k=>console.error("Erro ao carregar o sino de notificações:",k)),T=[I.nome,I.sobrenome].filter(Boolean).join(" ").trim(),F=String(I.nome||"").trim(),F||console.warn("O campo 'nome' não existe no documento do Firestore."),I.admin===!0&&document.querySelectorAll(".menu-admin-area").forEach(k=>{k.hidden=!1}),se(I.permissoes?.localizacaoChatbot?.concedida===!0)}else console.warn("Nenhum documento encontrado na coleção 'usuarios' para este UID.")}catch(H){console.error("Erro ao buscar dados no Firestore:",H)}n("logado",F),c&&(c.textContent=e(T||t.email)),a&&(a.hidden=!1),w&&(w.hidden=!1),d&&(d.hidden=!0),u&&(u.hidden=!0),E()}else console.log("Nenhum usuário logado. Modo visitante ativado."),n("visitante"),st().catch(b=>console.error("Erro ao checar notificações:",b)),pt().then(b=>{o=b}).catch(b=>console.error("Erro ao carregar o sino de notificações:",b)),a&&(a.hidden=!0),w&&(w.hidden=!1),d&&(d.hidden=!1),u&&(u.hidden=!1),i(),g(),M()});const r=document.getElementById("avatar-botao"),s=document.getElementById("avatar-dropdown");function i(){!s||s.hidden||(s.hidden=!0,r?.setAttribute("aria-expanded","false"))}r&&s&&(r.addEventListener("click",t=>{t.stopPropagation(),g(),document.getElementById("tour-dica-balao")?.remove();const a=s.hidden;s.hidden=!a,r.setAttribute("aria-expanded",String(a))}),document.addEventListener("click",t=>{!s.hidden&&!t.target.closest("#avatar-menu")&&i()}),document.addEventListener("keydown",t=>{t.key==="Escape"&&i()}));const m=document.getElementById("notif-botao"),l=document.getElementById("notif-dropdown");function g(){!l||l.hidden||(l.hidden=!0,m?.setAttribute("aria-expanded","false"))}m&&l&&(m.addEventListener("click",t=>{t.stopPropagation(),i(),document.getElementById("tour-dica-balao")?.remove();const a=l.hidden;l.hidden=!a,m.setAttribute("aria-expanded",String(a)),a&&o()}),document.addEventListener("click",t=>{!l.hidden&&!t.target.closest("#notif-menu")&&g()}),document.addEventListener("keydown",t=>{t.key==="Escape"&&g()})),vt({pausar:()=>window.__tourAtivo===!0});async function v(){if(document.getElementById("card-vocacional")){const{iniciarTourBoasVindas:c}=await de(async()=>{const{iniciarTourBoasVindas:d}=await import("./tour-boas-vindas-Bosq5K8y.js");return{iniciarTourBoasVindas:d}},__vite__mapDeps([0,1]),import.meta.url);c({forcar:!0});return}const{iniciarTourDaPagina:t}=await de(async()=>{const{iniciarTourDaPagina:c}=await import("./tour-paginas-COru7OUt.js");return{iniciarTourDaPagina:c}},__vite__mapDeps([2,1]),import.meta.url);await t({forcar:!0})||(window.location.href="index.html?tour=1")}document.getElementById("btn-repetir-tour")?.addEventListener("click",v),document.getElementById("btn-tour-menu")?.addEventListener("click",()=>{B?.classList.contains("aberto")&&N(),v()});const C="futuroplus_tour_dica_fechada",y=[document.getElementById("btn-repetir-tour"),document.getElementById("btn-tour-menu")].filter(Boolean);let h=!1;function L(){try{return localStorage.getItem(C)==="1"}catch{return!1}}function E(){y.forEach(t=>t.classList.remove("tour-cta-destaque"))}function M(){if(L()||(y.forEach(u=>u.classList.add("tour-cta-destaque")),h))return;h=!0;const t=document.getElementById("btn-repetir-tour");if(!t||window.__tourAtivo||document.getElementById("tour-dica-balao"))return;const a=document.createElement("div");a.id="tour-dica-balao",a.className="tour-dica-balao",a.innerHTML='Clique em mim 😎 <span class="tour-dica-fechar" role="button" tabindex="0" aria-label="Fechar">×</span>',t.appendChild(a);const c=u=>{u.stopPropagation(),a.remove();try{localStorage.setItem(C,"1")}catch{}E()},d=a.querySelector(".tour-dica-fechar");d.addEventListener("click",c),d.addEventListener("keydown",u=>{(u.key==="Enter"||u.key===" ")&&c(u)}),t.addEventListener("click",()=>a.remove(),{once:!0}),setTimeout(()=>a.remove(),8e3)}const q=document.querySelector(".hamburger"),B=document.querySelector(".menu-panel"),x=document.createElement("div");x.classList.add("menu-overlay"),document.body.appendChild(x);function N(){B&&B.classList.toggle("aberto"),x&&x.classList.toggle("ativo")}q&&x&&(q.addEventListener("click",N),x.addEventListener("click",N),document.addEventListener("keydown",t=>{t.key==="Escape"&&B?.classList.contains("aberto")&&N()}));const f=window.matchMedia("(min-width: 1024px)"),W=()=>{f.matches&&(B?.classList.remove("aberto"),x?.classList.remove("ativo"))};f.addEventListener("change",W),W();const O=document.getElementById("busca-topo");if(O){let t=function(){const a=O.value.trim();if(!a)return;const c=document.getElementById("busca-cursos");c?(c.value=a,c.dispatchEvent(new Event("input")),c.scrollIntoView({behavior:"smooth",block:"center"})):window.location.href=`instituicoes.html?curso=${encodeURIComponent(a)}`};O.addEventListener("keydown",a=>{a.key==="Enter"&&t()}),O.parentElement.querySelector("svg")?.addEventListener("click",t)}const Z=document.getElementById("logout-btn");Z&&Z.addEventListener("click",async()=>{try{Ie(),await G(S),window.location.href="login.html"}catch(t){console.error("Erro ao fazer logout:",t),alert("Não foi possível encerrar a sessão. Tente novamente.")}});const K=document.getElementById("chatbot-toggle"),Q=document.getElementById("chatbot-window"),X=document.getElementById("close-chat"),P=document.getElementById("chat-input"),Y=document.getElementById("send-chat"),p=document.getElementById("chat-messages"),j="futuroplus_chat_historico",xe=60;function ee(){try{return JSON.parse(sessionStorage.getItem(j))||[]}catch{return[]}}function we(t){try{sessionStorage.setItem(j,JSON.stringify(t.slice(-xe)))}catch{}}function Ie(){try{sessionStorage.removeItem(j)}catch{}}const te=()=>{Q&&Q.classList.toggle("oculta")};K&&K.addEventListener("click",te),X&&X.addEventListener("click",te);function Se(t){return t.replace(/\[([^\]]*)\]\((https?:\/\/[^)\s]+)\)/g,"$2").replace(/^#{1,6}\s+/gm,"").replace(/\*\*(.*?)\*\*/g,"$1").replace(/\*(.*?)\*/g,"$1").replace(/`([^`]+)`/g,"$1")}function Le(t,a){a.split(/(https?:\/\/[^\s<>"')\]]+)/g).forEach((d,u)=>{if(u%2===0){d&&t.appendChild(document.createTextNode(d));return}const[,w,b]=d.match(/^(.*?)([.,;:!?]*)$/),T=document.createElement("a");T.href=w,T.textContent=w,T.target="_blank",T.rel="noopener noreferrer",t.appendChild(T),b&&t.appendChild(document.createTextNode(b))})}function A(t,a,{salvarNoHistorico:c=!0}={}){if(!t.trim()||!p)return;const d=document.createElement("div");if(d.classList.add("msg",a),a==="bot"?Le(d,Se(t)):d.textContent=t,p.appendChild(d),p.scrollTop=p.scrollHeight,c){const u=ee();u.push({texto:t,remetente:a}),we(u)}}(function(){const a=ee();!a.length||!p||(p.innerHTML="",a.forEach(({texto:c,remetente:d})=>A(c,d,{salvarNoHistorico:!1})))})();const ke=["https://www.vestibulinhoetec.com.br","https://www.vestibularfatec.com.br"];function Ce(t){try{const a=new URL(t);return ke.some(c=>a.origin===new URL(c).origin)}catch{return!1}}function oe(t){if(!p||!Array.isArray(t)||!t.length)return;const a=document.createElement("div");a.className="chat-links-site",t.forEach(({texto:c,url:d})=>{if(typeof d!="string")return;const u=/^[a-z0-9-]+\.html(\?[^\s<>"']*)?$/i.test(d),w=!u&&Ce(d);if(!u&&!w)return;const b=document.createElement("a");b.className="chat-link-site",b.href=d,w&&(b.target="_blank",b.rel="noopener noreferrer"),b.textContent=`${c} →`,a.appendChild(b)}),a.children.length&&(p.appendChild(a),p.scrollTop=p.scrollHeight)}function Ae(){if(!p)return;const t=document.createElement("div");t.classList.add("msg","bot"),t.textContent="Digitando...",t.id="typing-indicator",p.appendChild(t),p.scrollTop=p.scrollHeight}function ae(){document.getElementById("typing-indicator")?.remove()}const Te=location.hostname==="localhost"||location.hostname==="127.0.0.1"?"http://127.0.0.1:5001/futuroplus-bce54/southamerica-east1/chat_bot":"https://southamerica-east1-futuroplus-bce54.cloudfunctions.net/chat_bot";async function ne(t){A(t,"user");const a=S.currentUser;if(!a){A("Opa, essa parte eu só consigo fazer com você logado 😊 Entra na sua conta rapidinho que te ajudo na hora!","bot"),oe([{texto:"Entrar na conta",url:"login.html"}]);return}Ae();try{const c=await a.getIdToken(),u=await(await fetch(Te,{method:"POST",headers:{"Content-Type":"application/json",Authorization:"Bearer "+c},body:JSON.stringify({mensagem:t})})).json();ae(),A(u.resposta||u.erro||"Erro ao obter resposta.","bot"),oe(u.links),Array.isArray(u.acoes)&&u.acoes.includes("pedir_permissao_localizacao")&&_e()}catch(c){console.error("Erro ao chamar o chatbot:",c),ae(),A("Não consegui me conectar agora. Tente novamente.","bot")}}const re=()=>{const t=P.value.trim();t&&(P.value="",ne(t))};async function ie(t){const a=S.currentUser;if(!a)return!1;try{return await D(z(_,"usuarios",a.uid),{permissoes:{localizacaoChatbot:{concedida:t,atualizadoEm:new Date().toISOString()}}},{merge:!0}),se(t),!0}catch(c){return console.error("Erro ao salvar a permissão de localização:",c),A("Não consegui salvar sua escolha agora. Tente novamente.","bot"),!1}}function _e(){if(!p||document.getElementById("cartao-permissao-localizacao"))return;const t=document.createElement("div");t.id="cartao-permissao-localizacao",t.className="msg bot cartao-permissao",t.innerHTML=`
            <p><strong>📍 Usar a localização do seu perfil?</strong></p>
            <p>O assistente usa só a distância até as unidades. Seu endereço não aparece na conversa, e você pode desativar quando quiser.</p>
            <div class="cartao-permissao-botoes">
                <button type="button" class="btn-permitir">Permitir</button>
                <button type="button" class="btn-agora-nao">Agora não</button>
            </div>
        `,t.querySelector(".btn-permitir").addEventListener("click",async()=>{t.querySelectorAll("button").forEach(a=>{a.disabled=!0}),await ie(!0)?(t.remove(),ne("Pode usar a localização do meu perfil.")):t.querySelectorAll("button").forEach(a=>{a.disabled=!1})}),t.querySelector(".btn-agora-nao").addEventListener("click",()=>{t.remove(),A("Tudo bem! Se preferir, me diga a sua cidade que eu procuro as unidades de lá.","bot")}),p.appendChild(t),p.scrollTop=p.scrollHeight}function se(t){const a=document.getElementById("chat-permissao-localizacao");a&&(a.hidden=!t)}const ce=document.getElementById("desativar-localizacao-chat");ce&&ce.addEventListener("click",async()=>{await ie(!1)&&A("Pronto, não vou mais usar a localização do seu perfil. Se quiser, é só me dizer uma cidade.","bot")}),Y&&Y.addEventListener("click",re),P&&P.addEventListener("keypress",t=>{t.key==="Enter"&&re()})});export{Ze as I};
