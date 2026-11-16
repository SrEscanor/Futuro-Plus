// Tudo o que o painel Admin · Notificações lê e grava no Firestore passa por
// aqui. Os roteiros de teste (webApp/testes/) trocam este arquivo por
// testes/notificacoes-dados-simulado.js, com as mesmas funções.
//
//   notificacoes            os avisos (o site lê direto, em notificacoes.js)
//   notificacoes_historico  quem criou, editou ou excluiu cada aviso. Só
//                           cresce: as regras do Firestore não deixam mudar
//                           nem apagar, e cada registro leva o e-mail de quem
//                           está logado e a hora do servidor.
//   noticias                as notícias do site, para ligar uma ao aviso
import { auth, db } from './firebase-config.js';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import {
    collection, doc, getDoc, getDocs, limit, orderBy, query, serverTimestamp, writeBatch
} from 'firebase/firestore';
import { listarNoticiasPublicadas } from './noticias-dados.js';

const COLECAO = 'notificacoes';
const HISTORICO = 'notificacoes_historico';
const NOTICIAS = 'noticias';

const lerDocs = (snap) => snap.docs.map((d) => ({ id: d.id, ...d.data() }));

// ========================================================
// Login do painel
// ========================================================

// Avisa quem está logado e se é administrador: aoMudar({ usuario, ehAdmin }).
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

// ========================================================
// Notificações
// ========================================================

export function novoId() {
    return doc(collection(db, COLECAO)).id;
}

// Da criada por último para a mais antiga.
export async function listarNotificacoes() {
    return lerDocs(await getDocs(collection(db, COLECAO)))
        .sort((a, b) => (b.criadoEm || '').localeCompare(a.criadoEm || ''));
}

function usuarioLogado() {
    const usuario = auth.currentUser;
    if (!usuario) throw new Error('Sua sessão terminou. Entre de novo com a conta de administrador.');
    return usuario;
}

function registroDoHistorico(usuario, notificacaoId, titulo, { acao, detalhe = '' }) {
    return {
        notificacaoId,
        titulo: String(titulo || '').trim() || '(sem título)',
        acao,
        detalhe,
        email: usuario.email || '',
        uid: usuario.uid,
        em: serverTimestamp()
    };
}

// Grava a notificação e o registro do histórico no mesmo lote (um nunca fica
// sem o outro). historico: { acao, detalhe }, de oQueMudou() em
// notificacoes-util.js.
export async function salvarNotificacao(id, dados, historico) {
    const usuario = usuarioLogado();
    const lote = writeBatch(db);
    // criadoPor: o uid de quem criou (a nova ganha o de quem está logado)
    lote.set(doc(db, COLECAO, id), { ...dados, criadoPor: dados.criadoPor || usuario.uid });
    lote.set(doc(collection(db, HISTORICO)), registroDoHistorico(usuario, id, dados.titulo, historico));
    await lote.commit();
}

export async function excluirNotificacao(notificacao) {
    const usuario = usuarioLogado();
    const lote = writeBatch(db);
    lote.delete(doc(db, COLECAO, notificacao.id));
    lote.set(doc(collection(db, HISTORICO)), registroDoHistorico(usuario, notificacao.id, notificacao.titulo, { acao: 'excluiu' }));
    await lote.commit();
}

// Os últimos registros, do mais novo para o mais antigo ("em" em ISO).
export async function listarHistorico({ quantos = 100 } = {}) {
    const snap = await getDocs(query(collection(db, HISTORICO), orderBy('em', 'desc'), limit(quantos)));
    return lerDocs(snap).map((registro) => ({
        ...registro,
        em: registro.em?.toDate ? registro.em.toDate().toISOString() : registro.em || null
    }));
}

// ========================================================
// Notícias para ligar a um aviso
// ========================================================

// As que já estão no site (a agendada ainda não), da mais nova para a mais
// antiga: as de outros sites aprovadas no painel Notícias e as do Futuro+.
export async function listarNoticiasDoSite(quantas = 80) {
    return listarNoticiasPublicadas(quantas);
}

// Uma notícia pelo id: o painel Notícias manda para cá com ?noticia=<id>.
export async function lerNoticiaDoSite(id) {
    const registro = await getDoc(doc(db, NOTICIAS, id));
    return registro.exists() ? { id: registro.id, ...registro.data() } : null;
}
