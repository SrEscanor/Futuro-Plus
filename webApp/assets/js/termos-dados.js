// Tudo o que a tela Admin · Termos e Privacidade lê e grava no Firebase
// passa por aqui. O roteiro de teste (webApp/testes/painel-termos.js) troca
// este arquivo por uma cópia de mentira com as mesmas funções:
// testes/termos-simulado.js.
//
//   configuracoes/termos-de-uso e configuracoes/politica-privacidade
//       o texto que o site mostra: { versao, html, atualizadoEm,
//       atualizadoPor (uid), atualizadoPorEmail }. O gate-termos.js compara
//       a versão de cada um com a que a conta aceitou.
//   termos_historico
//       cada publicação: { documento, titulo, acao: 'publicou', versao,
//       versaoAnterior, html (o texto inteiro daquela versão), email, uid,
//       em }. Só cresce (ver firestore.rules).
import { auth, db } from './firebase-config.js';
import {
    onAuthStateChanged, signOut, EmailAuthProvider, GoogleAuthProvider,
    reauthenticateWithCredential, reauthenticateWithPopup
} from 'firebase/auth';
import { collection, doc, getDoc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { paginaDoHistorico } from './historico-paginas.js';

export const DOCUMENTOS = {
    termos: { colecaoId: 'termos-de-uso', titulo: 'Termos de Uso' },
    privacidade: { colecaoId: 'politica-privacidade', titulo: 'Política de Privacidade' }
};

const HISTORICO = 'termos_historico';

// ========================================================
// Login
// ========================================================

// aoMudar({ usuario, ehAdmin, entrouComGoogle }); usuario é null quando
// ninguém entrou.
export function observarAdmin(aoMudar) {
    return onAuthStateChanged(auth, async (usuario) => {
        if (!usuario) {
            aoMudar({ usuario: null, ehAdmin: false, entrouComGoogle: false });
            return;
        }
        const entrouComGoogle = usuario.providerData[0]?.providerId === 'google.com';
        try {
            const perfil = await getDoc(doc(db, 'usuarios', usuario.uid));
            aoMudar({ usuario, ehAdmin: perfil.exists() && perfil.data().admin === true, entrouComGoogle });
        } catch (erro) {
            console.error('Erro ao verificar acesso de administrador:', erro);
            aoMudar({ usuario, ehAdmin: false, entrouComGoogle });
        }
    });
}

export async function sairDaConta() {
    await signOut(auth);
}

// Pede a senha de novo (ou a confirmação do Google) antes de publicar, que
// afeta todo mundo. Erro com code 'senha-necessaria' quando falta a senha.
export async function confirmarIdentidade(senha) {
    const usuario = auth.currentUser;
    if (!usuario) throw new Error('Sua sessão terminou. Entre de novo com a conta de administrador.');
    if (usuario.providerData[0]?.providerId === 'google.com') {
        await reauthenticateWithPopup(usuario, new GoogleAuthProvider());
        return;
    }
    if (!senha) throw Object.assign(new Error('Senha necessária'), { code: 'senha-necessaria' });
    await reauthenticateWithCredential(usuario, EmailAuthProvider.credential(usuario.email, senha));
}

// ========================================================
// Leitura
// ========================================================

// O que está no ar: { versao, html, atualizadoEm, atualizadoPorEmail }, ou
// null quando ninguém publicou ainda (o site mostra o texto padrão).
export async function lerDocumento(chave) {
    const registro = await getDoc(doc(db, 'configuracoes', DOCUMENTOS[chave].colecaoId));
    if (!registro.exists() || !registro.data().versao) return null;
    const dados = registro.data();
    return {
        versao: dados.versao,
        html: dados.html || '',
        atualizadoEm: dados.atualizadoEm || null,
        atualizadoPorEmail: dados.atualizadoPorEmail || ''
    };
}

// Uma página do histórico: { registros, cursor, haMais }, do mais novo para
// o mais antigo, "em" em ISO. depois = o cursor da página anterior.
export function listarHistoricoPagina({ quantos = 100, depois = null } = {}) {
    return paginaDoHistorico(HISTORICO, { quantos, depois });
}

// ========================================================
// Publicação
// ========================================================

// Publica os documentos que mudaram. lista: [{ chave, html, versaoBase }],
// versaoBase = a versão que estava no ar quando o texto foi carregado no
// editor (0 se nunca foi publicado). Tudo vai numa transação: cada
// documento sobe uma versão e ganha um registro no histórico, com o texto
// inteiro. Se outra pessoa publicou uma versão nova desde então, nada é
// gravado e vem um erro com code 'versao-mudou' e o titulo do documento.
// Devolve { termos: versão nova, privacidade: ... } dos que foram publicados.
export async function publicarDocumentos(lista) {
    const usuario = auth.currentUser;
    if (!usuario) throw new Error('Sua sessão terminou. Entre de novo com a conta de administrador.');
    const agora = new Date().toISOString();

    return runTransaction(db, async (transacao) => {
        const refs = lista.map(({ chave }) => doc(db, 'configuracoes', DOCUMENTOS[chave].colecaoId));
        // numa transação, toda leitura vem antes da primeira gravação
        const atuais = await Promise.all(refs.map((ref) => transacao.get(ref)));
        const novas = {};

        lista.forEach(({ chave, versaoBase }, indice) => {
            const versaoNoAr = atuais[indice].exists() ? atuais[indice].data().versao || 0 : 0;
            if (versaoNoAr !== versaoBase) {
                throw Object.assign(new Error(`Outra pessoa publicou uma versão nova de ${DOCUMENTOS[chave].titulo}.`),
                    { code: 'versao-mudou', titulo: DOCUMENTOS[chave].titulo });
            }
        });

        lista.forEach(({ chave, html, versaoBase }, indice) => {
            const versao = versaoBase + 1;
            novas[chave] = versao;
            transacao.set(refs[indice], {
                versao,
                html,
                atualizadoEm: agora,
                atualizadoPor: usuario.uid,
                atualizadoPorEmail: usuario.email || ''
            });
            transacao.set(doc(collection(db, HISTORICO)), {
                documento: chave,
                titulo: DOCUMENTOS[chave].titulo,
                acao: 'publicou',
                versao,
                versaoAnterior: versaoBase,
                html,
                email: usuario.email || '',
                uid: usuario.uid,
                em: serverTimestamp()
            });
        });
        return novas;
    });
}
