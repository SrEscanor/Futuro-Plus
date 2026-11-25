// Painel Admin · Termos e Privacidade: página à parte do painel (fora do
// menu das outras páginas). Edita os dois textos que toda conta aceita no
// cadastro, publica só o que mudou e mostra o histórico de cada publicação,
// com o texto daquela versão.
//
// Publicar sobe a versão do documento, e o gate-termos.js pede que quem já
// tinha aceitado aceite de novo. Antes, a pessoa confirma a senha (ou o
// Google). Os dados chegam só por termos-dados.js (o roteiro de teste troca
// esse arquivo por uma cópia de mentira).
import {
    DOCUMENTOS, confirmarIdentidade, lerDocumento, listarHistoricoPagina, observarAdmin, publicarDocumentos,
    sairDaConta
} from './termos-dados.js';
import { PRIVACIDADE_PADRAO, TERMOS_PADRAO } from './conteudo-legal-padrao.js';
import { campoQuem, historicoComFiltros } from './historico-filtros.js';
import { dataHora, haQuantoTempo } from './noticias-proprias-util.js';
import urlDoVisualDoSite from '../css/legal.css?url';

const el = (id) => document.getElementById(id);
const CHAVES = Object.keys(DOCUMENTOS);
const PADRAO = { termos: TERMOS_PADRAO, privacidade: PRIVACIDADE_PADRAO };

const estado = {
    iniciado: false,
    aba: 'termos',              // 'termos', 'privacidade' ou 'historico'
    // o que está no ar: { versao (0 = nunca publicado), html, atualizadoEm, atualizadoPorEmail }
    noAr: { termos: null, privacidade: null },
    publicando: false,
    janela: null,               // o registro do histórico aberto em "Ver texto"
    registros: new Map()        // id -> registro do histórico já carregado
};

function escapeHtml(texto) {
    return String(texto ?? '').replace(/[&<>"']/g, (c) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
}

const textoDoEditor = (chave) => el(`conteudo-${chave}`).value;
const mudou = (chave) => Boolean(estado.noAr[chave]) && textoDoEditor(chave) !== estado.noAr[chave].html;
const mudados = () => CHAVES.filter(mudou);

// "os Termos de Uso", "a Política de Privacidade"
const comArtigo = (chave) => (chave === 'termos' ? 'os Termos de Uso' : 'a Política de Privacidade');

// tipo: 'ok', 'erro' ou vazio (aviso neutro)
function mostrarStatus(texto, tipo = '') {
    const caixa = el('status-publicacao');
    caixa.textContent = texto;
    caixa.className = `status-importacao termos-status${tipo ? ` status-importacao--${tipo}` : ''}`;
    caixa.hidden = !texto;
}

// ========================================================
// Desenho
// ========================================================

function desenharCartoes() {
    for (const chave of CHAVES) {
        const cartao = el(`cartao-${chave}`);
        const noAr = estado.noAr[chave];
        const alterado = mudou(chave);
        let situacao = 'Carregando…';
        if (noAr?.versao) {
            situacao = `Versão ${noAr.versao}`
                + (noAr.atualizadoEm ? ` · publicada em ${dataHora(noAr.atualizadoEm)}` : '')
                + (noAr.atualizadoPorEmail ? ` por ${noAr.atualizadoPorEmail}` : '');
        } else if (noAr) {
            situacao = 'Ainda não publicada: o site mostra o texto padrão.';
        }
        cartao.querySelector('[data-situacao]').textContent = situacao;
        const selo = cartao.querySelector('[data-selo]');
        selo.hidden = !noAr;
        selo.textContent = alterado ? (chave === 'termos' ? 'Alterado, não publicado' : 'Alterada, não publicada') : 'Sem mudanças';
        selo.className = `termo-selo termo-selo--${alterado ? 'mudou' : 'ok'}`;
        cartao.classList.toggle('termo-cartao--mudou', alterado);
    }
}

function desenharAbas() {
    document.querySelectorAll('.aba-admin[data-aba]').forEach((aba) => {
        const ativa = aba.dataset.aba === estado.aba;
        aba.classList.toggle('aba-admin--ativa', ativa);
        aba.setAttribute('aria-selected', String(ativa));
        aba.tabIndex = ativa ? 0 : -1;
        const ponto = aba.querySelector('[data-ponto]');
        if (ponto) ponto.hidden = !mudou(aba.dataset.aba);
    });
    const historico = estado.aba === 'historico';
    el('painel-editor').hidden = historico;
    el('painel-historico').hidden = !historico;
    if (!historico) el('painel-editor').setAttribute('aria-labelledby', `aba-${estado.aba}`);
    for (const chave of CHAVES) el(`conteudo-${chave}`).hidden = chave !== estado.aba;
}

function desenharEditor() {
    if (estado.aba === 'historico') return;
    const chave = estado.aba;
    const caracteres = textoDoEditor(chave).length.toLocaleString('pt-BR');
    el('editor-info').innerHTML = `<strong>${escapeHtml(DOCUMENTOS[chave].titulo)}</strong> · HTML · ${caracteres} caracteres`;
    el('btn-desfazer').disabled = !mudou(chave) || estado.publicando;
}

function desenharPublicar() {
    const lista = mudados();
    const carregado = CHAVES.every((chave) => estado.noAr[chave]);
    el('publicar-lista').innerHTML = !carregado ? '<li class="termo-publicar-fica">Carregando…</li>' : CHAVES.map((chave) => {
        const { titulo } = DOCUMENTOS[chave];
        const versao = estado.noAr[chave].versao;
        if (!lista.includes(chave)) {
            return `<li class="termo-publicar-fica">${escapeHtml(titulo)}: sem mudanças${versao ? `, continua na versão ${versao}` : ''}</li>`;
        }
        return `<li><strong>${escapeHtml(titulo)}</strong> <span class="termo-versao">${versao
            ? `versão ${versao} → ${versao + 1}` : 'primeira versão'}</span></li>`;
    }).join('');

    let aviso = 'Nada mudou desde a última publicação. Edite um dos textos acima para publicar uma versão nova.';
    if (lista.length) {
        const quais = lista.length === 2 ? 'os dois documentos' : (lista[0] === 'termos' ? 'os Termos' : 'a política');
        aviso = `Quem já tinha aceitado ${quais} vai ver um aviso obrigatório na próxima vez que entrar e só continua `
            + 'usando o site depois de aceitar de novo. Não dá para desfazer. A publicação fica no histórico, com o seu '
            + 'e-mail e o texto completo.';
    }
    el('publicar-aviso').textContent = aviso;

    const botao = el('btn-publicar-termos');
    botao.disabled = !lista.length || estado.publicando;
    botao.textContent = estado.publicando ? 'Publicando...'
        : lista.length === 2 ? 'Publicar os dois documentos'
            : lista.length ? `Publicar ${comArtigo(lista[0])}` : 'Publicar';
}

function desenharTudo() {
    desenharCartoes();
    desenharAbas();
    desenharEditor();
    desenharPublicar();
}

// ========================================================
// Leitura
// ========================================================

async function carregarDocumentos() {
    const lidos = await Promise.all(CHAVES.map((chave) => lerDocumento(chave)));
    CHAVES.forEach((chave, indice) => {
        const noAr = lidos[indice] || { versao: 0, html: PADRAO[chave], atualizadoEm: null, atualizadoPorEmail: '' };
        estado.noAr[chave] = noAr;
        el(`conteudo-${chave}`).value = noAr.html;
    });
    desenharTudo();
}

// ---- histórico ----

function linhaDoHistorico(registro) {
    const versao = Number(registro.versao) || 0;
    const anterior = Number(registro.versaoAnterior) || 0;
    return `
        <tr>
            <td class="historico-quando"><strong>${escapeHtml(dataHora(registro.em))}</strong><small>${escapeHtml(haQuantoTempo(registro.em))}</small></td>
            <td class="historico-quem">${escapeHtml(registro.email || '—')}</td>
            <td><span class="historico-acao historico-acao--positiva">publicou a versão ${versao}</span>
                <small class="historico-detalhe">${anterior ? `antes: versão ${anterior}` : 'primeira publicação'}</small></td>
            <td><span class="termo-doc">${escapeHtml(registro.titulo || DOCUMENTOS[registro.documento]?.titulo || '')}</span></td>
            <td class="termo-ver"><button type="button" class="btn btn-secundario" data-ver="${escapeHtml(registro.id)}"
                aria-label="Ver o texto da versão ${versao} de ${escapeHtml(registro.titulo || '')}">Ver texto</button></td>
        </tr>`;
}

function desenharHistorico(registros, { filtrando, carregando, erro }) {
    registros.forEach((registro) => estado.registros.set(registro.id, registro));
    const vazio = (texto) => `<tr><td colspan="5" class="tabela-vazia">${texto}</td></tr>`;
    let html;
    if (carregando) html = vazio('Carregando histórico...');
    else if (erro) html = vazio('Não foi possível carregar o histórico agora.');
    else if (registros.length) html = registros.map(linhaDoHistorico).join('');
    else html = vazio(filtrando ? 'Nenhum registro com esses filtros.'
        : 'Nada registrado ainda. O histórico começa na próxima publicação.');
    el('historico-corpo').innerHTML = html;
}

// A barra de filtros (busca, Quando, Quem e Documento) é montada na
// primeira vez que a aba abre; nas outras, só lê de novo.
let historico = null;
function carregarHistorico() {
    historico ||= historicoComFiltros({
        barra: el('historico-filtros'),
        botaoMais: el('historico-mais'),
        buscarPagina: (cursor) => listarHistoricoPagina({ depois: cursor }),
        desenhar: desenharHistorico,
        busca: { dica: 'Documento, e-mail ou texto…', texto: (r) => `${r.titulo || ''} ${r.email || ''} ${r.html || ''}` },
        campos: [
            campoQuem(),
            {
                chave: 'documento',
                rotulo: 'Documento',
                todos: 'Os dois',
                opcoes: () => CHAVES.map((chave) => [chave, DOCUMENTOS[chave].titulo]),
                testar: (registro, valor) => registro.documento === valor
            }
        ]
    });
    historico.recarregar();
}

// ========================================================
// Ações
// ========================================================

function abrirAba(aba) {
    if (aba !== 'historico' && !CHAVES.includes(aba)) return;
    estado.aba = aba;
    desenharTudo();
    if (aba === 'historico') carregarHistorico();
}

function desfazer() {
    const chave = estado.aba;
    if (!mudou(chave)) return;
    if (!confirm(`Voltar ${comArtigo(chave)} para o texto que está no ar? O que você mudou aqui se perde.`)) return;
    el(`conteudo-${chave}`).value = estado.noAr[chave].html;
    desenharTudo();
    mostrarStatus(`${chave === 'termos' ? 'Os Termos de Uso voltaram' : 'A Política de Privacidade voltou'} para o texto que está no ar.`);
}

// ---- a janela com o texto formatado ----

// O texto com o visual da página do site, num iframe sem scripts: o HTML é
// o que a pessoa escreveu (ou o de uma versão antiga) e fica isolado do
// painel. Link abre em outra aba.
function documentoFormatado(html) {
    return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><base target="_blank">
        <link rel="stylesheet" href="${escapeHtml(new URL(urlDoVisualDoSite, location.href).href)}"></head>
        <body><main class="legal-conteudo">${html}</main></body></html>`;
}

function abrirJanela({ titulo, sub, html, registro = null }) {
    estado.janela = registro;
    el('termos-janela-titulo').textContent = titulo;
    el('termos-janela-sub').textContent = sub;
    el('termos-janela-sub').hidden = !sub;
    el('termos-janela-texto').srcdoc = documentoFormatado(html);
    el('termos-janela-copiar').hidden = !registro;
    el('termos-janela').classList.add('aberto');
    el('termos-janela-ok').focus();
}

let focoAntesDaJanela = null;
function fecharJanela() {
    el('termos-janela').classList.remove('aberto');
    estado.janela = null;
    focoAntesDaJanela?.focus?.();
    focoAntesDaJanela = null;
}

function verComoFica() {
    const chave = estado.aba;
    focoAntesDaJanela = el('btn-ver-como-fica');
    abrirJanela({
        titulo: `Como fica no site · ${DOCUMENTOS[chave].titulo}`,
        sub: mudou(chave) ? 'Com as mudanças que ainda não foram publicadas.' : 'O mesmo texto que está no ar.',
        html: textoDoEditor(chave)
    });
}

function verVersao(id, botao) {
    const registro = estado.registros.get(id);
    if (!registro) return;
    focoAntesDaJanela = botao;
    abrirJanela({
        titulo: `${registro.titulo || DOCUMENTOS[registro.documento]?.titulo || 'Documento'} · versão ${registro.versao}`,
        sub: `Publicada em ${dataHora(registro.em)}${registro.email ? ` por ${registro.email}` : ''}.`,
        html: registro.html || '',
        registro
    });
}

// Leva o texto de uma versão antiga para o editor (para voltar a ela, é só
// publicar depois de conferir).
function copiarParaOEditor() {
    const registro = estado.janela;
    if (!registro || !CHAVES.includes(registro.documento)) return;
    const chave = registro.documento;
    if (mudou(chave) && !confirm(`${chave === 'termos' ? 'Os Termos de Uso têm' : 'A Política de Privacidade tem'} mudanças `
        + 'não publicadas no editor. Trocar pelo texto desta versão?')) return;
    const campo = el(`conteudo-${chave}`);
    campo.value = registro.html || '';
    focoAntesDaJanela = null;
    fecharJanela();
    abrirAba(chave);
    // o texto novo começa do alto, não de onde o cursor parou
    campo.focus();
    campo.setSelectionRange(0, 0);
    campo.scrollTop = 0;
    mostrarStatus(`O texto da versão ${registro.versao} foi para o editor. Confira e publique para ele valer no site.`, 'ok');
}

// ---- publicar ----

async function publicar() {
    const lista = mudados();
    if (!lista.length || estado.publicando) return;
    const nomes = lista.map((chave) => DOCUMENTOS[chave].titulo).join(' e ');
    if (!confirm(`Publicar ${lista.length === 2 ? 'os dois documentos' : comArtigo(lista[0])} (${nomes})? `
        + 'Quem já tinha aceitado vai precisar aceitar de novo para continuar usando o site.')) return;

    estado.publicando = true;
    desenharTudo();
    mostrarStatus('Confirmando sua identidade...');
    try {
        await confirmarIdentidade(el('confirmar-senha-admin').value);
    } catch (erro) {
        console.error('Erro ao confirmar a identidade:', erro);
        estado.publicando = false;
        desenharTudo();
        mostrarStatus(erro.code === 'senha-necessaria'
            ? 'Digite sua senha para confirmar.' : 'Senha incorreta ou confirmação cancelada.', 'erro');
        if (erro.code === 'senha-necessaria') el('confirmar-senha-admin').focus();
        return;
    }

    mostrarStatus('Publicando...');
    let novas;
    try {
        novas = await publicarDocumentos(lista.map((chave) => ({
            chave, html: textoDoEditor(chave), versaoBase: estado.noAr[chave].versao
        })));
    } catch (erro) {
        console.error('Erro ao publicar:', erro);
        estado.publicando = false;
        desenharTudo();
        mostrarStatus(erro.code === 'versao-mudou'
            ? `${erro.message} Copie o seu texto, recarregue a página e confira o que mudou antes de publicar.`
            : 'Não consegui publicar agora. Tente de novo.', 'erro');
        return;
    }

    // o que foi publicado passa a ser o que está no ar
    const agora = new Date().toISOString();
    for (const chave of lista) {
        estado.noAr[chave] = {
            versao: novas[chave], html: textoDoEditor(chave), atualizadoEm: agora,
            atualizadoPorEmail: el('admin-email').textContent || ''
        };
    }
    estado.publicando = false;
    el('confirmar-senha-admin').value = '';
    desenharTudo();
    const feito = lista.map((chave) => `${DOCUMENTOS[chave].titulo} na versão ${novas[chave]}`).join(' e ');
    mostrarStatus(`Publicado: ${feito}. Quem já tinha aceitado vai ver o aviso para aceitar de novo.`, 'ok');
}

// ========================================================
// Eventos e login
// ========================================================

function ligarEventos() {
    el('logout-btn').addEventListener('click', async () => {
        await sairDaConta();
        window.location.href = 'login.html';
    });

    // abas: clique ou setas do teclado
    const abas = [...document.querySelectorAll('.aba-admin[data-aba]')];
    abas.forEach((aba, indice) => {
        aba.addEventListener('click', () => abrirAba(aba.dataset.aba));
        aba.addEventListener('keydown', (evento) => {
            const passo = { ArrowRight: 1, ArrowLeft: -1 }[evento.key];
            if (!passo) return;
            evento.preventDefault();
            const vizinha = abas[(indice + passo + abas.length) % abas.length];
            vizinha.focus();
            abrirAba(vizinha.dataset.aba);
        });
    });

    for (const chave of CHAVES) {
        el(`conteudo-${chave}`).addEventListener('input', () => {
            desenharCartoes();
            desenharAbas();
            desenharEditor();
            desenharPublicar();
        });
    }
    el('btn-desfazer').addEventListener('click', desfazer);
    el('btn-ver-como-fica').addEventListener('click', verComoFica);
    el('btn-publicar-termos').addEventListener('click', publicar);
    el('confirmar-senha-admin').addEventListener('keydown', (evento) => {
        if (evento.key === 'Enter') publicar();
    });

    el('historico-corpo').addEventListener('click', (evento) => {
        const botao = evento.target.closest('[data-ver]');
        if (botao) verVersao(botao.dataset.ver, botao);
    });

    el('termos-janela-fechar').addEventListener('click', fecharJanela);
    el('termos-janela-ok').addEventListener('click', fecharJanela);
    el('termos-janela-copiar').addEventListener('click', copiarParaOEditor);
    el('termos-janela').addEventListener('click', (evento) => {
        if (evento.target === el('termos-janela')) fecharJanela();
    });
    document.addEventListener('keydown', (evento) => {
        if (evento.key === 'Escape' && el('termos-janela').classList.contains('aberto')) fecharJanela();
    });

    // texto mudado e não publicado: o navegador pergunta antes de sair
    window.addEventListener('beforeunload', (evento) => {
        if (mudados().length) evento.preventDefault();
    });
}

async function aoMudarLogin({ usuario, ehAdmin, entrouComGoogle }) {
    if (!usuario) {
        window.location.href = 'login.html';
        return;
    }
    if (!ehAdmin) {
        el('admin-app').style.display = 'none';
        el('acesso-negado').style.display = 'flex';
        return;
    }
    el('acesso-negado').style.display = 'none';
    el('admin-email').textContent = usuario.email || '';
    el('admin-app').style.display = 'block';
    // quem entrou com Google confirma pelo popup do Google, não por senha
    el('campo-senha-admin').hidden = entrouComGoogle;

    if (estado.iniciado) return;
    estado.iniciado = true;
    desenharTudo();
    try {
        await carregarDocumentos();
    } catch (erro) {
        console.error('Erro ao carregar os documentos:', erro);
        mostrarStatus('Não foi possível carregar os textos agora. Recarregue a página.', 'erro');
    }
}

ligarEventos();
observarAdmin(aoMudarLogin);
