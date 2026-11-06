import{e as E,d as O,b as m,g as D,c as A,f as v}from"./firebase-config-B6zsF72T.js";import"./dashboard-vpWbk0TU.js";/* empty css                    */import{n as p,e as n}from"./card-unidade-CA2qFmKO.js";import{r as L,c as U,a as R,P as $}from"./recomendacao-cursos-CUABUXbH.js";import{f as S}from"./geocodificacao-GFhpmzSl.js";import"./conteudo-legal-padrao-DcxCgRAC.js";import"./resultado-teste-D4qcTXs5.js";import"./categorias-teste-82RqXHiT.js";const T="cursos",b="/dados/catalogo-cursos.json";async function x(a){const o=await fetch(b);return o.ok&&(await o.json()).find(e=>e.slug===a)||null}function y(a){return p(a).replace(/\s+/g,"-")}function l(a,o){return o?`
        <section class="curso-bloco">
            <h2>${n(a)}</h2>
            <p>${n(o)}</p>
        </section>`:""}function P(a){const o=[["Duração",a.duracao],["Carga horária",a.cargaHoraria?`${a.cargaHoraria} horas`:""],["Eixo tecnológico",(a.eixos||[]).join(", ")]].filter(([,s])=>s);return o.length?`
        <div class="curso-ficha">
            ${o.map(([s,e])=>`
                <div class="curso-ficha-item">
                    <span class="curso-ficha-rotulo">${n(s)}</span>
                    <strong>${n(String(e))}</strong>
                </div>`).join("")}
        </div>`:""}function z(a){const o=[];return a.preRequisitos&&o.push(`<div class="curso-aviso curso-aviso--requisito">
            <strong>Este curso exige formação anterior.</strong>
            <span>${n(a.preRequisitos)}</span>
        </div>`),a.provaAptidao&&o.push(`<div class="curso-aviso curso-aviso--aptidao">
            <strong>Tem prova de aptidão.</strong>
            <span>Além da prova escrita do Vestibulinho, quem se inscreve neste curso faz uma prova prática.</span>
        </div>`),o.join("")}function M({nivel:a,km:o}){if(o!=null){const s=S(o);return`${s.charAt(0).toUpperCase()}${s.slice(1)} de você`}return a===$.CIDADE?"Na sua cidade":a===$.REGIAO?"Na sua região":""}const C=10;function j(a,o,s){if(!a.length)return'<p class="sem-cursos">Nenhuma unidade do cadastro oferece este curso no momento.</p>';const e=a.map(r=>({unidade:r,proximidade:o?o(r):null}));o&&e.sort((r,c)=>r.proximidade.ordem-c.proximidade.ordem||(r.unidade.nome||"").localeCompare(c.unidade.nome||"","pt-BR"));const i=e.length-C,t=i>0?`<a class="curso-ver-todas" href="instituicoes.html?curso=${encodeURIComponent(s)}">
             Ver as outras ${i} unidades &rarr;</a>`:"";return`<ul class="curso-unidades">
        ${e.slice(0,C).map(({unidade:r,proximidade:c})=>{const u=c?M(c):"";return`<li>
                <span class="curso-unidade-nome">${n(r.nome)}</span>
                <span class="curso-unidade-cidade">${n(r.municipio||"")}</span>
                ${u?`<span class="curso-unidade-km">📍 ${n(u)}</span>`:""}
            </li>`}).join("")}
    </ul>
    ${t}`}function I(a,o,s){const e=document.getElementById("curso-detalhe");document.title=`Futuro+ | ${a.nome}`,e.innerHTML=`
        <header class="curso-cabecalho">
            <h1>${n(a.nome)}</h1>
            <div class="curso-modalidades">
                ${(a.modalidades||[]).map(i=>`<span class="tag-modalidade">${n(i)}</span>`).join("")}
            </div>
        </header>

        ${P(a)}
        ${z(a)}
        ${l("O que você aprende",a.descricao)}
        ${l("O que o profissional faz",a.atuacao)}
        ${l("Onde se trabalha",a.ondeTrabalhar)}

        <section class="curso-bloco">
            <h2>Onde estudar</h2>
            ${j(o,s,a.nome)}
        </section>

        <p class="curso-fonte">Informações do catálogo oficial do Centro Paula Souza, mantidas no Futuro+.</p>
    `}function q(a){const o=document.getElementById("curso-plano-pdf");if(!a.planoCursoUrl){o.hidden=!0;return}document.getElementById("curso-plano-pdf-iframe").src=a.planoCursoUrl,document.getElementById("curso-plano-pdf-abrir").href=a.planoCursoUrl,o.hidden=!1}async function H(){await v.authStateReady();const a=v.currentUser;if(!a)return null;const o=await E(O(m,"usuarios",a.uid)),s=await L(a.uid,o.exists()?o.data():null);if(!s)return null;const e=await U().catch(()=>null);return R(s,e)}async function N(){const a=document.getElementById("curso-detalhe"),o=new URLSearchParams(window.location.search),s=o.get("c")||o.get("curso")||"";if(!s){a.innerHTML='<p class="sem-resultados">Curso não informado. Volte para a lista de cursos.</p>';return}try{const e=y(s),i=await E(O(m,T,e)).catch(()=>null),t=i?.exists()?i.data():await x(e);if(!t){a.innerHTML=`<p class="sem-resultados">
                Ainda não temos a descrição deste curso.
                <a href="instituicoes.html?curso=${encodeURIComponent(s)}">Ver as unidades que oferecem</a>.
            </p>`;return}const r=p(t.nome),c=t.nivel==="superior",f=(await D(A(m,"instituicoes"))).docs.map(d=>({id:d.id,...d.data()})).filter(d=>{if(!(d.cursos||[]).some(w=>p(w?.nome)===r))return!1;const g=(d.tipo||"").trim().toLowerCase()==="fatec";return c?g:!g});q(t),I(t,f,null);const h=await H().catch(()=>null);h&&I(t,f,h)}catch(e){console.error("Erro ao carregar o curso:",e),a.innerHTML='<p class="sem-resultados">Não foi possível carregar este curso agora. Tente novamente mais tarde.</p>'}}document.addEventListener("DOMContentLoaded",N);
