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

// O conteúdo vem do catálogo oficial do Centro Paula Souza. O que o Painel
// Admin já importou e editou fica no Firestore e tem prioridade; para os
// cursos ainda não importados, a página cai no arquivo original, para nunca
// ficar sem conteúdo.
const CURSOS_COLLECTION = 'cursos';
const CATALOGO_OFICIAL = '/dados/catalogo-cursos.json';

async function buscarNoCatalogoOficial(id) {
    const resposta = await fetch(CATALOGO_OFICIAL);
    if (!resposta.ok) return null;
    const catalogo = await resposta.json();
    return catalogo.find((c) => c.slug === id) || null;
}

function slugificar(texto) {
    return normalizar(texto).replace(/\s+/g, '-');
}

function bloco(titulo, texto) {
    if (!texto) return '';
    return `
        <section class="curso-bloco">
            <h2>${escapeHtml(titulo)}</h2>
            <p>${escapeHtml(texto)}</p>
        </section>`;
}

function fichaTecnica(curso) {
    const itens = [
        ['Duração', curso.duracao],
        ['Carga horária', curso.cargaHoraria ? `${curso.cargaHoraria} horas` : ''],
        ['Eixo tecnológico', (curso.eixos || []).join(', ')]
    ].filter(([, valor]) => valor);

    if (!itens.length) return '';
    return `
        <div class="curso-ficha">
            ${itens.map(([rotulo, valor]) => `
                <div class="curso-ficha-item">
                    <span class="curso-ficha-rotulo">${escapeHtml(rotulo)}</span>
                    <strong>${escapeHtml(String(valor))}</strong>
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
// lista de cursos, que tem busca e filtros.
const MAXIMO_UNIDADES = 10;

function listaDeUnidades(unidades, avaliar, nomeDoCurso) {
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
        ? `<a class="curso-ver-todas" href="cursos.html?curso=${encodeURIComponent(nomeDoCurso)}">
             Ver as outras ${restantes} unidades &rarr;</a>`
        : '';

    return `<ul class="curso-unidades">
        ${comProximidade.slice(0, MAXIMO_UNIDADES).map(({ unidade, proximidade }) => {
            const distancia = proximidade ? textoProximidade(proximidade) : '';
            return `<li>
                <span class="curso-unidade-nome">${escapeHtml(unidade.nome)}</span>
                <span class="curso-unidade-cidade">${escapeHtml(unidade.municipio || '')}</span>
                ${distancia ? `<span class="curso-unidade-km">📍 ${escapeHtml(distancia)}</span>` : ''}
            </li>`;
        }).join('')}
    </ul>
    ${verTodas}`;
}

function renderizar(curso, unidades, avaliar) {
    const container = document.getElementById('curso-detalhe');
    document.title = `Futuro+ | ${curso.nome}`;

    container.innerHTML = `
        <header class="curso-cabecalho">
            <h1>${escapeHtml(curso.nome)}</h1>
            <div class="curso-modalidades">
                ${(curso.modalidades || []).map((m) => `<span class="tag-modalidade">${escapeHtml(m)}</span>`).join('')}
            </div>
        </header>

        ${fichaTecnica(curso)}
        ${avisos(curso)}
        ${bloco('O que você aprende', curso.descricao)}
        ${bloco('O que o profissional faz', curso.atuacao)}
        ${bloco('Onde se trabalha', curso.ondeTrabalhar)}

        <section class="curso-bloco">
            <h2>Onde estudar</h2>
            ${listaDeUnidades(unidades, avaliar, curso.nome)}
        </section>

        <p class="curso-fonte">Informações do catálogo oficial do Centro Paula Souza, mantidas no Futuro+.</p>
    `;
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
                <a href="cursos.html?curso=${encodeURIComponent(identificador)}">Ver as unidades que oferecem</a>.
            </p>`;
            return;
        }

        const termo = normalizar(curso.nome);
        const unidadesSnap = await getDocs(collection(db, 'etecs'));
        const unidades = unidadesSnap.docs
            .map((d) => ({ id: d.id, ...d.data() }))
            .filter((u) => (u.cursos || []).some((c) => normalizar(c?.nome) === termo));

        renderizar(curso, unidades, null);

        // a distância entra depois, quando dá para descobrir onde a pessoa mora
        const avaliar = await localizacaoDoUsuario().catch(() => null);
        if (avaliar) renderizar(curso, unidades, avaliar);
    } catch (erro) {
        console.error('Erro ao carregar o curso:', erro);
        container.innerHTML = '<p class="sem-resultados">Não foi possível carregar este curso agora. Tente novamente mais tarde.</p>';
    }
}

document.addEventListener('DOMContentLoaded', carregar);
