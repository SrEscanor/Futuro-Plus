import { auth, db } from './firebase-config.js';
import { collection, doc, getDoc, getDocs } from 'firebase/firestore';
import {
    renderizarCardInstituicao,
    renderizarCursosPorCategoria,
    logoDaUnidade,
    escapeHtml,
    normalizar,
    modalidadeDaCategoria,
    rotuloDaModalidade,
    ordemDaModalidade,
    LOGO_FALLBACK
} from './card-unidade.js';
import {
    carregarRegioesSP,
    resolverLocalizacaoUsuario,
    criarAvaliadorProximidade,
    PROXIMIDADE
} from './recomendacao-cursos.js';
import { formatarDistancia } from './geocodificacao.js';
import { renderizarPaginacao } from './paginacao.js';

// 4 colunas × 4 linhas em tela larga
const UNIDADES_POR_PAGINA = 16;
const CURSOS_EM_DESTAQUE = 3;

const ICONE_LOCAL = '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a7 7 0 0 0-7 7c0 5.2 7 13 7 13s7-7.8 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z"/></svg>';
const ICONE_INSTITUICOES = '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2 2 7v2h20V7L12 2zM4 11v7h3v-7H4zm6.500 0v7h3v-7h-3zM17 11v7h3v-7h-3zM2 20v2h20v-2H2z"/></svg>';

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

let unidadesCache = [];
let avaliarProximidade = null;
let localizacao = null;

// curso guarda o nome normalizado; os demais, o valor como está no cadastro.
const filtros = { instituicao: '', modalidade: '', curso: '', regiao: '', ordem: 'az', pagina: 1 };

function elemento(id) {
    return document.getElementById(id);
}

function tipoDaUnidade(unidade) {
    return (unidade.tipo || '').trim();
}

function cursosValidos(unidade) {
    return (unidade.cursos || []).filter((c) => c?.nome);
}

// Uma unidade costuma oferecer o mesmo curso em mais de uma modalidade
// (técnico e integrado ao médio, por exemplo); aqui cada nome conta uma vez.
function nomesDistintos(cursos) {
    const vistos = new Map();
    cursos.forEach((c) => {
        const chave = normalizar(c.nome);
        if (!vistos.has(chave)) vistos.set(chave, c.nome);
    });
    return vistos;
}

// ------------------------------------------------------------------
// Filtros
// ------------------------------------------------------------------
function criarChip({ rotulo, ativo, aoClicar }) {
    const botao = document.createElement('button');
    botao.type = 'button';
    botao.className = 'chip-filtro' + (ativo ? ' chip-filtro--ativo' : '');
    botao.setAttribute('aria-pressed', String(ativo));
    botao.textContent = rotulo;
    botao.addEventListener('click', aoClicar);
    return botao;
}

function preencherSelect(select, opcoes, valorAtual) {
    select.innerHTML = opcoes
        .map(({ valor, rotulo }) => `<option value="${escapeHtml(valor)}">${escapeHtml(rotulo)}</option>`)
        .join('');
    select.value = valorAtual;
}

function instituicoesDisponiveis() {
    return [...new Set(unidadesCache.map(tipoDaUnidade).filter(Boolean))]
        .sort((a, b) => a.localeCompare(b, 'pt-BR'));
}

// Modalidades e cursos acompanham a instituição escolhida: com "Etec" marcado
// não faz sentido oferecer "Superior", nem os cursos que só a Fatec tem.
function unidadesDaInstituicao() {
    return unidadesCache.filter((u) => !filtros.instituicao || tipoDaUnidade(u) === filtros.instituicao);
}

function modalidadesDisponiveis() {
    const chaves = new Set();
    unidadesDaInstituicao().forEach((u) => cursosValidos(u).forEach((c) => {
        chaves.add(modalidadeDaCategoria(c.categoria).chave);
    }));
    return [...chaves].sort((a, b) => ordemDaModalidade(a) - ordemDaModalidade(b));
}

function cursosDisponiveis() {
    const nomes = nomesDistintos(unidadesDaInstituicao().flatMap(cursosValidos));
    return [...nomes.entries()]
        .map(([valor, rotulo]) => ({ valor, rotulo }))
        .sort((a, b) => a.rotulo.localeCompare(b.rotulo, 'pt-BR'));
}

function regioesDisponiveis() {
    return [...new Set(unidadesCache.map((u) => (u.regiao || '').trim()).filter(Boolean))]
        .sort((a, b) => a.localeCompare(b, 'pt-BR'));
}

function aplicarFiltro(mudanca) {
    Object.assign(filtros, mudanca, { pagina: 1 });
    montarFiltros();
    renderizarUnidades();
}

function montarFiltros() {
    // Com um tipo só o filtro não separa nada.
    const grupoInstituicao = elemento('chips-instituicao');
    const instituicoes = instituicoesDisponiveis();
    grupoInstituicao.innerHTML = '';
    if (instituicoes.length > 1) {
        [{ valor: '', rotulo: 'Todas' }, ...instituicoes.map((t) => ({ valor: t, rotulo: t }))]
            .forEach(({ valor, rotulo }) => grupoInstituicao.appendChild(criarChip({
                rotulo,
                ativo: filtros.instituicao === valor,
                aoClicar: () => aplicarFiltro({ instituicao: valor })
            })));
    }
    elemento('divisor-instituicao').hidden = instituicoes.length <= 1;

    // trocou de instituição e a escolha anterior não existe nela: volta para "todos"
    const cursos = cursosDisponiveis();
    if (filtros.curso && !cursos.some((c) => c.valor === filtros.curso)) filtros.curso = '';
    preencherSelect(elemento('filtro-curso'), [{ valor: '', rotulo: 'Todos os cursos' }, ...cursos], filtros.curso);

    const modalidades = modalidadesDisponiveis();
    if (filtros.modalidade && !modalidades.includes(filtros.modalidade)) filtros.modalidade = '';
    preencherSelect(elemento('filtro-modalidade'), [
        { valor: '', rotulo: 'Todas as modalidades' },
        ...modalidades.map((m) => ({ valor: m, rotulo: rotuloDaModalidade(m) }))
    ], filtros.modalidade);

    const regioes = regioesDisponiveis();
    const seletorRegiao = elemento('filtro-regiao');
    preencherSelect(seletorRegiao, [
        { valor: '', rotulo: 'Todas as regiões' },
        ...regioes.map((r) => ({ valor: r, rotulo: r }))
    ], filtros.regiao);
    seletorRegiao.hidden = !regioes.length;

    preencherSelect(elemento('ordenar-unidades'), [
        { valor: 'az', rotulo: 'A a Z' },
        { valor: 'cursos', rotulo: 'Mais cursos' },
        ...(avaliarProximidade ? [{ valor: 'perto', rotulo: 'Mais perto de você' }] : [])
    ], filtros.ordem);
}

// ------------------------------------------------------------------
// Lista
// ------------------------------------------------------------------
function filtrarUnidades(termo) {
    const modalidades = filtros.modalidade ? new Set([filtros.modalidade]) : null;

    return unidadesCache.flatMap((unidade) => {
        if (filtros.instituicao && tipoDaUnidade(unidade) !== filtros.instituicao) return [];
        if (filtros.regiao && (unidade.regiao || '').trim() !== filtros.regiao) return [];

        const cursos = cursosValidos(unidade)
            .filter((c) => !modalidades || modalidades.has(modalidadeDaCategoria(c.categoria).chave));
        if (modalidades && !cursos.length) return [];
        if (filtros.curso && !cursos.some((c) => normalizar(c.nome) === filtros.curso)) return [];

        if (termo) {
            const alvo = normalizar([
                unidade.nome, unidade.municipio, unidade.regiao, unidade.tipo,
                ...cursos.map((c) => c.nome)
            ].filter(Boolean).join(' '));
            if (!alvo.includes(termo)) return [];
        }

        return [{ unidade, cursos, total: nomesDistintos(cursosValidos(unidade)).size }];
    });
}

// Os cursos que a pessoa está procurando (filtro ou busca) vêm primeiro,
// para o card já mostrar por que aquela unidade apareceu.
function cursosEmDestaque(cursos, termo) {
    const nomes = [...nomesDistintos(cursos).entries()];
    const peso = ([chave]) => (chave === filtros.curso ? 0 : (termo && chave.includes(termo) ? 1 : 2));
    return nomes
        .map((item, indice) => ({ item, indice, peso: peso(item) }))
        .sort((a, b) => a.peso - b.peso || a.indice - b.indice)
        .slice(0, CURSOS_EM_DESTAQUE)
        .map(({ item }) => item[1]);
}

function ordenar(itens, proximidades) {
    const porNome = (a, b) => (a.unidade.nome || '').localeCompare(b.unidade.nome || '', 'pt-BR');
    if (filtros.ordem === 'perto' && proximidades) {
        return itens.sort((a, b) =>
            proximidades.get(a.unidade.id).ordem - proximidades.get(b.unidade.id).ordem || porNome(a, b));
    }
    if (filtros.ordem === 'cursos') return itens.sort((a, b) => b.total - a.total || porNome(a, b));
    return itens.sort(porNome);
}

function renderizarUnidades() {
    const container = elemento('grid-unidades');
    const contagem = elemento('contagem-resultados');
    const rodape = elemento('paginacao-rodape');
    const termo = normalizar(elemento('busca-cursos').value);

    const proximidades = avaliarProximidade
        ? new Map(unidadesCache.map((u) => [u.id, avaliarProximidade(u)]))
        : null;

    const itens = ordenar(filtrarUnidades(termo), proximidades);

    const texto = itens.length === 1 ? '1 instituição encontrada' : `${itens.length} instituições encontradas`;
    const complemento = filtros.ordem === 'perto' && localizacao
        ? ` · as mais perto de ${localizacao.cidade} primeiro`
        : '';
    contagem.innerHTML = `${ICONE_INSTITUICOES}<span>${escapeHtml(texto + complemento)}</span>`;

    if (!itens.length) {
        container.innerHTML = '<p class="sem-resultados">Nenhuma instituição encontrada para essa busca.</p>';
        renderizarPaginacao([rodape], 1, 1, () => {});
        return;
    }

    const totalPaginas = Math.ceil(itens.length / UNIDADES_POR_PAGINA);
    filtros.pagina = Math.min(filtros.pagina, totalPaginas);
    const inicio = (filtros.pagina - 1) * UNIDADES_POR_PAGINA;

    container.innerHTML = itens.slice(inicio, inicio + UNIDADES_POR_PAGINA)
        .map(({ unidade, cursos, total }) => renderizarCardInstituicao(unidade, {
            destaque: proximidades ? textoDistancia(proximidades.get(unidade.id)) : '',
            cursosDestaque: cursosEmDestaque(cursos, termo),
            totalCursos: total
        })).join('');

    renderizarPaginacao([rodape], filtros.pagina, totalPaginas, (pagina) => {
        filtros.pagina = pagina;
        renderizarUnidades();
        document.querySelector('.filtros-cursos')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
}

// ------------------------------------------------------------------
// Painel "Ver instituição": todos os cursos da unidade, sem sair da lista
// ------------------------------------------------------------------
function abrirPainel(idUnidade) {
    const unidade = unidadesCache.find((u) => u.id === idUnidade);
    if (!unidade) return;

    const tipo = tipoDaUnidade(unidade);
    // várias regiões levam o nome da própria cidade-sede; aí não repete
    const regiao = normalizar(unidade.regiao) === normalizar(unidade.municipio) ? '' : unidade.regiao;
    const local = [unidade.municipio ? `${unidade.municipio} - SP` : '', regiao].filter(Boolean).join(' · ');
    const distancia = avaliarProximidade ? textoDistancia(avaliarProximidade(unidade)) : '';
    const total = nomesDistintos(cursosValidos(unidade)).size;
    const termo = filtros.curso || normalizar(elemento('busca-cursos').value);

    elemento('painel-unidade-conteudo').innerHTML = `
        <div class="painel-unidade-topo">
            <img class="card-instituicao-logo" src="${logoDaUnidade(unidade)}" alt="" onerror="this.onerror=null;this.src='${LOGO_FALLBACK}';">
            <div class="painel-unidade-identidade">
                <h2 id="painel-unidade-titulo">${escapeHtml(unidade.nome)}</h2>
                ${local ? `<p class="painel-unidade-local">${escapeHtml(local)}</p>` : ''}
                <div class="card-instituicao-selos">
                    ${tipo ? `<span class="selo-instituicao">${escapeHtml(tipo)}</span>` : ''}
                    ${distancia ? `<span class="selo-instituicao selo-instituicao--perto">${escapeHtml(distancia)}</span>` : ''}
                </div>
            </div>
            <button type="button" class="painel-unidade-fechar" data-fechar-painel aria-label="Fechar">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
            </button>
        </div>
        <p class="painel-unidade-resumo">
            <strong>${total}</strong> ${total === 1 ? 'curso disponível' : 'cursos disponíveis'}.
            Clique em um curso para ver o que se aprende nele.
        </p>
        <div class="painel-unidade-cursos">
            ${renderizarCursosPorCategoria(unidade, { termoCurso: termo })
                || '<p class="sem-cursos">Nenhum curso cadastrado ainda.</p>'}
        </div>`;

    elemento('painel-unidade').showModal();
}

function ligarPainel() {
    const painel = elemento('painel-unidade');

    elemento('grid-unidades').addEventListener('click', (evento) => {
        const botao = evento.target.closest('.btn-ver-instituicao');
        if (botao) abrirPainel(botao.dataset.unidade);
    });

    // clique fora do conteúdo (no fundo escurecido) ou no X fecha
    painel.addEventListener('click', (evento) => {
        if (evento.target === painel || evento.target.closest('[data-fechar-painel]')) painel.close();
    });
}

// Sem saber onde a pessoa mora não dá para ordenar por distância; em vez de
// um botão que não faria nada, a página diz o que falta para isso funcionar.
function mostrarDicaProximidade(motivo) {
    const textos = {
        login: 'Quer ver primeiro as instituições perto de você? <a href="login.html">Entre na sua conta</a> ou <a href="cadastro.html">cadastre-se</a>.',
        cep: 'Informe seu CEP no <a href="perfil.html">perfil</a> para ver primeiro as instituições perto de você.'
    };
    const dica = elemento('dica-proximidade');
    dica.innerHTML = `${ICONE_LOCAL}<span>${textos[motivo]}</span>`;
    dica.hidden = false;
}

// A lista aparece logo em ordem alfabética; se a pessoa estiver logada e
// der para saber a cidade dela, passa a ordenar do mais perto para o mais longe.
async function ordenarPelaLocalizacao() {
    await auth.authStateReady();
    const usuario = auth.currentUser;
    if (!usuario) {
        mostrarDicaProximidade('login');
        return;
    }

    const snap = await getDoc(doc(db, 'usuarios', usuario.uid));
    localizacao = await resolverLocalizacaoUsuario(usuario.uid, snap.exists() ? snap.data() : null);
    if (!localizacao) {
        mostrarDicaProximidade('cep');
        return;
    }

    const regioes = await carregarRegioesSP().catch(() => null);
    avaliarProximidade = criarAvaliadorProximidade(localizacao, regioes);
    filtros.ordem = 'perto';
    montarFiltros();
    renderizarUnidades();
}

async function carregarUnidades() {
    const container = elemento('grid-unidades');
    try {
        const snap = await getDocs(collection(db, 'instituicoes'));
        unidadesCache = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        montarFiltros();
        renderizarUnidades();
        ordenarPelaLocalizacao().catch((erro) => console.error('Erro ao ordenar por proximidade:', erro));
    } catch (err) {
        console.error('Erro ao carregar instituições:', err);
        container.innerHTML = '<p class="sem-resultados">Não foi possível carregar as instituições agora. Tente novamente mais tarde.</p>';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Links das recomendações chegam como instituicoes.html?curso=Nome do Curso
    const cursoNaUrl = new URLSearchParams(window.location.search).get('curso');
    const campoBusca = elemento('busca-cursos');
    if (cursoNaUrl) campoBusca.value = cursoNaUrl;

    campoBusca.addEventListener('input', () => { filtros.pagina = 1; renderizarUnidades(); });
    elemento('filtro-curso').addEventListener('change', (e) => aplicarFiltro({ curso: e.target.value }));
    elemento('filtro-modalidade').addEventListener('change', (e) => aplicarFiltro({ modalidade: e.target.value }));
    elemento('filtro-regiao').addEventListener('change', (e) => aplicarFiltro({ regiao: e.target.value }));
    elemento('ordenar-unidades').addEventListener('change', (e) => aplicarFiltro({ ordem: e.target.value }));
    ligarPainel();

    carregarUnidades();
});
