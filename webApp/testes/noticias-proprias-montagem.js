// Parte comum dos roteiros painel-noticias-proprias.js e pagina-noticia.js:
// monta a tela com os dados de mentira no lugar do Firebase.
//
// As duas telas falam com o Firebase só através de
// assets/js/noticias-proprias-dados.js. Aqui o código da tela é carregado com
// esse import apontando para /testes/noticias-proprias-simulado.js, que guarda
// tudo em window.teste.
import { montarPagina } from './base.js';
import { noticiasPropriasDeExemplo } from './noticias-proprias-exemplo.js';

// Função nova no módulo de verdade sem a cópia de mentira quebraria o teste
// no meio, com um erro difícil de entender.
async function conferirQueACopiaEstaCompleta() {
    const [real, simulado] = await Promise.all([
        import('/assets/js/noticias-proprias-dados.js'),
        import('/testes/noticias-proprias-simulado.js')
    ]);
    const faltando = Object.keys(real).filter((nome) => !(nome in simulado));
    if (faltando.length) throw new Error(`noticias-proprias-simulado.js não tem: ${faltando.join(', ')}`);
}

// opcoes: { vazio, falhar, demora, logado, admin, email }
export function prepararEstado(opcoes = {}) {
    const exemplo = noticiasPropriasDeExemplo();
    window.teste = {
        ...(window.teste || {}),
        proprias: opcoes.vazio ? new Map() : exemplo.proprias,
        publicadas: opcoes.vazio ? new Map() : exemplo.publicadas,
        historico: opcoes.vazio ? [] : exemplo.historico,
        gravacoes: [],
        falhar: opcoes.falhar || null,
        demora: opcoes.demora ?? 200,
        logado: opcoes.logado !== false,
        admin: opcoes.admin !== false,
        email: opcoes.email || 'victor@teste'
    };
    return window.teste;
}

// arquivoHtml: '/admin-noticias-proprias.html'; nomeDoScript: o da tag <script>
// da página. endereco: para onde a barra de endereço vai antes de a tela
// rodar (a página da matéria lê o ?id=).
export async function montarTela(arquivoHtml, nomeDoScript, { endereco } = {}) {
    await conferirQueACopiaEstaCompleta();
    await montarPagina(arquivoHtml, `/${nomeDoScript}`);
    if (endereco) history.replaceState(null, '', endereco);

    let codigo = await (await fetch(`/assets/js/${nomeDoScript}?t=${Date.now()}`)).text();
    const antes = codigo;
    codigo = codigo.replace(/from "\/assets\/js\/noticias-proprias-dados\.js[^"]*"/,
        'from "/testes/noticias-proprias-simulado.js"');
    if (codigo === antes) throw new Error(`${nomeDoScript} não importa ./noticias-proprias-dados.js`);
    if (/firebase/.test(codigo.replace(/\/\/.*$/gm, ''))) {
        throw new Error(`${nomeDoScript} importa o Firebase direto; o acesso deve passar por noticias-proprias-dados.js`);
    }

    codigo = codigo
        .replace(/from "\//g, `from "${location.origin}/`)
        .replace(/import\("\//g, `import("${location.origin}/`);
    await import(URL.createObjectURL(new Blob([codigo], { type: 'text/javascript' })));

    // tempo de a tela pedir os dados e desenhar (a cópia de mentira demora de propósito)
    await new Promise((r) => setTimeout(r, (window.teste.demora ?? 200) * 2 + 600));
    document.getElementById('tb-overlay')?.remove();
}

export const texto = (seletor) => document.querySelector(seletor)?.innerText.replace(/\s+/g, ' ') ?? null;
