import{a as $,g as I,d as S,b as M,c as A,e as O}from"./firebase-config-h-KQCxoQ.js";import"./dashboard-CTg4YrJA.js";/* empty css                    */import{a as B,d as U,n as x,e as s}from"./card-unidade-I-oVmKo3.js";import{r as H,c as P,a as R,P as D}from"./recomendacao-cursos-2jPMRLhP.js";import{f as F}from"./geocodificacao-BkfVnwNK.js";import{r as k}from"./demanda-curso-Bz72gXLF.js";import{c as N,t as T,h as _,e as G,b as X,f as C,g as Y}from"./matriz-interativa-BJHZQ_Hx.js";import{c as J,a as q}from"./capas-eixos-GInZ-sis.js";import"./preload-helper-PPVm8Dsz.js";import"./conteudo-legal-padrao-DcxCgRAC.js";import"./resultado-teste-xMN1ahPz.js";import"./notificacoes-util-BE-pPj56.js";import"./categorias-teste-82RqXHiT.js";const K="cursos",Q="/dados/catalogo-cursos.json",c={curso:null,unidades:[],avaliar:null,matriz:0,fotosDosEixos:{},logado:!1};async function W(a){const o=await fetch(Q);return o.ok&&(await o.json()).find(e=>e.slug===a)||null}function Z(a){return x(a).replace(/\s+/g,"-")}function f(a){return Number(a||0).toLocaleString("pt-BR")}const aa={relogio:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',calendario:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',livro:'<path d="M4 5a2 2 0 0 1 2-2h5v17H6a2 2 0 0 0-2 2zM20 5a2 2 0 0 0-2-2h-5v17h5a2 2 0 0 1 2 2z"/>',maleta:'<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 13h18"/>',ferramenta:'<path d="M14.5 6.5a4 4 0 0 0 5 5L11 20a2.1 2.1 0 0 1-3-3z"/><path d="m14.5 6.5 3-3 3 3-3 3"/>',capelo:'<path d="m2 9 10-5 10 5-10 5z"/><path d="M6 11.5V16c0 1.5 2.7 3 6 3s6-1.5 6-3v-4.5M22 9v5"/>',barras:'<path d="M5 20v-8M12 20V5M19 20v-11M3 20h18"/>',camadas:'<path d="m12 3 9 5-9 5-9-5zM3 13l9 5 9-5M3 18l9 5 9-5"/>',pessoas:'<circle cx="9" cy="8" r="3"/><path d="M3 20a6 6 0 0 1 12 0M16 5.2a3 3 0 0 1 0 5.6M17 14.3a6 6 0 0 1 4 5.7"/>',baixar:'<path d="M12 4v11M7 11l5 5 5-5M5 20h14"/>',fechar:'<path d="M6 6l12 12M18 6 6 18"/>',local:'<path d="M12 21s7-7.4 7-12a7 7 0 1 0-14 0c0 4.6 7 12 7 12z"/><circle cx="12" cy="9" r="2.5"/>'};function h(a,o=22){return L(aa[a],o)}function L(a,o=22){return`<svg class="icone" width="${o}" height="${o}" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
        aria-hidden="true">${a}</svg>`}function oa(a,o){return`
        <div class="curso-capa curso-capa--padrao" aria-hidden="true"
            style="--capa-escura:${o.cores[0]};--capa-clara:${o.cores[1]}">
            <svg class="curso-capa-fundo" viewBox="0 0 600 190" preserveAspectRatio="xMidYMid slice">
                <circle cx="150" cy="-30" r="130" fill="#fff" opacity=".06"/>
                <circle cx="60" cy="210" r="120" fill="#fff" opacity=".05"/>
                <path d="M0 150 C120 110 220 190 340 140 S520 100 600 135 V190 H0z" fill="#fff" opacity=".09"/>
                <path d="M0 172 C140 146 250 194 380 168 S540 148 600 164 V190 H0z" fill="#fff" opacity=".12"/>
            </svg>
            <span class="curso-capa-selo">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"
                    stroke-linecap="round" stroke-linejoin="round">${o.icone}</svg>
            </span>
            ${a?`<span class="curso-capa-eixo">${s(a)}</span>`:""}
        </div>`}function ea(a){const o=(a.eixos||[])[0]||"",t=q(o,c.fotosDosEixos),e=oa(o,t),i=a.imagemUrl||t.foto;return i?`
        <div class="curso-capa curso-capa--foto" data-capa-com-foto>
            <img src="${s(i)}" alt="" loading="lazy" referrerpolicy="no-referrer">
            ${!a.imagemUrl&&o?`<span class="curso-capa-eixo">${s(o)}</span>`:""}
            <template>${e}</template>
        </div>`:e}function ta(a){const o=q((a.eixos||[])[0]||"").icone,t=[[h("relogio",30),"Duração",a.duracao],[h("calendario",30),"Carga horária",a.cargaHoraria||C(a)?`${f(a.cargaHoraria||C(a))} horas`:""],[L(o,30),"Eixo tecnológico",(a.eixos||[]).join(", ")]].filter(([,,e])=>e);return t.length?`
        <div class="curso-ficha">
            ${t.map(([e,i,d])=>`
                <div class="curso-ficha-item">
                    ${e}
                    <div>
                        <span class="curso-ficha-rotulo">${s(i)}</span>
                        <strong>${s(String(d))}</strong>
                    </div>
                </div>`).join("")}
        </div>`:""}function sa(a){const o=[];return a.preRequisitos&&o.push(`<div class="curso-aviso curso-aviso--requisito">
            <strong>Este curso exige formação anterior.</strong>
            <span>${s(a.preRequisitos)}</span>
        </div>`),a.provaAptidao&&o.push(`<div class="curso-aviso curso-aviso--aptidao">
            <strong>Tem prova de aptidão.</strong>
            <span>Além da prova escrita do Vestibulinho, quem se inscreve neste curso faz uma prova prática.</span>
        </div>`),o.join("")}function z(a,o,t){return t?`
        <section class="curso-bloco">
            <h2>${h(a)} ${s(o)}</h2>
            <p>${s(t)}</p>
        </section>`:""}function ra({nivel:a,km:o}){if(o!=null){const t=F(o);return`${t.charAt(0).toUpperCase()}${t.slice(1)} de você`}return a===D.CIDADE?"Na sua cidade":a===D.REGIAO?"Na sua região":""}const w=8;function ia(a,o){return o?`<p class="inst-dica-proximidade">${h("local",18)} Complete seu endereço no
             <a href="perfil.html">perfil</a> para ver as ${a} mais pertinho de você.</p>`:`<p class="inst-dica-proximidade">${h("local",18)}
             <a href="login.html">Entre na sua conta</a> para ver as ${a} mais pertinho de você.</p>`}function na(a,o,t,e){if(!a)return'<p class="sem-cursos">Carregando unidades...</p>';if(!a.length)return'<p class="sem-cursos">Nenhuma unidade do cadastro oferece este curso no momento.</p>';const i=t.nivel==="superior"?"Fatecs":"Etecs",d=o?"":ia(i,e),r=a.map(l=>({unidade:l,proximidade:o?o(l):null}));o&&r.sort((l,p)=>l.proximidade.ordem-p.proximidade.ordem||(l.unidade.nome||"").localeCompare(p.unidade.nome||"","pt-BR"));const n=r.length-w,u=n>0?`<a class="curso-ver-todas" href="instituicoes.html?curso=${encodeURIComponent(t.nome)}">
             Ver as outras ${n} unidades &rarr;</a>`:"";return`${d}<ul class="curso-unidades">
        ${r.slice(0,w).map(({unidade:l,proximidade:p})=>{const g=p?ra(p):"";return`<li>
                <span class="curso-unidade-nome">${s(l.nome)}</span>
                <span class="curso-unidade-cidade">${s(l.municipio||"")}</span>
                ${g?`<span class="curso-unidade-km">${s(g)}</span>`:""}
            </li>`}).join("")}
    </ul>
    ${u}`}function ca(a){if(a.serie.length<2)return`
            <div class="demanda-numero">
                <strong>${s(a.porVagaTexto)}</strong>
                <span>candidatos por vaga em ${a.ano}</span>
            </div>`;const o=Math.max(...a.serie.map(e=>e.porVaga));return`
        <figure class="demanda-grafico">
            <figcaption>Candidatos por vaga, ano a ano</figcaption>
            <ul class="demanda-colunas">${a.serie.map((e,i)=>{const d=i===a.serie.length-1,r=Math.max(4,Math.round(e.porVaga/o*100)),n=`${f(e.inscritos)} inscritos · ${f(e.vagas)} vagas`;return`
            <li class="demanda-coluna${d?" demanda-coluna--atual":""}" tabindex="0"
                aria-label="${e.ano}: ${s(e.porVagaTexto)} candidatos por vaga, ${s(n)}">
                <span class="demanda-dica" aria-hidden="true">
                    <strong>${s(e.porVagaTexto)} por vaga</strong>${s(n)}
                </span>
                <span class="demanda-area" aria-hidden="true">
                    <span class="demanda-valor">${s(e.porVagaTexto)}</span>
                    <span class="demanda-barra" style="height:${r}%"></span>
                </span>
                <span class="demanda-ano" aria-hidden="true">${e.ano}</span>
            </li>`}).join("")}</ul>
        </figure>`}function da(a){const o=k(a.demanda);if(!o)return"";const t=a.nivel==="superior",e=t?"Vestibular das Fatecs":"Vestibulinho das Etecs",i=t?"Fatecs":"Etecs",d=o.semestre===2?"2º":"1º";return`
        <section class="curso-cartao curso-demanda">
            <h2>${h("barras")} Demanda por curso</h2>
            <div class="curso-demanda-corpo">
                <div class="curso-demanda-texto">
                    <p>No ${e} do ${d} semestre de ${o.ano},
                        <strong>${f(o.inscritos)} pessoas</strong> se inscreveram para
                        <strong>${f(o.vagas)} vagas</strong>${o.unidades?` em ${f(o.unidades)} ${i}`:""}.</p>
                    <div class="demanda-selo">
                        ${h("pessoas",30)}
                        <div>
                            <strong>${s(o.nivel.rotulo)}</strong>
                            <span>${s(o.porVagaTexto)} candidatos por vaga.
                                ${s(o.nivel.descricao)}</span>
                        </div>
                    </div>
                </div>
                ${ca(o)}
            </div>
            <details class="demanda-tabela">
                <summary>Ver os números de cada ano</summary>
                <table>
                    <thead><tr><th>Ano</th><th>Inscritos</th><th>Vagas</th><th>Por vaga</th></tr></thead>
                    <tbody>${o.serie.map(r=>`
                        <tr><td>${r.ano}</td><td>${f(r.inscritos)}</td>
                            <td>${f(r.vagas)}</td><td>${s(r.porVagaTexto)}</td></tr>`).join("")}
                    </tbody>
                </table>
            </details>
            <p class="curso-nota">Soma de todas as unidades do estado, do site oficial do ${e}.
                Em cada unidade a concorrência pode ser bem maior ou menor.</p>
        </section>`}function V(a){return(a.matrizes||[]).filter(o=>(o?.componentes||[]).length)}function la(a){return(a.destaques||[]).length?a.destaques:Y(a)}function b(a){return[X(a),a.cargaHoraria?`${f(a.cargaHoraria)} horas`:""].filter(Boolean).join(" · ")}function ua(a){const o=V(a);if(!o.length)return"";const t=Math.min(c.matriz,o.length-1),e=o[t],i=la(e),d=e.componentes.filter(n=>n.grupo==="tecnica").length,r=o.length>1?`<div class="matriz-abas" role="group" aria-label="Matriz de qual forma de oferta">
            ${o.map((n,u)=>`
                <button type="button" class="matriz-aba${u===t?" matriz-aba--ativa":""}"
                    data-matriz-aba="${u}" aria-pressed="${u===t}">${s(n.titulo)}</button>`).join("")}
           </div>`:"";return`
        <section class="curso-cartao curso-matriz">
            <div class="curso-cartao-topo">
                <h2>${h("camadas")} Matriz Curricular</h2>
                <button type="button" class="btn-matriz-completa" data-abrir-matriz>
                    ${h("baixar",16)} Ver matriz completa
                </button>
            </div>
            ${r}
            <p class="curso-matriz-sub">Confira as principais disciplinas do curso:</p>
            <ul class="curso-etiquetas">
                ${i.map(n=>`<li>${s(n)}</li>`).join("")}
                ${d>i.length?'<li class="curso-etiqueta--mais">Entre outras disciplinas…</li>':""}
            </ul>
            <p class="curso-nota">${s(e.titulo)}${b(e)?` · ${s(b(e))}`:""}</p>
        </section>`}function pa(a,o){const t=a.tipoEtapa==="série";return`${o+1}${t?"ª":"º"} ${a.tipoEtapa}`}function ma(){const a=V(c.curso||{}),o=a[Math.min(c.matriz,a.length-1)];if(!o)return;const t=Array.from({length:o.etapas},(e,i)=>{const d=o.componentes.filter(l=>(l.aulas?.[i]||0)>0),r=l=>d.filter(p=>p.grupo===l).map(p=>`
            <tr>
                <td>${s(p.nome)}${p.tipo?`<span class="matriz-tipo">${s(p.tipo)}</span>`:""}</td>
                <td>${f(p.aulas[i])}</td>
            </tr>`).join(""),n=r("tecnica"),u=r("base");return`
            <section class="matriz-etapa">
                <h3>${s(pa(o,i))}</h3>
                <table>
                    <thead><tr><th>Disciplina</th><th>Aulas</th></tr></thead>
                    <tbody>
                        ${n&&u?'<tr class="matriz-grupo"><th colspan="2">Formação técnica</th></tr>':""}
                        ${n}
                        ${u?`<tr class="matriz-grupo"><th colspan="2">Ensino médio</th></tr>${u}`:""}
                    </tbody>
                </table>
            </section>`}).join("");document.getElementById("dialogo-matriz-conteudo").innerHTML=`
        <div class="painel-unidade-topo">
            <div class="painel-unidade-identidade">
                <h2 id="dialogo-matriz-titulo">Matriz curricular · ${s(c.curso.nome)}</h2>
                <p class="painel-unidade-local">${s(o.titulo)}${b(o)?` · ${s(b(o))}`:""}</p>
            </div>
            <button type="button" class="painel-unidade-fechar" data-fechar-painel aria-label="Fechar">
                ${h("fechar",18)}
            </button>
        </div>
        <div class="matriz-etapas">
            ${t}
            <p class="curso-nota">Aulas de 50 minutos, somadas no ano ou semestre. A grade pode ter pequenas
                diferenças de uma unidade para outra; confirme na escola onde você pretende estudar.</p>
        </div>`,document.getElementById("dialogo-matriz").showModal()}function v(a,o,t){Object.assign(c,{curso:a,unidades:o,avaliar:t});const e=document.getElementById("curso-detalhe"),i=a.nivel==="superior"?"Superior de Tecnologia (Fatec)":"Técnico (Etec)";document.title=`${a.nome} — Curso ${i} | Futuro+`;const d=[z("livro","O que você aprende",a.descricao),z("ferramenta","O que o profissional faz",a.atuacao),z("maleta","Onde se trabalha",a.ondeTrabalhar)].join(""),r=T(a),n=[da(a),a.nivel==="superior"||r?"":ua(a)].filter(Boolean);e.innerHTML=`
        <header class="curso-topo">
            <div class="curso-topo-texto">
                <h1>${s(a.nome)}</h1>
                <div class="curso-modalidades">
                    ${(a.modalidades||[]).map(l=>`<span class="tag-modalidade">${s(l)}</span>`).join("")}
                </div>
            </div>
            ${ea(a)}
        </header>

        ${ta(a)}
        ${sa(a)}

        <div class="curso-grade${d?"":" curso-grade--unica"}">
            ${d?`<div class="curso-cartao curso-textos">${d}</div>`:""}
            <section class="curso-cartao curso-onde-estudar">
                <h2>${h("capelo")} Onde estudar</h2>
                ${na(o,t,a,c.logado)}
            </section>
        </div>

        ${n.length?`<div class="curso-grade curso-grade--dados${n.length===1?" curso-grade--unica":""}">
            ${n.join("")}
        </div>`:""}

        ${r?_(a):""}

        <p class="curso-fonte">Informações do catálogo oficial do Centro Paula Souza, mantidas no Futuro+.</p>
    `,r&&G(e);const u=e.querySelector("[data-capa-com-foto]");u?.querySelector("img").addEventListener("error",()=>{u.outerHTML=u.querySelector("template").innerHTML})}function ha(){document.getElementById("curso-detalhe").addEventListener("click",o=>{if(o.target.closest("[data-abrir-matriz]")){ma();return}const t=o.target.closest("[data-matriz-aba]");t&&c.curso&&(c.matriz=Number(t.dataset.matrizAba),v(c.curso,c.unidades,c.avaliar),document.querySelector(`[data-matriz-aba="${c.matriz}"]`)?.focus())});const a=document.getElementById("dialogo-matriz");a.addEventListener("click",o=>{(o.target===a||o.target.closest("[data-fechar-painel]"))&&a.close()}),N(document.getElementById("curso-detalhe"))}function fa(a){const o=document.getElementById("curso-plano-pdf");if(!a.planoCursoUrl||T(a)){o.hidden=!0;return}document.getElementById("curso-plano-pdf-iframe").src=a.planoCursoUrl,document.getElementById("curso-plano-pdf-abrir").href=a.planoCursoUrl,o.hidden=!1}async function ga(){await $.authStateReady();const a=$.currentUser;if(!a)return null;const o=await I(S(M,"usuarios",a.uid)),t=await H(a.uid,o.exists()?o.data():null);if(!t)return null;const e=await P().catch(()=>null);return R(t,e)}async function va(){const a=document.getElementById("curso-detalhe"),o=new URLSearchParams(window.location.search),t=o.get("c")||o.get("curso")||"";if(!t){a.innerHTML='<p class="sem-resultados">Curso não informado. Volte para a lista de cursos.</p>';return}try{const e=Z(t);await $.authStateReady(),c.logado=!!$.currentUser;const i=J().then(m=>{c.fotosDosEixos=m,c.curso&&Object.keys(m).length&&v(c.curso,c.unidades,c.avaliar)}),d=await I(S(M,K,e)).catch(()=>null),r=d?.exists()?d.data():await W(e);if(!r){if(a.querySelector(".curso-topo"))return;a.innerHTML=`<p class="sem-resultados">
                Ainda não temos a descrição deste curso.
                <a href="instituicoes.html?curso=${encodeURIComponent(t)}">Ver as unidades que oferecem</a>.
            </p>`;return}const n=(r.descricao||"").trim()||`${r.nome}: veja onde cursar, pré-requisitos e tudo sobre o curso ${r.nivel==="superior"?"superior de tecnologia":"técnico"} nas Etecs e Fatecs.`;B(n.slice(0,155)),U({"@context":"https://schema.org","@type":"Course",name:r.nome,description:n,url:`https://futuroplus.com.br/curso.html?c=${encodeURIComponent(e)}`,provider:{"@type":"Organization",name:"Centro Paula Souza",sameAs:"https://www.cps.sp.gov.br/"},educationalLevel:r.nivel==="superior"?"Superior de Tecnologia":"Técnico"}),await Promise.race([i,new Promise(m=>setTimeout(m,1200))]),fa(r),v(r,null,null);const u=x(r.nome),l=r.nivel==="superior",g=(await A(O(M,"instituicoes")).catch(m=>(console.error("Erro ao carregar as unidades do curso:",m),{docs:[]}))).docs.map(m=>({id:m.id,...m.data()})).filter(m=>{if(!(m.cursos||[]).some(j=>x(j?.nome)===u))return!1;const E=(m.tipo||"").trim().toLowerCase()==="fatec";return l?E:!E});v(r,g,null);const y=await ga().catch(()=>null);y&&v(r,g,y)}catch(e){if(console.error("Erro ao carregar o curso:",e),a.querySelector(".curso-topo"))return;a.innerHTML='<p class="sem-resultados">Não foi possível carregar este curso agora. Tente novamente mais tarde.</p>'}}document.addEventListener("DOMContentLoaded",()=>{ha(),va()});
