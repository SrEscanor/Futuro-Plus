// Ferramentas de teste do Futuro+ — só funcionam no servidor de
// desenvolvimento (npm run dev). Esta pasta não entra no build nem no site.
//
// O problema que elas resolvem: no computador de quem desenvolve não há login
// nem dados do Firestore, então os painéis de administração mandam para a
// tela de login e as páginas públicas ficam vazias. Aqui a página é montada
// com login, banco de dados e funções do servidor simulados, para dar para
// clicar e conferir de verdade.
//
// Como usar (console do navegador ou ferramenta de JavaScript do preview),
// sempre a partir de http://localhost:5173/404.html:
//
//     await import('/testes/painel-cursos.js');     // Admin · Cursos
//     await import('/testes/painel-unidades.js');   // Admin · Unidades
//
// e, a partir de http://localhost:5173/curso.html?c=<id do curso>:
//
//     await import('/testes/pagina-curso.js');
//
// Cada um deixa as ferramentas em window.teste (ver o fim de cada arquivo).

// Troca a página atual pelo HTML de outra, sem o script dela: o script real
// redirecionaria para o login antes de qualquer simulação entrar.
export async function montarPagina(arquivoHtml, nomeDoScript) {
    const html = await (await fetch(arquivoHtml)).text();
    const semScript = html
        .replace(new RegExp(`<script type="module" src="[^"]*${nomeDoScript}[^"]*"></script>`), '')
        .replace(/<script type="module" src="\/@vite\/client"><\/script>/, '');
    if (semScript.includes(nomeDoScript)) throw new Error(`o script ${nomeDoScript} continua na página`);
    document.open();
    document.write(semScript);
    document.close();
    await new Promise((r) => setTimeout(r, 600));
}

// Simulações de login e Firestore que entram no lugar dos imports do módulo.
// colecoes: { nome da coleção: Map(id -> dados) }. Tudo o que o painel grava
// fica em window.teste.gravacoes.
export function simulacoesDoFirebase() {
    return `
const auth = { currentUser: { email: 'admin@teste', uid: 'u1', getIdToken: async () => 't' } };
const db = {};
const onAuthStateChanged = (a, cb) => cb(a.currentUser);
const signOut = async () => {};
const collection = (db, nome) => ({ nome });
const doc = (db, col, id) => ({ col, id });
const __colecao = (nome) => window.teste.colecoes[nome] || (window.teste.colecoes[nome] = new Map());
const __gravar = (ref, dados) => __colecao(ref.col).set(ref.id, { ...(__colecao(ref.col).get(ref.id) || {}), ...dados });
const __campos = (dados) => Object.keys(dados).filter((k) => k !== 'atualizadoEm').join('+');
const getDoc = async (ref) => (ref.col === 'usuarios'
    ? { exists: () => true, data: () => ({ admin: true }) }
    : { exists: () => __colecao(ref.col).has(ref.id), data: () => __colecao(ref.col).get(ref.id) });
const getDocs = async (ref) => ({ docs: [...__colecao(ref.nome)].map(([id, d]) => ({ id, data: () => d })) });
const setDoc = async (ref, dados) => { __gravar(ref, dados); window.teste.gravacoes.push(['set', ref.col + '/' + ref.id, __campos(dados)]); };
const updateDoc = setDoc;
const deleteDoc = async (ref) => { __colecao(ref.col).delete(ref.id); window.teste.gravacoes.push(['delete', ref.col + '/' + ref.id]); };
const writeBatch = () => { const ops = []; return { set: (ref, d) => ops.push([ref, d]), commit: async () => {
    ops.forEach(([ref, d]) => __gravar(ref, d));
    window.teste.gravacoes.push(['lote', ops.map(([ref, d]) => ref.id + ':' + __campos(d))]);
} }; };`;
}

// Carrega um módulo do site trocando os imports do Firebase pelas simulações
// e rodando na hora o que ele faria no "DOMContentLoaded".
export async function carregarComSimulacoes(caminhoDoModulo) {
    let codigo = await (await fetch(`${caminhoDoModulo}?t=${Date.now()}`)).text();
    let trocados = 0;
    const tirar = (padrao) => { codigo = codigo.replace(padrao, () => { trocados += 1; return ''; }); };

    tirar(/import \{ auth, db \} from "[^"]+";/);
    tirar(/import \{ onAuthStateChanged, signOut \} from "[^"]+";/);
    tirar(/import \{[^}]*\bwriteBatch\b[^}]*\} from "[^"]+";/);
    if (trocados !== 3) throw new Error(`esperava trocar 3 imports do Firebase em ${caminhoDoModulo}, troquei ${trocados}`);

    const antes = codigo;
    codigo = codigo
        .replace(/document\.addEventListener\(['"]DOMContentLoaded['"], \(\) => \{/, '(() => {')
        .replace(/\}\);\s*(\/\/# sourceMappingURL.*)?\s*$/, '})();');
    if (codigo === antes) throw new Error('não achei o bloco DOMContentLoaded do módulo');

    codigo = simulacoesDoFirebase() + codigo.replace(/from "\//g, `from "${location.origin}/`);
    await import(URL.createObjectURL(new Blob([codigo], { type: 'text/javascript' })));
    await new Promise((r) => setTimeout(r, 1200));
}

// Módulos que importam o firebase-config de verdade (enviar-capa.js, por
// exemplo) conferem auth.currentUser: aqui ele passa a ter alguém logado.
export async function fingirLogin() {
    const config = await import('/assets/js/firebase-config.js');
    Object.defineProperty(config.auth, 'currentUser', {
        get: () => ({ email: 'admin@teste', uid: 'u1', getIdToken: async () => 't' }),
        configurable: true
    });
}

// Responde no lugar das Cloud Functions. respostas: { nome da função:
// (corpo) => dados | { erro, status } }. As chamadas ficam em
// window.teste.chamadas.
export function simularFuncoes(respostas) {
    const fetchReal = window.fetch.bind(window);
    window.fetch = async (url, opcoes) => {
        const nome = Object.keys(respostas).find((funcao) => String(url).includes(funcao));
        if (!nome) return fetchReal(url, opcoes);

        const corpo = JSON.parse(opcoes.body);
        window.teste.chamadas.push({ funcao: nome, ...corpo, imagem: corpo.imagem ? `(${corpo.imagem.length} caracteres)` : undefined });
        await new Promise((r) => setTimeout(r, 200));
        const dados = await respostas[nome](corpo);
        const status = dados?.status || 200;
        return new Response(JSON.stringify(dados), { status, headers: { 'Content-Type': 'application/json' } });
    };
}

// Entrega um arquivo a um <input type="file"> como se a pessoa tivesse
// escolhido, e espera a página reagir.
export async function enviarArquivo(idDoInput, arquivo, espera = 1200) {
    const transferencia = new DataTransfer();
    transferencia.items.add(arquivo);
    const input = document.getElementById(idDoInput);
    input.files = transferencia.files;
    input.dispatchEvent(new Event('change', { bubbles: true }));
    await new Promise((r) => setTimeout(r, espera));
}

// Imagem de teste com o tamanho escrito nela.
export async function imagemDeTeste(largura, altura, cor = '#2e86d6') {
    const tela = document.createElement('canvas');
    tela.width = largura;
    tela.height = altura;
    const pincel = tela.getContext('2d');
    const degrade = pincel.createLinearGradient(0, 0, largura, altura);
    degrade.addColorStop(0, cor);
    degrade.addColorStop(1, '#ffffff');
    pincel.fillStyle = degrade;
    pincel.fillRect(0, 0, largura, altura);
    pincel.fillStyle = '#112233';
    pincel.font = `bold ${Math.round(altura / 3)}px sans-serif`;
    pincel.fillText(`${largura}x${altura}`, 40, altura / 2);
    const blob = await new Promise((r) => tela.toBlob(r, 'image/png'));
    return new File([blob], 'capa-de-teste.png', { type: 'image/png' });
}

// A matriz curricular de exemplo (Desenvolvimento de Sistemas, M-Tec), no
// formato que o SIGA gera.
export async function pdfDaMatrizDeExemplo() {
    const blob = await (await fetch('/testes/dados/matriz-exemplo.pdf')).blob();
    return new File([blob], 'matriz-exemplo.pdf', { type: 'application/pdf' });
}

export function iniciarTeste() {
    window.teste = { colecoes: {}, gravacoes: [], chamadas: [] };
    return window.teste;
}
