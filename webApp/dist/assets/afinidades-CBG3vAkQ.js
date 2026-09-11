import{a as C}from"./firebase-config-By66qnxQ.js";import"./dashboard-BV67wVgX.js";import{d as g}from"./descricoes-inteligencias-CT3yvkxJ.js";import{s as B,a as z}from"./resultado-teste-DQ9iF9NZ.js";const m=[{titulo:"Coisas que eu mais gosto de fazer",linhas:[{letra:"A",texto:"Praticar esportes e atividades físicas",categoria:"corporal"},{letra:"B",texto:"Desenhar, montar quebra-cabeças visuais ou observar mapas",categoria:"espacial"},{letra:"C",texto:"Interagir e conversar com pessoas novas",categoria:"interpessoal"},{letra:"D",texto:"Refletir sobre meus próprios sentimentos e pensamentos",categoria:"intrapessoal"},{letra:"E",texto:"Participar de discussões e debates de ideias",categoria:"linguistica"},{letra:"F",texto:"Jogos de raciocínio lógico e estratégia",categoria:"logica"},{letra:"G",texto:"Cantar e ouvir diferentes gêneros musicais",categoria:"musical"},{letra:"H",texto:"Aproveitar a natureza ao ar livre",categoria:"naturalista"}]},{titulo:"Tenho facilidade em...",linhas:[{letra:"A",texto:"Aprender novas atividades físicas",categoria:"corporal"},{letra:"B",texto:"Ler mapas e me localizar nos espaços",categoria:"espacial"},{letra:"C",texto:"Trabalhar em equipe",categoria:"interpessoal"},{letra:"D",texto:"Controlar minhas emoções",categoria:"intrapessoal"},{letra:"E",texto:"Aprender novos idiomas",categoria:"linguistica"},{letra:"F",texto:"Fazer cálculos e resolver problemas técnicos",categoria:"logica"},{letra:"G",texto:"Aprender a tocar instrumentos",categoria:"musical"},{letra:"H",texto:"Interagir com animais",categoria:"naturalista"}]},{titulo:"Eu me considero alguém...",linhas:[{letra:"A",texto:"Ágil e habilidoso fisicamente",categoria:"corporal"},{letra:"B",texto:"Observador de detalhes visuais e do espaço ao redor",categoria:"espacial"},{letra:"C",texto:"Sociável, que faz amizade com facilidade",categoria:"interpessoal"},{letra:"D",texto:"Introspectivo e em contato com os próprios sentimentos",categoria:"intrapessoal"},{letra:"E",texto:"Bom de conversa e argumentação",categoria:"linguistica"},{letra:"F",texto:"Racional e analítico na hora de decidir",categoria:"logica"},{letra:"G",texto:"Sensível a ritmos, sons e melodias",categoria:"musical"},{letra:"H",texto:"Conectado com a natureza e os animais",categoria:"naturalista"}]},{titulo:"Me sinto melhor aprendendo através de",linhas:[{letra:"A",texto:"Atividades práticas, colocando a mão na massa",categoria:"corporal"},{letra:"B",texto:"Mapas, diagramas e organização visual da informação",categoria:"espacial"},{letra:"C",texto:"Estudos em grupo",categoria:"interpessoal"},{letra:"D",texto:"Estudos individuais, no meu próprio ritmo",categoria:"intrapessoal"},{letra:"E",texto:"Palestras, leituras e estudos de caso",categoria:"linguistica"},{letra:"F",texto:"Exercícios com dados, números e análise",categoria:"logica"},{letra:"G",texto:"Músicas ou ritmos que me ajudam a memorizar",categoria:"musical"},{letra:"H",texto:"Observação da natureza e de padrões ao meu redor",categoria:"naturalista"}]}],I=document.getElementById("afinidades-container"),A=document.getElementById("afinidades-resultado"),$=document.getElementById("afinidades-progresso"),M=document.getElementById("afinidades-progresso-fill"),w=document.getElementById("afinidades-titulo-bloco"),x=document.getElementById("afinidades-linhas"),E=document.getElementById("afinidades-voltar"),b=document.getElementById("afinidades-avancar");let n=0;const f=m.map(()=>({}));function v(){const t=m[n];$.textContent=`Bloco ${n+1} de ${m.length}`,M.style.width=`${(n+1)/m.length*100}%`,w.textContent=t.titulo,x.innerHTML="";const i=t.linhas.length,e=[];t.linhas.forEach(a=>{const r=document.createElement("div");r.className="linha-afinidade";const l=document.createElement("div");l.className="linha-afinidade-letra",l.textContent=a.letra;const c=document.createElement("div");c.className="linha-afinidade-texto",c.textContent=a.texto;const s=document.createElement("select");s.className="linha-afinidade-nota",s.setAttribute("aria-label",`Posição de 1 a ${i} para: ${a.texto}`);const o=document.createElement("option");o.value="",o.textContent="–",o.disabled=!0,s.appendChild(o);for(let p=1;p<=i;p++){const d=document.createElement("option");d.value=String(p),d.textContent=String(p),s.appendChild(d)}const u=f[n][a.letra];s.value=u!==void 0?String(u):"",s.addEventListener("change",()=>{f[n][a.letra]=Number(s.value),h(e)}),r.appendChild(l),r.appendChild(c),r.appendChild(s),x.appendChild(r),e.push(s)}),h(e),E.style.visibility=n===0?"hidden":"visible",b.textContent=n===m.length-1?"Enviar teste":"Próximo"}function h(t){const i=t.map(e=>e.value).filter(e=>e!=="");t.forEach(e=>{Array.from(e.options).forEach(a=>{a.value!==""&&(a.disabled=i.includes(a.value)&&a.value!==e.value)})})}function L(){return m[n].linhas.every(i=>f[n][i.letra]!==void 0)}b.addEventListener("click",()=>{if(!L()){alert("Avalie todas as características antes de continuar.");return}n<m.length-1?(n++,v()):P()});E.addEventListener("click",()=>{n>0&&(n--,v())});function P(){const t={},i={};m.forEach((o,u)=>{const p=o.linhas.length;o.linhas.forEach(d=>{const y=f[u][d.letra]||0;t[d.categoria]=(t[d.categoria]||0)+y,i[d.categoria]=(i[d.categoria]||0)+p})});const e={};Object.keys(t).forEach(o=>{e[o]=t[o]/i[o]*100});const a=Object.keys(e).sort((o,u)=>e[u]!==e[o]?e[u]-e[o]:t[u]-t[o]),r=a[0],l=a.length>1?a[1]:null;R({categoriaPrincipal:r,categoriaSecundaria:l,porcentagens:e,ranking:a});const c={categoriaPrincipal:r,categoriaSecundaria:l,porcentagens:e,ranking:a,concluidoEm:new Date().toISOString()},s=C.currentUser;s?B(s.uid,"afinidades",c).then(()=>k()).catch(o=>console.error("Erro ao salvar resultado no perfil:",o)):z("afinidades",c)}function R({categoriaPrincipal:t,categoriaSecundaria:i,porcentagens:e,ranking:a}){I.style.display="none",A.style.display="block";let r=`
        <div style="margin-bottom: 25px;">
            <h3>${g[t].title}</h3>
            <div style="font-size: 20px; font-weight: bold; margin: 15px 0;">
                ${Math.round(e[t])}% de afinidade
            </div>
            ${g[t].desc}
        </div>
    `;i&&e[i]>0&&(r+=`
            <hr style="border:0; border-top:1px solid #ddd; margin:25px 0;">
            <div style="margin-bottom: 25px;">
                <h3>Perfil complementar: ${g[i].title}</h3>
                <div style="font-size: 18px; font-weight: bold; margin: 10px 0;">
                    ${Math.round(e[i])}% de afinidade
                </div>
                ${g[i].desc}
            </div>
        `),r+=`
        <hr style="border:0; border-top:1px solid #ddd; margin:25px 0;">
        <h3>📊 Seu perfil completo</h3>
        <div style="margin-top: 15px;">
    `,a.forEach((l,c)=>{const s=Math.round(e[l]);r+=`
            <div style="margin-bottom: 15px;">
                <div style="display:flex; justify-content:space-between; margin-bottom:5px; font-weight:bold;">
                    <span>${c+1}º - ${g[l].title}</span>
                    <span>${s}%</span>
                </div>
                <div style="width:100%; height:10px; background:#e5e5e5; border-radius:10px; overflow:hidden;">
                    <div style="width:${s}%; height:100%; background:currentColor; border-radius:10px;"></div>
                </div>
            </div>
        `}),r+=`
        </div>
        <p style="margin-top:25px; font-size:14px; opacity:0.75;">
            💡 O resultado representa um perfil de afinidade com base nas notas dadas.
            Ele não determina sozinho uma profissão ou curso ideal.
        </p>
    `,document.getElementById("afinidades-resultado-titulo").textContent=g[t].title,document.getElementById("afinidades-resultado-desc").innerHTML=r}function k(){const t=document.getElementById("result-cta");t&&(t.innerHTML=`
        <p style="font-size: 14.5px; line-height: 1.5;">
            <strong>✅ Resultado salvo no seu perfil!</strong>
        </p>
    `)}v();
