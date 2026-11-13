// Compartilhar resultado — módulo compartilhado pelas 3 telas de resultado de
// teste (Teste rápido, Teste de Afinidades e Teste Vocacional).
//
// Gera um carrossel de 3 imagens no formato de story (1080x1920) com a cara
// do Instagram da marca (fundo azul sólido, pílulas decorativas, logo e
// tipografia Sora/Inter), cada uma mostrando uma coisa diferente:
//   1. Porcentagem — categoria/área forte + número (quando há) + frase.
//   2. Cursos recomendados — só a lista de até 3 cursos.
//   3. Completa — as duas coisas juntas na mesma arte.
// A pessoa escolhe quais quer compartilhar (as 3 vêm marcadas) e, ao
// confirmar, tenta abrir o menu nativo de compartilhar do celular (Web Share
// API, com as imagens marcadas); se o navegador não suportar compartilhar
// arquivo (a maioria dos desktops), baixa cada imagem marcada como PNG.
//
// Cada tela só precisa montar o objeto `dados` com o que já tem calculado —
// este módulo não mexe em nenhuma lógica de pontuação ou recomendação dos
// testes.

const LARGURA = 1080;
const ALTURA = 1920;

const CORES = {
    azul: '#4e6ee8',
    azulEscuro: '#3b5bdb',
    azulSuave: '#eef1ff',
    dourado: '#f5a623',
    verde: '#2ecc71',
    branco: '#ffffff'
};

// Cabeçalho (logo + etiqueta) e rodapé ficam sempre no mesmo lugar nas 3
// imagens; o conteúdo de cada uma é centralizado no espaço que sobra entre
// os dois, em vez de nascer colado no topo.
const LOGO_TOPO_Y = 86;
const DIAMETRO_LOGO_TOPO = 120;
const ETIQUETA_Y = 246;
const GAP_APOS_CABECALHO = 40;
const RODAPE_Y = ALTURA - 100;
const DIAMETRO_LOGO_RODAPE = 52;
const MARGEM_ANTES_RODAPE = 40;

const ICONE_COMPARTILHAR = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" width="19" height="19" aria-hidden="true"><path d="M12 15.5V4M12 4 7.8 8.2M12 4l4.2 4.2"/><path d="M5 13.5V18a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4.5"/></svg>`;

const ICONE_COPIAR = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" width="17" height="17" aria-hidden="true"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1"/></svg>`;

// ------------------------------------------------------------------
// Desenho da arte (canvas) — peças reutilizadas pelas 3 imagens
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

// Fontes carregadas via @import no dashboard.css (Sora e Inter). Sem isso o
// canvas desenharia com a fonte padrão do sistema na primeira renderização.
async function aguardarFontes() {
    const amostras = [
        '400 32px Inter', '500 32px Inter', '600 32px Inter', '700 32px Inter',
        '700 72px Sora'
    ];
    try {
        await Promise.all(amostras.map((f) => document.fonts.load(f)));
        await document.fonts.ready;
    } catch (erro) {
        console.warn('Não deu para confirmar o carregamento das fontes antes de desenhar a arte de compartilhamento:', erro);
    }
}

function carregarLogo() {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = 'assets/images/logo.png';
    });
}

function canvasParaBlob(canvas) {
    return new Promise((resolve) => canvas.toBlob(resolve, 'image/png', 0.95));
}

async function prepararContexto() {
    await aguardarFontes();
    const logo = await carregarLogo().catch(() => null);

    const canvas = document.createElement('canvas');
    canvas.width = LARGURA;
    canvas.height = ALTURA;
    const ctx = canvas.getContext('2d');

    return { canvas, ctx, logo };
}

// Roda a mesma sequência de desenho numa tela descartável (1px de altura —
// não importa, nenhuma das peças usa o tamanho do canvas pra medir texto ou
// posicionar) só pra saber quanta altura o bloco ocupa, sem desenhar de
// verdade. É o que permite centralizar o conteúdo antes de desenhá-lo.
function medirAltura(desenhar) {
    const canvasMedida = document.createElement('canvas');
    canvasMedida.width = LARGURA;
    canvasMedida.height = 1;
    const ctxMedida = canvasMedida.getContext('2d');
    return desenhar(ctxMedida, 0);
}

function centralizarY(topo, base, alturaBloco) {
    const espaco = base - topo;
    return topo + Math.max(0, (espaco - alturaBloco) / 2);
}

// y onde o conteúdo de cada imagem pode terminar, antes do rodapé.
function limiteInferiorConteudo() {
    return RODAPE_Y - DIAMETRO_LOGO_RODAPE / 2 - MARGEM_ANTES_RODAPE;
}

// Fundo azul em degradê + pílulas decorativas, igual aos posts do @futuroplus_
function desenharFundoBase(ctx) {
    const gradienteFundo = ctx.createLinearGradient(0, 0, 0, ALTURA);
    gradienteFundo.addColorStop(0, CORES.azul);
    gradienteFundo.addColorStop(1, CORES.azulEscuro);
    ctx.fillStyle = gradienteFundo;
    ctx.fillRect(0, 0, LARGURA, ALTURA);

    ctx.fillStyle = CORES.dourado;
    desenharRetanguloArredondado(ctx, 460, 70, 540, 56, 28);
    ctx.fill();

    ctx.fillStyle = CORES.verde;
    desenharRetanguloArredondado(ctx, 590, 144, 410, 48, 24);
    ctx.fill();

    ctx.fillStyle = 'rgba(255,255,255,0.22)';
    desenharRetanguloArredondado(ctx, 690, 210, 310, 42, 21);
    ctx.fill();
}

// Logo + "Futuro+" + @futuroplus_, no topo.
function desenharLogoTopo(ctx, logo, { y = LOGO_TOPO_Y } = {}) {
    const logoX = 80;
    const logoY = y;
    const logoDiametro = DIAMETRO_LOGO_TOPO;

    ctx.fillStyle = CORES.branco;
    ctx.beginPath();
    ctx.arc(logoX + logoDiametro / 2, logoY + logoDiametro / 2, logoDiametro / 2, 0, Math.PI * 2);
    ctx.fill();

    if (logo) {
        const tamanhoLogo = 74;
        ctx.drawImage(
            logo,
            logoX + (logoDiametro - tamanhoLogo) / 2,
            logoY + (logoDiametro - tamanhoLogo) / 2,
            tamanhoLogo,
            tamanhoLogo
        );
    }

    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = CORES.branco;
    ctx.font = '700 46px Sora, sans-serif';
    ctx.fillText('Futuro+', logoX + logoDiametro + 26, logoY + 58);

    ctx.font = '600 28px Inter, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.fillText('@futuroplus_', logoX + logoDiametro + 26, logoY + 96);

    return logoY + logoDiametro;
}

// Rodapé: logo pequeno + @futuroplus_ + call to action. Sempre ancorado perto
// da base da imagem, não depende do conteúdo acima.
function desenharRodape(ctx, logo) {
    const rodapeY = RODAPE_Y;
    const handleTexto = '@futuroplus_';
    const diametroLogoRodape = DIAMETRO_LOGO_RODAPE;

    ctx.font = '700 32px Sora, sans-serif';
    const larguraHandle = ctx.measureText(handleTexto).width;
    const larguraBlocoRodape = diametroLogoRodape + 18 + larguraHandle;
    const inicioBlocoRodape = (LARGURA - larguraBlocoRodape) / 2;
    const centroCirculoRodape = inicioBlocoRodape + diametroLogoRodape / 2;

    ctx.fillStyle = CORES.branco;
    ctx.beginPath();
    ctx.arc(centroCirculoRodape, rodapeY, diametroLogoRodape / 2, 0, Math.PI * 2);
    ctx.fill();

    if (logo) {
        const tamanhoLogoRodape = 32;
        ctx.drawImage(
            logo,
            centroCirculoRodape - tamanhoLogoRodape / 2,
            rodapeY - tamanhoLogoRodape / 2,
            tamanhoLogoRodape,
            tamanhoLogoRodape
        );
    }

    ctx.textAlign = 'left';
    ctx.fillStyle = CORES.branco;
    ctx.fillText(handleTexto, inicioBlocoRodape + diametroLogoRodape + 18, rodapeY + 11);

    ctx.textAlign = 'center';
    ctx.font = '500 24px Inter, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.fillText('Faça o seu teste de orientação vocacional grátis', LARGURA / 2, rodapeY + 46);
}

// Etiqueta (pílula translúcida) acima do conteúdo principal. Devolve o y logo
// abaixo dela, pra quem desenhar em seguida saber onde começar.
function desenharEtiqueta(ctx, y, texto) {
    ctx.textAlign = 'center';
    const etiqueta = (texto || 'Resultado do teste').toUpperCase();
    ctx.font = '700 25px Inter, sans-serif';
    const largura = ctx.measureText(etiqueta).width + 60;
    ctx.fillStyle = 'rgba(255,255,255,0.16)';
    desenharRetanguloArredondado(ctx, (LARGURA - largura) / 2, y, largura, 50, 25);
    ctx.fill();
    ctx.fillStyle = CORES.branco;
    ctx.fillText(etiqueta, LARGURA / 2, y + 33);
    return y + 50;
}

// Título branco centralizado, com tamanho que se ajusta pra nunca estourar
// (reduz a fonte até caber no máximo de linhas). Devolve o y final.
function desenharTitulo(ctx, y, texto, opcoes = {}) {
    const larguraMax = opcoes.larguraMax ?? (LARGURA - 160);
    const maxLinhas = opcoes.maxLinhas ?? 2;
    const tamanhoMinimo = opcoes.tamanhoMinimo ?? 38;
    let tamanho = opcoes.tamanhoInicial ?? 72;
    let linhas;

    do {
        ctx.font = `700 ${tamanho}px Sora, sans-serif`;
        linhas = quebrarLinhas(ctx, texto, larguraMax);
        tamanho -= 4;
    } while (linhas.length > maxLinhas && tamanho > tamanhoMinimo);
    tamanho += 4;

    ctx.font = `700 ${tamanho}px Sora, sans-serif`;
    ctx.fillStyle = CORES.branco;
    ctx.textAlign = 'center';

    let yAtual = y;
    linhas.forEach((linha) => {
        ctx.fillText(linha, LARGURA / 2, yAtual);
        yAtual += tamanho + 14;
    });

    return yAtual;
}

// Cartão translúcido e compacto com a frase motivacional. Devolve o y final.
function desenharFraseCard(ctx, y, frase) {
    const larguraMaxFrase = LARGURA - 280;
    ctx.font = '500 28px Inter, sans-serif';
    const linhasFrase = quebrarLinhas(ctx, frase, larguraMaxFrase).slice(0, 2);
    const alturaLinhaFrase = 36;
    const alturaCardFrase = linhasFrase.length * alturaLinhaFrase + 36;

    ctx.fillStyle = 'rgba(255,255,255,0.14)';
    desenharRetanguloArredondado(ctx, 110, y, LARGURA - 220, alturaCardFrase, 24);
    ctx.fill();

    ctx.fillStyle = CORES.branco;
    ctx.textAlign = 'center';
    let yFrase = y + 36;
    linhasFrase.forEach((linha) => {
        ctx.fillText(linha, LARGURA / 2, yFrase);
        yFrase += alturaLinhaFrase;
    });

    return y + alturaCardFrase;
}

// Uma linha da lista de cursos: cartão branco com o nome do curso e, embaixo,
// uma pílula com o rótulo (ex. "57% · Interpessoal" ou o nome de uma área).
// Devolve o y final (base do cartão). `opcoes` deixa a versão usada na imagem
// combinada mais compacta que a da imagem só de cursos, sem duplicar a função.
function desenharLinhaCurso(ctx, y, item, opcoes = {}) {
    const x = 80;
    const largura = LARGURA - 160;
    const padX = opcoes.padX ?? 40;
    const padTopo = opcoes.padTopo ?? 32;
    const tamanhoMax = opcoes.tamanhoInicial ?? 36;
    const tamanhoMin = opcoes.tamanhoMinimo ?? 24;
    const fonteRotulo = opcoes.fonteRotulo ?? 22;
    const alturaPilula = opcoes.alturaPilula ?? 36;

    let tamanhoNome = tamanhoMax;
    let linhasNome;
    do {
        ctx.font = `700 ${tamanhoNome}px Sora, sans-serif`;
        linhasNome = quebrarLinhas(ctx, item.nome, largura - padX * 2);
        tamanhoNome -= 3;
    } while (linhasNome.length > 2 && tamanhoNome > tamanhoMin);
    tamanhoNome += 3;
    linhasNome = linhasNome.slice(0, 2);

    ctx.font = `700 ${tamanhoNome}px Sora, sans-serif`;
    const alturaLinhaNome = tamanhoNome + 12;
    const alturaRotulo = item.rotulo ? alturaPilula + 14 : 8;
    const alturaCard = padTopo + linhasNome.length * alturaLinhaNome + alturaRotulo;

    ctx.fillStyle = CORES.branco;
    desenharRetanguloArredondado(ctx, x, y, largura, alturaCard, 22);
    ctx.fill();

    ctx.textAlign = 'left';
    ctx.fillStyle = CORES.azulEscuro;
    ctx.font = `700 ${tamanhoNome}px Sora, sans-serif`;
    let yTexto = y + padTopo + tamanhoNome * 0.76;
    linhasNome.forEach((linha) => {
        ctx.fillText(linha, x + padX, yTexto);
        yTexto += alturaLinhaNome;
    });

    if (item.rotulo) {
        const rotulo = item.rotulo.toUpperCase();
        ctx.font = `700 ${fonteRotulo}px Inter, sans-serif`;
        const larguraRotulo = ctx.measureText(rotulo).width + 28;
        const yPilula = yTexto - alturaLinhaNome + 12;
        ctx.fillStyle = CORES.azulSuave;
        desenharRetanguloArredondado(ctx, x + padX, yPilula, larguraRotulo, alturaPilula, alturaPilula / 2);
        ctx.fill();
        ctx.fillStyle = CORES.azulEscuro;
        ctx.fillText(rotulo, x + padX + 14, yPilula + alturaPilula * 0.67);
    }

    return y + alturaCard;
}

// Opções compactas da lista de cursos, usadas só na imagem Completa (ali ela
// divide espaço com título/número/frase). Na imagem só de cursos, cada linha
// usa o tamanho padrão de desenharLinhaCurso (tem a tela só pra ela).
const CURSOS_COMPACTO = { padTopo: 26, tamanhoInicial: 32, tamanhoMinimo: 20, fonteRotulo: 19, alturaPilula: 32 };

// ------------------------------------------------------------------
// Blocos de conteúdo (título+número+frase / lista de cursos), reaproveitados
// tanto pra medir a altura quanto pra desenhar de verdade.
// ------------------------------------------------------------------

function desenharBlocoPerfil(ctx, y, { titulo, numero, numeroLabel, frase }) {
    let yAtual = desenharTitulo(ctx, y, titulo) + 28;

    if (numero) {
        ctx.textAlign = 'center';
        ctx.font = '700 108px Sora, sans-serif';
        ctx.fillStyle = CORES.branco;
        ctx.fillText(numero, LARGURA / 2, yAtual + 86);
        yAtual += 86 + 26;

        if (numeroLabel) {
            ctx.font = '600 27px Inter, sans-serif';
            ctx.fillStyle = 'rgba(255,255,255,0.85)';
            ctx.fillText(numeroLabel, LARGURA / 2, yAtual);
            yAtual += 46;
        }
    }

    if (frase) {
        yAtual = desenharFraseCard(ctx, yAtual + 8, frase);
    }

    return yAtual;
}

function desenharBlocoCursos(ctx, y, cursos, opcoesLinha = {}) {
    ctx.textAlign = 'center';
    ctx.font = '700 25px Inter, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.fillText('CURSOS QUE MAIS COMBINAM COM VOCÊ', LARGURA / 2, y + 18);
    let yAtual = y + 54;

    cursos.slice(0, 3).forEach((item) => {
        yAtual = desenharLinhaCurso(ctx, yAtual, item, opcoesLinha) + 20;
    });

    return yAtual;
}

// ------------------------------------------------------------------
// As 3 imagens do carrossel
// ------------------------------------------------------------------

// Imagem 1 · Porcentagem: categoria/área forte + número (% de afinidade,
// quando há) + frase motivacional + marca. Sem cursos.
export async function desenharArtePerfil({ etiquetaTopo, titulo, numero, numeroLabel, frase }) {
    const { canvas, ctx, logo } = await prepararContexto();
    desenharFundoBase(ctx);
    desenharLogoTopo(ctx, logo);
    const topoConteudo = desenharEtiqueta(ctx, ETIQUETA_Y, etiquetaTopo) + GAP_APOS_CABECALHO;
    const baseConteudo = limiteInferiorConteudo();

    const dadosBloco = { titulo, numero, numeroLabel, frase };
    const alturaBloco = medirAltura((ctxM, yM) => desenharBlocoPerfil(ctxM, yM, dadosBloco));
    const yInicial = centralizarY(topoConteudo, baseConteudo, alturaBloco);
    desenharBlocoPerfil(ctx, yInicial, dadosBloco);

    desenharRodape(ctx, logo);
    return canvas;
}

// Imagem 2 · Cursos recomendados: só a lista de até 3 cursos, cada um com o
// rótulo (porcentagem de afinidade + inteligência, ou a área do Vocacional).
// Sem título/número/frase de perfil.
export async function desenharArteListaCursos({ etiquetaTopo, cursos }) {
    const { canvas, ctx, logo } = await prepararContexto();
    desenharFundoBase(ctx);
    desenharLogoTopo(ctx, logo);
    const topoConteudo = desenharEtiqueta(ctx, ETIQUETA_Y, etiquetaTopo) + GAP_APOS_CABECALHO;
    const baseConteudo = limiteInferiorConteudo();

    const alturaBloco = medirAltura((ctxM, yM) => desenharBlocoCursos(ctxM, yM, cursos));
    const yInicial = centralizarY(topoConteudo, baseConteudo, alturaBloco);
    desenharBlocoCursos(ctx, yInicial, cursos);

    desenharRodape(ctx, logo);
    return canvas;
}

// Imagem 3 · Completa: tudo da imagem 1 + a lista de cursos da imagem 2,
// juntos na mesma arte.
export async function desenharArteResultado({ etiquetaTopo, titulo, numero, numeroLabel, frase, cursos }) {
    const { canvas, ctx, logo } = await prepararContexto();
    desenharFundoBase(ctx);
    desenharLogoTopo(ctx, logo);
    const topoConteudo = desenharEtiqueta(ctx, ETIQUETA_Y, etiquetaTopo) + GAP_APOS_CABECALHO;
    const baseConteudo = limiteInferiorConteudo();

    const temCursos = cursos?.length > 0;
    const desenharTudo = (ctxX, yX) => {
        let yAtual = desenharBlocoPerfil(ctxX, yX, { titulo, numero, numeroLabel, frase });
        if (temCursos) {
            yAtual = desenharBlocoCursos(ctxX, yAtual + 20, cursos, CURSOS_COMPACTO);
        }
        return yAtual;
    };

    const alturaBloco = medirAltura(desenharTudo);
    const yInicial = centralizarY(topoConteudo, baseConteudo, alturaBloco);
    desenharTudo(ctx, yInicial);

    desenharRodape(ctx, logo);
    return canvas;
}

// ------------------------------------------------------------------
// Legenda sugerida (um texto só, vale pras imagens que forem compartilhadas)
// ------------------------------------------------------------------

function montarLegenda({ titulo, numero, numeroLabel, frase, cursoNome }) {
    const linhas = [];

    if (frase) linhas.push(frase);
    linhas.push('');

    if (numero) {
        linhas.push(
            `Fiz o teste no @futuroplus_ e meu resultado foi ${titulo} (${numero}${numeroLabel ? ' ' + numeroLabel : ''}).`
        );
    } else {
        linhas.push(`Fiz o teste no @futuroplus_ e descobri: ${titulo}.`);
    }

    if (cursoNome) {
        linhas.push(`Curso que mais combina comigo: ${cursoNome}.`);
    }

    linhas.push('Faça o seu também 👉 @futuroplus_');

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

// ------------------------------------------------------------------
// Componente de UI: botão → carrossel com seleção → compartilhar/baixar + legenda
// ------------------------------------------------------------------

// dados = { etiquetaTopo, titulo, numero, numeroLabel, frase, cursos }
// opcoes = { nomeArquivoBase }
export function criarPainelCompartilhar(dados, opcoes = {}) {
    const nomeArquivoBase = opcoes.nomeArquivoBase || 'futuroplus-resultado';
    const temCursos = dados.cursos?.length > 0;

    const legenda = montarLegenda({
        titulo: dados.titulo,
        numero: dados.numero,
        numeroLabel: dados.numeroLabel,
        frase: dados.frase,
        cursoNome: dados.cursos?.[0]?.nome || null
    });

    // cada entrada vira uma imagem no carrossel, na ordem em que aparecem aqui
    const imagens = [
        { rotulo: 'Porcentagem', nomeArquivo: `${nomeArquivoBase}-porcentagem.png`, desenhar: () => desenharArtePerfil(dados) }
    ];
    if (temCursos) {
        imagens.push({
            rotulo: 'Cursos recomendados',
            nomeArquivo: `${nomeArquivoBase}-cursos.png`,
            desenhar: () => desenharArteListaCursos({ etiquetaTopo: dados.etiquetaTopo, cursos: dados.cursos })
        });
        imagens.push({
            rotulo: 'Completa',
            nomeArquivo: `${nomeArquivoBase}-completa.png`,
            desenhar: () => desenharArteResultado(dados)
        });
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
            <div class="compartilhar-carrossel-scroll"></div>
            <button type="button" class="btn-confirmar-compartilhar">
                ${ICONE_COMPARTILHAR}
                <span>Compartilhar selecionadas</span>
            </button>
        </div>
        <div class="compartilhar-resultado-legenda" hidden>
            <label for="compartilhar-legenda-texto">Legenda sugerida para a postagem</label>
            <textarea id="compartilhar-legenda-texto" class="compartilhar-legenda-texto" readonly rows="4"></textarea>
            <button type="button" class="btn-copiar-legenda">
                ${ICONE_COPIAR}
                <span>Copiar legenda</span>
            </button>
        </div>
    `;

    const botaoPrincipal = painel.querySelector('.btn-compartilhar-resultado');
    const status = painel.querySelector('.compartilhar-resultado-status');
    const blocoCarrossel = painel.querySelector('.compartilhar-resultado-carrossel');
    const scrollCarrossel = painel.querySelector('.compartilhar-carrossel-scroll');
    const botaoConfirmar = painel.querySelector('.btn-confirmar-compartilhar');
    const blocoLegenda = painel.querySelector('.compartilhar-resultado-legenda');
    const campoLegenda = painel.querySelector('.compartilhar-legenda-texto');
    const botaoCopiar = painel.querySelector('.btn-copiar-legenda');
    const textoBotaoCopiar = botaoCopiar.innerHTML;

    campoLegenda.value = legenda;

    // preenchido depois de gerar as imagens: { canvas, nomeArquivo, checkbox }
    let itensGerados = [];

    botaoPrincipal.addEventListener('click', async () => {
        botaoPrincipal.disabled = true;
        status.textContent = 'Gerando imagens...';

        try {
            const canvases = await Promise.all(imagens.map((img) => img.desenhar()));

            scrollCarrossel.innerHTML = '';
            itensGerados = canvases.map((canvas, indice) => {
                const id = `compartilhar-item-${Math.random().toString(36).slice(2)}-${indice}`;
                const label = document.createElement('label');
                label.className = 'compartilhar-carrossel-item';
                label.innerHTML = `
                    <input type="checkbox" class="compartilhar-carrossel-checkbox" id="${id}" checked>
                    <span class="compartilhar-carrossel-marca" aria-hidden="true"></span>
                    <span class="compartilhar-carrossel-thumb-wrap">
                        <img alt="Prévia: ${imagens[indice].rotulo}">
                    </span>
                    <span class="compartilhar-carrossel-rotulo">${imagens[indice].rotulo}</span>
                `;
                label.querySelector('img').src = canvas.toDataURL('image/png');
                scrollCarrossel.appendChild(label);

                return {
                    canvas,
                    nomeArquivo: imagens[indice].nomeArquivo,
                    checkbox: label.querySelector('.compartilhar-carrossel-checkbox')
                };
            });

            blocoCarrossel.hidden = false;
            blocoLegenda.hidden = false;
            botaoPrincipal.hidden = true;
            status.textContent = 'Escolha quais imagens quer compartilhar (todas marcadas por padrão).';
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
            const arquivos = [];
            for (const item of selecionados) {
                const blob = await canvasParaBlob(item.canvas);
                if (!blob) throw new Error('canvas.toBlob não devolveu nada');
                arquivos.push(new File([blob], item.nomeArquivo, { type: 'image/png' }));
            }

            const podeCompartilharArquivos =
                typeof navigator.canShare === 'function' && navigator.canShare({ files: arquivos });

            if (podeCompartilharArquivos) {
                try {
                    await navigator.share({ files: arquivos, text: legenda, title: 'Futuro+' });
                    status.textContent = 'Compartilhado! A legenda sugerida continua aqui embaixo, se quiser ajustar.';
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
            status.textContent = arquivos.length > 1
                ? 'Imagens baixadas! Copie a legenda abaixo e poste nos stories.'
                : 'Imagem baixada! Copie a legenda abaixo e poste nos stories.';
        } catch (erro) {
            console.error('Erro ao compartilhar/baixar as imagens:', erro);
            status.textContent = 'Não consegui preparar as imagens agora. Tente de novo em instantes.';
        } finally {
            botaoConfirmar.disabled = false;
        }
    });

    botaoCopiar.addEventListener('click', async () => {
        try {
            await navigator.clipboard.writeText(campoLegenda.value);
        } catch {
            campoLegenda.removeAttribute('readonly');
            campoLegenda.select();
            document.execCommand('copy');
            campoLegenda.setAttribute('readonly', '');
        }

        botaoCopiar.innerHTML = '<span>Copiado!</span>';
        setTimeout(() => {
            botaoCopiar.innerHTML = textoBotaoCopiar;
        }, 1800);
    });

    return painel;
}
