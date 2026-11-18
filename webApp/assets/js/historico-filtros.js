// Barra de filtros dos históricos do painel admin (Notificações, Notícias,
// Notícias próprias e Comunidade): busca, Quando, Quem, O que fez e o que
// mais o painel pedir (a Comunidade tem Instituição).
//
// Os registros chegam do Firestore uma página por vez (100), do mais novo
// para o mais antigo. O filtro roda aqui, no navegador, sobre o que já
// chegou; quando sobra pouca coisa e ainda existem registros mais antigos, a
// barra busca mais páginas sozinha (no máximo 5 a cada mudança) antes de
// mostrar o resultado. Assim não precisa de índice novo no Firestore.
//
// Uso:
//   const historico = historicoComFiltros({
//       barra,                 // elemento vazio onde a barra é desenhada
//       botaoMais,             // botão "Carregar mais antigos" (fica escondido sem mais páginas)
//       buscarPagina,          // async (cursor) => { registros, cursor, haMais }; cursor null = a primeira
//       desenhar,              // (registros filtrados, { filtrando, carregando, erro }) => desenha a tabela
//       busca: { dica, texto: (registro) => 'onde procurar' },
//       campos: [{ chave, rotulo, todos, opcoes: (registros) => [[valor, texto]], testar: (registro, valor) => bool }]
//   });
//   historico.recarregar();   // ao abrir a aba
// Cada registro precisa de "em" (data em ISO, ou Date).

const POR_PAGINA_MINIMO = 30;  // menos que isso com filtro: busca mais páginas
const PAGINAS_SOZINHA = 5;
const DIA = 24 * 60 * 60 * 1000;

const QUANDO = [
    ['', 'Qualquer data'],
    ['hoje', 'Hoje'],
    ['7', 'Últimos 7 dias'],
    ['30', 'Últimos 30 dias'],
    ['datas', 'Escolher as datas…']
];

function escapeHtml(texto) {
    return String(texto ?? '').replace(/[&<>"']/g, (c) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
}

// minúsculas e sem acento: "joão" acha "Joao" e vice-versa
export function normalizar(texto) {
    return String(texto ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

const momento = (valor) => {
    const tempo = new Date(valor || 0).getTime();
    return Number.isNaN(tempo) ? 0 : tempo;
};

// "2026-11-18" do campo de data, no fuso de quem está usando
function diaLocal(texto, fimDoDia = false) {
    const [ano, mes, dia] = String(texto || '').split('-').map(Number);
    if (!ano || !mes || !dia) return null;
    return fimDoDia ? new Date(ano, mes - 1, dia, 23, 59, 59, 999).getTime() : new Date(ano, mes - 1, dia).getTime();
}

// [início, fim] em milissegundos (null = sem limite)
export function periodo(valores, agora = Date.now()) {
    const { quando, de, ate } = valores;
    if (quando === 'hoje') {
        const hoje = new Date(agora);
        return [new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate()).getTime(), null];
    }
    if (quando === '7' || quando === '30') return [agora - Number(quando) * DIA, null];
    if (quando === 'datas') return [diaLocal(de), diaLocal(ate, true)];
    return [null, null];
}

// O filtro em si, sem tela (os testes chamam direto)
export function filtrarRegistros(registros, valores, { campos = [], busca = null, agora = Date.now() } = {}) {
    const termo = normalizar(valores.busca);
    const [inicio, fim] = periodo(valores, agora);
    return registros.filter((registro) => {
        const quando = momento(registro.em);
        if (inicio !== null && quando < inicio) return false;
        if (fim !== null && quando > fim) return false;
        for (const campo of campos) {
            const valor = valores[campo.chave];
            if (valor && !campo.testar(registro, valor)) return false;
        }
        return !termo || normalizar(busca?.texto(registro)).includes(termo);
    });
}

export const unicos = (lista) => [...new Set(lista.filter(Boolean))];

// "Quem" dos históricos que guardam o e-mail de quem fez
export function campoQuem({ rotuloDoEmail = (email) => email } = {}) {
    return {
        chave: 'quem',
        rotulo: 'Quem',
        todos: 'Todo mundo',
        opcoes: (registros) => unicos(registros.map((r) => r.email)).sort((a, b) => a.localeCompare(b))
            .map((email) => [email, rotuloDoEmail(email)]),
        testar: (registro, valor) => (registro.email || '') === valor
    };
}

// "O que fez" a partir do dicionário de ações do painel ({ chave: texto } ou { chave: [texto, cor] })
export function campoAcao(acoes) {
    const maiuscula = (texto) => texto.charAt(0).toUpperCase() + texto.slice(1);
    const lista = Object.entries(acoes).map(([chave, texto]) => [chave, maiuscula(Array.isArray(texto) ? texto[0] : texto)]);
    return {
        chave: 'acao',
        rotulo: 'O que fez',
        todos: 'Tudo',
        opcoes: () => lista,
        testar: (registro, valor) => registro.acao === valor
    };
}

function opcoesHtml(opcoes, atual, todos) {
    const lista = [['', todos], ...opcoes];
    // o valor escolhido continua na lista mesmo quando nenhum registro carregado tem ele
    if (atual && !lista.some(([valor]) => valor === atual)) lista.push([atual, atual]);
    return lista.map(([valor, texto]) => `<option value="${escapeHtml(valor)}"${valor === atual ? ' selected' : ''}>${escapeHtml(texto)}</option>`).join('');
}

export function historicoComFiltros({ barra, botaoMais, buscarPagina, desenhar, busca, campos = [] }) {
    const estado = {
        registros: [], cursor: null, haMais: false, carregando: false, erro: false, pedido: 0,
        valores: { busca: '', quando: '', de: '', ate: '', ...Object.fromEntries(campos.map((c) => [c.chave, ''])) }
    };

    barra.innerHTML = `
        <div class="filtros-historico" role="search" aria-label="Filtrar o histórico">
            <label class="filtro-historico filtro-historico--busca"><span>Buscar</span>
                <input type="search" data-filtro="busca" placeholder="${escapeHtml(busca.dica)}" autocomplete="off"></label>
            <label class="filtro-historico"><span>Quando</span>
                <select data-filtro="quando">${QUANDO.map(([valor, texto]) => `<option value="${valor}">${texto}</option>`).join('')}</select></label>
            <label class="filtro-historico filtro-historico--data" hidden><span>De</span><input type="date" data-filtro="de"></label>
            <label class="filtro-historico filtro-historico--data" hidden><span>Até</span><input type="date" data-filtro="ate"></label>
            ${campos.map((campo) => `
                <label class="filtro-historico"><span>${escapeHtml(campo.rotulo)}</span>
                    <select data-filtro="${escapeHtml(campo.chave)}"></select></label>`).join('')}
        </div>
        <div class="filtros-historico-resumo">
            <span data-resumo aria-live="polite"></span>
            <button type="button" class="filtros-historico-limpar" data-limpar hidden>Limpar filtros</button>
        </div>`;

    const campo = (chave) => barra.querySelector(`[data-filtro="${chave}"]`);
    const filtrando = () => Object.entries(estado.valores)
        .some(([chave, valor]) => valor && !(['de', 'ate'].includes(chave) && estado.valores.quando !== 'datas'));
    const filtrados = () => filtrarRegistros(estado.registros, estado.valores, { campos, busca });

    function desenharOpcoes() {
        for (const c of campos) campo(c.chave).innerHTML = opcoesHtml(c.opcoes(estado.registros), estado.valores[c.chave], c.todos);
    }

    function marcarAtivos() {
        barra.querySelectorAll('[data-filtro]').forEach((elemento) => {
            const chave = elemento.dataset.filtro;
            const ativo = Boolean(estado.valores[chave]) && !(chave === 'quando' && estado.valores.quando === '');
            elemento.closest('.filtro-historico').classList.toggle('filtro-historico--ativo', ativo);
        });
        const datas = estado.valores.quando === 'datas';
        barra.querySelectorAll('.filtro-historico--data').forEach((rotulo) => { rotulo.hidden = !datas; });
    }

    function textoDoResumo(quantos) {
        // sem nada carregado, a própria tabela diz que está carregando ou que deu erro
        if (!estado.registros.length && (estado.carregando || estado.erro)) return '';
        if (estado.erro) return 'Não foi possível carregar os registros mais antigos agora.';
        if (estado.carregando) return 'Procurando nos registros mais antigos...';
        const total = estado.registros.length;
        const plural = (n) => `${n} ${n === 1 ? 'registro' : 'registros'}`;
        const recentes = estado.haMais ? ' mais recentes' : '';
        return filtrando() ? `${quantos} de ${plural(total)}${recentes}` : `${plural(total)}${recentes}`;
    }

    function atualizar() {
        const lista = filtrados();
        marcarAtivos();
        const texto = textoDoResumo(lista.length);
        barra.querySelector('[data-resumo]').innerHTML = texto ? `<strong>${escapeHtml(texto)}</strong>` : '';
        barra.querySelector('[data-limpar]').hidden = !filtrando();
        if (botaoMais) {
            botaoMais.hidden = !estado.haMais;
            botaoMais.disabled = estado.carregando;
            botaoMais.textContent = estado.carregando ? 'Carregando...' : 'Carregar mais antigos';
        }
        desenhar(lista, { filtrando: filtrando(), carregando: estado.carregando && !estado.registros.length, erro: estado.erro && !estado.registros.length });
        return lista;
    }

    async function carregarPagina() {
        const pedido = estado.pedido;
        estado.carregando = true;
        atualizar();
        try {
            const pagina = await buscarPagina(estado.cursor);
            if (pedido !== estado.pedido) return false;
            estado.registros.push(...pagina.registros);
            estado.cursor = pagina.cursor;
            estado.haMais = Boolean(pagina.haMais);
            estado.erro = false;
        } catch (erro) {
            if (pedido !== estado.pedido) return false;
            console.error('Erro ao carregar o histórico:', erro);
            estado.erro = true;
        } finally {
            if (pedido === estado.pedido) {
                estado.carregando = false;
                desenharOpcoes();
                atualizar();
            }
        }
        return pedido === estado.pedido && !estado.erro;
    }

    // com filtro e pouco resultado, procura nos mais antigos sozinha
    async function completar() {
        const [inicio] = periodo(estado.valores);
        for (let paginas = 0; paginas < PAGINAS_SOZINHA; paginas += 1) {
            if (!filtrando() || !estado.haMais || estado.carregando) return;
            if (filtrados().length >= POR_PAGINA_MINIMO) return;
            const maisAntigo = estado.registros.at(-1);
            // o que falta carregar é anterior ao começo do período escolhido
            if (inicio !== null && maisAntigo && momento(maisAntigo.em) < inicio) return;
            if (!(await carregarPagina())) return;
        }
    }

    let espera = null;
    function aoMudarFiltro(evento) {
        const chave = evento.target.dataset.filtro;
        if (!chave) return;
        estado.valores[chave] = evento.target.value;
        // digitação: espera a pessoa parar para procurar nos mais antigos
        clearTimeout(espera);
        atualizar();
        espera = setTimeout(completar, chave === 'busca' ? 400 : 0);
    }

    barra.addEventListener('input', aoMudarFiltro);
    barra.addEventListener('change', aoMudarFiltro);
    barra.querySelector('[data-limpar]').addEventListener('click', () => {
        Object.keys(estado.valores).forEach((chave) => { estado.valores[chave] = ''; });
        barra.querySelectorAll('[data-filtro]').forEach((elemento) => { elemento.value = ''; });
        desenharOpcoes();
        atualizar();
    });
    botaoMais?.addEventListener('click', async () => {
        if (!estado.carregando && estado.haMais) await carregarPagina();
    });

    desenharOpcoes();

    return {
        // lê de novo a primeira página (ao abrir a aba), mantendo os filtros
        async recarregar() {
            estado.pedido += 1;
            estado.registros = [];
            estado.cursor = null;
            estado.haMais = false;
            estado.erro = false;
            estado.carregando = false;
            if (await carregarPagina()) await completar();
        },
        filtrados,
        get registros() { return estado.registros; }
    };
}
