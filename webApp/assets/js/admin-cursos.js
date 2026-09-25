import { auth, db } from './firebase-config.js';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, doc, getDoc, getDocs, setDoc, writeBatch } from 'firebase/firestore';
import { parseCsvLine } from './csv.js';

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

function camposEsperadosPara(curso) {
    return curso.nivel === 'superior'
        ? CAMPOS_ESPERADOS.filter(([campo]) => campo !== 'cargaHoraria')
        : CAMPOS_ESPERADOS;
}

let cursosCache = [];
let unidadesPorCurso = new Map();
let editandoId = null;
let filtroIncompletos = false;
let filtroEditados = false;

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

function faltando(curso) {
    return camposEsperadosPara(curso).filter(([campo]) => !curso[campo]).map(([, rotulo]) => rotulo);
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

function renderizarTabela() {
    const filtro = normalizar(document.getElementById('busca-curso').value);
    const corpo = document.getElementById('tabela-cursos-corpo');

    renderizarAlerta();

    const linhas = cursosCache
        .filter((c) => !filtroIncompletos || faltando(c).length)
        .filter((c) => !filtroEditados || (c.camposEditados || []).length)
        .filter((c) => !filtro || normalizar([
            c.nome, (c.eixos || []).join(' '), (c.modalidades || []).join(' ')
        ].join(' ')).includes(filtro));

    if (!linhas.length) {
        corpo.innerHTML = `<tr><td colspan="7" class="tabela-vazia">
            ${cursosCache.length ? 'Nenhum curso encontrado.' : 'Nenhum curso importado ainda. Clique em "Importar catálogo oficial".'}
        </td></tr>`;
        return;
    }

    corpo.innerHTML = linhas.map((c) => {
        const pendencias = faltando(c);
        const unidades = unidadesPorCurso.get(normalizar(c.nome)) || 0;
        return `
        <tr>
            <td>
                ${c.nivel === 'superior' ? '<span class="badge-categoria">Superior</span>' : ''}
                <strong>${escapeHtml(c.nome)}</strong>
                ${pendencias.length ? `<div class="pendencia">falta ${escapeHtml(pendencias.join(', '))}</div>` : ''}
                ${c.provaAptidao ? '<div class="pendencia pendencia--info">tem prova de aptidão</div>' : ''}
                ${(c.camposEditados || []).length ? `<div class="pendencia pendencia--manual">✏️ editado à mão: ${escapeHtml(c.camposEditados.map((x) => ROTULO_CAMPO[x] || x).join(', '))}</div>` : ''}
            </td>
            <td>${escapeHtml((c.eixos || []).join(', '))}</td>
            <td>${escapeHtml(c.duracao || '—')}</td>
            <td>${c.cargaHoraria ? `${c.cargaHoraria} h` : '—'}</td>
            <td class="col-prerequisito" title="${escapeHtml(c.preRequisitos || '')}">
                ${c.preRequisitos ? escapeHtml(c.preRequisitos.slice(0, 60)) + (c.preRequisitos.length > 60 ? '…' : '') : '—'}
            </td>
            <td>${unidades}</td>
            <td class="col-acoes">
                <button type="button" class="btn-icone" data-acao="editar" data-id="${escapeHtml(c.id)}" title="Editar">✏️</button>
                <a class="btn-icone" href="curso.html?c=${encodeURIComponent(c.id)}" target="_blank" title="Ver a página do curso">🔍</a>
            </td>
        </tr>`;
    }).join('');
}

// ========================================================
// Importação do catálogo oficial
// ========================================================

// Grava os cursos na coleção, venham eles do arquivo embutido ou de um CSV.
// Regra que vale para os dois caminhos: curso novo entra inteiro; curso que
// já existe só recebe os campos que ainda estão vazios, para não desfazer o
// que foi corrigido à mão no painel.
// Campos editados à mão que o catálogo mudaria. São eles que entram na tela
// de revisão antes de qualquer substituição.
export function detectarConflitos(catalogo, existentes) {
    const conflitos = [];
    catalogo.forEach((curso) => {
        const atual = existentes.get(curso.slug);
        if (!atual?.camposEditados?.length) return;

        atual.camposEditados.forEach((campo) => {
            const oficial = curso[campo];
            const vazioNaFonte = Array.isArray(oficial) ? !oficial.length : (oficial === '' || oficial == null);
            if (vazioNaFonte) return;
            if (JSON.stringify(atual[campo]) === JSON.stringify(oficial)) return;

            conflitos.push({ slug: curso.slug, nome: curso.nome, campo, meu: atual[campo], oficial });
        });
    });
    return conflitos;
}

// ignorar: conjunto de "slug:campo" que a revisão decidiu manter como está.
export function camposParaGravar(curso, atual, sobrescrever, ignorar = new Set()) {
    const dados = { ...curso };
    delete dados.slug;

    if (!atual) return dados;

    Object.keys(dados).forEach((campo) => {
        if (ignorar.has(`${curso.slug}:${campo}`)) { delete dados[campo]; return; }
        const valor = dados[campo];
        const vazioNaFonte = Array.isArray(valor) ? !valor.length : (valor === '' || valor == null);

        // O que o catálogo não publica (duração e carga horária de várias
        // especializações, por exemplo) nunca apaga o que você preencheu.
        if (vazioNaFonte) delete dados[campo];
        // O resto depende da escolha na tela: por padrão o oficial corrige o
        // que estiver diferente, inclusive um preenchimento manual errado.
        else if (!sobrescrever && atual[campo]) delete dados[campo];
        // Nada mudou: não vale uma escrita.
        else if (JSON.stringify(atual[campo]) === JSON.stringify(valor)) delete dados[campo];
    });

    return dados;
}

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
    nome: 'nome'
};

// Mostra, antes de substituir, cada campo que você editou e que o catálogo
// mudaria. Devolve o conjunto de "slug:campo" a manter como está.
function revisarConflitos(conflitos) {
    return new Promise((resolve) => {
        const lista = document.getElementById('lista-conflitos');
        document.getElementById('revisao-resumo').textContent =
            `${conflitos.length} campo(s) que você editou à mão têm valor diferente no catálogo. `
            + 'Desmarque os que você quer manter do seu jeito.';

        lista.innerHTML = conflitos.map((c, i) => `
            <div class="conflito">
                <label class="conflito-topo">
                    <input type="checkbox" data-indice="${i}" checked>
                    <span><strong>${escapeHtml(c.nome)}</strong> · ${escapeHtml(ROTULO_CAMPO[c.campo] || c.campo)}</span>
                </label>
                <div class="conflito-valores">
                    <div class="conflito-valor">
                        <span class="conflito-rotulo">seu</span>
                        ${escapeHtml(String(Array.isArray(c.meu) ? c.meu.join(', ') : c.meu ?? '')).slice(0, 400) || '<em>vazio</em>'}
                    </div>
                    <div class="conflito-valor conflito-valor--oficial">
                        <span class="conflito-rotulo">catálogo</span>
                        ${escapeHtml(String(Array.isArray(c.oficial) ? c.oficial.join(', ') : c.oficial)).slice(0, 400)}
                    </div>
                </div>
            </div>`).join('');

        const modal = document.getElementById('modal-revisao');
        modal.classList.add('aberto');

        const marcar = (valor) => lista.querySelectorAll('input[type="checkbox"]')
            .forEach((c) => { c.checked = valor; });

        const fechar = (ignorar) => {
            modal.classList.remove('aberto');
            botaoAplicar.removeEventListener('click', aoAplicar);
            botaoCancelar.removeEventListener('click', aoCancelar);
            botaoTodosMeus.removeEventListener('click', aoManterTudo);
            resolve(ignorar);
        };

        const botaoAplicar = document.getElementById('btn-aplicar-revisao');
        const botaoCancelar = document.getElementById('btn-cancelar-revisao');
        const botaoTodosMeus = document.getElementById('btn-manter-meus');

        const aoAplicar = () => {
            const ignorar = new Set();
            lista.querySelectorAll('input[type="checkbox"]').forEach((caixa) => {
                if (!caixa.checked) {
                    const c = conflitos[Number(caixa.dataset.indice)];
                    ignorar.add(`${c.slug}:${c.campo}`);
                }
            });
            fechar(ignorar);
        };
        const aoCancelar = () => fechar(null);
        const aoManterTudo = () => { marcar(false); aoAplicar(); };

        botaoAplicar.addEventListener('click', aoAplicar);
        botaoCancelar.addEventListener('click', aoCancelar);
        botaoTodosMeus.addEventListener('click', aoManterTudo);
    });
}

async function gravarCatalogo(catalogo, status, prefixo) {
    const sobrescrever = document.getElementById('chk-sobrescrever').checked;
    const existentes = new Map(cursosCache.map((c) => [c.id, c]));
    let novos = 0;
    let atualizados = 0;
    let ignorar = new Set();

    if (sobrescrever) {
        const conflitos = detectarConflitos(catalogo, existentes);
        if (conflitos.length) {
            status.textContent = 'Revise os campos editados à mão antes de substituir...';
            const decisao = await revisarConflitos(conflitos);
            if (decisao === null) {
                status.textContent = 'Importação cancelada. Nada foi alterado.';
                return;
            }
            ignorar = decisao;
        }
    }

    const TAMANHO_LOTE = 400;
    for (let i = 0; i < catalogo.length; i += TAMANHO_LOTE) {
        const batch = writeBatch(db);
        let escritasNoLote = 0;

        catalogo.slice(i, i + TAMANHO_LOTE).forEach((curso) => {
            const atual = existentes.get(curso.slug);
            const dados = camposParaGravar(curso, atual, sobrescrever, ignorar);
            if (!Object.keys(dados).length) return;

            if (atual) atualizados += 1;
            else novos += 1;

            batch.set(
                doc(db, CURSOS_COLLECTION, curso.slug),
                { ...dados, atualizadoEm: new Date().toISOString() },
                { merge: true }
            );
            escritasNoLote += 1;
        });

        if (escritasNoLote) await batch.commit();
        status.textContent = `Gravando... ${Math.min(i + TAMANHO_LOTE, catalogo.length)} de ${catalogo.length}`;
    }

    await carregarCursos();
    status.textContent = `${prefixo} ${novos} curso(s) novo(s), ${atualizados} atualizado(s). `
        + (sobrescrever
            ? `O catálogo corrigiu os campos que ele publica${ignorar.size ? `, menos ${ignorar.size} que você escolheu manter` : ''}.`
            : 'Só foram preenchidos campos que estavam vazios.');
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
    const status = document.getElementById('status-importacao');
    status.style.display = 'block';
    status.textContent = `Lendo ${arquivo.name}...`;

    try {
        const nivel = document.getElementById('select-nivel-csv').value;
        const cursos = lerCatalogoCsv(await arquivo.text(), nivel);
        await gravarCatalogo(cursos, status, `CSV lido: ${cursos.length} curso(s).`);
    } catch (err) {
        console.error('Erro ao importar o CSV de cursos:', err);
        status.textContent = 'Erro ao ler o CSV: ' + err.message;
    }
}

// ========================================================
// Formulário
// ========================================================

function abrirFormulario(curso) {
    editandoId = curso.id;
    document.getElementById('form-titulo').textContent = curso.nome;
    document.getElementById('f-duracao').value = curso.duracao || '';
    document.getElementById('f-carga').value = curso.cargaHoraria || '';
    document.getElementById('f-eixos').value = (curso.eixos || []).join(', ');
    document.getElementById('f-prerequisitos').value = curso.preRequisitos || '';
    document.getElementById('f-aptidao').checked = curso.provaAptidao === true;
    document.getElementById('f-descricao').value = curso.descricao || '';
    document.getElementById('f-atuacao').value = curso.atuacao || '';
    document.getElementById('f-onde-trabalhar').value = curso.ondeTrabalhar || '';
    document.getElementById('modal-form').classList.add('aberto');
}

function fecharFormulario() {
    document.getElementById('modal-form').classList.remove('aberto');
    editandoId = null;
}

async function salvarCurso(evento) {
    evento.preventDefault();
    if (!editandoId) return;

    const carga = document.getElementById('f-carga').value.trim();
    const dados = {
        duracao: document.getElementById('f-duracao').value.trim(),
        cargaHoraria: carga ? Number(carga) : null,
        eixos: document.getElementById('f-eixos').value.split(',').map((e) => e.trim()).filter(Boolean),
        preRequisitos: document.getElementById('f-prerequisitos').value.trim(),
        provaAptidao: document.getElementById('f-aptidao').checked,
        descricao: document.getElementById('f-descricao').value.trim(),
        atuacao: document.getElementById('f-atuacao').value.trim(),
        ondeTrabalhar: document.getElementById('f-onde-trabalhar').value.trim(),
        atualizadoEm: new Date().toISOString()
    };

    // Guarda QUAIS campos você mexeu, e não só que o curso foi editado: é
    // isso que permite revisar depois, na importação, só o que conflita.
    const antes = cursosCache.find((c) => c.id === editandoId) || {};
    const mexidos = Object.keys(dados).filter((campo) =>
        campo !== 'atualizadoEm' && JSON.stringify(dados[campo]) !== JSON.stringify(antes[campo] ?? ''));
    dados.camposEditados = [...new Set([...(antes.camposEditados || []), ...mexidos])];
    dados.editadoManualmente = dados.camposEditados.length > 0;

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

    const inputCsv = document.getElementById('input-csv-cursos');
    document.getElementById('btn-importar-csv').addEventListener('click', () => inputCsv.click());
    inputCsv.addEventListener('change', async (e) => {
        const arquivo = e.target.files[0];
        e.target.value = '';
        if (arquivo) await importarCsvDoCatalogo(arquivo);
    });
    document.getElementById('busca-curso').addEventListener('input', renderizarTabela);
    document.getElementById('btn-filtrar-incompletos').addEventListener('click', () => {
        filtroIncompletos = !filtroIncompletos;
        renderizarTabela();
    });

    document.getElementById('btn-filtrar-editados').addEventListener('click', (e) => {
        filtroEditados = !filtroEditados;
        e.target.classList.toggle('btn-primario', filtroEditados);
        e.target.classList.toggle('btn-secundario', !filtroEditados);
        e.target.textContent = filtroEditados ? '✏️ Mostrando os editados' : '✏️ Editados à mão';
        renderizarTabela();
    });

    document.getElementById('tabela-cursos-corpo').addEventListener('click', (e) => {
        const botao = e.target.closest('button[data-acao="editar"]');
        if (!botao) return;
        const curso = cursosCache.find((c) => c.id === botao.dataset.id);
        if (curso) abrirFormulario(curso);
    });

    document.getElementById('btn-fechar-form').addEventListener('click', fecharFormulario);
    document.getElementById('btn-cancelar-form').addEventListener('click', fecharFormulario);
    document.getElementById('form-curso').addEventListener('submit', salvarCurso);
    document.getElementById('modal-form').addEventListener('click', (e) => {
        if (e.target.id === 'modal-form') fecharFormulario();
    });
});
