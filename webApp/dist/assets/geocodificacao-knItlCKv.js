const h="/etec-logo-padrao.png",v="/logo.png";function i(a){return String(a??"").replace(/[&<>"']/g,t=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[t])}function u(a){return(a||"").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/[^a-z0-9]+/g," ").trim()}function $(a){const t=new Map;return(a||[]).forEach(o=>{if(!o||!o.nome)return;const r=o.categoria||"Outros cursos";t.has(r)||t.set(r,[]),t.get(r).push(o.nome)}),t}function O(a,{destaque:t="",termoCurso:o=""}={}){const r=a.logotipoUrl?i(a.logotipoUrl):h,n=[a.municipio,a.regiao].filter(Boolean).join(" · "),e=[...$(a.cursos).entries()].map(([l,f])=>`
        <div class="grupo-categoria">
            <div class="categoria-label">${i(l)}</div>
            <div class="tags-cursos">
                ${f.map(p=>`<span class="tag-curso${o&&u(p).includes(o)?" tag-curso--destaque":""}">${i(p)}</span>`).join("")}
            </div>
        </div>
    `).join("");return`
    <article class="card-unidade">
        <div class="card-unidade-topo">
            <img class="logo-unidade" src="${r}" alt="" onerror="this.onerror=null;this.src='${v}';">
            <div>
                <h3 class="nome-unidade">${i(a.nome)}</h3>
                <div class="local-unidade">${i(n)}</div>
                ${t?`<div class="selo-proximidade">${i(t)}</div>`:""}
            </div>
        </div>
        <div class="card-unidade-cursos">
            ${e||'<p class="sem-cursos">Nenhum curso cadastrado ainda.</p>'}
        </div>
    </article>`}const P="https://nominatim.openstreetmap.org/search",b="contato.futuromais@gmail.com",y=1100,C=a=>new Promise(t=>setTimeout(t,a));let g=Promise.resolve();function d(a){const t=g.then(async()=>{const o=`${P}?${new URLSearchParams({format:"jsonv2",limit:"3",addressdetails:"1",countrycodes:"br",email:b,...a})}`;try{const r=await fetch(o);return r.ok?await r.json():[]}catch{return[]}});return g=t.then(()=>C(y)),t}const S=[[/^av\.?\s/i,"Avenida "],[/^r\.\s/i,"Rua "],[/^al\.?\s/i,"Alameda "],[/^est\.?\s/i,"Estrada "],[/^rod\.?\s/i,"Rodovia "],[/^p[çc]a\.?\s/i,"Praça "],[/^tv\.?\s/i,"Travessa "],[/\bcel\.\s/gi,"Coronel "],[/\bdr\.\s/gi,"Doutor "],[/\bprofa\.\s/gi,"Professora "],[/\bprof\.\s/gi,"Professor "],[/\bpref\.\s/gi,"Prefeito "],[/\bdep\.\s/gi,"Deputado "],[/\beng\.\s/gi,"Engenheiro "],[/\bpe\.\s/gi,"Padre "],[/\bsen\.\s/gi,"Senador "],[/\bgov\.\s/gi,"Governador "],[/\bdes\.\s/gi,"Desembargador "],[/\bsta\.\s/gi,"Santa "],[/\bsto\.\s/gi,"Santo "]];function A(a){const o=(a||"").split(/\s[-–]\s/)[0].split(",").map(s=>s.trim());let r=o[0]||"";S.forEach(([s,e])=>{r=r.replace(s,e)});const n=(o[1]||"").match(/^\d+/)?.[0]||"";return{rua:r.trim(),numero:n}}function m(a){const t=a.address||{};return t.city||t.town||t.village||t.municipality||""}const c=(a,t)=>Number(Number(a).toFixed(t));async function w(a){const t=a.municipio||"",o=e=>u(m(e))===u(t),{rua:r,numero:n}=A(a.endereco),s=[{precisao:"escola",parametros:{q:`${a.nome}, ${t}, SP`},aceitar:e=>o(e)&&["school","college","university"].includes(e.type)},r&&n&&{precisao:"numero",parametros:{street:`${n} ${r}`,city:t,state:"São Paulo"},aceitar:o},r&&{precisao:"rua",parametros:{street:r,city:t,state:"São Paulo"},aceitar:o},{precisao:"cidade",parametros:{city:t,state:"São Paulo"},aceitar:o}].filter(Boolean);for(const e of s){const l=(await d(e.parametros)).find(e.aceitar);if(l)return{lat:c(l.lat,5),lng:c(l.lon,5),precisao:e.precisao,endereco:a.endereco||""}}return null}async function D({rua:a,cidade:t,uf:o="SP"}){if(!t)return null;const r=s=>u(m(s))===u(t);if(a){const s=(await d({street:a,city:t,state:o})).find(r);if(s)return{lat:c(s.lat,3),lng:c(s.lon,3),precisao:"rua"}}const n=(await d({city:t,state:o})).find(r);return n?{lat:c(n.lat,3),lng:c(n.lon,3),precisao:"cidade"}:null}function L(a,t){if(!a||!t||a.lat==null||t.lat==null)return null;const o=e=>e*Math.PI/180,r=o(t.lat-a.lat),n=o(t.lng-a.lng),s=Math.sin(r/2)**2+Math.cos(o(a.lat))*Math.cos(o(t.lat))*Math.sin(n/2)**2;return 2*6371*Math.asin(Math.sqrt(s))}function R(a){return a==null?"":a<1?"a menos de 1 km":`a ${a.toLocaleString("pt-BR",{maximumFractionDigits:a<10?1:0})} km`}export{D as a,L as d,i as e,R as f,w as l,u as n,O as r};
