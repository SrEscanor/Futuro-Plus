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
// Toda gravação vai junta (notícia + cópia pública + histórico), para uma
// parte nunca ficar sem a outra. Quando a cópia do site é apagada (a notícia
// sai do site ou é excluída), ela sai também do carrossel da Início
// (configuracoes/destaques_inicio), na mesma transação; essa saída fica no
// histórico do painel Notícias (noticias_historico), onde está o carrossel.
import { auth, db } from './firebase-config.js';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import {
    collection, doc, getDoc, getDocs, limit, orderBy, query, runTransaction, serverTimestamp, where, writeBatch
} from 'firebase/firestore';
import { prepararGravacao } from './noticias-proprias-util.js';
import { DOC_DESTAQUES, detalheComSaidaDoCarrossel, mudarListaDeDestaques } from './destaques-util.js';

const PROPRIAS = 'noticias_proprias';
const PUBLICADAS = 'noticias';
const HISTORICO = 'noticias_proprias_historico';
const HISTORICO_DO_PAINEL_NOTICIAS = 'noticias_historico';

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

// A cópia do site vai ser apagada: lê o carrossel da Início e, se a notícia
// estava lá, tira (na mesma transação), com o registro no histórico do
// painel Notícias. motivo: o detalhe desse registro. Devolve true se tirou.
async function tirarDoCarrosselNaTransacao(transacao, usuario, id, titulo, motivo) {
    const carrossel = await transacao.get(doc(db, ...DOC_DESTAQUES));
    const mudanca = mudarListaDeDestaques(carrossel.exists() ? carrossel.data().itens : [], 'tirar',
        { id, titulo }, { motivo });
    if (!mudanca) return false;
    transacao.set(doc(db, ...DOC_DESTAQUES), {
        itens: mudanca.itens,
        atualizadoEm: serverTimestamp(),
        atualizadoPor: usuario.email || ''
    });
    transacao.set(doc(collection(db, HISTORICO_DO_PAINEL_NOTICIAS)),
        registroDoHistorico(usuario, id, mudanca.titulo, mudanca.acao, mudanca.detalhe));
    return true;
}

// Salva a notícia (as ações estão em prepararGravacao, no util). noticia: o
// que está no editor, junto com o que já estava guardado. Devolve a notícia
// como ficou guardada e, quando ela saiu do site, saiuDoCarrossel (true se
// estava no carrossel da Início e saiu junto; não faz parte da notícia).
export async function salvarNoticiaPropria(noticia, acao, opcoes = {}) {
    const usuario = usuarioLogado();
    const id = noticia.id || novoId();
    const { registro, publica, acaoHistorico, detalhe } = prepararGravacao(noticia, acao, opcoes, { email: usuario.email || '' });

    // o mesmo em lote ou em transação (as duas têm set e delete)
    const gravar = (escrita, detalheDoHistorico) => {
        escrita.set(doc(db, PROPRIAS, id), registro);
        // a cópia do site só muda na aprovação ou quando sai do ar
        if (publica) escrita.set(doc(db, PUBLICADAS, id), publica);
        else if (publica === null) escrita.delete(doc(db, PUBLICADAS, id));
        escrita.set(doc(collection(db, HISTORICO)),
            registroDoHistorico(usuario, id, registro.titulo, acaoHistorico, detalheDoHistorico));
    };

    if (publica === null) {
        const saiuDoCarrossel = await runTransaction(db, async (transacao) => {
            const tirou = await tirarDoCarrosselNaTransacao(transacao, usuario, id, registro.titulo, 'saiu do site');
            gravar(transacao, tirou ? detalheComSaidaDoCarrossel(acaoHistorico, detalhe) : detalhe);
            return tirou;
        });
        return { id, ...registro, saiuDoCarrossel };
    }

    const lote = writeBatch(db);
    gravar(lote, detalhe);
    await lote.commit();
    return { id, ...registro };
}

// Exclui a notícia (do painel, do site e do carrossel da Início). O
// histórico fica, com o registro da exclusão. As imagens são apagadas
// depois, sem travar se der errado. Devolve { saiuDoCarrossel }.
export async function excluirNoticiaPropria(noticia) {
    const usuario = usuarioLogado();
    const saiuDoCarrossel = await runTransaction(db, async (transacao) => {
        const tirou = await tirarDoCarrosselNaTransacao(transacao, usuario, noticia.id, noticia.titulo,
            'a notícia foi excluída');
        transacao.delete(doc(db, PROPRIAS, noticia.id));
        transacao.delete(doc(db, PUBLICADAS, noticia.id));
        transacao.set(doc(collection(db, HISTORICO)), registroDoHistorico(usuario, noticia.id, noticia.titulo,
            'excluiu', tirou ? detalheComSaidaDoCarrossel('excluiu') : ''));
        return tirou;
    });

    try {
        await chamarFuncaoDeImagem({ id: noticia.id, acao: 'apagar' });
    } catch (erro) {
        console.warn('A notícia foi excluída, mas as imagens ficaram no Storage:', erro);
    }
    return { saiuDoCarrossel };
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
