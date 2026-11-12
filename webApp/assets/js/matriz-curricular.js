// Leitura da matriz curricular que o SIGA (sistema do Centro Paula Souza)
// gera em PDF. O painel admin envia o PDF, este arquivo tira dele os
// componentes curriculares com a carga horária de cada etapa, e a página do
// curso mostra as disciplinas técnicas como etiquetas.
//
// A tabela do PDF tem sempre o mesmo desenho:
//   [área] componente [Prática/Teoria] | aulas da 1ª etapa | 2ª | ... | total | horas
// com uma linha "Total da Base Nacional Comum Curricular" separando as
// matérias do ensino médio das disciplinas técnicas, e "TOTAL GERAL DO
// CURSO" no fim.

const CELULA_NUMERICA = /^(\d{1,5}|[—–-])$/;
const TIPOS_DE_AULA = /^(pr[aá]tica|teoria|teoria e pr[aá]tica|te[oó]rico|pr[aá]tico)$/i;

// Distância vertical até a qual dois textos ainda estão na mesma linha, e
// espaço horizontal a partir do qual viram células diferentes (em pontos).
const MESMA_LINHA = 2.5;
const NOVA_CELULA = 7;

// Junta os pedaços de texto que o PDF devolve em linhas de células, de cima
// para baixo. itens: [{ texto, x, y, largura }] com y crescendo para cima,
// como no PDF.
export function montarLinhas(itens) {
    const ordenados = itens
        .filter((item) => item.texto.trim())
        .sort((a, b) => b.y - a.y || a.x - b.x);

    const linhas = [];
    ordenados.forEach((item) => {
        const linha = linhas.find((l) => Math.abs(l.y - item.y) <= MESMA_LINHA);
        if (linha) linha.itens.push(item);
        else linhas.push({ y: item.y, itens: [item] });
    });

    return linhas.map((linha) => {
        const celulas = [];
        linha.itens.sort((a, b) => a.x - b.x).forEach((item) => {
            const ultima = celulas[celulas.length - 1];
            const espaco = ultima ? item.x - ultima.fim : Infinity;
            if (ultima && espaco < NOVA_CELULA) {
                ultima.texto += (espaco > 1 && !ultima.texto.endsWith(' ') ? ' ' : '') + item.texto;
                ultima.fim = item.x + item.largura;
            } else {
                celulas.push({ texto: item.texto, x: item.x, fim: item.x + item.largura });
            }
        });
        return {
            y: linha.y,
            celulas: celulas.map((c) => ({ x: c.x, texto: c.texto.replace(/\s+/g, ' ').trim() }))
        };
    });
}

function numero(texto) {
    return /^\d+$/.test(texto) ? Number(texto) : 0;
}

function paraTitulo(texto) {
    // "MATRIZ CURRICULAR - ENSINO MÉDIO COM HABILITAÇÃO PROFISSIONAL (Mtec -
    // Período Parcial)" -> "Ensino Médio com Habilitação Profissional (Mtec -
    // Período Parcial)"
    const semRotulo = texto.replace(/^matriz curricular\s*[-–—:]?\s*/i, '');
    const minusculas = new Set(['de', 'da', 'do', 'das', 'dos', 'e', 'em', 'com', 'a', 'o', 'ao', 'para']);
    return semRotulo.split(' ').map((palavra, i) => {
        if (palavra !== palavra.toUpperCase()) return palavra;
        const baixa = palavra.toLowerCase();
        if (i > 0 && minusculas.has(baixa)) return baixa;
        return baixa.charAt(0).toUpperCase() + baixa.slice(1);
    }).join(' ');
}

// linhas: resultado de montarLinhas(). Devolve a matriz ou lança um erro
// explicando o que não foi encontrado.
export function lerMatriz(linhas) {
    const textoDa = (linha) => linha.celulas.map((c) => c.texto).join(' ');

    const linhaTitulo = linhas.find((l) => /matriz curricular/i.test(textoDa(l)));
    if (!linhaTitulo) {
        throw new Error('este PDF não parece ser uma matriz curricular do SIGA (não achei o título "Matriz Curricular")');
    }

    // Cabeçalho das etapas: "1ª SÉRIE", "2º MÓDULO", "3º SEMESTRE"...
    // Só a primeira linha que fala em etapas é o cabeçalho; mais abaixo, a
    // parte de certificados repete "1ª Série", "1ª + 2ª Séries".
    const PADRAO_ETAPA = /(\d+)\s*[ªº°]\s*(s[ée]rie|m[óo]dulo|semestre)/gi;
    const achados = linhas
        .map((linha) => [...textoDa(linha).matchAll(PADRAO_ETAPA)])
        .find((lista) => lista.length);
    if (!achados) {
        throw new Error('não achei as colunas de série, módulo ou semestre na tabela');
    }
    const etapas = new Set(achados.map((a) => a[1])).size;
    const tipoBruto = achados[0][2].toLowerCase();
    const tipoEtapa = tipoBruto.includes('rie') ? 'série'
        : tipoBruto.startsWith('m') ? 'módulo' : 'semestre';

    // Linha de dados: termina com as aulas de cada etapa e pelo menos um total.
    const comNumeros = [];
    const soTexto = [];
    linhas.forEach((linha) => {
        const celulas = linha.celulas;
        let inicioNumeros = celulas.length;
        while (inicioNumeros > 0 && CELULA_NUMERICA.test(celulas[inicioNumeros - 1].texto)) inicioNumeros -= 1;
        const numeros = celulas.slice(inicioNumeros).map((c) => c.texto);

        if (numeros.length >= etapas + 1) {
            comNumeros.push({ y: linha.y, textos: celulas.slice(0, inicioNumeros), numeros, extras: [] });
        } else {
            soTexto.push(linha);
        }
    });
    if (!comNumeros.length) throw new Error('não achei nenhuma linha com carga horária na tabela');

    const ehTotal = (linha) => /^total\b/i.test(linha.textos.map((c) => c.texto).join(' '));
    const yTotalBase = comNumeros.find((l) => /base nacional comum/i.test(l.textos.map((c) => c.texto).join(' ')))?.y;
    const primeiraY = comNumeros[0].y;
    const ultimaY = comNumeros[comNumeros.length - 1].y;
    const colunaDosNumeros = Math.min(...comNumeros.map((l) => l.textos.length
        ? Math.max(...l.textos.map((c) => c.x)) : Infinity));

    // Nome comprido quebra em duas ou três linhas dentro da célula, e os
    // números ficam centralizados na altura: os pedaços do nome chegam como
    // linhas só de texto, logo acima e abaixo da linha dos números. Cada
    // pedaço vai para a linha de números mais próxima.
    soTexto.forEach((linha) => {
        if (linha.y > primeiraY + 12 || linha.y < ultimaY - 12) return;
        // Na parte do ensino médio, texto solto é o nome da área (que ocupa
        // várias linhas da tabela), não um pedaço do nome da matéria.
        if (yTotalBase != null && linha.y > yTotalBase) return;
        const texto = textoDa(linha);
        if (/^\d+\s*[ªº°]|^total$|carga hor[áa]ria|componentes curriculares/i.test(texto)) return;

        const maisProxima = comNumeros.reduce((a, b) => (Math.abs(b.y - linha.y) < Math.abs(a.y - linha.y) ? b : a));
        if (Math.abs(maisProxima.y - linha.y) > 16 || ehTotal(maisProxima)) return;
        if (linha.celulas[0].x > colunaDosNumeros + 40) return;
        maisProxima.extras.push({ y: linha.y, texto });
    });

    const componentes = [];
    let cargaHoraria = null;

    comNumeros.forEach((linha) => {
        const textos = linha.textos.map((c) => c.texto);
        const aulas = linha.numeros.slice(0, etapas).map(numero);
        const horas = numero(linha.numeros[linha.numeros.length - 1]);

        if (ehTotal(linha)) {
            if (/total geral/i.test(textos.join(' '))) cargaHoraria = horas;
            return;
        }

        const naBase = yTotalBase != null && linha.y > yTotalBase;
        let tipo = '';
        if (textos.length && TIPOS_DE_AULA.test(textos[textos.length - 1])) tipo = textos.pop();

        let nome;
        if (naBase) {
            // área (quando cai nesta linha) + matéria: a matéria é a última
            nome = textos[textos.length - 1] || '';
        } else {
            const pedacos = [
                ...(textos.length ? [{ y: linha.y, texto: textos.join(' ') }] : []),
                ...linha.extras
            ].sort((a, b) => b.y - a.y);
            nome = pedacos.map((p) => p.texto).join(' ');
        }
        nome = nome.replace(/\s+/g, ' ').trim();
        if (!nome) return;

        componentes.push({ nome, grupo: naBase ? 'base' : 'tecnica', tipo, aulas, horas });
    });

    if (!componentes.some((c) => c.grupo === 'tecnica')) {
        throw new Error('não achei as disciplinas técnicas na tabela');
    }

    return {
        titulo: paraTitulo(textoDa(linhaTitulo)),
        tipoEtapa,
        etapas,
        cargaHoraria: cargaHoraria ?? componentes.reduce((soma, c) => soma + c.horas, 0),
        componentes
    };
}

// Disciplinas que aparecem em todo curso e não dizem o que ele ensina.
const GENERICAS = /trabalho de conclus|\btcc\b|conduta profissional|^projetos? (de|em|integrador)|[ée]tica e cidadania|linguagem, trabalho e tecnologia|ingl[êe]s instrumental|aplicativos inform/i;

// "Banco de Dados I" e "Banco de Dados II" são a mesma disciplina para a
// etiqueta; as horas somam.
function semNumeral(nome) {
    return nome.replace(/\s+(I{1,3}|IV|V|VI)$/, '').trim();
}

// As disciplinas técnicas com mais horas, para virar etiqueta na página.
export function destaquesDaMatriz(matriz, limite = 8) {
    const horas = new Map();
    (matriz?.componentes || []).forEach((c) => {
        if (c.grupo !== 'tecnica') return;
        const nome = semNumeral(c.nome);
        if (GENERICAS.test(nome)) return;
        horas.set(nome, (horas.get(nome) || 0) + (c.horas || 0));
    });
    return [...horas.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, limite)
        .map(([nome]) => nome);
}

// "3 séries", "1 módulo"
export function duracaoDaMatriz(matriz) {
    if (!matriz?.etapas) return '';
    const plural = { 'série': 'séries', 'módulo': 'módulos', 'semestre': 'semestres' };
    return `${matriz.etapas} ${matriz.etapas === 1 ? matriz.tipoEtapa : plural[matriz.tipoEtapa]}`;
}

// arquivo: File escolhido no painel admin. O leitor de PDF é grande, então só
// é baixado na hora em que alguém envia uma matriz.
// Devolve { matriz, texto }: o texto inteiro serve para conferir se o PDF
// cita o curso que está sendo editado.
export async function lerMatrizDoPdf(arquivo) {
    const [pdfjs, { default: urlDoWorker }] = await Promise.all([
        import('pdfjs-dist'),
        import('pdfjs-dist/build/pdf.worker.min.mjs?url')
    ]);
    pdfjs.GlobalWorkerOptions.workerSrc = urlDoWorker;

    const documento = await pdfjs.getDocument({ data: await arquivo.arrayBuffer() }).promise;
    const itens = [];
    // Páginas seguintes continuam a tabela mais abaixo: o deslocamento mantém
    // a ordem de cima para baixo entre elas.
    for (let numeroPagina = 1; numeroPagina <= documento.numPages; numeroPagina += 1) {
        const pagina = await documento.getPage(numeroPagina);
        const conteudo = await pagina.getTextContent();
        const deslocamento = -(numeroPagina - 1) * 2000;
        conteudo.items.forEach((item) => {
            if (!item.str) return;
            itens.push({
                texto: item.str,
                x: item.transform[4],
                y: item.transform[5] + deslocamento,
                largura: item.width
            });
        });
    }

    if (!itens.length) {
        throw new Error('este PDF não tem texto para ler (parece uma imagem escaneada)');
    }
    const linhas = montarLinhas(itens);
    return {
        matriz: lerMatriz(linhas),
        texto: linhas.map((l) => l.celulas.map((c) => c.texto).join(' ')).join(' ')
    };
}
