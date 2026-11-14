// Compartilhar resultado — módulo compartilhado pelas telas de resultado de
// teste (Teste rápido, Teste de Afinidades e Teste Vocacional) e pela lista de
// resultados salvos da Central de Testes.
//
// Gera um carrossel de 3 imagens no formato de story (1080x1920) com a mesma
// cara do post de lançamento do @futuroplus_ ("Chegou o Futuro+."): fundo
// azul liso, logo branco + "Futuro+" no canto, três pílulas grossas saindo
// pela borda direita, etiqueta branca e todo o texto em Inter, alinhado numa
// única margem à esquerda. Cada imagem mostra uma coisa diferente:
//   1. Porcentagem — categoria/área forte + número (quando há) + frase +
//      pódio com os 3 primeiros perfis (quando a tela manda o ranking).
//   2. Cursos recomendados — a lista de até 3 cursos.
//   3. Completa — perfil + cursos juntos na mesma arte.
// Antes de compartilhar, a pessoa escolhe qual curso vai em destaque: ele sobe
// para o topo da lista, num cartão branco com contorno laranja e o selo
// "Minha escolha". Sem mexer, o 1º da recomendação fica com "Mais combina"
// (ou, no Vocacional, o curso em que ela respondeu "Quero esse").
// A pessoa também escolhe quais imagens quer (as 3 vêm marcadas) e, ao
// confirmar, tenta abrir o menu nativo de compartilhar do celular (Web Share
// API, com as imagens marcadas); se o navegador não suportar compartilhar
// arquivo (a maioria dos desktops), baixa cada imagem marcada como PNG.
//
// Cada tela só precisa montar o objeto `dados` com o que já tem calculado —
// este módulo não mexe em nenhuma lógica de pontuação ou recomendação dos
// testes.

const LARGURA = 1080;
const ALTURA = 1920;

// Cores medidas no post de lançamento do @futuroplus_ (fundo e pílulas).
const CORES = {
    fundo: '#2d6ae3',
    laranja: '#f59e0b',
    verde: '#22a06b',
    pilulaClara: '#5284e8',
    branco: '#ffffff',
    tinta: '#1b1f3b',
    tintaSuave: '#5b6084'
};

// Proporções da Inter: altura da maiúscula e quanto g, p, ç descem abaixo da
// linha de base, em relação ao tamanho da fonte. Servem pra posicionar o
// texto pelo topo das letras, e não pela caixa da fonte.
const CAP = 0.727;
const DESCIDA = 0.21;

// Uma margem só: tudo alinha nela, como o texto do post.
const MARGEM = 84;
const LARGURA_UTIL = LARGURA - MARGEM * 2;

// O Instagram e o WhatsApp cobrem o topo do story (foto e nome de quem
// postou) e a base (campo de resposta), então logo e rodapé ficam um pouco
// para dentro das bordas.
const LOGO = { y: 160, tamanho: 76 };
const PILULAS = { y: 290, altura: 88, gap: 24 };
const RODAPE = { yArroba: 1688, yChamada: 1736 };

// Faixa livre para o conteúdo de cada arte: entre as pílulas e o rodapé.
const TOPO_CONTEUDO = PILULAS.y + 3 * PILULAS.altura + 2 * PILULAS.gap + 56;
const BASE_CONTEUDO = RODAPE.yArroba - Math.round(36 * CAP) - 76;

// O conteúdo de cada arte é desenhado na maior escala (entre essas duas) que
// ainda cabe na faixa livre: título comprido ou curso com nome grande
// encolhem tudo um pouco, em vez de estourar ou de sobrar um buraco.
const ESCALA_MAXIMA = 1.2;
const ESCALA_MINIMA = 0.7;

const ICONE_COMPARTILHAR = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" width="19" height="19" aria-hidden="true"><path d="M12 15.5V4M12 4 7.8 8.2M12 4l4.2 4.2"/><path d="M5 13.5V18a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4.5"/></svg>`;

const ICONE_ESTRELA = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" width="16" height="16" aria-hidden="true"><path d="m12 3.6 2.6 5.3 5.8.8-4.2 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.2-4.1 5.8-.8z"/></svg>`;

// ------------------------------------------------------------------
// Peças de desenho
// ------------------------------------------------------------------

function desenharRetanguloArredondado(ctx, x, y, w, h, r) {
    const raio = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + raio, y);
    ctx.arcTo(x + w, y, x + w, y + h, raio);
    ctx.arcTo(x + w, y + h, x, y + h, raio);
    ctx.arcTo(x, y + h, x, y, raio);
    ctx.arcTo(x, y, x + w, y, raio);
    ctx.closePath();
}

// Fonte + espaçamento entre letras de uma vez (o espaçamento fica guardado no
// contexto, então sempre é redefinido junto com a fonte). Navegador sem
// suporte a letterSpacing no canvas só ignora a propriedade.
function definirFonte(ctx, peso, tamanho, espacamento = 0) {
    ctx.font = `${peso} ${tamanho}px Inter, sans-serif`;
    ctx.letterSpacing = `${espacamento}px`;
}

function quebrarLinhas(ctx, texto, larguraMax) {
    const palavras = String(texto || '').split(' ').filter(Boolean);
    const linhas = [];
    let linhaAtual = '';

    palavras.forEach((palavra) => {
        const teste = linhaAtual ? `${linhaAtual} ${palavra}` : palavra;
        if (ctx.measureText(teste).width > larguraMax && linhaAtual) {
            linhas.push(linhaAtual);
            linhaAtual = palavra;
        } else {
            linhaAtual = teste;
        }
    });

    if (linhaAtual) linhas.push(linhaAtual);
    return linhas.length ? linhas : [''];
}

// Mesmo número de linhas, mas com as linhas de tamanho parecido (evita uma
// palavra sozinha na última linha): procura a menor largura que ainda não
// cria uma linha a mais.
function quebrarEquilibrado(ctx, texto, larguraMax) {
    const linhas = quebrarLinhas(ctx, texto, larguraMax);
    if (linhas.length < 2) return linhas;

    let cabeMenos = larguraMax * 0.4;
    let cabe = larguraMax;
    while (cabe - cabeMenos > 4) {
        const meio = (cabe + cabeMenos) / 2;
        if (quebrarLinhas(ctx, texto, meio).length > linhas.length) cabeMenos = meio;
        else cabe = meio;
    }
    return quebrarLinhas(ctx, texto, cabe);
}

function cortarComReticencias(ctx, texto, larguraMax) {
    if (ctx.measureText(texto).width <= larguraMax) return texto;
    let cortado = texto;
    while (cortado.length > 1 && ctx.measureText(`${cortado}…`).width > larguraMax) {
        cortado = cortado.slice(0, -1);
    }
    return `${cortado.trimEnd()}…`;
}

// Diminui a fonte até o texto caber no número de linhas e na largura (uma
// palavra comprida sozinha também precisa caber). No tamanho mínimo, o que
// ainda sobrar vira reticências na última linha. Deixa a fonte final
// definida no contexto.
function ajustarTexto(ctx, texto, { peso, maximo, minimo, larguraMax, maxLinhas, espacamento = 0 }) {
    // tudo em pixels inteiros: comparar com o mínimo fracionário (ex. 51,6)
    // deixaria o tamanho preso no arredondado (52) e o laço nunca terminaria
    const menor = Math.max(1, Math.round(minimo));
    let tamanho = Math.max(menor, Math.round(maximo));
    let linhas;

    for (;;) {
        definirFonte(ctx, peso, tamanho, tamanho * espacamento);
        linhas = quebrarLinhas(ctx, texto, larguraMax);
        const cabe = linhas.length <= maxLinhas
            && linhas.every((linha) => ctx.measureText(linha).width <= larguraMax);
        if (cabe || tamanho <= menor) break;
        tamanho = Math.max(menor, tamanho - 2);
    }

    if (linhas.length > maxLinhas) {
        const resto = linhas.slice(maxLinhas - 1).join(' ');
        linhas = [...linhas.slice(0, maxLinhas - 1), resto];
    } else {
        linhas = quebrarEquilibrado(ctx, texto, larguraMax);
    }
    linhas = linhas.map((linha) => cortarComReticencias(ctx, linha, larguraMax));

    return { tamanho, linhas };
}

// Fontes carregadas por @import no dashboard.css (Inter 400–700) e no
// compartilhar-resultado.css (Inter 800, a do título do post). Sem esperar,
// o canvas desenharia com a fonte padrão do sistema na primeira vez.
async function aguardarFontes() {
    const amostras = ['500 32px Inter', '600 32px Inter', '700 32px Inter', '800 32px Inter'];
    try {
        await Promise.all(amostras.map((f) => document.fonts.load(f)));
        await document.fonts.ready;
    } catch (erro) {
        console.warn('Não deu para confirmar o carregamento das fontes antes de desenhar a arte de compartilhamento:', erro);
    }
}

// O logo é o mesmo nas 3 imagens e em cada troca de curso em destaque, então
// carrega uma vez só. Se falhar, a arte sai sem o logo (só com "Futuro+") e a
// próxima tentativa carrega de novo.
let promessaLogo = null;

function carregarLogo() {
    if (!promessaLogo) {
        promessaLogo = new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = '/logo-branco.png';
        }).catch((erro) => {
            console.warn('Não deu para carregar o logo da arte de compartilhamento:', erro);
            promessaLogo = null;
            return null;
        });
    }
    return promessaLogo;
}

function canvasParaBlob(canvas) {
    return new Promise((resolve) => canvas.toBlob(resolve, 'image/png', 0.95));
}

// Desenha e já converte pra PNG. O painel guarda o arquivo pronto, e não o
// canvas: o navegador pode descartar o conteúdo de um canvas guardado (aba em
// segundo plano enquanto a pessoa abre outro app, celular com pouca memória)
// e a imagem compartilhada sairia em branco. Também deixa o "Compartilhar"
// instantâneo — o menu do celular só abre se for chamado logo após o toque.
async function gerarPng(desenhar, dados) {
    const canvas = await desenhar(dados);
    const blob = await canvasParaBlob(canvas);
    if (!blob) throw new Error('canvas.toBlob não devolveu nada');
    return blob;
}

function novoContexto(altura) {
    const canvas = document.createElement('canvas');
    canvas.width = LARGURA;
    canvas.height = altura;
    const ctx = canvas.getContext('2d');
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    return { canvas, ctx };
}

// Roda a mesma sequência de desenho numa tela descartável (1px de altura —
// nenhuma peça usa o tamanho do canvas pra medir ou posicionar) só pra saber
// até onde o bloco vai, sem desenhar de verdade.
function medirAltura(desenhar) {
    const { ctx } = novoContexto(1);
    return desenhar(ctx, 0);
}

// Busca binária pela maior escala que cabe (umas 8 medições em vez de testar
// de 0,025 em 0,025) — conta no celular, que redesenha 2 artes a cada troca
// do curso em destaque.
function escolherEscala(desenharConteudo, alturaDisponivel) {
    const cabe = (escala) => medirAltura((ctx, y) => desenharConteudo(ctx, y, escala)) <= alturaDisponivel;
    if (cabe(ESCALA_MAXIMA)) return ESCALA_MAXIMA;
    if (!cabe(ESCALA_MINIMA)) return ESCALA_MINIMA;

    let cabeEm = ESCALA_MINIMA;
    let naoCabeEm = ESCALA_MAXIMA;
    while (naoCabeEm - cabeEm > 0.01) {
        const meio = (cabeEm + naoCabeEm) / 2;
        if (cabe(meio)) cabeEm = meio;
        else naoCabeEm = meio;
    }
    return cabeEm;
}

// ------------------------------------------------------------------
// Moldura fixa (igual nas 3 imagens)
// ------------------------------------------------------------------

function desenharFundo(ctx) {
    ctx.fillStyle = CORES.fundo;
    ctx.fillRect(0, 0, LARGURA, ALTURA);
}

// Logo branco + "Futuro+", com o texto centralizado na altura do logo.
function desenharCabecalho(ctx, logo) {
    let xTexto = MARGEM;
    if (logo) {
        ctx.drawImage(logo, MARGEM, LOGO.y, LOGO.tamanho, LOGO.tamanho);
        xTexto += LOGO.tamanho + 22;
    }

    const tamanho = 42;
    definirFonte(ctx, 700, tamanho, -0.4);
    ctx.fillStyle = CORES.branco;
    ctx.fillText('Futuro+', xTexto, LOGO.y + LOGO.tamanho / 2 + (tamanho * CAP) / 2);
}

// Três pílulas da mesma espessura saindo pela borda direita (a ponta direita
// fica fora da arte), com a ponta esquerda em alturas diferentes — mesmas
// proporções do post (a laranja começa perto da metade da largura).
function desenharPilulas(ctx) {
    const { y, altura, gap } = PILULAS;
    const pilulas = [
        { x: 518, cor: CORES.laranja },
        { x: 702, cor: CORES.verde },
        { x: 602, cor: CORES.pilulaClara }
    ];

    pilulas.forEach(({ x, cor }, indice) => {
        ctx.fillStyle = cor;
        desenharRetanguloArredondado(ctx, x, y + indice * (altura + gap), LARGURA - x + altura, altura, altura / 2);
        ctx.fill();
    });
}

// Rodapé no canto de baixo à esquerda, como o @futuroplus_ do post.
function desenharRodape(ctx) {
    definirFonte(ctx, 700, 36, -0.2);
    ctx.fillStyle = CORES.branco;
    ctx.fillText('@futuroplus_', MARGEM, RODAPE.yArroba);

    definirFonte(ctx, 500, 29);
    ctx.globalAlpha = 0.82;
    ctx.fillText('Faça o seu teste de orientação vocacional grátis', MARGEM, RODAPE.yChamada);
    ctx.globalAlpha = 1;
}

// ------------------------------------------------------------------
// Blocos de conteúdo. Cada um recebe o y do topo das letras e devolve o y
// onde termina (linha de base + a descida das letras, quando há).
// ------------------------------------------------------------------

// Etiqueta branca com texto azul, igual ao "Novidade" do post. Não muda de
// tamanho com a escala: é o mesmo selo nas 3 imagens.
function desenharEtiqueta(ctx, y, texto) {
    const tamanho = 30;
    const altura = 64;
    const padX = 30;

    definirFonte(ctx, 600, tamanho);
    const conteudo = cortarComReticencias(ctx, texto || 'Resultado do teste', LARGURA_UTIL - padX * 2);
    const largura = ctx.measureText(conteudo).width + padX * 2;

    ctx.fillStyle = CORES.branco;
    desenharRetanguloArredondado(ctx, MARGEM, y, largura, altura, altura / 2);
    ctx.fill();

    ctx.fillStyle = CORES.fundo;
    ctx.fillText(conteudo, MARGEM + padX, y + altura / 2 + (tamanho * CAP) / 2);
    return y + altura;
}

// Título grande e apertado (Inter 800), como o "Chegou o Futuro+." do post.
function desenharTitulo(ctx, y, texto, { maximo, minimo, maxLinhas }) {
    const { tamanho, linhas } = ajustarTexto(ctx, texto, {
        peso: 800, maximo, minimo, larguraMax: LARGURA_UTIL, maxLinhas, espacamento: -0.02
    });

    ctx.fillStyle = CORES.branco;
    let base = y + tamanho * CAP;
    linhas.forEach((linha, indice) => {
        if (indice) base += tamanho * 1.06;
        ctx.fillText(linha, MARGEM, base);
    });

    return base + tamanho * DESCIDA;
}

// Número grande (ex. "57%") com o complemento ("de afinidade") ao lado, na
// mesma linha de base. Se o complemento não couber ao lado, vai embaixo.
function desenharNumero(ctx, y, numero, complemento, tamanho) {
    definirFonte(ctx, 800, tamanho, -tamanho * 0.03);
    ctx.fillStyle = CORES.branco;
    const base = y + tamanho * CAP;
    ctx.fillText(numero, MARGEM, base);
    const larguraNumero = ctx.measureText(numero).width;

    if (!complemento) return base;

    const tamanhoComplemento = Math.max(26, Math.round(tamanho * 0.2));
    definirFonte(ctx, 600, tamanhoComplemento);
    ctx.globalAlpha = 0.92;

    const xAoLado = MARGEM + larguraNumero + tamanho * 0.1;
    if (xAoLado + ctx.measureText(complemento).width <= LARGURA - MARGEM) {
        ctx.fillText(complemento, xAoLado, base);
        ctx.globalAlpha = 1;
        return base;
    }

    const baseEmbaixo = base + tamanhoComplemento * 1.3;
    ctx.fillText(complemento, MARGEM, baseEmbaixo);
    ctx.globalAlpha = 1;
    return baseEmbaixo + tamanhoComplemento * DESCIDA;
}

// Texto corrido (frase motivacional, linha de apoio), como o subtítulo do post.
function desenharFrase(ctx, y, texto, tamanhoMaximo, maxLinhas) {
    const { tamanho, linhas } = ajustarTexto(ctx, texto, {
        peso: 500, maximo: tamanhoMaximo, minimo: tamanhoMaximo * 0.8, larguraMax: LARGURA_UTIL, maxLinhas
    });

    ctx.fillStyle = CORES.branco;
    ctx.globalAlpha = 0.92;
    let base = y + tamanho * CAP;
    linhas.forEach((linha, indice) => {
        if (indice) base += tamanho * 1.34;
        ctx.fillText(linha, MARGEM, base);
    });
    ctx.globalAlpha = 1;

    return base + tamanho * DESCIDA;
}

// Linha de apoio em duas partes: rótulo leve em cima e o valor em negrito
// embaixo (ex. "Com base no meu resultado:" / "Inteligência Interpessoal ·
// 57%"), pra o número nunca sobrar sozinho numa linha.
function desenharApoio(ctx, y, { rotulo, valor }, tamanho) {
    definirFonte(ctx, 500, tamanho);
    ctx.fillStyle = CORES.branco;
    ctx.globalAlpha = 0.85;
    let base = y + tamanho * CAP;
    ctx.fillText(cortarComReticencias(ctx, rotulo, LARGURA_UTIL), MARGEM, base);
    ctx.globalAlpha = 1;

    const ajuste = ajustarTexto(ctx, valor, {
        peso: 700, maximo: tamanho * 1.1, minimo: tamanho * 0.8, larguraMax: LARGURA_UTIL, maxLinhas: 2
    });
    ajuste.linhas.forEach((linha) => {
        base += ajuste.tamanho * 1.32;
        ctx.fillText(linha, MARGEM, base);
    });

    return base + ajuste.tamanho * DESCIDA;
}

function desenharRotuloSecao(ctx, y, texto) {
    const tamanho = 24;
    definirFonte(ctx, 700, tamanho, 2.4);
    ctx.fillStyle = CORES.branco;
    ctx.globalAlpha = 0.85;
    const base = y + tamanho * CAP;
    ctx.fillText(texto.toUpperCase(), MARGEM, base);
    ctx.globalAlpha = 1;
    return base;
}

// Estrela de 5 pontas desenhada em vetor (o caractere ★ não existe na Inter e
// cada celular desenharia de um jeito). O centro desce um pouco porque as
// pontas de baixo são mais curtas que a de cima.
function desenharEstrela(ctx, cx, cy, raio) {
    const raioInterno = raio * 0.45;
    const centroY = cy + raio * 0.1;
    ctx.beginPath();
    for (let ponta = 0; ponta < 10; ponta += 1) {
        const r = ponta % 2 === 0 ? raio : raioInterno;
        const angulo = -Math.PI / 2 + (ponta * Math.PI) / 5;
        const px = cx + r * Math.cos(angulo);
        const py = centroY + r * Math.sin(angulo);
        if (ponta === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
}

// Selo laranja ("★ MAIS COMBINA" / "★ MINHA ESCOLHA") com texto escuro — o
// branco sobre esse laranja fica difícil de ler.
function desenharSelo(ctx, x, y, texto, k) {
    const altura = Math.round(46 * k);
    const tamanho = Math.round(21 * k);
    const padX = 18 * k;
    const tamanhoEstrela = tamanho * 1.05;
    const gap = 10 * k;

    definirFonte(ctx, 800, tamanho, 1.6 * k);
    const conteudo = texto.toUpperCase();
    const largura = padX + tamanhoEstrela + gap + ctx.measureText(conteudo).width + padX;

    ctx.fillStyle = CORES.laranja;
    desenharRetanguloArredondado(ctx, x, y, largura, altura, altura / 2);
    ctx.fill();

    ctx.fillStyle = CORES.tinta;
    desenharEstrela(ctx, x + padX + tamanhoEstrela / 2, y + altura / 2, tamanhoEstrela / 2);
    ctx.fillText(conteudo, x + padX + tamanhoEstrela + gap, y + altura / 2 + (tamanho * CAP) / 2);

    return y + altura;
}

// Curso em destaque: cartão branco com contorno laranja, selo em cima e o
// nome logo abaixo, tudo na mesma margem interna. `k` é a escala da lista.
function desenharCursoDestaque(ctx, y, curso, selo, mostrarRotulo, k) {
    const padX = 36 * k;
    const padTopo = 30 * k;
    const padBase = 34 * k;
    const xTexto = MARGEM + padX;
    const larguraTexto = LARGURA_UTIL - padX * 2;

    // mede tudo antes, pra saber a altura do cartão
    const nome = ajustarTexto(ctx, curso.nome, {
        peso: 800, maximo: 50 * k, minimo: 32 * k, larguraMax: larguraTexto, maxLinhas: 2, espacamento: -0.01
    });
    const entreLinhas = nome.tamanho * 1.12;
    const yTopoNome = y + padTopo + 46 * k + 22 * k;
    const primeiraBase = yTopoNome + nome.tamanho * CAP;
    const ultimaBase = primeiraBase + (nome.linhas.length - 1) * entreLinhas;
    const tamanhoRotulo = Math.round(25 * k);
    const baseRotulo = ultimaBase + nome.tamanho * DESCIDA + 12 * k + tamanhoRotulo * CAP;
    const fim = (mostrarRotulo ? baseRotulo : ultimaBase) + padBase;
    const altura = fim - y;

    const raio = 32 * k;
    const borda = 6 * k;
    ctx.fillStyle = CORES.branco;
    desenharRetanguloArredondado(ctx, MARGEM, y, LARGURA_UTIL, altura, raio);
    ctx.fill();
    ctx.lineWidth = borda;
    ctx.strokeStyle = CORES.laranja;
    desenharRetanguloArredondado(ctx, MARGEM + borda / 2, y + borda / 2, LARGURA_UTIL - borda, altura - borda, raio - borda / 2);
    ctx.stroke();

    desenharSelo(ctx, xTexto, y + padTopo, selo, k);

    definirFonte(ctx, 800, nome.tamanho, nome.tamanho * -0.01);
    ctx.fillStyle = CORES.fundo;
    nome.linhas.forEach((linha, indice) => ctx.fillText(linha, xTexto, primeiraBase + indice * entreLinhas));

    if (mostrarRotulo) {
        definirFonte(ctx, 600, tamanhoRotulo);
        ctx.fillStyle = CORES.tintaSuave;
        ctx.fillText(cortarComReticencias(ctx, curso.rotulo, larguraTexto), xTexto, baseRotulo);
    }

    return y + altura;
}

// Demais cursos: pílula na cor da pílula clara do post, com o nome em branco.
function desenharCursoSimples(ctx, y, curso, mostrarRotulo, k) {
    const padX = 36 * k;
    const padY = 27 * k;
    const xTexto = MARGEM + padX;
    const larguraTexto = LARGURA_UTIL - padX * 2;

    const nome = ajustarTexto(ctx, curso.nome, {
        peso: 700, maximo: 40 * k, minimo: 28 * k, larguraMax: larguraTexto, maxLinhas: 2, espacamento: -0.005
    });
    const entreLinhas = nome.tamanho * 1.16;
    const primeiraBase = y + padY + nome.tamanho * CAP;
    const ultimaBase = primeiraBase + (nome.linhas.length - 1) * entreLinhas;
    const tamanhoRotulo = Math.round(24 * k);
    const baseRotulo = ultimaBase + nome.tamanho * DESCIDA + 10 * k + tamanhoRotulo * CAP;
    const fim = (mostrarRotulo ? baseRotulo : ultimaBase) + padY;
    const altura = fim - y;

    ctx.fillStyle = CORES.pilulaClara;
    desenharRetanguloArredondado(ctx, MARGEM, y, LARGURA_UTIL, altura, Math.min(altura / 2, 44 * k));
    ctx.fill();

    definirFonte(ctx, 700, nome.tamanho, nome.tamanho * -0.005);
    ctx.fillStyle = CORES.branco;
    nome.linhas.forEach((linha, indice) => ctx.fillText(linha, xTexto, primeiraBase + indice * entreLinhas));

    if (mostrarRotulo) {
        definirFonte(ctx, 500, tamanhoRotulo);
        ctx.globalAlpha = 0.85;
        ctx.fillText(cortarComReticencias(ctx, curso.rotulo, larguraTexto), xTexto, baseRotulo);
        ctx.globalAlpha = 1;
    }

    return y + altura;
}

function desenharListaCursos(ctx, y, cursos, { selo, mostrarRotulos, k }) {
    let yAtual = y;
    cursos.forEach((curso, indice) => {
        if (indice) yAtual += 18 * k;
        yAtual = indice === 0
            ? desenharCursoDestaque(ctx, yAtual, curso, selo, mostrarRotulos, k)
            : desenharCursoSimples(ctx, yAtual, curso, mostrarRotulos, k);
    });
    return yAtual;
}

// Pódio: as 3 primeiras inteligências (ou áreas, no Vocacional), cada uma com
// a posição numa pílula nas cores das pílulas do topo (laranja, verde,
// branca), o nome e — quando o teste calcula — a porcentagem e uma barra.
const CORES_PODIO = [
    { fundo: CORES.laranja, texto: CORES.tinta },
    { fundo: CORES.verde, texto: CORES.branco },
    { fundo: CORES.branco, texto: CORES.fundo }
];

function desenharItemPodio(ctx, y, item, indice, s) {
    const cor = CORES_PODIO[indice] || CORES_PODIO[CORES_PODIO.length - 1];
    const alturaPosicao = Math.round(52 * s);
    const larguraPosicao = Math.round(80 * s);
    const tamanhoPosicao = Math.round(26 * s);
    const tamanho = Math.round(34 * s);
    const temPorcentagem = Number.isFinite(item.porcentagem);

    ctx.fillStyle = cor.fundo;
    desenharRetanguloArredondado(ctx, MARGEM, y, larguraPosicao, alturaPosicao, alturaPosicao / 2);
    ctx.fill();
    definirFonte(ctx, 800, tamanhoPosicao);
    ctx.fillStyle = cor.texto;
    ctx.textAlign = 'center';
    ctx.fillText(`${indice + 1}º`, MARGEM + larguraPosicao / 2, y + alturaPosicao / 2 + (tamanhoPosicao * CAP) / 2);
    ctx.textAlign = 'left';

    // nome e porcentagem centralizados na altura da pílula da posição
    const base = y + alturaPosicao / 2 + (tamanho * CAP) / 2;
    const xNome = MARGEM + larguraPosicao + 22 * s;
    let espacoPorcentagem = 0;
    ctx.fillStyle = CORES.branco;

    if (temPorcentagem) {
        definirFonte(ctx, 800, tamanho);
        const porcentagem = `${Math.round(item.porcentagem)}%`;
        espacoPorcentagem = ctx.measureText(porcentagem).width + 24 * s;
        ctx.textAlign = 'right';
        ctx.fillText(porcentagem, LARGURA - MARGEM, base);
        ctx.textAlign = 'left';
    }

    definirFonte(ctx, 700, tamanho, -0.2);
    ctx.fillText(cortarComReticencias(ctx, item.nome, LARGURA - MARGEM - xNome - espacoPorcentagem), xNome, base);

    if (!temPorcentagem) return y + alturaPosicao;

    // barra de 0 a 100%, igual ao "Seu perfil completo" da tela de resultado
    const yBarra = y + alturaPosicao + 16 * s;
    const alturaBarra = Math.round(16 * s);
    const fracao = Math.min(100, Math.max(0, item.porcentagem)) / 100;
    ctx.fillStyle = CORES.pilulaClara;
    desenharRetanguloArredondado(ctx, MARGEM, yBarra, LARGURA_UTIL, alturaBarra, alturaBarra / 2);
    ctx.fill();
    ctx.fillStyle = cor.fundo;
    desenharRetanguloArredondado(ctx, MARGEM, yBarra, Math.max(alturaBarra, LARGURA_UTIL * fracao), alturaBarra, alturaBarra / 2);
    ctx.fill();

    return yBarra + alturaBarra;
}

function desenharPodio(ctx, y, itens, s) {
    let yAtual = desenharRotuloSecao(ctx, y, 'Meu pódio');
    itens.forEach((item, indice) => {
        yAtual = desenharItemPodio(ctx, yAtual + (indice ? 28 : 26) * s, item, indice, s);
    });
    return yAtual;
}

// ------------------------------------------------------------------
// Curso em destaque e rótulos
// ------------------------------------------------------------------

// Selo do curso em destaque: o 1º da recomendação é o que "mais combina";
// qualquer outro (ou um que a pessoa já tinha marcado como "Quero esse" no
// Vocacional) é escolha dela.
function textoSelo(cursos, indice) {
    return indice === 0 && !cursos[0]?.escolhido ? 'Mais combina' : 'Minha escolha';
}

// Até 3 cursos, com o de `indiceDestaque` em primeiro e os outros na ordem
// original da recomendação.
function organizarCursos(cursos, indiceDestaque = 0) {
    const lista = (cursos || []).filter((curso) => curso?.nome).slice(0, 3);
    if (!lista.length) return { lista, selo: null, mostrarRotulos: false };

    const indice = Math.min(Math.max(Number(indiceDestaque) || 0, 0), lista.length - 1);
    const ordenada = [lista[indice], ...lista.filter((_, i) => i !== indice)];

    // No Teste rápido os 3 cursos costumam vir da mesma inteligência, com o
    // mesmo rótulo ("57% · Interpessoal") — repetir igual em todos é ruído,
    // e o número já aparece grande na arte. Só mostra quando eles diferem.
    const rotulos = new Set(ordenada.map((curso) => String(curso.rotulo || '').trim().toLowerCase()));
    const mostrarRotulos = ordenada.some((curso) => curso.rotulo) && rotulos.size > 1;

    return { lista: ordenada, selo: textoSelo(lista, indice), mostrarRotulos };
}

function textoBaseDoResultado({ titulo, numero }) {
    if (!titulo) return null;
    return { rotulo: 'Com base no meu resultado:', valor: numero ? `${titulo} · ${numero}` : titulo };
}

// ------------------------------------------------------------------
// As 3 imagens do carrossel
// ------------------------------------------------------------------

// Moldura + conteúdo na maior escala que couber. O conteúdo fica ancorado
// embaixo, perto do rodapé, como o texto do post — se sobrar espaço (arte
// com pouco texto), ele aparece entre as pílulas e a etiqueta.
async function montarArte(desenharConteudo) {
    const [logo] = await Promise.all([carregarLogo(), aguardarFontes()]);
    const { canvas, ctx } = novoContexto(ALTURA);

    desenharFundo(ctx);
    desenharCabecalho(ctx, logo);
    desenharPilulas(ctx);
    desenharRodape(ctx);

    const alturaDisponivel = BASE_CONTEUDO - TOPO_CONTEUDO;
    const escala = escolherEscala(desenharConteudo, alturaDisponivel);
    const alturaConteudo = medirAltura((ctxMedida, y) => desenharConteudo(ctxMedida, y, escala));
    const y = Math.max(TOPO_CONTEUDO, BASE_CONTEUDO - alturaConteudo);
    desenharConteudo(ctx, y, escala);

    return canvas;
}

// Imagem 1 · Porcentagem: categoria/área forte + número (% de afinidade,
// quando há) + frase motivacional + pódio com os 3 primeiros perfis (quando
// a tela manda o ranking). Sem cursos.
export function desenharArtePerfil({ etiquetaTopo, titulo, numero, numeroLabel, frase, ranking }) {
    const podio = (ranking || []).filter((item) => item?.nome).slice(0, 3);

    return montarArte((ctx, y, s) => {
        let yAtual = desenharEtiqueta(ctx, y, etiquetaTopo);
        yAtual = desenharTitulo(ctx, yAtual + 46 * s, titulo, { maximo: 128 * s, minimo: 64 * s, maxLinhas: 3 });
        if (numero) yAtual = desenharNumero(ctx, yAtual + 40 * s, numero, numeroLabel, 200 * s);
        if (frase) yAtual = desenharFrase(ctx, yAtual + 46 * s, frase, 42 * s, 3);
        // o pódio não encolhe abaixo do tamanho base (texto de ~34px, o mínimo
        // confortável num story): quem cede espaço é o título e o número
        if (podio.length >= 2) yAtual = desenharPodio(ctx, yAtual + 66 * s, podio, Math.max(s, 0.98));
        return yAtual;
    });
}

// Imagem 2 · Cursos recomendados: a lista de até 3 cursos, com o curso em
// destaque no topo. Embaixo do título, uma linha lembra de qual resultado os
// cursos saíram (o número/perfil não aparece grande nesta arte).
export function desenharArteListaCursos({ etiquetaTopo, titulo, numero, cursos, indiceDestaque = 0 }) {
    const { lista, selo, mostrarRotulos } = organizarCursos(cursos, indiceDestaque);
    const apoio = textoBaseDoResultado({ titulo, numero });

    return montarArte((ctx, y, s) => {
        let yAtual = desenharEtiqueta(ctx, y, etiquetaTopo);
        yAtual = desenharTitulo(ctx, yAtual + 46 * s, 'Cursos que mais combinam comigo', { maximo: 104 * s, minimo: 60 * s, maxLinhas: 3 });
        if (apoio) yAtual = desenharApoio(ctx, yAtual + 32 * s, apoio, 34 * s);
        return desenharListaCursos(ctx, yAtual + 58 * s, lista, { selo, mostrarRotulos, k: 1.16 * s });
    });
}

// Imagem 3 · Completa: tudo da imagem 1 + a lista de cursos, na mesma arte.
export function desenharArteResultado({ etiquetaTopo, titulo, numero, numeroLabel, frase, cursos, indiceDestaque = 0 }) {
    const { lista, selo, mostrarRotulos } = organizarCursos(cursos, indiceDestaque);

    return montarArte((ctx, y, s) => {
        let yAtual = desenharEtiqueta(ctx, y, etiquetaTopo);
        yAtual = desenharTitulo(ctx, yAtual + 42 * s, titulo, { maximo: 98 * s, minimo: 56 * s, maxLinhas: 2 });
        if (numero) yAtual = desenharNumero(ctx, yAtual + 32 * s, numero, numeroLabel, 140 * s);
        if (frase) yAtual = desenharFrase(ctx, yAtual + 36 * s, frase, 34 * s, 2);
        if (lista.length) {
            yAtual = desenharRotuloSecao(ctx, yAtual + 62 * s, 'Cursos que mais combinam comigo');
            yAtual = desenharListaCursos(ctx, yAtual + 26 * s, lista, { selo, mostrarRotulos, k: s });
        }
        return yAtual;
    });
}

// ------------------------------------------------------------------
// Legenda sugerida (um texto só, vale pras imagens que forem compartilhadas)
// ------------------------------------------------------------------

// Endereço público do site. A legenda aponta sempre pra ele, mesmo quando a
// arte é gerada no servidor local ou num canal de prévia do Firebase (o link
// de uma prévia expira). Se o site ganhar domínio próprio, é só trocar aqui.
const SITE_PUBLICO = 'https://futuroplus-bce54.web.app';

// Exemplo (Teste rápido, curso sugerido pelo teste):
//   ✨Mente lógica, pronta pra resolver qualquer problema.✨
//
//   Fiz o teste no @futuroplus_ e meu resultado foi Inteligência Lógico-Matemática (38% de afinidade). 😎
//   Curso que mais combina comigo: Eletrônica. 🤓
//   Faça o seu também no https://futuroplus-bce54.web.app/testes.html
//   SIGA EM TODAS AS REDES: 👉 @futuroplus_ 👈
function montarLegenda({ titulo, numero, numeroLabel, frase }, cursoDestaque, ehEscolhaDaPessoa) {
    const linhas = [];

    if (frase) linhas.push(`✨${frase}✨`, '');

    // o Vocacional não tem porcentagem: aí sai só a área ("... foi Ambiente e Saúde.")
    const porcentagem = numero ? ` (${numero}${numeroLabel ? ` ${numeroLabel}` : ''})` : '';
    linhas.push(`Fiz o teste no @futuroplus_ e meu resultado foi ${titulo}${porcentagem}. 😎`);

    if (cursoDestaque) {
        linhas.push(ehEscolhaDaPessoa
            ? `Curso que eu escolhi: ${cursoDestaque.nome}. 🤓`
            : `Curso que mais combina comigo: ${cursoDestaque.nome}. 🤓`);
    }

    linhas.push(`Faça o seu também no ${SITE_PUBLICO}/testes.html`);
    linhas.push('SIGA EM TODAS AS REDES: 👉 @futuroplus_ 👈');

    return linhas.join('\n');
}

// ------------------------------------------------------------------
// Compartilhar / baixar
// ------------------------------------------------------------------

function baixarArquivo(arquivo) {
    const url = URL.createObjectURL(arquivo);
    const link = document.createElement('a');
    link.href = url;
    link.download = arquivo.name;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
}

// Copia a legenda sozinho, sem mostrar nenhuma caixa de texto na tela — é
// chamado toda vez que a pessoa compartilha ou baixa, pra legenda já estar
// pronta pra colar (o Instagram Stories, por exemplo, não aceita texto junto
// com a imagem compartilhada, então isso é o que sobra como apoio pra ele).
async function copiarLegendaSilenciosamente(texto) {
    try {
        await navigator.clipboard.writeText(texto);
        return true;
    } catch {
        try {
            const temp = document.createElement('textarea');
            temp.value = texto;
            temp.style.position = 'fixed';
            temp.style.opacity = '0';
            document.body.appendChild(temp);
            temp.select();
            document.execCommand('copy');
            temp.remove();
            return true;
        } catch {
            return false;
        }
    }
}

// ------------------------------------------------------------------
// Componente de UI: botão → escolha do curso em destaque + carrossel com
// seleção → compartilhar/baixar + legenda
// ------------------------------------------------------------------

// dados = { etiquetaTopo, titulo, numero, numeroLabel, frase, cursos, ranking }
//   cursos = [{ nome, rotulo, escolhido? }] — `escolhido: true` marca o curso
//   que a pessoa já tinha escolhido no teste (ex. "Quero esse" no Vocacional);
//   ele começa em destaque, com o selo "Minha escolha".
//   ranking = [{ nome, porcentagem? }] — os primeiros perfis/áreas, em ordem,
//   pro pódio da imagem da porcentagem (precisa de pelo menos 2; sem
//   porcentagem, o pódio sai sem número e sem barra).
// opcoes = { nomeArquivoBase }
export function criarPainelCompartilhar(dados, opcoes = {}) {
    const nomeArquivoBase = opcoes.nomeArquivoBase || 'futuroplus-resultado';
    const cursos = (dados.cursos || []).filter((curso) => curso?.nome).slice(0, 3);
    const temCursos = cursos.length > 0;
    const indiceSugerido = cursos.findIndex((curso) => curso.escolhido);
    let indiceDestaque = indiceSugerido >= 0 ? indiceSugerido : 0;

    const dadosDaArte = () => ({ ...dados, cursos, indiceDestaque });

    // cada entrada vira uma imagem no carrossel, na ordem em que aparecem aqui;
    // as que usam cursos são redesenhadas quando a pessoa troca o destaque
    const imagens = [{
        rotulo: dados.numero ? 'Porcentagem' : 'Resultado',
        nomeArquivo: `${nomeArquivoBase}-porcentagem.png`,
        usaCursos: false,
        desenhar: desenharArtePerfil
    }];
    if (temCursos) {
        imagens.push(
            { rotulo: 'Cursos recomendados', nomeArquivo: `${nomeArquivoBase}-cursos.png`, usaCursos: true, desenhar: desenharArteListaCursos },
            { rotulo: 'Completa', nomeArquivo: `${nomeArquivoBase}-completa.png`, usaCursos: true, desenhar: desenharArteResultado }
        );
    }

    const painel = document.createElement('div');
    painel.className = 'compartilhar-resultado';
    painel.innerHTML = `
        <button type="button" class="btn-compartilhar-resultado">
            ${ICONE_COMPARTILHAR}
            <span>Compartilhar resultado</span>
        </button>
        <p class="compartilhar-resultado-status" aria-live="polite"></p>
        <div class="compartilhar-resultado-carrossel" hidden>
            <fieldset class="compartilhar-destaque" hidden>
                <legend>Qual curso vai em destaque na arte?</legend>
                <div class="compartilhar-destaque-opcoes"></div>
            </fieldset>
            <div class="compartilhar-carrossel-scroll"></div>
            <button type="button" class="btn-confirmar-compartilhar">
                ${ICONE_COMPARTILHAR}
                <span>Compartilhar selecionadas</span>
            </button>
        </div>
    `;

    const botaoPrincipal = painel.querySelector('.btn-compartilhar-resultado');
    const status = painel.querySelector('.compartilhar-resultado-status');
    const blocoCarrossel = painel.querySelector('.compartilhar-resultado-carrossel');
    const blocoDestaque = painel.querySelector('.compartilhar-destaque');
    const opcoesDestaque = painel.querySelector('.compartilhar-destaque-opcoes');
    const scrollCarrossel = painel.querySelector('.compartilhar-carrossel-scroll');
    const botaoConfirmar = painel.querySelector('.btn-confirmar-compartilhar');

    // preenchido depois de gerar as imagens:
    // { blob, url, img, nomeArquivo, usaCursos, desenhar, checkbox }
    let itensGerados = [];
    // cada troca de destaque ganha um número; se a pessoa tocar em outro curso
    // antes de terminar de redesenhar, o resultado antigo é descartado
    let versaoDestaque = 0;

    // Só faz sentido escolher com 2 ou mais cursos.
    if (cursos.length > 1) {
        const nomeGrupo = `compartilhar-destaque-${Math.random().toString(36).slice(2)}`;
        cursos.forEach((curso, indice) => {
            const opcao = document.createElement('label');
            opcao.className = 'compartilhar-destaque-opcao';

            const input = document.createElement('input');
            input.type = 'radio';
            input.name = nomeGrupo;
            input.value = String(indice);
            input.checked = indice === indiceDestaque;

            const texto = document.createElement('span');
            texto.innerHTML = ICONE_ESTRELA;
            texto.append(curso.nome);

            opcao.append(input, texto);
            opcoesDestaque.appendChild(opcao);
        });
        blocoDestaque.hidden = false;
    }

    async function trocarDestaque(novoIndice) {
        indiceDestaque = novoIndice;
        const versao = ++versaoDestaque;
        botaoConfirmar.disabled = true;
        status.textContent = 'Atualizando as artes...';

        try {
            const dadosAtuais = dadosDaArte();
            const novos = await Promise.all(itensGerados.map((item) => (
                item.usaCursos ? gerarPng(item.desenhar, dadosAtuais) : null
            )));
            if (versao !== versaoDestaque) return;

            novos.forEach((blob, indice) => {
                if (!blob) return;
                const item = itensGerados[indice];
                URL.revokeObjectURL(item.url);
                item.blob = blob;
                item.url = URL.createObjectURL(blob);
                item.img.src = item.url;
            });
            status.textContent = `${cursos[novoIndice].nome} está em destaque nas artes com cursos.`;
        } catch (erro) {
            console.error('Erro ao redesenhar as imagens com o novo curso em destaque:', erro);
            if (versao === versaoDestaque) status.textContent = 'Não consegui atualizar as imagens agora. Tente de novo em instantes.';
        } finally {
            if (versao === versaoDestaque) botaoConfirmar.disabled = false;
        }
    }

    opcoesDestaque.addEventListener('change', (evento) => {
        const indice = Number(evento.target.value);
        if (Number.isInteger(indice) && itensGerados.length) trocarDestaque(indice);
    });

    botaoPrincipal.addEventListener('click', async () => {
        botaoPrincipal.disabled = true;
        status.textContent = 'Gerando imagens...';

        try {
            const dadosAtuais = dadosDaArte();
            const blobs = await Promise.all(imagens.map((imagem) => gerarPng(imagem.desenhar, dadosAtuais)));

            itensGerados.forEach((item) => URL.revokeObjectURL(item.url));
            scrollCarrossel.innerHTML = '';
            itensGerados = blobs.map((blob, indice) => {
                const imagem = imagens[indice];
                const id = `compartilhar-item-${Math.random().toString(36).slice(2)}-${indice}`;
                const label = document.createElement('label');
                label.className = 'compartilhar-carrossel-item';
                label.innerHTML = `
                    <input type="checkbox" class="compartilhar-carrossel-checkbox" id="${id}" checked>
                    <span class="compartilhar-carrossel-marca" aria-hidden="true"></span>
                    <span class="compartilhar-carrossel-thumb-wrap">
                        <img alt="Prévia: ${imagem.rotulo}">
                    </span>
                    <span class="compartilhar-carrossel-rotulo">${imagem.rotulo}</span>
                `;
                const img = label.querySelector('img');
                const url = URL.createObjectURL(blob);
                img.src = url;
                scrollCarrossel.appendChild(label);

                return {
                    blob,
                    url,
                    img,
                    nomeArquivo: imagem.nomeArquivo,
                    usaCursos: imagem.usaCursos,
                    desenhar: imagem.desenhar,
                    checkbox: label.querySelector('.compartilhar-carrossel-checkbox')
                };
            });

            blocoCarrossel.hidden = false;
            botaoPrincipal.hidden = true;
            status.textContent = cursos.length > 1
                ? 'Escolha o curso em destaque e quais imagens quer compartilhar.'
                : 'Escolha quais imagens quer compartilhar (todas marcadas por padrão).';
        } catch (erro) {
            console.error('Erro ao gerar as imagens de compartilhamento:', erro);
            status.textContent = 'Não consegui gerar as imagens agora. Tente de novo em instantes.';
        } finally {
            botaoPrincipal.disabled = false;
        }
    });

    botaoConfirmar.addEventListener('click', async () => {
        const selecionados = itensGerados.filter((item) => item.checkbox.checked);

        if (!selecionados.length) {
            status.textContent = 'Selecione pelo menos uma imagem.';
            return;
        }

        botaoConfirmar.disabled = true;
        status.textContent = 'Preparando...';

        try {
            const arquivos = selecionados.map((item) => new File([item.blob], item.nomeArquivo, { type: 'image/png' }));

            const podeCompartilharArquivos =
                typeof navigator.canShare === 'function' && navigator.canShare({ files: arquivos });

            const legenda = montarLegenda(
                dados,
                cursos[indiceDestaque] || null,
                temCursos && textoSelo(cursos, indiceDestaque) === 'Minha escolha'
            );

            // Vai pro clipboard de qualquer jeito: quando o app de destino aceita
            // texto (WhatsApp, X...), a legenda já chega junto pelo `text` do
            // compartilhamento; isso aqui é só pra quando não aceita (Instagram
            // Stories) ou quando cai no download — sem mostrar nenhuma caixa.
            const legendaCopiada = await copiarLegendaSilenciosamente(legenda);

            if (podeCompartilharArquivos) {
                try {
                    await navigator.share({ files: arquivos, text: legenda, title: 'Futuro+' });
                    status.textContent = legendaCopiada
                        ? 'Compartilhado! A legenda também foi copiada, caso o app não traga ela junto.'
                        : 'Compartilhado!';
                    return;
                } catch (erroCompartilhar) {
                    if (erroCompartilhar?.name === 'AbortError') {
                        status.textContent = 'Compartilhamento cancelado.';
                        return;
                    }
                    console.warn('Não foi possível abrir o menu de compartilhar, baixando as imagens:', erroCompartilhar);
                }
            }

            arquivos.forEach((arquivo) => baixarArquivo(arquivo));
            const baixou = arquivos.length > 1 ? 'Imagens baixadas!' : 'Imagem baixada!';
            status.textContent = legendaCopiada ? `${baixou} A legenda já foi copiada — é só colar.` : baixou;
        } catch (erro) {
            console.error('Erro ao compartilhar/baixar as imagens:', erro);
            status.textContent = 'Não consegui preparar as imagens agora. Tente de novo em instantes.';
        } finally {
            botaoConfirmar.disabled = false;
        }
    });

    return painel;
}
