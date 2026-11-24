// Envio do PDF da matriz curricular (Etec) pelo painel Admin · Cursos. O
// painel já lê a grade por OCR no próprio navegador (admin-matriz.js); este
// módulo só guarda o arquivo em si, para a página do curso poder oferecer o
// botão "Plano de curso (PDF)" mesmo sem um link oficial. Quem guarda no
// Storage é a função enviar_matriz.
import { auth } from './firebase-config.js';

const ENVIAR_MATRIZ_URL = (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
    ? 'http://127.0.0.1:5001/futuroplus-bce54/southamerica-east1/enviar_matriz'
    : 'https://southamerica-east1-futuroplus-bce54.cloudfunctions.net/enviar_matriz';

function paraBase64(blob) {
    return new Promise((resolve, reject) => {
        const leitor = new FileReader();
        leitor.onload = () => resolve(String(leitor.result).split(',')[1] || '');
        leitor.onerror = () => reject(leitor.error);
        leitor.readAsDataURL(blob);
    });
}

// id: id do curso. Devolve { url }.
export async function enviarMatriz({ id, arquivo }) {
    const usuario = auth.currentUser;
    if (!usuario) throw new Error('faça login de novo');

    const pdf = await paraBase64(arquivo);

    let resposta;
    try {
        resposta = await fetch(ENVIAR_MATRIZ_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + await usuario.getIdToken()
            },
            body: JSON.stringify({ id, pdf })
        });
    } catch {
        throw new Error('não consegui falar com a função de envio (enviar_matriz). '
            + 'Se ela ainda não foi publicada, faça o deploy das funções');
    }
    const dados = await resposta.json().catch(() => ({}));
    if (!resposta.ok) throw new Error(dados.erro || `erro ${resposta.status}`);
    return dados;
}
