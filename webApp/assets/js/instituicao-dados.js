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
//   instituicoes/{id}/comentarios/{uid}_{cursoId}
//                                comentário e nota de quem estudou lá, um
//                                por curso do catálogo (então quem se formou
//                                em dois cursos diferentes na mesma escola
//                                comenta duas vezes): { texto, nota, nome,
//                                curso, ano, certificadoId, uid, criadoEm,
//                                editadoEm }. Sem curso do catálogo (texto
//                                livre), o id usa o certificadoId mesmo —
//                                ver salvarComentario. A chave é por curso,
//                                não pelo certificado em si, porque apagar e
//                                reenviar o mesmo diploma gera um
//                                certificadoId novo, e sem isso daria para
//                                comentar de novo só reenviando.
//                                Comentários de antes desta troca tinham o
//                                id igual só ao certificadoId, ou (mais
//                                antigos ainda) só ao uid, e continuam
//                                existindo e sendo editáveis assim (ganham o
//                                campo "uid" na primeira edição).
//   instituicoes/{id}/perguntas/{automático}
//                                dúvida de qualquer conta, com as respostas
//                                dentro, uma por conta: { texto, autorUid,
//                                nome, criadaEm, respostas: { uid: { texto,
//                                nome, curso, ano, certificadoId, equipe, em } } }
//
// Quem estudou lá: a conta tem, no Mural, um ou mais certificados em que a
// leitura achou esta unidade (verificacao.unidadeLida) e conferiu o nome.
// Cada certificado dá direito a um comentário; o curso e o ano que aparecem
// nele vêm desse certificado, e as regras do Firestore conferem tudo isso de
// novo no servidor.
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

// comentários antigos (de antes de um certificado dar direito a um
// comentário próprio) não têm o campo "uid" gravado; para eles, o dono é o
// próprio id do documento.
function comDono(id, dados) {
    return { id, uid: dados.uid || id, ...dados };
}

export async function lerComentarios(unidadeId, { depois = null } = {}) {
    const { docs, cursor, haMais } = await pagina(comentariosDa(unidadeId), 'criadoEm', depois, COMENTARIOS_POR_VEZ);
    return { itens: docs.map((d) => comDono(d.id, d.data())), cursor, haMais };
}

// Todos os comentários desta conta nesta unidade (um por certificado). Busca
// pelo campo "uid" e também pelo id antigo (igual ao uid, de antes de um
// certificado dar direito a um comentário), para não perder quem comentou
// antes dessa mudança.
export async function lerMeusComentarios(unidadeId, uid) {
    const [doConsulta, antigo] = await Promise.all([
        getDocs(query(comentariosDa(unidadeId), where('uid', '==', uid))),
        getDoc(doc(db, 'instituicoes', unidadeId, 'comentarios', uid))
    ]);
    const vistos = new Map(doConsulta.docs.map((d) => [d.id, comDono(d.id, d.data())]));
    if (antigo.exists() && !vistos.has(antigo.id)) vistos.set(antigo.id, comDono(antigo.id, antigo.data()));
    return [...vistos.values()];
}

// existente: o comentário que a pessoa já tinha para este certificado
// (editar) ou null (novo). Devolve como ele fica na tela, sem ler de novo do
// banco.
export async function salvarComentario(unidadeId, conta, { texto, nota, certificadoId }, existente = null) {
    const certificado = (conta.certificados || []).find((c) => c.id === certificadoId);
    if (!certificado) throw new Error('Certificado não encontrado para este comentário.');

    // A vaga de comentário é por curso do catálogo (certificado.cursoId), não
    // pelo id do certificado em si: esse id muda toda vez que a pessoa apaga
    // e reenvia o mesmo diploma, e sem isso daria para comentar de novo só
    // reenviando. Sem curso do catálogo (texto livre), não tem uma chave
    // estável para isso, então cai de volta no id do certificado mesmo.
    const chave = certificado.cursoId || certificadoId;
    const ref = doc(db, 'instituicoes', unidadeId, 'comentarios', existente ? existente.id : `${conta.uid}_${chave}`);
    const campos = {
        texto: texto.trim(),
        nota,
        nome: conta.nome,
        curso: certificado.titulo,
        ano: certificado.anoConclusao ?? null,
        certificadoId,
        uid: conta.uid
    };
    if (existente) {
        await updateDoc(ref, { ...campos, editadoEm: serverTimestamp() });
        return { ...existente, ...campos, editadoEm: new Date() };
    }
    await setDoc(ref, { ...campos, criadoEm: serverTimestamp() });
    return { ...campos, id: ref.id, criadoEm: new Date() };
}

export async function apagarComentario(unidadeId, id) {
    await deleteDoc(doc(db, 'instituicoes', unidadeId, 'comentarios', id));
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

// Quem tem certificado da unidade responde com curso e ano de um deles; o
// admin sem certificado da unidade responde como "Equipe Futuro+".
export async function responderPergunta(unidadeId, perguntaId, conta, texto) {
    const certificado = (conta.certificados || [])[0];
    const resposta = certificado
        ? {
            texto: texto.trim(), nome: conta.nome, curso: certificado.titulo,
            ano: certificado.anoConclusao ?? null, certificadoId: certificado.id, equipe: false
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
// ou { logado: true, uid, nome, admin, certificados }. certificados é a lista
// de certificados do Mural em que a leitura achou esta unidade e conferiu o
// nome ([{ id, titulo, anoConclusao, cursoId }, ...], podendo ser mais de um).
export function observarConta(unidadeId, aoMudar) {
    return onAuthStateChanged(auth, async (usuario) => {
        if (!usuario) {
            aoMudar({ logado: false });
            return;
        }
        const conta = { logado: true, uid: usuario.uid, nome: '', admin: false, certificados: [] };
        try {
            const [perfil, certificados] = await Promise.all([
                getDoc(doc(db, 'usuarios', usuario.uid)),
                getDocs(query(collection(db, 'usuarios', usuario.uid, 'certificados'), where('verificacao.unidadeLida', '==', unidadeId)))
            ]);
            const dados = perfil.exists() ? perfil.data() : {};
            const confirmados = certificados.docs.filter((d) => d.data().verificacao?.nomeConfere === true);
            aoMudar({
                ...conta,
                // igual ao do perfil, sem mexer: as regras conferem letra por letra
                nome: typeof dados.nome === 'string' ? dados.nome : '',
                admin: dados.admin === true,
                // cursoId junto: o id do comentário é "uid_cursoId" (salvarComentario),
                // e sem ele o comentário ia para "uid_certificadoId", que as
                // regras recusam quando o certificado tem curso do catálogo
                certificados: confirmados.map((d) => ({
                    id: d.id,
                    titulo: d.data().titulo || '',
                    anoConclusao: d.data().anoConclusao ?? null,
                    cursoId: d.data().cursoId || ''
                }))
            });
        } catch (erro) {
            console.error('Erro ao ler a conta:', erro);
            aoMudar(conta);
        }
    });
}
