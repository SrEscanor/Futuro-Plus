// Tudo o que as telas de notícias leem e gravam no Firestore passa por aqui.
// A página Notícias (pública) e o painel Admin · Notícias importam o Firebase
// só através deste arquivo, e os roteiros de teste (webApp/testes/) trocam ele
// por uma cópia de mentira com as mesmas funções.
//
// São duas coleções:
//
//   noticias_fila   tudo o que a coleta automática trouxe (quem grava é o
//                   servidor: functions/noticias_firestore.py), cada uma com
//                   "status": pendente, aprovada ou recusada. Só
//                   administrador lê.
//   noticias        cópia do que foi aprovado. É a única que o site lê, então
//                   nada pendente ou recusado chega ao visitante.
//
// Aprovar copia da fila para "noticias"; recusar ou devolver para pendentes
// apaga de "noticias". As duas gravações vão no mesmo lote, para uma nunca
// ficar sem a outra. A recusada continua guardada na fila de propósito: é
// isso que impede a mesma notícia de voltar na próxima coleta.
import { auth, db } from './firebase-config.js';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import {
    collection, deleteField, doc, getCountFromServer, getDoc, getDocs,
    limit, orderBy, query, where, writeBatch
} from 'firebase/firestore';
import { INSTITUICOES, imagemSegura, linkSeguro } from './noticias-util.js';

const PUBLICADAS = 'noticias';
const FILA = 'noticias_fila';

// A função do servidor que lê os feeds (functions/main.py) — mesmo padrão de
// troca localhost/produção das outras funções.
const COLETAR_NOTICIAS_URL = (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
    ? 'http://127.0.0.1:5001/futuroplus-bce54/southamerica-east1/coletar_noticias'
    : 'https://southamerica-east1-futuroplus-bce54.cloudfunctions.net/coletar_noticias';

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

// Cada notícia mexe em dois documentos e um lote aceita 500 gravações.
async function gravarEmLotes(noticias, porNoticia) {
    for (let i = 0; i < noticias.length; i += 200) {
        const lote = writeBatch(db);
        noticias.slice(i, i + 200).forEach((noticia) => porNoticia(lote, noticia));
        await lote.commit();
    }
}

// ========================================================
// Leitura
// ========================================================

// O que a página Notícias mostra: as aprovadas, da mais nova para a mais antiga.
export async function listarNoticiasPublicadas(limite = 60) {
    const snap = await getDocs(query(collection(db, PUBLICADAS), orderBy('publicadaEm', 'desc'), limit(limite)));
    return lerDocs(snap);
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
export async function contarFila() {
    const fila = collection(db, FILA);
    const contar = async (consulta) => (await getCountFromServer(consulta)).data().count;
    const [pendente, aprovada, recusada] = await Promise.all([
        contar(query(fila, where('status', '==', 'pendente'))),
        contar(collection(db, PUBLICADAS)),
        contar(query(fila, where('status', '==', 'recusada')))
    ]);
    return { pendente, aprovada, recusada };
}

// ========================================================
// Aprovação (só administrador; as regras do Firestore conferem)
// ========================================================

// Põe as notícias no site.
export async function aprovarNoticias(noticias) {
    const semLink = noticias.find((noticia) => !linkSeguro(noticia.link));
    if (semLink) throw new Error(`A notícia "${semLink.titulo || semLink.id}" está sem um link válido.`);

    const agora = revisao();
    await gravarEmLotes(noticias, (lote, noticia) => {
        const publica = camposPublicos(noticia);
        lote.set(doc(db, PUBLICADAS, noticia.id), { ...publica, aprovadaEm: agora.revisadaEm });
        lote.set(doc(db, FILA, noticia.id), { ...publica, status: 'aprovada', recusadaEm: deleteField(), ...agora }, { merge: true });
    });
}

// Tira do site (se estiver lá) e guarda como recusada.
export async function recusarNoticias(noticias) {
    const agora = revisao();
    await gravarEmLotes(noticias, (lote, noticia) => {
        lote.delete(doc(db, PUBLICADAS, noticia.id));
        lote.set(doc(db, FILA, noticia.id), { status: 'recusada', recusadaEm: agora.revisadaEm, ...agora }, { merge: true });
    });
}

// Tira do site (se estiver lá) e volta para a lista de pendentes.
export async function devolverParaPendentes(noticias) {
    const agora = revisao();
    await gravarEmLotes(noticias, (lote, noticia) => {
        lote.delete(doc(db, PUBLICADAS, noticia.id));
        lote.set(doc(db, FILA, noticia.id), { status: 'pendente', recusadaEm: deleteField(), ...agora }, { merge: true });
    });
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

    const lote = writeBatch(db);
    lote.set(doc(db, FILA, noticia.id), { ...novos, ...revisao() }, { merge: true });
    if (noticia.status === 'aprovada') lote.set(doc(db, PUBLICADAS, noticia.id), novos, { merge: true });
    await lote.commit();

    return { ...noticia, ...novos };
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
