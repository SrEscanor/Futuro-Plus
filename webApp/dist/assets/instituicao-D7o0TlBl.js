import"./firebase-config-jDGsFXrl.js";/* empty css              */import"./dashboard-BC8pOYHG.js";import{f as K,s as X,F as O,l as E,t as N,a as W,b as Y,p as Z,c as aa,d as ta,e as sa,q as oa,C as ea,g as na,h as ia,i as ra,j as C,k as w,r as F,L as x,m as ca,n as H,o as da,u as la,v as ua,w as pa,x as U,y as V,z as ma,A as P,B as fa,D as ha,E as va,G as ga,H as $a,I as ba,J as xa}from"./instituicao-dados-Btg21O1S.js";import{L as Ca,e as r,b as ya,a as Ma,d as Ea}from"./card-unidade-I-oVmKo3.js";import"./preload-helper-PPVm8Dsz.js";import"./conteudo-legal-padrao-BqhUlQtQ.js";import"./resultado-teste-DDM5ddzJ.js";import"./notificacoes-util-BE-pPj56.js";import"./vlibras-_gXUT26Z.js";const p=(a,t=20)=>`<svg width="${t}" height="${t}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${a}</svg>`,d={local:p('<path d="M12 21s-7-6.2-7-12a7 7 0 0 1 14 0c0 5.8-7 12-7 12z"/><circle cx="12" cy="9" r="2.6"/>',16),capelo:p('<path d="M2 9.5 12 5l10 4.5-10 4.5L2 9.5z"/><path d="M6 11.6V16c0 1.4 2.7 3 6 3s6-1.6 6-3v-4.4"/><path d="M22 9.5v5"/>'),telefone:p('<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/>'),estrela:p('<path d="m12 2.8 2.8 5.8 6.4.9-4.6 4.5 1.1 6.3L12 17.3l-5.7 3 1.1-6.3-4.6-4.5 6.4-.9L12 2.8z"/>'),mapa:p('<path d="M12 21s-7-6.2-7-12a7 7 0 0 1 14 0c0 5.8-7 12-7 12z"/><circle cx="12" cy="9" r="2.6"/>'),livro:p('<path d="M2 5.5A2.5 2.5 0 0 1 4.5 3H11v17H4.5A2.5 2.5 0 0 0 2 22.5z"/><path d="M22 5.5A2.5 2.5 0 0 0 19.5 3H13v17h6.5a2.5 2.5 0 0 1 2.5 2.5z"/>'),balao:p('<path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 9 9 0 0 1-3.9-.9L3 20.5l1.5-4.6A8.4 8.4 0 1 1 21 11.5z"/>'),duvida:p('<circle cx="12" cy="12" r="9.5"/><path d="M9.2 9a3 3 0 0 1 5.8 1c0 2-3 2.6-3 4.4"/><path d="M12 17.6h.01"/>'),cadeado:p('<rect x="4.5" y="10.5" width="15" height="10.5" rx="2.5"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/>'),verificado:p('<circle cx="12" cy="12" r="9.5"/><path d="m8 12.4 2.7 2.6L16.2 9.6"/>',14),seta:p('<path d="M5 12h14M13 6l6 6-6 6"/>',16),voltar:p('<path d="M19 12H5M11 6l-6 6 6 6"/>',16),externo:p('<path d="M7 17 17 7M9 7h8v8"/>',14),abrir:p('<path d="m6 9 6 6 6-6"/>',18),site:p('<circle cx="12" cy="12" r="9.5"/><path d="M2.5 12h19M12 2.5a14.6 14.6 0 0 1 0 19M12 2.5a14.6 14.6 0 0 0 0 19"/>',18),instagram:p('<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><path d="M17.5 6.5h.01"/>',18),facebook:p('<path d="M15 3h-2.5A4.5 4.5 0 0 0 8 7.5V10H5.5v4H8v7h4v-7h2.6l.9-4H12V7.8c0-.6.4-.8 1-.8h2z"/>',18),predio:p('<path d="M3 21h18M5 21V10l7-5 7 5v11"/><path d="M9.5 21v-5h5v5M9 11.5h.01M15 11.5h.01"/>',16),pessoas:p('<circle cx="9" cy="8" r="3.2"/><path d="M3 20a6 6 0 0 1 12 0"/><path d="M16 4.9a3.2 3.2 0 0 1 0 6.2M18 20a6 6 0 0 0-3-5.2"/>',16),nivel:p('<path d="M2 9.5 12 5l10 4.5-10 4.5L2 9.5z"/><path d="M6 11.6V16c0 1.4 2.7 3 6 3s6-1.6 6-3v-4.4"/>',16)},qa={nivel:d.nivel,publica:d.predio,forma:d.pessoas};function _(a,t="inst-estrelas"){const o={cheia:"★",meia:"★",vazia:"★"};return`<span class="${t}" aria-hidden="true">${ra(a).map(e=>`<span class="inst-estrela inst-estrela--${e}">${o[e]}</span>`).join("")}</span>`}const B=a=>r((C(a)[0]||"?").toUpperCase());function Sa(a,t){const o=K(a),e=a.municipio?`${a.municipio}, SP`:"",i=X(a,t);return`
        <img class="inst-capa-foto${o?"":" inst-capa-foto--padrao"}" src="${r(o||O)}" alt="" fetchpriority="high"
            onerror="this.onerror=null;this.src='${O}';this.classList.add('inst-capa-foto--padrao')">
        <div class="home-hero-conteudo inst-capa-conteudo">
            <a class="inst-capa-voltar" href="instituicoes.html">${d.voltar} Todas as instituições</a>
            <div class="inst-capa-identidade">
                <div class="inst-capa-logo">
                    <img src="${ya(a)}" alt="Logo da ${r(a.nome)}"
                        onerror="this.onerror=null;this.src='${Ca}';">
                </div>
                <div class="inst-capa-texto">
                    <h1>${r(a.nome)}</h1>
                    ${e?`<p class="inst-capa-local">${d.local} ${r(e)}</p>`:""}
                    ${i.length?`<ul class="inst-capa-selos">${i.map(n=>`
                        <li>${qa[n.icone]||""}${r(n.texto)}</li>`).join("")}
                    </ul>`:""}
                </div>
            </div>
        </div>`}function Aa(a){return`
        <div class="home-hero-conteudo inst-capa-conteudo">
            <a class="inst-capa-voltar" href="instituicoes.html">${d.voltar} Todas as instituições</a>
            <h1>${r(a)}</h1>
        </div>`}function ka(a,t,o){const e=new Set(t.flatMap(f=>f.modalidades.map($=>$.chave))),i=t.length?e.size===1?t[0].modalidades[0].rotulo:`em ${e.size} modalidades`:"Ainda sem lista no cadastro",n=W(a.telefone),c=Y(a.telefone),m=E(a.site),h=o&&o.total>0,u=Z(a),l=aa(a);return`
        <article class="inst-numero">
            <span class="inst-numero-icone inst-numero-icone--azul">${d.capelo}</span>
            <div class="inst-numero-textos">
                <span class="inst-numero-rotulo">Cursos oferecidos</span>
                <a class="inst-numero-valor" href="#inst-cursos">${t.length===1?"1 curso":`${t.length} cursos`}</a>
                <span class="inst-numero-sub">${r(i)}</span>
            </div>
        </article>
        <article class="inst-numero">
            <span class="inst-numero-icone inst-numero-icone--verde">${d.telefone}</span>
            <div class="inst-numero-textos">
                <span class="inst-numero-rotulo">Contato</span>
                ${n?c?`<a class="inst-numero-valor" href="${c}">${r(n)}</a>`:`<strong class="inst-numero-valor">${r(n)}</strong>`:'<strong class="inst-numero-valor inst-numero-valor--vazio">Sem telefone</strong>'}
                ${m?`<a class="inst-numero-sub inst-numero-link" href="${r(m)}" target="_blank" rel="noopener">${r(ta(a.site))} ${d.externo}</a>`:'<span class="inst-numero-sub">Sem site no cadastro</span>'}
            </div>
        </article>
        <article class="inst-numero">
            <span class="inst-numero-icone inst-numero-icone--ouro">${d.estrela}</span>
            <div class="inst-numero-textos">
                <span class="inst-numero-rotulo">Avaliação</span>
                ${o===void 0?`
                <strong class="inst-numero-valor inst-numero-valor--vazio">...</strong>
                <span class="inst-numero-sub">Carregando as notas</span>`:h?`
                <span class="inst-numero-valor inst-numero-valor--nota">
                    <strong>${sa(o.media)}</strong><span class="inst-numero-de">/ 5</span>
                    ${_(o.media)}
                </span>
                <a class="inst-numero-sub inst-numero-link" href="#quem-estudou">${oa(o.total)}</a>`:`
                <strong class="inst-numero-valor inst-numero-valor--vazio">Sem notas ainda</strong>
                <span class="inst-numero-sub">Só quem estudou aqui avalia</span>`}
            </div>
        </article>
        <article class="inst-numero inst-numero--endereco">
            <span class="inst-numero-icone inst-numero-icone--coral">${d.mapa}</span>
            <div class="inst-numero-textos">
                <div class="inst-numero-cabeca">
                    <span class="inst-numero-rotulo">Endereço</span>
                    ${l?`<a class="inst-mapa" href="${r(l)}" target="_blank" rel="noopener">${d.local} Ver no Google Maps ${d.externo}</a>`:""}
                </div>
                <strong class="inst-numero-valor inst-numero-valor--texto">${r(u.rua||u.resto||"Sem endereço no cadastro")}</strong>
                ${u.rua&&u.resto?`<span class="inst-numero-sub">${r(u.resto)}</span>`:""}
            </div>
        </article>`}function La(a){const t=String(a?.rede||"").toLowerCase(),o=E(a?.url);if(!o)return"";const e=t==="instagram"?d.instagram:t==="facebook"?d.facebook:d.site;return`<li><a class="inst-link" href="${r(o)}" target="_blank" rel="noopener">${e}${r(a.rede)}</a></li>`}function wa(a,t){const o=E(a.site),e=E(a.paginaCps),i=[o?`<li><a class="inst-link" href="${r(o)}" target="_blank" rel="noopener">${d.site}Site da unidade</a></li>`:"",...(a.redesSociais||[]).map(La),e?`<li><a class="inst-link" href="${r(e)}" target="_blank" rel="noopener">${d.predio}Página no Centro Paula Souza</a></li>`:""].filter(Boolean);return`
        <header class="inst-cartao-topo">
            <h2><span class="inst-titulo-icone">${d.livro}</span>Sobre a instituição</h2>
        </header>
        <p class="inst-sobre-texto">${r(N(a,t))}</p>
        ${i.length?`<ul class="inst-links">${i.join("")}</ul>`:""}`}function Pa(a,{todos:t=!1}={}){if(!a.length)return`
            <header class="inst-cartao-topo"><h2><span class="inst-titulo-icone">${d.capelo}</span>Cursos oferecidos</h2></header>
            <p class="inst-vazio">O cadastro desta unidade ainda não tem a lista de cursos.</p>`;const o=t?a:a.slice(0,ea),e=a.length-o.length;return`
        <header class="inst-cartao-topo">
            <h2><span class="inst-titulo-icone">${d.capelo}</span>Cursos oferecidos</h2>
            <span class="inst-contagem">${a.length===1?"1 curso":`${a.length} cursos`}</span>
        </header>
        <p class="inst-cartao-sub">Toque em um curso para ver o que se aprende e onde dá para trabalhar.</p>
        <ul class="inst-cursos">
            ${o.map(i=>`
            <li>
                <a class="inst-curso inst-curso--${i.modalidades[0].chave}" href="curso.html?c=${encodeURIComponent(i.slug)}">
                    <span class="inst-curso-icone">${d.capelo}</span>
                    <span class="inst-curso-textos">
                        <strong>${r(i.nome)}</strong>
                        <span class="inst-curso-modalidades">${i.modalidades.map(n=>`<span>${r(n.rotulo)}</span>`).join("")}</span>
                    </span>
                    <span class="inst-curso-seta">${d.seta}</span>
                </a>
            </li>`).join("")}
        </ul>
        ${e>0?`<button type="button" class="inst-ver-mais" data-acao="todos-os-cursos">Ver todos os ${a.length} cursos</button>`:""}`}function Da(a){return a?.logado?`
        <div class="inst-acesso">
            <span class="inst-acesso-icone">${d.cadeado}</span>
            <div>
                <strong>Estudou aqui?</strong>
                <p>Pendure no Mural o certificado desta unidade. Quando a leitura do certificado encontrar o nome da escola, você comenta, avalia e responde dúvidas.</p>
                <div class="inst-botoes">
                    <a class="inst-botao" href="mural.html">Ir para o Mural</a>
                </div>
            </div>
        </div>`:`
        <div class="inst-acesso">
            <span class="inst-acesso-icone">${d.cadeado}</span>
            <div>
                <strong>Estudou aqui?</strong>
                <p>Entre na sua conta e pendure no Mural o certificado desta unidade. Com ele, você comenta, avalia e responde dúvidas.</p>
                <div class="inst-botoes">
                    <a class="inst-botao" href="login.html">Entrar</a>
                    <a class="inst-botao inst-botao--claro" href="cadastro.html">Criar conta</a>
                </div>
            </div>
        </div>`}function R(a,t=null){const o=a.certificadosDisponiveis||[],e=t&&(a.certificados||[]).find(l=>l.id===t.certificadoId),i=t?e:o[0],n=l=>[l.titulo,l.anoConclusao].filter(Boolean).map(r).join(" · "),c=t||o.length<=1?`<input type="hidden" id="comentario-certificado" name="certificadoId" value="${r(i?.id||"")}">`:`
            <label class="sr-only" for="comentario-certificado">Qual certificado</label>
            <select id="comentario-certificado" name="certificadoId">
                ${o.map(l=>`<option value="${r(l.id)}">${n(l)}</option>`).join("")}
            </select>`,m=t?.nota||0,h=t?.texto||"",u=[C(a.nome),i?.titulo,i?.anoConclusao].filter(Boolean).map(r);return`
        <form class="inst-form" id="form-comentario" novalidate>
            <strong class="inst-form-titulo">${t?"Editar seu comentário":"Como foi estudar aqui?"}</strong>
            ${!t&&o.length>1?'<p class="inst-form-sub">Você tem mais de um certificado desta escola. Escolha a qual curso este comentário se refere.</p>':""}
            ${c}
            <fieldset class="inst-nota-campo">
                <legend>Sua nota</legend>
                <div class="inst-nota-opcoes">
                    ${[5,4,3,2,1].map(l=>`
                    <input type="radio" id="nota-${l}" name="nota" value="${l}"${l===m?" checked":""}>
                    <label for="nota-${l}" title="${l} de 5">★<span class="sr-only">${l} de 5</span></label>`).join("")}
                </div>
            </fieldset>
            <label class="sr-only" for="comentario-texto">Seu comentário</label>
            <textarea id="comentario-texto" name="texto" rows="4" maxlength="${x.comentario.max}"
                placeholder="Conte como são as aulas, os professores e a estrutura: o que ajudaria quem está pensando em estudar aqui.">${r(h)}</textarea>
            <div class="inst-form-rodape">
                <span>Aparece como <strong>${u.join("</strong> · ")}</span>
                <span class="inst-form-contador" data-contador>${h.length}/${x.comentario.max}</span>
            </div>
            <p class="inst-form-erro" role="alert" hidden></p>
            <div class="inst-botoes">
                <button type="submit" class="inst-botao">${t?"Salvar":"Publicar"}</button>
                ${t?'<button type="button" class="inst-botao inst-botao--claro" data-acao="cancelar-comentario">Cancelar</button>':""}
            </div>
        </form>`}function j(a,{meu:t=!1,admin:o=!1,podeEditar:e=!0}={}){const i=a.editadoEm?" (editado)":"",n=t?`<div class="inst-acoes">
                ${e?`<button type="button" class="inst-acao" data-acao="editar-comentario" data-id="${r(a.id)}">Editar</button>`:""}
                <button type="button" class="inst-acao inst-acao--perigo" data-acao="apagar-comentario" data-id="${r(a.id)}">Apagar</button>
           </div>`:o?`<div class="inst-acoes"><button type="button" class="inst-acao inst-acao--perigo" data-acao="apagar-comentario" data-id="${r(a.id)}">Apagar (admin)</button></div>`:"";return`
        <li class="inst-comentario${t?" inst-comentario--meu":""}">
            <div class="inst-comentario-topo">
                <span class="inst-avatar">${B(a.nome)}</span>
                <div class="inst-comentario-autor">
                    <div class="inst-autor-linha">
                        <strong>${r(C(a.nome))}${t?' <span class="inst-voce">você</span>':""}</strong>
                        <time class="inst-data">${r(w(a.criadoEm))}${i}</time>
                    </div>
                    <span class="inst-verificado">${d.verificado}${r(F(a))}</span>
                </div>
            </div>
            ${a.nota?`<div class="inst-comentario-nota" role="img" aria-label="Nota ${a.nota} de 5">${_(a.nota)}</div>`:""}
            <p class="inst-comentario-texto">${r(a.texto)}</p>
            ${n}
        </li>`}function za({comentarios:a=[],total:t=0,haMais:o=!1,conta:e={},meusComentarios:i=[],editandoId:n=null}={}){const c=new Set(i.map(f=>f.id)),m=a.filter(f=>!c.has(f.id)),h=f=>(e.certificados||[]).some($=>$.id===f.certificadoId);let u="";if(!e.carregando){const f=i.filter($=>$.id!==n).map($=>j($,{meu:!0,podeEditar:h($)})).join("");f&&(u+=`<ol class="inst-comentarios">${f}</ol>`),n?u+=R(e,i.find($=>$.id===n)):na(e)?u+=R(e,null):i.length||(u+=Da(e))}const l=m.length?`<ol class="inst-comentarios">${m.map(f=>j(f,{admin:e.admin})).join("")}</ol>`:i.length?"":'<p class="inst-vazio">Ninguém comentou ainda. Quem estudou aqui pode ser a primeira pessoa a contar como foi.</p>';return`
        <header class="inst-cartao-topo">
            <h2><span class="inst-titulo-icone">${d.balao}</span>Quem estudou aqui</h2>
            <span class="inst-contagem">${t===1?"1 comentário":`${t} comentários`}</span>
        </header>
        ${u}
        ${l}
        ${o?'<button type="button" class="inst-ver-mais" data-acao="mais-comentarios">Ver mais comentários</button>':""}
        <p class="inst-rodape">Só comenta e avalia quem tem o certificado desta unidade conferido no Mural. As opiniões são de quem escreveu, não da escola.</p>`}function Ia(a,t,o){const e=a.uid===o.uid&&!t.fixa,i=!t.fixa&&(e||o.admin);return`
        <li class="inst-resposta${a.equipe?" inst-resposta--equipe":""}">
            <div class="inst-resposta-autor">
                ${a.equipe?'<span class="inst-avatar inst-avatar--pequeno inst-avatar--equipe"><img src="/logo.png" alt="" width="18" height="18"></span>':`<span class="inst-avatar inst-avatar--pequeno">${B(a.nome)}</span>`}
                <div class="inst-comentario-autor">
                    <div class="inst-autor-linha">
                        <strong>${a.equipe?"Equipe Futuro+":r(C(a.nome))}</strong>
                        ${a.em?`<time class="inst-data">${r(w(a.em))}</time>`:""}
                    </div>
                    ${a.equipe?"":`<span class="inst-verificado">${d.verificado}${r(F(a))}</span>`}
                </div>
            </div>
            <p>${r(a.texto)}</p>
            ${i?`<div class="inst-acoes">
                ${e&&H(o)?`<button type="button" class="inst-acao" data-acao="editar-resposta" data-pergunta="${r(t.id)}">Editar</button>`:""}
                <button type="button" class="inst-acao inst-acao--perigo" data-acao="apagar-resposta" data-pergunta="${r(t.id)}" data-uid="${r(a.uid)}">${e?"Apagar":"Apagar (admin)"}</button>
            </div>`:""}
        </li>`}function Oa(a,t,o=""){const e=(t.certificados||[])[0],i=t.admin&&!e?"Equipe Futuro+":[C(t.nome),e?.titulo,e?.anoConclusao].filter(Boolean).join(" · ");return`
        <form class="inst-form inst-form--resposta" data-form="resposta" data-pergunta="${r(a.id)}" novalidate>
            <label class="sr-only" for="resposta-${r(a.id)}">Sua resposta</label>
            <textarea id="resposta-${r(a.id)}" name="texto" rows="3" maxlength="${x.resposta.max}"
                placeholder="Responda com o que você viveu aí.">${r(o)}</textarea>
            <div class="inst-form-rodape">
                <span>Aparece como <strong>${r(i)}</strong></span>
                <span class="inst-form-contador" data-contador>${o.length}/${x.resposta.max}</span>
            </div>
            <p class="inst-form-erro" role="alert" hidden></p>
            <div class="inst-botoes">
                <button type="submit" class="inst-botao">${o?"Salvar":"Responder"}</button>
                <button type="button" class="inst-botao inst-botao--claro" data-acao="cancelar-resposta">Cancelar</button>
            </div>
        </form>`}function Ra(a,t,{aberta:o=!1,respondendo:e="",textoResposta:i=""}={}){const n=ca(a),c=n.some(f=>f.uid===t.uid),m=a.fixa?"Resposta do Futuro+":n.length?n.length===1?"1 resposta":`${n.length} respostas`:"Sem resposta ainda",h=!a.fixa&&a.autorUid===t.uid;let u="";a.fixa||(e===a.id?u=Oa(a,t,i):H(t)&&!c&&(u=`<button type="button" class="inst-botao inst-botao--pequeno" data-acao="responder" data-pergunta="${r(a.id)}">Responder</button>`));const l=!a.fixa&&(t.admin||h&&!n.length)?`<button type="button" class="inst-acao inst-acao--perigo" data-acao="apagar-pergunta" data-pergunta="${r(a.id)}">${h?"Apagar pergunta":"Apagar pergunta (admin)"}</button>`:"";return`
        <details class="inst-duvida${a.fixa?" inst-duvida--fixa":""}" data-pergunta="${r(a.id)}"${o?" open":""}>
            <summary>
                <span class="inst-duvida-texto">${r(a.texto)}</span>
                <span class="inst-duvida-info${!a.fixa&&!n.length?" inst-duvida-info--sem":""}">${m}</span>
                <span class="inst-duvida-seta">${d.abrir}</span>
            </summary>
            <div class="inst-duvida-corpo">
                ${a.fixa?"":`<p class="inst-duvida-quem">Pergunta de ${r(C(a.nome)||"alguém")}${a.criadaEm?` · ${r(w(a.criadaEm))}`:""}</p>`}
                ${n.length?`<ol class="inst-respostas">${n.map(f=>Ia(f,a,t)).join("")}</ol>`:'<p class="inst-vazio">Ninguém respondeu ainda.</p>'}
                ${u||l?`<div class="inst-duvida-rodape">${u}${l?`<div class="inst-acoes">${l}</div>`:""}</div>`:""}
            </div>
        </details>`}function ja(){return`
        <form class="inst-form" id="form-pergunta" novalidate>
            <label class="inst-form-titulo" for="pergunta-texto">Qual é a sua dúvida sobre esta unidade?</label>
            <textarea id="pergunta-texto" name="texto" rows="2" maxlength="${x.pergunta.max}"
                placeholder="Ex.: Como é o estágio? Dá para conciliar o curso com o trabalho?"></textarea>
            <div class="inst-form-rodape">
                <span>Quem estudou aqui e a equipe do Futuro+ respondem.</span>
                <span class="inst-form-contador" data-contador>0/${x.pergunta.max}</span>
            </div>
            <p class="inst-form-erro" role="alert" hidden></p>
            <div class="inst-botoes">
                <button type="submit" class="inst-botao">Enviar pergunta</button>
                <button type="button" class="inst-botao inst-botao--claro" data-acao="cancelar-pergunta">Cancelar</button>
            </div>
        </form>`}function Ta({fixas:a=[],perguntas:t=[],haMais:o=!1,conta:e={},abertas:i=new Set,perguntando:n=!1,respondendo:c="",textoResposta:m=""}={}){let h="";e.carregando||n?h="":ia(e)?h='<button type="button" class="inst-botao inst-botao--pequeno" data-acao="perguntar">Fazer uma pergunta</button>':h='<a class="inst-botao inst-botao--pequeno inst-botao--claro" href="login.html">Entre para perguntar</a>';const u=[...t,...a];return`
        <header class="inst-cartao-topo">
            <h2><span class="inst-titulo-icone">${d.duvida}</span>Dúvidas frequentes</h2>
            ${h}
        </header>
        <p class="inst-cartao-sub">Qualquer pessoa com conta pergunta. Quem estudou aqui e a equipe do Futuro+ respondem.</p>
        ${n?ja():""}
        <div class="inst-duvidas">
            ${u.map(l=>Ra(l,e,{aberta:i.has(l.id)||c===l.id,respondendo:c,textoResposta:m})).join("")}
        </div>
        ${o?'<button type="button" class="inst-ver-mais" data-acao="mais-perguntas">Ver mais perguntas</button>':""}`}function Na(a){return`
        <div class="inst-cartao inst-nao-encontrada">
            <p>${r(a)}</p>
            <a class="inst-botao" href="instituicoes.html">Ver todas as instituições</a>
        </div>`}const v=a=>document.getElementById(a),s={id:"",unidade:null,cursos:[],todosOsCursos:!1,avaliacao:void 0,comentarios:[],cursorComentarios:null,haMaisComentarios:!1,meusComentarios:[],editandoId:null,fixas:[],perguntas:[],cursorPerguntas:null,haMaisPerguntas:!1,abertas:new Set,perguntando:!1,respondendo:"",textoResposta:"",conta:{logado:!1,carregando:!0}};function D(){const a=new Set(s.meusComentarios.map(t=>t.certificadoId));s.conta={...s.conta,certificadosDisponiveis:(s.conta.certificados||[]).filter(t=>!a.has(t.id))}}function k(){v("inst-numeros").innerHTML=ka(s.unidade,s.cursos,s.avaliacao)}function Q(){v("inst-cursos").innerHTML=Pa(s.cursos,{todos:s.todosOsCursos})}function b(){v("quem-estudou").innerHTML=za({comentarios:s.comentarios,total:s.avaliacao?s.avaliacao.total:s.comentarios.length,haMais:s.haMaisComentarios,conta:s.conta,meusComentarios:s.meusComentarios,editandoId:s.editandoId})}function g(){v("duvidas").innerHTML=Ta({fixas:s.fixas,perguntas:s.perguntas,haMais:s.haMaisPerguntas,conta:s.conta,abertas:s.abertas,perguntando:s.perguntando,respondendo:s.respondendo,textoResposta:s.textoResposta})}function G({somar:a=null,tirar:t=null}){const o=s.avaliacao||{media:0,total:0};let e=o.media*o.total,i=o.total;t!=null&&(e-=t,i-=1),a!=null&&(e+=a,i+=1),i=Math.max(0,i),s.avaliacao={media:i?e/i:0,total:i},k()}function S(a,t){document.title="Futuro+ | Instituições",v("inst-capa-miolo").innerHTML=Aa(a),v("inst-carregando").outerHTML=Na(t)}function A(){const a=location.hash.length>1&&document.getElementById(decodeURIComponent(location.hash.slice(1)));a&&a.scrollIntoView({block:"start"})}const L=a=>setTimeout(()=>document.querySelector(a)?.focus(),0);function y(a,t){const o=a.querySelector(".inst-form-erro");o.textContent=t,o.hidden=!1}function z(a,t){const o=a.querySelector('button[type="submit"]');o.dataset.rotulo=o.textContent,o.disabled=!0,o.textContent=t}function I(a){const t=a.querySelector('button[type="submit"]');t.disabled=!1,t.textContent=t.dataset.rotulo||t.textContent}function M(a,t){return console.error(a),a?.code==="permission-denied"?t:"Não deu para salvar agora. Confira a conexão e tente de novo."}const J="O servidor não aceitou. Confira se o certificado desta unidade continua no seu Mural e tente de novo.";async function Fa(a){const t=Number(a.querySelector('input[name="nota"]:checked')?.value||0),o=a.querySelector("textarea").value,e=a.querySelector("#comentario-certificado")?.value||"",i=t?e?P(o,x.comentario):"Não encontrei o certificado para este comentário. Atualize a página e tente de novo.":"Escolha uma nota de 1 a 5.";if(i)return y(a,i);const n=s.editandoId?s.meusComentarios.find(c=>c.id===s.editandoId):null;z(a,"Salvando...");try{const c=await fa(s.id,s.conta,{texto:o,nota:t,certificadoId:e},n);s.meusComentarios=[...s.meusComentarios.filter(m=>m.id!==c.id),c],s.comentarios=s.comentarios.filter(m=>m.id!==c.id),s.editandoId=null,G(n?{tirar:n.nota,somar:t}:{somar:t}),D(),b()}catch(c){y(a,M(c,J)),I(a)}}async function Ha(a,t){const o=s.meusComentarios.some(n=>n.id===a),e=o?s.meusComentarios.find(n=>n.id===a):s.comentarios.find(n=>n.id===a),i=o?"Apagar o seu comentário e a sua nota?":`Apagar o comentário de ${C(e?.nome)||"quem escreveu"}?`;if(confirm(i)){t.disabled=!0;try{await ga(s.id,a),s.comentarios=s.comentarios.filter(n=>n.id!==a),o&&(s.meusComentarios=s.meusComentarios.filter(n=>n.id!==a),s.editandoId===a&&(s.editandoId=null),D()),e?.nota&&G({tirar:e.nota}),b()}catch(n){t.disabled=!1,alert(M(n,"O servidor não aceitou apagar este comentário."))}}}async function Ua(a){a.disabled=!0;try{const{itens:t,cursor:o,haMais:e}=await U(s.id,{depois:s.cursorComentarios}),i=new Set(s.comentarios.map(n=>n.id));s.comentarios.push(...t.filter(n=>!i.has(n.id))),s.cursorComentarios=o,s.haMaisComentarios=e,b()}catch(t){console.error("Erro ao ler mais comentários:",t),a.disabled=!1}}const q=a=>s.perguntas.find(t=>t.id===a);async function Va(a){const t=a.querySelector("textarea").value,o=P(t,x.pergunta);if(o)return y(a,o);z(a,"Enviando...");try{const e=await ha(s.id,s.conta,t);s.perguntas=[e,...s.perguntas],s.perguntando=!1,s.abertas.add(e.id),g()}catch(e){y(a,M(e,"O servidor não aceitou a pergunta. Confirme o e-mail da sua conta e tente de novo.")),I(a)}}async function _a(a,t){const o=a.querySelector("textarea").value,e=P(o,x.resposta);if(e)return y(a,e);z(a,"Salvando...");try{const i=await va(s.id,t,s.conta,o),n=q(t);n.respostas={...n.respostas||{},[s.conta.uid]:i},s.respondendo="",s.textoResposta="",s.abertas.add(t),g()}catch(i){y(a,M(i,s.conta.certificados?.length?J:"O servidor não aceitou a resposta.")),I(a)}}async function Ba(a,t,o){const e=q(a);if(!e)return;const i=t===s.conta.uid,n=e.respostas?.[t]?.equipe?"da Equipe Futuro+":`de ${C(e.respostas?.[t]?.nome)||"quem respondeu"}`;if(confirm(i?"Apagar a sua resposta?":`Apagar a resposta ${n}?`)){o.disabled=!0;try{await ba(s.id,a,t);const c={...e.respostas||{}};delete c[t],e.respostas=c,g()}catch(c){o.disabled=!1,alert(M(c,"O servidor não aceitou apagar esta resposta."))}}}async function Qa(a,t){const o=q(a);if(!o)return;const e=Object.keys(o.respostas||{}).length>0;if(confirm(e?"Apagar esta pergunta? As respostas somem junto.":"Apagar esta pergunta?")){t.disabled=!0;try{await $a(s.id,a),s.perguntas=s.perguntas.filter(i=>i.id!==a),s.abertas.delete(a),g()}catch(i){t.disabled=!1,alert(M(i,"O servidor não aceitou apagar esta pergunta."))}}}async function Ga(a){a.disabled=!0;try{const{itens:t,cursor:o,haMais:e}=await V(s.id,{depois:s.cursorPerguntas}),i=new Set(s.perguntas.map(n=>n.id));s.perguntas.push(...t.filter(n=>!i.has(n.id))),s.cursorPerguntas=o,s.haMaisPerguntas=e,g()}catch(t){console.error("Erro ao ler mais perguntas:",t),a.disabled=!1}}function Ja(a){const t=a.target.closest("[data-acao]");if(t)switch(t.dataset.acao){case"editar-comentario":s.editandoId=t.dataset.id,b(),L("#comentario-texto");break;case"cancelar-comentario":s.editandoId=null,b();break;case"apagar-comentario":Ha(t.dataset.id,t);break;case"mais-comentarios":Ua(t);break}}function Ka(a){const t=a.target.closest("[data-acao]");if(!t)return;const o=t.dataset.pergunta||"";switch(t.dataset.acao){case"perguntar":s.perguntando=!0,g(),L("#pergunta-texto");break;case"cancelar-pergunta":s.perguntando=!1,g();break;case"responder":case"editar-resposta":s.respondendo=o,s.textoResposta=t.dataset.acao==="editar-resposta"&&q(o)?.respostas?.[s.conta.uid]?.texto||"",s.abertas.add(o),g(),L(`#resposta-${CSS.escape(o)}`);break;case"cancelar-resposta":s.respondendo="",s.textoResposta="",g();break;case"apagar-resposta":Ba(o,t.dataset.uid,t);break;case"apagar-pergunta":Qa(o,t);break;case"mais-perguntas":Ga(t);break}}function T(a){if(a.target.tagName!=="TEXTAREA")return;const t=a.target.closest("form")?.querySelector("[data-contador]");t&&(t.textContent=`${a.target.value.length}/${a.target.maxLength}`)}function Xa(){v("inst-cursos").addEventListener("click",o=>{o.target.closest('[data-acao="todos-os-cursos"]')&&(s.todosOsCursos=!0,Q())});const a=v("quem-estudou");a.addEventListener("click",Ja),a.addEventListener("submit",o=>{o.target.id==="form-comentario"&&(o.preventDefault(),Fa(o.target))});const t=v("duvidas");t.addEventListener("click",Ka),t.addEventListener("submit",o=>{const e=o.target;e.id==="form-pergunta"?(o.preventDefault(),Va(e)):e.dataset.form==="resposta"&&(o.preventDefault(),_a(e,e.dataset.pergunta))}),t.addEventListener("toggle",o=>{const e=o.target;e.matches?.("details[data-pergunta]")&&(e.open?s.abertas.add(e.dataset.pergunta):s.abertas.delete(e.dataset.pergunta))},!0),a.addEventListener("input",T),t.addEventListener("input",T)}async function Wa(){const a=new URLSearchParams(location.search).get("u")||"";if(!a||a.includes("/")){S("Instituição não encontrada","O endereço está incompleto. Escolha a unidade na lista de instituições.");return}s.id=a;let t=null;try{t=await da(a)}catch(n){if(console.error("Erro ao ler a unidade:",n),document.querySelector(".inst-pronta"))return;S("Não deu para abrir esta instituição","Confira a conexão e tente de novo em instantes.");return}if(!t){S("Instituição não encontrada","A unidade pode ter saído do cadastro. Procure por ela na lista de instituições.");return}s.unidade=t,s.cursos=la(t),s.fixas=ua(t,s.cursos),document.title=`${t.nome}: cursos, endereço e avaliações | Futuro+`;const o=N(t,s.cursos);Ma(o.slice(0,155));const{lat:e,lng:i}=t.localizacao||{};Ea({"@context":"https://schema.org","@type":(t.tipo||"").trim().toLowerCase()==="fatec"?"CollegeOrUniversity":"School",name:t.nome,description:o,url:`https://futuroplus.com.br/instituicao.html?u=${encodeURIComponent(a)}`,...t.municipio?{address:{"@type":"PostalAddress",addressLocality:t.municipio,addressRegion:"SP",addressCountry:"BR"}}:{},...e!=null&&i!=null?{geo:{"@type":"GeoCoordinates",latitude:e,longitude:i}}:{},parentOrganization:{"@type":"Organization",name:"Centro Paula Souza",sameAs:"https://www.cps.sp.gov.br/"}}),v("inst-capa-miolo").innerHTML=Sa(t,s.cursos),k(),v("inst-sobre").innerHTML=wa(t,s.cursos),Q(),b(),g(),v("inst-carregando").hidden=!0,v("inst-conteudo").hidden=!1,Xa(),A(),pa(a).then(n=>{s.avaliacao=n}).catch(n=>{console.error("Erro ao ler a média das notas:",n),s.avaliacao=null}).finally(()=>{k(),b()}),U(a).then(({itens:n,cursor:c,haMais:m})=>{s.comentarios=n,s.cursorComentarios=c,s.haMaisComentarios=m,b(),location.hash==="#quem-estudou"&&A()}).catch(n=>console.error("Erro ao ler os comentários:",n)),V(a).then(({itens:n,cursor:c,haMais:m})=>{s.perguntas=n,s.cursorPerguntas=c,s.haMaisPerguntas=m,g(),location.hash==="#duvidas"&&A()}).catch(n=>console.error("Erro ao ler as dúvidas:",n)),ma(a,async n=>{if(s.editandoId=null,s.respondendo="",s.perguntando=!1,s.meusComentarios=[],n.logado&&n.certificados?.length)try{s.meusComentarios=await xa(a,n.uid)}catch(c){console.error("Erro ao ler os seus comentários:",c)}s.conta=n,D(),b(),g()})}document.addEventListener("DOMContentLoaded",Wa);
