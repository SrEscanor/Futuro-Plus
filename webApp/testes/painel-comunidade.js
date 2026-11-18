// Monta o painel Admin · Comunidade com avaliações e dúvidas de exemplo
// (aba Novidades) e um histórico com comentário apagado por admin, resposta
// apagada pela própria pessoa e dúvida apagada com as respostas (aba
// Histórico). Uso, a partir de http://localhost:5173/404.html:
//
//     await import('/testes/painel-comunidade.js');
//
// Depois, window.teste.mostrar({ ... }) monta de novo com variações:
//
//     teste.mostrar({ aba: 'historico' })     // abre direto no Histórico (#historico)
//     teste.mostrar({ vazio: true })          // nada ainda (antes do deploy das funções)
//     teste.mostrar({ muitos: 260 })          // histórico grande: filtro procura nos mais antigos
//     teste.mostrar({ vistos: true })         // tudo já visto: nada em destaque
//     teste.mostrar({ falhar: 'listar' })     // Firestore fora do ar
//     teste.mostrar({ admin: false })         // conta sem acesso
//
// O que o painel grava fica em teste.gravacoes.
import { montarPagina } from './base.js';

const MINUTO = 60 * 1000;

function dadosDeExemplo(agora = Date.now()) {
    const iso = (minutos) => new Date(agora - minutos * MINUTO).toISOString();
    const link = (u, ancora) => `instituicao.html?u=${u}#${ancora}`;
    const avisos = [
        { id: 'avaliacao_u1_a1_c1', tipo: 'avaliacao', em: iso(12), unidadeId: 'u1', unidadeNome: 'Etec Jorge Street', itemId: 'a1_c1',
            nome: 'Marina Souza', curso: 'Desenvolvimento de Sistemas', ano: 2024, nota: 5, apagada: false, link: link('u1', 'quem-estudou'),
            texto: 'Professores muito atenciosos e laboratório bem equipado. Consegui estágio pelo convênio da escola ainda no segundo módulo.' },
        { id: 'duvida_u2_p1', tipo: 'duvida', em: iso(40), unidadeId: 'u2', unidadeNome: 'Fatec Carapicuíba', itemId: 'p1',
            nome: 'João Pedro Lima', respostas: 0, apagada: false, link: link('u2', 'duvidas'),
            texto: 'O curso de ADS tem estágio obrigatório? Dá para fazer trabalhando durante o dia?' },
        { id: 'avaliacao_u3_a2_c2', tipo: 'avaliacao', em: iso(130), unidadeId: 'u3', unidadeNome: 'Etec Sebrae', itemId: 'a2_c2',
            nome: 'Lucas Andrade', curso: 'Administração', ano: 2023, nota: 2, apagada: false, link: link('u3', 'quem-estudou'),
            texto: 'A coordenação demorava muito para responder e faltou professor de contabilidade no último semestre.' },
        { id: 'duvida_u4_p2', tipo: 'duvida', em: iso(60 * 20), unidadeId: 'u4', unidadeNome: 'Etec Parque da Juventude', itemId: 'p2',
            nome: 'Rafa Moreira', respostas: 1, apagada: false, link: link('u4', 'duvidas'),
            texto: 'Precisa fazer prova para entrar no técnico em Enfermagem?' },
        { id: 'avaliacao_u1_a3_c3', tipo: 'avaliacao', em: iso(60 * 26), unidadeId: 'u1', unidadeNome: 'Etec Jorge Street', itemId: 'a3_c3',
            nome: 'Bia Ferreira', curso: 'Nutrição e Dietética', ano: 2022, nota: 4, apagada: false, editada: true, link: link('u1', 'quem-estudou'),
            texto: 'Curso puxado, mas vale muito a pena. As aulas práticas na cozinha experimental são o ponto alto.' },
        { id: 'avaliacao_u3_a4_c4', tipo: 'avaliacao', em: iso(60 * 52), unidadeId: 'u3', unidadeNome: 'Etec Sebrae', itemId: 'a4_c4',
            nome: 'Caio Ramos', curso: 'Administração', ano: 2023, nota: 1, apagada: true, link: link('u3', 'quem-estudou'),
            texto: 'Escola horrível, ninguém deveria estudar aqui. Chama no meu perfil que eu vendo apostila.' }
    ];

    const escritoCaio = iso(60 * 52);
    const escritoGui = iso(60 * 64);
    const conta = (nome) => ({ uid: nome.toLowerCase().replace(/\W+/g, '-'), nome, admin: false, sistema: false });
    const ana = { uid: 'admin-ana', nome: 'Ana', email: 'ana.admin@exemplo.com', admin: true, sistema: false };
    const rui = { uid: 'admin-rui', nome: 'Rui', email: 'rui.admin@exemplo.com', admin: true, sistema: false };
    const historico = [
        { id: 'h1', acao: 'comentou', tipo: 'comentario', em: iso(12), ...conta('Marina Souza'), propria: true, unidadeId: 'u1', unidadeNome: 'Etec Jorge Street',
            itemId: 'a1_c1', autorUid: 'marina-souza', autorNome: 'Marina Souza', texto: avisos[0].texto, nota: 5, curso: 'Desenvolvimento de Sistemas', ano: 2024, escritoEm: iso(12) },
        { id: 'h2', acao: 'apagou_comentario', tipo: 'comentario', em: iso(39), ...ana, propria: false, unidadeId: 'u3', unidadeNome: 'Etec Sebrae',
            itemId: 'a4_c4', autorUid: 'caio-ramos', autorNome: 'Caio Ramos', texto: avisos[5].texto, nota: 1, curso: 'Administração', ano: 2023, escritoEm: escritoCaio },
        { id: 'h3', acao: 'perguntou', tipo: 'duvida', em: iso(40), ...conta('João Pedro Lima'), propria: true, unidadeId: 'u2', unidadeNome: 'Fatec Carapicuíba',
            itemId: 'p1', autorUid: 'joão-pedro-lima', autorNome: 'João Pedro Lima', texto: avisos[1].texto, escritoEm: iso(40) },
        { id: 'h4', acao: 'respondeu', tipo: 'resposta', em: iso(70), ...rui, propria: true, unidadeId: 'u4', unidadeNome: 'Etec Parque da Juventude',
            itemId: 'p2', autorUid: 'admin-rui', autorNome: 'Rui', equipe: true, texto: 'Sim: a entrada é pelo Vestibulinho, com prova de conhecimentos gerais.',
            perguntaTexto: avisos[3].texto, perguntaAutorNome: 'Rafa Moreira', escritoEm: iso(70) },
        { id: 'h5', acao: 'comentou', tipo: 'comentario', em: iso(130), ...conta('Lucas Andrade'), propria: true, unidadeId: 'u3', unidadeNome: 'Etec Sebrae',
            itemId: 'a2_c2', autorUid: 'lucas-andrade', autorNome: 'Lucas Andrade', texto: avisos[2].texto, nota: 2, curso: 'Administração', ano: 2023, escritoEm: iso(130) },
        { id: 'h6', acao: 'editou_comentario', tipo: 'comentario', em: iso(60 * 19), ...conta('Bia Ferreira'), propria: true, unidadeId: 'u1', unidadeNome: 'Etec Jorge Street',
            itemId: 'a3_c3', autorUid: 'bia-ferreira', autorNome: 'Bia Ferreira', texto: avisos[4].texto, textoAntes: 'Curso puxado.', nota: 4, notaAntes: 3,
            curso: 'Nutrição e Dietética', ano: 2022, escritoEm: iso(60 * 26) },
        { id: 'h7', acao: 'apagou_resposta', tipo: 'resposta', em: iso(60 * 22), ...conta('Duda Martins'), propria: true, unidadeId: 'u4', unidadeNome: 'Etec Parque da Juventude',
            itemId: 'p2', autorUid: 'duda-martins', autorNome: 'Duda Martins', texto: 'Acho que não precisa, mas não tenho certeza.', equipe: false,
            perguntaTexto: avisos[3].texto, perguntaAutorNome: 'Rafa Moreira', escritoEm: iso(60 * 23) },
        { id: 'h8', acao: 'apagou_duvida', tipo: 'duvida', em: iso(60 * 50), ...ana, propria: false, unidadeId: 'u3', unidadeNome: 'Etec Sebrae',
            itemId: 'p9', autorUid: 'gui-prado', autorNome: 'Gui Prado', texto: 'Alguém tem o gabarito da prova do vestibulinho? Me chama no privado.', escritoEm: escritoGui,
            respostasApagadas: [
                { autorUid: 'x1', autorNome: 'Leo Dias', texto: 'Tenho, me chama.', equipe: false, escritoEm: iso(60 * 63) },
                { autorUid: 'admin-rui', autorNome: 'Rui', texto: 'O gabarito oficial sai no site do Vestibulinho.', equipe: true, escritoEm: iso(60 * 60) }
            ] },
        { id: 'h9', acao: 'comentou', tipo: 'comentario', em: escritoCaio, ...conta('Caio Ramos'), propria: true, unidadeId: 'u3', unidadeNome: 'Etec Sebrae',
            itemId: 'a4_c4', autorUid: 'caio-ramos', autorNome: 'Caio Ramos', texto: avisos[5].texto, nota: 1, curso: 'Administração', ano: 2023, escritoEm: escritoCaio },
        { id: 'h10', acao: 'perguntou', tipo: 'duvida', em: escritoGui, ...conta('Gui Prado'), propria: true, unidadeId: 'u3', unidadeNome: 'Etec Sebrae',
            itemId: 'p9', autorUid: 'gui-prado', autorNome: 'Gui Prado', texto: 'Alguém tem o gabarito da prova do vestibulinho? Me chama no privado.', escritoEm: escritoGui },
        { id: 'h11', acao: 'apagou_comentario', tipo: 'comentario', em: iso(60 * 70), uid: '', nome: 'Sistema', admin: false, sistema: true, propria: false,
            unidadeId: 'u1', unidadeNome: 'Etec Jorge Street', itemId: 'old', autorUid: 'old', autorNome: 'Conta de teste', texto: 'Teste de comentário.', nota: 3,
            curso: 'Informática', ano: 2020, escritoEm: iso(60 * 90) }
    ];
    return { avisos, historico };
}

// muitos registros antigos de outras pessoas, com um apagado lá no fim
function historicoGrande(quantos, agora = Date.now()) {
    const lista = [];
    for (let i = 0; i < quantos; i += 1) {
        lista.push({
            id: `m${i}`, acao: 'comentou', tipo: 'comentario', em: new Date(agora - (100 + i * 30) * MINUTO).toISOString(),
            uid: `p${i}`, nome: `Pessoa ${i}`, admin: false, sistema: false, propria: true, unidadeId: 'u5', unidadeNome: 'Etec de Artes',
            itemId: `p${i}_c`, autorUid: `p${i}`, autorNome: `Pessoa ${i}`, texto: 'Gostei bastante do curso.', nota: 4, curso: 'Design de Interiores', ano: 2021
        });
    }
    lista.push({
        id: 'antigo-apagado', acao: 'apagou_comentario', tipo: 'comentario', em: new Date(agora - (100 + quantos * 30) * MINUTO).toISOString(),
        uid: 'admin-rui', nome: 'Rui', email: 'rui.admin@exemplo.com', admin: true, sistema: false, propria: false, unidadeId: 'u5', unidadeNome: 'Etec de Artes',
        itemId: 'zz', autorUid: 'zz', autorNome: 'Zeca Antigo', texto: 'Comentário apagado há muito tempo.', nota: 2, curso: 'Canto', ano: 2019
    });
    return lista;
}

async function conferirQueACopiaEstaCompleta() {
    const [real, simulado] = await Promise.all([
        import('/assets/js/comunidade-dados.js'),
        import('/testes/comunidade-dados-simulado.js')
    ]);
    const faltando = Object.keys(real).filter((nome) => !(nome in simulado));
    if (faltando.length) throw new Error(`comunidade-dados-simulado.js não tem: ${faltando.join(', ')}`);
}

// carrega um script da página com o import dos dados trocado pela cópia de mentira
async function carregarComDadosSimulados(caminho) {
    let codigo = await (await fetch(`${caminho}?t=${Date.now()}`)).text();
    const antes = codigo;
    codigo = codigo.replace(/from "\/assets\/js\/comunidade-dados\.js[^"]*"/, 'from "/testes/comunidade-dados-simulado.js"');
    if (codigo === antes) throw new Error(`${caminho} não importa ./comunidade-dados.js`);
    if (/firebase/.test(codigo.replace(/\/\/.*$/gm, ''))) {
        throw new Error(`${caminho} importa o Firebase direto; o acesso deve passar por comunidade-dados.js`);
    }
    codigo = codigo
        .replace(/from "\//g, `from "${location.origin}/`)
        .replace(/import\("\//g, `import("${location.origin}/`);
    await import(URL.createObjectURL(new Blob([codigo], { type: 'text/javascript' })));
}

async function mostrar(opcoes = {}) {
    const exemplo = dadosDeExemplo();
    const historico = opcoes.vazio ? [] : [...exemplo.historico, ...(opcoes.muitos ? historicoGrande(opcoes.muitos) : [])];
    window.teste = {
        ...(window.teste || {}),
        avisos: opcoes.vazio ? [] : exemplo.avisos,
        historico,
        // por padrão, as três primeiras ainda não foram vistas
        vistosEm: opcoes.vistos ? new Date().toISOString() : (opcoes.vazio ? '' : exemplo.avisos[3].em),
        gravacoes: [],
        paginasLidas: 0,
        falhar: opcoes.falhar || null,
        demora: opcoes.demora ?? 150,
        logado: opcoes.logado !== false,
        admin: opcoes.admin !== false,
        email: opcoes.email || 'ana.admin@exemplo.com',
        mostrar
    };

    await conferirQueACopiaEstaCompleta();
    await montarPagina('/admin-comunidade.html', '/admin-comunidade.js');
    history.replaceState(null, '', `/admin-comunidade.html${opcoes.aba === 'historico' ? '#historico' : ''}`);
    await carregarComDadosSimulados('/assets/js/admin-nav-contador.js');
    await carregarComDadosSimulados('/assets/js/admin-comunidade.js');

    // tempo de o painel pedir os dados e desenhar (a cópia de mentira demora de propósito)
    await new Promise((r) => setTimeout(r, (window.teste.demora ?? 150) * 3 + 600));
    return `${window.teste.avisos.length} avisos e ${window.teste.historico.length} registros no histórico`;
}

window.teste = { ...(window.teste || {}), mostrar };
await mostrar();
