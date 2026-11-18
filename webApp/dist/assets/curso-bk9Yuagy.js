import{h as I,d as w,c as M,g as q,e as A,a as y}from"./firebase-config-XQh5hlny.js";import"./dashboard-DlCsTCaU.js";/* empty css                    */import{n as b,e as s}from"./card-unidade-DxBgZOlB.js";import{r as O,c as B,a as H,P as E}from"./recomendacao-cursos-DZ4jTrAE.js";import{f as U}from"./geocodificacao-B3rWnney.js";import{r as R}from"./demanda-curso-Bz72gXLF.js";import{c as k,t as V,h as P,e as N,b as F,f as D,g as _}from"./matriz-interativa-BJHZQ_Hx.js";import{a as G,c as L}from"./capas-eixos-Dbz8NseI.js";import"./preload-helper-PPVm8Dsz.js";import"./conteudo-legal-padrao-DcxCgRAC.js";import"./resultado-teste-BcjYGcG_.js";import"./notificacoes-util-BMqxtxne.js";import"./categorias-teste-82RqXHiT.js";const X="cursos",Y="/dados/catalogo-cursos.json",d={curso:null,unidades:[],avaliar:null,matriz:0,fotosDosEixos:{}};async function J(a){const t=await fetch(Y);return t.ok&&(await t.json()).find(o=>o.slug===a)||null}function K(a){return b(a).replace(/\s+/g,"-")}function p(a){return Number(a||0).toLocaleString("pt-BR")}const Q={relogio:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',calendario:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',livro:'<path d="M4 5a2 2 0 0 1 2-2h5v17H6a2 2 0 0 0-2 2zM20 5a2 2 0 0 0-2-2h-5v17h5a2 2 0 0 1 2 2z"/>',maleta:'<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 13h18"/>',ferramenta:'<path d="M14.5 6.5a4 4 0 0 0 5 5L11 20a2.1 2.1 0 0 1-3-3z"/><path d="m14.5 6.5 3-3 3 3-3 3"/>',capelo:'<path d="m2 9 10-5 10 5-10 5z"/><path d="M6 11.5V16c0 1.5 2.7 3 6 3s6-1.5 6-3v-4.5M22 9v5"/>',barras:'<path d="M5 20v-8M12 20V5M19 20v-11M3 20h18"/>',camadas:'<path d="m12 3 9 5-9 5-9-5zM3 13l9 5 9-5M3 18l9 5 9-5"/>',pessoas:'<circle cx="9" cy="8" r="3"/><path d="M3 20a6 6 0 0 1 12 0M16 5.2a3 3 0 0 1 0 5.6M17 14.3a6 6 0 0 1 4 5.7"/>',baixar:'<path d="M12 4v11M7 11l5 5 5-5M5 20h14"/>',fechar:'<path d="M6 6l12 12M18 6 6 18"/>'};function f(a,t=22){return S(Q[a],t)}function S(a,t=22){return`<svg class="icone" width="${t}" height="${t}" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
        aria-hidden="true">${a}</svg>`}function W(a,t){return`
        <div class="curso-capa curso-capa--padrao" aria-hidden="true"
            style="--capa-escura:${t.cores[0]};--capa-clara:${t.cores[1]}">
            <svg class="curso-capa-fundo" viewBox="0 0 600 190" preserveAspectRatio="xMidYMid slice">
                <circle cx="150" cy="-30" r="130" fill="#fff" opacity=".06"/>
                <circle cx="60" cy="210" r="120" fill="#fff" opacity=".05"/>
                <path d="M0 150 C120 110 220 190 340 140 S520 100 600 135 V190 H0z" fill="#fff" opacity=".09"/>
                <path d="M0 172 C140 146 250 194 380 168 S540 148 600 164 V190 H0z" fill="#fff" opacity=".12"/>
            </svg>
            <span class="curso-capa-selo">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"
                    stroke-linecap="round" stroke-linejoin="round">${t.icone}</svg>
            </span>
            ${a?`<span class="curso-capa-eixo">${s(a)}</span>`:""}
        </div>`}function Z(a){const t=(a.eixos||[])[0]||"",e=L(t,d.fotosDosEixos),o=W(t,e),n=a.imagemUrl||e.foto;return n?`
        <div class="curso-capa curso-capa--foto" data-capa-com-foto>
            <img src="${s(n)}" alt="" loading="lazy" referrerpolicy="no-referrer">
            ${!a.imagemUrl&&t?`<span class="curso-capa-eixo">${s(t)}</span>`:""}
            <template>${o}</template>
        </div>`:o}function aa(a){const t=L((a.eixos||[])[0]||"").icone,e=[[f("relogio",30),"Duração",a.duracao],[f("calendario",30),"Carga horária",a.cargaHoraria||D(a)?`${p(a.cargaHoraria||D(a))} horas`:""],[S(t,30),"Eixo tecnológico",(a.eixos||[]).join(", ")]].filter(([,,o])=>o);return e.length?`
        <div class="curso-ficha">
            ${e.map(([o,n,c])=>`
                <div class="curso-ficha-item">
                    ${o}
                    <div>
                        <span class="curso-ficha-rotulo">${s(n)}</span>
                        <strong>${s(String(c))}</strong>
                    </div>
                </div>`).join("")}
        </div>`:""}function ta(a){const t=[];return a.preRequisitos&&t.push(`<div class="curso-aviso curso-aviso--requisito">
            <strong>Este curso exige formação anterior.</strong>
            <span>${s(a.preRequisitos)}</span>
        </div>`),a.provaAptidao&&t.push(`<div class="curso-aviso curso-aviso--aptidao">
            <strong>Tem prova de aptidão.</strong>
            <span>Além da prova escrita do Vestibulinho, quem se inscreve neste curso faz uma prova prática.</span>
        </div>`),t.join("")}function v(a,t,e){return e?`
        <section class="curso-bloco">
            <h2>${f(a)} ${s(t)}</h2>
            <p>${s(e)}</p>
        </section>`:""}function oa({nivel:a,km:t}){if(t!=null){const e=U(t);return`${e.charAt(0).toUpperCase()}${e.slice(1)} de você`}return a===E.CIDADE?"Na sua cidade":a===E.REGIAO?"Na sua região":""}const C=8;function ea(a,t,e){if(!a)return'<p class="sem-cursos">Carregando unidades...</p>';if(!a.length)return'<p class="sem-cursos">Nenhuma unidade do cadastro oferece este curso no momento.</p>';const o=a.map(r=>({unidade:r,proximidade:t?t(r):null}));t&&o.sort((r,i)=>r.proximidade.ordem-i.proximidade.ordem||(r.unidade.nome||"").localeCompare(i.unidade.nome||"","pt-BR"));const n=o.length-C,c=n>0?`<a class="curso-ver-todas" href="instituicoes.html?curso=${encodeURIComponent(e)}">
             Ver as outras ${n} unidades &rarr;</a>`:"";return`<ul class="curso-unidades">
        ${o.slice(0,C).map(({unidade:r,proximidade:i})=>{const l=i?oa(i):"";return`<li>
                <span class="curso-unidade-nome">${s(r.nome)}</span>
                <span class="curso-unidade-cidade">${s(r.municipio||"")}</span>
                ${l?`<span class="curso-unidade-km">${s(l)}</span>`:""}
            </li>`}).join("")}
    </ul>
    ${c}`}function sa(a){if(a.serie.length<2)return`
            <div class="demanda-numero">
                <strong>${s(a.porVagaTexto)}</strong>
                <span>candidatos por vaga em ${a.ano}</span>
            </div>`;const t=Math.max(...a.serie.map(o=>o.porVaga));return`
        <figure class="demanda-grafico">
            <figcaption>Candidatos por vaga, ano a ano</figcaption>
            <ul class="demanda-colunas">${a.serie.map((o,n)=>{const c=n===a.serie.length-1,r=Math.max(4,Math.round(o.porVaga/t*100)),i=`${p(o.inscritos)} inscritos · ${p(o.vagas)} vagas`;return`
            <li class="demanda-coluna${c?" demanda-coluna--atual":""}" tabindex="0"
                aria-label="${o.ano}: ${s(o.porVagaTexto)} candidatos por vaga, ${s(i)}">
                <span class="demanda-dica" aria-hidden="true">
                    <strong>${s(o.porVagaTexto)} por vaga</strong>${s(i)}
                </span>
                <span class="demanda-area" aria-hidden="true">
                    <span class="demanda-valor">${s(o.porVagaTexto)}</span>
                    <span class="demanda-barra" style="height:${r}%"></span>
                </span>
                <span class="demanda-ano" aria-hidden="true">${o.ano}</span>
            </li>`}).join("")}</ul>
        </figure>`}function ra(a){const t=R(a.demanda);if(!t)return"";const e=a.nivel==="superior",o=e?"Vestibular das Fatecs":"Vestibulinho das Etecs",n=e?"Fatecs":"Etecs",c=t.semestre===2?"2º":"1º";return`
        <section class="curso-cartao curso-demanda">
            <h2>${f("barras")} Demanda por curso</h2>
            <div class="curso-demanda-corpo">
                <div class="curso-demanda-texto">
                    <p>No ${o} do ${c} semestre de ${t.ano},
                        <strong>${p(t.inscritos)} pessoas</strong> se inscreveram para
                        <strong>${p(t.vagas)} vagas</strong>${t.unidades?` em ${p(t.unidades)} ${n}`:""}.</p>
                    <div class="demanda-selo">
                        ${f("pessoas",30)}
                        <div>
                            <strong>${s(t.nivel.rotulo)}</strong>
                            <span>${s(t.porVagaTexto)} candidatos por vaga.
                                ${s(t.nivel.descricao)}</span>
                        </div>
                    </div>
                </div>
                ${sa(t)}
            </div>
            <details class="demanda-tabela">
                <summary>Ver os números de cada ano</summary>
                <table>
                    <thead><tr><th>Ano</th><th>Inscritos</th><th>Vagas</th><th>Por vaga</th></tr></thead>
                    <tbody>${t.serie.map(r=>`
                        <tr><td>${r.ano}</td><td>${p(r.inscritos)}</td>
                            <td>${p(r.vagas)}</td><td>${s(r.porVagaTexto)}</td></tr>`).join("")}
                    </tbody>
                </table>
            </details>
            <p class="curso-nota">Soma de todas as unidades do estado, do site oficial do ${o}.
                Em cada unidade a concorrência pode ser bem maior ou menor.</p>
        </section>`}function T(a){return(a.matrizes||[]).filter(t=>(t?.componentes||[]).length)}function na(a){return(a.destaques||[]).length?a.destaques:_(a)}function $(a){return[F(a),a.cargaHoraria?`${p(a.cargaHoraria)} horas`:""].filter(Boolean).join(" · ")}function ia(a){const t=T(a);if(!t.length)return"";const e=Math.min(d.matriz,t.length-1),o=t[e],n=na(o),c=o.componentes.filter(i=>i.grupo==="tecnica").length,r=t.length>1?`<div class="matriz-abas" role="group" aria-label="Matriz de qual forma de oferta">
            ${t.map((i,l)=>`
                <button type="button" class="matriz-aba${l===e?" matriz-aba--ativa":""}"
                    data-matriz-aba="${l}" aria-pressed="${l===e}">${s(i.titulo)}</button>`).join("")}
           </div>`:"";return`
        <section class="curso-cartao curso-matriz">
            <div class="curso-cartao-topo">
                <h2>${f("camadas")} Matriz Curricular</h2>
                <button type="button" class="btn-matriz-completa" data-abrir-matriz>
                    ${f("baixar",16)} Ver matriz completa
                </button>
            </div>
            ${r}
            <p class="curso-matriz-sub">Confira as principais disciplinas do curso:</p>
            <ul class="curso-etiquetas">
                ${n.map(i=>`<li>${s(i)}</li>`).join("")}
                ${c>n.length?'<li class="curso-etiqueta--mais">Entre outras disciplinas…</li>':""}
            </ul>
            <p class="curso-nota">${s(o.titulo)}${$(o)?` · ${s($(o))}`:""}</p>
        </section>`}function ca(a,t){const e=a.tipoEtapa==="série";return`${t+1}${e?"ª":"º"} ${a.tipoEtapa}`}function da(){const a=T(d.curso||{}),t=a[Math.min(d.matriz,a.length-1)];if(!t)return;const e=Array.from({length:t.etapas},(o,n)=>{const c=t.componentes.filter(g=>(g.aulas?.[n]||0)>0),r=g=>c.filter(m=>m.grupo===g).map(m=>`
            <tr>
                <td>${s(m.nome)}${m.tipo?`<span class="matriz-tipo">${s(m.tipo)}</span>`:""}</td>
                <td>${p(m.aulas[n])}</td>
            </tr>`).join(""),i=r("tecnica"),l=r("base");return`
            <section class="matriz-etapa">
                <h3>${s(ca(t,n))}</h3>
                <table>
                    <thead><tr><th>Disciplina</th><th>Aulas</th></tr></thead>
                    <tbody>
                        ${i&&l?'<tr class="matriz-grupo"><th colspan="2">Formação técnica</th></tr>':""}
                        ${i}
                        ${l?`<tr class="matriz-grupo"><th colspan="2">Ensino médio</th></tr>${l}`:""}
                    </tbody>
                </table>
            </section>`}).join("");document.getElementById("dialogo-matriz-conteudo").innerHTML=`
        <div class="painel-unidade-topo">
            <div class="painel-unidade-identidade">
                <h2 id="dialogo-matriz-titulo">Matriz curricular · ${s(d.curso.nome)}</h2>
                <p class="painel-unidade-local">${s(t.titulo)}${$(t)?` · ${s($(t))}`:""}</p>
            </div>
            <button type="button" class="painel-unidade-fechar" data-fechar-painel aria-label="Fechar">
                ${f("fechar",18)}
            </button>
        </div>
        <div class="matriz-etapas">
            ${e}
            <p class="curso-nota">Aulas de 50 minutos, somadas no ano ou semestre. A grade pode ter pequenas
                diferenças de uma unidade para outra; confirme na escola onde você pretende estudar.</p>
        </div>`,document.getElementById("dialogo-matriz").showModal()}function h(a,t,e){Object.assign(d,{curso:a,unidades:t,avaliar:e});const o=document.getElementById("curso-detalhe");document.title=`Futuro+ | ${a.nome}`;const n=[v("livro","O que você aprende",a.descricao),v("ferramenta","O que o profissional faz",a.atuacao),v("maleta","Onde se trabalha",a.ondeTrabalhar)].join(""),c=V(a),r=[ra(a),a.nivel==="superior"||c?"":ia(a)].filter(Boolean);o.innerHTML=`
        <header class="curso-topo">
            <div class="curso-topo-texto">
                <h1>${s(a.nome)}</h1>
                <div class="curso-modalidades">
                    ${(a.modalidades||[]).map(l=>`<span class="tag-modalidade">${s(l)}</span>`).join("")}
                </div>
            </div>
            ${Z(a)}
        </header>

        ${aa(a)}
        ${ta(a)}

        <div class="curso-grade${n?"":" curso-grade--unica"}">
            ${n?`<div class="curso-cartao curso-textos">${n}</div>`:""}
            <section class="curso-cartao curso-onde-estudar">
                <h2>${f("capelo")} Onde estudar</h2>
                ${ea(t,e,a.nome)}
            </section>
        </div>

        ${r.length?`<div class="curso-grade curso-grade--dados${r.length===1?" curso-grade--unica":""}">
            ${r.join("")}
        </div>`:""}

        ${c?P(a):""}

        <p class="curso-fonte">Informações do catálogo oficial do Centro Paula Souza, mantidas no Futuro+.</p>
    `,c&&N(o);const i=o.querySelector("[data-capa-com-foto]");i?.querySelector("img").addEventListener("error",()=>{i.outerHTML=i.querySelector("template").innerHTML})}function la(){document.getElementById("curso-detalhe").addEventListener("click",t=>{if(t.target.closest("[data-abrir-matriz]")){da();return}const e=t.target.closest("[data-matriz-aba]");e&&d.curso&&(d.matriz=Number(e.dataset.matrizAba),h(d.curso,d.unidades,d.avaliar),document.querySelector(`[data-matriz-aba="${d.matriz}"]`)?.focus())});const a=document.getElementById("dialogo-matriz");a.addEventListener("click",t=>{(t.target===a||t.target.closest("[data-fechar-painel]"))&&a.close()}),k(document.getElementById("curso-detalhe"))}function ua(a){const t=document.getElementById("curso-plano-pdf");if(!a.planoCursoUrl||V(a)){t.hidden=!0;return}document.getElementById("curso-plano-pdf-iframe").src=a.planoCursoUrl,document.getElementById("curso-plano-pdf-abrir").href=a.planoCursoUrl,t.hidden=!1}async function pa(){await y.authStateReady();const a=y.currentUser;if(!a)return null;const t=await I(w(M,"usuarios",a.uid)),e=await O(a.uid,t.exists()?t.data():null);if(!e)return null;const o=await B().catch(()=>null);return H(e,o)}async function ma(){const a=document.getElementById("curso-detalhe"),t=new URLSearchParams(window.location.search),e=t.get("c")||t.get("curso")||"";if(!e){a.innerHTML='<p class="sem-resultados">Curso não informado. Volte para a lista de cursos.</p>';return}try{const o=K(e),n=G().then(u=>{d.fotosDosEixos=u,d.curso&&Object.keys(u).length&&h(d.curso,d.unidades,d.avaliar)}),c=await I(w(M,X,o)).catch(()=>null),r=c?.exists()?c.data():await J(o);if(!r){a.innerHTML=`<p class="sem-resultados">
                Ainda não temos a descrição deste curso.
                <a href="instituicoes.html?curso=${encodeURIComponent(e)}">Ver as unidades que oferecem</a>.
            </p>`;return}await Promise.race([n,new Promise(u=>setTimeout(u,1200))]),ua(r),h(r,null,null);const i=b(r.nome),l=r.nivel==="superior",m=(await q(A(M,"instituicoes")).catch(u=>(console.error("Erro ao carregar as unidades do curso:",u),{docs:[]}))).docs.map(u=>({id:u.id,...u.data()})).filter(u=>{if(!(u.cursos||[]).some(j=>b(j?.nome)===i))return!1;const x=(u.tipo||"").trim().toLowerCase()==="fatec";return l?x:!x});h(r,m,null);const z=await pa().catch(()=>null);z&&h(r,m,z)}catch(o){console.error("Erro ao carregar o curso:",o),a.innerHTML='<p class="sem-resultados">Não foi possível carregar este curso agora. Tente novamente mais tarde.</p>'}}document.addEventListener("DOMContentLoaded",()=>{la(),ma()});
