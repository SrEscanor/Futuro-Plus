// Monta a página de uma instituição (instituicao.html) com dados de exemplo:
// a Etec Sebrae como está no cadastro, três comentários e duas dúvidas. No
// computador de quem desenvolve não há Firestore nem login. Uso, a partir de
// http://localhost:5173/404.html:
//
//     await import('/testes/pagina-instituicao.js');
//
// Abre como visitante. Depois, teste.mostrar({ ... }) monta de novo:
//
//     teste.mostrar({ conta: 'ex-aluno' })         // certificado da unidade: escreve e responde
//     teste.mostrar({ conta: 'comentou' })         // já comentou: Editar e Apagar
//     teste.mostrar({ conta: 'sem-certificado' })  // logado sem certificado: vai ao Mural
//     teste.mostrar({ conta: 'admin' })            // responde como equipe e apaga o que for
//     teste.mostrar({ vazio: true })               // ninguém comentou nem perguntou
//     teste.mostrar({ semFoto: true })             // unidade ainda sem a foto do CPS
//     teste.mostrar({ semUnidade: true })          // endereço de unidade que não existe
//     teste.mostrar({ falhar: 'recusar' })         // as regras do Firestore negam a gravação
//     teste.mostrar({ ancora: '#quem-estudou' })   // chegando pelo link do Perfil
//
// Para já abrir numa variação: window.__opcoesDoTeste = { conta: 'ex-aluno' }
// antes do import. O que a página grava fica em teste.gravacoes; os dados,
// em teste.comentarios e teste.perguntas (ver instituicao-dados-simulado.js).

const DIA = 864e5;
const dias = (n) => new Date(Date.now() - n * DIA).toISOString();

function unidadeDeExemplo({ semFoto = false } = {}) {
    return {
        id: '273', codigo: '273', nome: 'Etec Sebrae (Campos Elíseos)', tipo: 'Etec',
        municipio: 'São Paulo', regiao: 'Metropolitana de São Paulo',
        endereco: 'Alameda Nothmann, 598 - Campos Elíseos - São Paulo/SP - CEP: 01216-000',
        telefone: '(11) 3224-0889', site: 'http://www.etecsebrae.com', historico: 'A Etec foi implantada em 2014.',
        redesSociais: [
            { rede: 'Facebook', url: 'https://www.facebook.com/etecsebraeoficial' },
            { rede: 'Instagram', url: 'https://instagram.com/etecsebraeoficial' }
        ],
        cursos: [
            { categoria: 'Cursos Técnicos - Modalidade Presencial', nome: 'Informática para Internet' },
            { categoria: 'Ensino Médio integrado ao técnico em período integral (M-Tec-PI)', nome: 'Desenvolvimento de Sistemas' },
            { categoria: 'Ensino Médio integrado ao técnico (M-Tec)', nome: 'Desenvolvimento de Sistemas' },
            { categoria: 'Ensino Médio integrado ao técnico (M-Tec)', nome: 'Marketing' },
            { categoria: 'Articulação dos Ensinos Médio - Técnico e Superior (AMS)', nome: 'Administração' },
            { categoria: 'Especialização Técnica', nome: 'Desenvolvimento de Aplicativos para Smartphones' }
        ],
        logotipoUrl: 'https://storage.googleapis.com/futuroplus-bce54.firebasestorage.app/etecs-logos/273.png',
        localizacao: { lat: -23.5329, lng: -46.64682, precisao: 'numero' },
        ...(semFoto ? {} : {
            foto: { url: 'https://bkpsitecpsnew.blob.core.windows.net/uploadsitecps/sites/1/2020/10/etec-sebrae.jpg', largura: 620, altura: 260 },
            paginaCps: 'https://www.cps.sp.gov.br/etecs/etec-sebrae-campos-eliseos/'
        })
    };
}

// u2, u3 e u4 ficam sem o campo "uid": são os comentários "antigos", de antes
// de um certificado dar direito a um comentário próprio (id igual ao uid).
function comentariosDeExemplo() {
    return new Map([
        ['u2', { nome: 'Rafael', curso: 'Administração', ano: 2024, nota: 5, certificadoId: 'c2', criadoEm: dias(10),
            texto: 'Os professores trazem muito caso real de empresa, e a parceria com o Sebrae ajuda bastante quem quer abrir o próprio negócio.\n\nO laboratório de informática é muito bom, vale aproveitar os horários livres.' }],
        ['u3', { nome: 'Bianca', curso: 'Marketing', ano: 2023, nota: 4, certificadoId: 'c3', criadoEm: dias(41), editadoEm: dias(40),
            texto: 'Foi puxado, mas os trabalhos em grupo viraram portfólio de verdade. Fica perto do metrô, o que ajuda muito quem trabalha.' }],
        ['u4', { nome: 'Caio', curso: 'Desenvolvimento de Sistemas', ano: 2022, nota: 5, certificadoId: 'c4', criadoEm: dias(130),
            texto: 'Saí de lá já estagiando. A feira de projetos do último ano é o ponto alto do curso.' }]
    ]);
}

function perguntasDeExemplo() {
    return new Map([
        ['q1', { texto: 'O M-Tec de Desenvolvimento de Sistemas tem estágio?', autorUid: 'u7', nome: 'Júlia', criadaEm: dias(6),
            respostas: {
                u4: { nome: 'Caio', curso: 'Desenvolvimento de Sistemas', ano: 2022, certificadoId: 'c4', equipe: false, em: dias(5),
                    texto: 'No meu tempo não era obrigatório, mas a escola divulgava vagas toda semana e quase toda a turma conseguiu estágio no último ano.' },
                u9: { nome: 'Victor', equipe: true, em: dias(4),
                    texto: 'O plano de cada curso diz se o estágio é obrigatório. Vale confirmar com a secretaria da unidade antes da matrícula.' }
            } }],
        ['q2', { texto: 'Dá para fazer o técnico à noite e trabalhar de dia?', autorUid: 'u8', nome: 'Pedro', criadaEm: dias(2), respostas: {} }]
    ]);
}

// no mesmo formato que observarConta entrega (com o curso do catálogo)
const certificado = {
    id: 'c1', titulo: 'Desenvolvimento de Aplicativos para Smartphones', anoConclusao: 2025,
    cursoId: 'desenvolvimento-de-aplicativos-para-smartphones'
};
const CONTAS = {
    visitante: { logado: false },
    'sem-certificado': { logado: true, uid: 'u1', nome: 'Marina', admin: false, certificados: [], certificadosDisponiveis: [] },
    'ex-aluno': { logado: true, uid: 'u1', nome: 'Marina', admin: false, certificados: [certificado], certificadosDisponiveis: [certificado] },
    // já usou o único certificado desta escola num comentário: sem mais
    // nenhum disponível, só dá para editar ou apagar o que já tem
    comentou: { logado: true, uid: 'u1', nome: 'Marina', admin: false, certificados: [certificado], certificadosDisponiveis: [] },
    admin: { logado: true, uid: 'u9', nome: 'Victor', admin: true, certificados: [], certificadosDisponiveis: [] }
};

// Se alguém criar uma função nova em instituicao-dados.js e esquecer da
// cópia de mentira, a página quebraria no meio do teste.
async function conferirQueACopiaEstaCompleta() {
    const [real, simulado] = await Promise.all([
        import('/assets/js/instituicao-dados.js'),
        import('/testes/instituicao-dados-simulado.js')
    ]);
    const faltando = Object.keys(real).filter((nome) => !(nome in simulado));
    if (faltando.length) throw new Error(`instituicao-dados-simulado.js não tem: ${faltando.join(', ')}`);
}

// Sem nenhum script do HTML: o dashboard.js falaria com o Firebase de verdade.
async function montarSemScripts() {
    const html = await (await fetch('/instituicao.html')).text();
    document.open();
    document.write(html.replace(/<script type="module"[^>]*><\/script>/g, ''));
    document.close();
    await new Promise((r) => setTimeout(r, 600));
}

async function carregarPagina() {
    let codigo = await (await fetch(`/assets/js/instituicao.js?t=${Date.now()}`)).text();
    const antes = codigo;
    codigo = codigo.replace(/from "\/assets\/js\/instituicao-dados\.js[^"]*"/, 'from "/testes/instituicao-dados-simulado.js"');
    if (codigo === antes) throw new Error('instituicao.js não importa ./instituicao-dados.js');
    if (/firebase/.test(codigo.replace(/\/\/.*$/gm, ''))) {
        throw new Error('instituicao.js importa o Firebase direto; o acesso deve passar por instituicao-dados.js');
    }
    codigo = codigo.replace(/from "\//g, `from "${location.origin}/`);
    await import(URL.createObjectURL(new Blob([codigo], { type: 'text/javascript' })));
    // a página já carregou: o que instituicao.js faria no DOMContentLoaded roda agora
    document.dispatchEvent(new Event('DOMContentLoaded'));
}

async function mostrar(opcoes = {}) {
    const conta = opcoes.conta || 'visitante';
    const comentarios = opcoes.vazio ? new Map() : comentariosDeExemplo();
    if (conta === 'comentou') {
        comentarios.set('u1_c1', { nome: 'Marina', curso: certificado.titulo, ano: 2025, nota: 5, certificadoId: 'c1', uid: 'u1', criadoEm: dias(1),
            texto: 'A especialização é curta e bem prática: em um semestre a turma publicou um aplicativo de verdade.' });
    }
    window.teste = {
        unidade: opcoes.semUnidade ? null : unidadeDeExemplo(opcoes),
        comentarios,
        perguntas: opcoes.vazio ? new Map() : perguntasDeExemplo(),
        conta: structuredClone(CONTAS[conta]),
        gravacoes: [],
        falhar: opcoes.falhar || null,
        demora: opcoes.demora ?? 150,
        mostrar
    };
    await conferirQueACopiaEstaCompleta();
    await montarSemScripts();
    history.replaceState(null, '', `/instituicao.html?u=273${opcoes.ancora || ''}`);
    await carregarPagina();
    await new Promise((r) => setTimeout(r, (window.teste.demora ?? 150) * 3 + 600));
    const titulos = [...document.querySelectorAll('.inst-pagina h2')].map((h) => h.textContent.trim());
    return titulos.length ? titulos : document.querySelector('.inst-capa h1')?.textContent || 'página ainda carregando';
}

await mostrar(window.__opcoesDoTeste || {});
