function M(e){const i=[];let n="",s=!1;for(let c=0;c<e.length;c++){const t=e[c];s?t==='"'?e[c+1]==='"'?(n+='"',c++):s=!1:n+=t:t==='"'?s=!0:t===";"?(i.push(n),n=""):n+=t}return i.push(n),i}function p(e){return String(e??"").replace(/[&<>"']/g,i=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[i])}function L(e){return e==null||e===""||e===!1?!0:Array.isArray(e)?e.length===0:typeof e=="object"?Object.values(e).every(L):!1}function $(e){return Array.isArray(e)?e.map($):e&&typeof e=="object"?Object.keys(e).sort().reduce((i,n)=>(i[n]=$(e[n]),i),{}):e}function x(e,i){return JSON.stringify($(e))===JSON.stringify($(i))}function f(e){return Array.isArray(e)?e.map(f).filter(Boolean).join("; "):e&&typeof e=="object"?Object.entries(e).map(([i,n])=>{const s=f(n);return s?n&&typeof n=="object"?`${i}: ${s}`:s:""}).filter(Boolean).join(" · "):typeof e=="boolean"?e?"sim":"não":String(e??"")}function z({zona:e,botao:i,input:n,aoReceber:s}){const c=document.getElementById(e),t=document.getElementById(n);document.getElementById(i).addEventListener("click",()=>t.click()),t.addEventListener("change",r=>{const l=r.target.files[0];r.target.value="",l&&s(l)}),["dragenter","dragover"].forEach(r=>c.addEventListener(r,l=>{l.preventDefault(),c.classList.add("zona-arquivo--sobre")})),["dragleave","drop"].forEach(r=>c.addEventListener(r,l=>{l.preventDefault(),c.classList.remove("zona-arquivo--sobre")})),c.addEventListener("drop",r=>{const l=r.dataTransfer?.files?.[0];l&&s(l)})}function D(e,i){const n={novos:[],preencher:[],substituir:[],iguais:0};return e.forEach(({id:s,nome:c,dados:t})=>{const r=i.get(s);if(!r){n.novos.push({id:s,nome:c,dados:t});return}let l=!1;Object.keys(t).forEach(u=>{const d=t[u];if(L(d))return;const m=r[u];if(x(m,d))return;l=!0;const b={id:s,nome:c,campo:u,novo:d};L(m)?n.preencher.push(b):n.substituir.push({...b,atual:m,manual:(r.camposEditados||[]).includes(u)})}),l||(n.iguais+=1)}),n}function N(e,i,n){const s=new Map,c=t=>(s.has(t)||s.set(t,{}),s.get(t));return e.novos.forEach(({id:t,dados:r})=>s.set(t,{...r})),e.preencher.forEach(t=>{c(t.id)[t.campo]=t.novo}),e.substituir.forEach(t=>{if(i.has(`${t.id}:${t.campo}`))return;const r=c(t.id);if(r[t.campo]=t.novo,t.manual){const l=r.camposEditados||[...n.get(t.id)?.camposEditados||[]];r.camposEditados=l.filter(u=>u!==t.campo),r.editadoManualmente=r.camposEditados.length>0}}),s}function C(){let e=document.getElementById("modal-previa");return e||(e=document.createElement("div"),e.id="modal-previa",e.className="modal-overlay",e.innerHTML=`
        <div class="modal modal--largo" role="dialog" aria-modal="true" aria-labelledby="previa-titulo">
            <div class="modal-cabecalho">
                <div>
                    <h2 id="previa-titulo">Revisar antes de importar</h2>
                    <p class="previa-arquivo" id="previa-arquivo"></p>
                </div>
                <button type="button" id="btn-fechar-previa" class="btn-fechar-modal" aria-label="Cancelar">&times;</button>
            </div>

            <div class="modal-corpo">
                <div class="previa-resumo" id="previa-resumo"></div>

                <section class="previa-secao" id="previa-substituir" hidden>
                    <div class="previa-secao-topo">
                        <div>
                            <h3>Informações que seriam substituídas</h3>
                            <p id="previa-substituir-texto"></p>
                        </div>
                        <div class="previa-atalhos">
                            <button type="button" class="btn-link" id="btn-previa-todos">Marcar todos</button>
                            <button type="button" class="btn-link" id="btn-previa-nenhum">Desmarcar todos</button>
                            <button type="button" class="btn-link" id="btn-previa-manter-meus" hidden>Manter os que editei à mão</button>
                        </div>
                    </div>
                    <div id="previa-lista-substituir"></div>
                </section>

                <details class="previa-secao previa-detalhes" id="previa-novos" hidden>
                    <summary></summary>
                    <ul class="previa-lista-simples"></ul>
                </details>

                <details class="previa-secao previa-detalhes" id="previa-preencher" hidden>
                    <summary></summary>
                    <ul class="previa-lista-simples"></ul>
                </details>

                <p class="previa-nada" id="previa-nada" hidden>O arquivo não traz nada diferente do que já está
                    gravado. Não há o que importar.</p>
            </div>

            <div class="modal-rodape">
                <span class="previa-contagem" id="previa-contagem"></span>
                <button type="button" id="btn-cancelar-previa" class="btn btn-secundario">Cancelar</button>
                <button type="button" id="btn-aplicar-previa" class="btn btn-primario">Importar</button>
            </div>
        </div>`,document.body.appendChild(e),e)}function S(e,i){if(!Array.isArray(e)||!Array.isArray(i))return"";const n=i.filter(t=>!e.some(r=>x(t,r))),s=e.filter(t=>!i.some(r=>x(t,r)));if(!n.length&&!s.length)return"";const c=(t,r,l)=>r.length?`<span class="${l}"><strong>${t} (${r.length}):</strong> ${p(r.map(f).join("; "))}</span>`:"";return`<div class="previa-diferenca">
        ${c("Entram",n,"previa-entra")}
        ${c("Saem",s,"previa-sai")}
    </div>`}function H(e,{descricao:i,rotulos:n={},termos:s}){return new Promise(c=>{const t=C(),r=document.getElementById("previa-lista-substituir"),l=document.getElementById("btn-aplicar-previa"),u=a=>n[a]||a,d=e.substituir.length,m=e.substituir.filter(a=>a.manual).length,b=e.novos.length+e.preencher.length+d>0;document.getElementById("previa-arquivo").textContent=i,document.getElementById("previa-resumo").innerHTML=[[e.novos.length,s.novos,"entram por inteiro","novo"],[e.preencher.length,"campo(s) vazio(s)","serão preenchidos","preencher"],[d,"informação(ões) diferente(s)","você escolhe abaixo","substituir"],[e.iguais,s.iguais,"nada muda","igual"]].map(([a,o,v,A])=>`
            <div class="previa-numero previa-numero--${A}${a?"":" previa-numero--zero"}">
                <strong>${a}</strong>
                <span>${o}</span>
                <small>${v}</small>
            </div>`).join(""),document.getElementById("previa-substituir").hidden=!d,document.getElementById("previa-substituir-texto").textContent="Estes campos já têm um valor no Futuro+ e o arquivo traz outro. Marcado: o valor do arquivo entra no lugar. Desmarcado: fica como está hoje."+(m?` ${m} deles foram editados à mão aqui no painel.`:""),document.getElementById("btn-previa-manter-meus").hidden=!m;const g=new Map;e.substituir.forEach((a,o)=>{g.has(a.id)||g.set(a.id,{nome:a.nome,campos:[]}),g.get(a.id).campos.push({...a,indice:o})}),r.innerHTML=[...g.values()].map(a=>`
            <div class="previa-curso">
                <div class="previa-curso-nome">${p(a.nome)}</div>
                ${a.campos.map(o=>`
                <label class="previa-item">
                    <input type="checkbox" data-indice="${o.indice}" ${o.manual?"data-manual":""} checked>
                    <div class="previa-item-corpo">
                        <div class="previa-campo">
                            ${p(u(o.campo))}
                            ${o.manual?'<span class="previa-selo-manual">editado à mão</span>':""}
                        </div>
                        ${S(o.atual,o.novo)}
                        <div class="previa-valores">
                            <div class="previa-valor">
                                <span class="previa-rotulo">Hoje no Futuro+</span>
                                ${p(f(o.atual))}
                            </div>
                            <div class="previa-valor previa-valor--novo">
                                <span class="previa-rotulo">No arquivo</span>
                                ${p(f(o.novo))}
                            </div>
                        </div>
                    </div>
                </label>`).join("")}
            </div>`).join("");const y=document.getElementById("previa-novos");y.hidden=!e.novos.length,y.open=!1,y.querySelector("summary").textContent=`Ver: ${e.novos.length} ${s.novos}`,y.querySelector("ul").innerHTML=e.novos.map(a=>`<li>${p(a.nome)}</li>`).join("");const E=document.getElementById("previa-preencher");E.hidden=!e.preencher.length,E.open=!1,E.querySelector("summary").textContent=`Ver: ${e.preencher.length} campo(s) vazio(s) que serão preenchidos`,E.querySelector("ul").innerHTML=e.preencher.map(a=>{const o=f(a.novo);return`<li><strong>${p(a.nome)}</strong> · ${p(u(a.campo))}:
                ${p(o.slice(0,140))}${o.length>140?"…":""}</li>`}).join(""),document.getElementById("previa-nada").hidden=b;const q=()=>[...r.querySelectorAll('input[type="checkbox"]')],I=()=>{const a=q().filter(v=>v.checked).length,o=[];e.novos.length&&o.push(`${e.novos.length} novo(s)`),e.preencher.length&&o.push(`${e.preencher.length} preenchido(s)`),d&&o.push(`${a} de ${d} substituição(ões)`),document.getElementById("previa-contagem").textContent=o.join(" · "),l.disabled=e.novos.length+e.preencher.length+a===0,b?a?l.textContent=`Importar e substituir ${a}`:l.textContent="Importar sem substituir nada":l.textContent="Nada a importar"},j=a=>{q().forEach(o=>{o.checked=a(o)}),I()},k=new AbortController,h=(a,o,v)=>document.getElementById(a).addEventListener(o,v,{signal:k.signal}),B=a=>{t.classList.remove("aberto"),k.abort(),c(a)};r.addEventListener("change",I,{signal:k.signal}),h("btn-previa-todos","click",()=>j(()=>!0)),h("btn-previa-nenhum","click",()=>j(()=>!1)),h("btn-previa-manter-meus","click",()=>j(a=>!("manual"in a.dataset))),h("btn-cancelar-previa","click",()=>B(null)),h("btn-fechar-previa","click",()=>B(null)),h("btn-aplicar-previa","click",()=>{const a=new Set;q().forEach(o=>{if(o.checked)return;const v=e.substituir[Number(o.dataset.indice)];a.add(`${v.id}:${v.campo}`)}),B(a)}),I(),t.classList.add("aberto"),t.querySelector(".modal-corpo").scrollTop=0})}export{D as a,N as e,z as l,M as p,H as r,L as v};
