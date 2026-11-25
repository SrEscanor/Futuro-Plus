// Funções puras das notícias próprias (as que o Futuro+ escreve no painel
// Admin · Notícias próprias). Usadas pelo painel, pela página da matéria
// (noticia.html) e pela lista de Notícias. Nada aqui toca no Firebase.

export const LIMITES = {
    titulo: 120,
    linhaApoio: 240,
    autor: 80,
    legenda: 200,
    credito: 80,
    paragrafo: 4000,
    intertitulo: 120,
    blocos: 40
};

export const AUTOR_PADRAO = 'Equipe Futuro+';

// A mesma regra do agendamento das notificações (admin-notificacoes.js):
// agendar só faz sentido com pelo menos 1 hora de folga.
export const MINIMO_AGENDAMENTO_MS = 60 * 60 * 1000;

// Etiquetas extras, que também valem para os filtros da página Notícias.
// Toda notícia própria já é "do Futuro+".
export const ETIQUETAS = { etec: 'Etec', fatec: 'Fatec' };

// Texto de cada ação do histórico ("fulano@... enviou para aprovação")
export const ACOES = {
    criou: 'criou o rascunho',
    editou: 'editou',
    enviou: 'enviou para aprovação',
    retirou: 'tirou da aprovação (voltou a rascunho)',
    devolveu: 'devolveu para rascunho',
    publicou: 'aprovou e publicou',
    agendou: 'aprovou e agendou',
    desagendou: 'cancelou o agendamento',
    despublicou: 'tirou do site',
    excluiu: 'excluiu',
    atualizou: 'atualizou a notícia publicada'
};

export const linkDaMateria = (id) => `noticia.html?id=${encodeURIComponent(id)}`;

// Data do Firestore (Timestamp), Date ou texto ISO -> Date (ou null)
export function paraData(valor) {
    if (!valor) return null;
    const data = typeof valor.toDate === 'function' ? valor.toDate() : new Date(valor);
    return Number.isNaN(data.getTime()) ? null : data;
}

// "15/11/2026 03h00"
export function dataHora(valor) {
    const data = paraData(valor);
    if (!data) return '';
    const dia = data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const hora = String(data.getHours()).padStart(2, '0');
    const minuto = String(data.getMinutes()).padStart(2, '0');
    return `${dia} ${hora}h${minuto}`;
}

// "há 13 horas", "há 2 dias", "agora há pouco"
export function haQuantoTempo(valor, agora = new Date()) {
    const data = paraData(valor);
    if (!data) return '';
    const minutos = Math.max(0, Math.round((agora - data) / 60000));
    if (minutos < 2) return 'agora há pouco';
    if (minutos < 60) return `há ${minutos} minutos`;
    const horas = Math.round(minutos / 60);
    if (horas < 24) return `há ${horas} ${horas === 1 ? 'hora' : 'horas'}`;
    const dias = Math.round(horas / 24);
    return dias === 1 ? 'há 1 dia' : `há ${dias} dias`;
}

// O caminho de uma notícia própria:
//   rascunho  -> pendente (só completa) -> aprovada: publicada agora ou agendada
// Nada vai ao site sem passar por "pendente". Uma notícia que já está no site
// pode ganhar mudanças em rascunho ou pendentes: o site continua mostrando a
// versão aprovada até a aprovação das mudanças.

// Situação de verdade: a agendada cuja hora já chegou está publicada.
export function situacao(noticia, agora = new Date()) {
    const status = noticia?.status || 'rascunho';
    if (status === 'agendada' && noticia.publicarEm && paraData(noticia.publicarEm) <= agora) return 'publicada';
    return status;
}

// Está no ar agora (mesmo que tenha mudanças em rascunho ou pendentes).
export function noSite(noticia, agora = new Date()) {
    const publicada = paraData(noticia?.publicadaEm);
    return Boolean(publicada) && publicada <= agora;
}

// Agendada para uma hora que ainda não chegou.
export function agendadaParaDepois(noticia, agora = new Date()) {
    return noticia?.status === 'agendada' && paraData(noticia.publicarEm) > agora;
}

// Texto de uma linha só, sem espaço sobrando, cortado no limite.
export function textoCurto(texto, limite) {
    return String(texto ?? '').replace(/\s+/g, ' ').trim().slice(0, limite);
}

// Texto que pode ter quebra de linha (parágrafo).
export function textoLongo(texto, limite) {
    return String(texto ?? '').replace(/\r\n?/g, '\n').replace(/\n{3,}/g, '\n\n').trim().slice(0, limite);
}

// Link no parágrafo, escrito como no Markdown: [texto do link](endereço). O
// botão de link do editor (e o Ctrl+K) escreve assim. O texto do link não
// tem colchete nem quebra de linha; o endereço não tem espaço, e parêntese
// nele só aos pares (os da Wikipédia, por exemplo).
const LINK = /\[([^[\]\n]+)\]\(((?:[^\s()]|\([^\s()]*\))+)\)/g;

// Endereços do próprio site: abrem na mesma aba.
const DO_SITE = new Set(['futuroplus.com.br', 'www.futuroplus.com.br']);

// O endereço de um link, conferido: só http(s), com um domínio de verdade,
// ou mailto com um e-mail. Qualquer outra coisa (javascript:, data:...)
// devolve '' e o trecho fica como foi escrito, sem virar link.
function enderecoConferido(endereco) {
    const texto = String(endereco ?? '').trim();
    if (/^mailto:/i.test(texto)) {
        return /^mailto:[^\s@<>"'()]+@[^\s@<>"'()]+\.[^\s@<>"'()]+$/i.test(texto) ? texto : '';
    }
    try {
        const url = new URL(texto);
        const dominioOk = url.hostname.includes('.') || url.hostname === 'localhost';
        return ['https:', 'http:'].includes(url.protocol) && dominioOk && !url.username && !url.password
            ? url.href : '';
    } catch {
        return '';
    }
}

// O que o editor grava a partir do que a pessoa digitou no campo do
// endereço: "www.etec.sp.gov.br" e "etec.sp.gov.br/cursos" ganham o
// https://, um e-mail vira mailto: e uma página do próprio site
// ("/cursos.html" ou "curso.html?c=quimica") ganha o endereço do site.
// Parênteses vão codificados (%28 e %29), para não confundir o fim do link.
// Inválido: ''.
export function enderecoDoLink(digitado) {
    let texto = String(digitado ?? '').trim();
    if (!texto || /\s/.test(texto)) return '';
    const temProtocolo = /^[a-z][a-z0-9+.-]*:/i.test(texto);
    if (/^[^@/:]+@[^@/:]+\.[^@/:]+$/.test(texto)) texto = `mailto:${texto}`;
    else if (/^\/(?!\/)/.test(texto)) texto = `https://futuroplus.com.br${texto}`;
    else if (!temProtocolo && /^[\w-]+\.html?(?:[?#]|$)/i.test(texto)) texto = `https://futuroplus.com.br/${texto}`;
    else if (!temProtocolo && /^[\p{L}\p{N}-]+(\.[\p{L}\p{N}-]+)+(\/|\?|#|:\d|$)/u.test(texto)) {
        texto = `https://${texto}`;
    }
    return enderecoConferido(texto).replace(/\(/g, '%28').replace(/\)/g, '%29');
}

// O link em que está a seleção (ou o cursor), no texto cru do editor:
// { de, ate, rotulo, endereco } ou null. de e ate pegam a marcação toda,
// dos colchetes ao parêntese do fim.
export function linkNoTexto(texto, inicio, fim = inicio) {
    for (const achado of String(texto ?? '').matchAll(LINK)) {
        const de = achado.index;
        const ate = de + achado[0].length;
        if (de <= inicio && fim <= ate && !(inicio === ate && fim === ate)) {
            return { de, ate, rotulo: achado[1], endereco: achado[2] };
        }
    }
    return null;
}

// O texto do link do jeito que fica guardado: sem colchete (que fecharia o
// link antes da hora) nem quebra de linha.
export function marcacaoDoLink(rotulo, endereco) {
    const limpo = String(rotulo ?? '').replace(/\[/g, '(').replace(/\]/g, ')').replace(/\s+/g, ' ').trim();
    return `[${limpo}](${endereco})`;
}

const DESESCAPAR = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'" };
const PARA_ATRIBUTO = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

// Negrito e itálico no parágrafo, marcados no editor como **assim** e
// _assim_ (os botões B e I e o Ctrl+B / Ctrl+I do painel põem as marcas),
// e os links [assim](https://...). Recebe o texto JÁ escapado: o escapeHtml
// não mexe em asterisco, sublinhado, colchete nem parêntese, então só os
// pares de marcas viram <strong>, <em> e <a>, e nenhum HTML de quem escreveu
// passa. Como no Markdown, o trecho não começa nem termina com espaço ("****
// e **" não vira negrito) e o _ só vale fora de palavra (nome_de_arquivo
// continua como está). Marca sem par aparece como está, e nada atravessa a
// quebra de linha. Os dois juntos: _**assim**_. O link sai primeiro, para o
// _ e o ** de dentro do endereço não virarem itálico ou negrito; o texto
// dele pode ter os dois. Link de fora abre em outra aba.
export function formatacaoEmHtml(textoEscapado) {
    const marcas = (texto) => texto
        .replace(/\*\*([^*\s](?:[^*\n]*[^*\s])?)\*\*/g, '<strong>$1</strong>')
        .replace(/(^|[^\p{L}\p{N}_])_([^_\s](?:[^_\n]*[^_\s])?)_(?![\p{L}\p{N}_])/gu, '$1<em>$2</em>');
    const links = [];
    // \u0001 e \u0002 guardam o lugar de cada link enquanto as marcas entram
    const comLugares = String(textoEscapado ?? '').replace(/[\u0001\u0002]/g, '')
        .replace(LINK, (inteiro, rotulo, endereco) => {
            const url = enderecoConferido(endereco.replace(/&(amp|lt|gt|quot|#39);/g, (c) => DESESCAPAR[c]));
            if (!url) return inteiro;
            const doSite = !/^mailto:/i.test(url) && DO_SITE.has(new URL(url).hostname);
            const href = url.replace(/[&<>"']/g, (c) => PARA_ATRIBUTO[c]);
            links.push(`<a href="${href}"${doSite || /^mailto:/i.test(url) ? ''
                : ' target="_blank" rel="noopener noreferrer"'}>${marcas(rotulo)}</a>`);
            return `\u0001${links.length - 1}\u0002`;
        });
    return marcas(comLugares).replace(/\u0001(\d+)\u0002/g, (_, indice) => links[Number(indice)]);
}

// Imagem só por https (as do Storage). No computador de quem desenvolve
// (emulador e roteiros de teste) também vale http://localhost.
function imagemLimpa(imagem) {
    const url = String(imagem?.url || '').trim();
    if (!/^https:\/\//i.test(url) && !/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?\//i.test(url)) return null;
    return {
        url,
        legenda: textoCurto(imagem.legenda, LIMITES.legenda),
        credito: textoCurto(imagem.credito, LIMITES.credito)
    };
}

// Os blocos do texto, limpos: parágrafo e intertítulo vazios saem, imagem
// sem endereço sai.
export function blocosLimpos(blocos) {
    return (Array.isArray(blocos) ? blocos : [])
        .map((bloco) => {
            if (bloco?.tipo === 'paragrafo') {
                const texto = textoLongo(bloco.texto, LIMITES.paragrafo);
                return texto ? { tipo: 'paragrafo', texto } : null;
            }
            if (bloco?.tipo === 'intertitulo') {
                const texto = textoCurto(bloco.texto, LIMITES.intertitulo);
                return texto ? { tipo: 'intertitulo', texto } : null;
            }
            if (bloco?.tipo === 'imagem') {
                const imagem = imagemLimpa(bloco);
                return imagem ? { tipo: 'imagem', ...imagem } : null;
            }
            return null;
        })
        .filter(Boolean)
        .slice(0, LIMITES.blocos);
}

// O conteúdo da notícia, limpo, do jeito que é guardado.
export function conteudoLimpo(noticia) {
    const etiquetas = (Array.isArray(noticia.etiquetas) ? noticia.etiquetas : []).filter((id) => id in ETIQUETAS);
    return {
        titulo: textoCurto(noticia.titulo, LIMITES.titulo),
        linhaApoio: textoCurto(noticia.linhaApoio, LIMITES.linhaApoio),
        autor: textoCurto(noticia.autor, LIMITES.autor) || AUTOR_PADRAO,
        etiquetas: [...new Set(etiquetas)],
        imagem: imagemLimpa(noticia.imagem),
        blocos: blocosLimpos(noticia.blocos)
    };
}

// O que ainda falta para dar para publicar ou agendar (lista vazia = pode).
export function oQueFalta(noticia) {
    const conteudo = conteudoLimpo(noticia);
    const falta = [];
    if (!conteudo.titulo) falta.push('o título');
    if (!conteudo.linhaApoio) falta.push('a linha de apoio');
    if (!conteudo.imagem) falta.push('a imagem principal');
    if (!conteudo.blocos.some((bloco) => bloco.tipo === 'paragrafo')) falta.push('pelo menos um parágrafo');
    return falta;
}

// O que vai para a coleção pública "noticias". Os campos titulo, resumo,
// imagem, fonte, instituicoes e publicadaEm são os mesmos das notícias de
// fora, para a lista e a Início mostrarem sem caso especial; o resto é o
// texto da matéria.
export function camposPublicos(noticia) {
    const conteudo = conteudoLimpo(noticia);
    return {
        propria: true,
        titulo: conteudo.titulo,
        resumo: conteudo.linhaApoio,
        linhaApoio: conteudo.linhaApoio,
        autor: conteudo.autor,
        fonte: 'Futuro+',
        link: '',
        imagem: conteudo.imagem?.url || '',
        imagemLegenda: conteudo.imagem?.legenda || '',
        imagemCredito: conteudo.imagem?.credito || '',
        blocos: conteudo.blocos,
        instituicoes: conteudo.etiquetas,
        publicadaEm: noticia.publicadaEm || new Date().toISOString(),
        publicarEm: noticia.publicarEm || null,
        atualizadaEm: noticia.atualizadaEm || null
    };
}

// O que uma gravação muda, sem tocar no Firebase (o módulo de dados e a
// cópia de teste usam esta mesma função). noticia: o que está no editor,
// junto com o que já estava guardado. acao:
//   'rascunho'     guarda como rascunho, para continuar depois
//   'enviar'       manda para aprovação (só se estiver completa)
//   'aprovar'      aprova uma pendente: opcoes.quando 'agora' ou 'agendar'
//                  (com opcoes.publicarEm em ISO); opcoes.ajustes = true
//                  quando quem aprova mudou o texto (vai para o histórico)
//   'devolver'     a pendente volta a rascunho (opcoes.motivo, opcional)
//   'desagendar'   a agendada que ainda não foi ao ar volta a pendente
//   'despublicar'  tira do site e volta a rascunho
// Agendada que ainda não foi ao ar e é editada perde o agendamento (o texto
// mudou, então precisa de aprovação de novo). A que já está no site continua
// no ar, com a versão aprovada, enquanto as mudanças esperam.
// Devolve { registro, publica, acaoHistorico, detalhe }; publica é a cópia
// do site: um objeto (grava), null (apaga) ou undefined (não mexe).
export function prepararGravacao(noticia, acao, opcoes = {}, { email = '', agora = new Date().toISOString() } = {}) {
    const momento = new Date(agora);
    const antes = situacao(noticia, momento);
    const estaNoSite = noSite(noticia, momento);
    const agendada = agendadaParaDepois(noticia, momento);
    const nova = !noticia.criadaEm;
    const proxima = {
        status: noticia.status || 'rascunho',
        publicadaEm: noticia.publicadaEm || null,
        publicarEm: noticia.publicarEm || null,
        atualizadaEm: noticia.atualizadaEm || null,
        enviadaEm: noticia.enviadaEm || null,
        enviadaPor: noticia.enviadaPor || null,
        aprovadaEm: noticia.aprovadaEm || null,
        aprovadaPor: noticia.aprovadaPor || null
    };
    let publica;
    let acaoHistorico;
    let detalhe = '';
    // agendada que ainda não foi ao ar e mudou: o agendamento cai
    const cancelarAgendamento = () => {
        Object.assign(proxima, { publicadaEm: null, publicarEm: null });
        publica = null;
    };

    if (acao === 'rascunho') {
        acaoHistorico = antes === 'pendente' ? 'retirou' : (nova ? 'criou' : 'editou');
        if (agendada) {
            cancelarAgendamento();
            detalhe = 'e o agendamento foi cancelado';
        }
        proxima.status = 'rascunho';
    } else if (acao === 'enviar') {
        const falta = oQueFalta(noticia);
        if (falta.length) throw new Error(`Para enviar para aprovação, falta ${falta.join(', ')}.`);
        acaoHistorico = antes === 'pendente' ? 'editou' : 'enviou';
        if (antes === 'pendente') detalhe = 'e continua esperando aprovação';
        if (agendada) {
            cancelarAgendamento();
            detalhe = 'e o agendamento foi cancelado';
        }
        Object.assign(proxima, { status: 'pendente', enviadaEm: agora, enviadaPor: email });
    } else if (acao === 'aprovar') {
        if (antes !== 'pendente') throw new Error('Só dá para aprovar uma notícia que está pendente.');
        const falta = oQueFalta(noticia);
        if (falta.length) throw new Error(`Para aprovar, falta ${falta.join(', ')}.`);
        Object.assign(proxima, { aprovadaEm: agora, aprovadaPor: email });
        if (opcoes.quando === 'agendar') {
            if (estaNoSite) throw new Error('Esta notícia já está no site: as mudanças só podem entrar na hora.');
            if (!opcoes.publicarEm) throw new Error('Escolha a data da publicação.');
            acaoHistorico = 'agendou';
            detalhe = `para ${dataHora(opcoes.publicarEm)}`;
            Object.assign(proxima, {
                status: 'agendada', publicadaEm: opcoes.publicarEm, publicarEm: opcoes.publicarEm, atualizadaEm: null
            });
        } else {
            acaoHistorico = 'publicou';
            if (estaNoSite) detalhe = 'as alterações';
            Object.assign(proxima, {
                status: 'publicada',
                // a que já estava no ar mantém a data de publicação e ganha a de atualização
                publicadaEm: estaNoSite ? noticia.publicadaEm : agora,
                publicarEm: null,
                atualizadaEm: estaNoSite ? agora : null
            });
        }
        // quem aprovou mexeu no texto antes: fica registrado
        if (opcoes.ajustes) detalhe = [detalhe, 'com ajustes feitos na revisão'].filter(Boolean).join(', ');
    } else if (acao === 'devolver') {
        if (antes !== 'pendente') throw new Error('Só dá para devolver uma notícia que está pendente.');
        acaoHistorico = 'devolveu';
        detalhe = textoCurto(opcoes.motivo, 200);
        proxima.status = 'rascunho';
    } else if (acao === 'desagendar') {
        if (!agendada) throw new Error('Esta notícia não está agendada.');
        acaoHistorico = 'desagendou';
        cancelarAgendamento();
        proxima.status = 'pendente';
    } else if (acao === 'despublicar') {
        acaoHistorico = 'despublicou';
        Object.assign(proxima, { status: 'rascunho', publicadaEm: null, publicarEm: null, atualizadaEm: null });
        publica = null;
    } else {
        throw new Error(`Ação desconhecida: ${acao}`);
    }

    const registro = {
        ...conteudoLimpo(noticia),
        ...proxima,
        criadaEm: noticia.criadaEm || agora,
        criadaPor: noticia.criadaPor || email,
        alteradaEm: agora,
        alteradaPor: email
    };
    // só a aprovação mexe no que o site mostra (além de tirar do ar)
    if (acao === 'aprovar') publica = camposPublicos(registro);
    return { registro, publica, acaoHistorico, detalhe };
}

// O "datetime-local" do formulário <-> texto ISO (hora de Brasília do
// navegador, como nas notificações)
export function paraDatetimeLocal(valor) {
    const data = paraData(valor);
    if (!data) return '';
    const deslocado = new Date(data.getTime() - data.getTimezoneOffset() * 60000);
    return deslocado.toISOString().slice(0, 16);
}

export function deDatetimeLocal(texto) {
    if (!texto) return null;
    const data = new Date(texto);
    return Number.isNaN(data.getTime()) ? null : data.toISOString();
}
