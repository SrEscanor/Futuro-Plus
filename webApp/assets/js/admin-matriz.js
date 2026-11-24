// Painel Admin · Cursos: as matrizes interativas dentro do formulário do curso.
//
//   Fatec  uma matriz, lida do plano de curso (matriz-fatec.js) → "matrizFatec"
//   Etec   uma por forma de oferta (técnico por módulos, M-Tec por séries…),
//          lidas da matriz do SIGA ou da homologada no SEI, mesmo quando a
//          tabela vem como imagem (matriz-etec.js, com OCR) → "matrizesEtec"
//
// Cada matriz aparece num cartão, pode ser revisada numa tabela e vai para o
// curso quando ele é salvo. O que o leitor não conseguir ler o admin digita à
// mão (ou, na Fatec, deixa só o PDF, como antes).
import { lerMatrizFatecDoPdf } from './matriz-fatec.js';
import { lerMatrizEtecDoPdf } from './matriz-etec.js';
import { EIXOS, sugerirEixo, prepararMatriz, daMatrizDoSiga } from './matriz-interativa.js';

const escapar = (texto) => String(texto ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[c]));
const milhar = (n) => Number(n || 0).toLocaleString('pt-BR');
const normalizar = (texto) => String(texto || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ').trim();
const copia = (valor) => JSON.parse(JSON.stringify(valor));
const numeroOuNulo = (v) => (v === '' || v == null || Number.isNaN(Number(v)) ? null : Number(v));

const ICONE_PDF = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h4"/></svg>';
const ICONE_IMAGEM = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="m21 16-5-5-9 9"/></svg>';
const ICONE_ALERTA = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/></svg>';

const ESTAGIO = /est[aá]gio/i;
const TRABALHO = /trabalho de (gradua|conclus)/i;
const ROMANO = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'];

const PERIODOS = {
    semestre: { nome: 'semestre', plural: 'semestres', rotulo: (n) => `${n}º semestre`, acumulado: (n) => (n === 1 ? '1º semestre' : `1º ao ${n}º semestre`) },
    ano: { nome: 'ano', plural: 'anos', rotulo: (n) => `${n}º ano`, acumulado: (n) => (n === 1 ? '1º ano' : `1º ao ${n}º ano`) },
    modulo: { nome: 'módulo', plural: 'módulos', rotulo: (n) => `Módulo ${ROMANO[n] || n}`,
        acumulado: (n) => (n === 1 ? 'Módulo I' : `Módulos ${Array.from({ length: n }, (_, i) => ROMANO[i + 1]).join(' + ')}`) },
    serie: { nome: 'série', plural: 'séries', rotulo: (n) => `${n}ª série`,
        acumulado: (n) => Array.from({ length: n }, (_, i) => `${i + 1}ª`).join(' + ') + (n === 1 ? ' série' : ' séries') }
};
const periodoDe = (m) => PERIODOS[m?.periodo] || PERIODOS.semestre;
const ehEtec = (m) => ['modulo', 'serie'].includes(m?.periodo) || m?.tipo === 'etec';

// O formulário aberto
const estado = {
    curso: null,
    etec: false,
    matrizes: [],        // as que vão ser gravadas
    problema: null,      // { tipo: 'escaneado' | 'desconhecido' | 'erro', arquivo } quando o PDF não foi lido
    rascunho: null,      // cópia em revisão (só vale ao concluir)
    indice: -1,          // qual matriz está em revisão (-1 = nova, digitada à mão)
    editores: new Set(), // linhas com a descrição aberta
    fechados: new Set()  // períodos recolhidos na revisão
};
let avisar = () => {};

// ========================================================
// Formulário do curso
// ========================================================

export function prepararMatrizesDoCurso(curso, aoAvisar) {
    avisar = aoAvisar || avisar;
    const etec = curso.nivel !== 'superior';
    let matrizes;
    if (!etec) matrizes = curso.matrizFatec ? [copia(curso.matrizFatec)] : [];
    else if ((curso.matrizesEtec || []).length) matrizes = copia(curso.matrizesEtec);
    else {
        // matriz do SIGA salva antes do painel novo: vira matriz interativa
        matrizes = (curso.matrizes || []).filter((m) => (m?.componentes || []).length)
            .map((m) => ({ ...daMatrizDoSiga(m), leitura: 'convertida' }));
    }
    Object.assign(estado, { curso, etec, matrizes, problema: null, rascunho: null, indice: -1 });
    renderizarCartoes();
}

export function limparMatrizes() {
    Object.assign(estado, { curso: null, etec: false, matrizes: [], problema: null, rascunho: null, indice: -1 });
    const caixa = document.getElementById('matriz-fatec');
    if (caixa) caixa.innerHTML = '';
    document.getElementById('modal-matriz')?.classList.remove('aberto');
}

const texto = (v) => String(v ?? '').trim();
const inteiro = (v) => Math.max(0, Math.round(Number(v) || 0));

function limpar(m) {
    const etec = ehEtec(m);
    return {
        tipo: etec ? 'etec' : 'fatec',
        modelo: m.modelo || (m.leitura === 'manual' ? 'manual' : ''),
        leitura: m.leitura || '',
        rotulo: texto(m.rotulo),
        // (na Fatec o título não aparece na página e o do PDF pode vir enorme)
        titulo: etec ? texto(m.titulo).slice(0, 160) : '',
        origem: texto(m.origem),
        periodo: PERIODOS[m.periodo] ? m.periodo : 'semestre',
        minutos: [45, 50, 60].includes(Number(m.minutos)) ? Number(m.minutos) : null,
        horasDoPdf: inteiro(m.horasDoPdf) || null,
        arquivo: texto(m.arquivo),
        mostrar: m.mostrar === 'pdf' ? 'pdf' : 'interativa',
        confiavel: Boolean(m.confiavel),
        revisada: Boolean(m.revisada),
        lidaEm: m.lidaEm || new Date().toISOString(),
        disciplinas: (m.disciplinas || []).map((d) => ({
            semestre: inteiro(d.semestre) || 1, sigla: texto(d.sigla), nome: texto(d.nome), aulas: inteiro(d.aulas),
            ...(etec ? {
                teoria: d.teoria == null || d.base ? null : inteiro(d.teoria),
                pratica: d.pratica == null || d.base ? null : inteiro(d.pratica),
                base: Boolean(d.base)
            } : { online: Boolean(d.online), extensao: inteiro(d.extensao), enfase: texto(d.enfase) }),
            eixo: d.base ? 'medio' : (EIXOS.some((e) => e.id === d.eixo && e.id !== 'medio') ? d.eixo : sugerirEixo(d.nome)),
            ementa: texto(d.ementa), objetivo: texto(d.objetivo)
        })),
        optativas: (m.optativas || []).map((o) => ({ nome: texto(o.nome), aulas: inteiro(o.aulas), ementa: texto(o.ementa), objetivo: texto(o.objetivo) })),
        qualificacoes: (m.qualificacoes || []).filter((q) => texto(q.nome))
            .map((q) => ({ ate: inteiro(q.ate) || 1, tipo: texto(q.tipo), nome: texto(q.nome) })),
        complementares: (m.complementares || []).filter((c) => inteiro(c.horas))
            .map((c) => ({ sigla: texto(c.sigla), nome: texto(c.nome), horas: inteiro(c.horas) })),
        semEstagio: Boolean(m.semEstagio),
        totaisDoPdf: (m.totaisDoPdf || []).map((t) => ({ semestre: inteiro(t.semestre), enfase: texto(t.enfase), declarado: inteiro(t.declarado) })),
        avisos: (m.avisos || []).map(texto)
    };
}

// { campo, valor }: valor null quando não há matriz (o campo sai do curso)
export function matrizesParaSalvar() {
    if (estado.etec) {
        return { campo: 'matrizesEtec', valor: estado.matrizes.length ? estado.matrizes.map(limpar) : null };
    }
    return { campo: 'matrizFatec', valor: estado.matrizes[0] ? limpar(estado.matrizes[0]) : null };
}

// Leitura que não bateu com os totais da própria matriz não vai para a página sem revisão
export function problemaParaSalvar() {
    const pendente = estado.matrizes.find((m) => m.mostrar !== 'pdf' && !m.confiavel && !m.revisada);
    if (!pendente) return '';
    return `A matriz "${pendente.rotulo || 'da Fatec'}" ainda não foi revisada: a leitura não fechou com os totais do PDF. `
        + (estado.etec ? 'Clique em "Revisar e corrigir" ou remova essa matriz.' : 'Clique em "Revisar e corrigir" ou escolha "Só o PDF do plano de curso".');
}

function daLeituraDaFatec(lida, arquivo) {
    return {
        modelo: lida.modelo, leitura: 'texto', periodo: lida.periodo || 'semestre', minutos: lida.minutos || null,
        arquivo, mostrar: 'interativa', confiavel: Boolean(lida.confiavel), revisada: false, lidaEm: new Date().toISOString(),
        disciplinas: lida.disciplinas.map((d) => ({
            semestre: d.semestre, sigla: d.sigla || '', nome: d.nome || '', aulas: d.aulas || 0,
            online: Boolean(d.online), extensao: d.extensao || 0, eixo: sugerirEixo(d.nome),
            enfase: d.enfase || '', ementa: d.ementa || '', objetivo: d.objetivo || ''
        })),
        optativas: (lida.optativas || []).map((o) => ({ nome: o.nome || '', aulas: o.aulas || 0, ementa: o.ementa || '', objetivo: o.objetivo || '' })),
        complementares: (lida.complementares || []).map((c) => ({ sigla: c.sigla || '', nome: c.nome || '', horas: c.horas || 0 })),
        totaisDoPdf: lida.totais || [],
        avisos: lida.avisos || [],
        titulo: lida.titulo || ''
    };
}

// Devolve { sucesso, etec }: usado pelo painel (admin-cursos.js) para saber
// se vale a pena também guardar o PDF da matriz da Etec no Storage (enviar-
// matriz.js), para a página do curso oferecer o botão "Plano de curso (PDF)".
export async function receberPdfDaMatriz(arquivo) {
    const etec = estado.etec;
    avisar(`Lendo ${arquivo.name}...`);
    try {
        let matriz;
        let problema = null;
        if (etec) {
            const lida = await lerMatrizEtecDoPdf(arquivo, (p) => avisar(`Lendo a imagem da matriz (OCR): ${p}%. Leva uns 10 segundos.`));
            if (lida.problema) problema = lida.problema;
            else matriz = { ...lida.matriz, arquivo: arquivo.name, mostrar: 'interativa', revisada: false, lidaEm: new Date().toISOString() };
        } else {
            const lida = await lerMatrizFatecDoPdf(arquivo);
            if (lida.escaneado || lida.modelo === 'desconhecido' || !lida.disciplinas.length) problema = lida.escaneado ? 'escaneado' : 'desconhecido';
            else matriz = daLeituraDaFatec(lida, arquivo.name);
        }
        if (problema) {
            estado.problema = { tipo: problema, arquivo: arquivo.name };
            renderizarCartoes();
            avisar('');
            return { sucesso: false, etec };
        }
        estado.problema = null;

        // Etec: substitui a matriz da mesma forma de oferta (outro PDF do técnico
        // troca o técnico); senão entra como mais uma aba. Fatec: troca a única.
        let substituiu = false;
        if (estado.etec) {
            const mesma = estado.matrizes.findIndex((m) => m.periodo === matriz.periodo);
            if (mesma >= 0) { estado.matrizes[mesma] = matriz; substituiu = true; } else estado.matrizes.push(matriz);
        } else {
            substituiu = estado.matrizes.length > 0;
            estado.matrizes = [matriz];
        }
        renderizarCartoes();

        const periodos = new Set(matriz.disciplinas.map((d) => d.semestre)).size;
        const tecnicas = matriz.disciplinas.filter((d) => !d.base).length;
        const nomeDoPdf = normalizar(matriz.titulo);
        const nomeDoCurso = normalizar(estado.curso?.nome);
        const outroCurso = nomeDoPdf && nomeDoCurso && !nomeDoPdf.includes(nomeDoCurso);
        avisar(
            `${substituiu ? 'Matriz substituída' : 'Matriz lida'}${matriz.leitura === 'ocr' ? ' da imagem do PDF' : ''}: `
            + `${tecnicas} disciplina${tecnicas === 1 ? '' : 's'} em ${periodos} ${periodos === 1 ? periodoDe(matriz).nome : periodoDe(matriz).plural}`
            + (matriz.confiavel ? ', com as somas batendo com a matriz.' : ', mas a leitura não fechou com os totais: revise antes de salvar.')
            + (matriz.leitura === 'ocr' && matriz.confiavel ? ' Como veio de imagem, confira os nomes na revisão.' : '')
            + (outroCurso ? ` Atenção: o PDF parece ser de "${matriz.titulo}" — confira se é a matriz certa.` : '')
            + ' Clique em "Salvar curso" para gravar.',
            matriz.confiavel && !outroCurso ? 'ok' : ''
        );
        return { sucesso: true, etec };
    } catch (erro) {
        console.error('Erro ao ler a matriz:', erro);
        estado.problema = { tipo: 'erro', arquivo: arquivo.name };
        renderizarCartoes();
        avisar('');
        return { sucesso: false, etec };
    }
}

// ========================================================
// Cartões
// ========================================================

function rotuloDaOrigem(m) {
    if (m.leitura === 'ocr') return '<span class="mr-origem mr-origem--ocr">lida da imagem (OCR)</span>';
    if (m.leitura === 'manual' || m.modelo === 'manual') return '<span class="mr-origem">digitada à mão</span>';
    if (m.leitura === 'convertida') return '<span class="mr-origem mr-origem--ocr">matriz do SIGA salva antes</span>';
    return '<span class="mr-origem">lida do texto do PDF</span>';
}

function numerosDaMatriz(m) {
    const dados = prepararMatriz(m);
    const horas = Number(m.horasDoPdf) || (m.minutos ? Math.round(dados.aulasDoCurso * m.minutos / 60) : 0);
    const base = new Set(m.disciplinas.filter((d) => d.base).map((d) => d.nome)).size;
    const tecnicas = m.disciplinas.filter((d) => !d.base).length;
    const quarto = ehEtec(m)
        ? `<div><b>${(m.qualificacoes || []).filter((q) => q.tipo).length}</b><span>certificações</span></div>`
        : `<div><b>${m.disciplinas.filter((d) => d.ementa || d.objetivo).length} de ${m.disciplinas.length}</b><span>com descrição</span></div>`;
    return `
        <div class="mr-numeros">
            <div><b>${tecnicas}${base ? ` + ${base}` : ''}</b><span>${base ? 'técnicas + ensino médio' : (tecnicas === 1 ? 'disciplina' : 'disciplinas')}</span></div>
            <div><b>${dados.semestres.length}</b><span>${dados.semestres.length === 1 ? periodoDe(m).nome : periodoDe(m).plural}</span></div>
            <div><b>${milhar(dados.aulasDoCurso)}</b><span>aulas${horas ? ` (${milhar(horas)} h)` : ''}</span></div>
            ${quarto}
        </div>`;
}

function listaDeAvisos(m) {
    const avisos = m.revisada ? [] : (m.avisos || []);
    if (!avisos.length && (m.confiavel || m.revisada)) return '';
    const itens = avisos.length ? avisos : ['A leitura não fechou com os totais do PDF.'];
    return `
        <div class="mr-avisos">
            <b>${itens.length === 1 ? '1 ponto para conferir' : `${itens.length} pontos para conferir`}</b>
            <ul>${itens.map((a) => `<li>${escapar(a)}</li>`).join('')}</ul>
        </div>`;
}

function seloDasSomas(m) {
    if (!m.confiavel || m.revisada || !(m.totaisDoPdf || []).length || m.leitura === 'convertida') return '';
    return `<div class="mr-selo-ok">✓ A soma de cada ${periodoDe(m).nome} bate com o total da matriz (${m.totaisDoPdf.map((t) => milhar(t.declarado)).join(' · ')}).</div>`;
}

function cartao(m, i) {
    const titulo = estado.etec ? (m.rotulo || `Matriz ${i + 1}`) : (m.modelo === 'manual' ? 'Matriz da Fatec digitada à mão' : 'Matriz da Fatec lida do PDF');
    return `
        <div class="mr-cartao" data-matriz="${i}">
            <div class="mr-cartao-topo">
                <span class="mr-pdf">${m.leitura === 'ocr' ? ICONE_IMAGEM : ICONE_PDF}</span>
                <div>
                    <strong>${escapar(titulo)}${m.revisada ? ' · revisada' : ''}${estado.etec ? rotuloDaOrigem(m) : ''}</strong>
                    ${m.arquivo ? `<span>${escapar(m.arquivo)}</span>` : (m.origem ? `<span>${escapar(m.origem)}</span>` : '')}
                </div>
                <button type="button" class="btn-remover" data-mf-remover="${i}">Remover</button>
            </div>
            ${numerosDaMatriz(m)}
            ${seloDasSomas(m)}
            ${listaDeAvisos(m)}
            ${m.leitura === 'convertida' ? '<p class="mr-nota-cartao">Veio da matriz que estava salva. Envie o PDF de novo para trazer as certificações e o TCC.</p>' : ''}
            <div class="mr-acoes">
                <button type="button" class="btn btn-primario" data-mf-revisar="${i}">${m.revisada ? 'Revisar de novo' : 'Revisar e corrigir'}</button>
                ${estado.etec ? '' : '<button type="button" class="btn btn-secundario" data-mf-trocar>Trocar o PDF</button>'}
            </div>
        </div>`;
}

function renderizarCartoes() {
    const caixa = document.getElementById('matriz-fatec');
    if (!caixa) return;
    const { matrizes, problema } = estado;
    const partes = [];

    if (problema) {
        const motivo = {
            escaneado: 'O arquivo é uma imagem escaneada sem a tabela legível.',
            desconhecido: estado.etec
                ? 'O PDF não tem uma matriz que o leitor conheça (a do SIGA ou a homologada no SEI, com módulos, teoria e prática).'
                : 'O PDF não está num modelo de tabela que o leitor conhece (pode ser uma grade de uma página só).',
            erro: 'Não deu para abrir o arquivo como PDF.'
        }[problema.tipo];
        partes.push(`
            <div class="mr-cartao mr-cartao--erro">
                <div class="mr-cartao-topo">
                    <span class="mr-pdf">${ICONE_ALERTA}</span>
                    <div><strong>Não deu para ler este PDF sozinho</strong><span>${escapar(problema.arquivo)}</span></div>
                </div>
                <p>${motivo} Você pode digitar a matriz à mão${estado.etec ? '' : ' ou mostrar só o PDF na página do curso, como antes'}.</p>
                <div class="mr-acoes">
                    <button type="button" class="btn btn-primario" data-mf-manual>Digitar a matriz à mão</button>
                    <button type="button" class="btn btn-secundario" data-mf-so-pdf>${estado.etec ? 'Deixar para depois' : 'Usar só o PDF'}</button>
                </div>
            </div>`);
    }

    if (!matrizes.length && !problema) {
        partes.push(estado.etec
            ? `<p class="mr-vazio">Sem matriz ainda. Envie a matriz da Etec (PDF do SIGA ou do SEI) aqui embaixo
                ou <button type="button" class="mr-link" data-mf-manual>digite à mão</button>.</p>`
            : `<p class="mr-vazio">Sem matriz da Fatec ainda. Envie o plano de curso (PDF) aqui embaixo
                ou <button type="button" class="mr-link" data-mf-manual>digite a matriz à mão</button>.</p>`);
    }

    if (matrizes.length) {
        partes.push(`<div class="mr-lista">${matrizes.map(cartao).join('')}</div>`);
        if (estado.etec && matrizes.length) {
            partes.push(`<p class="mr-vazio">Cada forma de oferta vira uma aba na página do curso.
                <button type="button" class="mr-link" data-mf-manual>Digitar outra à mão</button>.</p>`);
        }
        if (!estado.etec) {
            const m = matrizes[0];
            partes.push(`
                <fieldset class="mr-mostrar">
                    <legend>Na página do curso, mostrar</legend>
                    <label class="mr-opcao"><input type="radio" name="mf-mostrar" value="interativa"${m.mostrar !== 'pdf' ? ' checked' : ''}>
                        <span><b>Matriz interativa</b><small>Grade por ${periodoDe(m).nome}, com o que se estuda em cada disciplina. O botão do PDF continua lá.</small></span></label>
                    <label class="mr-opcao"><input type="radio" name="mf-mostrar" value="pdf"${m.mostrar === 'pdf' ? ' checked' : ''}>
                        <span><b>Só o PDF do plano de curso</b><small>Como antes, com o link do campo "Link do Plano de Curso (PDF)". A matriz fica guardada.</small></span></label>
                </fieldset>`);
        }
    }
    caixa.innerHTML = partes.join('');
}

// ========================================================
// Revisão (tabela editável)
// ========================================================

function periodosDoCurso(curso, etec) {
    const t = normalizar(curso?.duracao);
    const semestres = Number((t.match(/(\d+)\s*semestre/) || [])[1]);
    const anos = Number((t.match(/(\d+)\s*ano/) || [])[1]);
    if (etec) return { periodo: 'modulo', quantos: semestres || 3 };
    if (semestres) return { periodo: 'semestre', quantos: semestres };
    if (anos) return { periodo: 'ano', quantos: anos };
    return { periodo: 'semestre', quantos: 6 };
}

const disciplinaVazia = (semestre, etec) => (etec
    ? { semestre, sigla: '', nome: '', aulas: 0, teoria: null, pratica: null, base: false, eixo: 'curso', ementa: '', objetivo: '' }
    : { semestre, sigla: '', nome: '', aulas: 0, online: false, extensao: 0, eixo: 'curso', enfase: '', ementa: '', objetivo: '' });

function abrirRevisao(rascunho, indice) {
    estado.rascunho = rascunho;
    estado.indice = indice;
    estado.editores = new Set();
    estado.fechados = new Set();
    // revisão de uma leitura grande: abre o 1º período e os que têm aviso
    const periodos = periodosDoRascunho();
    if (rascunho.disciplinas.length > 12) {
        const comAviso = new Set(rascunho.disciplinas.filter((d) => avisoDa(rascunho, d)).map((d) => d.semestre));
        periodos.forEach((s) => { if (s !== periodos[0] && !comAviso.has(s)) estado.fechados.add(s); });
    }
    document.getElementById('mr-subtitulo').textContent = [
        estado.curso?.nome, estado.etec ? rascunho.rotulo : '',
        rascunho.arquivo ? `lida de ${rascunho.arquivo}` : (rascunho.leitura === 'convertida' ? 'matriz do SIGA salva antes' : 'digitada à mão'),
        'nada é gravado até salvar o curso'
    ].filter(Boolean).join(' · ');
    document.getElementById('mr-erro').textContent = '';
    renderizarRevisao();
    document.getElementById('modal-matriz').classList.add('aberto');
    document.getElementById('mr-corpo').scrollTop = 0;
}

function periodosDoRascunho() {
    return [...new Set(estado.rascunho.disciplinas.map((d) => d.semestre))].sort((a, b) => a - b);
}

function avisoDa(m, d) {
    if (m.revisada || !d.nome) return '';
    return (m.avisos || []).find((a) => a.startsWith(`${d.nome}:`) || (d.sigla && a.startsWith(`${d.sigla} `))) || '';
}

function contasDoPeriodo(s) {
    const lista = estado.rascunho.disciplinas.filter((d) => d.semestre === s);
    const soma = lista.filter((d) => !d.enfase).reduce((t, d) => t + (Number(d.aulas) || 0), 0);
    const declarado = (estado.rascunho.totaisDoPdf || []).find((t) => t.semestre === s && !t.enfase)?.declarado;
    return { lista, soma, declarado, comEnfase: lista.some((d) => d.enfase) };
}

function seloDoPeriodo(s) {
    const { soma, declarado, comEnfase } = contasDoPeriodo(s);
    if (!declarado || comEnfase) return '';
    return soma === declarado
        ? `<span class="mr-confere">✓ soma igual à da matriz (${milhar(declarado)})</span>`
        : `<span class="mr-confere mr-confere--nao">soma ${milhar(soma)} · a matriz diz ${milhar(declarado)}</span>`;
}

function resumoDoRascunho() {
    const r = estado.rascunho;
    const dados = prepararMatriz({ ...r, disciplinas: r.disciplinas.filter((d) => d.nome || Number(d.aulas)) });
    const minutos = Number(r.minutos) || 0;
    return {
        aulas: dados.aulasDoCurso,
        horas: Number(r.horasDoPdf) || (minutos ? Math.round(dados.aulasDoCurso * minutos / 60) : 0),
        disciplinas: r.disciplinas.filter((d) => !d.base && (d.nome || Number(d.aulas))).length,
        teoria: r.disciplinas.reduce((t, d) => t + (Number(d.teoria) || 0), 0),
        pratica: r.disciplinas.reduce((t, d) => t + (Number(d.pratica) || 0), 0),
        extensao: r.disciplinas.reduce((t, d) => t + (Number(d.extensao) || 0), 0)
    };
}

function seletorDeEixo(d, i) {
    if (d.base) return '<span class="mr-eixo-fixo">Ensino médio</span>';
    const eixo = EIXOS.find((e) => e.id === d.eixo && e.id !== 'medio') || EIXOS.find((e) => e.id === 'curso');
    return `<select data-i="${i}" data-campo="eixo" aria-label="Eixo" style="border-left-color:${eixo.cor}">
        ${EIXOS.filter((e) => e.id !== 'medio').map((e) => `<option value="${e.id}"${e.id === eixo.id ? ' selected' : ''}>${escapar(e.nome)}</option>`).join('')}
    </select>`;
}

function linhaDaRevisao(d, i, colunas) {
    const etec = ehEtec(estado.rascunho);
    const aviso = avisoDa(estado.rascunho, d);
    const temDescricao = d.ementa || d.objetivo;
    const aberta = estado.editores.has(i);
    const numero = (campo, rotulo, desligado = false) => `<td><input type="number" min="0" step="1" value="${d[campo] == null || d[campo] === '' ? '' : Number(d[campo])}"
        data-i="${i}" data-campo="${campo}" aria-label="${rotulo}"${desligado ? ' disabled' : ''}></td>`;
    const celulas = etec
        ? `${numero('teoria', 'Aulas de teoria', d.base)}${numero('pratica', 'Aulas de prática', d.base)}${numero('aulas', 'Total de aulas')}`
        : `${numero('aulas', 'Aulas')}<td class="mr-c-online"><input type="checkbox"${d.online ? ' checked' : ''} data-i="${i}" data-campo="online" aria-label="On-line"></td>
           ${numero('extensao', 'Aulas de extensão')}`;
    return `
        <tr class="${aviso ? 'mr-linha--aviso' : ''}${d.base ? ' mr-linha--base' : ''}" data-linha="${i}">
            <td><input type="text" value="${escapar(d.sigla)}" data-i="${i}" data-campo="sigla" aria-label="Código"></td>
            <td><input type="text" value="${escapar(d.nome)}" data-i="${i}" data-campo="nome" aria-label="Disciplina" placeholder="Nome da disciplina"></td>
            ${colunas.enfase ? `<td><input type="text" value="${escapar(d.enfase)}" data-i="${i}" data-campo="enfase" aria-label="Ênfase" placeholder="—"></td>` : ''}
            ${celulas}
            <td>${seletorDeEixo(d, i)}</td>
            <td><button type="button" class="mr-desc ${temDescricao ? 'mr-desc--ok' : 'mr-desc--falta'}" data-mr-descricao="${i}" aria-expanded="${aberta}">
                ${aberta ? 'Fechar' : (temDescricao ? '✓ Descrição' : '+ Descrição')}</button></td>
            <td><button type="button" class="mr-x" data-mr-remover="${i}" aria-label="Remover disciplina">×</button></td>
        </tr>
        ${aviso ? `<tr class="mr-nota"><td colspan="${colunas.total}">${escapar(aviso.replace(`${d.nome}: `, '').replace(`${d.sigla} ${d.nome}: `, ''))}</td></tr>` : ''}
        ${aberta ? `<tr class="mr-editor"><td colspan="${colunas.total}"><div class="mr-editor-grade">
            <div><label for="mr-ementa-${i}">O que se estuda (ementa)</label>
                <textarea id="mr-ementa-${i}" data-i="${i}" data-campo="ementa">${escapar(d.ementa)}</textarea></div>
            <div><label for="mr-objetivo-${i}">Objetivo</label>
                <textarea id="mr-objetivo-${i}" data-i="${i}" data-campo="objetivo">${escapar(d.objetivo)}</textarea></div>
        </div></td></tr>` : ''}`;
}

function cabecalhoDaTabela(etec, comEnfase) {
    const numeros = etec
        ? '<th class="mr-c-num">Teoria</th><th class="mr-c-num">Prática</th><th class="mr-c-num">Total</th>'
        : '<th class="mr-c-aulas">Aulas</th><th class="mr-c-online">On-line</th><th class="mr-c-ext">Extensão</th>';
    return `<thead><tr><th class="mr-c-sigla">${etec ? 'Código' : 'Sigla'}</th><th>Disciplina</th>${comEnfase ? '<th class="mr-c-enfase">Ênfase</th>' : ''}
        ${numeros}<th class="mr-c-eixo">Eixo</th><th class="mr-c-desc">Descrição</th><th class="mr-c-x"></th></tr></thead>`;
}

function htmlDasCertificacoes(r) {
    const periodos = periodosDoRascunho();
    const p = periodoDe(r);
    return `
        <div class="mr-qualis">
            <h4>Certificação ao concluir cada etapa</h4>
            ${periodos.map((s) => {
                const q = (r.qualificacoes || []).find((x) => Number(x.ate) === s) || { tipo: '', nome: '' };
                const tipo = q.tipo || (q.nome ? '' : 'nenhuma');
                return `<div class="mr-quali-linha"><span>${escapar(p.acumulado(s))}</span>
                    <select data-mr-quali="${s}" data-parte="tipo" aria-label="Tipo de certificação">
                        <option value="Qualificação"${q.tipo === 'Qualificação' ? ' selected' : ''}>Qualificação</option>
                        <option value="Habilitação"${q.tipo === 'Habilitação' ? ' selected' : ''}>Habilitação</option>
                        <option value=""${tipo === '' || tipo === 'nenhuma' ? ' selected' : ''}>Sem certificação</option>
                    </select>
                    <input type="text" value="${escapar(q.tipo ? q.nome : '')}" data-mr-quali="${s}" data-parte="nome" aria-label="Nome da certificação"
                        placeholder="Ex.: Auxiliar em Desenvolvimento de Sistemas"></div>`;
            }).join('')}
        </div>`;
}

function renderizarRevisao() {
    const r = estado.rascunho;
    const corpo = document.getElementById('mr-corpo');
    const rolagem = corpo.scrollTop;
    const etec = ehEtec(r);
    const p = periodoDe(r);
    const comEnfase = r.disciplinas.some((d) => d.enfase);
    const colunas = { enfase: comEnfase, total: 8 + (comEnfase ? 1 : 0) };
    const resumo = resumoDoRascunho();
    const estagio = (r.complementares || []).find((c) => ESTAGIO.test(c.nome));
    const trabalho = (r.complementares || []).find((c) => TRABALHO.test(c.nome) && c !== estagio);

    const blocos = periodosDoRascunho().map((s) => {
        const { lista, soma, comEnfase: periodoComEnfase } = contasDoPeriodo(s);
        const tecnicas = lista.filter((d) => !d.base).length;
        const base = lista.length - tecnicas;
        return `
            <details class="mr-bloco" data-periodo="${s}"${estado.fechados.has(s) ? '' : ' open'}>
                <summary><b>${escapar(p.rotulo(s))}</b>
                    <span class="mr-bloco-info" data-mr-info="${s}">${tecnicas} disciplina${tecnicas === 1 ? '' : 's'}${base ? ` + ${base} do ensino médio` : ''} · ${periodoComEnfase ? 'com ênfases' : `${milhar(soma)} aulas`}</span>
                    <span data-mr-selo="${s}">${seloDoPeriodo(s)}</span></summary>
                <div class="mr-bloco-corpo">
                    <table class="mr-tabela">
                        ${cabecalhoDaTabela(etec, comEnfase)}
                        <tbody>${r.disciplinas.map((d, i) => (d.semestre === s ? linhaDaRevisao(d, i, colunas) : '')).join('')}</tbody>
                    </table>
                    <button type="button" class="mr-adicionar" data-mr-adicionar="${s}">+ Adicionar disciplina</button>
                </div>
            </details>`;
    }).join('');

    const configuracao = etec ? `
            <label>Forma de oferta<select data-mr-config="periodo">
                <option value="modulo"${r.periodo === 'modulo' ? ' selected' : ''}>Técnico (por módulos)</option>
                <option value="serie"${r.periodo === 'serie' ? ' selected' : ''}>M-Tec (por séries)</option>
                <option value="semestre"${r.periodo === 'semestre' ? ' selected' : ''}>Por semestres</option></select></label>
            <label>Nome na aba da página<input type="text" value="${escapar(r.rotulo)}" data-mr-config="rotulo"></label>`
        : `
            <label>Organização<select data-mr-config="periodo">
                <option value="semestre"${r.periodo !== 'ano' ? ' selected' : ''}>Por semestre</option>
                <option value="ano"${r.periodo === 'ano' ? ' selected' : ''}>Por ano</option></select></label>`;
    const fora = etec ? `
        <div class="mr-fora">
            <h4>Fora das aulas</h4>
            <label>Trabalho de conclusão de curso (horas)<input type="number" min="0" step="1" value="${trabalho?.horas || ''}" data-mr-complementar="trabalho" placeholder="0"></label>
            <label>Estágio supervisionado (horas)<input type="number" min="0" step="1" value="${estagio?.horas || ''}" data-mr-complementar="estagio" placeholder="0"${r.semEstagio ? ' disabled' : ''}></label>
            <label>Estágio<span class="mr-check"><input type="checkbox" data-mr-config="semEstagio"${r.semEstagio ? ' checked' : ''}> Este curso não exige estágio</span></label>
        </div>`
        : `
        <div class="mr-fora">
            <h4>Fora das aulas do ${p.nome}</h4>
            <label>Estágio supervisionado (horas)<input type="number" min="0" step="1" value="${estagio?.horas || ''}" data-mr-complementar="estagio" placeholder="0"></label>
            <label>Trabalho de graduação (horas)<input type="number" min="0" step="1" value="${trabalho?.horas || ''}" data-mr-complementar="trabalho" placeholder="0"></label>
            <label>Atividades de extensão<output data-mr-extensao>${textoDaExtensao(resumo.extensao, r.minutos)}</output></label>
        </div>`;

    corpo.innerHTML = `
        <div class="mr-config">
            ${configuracao}
            <label>Duração da aula<select data-mr-config="minutos">
                ${[['', 'Não sei'], ['45', '45 minutos'], ['50', '50 minutos'], ['60', '60 minutos']].map(([v, t]) =>
                    `<option value="${v}"${String(r.minutos || '') === v ? ' selected' : ''}>${t}</option>`).join('')}</select></label>
            <div class="mr-total"><b data-mr-total>${milhar(resumo.aulas)} aulas</b>
                <span data-mr-subtotal>${textoDoSubtotal(resumo, etec)}</span></div>
        </div>
        ${r.leitura === 'ocr' && !r.revisada ? '<div class="mr-info">Lida da imagem do PDF (OCR). As contas foram conferidas com os totais da matriz, mas confira a grafia dos nomes.</div>' : ''}
        ${r.revisada ? '' : listaDeAvisos(r)}
        ${blocos}
        <button type="button" class="mr-adicionar mr-adicionar--periodo" data-mr-novo-periodo>+ Adicionar ${p.nome}</button>
        ${etec ? htmlDasCertificacoes(r) : ''}
        ${fora}
        ${(r.optativas || []).length ? `<p class="mr-optativas"><b>Optativas lidas do PDF:</b> ${r.optativas.map((o) => escapar(o.nome)).join(' · ')}</p>` : ''}`;
    corpo.scrollTop = rolagem;
}

function textoDoSubtotal(resumo, etec) {
    const partes = [];
    if (resumo.horas) partes.push(`${milhar(resumo.horas)} horas`);
    partes.push(`${resumo.disciplinas} disciplina${resumo.disciplinas === 1 ? '' : 's'}`);
    if (etec && (resumo.teoria || resumo.pratica)) partes.push(`${milhar(resumo.teoria)} de teoria e ${milhar(resumo.pratica)} de prática`);
    return partes.join(' · ');
}

function textoDaExtensao(aulas, minutos) {
    if (!aulas) return 'Nenhuma disciplina com aulas de extensão';
    return Number(minutos) ? `${milhar(Math.round(aulas * minutos / 60))} horas, somadas das disciplinas` : `${milhar(aulas)} aulas, somadas das disciplinas`;
}

// Contas que mudam enquanto o admin digita, sem redesenhar a tabela (o foco fica onde está)
function atualizarContas() {
    const r = estado.rascunho;
    const resumo = resumoDoRascunho();
    const corpo = document.getElementById('mr-corpo');
    corpo.querySelector('[data-mr-total]').textContent = `${milhar(resumo.aulas)} aulas`;
    corpo.querySelector('[data-mr-subtotal]').textContent = textoDoSubtotal(resumo, ehEtec(r));
    const extensao = corpo.querySelector('[data-mr-extensao]');
    if (extensao) extensao.textContent = textoDaExtensao(resumo.extensao, r.minutos);
    periodosDoRascunho().forEach((s) => {
        const { lista, soma, comEnfase } = contasDoPeriodo(s);
        const tecnicas = lista.filter((d) => !d.base).length;
        const base = lista.length - tecnicas;
        const info = corpo.querySelector(`[data-mr-info="${s}"]`);
        if (info) info.textContent = `${tecnicas} disciplina${tecnicas === 1 ? '' : 's'}${base ? ` + ${base} do ensino médio` : ''} · ${comEnfase ? 'com ênfases' : `${milhar(soma)} aulas`}`;
        const selo = corpo.querySelector(`[data-mr-selo="${s}"]`);
        if (selo) selo.innerHTML = seloDoPeriodo(s);
    });
}

function concluirRevisao() {
    const r = estado.rascunho;
    const erro = document.getElementById('mr-erro');
    const etec = ehEtec(r);
    // linha toda em branco é só sobra: sai sem reclamar
    r.disciplinas = r.disciplinas.filter((d) => String(d.nome).trim() || Number(d.aulas));
    const incompletas = r.disciplinas.filter((d) => !String(d.nome).trim() || !(Number(d.aulas) > 0));
    const contaErrada = etec ? r.disciplinas.filter((d) => !d.base && d.teoria != null && d.pratica != null
        && d.teoria !== '' && d.pratica !== '' && Number(d.teoria) + Number(d.pratica) !== Number(d.aulas)) : [];
    if (!r.disciplinas.length) {
        erro.textContent = 'A matriz ficou sem disciplinas.';
        return;
    }
    if (incompletas.length || contaErrada.length) {
        const problemas = [...incompletas, ...contaErrada];
        erro.textContent = `${incompletas.length ? 'Falta nome ou aulas' : 'Teoria + prática não dá o total'} em ${problemas.length} disciplina${problemas.length === 1 ? '' : 's'} (${problemas
            .slice(0, 3).map((d) => `${periodoDe(r).rotulo(d.semestre)}${d.nome ? `: ${d.nome}` : ''}`).join('; ')}).`;
        renderizarRevisao();
        return;
    }
    r.disciplinas = r.disciplinas
        .map((d) => ({
            ...d, nome: String(d.nome).trim(), sigla: String(d.sigla).trim(), aulas: Number(d.aulas),
            ...(etec ? { teoria: numeroOuNulo(d.teoria), pratica: numeroOuNulo(d.pratica) } : { extensao: Number(d.extensao) || 0 })
        }))
        .sort((a, b) => a.semestre - b.semestre);
    if (etec && !String(r.rotulo || '').trim()) {
        const n = periodosDoRascunho().length;
        r.rotulo = r.periodo === 'serie' ? `M-Tec (${n} séries)` : `Técnico (${n} ${periodoDe(r).plural})`;
    }
    r.revisada = true;
    erro.textContent = '';
    if (estado.indice >= 0 && estado.matrizes[estado.indice]) estado.matrizes[estado.indice] = r;
    else if (estado.etec) estado.matrizes.push(r);
    else estado.matrizes = [r];
    estado.problema = null;
    estado.rascunho = null;
    document.getElementById('modal-matriz').classList.remove('aberto');
    renderizarCartoes();
    avisar('Revisão concluída. Clique em "Salvar curso" para gravar.', 'ok');
}

// ========================================================
// Eventos (ligados uma vez, por delegação)
// ========================================================

export function ligarMatrizes({ escolherPdf }) {
    document.getElementById('matriz-fatec').addEventListener('click', (evento) => {
        const alvo = evento.target;
        const revisar = alvo.closest('[data-mf-revisar]');
        const remover = alvo.closest('[data-mf-remover]');
        if (revisar) {
            const i = Number(revisar.dataset.mfRevisar);
            if (estado.matrizes[i]) abrirRevisao(copia(estado.matrizes[i]), i);
        } else if (alvo.closest('[data-mf-trocar]')) {
            escolherPdf();
        } else if (remover) {
            const [tirada] = estado.matrizes.splice(Number(remover.dataset.mfRemover), 1);
            renderizarCartoes();
            avisar(estado.etec
                ? `Matriz "${tirada?.rotulo || ''}" removida. Clique em "Salvar curso" para gravar.`
                : 'Matriz da Fatec removida: a página do curso volta a mostrar só o PDF. Clique em "Salvar curso" para gravar.');
        } else if (alvo.closest('[data-mf-manual]')) {
            const { periodo, quantos } = periodosDoCurso(estado.curso, estado.etec);
            abrirRevisao({
                tipo: estado.etec ? 'etec' : 'fatec', modelo: 'manual', leitura: 'manual', periodo, minutos: 50,
                rotulo: estado.etec ? `Técnico (${quantos} módulos)` : '', titulo: '', origem: '',
                arquivo: '', mostrar: 'interativa', confiavel: true, revisada: false, lidaEm: new Date().toISOString(),
                complementares: [], optativas: [], qualificacoes: [], totaisDoPdf: [], avisos: [], semEstagio: false,
                disciplinas: Array.from({ length: quantos }, (_, i) => disciplinaVazia(i + 1, estado.etec))
            }, -1);
        } else if (alvo.closest('[data-mf-so-pdf]')) {
            estado.problema = null;
            if (!estado.etec) estado.matrizes = [];
            renderizarCartoes();
            if (estado.etec) avisar('');
            else {
                const temLink = document.getElementById('f-plano-curso')?.value.trim();
                avisar(`A página do curso vai mostrar só o PDF, como antes${temLink ? '' : ' — preencha o "Link do Plano de Curso (PDF)" mais abaixo'}.`);
            }
        }
    });
    document.getElementById('matriz-fatec').addEventListener('change', (evento) => {
        if (evento.target.name === 'mf-mostrar' && estado.matrizes[0]) estado.matrizes[0].mostrar = evento.target.value;
    });

    const modal = document.getElementById('modal-matriz');
    const corpo = document.getElementById('mr-corpo');
    modal.addEventListener('click', (evento) => {
        const alvo = evento.target;
        if (alvo.closest('[data-mr-cancelar]')) {
            estado.rascunho = null;
            modal.classList.remove('aberto');
            return;
        }
        if (alvo.closest('#mr-concluir')) { concluirRevisao(); return; }
        if (!estado.rascunho) return;
        const r = estado.rascunho;
        const etec = ehEtec(r);
        const adicionar = alvo.closest('[data-mr-adicionar]');
        if (adicionar) {
            const s = Number(adicionar.dataset.mrAdicionar);
            // entra logo depois da última disciplina do período
            const ultima = r.disciplinas.reduce((pos, d, i) => (d.semestre === s ? i : pos), -1);
            r.disciplinas.splice(ultima + 1, 0, disciplinaVazia(s, etec));
            estado.editores = new Set();
            renderizarRevisao();
            corpo.querySelector(`[data-i="${ultima + 1}"][data-campo="nome"]`)?.focus();
            return;
        }
        if (alvo.closest('[data-mr-novo-periodo]')) {
            const proximo = Math.max(0, ...r.disciplinas.map((d) => d.semestre)) + 1;
            r.disciplinas.push(disciplinaVazia(proximo, etec));
            estado.editores = new Set();
            renderizarRevisao();
            corpo.querySelector(`[data-i="${r.disciplinas.length - 1}"][data-campo="nome"]`)?.focus();
            return;
        }
        const remover = alvo.closest('[data-mr-remover]');
        if (remover) {
            r.disciplinas.splice(Number(remover.dataset.mrRemover), 1);
            estado.editores = new Set();
            renderizarRevisao();
            return;
        }
        const descricao = alvo.closest('[data-mr-descricao]');
        if (descricao) {
            const i = Number(descricao.dataset.mrDescricao);
            if (estado.editores.has(i)) estado.editores.delete(i); else estado.editores.add(i);
            renderizarRevisao();
            if (estado.editores.has(i)) corpo.querySelector(`#mr-ementa-${i}`)?.focus();
        }
    });

    // o que o admin digita vai direto para o rascunho
    const aoEditar = (evento) => {
        const r = estado.rascunho;
        const campo = evento.target;
        if (!r) return;
        if (campo.dataset.campo) {
            const i = Number(campo.dataset.i);
            const d = r.disciplinas[i];
            if (!d) return;
            const nome = campo.dataset.campo;
            d[nome] = campo.type === 'checkbox' ? campo.checked
                : (['teoria', 'pratica', 'aulas', 'extensao'].includes(nome) ? (campo.value === '' ? null : Number(campo.value)) : campo.value);
            if (nome === 'eixo') campo.style.borderLeftColor = EIXOS.find((e) => e.id === campo.value).cor;
            // Etec: com teoria e prática preenchidas, o total é a soma
            if ((nome === 'teoria' || nome === 'pratica') && d.teoria != null && d.pratica != null) {
                d.aulas = Number(d.teoria) + Number(d.pratica);
                const total = corpo.querySelector(`[data-i="${i}"][data-campo="aulas"]`);
                if (total) total.value = d.aulas;
            }
            if (['aulas', 'extensao', 'enfase', 'teoria', 'pratica'].includes(nome)) atualizarContas();
            return;
        }
        if (campo.dataset.mrComplementar) {
            const regra = campo.dataset.mrComplementar === 'estagio' ? ESTAGIO : TRABALHO;
            r.complementares = r.complementares || [];
            let item = r.complementares.find((c) => regra.test(c.nome));
            if (!item) {
                item = {
                    sigla: '', horas: 0,
                    nome: campo.dataset.mrComplementar === 'estagio' ? 'Estágio Supervisionado'
                        : (ehEtec(r) ? 'Trabalho de Conclusão de Curso' : 'Trabalho de Graduação')
                };
                r.complementares.push(item);
            }
            item.horas = Number(campo.value) || 0;
            return;
        }
        if (campo.dataset.mrQuali) {
            if (campo.dataset.parte === 'tipo' && evento.type !== 'change') return;
            const s = Number(campo.dataset.mrQuali);
            r.qualificacoes = r.qualificacoes || [];
            let q = r.qualificacoes.find((x) => Number(x.ate) === s);
            if (!q) { q = { ate: s, tipo: '', nome: '' }; r.qualificacoes.push(q); }
            if (campo.dataset.parte === 'tipo') {
                q.tipo = campo.value;
                if (!campo.value) q.nome = 'Sem certificação técnica';
                else if (q.nome === 'Sem certificação técnica') q.nome = '';
            } else {
                q.nome = campo.value;
                // escreveu o nome com "Sem certificação" marcado: vira qualificação
                if (!q.tipo && campo.value.trim()) {
                    q.tipo = 'Qualificação';
                    const seletor = corpo.querySelector(`[data-mr-quali="${s}"][data-parte="tipo"]`);
                    if (seletor) seletor.value = 'Qualificação';
                }
            }
            return;
        }
        if (campo.dataset.mrConfig && (evento.type === 'change' || campo.dataset.mrConfig === 'rotulo')) {
            const chave = campo.dataset.mrConfig;
            if (chave === 'semEstagio') {
                r.semEstagio = campo.checked;
                const horas = corpo.querySelector('[data-mr-complementar="estagio"]');
                if (horas) horas.disabled = campo.checked;
                return;
            }
            r[chave] = chave === 'minutos' ? (Number(campo.value) || null) : campo.value;
            if (chave !== 'rotulo') renderizarRevisao();
        }
    };
    corpo.addEventListener('input', aoEditar);
    corpo.addEventListener('change', aoEditar);
    // períodos recolhidos continuam recolhidos depois de redesenhar
    corpo.addEventListener('toggle', (evento) => {
        const bloco = evento.target.closest?.('.mr-bloco');
        if (!bloco) return;
        const s = Number(bloco.dataset.periodo);
        if (bloco.open) estado.fechados.delete(s); else estado.fechados.add(s);
    }, true);
}
