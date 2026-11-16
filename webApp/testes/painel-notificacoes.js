// Monta o painel Admin · Notificações com avisos de exemplo (um que leva para
// uma notícia do Futuro+, um agendado e um simples), o histórico deles e as
// notícias do site para escolher. Uso, a partir de
// http://localhost:5173/404.html:
//
//     await import('/testes/painel-notificacoes.js');
//
// Depois, window.teste.mostrar({ ... }) monta de novo com variações:
//
//     teste.mostrar({ vazio: true })            // nenhum aviso ainda
//     teste.mostrar({ noticia: 'np-publicada' }) // como o botão "Notificar" do painel Notícias
//     teste.mostrar({ falhar: 'gravar' })       // salvar dá erro
//     teste.mostrar({ admin: false })           // conta sem acesso
//
// O que o painel grava fica em teste.gravacoes; o histórico, em teste.historico.
import { montarPagina } from './base.js';
import { noticiasDeExemplo } from './noticias-exemplo.js';
import { noticiasPropriasDeExemplo } from './noticias-proprias-exemplo.js';

const HORA = 3600 * 1000;

// As notícias do site: as de fora aprovadas e as do Futuro+ publicadas (a
// agendada fica de fora, como no site).
function noticiasDoSiteDeExemplo() {
    // "publicadas" já são as cópias do site (camposPublicos aplicado)
    const proprias = [...noticiasPropriasDeExemplo().publicadas.values()];
    const deFora = noticiasDeExemplo().filter((n) => n.status === 'aprovada');
    return [...proprias, ...deFora];
}

function avisosDeExemplo(noticias) {
    const agora = Date.now();
    const iso = (horas) => new Date(agora + horas * HORA).toISOString();
    const propria = noticias.find((n) => n.id === 'np-publicada');
    const avisos = [
        {
            id: 'aviso-noticia',
            titulo: 'Novo: teste vocacional com cursos de verdade',
            mensagem: 'O teste agora termina mostrando cursos das Etecs e onde cada um é oferecido.',
            publico: 'todos',
            mostrarModal: true,
            mostrarSino: true,
            enviarPush: true,
            ativo: true,
            publicarEm: null,
            link: `noticia.html?id=${propria.id}`,
            noticia: { id: propria.id, titulo: propria.titulo, fonte: 'Futuro+', propria: true, imagem: propria.imagem },
            criadoEm: iso(-3),
            criadoPor: 'u1'
        },
        {
            id: 'aviso-agendado',
            titulo: 'Inscrições do Vestibulinho abrem amanhã',
            mensagem: 'Separe seus documentos: as inscrições abrem amanhã às 10h.',
            publico: 'logados',
            mostrarModal: false,
            mostrarSino: true,
            enviarPush: false,
            ativo: true,
            publicarEm: iso(20),
            link: '',
            noticia: null,
            criadoEm: iso(-26),
            criadoPor: 'u1'
        },
        {
            id: 'aviso-simples',
            titulo: 'Complete seu perfil',
            mensagem: 'Perfis completos recebem recomendações mais certeiras.',
            publico: 'logados',
            mostrarModal: false,
            mostrarSino: true,
            enviarPush: false,
            ativo: false,
            publicarEm: null,
            link: '',
            noticia: null,
            criadoEm: iso(-72),
            criadoPor: 'u1'
        }
    ];
    const historico = [
        ['aviso-simples', avisos[2].titulo, 'criou', 'para só quem tem conta', 'ana@teste', -72],
        ['aviso-simples', avisos[2].titulo, 'desativou', '', 'victor@teste', -30],
        ['aviso-agendado', avisos[1].titulo, 'criou', 'agendada para amanhã, para só quem tem conta', 'ana@teste', -26],
        ['aviso-noticia', avisos[0].titulo, 'criou', `com a notícia “${propria.titulo}”, para todo mundo, com push no dispositivo`, 'victor@teste', -3],
        ['aviso-antigo', 'Aviso de teste', 'excluiu', '', 'victor@teste', -100]
    ].map(([notificacaoId, titulo, acao, detalhe, email, horas], indice) => ({
        id: `h${indice + 1}`, notificacaoId, titulo, acao, detalhe, email, uid: 'u1', em: iso(horas)
    }));
    return { avisos: new Map(avisos.map((a) => [a.id, a])), historico };
}

// Função nova no módulo de verdade sem a cópia de mentira quebraria o teste
// no meio, com um erro difícil de entender.
async function conferirQueACopiaEstaCompleta() {
    const [real, simulado] = await Promise.all([
        import('/assets/js/notificacoes-dados.js'),
        import('/testes/notificacoes-dados-simulado.js')
    ]);
    const faltando = Object.keys(real).filter((nome) => !(nome in simulado));
    if (faltando.length) throw new Error(`notificacoes-dados-simulado.js não tem: ${faltando.join(', ')}`);
}

async function mostrar(opcoes = {}) {
    const noticiasDoSite = noticiasDoSiteDeExemplo();
    const exemplo = avisosDeExemplo(noticiasDoSite);
    window.teste = {
        ...(window.teste || {}),
        notificacoes: opcoes.vazio ? new Map() : exemplo.avisos,
        historico: opcoes.vazio ? [] : exemplo.historico,
        noticiasDoSite,
        gravacoes: [],
        falhar: opcoes.falhar || null,
        demora: opcoes.demora ?? 200,
        logado: opcoes.logado !== false,
        admin: opcoes.admin !== false,
        email: opcoes.email || 'victor@teste',
        mostrar
    };

    await conferirQueACopiaEstaCompleta();
    await montarPagina('/admin-notificacoes.html', '/admin-notificacoes.js');
    history.replaceState(null, '', '/admin-notificacoes.html'
        + (opcoes.noticia ? `?noticia=${encodeURIComponent(opcoes.noticia)}` : ''));

    let codigo = await (await fetch(`/assets/js/admin-notificacoes.js?t=${Date.now()}`)).text();
    const antes = codigo;
    codigo = codigo.replace(/from "\/assets\/js\/notificacoes-dados\.js[^"]*"/, 'from "/testes/notificacoes-dados-simulado.js"');
    if (codigo === antes) throw new Error('admin-notificacoes.js não importa ./notificacoes-dados.js');
    if (/firebase/.test(codigo.replace(/\/\/.*$/gm, ''))) {
        throw new Error('admin-notificacoes.js importa o Firebase direto; o acesso deve passar por notificacoes-dados.js');
    }
    codigo = codigo
        .replace(/from "\//g, `from "${location.origin}/`)
        .replace(/import\("\//g, `import("${location.origin}/`);
    await import(URL.createObjectURL(new Blob([codigo], { type: 'text/javascript' })));

    // tempo de o painel pedir os dados e desenhar (a cópia de mentira demora de propósito)
    await new Promise((r) => setTimeout(r, (window.teste.demora ?? 200) * 3 + 600));
    return `${window.teste.notificacoes.size} notificações no painel`;
}

await mostrar();
