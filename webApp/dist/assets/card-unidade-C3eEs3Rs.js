const O="/etec-logo.png",z="/fatec-logo.png",v="/logo.png";function m(o){const i=(o||"").trim().toLowerCase();return i==="fatec"?z:i==="etec"?O:v}function a(o){return String(o??"").replace(/[&<>"']/g,i=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[i])}function u(o){return(o||"").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/[^a-z0-9]+/g," ").trim()}const e=[{chave:"medio",rotulo:"Médio + Técnico",combina:o=>o.includes("ensino medio")&&!o.includes("superior")},{chave:"tecnico",rotulo:"Técnico",combina:o=>o.includes("tecnicos")&&o.includes("presencial")&&!o.includes("semipresencial")},{chave:"especializacao",rotulo:"Especialização",combina:o=>o.includes("especializacao")},{chave:"ead",rotulo:"EaD / Online",combina:o=>!o.includes("superior")&&(o.includes("online")||o.includes("ead")||o.includes("distancia"))},{chave:"semipresencial",rotulo:"Semipresencial",combina:o=>o.includes("semipresencial")},{chave:"ams",rotulo:"Médio + Superior (AMS)",combina:o=>o.includes("superior")&&(o.includes("articulacao")||o.includes("medio")||/\bams\b/.test(o))},{chave:"superior",rotulo:"Superior",combina:o=>o.includes("superior")},{chave:"outros",rotulo:"Outros",combina:()=>!0}];function A(o){const i=u(o);return e.find(s=>s.combina(i))||e.at(-1)}function M(o){return e.find(i=>i.chave===o)?.rotulo||o}function S(o){const i=e.findIndex(s=>s.chave===o);return i===-1?e.length:i}function h(o,i){const s=u(o).replace(/\s+/g,"-"),r=(i||"").trim().toLowerCase();return r&&r!=="etec"?`superior-${s}`:s}function $(o,i){const s=new Map;return(o||[]).forEach(r=>{if(!r||!r.nome)return;const t=r.categoria||"Outros cursos";i&&!i.has(A(t).chave)||(s.has(t)||s.set(t,[]),s.get(t).push(r.nome))}),s}function L(o){return o.logotipoUrl?a(o.logotipoUrl):m((o.tipo||"").trim())}function U(o,{termoCurso:i="",modalidades:s=null}={}){const r=(o.tipo||"").trim();return[...$(o.cursos,s).entries()].map(([n,c])=>`
        <div class="grupo-categoria">
            <div class="categoria-label">${a(n)}</div>
            <div class="tags-cursos">
                ${c.map(l=>{const d=i&&u(l).includes(i),p=`curso.html?c=${encodeURIComponent(h(l,r))}`;return`<a class="tag-curso${d?" tag-curso--destaque":""}" href="${p}">${a(l)}</a>`}).join("")}
            </div>
        </div>
    `).join("")}const w='<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a7 7 0 0 0-7 7c0 5.2 7 13 7 13s7-7.800 7-13a7 7 0 0 0-7-7zm0 9.500A2.500 2.500 0 1 1 12 6.500a2.500 2.500 0 0 1 0 5z"/></svg>',D='<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 3 1 9l11 6 9-4.910V17h2V9L12 3zm-7 9.180V16c0 1.660 3.130 3 7 3s7-1.340 7-3v-3.820l-7 3.820-7-3.820z"/></svg>',E='<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.200" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';function I(o,{destaque:i="",cursosDestaque:s=[],totalCursos:r=0}={}){const t=(o.tipo||"").trim(),n=o.municipio?`${o.municipio} - SP`:"";return`
    <article class="card-unidade card-instituicao">
        <div class="card-instituicao-topo">
            <img class="card-instituicao-logo" src="${L(o)}" alt="" onerror="this.onerror=null;this.src='${v}';">
            <span class="card-instituicao-divisor" aria-hidden="true"></span>
            <h3 class="nome-unidade">${a(o.nome)}</h3>
        </div>
        <div class="card-instituicao-info">
            ${n?`<div class="card-instituicao-local">${w}<span>${a(n)}</span></div>`:""}
            <div class="card-instituicao-selos">
                ${t?`<span class="selo-instituicao">${a(t)}</span>`:""}
                ${i?`<span class="selo-instituicao selo-instituicao--perto">${a(i)}</span>`:""}
            </div>
        </div>
        <div class="card-instituicao-cursos">
            <div class="card-instituicao-total">${D}<span><strong>${r}</strong> ${r===1?"curso disponível":"cursos disponíveis"}</span></div>
            ${s.length?`
            <div class="card-instituicao-destaques">
                <span>Cursos em destaque:</span>
                <ul>${s.map(c=>`<li>${a(c)}</li>`).join("")}</ul>
            </div>`:'<p class="sem-cursos">Nenhum curso cadastrado ainda.</p>'}
        </div>
        <button type="button" class="btn-ver-instituicao" data-unidade="${a(o.id)}">Ver instituição ${E}</button>
    </article>`}function _(o,{destaque:i="",termoCurso:s="",modalidades:r=null}={}){const t=(o.tipo||"").trim(),n=o.logotipoUrl?a(o.logotipoUrl):m(t),c=[o.municipio,o.regiao].filter(Boolean).join(" · "),d=[...$(o.cursos,r).entries()].map(([p,f])=>`
        <div class="grupo-categoria">
            <div class="categoria-label">${a(p)}</div>
            <div class="tags-cursos">
                ${f.map(g=>{const C=s&&u(g).includes(s),b=`curso.html?c=${encodeURIComponent(h(g,t))}`;return`<a class="tag-curso${C?" tag-curso--destaque":""}" href="${b}">${a(g)}</a>`}).join("")}
            </div>
        </div>
    `).join("");return`
    <article class="card-unidade">
        <div class="card-unidade-topo">
            <img class="logo-unidade" src="${n}" alt="" onerror="this.onerror=null;this.src='${v}';">
            <div>
                <h3 class="nome-unidade">${a(o.nome)}</h3>
                <div class="local-unidade">
                    ${t?`<span class="tipo-instituicao">${a(t)}</span>`:""}
                    ${a(c)}
                </div>
            </div>
        </div>
        ${i?`<div class="faixa-distancia"><span aria-hidden="true">📍</span> ${a(i)}</div>`:""}
        <div class="card-unidade-cursos">
            ${d||'<p class="sem-cursos">Nenhum curso cadastrado ainda.</p>'}
        </div>
    </article>`}export{v as L,I as a,M as b,L as c,U as d,a as e,m as l,A as m,u as n,S as o,_ as r};
