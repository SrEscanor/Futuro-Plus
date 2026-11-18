// Leitura do certificado antes de subir: confere se a imagem parece mesmo um
// certificado e borra o CPF.
//
// O OCR roda no navegador (Tesseract.js). É gratuito, e tem uma vantagem de
// privacidade: a imagem com CPF é analisada no computador do aluno, não
// precisa passar por um serviço de fora para isso.

import { createWorker } from 'tesseract.js';

// Palavras que aparecem em praticamente todo certificado. É um filtro de
// protótipo: pega imagem trocada por engano, não impede fraude.
// "conclu" cobre conclusão/concluiu/concluído/concluída de uma vez: a forma
// "concluído" (particípio, bem comum em diploma: "por ter concluído") não
// batia com as palavras exatas de antes e deixava o filtro de lado.
const TERMOS_CERTIFICADO = [
    'certificado', 'certificamos', 'certifica', 'certificate', 'diploma',
    'conclu', 'participacao', 'participou',
    'carga horaria', 'horas', 'curso', 'declaramos'
];

const TERMOS_INSTITUICAO = [
    'etec', 'fatec', 'centro paula souza', 'ceeteps', 'paula souza',
    'senai', 'senac', 'sesi', 'ifsp', 'instituto federal', 'universidade',
    'faculdade', 'escola'
];

// CPF impresso: 000.000.000-00 ou 11 dígitos seguidos.
const PADRAO_CPF = /(\d{3}\.?\d{3}\.?\d{3}-?\d{2})/;

// Certificado impresso costuma ter texto justificado, e isso corta palavra
// com hífen no fim da linha ("desenvolvi-\nmento"). O OCR devolve as duas
// metades como palavras separadas, e nada que compara palavra por palavra
// (nome, curso, escola) reconhece a palavra inteira assim. Aqui a emenda:
// hífen no fim de uma linha, seguido de letra no começo da próxima, vira a
// palavra emendada — antes de qualquer outra leitura do texto.
export function emendarQuebraDeLinha(texto) {
    return (texto || '').replace(/([a-zà-ÿ])-\s*\n\s*([a-zà-ÿ])/gi, '$1$2');
}

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

// Palavras que o Tesseract devolveu com posição: usamos para achar o CPF na
// imagem e cobrir só aquele pedaço. Às vezes o CPF cai quebrado em duas
// palavras (a leitura separa por causa de uma quebra de linha no
// certificado, ou um espaço que o OCR enxergou onde não tinha) — nesse caso
// nenhuma palavra sozinha bate com o padrão, então também testamos a junção
// de até 3 palavras seguidas antes de desistir daquele trecho.
export function areasDeCpf(palavras = []) {
    const areas = [];
    for (let i = 0; i < palavras.length; i += 1) {
        if (PADRAO_CPF.test((palavras[i].text || '').replace(/\s/g, ''))) {
            areas.push(palavras[i].bbox);
            continue;
        }
        for (let fim = i + 1; fim < Math.min(palavras.length, i + 3); fim += 1) {
            const junto = palavras.slice(i, fim + 1).map((p) => p.text || '').join('').replace(/\s/g, '');
            if (PADRAO_CPF.test(junto)) {
                palavras.slice(i, fim + 1).forEach((p) => areas.push(p.bbox));
                break;
            }
        }
    }
    return areas;
}

// Acha, nas palavras lidas, onde está o rótulo "RG" ou "R.G." a partir da
// posição "inicio" (juntando até 3 palavras seguidas: o rótulo pode vir
// quebrado em "R." e "G.", ou numa quebra de linha — como já lemos pela
// lista de palavras do Tesseract, e não pelo texto corrido, a quebra de
// linha nem entra na conta aqui). Devolve o índice da última palavra do
// rótulo, ou null se não achar.
function acharRotuloDeRg(palavras, inicio) {
    let junto = '';
    for (let fim = inicio; fim < Math.min(palavras.length, inicio + 3); fim += 1) {
        junto += (palavras[fim].text || '').replace(/[^a-zA-Z]/g, '').toLowerCase();
        if (junto === 'rg') return fim;
        if (!'rg'.startsWith(junto)) return null;
    }
    return null;
}

// O RG não tem um formato fixo de dígitos como o CPF (a pontuação e a
// quantidade de números mudam de estado para estado), então aqui a gente
// cobre a partir do rótulo "RG"/"R.G." em vez de tentar reconhecer o número
// sozinho: cobre o rótulo e, logo depois, as palavras que ainda parecem
// número (dígitos, pontuação ou sigla de estado), até 3 palavras.
export function areasDeRg(palavras = []) {
    const areas = [];
    for (let i = 0; i < palavras.length; i += 1) {
        const fimRotulo = acharRotuloDeRg(palavras, i);
        if (fimRotulo === null) continue;

        palavras.slice(i, fimRotulo + 1).forEach((p) => areas.push(p.bbox));
        for (let j = fimRotulo + 1; j < Math.min(palavras.length, fimRotulo + 4); j += 1) {
            const texto = palavras[j].text || '';
            if (!/\d/.test(texto) || !/^[\d.\-/a-zA-Z]+[,;.]?$/.test(texto)) break;
            areas.push(palavras[j].bbox);
        }
        i = fimRotulo;
    }
    return areas;
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

        // Tarja sólida e 100% opaca — blur sozinho (o que tinha antes) não
        // garante que o texto fique ilegível, e com opacidade parcial o CPF
        // ainda passava por baixo. Cobrir de verdade é a única forma segura.
        contexto.fillStyle = '#1b1f3b';
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

// Imagem pequena (print de tela, foto que veio pelo WhatsApp) lê mal: cada
// letra fica com poucos pixels. Num certificado de Etec com 900 px de
// largura, a leitura direta trouxe só a primeira linha do texto; ampliado,
// veio o parágrafo inteiro. A ampliação é só para a leitura: o arquivo que
// vai para o mural continua o original.
const LARGURA_PARA_LEITURA = 1800;
const AMPLIACAO_MAXIMA = 2.5;

async function prepararParaLeitura(arquivo) {
    const imagem = new Image();
    imagem.src = URL.createObjectURL(arquivo);
    await imagem.decode();

    const escala = Math.min(AMPLIACAO_MAXIMA, LARGURA_PARA_LEITURA / imagem.naturalWidth);
    if (escala <= 1.15) return { alvo: arquivo, escala: 1 };

    const canvas = document.createElement('canvas');
    canvas.width = Math.round(imagem.naturalWidth * escala);
    canvas.height = Math.round(imagem.naturalHeight * escala);
    const contexto = canvas.getContext('2d');
    contexto.imageSmoothingQuality = 'high';
    contexto.drawImage(imagem, 0, 0, canvas.width, canvas.height);
    return { alvo: canvas, escala };
}

// Lê a imagem e devolve texto, palavras (com posição) e a análise.
export async function lerCertificado(arquivo, aoProgresso = () => {}) {
    const worker = await createWorker('por', 1, {
        logger: (m) => {
            if (m.status === 'recognizing text') aoProgresso(Math.round(m.progress * 100));
        }
    });

    try {
        const { alvo, escala } = await prepararParaLeitura(arquivo);
        const { data } = await worker.recognize(alvo, {}, { blocks: true, text: true });
        const palavras = (data.blocks || [])
            .flatMap((bloco) => bloco.paragraphs || [])
            .flatMap((paragrafo) => paragrafo.lines || [])
            .flatMap((linha) => linha.words || [])
            // as posições voltam para o tamanho da imagem original, que é
            // onde o CPF vai ser coberto
            .map((palavra) => (escala === 1 ? palavra : {
                ...palavra,
                bbox: {
                    x0: palavra.bbox.x0 / escala,
                    y0: palavra.bbox.y0 / escala,
                    x1: palavra.bbox.x1 / escala,
                    y1: palavra.bbox.y1 / escala
                }
            }));

        const texto = emendarQuebraDeLinha(data.text || '');
        return { texto, palavras, analise: analisarTexto(texto) };
    } finally {
        await worker.terminate();
    }
}
