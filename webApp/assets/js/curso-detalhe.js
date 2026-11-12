import { auth, db } from './firebase-config.js';
import { collection, doc, getDoc, getDocs } from 'firebase/firestore';
import { escapeHtml, normalizar } from './card-unidade.js';
import {
    carregarRegioesSP,
    resolverLocalizacaoUsuario,
    criarAvaliadorProximidade,
    PROXIMIDADE
} from './recomendacao-cursos.js';
import { formatarDistancia } from './geocodificacao.js';
import { resumoDaDemanda } from './demanda-curso.js';
import { destaquesDaMatriz, duracaoDaMatriz } from './matriz-curricular.js';
import { capaDoEixo } from './capas-eixos.js';

// O conteúdo vem do catálogo oficial do Centro Paula Souza. O que o Painel
// Admin já importou e editou fica no Firestore e tem prioridade; para os
// cursos ainda não importados, a página cai no arquivo original, para nunca
// ficar sem conteúdo.
const CURSOS_COLLECTION = 'cursos';
const CATALOGO_OFICIAL = '/dados/catalogo-cursos.json';

// O que a página está mostrando: guardado para redesenhar quando a pessoa
// troca de matriz ou quando a distância até as unidades fica pronta.
const estado = { curso: null, unidades: [], avaliar: null, matriz: 0 };

async function buscarNoCatalogoOficial(id) {
    const resposta = await fetch(CATALOGO_OFICIAL);
    if (!resposta.ok) return null;
    const catalogo = await resposta.json();
    return catalogo.find((c) => c.slug === id) || null;
}

function slugificar(texto) {
    return normalizar(texto).replace(/\s+/g, '-');
}

function numero(valor) {
    return Number(valor || 0).toLocaleString('pt-BR');
}

// Ícones de traço, todos no mesmo estilo; a cor vem do texto em volta.
const ICONES = {
    relogio: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    calendario: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    eixo: '<rect x="7" y="7" width="10" height="10" rx="1.5"/><path d="M10 3v4M14 3v4M10 17v4M14 17v4M3 10h4M3 14h4M17 10h4M17 14h4"/>',
    livro: '<path d="M4 5a2 2 0 0 1 2-2h5v17H6a2 2 0 0 0-2 2zM20 5a2 2 0 0 0-2-2h-5v17h5a2 2 0 0 1 2 2z"/>',
    maleta: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 13h18"/>',
    ferramenta: '<path d="M14.5 6.5a4 4 0 0 0 5 5L11 20a2.1 2.1 0 0 1-3-3z"/><path d="m14.5 6.5 3-3 3 3-3 3"/>',
    capelo: '<path d="m2 9 10-5 10 5-10 5z"/><path d="M6 11.5V16c0 1.5 2.7 3 6 3s6-1.5 6-3v-4.5M22 9v5"/>',
    barras: '<path d="M5 20v-8M12 20V5M19 20v-11M3 20h18"/>',
    camadas: '<path d="m12 3 9 5-9 5-9-5zM3 13l9 5 9-5M3 18l9 5 9-5"/>',
    pessoas: '<circle cx="9" cy="8" r="3"/><path d="M3 20a6 6 0 0 1 12 0M16 5.2a3 3 0 0 1 0 5.6M17 14.3a6 6 0 0 1 4 5.7"/>',
    baixar: '<path d="M12 4v11M7 11l5 5 5-5M5 20h14"/>',
    fechar: '<path d="M6 6l12 12M18 6 6 18"/>'
};

function icone(nome, tamanho = 22) {
    return `<svg class="icone" width="${tamanho}" height="${tamanho}" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
        aria-hidden="true">${ICONES[nome]}</svg>`;
}

// ========================================================
// Topo: nome, modalidades e capa
// ========================================================

// Capa desenhada do eixo: mesma composição para todos, com a cor e o ícone
// de cada um.
function capaDesenhada(eixo, capa) {
    return `
        <div class="curso-capa curso-capa--padrao" aria-hidden="true"
            style="--capa-escura:${capa.cores[0]};--capa-clara:${capa.cores[1]}">
            <svg class="curso-capa-fundo" viewBox="0 0 600 190" preserveAspectRatio="xMidYMid slice">
                <circle cx="150" cy="-30" r="130" fill="#fff" opacity=".06"/>
                <circle cx="60" cy="210" r="120" fill="#fff" opacity=".05"/>
                <path d="M0 150 C120 110 220 190 340 140 S520 100 600 135 V190 H0z" fill="#fff" opacity=".09"/>
                <path d="M0 172 C140 146 250 194 380 168 S540 148 600 164 V190 H0z" fill="#fff" opacity=".12"/>
            </svg>
            <span class="curso-capa-selo">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"
                    stroke-linecap="round" stroke-linejoin="round">${capa.icone}</svg>
            </span>
            ${eixo ? `<span class="curso-capa-eixo">${escapeHtml(eixo)}</span>` : ''}
        </div>`;
}

// A capa vem, nesta ordem: da imagem cadastrada no curso, da imagem do eixo
// (pasta assets/images/eixos) ou do desenho padrão do eixo.
function capa(curso) {
    const eixo = (curso.eixos || [])[0] || '';
    const doEixo = capaDoEixo(eixo);
    const desenhada = capaDesenhada(eixo, doEixo);
    const foto = curso.imagemUrl || doEixo.foto;
    if (!foto) return desenhada;

    // Se a imagem não carregar (link quebrado), renderizar() troca pela
    // capa desenhada, guardada aqui no <template>.
    return `
        <div class="curso-capa curso-capa--foto" data-capa-com-foto>
            <img src="${escapeHtml(foto)}" alt="" loading="lazy" referrerpolicy="no-referrer">
            ${!curso.imagemUrl && eixo ? `<span class="curso-capa-eixo">${escapeHtml(eixo)}</span>` : ''}
            <template>${desenhada}</template>
        </div>`;
}

function fichaTecnica(curso) {
    const itens = [
        ['relogio', 'Duração', curso.duracao],
        ['calendario', 'Carga horária', curso.cargaHoraria ? `${numero(curso.cargaHoraria)} horas` : ''],
        ['eixo', 'Eixo tecnológico', (curso.eixos || []).join(', ')]
    ].filter(([, , valor]) => valor);

    if (!itens.length) return '';
    return `
        <div class="curso-ficha">
            ${itens.map(([nomeIcone, rotulo, valor]) => `
                <div class="curso-ficha-item">
                    ${icone(nomeIcone, 30)}
                    <div>
                        <span class="curso-ficha-rotulo">${escapeHtml(rotulo)}</span>
                        <strong>${escapeHtml(String(valor))}</strong>
                    </div>
                </div>`).join('')}
        </div>`;
}

function avisos(curso) {
    const lista = [];
    if (curso.preRequisitos) {
        lista.push(`<div class="curso-aviso curso-aviso--requisito">
            <strong>Este curso exige formação anterior.</strong>
            <span>${escapeHtml(curso.preRequisitos)}</span>
        </div>`);
    }
    if (curso.provaAptidao) {
        lista.push(`<div class="curso-aviso curso-aviso--aptidao">
            <strong>Tem prova de aptidão.</strong>
            <span>Além da prova escrita do Vestibulinho, quem se inscreve neste curso faz uma prova prática.</span>
        </div>`);
    }
    return lista.join('');
}

// ========================================================
// Textos e unidades
// ========================================================

function bloco(nomeIcone, titulo, texto) {
    if (!texto) return '';
    return `
        <section class="curso-bloco">
            <h2>${icone(nomeIcone)} ${escapeHtml(titulo)}</h2>
            <p>${escapeHtml(texto)}</p>
        </section>`;
}

function textoProximidade({ nivel, km }) {
    if (km != null) {
        const distancia = formatarDistancia(km);
        return `${distancia.charAt(0).toUpperCase()}${distancia.slice(1)} de você`;
    }
    if (nivel === PROXIMIDADE.CIDADE) return 'Na sua cidade';
    if (nivel === PROXIMIDADE.REGIAO) return 'Na sua região';
    return '';
}

// Cursos populares estão em mais de 200 unidades; a página mostra as
// primeiras (as mais perto, quando dá para saber) e manda o resto para a
// lista de instituições, que tem busca e filtros.
const MAXIMO_UNIDADES = 8;

function listaDeUnidades(unidades, avaliar, nomeDoCurso) {
    // null: o cadastro de unidades ainda está carregando
    if (!unidades) return '<p class="sem-cursos">Carregando unidades...</p>';
    if (!unidades.length) {
        return '<p class="sem-cursos">Nenhuma unidade do cadastro oferece este curso no momento.</p>';
    }

    const comProximidade = unidades.map((u) => ({ unidade: u, proximidade: avaliar ? avaliar(u) : null }));
    if (avaliar) {
        comProximidade.sort((a, b) => a.proximidade.ordem - b.proximidade.ordem
            || (a.unidade.nome || '').localeCompare(b.unidade.nome || '', 'pt-BR'));
    }

    const restantes = comProximidade.length - MAXIMO_UNIDADES;
    const verTodas = restantes > 0
        ? `<a class="curso-ver-todas" href="instituicoes.html?curso=${encodeURIComponent(nomeDoCurso)}">
             Ver as outras ${restantes} unidades &rarr;</a>`
        : '';

    return `<ul class="curso-unidades">
        ${comProximidade.slice(0, MAXIMO_UNIDADES).map(({ unidade, proximidade }) => {
            const distancia = proximidade ? textoProximidade(proximidade) : '';
            return `<li>
                <span class="curso-unidade-nome">${escapeHtml(unidade.nome)}</span>
                <span class="curso-unidade-cidade">${escapeHtml(unidade.municipio || '')}</span>
                ${distancia ? `<span class="curso-unidade-km">${escapeHtml(distancia)}</span>` : ''}
            </li>`;
        }).join('')}
    </ul>
    ${verTodas}`;
}

// ========================================================
// Demanda do vestibular
// ========================================================

function graficoDaDemanda(resumo) {
    // Um ano só não faz gráfico: vira o número em destaque.
    if (resumo.serie.length < 2) {
        return `
            <div class="demanda-numero">
                <strong>${escapeHtml(resumo.porVagaTexto)}</strong>
                <span>candidatos por vaga em ${resumo.ano}</span>
            </div>`;
    }

    const maior = Math.max(...resumo.serie.map((ponto) => ponto.porVaga));
    const colunas = resumo.serie.map((ponto, indice) => {
        const atual = indice === resumo.serie.length - 1;
        const altura = Math.max(4, Math.round((ponto.porVaga / maior) * 100));
        const detalhe = `${numero(ponto.inscritos)} inscritos · ${numero(ponto.vagas)} vagas`;
        return `
            <li class="demanda-coluna${atual ? ' demanda-coluna--atual' : ''}" tabindex="0"
                aria-label="${ponto.ano}: ${escapeHtml(ponto.porVagaTexto)} candidatos por vaga, ${escapeHtml(detalhe)}">
                <span class="demanda-dica" aria-hidden="true">
                    <strong>${escapeHtml(ponto.porVagaTexto)} por vaga</strong>${escapeHtml(detalhe)}
                </span>
                <span class="demanda-area" aria-hidden="true">
                    <span class="demanda-valor">${escapeHtml(ponto.porVagaTexto)}</span>
                    <span class="demanda-barra" style="height:${altura}%"></span>
                </span>
                <span class="demanda-ano" aria-hidden="true">${ponto.ano}</span>
            </li>`;
    }).join('');

    return `
        <figure class="demanda-grafico">
            <figcaption>Candidatos por vaga, ano a ano</figcaption>
            <ul class="demanda-colunas">${colunas}</ul>
        </figure>`;
}

function cartaoDemanda(curso) {
    const resumo = resumoDaDemanda(curso.demanda);
    if (!resumo) return '';

    const superior = curso.nivel === 'superior';
    const vestibular = superior ? 'Vestibular das Fatecs' : 'Vestibulinho das Etecs';
    const escolas = superior ? 'Fatecs' : 'Etecs';
    const semestre = resumo.semestre === 2 ? '2º' : '1º';

    return `
        <section class="curso-cartao curso-demanda">
            <h2>${icone('barras')} Demanda por curso</h2>
            <div class="curso-demanda-corpo">
                <div class="curso-demanda-texto">
                    <p>No ${vestibular} do ${semestre} semestre de ${resumo.ano},
                        <strong>${numero(resumo.inscritos)} pessoas</strong> se inscreveram para
                        <strong>${numero(resumo.vagas)} vagas</strong>${resumo.unidades
                            ? ` em ${numero(resumo.unidades)} ${escolas}` : ''}.</p>
                    <div class="demanda-selo">
                        ${icone('pessoas', 30)}
                        <div>
                            <strong>${escapeHtml(resumo.nivel.rotulo)}</strong>
                            <span>${escapeHtml(resumo.porVagaTexto)} candidatos por vaga.
                                ${escapeHtml(resumo.nivel.descricao)}</span>
                        </div>
                    </div>
                </div>
                ${graficoDaDemanda(resumo)}
            </div>
            <details class="demanda-tabela">
                <summary>Ver os números de cada ano</summary>
                <table>
                    <thead><tr><th>Ano</th><th>Inscritos</th><th>Vagas</th><th>Por vaga</th></tr></thead>
                    <tbody>${resumo.serie.map((ponto) => `
                        <tr><td>${ponto.ano}</td><td>${numero(ponto.inscritos)}</td>
                            <td>${numero(ponto.vagas)}</td><td>${escapeHtml(ponto.porVagaTexto)}</td></tr>`).join('')}
                    </tbody>
                </table>
            </details>
            <p class="curso-nota">Soma de todas as unidades do estado, do site oficial do ${vestibular}.
                Em cada unidade a concorrência pode ser bem maior ou menor.</p>
        </section>`;
}

// ========================================================
// Matriz curricular
// ========================================================

function matrizesDoCurso(curso) {
    return (curso.matrizes || []).filter((m) => (m?.componentes || []).length);
}

function etiquetasDaMatriz(matriz) {
    return (matriz.destaques || []).length ? matriz.destaques : destaquesDaMatriz(matriz);
}

function resumoDaMatriz(matriz) {
    return [duracaoDaMatriz(matriz), matriz.cargaHoraria ? `${numero(matriz.cargaHoraria)} horas` : '']
        .filter(Boolean).join(' · ');
}

function cartaoMatriz(curso) {
    const matrizes = matrizesDoCurso(curso);
    if (!matrizes.length) return '';

    const indice = Math.min(estado.matriz, matrizes.length - 1);
    const matriz = matrizes[indice];
    const etiquetas = etiquetasDaMatriz(matriz);
    const tecnicas = matriz.componentes.filter((c) => c.grupo === 'tecnica').length;

    const abas = matrizes.length > 1
        ? `<div class="matriz-abas" role="group" aria-label="Matriz de qual forma de oferta">
            ${matrizes.map((m, i) => `
                <button type="button" class="matriz-aba${i === indice ? ' matriz-aba--ativa' : ''}"
                    data-matriz-aba="${i}" aria-pressed="${i === indice}">${escapeHtml(m.titulo)}</button>`).join('')}
           </div>`
        : '';

    return `
        <section class="curso-cartao curso-matriz">
            <div class="curso-cartao-topo">
                <h2>${icone('camadas')} Matriz Curricular</h2>
                <button type="button" class="btn-matriz-completa" data-abrir-matriz>
                    ${icone('baixar', 16)} Ver matriz completa
                </button>
            </div>
            ${abas}
            <p class="curso-matriz-sub">Confira as principais disciplinas do curso:</p>
            <ul class="curso-etiquetas">
                ${etiquetas.map((nome) => `<li>${escapeHtml(nome)}</li>`).join('')}
                ${tecnicas > etiquetas.length ? '<li class="curso-etiqueta--mais">Entre outras disciplinas…</li>' : ''}
            </ul>
            <p class="curso-nota">${escapeHtml(matriz.titulo)}${resumoDaMatriz(matriz)
                ? ` · ${escapeHtml(resumoDaMatriz(matriz))}` : ''}</p>
        </section>`;
}

function nomeDaEtapa(matriz, indice) {
    const feminino = matriz.tipoEtapa === 'série';
    return `${indice + 1}${feminino ? 'ª' : 'º'} ${matriz.tipoEtapa}`;
}

// Tudo o que a matriz tem, etapa por etapa: primeiro as disciplinas técnicas,
// depois (quando o curso é integrado ao ensino médio) as matérias comuns.
function abrirMatrizCompleta() {
    const matrizes = matrizesDoCurso(estado.curso || {});
    const matriz = matrizes[Math.min(estado.matriz, matrizes.length - 1)];
    if (!matriz) return;

    const etapas = Array.from({ length: matriz.etapas }, (_, i) => {
        const daEtapa = matriz.componentes.filter((c) => (c.aulas?.[i] || 0) > 0);
        const linhas = (grupo) => daEtapa.filter((c) => c.grupo === grupo).map((c) => `
            <tr>
                <td>${escapeHtml(c.nome)}${c.tipo ? `<span class="matriz-tipo">${escapeHtml(c.tipo)}</span>` : ''}</td>
                <td>${numero(c.aulas[i])}</td>
            </tr>`).join('');
        const tecnicas = linhas('tecnica');
        const base = linhas('base');

        return `
            <section class="matriz-etapa">
                <h3>${escapeHtml(nomeDaEtapa(matriz, i))}</h3>
                <table>
                    <thead><tr><th>Disciplina</th><th>Aulas</th></tr></thead>
                    <tbody>
                        ${tecnicas && base ? '<tr class="matriz-grupo"><th colspan="2">Formação técnica</th></tr>' : ''}
                        ${tecnicas}
                        ${base ? `<tr class="matriz-grupo"><th colspan="2">Ensino médio</th></tr>${base}` : ''}
                    </tbody>
                </table>
            </section>`;
    }).join('');

    document.getElementById('dialogo-matriz-conteudo').innerHTML = `
        <div class="painel-unidade-topo">
            <div class="painel-unidade-identidade">
                <h2 id="dialogo-matriz-titulo">Matriz curricular · ${escapeHtml(estado.curso.nome)}</h2>
                <p class="painel-unidade-local">${escapeHtml(matriz.titulo)}${resumoDaMatriz(matriz)
                    ? ` · ${escapeHtml(resumoDaMatriz(matriz))}` : ''}</p>
            </div>
            <button type="button" class="painel-unidade-fechar" data-fechar-painel aria-label="Fechar">
                ${icone('fechar', 18)}
            </button>
        </div>
        <div class="matriz-etapas">
            ${etapas}
            <p class="curso-nota">Aulas de 50 minutos, somadas no ano ou semestre. A grade pode ter pequenas
                diferenças de uma unidade para outra; confirme na escola onde você pretende estudar.</p>
        </div>`;

    document.getElementById('dialogo-matriz').showModal();
}

// ========================================================
// Montagem da página
// ========================================================

export function renderizar(curso, unidades, avaliar) {
    Object.assign(estado, { curso, unidades, avaliar });
    const container = document.getElementById('curso-detalhe');
    document.title = `Futuro+ | ${curso.nome}`;

    const textos = [
        bloco('livro', 'O que você aprende', curso.descricao),
        bloco('ferramenta', 'O que o profissional faz', curso.atuacao),
        bloco('maleta', 'Onde se trabalha', curso.ondeTrabalhar)
    ].join('');
    const dados = [cartaoDemanda(curso), cartaoMatriz(curso)].filter(Boolean);

    container.innerHTML = `
        <header class="curso-topo">
            <div class="curso-topo-texto">
                <h1>${escapeHtml(curso.nome)}</h1>
                <div class="curso-modalidades">
                    ${(curso.modalidades || []).map((m) => `<span class="tag-modalidade">${escapeHtml(m)}</span>`).join('')}
                </div>
            </div>
            ${capa(curso)}
        </header>

        ${fichaTecnica(curso)}
        ${avisos(curso)}

        <div class="curso-grade${textos ? '' : ' curso-grade--unica'}">
            ${textos ? `<div class="curso-cartao curso-textos">${textos}</div>` : ''}
            <section class="curso-cartao curso-onde-estudar">
                <h2>${icone('capelo')} Onde estudar</h2>
                ${listaDeUnidades(unidades, avaliar, curso.nome)}
            </section>
        </div>

        ${dados.length ? `<div class="curso-grade curso-grade--dados${dados.length === 1 ? ' curso-grade--unica' : ''}">
            ${dados.join('')}
        </div>` : ''}

        <p class="curso-fonte">Informações do catálogo oficial do Centro Paula Souza, mantidas no Futuro+.</p>
    `;

    // foto de capa com link quebrado: volta para a capa padrão
    const comFoto = container.querySelector('[data-capa-com-foto]');
    comFoto?.querySelector('img').addEventListener('error', () => {
        comFoto.outerHTML = comFoto.querySelector('template').innerHTML;
    });
}

function ligarEventos() {
    document.getElementById('curso-detalhe').addEventListener('click', (evento) => {
        if (evento.target.closest('[data-abrir-matriz]')) {
            abrirMatrizCompleta();
            return;
        }
        const aba = evento.target.closest('[data-matriz-aba]');
        if (aba && estado.curso) {
            estado.matriz = Number(aba.dataset.matrizAba);
            renderizar(estado.curso, estado.unidades, estado.avaliar);
            document.querySelector(`[data-matriz-aba="${estado.matriz}"]`)?.focus();
        }
    });

    const dialogo = document.getElementById('dialogo-matriz');
    dialogo.addEventListener('click', (evento) => {
        if (evento.target === dialogo || evento.target.closest('[data-fechar-painel]')) dialogo.close();
    });
}

function mostrarPlanoDeCurso(curso) {
    const painel = document.getElementById('curso-plano-pdf');
    if (!curso.planoCursoUrl) {
        painel.hidden = true;
        return;
    }
    document.getElementById('curso-plano-pdf-iframe').src = curso.planoCursoUrl;
    document.getElementById('curso-plano-pdf-abrir').href = curso.planoCursoUrl;
    painel.hidden = false;
}

async function localizacaoDoUsuario() {
    await auth.authStateReady();
    const usuario = auth.currentUser;
    if (!usuario) return null;

    const snap = await getDoc(doc(db, 'usuarios', usuario.uid));
    const localizacao = await resolverLocalizacaoUsuario(usuario.uid, snap.exists() ? snap.data() : null);
    if (!localizacao) return null;

    const regioes = await carregarRegioesSP().catch(() => null);
    return criarAvaliadorProximidade(localizacao, regioes);
}

async function carregar() {
    const container = document.getElementById('curso-detalhe');
    const parametros = new URLSearchParams(window.location.search);
    const identificador = parametros.get('c') || parametros.get('curso') || '';

    if (!identificador) {
        container.innerHTML = '<p class="sem-resultados">Curso não informado. Volte para a lista de cursos.</p>';
        return;
    }

    try {
        const id = slugificar(identificador);
        const snap = await getDoc(doc(db, CURSOS_COLLECTION, id)).catch(() => null);
        const curso = snap?.exists() ? snap.data() : await buscarNoCatalogoOficial(id);

        if (!curso) {
            container.innerHTML = `<p class="sem-resultados">
                Ainda não temos a descrição deste curso.
                <a href="instituicoes.html?curso=${encodeURIComponent(identificador)}">Ver as unidades que oferecem</a>.
            </p>`;
            return;
        }

        // O conteúdo do curso aparece na hora; a lista de unidades entra
        // quando o cadastro (bem maior) terminar de carregar.
        mostrarPlanoDeCurso(curso);
        renderizar(curso, null, null);

        // Cursos técnicos (Etec) e superiores (Fatec) às vezes têm o mesmo
        // nome ("Logística", "Marketing"...) mas são grades diferentes — o
        // nome sozinho não basta para casar unidade com curso, senão a
        // página de um listaria as unidades do outro.
        const termo = normalizar(curso.nome);
        const ehSuperior = curso.nivel === 'superior';
        const unidadesSnap = await getDocs(collection(db, 'instituicoes')).catch((erro) => {
            console.error('Erro ao carregar as unidades do curso:', erro);
            return { docs: [] };
        });
        const unidades = unidadesSnap.docs
            .map((d) => ({ id: d.id, ...d.data() }))
            .filter((u) => {
                if (!(u.cursos || []).some((c) => normalizar(c?.nome) === termo)) return false;
                const unidadeEhFatec = (u.tipo || '').trim().toLowerCase() === 'fatec';
                return ehSuperior ? unidadeEhFatec : !unidadeEhFatec;
            });

        renderizar(curso, unidades, null);

        // a distância entra depois, quando dá para descobrir onde a pessoa mora
        const avaliar = await localizacaoDoUsuario().catch(() => null);
        if (avaliar) renderizar(curso, unidades, avaliar);
    } catch (erro) {
        console.error('Erro ao carregar o curso:', erro);
        container.innerHTML = '<p class="sem-resultados">Não foi possível carregar este curso agora. Tente novamente mais tarde.</p>';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    ligarEventos();
    carregar();
});
