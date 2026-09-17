import{g,e as m,b as p}from"./firebase-config-2TrdlHoc.js";import"./dashboard-4l6TMF4d.js";const v="/etec-logo-padrao.png",f="/logo.png";let l=[];function t(e){return String(e??"").replace(/[&<>"']/g,o=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[o])}function d(e){return(e||"").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"")}function h(e){const o=new Map;return(e||[]).forEach(a=>{if(!a||!a.nome)return;const n=a.categoria||"Outros cursos";o.has(n)||o.set(n,[]),o.get(n).push(a.nome)}),o}function C(e){const o=e.logotipoUrl?t(e.logotipoUrl):v,a=[e.municipio,e.regiao].filter(Boolean).join(" · "),s=[...h(e.cursos).entries()].map(([r,i])=>`
        <div class="grupo-categoria">
            <div class="categoria-label">${t(r)}</div>
            <div class="tags-cursos">
                ${i.map(c=>`<span class="tag-curso">${t(c)}</span>`).join("")}
            </div>
        </div>
    `).join("");return`
    <article class="card-unidade">
        <div class="card-unidade-topo">
            <img class="logo-unidade" src="${o}" alt="" onerror="this.onerror=null;this.src='${f}';">
            <div>
                <h3 class="nome-unidade">${t(e.nome)}</h3>
                <div class="local-unidade">${t(a)}</div>
            </div>
        </div>
        <div class="card-unidade-cursos">
            ${s||'<p class="sem-cursos">Nenhum curso cadastrado ainda.</p>'}
        </div>
    </article>`}function u(){const e=document.getElementById("busca-cursos"),o=document.getElementById("grid-unidades"),a=document.getElementById("contagem-resultados"),n=d(e.value),s=l.filter(r=>n?d([r.nome,r.municipio,r.regiao,...(r.cursos||[]).map(c=>c.nome)].filter(Boolean).join(" ")).includes(n):!0);if(a.textContent=`${s.length} unidade${s.length===1?"":"s"} encontrada${s.length===1?"":"s"}`,!s.length){o.innerHTML='<p class="sem-resultados">Nenhuma unidade encontrada para essa busca.</p>';return}o.innerHTML=s.map(C).join("")}async function E(){const e=document.getElementById("grid-unidades");try{l=(await g(m(p,"etecs"))).docs.map(a=>({id:a.id,...a.data()})).sort((a,n)=>(a.nome||"").localeCompare(n.nome||"","pt-BR")),u()}catch(o){console.error("Erro ao carregar unidades ETEC:",o),e.innerHTML='<p class="sem-resultados">Não foi possível carregar os cursos agora. Tente novamente mais tarde.</p>'}}document.addEventListener("DOMContentLoaded",()=>{E(),document.getElementById("busca-cursos").addEventListener("input",u)});
