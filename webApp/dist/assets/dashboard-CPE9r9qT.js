const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["./tour-boas-vindas-DPK9P89P.js","./tour-motor-BEVpboCC.js","./tour-paginas-CSOTbXWZ.js"])))=>i.map(i=>d[i]);
import{s as J,f as C,a as D,d as z,b as N,e as fe,l as Be,g as Ne,c as qe,u as ze,K as Me,o as Pe,L as De}from"./firebase-config-B6zsF72T.js";import{P as Ve,T as Oe}from"./conteudo-legal-padrao-DcxCgRAC.js";import{e as He,a as Re}from"./resultado-teste-sLU03n2U.js";const Ue="modulepreload",$e=function(e,o){return new URL(e,o).href},le={},de=function(o,n,r){let s=Promise.resolve();if(n&&n.length>0){let x=function(g){return Promise.all(g.map(p=>Promise.resolve(p).then(f=>({status:"fulfilled",value:f}),f=>({status:"rejected",reason:f}))))};const l=document.getElementsByTagName("link"),c=document.querySelector("meta[property=csp-nonce]"),v=c?.nonce||c?.getAttribute("nonce");s=x(n.map(g=>{if(g=$e(g,r),g in le)return;le[g]=!0;const p=g.endsWith(".css"),f=p?'[rel="stylesheet"]':"";if(r)for(let y=l.length-1;y>=0;y--){const S=l[y];if(S.href===g&&(!p||S.rel==="stylesheet"))return}else if(document.querySelector(`link[href="${g}"]${f}`))return;const b=document.createElement("link");if(b.rel=p?"stylesheet":Ue,p||(b.as="script"),b.crossOrigin="",b.href=g,v&&b.setAttribute("nonce",v),document.head.appendChild(b),p)return new Promise((y,S)=>{b.addEventListener("load",y),b.addEventListener("error",()=>S(new Error(`Unable to preload CSS for ${g}`)))})}))}function i(l){const c=new Event("vite:preloadError",{cancelable:!0});if(c.payload=l,window.dispatchEvent(c),!c.defaultPrevented)throw l}return s.then(l=>{for(const c of l||[])c.status==="rejected"&&i(c.reason);return o().catch(i)})},je={termos:{colecaoId:"termos-de-uso",titulo:"Termos de Uso",padrao:Oe},privacidade:{colecaoId:"politica-privacidade",titulo:"Política de Privacidade",padrao:Ve}};async function ue(e){const{colecaoId:o,padrao:n}=je[e];try{const r=await fe(z(N,"configuracoes",o));return r.exists()&&r.data().versao?{versao:r.data().versao,html:r.data().html||n}:{versao:1,html:n}}catch(r){return console.error(`Erro ao buscar ${o}:`,r),{versao:1,html:n}}}function Fe(){if(document.getElementById("gt-estilos"))return;const e=document.createElement("style");e.id="gt-estilos",e.textContent=`
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
    `,document.body.appendChild(e),e}async function We(e){const[o,n]=await Promise.all([ue("termos"),ue("privacidade")]),r=e.termosAceitos||{},s={termos:(r.termos||0)<o.versao,privacidade:(r.privacidade||0)<n.versao};if(!s.termos&&!s.privacidade)return;Fe();const i=document.getElementById("gt-modal")||Je(),l={termos:o,privacidade:n},c={termos:!s.termos,privacidade:!s.privacidade};let v=null;const x=i.querySelector("#gt-checkbox"),g=i.querySelector("#gt-checkbox-label"),p=i.querySelector("#gt-continuar"),f=i.querySelector("#gt-tela-menu"),b=i.querySelector("#gt-tela-leitura"),y=i.querySelector("#gt-leitura-conteudo"),S=i.querySelector("#gt-leitura-aviso");function _(){const h=c.termos&&c.privacidade;x.disabled=!h,h&&(g.innerHTML='Li e concordo com os <a href="termos-de-uso.html" target="_blank">Termos de Uso</a> e a <a href="privacidade.html" target="_blank">Política de Privacidade</a> atualizados.')}function A(h){!h||c[h]||(c[h]=!0,i.querySelector(`#gt-btn-${h==="termos"?"termos":"privacidade"}`).classList.add("gt-btn-ler--lido"),v===h&&(S.textContent="Lido! Você já pode voltar.",S.classList.add("lido")),_())}function q(){y.scrollHeight-(y.scrollTop+y.clientHeight)<40&&A(v)}function M(h){v=h,y.innerHTML=l[h].html,y.scrollTop=0,S.classList.remove("lido"),S.textContent=c[h]?"Lido! Você já pode voltar.":"Role o texto até o fim para marcar como lido.",f.hidden=!0,b.hidden=!1,q()}i.querySelector("#gt-btn-termos").addEventListener("click",()=>M("termos")),i.querySelector("#gt-btn-privacidade").addEventListener("click",()=>M("privacidade")),i.querySelector("#gt-voltar").addEventListener("click",()=>{b.hidden=!0,f.hidden=!1}),y.addEventListener("scroll",q),x.addEventListener("change",()=>{p.disabled=!x.checked}),i.querySelector("#gt-sair").addEventListener("click",async()=>{await J(C),window.location.href="login.html"}),p.addEventListener("click",async()=>{p.disabled=!0,p.textContent="Salvando...";try{await D(z(N,"usuarios",C.currentUser.uid),{termosAceitos:{termos:o.versao,privacidade:n.versao,aceitoEm:new Date().toISOString()}},{merge:!0}),i.close(),i.remove()}catch(h){console.error("Erro ao registrar aceite dos termos:",h),p.disabled=!1,p.textContent="Continuar usando o site",alert("Não consegui registrar seu aceite agora. Tente de novo.")}}),i.addEventListener("cancel",h=>h.preventDefault()),_(),i.showModal()}function Ge(){if(document.getElementById("ge-estilos"))return;const e=document.createElement("style");e.id="ge-estilos",e.textContent=`
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
    `,document.head.appendChild(e)}function Ke(e){const o=document.createElement("dialog");return o.id="ge-modal",o.className="ge-modal",o.innerHTML=`
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
    `,document.body.appendChild(o),o}async function Ze(e){if(e.emailVerified)return!0;Ge();const o=document.getElementById("ge-modal")||Ke(e.email),n=o.querySelector("#ge-status"),r=o.querySelector("#ge-ja-confirmei"),s=o.querySelector("#ge-reenviar"),i=o.querySelector("#ge-sair");return r.addEventListener("click",async()=>{n.textContent="",n.className="ge-status",r.disabled=!0,r.textContent="Verificando...";try{if(await e.reload(),C.currentUser.emailVerified){o.close(),o.remove(),window.location.reload();return}n.textContent="Ainda não encontramos a confirmação. Clique no link do e-mail e tente de novo.",n.className="ge-status erro"}catch(l){console.error("Erro ao checar confirmação de e-mail:",l),n.textContent="Não consegui checar agora. Tente de novo.",n.className="ge-status erro"}finally{r.disabled=!1,r.textContent="Já confirmei, continuar"}}),s.addEventListener("click",async()=>{s.disabled=!0;const l=s.textContent;s.textContent="Enviando...";try{await Be(e),n.textContent="E-mail reenviado!",n.className="ge-status ok"}catch(c){console.error("Erro ao reenviar e-mail de verificação:",c),n.textContent=c.code==="auth/too-many-requests"?"Muitas tentativas — espera um pouco antes de reenviar de novo.":"Não consegui reenviar agora. Tente de novo em instantes.",n.className="ge-status erro"}finally{s.disabled=!1,s.textContent=l}}),i.addEventListener("click",async()=>{await J(C),window.location.href="login.html"}),o.addEventListener("cancel",l=>l.preventDefault()),o.addEventListener("close",()=>{C.currentUser?.emailVerified||o.showModal()}),o.showModal(),!1}const Qe=[{rotulo:"cidade no cadastro",completo:e=>!!(e.cadastro.cidade||e.cadastro.cep)},{rotulo:"seu momento nos estudos",completo:e=>!!e.perfil.escolaridade},{rotulo:"sua formação",completo:e=>!!(e.perfil.formacao||e.perfil.semFormacao)},{rotulo:"o curso que você quer",completo:e=>!!e.perfil.cursoDesejado},{rotulo:"suas áreas de interesse",completo:e=>(e.perfil.modalidades||[]).length>0},{rotulo:"seu estilo de aprendizado",completo:e=>(e.perfil.estilos||[]).length>0},{rotulo:"seu objetivo",completo:e=>!!e.perfil.objetivo},{rotulo:"fazer um teste",completo:e=>!!e.temTeste}];function Xe(e){const o={modalidades:[],estilos:[],...e?.perfil||{}},n=!!(He(e)||Re(e)),r={cadastro:e||{},perfil:o,temTeste:n},s=Qe.filter(i=>!i.completo(r)).map(i=>i.rotulo);return{completo:s.length===0,faltando:s}}const Ye="notificacoes",pe="futuroplus_notif_vistas",ge="futuroplus_notif_limpas_em",he="futuroplus_notif_sino_vistas_em";function P(e){return String(e??"").replace(/[&<>"']/g,o=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[o])}function et(e){const o=new Date(e||"");return Number.isNaN(o.getTime())?"":o.toLocaleDateString("pt-BR",{day:"2-digit",month:"short"})}function be(){try{return JSON.parse(localStorage.getItem(pe))||[]}catch{return[]}}function tt(e){try{const o=be();o.includes(e)||(o.push(e),localStorage.setItem(pe,JSON.stringify(o)))}catch{}}function ot(){try{return localStorage.getItem(ge)||""}catch{return""}}function at(e){try{localStorage.setItem(ge,e)}catch{}}function nt(){try{return localStorage.getItem(he)||""}catch{return""}}function rt(e){try{localStorage.setItem(he,e)}catch{}}let F=null;function U(){return F||(F=Ne(qe(N,Ye)).then(e=>e.docs.map(o=>({id:o.id,...o.data()})).filter(o=>o.ativo!==!1).sort((o,n)=>(n.criadoEm||"").localeCompare(o.criadoEm||"")))),F}function $(e,o){const n=e.publico||"logados";return n==="todos"?!0:o?n==="logados":n==="deslogados"}function it(){if(document.getElementById("nt-estilos"))return;const e=document.createElement("style");e.id="nt-estilos",e.textContent=`
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
    `,document.head.appendChild(e)}function st(){const e=document.createElement("dialog");return e.id="nt-modal",e.className="nt-modal",e.innerHTML=`
        <div class="nt-cabecalho"><h2 id="nt-titulo"></h2></div>
        <div class="nt-corpo" id="nt-corpo"></div>
        <div class="nt-acoes"><button type="button" id="nt-fechar" class="nt-btn-primario">Entendi</button></div>
    `,document.body.appendChild(e),e}async function ve(e,o,n){const r=e.find(c=>!o.has(c.id));if(!r)return;it();const s=document.getElementById("nt-modal")||st();s.querySelector("#nt-titulo").textContent=r.titulo||"Aviso",s.querySelector("#nt-corpo").textContent=r.mensagem||"";let i=!1;async function l(){if(!i){i=!0,s.close(),s.remove();try{await n(r.id)}catch(c){console.error("Erro ao marcar notificação como vista:",c)}}}s.querySelector("#nt-fechar").addEventListener("click",l),s.addEventListener("cancel",c=>{c.preventDefault(),l()}),s.showModal()}async function ct(e){const o=(await U()).filter(r=>r.mostrarModal&&$(r,!0)),n=new Set(e.notificacoesModalVistas||[]);await ve(o,n,r=>ze(z(N,"usuarios",C.currentUser.uid),{notificacoesModalVistas:Me(r)}))}async function lt(){const e=(await U()).filter(n=>n.mostrarModal&&$(n,!1)),o=new Set(be());await ve(e,o,n=>tt(n))}function dt(e){const{completo:o,faltando:n}=Xe(e);return o?null:{id:"perfil-incompleto",titulo:"Complete seu perfil",mensagem:`Falta ${n.join(", ")}. Perfis completos recebem recomendações de curso e de unidade mais certeiras.`,criadoEm:new Date().toISOString(),link:"perfil.html"}}function ut(){return{id:"visitante-criar-conta",titulo:"Crie sua conta ou entre",mensagem:"Salve os resultados dos seus testes e receba recomendações de curso e unidade personalizadas.",criadoEm:new Date().toISOString(),acoes:[{rotulo:"Entrar",href:"login.html"},{rotulo:"Criar conta",href:"cadastro.html",destaque:!0}]}}function mt(e){return e?.length?`<div class="notif-item-acoes">${e.map(o=>`
        <a class="notif-item-botao${o.destaque?" notif-item-botao--destaque":""}" href="${P(o.href)}">${P(o.rotulo)}</a>`).join("")}</div>`:""}function ft(e){const o=`
            <strong class="notif-item-titulo">${P(e.titulo||"Aviso")}</strong>
            <p class="notif-item-mensagem">${P(e.mensagem||"")}</p>
            ${mt(e.acoes)}
            <span class="notif-item-data">${et(e.criadoEm)}</span>`;return e.link&&!e.acoes?`<a class="notif-item notif-item--link" href="${P(e.link)}">${o}</a>`:`<div class="notif-item">${o}</div>`}const pt='<p class="notif-vazio">Nenhuma notificação por enquanto.</p>';async function ye(e,o,n,r,s){const i=document.getElementById("notif-lista"),l=document.getElementById("notif-ponto"),c=document.getElementById("notif-botao"),v=document.getElementById("notif-limpar");if(!i||!l||!v)return async()=>{};const x=e.filter(f=>(f.criadoEm||"")>o);let g=n;function p(){const f=x.filter(b=>(b.criadoEm||"")>g).length;i.innerHTML=x.length?x.map(ft).join(""):pt,l.textContent=f>9?"9+":String(f),l.hidden=f===0,c?.classList.toggle("bell-icon--tem-notificacao",f>0),v.hidden=x.length===0,v.textContent=`Limpar (${x.length})`}return p(),v.onclick=async()=>{if(confirm("Isso limpa todas as notificações da lista. Você pode continuar recebendo novas depois. Confirma?")){v.disabled=!0;try{const f=new Date().toISOString();await r(f),x.length=0,p()}catch(f){console.error("Erro ao limpar notificações:",f),alert("Não consegui limpar as notificações agora. Tente de novo.")}finally{v.disabled=!1}}},async function(){if(!x.some(y=>(y.criadoEm||"")>g))return;const b=new Date().toISOString();g=b,p();try{await s(b)}catch(y){console.error("Erro ao marcar notificações como vistas:",y)}}}async function gt(e,o){const n=(await U()).filter(i=>i.mostrarSino&&$(i,!0)),r=dt(o),s=r?[r,...n]:n;return ye(s,o.notificacoesLimpasEm||"",o.notificacoesVistasEm||"",i=>D(z(N,"usuarios",e),{notificacoesLimpasEm:i},{merge:!0}),i=>D(z(N,"usuarios",e),{notificacoesVistasEm:i},{merge:!0}))}async function ht(){const e=(await U()).filter(r=>r.mostrarSino&&$(r,!1)),n=[ut(),...e];return ye(n,ot(),nt(),async r=>at(r),async r=>rt(r))}const Ee="futuroplus_chat_ja_abriu",bt=45e3,vt=0,yt=8e3;function R(){try{return sessionStorage.getItem(Ee)==="1"}catch{return!1}}function me(){try{sessionStorage.setItem(Ee,"1")}catch{}}function Et({pausar:e=()=>!1}={}){const o=document.getElementById("chatbot-toggle");if(!o||R())return;const n=document.createElement("span");n.className="chat-notificacao-bolinha",o.appendChild(n),o.classList.add("chat-btn-pulsando");function r(){if(R()||e()||document.getElementById("chat-balao-fala"))return;const c=document.createElement("div");c.id="chat-balao-fala",c.className="chat-balao-fala",c.innerHTML='👋 Posso te ajudar a achar seu curso! <button type="button" class="chat-balao-fechar" aria-label="Fechar">×</button>',document.body.appendChild(c),c.querySelector(".chat-balao-fechar").addEventListener("click",v=>{v.stopPropagation(),c.remove(),me(),n.remove(),o.classList.remove("chat-btn-pulsando"),clearTimeout(s),clearInterval(l)}),setTimeout(()=>c.remove(),yt)}let s;function i(){if(!R()){if(e()){s=setTimeout(i,1e3);return}s=setTimeout(r,vt)}}i();const l=setInterval(()=>{R()||e()||(o.classList.add("chat-btn-aceno"),setTimeout(()=>o.classList.remove("chat-btn-aceno"),900))},bt);o.addEventListener("click",()=>{me(),n.remove(),o.classList.remove("chat-btn-pulsando"),document.getElementById("chat-balao-fala")?.remove(),clearTimeout(s),clearInterval(l)},{once:!0})}document.addEventListener("DOMContentLoaded",()=>{"serviceWorker"in navigator&&navigator.serviceWorker.getRegistrations().then(t=>{for(let a of t)a.unregister()});function e(t){return(t||"?").trim().split(/\s+/).filter(Boolean).slice(0,2).map(d=>d[0].toUpperCase()).join("")||"?"}let o=async()=>{};Pe(C,async t=>{const a=document.getElementById("nomeUsuario"),d=document.getElementById("avatar-menu"),m=document.getElementById("avatar-iniciais"),u=document.getElementById("nav-auth"),k=document.getElementById("menu-nav-auth"),w=document.getElementById("notif-menu");if(t){if(console.log("Usuário logado UID:",t.uid),!await Ze(t))return;let se="";try{const H=z(N,"usuarios",t.uid),ce=await fe(H);if(ce.exists()){const L=ce.data();console.log("Dados encontrados no Firestore:",L),L.exclusao&&(await D(H,{exclusao:De()},{merge:!0}),alert("Você tinha pedido para excluir sua conta. Como você entrou de novo, esse pedido foi cancelado e sua conta continua normal.")),We(L).catch(T=>console.error("Erro ao checar termos:",T)),ct(L).catch(T=>console.error("Erro ao checar notificações:",T)),gt(t.uid,L).then(T=>{o=T}).catch(T=>console.error("Erro ao carregar o sino de notificações:",T)),se=[L.nome,L.sobrenome].filter(Boolean).join(" ").trim(),L.nome&&a?a.textContent=L.nome:L.nome||console.warn("O campo 'nome' não existe no documento do Firestore."),L.admin===!0&&document.querySelectorAll(".menu-admin-area").forEach(T=>{T.hidden=!1}),re(L.permissoes?.localizacaoChatbot?.concedida===!0)}else console.warn("Nenhum documento encontrado na coleção 'usuarios' para este UID.")}catch(H){console.error("Erro ao buscar dados no Firestore:",H)}m&&(m.textContent=e(se||t.email)),d&&(d.hidden=!1),w&&(w.hidden=!1),u&&(u.hidden=!0),k&&(k.hidden=!0),b()}else console.log("Nenhum usuário logado. Modo visitante ativado."),a&&(a.textContent="ESTUDANTE"),lt().catch(I=>console.error("Erro ao checar notificações:",I)),ht().then(I=>{o=I}).catch(I=>console.error("Erro ao carregar o sino de notificações:",I)),d&&(d.hidden=!0),w&&(w.hidden=!1),u&&(u.hidden=!1),k&&(k.hidden=!1),s(),c(),y()});const n=document.getElementById("avatar-botao"),r=document.getElementById("avatar-dropdown");function s(){!r||r.hidden||(r.hidden=!0,n?.setAttribute("aria-expanded","false"))}n&&r&&(n.addEventListener("click",t=>{t.stopPropagation(),c();const a=r.hidden;r.hidden=!a,n.setAttribute("aria-expanded",String(a))}),document.addEventListener("click",t=>{!r.hidden&&!t.target.closest("#avatar-menu")&&s()}),document.addEventListener("keydown",t=>{t.key==="Escape"&&s()}));const i=document.getElementById("notif-botao"),l=document.getElementById("notif-dropdown");function c(){!l||l.hidden||(l.hidden=!0,i?.setAttribute("aria-expanded","false"))}i&&l&&(i.addEventListener("click",t=>{t.stopPropagation(),s();const a=l.hidden;l.hidden=!a,i.setAttribute("aria-expanded",String(a)),a&&o()}),document.addEventListener("click",t=>{!l.hidden&&!t.target.closest("#notif-menu")&&c()}),document.addEventListener("keydown",t=>{t.key==="Escape"&&c()})),Et({pausar:()=>window.__tourAtivo===!0});async function v(){if(document.getElementById("card-vocacional")){const{iniciarTourBoasVindas:d}=await de(async()=>{const{iniciarTourBoasVindas:m}=await import("./tour-boas-vindas-DPK9P89P.js");return{iniciarTourBoasVindas:m}},__vite__mapDeps([0,1]),import.meta.url);d({forcar:!0});return}const{iniciarTourDaPagina:t}=await de(async()=>{const{iniciarTourDaPagina:d}=await import("./tour-paginas-CSOTbXWZ.js");return{iniciarTourDaPagina:d}},__vite__mapDeps([2,1]),import.meta.url);await t({forcar:!0})||(window.location.href="index.html?tour=1")}document.getElementById("btn-repetir-tour")?.addEventListener("click",v),document.getElementById("btn-tour-menu")?.addEventListener("click",()=>{_?.classList.contains("aberto")&&q(),v()});const x="futuroplus_tour_dica_fechada",g=[document.getElementById("btn-repetir-tour"),document.getElementById("btn-tour-menu")].filter(Boolean);let p=!1;function f(){try{return localStorage.getItem(x)==="1"}catch{return!1}}function b(){g.forEach(t=>t.classList.remove("tour-cta-destaque"))}function y(){if(f()||(g.forEach(u=>u.classList.add("tour-cta-destaque")),p))return;p=!0;const t=document.getElementById("btn-repetir-tour");if(!t||window.__tourAtivo||document.getElementById("tour-dica-balao"))return;const a=document.createElement("div");a.id="tour-dica-balao",a.className="tour-dica-balao",a.innerHTML='Clique em mim 😎 <span class="tour-dica-fechar" role="button" tabindex="0" aria-label="Fechar">×</span>',t.appendChild(a);const d=u=>{u.stopPropagation(),a.remove();try{localStorage.setItem(x,"1")}catch{}b()},m=a.querySelector(".tour-dica-fechar");m.addEventListener("click",d),m.addEventListener("keydown",u=>{(u.key==="Enter"||u.key===" ")&&d(u)}),t.addEventListener("click",()=>a.remove(),{once:!0}),setTimeout(()=>a.remove(),8e3)}const S=document.querySelector(".hamburger"),_=document.querySelector(".menu-panel"),A=document.createElement("div");A.classList.add("menu-overlay"),document.body.appendChild(A);function q(){_&&_.classList.toggle("aberto"),A&&A.classList.toggle("ativo")}S&&A&&(S.addEventListener("click",q),A.addEventListener("click",q),document.addEventListener("keydown",t=>{t.key==="Escape"&&_?.classList.contains("aberto")&&q()}));const M=window.matchMedia("(min-width: 1024px)"),h=()=>{M.matches&&(_?.classList.remove("aberto"),A?.classList.remove("ativo"))};M.addEventListener("change",h),h();const V=document.getElementById("busca-topo");if(V){let t=function(){const a=V.value.trim();if(!a)return;const d=document.getElementById("busca-cursos");d?(d.value=a,d.dispatchEvent(new Event("input")),d.scrollIntoView({behavior:"smooth",block:"center"})):window.location.href=`cursos.html?curso=${encodeURIComponent(a)}`};V.addEventListener("keydown",a=>{a.key==="Enter"&&t()}),V.parentElement.querySelector("svg")?.addEventListener("click",t)}const W=document.getElementById("logout-btn");W&&W.addEventListener("click",async()=>{try{Se(),await J(C),window.location.href="login.html"}catch(t){console.error("Erro ao fazer logout:",t),alert("Não foi possível encerrar a sessão. Tente novamente.")}});const G=document.getElementById("chatbot-toggle"),K=document.getElementById("chatbot-window"),Z=document.getElementById("close-chat"),O=document.getElementById("chat-input"),Q=document.getElementById("send-chat"),E=document.getElementById("chat-messages"),j="futuroplus_chat_historico",xe=60;function X(){try{return JSON.parse(sessionStorage.getItem(j))||[]}catch{return[]}}function we(t){try{sessionStorage.setItem(j,JSON.stringify(t.slice(-xe)))}catch{}}function Se(){try{sessionStorage.removeItem(j)}catch{}}const Y=()=>{K&&K.classList.toggle("oculta")};G&&G.addEventListener("click",Y),Z&&Z.addEventListener("click",Y);function Ie(t){return t.replace(/\[([^\]]*)\]\((https?:\/\/[^)\s]+)\)/g,"$2").replace(/^#{1,6}\s+/gm,"").replace(/\*\*(.*?)\*\*/g,"$1").replace(/\*(.*?)\*/g,"$1").replace(/`([^`]+)`/g,"$1")}function Le(t,a){a.split(/(https?:\/\/[^\s<>"')\]]+)/g).forEach((m,u)=>{if(u%2===0){m&&t.appendChild(document.createTextNode(m));return}const[,k,w]=m.match(/^(.*?)([.,;:!?]*)$/),I=document.createElement("a");I.href=k,I.textContent=k,I.target="_blank",I.rel="noopener noreferrer",t.appendChild(I),w&&t.appendChild(document.createTextNode(w))})}function B(t,a,{salvarNoHistorico:d=!0}={}){if(!t.trim()||!E)return;const m=document.createElement("div");if(m.classList.add("msg",a),a==="bot"?Le(m,Ie(t)):m.textContent=t,E.appendChild(m),E.scrollTop=E.scrollHeight,d){const u=X();u.push({texto:t,remetente:a}),we(u)}}(function(){const a=X();!a.length||!E||(E.innerHTML="",a.forEach(({texto:d,remetente:m})=>B(d,m,{salvarNoHistorico:!1})))})();const ke=["https://www.vestibulinhoetec.com.br","https://www.vestibularfatec.com.br"];function Ce(t){try{const a=new URL(t);return ke.some(d=>a.origin===new URL(d).origin)}catch{return!1}}function ee(t){if(!E||!Array.isArray(t)||!t.length)return;const a=document.createElement("div");a.className="chat-links-site",t.forEach(({texto:d,url:m})=>{if(typeof m!="string")return;const u=/^[a-z0-9-]+\.html(\?[^\s<>"']*)?$/i.test(m),k=!u&&Ce(m);if(!u&&!k)return;const w=document.createElement("a");w.className="chat-link-site",w.href=m,k&&(w.target="_blank",w.rel="noopener noreferrer"),w.textContent=`${d} →`,a.appendChild(w)}),a.children.length&&(E.appendChild(a),E.scrollTop=E.scrollHeight)}function Ae(){if(!E)return;const t=document.createElement("div");t.classList.add("msg","bot"),t.textContent="Digitando...",t.id="typing-indicator",E.appendChild(t),E.scrollTop=E.scrollHeight}function te(){document.getElementById("typing-indicator")?.remove()}const Te=location.hostname==="localhost"||location.hostname==="127.0.0.1"?"http://127.0.0.1:5001/futuroplus-bce54/southamerica-east1/chat_bot":"https://southamerica-east1-futuroplus-bce54.cloudfunctions.net/chat_bot";async function oe(t){B(t,"user");const a=C.currentUser;if(!a){B("Opa, essa parte eu só consigo fazer com você logado 😊 Entra na sua conta rapidinho que te ajudo na hora!","bot"),ee([{texto:"Entrar na conta",url:"login.html"}]);return}Ae();try{const d=await a.getIdToken(),u=await(await fetch(Te,{method:"POST",headers:{"Content-Type":"application/json",Authorization:"Bearer "+d},body:JSON.stringify({mensagem:t})})).json();te(),B(u.resposta||u.erro||"Erro ao obter resposta.","bot"),ee(u.links),Array.isArray(u.acoes)&&u.acoes.includes("pedir_permissao_localizacao")&&_e()}catch(d){console.error("Erro ao chamar o chatbot:",d),te(),B("Não consegui me conectar agora. Tente novamente.","bot")}}const ae=()=>{const t=O.value.trim();t&&(O.value="",oe(t))};async function ne(t){const a=C.currentUser;if(!a)return!1;try{return await D(z(N,"usuarios",a.uid),{permissoes:{localizacaoChatbot:{concedida:t,atualizadoEm:new Date().toISOString()}}},{merge:!0}),re(t),!0}catch(d){return console.error("Erro ao salvar a permissão de localização:",d),B("Não consegui salvar sua escolha agora. Tente novamente.","bot"),!1}}function _e(){if(!E||document.getElementById("cartao-permissao-localizacao"))return;const t=document.createElement("div");t.id="cartao-permissao-localizacao",t.className="msg bot cartao-permissao",t.innerHTML=`
            <p><strong>📍 Usar a localização do seu perfil?</strong></p>
            <p>O assistente usa só a distância até as unidades. Seu endereço não aparece na conversa, e você pode desativar quando quiser.</p>
            <div class="cartao-permissao-botoes">
                <button type="button" class="btn-permitir">Permitir</button>
                <button type="button" class="btn-agora-nao">Agora não</button>
            </div>
        `,t.querySelector(".btn-permitir").addEventListener("click",async()=>{t.querySelectorAll("button").forEach(a=>{a.disabled=!0}),await ne(!0)?(t.remove(),oe("Pode usar a localização do meu perfil.")):t.querySelectorAll("button").forEach(a=>{a.disabled=!1})}),t.querySelector(".btn-agora-nao").addEventListener("click",()=>{t.remove(),B("Tudo bem! Se preferir, me diga a sua cidade que eu procuro as unidades de lá.","bot")}),E.appendChild(t),E.scrollTop=E.scrollHeight}function re(t){const a=document.getElementById("chat-permissao-localizacao");a&&(a.hidden=!t)}const ie=document.getElementById("desativar-localizacao-chat");ie&&ie.addEventListener("click",async()=>{await ne(!1)&&B("Pronto, não vou mais usar a localização do seu perfil. Se quiser, é só me dizer uma cidade.","bot")}),Q&&Q.addEventListener("click",ae),O&&O.addEventListener("keypress",t=>{t.key==="Enter"&&ae()})});export{Qe as I};
