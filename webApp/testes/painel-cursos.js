// Monta o painel Admin · Cursos com login, Firestore e funções simulados.
// Uso, a partir de http://localhost:5173/404.html:
//
//     await import('/testes/painel-cursos.js');
//
// O catálogo simulado vem de /dados/catalogo-cursos.json, com diferenças
// plantadas de propósito para a prévia do CSV ter o que mostrar:
//   - 3 cursos ausentes (viram "cursos novos")
//   - Química sem duração e sem eixo (viram "campos vazios")
//   - Administração com duração e descrição editadas à mão
//   - Desenvolvimento de Sistemas com carga horária diferente
import {
    carregarComSimulacoes, enviarArquivo, fingirLogin, imagemDeTeste, iniciarTeste,
    montarPagina, pdfDaMatrizDeExemplo, simularFuncoes
} from './base.js';

const teste = iniciarTeste();
await montarPagina('/admin-cursos.html', 'admin-cursos.js');

const catalogo = await (await fetch('/dados/catalogo-cursos.json')).json();
const cursos = new Map(catalogo.map((curso) => {
    const dados = { ...curso };
    delete dados.slug;
    return [curso.slug, dados];
}));
['zootecnia', 'vestuario', 'turismo-receptivo'].forEach((id) => cursos.delete(id));
Object.assign(cursos.get('administracao'), {
    duracao: '4 semestres', descricao: 'Texto que eu escrevi à mão no painel.',
    camposEditados: ['duracao', 'descricao'], atualizadoPor: 'admin@teste', editadoManualmente: true
});
cursos.get('desenvolvimento-de-sistemas').cargaHoraria = 1000;
Object.assign(cursos.get('quimica'), { duracao: '', eixos: [] });

teste.colecoes.cursos = cursos;
teste.colecoes.instituicoes = new Map([
    ['i1', { cursos: [{ nome: 'Administração' }, { nome: 'Química' }] }],
    ['i2', { cursos: [{ nome: 'Administração' }] }]
]);
teste.catalogo = catalogo;

// ---- funções do servidor ----
const demandaColetada = {};
simularFuncoes({
    coletar_demanda: (corpo) => {
        if (corpo.acao === 'situacao') {
            return {
                disponiveis: {
                    etec: ['20262', '20261', '20251', '20242', '20241', '20231', '20221', '20211'],
                    fatec: ['20262', '20261', '20252', '20251', '20241', '20231', '20221']
                },
                coletados: demandaColetada
            };
        }
        // um semestre que falha, para ver a mensagem de erro parcial
        if (corpo.site === 'fatec' && corpo.semestre === '20231') {
            return { erro: 'O site não devolveu nenhuma unidade para esse semestre.', status: 502 };
        }

        const periodo = `${corpo.semestre.slice(0, 4)}-${corpo.semestre[4]}`;
        let atualizados = 0;
        if (corpo.site === 'etec') {
            cursos.forEach((curso, id) => {
                if (curso.nivel === 'superior' || id.length % 3 === 0) return;
                const vagas = 400 + id.length * 37;
                const historico = (curso.demanda?.historico || []).filter((h) => h.periodo !== periodo);
                historico.push({
                    periodo,
                    inscritos: Math.round(vagas * (0.8 + (id.length % 7) * 0.6 + Number(corpo.semestre.slice(2, 4)) * 0.02)),
                    vagas,
                    unidades: 3 + (id.length % 20)
                });
                historico.sort((a, b) => a.periodo.localeCompare(b.periodo));
                curso.demanda = { historico };
                atualizados += 1;
            });
        }
        (demandaColetada[corpo.site] ||= {})[corpo.semestre] = {
            coletadoEm: new Date().toISOString(), cursos: atualizados, unidades: 410, semPar: []
        };
        return {
            site: corpo.site, semestre: corpo.semestre, cursos: atualizados, unidades: 410, falhas: [],
            semPar: corpo.site === 'etec'
                ? [{ curso: 'ENSINO MÉDIO COM ITINERÁRIO FORMATIVO DE LINGUAGENS E SUAS TECNOLOGIAS', inscritos: 1487, vagas: 435, unidades: 11 }]
                : []
        };
    },
    enviar_capa: (corpo) => {
        // um eixo que sempre falha, para ver a mensagem de erro
        if (corpo.id === 'seguranca') return { erro: 'A imagem passa de 4 MB.', status: 413 };
        if (corpo.acao === 'remover') return { removida: true };
        return { url: `data:${corpo.tipo};base64,${corpo.imagem}` };
    }
});

await fingirLogin();
window.confirm = () => true;
await carregarComSimulacoes('/assets/js/admin-cursos.js');

// ---- ferramentas ----

// CSV montado a partir do catálogo, no formato que o site do CPS exporta.
teste.enviarCsv = async () => {
    const aspas = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const linhas = ['"Curso";"Tipo";"Eixo Tecnológico";"Carga Horária";"Duração/Semestre";"Descrição";"Área de Atuação";"Onde Trabalhar";"Pré-Requisitos"'];
    catalogo.forEach((c) => linhas.push([
        c.nome, (c.modalidades || []).join(' ● '), (c.eixos || []).join(' ● '),
        c.cargaHoraria ? `${c.cargaHoraria} horas` : '', c.duracao, c.descricao, c.atuacao, c.ondeTrabalhar, c.preRequisitos
    ].map(aspas).join(';')));
    await enviarArquivo('input-csv-cursos', new File([linhas.join('\r\n')], 'cursos-etec.csv', { type: 'text/csv' }));
};

// Abre o formulário de um curso e envia a matriz de exemplo.
teste.enviarMatriz = async (idDoCurso = 'desenvolvimento-de-sistemas') => {
    document.querySelector(`button[data-acao="editar"][data-id="${idDoCurso}"]`).click();
    await new Promise((r) => setTimeout(r, 300));
    await enviarArquivo('input-matriz-pdf', await pdfDaMatrizDeExemplo(), 5000);
};

// Envia uma imagem de capa para um eixo (slug, ex.: "gestao-e-negocios").
teste.enviarCapaDoEixo = async (slug, largura = 1600, altura = 500) => {
    document.querySelector(`[data-enviar-capa="${slug}"]`).click();
    await enviarArquivo('input-capa-eixo', await imagemDeTeste(largura, altura), 1500);
};

teste.enviarArquivo = enviarArquivo;
teste.imagemDeTeste = imagemDeTeste;
teste.texto = (seletor) => document.querySelector(seletor)?.innerText.replace(/\s+/g, ' ') ?? null;
