// Prévia dos cursos com maior demanda (candidatos por vaga) na Início:
// usa o mesmo dado de cursos/{id}.demanda que a página do curso e o
// painel admin usam, só que aqui para escolher os mais disputados.
import { db } from './firebase-config.js';
import { collection, getDocs } from 'firebase/firestore';
import { escapeHtml, logoPadraoPorTipo } from './card-unidade.js';
import { resumoDaDemanda } from './demanda-curso.js';

const QUANTIDADE_PREVIA = 4;

function nivelDoCurso(curso) {
    return curso.nivel === 'superior' ? 'superior' : 'tecnico';
}

function rotuloNivel(nivel) {
    return nivel === 'superior' ? 'Superior (Fatec)' : 'Técnico (Etec)';
}

function cardCursoDemanda(curso, resumo) {
    const nivel = nivelDoCurso(curso);
    const logo = logoPadraoPorTipo(nivel === 'superior' ? 'fatec' : 'etec');
    const eixo = (curso.eixos || [])[0];

    return `
    <a class="card-curso-catalogo" href="curso.html?c=${encodeURIComponent(curso.id)}">
        <div class="card-curso-catalogo-cabecalho">
            <img class="card-curso-catalogo-logo" src="${logo}" alt="">
            <span class="badge-nivel badge-nivel--${nivel}">${rotuloNivel(nivel)}</span>
        </div>
        <h3 class="card-curso-catalogo-titulo">${escapeHtml(curso.nome)}</h3>
        <div class="card-curso-catalogo-eixos">
            ${eixo ? `<span class="tag-curso">${escapeHtml(eixo)}</span>` : ''}
        </div>
        <div class="card-curso-catalogo-rodape">
            <span class="selo-demanda selo-demanda--${resumo.nivel.chave}">${resumo.porVagaTexto} candidatos/vaga</span>
        </div>
    </a>`;
}

document.addEventListener('DOMContentLoaded', async () => {
    const container = document.getElementById('preview-cursos-demanda');
    if (!container) return;

    try {
        const snap = await getDocs(collection(db, 'cursos'));
        const maisDisputados = snap.docs
            .map((d) => ({ id: d.id, ...d.data() }))
            .map((curso) => ({ curso, resumo: resumoDaDemanda(curso.demanda) }))
            .filter((item) => item.resumo)
            .sort((a, b) => b.resumo.porVaga - a.resumo.porVaga)
            .slice(0, QUANTIDADE_PREVIA);

        if (!maisDisputados.length) {
            container.innerHTML = '<p class="sem-resultados">Ainda não há demanda coletada para os cursos.</p>';
            return;
        }

        container.innerHTML = maisDisputados.map(({ curso, resumo }) => cardCursoDemanda(curso, resumo)).join('');
    } catch (err) {
        console.error('Erro ao carregar cursos com maior demanda:', err);
        container.innerHTML = '<p class="sem-resultados">Não foi possível carregar os cursos agora.</p>';
    }
});
