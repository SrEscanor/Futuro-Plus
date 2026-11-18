import{h as T,d as C,c as $,v as da,x as pa,o as ma,g as Z,q as K,e as j,y as fa,a as ha,k as ga,z as va,l as $a,u as N,j as q,b as ba,A as xa,i as X,f as Ca,B as ya}from"./firebase-config-XQh5hlny.js";/* empty css              */import"./dashboard-DlCsTCaU.js";import{n as J,p as Ea,m as Ma,o as E,L as Sa,e as c,a as qa}from"./card-unidade-DxBgZOlB.js";import"./preload-helper-PPVm8Dsz.js";import"./conteudo-legal-padrao-DcxCgRAC.js";import"./resultado-teste-BcjYGcG_.js";import"./notificacoes-util-BMqxtxne.js";const x={comentario:{min:10,max:600},pergunta:{min:10,max:300},resposta:{min:5,max:600}},wa=5,Aa=5,Da=8,_="/central-cps.webp",Pa=/(https?:\/\/|www\.|\b[\w-]+\.(com|net|org|br|io|me|ly|gg)\b)/i;function F(a,{min:t,max:e}){const o=String(a||"").trim();return o.length<t?`Escreva pelo menos ${t} caracteres.`:o.length>e?`Use no máximo ${e} caracteres.`:Pa.test(o)?"Tire o link do texto: aqui só vale texto.":""}function y(a){return String(a||"").trim().split(/\s+/)[0]||""}function La(a){const t=(a.tipo||"").trim().toLowerCase();return t==="etec"||t==="fatec"?"A ":""}function ka(a){const t=String(a||"").trim();return!t||/[.!?]$/.test(t)?t:`${t}.`}function D(a){const t=(a.tipo||"").trim(),e=new Map;for(const s of a.cursos||[]){if(!s?.nome)continue;const i=J(s.nome);e.has(i)||e.set(i,{nome:s.nome.trim(),slug:Ea(s.nome,t),modalidades:[]});const r=Ma(s.categoria||""),l=e.get(i);l.modalidades.some(p=>p.chave===r.chave)||l.modalidades.push({chave:r.chave,rotulo:r.rotulo})}const o=[...e.values()];return o.forEach(s=>s.modalidades.sort((i,r)=>E(i.chave)-E(r.chave))),o.sort((s,i)=>E(s.modalidades[0].chave)-E(i.modalidades[0].chave)||s.nome.localeCompare(i.nome,"pt-BR"))}function w(a){return a.length<=1?a.join(""):`${a.slice(0,-1).join(", ")} e ${a.at(-1)}`}function Oa(a,t=D(a)){const e=new Set(t.flatMap(d=>d.modalidades.map(v=>v.chave))),o=(a.tipo||"").trim().toLowerCase(),s=[];(o==="fatec"||e.has("superior"))&&s.push("Ensino Superior"),["tecnico","especializacao","medio","ams","semipresencial","ead"].some(d=>e.has(d))&&o!=="fatec"&&s.push("Técnico"),(e.has("medio")||e.has("ams"))&&o!=="fatec"&&s.push("Ensino Médio");const i=(a.cursos||[]).map(d=>J(d?.categoria)),r=i.some(d=>/\b(ead|online|distancia)\b/.test(d)),l=i.some(d=>d.includes("semipresencial")),m=[i.some(d=>!/\b(ead|online|distancia)\b/.test(d)&&!d.includes("semipresencial"))&&"Presencial",l&&"Semipresencial",r&&"EaD"].filter(Boolean);return[s.length?{icone:"nivel",texto:w(s)}:null,o==="etec"||o==="fatec"?{icone:"publica",texto:"Pública e gratuita"}:null,m.length?{icone:"forma",texto:w(m)}:null].filter(Boolean)}const Ra={medio:"ensino médio com técnico",tecnico:"cursos técnicos",especializacao:"especialização técnica",ead:"cursos a distância",semipresencial:"cursos semipresenciais",ams:"AMS (médio, técnico e superior em sequência)",superior:"cursos superiores de tecnologia"};function za(a,t=D(a)){const e=(a.tipo||"").trim().toLowerCase(),o=e==="fatec"?"uma faculdade de tecnologia pública e gratuita do Centro Paula Souza":e==="etec"?"uma escola técnica estadual, pública e gratuita, do Centro Paula Souza":"uma instituição de ensino",s=a.municipio?`, em ${a.municipio}`:"",i=[`${La(a)}${a.nome} é ${o}${s}.`];if(a.historico&&i.push(ka(a.historico)),t.length){const r=[...new Set(t.flatMap(p=>p.modalidades.map(m=>m.chave)))].sort((p,m)=>E(p)-E(m)).map(p=>Ra[p]).filter(Boolean),l=t.length===1?"1 curso":`${t.length} cursos`;i.push(r.length?`Hoje oferece ${l}, entre ${w(r)}.`:`Hoje oferece ${l}.`)}return i.join(" ")}function Ta(a){const t=a.municipio?`${a.municipio} - SP`:"",e=String(a.endereco||"").replace(/\s+/g," ").trim();if(!e)return{rua:"",resto:t,cep:""};let o="";const s=e.split(/ - /).filter(d=>{const v=d.match(/^CEP:?\s*([\d.-]+)/i);return v&&(o=v[1]),!v}),i=s.findIndex(d=>/\/\s*[A-Z]{2}$/.test(d)),r=i>=0?s[i].replace(/\s*\/\s*/," - "):t,l=i>=0?s.slice(0,i):s,p=l.length>1?l.at(-1):"";return{rua:l.length>1?l.slice(0,-1).join(" - "):l[0]||"",resto:[p,r].filter(Boolean).join(" · "),cep:o}}function ja(a){const t=[a.nome,a.endereco].filter(Boolean).join(", ").replace(/\s+/g," ").trim(),{lat:e,lng:o}=a.localizacao||{},s=a.endereco?t:e!=null&&o!=null?`${e},${o}`:t;return s?`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(s)}`:""}function Na(a){const t=String(a||"").match(/\(?(\d{2})\)?\s*(\d{4,5})[-\s]?(\d{4})/);return t?`tel:+55${t[1]}${t[2]}${t[3]}`:""}function Fa(a){const t=String(a||"").match(/\(?\d{2}\)?\s*\d{4,5}[-\s]?\d{4}/);return t?t[0].trim():String(a||"").trim()}function A(a){const t=String(a||"").trim();if(!t)return"";const e=/^https?:\/\//i.test(t)?t:`https://${t}`;try{const o=new URL(e);return o.protocol==="https:"||o.protocol==="http:"?o.href:""}catch{return""}}function Ba(a){return String(a||"").replace(/^https?:\/\//i,"").replace(/^www\./i,"").replace(/\/$/,"")}function Ha(a){const t=a.foto?.url||"";return/^https:\/\//i.test(t)?t:""}function Ua(a){return Number(a||0).toLocaleString("pt-BR",{minimumFractionDigits:1,maximumFractionDigits:1})}function Ia(a){const t=Math.max(0,Math.min(5,Number(a)||0));return[1,2,3,4,5].map(e=>{const o=t-(e-1);return o>=.75?"cheia":o>=.25?"meia":"vazia"})}function _a(a){return a===1?"1 avaliação":`${a} avaliações`}function O(a){if(!a)return null;if(typeof a.toDate=="function")return a.toDate();const t=a instanceof Date?a:new Date(a);return Number.isNaN(t.getTime())?null:t}function B(a){const t=O(a);return t?t.toLocaleDateString("pt-BR",{day:"numeric",month:"short",year:"numeric"}):""}const L=a=>!!a?.certificado,W=a=>!!(a?.certificado||a?.admin),Va=a=>!!a?.logado;function Y(a){if(a.equipe)return"Equipe Futuro+";const t=String(a.curso||"").trim(),e=a.ano?`concluiu em ${a.ano}`:"";return[t,e].filter(Boolean).join(" · ")||"Estudou aqui"}function Qa(a){return Object.entries(a?.respostas||{}).map(([t,e])=>({uid:t,...e})).sort((t,e)=>(O(t.em)?.getTime()||0)-(O(e.em)?.getTime()||0))}function Ga(a,t=D(a)){const o=(a.tipo||"").trim().toLowerCase()==="fatec"?"Pelo Vestibular Fatec. As inscrições, as datas e o manual ficam no site vestibular.fatec.sp.gov.br.":"Pelo Vestibulinho Etec. As inscrições, as datas e o manual ficam no site vestibulinho.etec.sp.gov.br.",s=t.map(r=>r.nome),i=s.length?`${s.length===1?"Hoje é 1 curso":`Hoje são ${s.length} cursos`}: ${w(s)}. A lista completa, com o que se aprende em cada um, fica em "Cursos oferecidos", nesta página.`:"O cadastro desta unidade ainda não tem a lista de cursos.";return[{id:"fixa-ingresso",texto:"Como faço para estudar aqui?",fixa:!0,respostas:{futuro:{equipe:!0,nome:"Futuro+",texto:o}}},{id:"fixa-gratuita",texto:"Precisa pagar pelo curso?",fixa:!0,respostas:{futuro:{equipe:!0,nome:"Futuro+",texto:"Não. As Etecs e Fatecs são escolas públicas do Centro Paula Souza, do Governo do Estado de São Paulo, e os cursos são gratuitos. As regras da inscrição ficam no manual de cada processo seletivo."}}},{id:"fixa-cursos",texto:"Quais cursos tem aqui?",fixa:!0,respostas:{futuro:{equipe:!0,nome:"Futuro+",texto:i}}}]}const aa=a=>j($,"instituicoes",a,"comentarios"),ta=a=>j($,"instituicoes",a,"perguntas");async function ea(a,t,e,o){const s=[ga(t,"desc")];e&&s.push(va(e)),s.push($a(o+1));const i=await Z(K(a,...s)),r=i.docs.slice(0,o);return{docs:r,cursor:r.at(-1)||null,haMais:i.docs.length>o}}async function Za(a){const t=await T(C($,"instituicoes",a));return t.exists()?{id:t.id,...t.data()}:null}async function Ka(a){const t=await da(aa(a),{media:pa("nota"),total:ya()}),{media:e,total:o}=t.data();return{media:e||0,total:o||0}}async function oa(a,{depois:t=null}={}){const{docs:e,cursor:o,haMais:s}=await ea(aa(a),"criadoEm",t,wa);return{itens:e.map(i=>({uid:i.id,...i.data()})),cursor:o,haMais:s}}async function Xa(a,t){const e=await T(C($,"instituicoes",a,"comentarios",t));return e.exists()?{uid:e.id,...e.data()}:null}async function Ja(a,t,{texto:e,nota:o},s=null){const i=C($,"instituicoes",a,"comentarios",t.uid),r={texto:e.trim(),nota:o,nome:t.nome,curso:t.certificado.titulo,ano:t.certificado.anoConclusao??null,certificadoId:t.certificado.id};return s?(await N(i,{...r,editadoEm:q()}),{...s,...r,uid:t.uid,editadoEm:new Date}):(await ba(i,{...r,criadoEm:q()}),{...r,uid:t.uid,criadoEm:new Date})}async function Wa(a,t){await X(C($,"instituicoes",a,"comentarios",t))}async function sa(a,{depois:t=null}={}){const{docs:e,cursor:o,haMais:s}=await ea(ta(a),"criadaEm",t,Aa);return{itens:e.map(i=>({id:i.id,...i.data()})),cursor:o,haMais:s}}async function Ya(a,t,e){const o={texto:e.trim(),autorUid:t.uid,nome:t.nome,criadaEm:q(),respostas:{}},s=await xa(ta(a),o);return{...o,id:s.id,criadaEm:new Date}}async function at(a,t,e,o){const s=e.certificado?{texto:o.trim(),nome:e.nome,curso:e.certificado.titulo,ano:e.certificado.anoConclusao??null,certificadoId:e.certificado.id,equipe:!1}:{texto:o.trim(),nome:e.nome,equipe:!0};return await N(C($,"instituicoes",a,"perguntas",t),{[`respostas.${e.uid}`]:{...s,em:q()}}),{...s,em:new Date}}async function tt(a,t,e){await N(C($,"instituicoes",a,"perguntas",t),{[`respostas.${e}`]:Ca()})}async function et(a,t){await X(C($,"instituicoes",a,"perguntas",t))}function ot(a,t){return ma(ha,async e=>{if(!e){t({logado:!1});return}const o={logado:!0,uid:e.uid,nome:"",admin:!1,certificado:null};try{const[s,i]=await Promise.all([T(C($,"usuarios",e.uid)),Z(K(j($,"usuarios",e.uid,"certificados"),fa("verificacao.unidadeLida","==",a)))]),r=s.exists()?s.data():{},l=i.docs.find(p=>p.data().verificacao?.nomeConfere===!0);t({...o,nome:typeof r.nome=="string"?r.nome:"",admin:r.admin===!0,certificado:l?{id:l.id,titulo:l.data().titulo||"",anoConclusao:l.data().anoConclusao??null}:null})}catch(s){console.error("Erro ao ler a conta:",s),t(o)}})}const f=(a,t=20)=>`<svg width="${t}" height="${t}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${a}</svg>`,u={local:f('<path d="M12 21s-7-6.2-7-12a7 7 0 0 1 14 0c0 5.8-7 12-7 12z"/><circle cx="12" cy="9" r="2.6"/>',16),capelo:f('<path d="M2 9.5 12 5l10 4.5-10 4.5L2 9.5z"/><path d="M6 11.6V16c0 1.4 2.7 3 6 3s6-1.6 6-3v-4.4"/><path d="M22 9.5v5"/>'),telefone:f('<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/>'),estrela:f('<path d="m12 2.8 2.8 5.8 6.4.9-4.6 4.5 1.1 6.3L12 17.3l-5.7 3 1.1-6.3-4.6-4.5 6.4-.9L12 2.8z"/>'),mapa:f('<path d="M12 21s-7-6.2-7-12a7 7 0 0 1 14 0c0 5.8-7 12-7 12z"/><circle cx="12" cy="9" r="2.6"/>'),livro:f('<path d="M2 5.5A2.5 2.5 0 0 1 4.5 3H11v17H4.5A2.5 2.5 0 0 0 2 22.5z"/><path d="M22 5.5A2.5 2.5 0 0 0 19.5 3H13v17h6.5a2.5 2.5 0 0 1 2.5 2.5z"/>'),balao:f('<path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 9 9 0 0 1-3.9-.9L3 20.5l1.5-4.6A8.4 8.4 0 1 1 21 11.5z"/>'),duvida:f('<circle cx="12" cy="12" r="9.5"/><path d="M9.2 9a3 3 0 0 1 5.8 1c0 2-3 2.6-3 4.4"/><path d="M12 17.6h.01"/>'),cadeado:f('<rect x="4.5" y="10.5" width="15" height="10.5" rx="2.5"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/>'),verificado:f('<circle cx="12" cy="12" r="9.5"/><path d="m8 12.4 2.7 2.6L16.2 9.6"/>',14),seta:f('<path d="M5 12h14M13 6l6 6-6 6"/>',16),voltar:f('<path d="M19 12H5M11 6l-6 6 6 6"/>',16),externo:f('<path d="M7 17 17 7M9 7h8v8"/>',14),abrir:f('<path d="m6 9 6 6 6-6"/>',18),site:f('<circle cx="12" cy="12" r="9.5"/><path d="M2.5 12h19M12 2.5a14.6 14.6 0 0 1 0 19M12 2.5a14.6 14.6 0 0 0 0 19"/>',18),instagram:f('<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><path d="M17.5 6.5h.01"/>',18),facebook:f('<path d="M15 3h-2.5A4.5 4.5 0 0 0 8 7.5V10H5.5v4H8v7h4v-7h2.6l.9-4H12V7.8c0-.6.4-.8 1-.8h2z"/>',18),predio:f('<path d="M3 21h18M5 21V10l7-5 7 5v11"/><path d="M9.5 21v-5h5v5M9 11.5h.01M15 11.5h.01"/>',16),pessoas:f('<circle cx="9" cy="8" r="3.2"/><path d="M3 20a6 6 0 0 1 12 0"/><path d="M16 4.9a3.2 3.2 0 0 1 0 6.2M18 20a6 6 0 0 0-3-5.2"/>',16),nivel:f('<path d="M2 9.5 12 5l10 4.5-10 4.5L2 9.5z"/><path d="M6 11.6V16c0 1.4 2.7 3 6 3s6-1.6 6-3v-4.4"/>',16)},st={nivel:u.nivel,publica:u.predio,forma:u.pessoas};function na(a,t="inst-estrelas"){const e={cheia:"★",meia:"★",vazia:"★"};return`<span class="${t}" aria-hidden="true">${Ia(a).map(o=>`<span class="inst-estrela inst-estrela--${o}">${e[o]}</span>`).join("")}</span>`}const ia=a=>c((y(a)[0]||"?").toUpperCase());function nt(a,t){const e=Ha(a),o=a.municipio?`${a.municipio}, SP`:"",s=Oa(a,t);return`
        <img class="inst-capa-foto${e?"":" inst-capa-foto--padrao"}" src="${c(e||_)}" alt="" fetchpriority="high"
            onerror="this.onerror=null;this.src='${_}';this.classList.add('inst-capa-foto--padrao')">
        <div class="home-hero-conteudo inst-capa-conteudo">
            <a class="inst-capa-voltar" href="instituicoes.html">${u.voltar} Todas as instituições</a>
            <div class="inst-capa-identidade">
                <div class="inst-capa-logo">
                    <img src="${qa(a)}" alt="Logo da ${c(a.nome)}"
                        onerror="this.onerror=null;this.src='${Sa}';">
                </div>
                <div class="inst-capa-texto">
                    <h1>${c(a.nome)}</h1>
                    ${o?`<p class="inst-capa-local">${u.local} ${c(o)}</p>`:""}
                    ${s.length?`<ul class="inst-capa-selos">${s.map(i=>`
                        <li>${st[i.icone]||""}${c(i.texto)}</li>`).join("")}
                    </ul>`:""}
                </div>
            </div>
        </div>`}function it(a){return`
        <div class="home-hero-conteudo inst-capa-conteudo">
            <a class="inst-capa-voltar" href="instituicoes.html">${u.voltar} Todas as instituições</a>
            <h1>${c(a)}</h1>
        </div>`}function rt(a,t,e){const o=new Set(t.flatMap(v=>v.modalidades.map(ua=>ua.chave))),s=t.length?o.size===1?t[0].modalidades[0].rotulo:`em ${o.size} modalidades`:"Ainda sem lista no cadastro",i=Fa(a.telefone),r=Na(a.telefone),l=A(a.site),p=e&&e.total>0,m=Ta(a),d=ja(a);return`
        <article class="inst-numero">
            <span class="inst-numero-icone inst-numero-icone--azul">${u.capelo}</span>
            <div class="inst-numero-textos">
                <span class="inst-numero-rotulo">Cursos oferecidos</span>
                <a class="inst-numero-valor" href="#inst-cursos">${t.length===1?"1 curso":`${t.length} cursos`}</a>
                <span class="inst-numero-sub">${c(s)}</span>
            </div>
        </article>
        <article class="inst-numero">
            <span class="inst-numero-icone inst-numero-icone--verde">${u.telefone}</span>
            <div class="inst-numero-textos">
                <span class="inst-numero-rotulo">Contato</span>
                ${i?r?`<a class="inst-numero-valor" href="${r}">${c(i)}</a>`:`<strong class="inst-numero-valor">${c(i)}</strong>`:'<strong class="inst-numero-valor inst-numero-valor--vazio">Sem telefone</strong>'}
                ${l?`<a class="inst-numero-sub inst-numero-link" href="${c(l)}" target="_blank" rel="noopener">${c(Ba(a.site))} ${u.externo}</a>`:'<span class="inst-numero-sub">Sem site no cadastro</span>'}
            </div>
        </article>
        <article class="inst-numero">
            <span class="inst-numero-icone inst-numero-icone--ouro">${u.estrela}</span>
            <div class="inst-numero-textos">
                <span class="inst-numero-rotulo">Avaliação</span>
                ${e===void 0?`
                <strong class="inst-numero-valor inst-numero-valor--vazio">...</strong>
                <span class="inst-numero-sub">Carregando as notas</span>`:p?`
                <span class="inst-numero-valor inst-numero-valor--nota">
                    <strong>${Ua(e.media)}</strong><span class="inst-numero-de">/ 5</span>
                    ${na(e.media)}
                </span>
                <a class="inst-numero-sub inst-numero-link" href="#quem-estudou">${_a(e.total)}</a>`:`
                <strong class="inst-numero-valor inst-numero-valor--vazio">Sem notas ainda</strong>
                <span class="inst-numero-sub">Só quem estudou aqui avalia</span>`}
            </div>
        </article>
        <article class="inst-numero inst-numero--endereco">
            <span class="inst-numero-icone inst-numero-icone--coral">${u.mapa}</span>
            <div class="inst-numero-textos">
                <div class="inst-numero-cabeca">
                    <span class="inst-numero-rotulo">Endereço</span>
                    ${d?`<a class="inst-mapa" href="${c(d)}" target="_blank" rel="noopener">${u.local} Ver no Google Maps ${u.externo}</a>`:""}
                </div>
                <strong class="inst-numero-valor inst-numero-valor--texto">${c(m.rua||m.resto||"Sem endereço no cadastro")}</strong>
                ${m.rua&&m.resto?`<span class="inst-numero-sub">${c(m.resto)}</span>`:""}
            </div>
        </article>`}function ct(a){const t=String(a?.rede||"").toLowerCase(),e=A(a?.url);if(!e)return"";const o=t==="instagram"?u.instagram:t==="facebook"?u.facebook:u.site;return`<li><a class="inst-link" href="${c(e)}" target="_blank" rel="noopener">${o}${c(a.rede)}</a></li>`}function lt(a,t){const e=A(a.site),o=A(a.paginaCps),s=[e?`<li><a class="inst-link" href="${c(e)}" target="_blank" rel="noopener">${u.site}Site da unidade</a></li>`:"",...(a.redesSociais||[]).map(ct),o?`<li><a class="inst-link" href="${c(o)}" target="_blank" rel="noopener">${u.predio}Página no Centro Paula Souza</a></li>`:""].filter(Boolean);return`
        <header class="inst-cartao-topo">
            <h2><span class="inst-titulo-icone">${u.livro}</span>Sobre a instituição</h2>
        </header>
        <p class="inst-sobre-texto">${c(za(a,t))}</p>
        ${s.length?`<ul class="inst-links">${s.join("")}</ul>`:""}`}function ut(a,{todos:t=!1}={}){if(!a.length)return`
            <header class="inst-cartao-topo"><h2><span class="inst-titulo-icone">${u.capelo}</span>Cursos oferecidos</h2></header>
            <p class="inst-vazio">O cadastro desta unidade ainda não tem a lista de cursos.</p>`;const e=t?a:a.slice(0,Da),o=a.length-e.length;return`
        <header class="inst-cartao-topo">
            <h2><span class="inst-titulo-icone">${u.capelo}</span>Cursos oferecidos</h2>
            <span class="inst-contagem">${a.length===1?"1 curso":`${a.length} cursos`}</span>
        </header>
        <p class="inst-cartao-sub">Toque em um curso para ver o que se aprende e onde dá para trabalhar.</p>
        <ul class="inst-cursos">
            ${e.map(s=>`
            <li>
                <a class="inst-curso inst-curso--${s.modalidades[0].chave}" href="curso.html?c=${encodeURIComponent(s.slug)}">
                    <span class="inst-curso-icone">${u.capelo}</span>
                    <span class="inst-curso-textos">
                        <strong>${c(s.nome)}</strong>
                        <span class="inst-curso-modalidades">${s.modalidades.map(i=>`<span>${c(i.rotulo)}</span>`).join("")}</span>
                    </span>
                    <span class="inst-curso-seta">${u.seta}</span>
                </a>
            </li>`).join("")}
        </ul>
        ${o>0?`<button type="button" class="inst-ver-mais" data-acao="todos-os-cursos">Ver todos os ${a.length} cursos</button>`:""}`}function dt(a){return a?.logado?`
        <div class="inst-acesso">
            <span class="inst-acesso-icone">${u.cadeado}</span>
            <div>
                <strong>Estudou aqui?</strong>
                <p>Pendure no Mural o certificado desta unidade. Quando a leitura do certificado encontrar o nome da escola, você comenta, avalia e responde dúvidas.</p>
                <div class="inst-botoes">
                    <a class="inst-botao" href="mural.html">Ir para o Mural</a>
                </div>
            </div>
        </div>`:`
        <div class="inst-acesso">
            <span class="inst-acesso-icone">${u.cadeado}</span>
            <div>
                <strong>Estudou aqui?</strong>
                <p>Entre na sua conta e pendure no Mural o certificado desta unidade. Com ele, você comenta, avalia e responde dúvidas.</p>
                <div class="inst-botoes">
                    <a class="inst-botao" href="login.html">Entrar</a>
                    <a class="inst-botao inst-botao--claro" href="cadastro.html">Criar conta</a>
                </div>
            </div>
        </div>`}function pt(a,t=null){const e=a.certificado,o=t?.nota||0,s=t?.texto||"",i=[y(a.nome),e.titulo,e.anoConclusao].filter(Boolean).map(c);return`
        <form class="inst-form" id="form-comentario" novalidate>
            <strong class="inst-form-titulo">${t?"Editar seu comentário":"Como foi estudar aqui?"}</strong>
            <fieldset class="inst-nota-campo">
                <legend>Sua nota</legend>
                <div class="inst-nota-opcoes">
                    ${[5,4,3,2,1].map(r=>`
                    <input type="radio" id="nota-${r}" name="nota" value="${r}"${r===o?" checked":""}>
                    <label for="nota-${r}" title="${r} de 5">★<span class="sr-only">${r} de 5</span></label>`).join("")}
                </div>
            </fieldset>
            <label class="sr-only" for="comentario-texto">Seu comentário</label>
            <textarea id="comentario-texto" name="texto" rows="4" maxlength="${x.comentario.max}"
                placeholder="Conte como são as aulas, os professores e a estrutura: o que ajudaria quem está pensando em estudar aqui.">${c(s)}</textarea>
            <div class="inst-form-rodape">
                <span>Aparece como <strong>${i.join("</strong> · ")}</span>
                <span class="inst-form-contador" data-contador>${s.length}/${x.comentario.max}</span>
            </div>
            <p class="inst-form-erro" role="alert" hidden></p>
            <div class="inst-botoes">
                <button type="submit" class="inst-botao">${t?"Salvar":"Publicar"}</button>
                ${t?'<button type="button" class="inst-botao inst-botao--claro" data-acao="cancelar-comentario">Cancelar</button>':""}
            </div>
        </form>`}function V(a,{meu:t=!1,admin:e=!1,podeEditar:o=!0}={}){const s=a.editadoEm?" (editado)":"",i=t?`<div class="inst-acoes">
                ${o?'<button type="button" class="inst-acao" data-acao="editar-comentario">Editar</button>':""}
                <button type="button" class="inst-acao inst-acao--perigo" data-acao="apagar-comentario" data-uid="${c(a.uid)}">Apagar</button>
           </div>`:e?`<div class="inst-acoes"><button type="button" class="inst-acao inst-acao--perigo" data-acao="apagar-comentario" data-uid="${c(a.uid)}">Apagar (admin)</button></div>`:"";return`
        <li class="inst-comentario${t?" inst-comentario--meu":""}">
            <div class="inst-comentario-topo">
                <span class="inst-avatar">${ia(a.nome)}</span>
                <div class="inst-comentario-autor">
                    <div class="inst-autor-linha">
                        <strong>${c(y(a.nome))}${t?' <span class="inst-voce">você</span>':""}</strong>
                        <time class="inst-data">${c(B(a.criadoEm))}${s}</time>
                    </div>
                    <span class="inst-verificado">${u.verificado}${c(Y(a))}</span>
                </div>
            </div>
            ${a.nota?`<div class="inst-comentario-nota" role="img" aria-label="Nota ${a.nota} de 5">${na(a.nota)}</div>`:""}
            <p class="inst-comentario-texto">${c(a.texto)}</p>
            ${i}
        </li>`}function mt({comentarios:a=[],total:t=0,haMais:e=!1,conta:o={},meuComentario:s=null,editando:i=!1}={}){const r=a.filter(m=>!o.uid||m.uid!==o.uid);let l="";o.carregando?l="":s&&!(i&&L(o))?l=`<ol class="inst-comentarios">${V(s,{meu:!0,podeEditar:L(o)})}</ol>`:L(o)?l=pt(o,i?s:null):l=dt(o);const p=r.length?`<ol class="inst-comentarios">${r.map(m=>V(m,{admin:o.admin})).join("")}</ol>`:s?"":'<p class="inst-vazio">Ninguém comentou ainda. Quem estudou aqui pode ser a primeira pessoa a contar como foi.</p>';return`
        <header class="inst-cartao-topo">
            <h2><span class="inst-titulo-icone">${u.balao}</span>Quem estudou aqui</h2>
            <span class="inst-contagem">${t===1?"1 comentário":`${t} comentários`}</span>
        </header>
        ${l}
        ${p}
        ${e?'<button type="button" class="inst-ver-mais" data-acao="mais-comentarios">Ver mais comentários</button>':""}
        <p class="inst-rodape">Só comenta e avalia quem tem o certificado desta unidade conferido no Mural. As opiniões são de quem escreveu, não da escola.</p>`}function ft(a,t,e){const o=a.uid===e.uid&&!t.fixa,s=!t.fixa&&(o||e.admin);return`
        <li class="inst-resposta${a.equipe?" inst-resposta--equipe":""}">
            <div class="inst-resposta-autor">
                ${a.equipe?'<span class="inst-avatar inst-avatar--pequeno inst-avatar--equipe"><img src="/logo.png" alt="" width="18" height="18"></span>':`<span class="inst-avatar inst-avatar--pequeno">${ia(a.nome)}</span>`}
                <div class="inst-comentario-autor">
                    <div class="inst-autor-linha">
                        <strong>${a.equipe?"Equipe Futuro+":c(y(a.nome))}</strong>
                        ${a.em?`<time class="inst-data">${c(B(a.em))}</time>`:""}
                    </div>
                    ${a.equipe?"":`<span class="inst-verificado">${u.verificado}${c(Y(a))}</span>`}
                </div>
            </div>
            <p>${c(a.texto)}</p>
            ${s?`<div class="inst-acoes">
                ${o&&W(e)?`<button type="button" class="inst-acao" data-acao="editar-resposta" data-pergunta="${c(t.id)}">Editar</button>`:""}
                <button type="button" class="inst-acao inst-acao--perigo" data-acao="apagar-resposta" data-pergunta="${c(t.id)}" data-uid="${c(a.uid)}">${o?"Apagar":"Apagar (admin)"}</button>
            </div>`:""}
        </li>`}function ht(a,t,e=""){const o=t.admin&&!t.certificado?"Equipe Futuro+":[y(t.nome),t.certificado?.titulo,t.certificado?.anoConclusao].filter(Boolean).join(" · ");return`
        <form class="inst-form inst-form--resposta" data-form="resposta" data-pergunta="${c(a.id)}" novalidate>
            <label class="sr-only" for="resposta-${c(a.id)}">Sua resposta</label>
            <textarea id="resposta-${c(a.id)}" name="texto" rows="3" maxlength="${x.resposta.max}"
                placeholder="Responda com o que você viveu aí.">${c(e)}</textarea>
            <div class="inst-form-rodape">
                <span>Aparece como <strong>${c(o)}</strong></span>
                <span class="inst-form-contador" data-contador>${e.length}/${x.resposta.max}</span>
            </div>
            <p class="inst-form-erro" role="alert" hidden></p>
            <div class="inst-botoes">
                <button type="submit" class="inst-botao">${e?"Salvar":"Responder"}</button>
                <button type="button" class="inst-botao inst-botao--claro" data-acao="cancelar-resposta">Cancelar</button>
            </div>
        </form>`}function gt(a,t,{aberta:e=!1,respondendo:o="",textoResposta:s=""}={}){const i=Qa(a),r=i.some(v=>v.uid===t.uid),l=a.fixa?"Resposta do Futuro+":i.length?i.length===1?"1 resposta":`${i.length} respostas`:"Sem resposta ainda",p=!a.fixa&&a.autorUid===t.uid;let m="";a.fixa||(o===a.id?m=ht(a,t,s):W(t)&&!r&&(m=`<button type="button" class="inst-botao inst-botao--pequeno" data-acao="responder" data-pergunta="${c(a.id)}">Responder</button>`));const d=!a.fixa&&(t.admin||p&&!i.length)?`<button type="button" class="inst-acao inst-acao--perigo" data-acao="apagar-pergunta" data-pergunta="${c(a.id)}">${p?"Apagar pergunta":"Apagar pergunta (admin)"}</button>`:"";return`
        <details class="inst-duvida${a.fixa?" inst-duvida--fixa":""}" data-pergunta="${c(a.id)}"${e?" open":""}>
            <summary>
                <span class="inst-duvida-texto">${c(a.texto)}</span>
                <span class="inst-duvida-info${!a.fixa&&!i.length?" inst-duvida-info--sem":""}">${l}</span>
                <span class="inst-duvida-seta">${u.abrir}</span>
            </summary>
            <div class="inst-duvida-corpo">
                ${a.fixa?"":`<p class="inst-duvida-quem">Pergunta de ${c(y(a.nome)||"alguém")}${a.criadaEm?` · ${c(B(a.criadaEm))}`:""}</p>`}
                ${i.length?`<ol class="inst-respostas">${i.map(v=>ft(v,a,t)).join("")}</ol>`:'<p class="inst-vazio">Ninguém respondeu ainda.</p>'}
                ${m||d?`<div class="inst-duvida-rodape">${m}${d?`<div class="inst-acoes">${d}</div>`:""}</div>`:""}
            </div>
        </details>`}function vt(){return`
        <form class="inst-form" id="form-pergunta" novalidate>
            <label class="inst-form-titulo" for="pergunta-texto">Qual é a sua dúvida sobre esta unidade?</label>
            <textarea id="pergunta-texto" name="texto" rows="2" maxlength="${x.pergunta.max}"
                placeholder="Ex.: Como é o estágio? Dá para conciliar o curso com o trabalho?"></textarea>
            <div class="inst-form-rodape">
                <span>Quem estudou aqui e a equipe do Futuro+ respondem.</span>
                <span class="inst-form-contador" data-contador>0/${x.pergunta.max}</span>
            </div>
            <p class="inst-form-erro" role="alert" hidden></p>
            <div class="inst-botoes">
                <button type="submit" class="inst-botao">Enviar pergunta</button>
                <button type="button" class="inst-botao inst-botao--claro" data-acao="cancelar-pergunta">Cancelar</button>
            </div>
        </form>`}function $t({fixas:a=[],perguntas:t=[],haMais:e=!1,conta:o={},abertas:s=new Set,perguntando:i=!1,respondendo:r="",textoResposta:l=""}={}){let p="";o.carregando||i?p="":Va(o)?p='<button type="button" class="inst-botao inst-botao--pequeno" data-acao="perguntar">Fazer uma pergunta</button>':p='<a class="inst-botao inst-botao--pequeno inst-botao--claro" href="login.html">Entre para perguntar</a>';const m=[...t,...a];return`
        <header class="inst-cartao-topo">
            <h2><span class="inst-titulo-icone">${u.duvida}</span>Dúvidas frequentes</h2>
            ${p}
        </header>
        <p class="inst-cartao-sub">Qualquer pessoa com conta pergunta. Quem estudou aqui e a equipe do Futuro+ respondem.</p>
        ${i?vt():""}
        <div class="inst-duvidas">
            ${m.map(d=>gt(d,o,{aberta:s.has(d.id)||r===d.id,respondendo:r,textoResposta:l})).join("")}
        </div>
        ${e?'<button type="button" class="inst-ver-mais" data-acao="mais-perguntas">Ver mais perguntas</button>':""}`}function bt(a){return`
        <div class="inst-cartao inst-nao-encontrada">
            <p>${c(a)}</p>
            <a class="inst-botao" href="instituicoes.html">Ver todas as instituições</a>
        </div>`}const h=a=>document.getElementById(a),n={id:"",unidade:null,cursos:[],todosOsCursos:!1,avaliacao:void 0,comentarios:[],cursorComentarios:null,haMaisComentarios:!1,meuComentario:null,editando:!1,fixas:[],perguntas:[],cursorPerguntas:null,haMaisPerguntas:!1,abertas:new Set,perguntando:!1,respondendo:"",textoResposta:"",conta:{logado:!1,carregando:!0}};function H(){return n.conta.uid&&(n.meuComentario||n.comentarios.find(a=>a.uid===n.conta.uid))||null}function R(){h("inst-numeros").innerHTML=rt(n.unidade,n.cursos,n.avaliacao)}function ra(){h("inst-cursos").innerHTML=ut(n.cursos,{todos:n.todosOsCursos})}function b(){h("quem-estudou").innerHTML=mt({comentarios:n.comentarios,total:n.avaliacao?n.avaliacao.total:n.comentarios.length,haMais:n.haMaisComentarios,conta:n.conta,meuComentario:H(),editando:n.editando})}function g(){h("duvidas").innerHTML=$t({fixas:n.fixas,perguntas:n.perguntas,haMais:n.haMaisPerguntas,conta:n.conta,abertas:n.abertas,perguntando:n.perguntando,respondendo:n.respondendo,textoResposta:n.textoResposta})}function ca({somar:a=null,tirar:t=null}){const e=n.avaliacao||{media:0,total:0};let o=e.media*e.total,s=e.total;t!=null&&(o-=t,s-=1),a!=null&&(o+=a,s+=1),s=Math.max(0,s),n.avaliacao={media:s?o/s:0,total:s},R()}function k(a,t){document.title="Futuro+ | Instituições",h("inst-capa-miolo").innerHTML=it(a),h("inst-carregando").outerHTML=bt(t)}function Q(){const a=location.hash.length>1&&document.getElementById(decodeURIComponent(location.hash.slice(1)));a&&a.scrollIntoView({block:"start"})}const z=a=>setTimeout(()=>document.querySelector(a)?.focus(),0);function M(a,t){const e=a.querySelector(".inst-form-erro");e.textContent=t,e.hidden=!1}function U(a,t){const e=a.querySelector('button[type="submit"]');e.dataset.rotulo=e.textContent,e.disabled=!0,e.textContent=t}function I(a){const t=a.querySelector('button[type="submit"]');t.disabled=!1,t.textContent=t.dataset.rotulo||t.textContent}function S(a,t){return console.error(a),a?.code==="permission-denied"?t:"Não deu para salvar agora. Confira a conexão e tente de novo."}const la="O servidor não aceitou. Confira se o certificado desta unidade continua no seu Mural e tente de novo.";async function xt(a){const t=Number(a.querySelector('input[name="nota"]:checked')?.value||0),e=a.querySelector("textarea").value,o=t?F(e,x.comentario):"Escolha uma nota de 1 a 5.";if(o)return M(a,o);const s=n.editando?H():null;U(a,"Salvando...");try{const i=await Ja(n.id,n.conta,{texto:e,nota:t},s);n.meuComentario=i,n.comentarios=n.comentarios.filter(r=>r.uid!==i.uid),n.editando=!1,ca(s?{tirar:s.nota,somar:t}:{somar:t}),b()}catch(i){M(a,S(i,la)),I(a)}}async function Ct(a,t){const e=a===n.conta.uid,o=e?H():n.comentarios.find(i=>i.uid===a),s=e?"Apagar o seu comentário e a sua nota?":`Apagar o comentário de ${y(o?.nome)||"quem escreveu"}?`;if(confirm(s)){t.disabled=!0;try{await Wa(n.id,a),n.comentarios=n.comentarios.filter(i=>i.uid!==a),e&&(n.meuComentario=null,n.editando=!1),o?.nota&&ca({tirar:o.nota}),b()}catch(i){t.disabled=!1,alert(S(i,"O servidor não aceitou apagar este comentário."))}}}async function yt(a){a.disabled=!0;try{const{itens:t,cursor:e,haMais:o}=await oa(n.id,{depois:n.cursorComentarios}),s=new Set(n.comentarios.map(i=>i.uid));n.comentarios.push(...t.filter(i=>!s.has(i.uid))),n.cursorComentarios=e,n.haMaisComentarios=o,b()}catch(t){console.error("Erro ao ler mais comentários:",t),a.disabled=!1}}const P=a=>n.perguntas.find(t=>t.id===a);async function Et(a){const t=a.querySelector("textarea").value,e=F(t,x.pergunta);if(e)return M(a,e);U(a,"Enviando...");try{const o=await Ya(n.id,n.conta,t);n.perguntas=[o,...n.perguntas],n.perguntando=!1,n.abertas.add(o.id),g()}catch(o){M(a,S(o,"O servidor não aceitou a pergunta. Confirme o e-mail da sua conta e tente de novo.")),I(a)}}async function Mt(a,t){const e=a.querySelector("textarea").value,o=F(e,x.resposta);if(o)return M(a,o);U(a,"Salvando...");try{const s=await at(n.id,t,n.conta,e),i=P(t);i.respostas={...i.respostas||{},[n.conta.uid]:s},n.respondendo="",n.textoResposta="",n.abertas.add(t),g()}catch(s){M(a,S(s,n.conta.certificado?la:"O servidor não aceitou a resposta.")),I(a)}}async function St(a,t,e){const o=P(a);if(!o)return;const s=t===n.conta.uid,i=o.respostas?.[t]?.equipe?"da Equipe Futuro+":`de ${y(o.respostas?.[t]?.nome)||"quem respondeu"}`;if(confirm(s?"Apagar a sua resposta?":`Apagar a resposta ${i}?`)){e.disabled=!0;try{await tt(n.id,a,t);const r={...o.respostas||{}};delete r[t],o.respostas=r,g()}catch(r){e.disabled=!1,alert(S(r,"O servidor não aceitou apagar esta resposta."))}}}async function qt(a,t){const e=P(a);if(!e)return;const o=Object.keys(e.respostas||{}).length>0;if(confirm(o?"Apagar esta pergunta? As respostas somem junto.":"Apagar esta pergunta?")){t.disabled=!0;try{await et(n.id,a),n.perguntas=n.perguntas.filter(s=>s.id!==a),n.abertas.delete(a),g()}catch(s){t.disabled=!1,alert(S(s,"O servidor não aceitou apagar esta pergunta."))}}}async function wt(a){a.disabled=!0;try{const{itens:t,cursor:e,haMais:o}=await sa(n.id,{depois:n.cursorPerguntas}),s=new Set(n.perguntas.map(i=>i.id));n.perguntas.push(...t.filter(i=>!s.has(i.id))),n.cursorPerguntas=e,n.haMaisPerguntas=o,g()}catch(t){console.error("Erro ao ler mais perguntas:",t),a.disabled=!1}}function At(a){const t=a.target.closest("[data-acao]");if(t)switch(t.dataset.acao){case"editar-comentario":n.editando=!0,b(),z("#comentario-texto");break;case"cancelar-comentario":n.editando=!1,b();break;case"apagar-comentario":Ct(t.dataset.uid,t);break;case"mais-comentarios":yt(t);break}}function Dt(a){const t=a.target.closest("[data-acao]");if(!t)return;const e=t.dataset.pergunta||"";switch(t.dataset.acao){case"perguntar":n.perguntando=!0,g(),z("#pergunta-texto");break;case"cancelar-pergunta":n.perguntando=!1,g();break;case"responder":case"editar-resposta":n.respondendo=e,n.textoResposta=t.dataset.acao==="editar-resposta"&&P(e)?.respostas?.[n.conta.uid]?.texto||"",n.abertas.add(e),g(),z(`#resposta-${CSS.escape(e)}`);break;case"cancelar-resposta":n.respondendo="",n.textoResposta="",g();break;case"apagar-resposta":St(e,t.dataset.uid,t);break;case"apagar-pergunta":qt(e,t);break;case"mais-perguntas":wt(t);break}}function G(a){if(a.target.tagName!=="TEXTAREA")return;const t=a.target.closest("form")?.querySelector("[data-contador]");t&&(t.textContent=`${a.target.value.length}/${a.target.maxLength}`)}function Pt(){h("inst-cursos").addEventListener("click",e=>{e.target.closest('[data-acao="todos-os-cursos"]')&&(n.todosOsCursos=!0,ra())});const a=h("quem-estudou");a.addEventListener("click",At),a.addEventListener("submit",e=>{e.target.id==="form-comentario"&&(e.preventDefault(),xt(e.target))});const t=h("duvidas");t.addEventListener("click",Dt),t.addEventListener("submit",e=>{const o=e.target;o.id==="form-pergunta"?(e.preventDefault(),Et(o)):o.dataset.form==="resposta"&&(e.preventDefault(),Mt(o,o.dataset.pergunta))}),t.addEventListener("toggle",e=>{const o=e.target;o.matches?.("details[data-pergunta]")&&(o.open?n.abertas.add(o.dataset.pergunta):n.abertas.delete(o.dataset.pergunta))},!0),a.addEventListener("input",G),t.addEventListener("input",G)}async function Lt(){const a=new URLSearchParams(location.search).get("u")||"";if(!a||a.includes("/")){k("Instituição não encontrada","O endereço está incompleto. Escolha a unidade na lista de instituições.");return}n.id=a;let t=null;try{t=await Za(a)}catch(e){console.error("Erro ao ler a unidade:",e),k("Não deu para abrir esta instituição","Confira a conexão e tente de novo em instantes.");return}if(!t){k("Instituição não encontrada","A unidade pode ter saído do cadastro. Procure por ela na lista de instituições.");return}n.unidade=t,n.cursos=D(t),n.fixas=Ga(t,n.cursos),document.title=`Futuro+ | ${t.nome}`,h("inst-capa-miolo").innerHTML=nt(t,n.cursos),R(),h("inst-sobre").innerHTML=lt(t,n.cursos),ra(),b(),g(),h("inst-carregando").hidden=!0,h("inst-conteudo").hidden=!1,Pt(),Q(),Ka(a).then(e=>{n.avaliacao=e}).catch(e=>{console.error("Erro ao ler a média das notas:",e),n.avaliacao=null}).finally(()=>{R(),b()}),oa(a).then(({itens:e,cursor:o,haMais:s})=>{n.comentarios=e,n.cursorComentarios=o,n.haMaisComentarios=s,b(),location.hash==="#quem-estudou"&&Q()}).catch(e=>console.error("Erro ao ler os comentários:",e)),sa(a).then(({itens:e,cursor:o,haMais:s})=>{n.perguntas=e,n.cursorPerguntas=o,n.haMaisPerguntas=s,g()}).catch(e=>console.error("Erro ao ler as dúvidas:",e)),ot(a,async e=>{if(n.editando=!1,n.respondendo="",n.perguntando=!1,n.meuComentario=null,e.logado&&e.certificado)try{n.meuComentario=await Xa(a,e.uid)}catch(o){console.error("Erro ao ler o seu comentário:",o)}n.conta=e,b(),g()})}document.addEventListener("DOMContentLoaded",Lt);
