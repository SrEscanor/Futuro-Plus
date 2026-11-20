import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, doc, getDoc, getDocs, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase-config.js';
import { escapeHtml, normalizar } from './card-unidade.js';
import { extrairResultadoMaisRecente, extrairResultadoVocacional } from './resultado-teste.js';
import { localizarRuaDoAluno } from './geocodificacao.js';
import { ITENS_DO_PERFIL } from './perfil-completude.js';
import { htmlDoPerfil, montarConta } from './perfil-visao.js';
import { ativarNotificacoesPush, statusNotificacaoPush } from './notificacoes-push.js';
import { lerMeusComentarios } from './instituicao-dados.js';

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
    'Médio + Superior (AMS)',
    'Superior'
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

const VISIVEL_POR_PADRAO = {
    formacao: true, cursoDesejado: true, modalidades: true, estilos: true, objetivo: true, testes: true
};

let usuarioAtual = null;
let cadastro = {};
let perfil = { modalidades: [], estilos: [], visibilidade: { ...VISIVEL_POR_PADRAO } };
let temTeste = false;
let resultados = { vocacional: null, gardner: null };
// o que a tela nova mostra além do cadastro: os certificados do mural e o
// curso desejado já achado no catálogo (para o link e a demanda)
let certificados = [];
let catalogoCursos = [];
let cursoDesejadoInfo = null;
// o comentário mais recente desta conta em cada unidade onde há formação
// confirmada, para mostrar no card "Minhas instituições" ({ unidadeId: comentario })
let meusComentariosPorUnidade = {};

const elemento = (id) => document.getElementById(id);

// ------------------------------------------------------------------
// Endereço (CEP): a pessoa só digita o CEP, rua/cidade/estado vêm do
// ViaCEP e a coordenada (pra recomendação de unidade) do geocodificador —
// mesma lógica do cadastro, adaptada pra edição (só refaz a busca se o
// CEP realmente mudou; senão mantém o que já estava salvo).
let cepResolvido = { cepDigitos: '', rua: '', estado: '', cidade: '', localizacao: null };
let buscaLocalizacaoPerfil = Promise.resolve(null);

function mostrarResultadoCepPerfil(texto) {
    const alvo = elemento('perfil-cep-resultado');
    if (!alvo) return;
    if (!texto) {
        alvo.hidden = true;
        alvo.textContent = '';
        return;
    }
    alvo.hidden = false;
    alvo.textContent = `📍 ${texto}`;
}

// ------------------------------------------------------------------
// Modo visualização: o desenho da tela fica em perfil-visao.js
// ------------------------------------------------------------------

function situacaoDoPush() {
    const status = statusNotificacaoPush();
    if (status === 'granted') {
        return { texto: 'Ativadas! Você recebe os avisos do Futuro+ mesmo com o site fechado.', podeAtivar: false };
    }
    if (status === 'denied') {
        return { texto: 'Bloqueadas nas configurações do navegador. Pra ativar, mude a permissão de notificações deste site e recarregue a página.', podeAtivar: false };
    }
    if (status === 'sem-suporte') {
        return { texto: 'Seu navegador não tem suporte a notificações, ou o recurso ainda não foi configurado no site.', podeAtivar: false };
    }
    return { texto: 'Ative para receber avisos do Futuro+ mesmo com o site fechado.', podeAtivar: true };
}

// Recebe o perfil já lido do formulário quando vem do salvar; sem argumento,
// desenha o que está guardado.
function mostrarVisualizacao(novoPerfil = null) {
    if (novoPerfil) perfil = { ...perfil, ...novoPerfil };

    elemento('perfil-grade').innerHTML = htmlDoPerfil(montarConta({
        nome: [cadastro?.nome, cadastro?.sobrenome].filter(Boolean).join(' '),
        email: usuarioAtual?.email || '',
        cadastro,
        perfil,
        resultados,
        certificados,
        meusComentariosPorUnidade,
        cursoDesejado: cursoDesejadoInfo,
        push: situacaoDoPush()
    }));

    elemento('perfil-visualizacao').hidden = false;
    elemento('perfil-edicao').hidden = true;
}

// O curso que a pessoa escreveu em "curso que quero seguir" existe no
// catálogo? Se existir, a tela ganha o link e a demanda do vestibular.
// "Logística" existe como técnico e como superior (este com "superior-" na
// frente): quem só marcou interesse em superior começa por ele.
async function acharCursoDesejado() {
    cursoDesejadoInfo = null;
    if (!perfil.cursoDesejado) return;

    const base = normalizar(perfil.cursoDesejado).replace(/\s+/g, '-');
    const areas = perfil.modalidades || [];
    const soSuperior = areas.some((area) => area.includes('Superior'))
        && !areas.some((area) => /Técnico|Especialização/.test(area));
    const ids = soSuperior ? [`superior-${base}`, base] : [base, `superior-${base}`];

    try {
        for (const id of ids) {
            const snap = await getDoc(doc(db, 'cursos', id));
            if (snap.exists()) {
                const dados = snap.data();
                cursoDesejadoInfo = { id, nome: dados.nome || perfil.cursoDesejado, nivel: dados.nivel || '', demanda: dados.demanda };
                return;
            }
        }
    } catch (erro) {
        console.error('Não consegui buscar o curso desejado:', erro);
    }

    // sem o catálogo no Firestore, vale o arquivo oficial (só o link)
    const doArquivo = catalogoCursos.find((curso) => curso.slug === base);
    if (doArquivo) cursoDesejadoInfo = { id: doArquivo.slug, nome: doArquivo.nome, nivel: '' };
}

async function carregarCertificados() {
    try {
        const snap = await getDocs(collection(db, 'usuarios', usuarioAtual.uid, 'certificados'));
        // a mesma ordem do mural: o mais novo primeiro
        certificados = snap.docs
            .map((d) => ({ id: d.id, ...d.data() }))
            .sort((a, b) => (b.criadoEm || '').localeCompare(a.criadoEm || ''));
    } catch (erro) {
        console.error('Erro ao carregar os certificados:', erro);
        certificados = [];
    }
}

// Busca o comentário desta conta em cada unidade onde há formação confirmada
// (mesmo filtro de perfil-visao.js: certificado com curso do catálogo e nome
// conferido), para mostrar no card "Minhas instituições". Quando há mais de
// um (formou-se em dois cursos na mesma escola), mostra o mais recente.
async function carregarMeusComentarios() {
    const unidadeIds = [...new Set(certificados
        .filter((c) => c.cursoId && c.verificacao?.nomeConfere && c.unidadeId)
        .map((c) => c.unidadeId))];

    try {
        const listas = await Promise.all(unidadeIds.map((id) => lerMeusComentarios(id, usuarioAtual.uid)));
        meusComentariosPorUnidade = {};
        listas.forEach((lista, i) => {
            const maisRecente = [...lista].sort((a, b) => (b.criadoEm?.toMillis?.() || 0) - (a.criadoEm?.toMillis?.() || 0))[0];
            if (maisRecente) meusComentariosPorUnidade[unidadeIds[i]] = maisRecente;
        });
    } catch (erro) {
        console.error('Erro ao carregar meus comentários nas instituições:', erro);
        meusComentariosPorUnidade = {};
    }
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

function abrirEdicao(campoParaFocar = '') {
    elemento('perfil-nome').value = cadastro.nome || '';
    elemento('perfil-sobrenome').value = cadastro.sobrenome || '';
    elemento('perfil-data-nascimento').value = cadastro.dataNascimento || '';
    elemento('perfil-genero').value = cadastro.genero || '';
    elemento('perfil-cep').value = cadastro.cep || '';

    // Parte do que já está salvo — só é substituído se a pessoa trocar o
    // CEP e sair do campo (ver listener de blur mais abaixo).
    cepResolvido = {
        cepDigitos: (cadastro.cep || '').replace(/\D/g, ''),
        rua: cadastro.rua || '',
        estado: cadastro.estado || '',
        cidade: cadastro.cidade || '',
        localizacao: cadastro.localizacao || null
    };
    buscaLocalizacaoPerfil = Promise.resolve(cadastro.localizacao || null);
    mostrarResultadoCepPerfil([cepResolvido.rua, cepResolvido.cidade, cepResolvido.estado].filter(Boolean).join(', '));

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

    const campo = typeof campoParaFocar === 'string' && campoParaFocar ? elemento(campoParaFocar) : null;
    if (campo) {
        campo.scrollIntoView({ behavior: 'smooth', block: 'center' });
        campo.focus({ preventScroll: true });
    } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

function lerEdicao() {
    const tagsMarcadas = (id) => [...document.querySelectorAll(`#${id} .perfil-tag--ativa`)]
        .map((botao) => botao.dataset.valor);

    const visibilidade = {};
    document.querySelectorAll('[data-visibilidade]').forEach((caixa) => {
        visibilidade[caixa.dataset.visibilidade] = caixa.checked;
    });

    return {
        nome: elemento('perfil-nome').value.trim(),
        sobrenome: elemento('perfil-sobrenome').value.trim(),
        dataNascimento: elemento('perfil-data-nascimento').value,
        genero: elemento('perfil-genero').value,
        cep: elemento('perfil-cep').value.trim(),
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

const DIAS_PARA_EXCLUIR = 30;
let saindoPorExclusao = false;

// Não apaga na hora: marca a conta para exclusão daqui a 30 dias e
// desconecta. Se a pessoa entrar de novo antes do prazo, dashboard.js
// cancela o pedido sozinho (é o que fica de fato registrado nas contas).
// Quem não voltar é apagado de vez por uma função agendada no backend, já
// que ninguém estará logado para disparar isso pelo navegador.
async function excluirConta() {
    const digitado = prompt(
        `Sua conta vai ficar marcada para exclusão e você será desconectado agora.\n` +
        `Se ninguém entrar de novo em ${DIAS_PARA_EXCLUIR} dias, ela é apagada de vez — perfil, testes e certificados do mural.\n\n` +
        `Para confirmar, digite EXCLUIR:`
    );
    if ((digitado || '').trim().toUpperCase() !== 'EXCLUIR') return;

    const status = elemento('perfil-status');
    try {
        const executarEm = new Date(Date.now() + DIAS_PARA_EXCLUIR * 24 * 60 * 60 * 1000).toISOString();
        await setDoc(
            doc(db, 'usuarios', usuarioAtual.uid),
            { exclusao: { solicitadoEm: new Date().toISOString(), executarEm } },
            { merge: true }
        );
        // quem leva para a Início aqui é este fluxo, depois do aviso
        saindoPorExclusao = true;
        await signOut(auth);
        alert(`Pronto. Se você não entrar de novo em ${DIAS_PARA_EXCLUIR} dias, sua conta é apagada.`);
        window.location.href = 'index.html';
    } catch (erro) {
        console.error('Erro ao pedir exclusão da conta:', erro);
        status.textContent = 'Não consegui registrar o pedido agora. Tente de novo.';
        status.className = 'perfil-status perfil-status--erro';
    }
}

async function salvar(evento) {
    evento.preventDefault();
    const status = elemento('perfil-status');
    const { nome, sobrenome, dataNascimento, genero, cep, ...novoPerfil } = lerEdicao();

    if (!nome) {
        status.textContent = 'Informe seu nome.';
        status.className = 'perfil-status perfil-status--erro';
        elemento('perfil-nome').focus({ preventScroll: true });
        return;
    }
    if (!genero) {
        status.textContent = 'Selecione seu gênero.';
        status.className = 'perfil-status perfil-status--erro';
        elemento('perfil-genero').focus({ preventScroll: true });
        return;
    }
    if (cep.replace(/\D/g, '').length !== 8 || !cepResolvido.rua) {
        status.textContent = 'Informe um CEP válido (8 dígitos).';
        status.className = 'perfil-status perfil-status--erro';
        elemento('perfil-cep').focus({ preventScroll: true });
        return;
    }

    status.textContent = 'Salvando...';
    status.className = 'perfil-status';

    // Espera no máximo 3 s pela coordenada nova (só existe busca em
    // andamento se o CEP mudou); sem ela, mantém a localização anterior.
    const localizacao = await Promise.race([
        buscaLocalizacaoPerfil,
        new Promise((resolve) => setTimeout(() => resolve(cepResolvido.localizacao), 3000))
    ]);

    try {
        await setDoc(
            doc(db, 'usuarios', usuarioAtual.uid),
            {
                nome, sobrenome, dataNascimento, genero, cep,
                rua: cepResolvido.rua,
                estado: cepResolvido.estado,
                ...(cepResolvido.cidade ? { cidade: cepResolvido.cidade } : {}),
                ...(localizacao ? { localizacao } : {}),
                perfil: { ...novoPerfil, atualizadoEm: new Date().toISOString() }
            },
            { merge: true }
        );
        status.textContent = '';
        cadastro = {
            ...cadastro, nome, sobrenome, dataNascimento, genero, cep,
            rua: cepResolvido.rua, estado: cepResolvido.estado,
            ...(cepResolvido.cidade ? { cidade: cepResolvido.cidade } : {}),
            ...(localizacao ? { localizacao } : {})
        };
        perfil = { ...perfil, ...novoPerfil };
        await acharCursoDesejado();
        mostrarVisualizacao();
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
        catalogoCursos = await (await fetch(CATALOGO_OFICIAL)).json();
        elemento('lista-cursos-catalogo').innerHTML = catalogoCursos
            .map((curso) => `<option value="${escapeHtml(curso.nome)}"></option>`).join('');
    } catch (erro) {
        console.error('Não consegui carregar a lista de cursos:', erro);
    }
}

onAuthStateChanged(auth, async (usuario) => {
    // Perfil só existe para quem tem conta: sem login (ou ao sair da conta
    // com esta página aberta) a pessoa volta para a Início, que já tem os
    // botões de Entrar e Cadastro. "replace" para o Voltar do navegador não
    // cair aqui de novo e ficar num vai e vem.
    if (!usuario) {
        if (!saindoPorExclusao) window.location.replace('index.html');
        return;
    }

    usuarioAtual = usuario;
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

    // a tela aparece logo com o que já se sabe; certificados e demanda do
    // curso entram em seguida
    mostrarVisualizacao();
    await Promise.all([carregarCertificados(), acharCursoDesejado()]);
    await carregarMeusComentarios();
    if (!elemento('perfil-visualizacao').hidden) mostrarVisualizacao();
});

// ------------------------------------------------------------------
// Notificações push (FCM) — pede a permissão do navegador na hora que a
// pessoa clica, nunca sozinho ao abrir a página.
// ------------------------------------------------------------------
async function aoClicarAtivarPush() {
    const botao = elemento('btn-ativar-push');
    botao.disabled = true;
    botao.textContent = 'Ativando…';

    const resultado = await ativarNotificacoesPush();
    if (resultado === 'negada') {
        elemento('push-status-texto').textContent = 'Permissão recusada. Pra mudar de ideia depois, ajuste a permissão de notificações deste site nas configurações do navegador.';
    } else if (resultado === 'erro') {
        elemento('push-status-texto').textContent = 'Não consegui ativar agora. Tente de novo em instantes.';
    }

    if (resultado === 'negada' || resultado === 'erro') {
        botao.disabled = false;
        botao.textContent = 'Ativar notificações';
        return;
    }
    mostrarVisualizacao();
}

document.addEventListener('DOMContentLoaded', () => {
    // a tela do perfil é redesenhada a cada mudança: os cliques são ouvidos
    // na grade, não em cada botão
    elemento('perfil-grade')?.addEventListener('click', (e) => {
        if (e.target.closest('#btn-editar-perfil')) abrirEdicao();
        else if (e.target.closest('#btn-ativar-push')) aoClicarAtivarPush();
        else if (e.target.closest('[data-editar]')) abrirEdicao(e.target.closest('[data-editar]').dataset.editar);
    });
    elemento('btn-cancelar-perfil')?.addEventListener('click', () => mostrarVisualizacao());
    elemento('perfil-edicao')?.addEventListener('submit', salvar);
    elemento('btn-excluir-conta')?.addEventListener('click', excluirConta);

    elemento('perfil-objetivo')?.addEventListener('input', (e) => {
        elemento('perfil-objetivo-contador').textContent = e.target.value.length;
    });

    [elemento('perfil-nome'), elemento('perfil-sobrenome')].forEach((input) => {
        input?.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/[0-9]/g, '');
        });
        input?.addEventListener('blur', (e) => {
            const valor = e.target.value.trim();
            if (valor) e.target.value = valor.charAt(0).toUpperCase() + valor.slice(1).toLowerCase();
        });
    });

    elemento('perfil-sem-formacao')?.addEventListener('change', (e) => {
        const campo = elemento('perfil-formacao');
        campo.disabled = e.target.checked;
        if (e.target.checked) campo.value = '';
    });

    elemento('perfil-cep')?.addEventListener('input', (e) => {
        let valor = e.target.value.replace(/\D/g, '');
        if (valor.length > 8) valor = valor.slice(0, 8);
        e.target.value = valor.replace(/(\d{5})(\d)/, '$1-$2');
    });

    elemento('perfil-cep')?.addEventListener('blur', async (e) => {
        const status = elemento('perfil-status');
        const cepDigitos = e.target.value.replace(/\D/g, '');

        if (cepDigitos.length !== 8) {
            if (cepDigitos.length > 0) {
                status.textContent = 'CEP incompleto (precisa de 8 dígitos).';
                status.className = 'perfil-status perfil-status--erro';
            }
            return;
        }
        // CEP igual ao que já estava resolvido: nada a refazer.
        if (cepDigitos === cepResolvido.cepDigitos) return;

        try {
            const resposta = await fetch(`https://viacep.com.br/ws/${cepDigitos}/json/`);
            const dados = await resposta.json();
            if (dados.erro) {
                status.textContent = 'CEP não encontrado.';
                status.className = 'perfil-status perfil-status--erro';
                return;
            }
            cepResolvido = {
                cepDigitos,
                rua: dados.logradouro || '',
                estado: dados.uf || '',
                cidade: dados.localidade || '',
                localizacao: null
            };
            mostrarResultadoCepPerfil([cepResolvido.rua, cepResolvido.cidade, cepResolvido.estado].filter(Boolean).join(', '));
            buscaLocalizacaoPerfil = localizarRuaDoAluno({ rua: dados.logradouro, cidade: dados.localidade, uf: dados.uf })
                .catch(() => null);
            status.textContent = '';
        } catch (erro) {
            console.error('Erro na busca do CEP:', erro);
        }
    });
});

// exportados para poderem ser exercitados fora da tela logada (testes)
export { montarTags, mostrarVisualizacao, abrirEdicao, lerEdicao, ITENS_DO_PERFIL, MODALIDADES, ESTILOS, MAXIMO_ESTILOS };
