import"./firebase-config-h-KQCxoQ.js";/* empty css              */import"./dashboard-CTg4YrJA.js";import{f as J,s as K,F as O,l as E,t as X,a as W,b as Y,p as Z,c as aa,d as ta,e as sa,q as oa,C as ea,g as na,h as ia,i as ra,j as C,k as P,r as F,L as x,m as ca,n as N,o as da,u as la,v as ua,w as pa,x as H,y as U,z as ma,A as w,B as fa,D as ha,E as va,G as ga,H as $a,I as ba,J as xa}from"./instituicao-dados-HTIN8ua9.js";import{L as Ca,e as r,b as ya,a as Ma}from"./card-unidade-DBz7HAVa.js";import"./preload-helper-PPVm8Dsz.js";import"./conteudo-legal-padrao-DcxCgRAC.js";import"./resultado-teste-xMN1ahPz.js";import"./notificacoes-util-BE-pPj56.js";const p=(a,t=20)=>`<svg width="${t}" height="${t}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${a}</svg>`,c={local:p('<path d="M12 21s-7-6.2-7-12a7 7 0 0 1 14 0c0 5.8-7 12-7 12z"/><circle cx="12" cy="9" r="2.6"/>',16),capelo:p('<path d="M2 9.5 12 5l10 4.5-10 4.5L2 9.5z"/><path d="M6 11.6V16c0 1.4 2.7 3 6 3s6-1.6 6-3v-4.4"/><path d="M22 9.5v5"/>'),telefone:p('<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/>'),estrela:p('<path d="m12 2.8 2.8 5.8 6.4.9-4.6 4.5 1.1 6.3L12 17.3l-5.7 3 1.1-6.3-4.6-4.5 6.4-.9L12 2.8z"/>'),mapa:p('<path d="M12 21s-7-6.2-7-12a7 7 0 0 1 14 0c0 5.8-7 12-7 12z"/><circle cx="12" cy="9" r="2.6"/>'),livro:p('<path d="M2 5.5A2.5 2.5 0 0 1 4.5 3H11v17H4.5A2.5 2.5 0 0 0 2 22.5z"/><path d="M22 5.5A2.5 2.5 0 0 0 19.5 3H13v17h6.5a2.5 2.5 0 0 1 2.5 2.5z"/>'),balao:p('<path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 9 9 0 0 1-3.9-.9L3 20.5l1.5-4.6A8.4 8.4 0 1 1 21 11.5z"/>'),duvida:p('<circle cx="12" cy="12" r="9.5"/><path d="M9.2 9a3 3 0 0 1 5.8 1c0 2-3 2.6-3 4.4"/><path d="M12 17.6h.01"/>'),cadeado:p('<rect x="4.5" y="10.5" width="15" height="10.5" rx="2.5"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/>'),verificado:p('<circle cx="12" cy="12" r="9.5"/><path d="m8 12.4 2.7 2.6L16.2 9.6"/>',14),seta:p('<path d="M5 12h14M13 6l6 6-6 6"/>',16),voltar:p('<path d="M19 12H5M11 6l-6 6 6 6"/>',16),externo:p('<path d="M7 17 17 7M9 7h8v8"/>',14),abrir:p('<path d="m6 9 6 6 6-6"/>',18),site:p('<circle cx="12" cy="12" r="9.5"/><path d="M2.5 12h19M12 2.5a14.6 14.6 0 0 1 0 19M12 2.5a14.6 14.6 0 0 0 0 19"/>',18),instagram:p('<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><path d="M17.5 6.5h.01"/>',18),facebook:p('<path d="M15 3h-2.5A4.5 4.5 0 0 0 8 7.5V10H5.5v4H8v7h4v-7h2.6l.9-4H12V7.8c0-.6.4-.8 1-.8h2z"/>',18),predio:p('<path d="M3 21h18M5 21V10l7-5 7 5v11"/><path d="M9.5 21v-5h5v5M9 11.5h.01M15 11.5h.01"/>',16),pessoas:p('<circle cx="9" cy="8" r="3.2"/><path d="M3 20a6 6 0 0 1 12 0"/><path d="M16 4.9a3.2 3.2 0 0 1 0 6.2M18 20a6 6 0 0 0-3-5.2"/>',16),nivel:p('<path d="M2 9.5 12 5l10 4.5-10 4.5L2 9.5z"/><path d="M6 11.6V16c0 1.4 2.7 3 6 3s6-1.6 6-3v-4.4"/>',16)},Ea={nivel:c.nivel,publica:c.predio,forma:c.pessoas};function V(a,t="inst-estrelas"){const e={cheia:"★",meia:"★",vazia:"★"};return`<span class="${t}" aria-hidden="true">${ra(a).map(o=>`<span class="inst-estrela inst-estrela--${o}">${e[o]}</span>`).join("")}</span>`}const _=a=>r((C(a)[0]||"?").toUpperCase());function qa(a,t){const e=J(a),o=a.municipio?`${a.municipio}, SP`:"",n=K(a,t);return`
        <img class="inst-capa-foto${e?"":" inst-capa-foto--padrao"}" src="${r(e||O)}" alt="" fetchpriority="high"
            onerror="this.onerror=null;this.src='${O}';this.classList.add('inst-capa-foto--padrao')">
        <div class="home-hero-conteudo inst-capa-conteudo">
            <a class="inst-capa-voltar" href="instituicoes.html">${c.voltar} Todas as instituições</a>
            <div class="inst-capa-identidade">
                <div class="inst-capa-logo">
                    <img src="${ya(a)}" alt="Logo da ${r(a.nome)}"
                        onerror="this.onerror=null;this.src='${Ca}';">
                </div>
                <div class="inst-capa-texto">
                    <h1>${r(a.nome)}</h1>
                    ${o?`<p class="inst-capa-local">${c.local} ${r(o)}</p>`:""}
                    ${n.length?`<ul class="inst-capa-selos">${n.map(i=>`
                        <li>${Ea[i.icone]||""}${r(i.texto)}</li>`).join("")}
                    </ul>`:""}
                </div>
            </div>
        </div>`}function Sa(a){return`
        <div class="home-hero-conteudo inst-capa-conteudo">
            <a class="inst-capa-voltar" href="instituicoes.html">${c.voltar} Todas as instituições</a>
            <h1>${r(a)}</h1>
        </div>`}function ka(a,t,e){const o=new Set(t.flatMap(m=>m.modalidades.map($=>$.chave))),n=t.length?o.size===1?t[0].modalidades[0].rotulo:`em ${o.size} modalidades`:"Ainda sem lista no cadastro",i=W(a.telefone),l=Y(a.telefone),f=E(a.site),h=e&&e.total>0,u=Z(a),d=aa(a);return`
        <article class="inst-numero">
            <span class="inst-numero-icone inst-numero-icone--azul">${c.capelo}</span>
            <div class="inst-numero-textos">
                <span class="inst-numero-rotulo">Cursos oferecidos</span>
                <a class="inst-numero-valor" href="#inst-cursos">${t.length===1?"1 curso":`${t.length} cursos`}</a>
                <span class="inst-numero-sub">${r(n)}</span>
            </div>
        </article>
        <article class="inst-numero">
            <span class="inst-numero-icone inst-numero-icone--verde">${c.telefone}</span>
            <div class="inst-numero-textos">
                <span class="inst-numero-rotulo">Contato</span>
                ${i?l?`<a class="inst-numero-valor" href="${l}">${r(i)}</a>`:`<strong class="inst-numero-valor">${r(i)}</strong>`:'<strong class="inst-numero-valor inst-numero-valor--vazio">Sem telefone</strong>'}
                ${f?`<a class="inst-numero-sub inst-numero-link" href="${r(f)}" target="_blank" rel="noopener">${r(ta(a.site))} ${c.externo}</a>`:'<span class="inst-numero-sub">Sem site no cadastro</span>'}
            </div>
        </article>
        <article class="inst-numero">
            <span class="inst-numero-icone inst-numero-icone--ouro">${c.estrela}</span>
            <div class="inst-numero-textos">
                <span class="inst-numero-rotulo">Avaliação</span>
                ${e===void 0?`
                <strong class="inst-numero-valor inst-numero-valor--vazio">...</strong>
                <span class="inst-numero-sub">Carregando as notas</span>`:h?`
                <span class="inst-numero-valor inst-numero-valor--nota">
                    <strong>${sa(e.media)}</strong><span class="inst-numero-de">/ 5</span>
                    ${V(e.media)}
                </span>
                <a class="inst-numero-sub inst-numero-link" href="#quem-estudou">${oa(e.total)}</a>`:`
                <strong class="inst-numero-valor inst-numero-valor--vazio">Sem notas ainda</strong>
                <span class="inst-numero-sub">Só quem estudou aqui avalia</span>`}
            </div>
        </article>
        <article class="inst-numero inst-numero--endereco">
            <span class="inst-numero-icone inst-numero-icone--coral">${c.mapa}</span>
            <div class="inst-numero-textos">
                <div class="inst-numero-cabeca">
                    <span class="inst-numero-rotulo">Endereço</span>
                    ${d?`<a class="inst-mapa" href="${r(d)}" target="_blank" rel="noopener">${c.local} Ver no Google Maps ${c.externo}</a>`:""}
                </div>
                <strong class="inst-numero-valor inst-numero-valor--texto">${r(u.rua||u.resto||"Sem endereço no cadastro")}</strong>
                ${u.rua&&u.resto?`<span class="inst-numero-sub">${r(u.resto)}</span>`:""}
            </div>
        </article>`}function Aa(a){const t=String(a?.rede||"").toLowerCase(),e=E(a?.url);if(!e)return"";const o=t==="instagram"?c.instagram:t==="facebook"?c.facebook:c.site;return`<li><a class="inst-link" href="${r(e)}" target="_blank" rel="noopener">${o}${r(a.rede)}</a></li>`}function La(a,t){const e=E(a.site),o=E(a.paginaCps),n=[e?`<li><a class="inst-link" href="${r(e)}" target="_blank" rel="noopener">${c.site}Site da unidade</a></li>`:"",...(a.redesSociais||[]).map(Aa),o?`<li><a class="inst-link" href="${r(o)}" target="_blank" rel="noopener">${c.predio}Página no Centro Paula Souza</a></li>`:""].filter(Boolean);return`
        <header class="inst-cartao-topo">
            <h2><span class="inst-titulo-icone">${c.livro}</span>Sobre a instituição</h2>
        </header>
        <p class="inst-sobre-texto">${r(X(a,t))}</p>
        ${n.length?`<ul class="inst-links">${n.join("")}</ul>`:""}`}function Pa(a,{todos:t=!1}={}){if(!a.length)return`
            <header class="inst-cartao-topo"><h2><span class="inst-titulo-icone">${c.capelo}</span>Cursos oferecidos</h2></header>
            <p class="inst-vazio">O cadastro desta unidade ainda não tem a lista de cursos.</p>`;const e=t?a:a.slice(0,ea),o=a.length-e.length;return`
        <header class="inst-cartao-topo">
            <h2><span class="inst-titulo-icone">${c.capelo}</span>Cursos oferecidos</h2>
            <span class="inst-contagem">${a.length===1?"1 curso":`${a.length} cursos`}</span>
        </header>
        <p class="inst-cartao-sub">Toque em um curso para ver o que se aprende e onde dá para trabalhar.</p>
        <ul class="inst-cursos">
            ${e.map(n=>`
            <li>
                <a class="inst-curso inst-curso--${n.modalidades[0].chave}" href="curso.html?c=${encodeURIComponent(n.slug)}">
                    <span class="inst-curso-icone">${c.capelo}</span>
                    <span class="inst-curso-textos">
                        <strong>${r(n.nome)}</strong>
                        <span class="inst-curso-modalidades">${n.modalidades.map(i=>`<span>${r(i.rotulo)}</span>`).join("")}</span>
                    </span>
                    <span class="inst-curso-seta">${c.seta}</span>
                </a>
            </li>`).join("")}
        </ul>
        ${o>0?`<button type="button" class="inst-ver-mais" data-acao="todos-os-cursos">Ver todos os ${a.length} cursos</button>`:""}`}function wa(a){return a?.logado?`
        <div class="inst-acesso">
            <span class="inst-acesso-icone">${c.cadeado}</span>
            <div>
                <strong>Estudou aqui?</strong>
                <p>Pendure no Mural o certificado desta unidade. Quando a leitura do certificado encontrar o nome da escola, você comenta, avalia e responde dúvidas.</p>
                <div class="inst-botoes">
                    <a class="inst-botao" href="mural.html">Ir para o Mural</a>
                </div>
            </div>
        </div>`:`
        <div class="inst-acesso">
            <span class="inst-acesso-icone">${c.cadeado}</span>
            <div>
                <strong>Estudou aqui?</strong>
                <p>Entre na sua conta e pendure no Mural o certificado desta unidade. Com ele, você comenta, avalia e responde dúvidas.</p>
                <div class="inst-botoes">
                    <a class="inst-botao" href="login.html">Entrar</a>
                    <a class="inst-botao inst-botao--claro" href="cadastro.html">Criar conta</a>
                </div>
            </div>
        </div>`}function R(a,t=null){const e=a.certificadosDisponiveis||[],o=t&&(a.certificados||[]).find(d=>d.id===t.certificadoId),n=t?o:e[0],i=d=>[d.titulo,d.anoConclusao].filter(Boolean).map(r).join(" · "),l=t||e.length<=1?`<input type="hidden" id="comentario-certificado" name="certificadoId" value="${r(n?.id||"")}">`:`
            <label class="sr-only" for="comentario-certificado">Qual certificado</label>
            <select id="comentario-certificado" name="certificadoId">
                ${e.map(d=>`<option value="${r(d.id)}">${i(d)}</option>`).join("")}
            </select>`,f=t?.nota||0,h=t?.texto||"",u=[C(a.nome),n?.titulo,n?.anoConclusao].filter(Boolean).map(r);return`
        <form class="inst-form" id="form-comentario" novalidate>
            <strong class="inst-form-titulo">${t?"Editar seu comentário":"Como foi estudar aqui?"}</strong>
            ${!t&&e.length>1?'<p class="inst-form-sub">Você tem mais de um certificado desta escola. Escolha a qual curso este comentário se refere.</p>':""}
            ${l}
            <fieldset class="inst-nota-campo">
                <legend>Sua nota</legend>
                <div class="inst-nota-opcoes">
                    ${[5,4,3,2,1].map(d=>`
                    <input type="radio" id="nota-${d}" name="nota" value="${d}"${d===f?" checked":""}>
                    <label for="nota-${d}" title="${d} de 5">★<span class="sr-only">${d} de 5</span></label>`).join("")}
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
        </form>`}function j(a,{meu:t=!1,admin:e=!1,podeEditar:o=!0}={}){const n=a.editadoEm?" (editado)":"",i=t?`<div class="inst-acoes">
                ${o?`<button type="button" class="inst-acao" data-acao="editar-comentario" data-id="${r(a.id)}">Editar</button>`:""}
                <button type="button" class="inst-acao inst-acao--perigo" data-acao="apagar-comentario" data-id="${r(a.id)}">Apagar</button>
           </div>`:e?`<div class="inst-acoes"><button type="button" class="inst-acao inst-acao--perigo" data-acao="apagar-comentario" data-id="${r(a.id)}">Apagar (admin)</button></div>`:"";return`
        <li class="inst-comentario${t?" inst-comentario--meu":""}">
            <div class="inst-comentario-topo">
                <span class="inst-avatar">${_(a.nome)}</span>
                <div class="inst-comentario-autor">
                    <div class="inst-autor-linha">
                        <strong>${r(C(a.nome))}${t?' <span class="inst-voce">você</span>':""}</strong>
                        <time class="inst-data">${r(P(a.criadoEm))}${n}</time>
                    </div>
                    <span class="inst-verificado">${c.verificado}${r(F(a))}</span>
                </div>
            </div>
            ${a.nota?`<div class="inst-comentario-nota" role="img" aria-label="Nota ${a.nota} de 5">${V(a.nota)}</div>`:""}
            <p class="inst-comentario-texto">${r(a.texto)}</p>
            ${i}
        </li>`}function Da({comentarios:a=[],total:t=0,haMais:e=!1,conta:o={},meusComentarios:n=[],editandoId:i=null}={}){const l=new Set(n.map(m=>m.id)),f=a.filter(m=>!l.has(m.id)),h=m=>(o.certificados||[]).some($=>$.id===m.certificadoId);let u="";if(!o.carregando){const m=n.filter($=>$.id!==i).map($=>j($,{meu:!0,podeEditar:h($)})).join("");m&&(u+=`<ol class="inst-comentarios">${m}</ol>`),i?u+=R(o,n.find($=>$.id===i)):na(o)?u+=R(o,null):n.length||(u+=wa(o))}const d=f.length?`<ol class="inst-comentarios">${f.map(m=>j(m,{admin:o.admin})).join("")}</ol>`:n.length?"":'<p class="inst-vazio">Ninguém comentou ainda. Quem estudou aqui pode ser a primeira pessoa a contar como foi.</p>';return`
        <header class="inst-cartao-topo">
            <h2><span class="inst-titulo-icone">${c.balao}</span>Quem estudou aqui</h2>
            <span class="inst-contagem">${t===1?"1 comentário":`${t} comentários`}</span>
        </header>
        ${u}
        ${d}
        ${e?'<button type="button" class="inst-ver-mais" data-acao="mais-comentarios">Ver mais comentários</button>':""}
        <p class="inst-rodape">Só comenta e avalia quem tem o certificado desta unidade conferido no Mural. As opiniões são de quem escreveu, não da escola.</p>`}function Ia(a,t,e){const o=a.uid===e.uid&&!t.fixa,n=!t.fixa&&(o||e.admin);return`
        <li class="inst-resposta${a.equipe?" inst-resposta--equipe":""}">
            <div class="inst-resposta-autor">
                ${a.equipe?'<span class="inst-avatar inst-avatar--pequeno inst-avatar--equipe"><img src="/logo.png" alt="" width="18" height="18"></span>':`<span class="inst-avatar inst-avatar--pequeno">${_(a.nome)}</span>`}
                <div class="inst-comentario-autor">
                    <div class="inst-autor-linha">
                        <strong>${a.equipe?"Equipe Futuro+":r(C(a.nome))}</strong>
                        ${a.em?`<time class="inst-data">${r(P(a.em))}</time>`:""}
                    </div>
                    ${a.equipe?"":`<span class="inst-verificado">${c.verificado}${r(F(a))}</span>`}
                </div>
            </div>
            <p>${r(a.texto)}</p>
            ${n?`<div class="inst-acoes">
                ${o&&N(e)?`<button type="button" class="inst-acao" data-acao="editar-resposta" data-pergunta="${r(t.id)}">Editar</button>`:""}
                <button type="button" class="inst-acao inst-acao--perigo" data-acao="apagar-resposta" data-pergunta="${r(t.id)}" data-uid="${r(a.uid)}">${o?"Apagar":"Apagar (admin)"}</button>
            </div>`:""}
        </li>`}function za(a,t,e=""){const o=(t.certificados||[])[0],n=t.admin&&!o?"Equipe Futuro+":[C(t.nome),o?.titulo,o?.anoConclusao].filter(Boolean).join(" · ");return`
        <form class="inst-form inst-form--resposta" data-form="resposta" data-pergunta="${r(a.id)}" novalidate>
            <label class="sr-only" for="resposta-${r(a.id)}">Sua resposta</label>
            <textarea id="resposta-${r(a.id)}" name="texto" rows="3" maxlength="${x.resposta.max}"
                placeholder="Responda com o que você viveu aí.">${r(e)}</textarea>
            <div class="inst-form-rodape">
                <span>Aparece como <strong>${r(n)}</strong></span>
                <span class="inst-form-contador" data-contador>${e.length}/${x.resposta.max}</span>
            </div>
            <p class="inst-form-erro" role="alert" hidden></p>
            <div class="inst-botoes">
                <button type="submit" class="inst-botao">${e?"Salvar":"Responder"}</button>
                <button type="button" class="inst-botao inst-botao--claro" data-acao="cancelar-resposta">Cancelar</button>
            </div>
        </form>`}function Oa(a,t,{aberta:e=!1,respondendo:o="",textoResposta:n=""}={}){const i=ca(a),l=i.some(m=>m.uid===t.uid),f=a.fixa?"Resposta do Futuro+":i.length?i.length===1?"1 resposta":`${i.length} respostas`:"Sem resposta ainda",h=!a.fixa&&a.autorUid===t.uid;let u="";a.fixa||(o===a.id?u=za(a,t,n):N(t)&&!l&&(u=`<button type="button" class="inst-botao inst-botao--pequeno" data-acao="responder" data-pergunta="${r(a.id)}">Responder</button>`));const d=!a.fixa&&(t.admin||h&&!i.length)?`<button type="button" class="inst-acao inst-acao--perigo" data-acao="apagar-pergunta" data-pergunta="${r(a.id)}">${h?"Apagar pergunta":"Apagar pergunta (admin)"}</button>`:"";return`
        <details class="inst-duvida${a.fixa?" inst-duvida--fixa":""}" data-pergunta="${r(a.id)}"${e?" open":""}>
            <summary>
                <span class="inst-duvida-texto">${r(a.texto)}</span>
                <span class="inst-duvida-info${!a.fixa&&!i.length?" inst-duvida-info--sem":""}">${f}</span>
                <span class="inst-duvida-seta">${c.abrir}</span>
            </summary>
            <div class="inst-duvida-corpo">
                ${a.fixa?"":`<p class="inst-duvida-quem">Pergunta de ${r(C(a.nome)||"alguém")}${a.criadaEm?` · ${r(P(a.criadaEm))}`:""}</p>`}
                ${i.length?`<ol class="inst-respostas">${i.map(m=>Ia(m,a,t)).join("")}</ol>`:'<p class="inst-vazio">Ninguém respondeu ainda.</p>'}
                ${u||d?`<div class="inst-duvida-rodape">${u}${d?`<div class="inst-acoes">${d}</div>`:""}</div>`:""}
            </div>
        </details>`}function Ra(){return`
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
        </form>`}function ja({fixas:a=[],perguntas:t=[],haMais:e=!1,conta:o={},abertas:n=new Set,perguntando:i=!1,respondendo:l="",textoResposta:f=""}={}){let h="";o.carregando||i?h="":ia(o)?h='<button type="button" class="inst-botao inst-botao--pequeno" data-acao="perguntar">Fazer uma pergunta</button>':h='<a class="inst-botao inst-botao--pequeno inst-botao--claro" href="login.html">Entre para perguntar</a>';const u=[...t,...a];return`
        <header class="inst-cartao-topo">
            <h2><span class="inst-titulo-icone">${c.duvida}</span>Dúvidas frequentes</h2>
            ${h}
        </header>
        <p class="inst-cartao-sub">Qualquer pessoa com conta pergunta. Quem estudou aqui e a equipe do Futuro+ respondem.</p>
        ${i?Ra():""}
        <div class="inst-duvidas">
            ${u.map(d=>Oa(d,o,{aberta:n.has(d.id)||l===d.id,respondendo:l,textoResposta:f})).join("")}
        </div>
        ${e?'<button type="button" class="inst-ver-mais" data-acao="mais-perguntas">Ver mais perguntas</button>':""}`}function Ta(a){return`
        <div class="inst-cartao inst-nao-encontrada">
            <p>${r(a)}</p>
            <a class="inst-botao" href="instituicoes.html">Ver todas as instituições</a>
        </div>`}const v=a=>document.getElementById(a),s={id:"",unidade:null,cursos:[],todosOsCursos:!1,avaliacao:void 0,comentarios:[],cursorComentarios:null,haMaisComentarios:!1,meusComentarios:[],editandoId:null,fixas:[],perguntas:[],cursorPerguntas:null,haMaisPerguntas:!1,abertas:new Set,perguntando:!1,respondendo:"",textoResposta:"",conta:{logado:!1,carregando:!0}};function D(){const a=new Set(s.meusComentarios.map(t=>t.certificadoId));s.conta={...s.conta,certificadosDisponiveis:(s.conta.certificados||[]).filter(t=>!a.has(t.id))}}function A(){v("inst-numeros").innerHTML=ka(s.unidade,s.cursos,s.avaliacao)}function B(){v("inst-cursos").innerHTML=Pa(s.cursos,{todos:s.todosOsCursos})}function b(){v("quem-estudou").innerHTML=Da({comentarios:s.comentarios,total:s.avaliacao?s.avaliacao.total:s.comentarios.length,haMais:s.haMaisComentarios,conta:s.conta,meusComentarios:s.meusComentarios,editandoId:s.editandoId})}function g(){v("duvidas").innerHTML=ja({fixas:s.fixas,perguntas:s.perguntas,haMais:s.haMaisPerguntas,conta:s.conta,abertas:s.abertas,perguntando:s.perguntando,respondendo:s.respondendo,textoResposta:s.textoResposta})}function Q({somar:a=null,tirar:t=null}){const e=s.avaliacao||{media:0,total:0};let o=e.media*e.total,n=e.total;t!=null&&(o-=t,n-=1),a!=null&&(o+=a,n+=1),n=Math.max(0,n),s.avaliacao={media:n?o/n:0,total:n},A()}function S(a,t){document.title="Futuro+ | Instituições",v("inst-capa-miolo").innerHTML=Sa(a),v("inst-carregando").outerHTML=Ta(t)}function k(){const a=location.hash.length>1&&document.getElementById(decodeURIComponent(location.hash.slice(1)));a&&a.scrollIntoView({block:"start"})}const L=a=>setTimeout(()=>document.querySelector(a)?.focus(),0);function y(a,t){const e=a.querySelector(".inst-form-erro");e.textContent=t,e.hidden=!1}function I(a,t){const e=a.querySelector('button[type="submit"]');e.dataset.rotulo=e.textContent,e.disabled=!0,e.textContent=t}function z(a){const t=a.querySelector('button[type="submit"]');t.disabled=!1,t.textContent=t.dataset.rotulo||t.textContent}function M(a,t){return console.error(a),a?.code==="permission-denied"?t:"Não deu para salvar agora. Confira a conexão e tente de novo."}const G="O servidor não aceitou. Confira se o certificado desta unidade continua no seu Mural e tente de novo.";async function Fa(a){const t=Number(a.querySelector('input[name="nota"]:checked')?.value||0),e=a.querySelector("textarea").value,o=a.querySelector("#comentario-certificado")?.value||"",n=t?o?w(e,x.comentario):"Não encontrei o certificado para este comentário. Atualize a página e tente de novo.":"Escolha uma nota de 1 a 5.";if(n)return y(a,n);const i=s.editandoId?s.meusComentarios.find(l=>l.id===s.editandoId):null;I(a,"Salvando...");try{const l=await fa(s.id,s.conta,{texto:e,nota:t,certificadoId:o},i);s.meusComentarios=[...s.meusComentarios.filter(f=>f.id!==l.id),l],s.comentarios=s.comentarios.filter(f=>f.id!==l.id),s.editandoId=null,Q(i?{tirar:i.nota,somar:t}:{somar:t}),D(),b()}catch(l){y(a,M(l,G)),z(a)}}async function Na(a,t){const e=s.meusComentarios.some(i=>i.id===a),o=e?s.meusComentarios.find(i=>i.id===a):s.comentarios.find(i=>i.id===a),n=e?"Apagar o seu comentário e a sua nota?":`Apagar o comentário de ${C(o?.nome)||"quem escreveu"}?`;if(confirm(n)){t.disabled=!0;try{await ga(s.id,a),s.comentarios=s.comentarios.filter(i=>i.id!==a),e&&(s.meusComentarios=s.meusComentarios.filter(i=>i.id!==a),s.editandoId===a&&(s.editandoId=null),D()),o?.nota&&Q({tirar:o.nota}),b()}catch(i){t.disabled=!1,alert(M(i,"O servidor não aceitou apagar este comentário."))}}}async function Ha(a){a.disabled=!0;try{const{itens:t,cursor:e,haMais:o}=await H(s.id,{depois:s.cursorComentarios}),n=new Set(s.comentarios.map(i=>i.id));s.comentarios.push(...t.filter(i=>!n.has(i.id))),s.cursorComentarios=e,s.haMaisComentarios=o,b()}catch(t){console.error("Erro ao ler mais comentários:",t),a.disabled=!1}}const q=a=>s.perguntas.find(t=>t.id===a);async function Ua(a){const t=a.querySelector("textarea").value,e=w(t,x.pergunta);if(e)return y(a,e);I(a,"Enviando...");try{const o=await ha(s.id,s.conta,t);s.perguntas=[o,...s.perguntas],s.perguntando=!1,s.abertas.add(o.id),g()}catch(o){y(a,M(o,"O servidor não aceitou a pergunta. Confirme o e-mail da sua conta e tente de novo.")),z(a)}}async function Va(a,t){const e=a.querySelector("textarea").value,o=w(e,x.resposta);if(o)return y(a,o);I(a,"Salvando...");try{const n=await va(s.id,t,s.conta,e),i=q(t);i.respostas={...i.respostas||{},[s.conta.uid]:n},s.respondendo="",s.textoResposta="",s.abertas.add(t),g()}catch(n){y(a,M(n,s.conta.certificados?.length?G:"O servidor não aceitou a resposta.")),z(a)}}async function _a(a,t,e){const o=q(a);if(!o)return;const n=t===s.conta.uid,i=o.respostas?.[t]?.equipe?"da Equipe Futuro+":`de ${C(o.respostas?.[t]?.nome)||"quem respondeu"}`;if(confirm(n?"Apagar a sua resposta?":`Apagar a resposta ${i}?`)){e.disabled=!0;try{await ba(s.id,a,t);const l={...o.respostas||{}};delete l[t],o.respostas=l,g()}catch(l){e.disabled=!1,alert(M(l,"O servidor não aceitou apagar esta resposta."))}}}async function Ba(a,t){const e=q(a);if(!e)return;const o=Object.keys(e.respostas||{}).length>0;if(confirm(o?"Apagar esta pergunta? As respostas somem junto.":"Apagar esta pergunta?")){t.disabled=!0;try{await $a(s.id,a),s.perguntas=s.perguntas.filter(n=>n.id!==a),s.abertas.delete(a),g()}catch(n){t.disabled=!1,alert(M(n,"O servidor não aceitou apagar esta pergunta."))}}}async function Qa(a){a.disabled=!0;try{const{itens:t,cursor:e,haMais:o}=await U(s.id,{depois:s.cursorPerguntas}),n=new Set(s.perguntas.map(i=>i.id));s.perguntas.push(...t.filter(i=>!n.has(i.id))),s.cursorPerguntas=e,s.haMaisPerguntas=o,g()}catch(t){console.error("Erro ao ler mais perguntas:",t),a.disabled=!1}}function Ga(a){const t=a.target.closest("[data-acao]");if(t)switch(t.dataset.acao){case"editar-comentario":s.editandoId=t.dataset.id,b(),L("#comentario-texto");break;case"cancelar-comentario":s.editandoId=null,b();break;case"apagar-comentario":Na(t.dataset.id,t);break;case"mais-comentarios":Ha(t);break}}function Ja(a){const t=a.target.closest("[data-acao]");if(!t)return;const e=t.dataset.pergunta||"";switch(t.dataset.acao){case"perguntar":s.perguntando=!0,g(),L("#pergunta-texto");break;case"cancelar-pergunta":s.perguntando=!1,g();break;case"responder":case"editar-resposta":s.respondendo=e,s.textoResposta=t.dataset.acao==="editar-resposta"&&q(e)?.respostas?.[s.conta.uid]?.texto||"",s.abertas.add(e),g(),L(`#resposta-${CSS.escape(e)}`);break;case"cancelar-resposta":s.respondendo="",s.textoResposta="",g();break;case"apagar-resposta":_a(e,t.dataset.uid,t);break;case"apagar-pergunta":Ba(e,t);break;case"mais-perguntas":Qa(t);break}}function T(a){if(a.target.tagName!=="TEXTAREA")return;const t=a.target.closest("form")?.querySelector("[data-contador]");t&&(t.textContent=`${a.target.value.length}/${a.target.maxLength}`)}function Ka(){v("inst-cursos").addEventListener("click",e=>{e.target.closest('[data-acao="todos-os-cursos"]')&&(s.todosOsCursos=!0,B())});const a=v("quem-estudou");a.addEventListener("click",Ga),a.addEventListener("submit",e=>{e.target.id==="form-comentario"&&(e.preventDefault(),Fa(e.target))});const t=v("duvidas");t.addEventListener("click",Ja),t.addEventListener("submit",e=>{const o=e.target;o.id==="form-pergunta"?(e.preventDefault(),Ua(o)):o.dataset.form==="resposta"&&(e.preventDefault(),Va(o,o.dataset.pergunta))}),t.addEventListener("toggle",e=>{const o=e.target;o.matches?.("details[data-pergunta]")&&(o.open?s.abertas.add(o.dataset.pergunta):s.abertas.delete(o.dataset.pergunta))},!0),a.addEventListener("input",T),t.addEventListener("input",T)}async function Xa(){const a=new URLSearchParams(location.search).get("u")||"";if(!a||a.includes("/")){S("Instituição não encontrada","O endereço está incompleto. Escolha a unidade na lista de instituições.");return}s.id=a;let t=null;try{t=await da(a)}catch(o){console.error("Erro ao ler a unidade:",o),S("Não deu para abrir esta instituição","Confira a conexão e tente de novo em instantes.");return}if(!t){S("Instituição não encontrada","A unidade pode ter saído do cadastro. Procure por ela na lista de instituições.");return}s.unidade=t,s.cursos=la(t),s.fixas=ua(t,s.cursos),document.title=`Futuro+ | ${t.nome}`;const e=t.municipio?` em ${t.municipio}`:"";Ma(`${t.nome}${e}: veja os cursos oferecidos, avaliações de quem estudou lá e tire dúvidas sobre a instituição no Futuro+.`),v("inst-capa-miolo").innerHTML=qa(t,s.cursos),A(),v("inst-sobre").innerHTML=La(t,s.cursos),B(),b(),g(),v("inst-carregando").hidden=!0,v("inst-conteudo").hidden=!1,Ka(),k(),pa(a).then(o=>{s.avaliacao=o}).catch(o=>{console.error("Erro ao ler a média das notas:",o),s.avaliacao=null}).finally(()=>{A(),b()}),H(a).then(({itens:o,cursor:n,haMais:i})=>{s.comentarios=o,s.cursorComentarios=n,s.haMaisComentarios=i,b(),location.hash==="#quem-estudou"&&k()}).catch(o=>console.error("Erro ao ler os comentários:",o)),U(a).then(({itens:o,cursor:n,haMais:i})=>{s.perguntas=o,s.cursorPerguntas=n,s.haMaisPerguntas=i,g(),location.hash==="#duvidas"&&k()}).catch(o=>console.error("Erro ao ler as dúvidas:",o)),ma(a,async o=>{if(s.editandoId=null,s.respondendo="",s.perguntando=!1,s.meusComentarios=[],o.logado&&o.certificados?.length)try{s.meusComentarios=await xa(a,o.uid)}catch(n){console.error("Erro ao ler os seus comentários:",n)}s.conta=o,D(),b(),g()})}document.addEventListener("DOMContentLoaded",Xa);
