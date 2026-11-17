const m="/etec-logo.png",v="/fatec-logo.png",d="/logo.png";function h(i){const o=(i||"").trim().toLowerCase();return o==="fatec"?v:o==="etec"?m:d}function t(i){return String(i??"").replace(/[&<>"']/g,o=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[o])}function u(i){return(i||"").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/[^a-z0-9]+/g," ").trim()}const n=[{chave:"medio",rotulo:"Médio + Técnico",combina:i=>i.includes("ensino medio")&&!i.includes("superior")},{chave:"tecnico",rotulo:"Técnico",combina:i=>i.includes("tecnicos")&&i.includes("presencial")&&!i.includes("semipresencial")},{chave:"especializacao",rotulo:"Especialização",combina:i=>i.includes("especializacao")},{chave:"ead",rotulo:"EaD / Online",combina:i=>!i.includes("superior")&&(i.includes("online")||i.includes("ead")||i.includes("distancia"))},{chave:"semipresencial",rotulo:"Semipresencial",combina:i=>i.includes("semipresencial")},{chave:"ams",rotulo:"Médio + Superior (AMS)",combina:i=>i.includes("superior")&&(i.includes("articulacao")||i.includes("medio")||/\bams\b/.test(i))},{chave:"superior",rotulo:"Superior",combina:i=>i.includes("superior")},{chave:"outros",rotulo:"Outros",combina:()=>!0}];function f(i){const o=u(i);return n.find(s=>s.combina(o))||n.at(-1)}function z(i){return n.find(o=>o.chave===i)?.rotulo||i}function w(i){const o=n.findIndex(s=>s.chave===i);return o===-1?n.length:o}function $(i,o){const s=u(i).replace(/\s+/g,"-"),a=(o||"").trim().toLowerCase();return a&&a!=="etec"?`superior-${s}`:s}function C(i,o){const s=new Map;return(i||[]).forEach(a=>{if(!a||!a.nome)return;const e=a.categoria||"Outros cursos";o&&!o.has(f(e).chave)||(s.has(e)||s.set(e,[]),s.get(e).push(a.nome))}),s}function b(i){return i.logotipoUrl?t(i.logotipoUrl):h((i.tipo||"").trim())}function D(i,{termoCurso:o="",modalidades:s=null}={}){const a=(i.tipo||"").trim();return[...C(i.cursos,s).entries()].map(([r,c])=>`
        <div class="grupo-categoria">
            <div class="categoria-label">${t(r)}</div>
            <div class="tags-cursos">
                ${c.map(l=>{const p=o&&u(l).includes(o),g=`curso.html?c=${encodeURIComponent($(l,a))}`;return`<a class="tag-curso${p?" tag-curso--destaque":""}" href="${g}">${t(l)}</a>`}).join("")}
            </div>
        </div>
    `).join("")}const O='<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a7 7 0 0 0-7 7c0 5.2 7 13 7 13s7-7.800 7-13a7 7 0 0 0-7-7zm0 9.500A2.500 2.500 0 1 1 12 6.500a2.500 2.500 0 0 1 0 5z"/></svg>',A='<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 3 1 9l11 6 9-4.910V17h2V9L12 3zm-7 9.180V16c0 1.660 3.130 3 7 3s7-1.340 7-3v-3.820l-7 3.820-7-3.820z"/></svg>',L='<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.200" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';function E(i,{destaque:o="",cursosDestaque:s=[],totalCursos:a=0}={}){const e=(i.tipo||"").trim(),r=i.municipio?`${i.municipio} - SP`:"";return`
    <article class="card-unidade card-instituicao">
        <div class="card-instituicao-topo">
            <img class="card-instituicao-logo" src="${b(i)}" alt="" onerror="this.onerror=null;this.src='${d}';">
            <span class="card-instituicao-divisor" aria-hidden="true"></span>
            <h3 class="nome-unidade">${t(i.nome)}</h3>
        </div>
        <div class="card-instituicao-info">
            ${r?`<div class="card-instituicao-local">${O}<span>${t(r)}</span></div>`:""}
            <div class="card-instituicao-selos">
                ${e?`<span class="selo-instituicao">${t(e)}</span>`:""}
                ${o?`<span class="selo-instituicao selo-instituicao--perto">${t(o)}</span>`:""}
            </div>
        </div>
        <div class="card-instituicao-cursos">
            <div class="card-instituicao-total">${A}<span><strong>${a}</strong> ${a===1?"curso disponível":"cursos disponíveis"}</span></div>
            ${s.length?`
            <div class="card-instituicao-destaques">
                <span>Cursos em destaque:</span>
                <ul>${s.map(c=>`<li>${t(c)}</li>`).join("")}</ul>
            </div>`:'<p class="sem-cursos">Nenhum curso cadastrado ainda.</p>'}
        </div>
        <button type="button" class="btn-ver-instituicao" data-unidade="${t(i.id)}">Ver instituição ${L}</button>
    </article>`}export{d as L,z as a,b,D as c,t as e,h as l,f as m,u as n,w as o,E as r};
