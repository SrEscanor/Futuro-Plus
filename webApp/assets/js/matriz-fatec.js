// Lê a matriz curricular do PDF de um curso da Fatec (projeto pedagógico ou
// matriz curricular), nos modelos que as Fatecs publicam:
//   novo     "Projeto Pedagógico" (2023+): tabela por semestre (ou por ano)
//            com oferta presencial/on-line, aulas em sala/lab., total e extensão
//   antigo   "Distribuição da carga didática semestral" (com siglas)
//   enfases  projeto antigo sem sigla (2012), com ênfases a partir do 5º
//            semestre e lista de optativas
// Devolve as disciplinas, o que fica fora da matriz (estágio, TG, optativas),
// objetivo e ementa de cada disciplina e os avisos de contas que não fecham.
// "confiavel" diz se a leitura bateu com os totais do próprio PDF.
//
// Testado com uma amostra de 65 PDFs dos sites das Fatecs (nov/2026): 33
// lidos e conferidos; escaneados e grades de uma página ainda não são lidos.
// O que não for lido o admin digita à mão ou usa só o PDF.

// ADM-002, HS0-006 (zero no lugar do O), ING401 (sem hífen), ESP_A116
const SIGLA = /^[A-Z][A-Z0-9]{1,3}[-_]?\s?[A-Z]?\d{3}$/;
const SIGLA_INICIO = /^[A-Z][A-Z0-9]{1,3}-$/;
const SIGLA_VAZIA = /^(SIGLA|XXXX)$/;
const CABECALHO = /^(Componente|Denominação|Disciplinas \/ Atividades|Sigla|Oferta|Sem\.|Nº|Etapa|Relação de Disciplinas|RELAÇÃO DE DISCIPLINAS|Disciplinas|DISCIPLINAS|Siglas|SIGLAS|Período|PERÍODO)$/;
// (cursos novos organizados por ano: "Total de aulas do ano")
// ("Totalde aulas do semestre", sem o espaço, também aparece)
const TOTAL_DO_BLOCO = /^Total\s*(de aulas do (semestre|ano)|do semestre|do ano|semanal)/i;
// título da tabela do modelo antigo, com as variações de cada Fatec
const TITULO_ANTIGO = /DISTRIBUIÇÃO DA CARGA DIDÁTICA|DISTRIBUIÇÃO DA CARGA HORÁRIA SEMESTRAL/i;
const SUMARIO = /\.{6}/;
const OFERTA = /^(Presencial|On-?line|Online|Híbrid[oa]|Semipresencial)$/i;
// "80", "(80)", "80h", "-" (zero) e "- 80" (duas células coladas: vale a última)
const numero = (s) => (/^\(?\d+\)?h?$/.test(s) || /^[-–]\s*\d+$/.test(s) ? Number(s.replace(/\D/g, ''))
    : (/^[-–]{1,2}$/.test(s) ? 0 : null));
const normalizar = (t) => String(t || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ').trim();
const PALAVRAS_VAZIAS = new Set(['de', 'da', 'do', 'das', 'dos', 'e', 'em', 'para', 'a', 'o', 'ao', 'aos', 'as', 'os', 'ch']);
const palavras = (t) => new Set(normalizar(t).split(' ').filter((p) => p && !PALAVRAS_VAZIAS.has(p)));

// dados: bytes do PDF; pdfjs: a biblioteca já carregada (no navegador vem de
// lerMatrizFatecDoPdf; nos testes em Node, da versão "legacy").
export async function paginasDoPdf(dados, pdfjs) {
    const doc = await pdfjs.getDocument({ data: dados, verbosity: 0 }).promise;
    const paginas = [];
    for (let p = 1; p <= doc.numPages; p++) {
        const itens = (await (await doc.getPage(p)).getTextContent()).items
            .filter((i) => i.str.trim())
            .map((i) => ({ s: i.str.trim(), x: i.transform[4], y: i.transform[5] }));
        paginas.push({ numero: p, itens, texto: itens.map((i) => i.s).join(' ') });
    }
    return paginas;
}

function linhasDaPagina(itens) {
    const lista = [];
    for (const i of [...itens].sort((a, b) => b.y - a.y || a.x - b.x)) {
        let l = lista.find((x) => Math.abs(x.y - i.y) < 2.5);
        if (!l) lista.push(l = { y: i.y, itens: [] });
        l.itens.push(i);
    }
    lista.forEach((l) => { l.itens.sort((a, b) => a.x - b.x); l.texto = l.itens.map((i) => i.s).join(' ').replace(/\s+/g, ' ').trim(); });
    return lista;
}

// texto de uma faixa (nome que quebra em várias linhas), de cima para baixo
const textoDaFaixa = (itens) => itens.sort((a, b) => b.y - a.y || a.x - b.x).map((i) => i.s).join(' ')
    .replace(/\s+/g, ' ').replace(/\s+–\s*/g, ' – ').trim();

// ================= modelo novo =================
// Cada bloco de semestre tem o seu cabeçalho (Sala | Lab. | Sala | Lab. |
// Total | Extensão), e as posições mudam de um bloco para o outro.
function cabecalhosDaPagina(itens) {
    // "Sala Lab." às vezes vem num pedaço só: separa em duas colunas
    const partes = itens.flatMap((i) => (/^Sala\s+Lab\.?$/.test(i.s) ? [{ ...i, s: 'Sala' }, { ...i, s: 'Lab.', x: i.x + 24 }] : [i]));
    return linhasDaPagina(partes.filter((i) => i.s === 'Sala' || /^Lab\.?$/.test(i.s)))
        .filter((l) => l.itens.length >= 4)
        .map((l) => {
            const [sala, lab, salaOnline, labOnline] = l.itens;
            const total = itens.filter((i) => i.s === 'Total' && i.y > l.y && i.y < l.y + 25 && i.x > labOnline.x)
                .sort((a, b) => a.y - b.y)[0];
            const xTotal = total ? total.x : labOnline.x + 28;
            const extensao = itens.find((i) => /Extens/.test(i.s) && Math.abs(i.y - l.y) < 25 && i.x > xTotal);
            return {
                y: l.y,
                colunas: { sala: sala.x, lab: lab.x, salaOnline: salaOnline.x, labOnline: labOnline.x,
                    total: xTotal, extensao: extensao ? extensao.x + 8 : xTotal + 34 }
            };
        });
}

function valoresPorColuna(celulas, colunas) {
    const valores = {};
    if (!colunas) return valores;
    for (const c of celulas) {
        const v = numero(c.s);
        if (v == null) continue;
        const [nome, x] = Object.entries(colunas).sort((a, b) => Math.abs(a[1] - c.x) - Math.abs(b[1] - c.x))[0];
        if (Math.abs(x - c.x) < 22) valores[nome] = v;
    }
    return valores;
}

function lerTabelaNovo(paginasDaTabela, corteNaUltima) {
    const disciplinas = [];
    const totaisDeclarados = [];
    let semestre = 1;
    let ultimoCabecalho = null;
    paginasDaTabela.forEach((pagina, n) => {
        let itens = pagina.itens;
        if (n === paginasDaTabela.length - 1 && corteNaUltima != null) itens = itens.filter((i) => i.y > corteNaUltima);
        const cabecalhos = cabecalhosDaPagina(itens);
        const colunasPara = (y) => (cabecalhos.filter((c) => c.y > y).sort((a, b) => a.y - b.y)[0] || ultimoCabecalho)?.colunas;
        const titulos = itens.filter((i) => CABECALHO.test(i.s)).map((i) => i.y);
        // uma linha por célula de oferta (a sigla pode faltar ou ser "SIGLA");
        // sem a coluna de oferta (a oferta vem só pela cor), uma linha por
        // número da coluna "Nº"
        // ("Presencial | On-line" logo acima de "Sala | Lab." é cabeçalho, não linha)
        let linhas = itens.filter((i) => OFERTA.test(i.s) && i.x > 280 && i.x < 380 && !cabecalhos.some((c) => i.y > c.y && i.y - c.y < 30))
            .map((o) => ({ tipo: 'linha', x: o.x, y: o.y, oferta: o.s }));
        if (!linhas.length) {
            const colunaNumero = itens.filter((i) => /^N[º°o]\.?$/.test(i.s));
            linhas = itens.filter((i) => /^\d{1,2}$/.test(i.s) && colunaNumero.some((c) => Math.abs(c.x - i.x) < 10 && c.y > i.y))
                .map((n) => ({ tipo: 'linha', x: (colunasPara(n.y)?.sala ?? 280) - 16, y: n.y, oferta: '' }));
        }
        // o rótulo do total pode vir palavra por palavra ("Total" "de" "aulas"…)
        const ehTotal = (i) => TOTAL_DO_BLOCO.test(i.s) || (i.s === 'Total' && TOTAL_DO_BLOCO.test(itens
            .filter((o) => Math.abs(o.y - i.y) < 2.5 && o.x >= i.x && o.x < i.x + 140).sort((a, b) => a.x - b.x).map((o) => o.s).join(' ')));
        const eventos = [
            ...linhas,
            ...itens.filter(ehTotal).map((t) => ({ tipo: 'total', y: t.y }))
        ].sort((a, b) => b.y - a.y);
        eventos.forEach((evento, indice) => {
            const colunas = colunasPara(evento.y);
            if (evento.tipo === 'total') {
                const daLinha = itens.filter((i) => Math.abs(i.y - evento.y) < 7);
                totaisDeclarados.push({ semestre, declarado: valoresPorColuna(daLinha, colunas).total });
                semestre += 1;
                return;
            }
            const anterior = eventos[indice - 1];
            const seguinte = eventos[indice + 1];
            const tituloAcima = titulos.filter((y) => y > evento.y).sort((a, b) => a - b)[0] ?? Infinity;
            const topo = Math.min(anterior ? (anterior.y + evento.y) / 2 : evento.y + 14, tituloAcima - 1);
            const base = seguinte ? (seguinte.y + evento.y) / 2 : evento.y - 14;
            const siglaItem = itens.find((i) => Math.abs(i.y - evento.y) < 7 && i.x < 160 && (SIGLA.test(i.s) || SIGLA_VAZIA.test(i.s)));
            const inicioNome = siglaItem ? siglaItem.x + 32 : 130;
            const nome = textoDaFaixa(itens.filter((i) => i.y < topo && i.y > base && i.x >= inicioNome && i.x < evento.x - 2
                && !SIGLA.test(i.s) && !SIGLA_VAZIA.test(i.s) && !CABECALHO.test(i.s) && !TOTAL_DO_BLOCO.test(i.s)));
            const v = valoresPorColuna(itens.filter((i) => Math.abs(i.y - evento.y) < 6 && i.x > evento.x + 10), colunas);
            // linha fantasma (sem nome, sem sigla e sem aulas): não é disciplina
            if (!nome && !siglaItem && !v.total) return;
            disciplinas.push({
                semestre, sigla: siglaItem && SIGLA.test(siglaItem.s) ? siglaItem.s.replace(/\s/g, '') : '',
                nome, aulas: v.total || 0, extensao: v.extensao || 0,
                // sem a coluna de oferta: on-line quando só as colunas on-line têm aulas
                online: evento.oferta ? /line/i.test(evento.oferta) : ((v.salaOnline || 0) + (v.labOnline || 0) > 0 && !v.sala && !v.lab),
                conta: (v.sala || 0) + (v.lab || 0) + (v.salaOnline || 0) + (v.labOnline || 0)
            });
        });
        if (cabecalhos.length) ultimoCabecalho = [...cabecalhos].sort((a, b) => a.y - b.y)[0];
    });
    return { disciplinas, totaisDeclarados };
}

function lerComplementaresNovo(itens) {
    return itens.filter((i) => /^\d+ horas$/.test(i.s)).map((horas) => {
        const perto = itens.filter((i) => Math.abs(i.y - horas.y) < 9 && i.x > 150 && i.x < horas.x - 2
            && !/^Erro!/.test(i.s) && !/^[☒☐[\]x]+$/.test(i.s));
        const sigla = itens.find((i) => SIGLA.test(i.s) && Math.abs(i.y - horas.y) < 9)?.s || '';
        return { sigla, nome: textoDaFaixa(perto).replace(/ -$/, ''), horas: Number(horas.s.split(' ')[0]) };
    });
}

// ================= modelo antigo (com siglas) =================
function acharSiglas(itens) {
    const achadas = [];
    for (const i of itens) {
        if (SIGLA.test(i.s)) achadas.push({ sigla: i.s.replace(/\s/g, ''), x: i.x, y: i.y });
        else if (SIGLA_INICIO.test(i.s)) {
            const resto = itens.find((o) => /^\d{3}$/.test(o.s) && Math.abs(o.x - i.x) < 12 && i.y - o.y > 2 && i.y - o.y < 14);
            if (resto) achadas.push({ sigla: i.s + resto.s, x: i.x, y: (i.y + resto.y) / 2 });
        }
    }
    // Eletiva / "Escolha" sem sigla: "-------------" na coluna das siglas
    if (achadas.length >= 5) {
        const xs = achadas.map((a) => a.x).sort((a, b) => a - b);
        const xSigla = xs[Math.floor(xs.length / 2)];
        itens.filter((i) => /^-{5,}$/.test(i.s) && Math.abs(i.x - xSigla) < 15)
            .forEach((i) => achadas.push({ sigla: '', x: i.x, y: i.y }));
    }
    return achadas;
}

// Linha de total do modelo antigo: "Total semanal", "Total do semestre: 480",
// ou só "Total" (às vezes partido em "Tota" + "l")
const TOTAL_ANTIGO = /^Total?(\s+(de aulas do semestre|do semestre|semanal))?:?(\s*\d{2,4})?$/i;

// Onde começam as colunas de números na página: o número mais à esquerda
// de cada linha com sigla (a mediana delas, para um número solto não atrapalhar)
function inicioDasCelulas(itens, siglas) {
    const xs = siglas.map((s) => itens.filter((i) => Math.abs(i.y - s.y) < 6 && i.x > s.x + 60 && numero(i.s) != null)
        .reduce((m, i) => Math.min(m, i.x), Infinity)).filter(Number.isFinite).sort((a, b) => a - b);
    return xs.length ? xs[Math.floor(xs.length / 2)] - 6 : 330;
}

function lerTabelaAntigo(paginasDaTabela) {
    const disciplinas = [];
    const complementares = [];
    const totaisDeclarados = [];
    let semestre = 1;
    for (const pagina of paginasDaTabela) {
        const itens = pagina.itens;
        const titulos = itens.filter((i) => CABECALHO.test(i.s)).map((i) => i.y);
        const siglas = acharSiglas(itens);
        const xCelulas = inicioDasCelulas(itens, siglas);
        const eventos = [
            ...siglas.map((s) => ({ tipo: 'sigla', ...s })),
            ...itens.filter((i) => TOTAL_ANTIGO.test(i.s)).map((t) => ({ tipo: 'total', y: t.y, s: t.s }))
        ].sort((a, b) => b.y - a.y);
        eventos.forEach((evento, indice) => {
            if (evento.tipo === 'total') {
                // "Total semanal" e "Total do semestre" seguidos fecham o mesmo
                // semestre; um "Total" de cabeçalho, antes das disciplinas, não conta
                if (!disciplinas.some((d) => d.semestre === semestre)) return;
                const daLinha = itens.filter((i) => Math.abs(i.y - evento.y) < 9 && i.x >= xCelulas && numero(i.s) != null).map((i) => numero(i.s));
                // o número pode vir colado no rótulo: "Total do semestre: 480"
                const colado = Number((evento.s.match(/(\d{2,4})\s*$/) || [])[1]);
                if (colado) daLinha.push(colado);
                const declarado = daLinha.length ? Math.max(...daLinha) : null;
                const anteriorDoSemestre = totaisDeclarados.find((t) => t.semestre === semestre);
                if (anteriorDoSemestre) anteriorDoSemestre.declarado = Math.max(anteriorDoSemestre.declarado || 0, declarado || 0) || null;
                else totaisDeclarados.push({ semestre, declarado });
                const seguinte = eventos[indice + 1];
                if (seguinte?.tipo !== 'total' || Math.abs(seguinte.y - evento.y) > 40) semestre += 1;
                return;
            }
            const anterior = eventos[indice - 1];
            const seguinte = eventos[indice + 1];
            const tituloAcima = titulos.filter((y) => y > evento.y).sort((a, b) => a - b)[0] ?? Infinity;
            const topo = Math.min(anterior ? (anterior.y + evento.y) / 2 : evento.y + 14, tituloAcima - 1);
            const base = seguinte ? (seguinte.y + evento.y) / 2 : evento.y - 14;
            const nome = textoDaFaixa(itens.filter((i) => i.y < topo && i.y > base && i.x >= evento.x + 30 && i.x < xCelulas
                && !SIGLA.test(i.s) && !/^\d{3}$/.test(i.s) && !/SEMESTRE/.test(i.s) && !CABECALHO.test(i.s) && !TOTAL_ANTIGO.test(i.s)))
                // "IBD-100 - Laboratório de Banco de Dados ou ISD-001 - Sistemas…": sem as siglas
                .replace(/\b[A-Z][A-Z0-9]{1,3}-\d{3}\s*[-–]\s*/g, '');
            const celulas = itens.filter((i) => Math.abs(i.y - evento.y) < 6 && i.x >= xCelulas).sort((a, b) => a.x - b.x);
            const horas = celulas.find((i) => /^\d+h$/.test(i.s));
            const valores = celulas.map((i) => numero(i.s)).filter((v) => v != null);
            // sem nome e sem aulas: segunda sigla do TG (junta mais abaixo)
            if (horas || /^(Estágio|Trabalho de Graduação)/.test(nome) || (!nome && !valores.length)) {
                complementares.push({ sigla: evento.sigla, nome, horas: horas ? numero(horas.s) : null });
                return;
            }
            disciplinas.push({ semestre, sigla: evento.sigla, nome, aulas: valores.at(-1) ?? 0, extensao: 0, online: false });
        });
    }
    // TG com duas siglas e um nome só: junta
    const juntos = [];
    for (const c of complementares) {
        const vizinho = juntos.at(-1);
        if (!c.nome && vizinho && (vizinho.horas === c.horas || c.horas == null)) vizinho.sigla += `, ${c.sigla}`;
        else if (vizinho && !vizinho.nome && vizinho.horas === c.horas) Object.assign(vizinho, { nome: c.nome, sigla: `${vizinho.sigla}, ${c.sigla}` });
        else juntos.push({ ...c });
    }
    // Depois do último total (ex.: LIBRAS optativa) não é semestre: vira optativa
    const ultimoComTotal = Math.max(0, ...totaisDeclarados.map((t) => t.semestre));
    const depois = disciplinas.filter((d) => d.semestre > ultimoComTotal);
    const optativas = ultimoComTotal >= 2 && depois.length && depois.length <= 3
        ? depois.map((d) => ({ ...d, optativa: true })) : [];
    return {
        disciplinas: optativas.length ? disciplinas.filter((d) => d.semestre <= ultimoComTotal) : disciplinas,
        optativas, complementares: juntos, totaisDeclarados
    };
}

// ================= modelo com ênfases (sem sigla) =================
function lerTabelaEnfases(paginasDaTabela) {
    const disciplinas = [];
    const optativas = [];
    const totaisDeclarados = [];
    let semestre = 0;
    let enfase = '';
    let naListaDeOptativas = false;
    let dentroDaTabela = false;
    for (const pagina of paginasDaTabela) {
        for (const linha of linhasDaPagina(pagina.itens)) {
            const texto = linha.texto.replace(/[°º]/g, ' ').replace(/\s+/g, ' ').trim();
            const doSemestre = texto.match(/^(\d)\s*o?\s*SEMESTRE$/i);
            if (doSemestre) { semestre = Number(doSemestre[1]); dentroDaTabela = true; continue; }
            const daEnfase = texto.match(/^ÊNFASE:\s*(.+)$/i);
            if (daEnfase) { enfase = daEnfase[1].toLowerCase().replace(/(^|\s)\S/g, (l) => l.toUpperCase()); continue; }
            if (/^DISCIPLINAS OPTATIVAS$/i.test(texto)) { naListaDeOptativas = true; continue; }
            if (/^(Disciplina|NOME) (Conteúdo|CONTEÚDO)/i.test(texto)) { dentroDaTabela = true; continue; }
            if (/^Carga Horária/i.test(texto)) {
                dentroDaTabela = false;
                totaisDeclarados.push({ semestre, enfase: semestre >= 5 ? enfase : '', declarado: numero(linha.itens.at(-1).s) });
                continue;
            }
            // a letra B/P às vezes falta no PDF: dentro da tabela, nome + aulas já bastam
            const conteudo = linha.itens.find((c) => /^[BP]$/.test(c.s));
            const aulas = numero(linha.itens.at(-1).s);
            if (aulas == null || linha.itens.length < 2 || (!conteudo && !(dentroDaTabela || naListaDeOptativas))) continue;
            const nome = linha.itens.filter((c) => (conteudo ? c.x < conteudo.x : c !== linha.itens.at(-1))).map((c) => c.s).join(' ').replace(/\s+/g, ' ').trim();
            if (!/^\p{L}/u.test(nome) || /^Total/i.test(nome)) continue;
            const item = { semestre, enfase: semestre >= 5 ? enfase : '', sigla: '', nome, aulas, extensao: 0, online: false,
                base: conteudo ? (conteudo.s === 'B' ? 'Básica' : 'Profissional') : '', optativa: /^Disciplina Optativa/i.test(nome) };
            (naListaDeOptativas ? optativas : disciplinas).push(item);
        }
    }
    return { disciplinas, optativas, totaisDeclarados };
}

// ================= ementário =================
const CABECALHO_NOVO = /^\d+\.\d+\.\d+\s*–\s*([A-Z][A-Z0-9]{1,3}-\d{3}|SIGLA|XXXX)\s*–\s*(.+?)(?:\s*–\s*(?:Oferta|Total).*)?$/;
const CABECALHO_ANTIGO = /^(.+?)\s*[-–]\s*(?:CH\s*)?(\d{2,3})\s*aulas$/i;
const CABECALHO_HORAS_AULA = /^(.+?)\s*[-–]\s*(\d{2,3})\s*horas?-aula$/i;
const ROTULO = /^(Objetivos de Aprendizagem|Objetivos?:?|OBJETIVOS?:?|Ementa:?|EMENTA:?|Bibliografias? [Bb]ásica:?|BIBLIOGRAFIAS? BÁSICA:?|Bibliografia [Cc]omplementar:?|BIBLIOGRAFIA COMPLEMENTAR:?|Metodologias Propostas|Instrumentos de Avaliação|Competências[^:]*:?)\b\s*:?\s*/;
const RODAPE = /Assinado com senha|consulta à autenticidade|Documento Nº|Projeto Pedagógico do CST|Fatec Sebrae - R-|Selecione na capa|Ementário Pág|^\d+ \. Ementário|^\d+\. Ementário/;
const quaseTudoMaiusculo = (t) => { const letras = t.replace(/[^A-Za-zÀ-ÿ]/g, ''); return letras.length > 4 && letras.replace(/[^A-ZÀ-Ý]/g, '').length / letras.length > 0.8; };
const FIM_DE_CABECALHO = /^[-–]\s*(?:CH\s*)?\d{2,3}\s*aulas$/i;

function lerEmentario(paginas, inicio) {
    const linhas = paginas.slice(inicio).flatMap((p) => linhasDaPagina(p.itens).filter((l) => !RODAPE.test(l.texto)));
    const entradas = [];
    let atual = null;
    let secao = null;
    linhas.forEach((linha, indice) => {
        if (FIM_DE_CABECALHO.test(linha.texto)) return;
        const seguinte = linhas[indice + 1]?.texto || '';
        const juntado = FIM_DE_CABECALHO.test(seguinte) ? `${linha.texto} ${seguinte}` : linha.texto;
        const novo = linha.texto.match(CABECALHO_NOVO);
        const horasAula = !novo && linha.texto.match(CABECALHO_HORAS_AULA);
        const antigo = !novo && !horasAula && quaseTudoMaiusculo(juntado.split(/\s[-–]\s/)[0]) && juntado.match(CABECALHO_ANTIGO);
        const achado = novo || horasAula || antigo;
        if (achado) {
            atual = {
                sigla: novo && SIGLA.test(novo[1]) ? novo[1] : '',
                nome: (novo ? novo[2] : achado[1]).replace(/\s+/g, ' ').trim(),
                aulas: novo ? null : Number(achado[2]),
                objetivo: '', ementa: ''
            };
            entradas.push(atual);
            secao = null;
            return;
        }
        if (!atual) return;
        const limpo = linha.texto.replace(/^[^\p{L}\d]+/u, '');
        const rotulo = limpo.match(ROTULO);
        let resto = limpo;
        if (rotulo) {
            const r = normalizar(rotulo[1]);
            secao = r.startsWith('objetivo') ? 'objetivo' : r.startsWith('ementa') ? 'ementa' : null;
            resto = limpo.slice(rotulo[0].length);
        }
        if (secao && resto) atual[secao] = `${atual[secao]} ${resto}`.trim();
    });
    return entradas;
}

function casarEmentario(disciplinas, entradas) {
    let casadas = 0;
    for (const d of disciplinas) {
        let entrada = d.sigla ? entradas.find((e) => e.sigla === d.sigla) : null;
        if (!entrada) {
            const minhas = palavras(d.nome);
            entrada = entradas
                .map((e) => {
                    const delas = palavras(e.nome);
                    const comum = [...minhas].filter((p) => delas.has(p)).length;
                    let nota = comum / Math.max(minhas.size, delas.size, 1) + (e.aulas === d.aulas ? 0.05 : 0);
                    // "Cálculo III" no ementário x "Cálculo Aplicado III" na tabela: um contido no
                    // outro, com o mesmo número romano
                    const [menor, maior] = minhas.size <= delas.size ? [minhas, delas] : [delas, minhas];
                    const romanos = (s) => [...s].filter((p) => /^[ivx]+$/.test(p)).sort().join();
                    if (nota < 0.75 && menor.size >= 2 && [...menor].every((p) => maior.has(p)) && romanos(menor) === romanos(maior)) nota = 0.76;
                    return { e, nota };
                })
                .filter((x) => x.nota >= 0.75)
                .sort((a, b) => b.nota - a.nota)[0]?.e;
        }
        if (entrada && (entrada.objetivo || entrada.ementa)) {
            d.objetivo = entrada.objetivo;
            d.ementa = entrada.ementa;
            casadas += 1;
        }
    }
    return casadas;
}

// ================= o arquivo inteiro =================
// "Quantidade de aulas semestrais" (o mais comum), "… anuais" ou só "Quantidade de aulas"
const temTabelaNova = (p) => /Tabela de componentes e distribuição/.test(p.texto) && /Quantidade de aulas/.test(p.texto) && !SUMARIO.test(p.texto);

function detectarModelo(paginas) {
    if (paginas.some(temTabelaNova)) return 'novo';
    if (paginas.some((p) => TITULO_ANTIGO.test(p.texto) && !SUMARIO.test(p.texto))) return 'antigo';
    if (paginas.some((p) => /Matriz Curricular/i.test(p.texto) && /Conteúdo/.test(p.texto) && /Carga Horária/.test(p.texto))) return 'enfases';
    return 'desconhecido';
}

export function lerMatrizFatecDasPaginas(paginas) {
    const modelo = detectarModelo(paginas);
    const textoTodo = paginas.map((p) => p.texto).join(' ');
    // Duração da aula: dita no texto, ou tirada dos totais do curso
    // ("Total de AULAS do curso … 2880" e "Total de HORAS do curso … 2400").
    const minutosDosTotais = () => {
        const numeros = (re) => ((textoTodo.match(re) || [])[1] || '')
            .trim().split(/\s+/).map((n) => Number(n.replace(/\./g, '').replace(',', '.')));
        // o total do curso é o maior número de cada linha (as colunas das
        // duas linhas nem sempre se alinham: uma tem "-" onde a outra não)
        const maior = (lista) => Math.max(0, ...lista.filter((n) => !Number.isNaN(n)));
        let aulas = maior(numeros(/Total de AULAS do curso((?:\s+(?:[\d.]+(?:,\d+)?|-))+)/i));
        let horas = maior(numeros(/Total de HORAS do curso((?:\s+(?:[\d.]+(?:,\d+)?|-))+)/i));
        // ou o resumo "2880 aulas → 2400 horas"
        const resumo = textoTodo.match(/([\d.]+)\s*aulas\s*(?:→|->|=)\s*([\d.]+)\s*horas/i);
        if (!(aulas && horas) && resumo) [aulas, horas] = [resumo[1], resumo[2]].map((n) => Number(n.replace(/\./g, '')));
        const m = aulas && horas ? Math.round(horas * 60 / aulas) : 0;
        return [45, 50, 60].includes(m) ? m : null;
    };
    const minutos = Number((textoTodo.match(/aulas de (\d{2}) minutos/i) || textoTodo.match(/aulas \((\d{2}) minutos\)/i) || [])[1]) || minutosDosTotais();
    const titulo = ((textoTodo.match(/Superior de Tecnologia\s+(?:em|de)\s+(.+?)(?:\s+Referência|\s+CEETEPS|\s+Assinado|\s+Selecione|\s+FATEC|\s+Normas|\s+Eixo|$)/i) || [])[1] || '')
        // sem um fim reconhecível o trecho iria até o fim do PDF: fica a 1ª frase
        .split(/\s{2,}|[.;:]\s/)[0].trim().slice(0, 120);
    const resultado = { modelo, titulo, minutos, periodo: 'semestre', disciplinas: [], complementares: [], optativas: [], avisos: [] };
    if (modelo === 'desconhecido') {
        resultado.avisos.push('Modelo de PDF que o leitor ainda não conhece: nada foi lido.');
        return resultado;
    }

    let totaisDeclarados = [];
    let inicioEmentario;
    if (modelo === 'novo') {
        const inicio = paginas.findIndex(temTabelaNova);
        const secaoComplementar = paginas.findIndex((p, i) => i >= inicio && /componentes complementares/.test(p.texto));
        const fim = secaoComplementar >= 0 ? secaoComplementar : inicio + 1;
        const tituloComplementar = paginas[fim].itens.find((i) => /componentes complementares/.test(i.s));
        const lido = lerTabelaNovo(paginas.slice(inicio, fim + 1), tituloComplementar ? tituloComplementar.y : null);
        // cursos novos organizados por ano ("1º ano", "Total de aulas do ano")
        if (paginas.slice(inicio, fim + 1).some((p) => /Total de aulas do ano|\b\dº ano\b/i.test(p.texto))) resultado.periodo = 'ano';
        resultado.disciplinas = lido.disciplinas;
        totaisDeclarados = lido.totaisDeclarados;
        resultado.complementares = lerComplementaresNovo(paginas[fim].itens.filter((i) => !tituloComplementar || i.y < tituloComplementar.y));
        inicioEmentario = fim + 1;
    } else if (modelo === 'antigo') {
        const inicio = paginas.findIndex((p) => TITULO_ANTIGO.test(p.texto) && !SUMARIO.test(p.texto));
        const ementas = paginas.findIndex((p, i) => i >= inicio && /Ementas e Bibliografias|EMENTAS, OBJETIVOS/i.test(p.texto));
        // sem o título do ementário, a tabela vai até a última página
        // seguida que ainda tem total de semestre
        // (a tabela continua enquanto a página seguinte tiver siglas e um total
        // de semestre; a lista alfabética das disciplinas que vem depois não tem)
        const totaisDeSemestre = (itens) => itens.filter((t) => TOTAL_ANTIGO.test(t.s)
            && (Number((t.s.match(/(\d{3,4})\s*$/) || [])[1]) >= 200 || itens.some((n) => Math.abs(n.y - t.y) < 9 && (numero(n.s) || 0) >= 200)));
        // continua quando o alto da página tem disciplinas (siglas) fechadas por
        // um total de semestre: o resto de um semestre que virou a página
        const continuaTabela = (pagina) => {
            const primeiroTotal = Math.max(-Infinity, ...totaisDeSemestre(pagina.itens).map((t) => t.y));
            return Number.isFinite(primeiroTotal) && acharSiglas(pagina.itens).some((s) => s.y > primeiroTotal);
        };
        let fimTabela = ementas;
        if (ementas < 0) {
            fimTabela = inicio;
            while (fimTabela + 1 < paginas.length && fimTabela - inicio < 4 && continuaTabela(paginas[fimTabela + 1])) fimTabela += 1;
        }
        const lido = lerTabelaAntigo(paginas.slice(inicio, fimTabela + 1));
        resultado.disciplinas = lido.disciplinas;
        resultado.optativas = lido.optativas;
        resultado.complementares = lido.complementares;
        totaisDeclarados = lido.totaisDeclarados;
        inicioEmentario = ementas >= 0 ? ementas : fimTabela + 1;
    } else {
        const inicio = paginas.findIndex((p) => /Matriz Curricular/i.test(p.texto) && /Conteúdo/.test(p.texto));
        const optativas = paginas.findIndex((p, i) => i >= inicio && /DISCIPLINAS OPTATIVAS/.test(p.texto));
        const lido = lerTabelaEnfases(paginas.slice(inicio, (optativas >= 0 ? optativas : inicio + 2) + 1));
        resultado.disciplinas = lido.disciplinas;
        resultado.optativas = lido.optativas;
        totaisDeclarados = lido.totaisDeclarados;
        const estagio = textoTodo.match(/Estágio Curricular e Trabalho de Graduação:\s*(\d+)\s*horas/i);
        if (estagio) resultado.complementares.push({ sigla: '', nome: 'Estágio Curricular e Trabalho de Graduação', horas: Number(estagio[1]) });
        inicioEmentario = paginas.findIndex((p) => /Ementas das Disciplinas/i.test(p.texto));
    }

    const entradas = lerEmentario(paginas, Math.max(0, inicioEmentario));
    resultado.entradasNoEmentario = entradas.length;
    resultado.comDescricao = casarEmentario([...resultado.disciplinas.filter((d) => !d.optativa), ...resultado.optativas], entradas);

    // Total da disciplina diferente da soma das colunas: se o total do
    // semestre só fecha com a soma das colunas, o leitor corrige e avisa.
    for (const d of resultado.disciplinas.filter((x) => x.conta && x.conta !== x.aulas)) {
        const declarado = totaisDeclarados.find((t) => t.semestre === d.semestre && !t.enfase)?.declarado;
        const soma = resultado.disciplinas.filter((x) => x.semestre === d.semestre).reduce((s, x) => s + (x.aulas || 0), 0);
        if (declarado && soma - d.aulas + d.conta === declarado) {
            resultado.avisos.push(d.aulas
                ? `${d.nome}: o PDF diz ${d.aulas} aulas no total, mas as colunas e o total do semestre dão ${d.conta}. Corrigido para ${d.conta}; confira.`
                : `${d.nome}: o total da linha não foi lido; as colunas e o total do semestre dão ${d.conta}. Ficou ${d.conta}; confira.`);
            d.aulas = d.conta;
            d.corrigida = true;
        }
    }
    for (const { semestre, enfase = '', declarado } of totaisDeclarados) {
        const soma = resultado.disciplinas.filter((d) => d.semestre === semestre && (d.enfase || '') === enfase).reduce((s, d) => s + (d.aulas || 0), 0);
        if (declarado && soma !== declarado) resultado.avisos.push(`${semestre}º ${resultado.periodo}${enfase ? ` (${enfase})` : ''}: disciplinas somam ${soma}, o PDF diz ${declarado}`);
    }
    resultado.disciplinas.filter((d) => d.conta && d.conta !== d.aulas && !d.corrigida)
        .forEach((d) => resultado.avisos.push(`${d.nome}: colunas somam ${d.conta}, total diz ${d.aulas}`));
    resultado.disciplinas.filter((d) => !d.aulas || !d.nome).forEach((d) => resultado.avisos.push(`${d.sigla || d.nome || '?'}: sem ${!d.nome ? 'nome' : 'aulas'}`));
    const semSigla = resultado.disciplinas.filter((d) => !d.sigla).length;
    if (modelo === 'novo' && semSigla) resultado.avisos.push(`${semSigla} disciplinas estão com "SIGLA" no lugar do código no PDF`);
    // Confiável: mais de um período, cada período com o total do PDF batendo
    // e toda disciplina com nome e aulas. Senão o Admin avisa antes de usar.
    // totais que o próprio PDF declara (a revisão no Admin compara com eles)
    resultado.totais = totaisDeclarados.filter((t) => t.declarado)
        .map(({ semestre, enfase = '', declarado }) => ({ semestre, enfase, declarado }));
    const periodos = new Set(resultado.disciplinas.map((d) => d.semestre)).size;
    // ("colunas somam X" numa disciplina só pede conferência: o total dela
    // entra na soma do período, que bateu com o PDF)
    // (todo período precisa ter o total do PDF: sem ele não dá para saber se
    // faltou disciplina, como quando o semestre continua na página seguinte)
    const semTotal = [...new Set(resultado.disciplinas.map((d) => d.semestre))]
        .filter((s) => !totaisDeclarados.some((t) => t.semestre === s && t.declarado));
    if (semTotal.length) {
        resultado.avisos.push(`Sem o total do PDF para conferir: ${semTotal.map((s) => `${s}º ${resultado.periodo}`).join(', ')}`);
    }
    resultado.confiavel = periodos >= 2 && !semTotal.length
        && !resultado.avisos.some((a) => /disciplinas somam|: sem (nome|aulas)/.test(a));
    return resultado;
}

// arquivo: File escolhido no painel admin. O leitor de PDF é grande, então só
// é baixado na hora em que alguém envia um PDF (igual à matriz do SIGA).
export async function lerMatrizFatecDoPdf(arquivo) {
    const [pdfjs, { default: urlDoWorker }] = await Promise.all([
        import('pdfjs-dist'),
        import('pdfjs-dist/build/pdf.worker.min.mjs?url')
    ]);
    pdfjs.GlobalWorkerOptions.workerSrc = urlDoWorker;
    const paginas = await paginasDoPdf(new Uint8Array(await arquivo.arrayBuffer()), pdfjs);
    const resultado = lerMatrizFatecDasPaginas(paginas);
    // nenhuma página com texto: PDF escaneado (só imagem)
    resultado.escaneado = paginas.every((p) => !p.itens.length);
    return resultado;
}
