import{f as C,d as D,c as M,g as A,e as L,a as x}from"./firebase-config-BVis2Pi9.js";import"./dashboard-C2k9bNtH.js";/* empty css                    */import{n as b,e as s}from"./card-unidade-C3eEs3Rs.js";import{r as S,c as j,a as q,P as y}from"./recomendacao-cursos-DVwNSw8t.js";import{f as O}from"./geocodificacao-Dyu2Eb0t.js";import{d as T,r as H,a as B}from"./demanda-curso-DyeAT6sC.js";import"./preload-helper-PPVm8Dsz.js";import"./conteudo-legal-padrao-DcxCgRAC.js";import"./resultado-teste-MujYfBC_.js";import"./categorias-teste-82RqXHiT.js";const U=Object.assign({});function V(a){return(a||"").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"")}const R=new Map(Object.entries(U).map(([a,e])=>{const o=a.split("/").pop().replace(/\.[^.]+$/,"");return[V(o),e]})),N={cores:["#25357e","#4e6ee8"],icone:'<path d="m2 9 10-5 10 5-10 5z"/><path d="M6 11.5V16c0 1.5 2.7 3 6 3s6-1.5 6-3v-4.5M22 9v5"/>'},P={"ambiente-e-saude":{cores:["#0b6b63","#1fa890"],icone:'<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/><path d="M8 11.5h2.2l1-2.2 1.6 4.4 1-2.2H16"/>'},"controle-e-processos-industriais":{cores:["#2f3f7d","#5a73c7"],icone:'<circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="6.5"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1"/>'},"desenvolvimento-educacional-e-social":{cores:["#5a3299","#8a63d2"],icone:'<circle cx="9" cy="8" r="3"/><path d="M3 20a6 6 0 0 1 12 0M16 5.2a3 3 0 0 1 0 5.6M17 14.3a6 6 0 0 1 4 5.7"/>'},"gestao-e-negocios":{cores:["#25357e","#4e6ee8"],icone:'<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 13h18"/>'},"informacao-e-comunicacao":{cores:["#17458f","#2e86d6"],icone:'<path d="m8 8-4 4 4 4M16 8l4 4-4 4M13.5 5l-3 14"/>'},infraestrutura:{cores:["#7a4a12","#bd8126"],icone:'<path d="M4 21V6l8-3v18M12 9l8 2v10M2 21h20M7.5 9h.01M7.5 13h.01M7.5 17h.01M16 14h.01M16 17.5h.01"/>'},"producao-alimenticia":{cores:["#a03d20","#dc6b3a"],icone:'<path d="M7 3v8M4.5 3v4.5a2.5 2.5 0 0 0 5 0V3M7 11v10M17 3c-2 1.5-3 4-3 7h3zM17 3v18"/>'},"producao-cultural-e-design":{cores:["#962b6f","#d4539f"],icone:'<path d="M12 3a9 9 0 1 0 0 18c1.4 0 2-1 2-2 0-1.4-1-1.6-1-2.8 0-1 .8-1.7 1.8-1.7H17a4 4 0 0 0 4-4c0-4.2-4-7.5-9-7.5z"/><path d="M7.5 12h.01M9.5 8h.01M14 7h.01"/>'},"producao-industrial":{cores:["#225a69","#3f97ab"],icone:'<path d="M3 21V10l6 4v-4l6 4V5h4v16zM3 21h18M7.5 17.5h.01M12 17.5h.01M16.5 17.5h.01"/>'},"recursos-naturais":{cores:["#256b2d","#4fa043"],icone:'<path d="M5 19c0-8 5-13 15-14 0 9-4 14.5-12 14.5M5 19c2-5 5.5-8 10-10M5 19v2"/>'},seguranca:{cores:["#222d44","#4a5d82"],icone:'<path d="M12 3 5 6v5.5c0 4.5 3 8 7 9.5 4-1.5 7-5 7-9.5V6z"/><path d="m9 12 2.2 2.2L15 10.5"/>'},"turismo-hospitalidade-e-lazer":{cores:["#0b6f90","#27a9c6"],icone:'<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5z"/>'}};function k(a){const e=V(a),o=P[e]||N;return{slug:e,foto:R.get(e)||null,...o}}const F="cursos",_="/dados/catalogo-cursos.json",l={curso:null,unidades:[],avaliar:null,matriz:0};async function X(a){const e=await fetch(_);return e.ok&&(await e.json()).find(t=>t.slug===a)||null}function G(a){return b(a).replace(/\s+/g,"-")}function u(a){return Number(a||0).toLocaleString("pt-BR")}const Y={relogio:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',calendario:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',eixo:'<rect x="7" y="7" width="10" height="10" rx="1.5"/><path d="M10 3v4M14 3v4M10 17v4M14 17v4M3 10h4M3 14h4M17 10h4M17 14h4"/>',livro:'<path d="M4 5a2 2 0 0 1 2-2h5v17H6a2 2 0 0 0-2 2zM20 5a2 2 0 0 0-2-2h-5v17h5a2 2 0 0 1 2 2z"/>',maleta:'<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 13h18"/>',ferramenta:'<path d="M14.5 6.5a4 4 0 0 0 5 5L11 20a2.1 2.1 0 0 1-3-3z"/><path d="m14.5 6.5 3-3 3 3-3 3"/>',capelo:'<path d="m2 9 10-5 10 5-10 5z"/><path d="M6 11.5V16c0 1.5 2.7 3 6 3s6-1.5 6-3v-4.5M22 9v5"/>',barras:'<path d="M5 20v-8M12 20V5M19 20v-11M3 20h18"/>',camadas:'<path d="m12 3 9 5-9 5-9-5zM3 13l9 5 9-5M3 18l9 5 9-5"/>',pessoas:'<circle cx="9" cy="8" r="3"/><path d="M3 20a6 6 0 0 1 12 0M16 5.2a3 3 0 0 1 0 5.6M17 14.3a6 6 0 0 1 4 5.7"/>',baixar:'<path d="M12 4v11M7 11l5 5 5-5M5 20h14"/>',fechar:'<path d="M6 6l12 12M18 6 6 18"/>'};function m(a,e=22){return`<svg class="icone" width="${e}" height="${e}" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
        aria-hidden="true">${Y[a]}</svg>`}function J(a,e){return`
        <div class="curso-capa curso-capa--padrao" aria-hidden="true"
            style="--capa-escura:${e.cores[0]};--capa-clara:${e.cores[1]}">
            <svg class="curso-capa-fundo" viewBox="0 0 600 190" preserveAspectRatio="xMidYMid slice">
                <circle cx="150" cy="-30" r="130" fill="#fff" opacity=".06"/>
                <circle cx="60" cy="210" r="120" fill="#fff" opacity=".05"/>
                <path d="M0 150 C120 110 220 190 340 140 S520 100 600 135 V190 H0z" fill="#fff" opacity=".09"/>
                <path d="M0 172 C140 146 250 194 380 168 S540 148 600 164 V190 H0z" fill="#fff" opacity=".12"/>
            </svg>
            <span class="curso-capa-selo">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"
                    stroke-linecap="round" stroke-linejoin="round">${e.icone}</svg>
            </span>
            ${a?`<span class="curso-capa-eixo">${s(a)}</span>`:""}
        </div>`}function K(a){const e=(a.eixos||[])[0]||"",o=k(e),t=J(e,o),n=a.imagemUrl||o.foto;return n?`
        <div class="curso-capa curso-capa--foto" data-capa-com-foto>
            <img src="${s(n)}" alt="" loading="lazy" referrerpolicy="no-referrer">
            ${!a.imagemUrl&&e?`<span class="curso-capa-eixo">${s(e)}</span>`:""}
            <template>${t}</template>
        </div>`:t}function Q(a){const e=[["relogio","Duração",a.duracao],["calendario","Carga horária",a.cargaHoraria?`${u(a.cargaHoraria)} horas`:""],["eixo","Eixo tecnológico",(a.eixos||[]).join(", ")]].filter(([,,o])=>o);return e.length?`
        <div class="curso-ficha">
            ${e.map(([o,t,n])=>`
                <div class="curso-ficha-item">
                    ${m(o,30)}
                    <div>
                        <span class="curso-ficha-rotulo">${s(t)}</span>
                        <strong>${s(String(n))}</strong>
                    </div>
                </div>`).join("")}
        </div>`:""}function W(a){const e=[];return a.preRequisitos&&e.push(`<div class="curso-aviso curso-aviso--requisito">
            <strong>Este curso exige formação anterior.</strong>
            <span>${s(a.preRequisitos)}</span>
        </div>`),a.provaAptidao&&e.push(`<div class="curso-aviso curso-aviso--aptidao">
            <strong>Tem prova de aptidão.</strong>
            <span>Além da prova escrita do Vestibulinho, quem se inscreve neste curso faz uma prova prática.</span>
        </div>`),e.join("")}function $(a,e,o){return o?`
        <section class="curso-bloco">
            <h2>${m(a)} ${s(e)}</h2>
            <p>${s(o)}</p>
        </section>`:""}function Z({nivel:a,km:e}){if(e!=null){const o=O(e);return`${o.charAt(0).toUpperCase()}${o.slice(1)} de você`}return a===y.CIDADE?"Na sua cidade":a===y.REGIAO?"Na sua região":""}const E=8;function aa(a,e,o){if(!a)return'<p class="sem-cursos">Carregando unidades...</p>';if(!a.length)return'<p class="sem-cursos">Nenhuma unidade do cadastro oferece este curso no momento.</p>';const t=a.map(r=>({unidade:r,proximidade:e?e(r):null}));e&&t.sort((r,c)=>r.proximidade.ordem-c.proximidade.ordem||(r.unidade.nome||"").localeCompare(c.unidade.nome||"","pt-BR"));const n=t.length-E,i=n>0?`<a class="curso-ver-todas" href="instituicoes.html?curso=${encodeURIComponent(o)}">
             Ver as outras ${n} unidades &rarr;</a>`:"";return`<ul class="curso-unidades">
        ${t.slice(0,E).map(({unidade:r,proximidade:c})=>{const d=c?Z(c):"";return`<li>
                <span class="curso-unidade-nome">${s(r.nome)}</span>
                <span class="curso-unidade-cidade">${s(r.municipio||"")}</span>
                ${d?`<span class="curso-unidade-km">${s(d)}</span>`:""}
            </li>`}).join("")}
    </ul>
    ${i}`}function ea(a){if(a.serie.length<2)return`
            <div class="demanda-numero">
                <strong>${s(a.porVagaTexto)}</strong>
                <span>candidatos por vaga em ${a.ano}</span>
            </div>`;const e=Math.max(...a.serie.map(t=>t.porVaga));return`
        <figure class="demanda-grafico">
            <figcaption>Candidatos por vaga, ano a ano</figcaption>
            <ul class="demanda-colunas">${a.serie.map((t,n)=>{const i=n===a.serie.length-1,r=Math.max(4,Math.round(t.porVaga/e*100)),c=`${u(t.inscritos)} inscritos · ${u(t.vagas)} vagas`;return`
            <li class="demanda-coluna${i?" demanda-coluna--atual":""}" tabindex="0"
                aria-label="${t.ano}: ${s(t.porVagaTexto)} candidatos por vaga, ${s(c)}">
                <span class="demanda-dica" aria-hidden="true">
                    <strong>${s(t.porVagaTexto)} por vaga</strong>${s(c)}
                </span>
                <span class="demanda-area" aria-hidden="true">
                    <span class="demanda-valor">${s(t.porVagaTexto)}</span>
                    <span class="demanda-barra" style="height:${r}%"></span>
                </span>
                <span class="demanda-ano" aria-hidden="true">${t.ano}</span>
            </li>`}).join("")}</ul>
        </figure>`}function oa(a){const e=H(a.demanda);if(!e)return"";const o=a.nivel==="superior",t=o?"Vestibular das Fatecs":"Vestibulinho das Etecs",n=o?"Fatecs":"Etecs",i=e.semestre===2?"2º":"1º";return`
        <section class="curso-cartao curso-demanda">
            <h2>${m("barras")} Demanda por curso</h2>
            <div class="curso-demanda-corpo">
                <div class="curso-demanda-texto">
                    <p>No ${t} do ${i} semestre de ${e.ano},
                        <strong>${u(e.inscritos)} pessoas</strong> se inscreveram para
                        <strong>${u(e.vagas)} vagas</strong>${e.unidades?` em ${u(e.unidades)} ${n}`:""}.</p>
                    <div class="demanda-selo">
                        ${m("pessoas",30)}
                        <div>
                            <strong>${s(e.nivel.rotulo)}</strong>
                            <span>${s(e.porVagaTexto)} candidatos por vaga.
                                ${s(e.nivel.descricao)}</span>
                        </div>
                    </div>
                </div>
                ${ea(e)}
            </div>
            <details class="demanda-tabela">
                <summary>Ver os números de cada ano</summary>
                <table>
                    <thead><tr><th>Ano</th><th>Inscritos</th><th>Vagas</th><th>Por vaga</th></tr></thead>
                    <tbody>${e.serie.map(r=>`
                        <tr><td>${r.ano}</td><td>${u(r.inscritos)}</td>
                            <td>${u(r.vagas)}</td><td>${s(r.porVagaTexto)}</td></tr>`).join("")}
                    </tbody>
                </table>
            </details>
            <p class="curso-nota">Soma de todas as unidades do estado, do site oficial do ${t}.
                Em cada unidade a concorrência pode ser bem maior ou menor.</p>
        </section>`}function w(a){return(a.matrizes||[]).filter(e=>(e?.componentes||[]).length)}function ta(a){return(a.destaques||[]).length?a.destaques:B(a)}function v(a){return[T(a),a.cargaHoraria?`${u(a.cargaHoraria)} horas`:""].filter(Boolean).join(" · ")}function sa(a){const e=w(a);if(!e.length)return"";const o=Math.min(l.matriz,e.length-1),t=e[o],n=ta(t),i=t.componentes.filter(c=>c.grupo==="tecnica").length,r=e.length>1?`<div class="matriz-abas" role="group" aria-label="Matriz de qual forma de oferta">
            ${e.map((c,d)=>`
                <button type="button" class="matriz-aba${d===o?" matriz-aba--ativa":""}"
                    data-matriz-aba="${d}" aria-pressed="${d===o}">${s(c.titulo)}</button>`).join("")}
           </div>`:"";return`
        <section class="curso-cartao curso-matriz">
            <div class="curso-cartao-topo">
                <h2>${m("camadas")} Matriz Curricular</h2>
                <button type="button" class="btn-matriz-completa" data-abrir-matriz>
                    ${m("baixar",16)} Ver matriz completa
                </button>
            </div>
            ${r}
            <p class="curso-matriz-sub">Confira as principais disciplinas do curso:</p>
            <ul class="curso-etiquetas">
                ${n.map(c=>`<li>${s(c)}</li>`).join("")}
                ${i>n.length?'<li class="curso-etiqueta--mais">Entre outras disciplinas…</li>':""}
            </ul>
            <p class="curso-nota">${s(t.titulo)}${v(t)?` · ${s(v(t))}`:""}</p>
        </section>`}function ra(a,e){const o=a.tipoEtapa==="série";return`${e+1}${o?"ª":"º"} ${a.tipoEtapa}`}function na(){const a=w(l.curso||{}),e=a[Math.min(l.matriz,a.length-1)];if(!e)return;const o=Array.from({length:e.etapas},(t,n)=>{const i=e.componentes.filter(f=>(f.aulas?.[n]||0)>0),r=f=>i.filter(p=>p.grupo===f).map(p=>`
            <tr>
                <td>${s(p.nome)}${p.tipo?`<span class="matriz-tipo">${s(p.tipo)}</span>`:""}</td>
                <td>${u(p.aulas[n])}</td>
            </tr>`).join(""),c=r("tecnica"),d=r("base");return`
            <section class="matriz-etapa">
                <h3>${s(ra(e,n))}</h3>
                <table>
                    <thead><tr><th>Disciplina</th><th>Aulas</th></tr></thead>
                    <tbody>
                        ${c&&d?'<tr class="matriz-grupo"><th colspan="2">Formação técnica</th></tr>':""}
                        ${c}
                        ${d?`<tr class="matriz-grupo"><th colspan="2">Ensino médio</th></tr>${d}`:""}
                    </tbody>
                </table>
            </section>`}).join("");document.getElementById("dialogo-matriz-conteudo").innerHTML=`
        <div class="painel-unidade-topo">
            <div class="painel-unidade-identidade">
                <h2 id="dialogo-matriz-titulo">Matriz curricular · ${s(l.curso.nome)}</h2>
                <p class="painel-unidade-local">${s(e.titulo)}${v(e)?` · ${s(v(e))}`:""}</p>
            </div>
            <button type="button" class="painel-unidade-fechar" data-fechar-painel aria-label="Fechar">
                ${m("fechar",18)}
            </button>
        </div>
        <div class="matriz-etapas">
            ${o}
            <p class="curso-nota">Aulas de 50 minutos, somadas no ano ou semestre. A grade pode ter pequenas
                diferenças de uma unidade para outra; confirme na escola onde você pretende estudar.</p>
        </div>`,document.getElementById("dialogo-matriz").showModal()}function g(a,e,o){Object.assign(l,{curso:a,unidades:e,avaliar:o});const t=document.getElementById("curso-detalhe");document.title=`Futuro+ | ${a.nome}`;const n=[$("livro","O que você aprende",a.descricao),$("ferramenta","O que o profissional faz",a.atuacao),$("maleta","Onde se trabalha",a.ondeTrabalhar)].join(""),i=[oa(a),sa(a)].filter(Boolean);t.innerHTML=`
        <header class="curso-topo">
            <div class="curso-topo-texto">
                <h1>${s(a.nome)}</h1>
                <div class="curso-modalidades">
                    ${(a.modalidades||[]).map(c=>`<span class="tag-modalidade">${s(c)}</span>`).join("")}
                </div>
            </div>
            ${K(a)}
        </header>

        ${Q(a)}
        ${W(a)}

        <div class="curso-grade${n?"":" curso-grade--unica"}">
            ${n?`<div class="curso-cartao curso-textos">${n}</div>`:""}
            <section class="curso-cartao curso-onde-estudar">
                <h2>${m("capelo")} Onde estudar</h2>
                ${aa(e,o,a.nome)}
            </section>
        </div>

        ${i.length?`<div class="curso-grade curso-grade--dados${i.length===1?" curso-grade--unica":""}">
            ${i.join("")}
        </div>`:""}

        <p class="curso-fonte">Informações do catálogo oficial do Centro Paula Souza, mantidas no Futuro+.</p>
    `;const r=t.querySelector("[data-capa-com-foto]");r?.querySelector("img").addEventListener("error",()=>{r.outerHTML=r.querySelector("template").innerHTML})}function ia(){document.getElementById("curso-detalhe").addEventListener("click",e=>{if(e.target.closest("[data-abrir-matriz]")){na();return}const o=e.target.closest("[data-matriz-aba]");o&&l.curso&&(l.matriz=Number(o.dataset.matrizAba),g(l.curso,l.unidades,l.avaliar),document.querySelector(`[data-matriz-aba="${l.matriz}"]`)?.focus())});const a=document.getElementById("dialogo-matriz");a.addEventListener("click",e=>{(e.target===a||e.target.closest("[data-fechar-painel]"))&&a.close()})}function ca(a){const e=document.getElementById("curso-plano-pdf");if(!a.planoCursoUrl){e.hidden=!0;return}document.getElementById("curso-plano-pdf-iframe").src=a.planoCursoUrl,document.getElementById("curso-plano-pdf-abrir").href=a.planoCursoUrl,e.hidden=!1}async function da(){await x.authStateReady();const a=x.currentUser;if(!a)return null;const e=await C(D(M,"usuarios",a.uid)),o=await S(a.uid,e.exists()?e.data():null);if(!o)return null;const t=await j().catch(()=>null);return q(o,t)}async function la(){const a=document.getElementById("curso-detalhe"),e=new URLSearchParams(window.location.search),o=e.get("c")||e.get("curso")||"";if(!o){a.innerHTML='<p class="sem-resultados">Curso não informado. Volte para a lista de cursos.</p>';return}try{const t=G(o),n=await C(D(M,F,t)).catch(()=>null),i=n?.exists()?n.data():await X(t);if(!i){a.innerHTML=`<p class="sem-resultados">
                Ainda não temos a descrição deste curso.
                <a href="instituicoes.html?curso=${encodeURIComponent(o)}">Ver as unidades que oferecem</a>.
            </p>`;return}ca(i),g(i,null,null);const r=b(i.nome),c=i.nivel==="superior",f=(await A(L(M,"instituicoes")).catch(h=>(console.error("Erro ao carregar as unidades do curso:",h),{docs:[]}))).docs.map(h=>({id:h.id,...h.data()})).filter(h=>{if(!(h.cursos||[]).some(I=>b(I?.nome)===r))return!1;const z=(h.tipo||"").trim().toLowerCase()==="fatec";return c?z:!z});g(i,f,null);const p=await da().catch(()=>null);p&&g(i,f,p)}catch(t){console.error("Erro ao carregar o curso:",t),a.innerHTML='<p class="sem-resultados">Não foi possível carregar este curso agora. Tente novamente mais tarde.</p>'}}document.addEventListener("DOMContentLoaded",()=>{ia(),la()});
