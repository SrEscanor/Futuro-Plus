// Chama atenção pro botão do assistente até a pessoa abrir o chat pela
// primeira vez. Depois disso, para de "incomodar" — quem já sabe que o
// botão existe não precisa continuar vendo isso a cada visita.
const CHAVE_JA_ABRIU = 'futuroplus_chat_ja_abriu';
const INTERVALO_ACENO_MS = 45000;
const ATRASO_BALAO_MS = 0;
const DURACAO_BALAO_MS = 8000;

function jaAbriuAntes() {
    try {
        return localStorage.getItem(CHAVE_JA_ABRIU) === '1';
    } catch {
        return false;
    }
}

function marcarComoAberto() {
    try {
        localStorage.setItem(CHAVE_JA_ABRIU, '1');
    } catch {
        // localStorage bloqueado (modo privado etc.) — sem problema, só não lembra pra próxima visita
    }
}

// pausar: função opcional que diz se algo mais importante está na tela
// agora (ex.: o tour de boas-vindas) e as táticas de atenção devem esperar.
export function iniciarAtencaoChat({ pausar = () => false } = {}) {
    const botao = document.getElementById('chatbot-toggle');
    if (!botao || jaAbriuAntes()) return;

    const bolinha = document.createElement('span');
    bolinha.className = 'chat-notificacao-bolinha';
    botao.appendChild(bolinha);

    function mostrarBalaoDeFala() {
        if (jaAbriuAntes() || pausar() || document.getElementById('chat-balao-fala')) return;
        const balao = document.createElement('div');
        balao.id = 'chat-balao-fala';
        balao.className = 'chat-balao-fala';
        balao.innerHTML = '👋 Posso te ajudar a achar seu curso! <button type="button" class="chat-balao-fechar" aria-label="Fechar">×</button>';
        document.body.appendChild(balao);
        // Fechar no X conta como "já visto": some daqui pra frente em
        // qualquer tela, igual clicar no próprio botão do chat.
        balao.querySelector('.chat-balao-fechar').addEventListener('click', (e) => {
            e.stopPropagation();
            balao.remove();
            marcarComoAberto();
            bolinha.remove();
            clearTimeout(timeoutBalao);
            clearInterval(intervaloAceno);
        });
        setTimeout(() => balao.remove(), DURACAO_BALAO_MS);
    }

    // Se algo mais importante estiver na tela (o tour, por exemplo), não
    // desiste — só adia a contagem até liberar, em vez de checar uma única
    // vez e nunca mais tentar.
    let timeoutBalao;
    function agendarBalao() {
        if (jaAbriuAntes()) return;
        if (pausar()) {
            timeoutBalao = setTimeout(agendarBalao, 1000);
            return;
        }
        timeoutBalao = setTimeout(mostrarBalaoDeFala, ATRASO_BALAO_MS);
    }
    agendarBalao();

    const intervaloAceno = setInterval(() => {
        if (jaAbriuAntes() || pausar()) return;
        botao.classList.add('chat-btn-aceno');
        setTimeout(() => botao.classList.remove('chat-btn-aceno'), 900);
    }, INTERVALO_ACENO_MS);

    botao.addEventListener('click', () => {
        marcarComoAberto();
        bolinha.remove();
        document.getElementById('chat-balao-fala')?.remove();
        clearTimeout(timeoutBalao);
        clearInterval(intervaloAceno);
    }, { once: true });
}
