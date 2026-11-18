import{h as I,d as y,c as $,v as pa,x as fa,o as ha,g as T,q as N,e as F,y as Y,a as ga,k as va,z as $a,l as ba,u as B,j as w,b as xa,A as Ca,i as aa,f as ya,B as Ea}from"./firebase-config-XQh5hlny.js";/* empty css              */import"./dashboard-DlCsTCaU.js";import{n as ta,p as Sa,m as Ma,o as S,L as qa,e as r,a as wa}from"./card-unidade-DxBgZOlB.js";import"./preload-helper-PPVm8Dsz.js";import"./conteudo-legal-padrao-DcxCgRAC.js";import"./resultado-teste-BcjYGcG_.js";import"./notificacoes-util-BMqxtxne.js";const C={comentario:{min:10,max:600},pergunta:{min:10,max:300},resposta:{min:5,max:600}},Da=5,Aa=5,Pa=8,Z="/central-cps.webp",La=/(https?:\/\/|www\.|\b[\w-]+\.(com|net|org|br|io|me|ly|gg)\b)/i;function H(a,{min:t,max:o}){const e=String(a||"").trim();return e.length<t?`Escreva pelo menos ${t} caracteres.`:e.length>o?`Use no máximo ${o} caracteres.`:La.test(e)?"Tire o link do texto: aqui só vale texto.":""}function E(a){return String(a||"").trim().split(/\s+/)[0]||""}function ka(a){const t=(a.tipo||"").trim().toLowerCase();return t==="etec"||t==="fatec"?"A ":""}function Oa(a){const t=String(a||"").trim();return!t||/[.!?]$/.test(t)?t:`${t}.`}function P(a){const t=(a.tipo||"").trim(),o=new Map;for(const s of a.cursos||[]){if(!s?.nome)continue;const i=ta(s.nome);o.has(i)||o.set(i,{nome:s.nome.trim(),slug:Sa(s.nome,t),modalidades:[]});const c=Ma(s.categoria||""),u=o.get(i);u.modalidades.some(d=>d.chave===c.chave)||u.modalidades.push({chave:c.chave,rotulo:c.rotulo})}const e=[...o.values()];return e.forEach(s=>s.modalidades.sort((i,c)=>S(i.chave)-S(c.chave))),e.sort((s,i)=>S(s.modalidades[0].chave)-S(i.modalidades[0].chave)||s.nome.localeCompare(i.nome,"pt-BR"))}function D(a){return a.length<=1?a.join(""):`${a.slice(0,-1).join(", ")} e ${a.at(-1)}`}function Ra(a,t=P(a)){const o=new Set(t.flatMap(l=>l.modalidades.map(f=>f.chave))),e=(a.tipo||"").trim().toLowerCase(),s=[];(e==="fatec"||o.has("superior"))&&s.push("Ensino Superior"),["tecnico","especializacao","medio","ams","semipresencial","ead"].some(l=>o.has(l))&&e!=="fatec"&&s.push("Técnico"),(o.has("medio")||o.has("ams"))&&e!=="fatec"&&s.push("Ensino Médio");const i=(a.cursos||[]).map(l=>ta(l?.categoria)),c=i.some(l=>/\b(ead|online|distancia)\b/.test(l)),u=i.some(l=>l.includes("semipresencial")),m=[i.some(l=>!/\b(ead|online|distancia)\b/.test(l)&&!l.includes("semipresencial"))&&"Presencial",u&&"Semipresencial",c&&"EaD"].filter(Boolean);return[s.length?{icone:"nivel",texto:D(s)}:null,e==="etec"||e==="fatec"?{icone:"publica",texto:"Pública e gratuita"}:null,m.length?{icone:"forma",texto:D(m)}:null].filter(Boolean)}const za={medio:"ensino médio com técnico",tecnico:"cursos técnicos",especializacao:"especialização técnica",ead:"cursos a distância",semipresencial:"cursos semipresenciais",ams:"AMS (médio, técnico e superior em sequência)",superior:"cursos superiores de tecnologia"};function ja(a,t=P(a)){const o=(a.tipo||"").trim().toLowerCase(),e=o==="fatec"?"uma faculdade de tecnologia pública e gratuita do Centro Paula Souza":o==="etec"?"uma escola técnica estadual, pública e gratuita, do Centro Paula Souza":"uma instituição de ensino",s=a.municipio?`, em ${a.municipio}`:"",i=[`${ka(a)}${a.nome} é ${e}${s}.`];if(a.historico&&i.push(Oa(a.historico)),t.length){const c=[...new Set(t.flatMap(d=>d.modalidades.map(m=>m.chave)))].sort((d,m)=>S(d)-S(m)).map(d=>za[d]).filter(Boolean),u=t.length===1?"1 curso":`${t.length} cursos`;i.push(c.length?`Hoje oferece ${u}, entre ${D(c)}.`:`Hoje oferece ${u}.`)}return i.join(" ")}function Ia(a){const t=a.municipio?`${a.municipio} - SP`:"",o=String(a.endereco||"").replace(/\s+/g," ").trim();if(!o)return{rua:"",resto:t,cep:""};let e="";const s=o.split(/ - /).filter(l=>{const f=l.match(/^CEP:?\s*([\d.-]+)/i);return f&&(e=f[1]),!f}),i=s.findIndex(l=>/\/\s*[A-Z]{2}$/.test(l)),c=i>=0?s[i].replace(/\s*\/\s*/," - "):t,u=i>=0?s.slice(0,i):s,d=u.length>1?u.at(-1):"";return{rua:u.length>1?u.slice(0,-1).join(" - "):u[0]||"",resto:[d,c].filter(Boolean).join(" · "),cep:e}}function Ta(a){const t=[a.nome,a.endereco].filter(Boolean).join(", ").replace(/\s+/g," ").trim(),{lat:o,lng:e}=a.localizacao||{},s=a.endereco?t:o!=null&&e!=null?`${o},${e}`:t;return s?`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(s)}`:""}function Na(a){const t=String(a||"").match(/\(?(\d{2})\)?\s*(\d{4,5})[-\s]?(\d{4})/);return t?`tel:+55${t[1]}${t[2]}${t[3]}`:""}function Fa(a){const t=String(a||"").match(/\(?\d{2}\)?\s*\d{4,5}[-\s]?\d{4}/);return t?t[0].trim():String(a||"").trim()}function A(a){const t=String(a||"").trim();if(!t)return"";const o=/^https?:\/\//i.test(t)?t:`https://${t}`;try{const e=new URL(o);return e.protocol==="https:"||e.protocol==="http:"?e.href:""}catch{return""}}function Ba(a){return String(a||"").replace(/^https?:\/\//i,"").replace(/^www\./i,"").replace(/\/$/,"")}function Ha(a){const t=a.foto?.url||"";return/^https:\/\//i.test(t)?t:""}function Ua(a){return Number(a||0).toLocaleString("pt-BR",{minimumFractionDigits:1,maximumFractionDigits:1})}function _a(a){const t=Math.max(0,Math.min(5,Number(a)||0));return[1,2,3,4,5].map(o=>{const e=t-(o-1);return e>=.75?"cheia":e>=.25?"meia":"vazia"})}function Va(a){return a===1?"1 avaliação":`${a} avaliações`}function O(a){if(!a)return null;if(typeof a.toDate=="function")return a.toDate();const t=a instanceof Date?a:new Date(a);return Number.isNaN(t.getTime())?null:t}function U(a){const t=O(a);return t?t.toLocaleDateString("pt-BR",{day:"numeric",month:"short",year:"numeric"}):""}const Qa=a=>!!a?.certificadosDisponiveis?.length,oa=a=>!!(a?.certificados?.length||a?.admin),Ga=a=>!!a?.logado;function ea(a){if(a.equipe)return"Equipe Futuro+";const t=String(a.curso||"").trim(),o=a.ano?`concluiu em ${a.ano}`:"";return[t,o].filter(Boolean).join(" · ")||"Estudou aqui"}function Za(a){return Object.entries(a?.respostas||{}).map(([t,o])=>({uid:t,...o})).sort((t,o)=>(O(t.em)?.getTime()||0)-(O(o.em)?.getTime()||0))}function Ka(a,t=P(a)){const e=(a.tipo||"").trim().toLowerCase()==="fatec"?"Pelo Vestibular Fatec. As inscrições, as datas e o manual ficam no site vestibular.fatec.sp.gov.br.":"Pelo Vestibulinho Etec. As inscrições, as datas e o manual ficam no site vestibulinho.etec.sp.gov.br.",s=t.map(c=>c.nome),i=s.length?`${s.length===1?"Hoje é 1 curso":`Hoje são ${s.length} cursos`}: ${D(s)}. A lista completa, com o que se aprende em cada um, fica em "Cursos oferecidos", nesta página.`:"O cadastro desta unidade ainda não tem a lista de cursos.";return[{id:"fixa-ingresso",texto:"Como faço para estudar aqui?",fixa:!0,respostas:{futuro:{equipe:!0,nome:"Futuro+",texto:e}}},{id:"fixa-gratuita",texto:"Precisa pagar pelo curso?",fixa:!0,respostas:{futuro:{equipe:!0,nome:"Futuro+",texto:"Não. As Etecs e Fatecs são escolas públicas do Centro Paula Souza, do Governo do Estado de São Paulo, e os cursos são gratuitos. As regras da inscrição ficam no manual de cada processo seletivo."}}},{id:"fixa-cursos",texto:"Quais cursos tem aqui?",fixa:!0,respostas:{futuro:{equipe:!0,nome:"Futuro+",texto:i}}}]}const _=a=>F($,"instituicoes",a,"comentarios"),sa=a=>F($,"instituicoes",a,"perguntas");async function na(a,t,o,e){const s=[va(t,"desc")];o&&s.push($a(o)),s.push(ba(e+1));const i=await T(N(a,...s)),c=i.docs.slice(0,e);return{docs:c,cursor:c.at(-1)||null,haMais:i.docs.length>e}}async function Xa(a){const t=await I(y($,"instituicoes",a));return t.exists()?{id:t.id,...t.data()}:null}async function Ja(a){const t=await pa(_(a),{media:fa("nota"),total:Ea()}),{media:o,total:e}=t.data();return{media:o||0,total:e||0}}function R(a,t){return{id:a,uid:t.uid||a,...t}}async function ia(a,{depois:t=null}={}){const{docs:o,cursor:e,haMais:s}=await na(_(a),"criadoEm",t,Da);return{itens:o.map(i=>R(i.id,i.data())),cursor:e,haMais:s}}async function Wa(a,t){const[o,e]=await Promise.all([T(N(_(a),Y("uid","==",t))),I(y($,"instituicoes",a,"comentarios",t))]),s=new Map(o.docs.map(i=>[i.id,R(i.id,i.data())]));return e.exists()&&!s.has(e.id)&&s.set(e.id,R(e.id,e.data())),[...s.values()]}async function Ya(a,t,{texto:o,nota:e,certificadoId:s},i=null){const c=(t.certificados||[]).find(m=>m.id===s);if(!c)throw new Error("Certificado não encontrado para este comentário.");const u=y($,"instituicoes",a,"comentarios",i?i.id:`${t.uid}_${s}`),d={texto:o.trim(),nota:e,nome:t.nome,curso:c.titulo,ano:c.anoConclusao??null,certificadoId:s,uid:t.uid};return i?(await B(u,{...d,editadoEm:w()}),{...i,...d,editadoEm:new Date}):(await xa(u,{...d,criadoEm:w()}),{...d,id:u.id,criadoEm:new Date})}async function at(a,t){await aa(y($,"instituicoes",a,"comentarios",t))}async function ra(a,{depois:t=null}={}){const{docs:o,cursor:e,haMais:s}=await na(sa(a),"criadaEm",t,Aa);return{itens:o.map(i=>({id:i.id,...i.data()})),cursor:e,haMais:s}}async function tt(a,t,o){const e={texto:o.trim(),autorUid:t.uid,nome:t.nome,criadaEm:w(),respostas:{}},s=await Ca(sa(a),e);return{...e,id:s.id,criadaEm:new Date}}async function ot(a,t,o,e){const s=(o.certificados||[])[0],i=s?{texto:e.trim(),nome:o.nome,curso:s.titulo,ano:s.anoConclusao??null,certificadoId:s.id,equipe:!1}:{texto:e.trim(),nome:o.nome,equipe:!0};return await B(y($,"instituicoes",a,"perguntas",t),{[`respostas.${o.uid}`]:{...i,em:w()}}),{...i,em:new Date}}async function et(a,t,o){await B(y($,"instituicoes",a,"perguntas",t),{[`respostas.${o}`]:ya()})}async function st(a,t){await aa(y($,"instituicoes",a,"perguntas",t))}function nt(a,t){return ha(ga,async o=>{if(!o){t({logado:!1});return}const e={logado:!0,uid:o.uid,nome:"",admin:!1,certificados:[]};try{const[s,i]=await Promise.all([I(y($,"usuarios",o.uid)),T(N(F($,"usuarios",o.uid,"certificados"),Y("verificacao.unidadeLida","==",a)))]),c=s.exists()?s.data():{},u=i.docs.filter(d=>d.data().verificacao?.nomeConfere===!0);t({...e,nome:typeof c.nome=="string"?c.nome:"",admin:c.admin===!0,certificados:u.map(d=>({id:d.id,titulo:d.data().titulo||"",anoConclusao:d.data().anoConclusao??null}))})}catch(s){console.error("Erro ao ler a conta:",s),t(e)}})}const h=(a,t=20)=>`<svg width="${t}" height="${t}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${a}</svg>`,p={local:h('<path d="M12 21s-7-6.2-7-12a7 7 0 0 1 14 0c0 5.8-7 12-7 12z"/><circle cx="12" cy="9" r="2.6"/>',16),capelo:h('<path d="M2 9.5 12 5l10 4.5-10 4.5L2 9.5z"/><path d="M6 11.6V16c0 1.4 2.7 3 6 3s6-1.6 6-3v-4.4"/><path d="M22 9.5v5"/>'),telefone:h('<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/>'),estrela:h('<path d="m12 2.8 2.8 5.8 6.4.9-4.6 4.5 1.1 6.3L12 17.3l-5.7 3 1.1-6.3-4.6-4.5 6.4-.9L12 2.8z"/>'),mapa:h('<path d="M12 21s-7-6.2-7-12a7 7 0 0 1 14 0c0 5.8-7 12-7 12z"/><circle cx="12" cy="9" r="2.6"/>'),livro:h('<path d="M2 5.5A2.5 2.5 0 0 1 4.5 3H11v17H4.5A2.5 2.5 0 0 0 2 22.5z"/><path d="M22 5.5A2.5 2.5 0 0 0 19.5 3H13v17h6.5a2.5 2.5 0 0 1 2.5 2.5z"/>'),balao:h('<path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 9 9 0 0 1-3.9-.9L3 20.5l1.5-4.6A8.4 8.4 0 1 1 21 11.5z"/>'),duvida:h('<circle cx="12" cy="12" r="9.5"/><path d="M9.2 9a3 3 0 0 1 5.8 1c0 2-3 2.6-3 4.4"/><path d="M12 17.6h.01"/>'),cadeado:h('<rect x="4.5" y="10.5" width="15" height="10.5" rx="2.5"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/>'),verificado:h('<circle cx="12" cy="12" r="9.5"/><path d="m8 12.4 2.7 2.6L16.2 9.6"/>',14),seta:h('<path d="M5 12h14M13 6l6 6-6 6"/>',16),voltar:h('<path d="M19 12H5M11 6l-6 6 6 6"/>',16),externo:h('<path d="M7 17 17 7M9 7h8v8"/>',14),abrir:h('<path d="m6 9 6 6 6-6"/>',18),site:h('<circle cx="12" cy="12" r="9.5"/><path d="M2.5 12h19M12 2.5a14.6 14.6 0 0 1 0 19M12 2.5a14.6 14.6 0 0 0 0 19"/>',18),instagram:h('<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><path d="M17.5 6.5h.01"/>',18),facebook:h('<path d="M15 3h-2.5A4.5 4.5 0 0 0 8 7.5V10H5.5v4H8v7h4v-7h2.6l.9-4H12V7.8c0-.6.4-.8 1-.8h2z"/>',18),predio:h('<path d="M3 21h18M5 21V10l7-5 7 5v11"/><path d="M9.5 21v-5h5v5M9 11.5h.01M15 11.5h.01"/>',16),pessoas:h('<circle cx="9" cy="8" r="3.2"/><path d="M3 20a6 6 0 0 1 12 0"/><path d="M16 4.9a3.2 3.2 0 0 1 0 6.2M18 20a6 6 0 0 0-3-5.2"/>',16),nivel:h('<path d="M2 9.5 12 5l10 4.5-10 4.5L2 9.5z"/><path d="M6 11.6V16c0 1.4 2.7 3 6 3s6-1.6 6-3v-4.4"/>',16)},it={nivel:p.nivel,publica:p.predio,forma:p.pessoas};function ca(a,t="inst-estrelas"){const o={cheia:"★",meia:"★",vazia:"★"};return`<span class="${t}" aria-hidden="true">${_a(a).map(e=>`<span class="inst-estrela inst-estrela--${e}">${o[e]}</span>`).join("")}</span>`}const la=a=>r((E(a)[0]||"?").toUpperCase());function rt(a,t){const o=Ha(a),e=a.municipio?`${a.municipio}, SP`:"",s=Ra(a,t);return`
        <img class="inst-capa-foto${o?"":" inst-capa-foto--padrao"}" src="${r(o||Z)}" alt="" fetchpriority="high"
            onerror="this.onerror=null;this.src='${Z}';this.classList.add('inst-capa-foto--padrao')">
        <div class="home-hero-conteudo inst-capa-conteudo">
            <a class="inst-capa-voltar" href="instituicoes.html">${p.voltar} Todas as instituições</a>
            <div class="inst-capa-identidade">
                <div class="inst-capa-logo">
                    <img src="${wa(a)}" alt="Logo da ${r(a.nome)}"
                        onerror="this.onerror=null;this.src='${qa}';">
                </div>
                <div class="inst-capa-texto">
                    <h1>${r(a.nome)}</h1>
                    ${e?`<p class="inst-capa-local">${p.local} ${r(e)}</p>`:""}
                    ${s.length?`<ul class="inst-capa-selos">${s.map(i=>`
                        <li>${it[i.icone]||""}${r(i.texto)}</li>`).join("")}
                    </ul>`:""}
                </div>
            </div>
        </div>`}function ct(a){return`
        <div class="home-hero-conteudo inst-capa-conteudo">
            <a class="inst-capa-voltar" href="instituicoes.html">${p.voltar} Todas as instituições</a>
            <h1>${r(a)}</h1>
        </div>`}function lt(a,t,o){const e=new Set(t.flatMap(f=>f.modalidades.map(b=>b.chave))),s=t.length?e.size===1?t[0].modalidades[0].rotulo:`em ${e.size} modalidades`:"Ainda sem lista no cadastro",i=Fa(a.telefone),c=Na(a.telefone),u=A(a.site),d=o&&o.total>0,m=Ia(a),l=Ta(a);return`
        <article class="inst-numero">
            <span class="inst-numero-icone inst-numero-icone--azul">${p.capelo}</span>
            <div class="inst-numero-textos">
                <span class="inst-numero-rotulo">Cursos oferecidos</span>
                <a class="inst-numero-valor" href="#inst-cursos">${t.length===1?"1 curso":`${t.length} cursos`}</a>
                <span class="inst-numero-sub">${r(s)}</span>
            </div>
        </article>
        <article class="inst-numero">
            <span class="inst-numero-icone inst-numero-icone--verde">${p.telefone}</span>
            <div class="inst-numero-textos">
                <span class="inst-numero-rotulo">Contato</span>
                ${i?c?`<a class="inst-numero-valor" href="${c}">${r(i)}</a>`:`<strong class="inst-numero-valor">${r(i)}</strong>`:'<strong class="inst-numero-valor inst-numero-valor--vazio">Sem telefone</strong>'}
                ${u?`<a class="inst-numero-sub inst-numero-link" href="${r(u)}" target="_blank" rel="noopener">${r(Ba(a.site))} ${p.externo}</a>`:'<span class="inst-numero-sub">Sem site no cadastro</span>'}
            </div>
        </article>
        <article class="inst-numero">
            <span class="inst-numero-icone inst-numero-icone--ouro">${p.estrela}</span>
            <div class="inst-numero-textos">
                <span class="inst-numero-rotulo">Avaliação</span>
                ${o===void 0?`
                <strong class="inst-numero-valor inst-numero-valor--vazio">...</strong>
                <span class="inst-numero-sub">Carregando as notas</span>`:d?`
                <span class="inst-numero-valor inst-numero-valor--nota">
                    <strong>${Ua(o.media)}</strong><span class="inst-numero-de">/ 5</span>
                    ${ca(o.media)}
                </span>
                <a class="inst-numero-sub inst-numero-link" href="#quem-estudou">${Va(o.total)}</a>`:`
                <strong class="inst-numero-valor inst-numero-valor--vazio">Sem notas ainda</strong>
                <span class="inst-numero-sub">Só quem estudou aqui avalia</span>`}
            </div>
        </article>
        <article class="inst-numero inst-numero--endereco">
            <span class="inst-numero-icone inst-numero-icone--coral">${p.mapa}</span>
            <div class="inst-numero-textos">
                <div class="inst-numero-cabeca">
                    <span class="inst-numero-rotulo">Endereço</span>
                    ${l?`<a class="inst-mapa" href="${r(l)}" target="_blank" rel="noopener">${p.local} Ver no Google Maps ${p.externo}</a>`:""}
                </div>
                <strong class="inst-numero-valor inst-numero-valor--texto">${r(m.rua||m.resto||"Sem endereço no cadastro")}</strong>
                ${m.rua&&m.resto?`<span class="inst-numero-sub">${r(m.resto)}</span>`:""}
            </div>
        </article>`}function dt(a){const t=String(a?.rede||"").toLowerCase(),o=A(a?.url);if(!o)return"";const e=t==="instagram"?p.instagram:t==="facebook"?p.facebook:p.site;return`<li><a class="inst-link" href="${r(o)}" target="_blank" rel="noopener">${e}${r(a.rede)}</a></li>`}function ut(a,t){const o=A(a.site),e=A(a.paginaCps),s=[o?`<li><a class="inst-link" href="${r(o)}" target="_blank" rel="noopener">${p.site}Site da unidade</a></li>`:"",...(a.redesSociais||[]).map(dt),e?`<li><a class="inst-link" href="${r(e)}" target="_blank" rel="noopener">${p.predio}Página no Centro Paula Souza</a></li>`:""].filter(Boolean);return`
        <header class="inst-cartao-topo">
            <h2><span class="inst-titulo-icone">${p.livro}</span>Sobre a instituição</h2>
        </header>
        <p class="inst-sobre-texto">${r(ja(a,t))}</p>
        ${s.length?`<ul class="inst-links">${s.join("")}</ul>`:""}`}function mt(a,{todos:t=!1}={}){if(!a.length)return`
            <header class="inst-cartao-topo"><h2><span class="inst-titulo-icone">${p.capelo}</span>Cursos oferecidos</h2></header>
            <p class="inst-vazio">O cadastro desta unidade ainda não tem a lista de cursos.</p>`;const o=t?a:a.slice(0,Pa),e=a.length-o.length;return`
        <header class="inst-cartao-topo">
            <h2><span class="inst-titulo-icone">${p.capelo}</span>Cursos oferecidos</h2>
            <span class="inst-contagem">${a.length===1?"1 curso":`${a.length} cursos`}</span>
        </header>
        <p class="inst-cartao-sub">Toque em um curso para ver o que se aprende e onde dá para trabalhar.</p>
        <ul class="inst-cursos">
            ${o.map(s=>`
            <li>
                <a class="inst-curso inst-curso--${s.modalidades[0].chave}" href="curso.html?c=${encodeURIComponent(s.slug)}">
                    <span class="inst-curso-icone">${p.capelo}</span>
                    <span class="inst-curso-textos">
                        <strong>${r(s.nome)}</strong>
                        <span class="inst-curso-modalidades">${s.modalidades.map(i=>`<span>${r(i.rotulo)}</span>`).join("")}</span>
                    </span>
                    <span class="inst-curso-seta">${p.seta}</span>
                </a>
            </li>`).join("")}
        </ul>
        ${e>0?`<button type="button" class="inst-ver-mais" data-acao="todos-os-cursos">Ver todos os ${a.length} cursos</button>`:""}`}function pt(a){return a?.logado?`
        <div class="inst-acesso">
            <span class="inst-acesso-icone">${p.cadeado}</span>
            <div>
                <strong>Estudou aqui?</strong>
                <p>Pendure no Mural o certificado desta unidade. Quando a leitura do certificado encontrar o nome da escola, você comenta, avalia e responde dúvidas.</p>
                <div class="inst-botoes">
                    <a class="inst-botao" href="mural.html">Ir para o Mural</a>
                </div>
            </div>
        </div>`:`
        <div class="inst-acesso">
            <span class="inst-acesso-icone">${p.cadeado}</span>
            <div>
                <strong>Estudou aqui?</strong>
                <p>Entre na sua conta e pendure no Mural o certificado desta unidade. Com ele, você comenta, avalia e responde dúvidas.</p>
                <div class="inst-botoes">
                    <a class="inst-botao" href="login.html">Entrar</a>
                    <a class="inst-botao inst-botao--claro" href="cadastro.html">Criar conta</a>
                </div>
            </div>
        </div>`}function K(a,t=null){const o=a.certificadosDisponiveis||[],e=t&&(a.certificados||[]).find(l=>l.id===t.certificadoId),s=t?e:o[0],i=l=>[l.titulo,l.anoConclusao].filter(Boolean).map(r).join(" · "),c=t||o.length<=1?`<input type="hidden" id="comentario-certificado" name="certificadoId" value="${r(s?.id||"")}">`:`
            <label class="sr-only" for="comentario-certificado">Qual certificado</label>
            <select id="comentario-certificado" name="certificadoId">
                ${o.map(l=>`<option value="${r(l.id)}">${i(l)}</option>`).join("")}
            </select>`,u=t?.nota||0,d=t?.texto||"",m=[E(a.nome),s?.titulo,s?.anoConclusao].filter(Boolean).map(r);return`
        <form class="inst-form" id="form-comentario" novalidate>
            <strong class="inst-form-titulo">${t?"Editar seu comentário":"Como foi estudar aqui?"}</strong>
            ${!t&&o.length>1?'<p class="inst-form-sub">Você tem mais de um certificado desta escola. Escolha a qual curso este comentário se refere.</p>':""}
            ${c}
            <fieldset class="inst-nota-campo">
                <legend>Sua nota</legend>
                <div class="inst-nota-opcoes">
                    ${[5,4,3,2,1].map(l=>`
                    <input type="radio" id="nota-${l}" name="nota" value="${l}"${l===u?" checked":""}>
                    <label for="nota-${l}" title="${l} de 5">★<span class="sr-only">${l} de 5</span></label>`).join("")}
                </div>
            </fieldset>
            <label class="sr-only" for="comentario-texto">Seu comentário</label>
            <textarea id="comentario-texto" name="texto" rows="4" maxlength="${C.comentario.max}"
                placeholder="Conte como são as aulas, os professores e a estrutura: o que ajudaria quem está pensando em estudar aqui.">${r(d)}</textarea>
            <div class="inst-form-rodape">
                <span>Aparece como <strong>${m.join("</strong> · ")}</span>
                <span class="inst-form-contador" data-contador>${d.length}/${C.comentario.max}</span>
            </div>
            <p class="inst-form-erro" role="alert" hidden></p>
            <div class="inst-botoes">
                <button type="submit" class="inst-botao">${t?"Salvar":"Publicar"}</button>
                ${t?'<button type="button" class="inst-botao inst-botao--claro" data-acao="cancelar-comentario">Cancelar</button>':""}
            </div>
        </form>`}function X(a,{meu:t=!1,admin:o=!1,podeEditar:e=!0}={}){const s=a.editadoEm?" (editado)":"",i=t?`<div class="inst-acoes">
                ${e?`<button type="button" class="inst-acao" data-acao="editar-comentario" data-id="${r(a.id)}">Editar</button>`:""}
                <button type="button" class="inst-acao inst-acao--perigo" data-acao="apagar-comentario" data-id="${r(a.id)}">Apagar</button>
           </div>`:o?`<div class="inst-acoes"><button type="button" class="inst-acao inst-acao--perigo" data-acao="apagar-comentario" data-id="${r(a.id)}">Apagar (admin)</button></div>`:"";return`
        <li class="inst-comentario${t?" inst-comentario--meu":""}">
            <div class="inst-comentario-topo">
                <span class="inst-avatar">${la(a.nome)}</span>
                <div class="inst-comentario-autor">
                    <div class="inst-autor-linha">
                        <strong>${r(E(a.nome))}${t?' <span class="inst-voce">você</span>':""}</strong>
                        <time class="inst-data">${r(U(a.criadoEm))}${s}</time>
                    </div>
                    <span class="inst-verificado">${p.verificado}${r(ea(a))}</span>
                </div>
            </div>
            ${a.nota?`<div class="inst-comentario-nota" role="img" aria-label="Nota ${a.nota} de 5">${ca(a.nota)}</div>`:""}
            <p class="inst-comentario-texto">${r(a.texto)}</p>
            ${i}
        </li>`}function ft({comentarios:a=[],total:t=0,haMais:o=!1,conta:e={},meusComentarios:s=[],editandoId:i=null}={}){const c=new Set(s.map(f=>f.id)),u=a.filter(f=>!c.has(f.id)),d=f=>(e.certificados||[]).some(b=>b.id===f.certificadoId);let m="";if(!e.carregando){const f=s.filter(b=>b.id!==i).map(b=>X(b,{meu:!0,podeEditar:d(b)})).join("");f&&(m+=`<ol class="inst-comentarios">${f}</ol>`),i?m+=K(e,s.find(b=>b.id===i)):Qa(e)?m+=K(e,null):s.length||(m+=pt(e))}const l=u.length?`<ol class="inst-comentarios">${u.map(f=>X(f,{admin:e.admin})).join("")}</ol>`:s.length?"":'<p class="inst-vazio">Ninguém comentou ainda. Quem estudou aqui pode ser a primeira pessoa a contar como foi.</p>';return`
        <header class="inst-cartao-topo">
            <h2><span class="inst-titulo-icone">${p.balao}</span>Quem estudou aqui</h2>
            <span class="inst-contagem">${t===1?"1 comentário":`${t} comentários`}</span>
        </header>
        ${m}
        ${l}
        ${o?'<button type="button" class="inst-ver-mais" data-acao="mais-comentarios">Ver mais comentários</button>':""}
        <p class="inst-rodape">Só comenta e avalia quem tem o certificado desta unidade conferido no Mural. As opiniões são de quem escreveu, não da escola.</p>`}function ht(a,t,o){const e=a.uid===o.uid&&!t.fixa,s=!t.fixa&&(e||o.admin);return`
        <li class="inst-resposta${a.equipe?" inst-resposta--equipe":""}">
            <div class="inst-resposta-autor">
                ${a.equipe?'<span class="inst-avatar inst-avatar--pequeno inst-avatar--equipe"><img src="/logo.png" alt="" width="18" height="18"></span>':`<span class="inst-avatar inst-avatar--pequeno">${la(a.nome)}</span>`}
                <div class="inst-comentario-autor">
                    <div class="inst-autor-linha">
                        <strong>${a.equipe?"Equipe Futuro+":r(E(a.nome))}</strong>
                        ${a.em?`<time class="inst-data">${r(U(a.em))}</time>`:""}
                    </div>
                    ${a.equipe?"":`<span class="inst-verificado">${p.verificado}${r(ea(a))}</span>`}
                </div>
            </div>
            <p>${r(a.texto)}</p>
            ${s?`<div class="inst-acoes">
                ${e&&oa(o)?`<button type="button" class="inst-acao" data-acao="editar-resposta" data-pergunta="${r(t.id)}">Editar</button>`:""}
                <button type="button" class="inst-acao inst-acao--perigo" data-acao="apagar-resposta" data-pergunta="${r(t.id)}" data-uid="${r(a.uid)}">${e?"Apagar":"Apagar (admin)"}</button>
            </div>`:""}
        </li>`}function gt(a,t,o=""){const e=(t.certificados||[])[0],s=t.admin&&!e?"Equipe Futuro+":[E(t.nome),e?.titulo,e?.anoConclusao].filter(Boolean).join(" · ");return`
        <form class="inst-form inst-form--resposta" data-form="resposta" data-pergunta="${r(a.id)}" novalidate>
            <label class="sr-only" for="resposta-${r(a.id)}">Sua resposta</label>
            <textarea id="resposta-${r(a.id)}" name="texto" rows="3" maxlength="${C.resposta.max}"
                placeholder="Responda com o que você viveu aí.">${r(o)}</textarea>
            <div class="inst-form-rodape">
                <span>Aparece como <strong>${r(s)}</strong></span>
                <span class="inst-form-contador" data-contador>${o.length}/${C.resposta.max}</span>
            </div>
            <p class="inst-form-erro" role="alert" hidden></p>
            <div class="inst-botoes">
                <button type="submit" class="inst-botao">${o?"Salvar":"Responder"}</button>
                <button type="button" class="inst-botao inst-botao--claro" data-acao="cancelar-resposta">Cancelar</button>
            </div>
        </form>`}function vt(a,t,{aberta:o=!1,respondendo:e="",textoResposta:s=""}={}){const i=Za(a),c=i.some(f=>f.uid===t.uid),u=a.fixa?"Resposta do Futuro+":i.length?i.length===1?"1 resposta":`${i.length} respostas`:"Sem resposta ainda",d=!a.fixa&&a.autorUid===t.uid;let m="";a.fixa||(e===a.id?m=gt(a,t,s):oa(t)&&!c&&(m=`<button type="button" class="inst-botao inst-botao--pequeno" data-acao="responder" data-pergunta="${r(a.id)}">Responder</button>`));const l=!a.fixa&&(t.admin||d&&!i.length)?`<button type="button" class="inst-acao inst-acao--perigo" data-acao="apagar-pergunta" data-pergunta="${r(a.id)}">${d?"Apagar pergunta":"Apagar pergunta (admin)"}</button>`:"";return`
        <details class="inst-duvida${a.fixa?" inst-duvida--fixa":""}" data-pergunta="${r(a.id)}"${o?" open":""}>
            <summary>
                <span class="inst-duvida-texto">${r(a.texto)}</span>
                <span class="inst-duvida-info${!a.fixa&&!i.length?" inst-duvida-info--sem":""}">${u}</span>
                <span class="inst-duvida-seta">${p.abrir}</span>
            </summary>
            <div class="inst-duvida-corpo">
                ${a.fixa?"":`<p class="inst-duvida-quem">Pergunta de ${r(E(a.nome)||"alguém")}${a.criadaEm?` · ${r(U(a.criadaEm))}`:""}</p>`}
                ${i.length?`<ol class="inst-respostas">${i.map(f=>ht(f,a,t)).join("")}</ol>`:'<p class="inst-vazio">Ninguém respondeu ainda.</p>'}
                ${m||l?`<div class="inst-duvida-rodape">${m}${l?`<div class="inst-acoes">${l}</div>`:""}</div>`:""}
            </div>
        </details>`}function $t(){return`
        <form class="inst-form" id="form-pergunta" novalidate>
            <label class="inst-form-titulo" for="pergunta-texto">Qual é a sua dúvida sobre esta unidade?</label>
            <textarea id="pergunta-texto" name="texto" rows="2" maxlength="${C.pergunta.max}"
                placeholder="Ex.: Como é o estágio? Dá para conciliar o curso com o trabalho?"></textarea>
            <div class="inst-form-rodape">
                <span>Quem estudou aqui e a equipe do Futuro+ respondem.</span>
                <span class="inst-form-contador" data-contador>0/${C.pergunta.max}</span>
            </div>
            <p class="inst-form-erro" role="alert" hidden></p>
            <div class="inst-botoes">
                <button type="submit" class="inst-botao">Enviar pergunta</button>
                <button type="button" class="inst-botao inst-botao--claro" data-acao="cancelar-pergunta">Cancelar</button>
            </div>
        </form>`}function bt({fixas:a=[],perguntas:t=[],haMais:o=!1,conta:e={},abertas:s=new Set,perguntando:i=!1,respondendo:c="",textoResposta:u=""}={}){let d="";e.carregando||i?d="":Ga(e)?d='<button type="button" class="inst-botao inst-botao--pequeno" data-acao="perguntar">Fazer uma pergunta</button>':d='<a class="inst-botao inst-botao--pequeno inst-botao--claro" href="login.html">Entre para perguntar</a>';const m=[...t,...a];return`
        <header class="inst-cartao-topo">
            <h2><span class="inst-titulo-icone">${p.duvida}</span>Dúvidas frequentes</h2>
            ${d}
        </header>
        <p class="inst-cartao-sub">Qualquer pessoa com conta pergunta. Quem estudou aqui e a equipe do Futuro+ respondem.</p>
        ${i?$t():""}
        <div class="inst-duvidas">
            ${m.map(l=>vt(l,e,{aberta:s.has(l.id)||c===l.id,respondendo:c,textoResposta:u})).join("")}
        </div>
        ${o?'<button type="button" class="inst-ver-mais" data-acao="mais-perguntas">Ver mais perguntas</button>':""}`}function xt(a){return`
        <div class="inst-cartao inst-nao-encontrada">
            <p>${r(a)}</p>
            <a class="inst-botao" href="instituicoes.html">Ver todas as instituições</a>
        </div>`}const g=a=>document.getElementById(a),n={id:"",unidade:null,cursos:[],todosOsCursos:!1,avaliacao:void 0,comentarios:[],cursorComentarios:null,haMaisComentarios:!1,meusComentarios:[],editandoId:null,fixas:[],perguntas:[],cursorPerguntas:null,haMaisPerguntas:!1,abertas:new Set,perguntando:!1,respondendo:"",textoResposta:"",conta:{logado:!1,carregando:!0}};function V(){const a=new Set(n.meusComentarios.map(t=>t.certificadoId));n.conta={...n.conta,certificadosDisponiveis:(n.conta.certificados||[]).filter(t=>!a.has(t.id))}}function z(){g("inst-numeros").innerHTML=lt(n.unidade,n.cursos,n.avaliacao)}function da(){g("inst-cursos").innerHTML=mt(n.cursos,{todos:n.todosOsCursos})}function x(){g("quem-estudou").innerHTML=ft({comentarios:n.comentarios,total:n.avaliacao?n.avaliacao.total:n.comentarios.length,haMais:n.haMaisComentarios,conta:n.conta,meusComentarios:n.meusComentarios,editandoId:n.editandoId})}function v(){g("duvidas").innerHTML=bt({fixas:n.fixas,perguntas:n.perguntas,haMais:n.haMaisPerguntas,conta:n.conta,abertas:n.abertas,perguntando:n.perguntando,respondendo:n.respondendo,textoResposta:n.textoResposta})}function ua({somar:a=null,tirar:t=null}){const o=n.avaliacao||{media:0,total:0};let e=o.media*o.total,s=o.total;t!=null&&(e-=t,s-=1),a!=null&&(e+=a,s+=1),s=Math.max(0,s),n.avaliacao={media:s?e/s:0,total:s},z()}function k(a,t){document.title="Futuro+ | Instituições",g("inst-capa-miolo").innerHTML=ct(a),g("inst-carregando").outerHTML=xt(t)}function J(){const a=location.hash.length>1&&document.getElementById(decodeURIComponent(location.hash.slice(1)));a&&a.scrollIntoView({block:"start"})}const j=a=>setTimeout(()=>document.querySelector(a)?.focus(),0);function M(a,t){const o=a.querySelector(".inst-form-erro");o.textContent=t,o.hidden=!1}function Q(a,t){const o=a.querySelector('button[type="submit"]');o.dataset.rotulo=o.textContent,o.disabled=!0,o.textContent=t}function G(a){const t=a.querySelector('button[type="submit"]');t.disabled=!1,t.textContent=t.dataset.rotulo||t.textContent}function q(a,t){return console.error(a),a?.code==="permission-denied"?t:"Não deu para salvar agora. Confira a conexão e tente de novo."}const ma="O servidor não aceitou. Confira se o certificado desta unidade continua no seu Mural e tente de novo.";async function Ct(a){const t=Number(a.querySelector('input[name="nota"]:checked')?.value||0),o=a.querySelector("textarea").value,e=a.querySelector("#comentario-certificado")?.value||"",s=t?e?H(o,C.comentario):"Não encontrei o certificado para este comentário. Atualize a página e tente de novo.":"Escolha uma nota de 1 a 5.";if(s)return M(a,s);const i=n.editandoId?n.meusComentarios.find(c=>c.id===n.editandoId):null;Q(a,"Salvando...");try{const c=await Ya(n.id,n.conta,{texto:o,nota:t,certificadoId:e},i);n.meusComentarios=[...n.meusComentarios.filter(u=>u.id!==c.id),c],n.comentarios=n.comentarios.filter(u=>u.id!==c.id),n.editandoId=null,ua(i?{tirar:i.nota,somar:t}:{somar:t}),V(),x()}catch(c){M(a,q(c,ma)),G(a)}}async function yt(a,t){const o=n.meusComentarios.some(i=>i.id===a),e=o?n.meusComentarios.find(i=>i.id===a):n.comentarios.find(i=>i.id===a),s=o?"Apagar o seu comentário e a sua nota?":`Apagar o comentário de ${E(e?.nome)||"quem escreveu"}?`;if(confirm(s)){t.disabled=!0;try{await at(n.id,a),n.comentarios=n.comentarios.filter(i=>i.id!==a),o&&(n.meusComentarios=n.meusComentarios.filter(i=>i.id!==a),n.editandoId===a&&(n.editandoId=null),V()),e?.nota&&ua({tirar:e.nota}),x()}catch(i){t.disabled=!1,alert(q(i,"O servidor não aceitou apagar este comentário."))}}}async function Et(a){a.disabled=!0;try{const{itens:t,cursor:o,haMais:e}=await ia(n.id,{depois:n.cursorComentarios}),s=new Set(n.comentarios.map(i=>i.id));n.comentarios.push(...t.filter(i=>!s.has(i.id))),n.cursorComentarios=o,n.haMaisComentarios=e,x()}catch(t){console.error("Erro ao ler mais comentários:",t),a.disabled=!1}}const L=a=>n.perguntas.find(t=>t.id===a);async function St(a){const t=a.querySelector("textarea").value,o=H(t,C.pergunta);if(o)return M(a,o);Q(a,"Enviando...");try{const e=await tt(n.id,n.conta,t);n.perguntas=[e,...n.perguntas],n.perguntando=!1,n.abertas.add(e.id),v()}catch(e){M(a,q(e,"O servidor não aceitou a pergunta. Confirme o e-mail da sua conta e tente de novo.")),G(a)}}async function Mt(a,t){const o=a.querySelector("textarea").value,e=H(o,C.resposta);if(e)return M(a,e);Q(a,"Salvando...");try{const s=await ot(n.id,t,n.conta,o),i=L(t);i.respostas={...i.respostas||{},[n.conta.uid]:s},n.respondendo="",n.textoResposta="",n.abertas.add(t),v()}catch(s){M(a,q(s,n.conta.certificados?.length?ma:"O servidor não aceitou a resposta.")),G(a)}}async function qt(a,t,o){const e=L(a);if(!e)return;const s=t===n.conta.uid,i=e.respostas?.[t]?.equipe?"da Equipe Futuro+":`de ${E(e.respostas?.[t]?.nome)||"quem respondeu"}`;if(confirm(s?"Apagar a sua resposta?":`Apagar a resposta ${i}?`)){o.disabled=!0;try{await et(n.id,a,t);const c={...e.respostas||{}};delete c[t],e.respostas=c,v()}catch(c){o.disabled=!1,alert(q(c,"O servidor não aceitou apagar esta resposta."))}}}async function wt(a,t){const o=L(a);if(!o)return;const e=Object.keys(o.respostas||{}).length>0;if(confirm(e?"Apagar esta pergunta? As respostas somem junto.":"Apagar esta pergunta?")){t.disabled=!0;try{await st(n.id,a),n.perguntas=n.perguntas.filter(s=>s.id!==a),n.abertas.delete(a),v()}catch(s){t.disabled=!1,alert(q(s,"O servidor não aceitou apagar esta pergunta."))}}}async function Dt(a){a.disabled=!0;try{const{itens:t,cursor:o,haMais:e}=await ra(n.id,{depois:n.cursorPerguntas}),s=new Set(n.perguntas.map(i=>i.id));n.perguntas.push(...t.filter(i=>!s.has(i.id))),n.cursorPerguntas=o,n.haMaisPerguntas=e,v()}catch(t){console.error("Erro ao ler mais perguntas:",t),a.disabled=!1}}function At(a){const t=a.target.closest("[data-acao]");if(t)switch(t.dataset.acao){case"editar-comentario":n.editandoId=t.dataset.id,x(),j("#comentario-texto");break;case"cancelar-comentario":n.editandoId=null,x();break;case"apagar-comentario":yt(t.dataset.id,t);break;case"mais-comentarios":Et(t);break}}function Pt(a){const t=a.target.closest("[data-acao]");if(!t)return;const o=t.dataset.pergunta||"";switch(t.dataset.acao){case"perguntar":n.perguntando=!0,v(),j("#pergunta-texto");break;case"cancelar-pergunta":n.perguntando=!1,v();break;case"responder":case"editar-resposta":n.respondendo=o,n.textoResposta=t.dataset.acao==="editar-resposta"&&L(o)?.respostas?.[n.conta.uid]?.texto||"",n.abertas.add(o),v(),j(`#resposta-${CSS.escape(o)}`);break;case"cancelar-resposta":n.respondendo="",n.textoResposta="",v();break;case"apagar-resposta":qt(o,t.dataset.uid,t);break;case"apagar-pergunta":wt(o,t);break;case"mais-perguntas":Dt(t);break}}function W(a){if(a.target.tagName!=="TEXTAREA")return;const t=a.target.closest("form")?.querySelector("[data-contador]");t&&(t.textContent=`${a.target.value.length}/${a.target.maxLength}`)}function Lt(){g("inst-cursos").addEventListener("click",o=>{o.target.closest('[data-acao="todos-os-cursos"]')&&(n.todosOsCursos=!0,da())});const a=g("quem-estudou");a.addEventListener("click",At),a.addEventListener("submit",o=>{o.target.id==="form-comentario"&&(o.preventDefault(),Ct(o.target))});const t=g("duvidas");t.addEventListener("click",Pt),t.addEventListener("submit",o=>{const e=o.target;e.id==="form-pergunta"?(o.preventDefault(),St(e)):e.dataset.form==="resposta"&&(o.preventDefault(),Mt(e,e.dataset.pergunta))}),t.addEventListener("toggle",o=>{const e=o.target;e.matches?.("details[data-pergunta]")&&(e.open?n.abertas.add(e.dataset.pergunta):n.abertas.delete(e.dataset.pergunta))},!0),a.addEventListener("input",W),t.addEventListener("input",W)}async function kt(){const a=new URLSearchParams(location.search).get("u")||"";if(!a||a.includes("/")){k("Instituição não encontrada","O endereço está incompleto. Escolha a unidade na lista de instituições.");return}n.id=a;let t=null;try{t=await Xa(a)}catch(o){console.error("Erro ao ler a unidade:",o),k("Não deu para abrir esta instituição","Confira a conexão e tente de novo em instantes.");return}if(!t){k("Instituição não encontrada","A unidade pode ter saído do cadastro. Procure por ela na lista de instituições.");return}n.unidade=t,n.cursos=P(t),n.fixas=Ka(t,n.cursos),document.title=`Futuro+ | ${t.nome}`,g("inst-capa-miolo").innerHTML=rt(t,n.cursos),z(),g("inst-sobre").innerHTML=ut(t,n.cursos),da(),x(),v(),g("inst-carregando").hidden=!0,g("inst-conteudo").hidden=!1,Lt(),J(),Ja(a).then(o=>{n.avaliacao=o}).catch(o=>{console.error("Erro ao ler a média das notas:",o),n.avaliacao=null}).finally(()=>{z(),x()}),ia(a).then(({itens:o,cursor:e,haMais:s})=>{n.comentarios=o,n.cursorComentarios=e,n.haMaisComentarios=s,x(),location.hash==="#quem-estudou"&&J()}).catch(o=>console.error("Erro ao ler os comentários:",o)),ra(a).then(({itens:o,cursor:e,haMais:s})=>{n.perguntas=o,n.cursorPerguntas=e,n.haMaisPerguntas=s,v()}).catch(o=>console.error("Erro ao ler as dúvidas:",o)),nt(a,async o=>{if(n.editandoId=null,n.respondendo="",n.perguntando=!1,n.meusComentarios=[],o.logado&&o.certificados?.length)try{n.meusComentarios=await Wa(a,o.uid)}catch(e){console.error("Erro ao ler os seus comentários:",e)}n.conta=o,V(),x(),v()})}document.addEventListener("DOMContentLoaded",kt);
