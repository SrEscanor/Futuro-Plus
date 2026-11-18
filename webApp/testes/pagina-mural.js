// Monta o Mural com login, banco de dados e armazenamento simulados, para
// conferir a leitura do certificado (que roda de verdade, no navegador) sem
// precisar de conta. Uso, a partir de http://localhost:5173/404.html:
//
//     await import('/testes/pagina-mural.js');
//
// A página abre como visitante (quadro pedindo para entrar). Depois:
//     await teste.entrar({ nome: 'Marina', sobrenome: 'Oliveira' });
//     await teste.enviar(await teste.certificado());            // aceito: nome bate
//     await teste.enviar(await teste.certificado());            // recusado: repetido
//     await teste.enviar(await teste.certificado({ nome: 'CARLOS PEREIRA LIMA' }));  // recusado: outro nome
//     teste.resumo()                                            // o que a tela está mostrando
//     await teste.pendurar()                                    // clica em "Pendurar no mural"
//     await teste.sair();
//
// Os certificados de teste são desenhados aqui, com nomes inventados: nada de
// documento de verdade nesta pasta.
import { montarPagina, enviarArquivo } from './base.js';

const teste = window.teste = {
    colecoes: {}, gravacoes: [], arquivos: {}, usuario: null, aoMudarLogin: null
};

const SIMULACOES = `
const auth = {}; const db = {}; const app = {};
const onAuthStateChanged = (a, cb) => { window.teste.aoMudarLogin = cb; cb(window.teste.usuario); };
const __col = (nome) => window.teste.colecoes[nome] || (window.teste.colecoes[nome] = new Map());
const collection = (db, ...partes) => ({ nome: partes.join('/') });
const doc = (db, ...partes) => ({ col: partes.slice(0, -1).join('/'), id: partes.at(-1) });
const getDoc = async (r) => ({ exists: () => __col(r.col).has(r.id), data: () => __col(r.col).get(r.id) });
const getDocs = async (r) => ({ docs: [...__col(r.nome)].map(([id, d]) => ({ id, data: () => d })) });
const setDoc = async (r, dados) => { __col(r.col).set(r.id, dados); window.teste.gravacoes.push(['set', r.col + '/' + r.id, dados]); };
const deleteDoc = async (r) => { __col(r.col).delete(r.id); window.teste.gravacoes.push(['delete', r.col + '/' + r.id]); };
const getStorage = () => ({});
const ref = (s, caminho) => ({ caminho });
const uploadBytes = async (r, arquivo) => { window.teste.arquivos[r.caminho] = arquivo; };
const getDownloadURL = async (r) => URL.createObjectURL(window.teste.arquivos[r.caminho]);
const deleteObject = async (r) => { delete window.teste.arquivos[r.caminho]; };
`;

// Algumas unidades com as pegadinhas do cadastro de verdade: Etec e Fatec com
// o mesmo nome, bairro entre parênteses, "Prof." abreviado.
teste.colecoes.instituicoes = new Map([
    ['272', { nome: 'Fatec Sebrae', tipo: 'Fatec' }],
    ['273', { nome: 'Etec Sebrae (Campos Elíseos)', tipo: 'Etec' }],
    ['010', { nome: 'Etec Lauro Gomes', tipo: 'Etec' }],
    ['012', { nome: 'Etec Prof. Camargo Aranha (Mooca)', tipo: 'Etec' }],
    ['018', { nome: 'Etec de São Paulo', tipo: 'Etec' }],
    ['003', { nome: 'Fatec Sorocaba – José Crespo Gonzales', tipo: 'Fatec' }]
]);
// "cursos" fica vazia de propósito: a página cai no catálogo oficial
// (/dados/catalogo-cursos.json), como no site antes da importação.

await montarPagina('/mural.html', 'mural.js');

let codigo = await (await fetch(`/assets/js/mural.js?t=${Date.now()}`)).text();
let trocados = 0;
const tirar = (padrao) => { codigo = codigo.replace(padrao, () => { trocados += 1; return ''; }); };
tirar(/import \{ onAuthStateChanged \} from "[^"]+";/);
tirar(/import \{[^}]*\bgetDocs\b[^}]*\} from "[^"]+";/);
tirar(/import \{[^}]*\bgetStorage\b[^}]*\} from "[^"]+";/);
tirar(/import \{ auth, db, app \} from "[^"]+";/);
if (trocados !== 4) throw new Error(`esperava trocar 4 imports do Firebase em mural.js, troquei ${trocados}`);

const antes = codigo;
codigo = codigo
    .replace(/document\.addEventListener\(['"]DOMContentLoaded['"], \(\) => \{/, '(() => {')
    .replace(/\}\);\s*export \{/, '})();\nexport {');
if (codigo === antes) throw new Error('não achei o bloco DOMContentLoaded de mural.js');

codigo = SIMULACOES + codigo.replace(/from "\//g, `from "${location.origin}/`);
teste.modulo = await import(URL.createObjectURL(new Blob([codigo], { type: 'text/javascript' })));

const espera = (ms) => new Promise((r) => setTimeout(r, ms));
const elemento = (id) => document.getElementById(id);

teste.entrar = async ({ nome = 'Marina', sobrenome = 'Oliveira' } = {}) => {
    teste.usuario = { uid: 'u1', email: 'conta@teste' };
    (teste.colecoes.usuarios ||= new Map()).set('u1', { nome, sobrenome });
    await teste.aoMudarLogin(teste.usuario);
    await espera(200);
};

teste.sair = async () => {
    teste.usuario = null;
    await teste.aoMudarLogin(null);
};

// Desenha um certificado no formato dos da Etec (texto corrido, nome em
// maiúsculas, CPF na frase). largura pequena de propósito: é o caso em que a
// página precisa ampliar a imagem antes de ler.
// ead: true desenha um diploma de educação a distância do Centro Paula
// Souza (GEEaD/CETEC), que não cita nenhuma Etec/Fatec específica — é o
// caso em que o Mural pede para a pessoa escolher a unidade.
teste.certificado = async ({
    nome = 'MARINA COSTA OLIVEIRA',
    escola = 'Escola Técnica Estadual SEBRAE',
    formacao = 'a Especialização Profissional Técnica de Nível Médio em DESENVOLVIMENTO DE APLICATIVOS PARA SMARTPHONES',
    titulo = 'ESPECIALISTA TÉCNICO DE NÍVEL MÉDIO EM DESENVOLVIMENTO DE APLICATIVOS PARA SMARTPHONES',
    ano = 2025,
    cpf = '123.456.789-00',
    largura = 900,
    ead = false
} = {}) => {
    const tela = document.createElement('canvas');
    tela.width = largura;
    tela.height = Math.round(largura * 0.7);
    const pincel = tela.getContext('2d');
    const u = largura / 900;

    pincel.fillStyle = '#fbfbf8';
    pincel.fillRect(0, 0, tela.width, tela.height);
    pincel.fillStyle = '#1b1f3b';
    pincel.textBaseline = 'top';

    pincel.font = `bold ${30 * u}px Arial`;
    pincel.fillText('Etec', 50 * u, 40 * u);
    pincel.font = `bold ${18 * u}px Arial`;
    pincel.textAlign = 'center';
    pincel.fillText(ead ? 'DIPLOMA' : 'CERTIFICADO', tela.width / 2, 130 * u);
    pincel.textAlign = 'left';

    const frase = ead
        ? `O Diretor do Grupo de Estudo de Educação a Distância, do Centro Estadual de Educação Tecnológica `
            + `Paula Souza, confere a ${nome}, CPF ${cpf}, de nacionalidade brasileira, natural de Santos, `
            + `estado de São Paulo, nascido em 10 de março de 2001, o presente DIPLOMA por ter concluído em `
            + `${ano}, ${formacao}. Diretor do GEEaD/CETEC.`
        : `O Superintendente da ${escola} confere a ${nome}, CPF ${cpf}, de nacionalidade brasileira, `
            + `natural de Santos, estado de São Paulo, nascido em 10 de março de 2001, o presente CERTIFICADO por haver `
            + `concluído em ${ano}, ${formacao}.`;
    pincel.font = `${13 * u}px Arial`;
    let linha = '';
    let y = 180 * u;
    frase.split(' ').forEach((palavra) => {
        if (pincel.measureText(`${linha} ${palavra}`).width > tela.width - 100 * u) {
            pincel.fillText(linha, 50 * u, y);
            linha = palavra;
            y += 24 * u;
        } else {
            linha = linha ? `${linha} ${palavra}` : palavra;
        }
    });
    pincel.fillText(linha, 50 * u, y);

    pincel.font = `bold ${14 * u}px Arial`;
    pincel.textAlign = 'center';
    pincel.fillText(titulo, tela.width / 2, 360 * u);
    pincel.font = `${12 * u}px Arial`;
    pincel.fillText('São Paulo, 01 de abril de 2026', tela.width / 2, 420 * u);
    pincel.fillText('JOANA PRADO NOGUEIRA', tela.width * 0.72, 500 * u);
    pincel.fillText('Superintendente de Etec', tela.width * 0.72, 518 * u);

    const blob = await new Promise((r) => tela.toBlob(r, 'image/png'));
    return new File([blob], 'certificado-de-teste.png', { type: 'image/png' });
};

teste.resumo = () => ({
    contagem: elemento('mural-contagem').textContent,
    quadroEntrar: !elemento('mural-quadro-entrar').hidden,
    botaoAdicionar: !elemento('btn-novo-certificado').hidden,
    quadros: [...document.querySelectorAll('.mural-quadro--certificado figcaption')].map((f) => f.innerText.replace(/\n/g, ' | ')),
    modalAberto: elemento('modal-certificado').classList.contains('aberto'),
    status: elemento('status-certificado').textContent,
    statusTipo: elemento('status-certificado').className.replace('mural-status', '').trim(),
    camposVisiveis: !elemento('campos-certificado').hidden,
    avisoEad: elemento('cert-instituicao-ead').hidden ? '' : elemento('cert-instituicao-ead').textContent,
    titulo: elemento('cert-titulo').value,
    instituicao: elemento('cert-instituicao').value,
    ano: elemento('cert-ano').value,
    ligados: ['cert-titulo-ligado', 'cert-instituicao-ligado'].map((id) => (elemento(id).hidden ? '' : elemento(id).textContent)),
    botaoPendurar: !elemento('btn-salvar-certificado').disabled
});

// Entrega o arquivo e espera a leitura terminar (campos na tela ou recusa).
teste.enviar = async (arquivo, limite = 90000) => {
    const inicio = Date.now();
    await enviarArquivo('input-certificado', arquivo, 300);
    while (Date.now() - inicio < limite) {
        const status = elemento('status-certificado').className;
        if (!elemento('campos-certificado').hidden || status.includes('erro')) break;
        await espera(300);
    }
    return { ...teste.resumo(), segundos: Math.round((Date.now() - inicio) / 100) / 10 };
};

teste.pendurar = async () => {
    elemento('btn-salvar-certificado').click();
    await espera(800);
    return teste.resumo();
};

teste.escrever = (id, valor) => {
    elemento(id).value = valor;
    elemento(id).dispatchEvent(new Event('input', { bubbles: true }));
    return teste.resumo();
};
