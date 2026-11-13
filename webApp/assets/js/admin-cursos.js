import { auth, db } from './firebase-config.js';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, doc, getDoc, getDocs, setDoc, writeBatch } from 'firebase/firestore';
import { parseCsvLine } from './csv.js';
import {
    escritasDoPlano, ligarZonaDeArquivo, planejarImportacao, revisarImportacao, valorVazio
} from './importacao-csv.js';
import { lerMatrizDoPdf, destaquesDaMatriz, duracaoDaMatriz } from './matriz-curricular.js';
import { resumoDaDemanda } from './demanda-curso.js';
import { capaDoEixo, carregarFotosDosEixos } from './capas-eixos.js';
import { enviarCapa, removerCapaDoEixo } from './enviar-capa.js';

const CURSOS_COLLECTION = 'cursos';
const INSTITUICOES_COLLECTION = 'instituicoes';

// Campos que a página pública usa; servem para dizer se um curso está completo.
// O CSV da Fatec (cursos superiores) não publica carga horária, só duração
// em anos/semestres — cobrar esse campo neles marcaria todo curso superior
// como incompleto para sempre.
const CAMPOS_ESPERADOS = [
    ['descricao', 'descrição'],
    ['duracao', 'duração'],
    ['cargaHoraria', 'carga horária']
];

// Campos que o painel grava mas que não vêm do catálogo oficial: mexer neles
// não é "corrigir o catálogo à mão", então não entram na lista de editados.
const CAMPOS_FORA_DO_CATALOGO = ['atualizadoEm', 'matrizes', 'imagemUrl'];

function camposEsperadosPara(curso) {
    return curso.nivel === 'superior'
        ? CAMPOS_ESPERADOS.filter(([campo]) => campo !== 'cargaHoraria')
        : CAMPOS_ESPERADOS;
}

let cursosCache = [];
let unidadesPorCurso = new Map();
let editandoId = null;
let matrizesEmEdicao = [];
let filtroIncompletos = false;
let filtroEditados = false;
let filtroSemMatriz = false;
// imagens já enviadas para cada eixo: { slug: endereço }
let fotosDosEixos = {};

function escapeHtml(str) {
    return String(str ?? '').replace(/[&<>"']/g, (c) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
}

function normalizar(texto) {
    return (texto || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9]+/g, ' ')
        .trim();
}

// As mensagens de erro do servidor já vêm com ponto; aqui elas entram no meio
// de uma frase.
function semPontoFinal(texto) {
    return String(texto ?? '').replace(/\.+$/, '');
}

function faltando(curso) {
    return camposEsperadosPara(curso).filter(([campo]) => !curso[campo]).map(([, rotulo]) => rotulo);
}

function mostrarStatus(id, texto, tipo = '') {
    const status = document.getElementById(id);
    status.textContent = texto;
    status.className = `status-importacao${tipo ? ` status-importacao--${tipo}` : ''}`;
    status.style.display = texto ? 'block' : 'none';
}

// ========================================================
// Carregamento
// ========================================================

async function carregarCursos() {
    const [cursosSnap, unidadesSnap] = await Promise.all([
        getDocs(collection(db, CURSOS_COLLECTION)),
        getDocs(collection(db, INSTITUICOES_COLLECTION))
    ]);

    cursosCache = cursosSnap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (a.nome || '').localeCompare(b.nome || '', 'pt-BR'));

    unidadesPorCurso = new Map();
    unidadesSnap.docs.forEach((d) => {
        (d.data().cursos || []).forEach((c) => {
            if (!c?.nome) return;
            const chave = normalizar(c.nome);
            unidadesPorCurso.set(chave, (unidadesPorCurso.get(chave) || 0) + 1);
        });
    });

    renderizarTabela();
}

// ========================================================
// Tabela
// ========================================================

function renderizarAlerta() {
    const incompletos = cursosCache.filter((c) => faltando(c).length);
    const alerta = document.getElementById('alerta-incompletos');

    if (!incompletos.length) {
        alerta.style.display = 'none';
        filtroIncompletos = false;
        return;
    }

    alerta.style.display = 'flex';
    const semDuracao = cursosCache.filter((c) => !c.duracao).length;
    document.getElementById('alerta-incompletos-texto').innerHTML = `
        <strong>⚠️ ${incompletos.length} curso(s) com informação faltando</strong>
        <p>O catálogo oficial não publica tudo: ${semDuracao} curso(s) estão sem duração.
        Complete aqui o que você confirmar na unidade ou no plano de curso.</p>`;

    document.getElementById('btn-filtrar-incompletos').textContent =
        filtroIncompletos ? 'Mostrar todos' : 'Mostrar só esses';
}

function renderizarSituacaoDasMatrizes() {
    const comMatriz = cursosCache.filter((c) => (c.matrizes || []).length).length;
    document.getElementById('matriz-situacao').innerHTML = cursosCache.length
        ? `<div><strong>${comMatriz} de ${cursosCache.length}</strong> cursos têm matriz cadastrada.</div>`
        : 'Importe o catálogo primeiro.';
}

function celulaDemanda(curso) {
    const resumo = resumoDaDemanda(curso.demanda);
    if (!resumo) return '—';
    return `<strong>${escapeHtml(resumo.porVagaTexto)}</strong> por vaga
        <div class="celula-nota">${escapeHtml(resumo.nivel.rotulo)} · ${escapeHtml(String(resumo.ano))}</div>`;
}

function renderizarTabela() {
    const filtro = normalizar(document.getElementById('busca-curso').value);
    const corpo = document.getElementById('tabela-cursos-corpo');

    renderizarAlerta();
    renderizarSituacaoDasMatrizes();
    renderizarCapasDosEixos();

    const linhas = cursosCache
        .filter((c) => !filtroIncompletos || faltando(c).length)
        .filter((c) => !filtroEditados || (c.camposEditados || []).length)
        .filter((c) => !filtroSemMatriz || !(c.matrizes || []).length)
        .filter((c) => !filtro || normalizar([
            c.nome, (c.eixos || []).join(' '), (c.modalidades || []).join(' ')
        ].join(' ')).includes(filtro));

    if (!linhas.length) {
        corpo.innerHTML = `<tr><td colspan="7" class="tabela-vazia">
            ${cursosCache.length ? 'Nenhum curso encontrado.' : 'Nenhum curso importado ainda. Envie o CSV do catálogo no primeiro quadro acima.'}
        </td></tr>`;
        return;
    }

    corpo.innerHTML = linhas.map((c) => {
        const pendencias = faltando(c);
        const unidades = unidadesPorCurso.get(normalizar(c.nome)) || 0;
        const matrizes = (c.matrizes || []).length;
        return `
        <tr>
            <td>
                ${c.nivel === 'superior' ? '<span class="badge-categoria">Superior</span>' : ''}
                <strong>${escapeHtml(c.nome)}</strong>
                ${pendencias.length ? `<div class="pendencia">falta ${escapeHtml(pendencias.join(', '))}</div>` : ''}
                ${c.provaAptidao ? '<div class="pendencia pendencia--info">tem prova de aptidão</div>' : ''}
                ${c.preRequisitos ? `<div class="pendencia pendencia--info" title="${escapeHtml(c.preRequisitos)}">exige formação anterior</div>` : ''}
                ${matrizes ? `<div class="pendencia pendencia--info">${matrizes === 1 ? 'matriz cadastrada' : `${matrizes} matrizes cadastradas`}</div>` : ''}
                ${(c.camposEditados || []).length ? `<div class="pendencia pendencia--manual" title="${escapeHtml(c.atualizadoEm ? new Date(c.atualizadoEm).toLocaleString('pt-BR') : '')}">✏️ editado à mão por ${escapeHtml(c.atualizadoPor || '—')}: ${escapeHtml(c.camposEditados.map((x) => ROTULO_CAMPO[x] || x).join(', '))}</div>` : ''}
            </td>
            <td>${escapeHtml((c.eixos || []).join(', '))}</td>
            <td>${escapeHtml(c.duracao || '—')}</td>
            <td>${c.cargaHoraria ? `${c.cargaHoraria} h` : '—'}</td>
            <td>${celulaDemanda(c)}</td>
            <td>${unidades}</td>
            <td class="col-acoes">
                <button type="button" class="btn-icone" data-acao="editar" data-id="${escapeHtml(c.id)}" title="Editar">✏️</button>
                <a class="btn-icone" href="curso.html?c=${encodeURIComponent(c.id)}" target="_blank" title="Ver a página do curso">🔍</a>
            </td>
        </tr>`;
    }).join('');
}

// ========================================================
// Importação do catálogo oficial (CSV)
// ========================================================

const ROTULO_CAMPO = {
    duracao: 'duração',
    cargaHoraria: 'carga horária',
    eixos: 'eixos',
    modalidades: 'modalidades',
    preRequisitos: 'pré-requisito',
    descricao: 'o que você aprende',
    atuacao: 'o que o profissional faz',
    ondeTrabalhar: 'onde se trabalha',
    provaAptidao: 'prova de aptidão',
    planoCursoUrl: 'plano de curso',
    nivel: 'nível',
    nome: 'nome'
};

// O que o arquivo deixa em branco (a duração de várias especializações, por
// exemplo) nunca apaga o que já estava preenchido; o resto passa pela janela
// de revisão antes de qualquer gravação.
async function gravarCatalogo(catalogo, descricaoDoArquivo) {
    const existentes = new Map(cursosCache.map((c) => [c.id, c]));
    const itens = catalogo.map((curso) => {
        const dados = { ...curso };
        delete dados.slug;
        return { id: curso.slug, nome: curso.nome, dados };
    });
    const plano = planejarImportacao(itens, existentes);

    mostrarStatus('status-importacao', 'Arquivo lido. Revise na janela o que vai mudar...');
    const manter = await revisarImportacao(plano, {
        descricao: descricaoDoArquivo,
        rotulos: ROTULO_CAMPO,
        termos: { novos: 'curso(s) novo(s)', iguais: 'curso(s) igual(is)' }
    });
    if (manter === null) {
        mostrarStatus('status-importacao', 'Importação cancelada. Nada foi alterado.');
        return;
    }

    const escritas = [...escritasDoPlano(plano, manter, existentes).entries()]
        .filter(([, dados]) => Object.keys(dados).length);
    const agora = new Date().toISOString();

    const TAMANHO_LOTE = 400;
    for (let i = 0; i < escritas.length; i += TAMANHO_LOTE) {
        const batch = writeBatch(db);
        escritas.slice(i, i + TAMANHO_LOTE).forEach(([id, dados]) => {
            batch.set(doc(db, CURSOS_COLLECTION, id), { ...dados, atualizadoEm: agora }, { merge: true });
        });
        await batch.commit();
        mostrarStatus('status-importacao', `Gravando... ${Math.min(i + TAMANHO_LOTE, escritas.length)} de ${escritas.length}`);
    }

    await carregarCursos();

    const substituidas = plano.substituir.length - manter.size;
    mostrarStatus('status-importacao',
        `Importação concluída: ${plano.novos.length} curso(s) novo(s), `
        + `${plano.preencher.length} campo(s) preenchido(s), ${substituidas} informação(ões) substituída(s)`
        + (manter.size ? ` e ${manter.size} mantida(s) como estava(m).` : '.'),
        'ok');
}

// ---- CSV exportado do site do CPS -------------------------------------
// Em cps.sp.gov.br/cursos-etec o botão "Download CSV (Excel)" baixa a mesma
// tabela que gerou o arquivo embutido: campos entre aspas, separados por
// ponto e vírgula, e listas (tipo e eixo) separadas por "●".
const COLUNAS_CSV = {
    'curso': 'nome',
    'tipo': 'modalidades',
    'eixo tecnologico': 'eixos',
    'carga horaria': 'cargaHoraria',
    'duracao/semestre': 'duracao',
    'descricao': 'descricao',
    'area de atuacao': 'atuacao',
    'onde trabalhar': 'ondeTrabalhar',
    'pre-requisitos': 'preRequisitos'
};

function chaveDaColuna(titulo) {
    return (titulo || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

// nivel: 'tecnico' (Etec, o padrão) ou 'superior' (Fatec). Vários cursos têm
// o mesmo nome nos dois catálogos ("Logística", "Marketing", "Gastronomia"…)
// mas são grades bem diferentes — por isso os superiores ganham um prefixo
// no slug, para nunca cair em cima da página de um curso técnico já existente.
function lerCatalogoCsv(texto, nivel = 'tecnico') {
    const linhas = texto.split(/\r?\n/).filter((l) => l.trim());
    if (!linhas.length) throw new Error('arquivo vazio');

    const cabecalho = parseCsvLine(linhas[0]).map(chaveDaColuna);
    if (!cabecalho.includes('curso')) {
        throw new Error('este CSV não parece ser o da listagem de cursos do CPS (não achei a coluna "Curso")');
    }

    const cursos = [];
    for (const linha of linhas.slice(1)) {
        const campos = parseCsvLine(linha);
        const curso = {};

        cabecalho.forEach((titulo, i) => {
            const campo = COLUNAS_CSV[titulo];
            if (!campo) return;
            const valor = (campos[i] || '').replace(/\s+/g, ' ').trim();

            if (campo === 'modalidades' || campo === 'eixos') {
                curso[campo] = valor.split('●').map((p) => p.trim()).filter(Boolean);
            } else if (campo === 'cargaHoraria') {
                const numero = valor.match(/\d+/);
                curso[campo] = numero ? Number(numero[0]) : null;
            } else if (campo === 'duracao') {
                curso[campo] = valor.toLowerCase();
            } else {
                // A exportação do CPS apaga as quebras de linha sem pôr espaço,
                // e frases acabam coladas ("...documentos.O aluno vai...").
                curso[campo] = valor
                    .replace(/([.;:!?])(?=[A-ZÀ-Ú])/g, '$1 ')
                    // depois de ":" também cola número ("áreas de atuação:1.");
                    // o ponto fica de fora para não quebrar "1.200"
                    .replace(/([:;!?])(?=\d)/g, '$1 ')
                    .replace(/–/g, '-');
            }
        });

        if (!curso.nome) continue;
        const base = normalizar(curso.nome).replace(/\s+/g, '-');
        if (nivel === 'superior') {
            curso.nivel = 'superior';
            curso.slug = `superior-${base}`;
        } else {
            curso.slug = base;
        }
        cursos.push(curso);
    }

    if (!cursos.length) throw new Error('não encontrei nenhum curso no arquivo');
    return cursos;
}

async function importarCsvDoCatalogo(arquivo) {
    mostrarStatus('status-importacao', `Lendo ${arquivo.name}...`);

    try {
        const nivel = document.querySelector('input[name="nivel-csv"]:checked').value;
        const cursos = lerCatalogoCsv(await arquivo.text(), nivel);
        const catalogo = nivel === 'superior' ? 'cursos superiores (Fatec)' : 'cursos técnicos (Etec)';
        await gravarCatalogo(cursos, `${arquivo.name} · ${cursos.length} ${catalogo}`);
    } catch (err) {
        console.error('Erro ao importar o CSV de cursos:', err);
        mostrarStatus('status-importacao', 'Erro ao ler o CSV: ' + err.message, 'erro');
    }
}

// ========================================================
// Matriz curricular (dentro do formulário do curso)
// ========================================================

function renderizarMatrizesDoFormulario() {
    const lista = document.getElementById('lista-matrizes');
    if (!matrizesEmEdicao.length) {
        lista.innerHTML = '<p class="lista-vazia">Nenhuma matriz cadastrada para este curso.</p>';
        return;
    }

    lista.innerHTML = matrizesEmEdicao.map((matriz, indice) => {
        const tecnicas = matriz.componentes.filter((c) => c.grupo === 'tecnica').length;
        return `
        <div class="matriz-item">
            <div class="matriz-item-topo">
                <div>
                    <strong>${escapeHtml(matriz.titulo)}</strong>
                    <span>${escapeHtml(duracaoDaMatriz(matriz))} · ${Number(matriz.cargaHoraria || 0).toLocaleString('pt-BR')} horas
                        · ${tecnicas} disciplina(s) técnica(s)</span>
                </div>
                <button type="button" class="btn-remover" data-remover-matriz="${indice}">Remover</button>
            </div>
            <label for="matriz-destaques-${indice}">Etiquetas na página do curso (separe por vírgula)</label>
            <input type="text" id="matriz-destaques-${indice}" data-destaques="${indice}"
                value="${escapeHtml((matriz.destaques || []).join(', '))}">
        </div>`;
    }).join('');
}

// As etiquetas são editáveis: o que está digitado vale mais que o cálculo.
function lerDestaquesDigitados() {
    document.querySelectorAll('#lista-matrizes [data-destaques]').forEach((campo) => {
        const matriz = matrizesEmEdicao[Number(campo.dataset.destaques)];
        if (matriz) matriz.destaques = campo.value.split(',').map((d) => d.trim()).filter(Boolean);
    });
}

async function receberPdfDaMatriz(arquivo) {
    mostrarStatus('status-matriz', `Lendo ${arquivo.name}...`);
    try {
        const { matriz, texto } = await lerMatrizDoPdf(arquivo);
        matriz.destaques = destaquesDaMatriz(matriz);

        lerDestaquesDigitados();
        const existente = matrizesEmEdicao.findIndex((m) => m.titulo === matriz.titulo);
        if (existente >= 0) matrizesEmEdicao[existente] = matriz;
        else matrizesEmEdicao.push(matriz);
        renderizarMatrizesDoFormulario();

        const curso = cursosCache.find((c) => c.id === editandoId);
        const citaOCurso = curso && normalizar(texto).includes(normalizar(curso.nome));
        const tecnicas = matriz.componentes.filter((c) => c.grupo === 'tecnica').length;
        mostrarStatus('status-matriz',
            `${existente >= 0 ? 'Matriz substituída' : 'Matriz lida'}: ${tecnicas} disciplina(s) técnica(s), `
            + `${duracaoDaMatriz(matriz)}, ${Number(matriz.cargaHoraria).toLocaleString('pt-BR')} horas.`
            + (citaOCurso ? '' : ` Atenção: o PDF não cita "${curso?.nome || 'este curso'}" — confira se é a matriz certa.`)
            + ' Clique em "Salvar curso" para gravar.',
            citaOCurso ? 'ok' : '');
    } catch (err) {
        console.error('Erro ao ler a matriz:', err);
        mostrarStatus('status-matriz', 'Não consegui ler este PDF: ' + err.message, 'erro');
    }
}

// ========================================================
// Capas dos eixos
// ========================================================

function eixosDoCatalogo() {
    const eixos = new Set();
    cursosCache.forEach((curso) => (curso.eixos || []).forEach((eixo) => eixo && eixos.add(eixo)));
    return [...eixos].sort((a, b) => a.localeCompare(b, 'pt-BR'));
}

function renderizarCapasDosEixos() {
    const lista = document.getElementById('lista-capas');
    const eixos = eixosDoCatalogo();
    if (!eixos.length) {
        lista.innerHTML = '<p class="lista-vazia">Os eixos aparecem aqui depois que o catálogo for importado.</p>';
        return;
    }

    lista.innerHTML = eixos.map((eixo) => {
        const capa = capaDoEixo(eixo, fotosDosEixos);
        const miniatura = capa.foto
            ? `<img src="${escapeHtml(capa.foto)}" alt="" loading="lazy">`
            : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"
                    stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${capa.icone}</svg>`;
        return `
        <div class="capa-eixo" data-eixo="${escapeHtml(capa.slug)}">
            <div class="capa-eixo-miniatura${capa.foto ? '' : ' capa-eixo-miniatura--desenhada'}"
                style="--capa-escura:${capa.cores[0]};--capa-clara:${capa.cores[1]}">${miniatura}</div>
            <div class="capa-eixo-info">
                <strong>${escapeHtml(eixo)}</strong>
                <span>${capa.foto ? 'Imagem enviada' : 'Capa desenhada'}</span>
                <div class="capa-eixo-acoes">
                    <button type="button" class="btn-link" data-enviar-capa="${escapeHtml(capa.slug)}"
                        data-nome="${escapeHtml(eixo)}">${capa.foto ? 'Trocar imagem' : 'Enviar imagem'}</button>
                    ${capa.foto ? `<button type="button" class="btn-link btn-link--perigo"
                        data-remover-capa="${escapeHtml(capa.slug)}" data-nome="${escapeHtml(eixo)}">Remover</button>` : ''}
                </div>
            </div>
        </div>`;
    }).join('');
}

// eixo para o qual o seletor de arquivo foi aberto
let eixoEmEnvio = null;

async function receberCapaDoEixo(arquivo) {
    if (!eixoEmEnvio) return;
    const { slug, nome } = eixoEmEnvio;
    eixoEmEnvio = null;

    mostrarStatus('status-capas', `Enviando a capa de ${nome}...`);
    try {
        const { url, aviso } = await enviarCapa({ alvo: 'eixo', id: slug, arquivo });
        fotosDosEixos = { ...fotosDosEixos, [slug]: url };
        renderizarCapasDosEixos();
        mostrarStatus('status-capas', `Capa de ${nome} publicada: já vale para os cursos do eixo.${aviso ? ` ${aviso}` : ''}`,
            aviso ? '' : 'ok');
    } catch (err) {
        console.error('Erro ao enviar a capa do eixo:', err);
        mostrarStatus('status-capas', `Não foi possível enviar a capa de ${nome}: ${semPontoFinal(err.message)}.`, 'erro');
    }
}

async function removerCapa(slug, nome) {
    if (!confirm(`Remover a imagem de "${nome}"? Os cursos do eixo voltam a usar a capa desenhada.`)) return;

    mostrarStatus('status-capas', `Removendo a capa de ${nome}...`);
    try {
        await removerCapaDoEixo(slug);
        const { [slug]: _removida, ...restantes } = fotosDosEixos;
        fotosDosEixos = restantes;
        renderizarCapasDosEixos();
        mostrarStatus('status-capas', `Imagem de ${nome} removida. O eixo voltou para a capa desenhada.`, 'ok');
    } catch (err) {
        console.error('Erro ao remover a capa do eixo:', err);
        mostrarStatus('status-capas', `Não foi possível remover a capa de ${nome}: ${semPontoFinal(err.message)}.`, 'erro');
    }
}

// Capa de um curso só: sobe a imagem e deixa o endereço no campo; quem grava
// no curso é o "Salvar curso".
async function receberCapaDoCurso(arquivo) {
    if (!editandoId) return;
    mostrarStatus('status-capa-curso', 'Enviando a imagem...');
    try {
        const { url, aviso } = await enviarCapa({ alvo: 'curso', id: editandoId, arquivo });
        document.getElementById('f-imagem').value = url;
        mostrarStatus('status-capa-curso',
            `Imagem enviada. Clique em "Salvar curso" para ela passar a valer.${aviso ? ` ${aviso}` : ''}`,
            aviso ? '' : 'ok');
    } catch (err) {
        console.error('Erro ao enviar a capa do curso:', err);
        mostrarStatus('status-capa-curso', `Não foi possível enviar a imagem: ${semPontoFinal(err.message)}.`, 'erro');
    }
}

// ========================================================
// Formulário
// ========================================================

function abrirFormulario(curso) {
    editandoId = curso.id;
    // cópia: remover uma matriz e cancelar não pode mexer na tabela
    matrizesEmEdicao = JSON.parse(JSON.stringify(curso.matrizes || []));

    document.getElementById('form-titulo').textContent = curso.nome;
    document.getElementById('f-duracao').value = curso.duracao || '';
    document.getElementById('f-carga').value = curso.cargaHoraria || '';
    document.getElementById('f-eixos').value = (curso.eixos || []).join(', ');
    document.getElementById('f-prerequisitos').value = curso.preRequisitos || '';
    document.getElementById('f-aptidao').checked = curso.provaAptidao === true;
    document.getElementById('f-imagem').value = curso.imagemUrl || '';
    document.getElementById('f-plano-curso').value = curso.planoCursoUrl || '';
    document.getElementById('f-descricao').value = curso.descricao || '';
    document.getElementById('f-atuacao').value = curso.atuacao || '';
    document.getElementById('f-onde-trabalhar').value = curso.ondeTrabalhar || '';
    mostrarStatus('status-matriz', '');
    mostrarStatus('status-capa-curso', '');
    renderizarMatrizesDoFormulario();
    document.getElementById('modal-form').classList.add('aberto');
}

function fecharFormulario() {
    document.getElementById('modal-form').classList.remove('aberto');
    editandoId = null;
    matrizesEmEdicao = [];
}

async function salvarCurso(evento) {
    evento.preventDefault();
    if (!editandoId) return;

    lerDestaquesDigitados();
    const carga = document.getElementById('f-carga').value.trim();
    const dados = {
        duracao: document.getElementById('f-duracao').value.trim(),
        cargaHoraria: carga ? Number(carga) : null,
        eixos: document.getElementById('f-eixos').value.split(',').map((e) => e.trim()).filter(Boolean),
        preRequisitos: document.getElementById('f-prerequisitos').value.trim(),
        provaAptidao: document.getElementById('f-aptidao').checked,
        imagemUrl: document.getElementById('f-imagem').value.trim(),
        planoCursoUrl: document.getElementById('f-plano-curso').value.trim(),
        descricao: document.getElementById('f-descricao').value.trim(),
        atuacao: document.getElementById('f-atuacao').value.trim(),
        ondeTrabalhar: document.getElementById('f-onde-trabalhar').value.trim(),
        matrizes: matrizesEmEdicao,
        atualizadoEm: new Date().toISOString()
    };

    // Guarda QUAIS campos você mexeu, e não só que o curso foi editado: é
    // isso que permite revisar depois, na importação, só o que conflita.
    const antes = cursosCache.find((c) => c.id === editandoId) || {};
    const mexidos = Object.keys(dados).filter((campo) => {
        if (CAMPOS_FORA_DO_CATALOGO.includes(campo)) return false;
        const novo = dados[campo];
        const velho = antes[campo];
        // Campo nunca preenchido (undefined no Firestore) e valor novo "vazio"
        // pro seu tipo (false, null, '', []) não é uma mudança de verdade —
        // sem isso, salvar sem mexer em nada já marcava prova de aptidão e
        // carga horária como editados à mão.
        if (valorVazio(novo) && valorVazio(velho)) return false;
        return JSON.stringify(novo) !== JSON.stringify(velho);
    });
    dados.camposEditados = [...new Set([...(antes.camposEditados || []), ...mexidos])];
    dados.editadoManualmente = dados.camposEditados.length > 0;
    dados.atualizadoPor = auth.currentUser?.email || '';

    try {
        await setDoc(doc(db, CURSOS_COLLECTION, editandoId), dados, { merge: true });
        fecharFormulario();
        await carregarCursos();
    } catch (err) {
        console.error('Erro ao salvar o curso:', err);
        alert('Erro ao salvar o curso: ' + err.message);
    }
}

// ========================================================
// Início
// ========================================================

function alternarFiltro(botao, ligado, textoLigado, textoDesligado) {
    botao.classList.toggle('btn-primario', ligado);
    botao.classList.toggle('btn-secundario', !ligado);
    botao.textContent = ligado ? textoLigado : textoDesligado;
}

document.addEventListener('DOMContentLoaded', () => {
    onAuthStateChanged(auth, async (user) => {
        if (!user) {
            window.location.href = 'login.html';
            return;
        }

        try {
            const snap = await getDoc(doc(db, 'usuarios', user.uid));
            if (!snap.exists() || snap.data().admin !== true) {
                document.getElementById('admin-app').style.display = 'none';
                document.getElementById('acesso-negado').style.display = 'flex';
                return;
            }

            document.getElementById('admin-email').textContent = user.email || '';
            document.getElementById('admin-app').style.display = 'block';
            await carregarCursos();
            carregarFotosDosEixos().then((fotos) => {
                fotosDosEixos = fotos;
                renderizarCapasDosEixos();
            });
        } catch (err) {
            console.error('Erro ao verificar acesso de administrador:', err);
            document.getElementById('admin-app').style.display = 'none';
            document.getElementById('acesso-negado').style.display = 'flex';
        }
    });

    document.getElementById('logout-btn').addEventListener('click', async () => {
        await signOut(auth);
        window.location.href = 'login.html';
    });

    ligarZonaDeArquivo({
        zona: 'zona-csv', botao: 'btn-importar-csv', input: 'input-csv-cursos', aoReceber: importarCsvDoCatalogo
    });
    ligarZonaDeArquivo({
        zona: 'zona-matriz', botao: 'btn-enviar-matriz', input: 'input-matriz-pdf', aoReceber: receberPdfDaMatriz
    });

    // capas: um seletor de arquivo só, aberto para o eixo do botão clicado
    const inputCapaEixo = document.getElementById('input-capa-eixo');
    document.getElementById('lista-capas').addEventListener('click', (e) => {
        const enviar = e.target.closest('[data-enviar-capa]');
        if (enviar) {
            eixoEmEnvio = { slug: enviar.dataset.enviarCapa, nome: enviar.dataset.nome };
            inputCapaEixo.click();
            return;
        }
        const remover = e.target.closest('[data-remover-capa]');
        if (remover) removerCapa(remover.dataset.removerCapa, remover.dataset.nome);
    });
    inputCapaEixo.addEventListener('change', (e) => {
        const arquivo = e.target.files[0];
        e.target.value = '';
        if (arquivo) receberCapaDoEixo(arquivo);
    });

    const inputCapaCurso = document.getElementById('input-capa-curso');
    document.getElementById('btn-enviar-capa-curso').addEventListener('click', () => inputCapaCurso.click());
    inputCapaCurso.addEventListener('change', (e) => {
        const arquivo = e.target.files[0];
        e.target.value = '';
        if (arquivo) receberCapaDoCurso(arquivo);
    });

    document.getElementById('busca-curso').addEventListener('input', renderizarTabela);
    document.getElementById('btn-filtrar-incompletos').addEventListener('click', () => {
        filtroIncompletos = !filtroIncompletos;
        renderizarTabela();
    });

    document.getElementById('btn-filtrar-editados').addEventListener('click', (e) => {
        filtroEditados = !filtroEditados;
        alternarFiltro(e.target, filtroEditados, '✏️ Mostrando os editados', '✏️ Editados à mão');
        renderizarTabela();
    });

    document.getElementById('btn-filtrar-sem-matriz').addEventListener('click', (e) => {
        filtroSemMatriz = !filtroSemMatriz;
        alternarFiltro(e.target, filtroSemMatriz, 'Mostrando os sem matriz', 'Mostrar cursos sem matriz');
        renderizarTabela();
        if (filtroSemMatriz) document.querySelector('.tabela-container').scrollIntoView({ behavior: 'smooth' });
    });

    document.getElementById('tabela-cursos-corpo').addEventListener('click', (e) => {
        const botao = e.target.closest('button[data-acao="editar"]');
        if (!botao) return;
        const curso = cursosCache.find((c) => c.id === botao.dataset.id);
        if (curso) abrirFormulario(curso);
    });

    document.getElementById('lista-matrizes').addEventListener('click', (e) => {
        const botao = e.target.closest('[data-remover-matriz]');
        if (!botao) return;
        lerDestaquesDigitados();
        matrizesEmEdicao.splice(Number(botao.dataset.removerMatriz), 1);
        renderizarMatrizesDoFormulario();
        mostrarStatus('status-matriz', 'Matriz removida. Clique em "Salvar curso" para gravar.');
    });

    document.getElementById('btn-fechar-form').addEventListener('click', fecharFormulario);
    document.getElementById('btn-cancelar-form').addEventListener('click', fecharFormulario);
    document.getElementById('form-curso').addEventListener('submit', salvarCurso);
    document.getElementById('modal-form').addEventListener('click', (e) => {
        if (e.target.id === 'modal-form') fecharFormulario();
    });
});
