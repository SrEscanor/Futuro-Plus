function u(o,e){return e<=8?Array.from({length:e},(t,a)=>a+1):[...new Set([1,e,o,o-1,o+1])].filter(t=>t>=1&&t<=e).sort((t,a)=>t-a)}function d(o,e,n){const t=o==="anterior",a=`<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="${t?"M15 5l-7 7 7 7":"M9 5l7 7-7 7"}"/></svg>`,i=`<span class="pagina-seta-texto">${t?"Anterior":"Próxima"}</span>`;return`<button type="button" class="pagina-botao pagina-botao--seta" data-pagina="${e}"
        aria-label="${t?"Página anterior":"Próxima página"}"${n?" disabled":""}>
        ${t?a+i:i+a}</button>`}function b(o,e,n,t){const a=o.filter(Boolean);if(n<=1){a.forEach(r=>{r.innerHTML=""});return}let i="",s=0;u(e,n).forEach(r=>{r-s>1&&(i+='<span class="pagina-reticencias" aria-hidden="true">…</span>'),i+=`<button type="button" class="pagina-botao${r===e?" pagina-botao--ativo":""}"
            data-pagina="${r}" aria-label="Página ${r}"${r===e?' aria-current="page"':""}>${r}</button>`,s=r});const l=`
        <span class="pagina-resumo">Página <strong>${e}</strong> de ${n}</span>
        <div class="pagina-botoes">
            ${d("anterior",e-1,e===1)}
            ${i}
            ${d("proxima",e+1,e===n)}
        </div>`;a.forEach(r=>{r.setAttribute("role","navigation"),r.hasAttribute("aria-label")||r.setAttribute("aria-label","Páginas"),r.innerHTML=l,r.querySelectorAll("[data-pagina]").forEach(c=>{c.addEventListener("click",()=>t(Number(c.dataset.pagina)))})})}export{b as r};
