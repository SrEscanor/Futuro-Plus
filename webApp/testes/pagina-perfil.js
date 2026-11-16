// Monta a página Perfil com uma conta de mentira, sem Firebase. No
// computador de quem desenvolve não há login, então a página de verdade
// manda para a Início. Uso, a partir de http://localhost:5173/404.html:
//
//     await import('/testes/pagina-perfil.js');
//
// Já abre com a conta cheia (testes, três certificados, curso desejado com
// demanda). Depois, window.teste.mostrar({ ... }) monta de novo:
//
//     teste.mostrar({ conta: 'vazia' })     // conta recém-criada
//     teste.mostrar({ conta: 'cheia' })
//     teste.mostrar({ push: 'granted' })    // notificações já ativadas
//     teste.mostrar({ logado: false })      // sem login: volta para a Início
//
// Para já abrir numa variação: window.__opcoesDoTeste = { conta: 'vazia' }
// antes do import.
//
// Os outros pedaços da página (menu, tour) ficam só no HTML, sem script: o
// dashboard.js falaria com o Firebase de verdade. O que o Salvar grava fica
// em teste.gravacoes; o "banco", em teste.banco (caminho -> dados).

const HORA = 3600 * 1000;
const iso = (horas) => new Date(Date.now() + horas * HORA).toISOString();

// Um certificado desenhado, no lugar da foto que a pessoa enviaria.
function certificado(cor, nome) {
    return 'data:image/svg+xml,' + encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 297"><rect width="420" height="297" fill="#fff"/>'
        + `<rect x="12" y="12" width="396" height="273" fill="none" stroke="${cor}" stroke-width="5"/>`
        + `<rect x="22" y="22" width="376" height="253" fill="none" stroke="${cor}" stroke-width="1.5"/>`
        + `<text x="210" y="96" text-anchor="middle" font-family="Georgia" font-size="34" font-weight="700" fill="${cor}">CERTIFICADO</text>`
        + `<text x="210" y="136" text-anchor="middle" font-family="Arial" font-size="17" fill="#1b1f3b">${nome}</text>`
        + '<rect x="80" y="160" width="260" height="4" fill="#c9cde0"/><rect x="100" y="176" width="220" height="4" fill="#c9cde0"/>'
        + `<rect x="70" y="232" width="110" height="2" fill="#5b6084"/><circle cx="342" cy="230" r="24" fill="${cor}"/></svg>`);
}

// caminho do documento -> dados, como no Firestore
function contaCheia() {
    return {
        'usuarios/u1': {
            nome: 'Victor', sobrenome: 'Machado', email: 'victor@teste',
            dataNascimento: '2007-05-14', genero: 'Prefiro não informar',
            cep: '01310-100', rua: 'Avenida Paulista', cidade: 'São Paulo', estado: 'SP',
            perfil: {
                escolaridade: 'tecnico_concluido',
                formacao: 'Técnico em Desenvolvimento de Sistemas',
                semFormacao: false,
                cursoDesejado: 'Análise e Desenvolvimento de Sistemas',
                modalidades: ['Técnico', 'Especialização', 'Superior'],
                estilos: ['Prática, mão na massa', 'Vídeo-aulas', 'No meu ritmo'],
                objetivo: '',
                visibilidade: { formacao: true, cursoDesejado: true, modalidades: true, estilos: false, objetivo: true, testes: true }
            },
            resultadosTestes: {
                gardner: {
                    concluidoEm: iso(-24 * 40),
                    categoriaPrincipal: 'logica',
                    ranking: ['logica', 'espacial', 'intrapessoal', 'linguistica', 'interpessoal', 'musical', 'corporal', 'naturalista'],
                    porcentagens: {
                        logica: 82, espacial: 71, intrapessoal: 64, linguistica: 52,
                        interpessoal: 47, musical: 33, corporal: 28, naturalista: 21
                    }
                },
                vocacional: {
                    concluidoEm: iso(-24 * 20),
                    eixosFortes: ['Informação e Comunicação', 'Gestão e Negócios'],
                    cursos: [
                        { slug: 'desenvolvimento-de-sistemas', nome: 'Desenvolvimento de Sistemas' },
                        { slug: 'informatica-para-internet', nome: 'Informática para Internet' },
                        { slug: 'administracao', nome: 'Administração' }
                    ]
                }
            }
        },
        'usuarios/u1/certificados/c1': {
            titulo: 'Desenvolvimento de Aplicativos para Smartphones', instituicao: 'Etec Sebrae',
            url: certificado('#2b4bd8', 'Desenvolvimento de Aplicativos'), cursoId: 'desenvolvimento-de-aplicativos-para-smartphones',
            unidadeId: 'etec-sebrae', tipoFormacao: 'Especialização técnica', anoConclusao: 2025,
            verificacao: { nomeConfere: true }, criadoEm: iso(-24 * 3)
        },
        'usuarios/u1/certificados/c2': {
            titulo: 'Desenvolvimento de Sistemas', instituicao: 'Etec Lauro Gomes',
            url: certificado('#b8832f', 'Desenvolvimento de Sistemas'), cursoId: 'desenvolvimento-de-sistemas',
            unidadeId: 'etec-lauro-gomes', tipoFormacao: 'Curso técnico', anoConclusao: 2023,
            verificacao: { nomeConfere: true }, criadoEm: iso(-24 * 9)
        },
        // palestra: fica só no mural, não vira formação
        'usuarios/u1/certificados/c3': {
            titulo: 'Lógica de Programação', instituicao: '', url: certificado('#1d865a', 'Lógica de Programação'),
            criadoEm: iso(-24 * 30)
        },
        'cursos/analise-e-desenvolvimento-de-sistemas': {
            nome: 'Análise e Desenvolvimento de Sistemas', nivel: 'superior',
            demanda: { historico: [{ periodo: '2026-1', inscritos: 5200, vagas: 1000 }, { periodo: '2025-1', inscritos: 4800, vagas: 1000 }] }
        }
    };
}

function contaVazia() {
    return {
        'usuarios/u1': {
            nome: 'Victor', sobrenome: 'Machado', email: 'victor@teste', genero: 'Prefiro não informar',
            cep: '01310-100', rua: 'Avenida Paulista', cidade: 'São Paulo', estado: 'SP',
            perfil: { escolaridade: 'medio_cursando', modalidades: [], estilos: [] }
        }
    };
}

// Firebase de mentira no lugar dos imports de perfil.js
const SIMULACOES = `
const auth = { currentUser: null };
const db = {};
const onAuthStateChanged = (a, aoMudar) => {
    setTimeout(() => {
        a.currentUser = window.teste.logado === false ? null : { uid: 'u1', email: 'victor@teste' };
        aoMudar(a.currentUser);
    }, 30);
    return () => {};
};
const signOut = async () => { window.teste.gravacoes.push(['sair']); };
const collection = (db, ...partes) => ({ caminho: partes.join('/') });
const doc = (db, ...partes) => ({ caminho: partes.join('/') });
const __espera = () => new Promise((r) => setTimeout(r, window.teste.demora ?? 150));
const getDoc = async (ref) => {
    await __espera();
    const dados = window.teste.banco[ref.caminho];
    return { exists: () => Boolean(dados), data: () => structuredClone(dados) };
};
const getDocs = async (ref) => {
    await __espera();
    const prefixo = ref.caminho + '/';
    const docs = Object.entries(window.teste.banco)
        .filter(([caminho]) => caminho.startsWith(prefixo) && !caminho.slice(prefixo.length).includes('/'))
        .map(([caminho, dados]) => ({ id: caminho.slice(prefixo.length), data: () => structuredClone(dados) }));
    return { docs };
};
const setDoc = async (ref, dados, opcoes) => {
    await __espera();
    window.teste.banco[ref.caminho] = opcoes?.merge ? { ...(window.teste.banco[ref.caminho] || {}), ...dados } : dados;
    window.teste.gravacoes.push(['set', ref.caminho, Object.keys(dados).join('+')]);
};
const statusNotificacaoPush = () => window.teste.push ?? 'default';
const ativarNotificacoesPush = async () => { await __espera(); window.teste.push = 'granted'; return 'ativada'; };
`;

async function montarSemScripts() {
    const html = await (await fetch('/perfil.html')).text();
    const semScripts = html.replace(/<script type="module"[^>]*><\/script>/g, '');
    document.open();
    document.write(semScripts);
    document.close();
    await new Promise((r) => setTimeout(r, 600));
}

async function carregarPerfil() {
    let codigo = await (await fetch(`/assets/js/perfil.js?t=${Date.now()}`)).text();
    let trocados = 0;
    const tirar = (padrao) => { codigo = codigo.replace(padrao, () => { trocados += 1; return ''; }); };
    tirar(/import \{ onAuthStateChanged, signOut \} from "[^"]+";/);
    tirar(/import \{ collection, doc, getDoc, getDocs, setDoc \} from "[^"]+";/);
    tirar(/import \{ auth, db \} from "[^"]+";/);
    tirar(/import \{ ativarNotificacoesPush, statusNotificacaoPush \} from "[^"]+";/);
    if (trocados !== 4) throw new Error(`esperava trocar 4 imports de perfil.js, troquei ${trocados}`);
    if (/from "[^"]*firebase/.test(codigo)) throw new Error('perfil.js ainda importa o Firebase');

    codigo = SIMULACOES + codigo.replace(/from "\//g, `from "${location.origin}/`);
    await import(URL.createObjectURL(new Blob([codigo], { type: 'text/javascript' })));
    // a página já carregou: o que perfil.js faria no DOMContentLoaded roda agora
    document.dispatchEvent(new Event('DOMContentLoaded'));
}

async function mostrar(opcoes = {}) {
    window.teste = {
        banco: opcoes.conta === 'vazia' ? contaVazia() : contaCheia(),
        gravacoes: [],
        logado: opcoes.logado !== false,
        push: opcoes.push ?? 'default',
        demora: opcoes.demora ?? 150,
        mostrar
    };
    await montarSemScripts();
    await carregarPerfil();
    await new Promise((r) => setTimeout(r, (window.teste.demora ?? 150) * 4 + 800));
    const titulos = [...document.querySelectorAll('#perfil-grade h2')].map((h) => h.textContent.trim());
    return titulos.length ? titulos : 'perfil ainda carregando';
}

// window.__opcoesDoTeste = { conta: 'vazia' } antes do import abre direto
// na variação (as capturas montam a página uma vez só)
await mostrar(window.__opcoesDoTeste || {});
