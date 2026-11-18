// Tudo o que o painel Admin · Comunidade e o contador do menu do painel leem
// e gravam no Firestore passa por aqui. O roteiro de teste
// (webApp/testes/painel-comunidade.js) troca este arquivo por
// testes/comunidade-dados-simulado.js, com as mesmas funções.
//
//   avisos_admin            avaliação ou dúvida nova (aba Novidades)
//   comunidade_historico    tudo o que aconteceu nos comentários, notas e
//                           dúvidas, com cópia do que foi apagado (aba
//                           Histórico)
//   usuarios/{uid}.avisosAdminVistosEm
//                           até quando esta conta já viu as novidades (ISO).
//                           O sino do site usa o mesmo campo.
//
// As duas coleções só são gravadas pelas funções do servidor
// (functions/comunidade.py); pelo site, o admin só lê.
import { auth, db } from './firebase-config.js';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { Timestamp, collection, doc, getCountFromServer, getDoc, query, setDoc, where } from 'firebase/firestore';
import { paginaDoHistorico } from './historico-paginas.js';

const AVISOS = 'avisos_admin';
const HISTORICO = 'comunidade_historico';

// Avisa quem está logado, se é administrador e até quando já viu as
// novidades: aoMudar({ usuario, ehAdmin, vistosEm }).
export function observarAdmin(aoMudar) {
    return onAuthStateChanged(auth, async (usuario) => {
        if (!usuario) {
            aoMudar({ usuario: null, ehAdmin: false, vistosEm: '' });
            return;
        }
        try {
            const perfil = await getDoc(doc(db, 'usuarios', usuario.uid));
            const dados = perfil.exists() ? perfil.data() : {};
            aoMudar({ usuario, ehAdmin: dados.admin === true, vistosEm: dados.avisosAdminVistosEm || '' });
        } catch (erro) {
            console.error('Erro ao verificar acesso de administrador:', erro);
            aoMudar({ usuario, ehAdmin: false, vistosEm: '' });
        }
    });
}

export async function sairDaConta() {
    await signOut(auth);
}

// Avaliações e dúvidas novas, da mais nova para a mais antiga: { registros,
// cursor, haMais } ("em" em ISO).
export function listarAvisos({ quantos = 30, depois = null } = {}) {
    return paginaDoHistorico(AVISOS, { quantos, depois });
}

export function listarHistoricoPagina({ quantos = 100, depois = null } = {}) {
    return paginaDoHistorico(HISTORICO, { quantos, depois });
}

// "Marcar tudo como visto": devolve a hora gravada (ISO)
export async function marcarAvisosVistos() {
    const usuario = auth.currentUser;
    if (!usuario) throw new Error('Sua sessão terminou. Entre de novo com a conta de administrador.');
    const agora = new Date().toISOString();
    await setDoc(doc(db, 'usuarios', usuario.uid), { avisosAdminVistosEm: agora }, { merge: true });
    return agora;
}

// Contador do item Comunidade no menu do painel: chama aoContar(quantos)
// para quem é admin (avisos depois do último "visto").
export function observarNovidades(aoContar) {
    return onAuthStateChanged(auth, async (usuario) => {
        if (!usuario) return;
        try {
            const perfil = await getDoc(doc(db, 'usuarios', usuario.uid));
            const dados = perfil.exists() ? perfil.data() : {};
            if (dados.admin !== true) return;
            const vistos = new Date(dados.avisosAdminVistosEm || '');
            const consulta = Number.isNaN(vistos.getTime())
                ? collection(db, AVISOS)
                : query(collection(db, AVISOS), where('em', '>', Timestamp.fromDate(vistos)));
            aoContar((await getCountFromServer(consulta)).data().count);
        } catch (erro) {
            console.error('Erro ao contar as novidades da comunidade:', erro);
        }
    });
}
