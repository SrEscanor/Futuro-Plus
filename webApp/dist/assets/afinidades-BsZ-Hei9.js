import{a as f,f as I,d as $,c as A}from"./firebase-config-BVis2Pi9.js";/* empty css              */import"./dashboard-D2hP6CDR.js";/* empty css             *//* empty css                               */import{s as P,c as S,r as w,b as M}from"./resultado-teste-CuWDcDvT.js";import{d as u}from"./descricoes-inteligencias-BL6ywoXi.js";import{h as L}from"./recomendacao-cursos-5UazaiUW.js";import{c as T}from"./categorias-teste-82RqXHiT.js";import{c as R}from"./compartilhar-resultado-D4GwBtR8.js";import"./preload-helper-PPVm8Dsz.js";import"./conteudo-legal-padrao-DcxCgRAC.js";import"./card-unidade-C3eEs3Rs.js";import"./geocodificacao-Dyu2Eb0t.js";const m=[{titulo:"Coisas que eu mais gosto de fazer",linhas:[{letra:"A",texto:"Praticar esportes e atividades físicas",categoria:"corporal"},{letra:"B",texto:"Desenhar, montar quebra-cabeças visuais ou observar mapas",categoria:"espacial"},{letra:"C",texto:"Interagir e conversar com pessoas novas",categoria:"interpessoal"},{letra:"D",texto:"Refletir sobre meus próprios sentimentos e pensamentos",categoria:"intrapessoal"},{letra:"E",texto:"Participar de discussões e debates de ideias",categoria:"linguistica"},{letra:"F",texto:"Jogos de raciocínio lógico e estratégia",categoria:"logica"},{letra:"G",texto:"Cantar e ouvir diferentes gêneros musicais",categoria:"musical"},{letra:"H",texto:"Aproveitar a natureza ao ar livre",categoria:"naturalista"}]},{titulo:"Tenho facilidade em...",linhas:[{letra:"A",texto:"Aprender novas atividades físicas",categoria:"corporal"},{letra:"B",texto:"Ler mapas e me localizar nos espaços",categoria:"espacial"},{letra:"C",texto:"Trabalhar em equipe",categoria:"interpessoal"},{letra:"D",texto:"Controlar minhas emoções",categoria:"intrapessoal"},{letra:"E",texto:"Aprender novos idiomas",categoria:"linguistica"},{letra:"F",texto:"Fazer cálculos e resolver problemas técnicos",categoria:"logica"},{letra:"G",texto:"Aprender a tocar instrumentos",categoria:"musical"},{letra:"H",texto:"Interagir com animais",categoria:"naturalista"}]},{titulo:"Eu me considero alguém...",linhas:[{letra:"A",texto:"Ágil e habilidoso fisicamente",categoria:"corporal"},{letra:"B",texto:"Observador de detalhes visuais e do espaço ao redor",categoria:"espacial"},{letra:"C",texto:"Sociável, que faz amizade com facilidade",categoria:"interpessoal"},{letra:"D",texto:"Introspectivo e em contato com os próprios sentimentos",categoria:"intrapessoal"},{letra:"E",texto:"Bom de conversa e argumentação",categoria:"linguistica"},{letra:"F",texto:"Racional e analítico na hora de decidir",categoria:"logica"},{letra:"G",texto:"Sensível a ritmos, sons e melodias",categoria:"musical"},{letra:"H",texto:"Conectado com a natureza e os animais",categoria:"naturalista"}]},{titulo:"Me sinto melhor aprendendo através de",linhas:[{letra:"A",texto:"Atividades práticas, colocando a mão na massa",categoria:"corporal"},{letra:"B",texto:"Mapas, diagramas e organização visual da informação",categoria:"espacial"},{letra:"C",texto:"Estudos em grupo",categoria:"interpessoal"},{letra:"D",texto:"Estudos individuais, no meu próprio ritmo",categoria:"intrapessoal"},{letra:"E",texto:"Palestras, leituras e estudos de caso",categoria:"linguistica"},{letra:"F",texto:"Exercícios com dados, números e análise",categoria:"logica"},{letra:"G",texto:"Músicas ou ritmos que me ajudam a memorizar",categoria:"musical"},{letra:"H",texto:"Observação da natureza e de padrões ao meu redor",categoria:"naturalista"}]}],k=document.getElementById("afinidades-container"),D=document.getElementById("afinidades-resultado"),H=document.getElementById("afinidades-progresso"),q=document.getElementById("afinidades-progresso-fill"),O=document.getElementById("afinidades-titulo-bloco"),b=document.getElementById("afinidades-linhas"),C=document.getElementById("afinidades-voltar"),B=document.getElementById("afinidades-avancar");let n=0;const v=m.map(()=>({}));function h(){const e=m[n];H.textContent=`Bloco ${n+1} de ${m.length}`,q.style.width=`${(n+1)/m.length*100}%`,O.textContent=e.titulo,b.innerHTML="";const r=e.linhas.length,a=[];e.linhas.forEach(o=>{const s=document.createElement("div");s.className="linha-afinidade";const p=document.createElement("div");p.className="linha-afinidade-letra",p.textContent=o.letra;const d=document.createElement("div");d.className="linha-afinidade-texto",d.textContent=o.texto;const t=document.createElement("select");t.className="linha-afinidade-nota",t.setAttribute("aria-label",`Posição de 1 a ${r} para: ${o.texto}`);const l=document.createElement("option");l.value="",l.textContent="–",l.disabled=!0,t.appendChild(l);for(let i=1;i<=r;i++){const g=document.createElement("option");g.value=String(i),g.textContent=String(i),t.appendChild(g)}const c=v[n][o.letra];t.value=c!==void 0?String(c):"",t.addEventListener("change",()=>{v[n][o.letra]=Number(t.value),E(a)}),s.appendChild(p),s.appendChild(d),s.appendChild(t),b.appendChild(s),a.push(t)}),E(a),C.style.visibility=n===0?"hidden":"visible",B.textContent=n===m.length-1?"Enviar teste":"Próximo"}function E(e){const r=e.map(a=>a.value).filter(a=>a!=="");e.forEach(a=>{Array.from(a.options).forEach(o=>{o.value!==""&&(o.disabled=r.includes(o.value)&&o.value!==a.value)})})}function F(){return m[n].linhas.every(r=>v[n][r.letra]!==void 0)}B.addEventListener("click",()=>{if(!F()){alert("Avalie todas as características antes de continuar.");return}n<m.length-1?(n++,h()):N()});C.addEventListener("click",()=>{n>0&&(n--,h())});function N(){const e={},r={};m.forEach((t,l)=>{const c=t.linhas.length;t.linhas.forEach(i=>{const g=v[l][i.letra]||0;e[i.categoria]=(e[i.categoria]||0)+g,r[i.categoria]=(r[i.categoria]||0)+c})});const a={};Object.keys(e).forEach(t=>{a[t]=e[t]/r[t]*100});const o=Object.keys(a).sort((t,l)=>a[l]!==a[t]?a[l]-a[t]:e[l]-e[t]),s=o[0],p=o.length>1?o[1]:null,d={categoriaPrincipal:s,categoriaSecundaria:p,porcentagens:a,ranking:o,concluidoEm:new Date().toISOString()};z(d,{aoVivo:!0})}async function z(e,{aoVivo:r=!0}={}){const{categoriaPrincipal:a,categoriaSecundaria:o,porcentagens:s,ranking:p}=e;k.style.display="none",D.style.display="block";const d=f.currentUser;d?r?P(d.uid,"afinidades",e).then(()=>y()).catch(i=>console.error("Erro ao salvar resultado no perfil:",i)):y():r&&S("afinidades",e);let t=`
        <div style="margin-bottom: 25px;">
            <h3>${u[a].title}</h3>
            <div style="font-size: 20px; font-weight: bold; margin: 15px 0;">
                ${Math.round(s[a])}% de afinidade
            </div>
            ${u[a].desc}
        </div>
        <div id="recomendacoes-teste"></div>
    `;f.currentUser?(o&&s[o]>0&&(t+=`
                <hr style="border:0; border-top:1px solid #ddd; margin:25px 0;">
                <div style="margin-bottom: 25px;">
                    <h3>Perfil complementar: ${u[o].title}</h3>
                    <div style="font-size: 18px; font-weight: bold; margin: 10px 0;">
                        ${Math.round(s[o])}% de afinidade
                    </div>
                    ${u[o].desc}
                </div>
            `),t+=`
            <hr style="border:0; border-top:1px solid #ddd; margin:25px 0;">
            <h3>📊 Seu perfil completo</h3>
            <div style="margin-top: 15px;">
        `,p.forEach((i,g)=>{const x=Math.round(s[i]);t+=`
                <div style="margin-bottom: 15px;">
                    <div style="display:flex; justify-content:space-between; margin-bottom:5px; font-weight:bold;">
                        <span>${g+1}º - ${u[i].title}</span>
                        <span>${x}%</span>
                    </div>
                    <div style="width:100%; height:10px; background:#e5e5e5; border-radius:10px; overflow:hidden;">
                        <div style="width:${x}%; height:100%; background:currentColor; border-radius:10px;"></div>
                    </div>
                </div>
            `}),t+=`
            </div>
            <p style="margin-top:25px; font-size:14px; opacity:0.75;">
                💡 O resultado representa um perfil de afinidade com base nas notas dadas.
                Ele não determina sozinho uma profissão ou curso ideal.
            </p>
        `):t+=`
            <hr style="border:0; border-top:1px solid #ddd; margin:25px 0;">
            <p style="font-size: 14.5px; line-height: 1.6;">
                🔒 <strong>Crie sua conta ou faça login</strong> para ver seu
                perfil complementar e o ranking completo das suas 8 inteligências.
            </p>
        `,document.getElementById("afinidades-resultado-titulo").textContent=u[a].title,document.getElementById("afinidades-resultado-desc").innerHTML=t;const l=await L(document.getElementById("recomendacoes-teste"),e,{uid:d?.uid}),c=document.getElementById("compartilhar-resultado-slot");c&&(c.innerHTML="",c.appendChild(R({etiquetaTopo:"Resultado do teste de afinidades",titulo:u[a].title,numero:`${Math.round(s[a])}%`,numeroLabel:"de afinidade",frase:u[a].frase,cursos:(l||[]).slice(0,3).map(i=>({nome:i.nome,rotulo:`${Math.round(s[i.motivo]||0)}% · ${T[i.motivo]||""}`}))},{nomeArquivoBase:"futuroplus-teste-afinidades"})))}function y(){const e=document.getElementById("result-cta");e&&(e.innerHTML=`
        <p style="font-size: 14.5px; line-height: 1.5;">
            <strong>✅ Resultado salvo no seu perfil!</strong>
        </p>
    `)}async function U(){if(!new URLSearchParams(location.search).get("ver")||(await f.authStateReady(),!f.currentUser))return!1;try{const e=await I($(A,"usuarios",f.currentUser.uid)),r=w(e.exists()?e.data():null).afinidades;return M(r)?(await z(r,{aoVivo:!1}),!0):!1}catch(e){return console.error("Erro ao carregar o resultado salvo do teste de afinidades:",e),!1}}U().then(e=>{e||h()});
