const h="/etec-logo-padrao.png",f="/logo.png";function e(o){return String(o??"").replace(/[&<>"']/g,a=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[a])}function t(o){return(o||"").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/[^a-z0-9]+/g," ").trim()}const c=[{chave:"medio",rotulo:"Médio + Técnico",combina:o=>o.includes("ensino medio")&&!o.includes("superior")},{chave:"tecnico",rotulo:"Técnico",combina:o=>o.includes("tecnicos")&&o.includes("presencial")&&!o.includes("semipresencial")},{chave:"especializacao",rotulo:"Especialização",combina:o=>o.includes("especializacao")},{chave:"ead",rotulo:"EaD / Online",combina:o=>o.includes("online")||o.includes("ead")||o.includes("distancia")},{chave:"semipresencial",rotulo:"Semipresencial",combina:o=>o.includes("semipresencial")},{chave:"ams",rotulo:"Médio + Superior (AMS)",combina:o=>o.includes("superior")},{chave:"outros",rotulo:"Outros",combina:()=>!0}];function $(o){const a=t(o);return c.find(i=>i.combina(a))||c.at(-1)}function C(o){return c.find(a=>a.chave===o)?.rotulo||o}function z(o){const a=c.findIndex(i=>i.chave===o);return a===-1?c.length:a}function b(o){return t(o).replace(/\s+/g,"-")}function D(o,a){const i=new Map;return(o||[]).forEach(n=>{if(!n||!n.nome)return;const s=n.categoria||"Outros cursos";a&&!a.has($(s).chave)||(i.has(s)||i.set(s,[]),i.get(s).push(n.nome))}),i}function A(o,{destaque:a="",termoCurso:i="",modalidades:n=null}={}){const s=o.logotipoUrl?e(o.logotipoUrl):h,u=[o.municipio,o.regiao].filter(Boolean).join(" · "),d=[...D(o.cursos,n).entries()].map(([p,g])=>`
        <div class="grupo-categoria">
            <div class="categoria-label">${e(p)}</div>
            <div class="tags-cursos">
                ${g.map(r=>{const m=i&&t(r).includes(i),v=`curso.html?c=${encodeURIComponent(b(r))}`;return`<a class="tag-curso${m?" tag-curso--destaque":""}" href="${v}">${e(r)}</a>`}).join("")}
            </div>
        </div>
    `).join(""),l=(o.tipo||"").trim();return`
    <article class="card-unidade">
        <div class="card-unidade-topo">
            <img class="logo-unidade" src="${s}" alt="" onerror="this.onerror=null;this.src='${f}';">
            <div>
                <h3 class="nome-unidade">${e(o.nome)}</h3>
                <div class="local-unidade">
                    ${l?`<span class="tipo-instituicao">${e(l)}</span>`:""}
                    ${e(u)}
                </div>
            </div>
        </div>
        ${a?`<div class="faixa-distancia"><span aria-hidden="true">📍</span> ${e(a)}</div>`:""}
        <div class="card-unidade-cursos">
            ${d||'<p class="sem-cursos">Nenhum curso cadastrado ainda.</p>'}
        </div>
    </article>`}export{C as a,e,$ as m,t as n,z as o,A as r};
