// Parte comum dos roteiros pagina-noticias.js e painel-noticias.js: monta uma
// das telas de notícias com os dados de mentira no lugar do Firestore.
//
// As duas telas falam com o Firebase só através de assets/js/noticias-dados.js.
// Aqui o código da tela é carregado com esse import apontando para
// /testes/noticias-dados-simulado.js, que guarda tudo em window.teste.
import { montarPagina } from './base.js';
import { noticiasDeExemplo } from './noticias-exemplo.js';

// Se alguém criar uma função nova em noticias-dados.js e esquecer da cópia de
// mentira, a tela quebraria no meio do teste com um erro difícil de entender.
async function conferirQueACopiaEstaCompleta() {
    const [real, simulado] = await Promise.all([
        import('/assets/js/noticias-dados.js'),
        import('/testes/noticias-dados-simulado.js')
    ]);
    const faltando = Object.keys(real).filter((nome) => !(nome in simulado));
    if (faltando.length) {
        throw new Error(`noticias-dados-simulado.js não tem: ${faltando.join(', ')}`);
    }
}

// opcoes: { noticias, demora, falhar, logado, admin, semColeta } — ver
// noticias-dados-simulado.js
export function prepararEstado(opcoes = {}) {
    window.teste = {
        ...(window.teste || {}),
        noticias: opcoes.noticias || noticiasDeExemplo(),
        gravacoes: [],
        falhar: opcoes.falhar || null,
        demora: opcoes.demora ?? 250,
        logado: opcoes.logado !== false,
        admin: opcoes.admin !== false,
        proximasNovas: 2,
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
