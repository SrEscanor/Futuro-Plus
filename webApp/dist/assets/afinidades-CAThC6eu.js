import{a as E}from"./firebase-config-CT8rAHhi.js";import"./dashboard-Dc-FvVVT.js";import{d as u}from"./descricoes-inteligencias-CT3yvkxJ.js";import{s as y,a as C}from"./resultado-teste-yFQAEX9g.js";const m=[{titulo:"Coisas que eu mais gosto de fazer",linhas:[{letra:"A",texto:"Praticar esportes e atividades físicas",categoria:"corporal"},{letra:"B",texto:"Desenhar, montar quebra-cabeças visuais ou observar mapas",categoria:"espacial"},{letra:"C",texto:"Interagir e conversar com pessoas novas",categoria:"interpessoal"},{letra:"D",texto:"Refletir sobre meus próprios sentimentos e pensamentos",categoria:"intrapessoal"},{letra:"E",texto:"Participar de discussões e debates de ideias",categoria:"linguistica"},{letra:"F",texto:"Jogos de raciocínio lógico e estratégia",categoria:"logica"},{letra:"G",texto:"Cantar e ouvir diferentes gêneros musicais",categoria:"musical"},{letra:"H",texto:"Aproveitar a natureza ao ar livre",categoria:"naturalista"}]},{titulo:"Tenho facilidade em...",linhas:[{letra:"A",texto:"Aprender novas atividades físicas",categoria:"corporal"},{letra:"B",texto:"Ler mapas e me localizar nos espaços",categoria:"espacial"},{letra:"C",texto:"Trabalhar em equipe",categoria:"interpessoal"},{letra:"D",texto:"Controlar minhas emoções",categoria:"intrapessoal"},{letra:"E",texto:"Aprender novos idiomas",categoria:"linguistica"},{letra:"F",texto:"Fazer cálculos e resolver problemas técnicos",categoria:"logica"},{letra:"G",texto:"Aprender a tocar instrumentos",categoria:"musical"},{letra:"H",texto:"Interagir com animais",categoria:"naturalista"}]},{titulo:"Eu me considero alguém...",linhas:[{letra:"A",texto:"Ágil e habilidoso fisicamente",categoria:"corporal"},{letra:"B",texto:"Observador de detalhes visuais e do espaço ao redor",categoria:"espacial"},{letra:"C",texto:"Sociável, que faz amizade com facilidade",categoria:"interpessoal"},{letra:"D",texto:"Introspectivo e em contato com os próprios sentimentos",categoria:"intrapessoal"},{letra:"E",texto:"Bom de conversa e argumentação",categoria:"linguistica"},{letra:"F",texto:"Racional e analítico na hora de decidir",categoria:"logica"},{letra:"G",texto:"Sensível a ritmos, sons e melodias",categoria:"musical"},{letra:"H",texto:"Conectado com a natureza e os animais",categoria:"naturalista"}]},{titulo:"Me sinto melhor aprendendo através de",linhas:[{letra:"A",texto:"Atividades práticas, colocando a mão na massa",categoria:"corporal"},{letra:"B",texto:"Mapas, diagramas e organização visual da informação",categoria:"espacial"},{letra:"C",texto:"Estudos em grupo",categoria:"interpessoal"},{letra:"D",texto:"Estudos individuais, no meu próprio ritmo",categoria:"intrapessoal"},{letra:"E",texto:"Palestras, leituras e estudos de caso",categoria:"linguistica"},{letra:"F",texto:"Exercícios com dados, números e análise",categoria:"logica"},{letra:"G",texto:"Músicas ou ritmos que me ajudam a memorizar",categoria:"musical"},{letra:"H",texto:"Observação da natureza e de padrões ao meu redor",categoria:"naturalista"}]}],B=document.getElementById("afinidades-container"),z=document.getElementById("afinidades-resultado"),I=document.getElementById("afinidades-progresso"),A=document.getElementById("afinidades-progresso-fill"),$=document.getElementById("afinidades-titulo-bloco"),x=document.getElementById("afinidades-linhas"),v=document.getElementById("afinidades-voltar"),h=document.getElementById("afinidades-avancar");let r=0;const g=m.map(()=>({}));function f(){const t=m[r];I.textContent=`Bloco ${r+1} de ${m.length}`,A.style.width=`${(r+1)/m.length*100}%`,$.textContent=t.titulo,x.innerHTML="",t.linhas.forEach(a=>{const e=document.createElement("div");e.className="linha-afinidade";const n=document.createElement("div");n.className="linha-afinidade-letra",n.textContent=a.letra;const s=document.createElement("div");s.className="linha-afinidade-texto",s.textContent=a.texto;const i=document.createElement("select");i.className="linha-afinidade-nota",i.setAttribute("aria-label",`Nota de 0 a 10 para: ${a.texto}`);const l=document.createElement("option");l.value="",l.textContent="–",l.disabled=!0,i.appendChild(l);for(let o=0;o<=10;o++){const d=document.createElement("option");d.value=String(o),d.textContent=String(o),i.appendChild(d)}const c=g[r][a.letra];i.value=c!==void 0?String(c):"",i.addEventListener("change",()=>{g[r][a.letra]=Number(i.value)}),e.appendChild(n),e.appendChild(s),e.appendChild(i),x.appendChild(e)}),v.style.visibility=r===0?"hidden":"visible",h.textContent=r===m.length-1?"Enviar teste":"Próximo"}function w(){return m[r].linhas.every(a=>g[r][a.letra]!==void 0)}h.addEventListener("click",()=>{if(!w()){alert("Avalie todas as características antes de continuar.");return}r<m.length-1?(r++,f()):M()});v.addEventListener("click",()=>{r>0&&(r--,f())});function M(){const t={},a={};m.forEach((o,d)=>{o.linhas.forEach(p=>{const b=g[d][p.letra]||0;t[p.categoria]=(t[p.categoria]||0)+b,a[p.categoria]=(a[p.categoria]||0)+10})});const e={};Object.keys(t).forEach(o=>{e[o]=t[o]/a[o]*100});const n=Object.keys(e).sort((o,d)=>e[d]!==e[o]?e[d]-e[o]:t[d]-t[o]),s=n[0],i=n.length>1?n[1]:null;R({categoriaPrincipal:s,categoriaSecundaria:i,porcentagens:e,ranking:n});const l={categoriaPrincipal:s,categoriaSecundaria:i,porcentagens:e,ranking:n,concluidoEm:new Date().toISOString()},c=E.currentUser;c?y(c.uid,"afinidades",l).then(()=>k()).catch(o=>console.error("Erro ao salvar resultado no perfil:",o)):C("afinidades",l)}function R({categoriaPrincipal:t,categoriaSecundaria:a,porcentagens:e,ranking:n}){B.style.display="none",z.style.display="block";let s=`
        <div style="margin-bottom: 25px;">
            <h3>${u[t].title}</h3>
            <div style="font-size: 20px; font-weight: bold; margin: 15px 0;">
                ${Math.round(e[t])}% de afinidade
            </div>
            ${u[t].desc}
        </div>
    `;a&&e[a]>0&&(s+=`
            <hr style="border:0; border-top:1px solid #ddd; margin:25px 0;">
            <div style="margin-bottom: 25px;">
                <h3>Perfil complementar: ${u[a].title}</h3>
                <div style="font-size: 18px; font-weight: bold; margin: 10px 0;">
                    ${Math.round(e[a])}% de afinidade
                </div>
                ${u[a].desc}
            </div>
        `),s+=`
        <hr style="border:0; border-top:1px solid #ddd; margin:25px 0;">
        <h3>📊 Seu perfil completo</h3>
        <div style="margin-top: 15px;">
    `,n.forEach((i,l)=>{const c=Math.round(e[i]);s+=`
            <div style="margin-bottom: 15px;">
                <div style="display:flex; justify-content:space-between; margin-bottom:5px; font-weight:bold;">
                    <span>${l+1}º - ${u[i].title}</span>
                    <span>${c}%</span>
                </div>
                <div style="width:100%; height:10px; background:#e5e5e5; border-radius:10px; overflow:hidden;">
                    <div style="width:${c}%; height:100%; background:currentColor; border-radius:10px;"></div>
                </div>
            </div>
        `}),s+=`
        </div>
        <p style="margin-top:25px; font-size:14px; opacity:0.75;">
            💡 O resultado representa um perfil de afinidade com base nas notas dadas.
            Ele não determina sozinho uma profissão ou curso ideal.
        </p>
    `,document.getElementById("afinidades-resultado-titulo").textContent=u[t].title,document.getElementById("afinidades-resultado-desc").innerHTML=s}function k(){const t=document.getElementById("result-cta");t&&(t.innerHTML=`
        <p style="font-size: 14.5px; line-height: 1.5;">
            <strong>✅ Resultado salvo no seu perfil!</strong>
        </p>
    `)}f();
