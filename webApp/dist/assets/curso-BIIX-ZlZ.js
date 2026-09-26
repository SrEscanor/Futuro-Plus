import{e as w,d as I,b as m,g as D,c as L,f as v}from"./firebase-config-BtrRUHdO.js";import"./dashboard-Bs6H8aiO.js";/* empty css                    */import{n as p,e as n}from"./card-unidade-CA2qFmKO.js";import{r as E,c as R,a as S,P as $}from"./recomendacao-cursos-iYhGVT_N.js";import{f as T}from"./geocodificacao-GFhpmzSl.js";import"./conteudo-legal-padrao-DB74JH29.js";import"./categorias-teste-82RqXHiT.js";const x="cursos",U="/dados/catalogo-cursos.json";async function b(a){const o=await fetch(U);return o.ok&&(await o.json()).find(e=>e.slug===a)||null}function z(a){return p(a).replace(/\s+/g,"-")}function l(a,o){return o?`
        <section class="curso-bloco">
            <h2>${n(a)}</h2>
            <p>${n(o)}</p>
        </section>`:""}function M(a){const o=[["Duração",a.duracao],["Carga horária",a.cargaHoraria?`${a.cargaHoraria} horas`:""],["Eixo tecnológico",(a.eixos||[]).join(", ")]].filter(([,s])=>s);return o.length?`
        <div class="curso-ficha">
            ${o.map(([s,e])=>`
                <div class="curso-ficha-item">
                    <span class="curso-ficha-rotulo">${n(s)}</span>
                    <strong>${n(String(e))}</strong>
                </div>`).join("")}
        </div>`:""}function P(a){const o=[];return a.preRequisitos&&o.push(`<div class="curso-aviso curso-aviso--requisito">
            <strong>Este curso exige formação anterior.</strong>
            <span>${n(a.preRequisitos)}</span>
        </div>`),a.provaAptidao&&o.push(`<div class="curso-aviso curso-aviso--aptidao">
            <strong>Tem prova de aptidão.</strong>
            <span>Além da prova escrita do Vestibulinho, quem se inscreve neste curso faz uma prova prática.</span>
        </div>`),o.join("")}function j({nivel:a,km:o}){if(o!=null){const s=T(o);return`${s.charAt(0).toUpperCase()}${s.slice(1)} de você`}return a===$.CIDADE?"Na sua cidade":a===$.REGIAO?"Na sua região":""}const C=10;function q(a,o,s){if(!a.length)return'<p class="sem-cursos">Nenhuma unidade do cadastro oferece este curso no momento.</p>';const e=a.map(r=>({unidade:r,proximidade:o?o(r):null}));o&&e.sort((r,c)=>r.proximidade.ordem-c.proximidade.ordem||(r.unidade.nome||"").localeCompare(c.unidade.nome||"","pt-BR"));const t=e.length-C,i=t>0?`<a class="curso-ver-todas" href="cursos.html?curso=${encodeURIComponent(s)}">
             Ver as outras ${t} unidades &rarr;</a>`:"";return`<ul class="curso-unidades">
        ${e.slice(0,C).map(({unidade:r,proximidade:c})=>{const d=c?j(c):"";return`<li>
                <span class="curso-unidade-nome">${n(r.nome)}</span>
                <span class="curso-unidade-cidade">${n(r.municipio||"")}</span>
                ${d?`<span class="curso-unidade-km">📍 ${n(d)}</span>`:""}
            </li>`}).join("")}
    </ul>
    ${i}`}function O(a,o,s){const e=document.getElementById("curso-detalhe");document.title=`Futuro+ | ${a.nome}`,e.innerHTML=`
        <header class="curso-cabecalho">
            <h1>${n(a.nome)}</h1>
            <div class="curso-modalidades">
                ${(a.modalidades||[]).map(t=>`<span class="tag-modalidade">${n(t)}</span>`).join("")}
            </div>
        </header>

        ${M(a)}
        ${P(a)}
        ${l("O que você aprende",a.descricao)}
        ${l("O que o profissional faz",a.atuacao)}
        ${l("Onde se trabalha",a.ondeTrabalhar)}

        <section class="curso-bloco">
            <h2>Onde estudar</h2>
            ${q(o,s,a.nome)}
        </section>

        <p class="curso-fonte">Informações do catálogo oficial do Centro Paula Souza, mantidas no Futuro+.</p>
    `}async function y(){await v.authStateReady();const a=v.currentUser;if(!a)return null;const o=await w(I(m,"usuarios",a.uid)),s=await E(a.uid,o.exists()?o.data():null);if(!s)return null;const e=await R().catch(()=>null);return S(s,e)}async function H(){const a=document.getElementById("curso-detalhe"),o=new URLSearchParams(window.location.search),s=o.get("c")||o.get("curso")||"";if(!s){a.innerHTML='<p class="sem-resultados">Curso não informado. Volte para a lista de cursos.</p>';return}try{const e=z(s),t=await w(I(m,x,e)).catch(()=>null),i=t?.exists()?t.data():await b(e);if(!i){a.innerHTML=`<p class="sem-resultados">
                Ainda não temos a descrição deste curso.
                <a href="cursos.html?curso=${encodeURIComponent(s)}">Ver as unidades que oferecem</a>.
            </p>`;return}const r=p(i.nome),c=i.nivel==="superior",f=(await D(L(m,"instituicoes"))).docs.map(u=>({id:u.id,...u.data()})).filter(u=>{if(!(u.cursos||[]).some(A=>p(A?.nome)===r))return!1;const g=(u.tipo||"").trim().toLowerCase()==="fatec";return c?g:!g});O(i,f,null);const h=await y().catch(()=>null);h&&O(i,f,h)}catch(e){console.error("Erro ao carregar o curso:",e),a.innerHTML='<p class="sem-resultados">Não foi possível carregar este curso agora. Tente novamente mais tarde.</p>'}}document.addEventListener("DOMContentLoaded",H);
