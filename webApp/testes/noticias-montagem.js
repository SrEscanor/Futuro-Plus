// Parte comum dos roteiros pagina-noticias.js e painel-noticias.js: monta uma
// das telas de notícias com os dados de mentira no lugar do Firestore.
//
// As duas telas falam com o Firebase só através de assets/js/noticias-dados.js.
// Aqui o código da tela é carregado com esse import apontando para
// /testes/noticias-dados-simulado.js, que guarda tudo em window.teste.
import { montarPagina } from './base.js';
import { noticiasDeExemplo } from './noticias-exemplo.js';
import { noticiasPropriasDeExemplo } from './noticias-proprias-exemplo.js';

// A notícia do Futuro+ de noticias-proprias-exemplo.js como ela fica na
// coleção do site (o card azul da aba No site): 'np-publicada' ou
// 'np-agendada' (publicarEm daqui a 26 horas).
export function propriaNoSite(id = 'np-publicada') {
    return { ...noticiasPropriasDeExemplo().publicadas.get(id), status: 'aprovada' };
}

// Se alguém criar uma função nova em noticias-dados.js e esquecer da cópia de
// mentira, a tela quebraria no meio do teste com um erro difícil de entender.
export async function conferirQueACopiaEstaCompleta() {
    const [real, simulado] = await Promise.all([
        import('/assets/js/noticias-dados.js'),
        import('/testes/noticias-dados-simulado.js')
    ]);
    const faltando = Object.keys(real).filter((nome) => !(nome in simulado));
    if (faltando.length) {
        throw new Error(`noticias-dados-simulado.js não tem: ${faltando.join(', ')}`);
    }
}

// Registros do histórico do painel, feitos a partir das notícias de exemplo:
// quem aprovou e quem recusou, uma busca pelo botão e uma limpeza automática.
function historicoDeExemplo(lista) {
    const noticias = lista || noticiasDeExemplo();
    const hora = 3600 * 1000;
    const agora = Date.now();
    const em = (horas) => new Date(agora - horas * hora).toISOString();
    // a aprovação das notícias do Futuro+ fica no histórico do painel Notícias próprias
    const registros = [
        ...noticias.filter((n) => n.status === 'aprovada' && !n.propria).slice(0, 3).map((n, i) => ({
            noticiaId: n.id, titulo: n.titulo, acao: 'aprovou', detalhe: '', email: i ? 'ana@teste' : 'victor@teste', horas: 2 + i * 5
        })),
        ...noticias.filter((n) => n.status === 'recusada').slice(0, 1).map((n) => ({
            noticiaId: n.id, titulo: n.titulo, acao: 'recusou', detalhe: '', email: 'ana@teste', horas: 20
        })),
        { noticiaId: '', titulo: '', acao: 'buscou', detalhe: '3 novas na fila', email: 'victor@teste', horas: 26 },
        { noticiaId: '', titulo: '', acao: 'tirou_antigas', detalhe: '4 notícias com mais de 90 dias', email: 'automático', horas: 28 },
        { noticiaId: '', titulo: '', acao: 'limpou', detalhe: '2 recusadas com mais de 30 dias', email: 'automático', horas: 30 }
    ];
    return registros.map(({ horas, ...registro }, indice) => ({ id: `hx${indice + 1}`, uid: 'u1', em: em(horas), ...registro }));
}

// O carrossel da Início a partir de uma lista de ids (o título guardado vem
// da notícia; id que não existe vira uma notícia que "saiu do site").
function destaquesDeExemplo(ids, noticias) {
    if (!ids) return null;
    return {
        itens: ids.map((id) => ({ id, titulo: noticias.find((n) => n.id === id)?.titulo || 'Notícia que saiu do site' })),
        atualizadoEm: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
        atualizadoPor: 'ana@teste'
    };
}

// opcoes: { noticias, demora, falhar, logado, admin, semColeta, propriasPendentes, historicoNoticias,
// destaques (ids do carrossel da Início) } — ver noticias-dados-simulado.js
export function prepararEstado(opcoes = {}) {
    const noticias = opcoes.noticias || noticiasDeExemplo();
    window.teste = {
        ...(window.teste || {}),
        noticias,
        destaques: destaquesDeExemplo(opcoes.destaques, noticias),
        gravacoes: [],
        falhar: opcoes.falhar || null,
        demora: opcoes.demora ?? 250,
        logado: opcoes.logado !== false,
        admin: opcoes.admin !== false,
        proximasNovas: 2,
        // notícias próprias esperando aprovação (o card azul no alto das Pendentes)
        propriasPendentes: opcoes.propriasPendentes || [],
        // o histórico do painel (aba Histórico)
        historicoNoticias: opcoes.historicoNoticias || historicoDeExemplo(opcoes.noticias || null),
        // a busca automática das 6 horas, com uma fonte que falhou
        ultimaColeta: opcoes.semColeta ? null : {
            coletadaEm: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
            origem: 'agendada',
            novas: 3,
            repetidas: 58,
            fontes: [
                { id: 'cps', nome: 'Centro Paula Souza', encontradas: 24, erro: null },
                { id: 'agenciasp-etec', nome: 'Agência SP · Etec', encontradas: 4, erro: null },
                { id: 'agenciasp-fatec', nome: 'Agência SP · Fatec', encontradas: 4, erro: null },
                { id: 'google', nome: 'Google Notícias', encontradas: 0, erro: 'o site demorou demais para responder' }
            ]
        }
    };
    return window.teste;
}

// arquivoHtml: '/noticias.html'; nomeDoScript: 'noticias.js' (o da tag
// <script> da página, que sai do HTML e entra de novo com o import trocado).
export async function montarTelaDeNoticias(arquivoHtml, nomeDoScript) {
    await conferirQueACopiaEstaCompleta();
    await montarPagina(arquivoHtml, `/${nomeDoScript}`);

    let codigo = await (await fetch(`/assets/js/${nomeDoScript}?t=${Date.now()}`)).text();
    const antes = codigo;
    codigo = codigo.replace(/from "\/assets\/js\/noticias-dados\.js[^"]*"/, 'from "/testes/noticias-dados-simulado.js"');
    if (codigo === antes) throw new Error(`${nomeDoScript} não importa ./noticias-dados.js`);
    if (/firebase/.test(codigo.replace(/\/\/.*$/gm, ''))) {
        throw new Error(`${nomeDoScript} importa o Firebase direto; o acesso deve passar por noticias-dados.js`);
    }

    codigo = codigo
        .replace(/from "\//g, `from "${location.origin}/`)
        .replace(/import\("\//g, `import("${location.origin}/`);
    await import(URL.createObjectURL(new Blob([codigo], { type: 'text/javascript' })));

    // tempo de a tela pedir os dados e desenhar (a cópia de mentira demora de propósito)
    await new Promise((r) => setTimeout(r, (window.teste.demora ?? 250) * 2 + 600));
    document.getElementById('tb-overlay')?.remove();
}

export const texto = (seletor) => document.querySelector(seletor)?.innerText.replace(/\s+/g, ' ') ?? null;
