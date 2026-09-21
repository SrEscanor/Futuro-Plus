import{e as C,d as O,b as m,g as w,c as A,f as h}from"./firebase-config-vU8gAbDc.js";import"./dashboard-CgmsALoS.js";/* empty css                    */import{n as p,e as n,f as D}from"./geocodificacao-cQRB5Sqc.js";import{r as L,c as E,a as R,P as g}from"./recomendacao-cursos-DMDBt6wJ.js";const T="cursos",x="/dados/catalogo-cursos.json";async function S(a){const o=await fetch(x);return o.ok&&(await o.json()).find(e=>e.slug===a)||null}function U(a){return p(a).replace(/\s+/g,"-")}function l(a,o){return o?`
        <section class="curso-bloco">
            <h2>${n(a)}</h2>
            <p>${n(o)}</p>
        </section>`:""}function b(a){const o=[["Duração",a.duracao],["Carga horária",a.cargaHoraria?`${a.cargaHoraria} horas`:""],["Eixo tecnológico",(a.eixos||[]).join(", ")]].filter(([,s])=>s);return o.length?`
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
        </div>`),o.join("")}function M({nivel:a,km:o}){if(o!=null){const s=D(o);return`${s.charAt(0).toUpperCase()}${s.slice(1)} de você`}return a===g.CIDADE?"Na sua cidade":a===g.REGIAO?"Na sua região":""}const $=10;function P(a,o,s){if(!a.length)return'<p class="sem-cursos">Nenhuma unidade do cadastro oferece este curso no momento.</p>';const e=a.map(r=>({unidade:r,proximidade:o?o(r):null}));o&&e.sort((r,c)=>r.proximidade.ordem-c.proximidade.ordem||(r.unidade.nome||"").localeCompare(c.unidade.nome||"","pt-BR"));const t=e.length-$,i=t>0?`<a class="curso-ver-todas" href="cursos.html?curso=${encodeURIComponent(s)}">
             Ver as outras ${t} unidades &rarr;</a>`:"";return`<ul class="curso-unidades">
        ${e.slice(0,$).map(({unidade:r,proximidade:c})=>{const d=c?M(c):"";return`<li>
                <span class="curso-unidade-nome">${n(r.nome)}</span>
                <span class="curso-unidade-cidade">${n(r.municipio||"")}</span>
                ${d?`<span class="curso-unidade-km">📍 ${n(d)}</span>`:""}
            </li>`}).join("")}
    </ul>
    ${i}`}function v(a,o,s){const e=document.getElementById("curso-detalhe");document.title=`Futuro+ | ${a.nome}`,e.innerHTML=`
        <header class="curso-cabecalho">
            <h1>${n(a.nome)}</h1>
            <div class="curso-modalidades">
                ${(a.modalidades||[]).map(t=>`<span class="tag-modalidade">${n(t)}</span>`).join("")}
            </div>
        </header>

        ${b(a)}
        ${z(a)}
        ${l("O que você aprende",a.descricao)}
        ${l("O que o profissional faz",a.atuacao)}
        ${l("Onde se trabalha",a.ondeTrabalhar)}

        <section class="curso-bloco">
            <h2>Onde estudar</h2>
            ${P(o,s,a.nome)}
        </section>

        <p class="curso-fonte">Informações do catálogo oficial do Centro Paula Souza, mantidas no Futuro+.</p>
    `}async function j(){await h.authStateReady();const a=h.currentUser;if(!a)return null;const o=await C(O(m,"usuarios",a.uid)),s=await L(a.uid,o.exists()?o.data():null);if(!s)return null;const e=await E().catch(()=>null);return R(s,e)}async function q(){const a=document.getElementById("curso-detalhe"),o=new URLSearchParams(window.location.search),s=o.get("c")||o.get("curso")||"";if(!s){a.innerHTML='<p class="sem-resultados">Curso não informado. Volte para a lista de cursos.</p>';return}try{const e=U(s),t=await C(O(m,T,e)).catch(()=>null),i=t?.exists()?t.data():await S(e);if(!i){a.innerHTML=`<p class="sem-resultados">
                Ainda não temos a descrição deste curso.
                <a href="cursos.html?curso=${encodeURIComponent(s)}">Ver as unidades que oferecem</a>.
            </p>`;return}const r=p(i.nome),d=(await w(A(m,"etecs"))).docs.map(u=>({id:u.id,...u.data()})).filter(u=>(u.cursos||[]).some(I=>p(I?.nome)===r));v(i,d,null);const f=await j().catch(()=>null);f&&v(i,d,f)}catch(e){console.error("Erro ao carregar o curso:",e),a.innerHTML='<p class="sem-resultados">Não foi possível carregar este curso agora. Tente novamente mais tarde.</p>'}}document.addEventListener("DOMContentLoaded",q);
