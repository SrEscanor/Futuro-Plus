// Página de uma instituição (instituicao.html?u=<id da unidade>): o cadastro
// da unidade, os cursos, os comentários e notas de quem estudou lá e as
// dúvidas. O desenho vem de instituicao-visao.js; o banco, de
// instituicao-dados.js, o único arquivo que fala com o Firebase.
import {
    apagarComentario, apagarPergunta, apagarResposta, criarPergunta, lerAvaliacao, lerComentarios,
    lerMeusComentarios, lerPerguntas, lerUnidade, observarConta, responderPergunta, salvarComentario
} from './instituicao-dados.js';
import { LIMITES, cursosDaUnidade, perguntasFixas, primeiroNome, problemaNoTexto } from './instituicao-util.js';
import {
    htmlCapa, htmlCapaSimples, htmlCursos, htmlDuvidas, htmlNaoEncontrada, htmlNumeros, htmlQuemEstudou, htmlSobre
} from './instituicao-visao.js';

const elemento = (id) => document.getElementById(id);

const estado = {
    id: '',
    unidade: null,
    cursos: [],
    todosOsCursos: false,
    avaliacao: undefined,          // { media, total }; undefined enquanto carrega, null se falhou
    comentarios: [],
    cursorComentarios: null,
    haMaisComentarios: false,
    meusComentarios: [],
    editandoId: null,
    fixas: [],
    perguntas: [],
    cursorPerguntas: null,
    haMaisPerguntas: false,
    abertas: new Set(),            // dúvidas abertas: continuam abertas quando a lista é redesenhada
    perguntando: false,
    respondendo: '',               // id da pergunta com o campo de resposta aberto
    textoResposta: '',
    conta: { logado: false, carregando: true }
};

// ---- Desenho ----

// Recalcula quais certificados ainda não têm comentário desta conta, depois
// de criar, editar ou apagar um comentário (cada certificado dá direito a um).
function atualizarCertificadosDisponiveis() {
    const usados = new Set(estado.meusComentarios.map((c) => c.certificadoId));
    estado.conta = {
        ...estado.conta,
        certificadosDisponiveis: (estado.conta.certificados || []).filter((cert) => !usados.has(cert.id))
    };
}

function desenharNumeros() {
    elemento('inst-numeros').innerHTML = htmlNumeros(estado.unidade, estado.cursos, estado.avaliacao);
}

function desenharCursos() {
    elemento('inst-cursos').innerHTML = htmlCursos(estado.cursos, { todos: estado.todosOsCursos });
}

function desenharComentarios() {
    elemento('quem-estudou').innerHTML = htmlQuemEstudou({
        comentarios: estado.comentarios,
        total: estado.avaliacao ? estado.avaliacao.total : estado.comentarios.length,
        haMais: estado.haMaisComentarios,
        conta: estado.conta,
        meusComentarios: estado.meusComentarios,
        editandoId: estado.editandoId
    });
}

function desenharDuvidas() {
    elemento('duvidas').innerHTML = htmlDuvidas({
        fixas: estado.fixas,
        perguntas: estado.perguntas,
        haMais: estado.haMaisPerguntas,
        conta: estado.conta,
        abertas: estado.abertas,
        perguntando: estado.perguntando,
        respondendo: estado.respondendo,
        textoResposta: estado.textoResposta
    });
}

// Média e total mudam na hora, sem ler de novo do banco.
function mudarNota({ somar = null, tirar = null }) {
    const atual = estado.avaliacao || { media: 0, total: 0 };
    let soma = atual.media * atual.total;
    let total = atual.total;
    if (tirar != null) { soma -= tirar; total -= 1; }
    if (somar != null) { soma += somar; total += 1; }
    total = Math.max(0, total);
    estado.avaliacao = { media: total ? soma / total : 0, total };
    desenharNumeros();
}

function naoEncontrada(titulo, texto) {
    document.title = 'Futuro+ | Instituições';
    elemento('inst-capa-miolo').innerHTML = htmlCapaSimples(titulo);
    elemento('inst-carregando').outerHTML = htmlNaoEncontrada(texto);
}

// Quem chega por um link com #quem-estudou ou #duvidas (Perfil, Mural) vai
// direto para a parte certa, que só existe depois de desenhada.
function irParaOAncora() {
    const alvo = location.hash.length > 1 && document.getElementById(decodeURIComponent(location.hash.slice(1)));
    if (alvo) alvo.scrollIntoView({ block: 'start' });
}

const focar = (seletor) => setTimeout(() => document.querySelector(seletor)?.focus(), 0);

// ---- Formulários ----

function mostrarErro(form, texto) {
    const aviso = form.querySelector('.inst-form-erro');
    aviso.textContent = texto;
    aviso.hidden = false;
}

function travar(form, texto) {
    const botao = form.querySelector('button[type="submit"]');
    botao.dataset.rotulo = botao.textContent;
    botao.disabled = true;
    botao.textContent = texto;
}

function destravar(form) {
    const botao = form.querySelector('button[type="submit"]');
    botao.disabled = false;
    botao.textContent = botao.dataset.rotulo || botao.textContent;
}

// permission-denied: as regras do Firestore recusaram (certificado que saiu
// do Mural, e-mail não confirmado...); o resto quase sempre é conexão.
function mensagemDeErro(erro, recusa) {
    console.error(erro);
    return erro?.code === 'permission-denied' ? recusa : 'Não deu para salvar agora. Confira a conexão e tente de novo.';
}

const RECUSA_DO_CERTIFICADO = 'O servidor não aceitou. Confira se o certificado desta unidade continua no seu Mural e tente de novo.';

async function enviarComentario(form) {
    const nota = Number(form.querySelector('input[name="nota"]:checked')?.value || 0);
    const texto = form.querySelector('textarea').value;
    const certificadoId = form.querySelector('#comentario-certificado')?.value || '';
    const problema = !nota ? 'Escolha uma nota de 1 a 5.'
        : !certificadoId ? 'Não encontrei o certificado para este comentário. Atualize a página e tente de novo.'
            : problemaNoTexto(texto, LIMITES.comentario);
    if (problema) return mostrarErro(form, problema);

    const anterior = estado.editandoId ? estado.meusComentarios.find((c) => c.id === estado.editandoId) : null;
    travar(form, 'Salvando...');
    try {
        const salvo = await salvarComentario(estado.id, estado.conta, { texto, nota, certificadoId }, anterior);
        estado.meusComentarios = [...estado.meusComentarios.filter((c) => c.id !== salvo.id), salvo];
        estado.comentarios = estado.comentarios.filter((c) => c.id !== salvo.id);
        estado.editandoId = null;
        mudarNota(anterior ? { tirar: anterior.nota, somar: nota } : { somar: nota });
        atualizarCertificadosDisponiveis();
        desenharComentarios();
    } catch (erro) {
        mostrarErro(form, mensagemDeErro(erro, RECUSA_DO_CERTIFICADO));
        destravar(form);
    }
}

async function apagarUmComentario(id, botao) {
    const proprio = estado.meusComentarios.some((c) => c.id === id);
    const comentario = proprio ? estado.meusComentarios.find((c) => c.id === id) : estado.comentarios.find((c) => c.id === id);
    const pergunta = proprio
        ? 'Apagar o seu comentário e a sua nota?'
        : `Apagar o comentário de ${primeiroNome(comentario?.nome) || 'quem escreveu'}?`;
    if (!confirm(pergunta)) return;
    botao.disabled = true;
    try {
        await apagarComentario(estado.id, id);
        estado.comentarios = estado.comentarios.filter((c) => c.id !== id);
        if (proprio) {
            estado.meusComentarios = estado.meusComentarios.filter((c) => c.id !== id);
            if (estado.editandoId === id) estado.editandoId = null;
            atualizarCertificadosDisponiveis();
        }
        if (comentario?.nota) mudarNota({ tirar: comentario.nota });
        desenharComentarios();
    } catch (erro) {
        botao.disabled = false;
        alert(mensagemDeErro(erro, 'O servidor não aceitou apagar este comentário.'));
    }
}

async function maisComentarios(botao) {
    botao.disabled = true;
    try {
        const { itens, cursor, haMais } = await lerComentarios(estado.id, { depois: estado.cursorComentarios });
        const vistos = new Set(estado.comentarios.map((c) => c.id));
        estado.comentarios.push(...itens.filter((c) => !vistos.has(c.id)));
        estado.cursorComentarios = cursor;
        estado.haMaisComentarios = haMais;
        desenharComentarios();
    } catch (erro) {
        console.error('Erro ao ler mais comentários:', erro);
        botao.disabled = false;
    }
}

const acharPergunta = (id) => estado.perguntas.find((p) => p.id === id);

async function enviarPergunta(form) {
    const texto = form.querySelector('textarea').value;
    const problema = problemaNoTexto(texto, LIMITES.pergunta);
    if (problema) return mostrarErro(form, problema);
    travar(form, 'Enviando...');
    try {
        const nova = await criarPergunta(estado.id, estado.conta, texto);
        estado.perguntas = [nova, ...estado.perguntas];
        estado.perguntando = false;
        estado.abertas.add(nova.id);
        desenharDuvidas();
    } catch (erro) {
        mostrarErro(form, mensagemDeErro(erro, 'O servidor não aceitou a pergunta. Confirme o e-mail da sua conta e tente de novo.'));
        destravar(form);
    }
}

async function enviarResposta(form, perguntaId) {
    const texto = form.querySelector('textarea').value;
    const problema = problemaNoTexto(texto, LIMITES.resposta);
    if (problema) return mostrarErro(form, problema);
    travar(form, 'Salvando...');
    try {
        const resposta = await responderPergunta(estado.id, perguntaId, estado.conta, texto);
        const pergunta = acharPergunta(perguntaId);
        pergunta.respostas = { ...(pergunta.respostas || {}), [estado.conta.uid]: resposta };
        estado.respondendo = '';
        estado.textoResposta = '';
        estado.abertas.add(perguntaId);
        desenharDuvidas();
    } catch (erro) {
        mostrarErro(form, mensagemDeErro(erro, estado.conta.certificados?.length ? RECUSA_DO_CERTIFICADO : 'O servidor não aceitou a resposta.'));
        destravar(form);
    }
}

async function apagarUmaResposta(perguntaId, uid, botao) {
    const pergunta = acharPergunta(perguntaId);
    if (!pergunta) return;
    const propria = uid === estado.conta.uid;
    const quem = pergunta.respostas?.[uid]?.equipe ? 'da Equipe Futuro+' : `de ${primeiroNome(pergunta.respostas?.[uid]?.nome) || 'quem respondeu'}`;
    if (!confirm(propria ? 'Apagar a sua resposta?' : `Apagar a resposta ${quem}?`)) return;
    botao.disabled = true;
    try {
        await apagarResposta(estado.id, perguntaId, uid);
        const respostas = { ...(pergunta.respostas || {}) };
        delete respostas[uid];
        pergunta.respostas = respostas;
        desenharDuvidas();
    } catch (erro) {
        botao.disabled = false;
        alert(mensagemDeErro(erro, 'O servidor não aceitou apagar esta resposta.'));
    }
}

async function apagarUmaPergunta(perguntaId, botao) {
    const pergunta = acharPergunta(perguntaId);
    if (!pergunta) return;
    const temRespostas = Object.keys(pergunta.respostas || {}).length > 0;
    if (!confirm(temRespostas ? 'Apagar esta pergunta? As respostas somem junto.' : 'Apagar esta pergunta?')) return;
    botao.disabled = true;
    try {
        await apagarPergunta(estado.id, perguntaId);
        estado.perguntas = estado.perguntas.filter((p) => p.id !== perguntaId);
        estado.abertas.delete(perguntaId);
        desenharDuvidas();
    } catch (erro) {
        botao.disabled = false;
        alert(mensagemDeErro(erro, 'O servidor não aceitou apagar esta pergunta.'));
    }
}

async function maisPerguntas(botao) {
    botao.disabled = true;
    try {
        const { itens, cursor, haMais } = await lerPerguntas(estado.id, { depois: estado.cursorPerguntas });
        const vistas = new Set(estado.perguntas.map((p) => p.id));
        estado.perguntas.push(...itens.filter((p) => !vistas.has(p.id)));
        estado.cursorPerguntas = cursor;
        estado.haMaisPerguntas = haMais;
        desenharDuvidas();
    } catch (erro) {
        console.error('Erro ao ler mais perguntas:', erro);
        botao.disabled = false;
    }
}

// ---- Cliques e envios (delegados: o HTML de cada parte é refeito) ----

function aoClicarEmComentarios(evento) {
    const botao = evento.target.closest('[data-acao]');
    if (!botao) return;
    switch (botao.dataset.acao) {
        case 'editar-comentario':
            estado.editandoId = botao.dataset.id;
            desenharComentarios();
            focar('#comentario-texto');
            break;
        case 'cancelar-comentario':
            estado.editandoId = null;
            desenharComentarios();
            break;
        case 'apagar-comentario':
            apagarUmComentario(botao.dataset.id, botao);
            break;
        case 'mais-comentarios':
            maisComentarios(botao);
            break;
    }
}

function aoClicarEmDuvidas(evento) {
    const botao = evento.target.closest('[data-acao]');
    if (!botao) return;
    const perguntaId = botao.dataset.pergunta || '';
    switch (botao.dataset.acao) {
        case 'perguntar':
            estado.perguntando = true;
            desenharDuvidas();
            focar('#pergunta-texto');
            break;
        case 'cancelar-pergunta':
            estado.perguntando = false;
            desenharDuvidas();
            break;
        case 'responder':
        case 'editar-resposta':
            estado.respondendo = perguntaId;
            estado.textoResposta = botao.dataset.acao === 'editar-resposta'
                ? acharPergunta(perguntaId)?.respostas?.[estado.conta.uid]?.texto || ''
                : '';
            estado.abertas.add(perguntaId);
            desenharDuvidas();
            focar(`#resposta-${CSS.escape(perguntaId)}`);
            break;
        case 'cancelar-resposta':
            estado.respondendo = '';
            estado.textoResposta = '';
            desenharDuvidas();
            break;
        case 'apagar-resposta':
            apagarUmaResposta(perguntaId, botao.dataset.uid, botao);
            break;
        case 'apagar-pergunta':
            apagarUmaPergunta(perguntaId, botao);
            break;
        case 'mais-perguntas':
            maisPerguntas(botao);
            break;
    }
}

function atualizarContador(evento) {
    if (evento.target.tagName !== 'TEXTAREA') return;
    const contador = evento.target.closest('form')?.querySelector('[data-contador]');
    if (contador) contador.textContent = `${evento.target.value.length}/${evento.target.maxLength}`;
}

function ligarEventos() {
    elemento('inst-cursos').addEventListener('click', (evento) => {
        if (!evento.target.closest('[data-acao="todos-os-cursos"]')) return;
        estado.todosOsCursos = true;
        desenharCursos();
    });

    const comentarios = elemento('quem-estudou');
    comentarios.addEventListener('click', aoClicarEmComentarios);
    comentarios.addEventListener('submit', (evento) => {
        if (evento.target.id !== 'form-comentario') return;
        evento.preventDefault();
        enviarComentario(evento.target);
    });

    const duvidas = elemento('duvidas');
    duvidas.addEventListener('click', aoClicarEmDuvidas);
    duvidas.addEventListener('submit', (evento) => {
        const form = evento.target;
        if (form.id === 'form-pergunta') {
            evento.preventDefault();
            enviarPergunta(form);
        } else if (form.dataset.form === 'resposta') {
            evento.preventDefault();
            enviarResposta(form, form.dataset.pergunta);
        }
    });
    // "toggle" não sobe pela árvore: só na captura dá para ouvir aqui em cima
    duvidas.addEventListener('toggle', (evento) => {
        const detalhe = evento.target;
        if (!detalhe.matches?.('details[data-pergunta]')) return;
        if (detalhe.open) estado.abertas.add(detalhe.dataset.pergunta);
        else estado.abertas.delete(detalhe.dataset.pergunta);
    }, true);

    comentarios.addEventListener('input', atualizarContador);
    duvidas.addEventListener('input', atualizarContador);
}

// ---- Início ----

async function iniciar() {
    const id = new URLSearchParams(location.search).get('u') || '';
    if (!id || id.includes('/')) {
        naoEncontrada('Instituição não encontrada', 'O endereço está incompleto. Escolha a unidade na lista de instituições.');
        return;
    }
    estado.id = id;

    let unidade = null;
    try {
        unidade = await lerUnidade(id);
    } catch (erro) {
        console.error('Erro ao ler a unidade:', erro);
        naoEncontrada('Não deu para abrir esta instituição', 'Confira a conexão e tente de novo em instantes.');
        return;
    }
    if (!unidade) {
        naoEncontrada('Instituição não encontrada', 'A unidade pode ter saído do cadastro. Procure por ela na lista de instituições.');
        return;
    }

    estado.unidade = unidade;
    estado.cursos = cursosDaUnidade(unidade);
    estado.fixas = perguntasFixas(unidade, estado.cursos);
    document.title = `Futuro+ | ${unidade.nome}`;
    elemento('inst-capa-miolo').innerHTML = htmlCapa(unidade, estado.cursos);
    desenharNumeros();
    elemento('inst-sobre').innerHTML = htmlSobre(unidade, estado.cursos);
    desenharCursos();
    desenharComentarios();
    desenharDuvidas();
    elemento('inst-carregando').hidden = true;
    elemento('inst-conteudo').hidden = false;
    ligarEventos();
    irParaOAncora();

    // as leituras correm juntas; cada uma redesenha a sua parte quando chega
    lerAvaliacao(id)
        .then((avaliacao) => { estado.avaliacao = avaliacao; })
        .catch((erro) => {
            console.error('Erro ao ler a média das notas:', erro);
            estado.avaliacao = null;
        })
        .finally(() => {
            desenharNumeros();
            desenharComentarios();
        });

    lerComentarios(id)
        .then(({ itens, cursor, haMais }) => {
            estado.comentarios = itens;
            estado.cursorComentarios = cursor;
            estado.haMaisComentarios = haMais;
            desenharComentarios();
            if (location.hash === '#quem-estudou') irParaOAncora();
        })
        .catch((erro) => console.error('Erro ao ler os comentários:', erro));

    lerPerguntas(id)
        .then(({ itens, cursor, haMais }) => {
            estado.perguntas = itens;
            estado.cursorPerguntas = cursor;
            estado.haMaisPerguntas = haMais;
            desenharDuvidas();
        })
        .catch((erro) => console.error('Erro ao ler as dúvidas:', erro));

    observarConta(id, async (conta) => {
        estado.editandoId = null;
        estado.respondendo = '';
        estado.perguntando = false;
        estado.meusComentarios = [];
        // só quem tem certificado desta unidade pode ter comentário que não
        // esteja entre os primeiros da lista: aí vale ler direto
        if (conta.logado && conta.certificados?.length) {
            try {
                estado.meusComentarios = await lerMeusComentarios(id, conta.uid);
            } catch (erro) {
                console.error('Erro ao ler os seus comentários:', erro);
            }
        }
        estado.conta = conta;
        atualizarCertificadosDisponiveis();
        desenharComentarios();
        desenharDuvidas();
    });
}

document.addEventListener('DOMContentLoaded', iniciar);
