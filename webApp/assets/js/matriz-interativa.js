// Matriz curricular interativa da página do curso — Fatec e Etec: grade por
// período (semestre, ano, módulo ou série), filtro por eixo, busca, ligação
// I → II → III, a qualificação que cada módulo dá (Etec) e a gaveta com o que
// se estuda em cada disciplina.
//
// Um curso pode ter mais de uma matriz (Etec: técnico por módulos e M-Tec por
// séries): elas viram abas. Vêm de "matrizFatec" e "matrizesEtec" (lidas no
// Painel Admin); curso de Etec que só tem a matriz antiga do SIGA ("matrizes")
// também ganha a grade, convertida por daMatrizDoSiga. Formato de cada matriz:
//   { rotulo, titulo, origem, periodo: 'semestre' | 'ano' | 'modulo' | 'serie',
//     minutos, mostrar, disciplinas: [{ semestre, sigla, nome, aulas, teoria,
//     pratica, online, extensao, base, eixo, enfase, ementa, objetivo }],
//     qualificacoes: [{ ate, tipo, nome }], complementares: [{ nome, horas }],
//     semEstagio, optativas }
// "semestre" é o número do período (1, 2, 3…), qualquer que seja o tipo.

const escapar = (texto) => String(texto ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[c]));
const semAcento = (texto) => String(texto || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const milhar = (n) => Number(n || 0).toLocaleString('pt-BR');
const ROMANO = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'];

// Eixos sugeridos pelo nome da disciplina (o admin pode trocar na revisão).
// A ordem importa: o primeiro que bate vale. "medio" é só da base comum do
// ensino médio (M-Tec), marcada pela própria matriz.
export const EIXOS = [
    { id: 'pi', nome: 'Projetos e TCC', cor: '#3b5bdb', fundo: '#eef1ff', teste: /projeto (integrador|interdisciplinar)|^projetos? d[eo]|trabalho de conclus/i },
    { id: 'direito', nome: 'Direito e Ética', cor: '#5b6084', fundo: '#eef0f6', teste: /direito|[eé]tica|legisla|complien|complian|lgpd|conduta profissional/i },
    // "l[ií]ngua\b": Língua Inglesa sim, Linguagem de Programação não
    { id: 'idiomas', nome: 'Comunicação e Idiomas', cor: '#0d8086', fundo: '#def4f4', teste: /ingl[eê]s|espanhol|l[ií]ngua\b|comunica[cç][aã]o e express|produ[cç][aã]o de textos|reda[cç][aã]o|linguagem, trabalho/i },
    { id: 'matematica', nome: 'Matemática e Estatística', cor: '#b8730c', fundo: '#fff2da', teste: /matem[aá]t|estat[ií]st|c[aá]lculo|[aá]lgebra|combinat/i },
    // "^neg[oó]cios": Negócios e Organizações sim, "… Aplicada a Negócios" não
    { id: 'gestao', nome: 'Gestão e Negócios', cor: '#1d865a', fundo: '#e3f6ec', teste: /gest[aã]o de projetos|governan|empreend|^neg[oó]cios|administra|economia|marketing|finan|organizacional|contabil/i },
    { id: 'curso', nome: 'Específicas do curso', cor: '#6d45d0', fundo: '#f1ebff', teste: /./ },
    { id: 'medio', nome: 'Ensino médio', cor: '#c2416b', fundo: '#fdebf1', teste: /(?!)/ }
];

export function sugerirEixo(nome) {
    return EIXOS.find((e) => e.teste.test(nome || '-')).id;
}

// rotulo: "Módulo II"; numero: "II" (na gaveta); fim: "ao concluir do Módulo II"
const PERIODOS = {
    semestre: { nome: 'semestre', plural: 'semestres', semanas: 20, etec: false, rotulo: (n) => `${n}º semestre`, numero: (n) => `${n}º`, fim: (n) => `o ${n}º semestre` },
    ano: { nome: 'ano', plural: 'anos', semanas: 40, etec: false, rotulo: (n) => `${n}º ano`, numero: (n) => `${n}º`, fim: (n) => `o ${n}º ano` },
    modulo: { nome: 'módulo', plural: 'módulos', semanas: 20, etec: true, rotulo: (n) => `Módulo ${ROMANO[n] || n}`, numero: (n) => ROMANO[n] || String(n), fim: (n) => `o Módulo ${ROMANO[n] || n}` },
    serie: { nome: 'série', plural: 'séries', semanas: 40, etec: true, rotulo: (n) => `${n}ª série`, numero: (n) => `${n}ª`, fim: (n) => `a ${n}ª série` }
};

// "AUXILIAR EM DESENVOLVIMENTO DE SISTEMAS" → "Auxiliar em Desenvolvimento de Sistemas"
const MINUSCULAS = new Set(['de', 'da', 'do', 'das', 'dos', 'e', 'em', 'com', 'a', 'o', 'ao', 'aos', 'para', 'na', 'no', 'nas', 'nos']);
const SIGLAS = new Set(['TI', 'TCC', 'IOT', 'LGPD', 'CNC', 'CAD', 'CAM', 'PCP', 'RH', 'SUS', 'UTI', 'GPS', 'EAD', 'ETEC']);
export function paraNome(texto) {
    return String(texto || '').toLowerCase().split(/\s+/).filter(Boolean).map((p, i) => {
        if (SIGLAS.has(p.toUpperCase())) return p.toUpperCase();
        if (i > 0 && MINUSCULAS.has(p)) return p;
        return p.charAt(0).toUpperCase() + p.slice(1);
    }).join(' ');
}

// ========================================================
// Matriz do SIGA (M-Tec e técnico) no formato da matriz interativa
// ========================================================

// matriz: o que matriz-curricular.js lê; texto: o texto inteiro do PDF, de
// onde saem as certificações, o TCC, a duração da aula e o plano de curso.
export function daMatrizDoSiga(matriz, texto = '') {
    const periodo = matriz.tipoEtapa === 'série' ? 'serie' : matriz.tipoEtapa === 'módulo' ? 'modulo' : 'semestre';
    const disciplinas = [];
    (matriz.componentes || []).forEach((c) => {
        (c.aulas || []).forEach((aulas, i) => {
            if (!aulas) return;
            const base = c.grupo === 'base';
            const tipo = String(c.tipo || '');
            const soTeoria = /teori/i.test(tipo) && !/pr[aá]t/i.test(tipo);
            const soPratica = /pr[aá]t/i.test(tipo) && !/teori/i.test(tipo);
            disciplinas.push({
                semestre: i + 1, sigla: '', nome: c.nome, aulas, base,
                teoria: base ? null : (soTeoria ? aulas : soPratica ? 0 : null),
                pratica: base ? null : (soPratica ? aulas : soTeoria ? 0 : null)
            });
        });
    });

    // "1ª + 2ª Séries  Qualificação Profissional Técnica de Nível Médio de AUXILIAR EM …":
    // corta o texto em cada "1ª + 2ª Séries" e lê o pedaço até o próximo.
    // (Sem regex com repetição dentro de repetição: num texto longo em
    // maiúsculas ela pode levar um tempo sem fim e travar a página.)
    const qualificacoes = [];
    const marcos = [...texto.matchAll(/((?:\d\s*[ªº°]\s*\+\s*){0,8}\d\s*[ªº°])\s*(?:S[ée]ries?|M[óo]dulos?|Semestres?)\b/g)]
        .filter((m) => /S[ée]ries|M[óo]dulos|Semestres|\+/.test(m[0]) || /^\s*1\s*[ªº°]/.test(m[1]));
    marcos.forEach((marco, i) => {
        const fim = marcos[i + 1]?.index ?? Math.min(texto.length, marco.index + 400);
        const pedaco = texto.slice(marco.index + marco[0].length, fim);
        const ate = (marco[1].match(/\d/g) || []).length;
        if (/^\s*SEM CERTIFICA/i.test(pedaco)) {
            qualificacoes.push({ ate, tipo: '', nome: 'Sem certificação técnica' });
            return;
        }
        const tipo = pedaco.match(/^\s*(Qualifica|Habilita)/i);
        const depois = pedaco.split(/N[íi]vel M[ée]dio de|Profissional de/i)[1];
        if (!tipo || !depois) return;
        // o nome é a sequência de palavras em maiúsculas logo depois
        const nome = [];
        const seguintes = depois.trim().split(/\s+/);
        for (let k = 0; k < seguintes.length; k += 1) {
            const palavra = seguintes[k];
            if (!/\p{Lu}/u.test(palavra) || palavra !== palavra.toUpperCase()) break;
            // letra solta antes de minúscula é o começo de outra palavra ("M" + "atriz")
            if (palavra.length === 1 && /^\p{Ll}/u.test(seguintes[k + 1] || '')) break;
            nome.push(palavra);
        }
        if (nome.length) qualificacoes.push({ ate, tipo: /habilita/i.test(tipo[1]) ? 'Habilitação' : 'Qualificação', nome: paraNome(nome.join(' ')) });
    });

    const tcc = texto.match(/Trabalho de Conclus\S* de Curso\s*(?:\([^)]*\))?:?\s*(\d{2,4})\s*horas/i);
    const estagio = texto.match(/Est[áa]gio(?: Supervisionado)?:?\s*(\d{2,4})\s*horas/i);
    const minutos = Number((texto.match(/Horas-aula de (\d{2}) minutos/i) || [])[1]) || null;
    const plano = (texto.match(/(?:N[úu]mero do )?Plano de Curso:?\s*(?:n[ºo°]\s*)?(\d{2,5})(?!\s*,\s*de)/i) || [])[1];
    const unidade = (texto.match(/Unidade Escolar:?\s*(.+?)\s+C[óo]digo/i) || [])[1];
    const habilitacao = qualificacoes.find((q) => q.tipo === 'Habilitação')?.nome;
    const etapas = new Set(disciplinas.map((d) => d.semestre)).size;
    const variante = /integral/i.test(matriz.titulo || '') ? ' · integral' : /noturno/i.test(matriz.titulo || '') ? ' · noturno' : '';
    const rotulo = periodo === 'serie' ? `M-Tec${variante} (${etapas} séries)`
        : `Técnico (${etapas} ${periodo === 'modulo' ? 'módulos' : 'semestres'})`;
    const totais = [...new Set(disciplinas.map((d) => d.semestre))].sort((a, b) => a - b)
        .map((s) => ({ semestre: s, declarado: disciplinas.filter((d) => d.semestre === s).reduce((t, d) => t + d.aulas, 0) }));

    return {
        rotulo,
        titulo: habilitacao
            ? `${periodo === 'serie' ? 'Ensino Médio com Habilitação Profissional' : 'Habilitação Profissional'} de ${habilitacao}`
            : (matriz.titulo || ''),
        origem: `Matriz do SIGA${unidade ? ` da ${unidade.trim()}` : ''}${plano ? ` · Plano de curso ${plano}` : ''}`,
        periodo,
        minutos,
        horasDoPdf: Number(matriz.cargaHoraria) || null,
        disciplinas,
        qualificacoes,
        complementares: [
            ...(tcc ? [{ sigla: '', nome: 'Trabalho de Conclusão de Curso', horas: Number(tcc[1]) }] : []),
            ...(estagio ? [{ sigla: '', nome: 'Estágio Supervisionado', horas: Number(estagio[1]) }] : [])
        ],
        semEstagio: /n[ãa]o (requer|exige)\s+est[áa]gio/i.test(texto),
        totaisDoPdf: totais,
        avisos: [],
        // o texto do SIGA é lido exato: as somas são as da própria tabela
        confiavel: disciplinas.some((d) => !d.base)
    };
}

// Matrizes que a página mostra: as da Etec (uma por forma de oferta) ou a da Fatec
export function matrizesInterativas(curso) {
    // Etec sem matriz nova ainda: a do SIGA que já estava salva, convertida aqui
    const doSiga = curso?.nivel === 'superior' ? []
        : (curso?.matrizes || []).filter((m) => (m?.componentes || []).length).map((m) => daMatrizDoSiga(m));
    const etec = (curso?.matrizesEtec || []).length ? curso.matrizesEtec : doSiga;
    const lista = [...etec, ...(curso?.matrizFatec ? [curso.matrizFatec] : [])];
    return lista.filter((m) => m && m.mostrar !== 'pdf' && (m.disciplinas || []).length);
}

export function temMatrizInterativa(curso) {
    return matrizesInterativas(curso).length > 0;
}

const ROMANOS = { i: 1, ii: 2, iii: 3, iv: 4, v: 5, vi: 6, vii: 7, viii: 8 };

// Sequência sugerida pelo nome: "Inglês I" → "Inglês II" → "Inglês III"
function ligarSequencias(disciplinas) {
    const grupos = new Map();
    disciplinas.forEach((d) => {
        const achado = d.nome.match(/^(.*?)[\s-]+(viii|vii|vi|iv|v|iii|ii|i|\d)$/i);
        if (!achado) return;
        const ordem = ROMANOS[achado[2].toLowerCase()] || Number(achado[2]);
        const base = semAcento(achado[1]).replace(/[^a-z0-9]+/g, ' ').trim();
        if (!grupos.has(base)) grupos.set(base, []);
        grupos.get(base).push({ d, ordem });
    });
    disciplinas.forEach((d) => { d.antes = []; d.depois = []; });
    for (const lista of grupos.values()) {
        if (lista.length < 2) continue;
        lista.sort((a, b) => a.ordem - b.ordem);
        lista.forEach(({ d }, i) => {
            if (i > 0) d.antes.push(lista[i - 1].d.id);
            if (i < lista.length - 1) d.depois.push(lista[i + 1].d.id);
        });
    }
}

export function prepararMatriz(matriz) {
    const todas = (matriz.disciplinas || []).map((d) => ({
        ...d,
        nome: String(d.nome || '').trim(),
        aulas: Number(d.aulas) || 0,
        extensao: Number(d.extensao) || 0
    }));
    const semestres = [...new Set(todas.map((d) => d.semestre))].sort((a, b) => a - b);
    // M-Tec: a base comum do ensino médio vira um cartão por série
    const tecnicas = todas.filter((d) => !d.base);
    const base = semestres.map((s) => {
        const materias = todas.filter((d) => d.base && d.semestre === s);
        return materias.length ? {
            semestre: s, nome: 'Ensino médio (base comum)', grupo: true, eixo: 'medio',
            aulas: materias.reduce((t, d) => t + d.aulas, 0), materias
        } : null;
    }).filter(Boolean);
    const disciplinas = [...base, ...tecnicas].map((d, i) => ({
        ...d,
        id: `d${i}`,
        eixo: d.grupo ? 'medio' : (EIXOS.some((e) => e.id === d.eixo && e.id !== 'medio') ? d.eixo : sugerirEixo(d.nome))
    }));
    ligarSequencias(disciplinas.filter((d) => !d.grupo));
    disciplinas.filter((d) => d.grupo).forEach((d) => { d.antes = []; d.depois = []; });
    const eixos = EIXOS.filter((e) => disciplinas.some((d) => d.eixo === e.id));
    // aulas que uma pessoa faz: em período com ênfases, só uma delas conta
    const aulasDoCurso = semestres.reduce((total, s) => {
        const doPeriodo = disciplinas.filter((d) => d.semestre === s);
        const comuns = doPeriodo.filter((d) => !d.enfase).reduce((t, d) => t + d.aulas, 0);
        const porEnfase = {};
        doPeriodo.filter((d) => d.enfase).forEach((d) => { porEnfase[d.enfase] = (porEnfase[d.enfase] || 0) + d.aulas; });
        return total + comuns + Math.max(0, ...Object.values(porEnfase));
    }, 0);
    // teoria x prática (Etec): só nas disciplinas que dizem a divisão
    const comDivisao = disciplinas.filter((d) => !d.grupo && (d.teoria != null || d.pratica != null));
    const pratica = comDivisao.reduce((t, d) => t + (Number(d.pratica) || 0), 0);
    const totalDividido = comDivisao.reduce((t, d) => t + (Number(d.teoria) || 0) + (Number(d.pratica) || 0), 0);
    return {
        ...matriz,
        periodo: PERIODOS[matriz.periodo] || PERIODOS.semestre,
        disciplinas, semestres, eixos, aulasDoCurso,
        tecnicas: disciplinas.filter((d) => !d.grupo).length,
        temBase: base.length > 0,
        partePratica: totalDividido ? Math.round(pratica / totalDividido * 100) : null,
        complementares: (matriz.complementares || []).filter((c) => Number(c.horas) > 0),
        optativas: matriz.optativas || [],
        qualificacoes: matriz.qualificacoes || [],
        porId: Object.fromEntries(disciplinas.map((d) => [d.id, d]))
    };
}

// Horas de aula do curso pela matriz (o catálogo da Fatec não publica a carga
// horária); 0 quando não dá para saber (sem matriz ou sem a duração da aula)
export function horasDaMatriz(curso) {
    const matriz = matrizesInterativas(curso)[0];
    if (!matriz?.minutos) return 0;
    return Math.round(prepararMatriz(matriz).aulasDoCurso * matriz.minutos / 60);
}

// O que a pessoa escolheu (aba, filtro, busca, disciplina aberta) sobrevive
// aos redesenhos da página, que acontecem quando unidades e distância chegam.
const estado = { chave: '', curso: null, aba: 0, dados: null, ativos: null, busca: '', aberta: null, hover: null };

const ICONE_GRADE = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>';
const ICONE_PDF = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h4"/></svg>';
const ICONE_BUSCA = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>';
const ICONE_CAPELO = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m2 9 10-5 10 5-10 5z"/><path d="M6 11.5V16c0 1.5 2.7 3 6 3s6-1.5 6-3v-4.5"/></svg>';

const corDoEixo = (dados, id) => {
    const eixo = dados.eixos.find((e) => e.id === id);
    return `--c:${eixo.cor};--cb:${eixo.fundo}`;
};

function marcas(d) {
    const teoria = Number(d.teoria) || 0;
    const pratica = Number(d.pratica) || 0;
    return [
        d.online ? '<i class="mi-marca mi-marca--online" title="Aulas on-line">On-line</i>' : '',
        d.extensao ? '<i class="mi-marca mi-marca--extensao" title="Atividade de extensão">Extensão</i>' : '',
        // Etec: quase tudo é prática; marca só o que é teoria
        teoria && !pratica ? '<i class="mi-marca mi-marca--teoria" title="Aulas teóricas">Teoria</i>' : '',
        teoria && pratica ? '<i class="mi-marca mi-marca--teoria" title="Aulas teóricas e práticas">Teoria e prática</i>' : ''
    ].join('');
}

// A qualificação que vale ao concluir o período (Etec)
function qualificacaoDe(dados, s) {
    return dados.qualificacoes.find((q) => Number(q.ate) === s);
}

function htmlQualificacao(dados, s) {
    const q = qualificacaoDe(dados, s);
    if (!q) return '';
    if (!q.tipo) return `<div class="mi-quali mi-quali--sem">${escapar(q.nome)}</div>`;
    return `<div class="mi-quali">
        ${ICONE_CAPELO}<span><small>Ao concluir ${escapar(dados.periodo.fim(s))}: ${escapar(q.tipo.toLowerCase())} de</small>${escapar(q.nome)}</span></div>`;
}

function htmlDaMatriz(dados, curso, matrizes) {
    const minutos = dados.minutos || 0;
    // horas: as que o PDF declara (SIGA) ou a conta pela duração da aula
    const horas = Number(dados.horasDoPdf) || Math.round(dados.aulasDoCurso * minutos / 60);
    const extensao = dados.disciplinas.reduce((s, d) => s + d.extensao, 0);
    const estagio = dados.complementares.find((c) => /est[aá]gio/i.test(c.nome));
    const tg = dados.complementares.find((c) => /trabalho de (gradua|conclus)/i.test(c.nome) && c !== estagio);
    const outras = dados.complementares.filter((c) => c !== estagio && c !== tg);
    const totalDaBarra = dados.disciplinas.reduce((s, d) => s + d.aulas, 0) || 1;
    const nomeDoTrabalho = tg && /conclus/i.test(tg.nome) ? 'conclusão de curso' : 'graduação';
    const barra = dados.eixos.map((e) => {
        const aulas = dados.disciplinas.filter((d) => d.eixo === e.id).reduce((s, d) => s + d.aulas, 0);
        const pct = Math.round(aulas / totalDaBarra * 100);
        return `<i style="flex:${aulas};background:${e.cor}" title="${escapar(e.nome)}: ${pct}%"><span>${pct >= 9 ? `${pct}%` : ''}</span></i>`;
    }).join('');
    const colunas = dados.semestres.map((s) => {
        const lista = dados.disciplinas.filter((d) => d.semestre === s);
        const temEnfase = lista.some((d) => d.enfase);
        return `
            <div class="mi-coluna">
                <div class="mi-coluna-topo"><b>${dados.periodo.rotulo(s)}</b><span>${temEnfase ? 'por ênfase' : `${milhar(lista.reduce((t, d) => t + d.aulas, 0))} aulas`}</span></div>
                ${lista.map((d) => `
                <button type="button" class="mi-disc${d.grupo ? ' mi-disc--grupo' : ''}" data-id="${d.id}" style="${corDoEixo(dados, d.eixo)}">
                    <span class="mi-disc-nome">${escapar(d.nome)}</span>
                    ${d.grupo ? `<span class="mi-enfase">${d.materias.length} matérias</span>` : ''}
                    ${d.enfase ? `<span class="mi-enfase">Ênfase: ${escapar(d.enfase)}</span>` : ''}
                    <span class="mi-disc-meta"><span>${marcas(d)}</span><span>${milhar(d.aulas)} aulas</span></span>
                </button>`).join('')}
                ${htmlQualificacao(dados, s)}
            </div>`;
    }).join('');
    const fora = [
        estagio ? `<div><b>Estágio supervisionado</b><span>${milhar(estagio.horas)} horas, fora das aulas</span></div>` : '',
        dados.semEstagio ? '<div><b>Estágio supervisionado</b><span>Este curso não exige estágio</span></div>' : '',
        tg ? `<div><b>Trabalho de ${nomeDoTrabalho}</b><span>${milhar(tg.horas)} horas</span></div>` : '',
        ...outras.map((c) => `<div><b>${escapar(c.nome)}</b><span>${milhar(c.horas)} horas</span></div>`),
        extensao ? `<div><b>Atividades de extensão</b><span>${minutos ? `${milhar(Math.round(extensao * minutos / 60))} horas` : `${milhar(extensao)} aulas`}, nas disciplinas marcadas com <i class="mi-marca mi-marca--extensao">Extensão</i></span></div>` : '',
        dados.optativas.length ? `<div class="mi-optativas"><b>Optativas</b><span>${dados.optativas.map((o) => escapar(o.nome)).join(' · ')}</span></div>` : ''
    ].filter(Boolean).join('');
    const ehEtec = dados.periodo.etec;

    return `
        <section class="curso-cartao mi" id="matriz-curricular" aria-labelledby="mi-titulo" style="--semestres:${dados.semestres.length}">
            <header class="mi-topo">
                <div>
                    <h2 id="mi-titulo">${ICONE_GRADE} Matriz curricular</h2>
                    <p class="mi-sub">${escapar(ehEtec ? (dados.titulo || 'Habilitação Profissional de Técnico') : 'Curso Superior de Tecnologia')}${minutos ? ` · aulas de ${minutos} minutos` : ''}</p>
                </div>
                ${curso.planoCursoUrl ? `<a class="mi-botao" href="${escapar(curso.planoCursoUrl)}" target="_blank" rel="noopener">${ICONE_PDF} Plano de curso (PDF)</a>` : ''}
            </header>

            ${matrizes.length > 1 ? `
            <div class="mi-abas" role="tablist" aria-label="Forma de oferta">
                ${matrizes.map((m, i) => `<button type="button" role="tab" class="mi-aba" data-aba="${i}" aria-selected="${i === estado.aba}">${escapar(m.rotulo || `Matriz ${i + 1}`)}</button>`).join('')}
            </div>` : ''}

            <div class="mi-numeros">
                <div><b>${milhar(dados.aulasDoCurso)}</b><span>aulas${horas ? ` (${milhar(horas)} h)` : ''}</span></div>
                <div><b>${dados.tecnicas}</b><span>${dados.temBase ? 'disciplinas técnicas' : (dados.tecnicas === 1 ? 'disciplina' : 'disciplinas')}</span></div>
                <div><b>${dados.semestres.length}</b><span>${dados.semestres.length === 1 ? dados.periodo.nome : dados.periodo.plural}</span></div>
                ${dados.partePratica != null ? `<div><b>${dados.partePratica}%</b><span>de aulas práticas${dados.temBase ? ' (técnicas)' : ''}</span></div>` : ''}
                ${estagio ? `<div><b>${milhar(estagio.horas)} h</b><span>de estágio</span></div>` : ''}
                ${tg ? `<div><b>${milhar(tg.horas)} h</b><span>de trabalho de ${nomeDoTrabalho}</span></div>` : ''}
            </div>

            <div class="mi-eixos">
                <div class="mi-eixos-topo"><h3>Carga por eixo</h3><span>quanto do curso é de cada área</span></div>
                <div class="mi-barra">${barra}</div>
            </div>

            <div class="mi-ferramentas">
                <div class="mi-chips" role="group" aria-label="Filtrar por eixo">
                    ${dados.eixos.map((e) => `
                    <button type="button" class="mi-chip" data-eixo="${e.id}" aria-pressed="true">
                        <span class="mi-ponto" style="background:${e.cor}"></span>${escapar(e.nome)}
                        <span class="mi-chip-n">${e.id === 'medio' ? new Set(dados.disciplinas.flatMap((d) => (d.materias || []).map((m) => m.nome))).size : dados.disciplinas.filter((d) => d.eixo === e.id).length}</span>
                    </button>`).join('')}
                </div>
                <label class="mi-busca">${ICONE_BUSCA}<input type="search" placeholder="Buscar disciplina…" aria-label="Buscar disciplina" value="${escapar(estado.busca)}"></label>
            </div>
            <p class="mi-dica">Toque numa disciplina para ver o que se estuda nela.</p>

            <div class="mi-rolagem"><div class="mi-grade">${colunas}</div></div>

            ${fora ? `<div class="mi-fora">${fora}</div>` : ''}
            <p class="curso-nota">${ehEtec
                ? `${escapar(dados.origem || 'Matriz homologada da Etec')}. A grade pode mudar um pouco de uma Etec para outra; confirme na escola onde você pretende estudar.`
                : 'Grade do plano de curso oficial da Fatec; pode mudar um pouco de uma unidade para outra, então confirme na Fatec onde você pretende estudar.'}
                A ligação entre disciplinas (I, II, III) segue o nome delas.</p>
        </section>`;
}

export function htmlMatrizInterativa(curso) {
    const matrizes = matrizesInterativas(curso);
    const chave = `${curso.id || curso.nome}|${matrizes.map((m) => (m.disciplinas || []).length).join(',')}`;
    if (estado.chave !== chave) Object.assign(estado, { chave, aba: 0, ativos: null, busca: '', aberta: null, hover: null });
    estado.curso = curso;
    estado.aba = Math.min(estado.aba, matrizes.length - 1);
    estado.dados = prepararMatriz(matrizes[estado.aba]);
    if (!estado.ativos) estado.ativos = new Set(estado.dados.eixos.map((e) => e.id));
    return `
        <div class="mi-bloco" data-matriz-interativa>${htmlDaMatriz(estado.dados, curso, matrizes)}</div>
        <div class="mi-fundo" data-fechar-mi></div>
        <aside class="mi-gaveta" role="dialog" aria-modal="true" aria-hidden="true" aria-labelledby="mi-gaveta-titulo">
            <button type="button" class="mi-fechar" data-fechar-mi aria-label="Fechar">×</button>
            <div class="mi-gaveta-corpo"></div>
        </aside>`;
}

function htmlGaveta(dados, d) {
    const eixo = dados.eixos.find((e) => e.id === d.eixo);
    const rotulo = dados.periodo.rotulo(d.semestre);
    if (d.grupo) {
        return `
            <span class="mi-tag" style="--c:${eixo.cor};--cb:${eixo.fundo}">● ${escapar(eixo.nome)}</span>
            <h3 id="mi-gaveta-titulo">Ensino médio · ${escapar(rotulo)}</h3>
            <div class="mi-kv">
                <div><span>Carga</span><b>${milhar(d.aulas)} aulas</b></div>
                <div><span>Matérias</span><b>${d.materias.length}</b></div>
            </div>
            <h4>Matérias da base comum</h4>
            <ul class="mi-materias">${d.materias.map((m) => `<li><span>${escapar(m.nome)}</span><b>${milhar(m.aulas)} aulas</b></li>`).join('')}</ul>`;
    }
    const lista = (ids) => (ids.length
        ? `<div class="mi-ligadas">${ids.map((id) => `<button type="button" data-ir="${id}" style="${corDoEixo(dados, dados.porId[id].eixo)}">${escapar(dados.porId[id].nome)} <small>${escapar(dados.periodo.rotulo(dados.porId[id].semestre))}</small></button>`).join('')}</div>`
        : '<p class="mi-nada">Nenhuma</p>');
    const teoria = Number(d.teoria) || 0;
    const pratica = Number(d.pratica) || 0;
    const q = qualificacaoDe(dados, d.semestre);
    return `
        <span class="mi-tag" style="--c:${eixo.cor};--cb:${eixo.fundo}">● ${escapar(eixo.nome)}</span>
        <h3 id="mi-gaveta-titulo">${escapar(d.nome)}</h3>
        ${d.sigla ? `<span class="mi-sigla">${escapar(d.sigla)}</span>` : ''}
        <div class="mi-kv">
            <div><span>${escapar(dados.periodo.nome.charAt(0).toUpperCase() + dados.periodo.nome.slice(1))}</span><b>${escapar(dados.periodo.numero(d.semestre))}</b></div>
            <div><span>Carga</span><b>${milhar(d.aulas)} aulas</b></div>
            ${teoria || pratica
                ? `<div><span>Teoria · prática</span><b>${milhar(teoria)} · ${milhar(pratica)}</b></div>`
                : `<div><span>Modalidade</span><b>${d.online ? 'On-line' : 'Presencial'}</b></div>`}
            <div><span>Aulas por semana</span><b>${Math.max(1, Math.round(d.aulas / dados.periodo.semanas))}</b></div>
        </div>
        ${q && q.tipo ? `<p class="mi-aviso-quali">${ICONE_CAPELO}<span>Ao concluir ${escapar(dados.periodo.fim(d.semestre))}, a pessoa recebe a ${escapar(q.tipo.toLowerCase())} de <b>${escapar(q.nome)}</b>.</span></p>` : ''}
        ${d.enfase ? `<p class="mi-aviso-ext">Só para quem escolhe a ênfase ${escapar(d.enfase)}.</p>` : ''}
        ${d.extensao ? `<p class="mi-aviso-ext">Inclui ${d.extensao} aulas de atividade de extensão.</p>` : ''}
        ${d.ementa ? `<h4>O que se estuda</h4><p>${escapar(d.ementa)}</p>` : ''}
        ${d.objetivo ? `<h4>Objetivo</h4><p>${escapar(d.objetivo)}</p>` : ''}
        ${!d.ementa && !d.objetivo && estado.curso?.planoCursoUrl ? '<p class="mi-nada">A descrição desta disciplina está no plano de curso (PDF).</p>' : ''}
        <h4>Vem antes</h4>${lista(d.antes)}
        <h4>Continua em</h4>${lista(d.depois)}`;
}

// Liga filtro, busca e destaques às classes dos cartões
function pintar(raiz) {
    const secao = raiz.querySelector('.mi');
    const dados = estado.dados;
    if (!secao || !dados) return;
    const termo = semAcento(estado.busca.trim());
    const foco = dados.porId[estado.aberta || estado.hover];
    const bate = (d) => !termo || semAcento(d.nome).includes(termo) || (d.materias || []).some((m) => semAcento(m.nome).includes(termo));
    secao.querySelectorAll('.mi-chip').forEach((chip) => {
        const ligado = estado.ativos.has(chip.dataset.eixo);
        chip.classList.toggle('mi-chip--desligado', !ligado);
        chip.setAttribute('aria-pressed', String(ligado));
    });
    secao.querySelectorAll('.mi-disc').forEach((cartao) => {
        const d = dados.porId[cartao.dataset.id];
        cartao.classList.remove('mi-apagada', 'mi-escolhida', 'mi-antes', 'mi-depois');
        if (foco) {
            if (d.id === foco.id) cartao.classList.add('mi-escolhida');
            else if (foco.antes.includes(d.id)) cartao.classList.add('mi-antes');
            else if (foco.depois.includes(d.id)) cartao.classList.add('mi-depois');
            else cartao.classList.add('mi-apagada');
            return;
        }
        if (!estado.ativos.has(d.eixo) || !bate(d)) cartao.classList.add('mi-apagada');
    });
}

function abrir(raiz, id, { animar = true } = {}) {
    const gaveta = raiz.querySelector('.mi-gaveta');
    const d = estado.dados?.porId[id];
    if (!gaveta || !d) return;
    estado.aberta = id;
    gaveta.querySelector('.mi-gaveta-corpo').innerHTML = htmlGaveta(estado.dados, d);
    gaveta.scrollTop = 0;
    if (!animar) gaveta.classList.add('mi-sem-animacao');
    gaveta.classList.add('mi-aberta');
    raiz.querySelector('.mi-fundo').classList.add('mi-aberta');
    gaveta.setAttribute('aria-hidden', 'false');
    if (animar) gaveta.querySelector('.mi-fechar').focus({ preventScroll: true });
    else requestAnimationFrame(() => gaveta.classList.remove('mi-sem-animacao'));
    pintar(raiz);
}

function fechar(raiz) {
    const gaveta = raiz.querySelector('.mi-gaveta');
    const id = estado.aberta;
    estado.aberta = null;
    if (!gaveta) return;
    gaveta.classList.remove('mi-aberta');
    raiz.querySelector('.mi-fundo').classList.remove('mi-aberta');
    gaveta.setAttribute('aria-hidden', 'true');
    pintar(raiz);
    raiz.querySelector(`.mi-disc[data-id="${id}"]`)?.focus({ preventScroll: true });
}

// Troca de aba (técnico x M-Tec): redesenha só a matriz
function trocarAba(raiz, aba) {
    const matrizes = matrizesInterativas(estado.curso);
    if (!matrizes[aba] || aba === estado.aba) return;
    if (estado.aberta) fechar(raiz);
    Object.assign(estado, { aba, ativos: null, hover: null });
    estado.dados = prepararMatriz(matrizes[aba]);
    estado.ativos = new Set(estado.dados.eixos.map((e) => e.id));
    raiz.querySelector('[data-matriz-interativa]').innerHTML = htmlDaMatriz(estado.dados, estado.curso, matrizes);
    pintar(raiz);
    raiz.querySelector(`.mi-aba[data-aba="${aba}"]`)?.focus();
}

// Depois de cada redesenho: aplica o filtro e reabre a disciplina que estava aberta
export function aplicarEstadoDaMatriz(raiz) {
    if (!raiz.querySelector('.mi')) return;
    pintar(raiz);
    if (estado.aberta) abrir(raiz, estado.aberta, { animar: false });
}

// Eventos por delegação, ligados uma vez só no container da página
export function ligarMatrizInterativa(raiz) {
    raiz.addEventListener('click', (evento) => {
        if (!estado.dados) return;
        const aba = evento.target.closest('.mi-aba');
        if (aba) { trocarAba(raiz, Number(aba.dataset.aba)); return; }
        const chip = evento.target.closest('.mi-chip');
        if (chip) {
            const id = chip.dataset.eixo;
            const todos = estado.dados.eixos.map((e) => e.id);
            // o 1º clique isola um eixo; depois, cada clique liga ou desliga
            if (estado.ativos.size === todos.length) estado.ativos = new Set([id]);
            else if (estado.ativos.has(id)) {
                estado.ativos.delete(id);
                if (!estado.ativos.size) estado.ativos = new Set(todos);
            } else estado.ativos.add(id);
            pintar(raiz);
            return;
        }
        const ligada = evento.target.closest('[data-ir]');
        if (ligada) { abrir(raiz, ligada.dataset.ir); return; }
        const cartao = evento.target.closest('.mi-disc');
        if (cartao) { abrir(raiz, cartao.dataset.id); return; }
        if (evento.target.closest('[data-fechar-mi]')) fechar(raiz);
    });
    raiz.addEventListener('input', (evento) => {
        if (!evento.target.matches('.mi-busca input')) return;
        estado.busca = evento.target.value;
        pintar(raiz);
    });
    // passar o mouse (ou o foco do teclado) mostra a sequência I → II → III
    const destacar = (evento) => {
        if (!estado.dados || estado.aberta) return;
        const cartao = evento.target.closest('.mi-disc');
        const novo = cartao ? cartao.dataset.id : (evento.target.closest('.mi-grade') ? estado.hover : null);
        if (novo === estado.hover) return;
        estado.hover = novo;
        pintar(raiz);
    };
    raiz.addEventListener('mouseover', destacar);
    raiz.addEventListener('focusin', destacar);
    raiz.addEventListener('mouseleave', () => {
        if (!estado.hover || estado.aberta) return;
        estado.hover = null;
        pintar(raiz);
    });
    document.addEventListener('keydown', (evento) => {
        if (evento.key === 'Escape' && estado.aberta) fechar(raiz);
    });
}
