import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase-config.js';
import { escapeHtml } from './card-unidade.js';
import { categoriasTeste } from './categorias-teste.js';
import { extrairResultadoMaisRecente, extrairResultadoVocacional } from './resultado-teste.js';

// A página abre no perfil montado (o que a pessoa — e, no futuro, uma Etec —
// veria). O formulário é o modo de edição, com uma marcação por campo do que
// pode aparecer para outras pessoas.

const CATALOGO_OFICIAL = '/dados/catalogo-cursos.json';
const MAXIMO_ESTILOS = 3;

const MODALIDADES = [
    'Médio + Técnico',
    'Técnico',
    'Especialização',
    'EaD / Online',
    'Semipresencial',
    'Médio + Superior (AMS)'
];

const ESTILOS = [
    'Aulas presenciais',
    'Aulas EaD',
    'Leitura',
    'Prática, mão na massa',
    'Vídeo-aulas',
    'Estudo em grupo',
    'No meu ritmo',
    'Exercícios e provas'
];

const ESCOLARIDADES = {
    fundamental: 'Ensino fundamental',
    medio_cursando: 'Cursando o ensino médio',
    medio_concluido: 'Ensino médio completo',
    tecnico_cursando: 'Cursando um curso técnico',
    tecnico_concluido: 'Curso técnico completo',
    superior_cursando: 'Cursando o ensino superior',
    superior_concluido: 'Ensino superior completo'
};

const ITENS_DO_PERFIL = [
    { rotulo: 'cidade no cadastro', completo: (d) => Boolean(d.cadastro.cidade || d.cadastro.cep) },
    { rotulo: 'seu momento nos estudos', completo: (d) => Boolean(d.perfil.escolaridade) },
    { rotulo: 'sua formação', completo: (d) => Boolean(d.perfil.formacao || d.perfil.semFormacao) },
    { rotulo: 'o curso que você quer', completo: (d) => Boolean(d.perfil.cursoDesejado) },
    { rotulo: 'suas áreas de interesse', completo: (d) => (d.perfil.modalidades || []).length > 0 },
    { rotulo: 'seu estilo de aprendizado', completo: (d) => (d.perfil.estilos || []).length > 0 },
    { rotulo: 'seu objetivo', completo: (d) => Boolean(d.perfil.objetivo) },
    { rotulo: 'fazer um teste', completo: (d) => Boolean(d.temTeste) }
];

const VISIVEL_POR_PADRAO = {
    formacao: true, cursoDesejado: true, modalidades: true, estilos: true, objetivo: true, testes: true
};

let usuarioAtual = null;
let cadastro = {};
let perfil = { modalidades: [], estilos: [], visibilidade: { ...VISIVEL_POR_PADRAO } };
let temTeste = false;
let resultados = { vocacional: null, gardner: null };

const elemento = (id) => document.getElementById(id);

// ------------------------------------------------------------------
// Modo visualização
// ------------------------------------------------------------------

function tagsLeitura(container, valores, { cor = '', vazio = 'Ainda não preenchido' } = {}) {
    container.innerHTML = valores.length
        ? valores.map((valor) => `
            <span class="tag-leitura ${cor ? `tag-leitura--${cor}` : ''}">${escapeHtml(valor)}</span>`).join('')
        : `<span class="perfil-vazio">${escapeHtml(vazio)}</span>`;
}

function marcarPrivados() {
    document.querySelectorAll('.perfil-so-voce').forEach((selo) => {
        const visivel = perfil.visibilidade?.[selo.dataset.campo] !== false;
        selo.hidden = visivel;
    });
}

function linhaDeFormacao() {
    const escolaridade = ESCOLARIDADES[perfil.escolaridade] || '';
    const curso = perfil.visibilidade?.formacao === false ? '' : (perfil.formacao || '');

    if (perfil.semFormacao && escolaridade) return `🎓 ${escolaridade}`;
    if (curso && escolaridade) return `🎓 ${curso} · ${escolaridade}`;
    return curso ? `🎓 ${curso}` : (escolaridade ? `🎓 ${escolaridade}` : '');
}

// O mesmo gráfico da home: as 3 inteligências mais fortes, proporcionais
// entre si para os arcos fecharem o círculo.
function desenharDonut(resultado) {
    const top3 = (resultado.ranking || []).slice(0, 3);
    const soma = top3.reduce((total, chave) => total + (resultado.porcentagens?.[chave] || 0), 0);
    let offset = 0;

    ['perfil-arco-1', 'perfil-arco-2', 'perfil-arco-3'].forEach((id, i) => {
        const fatia = soma > 0 ? ((resultado.porcentagens?.[top3[i]] || 0) / soma) * 100 : 0;
        const arco = elemento(id);
        arco.setAttribute('stroke-dasharray', `${fatia} 100`);
        arco.setAttribute('stroke-dashoffset', `${-offset}`);
        offset += fatia;
    });

    return top3.map((chave) => categoriasTeste[chave] || chave);
}

function mostrarTestes() {
    const rodape = elemento('perfil-testes-rodape');
    const quadroRapido = elemento('perfil-teste-rapido');
    const quadroVocacional = elemento('perfil-teste-vocacional');

    quadroRapido.hidden = !resultados.gardner;
    quadroVocacional.hidden = !resultados.vocacional;

    if (resultados.gardner) {
        const podio = desenharDonut(resultados.gardner);
        elemento('perfil-teste-inteligencia').textContent =
            categoriasTeste[resultados.gardner.categoriaPrincipal] || resultados.gardner.categoriaPrincipal;
        elemento('perfil-teste-podio').textContent = podio.join(' · ');
    }

    if (resultados.vocacional) {
        elemento('perfil-teste-areas').textContent =
            (resultados.vocacional.eixosFortes || []).slice(0, 2).join(' · ');
        elemento('perfil-teste-cursos').innerHTML = (resultados.vocacional.cursos || []).slice(0, 3)
            .map((curso) => `
                <a class="tag-leitura tag-leitura--curso" href="curso.html?c=${encodeURIComponent(curso.slug)}">
                    ${escapeHtml(curso.nome)}
                </a>`).join('');
    }

    rodape.innerHTML = resultados.gardner || resultados.vocacional
        ? '<a href="testes.html">Ver os resultados completos</a>'
        : 'Você ainda não fez nenhum teste. <a href="testes.html">Começar agora</a>.';
}

function atualizarProgresso() {
    const dados = { perfil, cadastro, temTeste };
    const faltando = ITENS_DO_PERFIL.filter((item) => !item.completo(dados));
    const porcentagem = Math.round(((ITENS_DO_PERFIL.length - faltando.length) / ITENS_DO_PERFIL.length) * 100);

    const completo = faltando.length === 0;

    elemento('perfil-progresso-valor').textContent = `${porcentagem}%`;
    elemento('perfil-progresso-fill').style.width = `${porcentagem}%`;
    elemento('perfil-aviso').classList.toggle('perfil-aviso--completo', completo);
    elemento('perfil-aviso-icone').textContent = completo ? '✓' : '📋';
    elemento('perfil-aviso-titulo').textContent = completo
        ? 'Parabéns, seu perfil está completo!'
        : 'Complete seu perfil';
    elemento('perfil-progresso-falta').textContent = completo
        ? 'Com tudo preenchido, as sugestões de curso e de unidade ficam mais perto do que você quer.'
        : `Falta ${faltando.map((item) => item.rotulo).join(', ')}.`;
}

// Recebe o perfil já lido do formulário quando vem do salvar; sem argumento,
// desenha o que está guardado.
function mostrarVisualizacao(novoPerfil = null) {
    if (novoPerfil) perfil = { ...perfil, ...novoPerfil };

    const nome = [cadastro?.nome, cadastro?.sobrenome].filter(Boolean).join(' ').trim();
    const iniciais = (nome || usuarioAtual?.email || '?').trim().split(/\s+/).slice(0, 2)
        .map((parte) => parte[0].toUpperCase()).join('');

    elemento('perfil-iniciais').textContent = iniciais;
    elemento('perfil-saudacao').textContent = nome ? `Olá, ${nome.split(' ')[0]}` : 'Olá';
    elemento('perfil-nome-completo').textContent = nome;
    elemento('perfil-formacao-linha').textContent = linhaDeFormacao();
    elemento('perfil-local').textContent = [cadastro?.cidade, cadastro?.estado].filter(Boolean).join(' · ');

    tagsLeitura(elemento('ver-modalidades'), perfil.modalidades || [], {
        cor: 'area', vazio: 'Escolha os tipos de curso no Editar'
    });
    tagsLeitura(elemento('ver-curso'), perfil.cursoDesejado ? [perfil.cursoDesejado] : [], {
        cor: 'destaque', vazio: 'Escolha o curso que você quer seguir'
    });
    tagsLeitura(elemento('ver-estilos'), perfil.estilos || [], {
        cor: 'estilo', vazio: 'Escolha até 3 no Editar'
    });

    const objetivo = elemento('ver-objetivo');
    objetivo.textContent = perfil.objetivo || 'Conte em poucas palavras onde você quer chegar.';
    objetivo.classList.toggle('perfil-vazio', !perfil.objetivo);

    marcarPrivados();
    mostrarTestes();
    elemento('perfil-cartao-testes').hidden = false;
    atualizarProgresso();

    elemento('perfil-visualizacao').hidden = false;
    elemento('perfil-edicao').hidden = true;
}

// ------------------------------------------------------------------
// Modo edição
// ------------------------------------------------------------------

function montarTags(container, opcoes, selecionadas, limite) {
    container.innerHTML = opcoes.map((opcao) => `
        <button type="button" class="perfil-tag ${selecionadas.includes(opcao) ? 'perfil-tag--ativa' : ''}"
            data-valor="${escapeHtml(opcao)}" aria-pressed="${selecionadas.includes(opcao)}">
            ${escapeHtml(opcao)}
        </button>`).join('');

    container.querySelectorAll('.perfil-tag').forEach((botao) => {
        botao.addEventListener('click', () => {
            const valor = botao.dataset.valor;
            const posicao = selecionadas.indexOf(valor);

            if (posicao >= 0) {
                selecionadas.splice(posicao, 1);
            } else if (!limite || selecionadas.length < limite) {
                selecionadas.push(valor);
            } else {
                // no limite: a escolha mais antiga sai para a nova entrar
                selecionadas.shift();
                selecionadas.push(valor);
            }
            montarTags(container, opcoes, selecionadas, limite);
        });
    });
}

function abrirEdicao() {
    elemento('perfil-escolaridade').value = perfil.escolaridade || '';
    elemento('perfil-formacao').value = perfil.formacao || '';
    elemento('perfil-sem-formacao').checked = perfil.semFormacao === true;
    elemento('perfil-formacao').disabled = perfil.semFormacao === true;
    elemento('perfil-curso-desejado').value = perfil.cursoDesejado || '';
    elemento('perfil-objetivo').value = perfil.objetivo || '';
    elemento('perfil-objetivo-contador').textContent = (perfil.objetivo || '').length;

    document.querySelectorAll('[data-visibilidade]').forEach((caixa) => {
        caixa.checked = perfil.visibilidade?.[caixa.dataset.visibilidade] !== false;
    });

    // cópias: cancelar não pode deixar marcação escolhida pela metade
    montarTags(elemento('perfil-modalidades'), MODALIDADES, [...(perfil.modalidades || [])], 0);
    montarTags(elemento('perfil-estilos'), ESTILOS, [...(perfil.estilos || [])], MAXIMO_ESTILOS);

    elemento('perfil-status').textContent = '';
    elemento('perfil-visualizacao').hidden = true;
    elemento('perfil-edicao').hidden = false;
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function lerEdicao() {
    const tagsMarcadas = (id) => [...document.querySelectorAll(`#${id} .perfil-tag--ativa`)]
        .map((botao) => botao.dataset.valor);

    const visibilidade = {};
    document.querySelectorAll('[data-visibilidade]').forEach((caixa) => {
        visibilidade[caixa.dataset.visibilidade] = caixa.checked;
    });

    return {
        escolaridade: elemento('perfil-escolaridade').value,
        formacao: elemento('perfil-formacao').value.trim(),
        semFormacao: elemento('perfil-sem-formacao').checked,
        cursoDesejado: elemento('perfil-curso-desejado').value.trim(),
        modalidades: tagsMarcadas('perfil-modalidades'),
        estilos: tagsMarcadas('perfil-estilos'),
        objetivo: elemento('perfil-objetivo').value.trim(),
        visibilidade
    };
}

async function salvar(evento) {
    evento.preventDefault();
    const status = elemento('perfil-status');
    const novo = lerEdicao();

    try {
        await setDoc(
            doc(db, 'usuarios', usuarioAtual.uid),
            { perfil: { ...novo, atualizadoEm: new Date().toISOString() } },
            { merge: true }
        );
        status.textContent = '';
        mostrarVisualizacao(novo);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (erro) {
        console.error('Erro ao salvar o perfil:', erro);
        status.textContent = 'Não consegui salvar agora. Tente de novo.';
        status.className = 'perfil-status perfil-status--erro';
    }
}

// ------------------------------------------------------------------
// Início
// ------------------------------------------------------------------

async function carregarCatalogo() {
    try {
        const cursos = await (await fetch(CATALOGO_OFICIAL)).json();
        elemento('lista-cursos-catalogo').innerHTML = cursos
            .map((curso) => `<option value="${escapeHtml(curso.nome)}"></option>`).join('');
    } catch (erro) {
        console.error('Não consegui carregar a lista de cursos:', erro);
    }
}

onAuthStateChanged(auth, async (usuario) => {
    if (!usuario) {
        elemento('perfil-precisa-login').hidden = false;
        elemento('perfil-visualizacao').hidden = true;
        elemento('perfil-edicao').hidden = true;
        return;
    }

    usuarioAtual = usuario;
    elemento('perfil-precisa-login').hidden = true;
    await carregarCatalogo();

    try {
        const snap = await getDoc(doc(db, 'usuarios', usuario.uid));
        cadastro = snap.exists() ? snap.data() : {};
        perfil = {
            modalidades: [], estilos: [],
            ...(cadastro.perfil || {}),
            visibilidade: { ...VISIVEL_POR_PADRAO, ...(cadastro.perfil?.visibilidade || {}) }
        };
        resultados = {
            vocacional: extrairResultadoVocacional(cadastro),
            gardner: extrairResultadoMaisRecente(cadastro)
        };
        temTeste = Boolean(resultados.vocacional || resultados.gardner);
    } catch (erro) {
        console.error('Erro ao carregar o perfil:', erro);
    }

    mostrarVisualizacao();
});

document.addEventListener('DOMContentLoaded', () => {
    elemento('btn-editar-perfil')?.addEventListener('click', abrirEdicao);
    elemento('btn-cancelar-perfil')?.addEventListener('click', mostrarVisualizacao);
    elemento('perfil-edicao')?.addEventListener('submit', salvar);

    elemento('perfil-objetivo')?.addEventListener('input', (e) => {
        elemento('perfil-objetivo-contador').textContent = e.target.value.length;
    });

    elemento('perfil-sem-formacao')?.addEventListener('change', (e) => {
        const campo = elemento('perfil-formacao');
        campo.disabled = e.target.checked;
        if (e.target.checked) campo.value = '';
    });
});

// exportados para poderem ser exercitados fora da tela logada (testes)
export { montarTags, mostrarVisualizacao, abrirEdicao, lerEdicao, ITENS_DO_PERFIL, MODALIDADES, ESTILOS, MAXIMO_ESTILOS };
