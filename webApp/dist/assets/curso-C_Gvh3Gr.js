import{f as C,d as w,c as b,g as T,e as j,a as y}from"./firebase-config-BVis2Pi9.js";import"./dashboard-D2hP6CDR.js";/* empty css                    */import{n as M,e as s}from"./card-unidade-C3eEs3Rs.js";import{r as q,c as A,a as O,P as E}from"./recomendacao-cursos-5UazaiUW.js";import{f as B}from"./geocodificacao-Dyu2Eb0t.js";import{a as H,d as U,r as R,c as I,b as k}from"./capas-eixos-BvbZhPtx.js";import"./preload-helper-PPVm8Dsz.js";import"./conteudo-legal-padrao-DcxCgRAC.js";import"./resultado-teste-CuWDcDvT.js";import"./categorias-teste-82RqXHiT.js";const P="cursos",N="/dados/catalogo-cursos.json",d={curso:null,unidades:[],avaliar:null,matriz:0,fotosDosEixos:{}};async function F(a){const o=await fetch(N);return o.ok&&(await o.json()).find(t=>t.slug===a)||null}function _(a){return M(a).replace(/\s+/g,"-")}function p(a){return Number(a||0).toLocaleString("pt-BR")}const G={relogio:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',calendario:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',livro:'<path d="M4 5a2 2 0 0 1 2-2h5v17H6a2 2 0 0 0-2 2zM20 5a2 2 0 0 0-2-2h-5v17h5a2 2 0 0 1 2 2z"/>',maleta:'<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 13h18"/>',ferramenta:'<path d="M14.5 6.5a4 4 0 0 0 5 5L11 20a2.1 2.1 0 0 1-3-3z"/><path d="m14.5 6.5 3-3 3 3-3 3"/>',capelo:'<path d="m2 9 10-5 10 5-10 5z"/><path d="M6 11.5V16c0 1.5 2.7 3 6 3s6-1.5 6-3v-4.5M22 9v5"/>',barras:'<path d="M5 20v-8M12 20V5M19 20v-11M3 20h18"/>',camadas:'<path d="m12 3 9 5-9 5-9-5zM3 13l9 5 9-5M3 18l9 5 9-5"/>',pessoas:'<circle cx="9" cy="8" r="3"/><path d="M3 20a6 6 0 0 1 12 0M16 5.2a3 3 0 0 1 0 5.6M17 14.3a6 6 0 0 1 4 5.7"/>',baixar:'<path d="M12 4v11M7 11l5 5 5-5M5 20h14"/>',fechar:'<path d="M6 6l12 12M18 6 6 18"/>'};function f(a,o=22){return V(G[a],o)}function V(a,o=22){return`<svg class="icone" width="${o}" height="${o}" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
        aria-hidden="true">${a}</svg>`}function X(a,o){return`
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
        </div>`}function Y(a){const o=(a.eixos||[])[0]||"",e=I(o,d.fotosDosEixos),t=X(o,e),n=a.imagemUrl||e.foto;return n?`
        <div class="curso-capa curso-capa--foto" data-capa-com-foto>
            <img src="${s(n)}" alt="" loading="lazy" referrerpolicy="no-referrer">
            ${!a.imagemUrl&&o?`<span class="curso-capa-eixo">${s(o)}</span>`:""}
            <template>${t}</template>
        </div>`:t}function J(a){const o=I((a.eixos||[])[0]||"").icone,e=[[f("relogio",30),"Duração",a.duracao],[f("calendario",30),"Carga horária",a.cargaHoraria?`${p(a.cargaHoraria)} horas`:""],[V(o,30),"Eixo tecnológico",(a.eixos||[]).join(", ")]].filter(([,,t])=>t);return e.length?`
        <div class="curso-ficha">
            ${e.map(([t,n,c])=>`
                <div class="curso-ficha-item">
                    ${t}
                    <div>
                        <span class="curso-ficha-rotulo">${s(n)}</span>
                        <strong>${s(String(c))}</strong>
                    </div>
                </div>`).join("")}
        </div>`:""}function K(a){const o=[];return a.preRequisitos&&o.push(`<div class="curso-aviso curso-aviso--requisito">
            <strong>Este curso exige formação anterior.</strong>
            <span>${s(a.preRequisitos)}</span>
        </div>`),a.provaAptidao&&o.push(`<div class="curso-aviso curso-aviso--aptidao">
            <strong>Tem prova de aptidão.</strong>
            <span>Além da prova escrita do Vestibulinho, quem se inscreve neste curso faz uma prova prática.</span>
        </div>`),o.join("")}function v(a,o,e){return e?`
        <section class="curso-bloco">
            <h2>${f(a)} ${s(o)}</h2>
            <p>${s(e)}</p>
        </section>`:""}function Q({nivel:a,km:o}){if(o!=null){const e=B(o);return`${e.charAt(0).toUpperCase()}${e.slice(1)} de você`}return a===E.CIDADE?"Na sua cidade":a===E.REGIAO?"Na sua região":""}const D=8;function W(a,o,e){if(!a)return'<p class="sem-cursos">Carregando unidades...</p>';if(!a.length)return'<p class="sem-cursos">Nenhuma unidade do cadastro oferece este curso no momento.</p>';const t=a.map(r=>({unidade:r,proximidade:o?o(r):null}));o&&t.sort((r,i)=>r.proximidade.ordem-i.proximidade.ordem||(r.unidade.nome||"").localeCompare(i.unidade.nome||"","pt-BR"));const n=t.length-D,c=n>0?`<a class="curso-ver-todas" href="instituicoes.html?curso=${encodeURIComponent(e)}">
             Ver as outras ${n} unidades &rarr;</a>`:"";return`<ul class="curso-unidades">
        ${t.slice(0,D).map(({unidade:r,proximidade:i})=>{const l=i?Q(i):"";return`<li>
                <span class="curso-unidade-nome">${s(r.nome)}</span>
                <span class="curso-unidade-cidade">${s(r.municipio||"")}</span>
                ${l?`<span class="curso-unidade-km">${s(l)}</span>`:""}
            </li>`}).join("")}
    </ul>
    ${c}`}function Z(a){if(a.serie.length<2)return`
            <div class="demanda-numero">
                <strong>${s(a.porVagaTexto)}</strong>
                <span>candidatos por vaga em ${a.ano}</span>
            </div>`;const o=Math.max(...a.serie.map(t=>t.porVaga));return`
        <figure class="demanda-grafico">
            <figcaption>Candidatos por vaga, ano a ano</figcaption>
            <ul class="demanda-colunas">${a.serie.map((t,n)=>{const c=n===a.serie.length-1,r=Math.max(4,Math.round(t.porVaga/o*100)),i=`${p(t.inscritos)} inscritos · ${p(t.vagas)} vagas`;return`
            <li class="demanda-coluna${c?" demanda-coluna--atual":""}" tabindex="0"
                aria-label="${t.ano}: ${s(t.porVagaTexto)} candidatos por vaga, ${s(i)}">
                <span class="demanda-dica" aria-hidden="true">
                    <strong>${s(t.porVagaTexto)} por vaga</strong>${s(i)}
                </span>
                <span class="demanda-area" aria-hidden="true">
                    <span class="demanda-valor">${s(t.porVagaTexto)}</span>
                    <span class="demanda-barra" style="height:${r}%"></span>
                </span>
                <span class="demanda-ano" aria-hidden="true">${t.ano}</span>
            </li>`}).join("")}</ul>
        </figure>`}function aa(a){const o=R(a.demanda);if(!o)return"";const e=a.nivel==="superior",t=e?"Vestibular das Fatecs":"Vestibulinho das Etecs",n=e?"Fatecs":"Etecs",c=o.semestre===2?"2º":"1º";return`
        <section class="curso-cartao curso-demanda">
            <h2>${f("barras")} Demanda por curso</h2>
            <div class="curso-demanda-corpo">
                <div class="curso-demanda-texto">
                    <p>No ${t} do ${c} semestre de ${o.ano},
                        <strong>${p(o.inscritos)} pessoas</strong> se inscreveram para
                        <strong>${p(o.vagas)} vagas</strong>${o.unidades?` em ${p(o.unidades)} ${n}`:""}.</p>
                    <div class="demanda-selo">
                        ${f("pessoas",30)}
                        <div>
                            <strong>${s(o.nivel.rotulo)}</strong>
                            <span>${s(o.porVagaTexto)} candidatos por vaga.
                                ${s(o.nivel.descricao)}</span>
                        </div>
                    </div>
                </div>
                ${Z(o)}
            </div>
            <details class="demanda-tabela">
                <summary>Ver os números de cada ano</summary>
                <table>
                    <thead><tr><th>Ano</th><th>Inscritos</th><th>Vagas</th><th>Por vaga</th></tr></thead>
                    <tbody>${o.serie.map(r=>`
                        <tr><td>${r.ano}</td><td>${p(r.inscritos)}</td>
                            <td>${p(r.vagas)}</td><td>${s(r.porVagaTexto)}</td></tr>`).join("")}
                    </tbody>
                </table>
            </details>
            <p class="curso-nota">Soma de todas as unidades do estado, do site oficial do ${t}.
                Em cada unidade a concorrência pode ser bem maior ou menor.</p>
        </section>`}function L(a){return(a.matrizes||[]).filter(o=>(o?.componentes||[]).length)}function oa(a){return(a.destaques||[]).length?a.destaques:k(a)}function $(a){return[U(a),a.cargaHoraria?`${p(a.cargaHoraria)} horas`:""].filter(Boolean).join(" · ")}function ta(a){const o=L(a);if(!o.length)return"";const e=Math.min(d.matriz,o.length-1),t=o[e],n=oa(t),c=t.componentes.filter(i=>i.grupo==="tecnica").length,r=o.length>1?`<div class="matriz-abas" role="group" aria-label="Matriz de qual forma de oferta">
            ${o.map((i,l)=>`
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
            <p class="curso-nota">${s(t.titulo)}${$(t)?` · ${s($(t))}`:""}</p>
        </section>`}function ea(a,o){const e=a.tipoEtapa==="série";return`${o+1}${e?"ª":"º"} ${a.tipoEtapa}`}function sa(){const a=L(d.curso||{}),o=a[Math.min(d.matriz,a.length-1)];if(!o)return;const e=Array.from({length:o.etapas},(t,n)=>{const c=o.componentes.filter(g=>(g.aulas?.[n]||0)>0),r=g=>c.filter(m=>m.grupo===g).map(m=>`
            <tr>
                <td>${s(m.nome)}${m.tipo?`<span class="matriz-tipo">${s(m.tipo)}</span>`:""}</td>
                <td>${p(m.aulas[n])}</td>
            </tr>`).join(""),i=r("tecnica"),l=r("base");return`
            <section class="matriz-etapa">
                <h3>${s(ea(o,n))}</h3>
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
                <p class="painel-unidade-local">${s(o.titulo)}${$(o)?` · ${s($(o))}`:""}</p>
            </div>
            <button type="button" class="painel-unidade-fechar" data-fechar-painel aria-label="Fechar">
                ${f("fechar",18)}
            </button>
        </div>
        <div class="matriz-etapas">
            ${e}
            <p class="curso-nota">Aulas de 50 minutos, somadas no ano ou semestre. A grade pode ter pequenas
                diferenças de uma unidade para outra; confirme na escola onde você pretende estudar.</p>
        </div>`,document.getElementById("dialogo-matriz").showModal()}function h(a,o,e){Object.assign(d,{curso:a,unidades:o,avaliar:e});const t=document.getElementById("curso-detalhe");document.title=`Futuro+ | ${a.nome}`;const n=[v("livro","O que você aprende",a.descricao),v("ferramenta","O que o profissional faz",a.atuacao),v("maleta","Onde se trabalha",a.ondeTrabalhar)].join(""),c=[aa(a),ta(a)].filter(Boolean);t.innerHTML=`
        <header class="curso-topo">
            <div class="curso-topo-texto">
                <h1>${s(a.nome)}</h1>
                <div class="curso-modalidades">
                    ${(a.modalidades||[]).map(i=>`<span class="tag-modalidade">${s(i)}</span>`).join("")}
                </div>
            </div>
            ${Y(a)}
        </header>

        ${J(a)}
        ${K(a)}

        <div class="curso-grade${n?"":" curso-grade--unica"}">
            ${n?`<div class="curso-cartao curso-textos">${n}</div>`:""}
            <section class="curso-cartao curso-onde-estudar">
                <h2>${f("capelo")} Onde estudar</h2>
                ${W(o,e,a.nome)}
            </section>
        </div>

        ${c.length?`<div class="curso-grade curso-grade--dados${c.length===1?" curso-grade--unica":""}">
            ${c.join("")}
        </div>`:""}

        <p class="curso-fonte">Informações do catálogo oficial do Centro Paula Souza, mantidas no Futuro+.</p>
    `;const r=t.querySelector("[data-capa-com-foto]");r?.querySelector("img").addEventListener("error",()=>{r.outerHTML=r.querySelector("template").innerHTML})}function ra(){document.getElementById("curso-detalhe").addEventListener("click",o=>{if(o.target.closest("[data-abrir-matriz]")){sa();return}const e=o.target.closest("[data-matriz-aba]");e&&d.curso&&(d.matriz=Number(e.dataset.matrizAba),h(d.curso,d.unidades,d.avaliar),document.querySelector(`[data-matriz-aba="${d.matriz}"]`)?.focus())});const a=document.getElementById("dialogo-matriz");a.addEventListener("click",o=>{(o.target===a||o.target.closest("[data-fechar-painel]"))&&a.close()})}function na(a){const o=document.getElementById("curso-plano-pdf");if(!a.planoCursoUrl){o.hidden=!0;return}document.getElementById("curso-plano-pdf-iframe").src=a.planoCursoUrl,document.getElementById("curso-plano-pdf-abrir").href=a.planoCursoUrl,o.hidden=!1}async function ia(){await y.authStateReady();const a=y.currentUser;if(!a)return null;const o=await C(w(b,"usuarios",a.uid)),e=await q(a.uid,o.exists()?o.data():null);if(!e)return null;const t=await A().catch(()=>null);return O(e,t)}async function ca(){const a=document.getElementById("curso-detalhe"),o=new URLSearchParams(window.location.search),e=o.get("c")||o.get("curso")||"";if(!e){a.innerHTML='<p class="sem-resultados">Curso não informado. Volte para a lista de cursos.</p>';return}try{const t=_(e),n=H().then(u=>{d.fotosDosEixos=u,d.curso&&Object.keys(u).length&&h(d.curso,d.unidades,d.avaliar)}),c=await C(w(b,P,t)).catch(()=>null),r=c?.exists()?c.data():await F(t);if(!r){a.innerHTML=`<p class="sem-resultados">
                Ainda não temos a descrição deste curso.
                <a href="instituicoes.html?curso=${encodeURIComponent(e)}">Ver as unidades que oferecem</a>.
            </p>`;return}await Promise.race([n,new Promise(u=>setTimeout(u,1200))]),na(r),h(r,null,null);const i=M(r.nome),l=r.nivel==="superior",m=(await T(j(b,"instituicoes")).catch(u=>(console.error("Erro ao carregar as unidades do curso:",u),{docs:[]}))).docs.map(u=>({id:u.id,...u.data()})).filter(u=>{if(!(u.cursos||[]).some(S=>M(S?.nome)===i))return!1;const x=(u.tipo||"").trim().toLowerCase()==="fatec";return l?x:!x});h(r,m,null);const z=await ia().catch(()=>null);z&&h(r,m,z)}catch(t){console.error("Erro ao carregar o curso:",t),a.innerHTML='<p class="sem-resultados">Não foi possível carregar este curso agora. Tente novamente mais tarde.</p>'}}document.addEventListener("DOMContentLoaded",()=>{ra(),ca()});
