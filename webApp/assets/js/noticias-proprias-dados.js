// Tudo o que o painel Admin · Notícias próprias e a página da matéria
// (noticia.html) leem e gravam no Firebase passa por aqui. Os roteiros de
// teste (webApp/testes/) trocam este arquivo por uma cópia de mentira com as
// mesmas funções: testes/noticias-proprias-simulado.js.
//
//   noticias_proprias            a notícia completa e o estado dela
//                                (rascunho, agendada ou publicada). Só admin.
//   noticias                     a cópia que o site lê. Entra quando a
//                                notícia é publicada ou agendada (com
//                                publicarEm: as telas escondem até a hora,
//                                como nas notificações) e sai quando ela
//                                volta a rascunho ou é excluída.
//   noticias_proprias_historico  quem fez o quê, com e-mail e hora do
//                                servidor. Só cresce (ver firestore.rules).
//
// Toda gravação vai num lote só (notícia + cópia pública + histórico), para
// uma parte nunca ficar sem a outra.
import { auth, db } from './firebase-config.js';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import {
    collection, doc, getDoc, getDocs, limit, orderBy, query, serverTimestamp, where, writeBatch
} from 'firebase/firestore';
import { prepararGravacao } from './noticias-proprias-util.js';

const PROPRIAS = 'noticias_proprias';
const PUBLICADAS = 'noticias';
const HISTORICO = 'noticias_proprias_historico';

const ENVIAR_IMAGEM_URL = (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
    ? 'http://127.0.0.1:5001/futuroplus-bce54/southamerica-east1/enviar_imagem_noticia'
    : 'https://southamerica-east1-futuroplus-bce54.cloudfunctions.net/enviar_imagem_noticia';

// Largura máxima das imagens enviadas: cobre a coluna da matéria em tela de
// alta densidade sem pesar (fica em torno de 200 KB em WebP).
const LARGURA_IMAGEM = 1600;

const lerDocs = (snap) => snap.docs.map((d) => ({ id: d.id, ...d.data() }));

// ========================================================
// Login do painel
// ========================================================

// aoMudar({ usuario, ehAdmin }); usuario é null quando ninguém entrou.
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
// Leitura
// ========================================================

// Endereço novo, antes mesmo de salvar: as imagens já sobem para a pasta
// certa enquanto a notícia é escrita.
export function novoId() {
    return doc(collection(db, PROPRIAS)).id;
}

// Todas as notícias próprias, a mexida por último primeiro.
export async function listarNoticiasProprias() {
    const lista = lerDocs(await getDocs(collection(db, PROPRIAS)));
    return lista.sort((a, b) => String(b.alteradaEm || '').localeCompare(String(a.alteradaEm || '')));
}

export async function lerNoticiaPropria(id) {
    const registro = await getDoc(doc(db, PROPRIAS, id));
    return registro.exists() ? { id: registro.id, ...registro.data() } : null;
}

// A cópia pública (o que qualquer visitante vê). null se não existe.
export async function lerNoticiaPublicada(id) {
    const registro = await getDoc(doc(db, PUBLICADAS, id));
    return registro.exists() ? { id: registro.id, ...registro.data() } : null;
}

// O histórico, do mais novo para o mais antigo. Com noticiaId, só o daquela
// notícia (ordenado aqui mesmo, para não precisar de índice composto).
export async function listarHistorico({ noticiaId, quantos = 100 } = {}) {
    const consulta = noticiaId
        ? query(collection(db, HISTORICO), where('noticiaId', '==', noticiaId))
        : query(collection(db, HISTORICO), orderBy('em', 'desc'), limit(quantos));
    const registros = lerDocs(await getDocs(consulta)).map((registro) => ({
        ...registro,
        em: registro.em?.toDate ? registro.em.toDate().toISOString() : registro.em || null
    }));
    return registros
        .sort((a, b) => String(b.em || '').localeCompare(String(a.em || '')))
        .slice(0, quantos);
}

// ========================================================
// Gravação
// ========================================================

function usuarioLogado() {
    const usuario = auth.currentUser;
    if (!usuario) throw new Error('Sua sessão terminou. Entre de novo com a conta de administrador.');
    return usuario;
}

function registroDoHistorico(usuario, noticiaId, titulo, acao, detalhe = '') {
    return {
        noticiaId,
        titulo: titulo || '(sem título)',
        acao,
        detalhe,
        email: usuario.email || '',
        uid: usuario.uid,
        em: serverTimestamp()
    };
}

// Salva a notícia (as ações estão em prepararGravacao, no util). noticia: o
// que está no editor, junto com o que já estava guardado. Devolve a notícia
// como ficou guardada.
export async function salvarNoticiaPropria(noticia, acao, opcoes = {}) {
    const usuario = usuarioLogado();
    const id = noticia.id || novoId();
    const { registro, publica, acaoHistorico, detalhe } = prepararGravacao(noticia, acao, opcoes, { email: usuario.email || '' });

    const lote = writeBatch(db);
    lote.set(doc(db, PROPRIAS, id), registro);
    // a cópia do site só muda na aprovação ou quando sai do ar
    if (publica) lote.set(doc(db, PUBLICADAS, id), publica);
    else if (publica === null) lote.delete(doc(db, PUBLICADAS, id));
    lote.set(doc(collection(db, HISTORICO)),
        registroDoHistorico(usuario, id, registro.titulo, acaoHistorico, detalhe));
    await lote.commit();
    return { id, ...registro };
}

// Exclui a notícia (do painel e do site). O histórico fica, com o registro
// da exclusão. As imagens são apagadas depois, sem travar se der errado.
export async function excluirNoticiaPropria(noticia) {
    const usuario = usuarioLogado();
    const lote = writeBatch(db);
    lote.delete(doc(db, PROPRIAS, noticia.id));
    lote.delete(doc(db, PUBLICADAS, noticia.id));
    lote.set(doc(collection(db, HISTORICO)), registroDoHistorico(usuario, noticia.id, noticia.titulo, 'excluiu'));
    await lote.commit();

    try {
        await chamarFuncaoDeImagem({ id: noticia.id, acao: 'apagar' });
    } catch (erro) {
        console.warn('A notícia foi excluída, mas as imagens ficaram no Storage:', erro);
    }
}

// ========================================================
// Imagens (reduzidas aqui e guardadas pela função enviar_imagem_noticia)
// ========================================================

function paraBase64(blob) {
    return new Promise((resolve, reject) => {
        const leitor = new FileReader();
        leitor.onload = () => resolve(String(leitor.result).split(',')[1] || '');
        leitor.onerror = () => reject(leitor.error);
        leitor.readAsDataURL(blob);
    });
}

async function prepararImagem(arquivo) {
    if (!arquivo?.type?.startsWith('image/')) {
        throw new Error('O arquivo não é uma imagem (use JPG, PNG ou WebP).');
    }
    let imagem;
    try {
        imagem = await createImageBitmap(arquivo);
    } catch {
        throw new Error('Não consegui abrir essa imagem (use JPG, PNG ou WebP).');
    }
    const escala = Math.min(1, LARGURA_IMAGEM / imagem.width);
    const tela = document.createElement('canvas');
    tela.width = Math.round(imagem.width * escala);
    tela.height = Math.round(imagem.height * escala);
    tela.getContext('2d').drawImage(imagem, 0, 0, tela.width, tela.height);
    const blob = await new Promise((resolve) => tela.toBlob(resolve, 'image/webp', 0.85));
    if (!blob) throw new Error('Não consegui preparar a imagem para envio.');
    // navegador sem WebP devolve PNG; a função aceita os dois
    return { base64: await paraBase64(blob), tipo: blob.type || 'image/webp' };
}

async function chamarFuncaoDeImagem(corpo) {
    const usuario = usuarioLogado();
    let resposta;
    try {
        resposta = await fetch(ENVIAR_IMAGEM_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + await usuario.getIdToken()
            },
            body: JSON.stringify(corpo)
        });
    } catch {
        throw new Error('Não consegui falar com a função de imagens (enviar_imagem_noticia). '
            + 'Se ela ainda não foi publicada, faça o deploy das funções.');
    }
    const dados = await resposta.json().catch(() => ({}));
    if (!resposta.ok) throw new Error(dados.erro || `O servidor respondeu com erro ${resposta.status}.`);
    return dados;
}

// Sobe uma imagem para a pasta da notícia e devolve o endereço público.
export async function enviarImagemNoticia(noticiaId, arquivo) {
    const { base64, tipo } = await prepararImagem(arquivo);
    const { url } = await chamarFuncaoDeImagem({ id: noticiaId, tipo, imagem: base64 });
    return url;
}
