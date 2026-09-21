import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase-config.js';
import { categoriasTeste } from './categorias-teste.js';
import { escapeHtml } from './card-unidade.js';
import { extrairResultadoMaisRecente, extrairResultadoVocacional } from './resultado-teste.js';

// Bloco no topo da página de cursos com o que os testes já disseram sobre a
// pessoa. Os cursos viram botões que filtram a própria lista abaixo, para
// ela sair do resultado direto para "onde eu estudo isso".

const painel = document.getElementById('meus-resultados');

function filtrarPor(nomeDoCurso) {
    const busca = document.getElementById('busca-cursos');
    if (!busca) return;
    busca.value = nomeDoCurso;
    busca.dispatchEvent(new Event('input'));
    document.getElementById('grid-unidades')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function ligarBotoes() {
    painel.querySelectorAll('[data-curso]').forEach((botao) => {
        botao.addEventListener('click', () => filtrarPor(botao.dataset.curso));
    });
    painel.querySelector('[data-limpar]')?.addEventListener('click', () => filtrarPor(''));
}

function semResultados() {
    painel.hidden = false;
    painel.innerHTML = `
        <div class="meus-resultados-vazio">
            <div>
                <strong>Não sabe por onde começar?</strong>
                <p>O teste vocacional termina indicando cursos de verdade — e eles aparecem aqui para você
                    achar as unidades que oferecem.</p>
            </div>
            <a class="btn-meus-resultados" href="teste-vocacional.html">Fazer o teste</a>
        </div>`;
}

function comResultados(vocacional, perfil) {
    const cursos = (vocacional?.cursos || []).slice(0, 5);
    const areas = vocacional?.eixosFortes?.slice(0, 2) || [];
    const inteligencia = perfil ? (categoriasTeste[perfil.categoriaPrincipal] || perfil.categoriaPrincipal) : '';

    painel.hidden = false;
    painel.innerHTML = `
        <div class="meus-resultados-cabecalho">
            <h2>Do seu teste</h2>
            <p>
                ${areas.length ? `Suas áreas: <strong>${areas.map(escapeHtml).join(' · ')}</strong>.` : ''}
                ${inteligencia ? `No teste rápido de perfil, sua inteligência mais forte é <strong>${escapeHtml(inteligencia)}</strong>.` : ''}
            </p>
        </div>

        ${cursos.length ? `
            <div class="meus-resultados-cursos">
                ${cursos.map((curso) => `
                    <button type="button" class="chip-resultado ${curso.resposta === 'quero' ? 'chip-resultado--quero' : ''}"
                        data-curso="${escapeHtml(curso.nome)}">
                        ${escapeHtml(curso.nome)}
                    </button>`).join('')}
                <button type="button" class="chip-resultado chip-resultado--limpar" data-limpar>Ver todos de novo</button>
            </div>
            <p class="meus-resultados-dica">Clique em um curso para ver só as unidades que oferecem ele.</p>`
        : `<p class="meus-resultados-dica">
                <a href="teste-vocacional.html">Faça o teste vocacional</a> para ver aqui os cursos que combinam com você.
           </p>`}`;

    ligarBotoes();
}

onAuthStateChanged(auth, async (usuario) => {
    if (!painel) return;

    if (!usuario) {
        semResultados();
        return;
    }

    try {
        const snap = await getDoc(doc(db, 'usuarios', usuario.uid));
        const dados = snap.exists() ? snap.data() : null;
        const vocacional = extrairResultadoVocacional(dados);
        const perfil = extrairResultadoMaisRecente(dados);

        if (!vocacional && !perfil) semResultados();
        else comResultados(vocacional, perfil);
    } catch (erro) {
        console.error('Erro ao carregar seus resultados:', erro);
        painel.hidden = true;
    }
});
