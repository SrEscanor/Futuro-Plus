// Monta o HTML da página de uma instituição a partir dos dados já lidos.
// Não fala com o Firebase: recebe tudo pronto de instituicao.js.
import { escapeHtml, LOGO_FALLBACK, logoDaUnidade } from './card-unidade.js';
import {
    CURSOS_VISIVEIS, FOTO_PADRAO, LIMITES, dataCurta, estrelasDaNota, fotoDaUnidade, linkDoMapa,
    linkDoTelefone, linkSeguro, partesDoEndereco, podeComentar, podePerguntar, podeResponder,
    primeiroNome, quantasAvaliacoes, respostasEmOrdem, rotuloDoAutor, selosDaUnidade, siteSemProtocolo,
    telefonePrincipal, textoDaNota, textoSobre
} from './instituicao-util.js';

const svg = (corpo, tamanho = 20) => `<svg width="${tamanho}" height="${tamanho}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${corpo}</svg>`;

const ICONES = {
    local: svg('<path d="M12 21s-7-6.2-7-12a7 7 0 0 1 14 0c0 5.8-7 12-7 12z"/><circle cx="12" cy="9" r="2.6"/>', 16),
    capelo: svg('<path d="M2 9.5 12 5l10 4.5-10 4.5L2 9.5z"/><path d="M6 11.6V16c0 1.4 2.7 3 6 3s6-1.6 6-3v-4.4"/><path d="M22 9.5v5"/>'),
    telefone: svg('<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/>'),
    estrela: svg('<path d="m12 2.8 2.8 5.8 6.4.9-4.6 4.5 1.1 6.3L12 17.3l-5.7 3 1.1-6.3-4.6-4.5 6.4-.9L12 2.8z"/>'),
    mapa: svg('<path d="M12 21s-7-6.2-7-12a7 7 0 0 1 14 0c0 5.8-7 12-7 12z"/><circle cx="12" cy="9" r="2.6"/>'),
    livro: svg('<path d="M2 5.5A2.5 2.5 0 0 1 4.5 3H11v17H4.5A2.5 2.5 0 0 0 2 22.5z"/><path d="M22 5.5A2.5 2.5 0 0 0 19.5 3H13v17h6.5a2.5 2.5 0 0 1 2.5 2.5z"/>'),
    balao: svg('<path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 9 9 0 0 1-3.9-.9L3 20.5l1.5-4.6A8.4 8.4 0 1 1 21 11.5z"/>'),
    duvida: svg('<circle cx="12" cy="12" r="9.5"/><path d="M9.2 9a3 3 0 0 1 5.8 1c0 2-3 2.6-3 4.4"/><path d="M12 17.6h.01"/>'),
    cadeado: svg('<rect x="4.5" y="10.5" width="15" height="10.5" rx="2.5"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/>'),
    verificado: svg('<circle cx="12" cy="12" r="9.5"/><path d="m8 12.4 2.7 2.6L16.2 9.6"/>', 14),
    seta: svg('<path d="M5 12h14M13 6l6 6-6 6"/>', 16),
    voltar: svg('<path d="M19 12H5M11 6l-6 6 6 6"/>', 16),
    externo: svg('<path d="M7 17 17 7M9 7h8v8"/>', 14),
    abrir: svg('<path d="m6 9 6 6 6-6"/>', 18),
    site: svg('<circle cx="12" cy="12" r="9.5"/><path d="M2.5 12h19M12 2.5a14.6 14.6 0 0 1 0 19M12 2.5a14.6 14.6 0 0 0 0 19"/>', 18),
    instagram: svg('<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><path d="M17.5 6.5h.01"/>', 18),
    facebook: svg('<path d="M15 3h-2.5A4.5 4.5 0 0 0 8 7.5V10H5.5v4H8v7h4v-7h2.6l.9-4H12V7.8c0-.6.4-.8 1-.8h2z"/>', 18),
    predio: svg('<path d="M3 21h18M5 21V10l7-5 7 5v11"/><path d="M9.5 21v-5h5v5M9 11.5h.01M15 11.5h.01"/>', 16),
    pessoas: svg('<circle cx="9" cy="8" r="3.2"/><path d="M3 20a6 6 0 0 1 12 0"/><path d="M16 4.9a3.2 3.2 0 0 1 0 6.2M18 20a6 6 0 0 0-3-5.2"/>', 16),
    nivel: svg('<path d="M2 9.5 12 5l10 4.5-10 4.5L2 9.5z"/><path d="M6 11.6V16c0 1.4 2.7 3 6 3s6-1.6 6-3v-4.4"/>', 16)
};

const ICONE_DO_SELO = { nivel: ICONES.nivel, publica: ICONES.predio, forma: ICONES.pessoas };

function estrelasHtml(media, classe = 'inst-estrelas') {
    const desenho = { cheia: '★', meia: '★', vazia: '★' };
    return `<span class="${classe}" aria-hidden="true">${estrelasDaNota(media)
        .map((tipo) => `<span class="inst-estrela inst-estrela--${tipo}">${desenho[tipo]}</span>`).join('')}</span>`;
}

const inicial = (nome) => escapeHtml((primeiroNome(nome)[0] || '?').toUpperCase());

// ---- Topo ----
// A foto da fachada vem do site do CPS (botão em Admin · Unidades); sem
// ela, ou se o endereço parar de funcionar, entra a ilustração da Central.

export function htmlCapa(unidade, cursos) {
    const foto = fotoDaUnidade(unidade);
    const local = unidade.municipio ? `${unidade.municipio}, SP` : '';
    const selos = selosDaUnidade(unidade, cursos);
    return `
        <img class="inst-capa-foto${foto ? '' : ' inst-capa-foto--padrao'}" src="${escapeHtml(foto || FOTO_PADRAO)}" alt="" fetchpriority="high"
            onerror="this.onerror=null;this.src='${FOTO_PADRAO}';this.classList.add('inst-capa-foto--padrao')">
        <div class="home-hero-conteudo inst-capa-conteudo">
            <a class="inst-capa-voltar" href="instituicoes.html">${ICONES.voltar} Todas as instituições</a>
            <div class="inst-capa-identidade">
                <div class="inst-capa-logo">
                    <img src="${logoDaUnidade(unidade)}" alt="Logo da ${escapeHtml(unidade.nome)}"
                        onerror="this.onerror=null;this.src='${LOGO_FALLBACK}';">
                </div>
                <div class="inst-capa-texto">
                    <h1>${escapeHtml(unidade.nome)}</h1>
                    ${local ? `<p class="inst-capa-local">${ICONES.local} ${escapeHtml(local)}</p>` : ''}
                    ${selos.length ? `<ul class="inst-capa-selos">${selos.map((selo) => `
                        <li>${ICONE_DO_SELO[selo.icone] || ''}${escapeHtml(selo.texto)}</li>`).join('')}
                    </ul>` : ''}
                </div>
            </div>
        </div>`;
}

// Topo de quando não há unidade para mostrar (endereço errado ou erro)
export function htmlCapaSimples(titulo) {
    return `
        <div class="home-hero-conteudo inst-capa-conteudo">
            <a class="inst-capa-voltar" href="instituicoes.html">${ICONES.voltar} Todas as instituições</a>
            <h1>${escapeHtml(titulo)}</h1>
        </div>`;
}

// ---- Os quatro números ----
// avaliacao: { media, total }; undefined enquanto a nota ainda está chegando

export function htmlNumeros(unidade, cursos, avaliacao) {
    const modalidades = new Set(cursos.flatMap((c) => c.modalidades.map((m) => m.chave)));
    const subCursos = !cursos.length ? 'Ainda sem lista no cadastro'
        : modalidades.size === 1 ? cursos[0].modalidades[0].rotulo
            : `em ${modalidades.size} modalidades`;

    const telefone = telefonePrincipal(unidade.telefone);
    const linkTelefone = linkDoTelefone(unidade.telefone);
    const site = linkSeguro(unidade.site);

    const temNota = avaliacao && avaliacao.total > 0;
    const endereco = partesDoEndereco(unidade);
    const mapa = linkDoMapa(unidade);

    return `
        <article class="inst-numero">
            <span class="inst-numero-icone inst-numero-icone--azul">${ICONES.capelo}</span>
            <div class="inst-numero-textos">
                <span class="inst-numero-rotulo">Cursos oferecidos</span>
                <a class="inst-numero-valor" href="#inst-cursos">${cursos.length === 1 ? '1 curso' : `${cursos.length} cursos`}</a>
                <span class="inst-numero-sub">${escapeHtml(subCursos)}</span>
            </div>
        </article>
        <article class="inst-numero">
            <span class="inst-numero-icone inst-numero-icone--verde">${ICONES.telefone}</span>
            <div class="inst-numero-textos">
                <span class="inst-numero-rotulo">Contato</span>
                ${telefone
                    ? (linkTelefone ? `<a class="inst-numero-valor" href="${linkTelefone}">${escapeHtml(telefone)}</a>` : `<strong class="inst-numero-valor">${escapeHtml(telefone)}</strong>`)
                    : '<strong class="inst-numero-valor inst-numero-valor--vazio">Sem telefone</strong>'}
                ${site ? `<a class="inst-numero-sub inst-numero-link" href="${escapeHtml(site)}" target="_blank" rel="noopener">${escapeHtml(siteSemProtocolo(unidade.site))} ${ICONES.externo}</a>`
                    : '<span class="inst-numero-sub">Sem site no cadastro</span>'}
            </div>
        </article>
        <article class="inst-numero">
            <span class="inst-numero-icone inst-numero-icone--ouro">${ICONES.estrela}</span>
            <div class="inst-numero-textos">
                <span class="inst-numero-rotulo">Avaliação</span>
                ${avaliacao === undefined ? `
                <strong class="inst-numero-valor inst-numero-valor--vazio">...</strong>
                <span class="inst-numero-sub">Carregando as notas</span>`
                : temNota ? `
                <span class="inst-numero-valor inst-numero-valor--nota">
                    <strong>${textoDaNota(avaliacao.media)}</strong><span class="inst-numero-de">/ 5</span>
                    ${estrelasHtml(avaliacao.media)}
                </span>
                <a class="inst-numero-sub inst-numero-link" href="#quem-estudou">${quantasAvaliacoes(avaliacao.total)}</a>`
                : `
                <strong class="inst-numero-valor inst-numero-valor--vazio">Sem notas ainda</strong>
                <span class="inst-numero-sub">Só quem estudou aqui avalia</span>`}
            </div>
        </article>
        <article class="inst-numero inst-numero--endereco">
            <span class="inst-numero-icone inst-numero-icone--coral">${ICONES.mapa}</span>
            <div class="inst-numero-textos">
                <div class="inst-numero-cabeca">
                    <span class="inst-numero-rotulo">Endereço</span>
                    ${mapa ? `<a class="inst-mapa" href="${escapeHtml(mapa)}" target="_blank" rel="noopener">${ICONES.local} Ver no Google Maps ${ICONES.externo}</a>` : ''}
                </div>
                <strong class="inst-numero-valor inst-numero-valor--texto">${escapeHtml(endereco.rua || endereco.resto || 'Sem endereço no cadastro')}</strong>
                ${endereco.rua && endereco.resto ? `<span class="inst-numero-sub">${escapeHtml(endereco.resto)}</span>` : ''}
            </div>
        </article>`;
}

// ---- Sobre ----

function linkDaRede(rede) {
    const nome = String(rede?.rede || '').toLowerCase();
    const url = linkSeguro(rede?.url);
    if (!url) return '';
    const icone = nome === 'instagram' ? ICONES.instagram : nome === 'facebook' ? ICONES.facebook : ICONES.site;
    return `<li><a class="inst-link" href="${escapeHtml(url)}" target="_blank" rel="noopener">${icone}${escapeHtml(rede.rede)}</a></li>`;
}

export function htmlSobre(unidade, cursos) {
    const site = linkSeguro(unidade.site);
    const paginaCps = linkSeguro(unidade.paginaCps);
    const links = [
        site ? `<li><a class="inst-link" href="${escapeHtml(site)}" target="_blank" rel="noopener">${ICONES.site}Site da unidade</a></li>` : '',
        ...(unidade.redesSociais || []).map(linkDaRede),
        paginaCps ? `<li><a class="inst-link" href="${escapeHtml(paginaCps)}" target="_blank" rel="noopener">${ICONES.predio}Página no Centro Paula Souza</a></li>` : ''
    ].filter(Boolean);
    return `
        <header class="inst-cartao-topo">
            <h2><span class="inst-titulo-icone">${ICONES.livro}</span>Sobre a instituição</h2>
        </header>
        <p class="inst-sobre-texto">${escapeHtml(textoSobre(unidade, cursos))}</p>
        ${links.length ? `<ul class="inst-links">${links.join('')}</ul>` : ''}`;
}

// ---- Cursos ----

export function htmlCursos(cursos, { todos = false } = {}) {
    if (!cursos.length) {
        return `
            <header class="inst-cartao-topo"><h2><span class="inst-titulo-icone">${ICONES.capelo}</span>Cursos oferecidos</h2></header>
            <p class="inst-vazio">O cadastro desta unidade ainda não tem a lista de cursos.</p>`;
    }
    const visiveis = todos ? cursos : cursos.slice(0, CURSOS_VISIVEIS);
    const escondidos = cursos.length - visiveis.length;
    return `
        <header class="inst-cartao-topo">
            <h2><span class="inst-titulo-icone">${ICONES.capelo}</span>Cursos oferecidos</h2>
            <span class="inst-contagem">${cursos.length === 1 ? '1 curso' : `${cursos.length} cursos`}</span>
        </header>
        <p class="inst-cartao-sub">Toque em um curso para ver o que se aprende e onde dá para trabalhar.</p>
        <ul class="inst-cursos">
            ${visiveis.map((curso) => `
            <li>
                <a class="inst-curso inst-curso--${curso.modalidades[0].chave}" href="curso.html?c=${encodeURIComponent(curso.slug)}">
                    <span class="inst-curso-icone">${ICONES.capelo}</span>
                    <span class="inst-curso-textos">
                        <strong>${escapeHtml(curso.nome)}</strong>
                        <span class="inst-curso-modalidades">${curso.modalidades.map((m) => `<span>${escapeHtml(m.rotulo)}</span>`).join('')}</span>
                    </span>
                    <span class="inst-curso-seta">${ICONES.seta}</span>
                </a>
            </li>`).join('')}
        </ul>
        ${escondidos > 0 ? `<button type="button" class="inst-ver-mais" data-acao="todos-os-cursos">Ver todos os ${cursos.length} cursos</button>` : ''}`;
}

// ---- Quem estudou aqui ----

function caixaDeAcesso(conta) {
    if (!conta?.logado) {
        return `
        <div class="inst-acesso">
            <span class="inst-acesso-icone">${ICONES.cadeado}</span>
            <div>
                <strong>Estudou aqui?</strong>
                <p>Entre na sua conta e pendure no Mural o certificado desta unidade. Com ele, você comenta, avalia e responde dúvidas.</p>
                <div class="inst-botoes">
                    <a class="inst-botao" href="login.html">Entrar</a>
                    <a class="inst-botao inst-botao--claro" href="cadastro.html">Criar conta</a>
                </div>
            </div>
        </div>`;
    }
    return `
        <div class="inst-acesso">
            <span class="inst-acesso-icone">${ICONES.cadeado}</span>
            <div>
                <strong>Estudou aqui?</strong>
                <p>Pendure no Mural o certificado desta unidade. Quando a leitura do certificado encontrar o nome da escola, você comenta, avalia e responde dúvidas.</p>
                <div class="inst-botoes">
                    <a class="inst-botao" href="mural.html">Ir para o Mural</a>
                </div>
            </div>
        </div>`;
}

export function htmlFormComentario(conta, atual = null) {
    const certificado = conta.certificado;
    const nota = atual?.nota || 0;
    const texto = atual?.texto || '';
    const quem = [primeiroNome(conta.nome), certificado.titulo, certificado.anoConclusao].filter(Boolean).map(escapeHtml);
    return `
        <form class="inst-form" id="form-comentario" novalidate>
            <strong class="inst-form-titulo">${atual ? 'Editar seu comentário' : 'Como foi estudar aqui?'}</strong>
            <fieldset class="inst-nota-campo">
                <legend>Sua nota</legend>
                <div class="inst-nota-opcoes">
                    ${[5, 4, 3, 2, 1].map((n) => `
                    <input type="radio" id="nota-${n}" name="nota" value="${n}"${n === nota ? ' checked' : ''}>
                    <label for="nota-${n}" title="${n} de 5">★<span class="sr-only">${n} de 5</span></label>`).join('')}
                </div>
            </fieldset>
            <label class="sr-only" for="comentario-texto">Seu comentário</label>
            <textarea id="comentario-texto" name="texto" rows="4" maxlength="${LIMITES.comentario.max}"
                placeholder="Conte como são as aulas, os professores e a estrutura: o que ajudaria quem está pensando em estudar aqui.">${escapeHtml(texto)}</textarea>
            <div class="inst-form-rodape">
                <span>Aparece como <strong>${quem.join('</strong> · ')}</span>
                <span class="inst-form-contador" data-contador>${texto.length}/${LIMITES.comentario.max}</span>
            </div>
            <p class="inst-form-erro" role="alert" hidden></p>
            <div class="inst-botoes">
                <button type="submit" class="inst-botao">${atual ? 'Salvar' : 'Publicar'}</button>
                ${atual ? '<button type="button" class="inst-botao inst-botao--claro" data-acao="cancelar-comentario">Cancelar</button>' : ''}
            </div>
        </form>`;
}

// meu: o comentário de quem está vendo; podeEditar: o certificado ainda está
// no Mural (sem ele, dá só para apagar)
function htmlComentario(comentario, { meu = false, admin = false, podeEditar = true } = {}) {
    const editado = comentario.editadoEm ? ' (editado)' : '';
    const acoes = meu
        ? `<div class="inst-acoes">
                ${podeEditar ? '<button type="button" class="inst-acao" data-acao="editar-comentario">Editar</button>' : ''}
                <button type="button" class="inst-acao inst-acao--perigo" data-acao="apagar-comentario" data-uid="${escapeHtml(comentario.uid)}">Apagar</button>
           </div>`
        : admin
            ? `<div class="inst-acoes"><button type="button" class="inst-acao inst-acao--perigo" data-acao="apagar-comentario" data-uid="${escapeHtml(comentario.uid)}">Apagar (admin)</button></div>`
            : '';
    return `
        <li class="inst-comentario${meu ? ' inst-comentario--meu' : ''}">
            <div class="inst-comentario-topo">
                <span class="inst-avatar">${inicial(comentario.nome)}</span>
                <div class="inst-comentario-autor">
                    <div class="inst-autor-linha">
                        <strong>${escapeHtml(primeiroNome(comentario.nome))}${meu ? ' <span class="inst-voce">você</span>' : ''}</strong>
                        <time class="inst-data">${escapeHtml(dataCurta(comentario.criadoEm))}${editado}</time>
                    </div>
                    <span class="inst-verificado">${ICONES.verificado}${escapeHtml(rotuloDoAutor(comentario))}</span>
                </div>
            </div>
            ${comentario.nota ? `<div class="inst-comentario-nota" role="img" aria-label="Nota ${comentario.nota} de 5">${estrelasHtml(comentario.nota)}</div>` : ''}
            <p class="inst-comentario-texto">${escapeHtml(comentario.texto)}</p>
            ${acoes}
        </li>`;
}

// estado: { comentarios: [...], total, haMais, conta, meuComentario, editando }
// conta.carregando: o login ainda não respondeu (o alto fica vazio, sem piscar
// o convite de entrar para quem já está logado)
export function htmlQuemEstudou({ comentarios = [], total = 0, haMais = false, conta = {}, meuComentario = null, editando = false } = {}) {
    const outros = comentarios.filter((c) => !conta.uid || c.uid !== conta.uid);
    let topo = '';
    if (conta.carregando) {
        topo = '';
    } else if (meuComentario && !(editando && podeComentar(conta))) {
        topo = `<ol class="inst-comentarios">${htmlComentario(meuComentario, { meu: true, podeEditar: podeComentar(conta) })}</ol>`;
    } else if (podeComentar(conta)) {
        topo = htmlFormComentario(conta, editando ? meuComentario : null);
    } else {
        topo = caixaDeAcesso(conta);
    }
    const lista = outros.length
        ? `<ol class="inst-comentarios">${outros.map((c) => htmlComentario(c, { admin: conta.admin })).join('')}</ol>`
        : (!meuComentario ? '<p class="inst-vazio">Ninguém comentou ainda. Quem estudou aqui pode ser a primeira pessoa a contar como foi.</p>' : '');
    return `
        <header class="inst-cartao-topo">
            <h2><span class="inst-titulo-icone">${ICONES.balao}</span>Quem estudou aqui</h2>
            <span class="inst-contagem">${total === 1 ? '1 comentário' : `${total} comentários`}</span>
        </header>
        ${topo}
        ${lista}
        ${haMais ? '<button type="button" class="inst-ver-mais" data-acao="mais-comentarios">Ver mais comentários</button>' : ''}
        <p class="inst-rodape">Só comenta e avalia quem tem o certificado desta unidade conferido no Mural. As opiniões são de quem escreveu, não da escola.</p>`;
}

// ---- Dúvidas ----

function htmlResposta(resposta, pergunta, conta) {
    const minha = resposta.uid === conta.uid && !pergunta.fixa;
    const podeApagar = !pergunta.fixa && (minha || conta.admin);
    return `
        <li class="inst-resposta${resposta.equipe ? ' inst-resposta--equipe' : ''}">
            <div class="inst-resposta-autor">
                ${resposta.equipe
                    ? '<span class="inst-avatar inst-avatar--pequeno inst-avatar--equipe"><img src="/logo.png" alt="" width="18" height="18"></span>'
                    : `<span class="inst-avatar inst-avatar--pequeno">${inicial(resposta.nome)}</span>`}
                <div class="inst-comentario-autor">
                    <div class="inst-autor-linha">
                        <strong>${resposta.equipe ? 'Equipe Futuro+' : escapeHtml(primeiroNome(resposta.nome))}</strong>
                        ${resposta.em ? `<time class="inst-data">${escapeHtml(dataCurta(resposta.em))}</time>` : ''}
                    </div>
                    ${resposta.equipe ? '' : `<span class="inst-verificado">${ICONES.verificado}${escapeHtml(rotuloDoAutor(resposta))}</span>`}
                </div>
            </div>
            <p>${escapeHtml(resposta.texto)}</p>
            ${podeApagar ? `<div class="inst-acoes">
                ${minha && podeResponder(conta) ? `<button type="button" class="inst-acao" data-acao="editar-resposta" data-pergunta="${escapeHtml(pergunta.id)}">Editar</button>` : ''}
                <button type="button" class="inst-acao inst-acao--perigo" data-acao="apagar-resposta" data-pergunta="${escapeHtml(pergunta.id)}" data-uid="${escapeHtml(resposta.uid)}">${minha ? 'Apagar' : 'Apagar (admin)'}</button>
            </div>` : ''}
        </li>`;
}

export function htmlFormResposta(pergunta, conta, atual = '') {
    const quem = conta.admin && !conta.certificado
        ? 'Equipe Futuro+'
        : [primeiroNome(conta.nome), conta.certificado?.titulo, conta.certificado?.anoConclusao].filter(Boolean).join(' · ');
    return `
        <form class="inst-form inst-form--resposta" data-form="resposta" data-pergunta="${escapeHtml(pergunta.id)}" novalidate>
            <label class="sr-only" for="resposta-${escapeHtml(pergunta.id)}">Sua resposta</label>
            <textarea id="resposta-${escapeHtml(pergunta.id)}" name="texto" rows="3" maxlength="${LIMITES.resposta.max}"
                placeholder="Responda com o que você viveu aí.">${escapeHtml(atual)}</textarea>
            <div class="inst-form-rodape">
                <span>Aparece como <strong>${escapeHtml(quem)}</strong></span>
                <span class="inst-form-contador" data-contador>${atual.length}/${LIMITES.resposta.max}</span>
            </div>
            <p class="inst-form-erro" role="alert" hidden></p>
            <div class="inst-botoes">
                <button type="submit" class="inst-botao">${atual ? 'Salvar' : 'Responder'}</button>
                <button type="button" class="inst-botao inst-botao--claro" data-acao="cancelar-resposta">Cancelar</button>
            </div>
        </form>`;
}

function htmlPergunta(pergunta, conta, { aberta = false, respondendo = '', textoResposta = '' } = {}) {
    const respostas = respostasEmOrdem(pergunta);
    const jaRespondi = respostas.some((r) => r.uid === conta.uid);
    const info = pergunta.fixa
        ? 'Resposta do Futuro+'
        : respostas.length ? (respostas.length === 1 ? '1 resposta' : `${respostas.length} respostas`) : 'Sem resposta ainda';
    const minhaPergunta = !pergunta.fixa && pergunta.autorUid === conta.uid;
    let rodape = '';
    if (!pergunta.fixa) {
        if (respondendo === pergunta.id) rodape = htmlFormResposta(pergunta, conta, textoResposta);
        else if (podeResponder(conta) && !jaRespondi) {
            rodape = `<button type="button" class="inst-botao inst-botao--pequeno" data-acao="responder" data-pergunta="${escapeHtml(pergunta.id)}">Responder</button>`;
        }
    }
    const apagarPergunta = !pergunta.fixa && (conta.admin || (minhaPergunta && !respostas.length))
        ? `<button type="button" class="inst-acao inst-acao--perigo" data-acao="apagar-pergunta" data-pergunta="${escapeHtml(pergunta.id)}">${minhaPergunta ? 'Apagar pergunta' : 'Apagar pergunta (admin)'}</button>`
        : '';
    return `
        <details class="inst-duvida${pergunta.fixa ? ' inst-duvida--fixa' : ''}" data-pergunta="${escapeHtml(pergunta.id)}"${aberta ? ' open' : ''}>
            <summary>
                <span class="inst-duvida-texto">${escapeHtml(pergunta.texto)}</span>
                <span class="inst-duvida-info${!pergunta.fixa && !respostas.length ? ' inst-duvida-info--sem' : ''}">${info}</span>
                <span class="inst-duvida-seta">${ICONES.abrir}</span>
            </summary>
            <div class="inst-duvida-corpo">
                ${!pergunta.fixa ? `<p class="inst-duvida-quem">Pergunta de ${escapeHtml(primeiroNome(pergunta.nome) || 'alguém')}${pergunta.criadaEm ? ` · ${escapeHtml(dataCurta(pergunta.criadaEm))}` : ''}</p>` : ''}
                ${respostas.length ? `<ol class="inst-respostas">${respostas.map((r) => htmlResposta(r, pergunta, conta)).join('')}</ol>`
                    : '<p class="inst-vazio">Ninguém respondeu ainda.</p>'}
                ${rodape || apagarPergunta ? `<div class="inst-duvida-rodape">${rodape}${apagarPergunta ? `<div class="inst-acoes">${apagarPergunta}</div>` : ''}</div>` : ''}
            </div>
        </details>`;
}

export function htmlFormPergunta() {
    return `
        <form class="inst-form" id="form-pergunta" novalidate>
            <label class="inst-form-titulo" for="pergunta-texto">Qual é a sua dúvida sobre esta unidade?</label>
            <textarea id="pergunta-texto" name="texto" rows="2" maxlength="${LIMITES.pergunta.max}"
                placeholder="Ex.: Como é o estágio? Dá para conciliar o curso com o trabalho?"></textarea>
            <div class="inst-form-rodape">
                <span>Quem estudou aqui e a equipe do Futuro+ respondem.</span>
                <span class="inst-form-contador" data-contador>0/${LIMITES.pergunta.max}</span>
            </div>
            <p class="inst-form-erro" role="alert" hidden></p>
            <div class="inst-botoes">
                <button type="submit" class="inst-botao">Enviar pergunta</button>
                <button type="button" class="inst-botao inst-botao--claro" data-acao="cancelar-pergunta">Cancelar</button>
            </div>
        </form>`;
}

// estado: { fixas, perguntas, haMais, conta, abertas (Set de ids), perguntando, respondendo, textoResposta }
export function htmlDuvidas({ fixas = [], perguntas = [], haMais = false, conta = {}, abertas = new Set(),
    perguntando = false, respondendo = '', textoResposta = '' } = {}) {
    let acao = '';
    if (conta.carregando || perguntando) acao = '';
    else if (podePerguntar(conta)) acao = '<button type="button" class="inst-botao inst-botao--pequeno" data-acao="perguntar">Fazer uma pergunta</button>';
    else acao = '<a class="inst-botao inst-botao--pequeno inst-botao--claro" href="login.html">Entre para perguntar</a>';
    const todas = [...perguntas, ...fixas];
    return `
        <header class="inst-cartao-topo">
            <h2><span class="inst-titulo-icone">${ICONES.duvida}</span>Dúvidas frequentes</h2>
            ${acao}
        </header>
        <p class="inst-cartao-sub">Qualquer pessoa com conta pergunta. Quem estudou aqui e a equipe do Futuro+ respondem.</p>
        ${perguntando ? htmlFormPergunta() : ''}
        <div class="inst-duvidas">
            ${todas.map((p) => htmlPergunta(p, conta, { aberta: abertas.has(p.id) || respondendo === p.id, respondendo, textoResposta })).join('')}
        </div>
        ${haMais ? '<button type="button" class="inst-ver-mais" data-acao="mais-perguntas">Ver mais perguntas</button>' : ''}`;
}

// o título vai no topo (htmlCapaSimples); aqui fica a explicação
export function htmlNaoEncontrada(texto) {
    return `
        <div class="inst-cartao inst-nao-encontrada">
            <p>${escapeHtml(texto)}</p>
            <a class="inst-botao" href="instituicoes.html">Ver todas as instituições</a>
        </div>`;
}
