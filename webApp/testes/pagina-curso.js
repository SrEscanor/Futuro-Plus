// Preenche a página de um curso com demanda, matriz e unidades de exemplo,
// que no computador de quem desenvolve não existem (vêm do Firestore).
// Uso, a partir de http://localhost:5173/curso.html?c=desenvolvimento-de-sistemas:
//
//     await import('/testes/pagina-curso.js');
//
// Depois, window.teste.mostrar({ ... }) redesenha a página com variações:
//     teste.mostrar({ anos: 1 })                 // um ano só: número em destaque, sem gráfico
//     teste.mostrar({ matrizes: 2 })             // duas matrizes: aparecem as abas
//     teste.mostrar({ demanda: false })          // sem demanda: o cartão some
//     teste.mostrar({ fotoDoEixo: true })        // capa enviada para o eixo
//     teste.mostrar({ imagemUrl: 'https://…' })  // capa só do curso
import { imagemDeTeste, pdfDaMatrizDeExemplo } from './base.js';

const teste = window.teste = { colecoes: {}, gravacoes: [], chamadas: [] };

// A página já carregou o módulo dela; é preciso falar com a mesma cópia (o
// Vite pode ter posto um "?t=..." no endereço), senão os cliques não acham
// os dados daqui.
const endereco = performance.getEntriesByType('resource').map((r) => r.name)
    .find((nome) => nome.includes('/assets/js/curso-detalhe.js'));
if (!endereco) throw new Error('abra /curso.html?c=<id do curso> antes de carregar este teste');
const pagina = await import(endereco);
const matrizes = await import('/assets/js/matriz-curricular.js');
const capas = await import('/assets/js/capas-eixos.js');

const id = new URLSearchParams(location.search).get('c') || 'desenvolvimento-de-sistemas';
const catalogo = await (await fetch('/dados/catalogo-cursos.json')).json();
const curso = catalogo.find((c) => c.slug === id);
if (!curso) throw new Error(`o curso "${id}" não está em /dados/catalogo-cursos.json`);

const { matriz } = await matrizes.lerMatrizDoPdf(await pdfDaMatrizDeExemplo());
matriz.destaques = matrizes.destaquesDaMatriz(matriz);
const modular = {
    ...structuredClone(matriz),
    titulo: 'Habilitação Profissional de Técnico (Modular - Noturno)',
    tipoEtapa: 'módulo',
    cargaHoraria: 1200,
    destaques: ['Programação Web', 'Banco de Dados']
};
modular.componentes = modular.componentes.filter((c) => c.grupo === 'tecnica');

const HISTORICO = [
    { periodo: '2022-1', inscritos: 30110, vagas: 7900, unidades: 140 },
    { periodo: '2023-1', inscritos: 33540, vagas: 8100, unidades: 146 },
    { periodo: '2024-1', inscritos: 36120, vagas: 8300, unidades: 150 },
    { periodo: '2024-2', inscritos: 9000, vagas: 3000, unidades: 60 },
    { periodo: '2025-1', inscritos: 38950, vagas: 8480, unidades: 153 },
    { periodo: '2026-1', inscritos: 40873, vagas: 8555, unidades: 155 }
];

const UNIDADES = ['Etec Polivalente de Americana|Americana', 'Etec Jorge Street|São Caetano do Sul',
    'Etec Fernando Prestes|Sorocaba', 'Etec Dr. Adail Nunes da Silva|Taquaritinga',
    'Etec Prof. Alcídio de Souza Prado|Orlândia', 'Etec Prof. Alfredo de Barros Santos|Guaratinguetá',
    'Etec Amim Jundi|Osvaldo Cruz', 'Etec Sebrae|São Paulo', 'Etec Albert Einstein|São Paulo',
    'Etec Parque da Juventude|São Paulo', 'Etec de Artes|São Paulo']
    .map((texto, i) => ({ id: `u${i}`, nome: texto.split('|')[0], municipio: texto.split('|')[1] }));

teste.mostrar = async (opcoes = {}) => {
    const { anos = 5, demanda = true, matrizes: quantas = 1, unidades = UNIDADES.length, fotoDoEixo = false, imagemUrl = '' } = opcoes;
    const exemplo = { ...curso, imagemUrl };

    if (demanda) {
        const primeiros = HISTORICO.filter((h) => h.periodo.endsWith('-1')).slice(-anos);
        exemplo.demanda = { historico: [...primeiros, ...HISTORICO.filter((h) => h.periodo.endsWith('-2'))] };
    }
    exemplo.matrizes = [matriz, modular].slice(0, quantas);

    // capa enviada para o eixo: a página lê de configuracoes/capas, então o
    // jeito de simular é entregar a imagem do curso com o mesmo efeito visual
    if (fotoDoEixo && !imagemUrl) {
        const arquivo = await imagemDeTeste(1600, 500, capas.capaDoEixo((curso.eixos || [])[0]).cores[1]);
        exemplo.imagemUrl = URL.createObjectURL(arquivo);
    }

    pagina.renderizar(exemplo, UNIDADES.slice(0, unidades), null);
    teste.curso = exemplo;
};

teste.texto = (seletor) => document.querySelector(seletor)?.innerText.replace(/\s+/g, ' ') ?? null;
await teste.mostrar();
