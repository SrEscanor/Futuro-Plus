// Leitura da matriz curricular da Etec para a matriz interativa da página do
// curso. Dois formatos:
//   SIGA  PDF com texto (M-Tec e técnico): a tabela é lida por
//         matriz-curricular.js; aqui ela vira o formato da matriz interativa,
//         com as certificações, o TCC e as horas tirados do texto.
//   SEI   matriz homologada colada no ofício do SEI (técnico, por módulos:
//         Teoria | Prática | Total). Quase sempre vem como imagem: a página é
//         lida por OCR (Tesseract.js, no navegador, só no Painel Admin).
// O resultado tem o formato de matriz-interativa.js, e "confiavel" diz se as
// somas bateram com os totais da própria matriz.
import { lerMatrizDoPdf } from './matriz-curricular.js';
import { daMatrizDoSiga, paraNome } from './matriz-interativa.js';

// ========================================================
// OCR das páginas que trazem a matriz como imagem
// ========================================================

async function carregarPdfjs() {
    const [pdfjs, { default: urlDoWorker }] = await Promise.all([
        import('pdfjs-dist'),
        import('pdfjs-dist/build/pdf.worker.min.mjs?url')
    ]);
    pdfjs.GlobalWorkerOptions.workerSrc = urlDoWorker;
    return pdfjs;
}

// Onde estão as imagens da página (em pontos do PDF, y para cima): segue as
// transformações até cada "pinta imagem" — a imagem ocupa o quadrado 1×1
// transformado pela matriz atual.
async function areasDeImagem(pagina, pdfjs) {
    const { OPS } = pdfjs;
    const operacoes = await pagina.getOperatorList();
    const pinta = new Set([OPS.paintImageXObject, OPS.paintInlineImageXObject, OPS.paintJpegXObject].filter((o) => o != null));
    const vezes = (a, b) => [
        a[0] * b[0] + a[2] * b[1], a[1] * b[0] + a[3] * b[1],
        a[0] * b[2] + a[2] * b[3], a[1] * b[2] + a[3] * b[3],
        a[0] * b[4] + a[2] * b[5] + a[4], a[1] * b[4] + a[3] * b[5] + a[5]
    ];
    const pilha = [];
    let m = [1, 0, 0, 1, 0, 0];
    const areas = [];
    operacoes.fnArray.forEach((fn, i) => {
        if (fn === OPS.save) pilha.push(m);
        else if (fn === OPS.restore) m = pilha.pop() || [1, 0, 0, 1, 0, 0];
        else if (fn === OPS.transform) m = vezes(m, operacoes.argsArray[i]);
        else if (pinta.has(fn)) {
            const xs = [m[4], m[4] + m[0], m[4] + m[2], m[4] + m[0] + m[2]];
            const ys = [m[5], m[5] + m[1], m[5] + m[3], m[5] + m[1] + m[3]];
            areas.push({ x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) });
        }
    });
    return areas;
}

// Desenha só a área da imagem, em resolução boa para o OCR (~2200 px de largura)
async function desenharArea(pagina, area) {
    const LARGURA = 2200;
    const base = pagina.getViewport({ scale: 1 });
    const escala = Math.min(6, LARGURA / (area.x1 - area.x0));
    const viewport = pagina.getViewport({
        scale: escala,
        offsetX: -area.x0 * escala,
        offsetY: -(base.height - area.y1) * escala
    });
    const canvas = document.createElement('canvas');
    canvas.width = Math.round((area.x1 - area.x0) * escala);
    canvas.height = Math.round((area.y1 - area.y0) * escala);
    const contexto = canvas.getContext('2d');
    contexto.fillStyle = '#fff';
    contexto.fillRect(0, 0, canvas.width, canvas.height);
    // intent 'print': desenha sem requestAnimationFrame, que o navegador
    // pausa quando a aba não está à vista (o desenho ficava parado para sempre)
    await pagina.render({ canvasContext: contexto, viewport, intent: 'print' }).promise;
    return canvas;
}

// Fundo cinza vira branco e as linhas da tabela somem: com a grade, o OCR lia
// "00" como "oo", juntava bordas aos números e perdia o "TOTAL" das células
// cinza. Traço de letra é curto; linha de tabela atravessa a célula.
export function limparParaOcr(canvas) {
    const contexto = canvas.getContext('2d', { willReadFrequently: true });
    const { width: w, height: h } = canvas;
    const imagem = contexto.getImageData(0, 0, w, h);
    const d = imagem.data;
    const preto = new Uint8Array(w * h);
    for (let i = 0; i < w * h; i += 1) {
        preto[i] = 0.299 * d[i * 4] + 0.587 * d[i * 4 + 1] + 0.114 * d[i * 4 + 2] < 150 ? 1 : 0;
    }
    const apagar = new Uint8Array(w * h);
    const longaH = Math.round(w * 0.04);
    for (let y = 0; y < h; y += 1) {
        let inicio = -1;
        for (let x = 0; x <= w; x += 1) {
            const p = x < w && preto[y * w + x];
            if (p && inicio < 0) inicio = x;
            if (!p && inicio >= 0) {
                if (x - inicio >= longaH) for (let k = inicio; k < x; k += 1) apagar[y * w + k] = 1;
                inicio = -1;
            }
        }
    }
    const longaV = Math.round(h * 0.03);
    for (let x = 0; x < w; x += 1) {
        let inicio = -1;
        for (let y = 0; y <= h; y += 1) {
            const p = y < h && preto[y * w + x];
            if (p && inicio < 0) inicio = y;
            if (!p && inicio >= 0) {
                if (y - inicio >= longaV) for (let k = inicio; k < y; k += 1) apagar[k * w + x] = 1;
                inicio = -1;
            }
        }
    }
    for (let i = 0; i < w * h; i += 1) {
        const v = preto[i] && !apagar[i] ? 0 : 255;
        d[i * 4] = v; d[i * 4 + 1] = v; d[i * 4 + 2] = v; d[i * 4 + 3] = 255;
    }
    contexto.putImageData(imagem, 0, 0);
    return canvas;
}

// Palavras com posição, de cima para baixo: { s, x0, y0, x1, y1 }
function palavrasDoOcr(data, dx = 0, dy = 0) {
    return (data.blocks || []).flatMap((b) => b.paragraphs || []).flatMap((p) => p.lines || []).flatMap((l) => l.words || [])
        .map((w) => ({ s: w.text.trim(), x0: w.bbox.x0 + dx, x1: w.bbox.x1 + dx, y0: w.bbox.y0 + dy, y1: w.bbox.y1 + dy }))
        .filter((p) => p.s);
}

function recortar(canvas, area) {
    const pedaco = document.createElement('canvas');
    pedaco.width = Math.max(1, Math.round(area.x1 - area.x0));
    pedaco.height = Math.max(1, Math.round(area.y1 - area.y0));
    pedaco.getContext('2d').drawImage(canvas, area.x0, area.y0, pedaco.width, pedaco.height, 0, 0, pedaco.width, pedaco.height);
    return pedaco;
}

// Duas leituras: a página inteira (estrutura, nomes, certificações) e, depois,
// só as colunas de números aceitando apenas dígitos — na leitura geral um "50"
// às vezes saía "E)" e um "00", "oo".
async function lerTabelaSeiDaImagem(canvas, worker) {
    await worker.setParameters({ tessedit_pageseg_mode: '3', tessedit_char_whitelist: '' });
    const palavras = palavrasDoOcr((await worker.recognize(canvas, {}, { blocks: true })).data);
    const estrutura = acharEstruturaSei(palavras);
    if (!estrutura) return null;
    // uma coluna de cada vez: com o bloco inteiro, células vizinhas grudavam ("5050")
    await worker.setParameters({ tessedit_pageseg_mode: '6', tessedit_char_whitelist: '0123456789' });
    const numeros = [];
    for (const bloco of estrutura.blocos) {
        const { y0, y1 } = bloco.areaDosNumeros;
        for (const x of Object.values(bloco.colunas)) {
            const area = { x0: Math.max(0, x - bloco.passo * 0.45), x1: x + bloco.passo * 0.45, y0, y1 };
            const lidos = palavrasDoOcr((await worker.recognize(recortar(canvas, area), {}, { blocks: true })).data, area.x0, area.y0);
            numeros.push(...lidos.filter((p) => /^\d{1,4}$/.test(p.s)));
        }
    }
    return montarMatrizSei(palavras, numeros, estrutura);
}

// ========================================================
// Tabela do SEI (técnico por módulos) a partir das palavras com posição.
// Desenho: blocos lado a lado, um por módulo — "MÓDULO I – 1º semestre de
// 2024", "Componentes Curriculares | Teoria | Prática | Total", linhas
// "I.1 – Inglês Instrumental 50 00 50", "TOTAL"; embaixo, a certificação de
// cada etapa e o rodapé com TCC e estágio.
// ========================================================

const ROMANO = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'];
const meio = (p) => (p.y0 + p.y1) / 2;
const mediana = (lista) => {
    const v = [...lista].sort((a, b) => a - b);
    return v.length ? v[Math.floor(v.length / 2)] : 0;
};

function linhasDe(palavras, tolerancia) {
    const linhas = [];
    for (const p of [...palavras].sort((a, b) => meio(a) - meio(b) || a.x0 - b.x0)) {
        const linha = linhas.find((l) => Math.abs(l.y - meio(p)) < tolerancia);
        if (linha) {
            linha.ps.push(p);
            linha.y = linha.ps.reduce((t, q) => t + meio(q), 0) / linha.ps.length;
        } else linhas.push({ y: meio(p), ps: [p] });
    }
    linhas.forEach((l) => {
        l.ps.sort((a, b) => a.x0 - b.x0);
        l.texto = l.ps.map((p) => p.s).join(' ');
    });
    return linhas.sort((a, b) => a.y - b.y);
}

// número lido por OCR sem a lista de dígitos: "oo" = 00, "so" = 50, "5o" = 50
function numeroDoOcr(s) {
    const limpo = String(s).replace(/[oOD]/g, '0').replace(/[sS]/g, '5').replace(/[lI|]/g, '1');
    return /^\d{1,4}$/.test(limpo) ? Number(limpo) : null;
}

// código no começo da linha ("I.1 –", "II.3", "III.8"), do jeito que o OCR lê:
// "1.1-", "11,.6—", "ML.8", "LR:" — até 4 letras ou dígitos, pontuação e o número
const CODIGO = /^[^\p{L}\d]*[\p{L}\d|!]{1,4}[.,:;]{1,2}\d{0,2}[—–=:\-.]*$/u;

// aulas de uma célula: 0 ou múltiplo de 5 (um "1" ou "6" solto é erro de leitura)
const plausivel = (v) => v != null && (v === 0 || (v >= 10 && v <= 2000 && v % 5 === 0));

export function acharEstruturaSei(palavras) {
    if (!palavras.length) return null;
    const altura = mediana(palavras.map((p) => p.y1 - p.y0)) || 20;
    const tolerancia = altura * 0.7;
    // a 1ª linha com "MÓDULO" é o cabeçalho dos blocos (a de baixo, das certificações, também tem)
    const linhaDosModulos = linhasDe(palavras.filter((p) => /^M[ÓO0]DULO$/i.test(p.s)), tolerancia)[0];
    if (!linhaDosModulos) return null;
    const componentes = palavras.filter((p) => /^Componentes$/i.test(p.s) && meio(p) > linhaDosModulos.y)
        .sort((a, b) => a.x0 - b.x0);
    const inicios = (componentes.length >= linhaDosModulos.ps.length ? componentes : linhaDosModulos.ps).map((p) => p.x0 - altura);
    if (!inicios.length) return null;

    // "TOTAL" da linha de soma é maiúsculo; "Total" é o cabeçalho da coluna
    const totais = palavras.filter((p) => /^T[O0]TAL$/.test(p.s) && meio(p) > linhaDosModulos.y);
    const centro = (p) => (p ? (p.x0 + p.x1) / 2 : null);
    const lidos = inicios.map((x0, i) => {
        const x1 = inicios[i + 1] ?? Infinity;
        const dentro = (p) => p.x0 >= x0 && p.x0 < x1;
        const abaixo = palavras.filter((p) => dentro(p) && meio(p) > linhaDosModulos.y && meio(p) < linhaDosModulos.y + altura * 8);
        // o OCR troca letras: "Tetal", "Totel", "Teoris", "Prático"
        const achar = (regra) => abaixo.filter((p) => regra.test(p.s)).sort((a, b) => meio(a) - meio(b))[0];
        const teoria = achar(/^te[oóa0e]r/i);
        const pratica = achar(/^pr[aá][tlc]/i);
        const total = achar(/^(?!TOTAL$)t[o0e][tl][a-z1]{0,2}$/i);
        return {
            indice: i + 1, x0, x1, dentro,
            colunas: { teoria: centro(teoria), pratica: centro(pratica), total: centro(total) },
            yCabecalho: Math.max(...[teoria, pratica, total].filter(Boolean).map((p) => p.y1), -Infinity)
        };
    });
    // coluna que o OCR não leu: as três são igualmente espaçadas, ou seguem o desenho de outro bloco
    const modelo = lidos.find((b) => Object.values(b.colunas).every((x) => x != null));
    lidos.forEach((b) => {
        const c = b.colunas;
        if (c.total == null && c.teoria != null && c.pratica != null) c.total = c.pratica * 2 - c.teoria;
        if (c.teoria == null && c.pratica != null && c.total != null) c.teoria = c.pratica * 2 - c.total;
        if (c.pratica == null && c.teoria != null && c.total != null) c.pratica = (c.teoria + c.total) / 2;
        if (modelo && Object.values(c).some((x) => x == null)) {
            Object.keys(c).forEach((k) => { if (c[k] == null) c[k] = modelo.colunas[k] - modelo.x0 + b.x0; });
        }
        if (!Number.isFinite(b.yCabecalho)) b.yCabecalho = modelo?.yCabecalho ?? -Infinity;
    });
    if (lidos.some((b) => Object.values(b.colunas).some((x) => x == null) || !Number.isFinite(b.yCabecalho))) return null;

    const blocos = lidos.map((b) => {
        const { colunas, yCabecalho, dentro } = b;
        const passo = (colunas.total - colunas.teoria) / 2;
        const linhaTotal = totais.filter((t) => dentro(t) && meio(t) > yCabecalho).sort((a, b2) => meio(a) - meio(b2))[0];
        if (!linhaTotal || !(passo > 0)) return null;
        const yTotal = meio(linhaTotal);
        return {
            indice: b.indice, x0: b.x0, x1: b.x1, colunas, passo, yCabecalho, yTotal,
            areaDosNumeros: {
                x0: Math.max(0, colunas.teoria - passo * 0.75), x1: colunas.total + passo * 0.75,
                y0: yCabecalho + 2, y1: yTotal + altura * 1.3
            }
        };
    });
    if (blocos.some((b) => !b)) return null;
    return { altura, tolerancia, yModulos: linhaDosModulos.y, blocos };
}

// "Banco de Dados Ill" → base "Banco de Dados" + numeral 3 (o OCR troca I por l, 1 e |)
function separarNumeral(nome) {
    const achado = nome.match(/^(.*?)\s+([IVX]{1,4}|[Il1|]{1,4})!?$/);
    if (!achado) return { base: nome, numeral: 0 };
    const romano = achado[2];
    const valor = /^[IVX]+$/.test(romano) && /V|X/.test(romano)
        ? { IV: 4, V: 5, VI: 6, VII: 7, VIII: 8 }[romano] || romano.length
        : romano.length;
    return { base: achado[1], numeral: valor };
}

function limparNomeDoOcr(texto) {
    const palavras = texto.split(/\s+/).filter(Boolean);
    if (palavras.length > 1 && CODIGO.test(palavras[0])) palavras.shift();
    return palavras
        // traços e sobras de borda soltos
        .filter((p) => p && !/^[—–=\-:;.,"'|!\][]+$/.test(p) || /^[|Il1]{1,4}!?$/.test(p))
        .map((p) => p.replace(/^[^\p{L}\d(|]+/u, '').replace(/[!;:"']+$/, ''))
        .filter(Boolean)
        .join(' ')
        .trim();
}

export function montarMatrizSei(palavras, numerosLidos, estrutura) {
    const { tolerancia, blocos } = estrutura;
    const avisos = [];
    const disciplinas = [];
    const totaisDoPdf = [];

    for (const bloco of blocos) {
        const { colunas, passo } = bloco;
        const naColuna = (p) => {
            const x = (p.x0 + p.x1) / 2;
            const [nome, distancia] = Object.entries(colunas).map(([c, cx]) => [c, Math.abs(cx - x)]).sort((a, b) => a[1] - b[1])[0];
            return distancia < passo * 0.7 ? nome : null;
        };
        // candidatos de cada célula: a leitura só de dígitos (preferida) e a
        // leitura geral ("oo" = 00, "so" = 50); vale a combinação em que
        // teoria + prática dá o total
        const candidatos = [
            ...numerosLidos.map((p) => ({ ...p, v: Number(p.s), fonte: 1 })),
            ...palavras.map((p) => ({ ...p, v: numeroDoOcr(p.s), fonte: 2 }))
        ].filter((p) => plausivel(p.v) && naColuna(p) && meio(p) > bloco.yCabecalho && meio(p) < bloco.yTotal + tolerancia * 1.5
            && p.x0 >= bloco.x0 - passo && p.x1 <= bloco.x1 + passo);
        const linhas = linhasDe(candidatos, tolerancia).map((l) => {
            const opcoes = { teoria: [], pratica: [], total: [] };
            [...l.ps].sort((a, b) => a.fonte - b.fonte).forEach((p) => {
                const c = naColuna(p);
                if (c && !opcoes[c].includes(p.v)) opcoes[c].push(p.v);
            });
            const escolha = { teoria: opcoes.teoria[0] ?? null, pratica: opcoes.pratica[0] ?? null, total: opcoes.total[0] ?? null };
            fora: for (const t of opcoes.teoria) {
                for (const p of opcoes.pratica) {
                    for (const s of opcoes.total) {
                        if (t + p === s) { Object.assign(escolha, { teoria: t, pratica: p, total: s }); break fora; }
                    }
                }
            }
            return { y: l.y, ...escolha };
        });
        const linhaDoTotal = linhas.find((l) => Math.abs(l.y - bloco.yTotal) < tolerancia * 1.5);
        const linhasDasDisciplinas = linhas.filter((l) => l !== linhaDoTotal && l.y < bloco.yTotal - tolerancia);

        // nomes: texto à esquerda das colunas, entre o cabeçalho e o TOTAL
        const limiteDoNome = colunas.teoria - passo * 0.8;
        const palavrasDoNome = palavras.filter((p) => p.x0 >= bloco.x0 && p.x1 <= limiteDoNome + passo * 0.3
            && meio(p) > bloco.yCabecalho + tolerancia * 0.5 && meio(p) < bloco.yTotal - tolerancia);
        const linhasDoNome = linhasDe(palavrasDoNome, tolerancia);
        // cada linha de nome vai para a faixa da linha de números mais próxima
        // (nome comprido quebra em 2 ou 3 linhas, com os números no meio)
        const faixas = linhasDasDisciplinas.map((l, i, todas) => ({
            ...l, de: i ? (todas[i - 1].y + l.y) / 2 : bloco.yCabecalho, ate: todas[i + 1] ? (todas[i + 1].y + l.y) / 2 : bloco.yTotal,
            nomes: []
        }));
        linhasDoNome.forEach((ln) => {
            const faixa = faixas.find((f) => ln.y >= f.de && ln.y < f.ate);
            if (faixa) faixa.nomes.push(ln);
        });
        // uma faixa com dois códigos ("II.3 –" e "II.4 –"): uma linha perdeu os números
        const linhasFinais = [];
        faixas.forEach((f) => {
            const grupos = [];
            f.nomes.forEach((ln) => {
                if (!grupos.length || CODIGO.test(ln.ps[0].s)) grupos.push([ln]);
                else grupos[grupos.length - 1].push(ln);
            });
            if (!grupos.length) grupos.push([]);
            grupos.forEach((g, i) => linhasFinais.push({
                nome: limparNomeDoOcr(g.map((ln) => ln.texto).join(' ')),
                ...(i === 0 ? { teoria: f.teoria, pratica: f.pratica, total: f.total } : {})
            }));
        });

        linhasFinais.forEach((l, k) => {
            const d = {
                semestre: bloco.indice, sigla: `${ROMANO[bloco.indice]}.${k + 1}`, nome: l.nome,
                teoria: l.teoria ?? null, pratica: l.pratica ?? null, aulas: l.total ?? null
            };
            // uma conta só faltando: as outras duas resolvem
            if (d.aulas == null && d.teoria != null && d.pratica != null) d.aulas = d.teoria + d.pratica;
            if (d.teoria == null && d.aulas != null && d.pratica != null) d.teoria = d.aulas - d.pratica;
            if (d.pratica == null && d.aulas != null && d.teoria != null) d.pratica = d.aulas - d.teoria;
            disciplinas.push(d);
        });

        // o TOTAL do módulo resolve o que ainda faltar numa coluna
        const doModulo = disciplinas.filter((d) => d.semestre === bloco.indice);
        if (linhaDoTotal) {
            for (const coluna of ['teoria', 'pratica', 'aulas']) {
                const declarado = linhaDoTotal[coluna === 'aulas' ? 'total' : coluna];
                const faltando = doModulo.filter((d) => d[coluna] == null);
                if (declarado != null && faltando.length === 1) {
                    faltando[0][coluna] = declarado - doModulo.reduce((t, d) => t + (d[coluna] || 0), 0);
                }
            }
            doModulo.forEach((d) => {
                if (d.aulas == null && d.teoria != null && d.pratica != null) d.aulas = d.teoria + d.pratica;
            });
            if (linhaDoTotal.total != null) totaisDoPdf.push({ semestre: bloco.indice, declarado: linhaDoTotal.total });
        }
    }

    // numeral romano pela ordem: "Banco de Dados" no módulo I, II e III é I, II e III
    const porBase = new Map();
    disciplinas.forEach((d) => {
        const { base, numeral } = separarNumeral(d.nome);
        if (!numeral) return;
        const chave = base.toLowerCase();
        if (!porBase.has(chave)) porBase.set(chave, []);
        porBase.get(chave).push({ d, base, numeral });
    });
    porBase.forEach((lista) => {
        if (lista.length > 1) lista.forEach((item, i) => { item.d.nome = `${item.base} ${ROMANO[i + 1]}`; });
        else lista[0].d.nome = `${lista[0].base} ${ROMANO[lista[0].numeral] || 'I'}`;
    });

    // conferência: cada linha (teoria + prática = total) e cada módulo com o TOTAL
    disciplinas.forEach((d) => {
        if (!d.nome) avisos.push(`${d.sigla}: o nome não foi lido`);
        if (d.aulas == null || d.teoria == null || d.pratica == null) avisos.push(`${d.sigla} ${d.nome}: faltam números da linha`);
        else if (d.teoria + d.pratica !== d.aulas) avisos.push(`${d.sigla} ${d.nome}: teoria (${d.teoria}) + prática (${d.pratica}) não dá o total (${d.aulas})`);
    });
    totaisDoPdf.forEach(({ semestre, declarado }) => {
        const soma = disciplinas.filter((d) => d.semestre === semestre).reduce((t, d) => t + (d.aulas || 0), 0);
        if (soma !== declarado) avisos.push(`Módulo ${ROMANO[semestre]}: disciplinas somam ${soma}, a matriz diz ${declarado}`);
    });

    // embaixo da tabela: certificação de cada etapa, TCC e estágio
    const yFimTabela = Math.max(...blocos.map((b) => b.yTotal));
    const rodape = linhasDe(palavras.filter((p) => meio(p) > yFimTabela + estrutura.tolerancia), estrutura.tolerancia);
    const linhaDaCarga = rodape.find((l) => /Total da Carga/i.test(l.texto));
    const qualificacoes = blocos.map((bloco) => {
        const texto = rodape.filter((l) => !linhaDaCarga || l.y < linhaDaCarga.y)
            .map((l) => l.ps.filter((p) => p.x0 >= bloco.x0 && p.x0 < bloco.x1).map((p) => p.s).join(' '))
            .filter(Boolean).join(' ');
        const achado = texto.match(/(Qualifica\S*|Habilita\S*)[^]*?(?:N[íi]vel M[ée]dio de|Profissional de)\s+(.+)$/i);
        if (/sem certifica/i.test(texto)) return { ate: bloco.indice, tipo: '', nome: 'Sem certificação técnica' };
        if (!achado) return null;
        return { ate: bloco.indice, tipo: /habilita/i.test(achado[1]) ? 'Habilitação' : 'Qualificação', nome: paraNome(achado[2].replace(/[|]/g, '').trim()) };
    }).filter(Boolean);

    const textoDoRodape = rodape.map((l) => l.texto).join(' \n ');
    const tcc = textoDoRodape.match(/Trabalho de Conclus\S* de Curso\s*\|?\s*(\d{2,4})\s*horas/i);
    const estagio = textoDoRodape.match(/Est[áa]gio Supervisionado\s*\|?\s*([^\n]*)/i);
    const teoricas = Number((textoDoRodape.match(/Te[óo]rica\s*\|?\s*(\d{2,5})/i) || [])[1]) || null;
    const praticas = Number((textoDoRodape.match(/Pr[áa]tica\s*\|?\s*(\d{2,5})/i) || [])[1]) || null;
    const somaTeoria = disciplinas.reduce((t, d) => t + (d.teoria || 0), 0);
    const somaPratica = disciplinas.reduce((t, d) => t + (d.pratica || 0), 0);
    if (teoricas && teoricas !== somaTeoria) avisos.push(`Teoria: as disciplinas somam ${somaTeoria}, a matriz diz ${teoricas}`);
    if (praticas && praticas !== somaPratica) avisos.push(`Prática: as disciplinas somam ${somaPratica}, a matriz diz ${praticas}`);

    // cabeçalho: habilitação, plano de curso e escola
    const cabecalho = linhasDe(palavras.filter((p) => meio(p) < estrutura.yModulos - estrutura.tolerancia), estrutura.tolerancia)
        .map((l) => l.texto).join(' \n ');
    const habilitacao = (cabecalho.match(/Habilita\S* Profissional de\s+(.+?)\s*(?:\(|Plano|\n|$)/i) || [])[1];
    const plano = (cabecalho.match(/Plano de Curso\s*\|?\s*(\d{2,4})/i) || [])[1];
    const unidade = (cabecalho.match(/Unidade Escolar\s*\|?\s*(.+?)\s*(?:\||C[óo]digo|\n|$)/i) || [])[1];

    const modulos = blocos.length;
    return {
        rotulo: `Técnico (${modulos} módulo${modulos === 1 ? '' : 's'})`,
        titulo: habilitacao ? `Habilitação Profissional de ${paraNome(habilitacao)}` : 'Habilitação Profissional de Técnico',
        origem: `Matriz homologada${unidade ? ` da ${unidade.trim()}` : ' da Etec'}${plano ? ` · Plano de curso ${plano}` : ''}`,
        periodo: 'modulo',
        minutos: null,
        disciplinas: disciplinas.map((d) => ({ ...d, aulas: d.aulas ?? 0, teoria: d.teoria ?? 0, pratica: d.pratica ?? 0 })),
        qualificacoes,
        complementares: tcc ? [{ sigla: '', nome: 'Trabalho de Conclusão de Curso', horas: Number(tcc[1]) }] : [],
        semEstagio: Boolean(estagio && /n[ãa]o (requer|exige)|dispensa/i.test(estagio[1])),
        ...(estagio && !/n[ãa]o (requer|exige)|dispensa/i.test(estagio[1]) && /(\d{2,4})\s*horas/i.test(estagio[1])
            ? { estagioHoras: Number(estagio[1].match(/(\d{2,4})\s*horas/i)[1]) } : {}),
        totaisDoPdf,
        avisos,
        confiavel: !avisos.length && disciplinas.length > 0 && totaisDoPdf.length === modulos
    };
}

// Páginas com a matriz colada como imagem: desenha, limpa e lê por OCR
async function lerSeiPorOcr(pdf, pdfjs, aoProgresso) {
    const canvases = [];
    for (let n = 1; n <= Math.min(pdf.numPages, 4); n += 1) {
        const pagina = await pdf.getPage(n);
        const { width, height } = pagina.getViewport({ scale: 1 });
        // imagem que cobre boa parte da página: é a matriz colada no ofício
        const grandes = (await areasDeImagem(pagina, pdfjs))
            .filter((a) => (a.x1 - a.x0) * (a.y1 - a.y0) > width * height * 0.15);
        for (const area of grandes) canvases.push(limparParaOcr(await desenharArea(pagina, area)));
    }
    if (!canvases.length) return null;
    const { createWorker } = await import('tesseract.js');
    let feitas = 0;
    const worker = await createWorker('por', 1, {
        logger: (m) => {
            if (m.status === 'recognizing text') aoProgresso(Math.min(99, Math.round(((feitas + m.progress) / (canvases.length * 2)) * 100)));
        }
    });
    try {
        for (const canvas of canvases) {
            const matriz = await lerTabelaSeiDaImagem(canvas, worker);
            feitas += 2;
            if (matriz?.disciplinas.length) return matriz;
        }
        return null;
    } finally {
        await worker.terminate();
    }
}

// Palavras do texto do PDF no mesmo formato do OCR (de cima para baixo)
async function palavrasDoTexto(pagina) {
    const { height } = pagina.getViewport({ scale: 1 });
    const itens = (await pagina.getTextContent()).items.filter((i) => i.str.trim());
    return itens.map((i) => {
        const tamanho = Math.abs(i.transform[3]) || 8;
        return { s: i.str.trim(), x0: i.transform[4], x1: i.transform[4] + i.width, y0: height - i.transform[5] - tamanho, y1: height - i.transform[5] };
    }).flatMap((p) => {
        // pedaço com várias palavras: divide pela largura (o leitor trabalha com palavras)
        const partes = p.s.split(/\s+/);
        if (partes.length === 1) return [p];
        const porLetra = (p.x1 - p.x0) / p.s.length;
        let x = p.x0;
        return partes.map((s) => {
            const q = { ...p, s, x0: x, x1: x + s.length * porLetra };
            x += (s.length + 1) * porLetra;
            return q;
        });
    });
}


// ========================================================
// O PDF que o admin envia num curso de Etec
// ========================================================

// Devolve { matriz } com matriz.leitura = 'texto' | 'ocr', ou { problema }:
// 'escaneado' (nenhum texto e o OCR não achou a tabela) ou 'desconhecido'.
export async function lerMatrizEtecDoPdf(arquivo, aoProgresso = () => {}) {
    const pdfjs = await carregarPdfjs();
    const pdf = await pdfjs.getDocument({ data: new Uint8Array(await arquivo.arrayBuffer()) }).promise;
    const paginas = [];
    for (let n = 1; n <= Math.min(pdf.numPages, 6); n += 1) paginas.push(await palavrasDoTexto(await pdf.getPage(n)));
    const texto = paginas.flat().map((p) => p.s).join(' ');

    // 1) matriz do SIGA (texto exato)
    if (/matriz curricular/i.test(texto) && /total geral do curso|base nacional comum|matriz homologada|total da forma[çc][ãa]o/i.test(texto)) {
        try {
            const { matriz, texto: textoDoSiga } = await lerMatrizDoPdf(arquivo);
            return { matriz: { ...daMatrizDoSiga(matriz, textoDoSiga), leitura: 'texto' } };
        } catch (erro) {
            console.warn('A matriz parecia do SIGA, mas não foi lida:', erro);
        }
    }
    // 2) tabela do SEI com texto
    for (const palavras of paginas) {
        const estrutura = acharEstruturaSei(palavras);
        if (!estrutura) continue;
        const matriz = montarMatrizSei(palavras, [], estrutura);
        if (matriz.disciplinas.length) return { matriz: { ...matriz, leitura: 'texto' } };
    }
    // 3) tabela colada como imagem: OCR
    const matriz = await lerSeiPorOcr(pdf, pdfjs, aoProgresso);
    if (matriz) return { matriz: { ...matriz, leitura: 'ocr' } };
    return { problema: paginas.every((p) => !p.length) ? 'escaneado' : 'desconhecido' };
}
