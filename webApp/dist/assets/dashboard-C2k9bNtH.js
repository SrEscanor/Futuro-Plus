const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["./tour-boas-vindas-CTs32DB-.js","./tour-motor-BeDtj6px.js","./tour-paginas-COru7OUt.js"])))=>i.map(i=>d[i]);
import{_ as le}from"./preload-helper-PPVm8Dsz.js";import{s as J,a as L,b as V,d as q,c as B,f as me,l as _e,g as Be,e as Ne,u as ze,K as qe,o as Me,L as De}from"./firebase-config-BVis2Pi9.js";import{P as Ve,T as Oe}from"./conteudo-legal-padrao-DcxCgRAC.js";import{a as Pe,e as He}from"./resultado-teste-MujYfBC_.js";const Re={termos:{colecaoId:"termos-de-uso",titulo:"Termos de Uso",padrao:Oe},privacidade:{colecaoId:"politica-privacidade",titulo:"Política de Privacidade",padrao:Ve}};async function de(e){const{colecaoId:o,padrao:n}=Re[e];try{const r=await me(q(B,"configuracoes",o));return r.exists()&&r.data().versao?{versao:r.data().versao,html:r.data().html||n}:{versao:1,html:n}}catch(r){return console.error(`Erro ao buscar ${o}:`,r),{versao:1,html:n}}}function Ue(){if(document.getElementById("gt-estilos"))return;const e=document.createElement("style");e.id="gt-estilos",e.textContent=`
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
    `,document.head.appendChild(e)}function $e(){const e=document.createElement("dialog");return e.id="gt-modal",e.className="gt-modal",e.innerHTML=`
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
    `,document.body.appendChild(e),e}async function je(e){const[o,n]=await Promise.all([de("termos"),de("privacidade")]),r=e.termosAceitos||{},s={termos:(r.termos||0)<o.versao,privacidade:(r.privacidade||0)<n.versao};if(!s.termos&&!s.privacidade)return;Ue();const i=document.getElementById("gt-modal")||$e(),u={termos:o,privacidade:n},l={termos:!s.termos,privacidade:!s.privacidade};let h=null;const b=i.querySelector("#gt-checkbox"),A=i.querySelector("#gt-checkbox-label"),y=i.querySelector("#gt-continuar"),g=i.querySelector("#gt-tela-menu"),I=i.querySelector("#gt-tela-leitura"),E=i.querySelector("#gt-leitura-conteudo"),N=i.querySelector("#gt-leitura-aviso");function T(){const f=l.termos&&l.privacidade;b.disabled=!f,f&&(A.innerHTML='Li e concordo com os <a href="termos-de-uso.html" target="_blank">Termos de Uso</a> e a <a href="privacidade.html" target="_blank">Política de Privacidade</a> atualizados.')}function k(f){!f||l[f]||(l[f]=!0,i.querySelector(`#gt-btn-${f==="termos"?"termos":"privacidade"}`).classList.add("gt-btn-ler--lido"),h===f&&(N.textContent="Lido! Você já pode voltar.",N.classList.add("lido")),T())}function z(){E.scrollHeight-(E.scrollTop+E.clientHeight)<40&&k(h)}function M(f){h=f,E.innerHTML=u[f].html,E.scrollTop=0,N.classList.remove("lido"),N.textContent=l[f]?"Lido! Você já pode voltar.":"Role o texto até o fim para marcar como lido.",g.hidden=!0,I.hidden=!1,z()}i.querySelector("#gt-btn-termos").addEventListener("click",()=>M("termos")),i.querySelector("#gt-btn-privacidade").addEventListener("click",()=>M("privacidade")),i.querySelector("#gt-voltar").addEventListener("click",()=>{I.hidden=!0,g.hidden=!1}),E.addEventListener("scroll",z),b.addEventListener("change",()=>{y.disabled=!b.checked}),i.querySelector("#gt-sair").addEventListener("click",async()=>{await J(L),window.location.href="login.html"}),y.addEventListener("click",async()=>{y.disabled=!0,y.textContent="Salvando...";try{await V(q(B,"usuarios",L.currentUser.uid),{termosAceitos:{termos:o.versao,privacidade:n.versao,aceitoEm:new Date().toISOString()}},{merge:!0}),i.close(),i.remove()}catch(f){console.error("Erro ao registrar aceite dos termos:",f),y.disabled=!1,y.textContent="Continuar usando o site",alert("Não consegui registrar seu aceite agora. Tente de novo.")}}),i.addEventListener("cancel",f=>f.preventDefault()),T(),i.showModal()}function Fe(){if(document.getElementById("ge-estilos"))return;const e=document.createElement("style");e.id="ge-estilos",e.textContent=`
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
    `,document.head.appendChild(e)}function Je(e){const o=document.createElement("dialog");return o.id="ge-modal",o.className="ge-modal",o.innerHTML=`
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
    `,document.body.appendChild(o),o}async function Ge(e){if(e.emailVerified)return!0;Fe();const o=document.getElementById("ge-modal")||Je(e.email),n=o.querySelector("#ge-status"),r=o.querySelector("#ge-ja-confirmei"),s=o.querySelector("#ge-reenviar"),i=o.querySelector("#ge-sair");return r.addEventListener("click",async()=>{n.textContent="",n.className="ge-status",r.disabled=!0,r.textContent="Verificando...";try{if(await e.reload(),L.currentUser.emailVerified){o.close(),o.remove(),window.location.reload();return}n.textContent="Ainda não encontramos a confirmação. Clique no link do e-mail e tente de novo.",n.className="ge-status erro"}catch(u){console.error("Erro ao checar confirmação de e-mail:",u),n.textContent="Não consegui checar agora. Tente de novo.",n.className="ge-status erro"}finally{r.disabled=!1,r.textContent="Já confirmei, continuar"}}),s.addEventListener("click",async()=>{s.disabled=!0;const u=s.textContent;s.textContent="Enviando...";try{await _e(e),n.textContent="E-mail reenviado!",n.className="ge-status ok"}catch(l){console.error("Erro ao reenviar e-mail de verificação:",l),n.textContent=l.code==="auth/too-many-requests"?"Muitas tentativas — espera um pouco antes de reenviar de novo.":"Não consegui reenviar agora. Tente de novo em instantes.",n.className="ge-status erro"}finally{s.disabled=!1,s.textContent=u}}),i.addEventListener("click",async()=>{await J(L),window.location.href="login.html"}),o.addEventListener("cancel",u=>u.preventDefault()),o.addEventListener("close",()=>{L.currentUser?.emailVerified||o.showModal()}),o.showModal(),!1}const We=[{rotulo:"cidade no cadastro",completo:e=>!!(e.cadastro.cidade||e.cadastro.cep)},{rotulo:"seu momento nos estudos",completo:e=>!!e.perfil.escolaridade},{rotulo:"sua formação",completo:e=>!!(e.perfil.formacao||e.perfil.semFormacao)},{rotulo:"o curso que você quer",completo:e=>!!e.perfil.cursoDesejado},{rotulo:"suas áreas de interesse",completo:e=>(e.perfil.modalidades||[]).length>0},{rotulo:"seu estilo de aprendizado",completo:e=>(e.perfil.estilos||[]).length>0},{rotulo:"seu objetivo",completo:e=>!!e.perfil.objetivo},{rotulo:"fazer um teste",completo:e=>!!e.temTeste}];function Ke(e){const o={modalidades:[],estilos:[],...e?.perfil||{}},n=!!(Pe(e)||He(e)),r={cadastro:e||{},perfil:o,temTeste:n},s=We.filter(i=>!i.completo(r)).map(i=>i.rotulo);return{completo:s.length===0,faltando:s}}const Ze="notificacoes",fe="futuroplus_notif_vistas",pe="futuroplus_notif_limpas_em",ge="futuroplus_notif_sino_vistas_em";function D(e){return String(e??"").replace(/[&<>"']/g,o=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[o])}function Qe(e){const o=new Date(e||"");return Number.isNaN(o.getTime())?"":o.toLocaleDateString("pt-BR",{day:"2-digit",month:"short"})}function he(){try{return JSON.parse(localStorage.getItem(fe))||[]}catch{return[]}}function Xe(e){try{const o=he();o.includes(e)||(o.push(e),localStorage.setItem(fe,JSON.stringify(o)))}catch{}}function Ye(){try{return localStorage.getItem(pe)||""}catch{return""}}function et(e){try{localStorage.setItem(pe,e)}catch{}}function tt(){try{return localStorage.getItem(ge)||""}catch{return""}}function ot(e){try{localStorage.setItem(ge,e)}catch{}}let F=null;function U(){return F||(F=Be(Ne(B,Ze)).then(e=>e.docs.map(o=>({id:o.id,...o.data()})).filter(o=>o.ativo!==!1).sort((o,n)=>(n.criadoEm||"").localeCompare(o.criadoEm||"")))),F}function $(e,o){const n=e.publico||"logados";return n==="todos"?!0:o?n==="logados":n==="deslogados"}function at(){if(document.getElementById("nt-estilos"))return;const e=document.createElement("style");e.id="nt-estilos",e.textContent=`
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
    `,document.head.appendChild(e)}function nt(){const e=document.createElement("dialog");return e.id="nt-modal",e.className="nt-modal",e.innerHTML=`
        <div class="nt-cabecalho"><h2 id="nt-titulo"></h2></div>
        <div class="nt-corpo" id="nt-corpo"></div>
        <div class="nt-acoes"><button type="button" id="nt-fechar" class="nt-btn-primario">Entendi</button></div>
    `,document.body.appendChild(e),e}async function be(e,o,n){const r=e.find(l=>!o.has(l.id));if(!r)return;at();const s=document.getElementById("nt-modal")||nt();s.querySelector("#nt-titulo").textContent=r.titulo||"Aviso",s.querySelector("#nt-corpo").textContent=r.mensagem||"";let i=!1;async function u(){if(!i){i=!0,s.close(),s.remove();try{await n(r.id)}catch(l){console.error("Erro ao marcar notificação como vista:",l)}}}s.querySelector("#nt-fechar").addEventListener("click",u),s.addEventListener("cancel",l=>{l.preventDefault(),u()}),s.showModal()}async function rt(e){const o=(await U()).filter(r=>r.mostrarModal&&$(r,!0)),n=new Set(e.notificacoesModalVistas||[]);await be(o,n,r=>ze(q(B,"usuarios",L.currentUser.uid),{notificacoesModalVistas:qe(r)}))}async function it(){const e=(await U()).filter(n=>n.mostrarModal&&$(n,!1)),o=new Set(he());await be(e,o,n=>Xe(n))}function st(e){const{completo:o,faltando:n}=Ke(e);return o?null:{id:"perfil-incompleto",titulo:"Complete seu perfil",mensagem:`Falta ${n.join(", ")}. Perfis completos recebem recomendações de curso e de unidade mais certeiras.`,criadoEm:new Date().toISOString(),link:"perfil.html"}}function ct(){return{id:"visitante-criar-conta",titulo:"Crie sua conta ou entre",mensagem:"Salve os resultados dos seus testes e receba recomendações de curso e unidade personalizadas.",criadoEm:new Date().toISOString(),acoes:[{rotulo:"Entrar",href:"login.html"},{rotulo:"Criar conta",href:"cadastro.html",destaque:!0}]}}function lt(e){return e?.length?`<div class="notif-item-acoes">${e.map(o=>`
        <a class="notif-item-botao${o.destaque?" notif-item-botao--destaque":""}" href="${D(o.href)}">${D(o.rotulo)}</a>`).join("")}</div>`:""}function dt(e){const o=`
            <strong class="notif-item-titulo">${D(e.titulo||"Aviso")}</strong>
            <p class="notif-item-mensagem">${D(e.mensagem||"")}</p>
            ${lt(e.acoes)}
            <span class="notif-item-data">${Qe(e.criadoEm)}</span>`;return e.link&&!e.acoes?`<a class="notif-item notif-item--link" href="${D(e.link)}">${o}</a>`:`<div class="notif-item">${o}</div>`}const ut='<p class="notif-vazio">Nenhuma notificação por enquanto.</p>';async function ve(e,o,n,r,s){const i=document.getElementById("notif-lista"),u=document.getElementById("notif-ponto"),l=document.getElementById("notif-botao"),h=document.getElementById("notif-limpar");if(!i||!u||!h)return async()=>{};const b=e.filter(g=>(g.criadoEm||"")>o);let A=n;function y(){const g=b.filter(I=>(I.criadoEm||"")>A).length;i.innerHTML=b.length?b.map(dt).join(""):ut,u.textContent=g>9?"9+":String(g),u.hidden=g===0,l?.classList.toggle("bell-icon--tem-notificacao",g>0),h.hidden=b.length===0,h.textContent=`Limpar (${b.length})`}return y(),h.onclick=async()=>{if(confirm("Isso limpa todas as notificações da lista. Você pode continuar recebendo novas depois. Confirma?")){h.disabled=!0;try{const g=new Date().toISOString();await r(g),b.length=0,y()}catch(g){console.error("Erro ao limpar notificações:",g),alert("Não consegui limpar as notificações agora. Tente de novo.")}finally{h.disabled=!1}}},async function(){if(!b.some(E=>(E.criadoEm||"")>A))return;const I=new Date().toISOString();A=I,y();try{await s(I)}catch(E){console.error("Erro ao marcar notificações como vistas:",E)}}}async function mt(e,o){const n=(await U()).filter(i=>i.mostrarSino&&$(i,!0)),r=st(o),s=r?[r,...n]:n;return ve(s,o.notificacoesLimpasEm||"",o.notificacoesVistasEm||"",i=>V(q(B,"usuarios",e),{notificacoesLimpasEm:i},{merge:!0}),i=>V(q(B,"usuarios",e),{notificacoesVistasEm:i},{merge:!0}))}async function ft(){const e=(await U()).filter(r=>r.mostrarSino&&$(r,!1)),n=[ct(),...e];return ve(n,Ye(),tt(),async r=>et(r),async r=>ot(r))}const ye="futuroplus_chat_ja_abriu",pt=45e3,gt=0,ht=8e3;function R(){try{return sessionStorage.getItem(ye)==="1"}catch{return!1}}function ue(){try{sessionStorage.setItem(ye,"1")}catch{}}function bt({pausar:e=()=>!1}={}){const o=document.getElementById("chatbot-toggle");if(!o||R())return;const n=document.createElement("span");n.className="chat-notificacao-bolinha",o.appendChild(n),o.classList.add("chat-btn-pulsando");function r(){if(R()||e()||document.getElementById("chat-balao-fala"))return;const l=document.createElement("div");l.id="chat-balao-fala",l.className="chat-balao-fala",l.innerHTML='👋 Posso te ajudar a achar seu curso! <button type="button" class="chat-balao-fechar" aria-label="Fechar">×</button>',document.body.appendChild(l),l.querySelector(".chat-balao-fechar").addEventListener("click",h=>{h.stopPropagation(),l.remove(),ue(),n.remove(),o.classList.remove("chat-btn-pulsando"),clearTimeout(s),clearInterval(u)}),setTimeout(()=>l.remove(),ht)}let s;function i(){if(!R()){if(e()){s=setTimeout(i,1e3);return}s=setTimeout(r,gt)}}i();const u=setInterval(()=>{R()||e()||(o.classList.add("chat-btn-aceno"),setTimeout(()=>o.classList.remove("chat-btn-aceno"),900))},pt);o.addEventListener("click",()=>{ue(),n.remove(),o.classList.remove("chat-btn-pulsando"),document.getElementById("chat-balao-fala")?.remove(),clearTimeout(s),clearInterval(u)},{once:!0})}document.addEventListener("DOMContentLoaded",()=>{"serviceWorker"in navigator&&navigator.serviceWorker.getRegistrations().then(t=>{for(let a of t)a.unregister()});function e(t){return(t||"?").trim().split(/\s+/).filter(Boolean).slice(0,2).map(c=>c[0].toUpperCase()).join("")||"?"}let o=async()=>{};Me(L,async t=>{const a=document.getElementById("nomeUsuario"),c=document.getElementById("avatar-menu"),m=document.getElementById("avatar-iniciais"),d=document.getElementById("nav-auth"),S=document.getElementById("menu-nav-auth"),v=document.getElementById("notif-menu");if(t){if(console.log("Usuário logado UID:",t.uid),!await Ge(t))return;let se="";try{const H=q(B,"usuarios",t.uid),ce=await me(H);if(ce.exists()){const w=ce.data();console.log("Dados encontrados no Firestore:",w),w.exclusao&&(await V(H,{exclusao:De()},{merge:!0}),alert("Você tinha pedido para excluir sua conta. Como você entrou de novo, esse pedido foi cancelado e sua conta continua normal.")),je(w).catch(C=>console.error("Erro ao checar termos:",C)),rt(w).catch(C=>console.error("Erro ao checar notificações:",C)),mt(t.uid,w).then(C=>{o=C}).catch(C=>console.error("Erro ao carregar o sino de notificações:",C)),se=[w.nome,w.sobrenome].filter(Boolean).join(" ").trim(),w.nome&&a?a.textContent=w.nome:w.nome||console.warn("O campo 'nome' não existe no documento do Firestore."),w.admin===!0&&document.querySelectorAll(".menu-admin-area").forEach(C=>{C.hidden=!1}),re(w.permissoes?.localizacaoChatbot?.concedida===!0)}else console.warn("Nenhum documento encontrado na coleção 'usuarios' para este UID.")}catch(H){console.error("Erro ao buscar dados no Firestore:",H)}m&&(m.textContent=e(se||t.email)),c&&(c.hidden=!1),v&&(v.hidden=!1),d&&(d.hidden=!0),S&&(S.hidden=!0),I()}else console.log("Nenhum usuário logado. Modo visitante ativado."),a&&(a.textContent="ESTUDANTE"),it().catch(x=>console.error("Erro ao checar notificações:",x)),ft().then(x=>{o=x}).catch(x=>console.error("Erro ao carregar o sino de notificações:",x)),c&&(c.hidden=!0),v&&(v.hidden=!1),d&&(d.hidden=!1),S&&(S.hidden=!1),s(),l(),E()});const n=document.getElementById("avatar-botao"),r=document.getElementById("avatar-dropdown");function s(){!r||r.hidden||(r.hidden=!0,n?.setAttribute("aria-expanded","false"))}n&&r&&(n.addEventListener("click",t=>{t.stopPropagation(),l(),document.getElementById("tour-dica-balao")?.remove();const a=r.hidden;r.hidden=!a,n.setAttribute("aria-expanded",String(a))}),document.addEventListener("click",t=>{!r.hidden&&!t.target.closest("#avatar-menu")&&s()}),document.addEventListener("keydown",t=>{t.key==="Escape"&&s()}));const i=document.getElementById("notif-botao"),u=document.getElementById("notif-dropdown");function l(){!u||u.hidden||(u.hidden=!0,i?.setAttribute("aria-expanded","false"))}i&&u&&(i.addEventListener("click",t=>{t.stopPropagation(),s(),document.getElementById("tour-dica-balao")?.remove();const a=u.hidden;u.hidden=!a,i.setAttribute("aria-expanded",String(a)),a&&o()}),document.addEventListener("click",t=>{!u.hidden&&!t.target.closest("#notif-menu")&&l()}),document.addEventListener("keydown",t=>{t.key==="Escape"&&l()})),bt({pausar:()=>window.__tourAtivo===!0});async function h(){if(document.getElementById("card-vocacional")){const{iniciarTourBoasVindas:c}=await le(async()=>{const{iniciarTourBoasVindas:m}=await import("./tour-boas-vindas-CTs32DB-.js");return{iniciarTourBoasVindas:m}},__vite__mapDeps([0,1]),import.meta.url);c({forcar:!0});return}const{iniciarTourDaPagina:t}=await le(async()=>{const{iniciarTourDaPagina:c}=await import("./tour-paginas-COru7OUt.js");return{iniciarTourDaPagina:c}},__vite__mapDeps([2,1]),import.meta.url);await t({forcar:!0})||(window.location.href="index.html?tour=1")}document.getElementById("btn-repetir-tour")?.addEventListener("click",h),document.getElementById("btn-tour-menu")?.addEventListener("click",()=>{T?.classList.contains("aberto")&&z(),h()});const b="futuroplus_tour_dica_fechada",A=[document.getElementById("btn-repetir-tour"),document.getElementById("btn-tour-menu")].filter(Boolean);let y=!1;function g(){try{return localStorage.getItem(b)==="1"}catch{return!1}}function I(){A.forEach(t=>t.classList.remove("tour-cta-destaque"))}function E(){if(g()||(A.forEach(d=>d.classList.add("tour-cta-destaque")),y))return;y=!0;const t=document.getElementById("btn-repetir-tour");if(!t||window.__tourAtivo||document.getElementById("tour-dica-balao"))return;const a=document.createElement("div");a.id="tour-dica-balao",a.className="tour-dica-balao",a.innerHTML='Clique em mim 😎 <span class="tour-dica-fechar" role="button" tabindex="0" aria-label="Fechar">×</span>',t.appendChild(a);const c=d=>{d.stopPropagation(),a.remove();try{localStorage.setItem(b,"1")}catch{}I()},m=a.querySelector(".tour-dica-fechar");m.addEventListener("click",c),m.addEventListener("keydown",d=>{(d.key==="Enter"||d.key===" ")&&c(d)}),t.addEventListener("click",()=>a.remove(),{once:!0}),setTimeout(()=>a.remove(),8e3)}const N=document.querySelector(".hamburger"),T=document.querySelector(".menu-panel"),k=document.createElement("div");k.classList.add("menu-overlay"),document.body.appendChild(k);function z(){T&&T.classList.toggle("aberto"),k&&k.classList.toggle("ativo")}N&&k&&(N.addEventListener("click",z),k.addEventListener("click",z),document.addEventListener("keydown",t=>{t.key==="Escape"&&T?.classList.contains("aberto")&&z()}));const M=window.matchMedia("(min-width: 1024px)"),f=()=>{M.matches&&(T?.classList.remove("aberto"),k?.classList.remove("ativo"))};M.addEventListener("change",f),f();const O=document.getElementById("busca-topo");if(O){let t=function(){const a=O.value.trim();if(!a)return;const c=document.getElementById("busca-cursos");c?(c.value=a,c.dispatchEvent(new Event("input")),c.scrollIntoView({behavior:"smooth",block:"center"})):window.location.href=`instituicoes.html?curso=${encodeURIComponent(a)}`};O.addEventListener("keydown",a=>{a.key==="Enter"&&t()}),O.parentElement.querySelector("svg")?.addEventListener("click",t)}const G=document.getElementById("logout-btn");G&&G.addEventListener("click",async()=>{try{we(),await J(L),window.location.href="login.html"}catch(t){console.error("Erro ao fazer logout:",t),alert("Não foi possível encerrar a sessão. Tente novamente.")}});const W=document.getElementById("chatbot-toggle"),K=document.getElementById("chatbot-window"),Z=document.getElementById("close-chat"),P=document.getElementById("chat-input"),Q=document.getElementById("send-chat"),p=document.getElementById("chat-messages"),j="futuroplus_chat_historico",Ee=60;function X(){try{return JSON.parse(sessionStorage.getItem(j))||[]}catch{return[]}}function xe(t){try{sessionStorage.setItem(j,JSON.stringify(t.slice(-Ee)))}catch{}}function we(){try{sessionStorage.removeItem(j)}catch{}}const Y=()=>{K&&K.classList.toggle("oculta")};W&&W.addEventListener("click",Y),Z&&Z.addEventListener("click",Y);function Ie(t){return t.replace(/\[([^\]]*)\]\((https?:\/\/[^)\s]+)\)/g,"$2").replace(/^#{1,6}\s+/gm,"").replace(/\*\*(.*?)\*\*/g,"$1").replace(/\*(.*?)\*/g,"$1").replace(/`([^`]+)`/g,"$1")}function Se(t,a){a.split(/(https?:\/\/[^\s<>"')\]]+)/g).forEach((m,d)=>{if(d%2===0){m&&t.appendChild(document.createTextNode(m));return}const[,S,v]=m.match(/^(.*?)([.,;:!?]*)$/),x=document.createElement("a");x.href=S,x.textContent=S,x.target="_blank",x.rel="noopener noreferrer",t.appendChild(x),v&&t.appendChild(document.createTextNode(v))})}function _(t,a,{salvarNoHistorico:c=!0}={}){if(!t.trim()||!p)return;const m=document.createElement("div");if(m.classList.add("msg",a),a==="bot"?Se(m,Ie(t)):m.textContent=t,p.appendChild(m),p.scrollTop=p.scrollHeight,c){const d=X();d.push({texto:t,remetente:a}),xe(d)}}(function(){const a=X();!a.length||!p||(p.innerHTML="",a.forEach(({texto:c,remetente:m})=>_(c,m,{salvarNoHistorico:!1})))})();const Le=["https://www.vestibulinhoetec.com.br","https://www.vestibularfatec.com.br"];function ke(t){try{const a=new URL(t);return Le.some(c=>a.origin===new URL(c).origin)}catch{return!1}}function ee(t){if(!p||!Array.isArray(t)||!t.length)return;const a=document.createElement("div");a.className="chat-links-site",t.forEach(({texto:c,url:m})=>{if(typeof m!="string")return;const d=/^[a-z0-9-]+\.html(\?[^\s<>"']*)?$/i.test(m),S=!d&&ke(m);if(!d&&!S)return;const v=document.createElement("a");v.className="chat-link-site",v.href=m,S&&(v.target="_blank",v.rel="noopener noreferrer"),v.textContent=`${c} →`,a.appendChild(v)}),a.children.length&&(p.appendChild(a),p.scrollTop=p.scrollHeight)}function Ce(){if(!p)return;const t=document.createElement("div");t.classList.add("msg","bot"),t.textContent="Digitando...",t.id="typing-indicator",p.appendChild(t),p.scrollTop=p.scrollHeight}function te(){document.getElementById("typing-indicator")?.remove()}const Ae=location.hostname==="localhost"||location.hostname==="127.0.0.1"?"http://127.0.0.1:5001/futuroplus-bce54/southamerica-east1/chat_bot":"https://southamerica-east1-futuroplus-bce54.cloudfunctions.net/chat_bot";async function oe(t){_(t,"user");const a=L.currentUser;if(!a){_("Opa, essa parte eu só consigo fazer com você logado 😊 Entra na sua conta rapidinho que te ajudo na hora!","bot"),ee([{texto:"Entrar na conta",url:"login.html"}]);return}Ce();try{const c=await a.getIdToken(),d=await(await fetch(Ae,{method:"POST",headers:{"Content-Type":"application/json",Authorization:"Bearer "+c},body:JSON.stringify({mensagem:t})})).json();te(),_(d.resposta||d.erro||"Erro ao obter resposta.","bot"),ee(d.links),Array.isArray(d.acoes)&&d.acoes.includes("pedir_permissao_localizacao")&&Te()}catch(c){console.error("Erro ao chamar o chatbot:",c),te(),_("Não consegui me conectar agora. Tente novamente.","bot")}}const ae=()=>{const t=P.value.trim();t&&(P.value="",oe(t))};async function ne(t){const a=L.currentUser;if(!a)return!1;try{return await V(q(B,"usuarios",a.uid),{permissoes:{localizacaoChatbot:{concedida:t,atualizadoEm:new Date().toISOString()}}},{merge:!0}),re(t),!0}catch(c){return console.error("Erro ao salvar a permissão de localização:",c),_("Não consegui salvar sua escolha agora. Tente novamente.","bot"),!1}}function Te(){if(!p||document.getElementById("cartao-permissao-localizacao"))return;const t=document.createElement("div");t.id="cartao-permissao-localizacao",t.className="msg bot cartao-permissao",t.innerHTML=`
            <p><strong>📍 Usar a localização do seu perfil?</strong></p>
            <p>O assistente usa só a distância até as unidades. Seu endereço não aparece na conversa, e você pode desativar quando quiser.</p>
            <div class="cartao-permissao-botoes">
                <button type="button" class="btn-permitir">Permitir</button>
                <button type="button" class="btn-agora-nao">Agora não</button>
            </div>
        `,t.querySelector(".btn-permitir").addEventListener("click",async()=>{t.querySelectorAll("button").forEach(a=>{a.disabled=!0}),await ne(!0)?(t.remove(),oe("Pode usar a localização do meu perfil.")):t.querySelectorAll("button").forEach(a=>{a.disabled=!1})}),t.querySelector(".btn-agora-nao").addEventListener("click",()=>{t.remove(),_("Tudo bem! Se preferir, me diga a sua cidade que eu procuro as unidades de lá.","bot")}),p.appendChild(t),p.scrollTop=p.scrollHeight}function re(t){const a=document.getElementById("chat-permissao-localizacao");a&&(a.hidden=!t)}const ie=document.getElementById("desativar-localizacao-chat");ie&&ie.addEventListener("click",async()=>{await ne(!1)&&_("Pronto, não vou mais usar a localização do seu perfil. Se quiser, é só me dizer uma cidade.","bot")}),Q&&Q.addEventListener("click",ae),P&&P.addEventListener("keypress",t=>{t.key==="Enter"&&ae()})});export{We as I};
