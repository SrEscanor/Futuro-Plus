const d="/etec-logo.png",p="/fatec-logo.png",c="/logo.png";function m(i){const o=(i||"").trim().toLowerCase();return o==="fatec"?p:o==="etec"?d:c}function s(i){return String(i??"").replace(/[&<>"']/g,o=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[o])}function l(i){return(i||"").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/[^a-z0-9]+/g," ").trim()}const e=[{chave:"medio",rotulo:"Médio + Técnico",combina:i=>i.includes("ensino medio")&&!i.includes("superior")},{chave:"tecnico",rotulo:"Técnico",combina:i=>i.includes("tecnicos")&&i.includes("presencial")&&!i.includes("semipresencial")},{chave:"especializacao",rotulo:"Especialização",combina:i=>i.includes("especializacao")},{chave:"ead",rotulo:"EaD / Online",combina:i=>!i.includes("superior")&&(i.includes("online")||i.includes("ead")||i.includes("distancia"))},{chave:"semipresencial",rotulo:"Semipresencial",combina:i=>i.includes("semipresencial")},{chave:"ams",rotulo:"Médio + Superior (AMS)",combina:i=>i.includes("superior")&&(i.includes("articulacao")||i.includes("medio")||/\bams\b/.test(i))},{chave:"superior",rotulo:"Superior",combina:i=>i.includes("superior")},{chave:"outros",rotulo:"Outros",combina:()=>!0}];function C(i){const o=l(i);return e.find(a=>a.combina(o))||e.at(-1)}function O(i){return e.find(o=>o.chave===i)?.rotulo||i}function b(i){const o=e.findIndex(a=>a.chave===i);return o===-1?e.length:o}function A(i,o){const a=l(i).replace(/\s+/g,"-"),n=(o||"").trim().toLowerCase();return n&&n!=="etec"?`superior-${a}`:a}function h(i){return i.logotipoUrl?s(i.logotipoUrl):m((i.tipo||"").trim())}const v='<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a7 7 0 0 0-7 7c0 5.2 7 13 7 13s7-7.800 7-13a7 7 0 0 0-7-7zm0 9.500A2.500 2.500 0 1 1 12 6.500a2.500 2.500 0 0 1 0 5z"/></svg>',g='<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 3 1 9l11 6 9-4.910V17h2V9L12 3zm-7 9.180V16c0 1.660 3.130 3 7 3s7-1.340 7-3v-3.820l-7 3.820-7-3.820z"/></svg>',f='<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.200" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';function $(i,o=""){return i?`instituicao.html?u=${encodeURIComponent(i)}${o}`:""}function L(i,{destaque:o="",cursosDestaque:a=[],totalCursos:n=0}={}){const t=(i.tipo||"").trim(),r=i.municipio?`${i.municipio} - SP`:"";return`
    <article class="card-unidade card-instituicao">
        <div class="card-instituicao-topo">
            <img class="card-instituicao-logo" src="${h(i)}" alt="" onerror="this.onerror=null;this.src='${c}';">
            <span class="card-instituicao-divisor" aria-hidden="true"></span>
            <h3 class="nome-unidade">${s(i.nome)}</h3>
        </div>
        <div class="card-instituicao-info">
            ${r?`<div class="card-instituicao-local">${v}<span>${s(r)}</span></div>`:""}
            <div class="card-instituicao-selos">
                ${t?`<span class="selo-instituicao">${s(t)}</span>`:""}
                ${o?`<span class="selo-instituicao selo-instituicao--perto">${s(o)}</span>`:""}
            </div>
        </div>
        <div class="card-instituicao-cursos">
            <div class="card-instituicao-total">${g}<span><strong>${n}</strong> ${n===1?"curso disponível":"cursos disponíveis"}</span></div>
            ${a.length?`
            <div class="card-instituicao-destaques">
                <span>Cursos em destaque:</span>
                <ul>${a.map(u=>`<li>${s(u)}</li>`).join("")}</ul>
            </div>`:'<p class="sem-cursos">Nenhum curso cadastrado ainda.</p>'}
        </div>
        <a class="btn-ver-instituicao" href="${s($(i.id))}">Ver instituição ${f}</a>
    </article>`}export{c as L,h as a,O as b,$ as c,s as e,m as l,C as m,l as n,b as o,A as p,L as r};
