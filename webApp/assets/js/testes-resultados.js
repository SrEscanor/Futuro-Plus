import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase-config.js';
import { escapeHtml } from './card-unidade.js';
import { descricoesInteligencias } from './descricoes-inteligencias.js';
import { renderizarRecomendacoesTeste } from './recomendacao-cursos.js';
import { extrairResultadoMaisRecente, extrairResultadoVocacional } from './resultado-teste.js';

// Na página de testes, quem já fez algum vê aqui o mesmo resultado que
// apareceu na tela final — sem precisar refazer o teste para consultar.

const painel = document.getElementById('resultados-testes');

function dataCurta(iso) {
    if (!iso) return '';
    const data = new Date(iso);
    return Number.isNaN(data.getTime()) ? '' : data.toLocaleDateString('pt-BR');
}

function blocoVocacional(resultado) {
    if (!resultado) return '';

    return `
    <article class="resultado-teste-bloco">
        <header>
            <h3>Teste Vocacional</h3>
            <span class="resultado-teste-data">feito em ${escapeHtml(dataCurta(resultado.concluidoEm))}</span>
        </header>

        <p class="resultado-teste-linha">Suas áreas mais fortes:
            <strong>${(resultado.eixosFortes || []).slice(0, 3).map(escapeHtml).join(' · ')}</strong></p>

        <ol class="resultado-teste-cursos">
            ${(resultado.cursos || []).map((curso) => `
                <li>
                    <a href="curso.html?c=${encodeURIComponent(curso.slug)}">${escapeHtml(curso.nome)}</a>
                    <span class="resultado-teste-eixo">${escapeHtml(curso.eixo || '')}</span>
                    ${curso.resposta === 'quero' ? '<span class="voc-selo">você quis</span>' : ''}
                </li>`).join('')}
        </ol>

        <p class="resultado-teste-creditos">Feito pela equipe do Futuro+ com a inteligência artificial
            Claude (Anthropic) e revisão humana das perguntas — IA e pessoas juntas para o resultado
            chegar mais perto de você.</p>

        <div class="resultado-teste-acoes">
            <a class="btn-resultado-teste" href="cursos.html">Ver onde estudar</a>
            <a class="btn-resultado-teste btn-resultado-teste--verde" href="teste-vocacional.html?editar=1">✏️ Editar minhas escolhas</a>
            <a class="btn-resultado-teste btn-resultado-teste--secundario" href="teste-vocacional.html">Refazer o teste</a>
        </div>
    </article>`;
}

function blocoPerfil(resultado) {
    if (!resultado) return '';

    const principal = descricoesInteligencias[resultado.categoriaPrincipal];
    const top3 = (resultado.ranking || []).slice(0, 3)
        .map((chave) => descricoesInteligencias[chave]?.title || chave);

    return `
    <article class="resultado-teste-bloco">
        <header>
            <h3>Teste rápido de perfil</h3>
            <span class="resultado-teste-data">feito em ${escapeHtml(dataCurta(resultado.concluidoEm))}</span>
        </header>

        <p class="resultado-teste-linha"><strong>${escapeHtml(principal?.title || resultado.categoriaPrincipal)}</strong></p>
        <p class="resultado-teste-desc">${escapeHtml(principal?.desc || '')}</p>
        <p class="resultado-teste-linha">Seu pódio: ${top3.map(escapeHtml).join(' · ')}</p>

        <div id="recomendacoes-do-perfil"></div>

        <div class="resultado-teste-acoes">
            <a class="btn-resultado-teste btn-resultado-teste--secundario" href="quiz-gardner.html">Refazer o teste</a>
        </div>
    </article>`;
}

onAuthStateChanged(auth, async (usuario) => {
    if (!painel || !usuario) return;

    try {
        const snap = await getDoc(doc(db, 'usuarios', usuario.uid));
        const dados = snap.exists() ? snap.data() : null;
        const vocacional = extrairResultadoVocacional(dados);
        const perfil = extrairResultadoMaisRecente(dados);

        if (!vocacional && !perfil) return;

        painel.hidden = false;
        painel.innerHTML = `
            <h2 class="resultados-testes-titulo">Seus resultados</h2>
            <div class="resultados-testes-grade">
                ${blocoVocacional(vocacional)}
                ${blocoPerfil(perfil)}
            </div>`;

        // os cursos recomendados pelo perfil são os mesmos da tela final do teste
        if (perfil) {
            renderizarRecomendacoesTeste(
                document.getElementById('recomendacoes-do-perfil'),
                perfil,
                { uid: usuario.uid }
            );
        }
    } catch (erro) {
        console.error('Erro ao carregar seus resultados:', erro);
    }
});
