// A tela do Perfil no modo visualização: a capa, as formações, o "sobre
// mim", o mini mural, os testes, as conquistas, as instituições e a linha
// das notificações. Aqui só há montagem de HTML a partir dos dados da conta
// (nada de Firebase), para dar para testar com dados de exemplo.

import { escapeHtml, logoPadraoPorTipo, paginaDaUnidade } from './card-unidade.js';
import { categoriasTeste } from './categorias-teste.js';
import { ITENS_DO_PERFIL } from './perfil-completude.js';
import { resumoDaDemanda } from './demanda-curso.js';

const ESCOLARIDADES = {
    fundamental: 'Ensino fundamental',
    medio_cursando: 'Cursando o ensino médio',
    medio_concluido: 'Ensino médio completo',
    tecnico_cursando: 'Cursando um curso técnico',
    tecnico_concluido: 'Curso técnico completo',
    superior_cursando: 'Cursando o ensino superior',
    superior_concluido: 'Ensino superior completo'
};

// Ícones 3D e do menu: o endereço passa pelo Vite para existir no site
// publicado (no dist os arquivos ganham outro nome).
const ICONES_3D = {
    perfil: new URL('../icones/3d/perfil.webp', import.meta.url).href,
    testes: new URL('../icones/3d/testes.webp', import.meta.url).href,
    mural: new URL('../icones/3d/mural.webp', import.meta.url).href,
    cursos: new URL('../icones/3d/cursos.webp', import.meta.url).href,
    instituicoes: new URL('../icones/3d/instituicoes.webp', import.meta.url).href,
    conquistas: new URL('../icones/3d/conquistas.webp', import.meta.url).href
};

const ICONES_MENU = {
    perfil: new URL('../icones/menu/perfil.svg', import.meta.url).href,
    testes: new URL('../icones/menu/testes.svg', import.meta.url).href,
    mural: new URL('../icones/menu/mural.svg', import.meta.url).href,
    cursos: new URL('../icones/menu/cursos.svg', import.meta.url).href,
    instituicoes: new URL('../icones/menu/instituicoes.svg', import.meta.url).href
};

// ícones de traço, no mesmo padrão do curso-detalhe.js (24 × 24, traço 2)
const TRACOS = {
    capelo: '<path d="M22 10 12 5 2 10l10 5 10-5z"/><path d="M6 12.5V17c3 2.6 9 2.6 12 0v-4.5"/>',
    local: '<path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/>',
    lapis: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    predio: '<path d="M3 21h18"/><path d="M5 21V10l7-5 7 5v11"/><path d="M9 21v-6h6v6"/>',
    balao: '<path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
    sino: '<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>',
    seta: '<path d="M5 12h14"/><path d="m13 6 6 6-6 6"/>',
    alta: '<path d="m3 17 6-6 4 4 8-8"/><path d="M15 7h6v6"/>',
    cadeado: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
    mais: '<path d="M12 5v14"/><path d="M5 12h14"/>'
};

const icone = (nome) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
    stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${TRACOS[nome]}</svg>`;

const iconeMenu = (nome) => `<img class="perfil-titulo-icone" src="${ICONES_MENU[nome]}" alt="">`;

const soVoce = (visibilidade, campo) => (visibilidade?.[campo] === false
    ? ' <span class="perfil-so-voce">só você vê</span>' : '');

const plural = (quantos, um, varios) => (quantos === 1 ? um : varios);

// "a, b e c"
const emLista = (itens) => (itens.length > 1
    ? `${itens.slice(0, -1).join(', ')} e ${itens.at(-1)}` : (itens[0] || ''));

// ------------------------------------------------------------------
// Dos dados da conta para o que a tela mostra
// ------------------------------------------------------------------

function linhaDeFormacao(perfil) {
    const escolaridade = ESCOLARIDADES[perfil.escolaridade] || '';
    const curso = perfil.visibilidade?.formacao === false ? '' : (perfil.formacao || '');

    if (perfil.semFormacao && escolaridade) return escolaridade;
    if (curso && escolaridade) return `${curso} · ${escolaridade}`;
    return curso || escolaridade;
}

// Formação = certificado de um curso do catálogo, com o nome conferido.
// Certificado de palestra ou evento fica só no mural.
export function formacoesDosCertificados(certificados) {
    return certificados
        .filter((certificado) => certificado.cursoId && certificado.verificacao?.nomeConfere)
        .map((certificado) => ({
            ano: certificado.anoConclusao || null,
            tipo: certificado.tipoFormacao || 'Formação',
            curso: certificado.titulo,
            cursoId: certificado.cursoId,
            instituicao: certificado.instituicao || '',
            unidadeId: certificado.unidadeId || ''
        }))
        .sort((a, b) => (b.ano || 0) - (a.ano || 0));
}

const tipoDaInstituicao = (nome) => (/^\s*fatec\b/i.test(nome) ? 'Fatec' : (/^\s*etec\b/i.test(nome) ? 'Etec' : ''));

// As escolas onde a pessoa se formou, uma vez cada. meusComentariosPorUnidade
// ({ unidadeId: comentario }) é o que a pessoa já comentou lá, para mostrar
// no card em vez do botão de comentar.
function instituicoesDasFormacoes(formacoes, meusComentariosPorUnidade = {}) {
    const mapa = new Map();
    formacoes.filter((formacao) => formacao.instituicao).forEach((formacao) => {
        const chave = formacao.unidadeId || formacao.instituicao.toLowerCase();
        const atual = mapa.get(chave) || {
            nome: formacao.instituicao, unidadeId: formacao.unidadeId, tipo: tipoDaInstituicao(formacao.instituicao), formacoes: 0,
            comentario: meusComentariosPorUnidade[formacao.unidadeId] || null
        };
        atual.formacoes += 1;
        mapa.set(chave, atual);
    });
    return [...mapa.values()];
}

// O que sugerir agora, em ordem. Cada passo é um link (href) ou abre o
// Editar já no campo certo (editar = id do campo). itens: os rótulos de
// ITENS_DO_PERFIL que o passo resolve.
function passosQueFaltam({ faltando, temTeste, perfil, certificados }) {
    const falta = (rotulo) => faltando.some((item) => item.rotulo === rotulo);
    const passos = [];

    if (!temTeste) {
        passos.push({
            icone: 'testes', titulo: 'Faça o teste rápido de perfil', curto: 'Fazer um teste',
            texto: 'Descubra as áreas que mais combinam com você. O resultado aparece aqui no perfil.',
            botao: 'Fazer um teste', href: 'testes.html', itens: ['fazer um teste']
        });
    }
    if (!perfil.cursoDesejado) {
        passos.push({
            icone: 'cursos', titulo: 'Escolha o curso que você quer seguir', curto: 'Escolher o curso que quero seguir',
            texto: 'Com o curso escolhido, o perfil mostra a procura por ele no vestibular.',
            botao: 'Escolher curso', editar: 'perfil-curso-desejado', itens: ['o curso que você quer']
        });
    }
    if (!certificados.length) {
        passos.push({
            icone: 'mural', titulo: 'Pendure seu primeiro certificado', curto: 'Pendurar o primeiro certificado',
            texto: 'Certificado de curso técnico ou superior vira formação aqui no perfil.',
            botao: 'Ir para o Mural', href: 'mural.html'
        });
    }
    if (falta('seu objetivo')) {
        passos.push({
            icone: 'perfil', titulo: 'Escreva seu objetivo', curto: 'Escrever meu objetivo',
            texto: 'Uma frase sobre onde você quer chegar.',
            botao: 'Escrever objetivo', editar: 'perfil-objetivo', itens: ['seu objetivo']
        });
    }

    const resto = faltando.filter((item) => !['seu objetivo', 'o curso que você quer', 'fazer um teste'].includes(item.rotulo));
    if (resto.length) {
        passos.push({
            icone: 'perfil', titulo: 'Complete seu perfil', curto: 'Completar meu perfil',
            texto: `Falta ${emLista(resto.map((item) => item.rotulo))}.`,
            botao: 'Editar perfil', editar: '', itens: resto.map((item) => item.rotulo)
        });
    }

    // só falta uma coisa: o passo que resolve ela diz isso
    if (faltando.length === 1) {
        const ultimo = passos.find((passo) => passo.itens?.includes(faltando[0].rotulo));
        if (ultimo) ultimo.texto += ' É o que falta para o perfil chegar a 100%.';
    }

    if (!passos.length) {
        passos.push({
            icone: 'conquistas', titulo: 'Tudo em dia por aqui', curto: '',
            texto: 'Com tudo preenchido, as sugestões de curso e de unidade ficam mais perto do que você quer.',
            botao: 'Ver cursos', href: 'cursos.html'
        });
    }
    return passos;
}

// dados: { nome, email, cadastro, perfil, resultados: { gardner, vocacional },
//          certificados, cursoDesejado: { id, nome, nivel, demanda } | null, push }
export function montarConta(dados) {
    const { cadastro = {}, perfil = {}, resultados = {}, certificados = [] } = dados;
    const temTeste = Boolean(resultados.gardner || resultados.vocacional);

    const faltando = ITENS_DO_PERFIL.filter((item) => !item.completo({ perfil, cadastro, temTeste }));
    const progresso = Math.round(((ITENS_DO_PERFIL.length - faltando.length) / ITENS_DO_PERFIL.length) * 100);

    const nome = (dados.nome || '').trim();
    const iniciais = (nome || dados.email || '?').trim().split(/\s+/).slice(0, 2)
        .map((parte) => parte[0].toUpperCase()).join('');

    const formacoes = formacoesDosCertificados(certificados);
    const noMural = certificados.filter((certificado) => certificado.url);
    const passos = passosQueFaltam({ faltando, temTeste, perfil, certificados });

    const gardner = resultados.gardner;
    const demanda = dados.cursoDesejado ? resumoDaDemanda(dados.cursoDesejado.demanda) : null;

    return {
        nome: nome || 'Seu perfil',
        iniciais,
        formacaoLinha: linhaDeFormacao(perfil),
        local: [cadastro.cidade, cadastro.estado].filter(Boolean).join(' · '),
        visibilidade: perfil.visibilidade || {},
        objetivo: perfil.objetivo || '',
        progresso,
        falta: !faltando.length
            ? 'Tudo preenchido.'
            : faltando.length === 1
                ? `Falta ${faltando[0].rotulo}.`
                : `Faltam ${faltando.length} itens: ${emLista(faltando.map((item) => item.rotulo))}.`,
        passo: passos[0],
        depois: passos.slice(1, 3),
        formacoes,
        certificados: noMural,
        areas: perfil.modalidades || [],
        estilos: perfil.estilos || [],
        cursoDesejado: perfil.cursoDesejado ? {
            nome: dados.cursoDesejado?.nome || perfil.cursoDesejado,
            id: dados.cursoDesejado?.id || '',
            tipo: dados.cursoDesejado
                ? (dados.cursoDesejado.nivel === 'superior' ? 'Superior de Tecnologia · Fatec' : 'Curso técnico · Etec') : '',
            demanda: demanda ? { porVaga: demanda.porVagaTexto, rotulo: demanda.nivel.rotulo, chave: demanda.nivel.chave } : null
        } : null,
        testeRapido: gardner ? {
            principal: categoriasTeste[gardner.categoriaPrincipal] || gardner.categoriaPrincipal,
            podio: (gardner.ranking || []).slice(0, 3)
                .map((chave) => [categoriasTeste[chave] || chave, Math.round(Number(gardner.porcentagens?.[chave]) || 0)])
        } : null,
        testeVocacional: resultados.vocacional ? {
            areas: (resultados.vocacional.eixosFortes || []).slice(0, 2).join(' · '),
            cursos: (resultados.vocacional.cursos || []).slice(0, 3)
        } : null,
        testesFeitos: (gardner ? 1 : 0) + (resultados.vocacional ? 1 : 0),
        conquistas: [
            {
                icone: 'perfil', nome: 'Perfil completo', feita: !faltando.length,
                estado: `${plural(faltando.length, 'Falta', 'Faltam')} ${faltando.length} ${plural(faltando.length, 'item', 'itens')}`
            },
            { icone: 'testes', nome: 'Teste vocacional feito', feita: Boolean(resultados.vocacional), estado: 'Ainda não' },
            { icone: 'mural', nome: 'Primeiro certificado', feita: noMural.length > 0, estado: 'Ainda não' },
            {
                icone: 'instituicoes', nome: 'Formação no Centro Paula Souza',
                feita: formacoes.some((formacao) => formacao.unidadeId || tipoDaInstituicao(formacao.instituicao)),
                estado: 'Ainda não'
            }
        ],
        instituicoes: instituicoesDasFormacoes(formacoes, dados.meusComentariosPorUnidade || {}),
        push: dados.push || { texto: '', podeAtivar: false }
    };
}

// ------------------------------------------------------------------
// Cada pedaço da tela
// ------------------------------------------------------------------

// Um passo vira link ou botão que abre o Editar no campo certo.
function acaoDoPasso(passo, classes, conteudo) {
    return passo.href
        ? `<a class="${classes}" href="${escapeHtml(passo.href)}">${conteudo}</a>`
        : `<button type="button" class="${classes}" data-editar="${escapeHtml(passo.editar)}">${conteudo}</button>`;
}

function capa(c) {
    const numeros = [
        [c.formacoes.length, plural(c.formacoes.length, 'Formação', 'Formações'), '#formacoes'],
        [c.certificados.length, plural(c.certificados.length, 'Certificado', 'Certificados'), '#mural'],
        [c.testesFeitos, plural(c.testesFeitos, 'Teste feito', 'Testes feitos'), '#perfil-cartao-testes']
    ];
    const temNumeros = numeros.some(([valor]) => valor > 0);

    const blocoDeNumeros = temNumeros ? `
        <ul class="perfil-numeros">
            ${numeros.map(([valor, rotulo, destino]) => `
            <li><a class="perfil-numero" href="${destino}"><strong>${valor}</strong><span>${rotulo}</span></a></li>`).join('')}
        </ul>` : (c.depois.length ? `
        <ul class="perfil-numeros perfil-numeros--passos" aria-label="Depois disso">
            ${c.depois.map((passo) => `
            <li>${acaoDoPasso(passo, 'perfil-numero perfil-numero--passo',
                `<span class="perfil-rotulo">Depois</span><strong>${escapeHtml(passo.curto)}</strong>`)}</li>`).join('')}
        </ul>` : '');

    return `
    <section class="perfil-cartao perfil-capa" aria-labelledby="perfil-nome-titulo">
        <div class="perfil-capa-identidade">
            <div class="perfil-avatar perfil-avatar--grande" aria-hidden="true">${escapeHtml(c.iniciais)}</div>
            <div class="perfil-capa-texto">
                <h2 id="perfil-nome-titulo">${escapeHtml(c.nome)}</h2>
                ${c.formacaoLinha ? `<p class="perfil-capa-linha perfil-capa-linha--forte">${icone('capelo')}<span>${escapeHtml(c.formacaoLinha)}</span></p>` : ''}
                ${c.local ? `<p class="perfil-capa-linha">${icone('local')}<span>${escapeHtml(c.local)}</span></p>` : ''}
            </div>
            <!-- o tour guiado aponta para #btn-editar-perfil -->
            <button type="button" id="btn-editar-perfil" class="btn-perfil btn-perfil--pequeno btn-perfil--icone perfil-capa-editar">
                ${icone('lapis')}Editar perfil
            </button>
        </div>

        <div class="perfil-capa-objetivo ${c.objetivo ? '' : 'perfil-capa-objetivo--vazio'}">
            <span class="perfil-rotulo">Objetivo${soVoce(c.visibilidade, 'objetivo')}</span>
            <p class="perfil-objetivo-texto ${c.objetivo ? '' : 'perfil-vazio'}">
                ${escapeHtml(c.objetivo || 'Conte em poucas palavras onde você quer chegar.')}</p>
        </div>

        ${blocoDeNumeros}

        <div class="perfil-passo">
            <div>
                <div class="perfil-medidor-topo">
                    <span id="perfil-medidor-rotulo">Perfil completo</span>
                    <strong>${c.progresso}%</strong>
                </div>
                <div class="perfil-medidor" role="progressbar" aria-labelledby="perfil-medidor-rotulo"
                    aria-valuemin="0" aria-valuemax="100" aria-valuenow="${c.progresso}">
                    <div class="perfil-medidor-fill" style="width:${c.progresso}%"></div>
                </div>
                <p class="perfil-medidor-falta">${escapeHtml(c.falta)}</p>
            </div>

            <div class="perfil-passo-acao">
                <img src="${ICONES_3D[c.passo.icone]}" alt="" width="46" height="46">
                <div>
                    <span class="perfil-rotulo">${c.progresso === 100 && !c.depois.length && c.passo.icone === 'conquistas' ? 'Parabéns' : 'Próximo passo'}</span>
                    <strong>${escapeHtml(c.passo.titulo)}</strong>
                    <p>${escapeHtml(c.passo.texto)}</p>
                </div>
                <div class="perfil-passo-botoes">
                    ${acaoDoPasso(c.passo, 'btn-perfil btn-perfil--pequeno btn-perfil--icone', `${escapeHtml(c.passo.botao)}${icone('seta')}`)}
                </div>
            </div>
        </div>
    </section>`;
}

function formacoes(c) {
    const lista = c.formacoes.length ? `
        <ol class="formacoes-lista">
            ${c.formacoes.map((f) => `
            <li class="formacao">
                <span class="formacao-ano" aria-hidden="true">${f.ano || icone('capelo')}</span>
                <div class="formacao-corpo">
                    <span class="perfil-rotulo">${escapeHtml(f.tipo)}</span>
                    <a class="formacao-curso" href="curso.html?c=${encodeURIComponent(f.cursoId)}">${escapeHtml(f.curso)}</a>
                    <div class="formacao-meta">
                        ${f.instituicao
                            ? (f.unidadeId
                                ? `<a class="formacao-inst" href="${escapeHtml(paginaDaUnidade(f.unidadeId))}">${icone('predio')}${escapeHtml(f.instituicao)}</a>`
                                : `<span class="formacao-inst">${icone('predio')}${escapeHtml(f.instituicao)}</span>`)
                            : ''}
                        ${f.ano ? `<span>Conclusão em ${f.ano}</span>` : ''}
                        <span class="selo-conferido">${icone('check')}Certificado conferido</span>
                    </div>
                </div>
            </li>`).join('')}
        </ol>
        <div class="perfil-cartao-rodape">
            <a class="perfil-link" href="mural.html">Pendurar outro certificado${icone('seta')}</a>
        </div>` : `
        <div class="perfil-vazio-bloco">
            <img src="${ICONES_3D.mural}" alt="" width="64" height="64">
            <p><strong>Nenhuma formação por aqui ainda</strong>
                Pendure no mural o certificado de um curso técnico ou superior e sua formação aparece aqui.</p>
            <a class="btn-mural" href="mural.html">Ir para o Mural</a>
        </div>`;

    return `
    <section class="perfil-cartao perfil-formacoes" id="formacoes" aria-labelledby="formacoes-titulo">
        <div class="perfil-cartao-topo">
            <h2 id="formacoes-titulo">${iconeMenu('cursos')}Formações</h2>
            ${c.formacoes.length ? '<span class="perfil-contagem">vêm dos certificados conferidos do mural</span>' : ''}
        </div>
        ${lista}
    </section>`;
}

function sobre(c) {
    const tags = (valores, cor, vazio) => (valores.length
        ? valores.map((valor) => `<span class="tag-leitura tag-leitura--${cor}">${escapeHtml(valor)}</span>`).join('')
        : `<span class="perfil-vazio">${vazio}</span>`);

    let curso = `
        <div class="perfil-tags-leitura">
            <span class="perfil-vazio">Escolha o curso que você quer seguir</span>
        </div>
        <a class="perfil-link" href="cursos.html">Ver os cursos${icone('seta')}</a>`;

    if (c.cursoDesejado) {
        const d = c.cursoDesejado;
        const nome = d.id
            ? `<a class="curso-desejado-nome" href="curso.html?c=${encodeURIComponent(d.id)}">${escapeHtml(d.nome)}</a>`
            : `<span class="curso-desejado-nome">${escapeHtml(d.nome)}</span>`;
        curso = `
        <div class="curso-desejado">
            <div class="curso-desejado-texto">
                ${nome}
                ${d.tipo ? `<span class="curso-desejado-tipo">${d.tipo}</span>` : ''}
            </div>
            ${d.demanda ? `
            <div class="curso-desejado-demanda">
                <strong>${d.demanda.porVaga}</strong>
                <span>candidatos por vaga</span>
                <span class="selo-demanda selo-demanda--${d.demanda.chave}">${d.demanda.chave === 'alta' ? icone('alta') : ''}${d.demanda.rotulo}</span>
            </div>` : ''}
        </div>`;
    }

    return `
    <section class="perfil-cartao perfil-sobre" aria-labelledby="sobre-titulo">
        <div class="perfil-cartao-topo">
            <h2 id="sobre-titulo">${iconeMenu('perfil')}Sobre mim</h2>
        </div>

        <div class="perfil-bloco">
            <h3>Áreas de interesse${soVoce(c.visibilidade, 'modalidades')}</h3>
            <div class="perfil-tags-leitura">${tags(c.areas, 'area', 'Escolha os tipos de curso no Editar')}</div>
        </div>

        <div class="perfil-bloco">
            <h3>Curso que quero seguir${soVoce(c.visibilidade, 'cursoDesejado')}</h3>
            ${curso}
        </div>

        <div class="perfil-bloco">
            <h3>Estilo de aprendizado${soVoce(c.visibilidade, 'estilos')}</h3>
            <div class="perfil-tags-leitura">${tags(c.estilos, 'estilo', 'Escolha até 3 no Editar')}</div>
        </div>
    </section>`;
}

function mural(c) {
    const total = c.certificados.length;
    const quadros = total
        ? c.certificados.slice(0, 3).map((certificado) => `
            <li class="mural-mini-quadro"><div class="mural-moldura">
                <img class="cert-arte" src="${escapeHtml(certificado.url)}" alt="${escapeHtml(certificado.titulo || 'Certificado')}"
                    loading="lazy" decoding="async">
            </div></li>`).join('')
        : ['', 'Seu primeiro certificado vai aqui', ''].map((texto) => `
            <li class="mural-mini-quadro mural-mini-quadro--vago"><div class="mural-moldura">
                <div class="mural-vago">${texto ? `${icone('mais')}<span>${texto}</span>` : ''}</div>
            </div></li>`).join('');

    return `
    <section class="mural-mini perfil-mural" id="mural" aria-labelledby="mural-mini-titulo">
        <div class="mural-mini-cabecalho">
            <div>
                <h2 id="mural-mini-titulo">${iconeMenu('mural')}Seu mural</h2>
                <p>${total ? `${total} ${plural(total, 'certificado', 'certificados')} no seu mural`
                    : 'Nenhum certificado ainda. Pendure o primeiro!'}</p>
            </div>
            <a class="btn-mural" href="mural.html">${total ? 'Ver mural completo' : 'Pendurar certificado'}</a>
        </div>
        <div class="mural-mini-parede">
            <span class="mural-mini-pessoa mural-mini-pessoa--esq" aria-hidden="true"></span>
            <ul class="mural-mini-quadros">${quadros}</ul>
            <span class="mural-mini-pessoa mural-mini-pessoa--dir" aria-hidden="true"></span>
        </div>
    </section>`;
}

function testes(c) {
    const temTeste = c.testeRapido || c.testeVocacional;

    const rapido = c.testeRapido ? `
        <div class="perfil-teste-quadro perfil-teste-quadro--rapido">
            <span class="perfil-teste-rotulo">Teste rápido de perfil</span>
            <strong>${escapeHtml(c.testeRapido.principal)}</strong>
            <ol class="perfil-barras" aria-label="Suas três inteligências mais fortes">
                ${c.testeRapido.podio.map(([nome, valor]) => `
                <li class="perfil-barra">
                    <span class="perfil-barra-nome">${escapeHtml(nome)}</span>
                    <span class="perfil-barra-valor">${valor}%</span>
                    <span class="perfil-barra-trilho" aria-hidden="true">
                        <span class="perfil-barra-fill" style="display:block;width:${Math.min(100, valor)}%"></span>
                    </span>
                </li>`).join('')}
            </ol>
        </div>` : '';

    const vocacional = c.testeVocacional ? `
        <div class="perfil-teste-quadro perfil-teste-quadro--vocacional">
            <span class="perfil-teste-rotulo">Teste vocacional</span>
            <strong>${escapeHtml(c.testeVocacional.areas)}</strong>
            <span class="perfil-teste-podio">Cursos que combinam com você</span>
            <div class="perfil-tags-leitura">
                ${c.testeVocacional.cursos.map((curso) => `
                <a class="tag-leitura tag-leitura--curso" href="curso.html?c=${encodeURIComponent(curso.slug)}">${escapeHtml(curso.nome)}</a>`).join('')}
            </div>
        </div>` : '';

    const corpo = temTeste ? `
        <div class="perfil-testes-grade">${rapido}${vocacional}</div>
        <div class="perfil-cartao-rodape">
            <a class="perfil-link" href="testes.html">Ver os resultados completos${icone('seta')}</a>
        </div>` : `
        <div class="perfil-vazio-bloco">
            <img src="${ICONES_3D.testes}" alt="" width="64" height="64">
            <p><strong>Você ainda não fez nenhum teste</strong>
                O resultado aparece aqui e ajuda nas sugestões de curso.</p>
            <a class="btn-perfil btn-perfil--pequeno btn-perfil--icone" href="testes.html">Começar agora${icone('seta')}</a>
        </div>`;

    return `
    <!-- o tour guiado aponta para #perfil-cartao-testes -->
    <section class="perfil-cartao perfil-testes" id="perfil-cartao-testes" aria-labelledby="testes-titulo">
        <div class="perfil-cartao-topo">
            <h2 id="testes-titulo">${iconeMenu('testes')}Meus testes${soVoce(c.visibilidade, 'testes')}</h2>
        </div>
        ${corpo}
    </section>`;
}

function conquistas(c) {
    const feitas = c.conquistas.filter((item) => item.feita).length;
    return `
    <section class="perfil-cartao perfil-conquistas" aria-labelledby="conquistas-titulo">
        <div class="perfil-cartao-topo">
            <h2 id="conquistas-titulo"><img class="perfil-titulo-icone" src="${ICONES_3D.conquistas}" alt="">Conquistas</h2>
            <span class="perfil-contagem">${feitas} de ${c.conquistas.length}</span>
        </div>
        <ul class="conquistas-lista">
            ${c.conquistas.map((item) => `
            <li class="conquista ${item.feita ? '' : 'conquista--falta'}">
                <img src="${ICONES_3D[item.icone]}" alt="" width="50" height="50">
                <strong>${item.nome}</strong>
                <span class="conquista-estado">${item.feita
                    ? `${icone('check')}Conquistada` : `${icone('cadeado')}${item.estado}`}</span>
            </li>`).join('')}
        </ul>
    </section>`;
}

// A página de cada instituição (instituicao.html), com os comentários de
// quem estudou lá. Sem o id da unidade (certificado antigo, escola digitada
// à mão), não há para onde levar e o botão fica "em breve".
export function paginaDaInstituicao(unidadeId) {
    return paginaDaUnidade(unidadeId);
}

const estrelinhas = (nota) => '★'.repeat(nota || 0) + '☆'.repeat(5 - (nota || 0));

function resumoDoComentario(texto, maximo = 140) {
    const limpo = (texto || '').trim();
    return limpo.length > maximo ? `${limpo.slice(0, maximo - 1).trim()}…` : limpo;
}

function instituicoes(c) {
    if (!c.instituicoes.length) return '';
    return `
    <section class="perfil-cartao perfil-instituicoes" aria-labelledby="instituicoes-titulo">
        <div class="perfil-cartao-topo">
            <h2 id="instituicoes-titulo">${iconeMenu('instituicoes')}Minhas instituições</h2>
        </div>
        <ul class="instituicoes-lista">
            ${c.instituicoes.map((unidade) => {
                const destino = paginaDaInstituicao(unidade.unidadeId);
                const sub = `${unidade.formacoes} ${plural(unidade.formacoes, 'formação concluída', 'formações concluídas')}`;
                const rotulo = unidade.comentario ? 'Editar comentário' : `Comentar sobre a ${unidade.tipo || 'instituição'}`;
                return `
            <li class="instituicao">
                <div class="instituicao-topo">
                    <img class="instituicao-logo" src="${logoPadraoPorTipo(unidade.tipo)}" alt="" width="46" height="46">
                    <${destino ? `a href="${escapeHtml(destino)}"` : 'span'} class="instituicao-link">
                        <span class="instituicao-nome">${escapeHtml(unidade.nome)}</span>
                        <span class="instituicao-sub">${sub}</span>
                    </${destino ? 'a' : 'span'}>
                </div>
                ${unidade.comentario ? `
                <blockquote class="instituicao-meu-comentario">
                    ${unidade.comentario.nota ? `<span class="instituicao-comentario-nota" aria-hidden="true">${estrelinhas(unidade.comentario.nota)}</span>` : ''}
                    <p>&ldquo;${escapeHtml(resumoDoComentario(unidade.comentario.texto))}&rdquo;</p>
                </blockquote>` : ''}
                ${destino
                    ? `<a class="btn-perfil btn-perfil--pequeno btn-perfil--icone btn-perfil--suave" href="${escapeHtml(destino)}#quem-estudou">${icone('balao')}${rotulo}</a>`
                    : `<button type="button" class="btn-perfil btn-perfil--pequeno btn-perfil--icone btn-perfil--suave" disabled>${icone('balao')}Comentários em breve</button>`}
            </li>`;
            }).join('')}
        </ul>
        <p class="instituicoes-nota">Só quem tem o certificado conferido da unidade comenta e avalia.</p>
    </section>`;
}

function configuracao(c) {
    return `
    <section class="perfil-cartao perfil-config" id="perfil-cartao-push" aria-label="Notificações do navegador">
        <span class="perfil-config-icone">${icone('sino')}</span>
        <div>
            <strong>Notificações do navegador</strong>
            <p id="push-status-texto">${escapeHtml(c.push.texto)}</p>
        </div>
        <button type="button" id="btn-ativar-push" class="btn-perfil btn-perfil--pequeno btn-perfil--icone btn-perfil--secundario"
            ${c.push.podeAtivar ? '' : 'hidden'}>Ativar notificações</button>
    </section>`;
}

export function htmlDoPerfil(conta) {
    return [
        capa(conta), formacoes(conta), sobre(conta), mural(conta),
        testes(conta), conquistas(conta), instituicoes(conta), configuracao(conta)
    ].join('');
}
