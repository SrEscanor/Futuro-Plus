// Roda depois do "vite build" (ver o "build" em package.json).
//
// curso.html e instituicao.html saem da raiz do dist e vão para dist/modelos/.
// Sem o arquivo na raiz, o Hosting manda /curso.html e /instituicao.html para
// a função pagina_pronta (rewrite em firebase.json), que busca estes modelos,
// coloca o título, a descrição e o texto principal do curso ou da unidade
// dentro da página e entrega pronta, para o Google e para a prévia de link.
// Ver functions/paginas_prontas.py.
//
// No "npm run dev" nada disso acontece: o Vite entrega curso.html e
// instituicao.html direto, montados só pelo JavaScript, como sempre.
const fs = require('fs');
const path = require('path');

const dist = path.join(__dirname, '..', 'dist');
const modelos = path.join(dist, 'modelos');
fs.mkdirSync(modelos, { recursive: true });

for (const nome of ['curso.html', 'instituicao.html']) {
    const origem = path.join(dist, nome);
    if (!fs.existsSync(origem)) {
        throw new Error(`${nome} não está em dist/: o vite build terminou?`);
    }
    const html = fs.readFileSync(origem, 'utf8');
    // a função encaixa o conteúdo no lugar do "Carregando..."; sem ele, a
    // página iria sem nada pronto, então é melhor avisar já no build
    const espera = nome === 'curso.html' ? 'class="carregando-cursos"' : 'id="inst-carregando"';
    if (!html.includes(espera)) {
        throw new Error(`${nome} não tem mais o ${espera} que a função pagina_pronta procura`);
    }
    fs.writeFileSync(path.join(modelos, nome), html);
    fs.unlinkSync(origem);
}
console.log('curso.html e instituicao.html foram para dist/modelos/ (servidos pela função pagina_pronta)');
