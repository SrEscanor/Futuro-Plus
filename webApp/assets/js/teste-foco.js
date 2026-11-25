// O painel azul da tela de foco dos testes (teste rápido, afinidades e
// vocacional, com o visual em teste-foco.css): o anel de progresso, o que já
// dá para mostrar (o perfil ao vivo, a ordem escolhida ou os blocos) e o
// botão de olho que esconde tudo isso. A escolha do olho fica guardada no
// navegador e vale para os três testes.
//
// Cada página traz o painel no HTML, com estes ids: foco-olho (o botão),
// foco-progresso (o que o olho esconde), foco-progresso-oculto (o aviso que
// aparece no lugar), foco-anel, foco-anel-titulo e foco-anel-detalhe.

const CHAVE_OCULTO = 'futuroplus_teste_progresso_oculto';

const OLHO = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" '
    + 'stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/>'
    + '<circle cx="12" cy="12" r="3"/></svg>';
const OLHO_FECHADO = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" '
    + 'stroke-linejoin="round" aria-hidden="true"><path d="M3 3l18 18"/><path d="M10.6 5.1A9.9 9.9 0 0 1 12 5c6.4 0 10 7 10 7'
    + 'a17.6 17.6 0 0 1-3.2 4.2M6.6 6.6C3.8 8.4 2 12 2 12s3.6 7 10 7a9.7 9.7 0 0 0 5.4-1.6"/>'
    + '<path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/></svg>';

const el = (id) => document.getElementById(id);

function lerOculto() {
    try {
        return localStorage.getItem(CHAVE_OCULTO) === '1';
    } catch {
        return false;
    }
}

function guardarOculto(oculto) {
    try {
        localStorage.setItem(CHAVE_OCULTO, oculto ? '1' : '0');
    } catch {
        // sem acesso ao armazenamento: vale só nesta visita
    }
}

// Liga o botão de olho. Escondido, some o progresso inteiro do painel (e, pelo
// CSS, a barra fina e o "Pergunta X de Y" em cima da pergunta) e entra um
// aviso curto no lugar.
export function ligarOlhoDoProgresso() {
    const botao = el('foco-olho');
    if (!botao) return;
    let oculto = lerOculto();

    const aplicar = () => {
        el('foco-progresso').hidden = oculto;
        el('foco-progresso-oculto').hidden = !oculto;
        document.querySelector('.foco')?.classList.toggle('foco--progresso-oculto', oculto);
        botao.setAttribute('aria-pressed', String(oculto));
        botao.innerHTML = `${oculto ? OLHO_FECHADO : OLHO}<span>${oculto ? 'Mostrar progresso' : 'Ocultar progresso'}</span>`;
        botao.title = oculto ? 'Mostrar de novo o progresso' : 'Esconder o progresso até o fim do teste';
    };

    botao.addEventListener('click', () => {
        oculto = !oculto;
        guardarOculto(oculto);
        aplicar();
    });
    aplicar();
}

// O anel: atual de total ("6/15"), com o título e o detalhe ao lado.
export function atualizarAnel(atual, total, titulo, detalhe = '') {
    const anel = el('foco-anel');
    if (!anel) return;
    const parte = total ? Math.round((Math.min(atual, total) / total) * 100) : 0;
    anel.style.setProperty('--p', `${parte}%`);
    anel.querySelector('span').textContent = `${atual}/${total}`;
    el('foco-anel-titulo').textContent = titulo;
    el('foco-anel-detalhe').textContent = detalhe;
}

function escapeHtml(texto) {
    return String(texto ?? '').replace(/[&<>"']/g, (c) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
}

// "Seu perfil até agora": uma barra por área, da que tem mais respostas
// para a que tem menos (empate fica na ordem de "nomes"). pontos: { área:
// quantas respostas }. A barra mostra a parte das respostas dadas até
// agora; a primeira, se tiver alguma, ganha o destaque. sufixo: '%' quando
// os valores já são porcentagens (o resultado no fim).
export function desenharPerfilVivo(lista, pontos, nomes, { sufixo = '' } = {}) {
    if (!lista) return;
    const areas = Object.keys(nomes);
    const total = areas.reduce((soma, area) => soma + (pontos[area] || 0), 0);
    const ordem = [...areas].sort((a, b) => (pontos[b] || 0) - (pontos[a] || 0));
    lista.innerHTML = ordem.map((area, indice) => {
        const valor = pontos[area] || 0;
        const largura = total ? Math.max(3, Math.round((valor / total) * 100)) : 3;
        return `<li class="${indice === 0 && valor ? 'perfil-lider' : ''}"><span>${escapeHtml(nomes[area])}</span>
            <span class="perfil-barra"><i style="width: ${largura}%"></i></span><b>${valor}${sufixo}</b></li>`;
    }).join('');
}

// O desenho de cada uma das 8 áreas, para os cartões de resposta.
const DESENHOS = {
    logica: '<circle cx="12" cy="12" r="1.6"/><path d="M20.2 20.2c2-2-.2-7.4-4.9-12.1S6 1.8 3.8 3.8s.2 7.4 4.9 12.1 10.1 6.3 11.5 4.3z"/><path d="M15.7 15.7c4.7-4.7 6.9-10.1 4.9-12.1s-7.4.2-12.1 4.9-6.3 10.1-4.3 11.5"/>',
    linguistica: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><path d="M8 9h8M8 13h5"/>',
    espacial: '<path d="M3 21h18M5 21V9l7-5 7 5v12"/><path d="M9 21v-6h6v6M9 11h.01M15 11h.01"/>',
    corporal: '<circle cx="14" cy="4.5" r="1.8"/><path d="M8 21l3-6 3 3v3M6 12l3-3 4 1 3 3h3"/><path d="M11 15l2-5"/>',
    musical: '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
    interpessoal: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/>',
    intrapessoal: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z"/>',
    naturalista: '<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.5 19 2c1 2 2 4.2 2 8 0 5.5-4.8 10-10 10z"/><path d="M2 21c0-3 1.9-5.4 5.1-6"/>'
};

export function desenhoDaArea(area) {
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"
        stroke-linejoin="round" aria-hidden="true">${DESENHOS[area] || DESENHOS.logica}</svg>`;
}
