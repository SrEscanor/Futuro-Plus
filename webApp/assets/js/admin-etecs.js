import { auth, db } from './firebase-config.js';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { localizarUnidade } from './geocodificacao.js';
import {
    collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, writeBatch
} from 'firebase/firestore';

const ETECS_COLLECTION = 'etecs';
// Caminhos absolutos servidos direto da pasta "public/" — o Vite copia esses
// arquivos sem processar, então funcionam mesmo referenciados como texto
// dentro do JS (diferente de um <img> estático no HTML, que o Vite empacota
// e renomeia automaticamente). Para trocar a imagem padrão das unidades sem
// logo, basta colocar o arquivo em webApp/public/etec-logo-padrao.png.
const LOGO_PADRAO = '/etec-logo-padrao.png';
const LOGO_FALLBACK = '/logo.png';

// URL da function que baixa o .zip oficial da Etec, extrai a logo e sobe pro
// Storage — mesmo padrão de troca localhost/produção usado no chatbot.
const EXTRAIR_LOGO_URL = (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
    ? 'http://127.0.0.1:5001/futuroplus-bce54/southamerica-east1/extrair_logo_etec'
    : 'https://southamerica-east1-futuroplus-bce54.cloudfunctions.net/extrair_logo_etec';

let etecsCache = [];
let editandoId = null;
let redesSociaisAtual = [];
let documentosAtual = [];
let cursosAtual = [];

// ========================================================
// Utilidades de texto (limpeza dos campos vindos do CSV)
// ========================================================

function limpar(txt) {
    return (txt || '').replace(/\s+/g, ' ').trim();
}

function escapeHtml(str) {
    return String(str ?? '').replace(/[&<>"']/g, (c) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
}

function urlSegura(url) {
    return /^https?:\/\//i.test(url || '') ? url : '';
}

function extrairNomeEmail(txt) {
    const t = txt || '';
    const emailMatch = t.match(/[\w.+-]+@[\w.-]+\.\w+/);
    const email = emailMatch ? emailMatch[0] : '';
    const nome = limpar(email ? t.replace(email, '') : t);
    return { nome, email };
}

function extrairTelefone(txt) {
    const partes = (txt || '').split(/Discagem Abreviada:/i);
    return {
        telefone: limpar(partes[0] || ''),
        discagemAbreviada: limpar(partes[1] || '')
    };
}

function extrairRedesSociais(txt) {
    const redes = ['Facebook', 'Instagram', 'Linkedin', 'Youtube', 'Tiktok', 'Whatsapp', 'X'];
    const regex = new RegExp(`\\b(${redes.join('|')})\\s*:\\s*(\\S+)`, 'gi');
    const out = [];
    let m;
    while ((m = regex.exec(txt || '')) !== null) {
        const rede = m[1].charAt(0).toUpperCase() + m[1].slice(1).toLowerCase();
        out.push({ rede, url: m[2] });
    }
    return out;
}

function extrairDocumentos(txt) {
    const regex = /([A-ZÀ-Ý][a-zà-ÿ]+(?:\s+de\s+[A-ZÀ-Ýa-zà-ÿ]+)+)\s*:\s*([^-]+?)\s*-\s*(https?:\/\/\S+)/g;
    const out = [];
    let m;
    while ((m = regex.exec(txt || '')) !== null) {
        out.push({ tipo: limpar(m[1]), descricao: limpar(m[2]), url: m[3].trim() });
    }
    return out;
}

const CATEGORIA_GATILHOS = ['Cursos Técnicos', 'Ensino Médio', 'Articulação dos Ensinos', 'Especialização Técnica'];

// Duas categorias podem aparecer coladas separadas só por espaços (sem curso
// entre elas), o que a heurística de transição minúscula->maiúscula não
// detecta (não há transição, só espaço). Aqui procuramos um novo cabeçalho
// começando no meio do token e quebramos ali também.
function dividirCabecalhosColados(tokens) {
    const resultado = [];
    for (const tok of tokens) {
        let restante = tok;
        while (true) {
            let menorIdx = -1;
            for (const gatilho of CATEGORIA_GATILHOS) {
                const idx = restante.toLowerCase().indexOf(gatilho.toLowerCase(), 1);
                if (idx !== -1 && (menorIdx === -1 || idx < menorIdx)) menorIdx = idx;
            }
            if (menorIdx === -1) {
                const limpo = restante.trim();
                if (limpo) resultado.push(limpo);
                break;
            }
            const antes = restante.slice(0, menorIdx).trim();
            if (antes) resultado.push(antes);
            restante = restante.slice(menorIdx);
        }
    }
    return resultado;
}

function extrairCursos(txt) {
    const t = (txt || '').trim();
    if (!t) return [];
    // "EaD" é uma sigla estilizada (Educação a Distância) com maiúscula no
    // meio da palavra, o que confundiria a heurística de fronteira abaixo.
    // Normalizamos para "Ead" antes de dividir e devolvemos a grafia
    // original depois de tokenizar.
    const normalizado = t.replace(/\bEaD(?=[A-ZÀ-Ú]|\b)/g, 'Ead');
    // O CSV concatena categoria+cursos sem separador algum. A principal pista
    // de fronteira entre itens é a transição de uma letra minúscula/dígito/")"
    // direto para uma maiúscula (sem espaço) — texto normal sempre tem
    // espaço antes de uma palavra capitalizada, exceto exatamente aí.
    const comSeparadores = normalizado.replace(/(?<=[a-zà-úçã0-9)])(?=[A-ZÀ-Ú])/g, '');
    const tokensBrutos = comSeparadores.split('')
        .map((s) => s.trim().replace(/\bEad\b/g, 'EaD'))
        .filter(Boolean);
    const tokens = dividirCabecalhosColados(tokensBrutos);

    const ehCategoria = (tok) =>
        /^Cursos T[ée]cnicos/i.test(tok) ||
        /^Ensino M[ée]dio/i.test(tok) ||
        /^Articula[cç][aã]o dos Ensinos/i.test(tok) ||
        /^Especializa[cç][aã]o T[ée]cnica/i.test(tok);

    const cursos = [];
    let categoriaAtual = '';
    for (const tok of tokens) {
        if (ehCategoria(tok)) {
            categoriaAtual = tok;
        } else if (categoriaAtual) {
            cursos.push({ categoria: categoriaAtual, nome: tok });
        }
    }
    return cursos;
}

function sanitizarId(texto) {
    const base = (texto || '').trim().replace(/[^a-zA-Z0-9_-]/g, '_');
    return base || `etec_${Date.now()}`;
}

// ========================================================
// Parser de CSV (";" delimitado, com campos entre aspas)
// ========================================================

function parseCsvLine(line) {
    const result = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const c = line[i];
        if (inQuotes) {
            if (c === '"') {
                if (line[i + 1] === '"') { cur += '"'; i++; }
                else inQuotes = false;
            } else {
                cur += c;
            }
        } else if (c === '"') {
            inQuotes = true;
        } else if (c === ';') {
            result.push(cur);
            cur = '';
        } else {
            cur += c;
        }
    }
    result.push(cur);
    return result;
}

function parseLinhaEtec(linha) {
    const campos = parseCsvLine(linha);
    if (campos.length < 17) return null;

    const [
        codigo, nome, historico, cnpj, regiao, municipio,
        direcaoTxt, direcaoAdmTxt, direcaoAcadTxt,
        telefoneTxt, aniversario, endereco, site,
        redesTxt, documentosTxt, logotipoZipTxt, cursosTxt
    ] = campos;

    if (!limpar(nome)) return null;

    const { telefone, discagemAbreviada } = extrairTelefone(telefoneTxt);

    return {
        codigo: limpar(codigo),
        nome: limpar(nome),
        historico: limpar(historico),
        cnpj: limpar(cnpj),
        regiao: limpar(regiao),
        municipio: limpar(municipio),
        endereco: limpar(endereco),
        site: limpar(site),
        aniversarioCidade: limpar(aniversario),
        telefone,
        discagemAbreviada,
        direcao: {
            geral: extrairNomeEmail(direcaoTxt),
            administrativa: extrairNomeEmail(direcaoAdmTxt),
            academica: extrairNomeEmail(direcaoAcadTxt),
        },
        redesSociais: extrairRedesSociais(redesTxt),
        documentos: extrairDocumentos(documentosTxt),
        cursos: extrairCursos(cursosTxt),
        // O campo "Logotipo" do CSV é um link para um .zip (não uma imagem
        // pronta) com a logo oficial da unidade em 3 versões. Guardamos o
        // link aqui para o botão "Extrair logos" processar depois — não
        // definimos logotipoUrl diretamente para não sobrescrever um link
        // que o admin já tenha cadastrado manualmente.
        logotipoZipUrl: urlSegura(limpar(logotipoZipTxt)),
    };
}

function csvParaEtecs(texto) {
    const semBom = texto.replace(/^﻿/, '');
    const linhas = semBom.split(/\r\n|\n|\r/).filter((l) => l.trim().length > 0);
    if (linhas.length < 2) return [];
    return linhas.slice(1).map(parseLinhaEtec).filter(Boolean);
}

// ========================================================
// Renderização
// ========================================================

const DESCRICAO_PRECISAO = {
    escola: 'Localizada pelo prédio da escola no mapa',
    numero: 'Localizada pela rua e número',
    rua: 'Localizada só pela rua',
    manual: 'Coordenadas informadas manualmente',
    cidade: 'Só o centro da cidade: confira o endereço ou cole as coordenadas'
};

// ok | so_cidade | nao_encontrada | nao_localizada
function situacaoLocalizacao(etec) {
    const loc = etec.localizacao;
    if (loc?.lat != null) return loc.precisao === 'cidade' ? 'so_cidade' : 'ok';
    // a falha só vale para o endereço tentado; se o admin corrigir, tenta de novo
    if (loc?.naoEncontrada && (loc.endereco || '') === (etec.endereco || '')) return 'nao_encontrada';
    return 'nao_localizada';
}

function indicadorLocalizacao(etec) {
    switch (situacaoLocalizacao(etec)) {
        case 'ok': return { icone: '📍', titulo: DESCRICAO_PRECISAO[etec.localizacao.precisao] || 'Localizada' };
        case 'so_cidade': return { icone: '≈', titulo: DESCRICAO_PRECISAO.cidade };
        case 'nao_encontrada': return { icone: '✕', titulo: 'Não encontrada pelo endereço: cole as coordenadas do Google Maps' };
        default: return { icone: '—', titulo: 'Ainda não localizada no mapa' };
    }
}

// Pendentes para o botão: nunca localizadas, ou cujo endereço mudou desde a
// última localização automática. Não encontradas não são repetidas (daria o
// mesmo resultado) e coordenadas manuais nunca são sobrescritas.
function precisaLocalizar(etec) {
    const situacao = situacaoLocalizacao(etec);
    if (situacao === 'nao_localizada') return true;
    if (situacao === 'nao_encontrada') return false;
    const loc = etec.localizacao;
    return loc.precisao !== 'manual' && (loc.endereco || '') !== (etec.endereco || '');
}

// Substitui o campo inteiro (updateDoc), para não sobrar marca de falha
// antiga junto de coordenadas novas, ou coordenadas velhas junto de uma falha.
function gravarLocalizacao(id, unidade, localizacao) {
    const valor = localizacao || {
        naoEncontrada: true,
        endereco: unidade.endereco || '',
        tentadoEm: new Date().toISOString()
    };
    return updateDoc(doc(db, ETECS_COLLECTION, id), { localizacao: valor }).then(() => valor);
}

let filtroSemLocalizacao = false;

function renderizarAlertaLocalizacao() {
    const alerta = document.getElementById('alerta-localizacao');
    const contagem = { so_cidade: 0, nao_encontrada: 0, nao_localizada: 0 };
    etecsCache.forEach((e) => {
        const situacao = situacaoLocalizacao(e);
        if (situacao !== 'ok') contagem[situacao]++;
    });
    const total = contagem.so_cidade + contagem.nao_encontrada + contagem.nao_localizada;

    alerta.hidden = total === 0;
    if (total === 0) {
        filtroSemLocalizacao = false;
        return;
    }

    const itens = [];
    if (contagem.nao_localizada) {
        itens.push(`<li><strong>${contagem.nao_localizada}</strong> ainda não localizada(s) (—): clique em <strong>📍 Localizar unidades</strong>.</li>`);
    }
    if (contagem.nao_encontrada) {
        itens.push(`<li><strong>${contagem.nao_encontrada}</strong> não encontrada(s) pelo endereço (✕).</li>`);
    }
    if (contagem.so_cidade) {
        itens.push(`<li><strong>${contagem.so_cidade}</strong> só com o centro da cidade (≈).</li>`);
    }
    const dicaManual = contagem.nao_encontrada || contagem.so_cidade
        ? '<p>Nas marcadas com ✕ ou ≈, clique em ✏️ e cole as coordenadas do Google Maps (botão direito no local → clique nos números).</p>'
        : '';

    document.getElementById('alerta-localizacao-texto').innerHTML = `
        <strong>⚠️ ${total} unidade(s) sem localização precisa no mapa</strong>
        <p>Elas não entram direito nas buscas por Etecs mais próximas, no site e no assistente.</p>
        <ul>${itens.join('')}</ul>
        ${dicaManual}`;

    document.getElementById('btn-filtrar-sem-localizacao').textContent =
        filtroSemLocalizacao ? 'Mostrar todas as unidades' : 'Mostrar só essas';
}

function renderizarTabela() {
    const filtro = (document.getElementById('busca-unidade').value || '').trim().toLowerCase();
    const corpo = document.getElementById('tabela-etecs-corpo');

    renderizarAlertaLocalizacao();

    const linhas = etecsCache
        .filter((e) => !filtroSemLocalizacao || situacaoLocalizacao(e) !== 'ok')
        .filter((e) => !filtro
            || (e.nome || '').toLowerCase().includes(filtro)
            || (e.municipio || '').toLowerCase().includes(filtro)
            || (e.codigo || '').toLowerCase().includes(filtro))
        .sort((a, b) => (a.nome || '').localeCompare(b.nome || '', 'pt-BR'));

    if (!linhas.length) {
        corpo.innerHTML = `<tr><td colspan="7" class="tabela-vazia">Nenhuma unidade encontrada.</td></tr>`;
        return;
    }

    corpo.innerHTML = linhas.map((e) => {
        const logo = e.logotipoUrl ? escapeHtml(e.logotipoUrl) : LOGO_PADRAO;
        const mapa = indicadorLocalizacao(e);
        return `
        <tr>
            <td>${escapeHtml(e.codigo)}</td>
            <td>
                <div class="cel-unidade">
                    <img src="${logo}" alt="" onerror="this.onerror=null;this.src='${LOGO_FALLBACK}';">
                    <span>${escapeHtml(e.nome)}</span>
                </div>
            </td>
            <td>${escapeHtml(e.municipio)}</td>
            <td>${escapeHtml(e.regiao)}</td>
            <td>${(e.cursos || []).length}</td>
            <td class="col-mapa" title="${escapeHtml(mapa.titulo)}">${mapa.icone}</td>
            <td class="col-acoes">
                <button type="button" class="btn-icone" data-acao="editar" data-id="${escapeHtml(e.id)}" title="Editar">✏️</button>
                <button type="button" class="btn-icone" data-acao="excluir" data-id="${escapeHtml(e.id)}" title="Excluir">🗑️</button>
            </td>
        </tr>`;
    }).join('');
}

function renderizarListaRedes() {
    const container = document.getElementById('lista-redes');
    if (!redesSociaisAtual.length) {
        container.innerHTML = '<p class="lista-vazia">Nenhuma rede social adicionada.</p>';
        return;
    }
    container.innerHTML = redesSociaisAtual.map((item, i) => {
        const url = urlSegura(item.url);
        const linkOuTexto = url
            ? `<a href="${escapeHtml(url)}" target="_blank" rel="noopener">${escapeHtml(item.url)}</a>`
            : escapeHtml(item.url);
        return `
        <div class="linha-lista">
            <span class="texto-item"><strong>${escapeHtml(item.rede)}</strong> — ${linkOuTexto}</span>
            <button type="button" class="btn-remover" data-tipo="redes" data-idx="${i}">Remover</button>
        </div>`;
    }).join('');
}

function renderizarListaDocumentos() {
    const container = document.getElementById('lista-documentos');
    if (!documentosAtual.length) {
        container.innerHTML = '<p class="lista-vazia">Nenhum documento adicionado.</p>';
        return;
    }
    container.innerHTML = documentosAtual.map((item, i) => {
        const url = urlSegura(item.url);
        const linkOuTexto = url
            ? `<a href="${escapeHtml(url)}" target="_blank" rel="noopener">link</a>`
            : '';
        return `
        <div class="linha-lista">
            <span class="texto-item"><strong>${escapeHtml(item.tipo)}</strong> — ${escapeHtml(item.descricao)} ${linkOuTexto}</span>
            <button type="button" class="btn-remover" data-tipo="documentos" data-idx="${i}">Remover</button>
        </div>`;
    }).join('');
}

function renderizarListaCursos() {
    const container = document.getElementById('lista-cursos');
    if (!cursosAtual.length) {
        container.innerHTML = '<p class="lista-vazia">Nenhum curso adicionado.</p>';
        return;
    }
    container.innerHTML = cursosAtual.map((item, i) => `
        <div class="linha-lista">
            <span class="texto-item"><span class="badge-categoria">${escapeHtml(item.categoria)}</span>${escapeHtml(item.nome)}</span>
            <button type="button" class="btn-remover" data-tipo="cursos" data-idx="${i}">Remover</button>
        </div>`).join('');
}

function renderizarListasDinamicas() {
    renderizarListaRedes();
    renderizarListaDocumentos();
    renderizarListaCursos();
}

// ========================================================
// Firestore
// ========================================================

async function carregarEtecs() {
    const snap = await getDocs(collection(db, ETECS_COLLECTION));
    etecsCache = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    renderizarTabela();
}

async function salvarEtec(event) {
    event.preventDefault();

    const codigo = document.getElementById('f-codigo').value.trim();
    const nome = document.getElementById('f-nome').value.trim();
    if (!codigo || !nome) {
        alert('Código e nome da unidade são obrigatórios.');
        return;
    }

    const dados = {
        codigo,
        nome,
        historico: document.getElementById('f-historico').value.trim(),
        cnpj: document.getElementById('f-cnpj').value.trim(),
        regiao: document.getElementById('f-regiao').value.trim(),
        municipio: document.getElementById('f-municipio').value.trim(),
        endereco: document.getElementById('f-endereco').value.trim(),
        telefone: document.getElementById('f-telefone').value.trim(),
        discagemAbreviada: document.getElementById('f-discagem').value.trim(),
        aniversarioCidade: document.getElementById('f-aniversario').value.trim(),
        site: document.getElementById('f-site').value.trim(),
        logotipoUrl: document.getElementById('f-logotipo').value.trim(),
        direcao: {
            geral: {
                nome: document.getElementById('f-dir-nome').value.trim(),
                email: document.getElementById('f-dir-email').value.trim()
            },
            administrativa: {
                nome: document.getElementById('f-adm-nome').value.trim(),
                email: document.getElementById('f-adm-email').value.trim()
            },
            academica: {
                nome: document.getElementById('f-acad-nome').value.trim(),
                email: document.getElementById('f-acad-email').value.trim()
            }
        },
        redesSociais: redesSociaisAtual,
        documentos: documentosAtual,
        cursos: cursosAtual,
        atualizadoEm: new Date().toISOString()
    };

    const id = editandoId || sanitizarId(codigo);
    const existente = etecsCache.find((e) => e.id === id);

    const textoCoordenadas = document.getElementById('f-coordenadas').value.trim();
    const coordenadas = lerCoordenadas(textoCoordenadas);
    if (textoCoordenadas && !coordenadas) {
        alert('Coordenadas inválidas. Use o formato "latitude, longitude", por exemplo: -23.5048, -46.6594');
        return;
    }

    let localizarDepois = false;
    if (coordenadas) {
        const mesmas = existente?.localizacao
            && existente.localizacao.lat === coordenadas.lat
            && existente.localizacao.lng === coordenadas.lng;
        if (!mesmas) {
            dados.localizacao = { ...coordenadas, precisao: 'manual', endereco: dados.endereco };
        } else {
            localizarDepois = precisaLocalizar({ ...existente, endereco: dados.endereco });
        }
    } else {
        // campo vazio (nunca localizada, ou o admin apagou para refazer)
        localizarDepois = true;
    }

    try {
        // merge:true preserva campos que não estão neste formulário (ex:
        // logotipoZipUrl, vindo da importação do CSV) em vez de apagá-los.
        await setDoc(doc(db, ETECS_COLLECTION, id), dados, { merge: true });
        fecharFormulario();
        await carregarEtecs();

        if (localizarDepois && dados.endereco && dados.municipio) {
            localizarUmaUnidade(id, dados);
        }
    } catch (err) {
        console.error('Erro ao salvar unidade:', err);
        alert('Erro ao salvar a unidade: ' + err.message);
    }
}

// Aceita o formato copiado do Google Maps: "-23.50484, -46.65944"
function lerCoordenadas(texto) {
    const partes = (texto || '').split(',').map((p) => Number(p.trim()));
    if (partes.length !== 2 || partes.some((n) => !Number.isFinite(n))) return null;
    const [lat, lng] = partes;
    if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
    return { lat, lng };
}

async function localizarUmaUnidade(id, unidade) {
    const status = document.getElementById('status-importacao');
    status.style.display = 'block';
    status.textContent = `Localizando "${unidade.nome}" no mapa...`;

    const localizacao = await localizarUnidade(unidade);

    try {
        await gravarLocalizacao(id, unidade, localizacao);
        status.textContent = localizacao
            ? `"${unidade.nome}" localizada: ${DESCRICAO_PRECISAO[localizacao.precisao].toLowerCase()}.`
            : `Não foi possível localizar "${unidade.nome}" pelo endereço. Edite a unidade e cole as coordenadas do Google Maps.`;
        await carregarEtecs();
    } catch (err) {
        console.error('Erro ao salvar localização:', err);
        status.textContent = 'Erro ao salvar a localização: ' + err.message;
    }
}

async function localizarUnidadesPendentes() {
    const pendentes = etecsCache.filter(precisaLocalizar).filter((e) => e.endereco && e.municipio);
    if (!pendentes.length) {
        alert('Todas as unidades já estão localizadas no mapa.');
        return;
    }

    const minutos = Math.max(1, Math.round((pendentes.length * 2) / 60));
    const confirmar = confirm(
        `${pendentes.length} unidade(s) para localizar no mapa.\n` +
        `O serviço gratuito (OpenStreetMap) aceita 1 consulta por segundo, então isso leva uns ${minutos} min. ` +
        `Mantenha esta aba aberta até terminar.\n\nComeçar agora?`
    );
    if (!confirmar) return;

    const botao = document.getElementById('btn-localizar-unidades');
    const status = document.getElementById('status-importacao');
    status.style.display = 'block';
    botao.disabled = true;

    const soCidade = [];
    const naoEncontradas = [];

    for (let i = 0; i < pendentes.length; i++) {
        const etec = pendentes[i];
        status.textContent = `Localizando ${i + 1}/${pendentes.length}: ${etec.nome}...`;

        const localizacao = await localizarUnidade(etec);
        if (!localizacao) naoEncontradas.push(etec.nome);
        else if (localizacao.precisao === 'cidade') soCidade.push(etec.nome);

        try {
            etec.localizacao = await gravarLocalizacao(etec.id, etec, localizacao);
            renderizarTabela();
        } catch (err) {
            console.error(`Erro ao salvar localização de ${etec.nome}:`, err);
            if (localizacao) naoEncontradas.push(etec.nome);
        }
    }

    botao.disabled = false;
    const precisas = pendentes.length - soCidade.length - naoEncontradas.length;
    let resumo = `Concluído: ${precisas} localizadas com precisão`;
    if (soCidade.length) resumo += ` · ${soCidade.length} só pelo centro da cidade (≈): ${soCidade.join(', ')}`;
    if (naoEncontradas.length) resumo += ` · ${naoEncontradas.length} não encontradas: ${naoEncontradas.join(', ')}`;
    if (soCidade.length || naoEncontradas.length) resumo += '. Para essas, edite a unidade e cole as coordenadas do Google Maps.';
    status.textContent = resumo;
}

async function excluirEtec(id) {
    const etec = etecsCache.find((e) => e.id === id);
    if (!confirm(`Excluir a unidade "${etec ? etec.nome : id}"? Essa ação não pode ser desfeita.`)) return;
    try {
        await deleteDoc(doc(db, ETECS_COLLECTION, id));
        await carregarEtecs();
    } catch (err) {
        console.error('Erro ao excluir unidade:', err);
        alert('Erro ao excluir a unidade: ' + err.message);
    }
}

async function importarEmLotes(etecs) {
    const TAMANHO_LOTE = 400;
    for (let i = 0; i < etecs.length; i += TAMANHO_LOTE) {
        const lote = etecs.slice(i, i + TAMANHO_LOTE);
        const batch = writeBatch(db);
        for (const etec of lote) {
            const id = sanitizarId(etec.codigo || etec.nome);
            batch.set(doc(db, ETECS_COLLECTION, id), {
                ...etec,
                atualizadoEm: new Date().toISOString()
            }, { merge: true });
        }
        await batch.commit();
    }
}

// ========================================================
// Extração de logos a partir do pacote .zip oficial do CPS
// ========================================================

async function extrairLogoUnidade(etec) {
    const user = auth.currentUser;
    if (!user || !etec.logotipoZipUrl) return null;

    try {
        const token = await user.getIdToken();
        const resp = await fetch(EXTRAIR_LOGO_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify({ zipUrl: etec.logotipoZipUrl, codigo: etec.codigo })
        });
        const dados = await resp.json().catch(() => ({}));
        if (!resp.ok || !dados.url) {
            console.warn(`Falha ao extrair logo da unidade ${etec.codigo}:`, dados.erro || resp.status);
            return null;
        }
        return dados.url;
    } catch (err) {
        console.warn(`Erro ao extrair logo da unidade ${etec.codigo}:`, err);
        return null;
    }
}

async function extrairLogosPendentes() {
    const pendentes = etecsCache.filter((e) => e.logotipoZipUrl && !e.logotipoUrl);
    if (!pendentes.length) {
        alert('Não há unidades pendentes: ou todas já têm logo, ou nenhuma tem o link do pacote (unidades cadastradas manualmente não têm esse link).');
        return;
    }

    const status = document.getElementById('status-importacao');
    status.style.display = 'block';

    const CONCORRENCIA = 4;
    let concluidos = 0;
    let falhas = 0;

    const atualizarStatus = () => {
        status.textContent = `Extraindo logos: ${concluidos}/${pendentes.length} (${falhas} falharam até agora)...`;
    };
    atualizarStatus();

    async function processarFila(fila) {
        for (const etec of fila) {
            const url = await extrairLogoUnidade(etec);
            if (url) {
                try {
                    await setDoc(doc(db, ETECS_COLLECTION, etec.id), { logotipoUrl: url }, { merge: true });
                    etec.logotipoUrl = url;
                } catch (err) {
                    console.error('Erro ao salvar logo extraída:', err);
                    falhas++;
                }
            } else {
                falhas++;
            }
            concluidos++;
            atualizarStatus();
            renderizarTabela();
        }
    }

    const filas = Array.from({ length: CONCORRENCIA }, () => []);
    pendentes.forEach((etec, i) => filas[i % CONCORRENCIA].push(etec));
    await Promise.all(filas.map(processarFila));

    status.textContent = `Extração concluída: ${pendentes.length - falhas} logos atualizadas, ${falhas} falharam.`;
}

// ========================================================
// Formulário (modal)
// ========================================================

function abrirFormulario(etec) {
    editandoId = etec ? etec.id : null;
    document.getElementById('form-titulo').textContent = etec ? 'Editar unidade' : 'Nova unidade';
    document.getElementById('form-etec').reset();

    redesSociaisAtual = etec?.redesSociais ? etec.redesSociais.map((r) => ({ ...r })) : [];
    documentosAtual = etec?.documentos ? etec.documentos.map((d) => ({ ...d })) : [];
    cursosAtual = etec?.cursos ? etec.cursos.map((c) => ({ ...c })) : [];
    renderizarListasDinamicas();

    document.getElementById('f-codigo').value = etec?.codigo || '';
    document.getElementById('f-codigo').disabled = !!etec;
    document.getElementById('f-nome').value = etec?.nome || '';
    document.getElementById('f-historico').value = etec?.historico || '';
    document.getElementById('f-cnpj').value = etec?.cnpj || '';
    document.getElementById('f-regiao').value = etec?.regiao || '';
    document.getElementById('f-municipio').value = etec?.municipio || '';
    document.getElementById('f-aniversario').value = etec?.aniversarioCidade || '';
    document.getElementById('f-endereco').value = etec?.endereco || '';
    document.getElementById('f-telefone').value = etec?.telefone || '';
    document.getElementById('f-discagem').value = etec?.discagemAbreviada || '';
    document.getElementById('f-site').value = etec?.site || '';
    document.getElementById('f-logotipo').value = etec?.logotipoUrl || '';
    document.getElementById('f-coordenadas').value = etec?.localizacao?.lat != null
        ? `${etec.localizacao.lat}, ${etec.localizacao.lng}`
        : '';
    const ajudaPorSituacao = {
        ok: `${DESCRICAO_PRECISAO[etec?.localizacao?.precisao] || 'Localizada'}. Apague para localizar de novo pelo endereço.`,
        so_cidade: 'Só o centro da cidade foi encontrado. No Google Maps, clique com o botão direito na escola, copie os números e cole aqui.',
        nao_encontrada: 'Não foi encontrada pelo endereço. No Google Maps, clique com o botão direito na escola, copie os números e cole aqui (ou corrija o endereço).',
        nao_localizada: 'Deixe em branco para localizar automaticamente pelo endereço ao salvar.'
    };
    document.getElementById('f-coordenadas-ajuda').textContent = ajudaPorSituacao[etec ? situacaoLocalizacao(etec) : 'nao_localizada'];

    document.getElementById('f-dir-nome').value = etec?.direcao?.geral?.nome || '';
    document.getElementById('f-dir-email').value = etec?.direcao?.geral?.email || '';
    document.getElementById('f-adm-nome').value = etec?.direcao?.administrativa?.nome || '';
    document.getElementById('f-adm-email').value = etec?.direcao?.administrativa?.email || '';
    document.getElementById('f-acad-nome').value = etec?.direcao?.academica?.nome || '';
    document.getElementById('f-acad-email').value = etec?.direcao?.academica?.email || '';

    document.getElementById('modal-form').classList.add('aberto');
}

function fecharFormulario() {
    document.getElementById('modal-form').classList.remove('aberto');
    document.getElementById('f-codigo').disabled = false;
    editandoId = null;
}

// ========================================================
// Importação de CSV
// ========================================================

function lerArquivoComoTexto(arquivo) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(reader.error);
        reader.readAsText(arquivo, 'utf-8');
    });
}

async function tratarImportacaoCsv(event) {
    const arquivo = event.target.files[0];
    event.target.value = '';
    if (!arquivo) return;

    const status = document.getElementById('status-importacao');
    status.style.display = 'block';
    status.textContent = 'Lendo arquivo...';

    try {
        const texto = await lerArquivoComoTexto(arquivo);
        const etecs = csvParaEtecs(texto);

        if (!etecs.length) {
            status.textContent = 'Nenhuma unidade encontrada no arquivo. Verifique se é o CSV exportado corretamente.';
            return;
        }

        const confirmar = confirm(
            `Foram encontradas ${etecs.length} unidades no CSV.\n` +
            `Unidades com o mesmo código serão atualizadas; as demais serão criadas.\n\n` +
            `Deseja importar agora?`
        );
        if (!confirmar) {
            status.style.display = 'none';
            return;
        }

        status.textContent = `Importando ${etecs.length} unidades...`;
        await importarEmLotes(etecs);
        status.textContent = `Importação concluída: ${etecs.length} unidades processadas.`;
        await carregarEtecs();
    } catch (err) {
        console.error('Erro ao importar CSV:', err);
        status.textContent = 'Erro ao importar o CSV: ' + err.message;
    }
}

// ========================================================
// Inicialização
// ========================================================

document.addEventListener('DOMContentLoaded', () => {

    onAuthStateChanged(auth, async (user) => {
        if (!user) {
            window.location.href = 'login.html';
            return;
        }

        try {
            const snap = await getDoc(doc(db, 'usuarios', user.uid));
            const ehAdmin = snap.exists() && snap.data().admin === true;

            if (!ehAdmin) {
                document.getElementById('admin-app').style.display = 'none';
                document.getElementById('acesso-negado').style.display = 'flex';
                return;
            }

            document.getElementById('admin-email').textContent = user.email || '';
            document.getElementById('admin-app').style.display = 'block';
            await carregarEtecs();
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

    document.getElementById('btn-nova-unidade').addEventListener('click', () => abrirFormulario(null));
    document.getElementById('btn-fechar-form').addEventListener('click', fecharFormulario);
    document.getElementById('btn-cancelar-form').addEventListener('click', fecharFormulario);
    document.getElementById('form-etec').addEventListener('submit', salvarEtec);
    document.getElementById('busca-unidade').addEventListener('input', renderizarTabela);
    document.getElementById('btn-filtrar-sem-localizacao').addEventListener('click', () => {
        filtroSemLocalizacao = !filtroSemLocalizacao;
        renderizarTabela();
    });

    document.getElementById('btn-importar-csv').addEventListener('click', () => {
        document.getElementById('input-csv').click();
    });
    document.getElementById('input-csv').addEventListener('change', tratarImportacaoCsv);
    document.getElementById('btn-extrair-logos').addEventListener('click', extrairLogosPendentes);
    document.getElementById('btn-localizar-unidades').addEventListener('click', localizarUnidadesPendentes);

    document.getElementById('tabela-etecs-corpo').addEventListener('click', (e) => {
        const btn = e.target.closest('.btn-icone');
        if (!btn) return;
        const id = btn.dataset.id;
        if (btn.dataset.acao === 'editar') {
            const etec = etecsCache.find((x) => x.id === id);
            if (etec) abrirFormulario(etec);
        } else if (btn.dataset.acao === 'excluir') {
            excluirEtec(id);
        }
    });

    document.getElementById('btn-add-rede').addEventListener('click', () => {
        const rede = document.getElementById('add-rede-nome').value.trim();
        const url = document.getElementById('add-rede-url').value.trim();
        if (!rede || !url) { alert('Preencha a rede social e o link.'); return; }
        redesSociaisAtual.push({ rede, url });
        document.getElementById('add-rede-nome').value = '';
        document.getElementById('add-rede-url').value = '';
        renderizarListaRedes();
    });

    document.getElementById('btn-add-doc').addEventListener('click', () => {
        const tipo = document.getElementById('add-doc-tipo').value.trim();
        const descricao = document.getElementById('add-doc-descricao').value.trim();
        const url = document.getElementById('add-doc-url').value.trim();
        if (!tipo || !descricao) { alert('Preencha ao menos o tipo e a descrição do documento.'); return; }
        documentosAtual.push({ tipo, descricao, url });
        document.getElementById('add-doc-tipo').value = '';
        document.getElementById('add-doc-descricao').value = '';
        document.getElementById('add-doc-url').value = '';
        renderizarListaDocumentos();
    });

    document.getElementById('btn-add-curso').addEventListener('click', () => {
        const categoria = document.getElementById('add-curso-categoria').value.trim();
        const nome = document.getElementById('add-curso-nome').value.trim();
        if (!categoria || !nome) { alert('Preencha a categoria e o nome do curso.'); return; }
        cursosAtual.push({ categoria, nome });
        document.getElementById('add-curso-nome').value = '';
        renderizarListaCursos();
    });

    document.getElementById('modal-form').addEventListener('click', (e) => {
        const btn = e.target.closest('.btn-remover');
        if (!btn) return;
        const idx = Number(btn.dataset.idx);
        if (btn.dataset.tipo === 'redes') redesSociaisAtual.splice(idx, 1);
        else if (btn.dataset.tipo === 'documentos') documentosAtual.splice(idx, 1);
        else if (btn.dataset.tipo === 'cursos') cursosAtual.splice(idx, 1);
        renderizarListasDinamicas();
    });
});
