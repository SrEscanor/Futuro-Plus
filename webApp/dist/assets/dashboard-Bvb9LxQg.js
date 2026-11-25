const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["./tour-boas-vindas-DRKtaQGj.js","./tour-motor-BeDtj6px.js","./tour-paginas-Cnz_yJ4H.js"])))=>i.map(i=>d[i]);
import{_ as de}from"./preload-helper-PPVm8Dsz.js";import{s as G,a as k,f as $,d as D,b as A,g as pe,v as $e,c as ge,e as he,q as ze,P as Oe,O as Pe,u as He,a3 as Re,o as Ue,h as je}from"./firebase-config-jDGsFXrl.js";import{P as Fe,T as Je}from"./conteudo-legal-padrao-BqhUlQtQ.js";import{a as Ge,b as We}from"./resultado-teste-DDM5ddzJ.js";import{a as be,e as ve}from"./notificacoes-util-BE-pPj56.js";import{a as Ze}from"./vlibras-_gXUT26Z.js";const Ke={termos:{colecaoId:"termos-de-uso",titulo:"Termos de Uso",padrao:Je},privacidade:{colecaoId:"politica-privacidade",titulo:"Política de Privacidade",padrao:Fe}};async function ue(e){const{colecaoId:t,padrao:n}=Ke[e];try{const a=await pe(D(A,"configuracoes",t));return a.exists()&&a.data().versao?{versao:a.data().versao,html:a.data().html||n}:{versao:1,html:n}}catch(a){return console.error(`Erro ao buscar ${t}:`,a),{versao:1,html:n}}}function Qe(){if(document.getElementById("gt-estilos"))return;const e=document.createElement("style");e.id="gt-estilos",e.textContent=`
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
    `,document.head.appendChild(e)}function Xe(){const e=document.createElement("dialog");return e.id="gt-modal",e.className="gt-modal",e.innerHTML=`
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
    `,document.body.appendChild(e),e}async function Ye(e){const[t,n]=await Promise.all([ue("termos"),ue("privacidade")]),a=e.termosAceitos||{},i={termos:(a.termos||0)<t.versao,privacidade:(a.privacidade||0)<n.versao};if(!i.termos&&!i.privacidade)return;Qe();const c=document.getElementById("gt-modal")||Xe(),u={termos:t,privacidade:n},l={termos:!i.termos,privacidade:!i.privacidade};let s=null;const g=c.querySelector("#gt-checkbox"),I=c.querySelector("#gt-checkbox-label"),y=c.querySelector("#gt-continuar"),L=c.querySelector("#gt-tela-menu"),h=c.querySelector("#gt-tela-leitura"),E=c.querySelector("#gt-leitura-conteudo"),T=c.querySelector("#gt-leitura-aviso");function V(){const p=l.termos&&l.privacidade;g.disabled=!p,p&&(I.innerHTML='Li e concordo com os <a href="termos-de-uso.html" target="_blank">Termos de Uso</a> e a <a href="privacidade.html" target="_blank">Política de Privacidade</a> atualizados.')}function q(p){!p||l[p]||(l[p]=!0,c.querySelector(`#gt-btn-${p==="termos"?"termos":"privacidade"}`).classList.add("gt-btn-ler--lido"),s===p&&(T.textContent="Lido! Você já pode voltar.",T.classList.add("lido")),V())}function x(){E.scrollHeight-(E.scrollTop+E.clientHeight)<40&&q(s)}function N(p){s=p,E.innerHTML=u[p].html,E.scrollTop=0,T.classList.remove("lido"),T.textContent=l[p]?"Lido! Você já pode voltar.":"Role o texto até o fim para marcar como lido.",L.hidden=!0,h.hidden=!1,x()}c.querySelector("#gt-btn-termos").addEventListener("click",()=>N("termos")),c.querySelector("#gt-btn-privacidade").addEventListener("click",()=>N("privacidade")),c.querySelector("#gt-voltar").addEventListener("click",()=>{h.hidden=!0,L.hidden=!1}),E.addEventListener("scroll",x),g.addEventListener("change",()=>{y.disabled=!g.checked}),c.querySelector("#gt-sair").addEventListener("click",async()=>{await G(k),window.location.href="login.html"}),y.addEventListener("click",async()=>{y.disabled=!0,y.textContent="Salvando...";try{await $(D(A,"usuarios",k.currentUser.uid),{termosAceitos:{termos:t.versao,privacidade:n.versao,aceitoEm:new Date().toISOString()}},{merge:!0}),c.close(),c.remove()}catch(p){console.error("Erro ao registrar aceite dos termos:",p),y.disabled=!1,y.textContent="Continuar usando o site",alert("Não consegui registrar seu aceite agora. Tente de novo.")}}),c.addEventListener("cancel",p=>p.preventDefault()),V(),c.showModal()}function et(){if(document.getElementById("ge-estilos"))return;const e=document.createElement("style");e.id="ge-estilos",e.textContent=`
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
    `,document.head.appendChild(e)}function tt(e){const t=document.createElement("dialog");return t.id="ge-modal",t.className="ge-modal",t.innerHTML=`
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
    `,document.body.appendChild(t),t}async function ot(e){if(e.emailVerified)return!0;et();const t=document.getElementById("ge-modal")||tt(e.email),n=t.querySelector("#ge-status"),a=t.querySelector("#ge-ja-confirmei"),i=t.querySelector("#ge-reenviar"),c=t.querySelector("#ge-sair");return a.addEventListener("click",async()=>{n.textContent="",n.className="ge-status",a.disabled=!0,a.textContent="Verificando...";try{if(await e.reload(),k.currentUser.emailVerified){t.close(),t.remove(),window.location.reload();return}n.textContent="Ainda não encontramos a confirmação. Clique no link do e-mail e tente de novo.",n.className="ge-status erro"}catch(u){console.error("Erro ao checar confirmação de e-mail:",u),n.textContent="Não consegui checar agora. Tente de novo.",n.className="ge-status erro"}finally{a.disabled=!1,a.textContent="Já confirmei, continuar"}}),i.addEventListener("click",async()=>{i.disabled=!0;const u=i.textContent;i.textContent="Enviando...";try{await $e(e),n.textContent="E-mail reenviado!",n.className="ge-status ok"}catch(l){console.error("Erro ao reenviar e-mail de verificação:",l),n.textContent=l.code==="auth/too-many-requests"?"Muitas tentativas — espera um pouco antes de reenviar de novo.":"Não consegui reenviar agora. Tente de novo em instantes.",n.className="ge-status erro"}finally{i.disabled=!1,i.textContent=u}}),c.addEventListener("click",async()=>{await G(k),window.location.href="login.html"}),t.addEventListener("cancel",u=>u.preventDefault()),t.addEventListener("close",()=>{k.currentUser?.emailVerified||t.showModal()}),t.showModal(),!1}const at=[{rotulo:"cidade no cadastro",completo:e=>!!(e.cadastro.cidade||e.cadastro.cep)},{rotulo:"seu momento nos estudos",completo:e=>!!e.perfil.escolaridade},{rotulo:"sua formação",completo:e=>!!(e.perfil.formacao||e.perfil.semFormacao)},{rotulo:"o curso que você quer",completo:e=>!!e.perfil.cursoDesejado},{rotulo:"suas áreas de interesse",completo:e=>(e.perfil.modalidades||[]).length>0},{rotulo:"seu estilo de aprendizado",completo:e=>(e.perfil.estilos||[]).length>0},{rotulo:"seu objetivo",completo:e=>!!e.perfil.objetivo},{rotulo:"fazer um teste",completo:e=>!!e.temTeste}];function nt(e){const t={modalidades:[],estilos:[],...e?.perfil||{}},n=!!(Ge(e)||We(e)),a={cadastro:e||{},perfil:t,temTeste:n},i=at.filter(c=>!c.completo(a)).map(c=>c.rotulo);return{completo:i.length===0,faltando:i}}const rt="notificacoes",ye="futuroplus_notif_vistas",Ee="futuroplus_notif_limpas_em",xe="futuroplus_notif_sino_vistas_em";function M(e){return String(e??"").replace(/[&<>"']/g,t=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[t])}function we(e){const t=new Date(e||"");return Number.isNaN(t.getTime())?"":t.toLocaleDateString("pt-BR",{day:"2-digit",month:"short"})}function Se(){try{return JSON.parse(localStorage.getItem(ye))||[]}catch{return[]}}function it(e){try{const t=Se();t.includes(e)||(t.push(e),localStorage.setItem(ye,JSON.stringify(t)))}catch{}}function st(){try{return localStorage.getItem(Ee)||""}catch{return""}}function ct(e){try{localStorage.setItem(Ee,e)}catch{}}function lt(){try{return localStorage.getItem(xe)||""}catch{return""}}function dt(e){try{localStorage.setItem(xe,e)}catch{}}let J=null;function R(){if(!J){const e=new Date().toISOString();J=ge(he(A,rt)).then(t=>t.docs.map(n=>({id:n.id,...n.data()})).filter(n=>n.ativo!==!1).filter(n=>!n.publicarEm||n.publicarEm<=e).sort((n,a)=>(a.criadoEm||"").localeCompare(n.criadoEm||"")))}return J}function U(e,t){const n=e.publico||"logados";return n==="todos"?!0:t?n==="logados":n==="deslogados"}function ut(){if(document.getElementById("nt-estilos"))return;const e=document.createElement("style");e.id="nt-estilos",e.textContent=`
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
    `,document.head.appendChild(e)}function mt(){const e=document.createElement("dialog");return e.id="nt-modal",e.className="nt-modal",e.innerHTML=`
        <div class="nt-cabecalho"><h2 id="nt-titulo"></h2></div>
        <div class="nt-corpo" id="nt-corpo"></div>
        <div class="nt-acoes">
            <a id="nt-ler" class="nt-btn-primario" hidden>Ler a notícia</a>
            <button type="button" id="nt-fechar" class="nt-btn-primario">Entendi</button>
        </div>
    `,document.body.appendChild(e),e}async function ke(e,t,n){const a=e.find(s=>!t.has(s.id));if(!a)return;ut();const i=document.getElementById("nt-modal")||mt();i.querySelector("#nt-titulo").textContent=a.titulo||"Aviso",i.querySelector("#nt-corpo").textContent=a.mensagem||"";let c=!1;async function u(){if(!c){c=!0,i.close(),i.remove();try{await n(a.id)}catch(s){console.error("Erro ao marcar notificação como vista:",s)}}}i.querySelector("#nt-fechar").addEventListener("click",u),i.addEventListener("cancel",s=>{s.preventDefault(),u()});const l=be(a.link);if(l){const s=i.querySelector("#nt-ler"),g=i.querySelector("#nt-fechar");s.href=l,s.hidden=!1,g.textContent="Agora não",g.className="nt-btn-secundario",ve(l)?(s.target="_blank",s.rel="noopener noreferrer",s.addEventListener("click",()=>{setTimeout(u,0)})):s.addEventListener("click",async I=>{I.preventDefault(),await Promise.race([u(),new Promise(y=>setTimeout(y,1500))]),window.location.href=l})}i.showModal()}async function ft(e){const t=(await R()).filter(a=>a.mostrarModal&&U(a,!0)),n=new Set(e.notificacoesModalVistas||[]);await ke(t,n,a=>He(D(A,"usuarios",k.currentUser.uid),{notificacoesModalVistas:Re(a)}))}async function pt(){const e=(await R()).filter(n=>n.mostrarModal&&U(n,!1)),t=new Set(Se());await ke(e,t,n=>it(n))}function gt(e){const{completo:t,faltando:n}=nt(e);return t?null:{id:"perfil-incompleto",titulo:"Complete seu perfil",mensagem:`Falta ${n.join(", ")}. Perfis completos recebem recomendações de curso e de unidade mais certeiras.`,criadoEm:new Date().toISOString(),link:"perfil.html"}}function ht(){return{id:"visitante-criar-conta",titulo:"Crie sua conta ou entre",mensagem:"Salve os resultados dos seus testes e receba recomendações de curso e unidade personalizadas.",criadoEm:new Date().toISOString(),acoes:[{rotulo:"Entrar",href:"login.html"},{rotulo:"Criar conta",href:"cadastro.html",destaque:!0}]}}function bt(e){return e?.length?`<div class="notif-item-acoes">${e.map(t=>`
        <a class="notif-item-botao${t.destaque?" notif-item-botao--destaque":""}" href="${M(t.href)}">${M(t.rotulo)}</a>`).join("")}</div>`:""}function vt(e){const t=Math.max(0,Math.min(5,Number(e)||0));return t?`<span class="notif-item-estrelas" role="img" aria-label="nota ${t} de 5">${"★".repeat(t)}<i>${"★".repeat(5-t)}</i></span> `:""}function yt(e){const t=be(e.link),n=`
            ${e.equipe?'<span class="notif-item-tag">Para a equipe</span>':""}
            <strong class="notif-item-titulo">${M(e.titulo||"Aviso")}</strong>
            <p class="notif-item-mensagem">${vt(e.estrelas)}${M(e.mensagem||"")}</p>
            ${bt(e.acoes)}
            ${t&&e.noticia?'<span class="notif-item-ler">Ler a notícia →</span>':""}
            ${t&&e.chamada?`<span class="notif-item-ler">${M(e.chamada)}</span>`:""}
            <span class="notif-item-data">${e.equipe?Et(e.criadoEm):we(e.criadoEm)}</span>`,a=ve(t)?' target="_blank" rel="noopener noreferrer"':"",i=`notif-item${e.equipe?" notif-item--equipe":""}`;return t&&!e.acoes?`<a class="${i} notif-item--link" href="${M(t)}"${a}>${n}</a>`:`<div class="${i}">${n}</div>`}function Et(e){const t=Math.round((Date.now()-new Date(e||"").getTime())/6e4);return Number.isNaN(t)?"":t<2?"agora há pouco":t<60?`há ${t} min`:t<1440?`há ${Math.round(t/60)} h`:we(e)}function me(e,t){const n=String(e||"").replace(/\s+/g," ").trim();return n.length<=t?n:`${n.slice(0,t-1).trimEnd()}…`}async function xt(e){if(e.admin!==!0)return[];try{const t=await ge(ze(he(A,"avisos_admin"),Oe("em","desc"),Pe(5))),n=e.avisosAdminVistosEm||"";return t.docs.map(a=>({id:a.id,...a.data()})).filter(a=>!a.apagada).map(a=>{const i=a.em?.toDate?a.em.toDate().toISOString():"",c=a.unidadeNome||"uma instituição",u=/^(etec|fatec)\b/i.test(c),l=a.tipo==="avaliacao",s=a.nome||"Alguém";return{id:`equipe-${a.id}`,equipe:!0,jaVista:!!n&&i<=n,titulo:l?`Nova avaliação ${u?"na":"em"} ${c}`:`Nova dúvida ${u?"sobre a":"sobre"} ${c}`,estrelas:l?a.nota:0,mensagem:l?`${s}${a.curso?` · ${a.curso}`:""}: “${me(a.texto,120)}”`:`${s}: “${me(a.texto,140)}”`,chamada:!l&&!Number(a.respostas)?"Responder →":"",criadoEm:i,link:a.link||""}})}catch(t){return console.error("Erro ao ler os avisos da equipe:",t),[]}}const wt='<p class="notif-vazio">Nenhuma notificação por enquanto.</p>';async function Ie(e,t,n,a,i){const c=document.getElementById("notif-lista"),u=document.getElementById("notif-ponto"),l=document.getElementById("notif-botao"),s=document.getElementById("notif-limpar");if(!c||!u||!s)return async()=>{};const g=e.filter(h=>(h.criadoEm||"")>t);let I=n;const y=h=>!h.jaVista&&(h.criadoEm||"")>I;function L(){const h=g.filter(y).length;c.innerHTML=g.length?g.map(yt).join(""):wt,u.textContent=h>9?"9+":String(h),u.hidden=h===0,l?.classList.toggle("bell-icon--tem-notificacao",h>0),s.hidden=g.length===0,s.textContent=`Limpar (${g.length})`}return L(),s.onclick=async()=>{if(confirm("Isso limpa todas as notificações da lista. Você pode continuar recebendo novas depois. Confirma?")){s.disabled=!0;try{const h=new Date().toISOString();await a(h),g.length=0,L()}catch(h){console.error("Erro ao limpar notificações:",h),alert("Não consegui limpar as notificações agora. Tente de novo.")}finally{s.disabled=!1}}},async function(){if(!g.some(y))return;const E=new Date().toISOString();I=E,L();try{await i(E)}catch(T){console.error("Erro ao marcar notificações como vistas:",T)}}}async function St(e,t){const[n,a]=await Promise.all([R(),xt(t)]),i=[...a,...n.filter(s=>s.mostrarSino&&U(s,!0))].sort((s,g)=>(g.criadoEm||"").localeCompare(s.criadoEm||"")),c=gt(t),u=c?[c,...i]:i,l=s=>a.length||t.admin===!0?{notificacoesVistasEm:s,avisosAdminVistosEm:s}:{notificacoesVistasEm:s};return Ie(u,t.notificacoesLimpasEm||"",t.notificacoesVistasEm||"",s=>$(D(A,"usuarios",e),{notificacoesLimpasEm:s},{merge:!0}),s=>$(D(A,"usuarios",e),l(s),{merge:!0}))}async function kt(){const e=(await R()).filter(a=>a.mostrarSino&&U(a,!1)),n=[ht(),...e];return Ie(n,st(),lt(),async a=>ct(a),async a=>dt(a))}const Le="futuroplus_chat_ja_abriu",It=45e3,Lt=0,Ct=8e3;function H(){try{return sessionStorage.getItem(Le)==="1"}catch{return!1}}function fe(){try{sessionStorage.setItem(Le,"1")}catch{}}function At({pausar:e=()=>!1}={}){const t=document.getElementById("chatbot-toggle");if(!t||H())return;const n=document.createElement("span");n.className="chat-notificacao-bolinha",t.appendChild(n),t.classList.add("chat-btn-pulsando");function a(){if(H()||e()||document.getElementById("chat-balao-fala"))return;const l=document.createElement("div");l.id="chat-balao-fala",l.className="chat-balao-fala",l.innerHTML='👋 Posso te ajudar a achar seu curso! <button type="button" class="chat-balao-fechar" aria-label="Fechar">×</button>',document.body.appendChild(l),l.querySelector(".chat-balao-fechar").addEventListener("click",s=>{s.stopPropagation(),l.remove(),fe(),n.remove(),t.classList.remove("chat-btn-pulsando"),clearTimeout(i),clearInterval(u)}),setTimeout(()=>l.remove(),Ct)}let i;function c(){if(!H()){if(e()){i=setTimeout(c,1e3);return}i=setTimeout(a,Lt)}}c();const u=setInterval(()=>{H()||e()||(t.classList.add("chat-btn-aceno"),setTimeout(()=>t.classList.remove("chat-btn-aceno"),900))},It);t.addEventListener("click",()=>{fe(),n.remove(),t.classList.remove("chat-btn-pulsando"),document.getElementById("chat-balao-fala")?.remove(),clearTimeout(i),clearInterval(u)},{once:!0})}Ze();document.addEventListener("DOMContentLoaded",()=>{"serviceWorker"in navigator&&navigator.serviceWorker.getRegistrations().then(o=>{for(let r of o)r.unregister()});function e(o){return(o||"?").trim().split(/\s+/).filter(Boolean).slice(0,2).map(d=>d[0].toUpperCase()).join("")||"?"}let t=async()=>{};function n(o,r=""){const d=document.getElementById("saudacao");d&&(o==="visitante"?d.innerHTML='Boas-vindas ao <span class="marca-futuro">Futuro<span class="marca-mais">+</span><span class="marca-exclamacao">!</span></span>':d.textContent=r?`Olá, ${r} 👋`:"Olá! 👋",document.body.dataset.sessao=o)}Ue(k,async o=>{const r=document.getElementById("avatar-menu"),d=document.getElementById("avatar-iniciais"),m=document.getElementById("nav-auth"),f=document.getElementById("menu-nav-auth"),w=document.getElementById("notif-menu");if(o){if(console.log("Usuário logado UID:",o.uid),!await ot(o))return;let B="",F="";try{const P=D(A,"usuarios",o.uid),le=await pe(P);if(le.exists()){const S=le.data();console.log("Dados encontrados no Firestore:",S),S.exclusao&&(await $(P,{exclusao:je()},{merge:!0}),alert("Você tinha pedido para excluir sua conta. Como você entrou de novo, esse pedido foi cancelado e sua conta continua normal.")),Ye(S).catch(C=>console.error("Erro ao checar termos:",C)),ft(S).catch(C=>console.error("Erro ao checar notificações:",C)),St(o.uid,S).then(C=>{t=C}).catch(C=>console.error("Erro ao carregar o sino de notificações:",C)),B=[S.nome,S.sobrenome].filter(Boolean).join(" ").trim(),F=String(S.nome||"").trim(),F||console.warn("O campo 'nome' não existe no documento do Firestore."),S.admin===!0&&document.querySelectorAll(".menu-admin-area").forEach(C=>{C.hidden=!1}),se(S.permissoes?.localizacaoChatbot?.concedida===!0)}else console.warn("Nenhum documento encontrado na coleção 'usuarios' para este UID.")}catch(P){console.error("Erro ao buscar dados no Firestore:",P)}n("logado",F),d&&(d.textContent=e(B||o.email)),r&&(r.hidden=!1),w&&(w.hidden=!1),m&&(m.hidden=!0),f&&(f.hidden=!0),E()}else console.log("Nenhum usuário logado. Modo visitante ativado."),n("visitante"),pt().catch(v=>console.error("Erro ao checar notificações:",v)),kt().then(v=>{t=v}).catch(v=>console.error("Erro ao carregar o sino de notificações:",v)),r&&(r.hidden=!0),w&&(w.hidden=!1),m&&(m.hidden=!1),f&&(f.hidden=!1),c(),s(),T()});const a=document.getElementById("avatar-botao"),i=document.getElementById("avatar-dropdown");function c(){!i||i.hidden||(i.hidden=!0,a?.setAttribute("aria-expanded","false"))}a&&i&&(a.addEventListener("click",o=>{o.stopPropagation(),s(),document.getElementById("tour-dica-balao")?.remove();const r=i.hidden;i.hidden=!r,a.setAttribute("aria-expanded",String(r))}),document.addEventListener("click",o=>{!i.hidden&&!o.target.closest("#avatar-menu")&&c()}),document.addEventListener("keydown",o=>{o.key==="Escape"&&c()}));const u=document.getElementById("notif-botao"),l=document.getElementById("notif-dropdown");function s(){!l||l.hidden||(l.hidden=!0,u?.setAttribute("aria-expanded","false"))}u&&l&&(u.addEventListener("click",o=>{o.stopPropagation(),c(),document.getElementById("tour-dica-balao")?.remove();const r=l.hidden;l.hidden=!r,u.setAttribute("aria-expanded",String(r)),r&&t()}),document.addEventListener("click",o=>{!l.hidden&&!o.target.closest("#notif-menu")&&s()}),document.addEventListener("keydown",o=>{o.key==="Escape"&&s()})),At({pausar:()=>window.__tourAtivo===!0});async function g(){if(document.getElementById("card-vocacional")){const{iniciarTourBoasVindas:d}=await de(async()=>{const{iniciarTourBoasVindas:m}=await import("./tour-boas-vindas-DRKtaQGj.js");return{iniciarTourBoasVindas:m}},__vite__mapDeps([0,1]),import.meta.url);d({forcar:!0});return}const{iniciarTourDaPagina:o}=await de(async()=>{const{iniciarTourDaPagina:d}=await import("./tour-paginas-Cnz_yJ4H.js");return{iniciarTourDaPagina:d}},__vite__mapDeps([2,1]),import.meta.url);await o({forcar:!0})||(window.location.href="index.html?tour=1")}document.getElementById("btn-repetir-tour")?.addEventListener("click",g),document.getElementById("btn-tour-menu")?.addEventListener("click",()=>{q?.classList.contains("aberto")&&N(),g()});const I="futuroplus_tour_dica_fechada",y=[document.getElementById("btn-repetir-tour"),document.getElementById("btn-tour-menu")].filter(Boolean);let L=!1;function h(){try{return localStorage.getItem(I)==="1"}catch{return!1}}function E(){y.forEach(o=>o.classList.remove("tour-cta-destaque"))}function T(){if(h()||(y.forEach(f=>f.classList.add("tour-cta-destaque")),L))return;L=!0;const o=document.getElementById("btn-repetir-tour");if(!o||window.__tourAtivo||document.getElementById("tour-dica-balao"))return;const r=document.createElement("div");r.id="tour-dica-balao",r.className="tour-dica-balao",r.innerHTML='Clique em mim 😎 <span class="tour-dica-fechar" role="button" tabindex="0" aria-label="Fechar">×</span>',o.appendChild(r);const d=f=>{f.stopPropagation(),r.remove();try{localStorage.setItem(I,"1")}catch{}E()},m=r.querySelector(".tour-dica-fechar");m.addEventListener("click",d),m.addEventListener("keydown",f=>{(f.key==="Enter"||f.key===" ")&&d(f)}),o.addEventListener("click",()=>r.remove(),{once:!0}),setTimeout(()=>r.remove(),8e3)}const V=document.querySelector(".hamburger"),q=document.querySelector(".menu-panel"),x=document.createElement("div");x.classList.add("menu-overlay"),document.body.appendChild(x);function N(){q&&q.classList.toggle("aberto"),x&&x.classList.toggle("ativo")}V&&x&&(V.addEventListener("click",N),x.addEventListener("click",N),document.addEventListener("keydown",o=>{o.key==="Escape"&&q?.classList.contains("aberto")&&N()}));const p=window.matchMedia("(min-width: 1024px)"),W=()=>{p.matches&&(q?.classList.remove("aberto"),x?.classList.remove("ativo"))};p.addEventListener("change",W),W();const z=document.getElementById("busca-topo");if(z){let o=function(){const r=z.value.trim();if(!r)return;const d=document.getElementById("busca-cursos");d?(d.value=r,d.dispatchEvent(new Event("input")),d.scrollIntoView({behavior:"smooth",block:"center"})):window.location.href=`instituicoes.html?curso=${encodeURIComponent(r)}`};z.addEventListener("keydown",r=>{r.key==="Enter"&&o()}),z.parentElement.querySelector("svg")?.addEventListener("click",o)}const Z=document.getElementById("logout-btn");Z&&Z.addEventListener("click",async()=>{try{Te(),await G(k),window.location.href="login.html"}catch(o){console.error("Erro ao fazer logout:",o),alert("Não foi possível encerrar a sessão. Tente novamente.")}});const K=document.getElementById("chatbot-toggle"),Q=document.getElementById("chatbot-window"),X=document.getElementById("close-chat"),O=document.getElementById("chat-input"),Y=document.getElementById("send-chat"),b=document.getElementById("chat-messages"),j="futuroplus_chat_historico",Ce=60;function ee(){try{return JSON.parse(sessionStorage.getItem(j))||[]}catch{return[]}}function Ae(o){try{sessionStorage.setItem(j,JSON.stringify(o.slice(-Ce)))}catch{}}function Te(){try{sessionStorage.removeItem(j)}catch{}}const te=()=>{Q&&Q.classList.toggle("oculta")};K&&K.addEventListener("click",te),X&&X.addEventListener("click",te);function _e(o){return o.replace(/\[([^\]]*)\]\((https?:\/\/[^)\s]+)\)/g,"$2").replace(/^#{1,6}\s+/gm,"").replace(/\*\*(.*?)\*\*/g,"$1").replace(/\*(.*?)\*/g,"$1").replace(/`([^`]+)`/g,"$1")}function Be(o,r){r.split(/(https?:\/\/[^\s<>"')\]]+)/g).forEach((m,f)=>{if(f%2===0){m&&o.appendChild(document.createTextNode(m));return}const[,w,v]=m.match(/^(.*?)([.,;:!?]*)$/),B=document.createElement("a");B.href=w,B.textContent=w,B.target="_blank",B.rel="noopener noreferrer",o.appendChild(B),v&&o.appendChild(document.createTextNode(v))})}function _(o,r,{salvarNoHistorico:d=!0}={}){if(!o.trim()||!b)return;const m=document.createElement("div");if(m.classList.add("msg",r),r==="bot"?Be(m,_e(o)):m.textContent=o,b.appendChild(m),b.scrollTop=b.scrollHeight,d){const f=ee();f.push({texto:o,remetente:r}),Ae(f)}}(function(){const r=ee();!r.length||!b||(b.innerHTML="",r.forEach(({texto:d,remetente:m})=>_(d,m,{salvarNoHistorico:!1})))})();const qe=["https://www.vestibulinhoetec.com.br","https://www.vestibularfatec.com.br"];function Ne(o){try{const r=new URL(o);return qe.some(d=>r.origin===new URL(d).origin)}catch{return!1}}function oe(o){if(!b||!Array.isArray(o)||!o.length)return;const r=document.createElement("div");r.className="chat-links-site",o.forEach(({texto:d,url:m})=>{if(typeof m!="string")return;const f=/^[a-z0-9-]+\.html(\?[^\s<>"']*)?$/i.test(m),w=!f&&Ne(m);if(!f&&!w)return;const v=document.createElement("a");v.className="chat-link-site",v.href=m,w&&(v.target="_blank",v.rel="noopener noreferrer"),v.textContent=`${d} →`,r.appendChild(v)}),r.children.length&&(b.appendChild(r),b.scrollTop=b.scrollHeight)}function De(){if(!b)return;const o=document.createElement("div");o.classList.add("msg","bot"),o.textContent="Digitando...",o.id="typing-indicator",b.appendChild(o),b.scrollTop=b.scrollHeight}function ae(){document.getElementById("typing-indicator")?.remove()}const Me=location.hostname==="localhost"||location.hostname==="127.0.0.1"?"http://127.0.0.1:5001/futuroplus-bce54/southamerica-east1/chat_bot":"https://southamerica-east1-futuroplus-bce54.cloudfunctions.net/chat_bot";async function ne(o){_(o,"user");const r=k.currentUser;if(!r){_("Opa, essa parte eu só consigo fazer com você logado 😊 Entra na sua conta rapidinho que te ajudo na hora!","bot"),oe([{texto:"Entrar na conta",url:"login.html"}]);return}De();try{const d=await r.getIdToken(),f=await(await fetch(Me,{method:"POST",headers:{"Content-Type":"application/json",Authorization:"Bearer "+d},body:JSON.stringify({mensagem:o})})).json();ae(),_(f.resposta||f.erro||"Erro ao obter resposta.","bot"),oe(f.links),Array.isArray(f.acoes)&&f.acoes.includes("pedir_permissao_localizacao")&&Ve()}catch(d){console.error("Erro ao chamar o chatbot:",d),ae(),_("Não consegui me conectar agora. Tente novamente.","bot")}}const re=()=>{const o=O.value.trim();o&&(O.value="",ne(o))};async function ie(o){const r=k.currentUser;if(!r)return!1;try{return await $(D(A,"usuarios",r.uid),{permissoes:{localizacaoChatbot:{concedida:o,atualizadoEm:new Date().toISOString()}}},{merge:!0}),se(o),!0}catch(d){return console.error("Erro ao salvar a permissão de localização:",d),_("Não consegui salvar sua escolha agora. Tente novamente.","bot"),!1}}function Ve(){if(!b||document.getElementById("cartao-permissao-localizacao"))return;const o=document.createElement("div");o.id="cartao-permissao-localizacao",o.className="msg bot cartao-permissao",o.innerHTML=`
            <p><strong>📍 Usar a localização do seu perfil?</strong></p>
            <p>O assistente usa só a distância até as unidades. Seu endereço não aparece na conversa, e você pode desativar quando quiser.</p>
            <div class="cartao-permissao-botoes">
                <button type="button" class="btn-permitir">Permitir</button>
                <button type="button" class="btn-agora-nao">Agora não</button>
            </div>
        `,o.querySelector(".btn-permitir").addEventListener("click",async()=>{o.querySelectorAll("button").forEach(r=>{r.disabled=!0}),await ie(!0)?(o.remove(),ne("Pode usar a localização do meu perfil.")):o.querySelectorAll("button").forEach(r=>{r.disabled=!1})}),o.querySelector(".btn-agora-nao").addEventListener("click",()=>{o.remove(),_("Tudo bem! Se preferir, me diga a sua cidade que eu procuro as unidades de lá.","bot")}),b.appendChild(o),b.scrollTop=b.scrollHeight}function se(o){const r=document.getElementById("chat-permissao-localizacao");r&&(r.hidden=!o)}const ce=document.getElementById("desativar-localizacao-chat");ce&&ce.addEventListener("click",async()=>{await ie(!1)&&_("Pronto, não vou mais usar a localização do seu perfil. Se quiser, é só me dizer uma cidade.","bot")}),Y&&Y.addEventListener("click",re),O&&O.addEventListener("keypress",o=>{o.key==="Enter"&&re()})});export{at as I};
