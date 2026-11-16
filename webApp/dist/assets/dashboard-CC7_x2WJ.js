const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["./tour-boas-vindas-Bosq5K8y.js","./tour-motor-BeDtj6px.js","./tour-paginas-CDKwbsfw.js"])))=>i.map(i=>d[i]);
import{_ as de}from"./preload-helper-PPVm8Dsz.js";import{s as G,a as k,b as V,d as q,c as _,f as fe,p as qe,g as ze,e as De,u as Me,Y as Ve,o as Oe,Q as Pe}from"./firebase-config-CIJUxFH5.js";import{P as He,T as Re}from"./conteudo-legal-padrao-DcxCgRAC.js";import{a as Ue,e as $e}from"./resultado-teste-CF19jvmT.js";import{a as pe,e as ge}from"./notificacoes-util-BMqxtxne.js";const je={termos:{colecaoId:"termos-de-uso",titulo:"Termos de Uso",padrao:Re},privacidade:{colecaoId:"politica-privacidade",titulo:"Política de Privacidade",padrao:He}};async function ue(e){const{colecaoId:o,padrao:a}=je[e];try{const r=await fe(q(_,"configuracoes",o));return r.exists()&&r.data().versao?{versao:r.data().versao,html:r.data().html||a}:{versao:1,html:a}}catch(r){return console.error(`Erro ao buscar ${o}:`,r),{versao:1,html:a}}}function Fe(){if(document.getElementById("gt-estilos"))return;const e=document.createElement("style");e.id="gt-estilos",e.textContent=`
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
    `,document.head.appendChild(e)}function Je(){const e=document.createElement("dialog");return e.id="gt-modal",e.className="gt-modal",e.innerHTML=`
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
    `,document.body.appendChild(e),e}async function Ge(e){const[o,a]=await Promise.all([ue("termos"),ue("privacidade")]),r=e.termosAceitos||{},s={termos:(r.termos||0)<o.versao,privacidade:(r.privacidade||0)<a.versao};if(!s.termos&&!s.privacidade)return;Fe();const i=document.getElementById("gt-modal")||Je(),f={termos:o,privacidade:a},l={termos:!s.termos,privacidade:!s.privacidade};let d=null;const h=i.querySelector("#gt-checkbox"),x=i.querySelector("#gt-checkbox-label"),y=i.querySelector("#gt-continuar"),b=i.querySelector("#gt-tela-menu"),L=i.querySelector("#gt-tela-leitura"),E=i.querySelector("#gt-leitura-conteudo"),z=i.querySelector("#gt-leitura-aviso");function D(){const p=l.termos&&l.privacidade;h.disabled=!p,p&&(x.innerHTML='Li e concordo com os <a href="termos-de-uso.html" target="_blank">Termos de Uso</a> e a <a href="privacidade.html" target="_blank">Política de Privacidade</a> atualizados.')}function B(p){!p||l[p]||(l[p]=!0,i.querySelector(`#gt-btn-${p==="termos"?"termos":"privacidade"}`).classList.add("gt-btn-ler--lido"),d===p&&(z.textContent="Lido! Você já pode voltar.",z.classList.add("lido")),D())}function w(){E.scrollHeight-(E.scrollTop+E.clientHeight)<40&&B(d)}function N(p){d=p,E.innerHTML=f[p].html,E.scrollTop=0,z.classList.remove("lido"),z.textContent=l[p]?"Lido! Você já pode voltar.":"Role o texto até o fim para marcar como lido.",b.hidden=!0,L.hidden=!1,w()}i.querySelector("#gt-btn-termos").addEventListener("click",()=>N("termos")),i.querySelector("#gt-btn-privacidade").addEventListener("click",()=>N("privacidade")),i.querySelector("#gt-voltar").addEventListener("click",()=>{L.hidden=!0,b.hidden=!1}),E.addEventListener("scroll",w),h.addEventListener("change",()=>{y.disabled=!h.checked}),i.querySelector("#gt-sair").addEventListener("click",async()=>{await G(k),window.location.href="login.html"}),y.addEventListener("click",async()=>{y.disabled=!0,y.textContent="Salvando...";try{await V(q(_,"usuarios",k.currentUser.uid),{termosAceitos:{termos:o.versao,privacidade:a.versao,aceitoEm:new Date().toISOString()}},{merge:!0}),i.close(),i.remove()}catch(p){console.error("Erro ao registrar aceite dos termos:",p),y.disabled=!1,y.textContent="Continuar usando o site",alert("Não consegui registrar seu aceite agora. Tente de novo.")}}),i.addEventListener("cancel",p=>p.preventDefault()),D(),i.showModal()}function We(){if(document.getElementById("ge-estilos"))return;const e=document.createElement("style");e.id="ge-estilos",e.textContent=`
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
    `,document.head.appendChild(e)}function Qe(e){const o=document.createElement("dialog");return o.id="ge-modal",o.className="ge-modal",o.innerHTML=`
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
    `,document.body.appendChild(o),o}async function Ye(e){if(e.emailVerified)return!0;We();const o=document.getElementById("ge-modal")||Qe(e.email),a=o.querySelector("#ge-status"),r=o.querySelector("#ge-ja-confirmei"),s=o.querySelector("#ge-reenviar"),i=o.querySelector("#ge-sair");return r.addEventListener("click",async()=>{a.textContent="",a.className="ge-status",r.disabled=!0,r.textContent="Verificando...";try{if(await e.reload(),k.currentUser.emailVerified){o.close(),o.remove(),window.location.reload();return}a.textContent="Ainda não encontramos a confirmação. Clique no link do e-mail e tente de novo.",a.className="ge-status erro"}catch(f){console.error("Erro ao checar confirmação de e-mail:",f),a.textContent="Não consegui checar agora. Tente de novo.",a.className="ge-status erro"}finally{r.disabled=!1,r.textContent="Já confirmei, continuar"}}),s.addEventListener("click",async()=>{s.disabled=!0;const f=s.textContent;s.textContent="Enviando...";try{await qe(e),a.textContent="E-mail reenviado!",a.className="ge-status ok"}catch(l){console.error("Erro ao reenviar e-mail de verificação:",l),a.textContent=l.code==="auth/too-many-requests"?"Muitas tentativas — espera um pouco antes de reenviar de novo.":"Não consegui reenviar agora. Tente de novo em instantes.",a.className="ge-status erro"}finally{s.disabled=!1,s.textContent=f}}),i.addEventListener("click",async()=>{await G(k),window.location.href="login.html"}),o.addEventListener("cancel",f=>f.preventDefault()),o.addEventListener("close",()=>{k.currentUser?.emailVerified||o.showModal()}),o.showModal(),!1}const Ze=[{rotulo:"cidade no cadastro",completo:e=>!!(e.cadastro.cidade||e.cadastro.cep)},{rotulo:"seu momento nos estudos",completo:e=>!!e.perfil.escolaridade},{rotulo:"sua formação",completo:e=>!!(e.perfil.formacao||e.perfil.semFormacao)},{rotulo:"o curso que você quer",completo:e=>!!e.perfil.cursoDesejado},{rotulo:"suas áreas de interesse",completo:e=>(e.perfil.modalidades||[]).length>0},{rotulo:"seu estilo de aprendizado",completo:e=>(e.perfil.estilos||[]).length>0},{rotulo:"seu objetivo",completo:e=>!!e.perfil.objetivo},{rotulo:"fazer um teste",completo:e=>!!e.temTeste}];function Ke(e){const o={modalidades:[],estilos:[],...e?.perfil||{}},a=!!(Ue(e)||$e(e)),r={cadastro:e||{},perfil:o,temTeste:a},s=Ze.filter(i=>!i.completo(r)).map(i=>i.rotulo);return{completo:s.length===0,faltando:s}}const Xe="notificacoes",he="futuroplus_notif_vistas",be="futuroplus_notif_limpas_em",ve="futuroplus_notif_sino_vistas_em";function M(e){return String(e??"").replace(/[&<>"']/g,o=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[o])}function et(e){const o=new Date(e||"");return Number.isNaN(o.getTime())?"":o.toLocaleDateString("pt-BR",{day:"2-digit",month:"short"})}function ye(){try{return JSON.parse(localStorage.getItem(he))||[]}catch{return[]}}function tt(e){try{const o=ye();o.includes(e)||(o.push(e),localStorage.setItem(he,JSON.stringify(o)))}catch{}}function ot(){try{return localStorage.getItem(be)||""}catch{return""}}function at(e){try{localStorage.setItem(be,e)}catch{}}function nt(){try{return localStorage.getItem(ve)||""}catch{return""}}function rt(e){try{localStorage.setItem(ve,e)}catch{}}let J=null;function U(){if(!J){const e=new Date().toISOString();J=ze(De(_,Xe)).then(o=>o.docs.map(a=>({id:a.id,...a.data()})).filter(a=>a.ativo!==!1).filter(a=>!a.publicarEm||a.publicarEm<=e).sort((a,r)=>(r.criadoEm||"").localeCompare(a.criadoEm||"")))}return J}function $(e,o){const a=e.publico||"logados";return a==="todos"?!0:o?a==="logados":a==="deslogados"}function it(){if(document.getElementById("nt-estilos"))return;const e=document.createElement("style");e.id="nt-estilos",e.textContent=`
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
        .nt-acoes { display: flex; flex-direction: column; gap: 8px; padding: 0 22px 22px; }
        .nt-btn-primario,
        .nt-btn-secundario {
            display: block;
            width: 100%;
            padding: 12px 18px;
            border-radius: 99px;
            border: none;
            background: var(--blue, #4e6ee8);
            color: #fff;
            font-family: 'Sora', sans-serif;
            font-size: 13.5px;
            font-weight: 700;
            text-align: center;
            text-decoration: none;
            cursor: pointer;
        }
        .nt-btn-secundario {
            background: transparent;
            color: var(--ink-soft, #5b6084);
            box-shadow: inset 0 0 0 1.5px var(--line, #e6e8f5);
        }
        .nt-btn-primario[hidden] { display: none; }
    `,document.head.appendChild(e)}function st(){const e=document.createElement("dialog");return e.id="nt-modal",e.className="nt-modal",e.innerHTML=`
        <div class="nt-cabecalho"><h2 id="nt-titulo"></h2></div>
        <div class="nt-corpo" id="nt-corpo"></div>
        <div class="nt-acoes">
            <a id="nt-ler" class="nt-btn-primario" hidden>Ler a notícia</a>
            <button type="button" id="nt-fechar" class="nt-btn-primario">Entendi</button>
        </div>
    `,document.body.appendChild(e),e}async function Ee(e,o,a){const r=e.find(d=>!o.has(d.id));if(!r)return;it();const s=document.getElementById("nt-modal")||st();s.querySelector("#nt-titulo").textContent=r.titulo||"Aviso",s.querySelector("#nt-corpo").textContent=r.mensagem||"";let i=!1;async function f(){if(!i){i=!0,s.close(),s.remove();try{await a(r.id)}catch(d){console.error("Erro ao marcar notificação como vista:",d)}}}s.querySelector("#nt-fechar").addEventListener("click",f),s.addEventListener("cancel",d=>{d.preventDefault(),f()});const l=pe(r.link);if(l){const d=s.querySelector("#nt-ler"),h=s.querySelector("#nt-fechar");d.href=l,d.hidden=!1,h.textContent="Agora não",h.className="nt-btn-secundario",ge(l)?(d.target="_blank",d.rel="noopener noreferrer",d.addEventListener("click",()=>{setTimeout(f,0)})):d.addEventListener("click",async x=>{x.preventDefault(),await Promise.race([f(),new Promise(y=>setTimeout(y,1500))]),window.location.href=l})}s.showModal()}async function ct(e){const o=(await U()).filter(r=>r.mostrarModal&&$(r,!0)),a=new Set(e.notificacoesModalVistas||[]);await Ee(o,a,r=>Me(q(_,"usuarios",k.currentUser.uid),{notificacoesModalVistas:Ve(r)}))}async function lt(){const e=(await U()).filter(a=>a.mostrarModal&&$(a,!1)),o=new Set(ye());await Ee(e,o,a=>tt(a))}function dt(e){const{completo:o,faltando:a}=Ke(e);return o?null:{id:"perfil-incompleto",titulo:"Complete seu perfil",mensagem:`Falta ${a.join(", ")}. Perfis completos recebem recomendações de curso e de unidade mais certeiras.`,criadoEm:new Date().toISOString(),link:"perfil.html"}}function ut(){return{id:"visitante-criar-conta",titulo:"Crie sua conta ou entre",mensagem:"Salve os resultados dos seus testes e receba recomendações de curso e unidade personalizadas.",criadoEm:new Date().toISOString(),acoes:[{rotulo:"Entrar",href:"login.html"},{rotulo:"Criar conta",href:"cadastro.html",destaque:!0}]}}function mt(e){return e?.length?`<div class="notif-item-acoes">${e.map(o=>`
        <a class="notif-item-botao${o.destaque?" notif-item-botao--destaque":""}" href="${M(o.href)}">${M(o.rotulo)}</a>`).join("")}</div>`:""}function ft(e){const o=pe(e.link),a=`
            <strong class="notif-item-titulo">${M(e.titulo||"Aviso")}</strong>
            <p class="notif-item-mensagem">${M(e.mensagem||"")}</p>
            ${mt(e.acoes)}
            ${o&&e.noticia?'<span class="notif-item-ler">Ler a notícia →</span>':""}
            <span class="notif-item-data">${et(e.criadoEm)}</span>`,r=ge(o)?' target="_blank" rel="noopener noreferrer"':"";return o&&!e.acoes?`<a class="notif-item notif-item--link" href="${M(o)}"${r}>${a}</a>`:`<div class="notif-item">${a}</div>`}const pt='<p class="notif-vazio">Nenhuma notificação por enquanto.</p>';async function xe(e,o,a,r,s){const i=document.getElementById("notif-lista"),f=document.getElementById("notif-ponto"),l=document.getElementById("notif-botao"),d=document.getElementById("notif-limpar");if(!i||!f||!d)return async()=>{};const h=e.filter(b=>(b.criadoEm||"")>o);let x=a;function y(){const b=h.filter(L=>(L.criadoEm||"")>x).length;i.innerHTML=h.length?h.map(ft).join(""):pt,f.textContent=b>9?"9+":String(b),f.hidden=b===0,l?.classList.toggle("bell-icon--tem-notificacao",b>0),d.hidden=h.length===0,d.textContent=`Limpar (${h.length})`}return y(),d.onclick=async()=>{if(confirm("Isso limpa todas as notificações da lista. Você pode continuar recebendo novas depois. Confirma?")){d.disabled=!0;try{const b=new Date().toISOString();await r(b),h.length=0,y()}catch(b){console.error("Erro ao limpar notificações:",b),alert("Não consegui limpar as notificações agora. Tente de novo.")}finally{d.disabled=!1}}},async function(){if(!h.some(E=>(E.criadoEm||"")>x))return;const L=new Date().toISOString();x=L,y();try{await s(L)}catch(E){console.error("Erro ao marcar notificações como vistas:",E)}}}async function gt(e,o){const a=(await U()).filter(i=>i.mostrarSino&&$(i,!0)),r=dt(o),s=r?[r,...a]:a;return xe(s,o.notificacoesLimpasEm||"",o.notificacoesVistasEm||"",i=>V(q(_,"usuarios",e),{notificacoesLimpasEm:i},{merge:!0}),i=>V(q(_,"usuarios",e),{notificacoesVistasEm:i},{merge:!0}))}async function ht(){const e=(await U()).filter(r=>r.mostrarSino&&$(r,!1)),a=[ut(),...e];return xe(a,ot(),nt(),async r=>at(r),async r=>rt(r))}const we="futuroplus_chat_ja_abriu",bt=45e3,vt=0,yt=8e3;function R(){try{return sessionStorage.getItem(we)==="1"}catch{return!1}}function me(){try{sessionStorage.setItem(we,"1")}catch{}}function Et({pausar:e=()=>!1}={}){const o=document.getElementById("chatbot-toggle");if(!o||R())return;const a=document.createElement("span");a.className="chat-notificacao-bolinha",o.appendChild(a),o.classList.add("chat-btn-pulsando");function r(){if(R()||e()||document.getElementById("chat-balao-fala"))return;const l=document.createElement("div");l.id="chat-balao-fala",l.className="chat-balao-fala",l.innerHTML='👋 Posso te ajudar a achar seu curso! <button type="button" class="chat-balao-fechar" aria-label="Fechar">×</button>',document.body.appendChild(l),l.querySelector(".chat-balao-fechar").addEventListener("click",d=>{d.stopPropagation(),l.remove(),me(),a.remove(),o.classList.remove("chat-btn-pulsando"),clearTimeout(s),clearInterval(f)}),setTimeout(()=>l.remove(),yt)}let s;function i(){if(!R()){if(e()){s=setTimeout(i,1e3);return}s=setTimeout(r,vt)}}i();const f=setInterval(()=>{R()||e()||(o.classList.add("chat-btn-aceno"),setTimeout(()=>o.classList.remove("chat-btn-aceno"),900))},bt);o.addEventListener("click",()=>{me(),a.remove(),o.classList.remove("chat-btn-pulsando"),document.getElementById("chat-balao-fala")?.remove(),clearTimeout(s),clearInterval(f)},{once:!0})}document.addEventListener("DOMContentLoaded",()=>{"serviceWorker"in navigator&&navigator.serviceWorker.getRegistrations().then(t=>{for(let n of t)n.unregister()});function e(t){return(t||"?").trim().split(/\s+/).filter(Boolean).slice(0,2).map(c=>c[0].toUpperCase()).join("")||"?"}let o=async()=>{};function a(t,n=""){const c=document.getElementById("saudacao");c&&(t==="visitante"?c.innerHTML='Boas-vindas ao <span class="marca-futuro">Futuro<span class="marca-mais">+</span><span class="marca-exclamacao">!</span></span>':c.textContent=n?`Olá, ${n} 👋`:"Olá! 👋",document.body.dataset.sessao=t)}Oe(k,async t=>{const n=document.getElementById("avatar-menu"),c=document.getElementById("avatar-iniciais"),u=document.getElementById("nav-auth"),m=document.getElementById("menu-nav-auth"),S=document.getElementById("notif-menu");if(t){if(console.log("Usuário logado UID:",t.uid),!await Ye(t))return;let T="",F="";try{const H=q(_,"usuarios",t.uid),le=await fe(H);if(le.exists()){const I=le.data();console.log("Dados encontrados no Firestore:",I),I.exclusao&&(await V(H,{exclusao:Pe()},{merge:!0}),alert("Você tinha pedido para excluir sua conta. Como você entrou de novo, esse pedido foi cancelado e sua conta continua normal.")),Ge(I).catch(C=>console.error("Erro ao checar termos:",C)),ct(I).catch(C=>console.error("Erro ao checar notificações:",C)),gt(t.uid,I).then(C=>{o=C}).catch(C=>console.error("Erro ao carregar o sino de notificações:",C)),T=[I.nome,I.sobrenome].filter(Boolean).join(" ").trim(),F=String(I.nome||"").trim(),F||console.warn("O campo 'nome' não existe no documento do Firestore."),I.admin===!0&&document.querySelectorAll(".menu-admin-area").forEach(C=>{C.hidden=!1}),se(I.permissoes?.localizacaoChatbot?.concedida===!0)}else console.warn("Nenhum documento encontrado na coleção 'usuarios' para este UID.")}catch(H){console.error("Erro ao buscar dados no Firestore:",H)}a("logado",F),c&&(c.textContent=e(T||t.email)),n&&(n.hidden=!1),S&&(S.hidden=!1),u&&(u.hidden=!0),m&&(m.hidden=!0),E()}else console.log("Nenhum usuário logado. Modo visitante ativado."),a("visitante"),lt().catch(v=>console.error("Erro ao checar notificações:",v)),ht().then(v=>{o=v}).catch(v=>console.error("Erro ao carregar o sino de notificações:",v)),n&&(n.hidden=!0),S&&(S.hidden=!1),u&&(u.hidden=!1),m&&(m.hidden=!1),i(),d(),z()});const r=document.getElementById("avatar-botao"),s=document.getElementById("avatar-dropdown");function i(){!s||s.hidden||(s.hidden=!0,r?.setAttribute("aria-expanded","false"))}r&&s&&(r.addEventListener("click",t=>{t.stopPropagation(),d(),document.getElementById("tour-dica-balao")?.remove();const n=s.hidden;s.hidden=!n,r.setAttribute("aria-expanded",String(n))}),document.addEventListener("click",t=>{!s.hidden&&!t.target.closest("#avatar-menu")&&i()}),document.addEventListener("keydown",t=>{t.key==="Escape"&&i()}));const f=document.getElementById("notif-botao"),l=document.getElementById("notif-dropdown");function d(){!l||l.hidden||(l.hidden=!0,f?.setAttribute("aria-expanded","false"))}f&&l&&(f.addEventListener("click",t=>{t.stopPropagation(),i(),document.getElementById("tour-dica-balao")?.remove();const n=l.hidden;l.hidden=!n,f.setAttribute("aria-expanded",String(n)),n&&o()}),document.addEventListener("click",t=>{!l.hidden&&!t.target.closest("#notif-menu")&&d()}),document.addEventListener("keydown",t=>{t.key==="Escape"&&d()})),Et({pausar:()=>window.__tourAtivo===!0});async function h(){if(document.getElementById("card-vocacional")){const{iniciarTourBoasVindas:c}=await de(async()=>{const{iniciarTourBoasVindas:u}=await import("./tour-boas-vindas-Bosq5K8y.js");return{iniciarTourBoasVindas:u}},__vite__mapDeps([0,1]),import.meta.url);c({forcar:!0});return}const{iniciarTourDaPagina:t}=await de(async()=>{const{iniciarTourDaPagina:c}=await import("./tour-paginas-CDKwbsfw.js");return{iniciarTourDaPagina:c}},__vite__mapDeps([2,1]),import.meta.url);await t({forcar:!0})||(window.location.href="index.html?tour=1")}document.getElementById("btn-repetir-tour")?.addEventListener("click",h),document.getElementById("btn-tour-menu")?.addEventListener("click",()=>{B?.classList.contains("aberto")&&N(),h()});const x="futuroplus_tour_dica_fechada",y=[document.getElementById("btn-repetir-tour"),document.getElementById("btn-tour-menu")].filter(Boolean);let b=!1;function L(){try{return localStorage.getItem(x)==="1"}catch{return!1}}function E(){y.forEach(t=>t.classList.remove("tour-cta-destaque"))}function z(){if(L()||(y.forEach(m=>m.classList.add("tour-cta-destaque")),b))return;b=!0;const t=document.getElementById("btn-repetir-tour");if(!t||window.__tourAtivo||document.getElementById("tour-dica-balao"))return;const n=document.createElement("div");n.id="tour-dica-balao",n.className="tour-dica-balao",n.innerHTML='Clique em mim 😎 <span class="tour-dica-fechar" role="button" tabindex="0" aria-label="Fechar">×</span>',t.appendChild(n);const c=m=>{m.stopPropagation(),n.remove();try{localStorage.setItem(x,"1")}catch{}E()},u=n.querySelector(".tour-dica-fechar");u.addEventListener("click",c),u.addEventListener("keydown",m=>{(m.key==="Enter"||m.key===" ")&&c(m)}),t.addEventListener("click",()=>n.remove(),{once:!0}),setTimeout(()=>n.remove(),8e3)}const D=document.querySelector(".hamburger"),B=document.querySelector(".menu-panel"),w=document.createElement("div");w.classList.add("menu-overlay"),document.body.appendChild(w);function N(){B&&B.classList.toggle("aberto"),w&&w.classList.toggle("ativo")}D&&w&&(D.addEventListener("click",N),w.addEventListener("click",N),document.addEventListener("keydown",t=>{t.key==="Escape"&&B?.classList.contains("aberto")&&N()}));const p=window.matchMedia("(min-width: 1024px)"),W=()=>{p.matches&&(B?.classList.remove("aberto"),w?.classList.remove("ativo"))};p.addEventListener("change",W),W();const O=document.getElementById("busca-topo");if(O){let t=function(){const n=O.value.trim();if(!n)return;const c=document.getElementById("busca-cursos");c?(c.value=n,c.dispatchEvent(new Event("input")),c.scrollIntoView({behavior:"smooth",block:"center"})):window.location.href=`instituicoes.html?curso=${encodeURIComponent(n)}`};O.addEventListener("keydown",n=>{n.key==="Enter"&&t()}),O.parentElement.querySelector("svg")?.addEventListener("click",t)}const Q=document.getElementById("logout-btn");Q&&Q.addEventListener("click",async()=>{try{ke(),await G(k),window.location.href="login.html"}catch(t){console.error("Erro ao fazer logout:",t),alert("Não foi possível encerrar a sessão. Tente novamente.")}});const Y=document.getElementById("chatbot-toggle"),Z=document.getElementById("chatbot-window"),K=document.getElementById("close-chat"),P=document.getElementById("chat-input"),X=document.getElementById("send-chat"),g=document.getElementById("chat-messages"),j="futuroplus_chat_historico",Se=60;function ee(){try{return JSON.parse(sessionStorage.getItem(j))||[]}catch{return[]}}function Ie(t){try{sessionStorage.setItem(j,JSON.stringify(t.slice(-Se)))}catch{}}function ke(){try{sessionStorage.removeItem(j)}catch{}}const te=()=>{Z&&Z.classList.toggle("oculta")};Y&&Y.addEventListener("click",te),K&&K.addEventListener("click",te);function Le(t){return t.replace(/\[([^\]]*)\]\((https?:\/\/[^)\s]+)\)/g,"$2").replace(/^#{1,6}\s+/gm,"").replace(/\*\*(.*?)\*\*/g,"$1").replace(/\*(.*?)\*/g,"$1").replace(/`([^`]+)`/g,"$1")}function Ce(t,n){n.split(/(https?:\/\/[^\s<>"')\]]+)/g).forEach((u,m)=>{if(m%2===0){u&&t.appendChild(document.createTextNode(u));return}const[,S,v]=u.match(/^(.*?)([.,;:!?]*)$/),T=document.createElement("a");T.href=S,T.textContent=S,T.target="_blank",T.rel="noopener noreferrer",t.appendChild(T),v&&t.appendChild(document.createTextNode(v))})}function A(t,n,{salvarNoHistorico:c=!0}={}){if(!t.trim()||!g)return;const u=document.createElement("div");if(u.classList.add("msg",n),n==="bot"?Ce(u,Le(t)):u.textContent=t,g.appendChild(u),g.scrollTop=g.scrollHeight,c){const m=ee();m.push({texto:t,remetente:n}),Ie(m)}}(function(){const n=ee();!n.length||!g||(g.innerHTML="",n.forEach(({texto:c,remetente:u})=>A(c,u,{salvarNoHistorico:!1})))})();const Ae=["https://www.vestibulinhoetec.com.br","https://www.vestibularfatec.com.br"];function Te(t){try{const n=new URL(t);return Ae.some(c=>n.origin===new URL(c).origin)}catch{return!1}}function oe(t){if(!g||!Array.isArray(t)||!t.length)return;const n=document.createElement("div");n.className="chat-links-site",t.forEach(({texto:c,url:u})=>{if(typeof u!="string")return;const m=/^[a-z0-9-]+\.html(\?[^\s<>"']*)?$/i.test(u),S=!m&&Te(u);if(!m&&!S)return;const v=document.createElement("a");v.className="chat-link-site",v.href=u,S&&(v.target="_blank",v.rel="noopener noreferrer"),v.textContent=`${c} →`,n.appendChild(v)}),n.children.length&&(g.appendChild(n),g.scrollTop=g.scrollHeight)}function _e(){if(!g)return;const t=document.createElement("div");t.classList.add("msg","bot"),t.textContent="Digitando...",t.id="typing-indicator",g.appendChild(t),g.scrollTop=g.scrollHeight}function ae(){document.getElementById("typing-indicator")?.remove()}const Be=location.hostname==="localhost"||location.hostname==="127.0.0.1"?"http://127.0.0.1:5001/futuroplus-bce54/southamerica-east1/chat_bot":"https://southamerica-east1-futuroplus-bce54.cloudfunctions.net/chat_bot";async function ne(t){A(t,"user");const n=k.currentUser;if(!n){A("Opa, essa parte eu só consigo fazer com você logado 😊 Entra na sua conta rapidinho que te ajudo na hora!","bot"),oe([{texto:"Entrar na conta",url:"login.html"}]);return}_e();try{const c=await n.getIdToken(),m=await(await fetch(Be,{method:"POST",headers:{"Content-Type":"application/json",Authorization:"Bearer "+c},body:JSON.stringify({mensagem:t})})).json();ae(),A(m.resposta||m.erro||"Erro ao obter resposta.","bot"),oe(m.links),Array.isArray(m.acoes)&&m.acoes.includes("pedir_permissao_localizacao")&&Ne()}catch(c){console.error("Erro ao chamar o chatbot:",c),ae(),A("Não consegui me conectar agora. Tente novamente.","bot")}}const re=()=>{const t=P.value.trim();t&&(P.value="",ne(t))};async function ie(t){const n=k.currentUser;if(!n)return!1;try{return await V(q(_,"usuarios",n.uid),{permissoes:{localizacaoChatbot:{concedida:t,atualizadoEm:new Date().toISOString()}}},{merge:!0}),se(t),!0}catch(c){return console.error("Erro ao salvar a permissão de localização:",c),A("Não consegui salvar sua escolha agora. Tente novamente.","bot"),!1}}function Ne(){if(!g||document.getElementById("cartao-permissao-localizacao"))return;const t=document.createElement("div");t.id="cartao-permissao-localizacao",t.className="msg bot cartao-permissao",t.innerHTML=`
            <p><strong>📍 Usar a localização do seu perfil?</strong></p>
            <p>O assistente usa só a distância até as unidades. Seu endereço não aparece na conversa, e você pode desativar quando quiser.</p>
            <div class="cartao-permissao-botoes">
                <button type="button" class="btn-permitir">Permitir</button>
                <button type="button" class="btn-agora-nao">Agora não</button>
            </div>
        `,t.querySelector(".btn-permitir").addEventListener("click",async()=>{t.querySelectorAll("button").forEach(n=>{n.disabled=!0}),await ie(!0)?(t.remove(),ne("Pode usar a localização do meu perfil.")):t.querySelectorAll("button").forEach(n=>{n.disabled=!1})}),t.querySelector(".btn-agora-nao").addEventListener("click",()=>{t.remove(),A("Tudo bem! Se preferir, me diga a sua cidade que eu procuro as unidades de lá.","bot")}),g.appendChild(t),g.scrollTop=g.scrollHeight}function se(t){const n=document.getElementById("chat-permissao-localizacao");n&&(n.hidden=!t)}const ce=document.getElementById("desativar-localizacao-chat");ce&&ce.addEventListener("click",async()=>{await ie(!1)&&A("Pronto, não vou mais usar a localização do seu perfil. Se quiser, é só me dizer uma cidade.","bot")}),X&&X.addEventListener("click",re),P&&P.addEventListener("keypress",t=>{t.key==="Enter"&&re()})});export{Ze as I};
