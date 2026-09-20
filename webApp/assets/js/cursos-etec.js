import { auth, db } from './firebase-config.js';
import { collection, doc, getDoc, getDocs } from 'firebase/firestore';
import { renderizarCardUnidade, normalizar } from './card-unidade.js';
import {
    carregarRegioesSP,
    resolverLocalizacaoUsuario,
    criarAvaliadorProximidade,
    PROXIMIDADE
} from './recomendacao-cursos.js';
import { formatarDistancia } from './geocodificacao.js';

function seloProximidade({ nivel, km }) {
    if (km != null) return `📍 ${formatarDistancia(km)}`;
    if (nivel === PROXIMIDADE.CIDADE) return '📍 Na sua cidade';
    if (nivel === PROXIMIDADE.REGIAO) return '📍 Perto de você';
    return '';
}

let unidadesCache = [];
let avaliarProximidade = null;
let localizacao = null;

function renderizarUnidades() {
    const campoBusca = document.getElementById('busca-cursos');
    const container = document.getElementById('grid-unidades');
    const contagem = document.getElementById('contagem-resultados');
    const termo = normalizar(campoBusca.value);

    let filtradas = unidadesCache.filter((u) => {
        if (!termo) return true;
        const alvo = normalizar([
            u.nome, u.municipio, u.regiao,
            ...(u.cursos || []).map((c) => c.nome)
        ].filter(Boolean).join(' '));
        return alvo.includes(termo);
    });

    let proximidades = null;
    if (avaliarProximidade) {
        proximidades = new Map(filtradas.map((u) => [u.id, avaliarProximidade(u)]));
        filtradas = [...filtradas].sort((a, b) =>
            proximidades.get(a.id).ordem - proximidades.get(b.id).ordem
            || (a.nome || '').localeCompare(b.nome || '', 'pt-BR'));
    }

    const plural = filtradas.length === 1 ? '' : 's';
    contagem.textContent = `${filtradas.length} unidade${plural} encontrada${plural}`
        + (localizacao ? ` · mais perto de ${localizacao.cidade} primeiro` : '');

    if (!filtradas.length) {
        container.innerHTML = '<p class="sem-resultados">Nenhuma unidade encontrada para essa busca.</p>';
        return;
    }

    container.innerHTML = filtradas.map((u) => renderizarCardUnidade(u, {
        destaque: proximidades ? seloProximidade(proximidades.get(u.id)) : '',
        termoCurso: termo
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
    renderizarUnidades();
}

async function carregarUnidades() {
    const container = document.getElementById('grid-unidades');
    try {
        const snap = await getDocs(collection(db, 'etecs'));
        unidadesCache = snap.docs
            .map((d) => ({ id: d.id, ...d.data() }))
            .sort((a, b) => (a.nome || '').localeCompare(b.nome || '', 'pt-BR'));
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
