import { auth, db } from './firebase-config.js';
import { collection, doc, getDoc, getDocs } from 'firebase/firestore';
import {
    renderizarCardUnidade,
    normalizar,
    modalidadeDaCategoria,
    rotuloDaModalidade,
    ordemDaModalidade
} from './card-unidade.js';
import {
    carregarRegioesSP,
    resolverLocalizacaoUsuario,
    criarAvaliadorProximidade,
    PROXIMIDADE
} from './recomendacao-cursos.js';
import { formatarDistancia } from './geocodificacao.js';

// Até esta distância a unidade entra no filtro "Perto de você" mesmo estando
// em outra cidade (ex.: quem mora na divisa).
const RAIO_PERTO_KM = 30;

function textoDistancia({ nivel, km }) {
    if (km != null) {
        // formatarDistancia já devolve "a 4,8 km" / "a menos de 1 km"
        const distancia = formatarDistancia(km);
        return `${distancia.charAt(0).toUpperCase()}${distancia.slice(1)} de você`;
    }
    if (nivel === PROXIMIDADE.CIDADE) return 'Na sua cidade';
    if (nivel === PROXIMIDADE.REGIAO) return 'Na sua região';
    return '';
}

function estaPerto(proximidade) {
    if (!proximidade) return false;
    return proximidade.nivel <= PROXIMIDADE.REGIAO
        || (proximidade.km != null && proximidade.km <= RAIO_PERTO_KM);
}

let unidadesCache = [];
let avaliarProximidade = null;
let localizacao = null;

const filtros = { instituicao: '', modalidade: '', perto: false };

// ------------------------------------------------------------------
// Filtros (chips)
// ------------------------------------------------------------------
function criarChip({ rotulo, ativo, destaque = false, aoClicar }) {
    const botao = document.createElement('button');
    botao.type = 'button';
    botao.className = 'chip-filtro'
        + (ativo ? ' chip-filtro--ativo' : '')
        + (destaque ? ' chip-filtro--destaque' : '');
    botao.setAttribute('aria-pressed', String(ativo));
    botao.textContent = rotulo;
    botao.addEventListener('click', aoClicar);
    return botao;
}

function instituicoesDisponiveis() {
    return [...new Set(unidadesCache.map((u) => (u.tipo || '').trim()).filter(Boolean))]
        .sort((a, b) => a.localeCompare(b, 'pt-BR'));
}

function modalidadesDisponiveis() {
    const chaves = new Set();
    unidadesCache.forEach((u) => (u.cursos || []).forEach((c) => {
        if (c?.nome) chaves.add(modalidadeDaCategoria(c.categoria).chave);
    }));
    return [...chaves].sort((a, b) => ordemDaModalidade(a) - ordemDaModalidade(b));
}

function montarFiltros() {
    const grupoProximidade = document.getElementById('chips-proximidade');
    const grupoInstituicao = document.getElementById('chips-instituicao');
    const grupoModalidade = document.getElementById('chips-modalidade');

    // Só faz sentido oferecer o filtro de perto quando dá para medir distância.
    grupoProximidade.innerHTML = '';
    if (avaliarProximidade) {
        grupoProximidade.appendChild(criarChip({
            rotulo: '📍 Perto de você',
            ativo: filtros.perto,
            destaque: true,
            aoClicar: () => { filtros.perto = !filtros.perto; montarFiltros(); renderizarUnidades(); }
        }));
    }

    // Com um tipo só (hoje, todas Etec) o filtro não separa nada.
    const instituicoes = instituicoesDisponiveis();
    grupoInstituicao.innerHTML = '';
    if (instituicoes.length > 1) {
        [{ valor: '', rotulo: 'Todas' }, ...instituicoes.map((t) => ({ valor: t, rotulo: t }))]
            .forEach(({ valor, rotulo }) => grupoInstituicao.appendChild(criarChip({
                rotulo,
                ativo: filtros.instituicao === valor,
                aoClicar: () => { filtros.instituicao = valor; montarFiltros(); renderizarUnidades(); }
            })));
    }

    const modalidades = modalidadesDisponiveis();
    grupoModalidade.innerHTML = '';
    [{ valor: '', rotulo: 'Todos os tipos' }, ...modalidades.map((c) => ({ valor: c, rotulo: rotuloDaModalidade(c) }))]
        .forEach(({ valor, rotulo }) => grupoModalidade.appendChild(criarChip({
            rotulo,
            ativo: filtros.modalidade === valor,
            aoClicar: () => { filtros.modalidade = valor; montarFiltros(); renderizarUnidades(); }
        })));
}

// ------------------------------------------------------------------
// Lista
// ------------------------------------------------------------------
function renderizarUnidades() {
    const campoBusca = document.getElementById('busca-cursos');
    const container = document.getElementById('grid-unidades');
    const contagem = document.getElementById('contagem-resultados');
    const termo = normalizar(campoBusca.value);
    const modalidades = filtros.modalidade ? new Set([filtros.modalidade]) : null;

    const proximidades = avaliarProximidade
        ? new Map(unidadesCache.map((u) => [u.id, avaliarProximidade(u)]))
        : null;

    let filtradas = unidadesCache.filter((u) => {
        if (filtros.instituicao && (u.tipo || '').trim() !== filtros.instituicao) return false;
        if (filtros.perto && !estaPerto(proximidades?.get(u.id))) return false;

        const cursos = modalidades
            ? (u.cursos || []).filter((c) => c?.nome && modalidades.has(modalidadeDaCategoria(c.categoria).chave))
            : (u.cursos || []);
        if (modalidades && !cursos.length) return false;

        if (!termo) return true;
        const alvo = normalizar([
            u.nome, u.municipio, u.regiao, u.tipo,
            ...cursos.map((c) => c.nome)
        ].filter(Boolean).join(' '));
        return alvo.includes(termo);
    });

    if (proximidades) {
        filtradas = [...filtradas].sort((a, b) =>
            proximidades.get(a.id).ordem - proximidades.get(b.id).ordem
            || (a.nome || '').localeCompare(b.nome || '', 'pt-BR'));
    }

    const plural = filtradas.length === 1 ? '' : 's';
    const complemento = filtros.perto
        ? ` · perto de ${localizacao.cidade}`
        : (localizacao ? ` · mais perto de ${localizacao.cidade} primeiro` : '');
    contagem.textContent = `${filtradas.length} unidade${plural} encontrada${plural}${complemento}`;

    if (!filtradas.length) {
        container.innerHTML = `<p class="sem-resultados">${filtros.perto
            ? 'Nenhuma unidade perto de você com esses filtros. Tente desligar o filtro "Perto de você".'
            : 'Nenhuma unidade encontrada para essa busca.'}</p>`;
        return;
    }

    container.innerHTML = filtradas.map((u) => renderizarCardUnidade(u, {
        destaque: proximidades ? textoDistancia(proximidades.get(u.id)) : '',
        termoCurso: termo,
        modalidades
    })).join('');
}

// A lista aparece logo em ordem alfabética; se a pessoa estiver logada e
// der para saber a cidade dela, reordena do mais perto para o mais longe.
async function ordenarPelaLocalizacao() {
    await auth.authStateReady();
    const usuario = auth.currentUser;
    if (!usuario) return;

    const snap = await getDoc(doc(db, 'usuarios', usuario.uid));
    localizacao = await resolverLocalizacaoUsuario(usuario.uid, snap.exists() ? snap.data() : null);
    if (!localizacao) return;

    const regioes = await carregarRegioesSP().catch(() => null);
    avaliarProximidade = criarAvaliadorProximidade(localizacao, regioes);
    montarFiltros();
    renderizarUnidades();
}

async function carregarUnidades() {
    const container = document.getElementById('grid-unidades');
    try {
        const snap = await getDocs(collection(db, 'instituicoes'));
        unidadesCache = snap.docs
            .map((d) => ({ id: d.id, ...d.data() }))
            .sort((a, b) => (a.nome || '').localeCompare(b.nome || '', 'pt-BR'));
        montarFiltros();
        renderizarUnidades();
        ordenarPelaLocalizacao().catch((erro) => console.error('Erro ao ordenar por proximidade:', erro));
    } catch (err) {
        console.error('Erro ao carregar unidades ETEC:', err);
        container.innerHTML = '<p class="sem-resultados">Não foi possível carregar os cursos agora. Tente novamente mais tarde.</p>';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Links das recomendações chegam como cursos.html?curso=Nome do Curso
    const cursoNaUrl = new URLSearchParams(window.location.search).get('curso');
    const campoBusca = document.getElementById('busca-cursos');
    if (cursoNaUrl) campoBusca.value = cursoNaUrl;

    carregarUnidades();
    campoBusca.addEventListener('input', renderizarUnidades);
});
