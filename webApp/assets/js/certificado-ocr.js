// Leitura do certificado antes de subir: confere se a imagem parece mesmo um
// certificado e borra o CPF.
//
// O OCR roda no navegador (Tesseract.js). É gratuito, e tem uma vantagem de
// privacidade: a imagem com CPF é analisada no computador do aluno, não
// precisa passar por um serviço de fora para isso.

import { createWorker } from 'tesseract.js';

// Palavras que aparecem em praticamente todo certificado. É um filtro de
// protótipo: pega imagem trocada por engano, não impede fraude.
const TERMOS_CERTIFICADO = [
    'certificado', 'certificamos', 'certifica', 'certificate',
    'conclusao', 'concluiu', 'participacao', 'participou',
    'carga horaria', 'horas', 'curso', 'declaramos'
];

const TERMOS_INSTITUICAO = [
    'etec', 'fatec', 'centro paula souza', 'ceeteps', 'paula souza',
    'senai', 'senac', 'sesi', 'ifsp', 'instituto federal', 'universidade',
    'faculdade', 'escola'
];

// CPF impresso: 000.000.000-00 ou 11 dígitos seguidos.
const PADRAO_CPF = /(\d{3}\.?\d{3}\.?\d{3}-?\d{2})/;

export function normalizarTexto(texto) {
    return (texto || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

// Recebe o texto lido e devolve o que encontramos, sem julgar sozinho:
// quem decide o que fazer é a tela.
export function analisarTexto(texto) {
    const limpo = normalizarTexto(texto);

    const termos = TERMOS_CERTIFICADO.filter((termo) => limpo.includes(termo));
    const instituicoes = TERMOS_INSTITUICAO.filter((termo) => limpo.includes(termo));
    const horas = limpo.match(/(\d{1,4})\s*horas?/);
    const codigo = limpo.match(/(?:codigo|validacao|autenticacao)[^a-z0-9]{0,10}([a-z0-9-]{6,})/);

    return {
        pareceCertificado: termos.length > 0,
        termosEncontrados: termos,
        instituicao: instituicoes[0] || '',
        cargaHoraria: horas ? Number(horas[1]) : null,
        codigoValidacao: codigo ? codigo[1] : '',
        temCpf: PADRAO_CPF.test(limpo.replace(/\s/g, ''))
    };
}

// O nome do certificado bate com o nome da conta? Comparamos por partes,
// porque OCR erra letras e o certificado às vezes traz o nome completo.
export function nomeAparece(texto, nomeDaConta) {
    const limpo = normalizarTexto(texto);
    const partes = normalizarTexto(nomeDaConta).split(' ').filter((parte) => parte.length > 2);
    if (!partes.length) return false;
    const encontradas = partes.filter((parte) => limpo.includes(parte));
    return encontradas.length >= Math.min(2, partes.length);
}

// Palavras que o Tesseract devolveu com posição: usamos para achar o CPF na
// imagem e cobrir só aquele pedaço.
export function areasDeCpf(palavras) {
    return (palavras || [])
        .filter((palavra) => PADRAO_CPF.test((palavra.text || '').replace(/\s/g, '')))
        .map((palavra) => palavra.bbox);
}

// Desenha a imagem num canvas e borra as áreas indicadas.
export function borrarAreas(imagem, areas, { margem = 6 } = {}) {
    const canvas = document.createElement('canvas');
    canvas.width = imagem.naturalWidth || imagem.width;
    canvas.height = imagem.naturalHeight || imagem.height;

    const contexto = canvas.getContext('2d');
    contexto.drawImage(imagem, 0, 0);

    areas.forEach((area) => {
        const x = Math.max(0, area.x0 - margem);
        const y = Math.max(0, area.y0 - margem);
        const largura = Math.min(canvas.width - x, (area.x1 - area.x0) + margem * 2);
        const altura = Math.min(canvas.height - y, (area.y1 - area.y0) + margem * 2);

        // desenha o próprio pedaço esticado e desfocado por cima: fica como
        // uma tarja borrada, sem deixar o texto legível
        contexto.save();
        contexto.filter = 'blur(12px)';
        contexto.drawImage(canvas, x, y, largura, altura, x, y, largura, altura);
        contexto.restore();

        contexto.fillStyle = 'rgba(27, 31, 59, 0.35)';
        contexto.fillRect(x, y, largura, altura);
    });

    return canvas;
}

// Reduz a imagem antes de tudo: o OCR fica mais rápido e o arquivo que vai
// para o Storage fica pequeno (uns 200-400 KB em vez de vários MB do celular).
export const LARGURA_MAXIMA = 1600;

export async function reduzirImagem(arquivo, larguraMaxima = LARGURA_MAXIMA) {
    const imagem = new Image();
    imagem.src = URL.createObjectURL(arquivo);
    await imagem.decode();

    if (imagem.naturalWidth <= larguraMaxima) return { arquivo, imagem };

    const escala = larguraMaxima / imagem.naturalWidth;
    const canvas = document.createElement('canvas');
    canvas.width = larguraMaxima;
    canvas.height = Math.round(imagem.naturalHeight * escala);
    canvas.getContext('2d').drawImage(imagem, 0, 0, canvas.width, canvas.height);

    const reduzido = await canvasParaArquivo(canvas, arquivo.name.replace(/\.[^.]+$/, '') + '.jpg');
    const imagemReduzida = new Image();
    imagemReduzida.src = URL.createObjectURL(reduzido);
    await imagemReduzida.decode();

    return { arquivo: reduzido, imagem: imagemReduzida };
}

export function canvasParaArquivo(canvas, nome) {
    return new Promise((resolve) => {
        canvas.toBlob((blob) => resolve(new File([blob], nome, { type: 'image/jpeg' })), 'image/jpeg', 0.85);
    });
}

// Lê a imagem e devolve texto, palavras (com posição) e a análise.
export async function lerCertificado(arquivo, aoProgresso = () => {}) {
    const worker = await createWorker('por', 1, {
        logger: (m) => {
            if (m.status === 'recognizing text') aoProgresso(Math.round(m.progress * 100));
        }
    });

    try {
        const { data } = await worker.recognize(arquivo, {}, { blocks: true, text: true });
        const palavras = (data.blocks || [])
            .flatMap((bloco) => bloco.paragraphs || [])
            .flatMap((paragrafo) => paragrafo.lines || [])
            .flatMap((linha) => linha.words || []);

        return { texto: data.text || '', palavras, analise: analisarTexto(data.text || '') };
    } finally {
        await worker.terminate();
    }
}
