// Funções puras das notificações: usadas pelo painel Admin · Notificações,
// pelo sino e pelo aviso do site (notificacoes.js) e pelo push
// (notificacoes-push.js). Nada aqui toca no Firebase.

// O link de uma notificação: uma página do próprio site
// ("noticia.html?id=...", "perfil.html") ou um endereço https (notícia de
// outro site). Qualquer outra coisa ("javascript:", http sem s...) vira
// vazio. A mesma regra está no servidor (functions/main.py) e no service
// worker (public/firebase-messaging-sw.js).
export function linkSeguroDaNotificacao(link) {
    const texto = String(link ?? '').trim();
    if (/^[a-z0-9-]+\.html(\?[^\s#]*)?$/i.test(texto)) return texto;
    if (/^https:\/\/\S+$/i.test(texto) && texto.length <= 1000) return texto;
    return '';
}

export const ehLinkExterno = (link) => /^https:\/\//i.test(String(link ?? ''));

// Para onde a notificação leva quem clica: a notícia do Futuro+ abre a
// matéria no próprio site; a de outro site, o endereço original (o mesmo do
// botão "Ler no site" da página Notícias).
export function linkDaNoticia(noticia) {
    if (!noticia?.id) return '';
    if (noticia.propria) return `noticia.html?id=${encodeURIComponent(noticia.id)}`;
    return linkSeguroDaNotificacao(noticia.link);
}

// O que a notificação guarda da notícia ligada, para o painel mostrar qual é
// sem buscar de novo.
export function noticiaLigada(noticia) {
    return {
        id: String(noticia.id),
        titulo: String(noticia.titulo || '').trim().slice(0, 200),
        fonte: noticia.propria ? 'Futuro+' : String(noticia.fonte || '').trim().slice(0, 80),
        propria: Boolean(noticia.propria),
        imagem: String(noticia.imagem || '').trim().slice(0, 1000)
    };
}

// Título e mensagem sugeridos ao escolher a notícia (só entram nos campos
// que estiverem vazios).
export function textoSugerido(noticia) {
    const resumo = String(noticia.resumo || noticia.linhaApoio || '').trim();
    return {
        titulo: String(noticia.titulo || '').trim().slice(0, 120),
        mensagem: resumo || 'Toque para ler a matéria completa.'
    };
}

// Texto de cada ação do histórico ("fulano@... criou")
export const ACOES_NOTIFICACAO = {
    criou: 'criou',
    editou: 'editou',
    ativou: 'ativou',
    desativou: 'desativou',
    excluiu: 'excluiu'
};

const PUBLICO = { logados: 'só quem tem conta', deslogados: 'só visitante', todos: 'todo mundo' };

function listaBonita(itens) {
    return itens.length < 2 ? itens.join('') : `${itens.slice(0, -1).join(', ')} e ${itens.at(-1)}`;
}

function dataCurta(iso) {
    const data = new Date(iso || '');
    if (Number.isNaN(data.getTime())) return '';
    const dia = data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    return `${dia} ${String(data.getHours()).padStart(2, '0')}h${String(data.getMinutes()).padStart(2, '0')}`;
}

const ativa = (notificacao) => notificacao?.ativo !== false;

// O que comparar entre o antes e o depois, com o nome que aparece no histórico.
const PARTES = [
    ['o texto', (n) => `${n.titulo || ''}\n${n.mensagem || ''}`],
    ['o público', (n) => n.publico || 'logados'],
    ['onde aparece', (n) => [n.mostrarModal, n.mostrarSino, n.enviarPush].map(Boolean).join()],
    ['o agendamento', (n) => n.publicarEm || ''],
    ['a notícia', (n) => n.link || '']
];

// Compara a notificação antes (null = nova) e depois de salvar. Devolve
// { acao, detalhe } para o histórico, ou null quando nada mudou.
export function oQueMudou(antes, depois) {
    if (!antes) {
        const partes = [];
        if (depois.noticia?.titulo) partes.push(`com a notícia “${depois.noticia.titulo}”`);
        if (depois.publicarEm) partes.push(`agendada para ${dataCurta(depois.publicarEm)}`);
        partes.push(`para ${PUBLICO[depois.publico || 'logados']}`);
        if (depois.enviarPush) partes.push('com push no dispositivo');
        if (!ativa(depois)) partes.push('desativada');
        return { acao: 'criou', detalhe: partes.join(', ') };
    }

    const mudou = PARTES.filter(([, valor]) => valor(antes) !== valor(depois)).map(([nome]) => nome);
    const trocouAtiva = ativa(antes) !== ativa(depois);
    if (!mudou.length && !trocouAtiva) return null;
    if (!mudou.length) return { acao: ativa(depois) ? 'ativou' : 'desativou', detalhe: '' };

    const partes = [`mudou ${listaBonita(mudou)}`];
    if (mudou.includes('a notícia')) {
        partes.push(depois.noticia?.titulo ? `agora leva para “${depois.noticia.titulo}”` : 'não leva mais para uma notícia');
    }
    if (trocouAtiva) partes.push(ativa(depois) ? 'e ativou' : 'e desativou');
    return { acao: 'editou', detalhe: partes.join(', ') };
}
