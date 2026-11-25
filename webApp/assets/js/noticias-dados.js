// Tudo o que as telas de notícias leem e gravam no Firestore passa por aqui.
// A página Notícias (pública) e o painel Admin · Notícias importam o Firebase
// só através deste arquivo, e os roteiros de teste (webApp/testes/) trocam ele
// por uma cópia de mentira com as mesmas funções.
//
// O que fica no Firestore:
//
//   noticias_fila   tudo o que a coleta automática trouxe (quem grava é o
//                   servidor: functions/noticias_firestore.py), cada uma com
//                   "status": pendente, aprovada ou recusada. Só
//                   administrador lê.
//   noticias        cópia do que foi aprovado. É a única que o site lê, então
//                   nada pendente ou recusado chega ao visitante.
//   noticias_historico  quem aprovou, recusou, tirou do site ou editou cada
//                   notícia, e quem mexeu no carrossel da Início. Só cresce:
//                   as regras do Firestore não deixam mudar nem apagar, e
//                   cada registro leva o e-mail de quem está logado e a hora
//                   do servidor.
//   configuracoes/destaques_inicio  as notícias do carrossel "Destaques
//                   para você" da Início: { itens: [{ id, titulo }],
//                   atualizadoEm, atualizadoPor }, na ordem do carrossel.
//                   Todo mundo lê; só administrador grava.
//   configuracoes/noticias_fixadas  as fixadas no alto da página Notícias,
//                   no mesmo formato e com as mesmas regras.
//
// Aprovar copia da fila para "noticias"; recusar ou devolver para pendentes
// apaga de "noticias". As duas gravações e o registro do histórico vão no
// mesmo lote, para um nunca ficar sem o outro. A recusada continua guardada na fila de propósito: é
// isso que impede a mesma notícia de voltar na próxima coleta.
import { auth, db } from './firebase-config.js';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import {
    collection, deleteField, doc, documentId, getCountFromServer, getDoc, getDocs,
    limit, orderBy, query, runTransaction, serverTimestamp, where, writeBatch
} from 'firebase/firestore';
import { INSTITUICOES, imagemSegura, linkSeguro, oQueFoiEditado } from './noticias-util.js';
import { paginaDoHistorico } from './historico-paginas.js';
import {
    DOC_DESTAQUES, DOC_FIXADAS, estaNoSite, itensDasFixadas, itensDosDestaques, mudarListaDeDestaques,
    mudarListaDeFixadas
} from './destaques-util.js';

const PUBLICADAS = 'noticias';
const FILA = 'noticias_fila';
const HISTORICO = 'noticias_historico';

// A função do servidor que lê os feeds (functions/main.py) — mesmo padrão de
// troca localhost/produção das outras funções.
const COLETAR_NOTICIAS_URL = (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
    ? 'http://127.0.0.1:5001/futuroplus-bce54/southamerica-east1/coletar_noticias'
    : 'https://southamerica-east1-futuroplus-bce54.cloudfunctions.net/coletar_noticias';

// Apaga na hora as recusadas com mais de 30 dias, sem esperar a próxima
// coleta agendada (que já faz isso sozinha a cada 6h).
const LIMPAR_RECUSADAS_URL = (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
    ? 'http://127.0.0.1:5001/futuroplus-bce54/southamerica-east1/limpar_noticias_recusadas'
    : 'https://southamerica-east1-futuroplus-bce54.cloudfunctions.net/limpar_noticias_recusadas';

export const LIMITE_TITULO = 200;
export const LIMITE_RESUMO = 400;

const maisNovaPrimeiro = (a, b) => (b.publicadaEm || '').localeCompare(a.publicadaEm || '');
const lerDocs = (snap) => snap.docs.map((d) => ({ id: d.id, ...d.data() }));
const etiquetasValidas = (lista) => (Array.isArray(lista) ? lista : []).filter((id) => id in INSTITUICOES);

// O que vai para a coleção pública: só o que a página mostra.
function camposPublicos(noticia) {
    return {
        titulo: String(noticia.titulo || '').trim().slice(0, LIMITE_TITULO),
        resumo: String(noticia.resumo || '').trim().slice(0, LIMITE_RESUMO),
        link: linkSeguro(noticia.link),
        imagem: imagemSegura(noticia.imagem),
        fonte: String(noticia.fonte || '').trim().slice(0, 80),
        instituicoes: etiquetasValidas(noticia.instituicoes),
        publicadaEm: noticia.publicadaEm || new Date().toISOString()
    };
}

function revisao() {
    return {
        revisadaEm: new Date().toISOString(),
        revisadaPor: auth.currentUser?.email || auth.currentUser?.uid || ''
    };
}

function usuarioLogado() {
    const usuario = auth.currentUser;
    if (!usuario) throw new Error('Sua sessão terminou. Entre de novo com a conta de administrador.');
    return usuario;
}

// O registro do histórico (as regras conferem o uid, o e-mail e a hora).
function registroDoHistorico(usuario, noticia, acao, detalhe = '') {
    return {
        noticiaId: String(noticia.id ?? ''),
        titulo: String(noticia.titulo || '').trim().slice(0, LIMITE_TITULO) || '(sem título)',
        acao,
        detalhe,
        email: usuario.email || '',
        uid: usuario.uid,
        em: serverTimestamp()
    };
}

const novoRegistro = () => doc(collection(db, HISTORICO));

// Cada notícia mexe em três documentos (a fila, a cópia do site e o registro
// do histórico) e um lote aceita 500 gravações.
async function gravarEmLotes(noticias, porNoticia) {
    for (let i = 0; i < noticias.length; i += 150) {
        const lote = writeBatch(db);
        noticias.slice(i, i + 150).forEach((noticia) => porNoticia(lote, noticia));
        await lote.commit();
    }
}

// ========================================================
// Leitura
// ========================================================

// O que a página Notícias mostra: as aprovadas, da mais nova para a mais antiga.
// Notícia própria agendada (painel Admin · Notícias próprias) já está na
// coleção, mas só aparece quando chega a hora: até lá fica de fora daqui.
export async function listarNoticiasPublicadas(limite = 60) {
    const snap = await getDocs(query(collection(db, PUBLICADAS), orderBy('publicadaEm', 'desc'), limit(limite)));
    const agora = new Date().toISOString();
    return lerDocs(snap).filter((noticia) => !noticia.publicarEm || noticia.publicarEm <= agora);
}

// Notícias próprias esperando aprovação (painel Admin · Notícias próprias).
// O painel Notícias mostra no alto da aba Pendentes, com o card azul, da
// mais antiga para a mais nova: a fila anda por ordem de chegada.
export async function listarNoticiasPropriasPendentes() {
    const snap = await getDocs(query(collection(db, 'noticias_proprias'), where('status', '==', 'pendente')));
    return lerDocs(snap).sort((a, b) => String(a.enviadaEm || '').localeCompare(String(b.enviadaEm || '')));
}

// O que o painel mostra em cada aba. status: 'pendente', 'aprovada' ou 'recusada'.
export async function listarFila(status) {
    if (status === 'aprovada') {
        return (await listarNoticiasPublicadas(200)).map((noticia) => ({ ...noticia, status: 'aprovada' }));
    }
    if (status === 'recusada') {
        // "recusadaEm" só existe em quem foi recusada, então ordenar por ele já
        // traz só as recusadas, das últimas para as primeiras.
        const snap = await getDocs(query(collection(db, FILA), orderBy('recusadaEm', 'desc'), limit(200)));
        return lerDocs(snap);
    }
    const snap = await getDocs(query(collection(db, FILA), where('status', '==', 'pendente')));
    return lerDocs(snap).sort(maisNovaPrimeiro);
}

// { pendente, aprovada, recusada }: os números das abas do painel.
// "No site" não conta a notícia própria agendada: ela já está na coleção,
// mas ainda fora do site (publicarEm no futuro).
export async function contarFila() {
    const fila = collection(db, FILA);
    const contar = async (consulta) => (await getCountFromServer(consulta)).data().count;
    const [pendente, naColecao, agendadas, recusada] = await Promise.all([
        contar(query(fila, where('status', '==', 'pendente'))),
        contar(collection(db, PUBLICADAS)),
        contar(query(collection(db, PUBLICADAS), where('publicarEm', '>', new Date().toISOString()))),
        contar(query(fila, where('status', '==', 'recusada')))
    ]);
    return { pendente, aprovada: naColecao - agendadas, recusada };
}

// Uma página do histórico (aba Histórico, com filtros): { registros, cursor,
// haMais }, do mais novo para o mais antigo, "em" em ISO. depois = o cursor
// da página anterior.
export function listarHistoricoNoticiasPagina({ quantos = 100, depois = null } = {}) {
    return paginaDoHistorico(HISTORICO, { quantos, depois });
}

// ========================================================
// Aprovação (só administrador; as regras do Firestore conferem)
// ========================================================

// Põe as notícias no site. aprovadaPor/recusadaPor são campos próprios (não
// só "revisadaPor", que qualquer edição também mexe) — assim o histórico de
// quem aprovou ou recusou não muda só porque alguém corrigiu o título depois.
export async function aprovarNoticias(noticias) {
    const semLink = noticias.find((noticia) => !linkSeguro(noticia.link));
    if (semLink) throw new Error(`A notícia "${semLink.titulo || semLink.id}" está sem um link válido.`);

    const usuario = usuarioLogado();
    const agora = revisao();
    await gravarEmLotes(noticias, (lote, noticia) => {
        const publica = camposPublicos(noticia);
        lote.set(doc(db, PUBLICADAS, noticia.id), { ...publica, aprovadaEm: agora.revisadaEm, aprovadaPor: agora.revisadaPor });
        lote.set(doc(db, FILA, noticia.id), {
            ...publica, status: 'aprovada',
            aprovadaEm: agora.revisadaEm, aprovadaPor: agora.revisadaPor,
            recusadaEm: deleteField(), recusadaPor: deleteField(),
            ...agora
        }, { merge: true });
        lote.set(novoRegistro(), registroDoHistorico(usuario, noticia, 'aprovou'));
    });
}

// Tira do site (se estiver lá) e guarda como recusada.
export async function recusarNoticias(noticias) {
    const usuario = usuarioLogado();
    const agora = revisao();
    await gravarEmLotes(noticias, (lote, noticia) => {
        lote.delete(doc(db, PUBLICADAS, noticia.id));
        lote.set(doc(db, FILA, noticia.id), {
            status: 'recusada', recusadaEm: agora.revisadaEm, recusadaPor: agora.revisadaPor, ...agora
        }, { merge: true });
        lote.set(novoRegistro(), registroDoHistorico(usuario, noticia, 'recusou'));
    });
}

// Volta para a lista de pendentes, tirando do site se estiver lá. acao: o que
// fica no histórico ("tirou" do site ou "voltou" das recusadas).
async function voltarParaPendentes(noticias, acao) {
    const usuario = usuarioLogado();
    const agora = revisao();
    await gravarEmLotes(noticias, (lote, noticia) => {
        lote.delete(doc(db, PUBLICADAS, noticia.id));
        lote.set(doc(db, FILA, noticia.id), {
            status: 'pendente',
            recusadaEm: deleteField(), recusadaPor: deleteField(),
            aprovadaEm: deleteField(), aprovadaPor: deleteField(),
            ...agora
        }, { merge: true });
        lote.set(novoRegistro(), registroDoHistorico(usuario, noticia, acao));
    });
}

// Aba No site: sai do site e volta para as pendentes.
export async function tirarDoSite(noticias) {
    await voltarParaPendentes(noticias, 'tirou');
}

// Aba Recusadas: volta para as pendentes.
export async function devolverParaPendentes(noticias) {
    await voltarParaPendentes(noticias, 'voltou');
}

// Corrige título, resumo, imagem e etiquetas. campos: { titulo, resumo,
// imagem, instituicoes }. Se a notícia já está no site, a cópia pública muda
// junto. Devolve a notícia como ficou.
export async function salvarEdicao(noticia, campos) {
    const titulo = String(campos.titulo || '').trim();
    if (!titulo) throw new Error('A notícia precisa de um título.');

    const imagemDigitada = String(campos.imagem || '').trim();
    if (imagemDigitada && !imagemSegura(imagemDigitada)) {
        throw new Error('O endereço da imagem precisa começar com https://');
    }

    const novos = {
        titulo: titulo.slice(0, LIMITE_TITULO),
        resumo: String(campos.resumo || '').trim().slice(0, LIMITE_RESUMO),
        imagem: imagemSegura(imagemDigitada),
        instituicoes: etiquetasValidas(campos.instituicoes)
    };

    const usuario = usuarioLogado();
    const lote = writeBatch(db);
    lote.set(doc(db, FILA, noticia.id), { ...novos, ...revisao() }, { merge: true });
    if (noticia.status === 'aprovada') lote.set(doc(db, PUBLICADAS, noticia.id), novos, { merge: true });
    lote.set(novoRegistro(), registroDoHistorico(usuario, { ...noticia, ...novos }, 'editou', oQueFoiEditado(noticia, novos)));
    await lote.commit();

    return { ...noticia, ...novos };
}

// ========================================================
// Carrossel "Destaques para você" da Início e fixadas da página Notícias
// ========================================================

// Uma das duas listas, cada item com a notícia como está no site agora
// (noticia: null quando ela saiu do site). Devolve { itens: [{ id, titulo,
// noticia }], atualizadoEm (ISO), atualizadoPor }. Custa 1 leitura, mais 1
// por notícia escolhida.
async function lerListaEscolhida(caminho, limpar) {
    const registro = await getDoc(doc(db, ...caminho));
    const dados = registro.exists() ? registro.data() : {};
    const itens = limpar(dados.itens);

    const noSite = new Map();
    if (itens.length) {
        const ids = itens.map((item) => item.id);
        const snap = await getDocs(query(collection(db, PUBLICADAS), where(documentId(), 'in', ids)));
        lerDocs(snap).forEach((noticia) => noSite.set(noticia.id, noticia));
    }
    return {
        itens: itens.map((item) => ({ ...item, noticia: noSite.get(item.id) || null })),
        atualizadoEm: dados.atualizadoEm?.toDate ? dados.atualizadoEm.toDate().toISOString() : null,
        atualizadoPor: dados.atualizadoPor || ''
    };
}

export function lerDestaques() {
    return lerListaEscolhida(DOC_DESTAQUES, itensDosDestaques);
}

export function lerFixadas() {
    return lerListaEscolhida(DOC_FIXADAS, itensDasFixadas);
}

// O que a Início mostra: as notícias escolhidas que estão no site agora, na
// ordem do carrossel (a própria agendada só entra quando chega a hora).
export async function listarDestaquesDaInicio() {
    const { itens } = await lerDestaques();
    const agora = new Date();
    return itens.map((item) => item.noticia).filter((noticia) => estaNoSite(noticia, agora));
}

// O que a página Notícias põe no alto: as fixadas que estão no site agora,
// na ordem do painel (mesmo as que já não estão entre as 60 mais novas).
export async function listarFixadasDaPagina() {
    const { itens } = await lerFixadas();
    const agora = new Date();
    return itens.map((item) => item.noticia).filter((noticia) => estaNoSite(noticia, agora));
}

// Muda uma das listas (ver mudarListaDeDestaques e mudarListaDeFixadas). A
// lista é lida de novo dentro de uma transação: se outra pessoa mexeu nela
// depois que o painel abriu, a mudança entra na lista dela em vez de
// desfazer o que ela fez. O registro do histórico vai junto. Devolve a lista
// como ficou ([{ id, titulo }]).
async function mudarListaEscolhida(caminho, limpar, mudar, acao, noticia, opcoes) {
    const usuario = usuarioLogado();
    const ref = doc(db, ...caminho);
    return runTransaction(db, async (transacao) => {
        const atual = await transacao.get(ref);
        const itens = limpar(atual.exists() ? atual.data().itens : []);
        const mudanca = mudar(itens, acao, noticia, opcoes);
        if (!mudanca) return itens;

        transacao.set(ref, {
            itens: mudanca.itens,
            atualizadoEm: serverTimestamp(),
            atualizadoPor: usuario.email || ''
        });
        transacao.set(novoRegistro(), registroDoHistorico(usuario,
            { id: noticia.id, titulo: mudanca.titulo }, mudanca.acao, mudanca.detalhe));
        return mudanca.itens;
    });
}

// Carrossel: acao 'destacar', 'tirar', 'antes' ou 'depois'.
export function mudarDestaques(acao, noticia, opcoes = {}) {
    return mudarListaEscolhida(DOC_DESTAQUES, itensDosDestaques, mudarListaDeDestaques, acao, noticia, opcoes);
}

// Fixadas: acao 'fixar', 'tirar', 'antes' ou 'depois'.
export function mudarFixadas(acao, noticia, opcoes = {}) {
    return mudarListaEscolhida(DOC_FIXADAS, itensDasFixadas, mudarListaDeFixadas, acao, noticia, opcoes);
}

// ========================================================
// Coleta
// ========================================================

// Manda o servidor buscar notícias agora, sem esperar a busca automática (que
// roda sozinha a cada 6 horas). Pode levar uns 20 segundos. Devolve o resumo:
// { coletadaEm, origem: 'painel' | 'agendada', novas, repetidas,
//   fontes: [{ id, nome, encontradas, erro }] }  (erro é null quando deu certo)
export async function buscarNoticiasAgora() {
    const usuario = auth.currentUser;
    if (!usuario) throw new Error('Entre com a conta de administrador para buscar notícias.');

    let resposta;
    try {
        resposta = await fetch(COLETAR_NOTICIAS_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + await usuario.getIdToken()
            },
            body: '{}'
        });
    } catch {
        throw new Error('Não consegui falar com o servidor. Se a função coletar_noticias ainda não foi publicada, '
            + 'faça o deploy das funções.');
    }
    const dados = await resposta.json().catch(() => ({}));
    if (!resposta.ok) throw new Error(dados.erro || `O servidor respondeu com erro ${resposta.status}.`);
    return dados;
}

// O resumo da última busca (a automática ou a do botão), no mesmo formato de
// buscarNoticiasAgora(). null se nenhuma busca rodou ainda.
export async function lerUltimaColeta() {
    const registro = await getDoc(doc(db, 'noticias_coleta', 'ultima'));
    return registro.exists() ? registro.data() : null;
}

// Apaga na hora as recusadas com mais de 30 dias (a mesma limpeza que já
// roda sozinha a cada coleta agendada). Devolve { apagadas }.
export async function limparRecusadasAntigas() {
    const usuario = auth.currentUser;
    if (!usuario) throw new Error('Entre com a conta de administrador para limpar as recusadas.');

    let resposta;
    try {
        resposta = await fetch(LIMPAR_RECUSADAS_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + await usuario.getIdToken()
            },
            body: '{}'
        });
    } catch {
        throw new Error('Não consegui falar com o servidor. Se a função limpar_noticias_recusadas ainda não foi publicada, '
            + 'faça o deploy das funções.');
    }
    const dados = await resposta.json().catch(() => ({}));
    if (!resposta.ok) throw new Error(dados.erro || `O servidor respondeu com erro ${resposta.status}.`);
    return dados;
}

// ========================================================
// Login do painel
// ========================================================

// Avisa quem está logado e se é administrador: aoMudar({ usuario, ehAdmin }).
// usuario é null quando não há ninguém logado.
export function observarAdmin(aoMudar) {
    return onAuthStateChanged(auth, async (usuario) => {
        if (!usuario) {
            aoMudar({ usuario: null, ehAdmin: false });
            return;
        }
        try {
            const perfil = await getDoc(doc(db, 'usuarios', usuario.uid));
            aoMudar({ usuario, ehAdmin: perfil.exists() && perfil.data().admin === true });
        } catch (erro) {
            console.error('Erro ao verificar acesso de administrador:', erro);
            aoMudar({ usuario, ehAdmin: false });
        }
    });
}

export async function sairDaConta() {
    await signOut(auth);
}
