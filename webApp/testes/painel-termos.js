// Monta o painel Admin · Termos e Privacidade com login de administrador e
// textos de exemplo (os padrões do site, publicados em versões de mentira),
// com um histórico curto. Uso, a partir de http://localhost:5173/404.html:
//
//     await import('/testes/painel-termos.js');
//
// Depois, window.teste.mostrar({ ... }) monta de novo com variações:
//
//     teste.mostrar({ semHistorico: true })   // ninguém publicou pelo painel novo ainda
//     teste.mostrar({ nuncaPublicado: true }) // configuracoes vazio: o site mostra o texto padrão
//     teste.mostrar({ google: true })         // conta do Google: sem campo de senha
//     teste.mostrar({ admin: false })         // conta sem acesso
//
// E, com a tela aberta:
//
//     teste.senha                 // a senha que vale (padrão 'segredo')
//     teste.falhar = 'publicar'   // a próxima publicação dá erro (null desliga)
//     teste.documentos.privacidade.versao = 9  // "outra pessoa publicou" antes de você
//     teste.gravacoes, teste.historico, teste.documentos
import { montarPagina } from './base.js';
import { PRIVACIDADE_PADRAO, TERMOS_PADRAO } from '../assets/js/conteudo-legal-padrao.js';

// Função nova no módulo de verdade sem a cópia de mentira quebraria o teste
// no meio, com um erro difícil de entender.
async function conferirQueACopiaEstaCompleta() {
    const [real, simulado] = await Promise.all([
        import('/assets/js/termos-dados.js'),
        import('/testes/termos-simulado.js')
    ]);
    const faltando = Object.keys(real).filter((nome) => !(nome in simulado));
    if (faltando.length) throw new Error(`termos-simulado.js não tem: ${faltando.join(', ')}`);
}

function prepararEstado(opcoes = {}) {
    const dia = 24 * 3600 * 1000;
    const em = (dias) => new Date(Date.now() - dias * dia).toISOString();
    const termosV2 = TERMOS_PADRAO.replace('<h1>', '<p><em>(versão antiga, de exemplo)</em></p>\n<h1>');
    window.teste = {
        ...(window.teste || {}),
        documentos: opcoes.nuncaPublicado ? { termos: null, privacidade: null } : {
            termos: { versao: 3, html: TERMOS_PADRAO, atualizadoEm: em(66), atualizadoPorEmail: 'victor@teste' },
            privacidade: { versao: 2, html: PRIVACIDADE_PADRAO.replace('novembro de 2026', 'setembro de 2026'),
                atualizadoEm: em(66), atualizadoPorEmail: 'victor@teste' }
        },
        historico: opcoes.semHistorico || opcoes.nuncaPublicado ? [] : [
            { id: 'h1', documento: 'termos', titulo: 'Termos de Uso', acao: 'publicou', versao: 2, versaoAnterior: 1,
                html: termosV2, email: 'ana@teste', uid: 'u2', em: em(84) },
            { id: 'h2', documento: 'termos', titulo: 'Termos de Uso', acao: 'publicou', versao: 3, versaoAnterior: 2,
                html: TERMOS_PADRAO, email: 'victor@teste', uid: 'u1', em: em(66) },
            { id: 'h3', documento: 'privacidade', titulo: 'Política de Privacidade', acao: 'publicou', versao: 2,
                versaoAnterior: 1, html: PRIVACIDADE_PADRAO.replace('novembro de 2026', 'setembro de 2026'),
                email: 'victor@teste', uid: 'u1', em: em(66) }
        ],
        gravacoes: [],
        falhar: null,
        senha: 'segredo',
        demora: opcoes.demora ?? 200,
        logado: opcoes.logado !== false,
        admin: opcoes.admin !== false,
        google: Boolean(opcoes.google),
        email: 'victor@teste'
    };
    return window.teste;
}

async function montarTela() {
    await conferirQueACopiaEstaCompleta();
    await montarPagina('/admin-termos.html', '/admin-termos.js');

    let codigo = await (await fetch(`/assets/js/admin-termos.js?t=${Date.now()}`)).text();
    const antes = codigo;
    codigo = codigo.replace(/from "\/assets\/js\/termos-dados\.js[^"]*"/, 'from "/testes/termos-simulado.js"');
    if (codigo === antes) throw new Error('admin-termos.js não importa ./termos-dados.js');
    if (/firebase/.test(codigo.replace(/\/\/.*$/gm, ''))) {
        throw new Error('admin-termos.js importa o Firebase direto; o acesso deve passar por termos-dados.js');
    }
    codigo = codigo
        .replace(/from "\//g, `from "${location.origin}/`)
        .replace(/import\("\//g, `import("${location.origin}/`);
    await import(URL.createObjectURL(new Blob([codigo], { type: 'text/javascript' })));

    // tempo de a tela pedir os dados e desenhar (a cópia de mentira demora de propósito)
    await new Promise((r) => setTimeout(r, (window.teste.demora ?? 200) * 2 + 600));
}

async function mostrar(opcoes = {}) {
    const teste = prepararEstado(opcoes);
    teste.mostrar = mostrar;
    // a tela pergunta antes de publicar e de desfazer; aqui sempre "sim"
    window.confirm = () => true;
    await montarTela();
    return `${teste.historico.length} publicações no histórico`;
}

await mostrar();
