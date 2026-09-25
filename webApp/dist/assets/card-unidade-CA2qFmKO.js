const h="/etec-logo.png",$="/fatec-logo.png",l="/logo.png";function C(o){const a=(o||"").trim().toLowerCase();return a==="fatec"?$:a==="etec"?h:l}function s(o){return String(o??"").replace(/[&<>"']/g,a=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[a])}function t(o){return(o||"").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/[^a-z0-9]+/g," ").trim()}const r=[{chave:"medio",rotulo:"Médio + Técnico",combina:o=>o.includes("ensino medio")&&!o.includes("superior")},{chave:"tecnico",rotulo:"Técnico",combina:o=>o.includes("tecnicos")&&o.includes("presencial")&&!o.includes("semipresencial")},{chave:"especializacao",rotulo:"Especialização",combina:o=>o.includes("especializacao")},{chave:"ead",rotulo:"EaD / Online",combina:o=>o.includes("online")||o.includes("ead")||o.includes("distancia")},{chave:"semipresencial",rotulo:"Semipresencial",combina:o=>o.includes("semipresencial")},{chave:"ams",rotulo:"Médio + Superior (AMS)",combina:o=>o.includes("superior")},{chave:"outros",rotulo:"Outros",combina:()=>!0}];function O(o){const a=t(o);return r.find(e=>e.combina(a))||r.at(-1)}function L(o){return r.find(a=>a.chave===o)?.rotulo||o}function z(o){const a=r.findIndex(e=>e.chave===o);return a===-1?r.length:a}function b(o,a){const e=t(o).replace(/\s+/g,"-"),i=(a||"").trim().toLowerCase();return i&&i!=="etec"?`superior-${e}`:e}function D(o,a){const e=new Map;return(o||[]).forEach(i=>{if(!i||!i.nome)return;const n=i.categoria||"Outros cursos";a&&!a.has(O(n).chave)||(e.has(n)||e.set(n,[]),e.get(n).push(i.nome))}),e}function E(o,{destaque:a="",termoCurso:e="",modalidades:i=null}={}){const n=(o.tipo||"").trim(),u=o.logotipoUrl?s(o.logotipoUrl):C(n),d=[o.municipio,o.regiao].filter(Boolean).join(" · "),p=[...D(o.cursos,i).entries()].map(([g,m])=>`
        <div class="grupo-categoria">
            <div class="categoria-label">${s(g)}</div>
            <div class="tags-cursos">
                ${m.map(c=>{const v=e&&t(c).includes(e),f=`curso.html?c=${encodeURIComponent(b(c,n))}`;return`<a class="tag-curso${v?" tag-curso--destaque":""}" href="${f}">${s(c)}</a>`}).join("")}
            </div>
        </div>
    `).join("");return`
    <article class="card-unidade">
        <div class="card-unidade-topo">
            <img class="logo-unidade" src="${u}" alt="" onerror="this.onerror=null;this.src='${l}';">
            <div>
                <h3 class="nome-unidade">${s(o.nome)}</h3>
                <div class="local-unidade">
                    ${n?`<span class="tipo-instituicao">${s(n)}</span>`:""}
                    ${s(d)}
                </div>
            </div>
        </div>
        ${a?`<div class="faixa-distancia"><span aria-hidden="true">📍</span> ${s(a)}</div>`:""}
        <div class="card-unidade-cursos">
            ${p||'<p class="sem-cursos">Nenhum curso cadastrado ainda.</p>'}
        </div>
    </article>`}export{l as L,L as a,s as e,C as l,O as m,t as n,z as o,E as r};
