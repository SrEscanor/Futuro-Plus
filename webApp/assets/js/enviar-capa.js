// Envio das imagens de capa (de um eixo ou de um curso) pelo painel
// Admin · Cursos. A imagem é reduzida no navegador antes de subir, e quem
// guarda no Storage é a função enviar_capa.
import { auth } from './firebase-config.js';
import { CAPA_RECOMENDADA } from './capas-eixos.js';

const ENVIAR_CAPA_URL = (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
    ? 'http://127.0.0.1:5001/futuroplus-bce54/southamerica-east1/enviar_capa'
    : 'https://southamerica-east1-futuroplus-bce54.cloudfunctions.net/enviar_capa';

// Abaixo disso a imagem aparece esticada nas telas de computador.
const LARGURA_MINIMA_BOA = 1000;

function paraBase64(blob) {
    return new Promise((resolve, reject) => {
        const leitor = new FileReader();
        leitor.onload = () => resolve(String(leitor.result).split(',')[1] || '');
        leitor.onerror = () => reject(leitor.error);
        leitor.readAsDataURL(blob);
    });
}

// Reduz para a largura recomendada (nunca aumenta) e converte para WebP, que
// pesa bem menos que JPG ou PNG com a mesma qualidade.
async function prepararImagem(arquivo) {
    if (!arquivo.type.startsWith('image/')) {
        throw new Error('o arquivo não é uma imagem (use JPG, PNG ou WebP)');
    }

    let imagem;
    try {
        imagem = await createImageBitmap(arquivo);
    } catch {
        throw new Error('não consegui abrir essa imagem (use JPG, PNG ou WebP)');
    }

    const escala = Math.min(1, CAPA_RECOMENDADA.largura / imagem.width);
    const tela = document.createElement('canvas');
    tela.width = Math.round(imagem.width * escala);
    tela.height = Math.round(imagem.height * escala);
    tela.getContext('2d').drawImage(imagem, 0, 0, tela.width, tela.height);

    const blob = await new Promise((resolve) => tela.toBlob(resolve, 'image/webp', 0.86));
    if (!blob) throw new Error('não consegui preparar a imagem para envio');

    const avisos = [];
    if (imagem.width < LARGURA_MINIMA_BOA) {
        avisos.push(`A imagem tem só ${imagem.width} px de largura e pode ficar borrada em telas grandes `
            + `(o recomendado é ${CAPA_RECOMENDADA.largura} × ${CAPA_RECOMENDADA.altura} px).`);
    }
    if (imagem.width / imagem.height < 1.8) {
        avisos.push('Ela é mais alta do que a capa: a parte de cima e a de baixo serão cortadas.');
    }

    // navegador sem WebP devolve PNG; a função aceita os dois
    return { base64: await paraBase64(blob), tipo: blob.type || 'image/webp', aviso: avisos.join(' ') };
}

async function chamar(corpo) {
    const usuario = auth.currentUser;
    if (!usuario) throw new Error('faça login de novo');

    let resposta;
    try {
        resposta = await fetch(ENVIAR_CAPA_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + await usuario.getIdToken()
            },
            body: JSON.stringify(corpo)
        });
    } catch {
        throw new Error('não consegui falar com a função de envio (enviar_capa). '
            + 'Se ela ainda não foi publicada, faça o deploy das funções');
    }
    const dados = await resposta.json().catch(() => ({}));
    if (!resposta.ok) throw new Error(dados.erro || `erro ${resposta.status}`);
    return dados;
}

// alvo: 'eixo' ou 'curso'; id: slug do eixo ou id do curso.
// Devolve { url, aviso }.
export async function enviarCapa({ alvo, id, arquivo }) {
    const { base64, tipo, aviso } = await prepararImagem(arquivo);
    const { url } = await chamar({ alvo, id, tipo, imagem: base64 });
    return { url, aviso };
}

export async function removerCapaDoEixo(slug) {
    await chamar({ alvo: 'eixo', id: slug, acao: 'remover' });
}
