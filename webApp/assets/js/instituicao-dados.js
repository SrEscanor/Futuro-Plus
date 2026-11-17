// Tudo o que a página de uma instituição (instituicao.html) lê e grava no
// Firestore passa por aqui. A página importa o Firebase só através deste
// arquivo, e o roteiro de teste (webApp/testes/pagina-instituicao.js) troca
// ele por uma cópia de mentira com as mesmas funções.
//
// O que fica no Firestore (as regras estão em firestore.rules):
//
//   instituicoes/{id}            a unidade, do cadastro de Admin · Unidades.
//                                foto e paginaCps vêm do botão "Buscar
//                                fotos no site do CPS" desse painel.
//   instituicoes/{id}/comentarios/{uid}
//                                comentário e nota de quem estudou lá, um
//                                por conta: { texto, nota, nome, curso, ano,
//                                certificadoId, criadoEm, editadoEm }
//   instituicoes/{id}/perguntas/{automático}
//                                dúvida de qualquer conta, com as respostas
//                                dentro, uma por conta: { texto, autorUid,
//                                nome, criadaEm, respostas: { uid: { texto,
//                                nome, curso, ano, certificadoId, equipe, em } } }
//
// Quem estudou lá: a conta tem, no Mural, um certificado em que a leitura
// achou esta unidade (verificacao.unidadeLida) e conferiu o nome. O curso e
// o ano que aparecem no comentário vêm desse certificado, e as regras do
// Firestore conferem tudo isso de novo no servidor.
import { auth, db } from './firebase-config.js';
import { onAuthStateChanged } from 'firebase/auth';
import {
    addDoc, average, collection, count, deleteDoc, deleteField, doc, getAggregateFromServer, getDoc,
    getDocs, limit, orderBy, query, serverTimestamp, setDoc, startAfter, updateDoc, where
} from 'firebase/firestore';
import { COMENTARIOS_POR_VEZ, PERGUNTAS_POR_VEZ } from './instituicao-util.js';

const comentariosDa = (unidadeId) => collection(db, 'instituicoes', unidadeId, 'comentarios');
const perguntasDa = (unidadeId) => collection(db, 'instituicoes', unidadeId, 'perguntas');

// Uma página de uma lista, da mais nova para a mais antiga. Pede um item a
// mais para saber se ainda tem depois; "cursor" é o último mostrado.
async function pagina(colecao, campo, depois, quantos) {
    const partes = [orderBy(campo, 'desc')];
    if (depois) partes.push(startAfter(depois));
    partes.push(limit(quantos + 1));
    const snap = await getDocs(query(colecao, ...partes));
    const docs = snap.docs.slice(0, quantos);
    return { docs, cursor: docs.at(-1) || null, haMais: snap.docs.length > quantos };
}

export async function lerUnidade(unidadeId) {
    const snap = await getDoc(doc(db, 'instituicoes', unidadeId));
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

// Média e quantidade de notas, calculadas no servidor: conta como uma
// leitura só, por mais comentários que a unidade tenha.
export async function lerAvaliacao(unidadeId) {
    const resumo = await getAggregateFromServer(comentariosDa(unidadeId), { media: average('nota'), total: count() });
    const { media, total } = resumo.data();
    return { media: media || 0, total: total || 0 };
}

export async function lerComentarios(unidadeId, { depois = null } = {}) {
    const { docs, cursor, haMais } = await pagina(comentariosDa(unidadeId), 'criadoEm', depois, COMENTARIOS_POR_VEZ);
    return { itens: docs.map((d) => ({ uid: d.id, ...d.data() })), cursor, haMais };
}

export async function lerMeuComentario(unidadeId, uid) {
    const snap = await getDoc(doc(db, 'instituicoes', unidadeId, 'comentarios', uid));
    return snap.exists() ? { uid: snap.id, ...snap.data() } : null;
}

// existente: o comentário que a pessoa já tinha (editar) ou null (novo).
// Devolve como ele fica na tela, sem ler de novo do banco.
export async function salvarComentario(unidadeId, conta, { texto, nota }, existente = null) {
    const ref = doc(db, 'instituicoes', unidadeId, 'comentarios', conta.uid);
    const campos = {
        texto: texto.trim(),
        nota,
        nome: conta.nome,
        curso: conta.certificado.titulo,
        ano: conta.certificado.anoConclusao ?? null,
        certificadoId: conta.certificado.id
    };
    if (existente) {
        await updateDoc(ref, { ...campos, editadoEm: serverTimestamp() });
        return { ...existente, ...campos, uid: conta.uid, editadoEm: new Date() };
    }
    await setDoc(ref, { ...campos, criadoEm: serverTimestamp() });
    return { ...campos, uid: conta.uid, criadoEm: new Date() };
}

export async function apagarComentario(unidadeId, uid) {
    await deleteDoc(doc(db, 'instituicoes', unidadeId, 'comentarios', uid));
}

export async function lerPerguntas(unidadeId, { depois = null } = {}) {
    const { docs, cursor, haMais } = await pagina(perguntasDa(unidadeId), 'criadaEm', depois, PERGUNTAS_POR_VEZ);
    return { itens: docs.map((d) => ({ id: d.id, ...d.data() })), cursor, haMais };
}

export async function criarPergunta(unidadeId, conta, texto) {
    const dados = { texto: texto.trim(), autorUid: conta.uid, nome: conta.nome, criadaEm: serverTimestamp(), respostas: {} };
    const ref = await addDoc(perguntasDa(unidadeId), dados);
    return { ...dados, id: ref.id, criadaEm: new Date() };
}

// Quem tem o certificado responde com curso e ano dele; o admin sem
// certificado da unidade responde como "Equipe Futuro+".
export async function responderPergunta(unidadeId, perguntaId, conta, texto) {
    const resposta = conta.certificado
        ? {
            texto: texto.trim(), nome: conta.nome, curso: conta.certificado.titulo,
            ano: conta.certificado.anoConclusao ?? null, certificadoId: conta.certificado.id, equipe: false
        }
        : { texto: texto.trim(), nome: conta.nome, equipe: true };
    await updateDoc(doc(db, 'instituicoes', unidadeId, 'perguntas', perguntaId), {
        [`respostas.${conta.uid}`]: { ...resposta, em: serverTimestamp() }
    });
    return { ...resposta, em: new Date() };
}

export async function apagarResposta(unidadeId, perguntaId, uid) {
    await updateDoc(doc(db, 'instituicoes', unidadeId, 'perguntas', perguntaId), { [`respostas.${uid}`]: deleteField() });
}

export async function apagarPergunta(unidadeId, perguntaId) {
    await deleteDoc(doc(db, 'instituicoes', unidadeId, 'perguntas', perguntaId));
}

// Avisa quem está vendo a página: aoMudar(conta), com conta = { logado: false }
// ou { logado: true, uid, nome, admin, certificado }. O certificado é o do
// Mural em que a leitura achou esta unidade e conferiu o nome ({ id, titulo,
// anoConclusao }), ou null.
export function observarConta(unidadeId, aoMudar) {
    return onAuthStateChanged(auth, async (usuario) => {
        if (!usuario) {
            aoMudar({ logado: false });
            return;
        }
        const conta = { logado: true, uid: usuario.uid, nome: '', admin: false, certificado: null };
        try {
            const [perfil, certificados] = await Promise.all([
                getDoc(doc(db, 'usuarios', usuario.uid)),
                getDocs(query(collection(db, 'usuarios', usuario.uid, 'certificados'), where('verificacao.unidadeLida', '==', unidadeId)))
            ]);
            const dados = perfil.exists() ? perfil.data() : {};
            const certificado = certificados.docs.find((d) => d.data().verificacao?.nomeConfere === true);
            aoMudar({
                ...conta,
                // igual ao do perfil, sem mexer: as regras conferem letra por letra
                nome: typeof dados.nome === 'string' ? dados.nome : '',
                admin: dados.admin === true,
                certificado: certificado
                    ? { id: certificado.id, titulo: certificado.data().titulo || '', anoConclusao: certificado.data().anoConclusao ?? null }
                    : null
            });
        } catch (erro) {
            console.error('Erro ao ler a conta:', erro);
            aoMudar(conta);
        }
    });
}
