// A lateral da matéria (noticia.html), à direita no computador e depois da
// matéria no celular:
//   - Instagram: o cartão de perfil oficial do próprio Instagram, que já vem
//     no HTML (as postagens vêm direto de lá; nada fica guardado no site);
//   - Mais notícias: as últimas da página Notícias, sem a que está aberta,
//     com a mesma capa da Início (a foto ou a capa desenhada);
//   - Sugestões para você: a mesma regra dos "Cursos recomendados" da Início
//     (inicio-recomendacoes.js): quem fez teste vê os cursos que combinam com
//     o resultado; quem não fez vê os mais oferecidos e o convite para o teste.
//
// Custo por visita: 5 leituras do Firestore para as notícias e, para quem
// está logado, mais 1 do perfil. A oferta de cursos vem da lista resumida,
// que fica em cache (recomendacao-cursos.js).
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase-config.js';
import { listarNoticiasPublicadas } from './noticias-dados.js';
import {
    capaDesenhada, dataCurta, escapeHtml, imagemSegura, linkSeguro, rotulosDaNoticia, tempoRelativo
} from './noticias-util.js';
import { linkDaMateria } from './noticias-proprias-util.js';
import {
    carregarOfertaCursos,
    carregarRegioesSP,
    resolverLocalizacaoUsuario,
    calcularRecomendacoes,
    recomendacoesDoVocacional,
    cursosMaisOferecidos,
    textoMotivo,
    textoOferta,
    linkCurso
} from './recomendacao-cursos.js';
import { extrairResultadoMaisRecente, extrairResultadoVocacional } from './resultado-teste.js';
import { logoPadraoPorTipo, LOGO_FALLBACK, normalizar } from './card-unidade.js';

const QUANTAS_NOTICIAS = 4;
const QUANTAS_SUGESTOES = 3;

const listaNoticias = document.getElementById('lateral-noticias');
const listaSugestoes = document.getElementById('lateral-sugestoes');
const subSugestoes = document.getElementById('lateral-sugestoes-sub');
const chamadaTeste = document.getElementById('lateral-sugestoes-chamada');
let noticiasNaTela = [];

const aviso = (texto) => `<li class="lateral-aviso">${escapeHtml(texto)}</li>`;

// ------------------------------------------------------------------
// Mais notícias
// ------------------------------------------------------------------

function capa(noticia) {
    const foto = imagemSegura(noticia.imagem);
    const dentro = foto
        ? `<img src="${escapeHtml(foto)}" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer">`
        : capaDesenhada(noticia);
    return `<span class="lateral-capa" data-noticia="${escapeHtml(noticia.id)}">${dentro}</span>`;
}

function quando(noticia) {
    const tempo = tempoRelativo(noticia.publicadaEm);
    return tempo
        ? `<time datetime="${escapeHtml(noticia.publicadaEm)}" title="${escapeHtml(dataCurta(noticia.publicadaEm))}">${escapeHtml(tempo)}</time>`
        : '';
}

// a notícia própria abre a matéria aqui no site; as outras, o site de origem
function itemNoticia(noticia) {
    const titulo = String(noticia.titulo || '').trim() || 'Notícia sem título';
    const origem = noticia.propria ? 'Futuro+' : rotulosDaNoticia(noticia).map((rotulo) => rotulo.texto).join(' e ');
    const meta = [`<b>${escapeHtml(origem)}</b>`, quando(noticia)].filter(Boolean).join(' · ');
    const conteudo = `
        ${capa(noticia)}
        <span class="lateral-texto">
            <span class="lateral-titulo">${escapeHtml(titulo)}</span>
            <span class="lateral-meta">${meta}</span>
        </span>`;

    if (noticia.propria) {
        return `<li><a class="lateral-mini" href="${escapeHtml(linkDaMateria(noticia.id))}">${conteudo}</a></li>`;
    }
    const link = linkSeguro(noticia.link);
    if (!link) return `<li><div class="lateral-mini">${conteudo}</div></li>`;
    return `
        <li><a class="lateral-mini" href="${escapeHtml(link)}" target="_blank" rel="noopener noreferrer">
            ${conteudo}<span class="lateral-so-leitor"> (abre o site de origem em outra aba)</span>
        </a></li>`;
}

// idAtual: a matéria aberta, que não se repete na lista
export function montarMaisNoticias(noticias, idAtual = null) {
    if (!listaNoticias) return;
    noticiasNaTela = noticias.filter((noticia) => String(noticia.id) !== String(idAtual)).slice(0, QUANTAS_NOTICIAS);
    listaNoticias.innerHTML = noticiasNaTela.length
        ? noticiasNaTela.map(itemNoticia).join('')
        : aviso('Ainda não há outras notícias publicadas.');
}

// Foto que não carregou: entra a capa desenhada no lugar (como na Início).
// O evento "error" de imagem não sobe, por isso a captura.
listaNoticias?.addEventListener('error', (evento) => {
    const caixa = evento.target instanceof HTMLImageElement ? evento.target.closest('.lateral-capa') : null;
    if (!caixa) return;
    const noticia = noticiasNaTela.find((n) => String(n.id) === caixa.dataset.noticia);
    caixa.innerHTML = capaDesenhada(noticia || {});
}, true);

async function carregarNoticias() {
    if (!listaNoticias) return;
    const idAtual = new URLSearchParams(location.search).get('id');
    try {
        // uma a mais, porque a matéria aberta pode estar entre as últimas
        montarMaisNoticias(await listarNoticiasPublicadas(QUANTAS_NOTICIAS + 1), idAtual);
    } catch (erro) {
        console.error('Erro ao carregar as notícias da lateral:', erro);
        listaNoticias.innerHTML = aviso('Não foi possível carregar as notícias agora.');
    }
}

// ------------------------------------------------------------------
// Sugestões para você
// ------------------------------------------------------------------

function itemCurso(recomendacao, localizacao) {
    // a logo é a da unidade mais perto (um curso pode estar em Etec e Fatec)
    const maisPerto = recomendacao.unidades[0];
    const logo = maisPerto?.logotipoUrl || logoPadraoPorTipo(maisPerto?.tipo);
    const motivo = recomendacao.motivoTexto || textoMotivo(recomendacao);
    return `
        <li><a class="lateral-curso" href="${escapeHtml(linkCurso(recomendacao.nome))}">
            <span class="lateral-logo"><img src="${escapeHtml(logo)}" alt="" loading="lazy"
                onerror="this.onerror=null;this.src='${LOGO_FALLBACK}';"></span>
            <span class="lateral-texto">
                <span class="lateral-titulo">${escapeHtml(recomendacao.nome)}</span>
                ${motivo ? `<span class="lateral-motivo">${escapeHtml(motivo)}</span>` : ''}
                <span class="lateral-meta">${escapeHtml(textoOferta(recomendacao, localizacao))}</span>
            </span>
        </a></li>`;
}

// { personalizada, lista, localizacao }: personalizada = veio de um teste
export function montarSugestoes({ personalizada, lista, localizacao = null }) {
    if (!listaSugestoes) return;
    subSugestoes.hidden = false;
    subSugestoes.textContent = personalizada
        ? `Cursos que combinam com o resultado dos seus testes${localizacao?.cidade ? `, com unidades perto de ${localizacao.cidade}` : ''}.`
        : 'Os cursos mais oferecidos nas unidades. Faça um teste e receba sugestões só suas.';
    chamadaTeste.hidden = personalizada;
    listaSugestoes.innerHTML = lista.length
        ? lista.map((recomendacao) => itemCurso(recomendacao, localizacao)).join('')
        : aviso('Nenhum curso cadastrado ainda.');
}

async function buscarSugestoes() {
    await auth.authStateReady();
    const usuario = auth.currentUser;
    let dadosUsuario = null;
    if (usuario) {
        const snap = await getDoc(doc(db, 'usuarios', usuario.uid));
        dadosUsuario = snap.exists() ? snap.data() : null;
    }

    const resultadoPerfil = extrairResultadoMaisRecente(dadosUsuario);
    const resultadoVocacional = extrairResultadoVocacional(dadosUsuario);
    const [oferta, localizacao] = await Promise.all([
        carregarOfertaCursos(),
        resolverLocalizacaoUsuario(usuario?.uid, dadosUsuario)
    ]);
    const regioes = localizacao ? await carregarRegioesSP().catch(() => null) : null;
    const opcoes = { oferta, localizacao, regioes, limite: QUANTAS_SUGESTOES };

    // o Vocacional vem primeiro (é o mais específico) e o mesmo curso não repete
    const doVocacional = resultadoVocacional ? recomendacoesDoVocacional(resultadoVocacional, opcoes) : [];
    const nomes = new Set(doVocacional.map((r) => normalizar(r.nome)));
    const doPerfil = (resultadoPerfil ? calcularRecomendacoes(resultadoPerfil, opcoes) : [])
        .filter((r) => !nomes.has(normalizar(r.nome)));
    const lista = [...doVocacional, ...doPerfil].slice(0, QUANTAS_SUGESTOES);

    if (lista.length) return { personalizada: true, lista, localizacao };
    return { personalizada: false, lista: cursosMaisOferecidos(oferta, opcoes), localizacao };
}

async function carregarSugestoes() {
    if (!listaSugestoes) return;
    try {
        montarSugestoes(await buscarSugestoes());
    } catch (erro) {
        console.error('Erro ao carregar as sugestões da lateral:', erro);
        listaSugestoes.innerHTML = aviso('Não foi possível carregar as sugestões agora.');
    }
}

carregarNoticias();
carregarSugestoes();
