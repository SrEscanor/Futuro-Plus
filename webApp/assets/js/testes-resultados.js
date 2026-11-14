import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase-config.js';
import { escapeHtml } from './card-unidade.js';
import { descricoesInteligencias } from './descricoes-inteligencias.js';
import { renderizarRecomendacoesTeste } from './recomendacao-cursos.js';
import { extrairTesteDePerfilMaisRecente, extrairResultadoVocacional } from './resultado-teste.js';
import { categoriasTeste } from './categorias-teste.js';
import { criarPainelCompartilhar } from './compartilhar-resultado.js';

// Na página de testes, quem já fez algum vê aqui o mesmo resultado que
// apareceu na tela final — sem precisar refazer o teste para consultar.

const painel = document.getElementById('resultados-testes');

function dataCurta(iso) {
    if (!iso) return '';
    const data = new Date(iso);
    return Number.isNaN(data.getTime()) ? '' : data.toLocaleDateString('pt-BR');
}

// Pódio (1º, 2º, 3º) com a posição numa pílula colorida — as mesmas cores
// do pódio da arte de compartilhar. itens = [{ nome, porcentagem? }]
function podio(itens) {
    if (!itens.length) return '';

    return `
        <ol class="resultado-teste-podio">
            ${itens.map((item, indice) => `
                <li class="resultado-teste-podio-item resultado-teste-podio-item--${indice + 1}">
                    <span class="resultado-teste-posicao">${indice + 1}º</span>
                    <span class="resultado-teste-podio-nome">${escapeHtml(item.nome)}</span>
                    ${Number.isFinite(item.porcentagem) ? `<span class="resultado-teste-podio-pct">${item.porcentagem}%</span>` : ''}
                </li>`).join('')}
        </ol>`;
}

// Faixa no pé do card com o convite e o botão "Compartilhar resultado": o
// painel de compartilhar-resultado.js entra no slot e abre ali mesmo.
function faixaCompartilhar(idSlot) {
    return `
        <div class="resultado-teste-compartilhar">
            <p class="resultado-teste-compartilhar-texto">
                <strong>Leve seu resultado pros stories</strong>
                <span>Artes prontas no visual do @futuroplus_, é só escolher e postar.</span>
            </p>
            <div id="${idSlot}" class="resultado-teste-compartilhar-slot"></div>
        </div>`;
}

function blocoVocacional(resultado) {
    if (!resultado) return '';

    const areas = (resultado.eixosFortes || []).slice(0, 3).map((nome) => ({ nome }));

    return `
    <article class="resultado-teste-bloco" data-ver-resultado="teste-vocacional.html?ver=1">
        <header>
            <h3>Teste Vocacional</h3>
            <span class="resultado-teste-data">feito em ${escapeHtml(dataCurta(resultado.concluidoEm))}</span>
        </header>

        <h4 class="resultado-teste-subtitulo">Suas áreas mais fortes</h4>
        ${podio(areas)}

        <h4 class="resultado-teste-subtitulo">Cursos que combinam com você</h4>
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
            <a class="btn-resultado-teste" href="instituicoes.html">Ver onde estudar</a>
            <a class="btn-resultado-teste btn-resultado-teste--verde" href="teste-vocacional.html?editar=1">✏️ Editar minhas escolhas</a>
            <a class="btn-resultado-teste btn-resultado-teste--secundario" href="teste-vocacional.html">Refazer o teste</a>
        </div>

        ${faixaCompartilhar('compartilhar-resultado-slot-vocacional')}
    </article>`;
}

// chaveTeste diz se esse resultado veio do Teste rápido (Gardner) ou do
// Teste de Afinidades — os dois caem aqui (é sempre o mais recente dos
// dois), mas o link de "ver resultado" precisa saber pra qual página voltar.
const PAGINA_POR_CHAVE_PERFIL = { gardner: 'quiz-gardner.html', afinidades: 'teste-afinidades.html' };
const TITULO_POR_CHAVE_PERFIL = { gardner: 'Teste rápido de perfil', afinidades: 'Teste de Afinidades' };

function blocoPerfil(resultado, chaveTeste) {
    if (!resultado) return '';

    const principal = descricoesInteligencias[resultado.categoriaPrincipal];
    const porcentagemPrincipal = Math.round(resultado.porcentagens?.[resultado.categoriaPrincipal] || 0);
    const top3 = (resultado.ranking || []).slice(0, 3).map((chave) => ({
        nome: categoriasTeste[chave] || descricoesInteligencias[chave]?.title || chave,
        porcentagem: Math.round(resultado.porcentagens?.[chave] || 0)
    }));
    const pagina = PAGINA_POR_CHAVE_PERFIL[chaveTeste] || 'quiz-gardner.html';

    return `
    <article class="resultado-teste-bloco" data-ver-resultado="${pagina}?ver=1">
        <header>
            <h3>${escapeHtml(TITULO_POR_CHAVE_PERFIL[chaveTeste] || 'Teste rápido de perfil')}</h3>
            <span class="resultado-teste-data">feito em ${escapeHtml(dataCurta(resultado.concluidoEm))}</span>
        </header>

        <p class="resultado-teste-principal">
            ${escapeHtml(principal?.title || resultado.categoriaPrincipal)}
            <span class="resultado-teste-porcentagem">${porcentagemPrincipal}% de afinidade</span>
        </p>
        <p class="resultado-teste-desc">${escapeHtml(principal?.desc || '')}</p>

        <h4 class="resultado-teste-subtitulo">Seu pódio</h4>
        ${podio(top3)}

        <div id="recomendacoes-do-perfil"></div>

        <div class="resultado-teste-acoes">
            <a class="btn-resultado-teste btn-resultado-teste--secundario" href="${pagina}">Refazer o teste</a>
        </div>

        ${faixaCompartilhar('compartilhar-resultado-slot-perfil')}
    </article>`;
}

onAuthStateChanged(auth, async (usuario) => {
    if (!painel || !usuario) return;

    try {
        const snap = await getDoc(doc(db, 'usuarios', usuario.uid));
        const dados = snap.exists() ? snap.data() : null;
        const vocacional = extrairResultadoVocacional(dados);
        const perfilInfo = extrairTesteDePerfilMaisRecente(dados);
        const perfil = perfilInfo?.resultado || null;
        const chaveTeste = perfilInfo?.chaveTeste || null;

        if (!vocacional && !perfil) return;

        painel.hidden = false;
        painel.innerHTML = `
            <h2 class="resultados-testes-titulo">Seus resultados</h2>
            <div class="resultados-testes-grade">
                ${blocoVocacional(vocacional)}
                ${blocoPerfil(perfil, chaveTeste)}
            </div>`;

        // Clicar no card (fora dos botões de ação e do painel de
        // compartilhar) abre a página daquele teste já mostrando o
        // resultado salvo (?ver=1), em vez de ter que refazer pra consultar.
        painel.querySelectorAll('[data-ver-resultado]').forEach((bloco) => {
            bloco.addEventListener('click', (evento) => {
                if (evento.target.closest('a, button, .compartilhar-resultado, .resultado-teste-compartilhar')) return;
                location.href = bloco.dataset.verResultado;
            });
        });

        // Vocacional já tem tudo que precisa (área forte + cursos) sem
        // esperar nada — o mesmo painel "Compartilhar resultado" das telas
        // de resultado ao vivo.
        if (vocacional) {
            const slotVocacional = document.getElementById('compartilhar-resultado-slot-vocacional');
            if (slotVocacional) {
                slotVocacional.appendChild(criarPainelCompartilhar({
                    etiquetaTopo: 'Resultado do teste vocacional',
                    titulo: (vocacional.eixosFortes || [])[0] || '',
                    numero: null,
                    numeroLabel: null,
                    frase: 'Descobri minha área mais forte no Futuro+.',
                    cursos: (vocacional.cursos || []).slice(0, 3).map((curso) => ({
                        nome: curso.nome,
                        rotulo: curso.eixo,
                        escolhido: curso.resposta === 'quero'
                    })),
                    // pódio das áreas, sem número (o Vocacional não calcula %)
                    ranking: (vocacional.eixosFortes || []).slice(0, 3).map((nome) => ({ nome }))
                }, { nomeArquivoBase: 'futuroplus-teste-vocacional' }));
            }
        }

        // os cursos recomendados pelo perfil são os mesmos da tela final do teste
        if (perfil) {
            const recomendacoes = await renderizarRecomendacoesTeste(
                document.getElementById('recomendacoes-do-perfil'),
                perfil,
                { uid: usuario.uid }
            );

            const slotPerfil = document.getElementById('compartilhar-resultado-slot-perfil');
            if (slotPerfil) {
                const principal = descricoesInteligencias[perfil.categoriaPrincipal];
                slotPerfil.appendChild(criarPainelCompartilhar({
                    etiquetaTopo: chaveTeste === 'afinidades' ? 'Resultado do teste de afinidades' : 'Resultado do teste rápido',
                    titulo: principal?.title || perfil.categoriaPrincipal,
                    numero: `${Math.round(perfil.porcentagens[perfil.categoriaPrincipal])}%`,
                    numeroLabel: 'de afinidade',
                    frase: principal?.frase,
                    cursos: (recomendacoes || []).slice(0, 3).map((r) => ({
                        nome: r.nome,
                        rotulo: `${Math.round(perfil.porcentagens[r.motivo] || 0)}% · ${categoriasTeste[r.motivo] || ''}`
                    })),
                    ranking: (perfil.ranking || []).slice(0, 3).map((chave) => ({
                        nome: categoriasTeste[chave] || chave,
                        porcentagem: Math.round(perfil.porcentagens?.[chave] || 0)
                    }))
                }, { nomeArquivoBase: 'futuroplus-resultado-perfil' }));
            }
        }
    } catch (erro) {
        console.error('Erro ao carregar seus resultados:', erro);
    }
});
