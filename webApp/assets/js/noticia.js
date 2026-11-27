// Página da matéria (noticia.html?id=...): uma notícia própria do Futuro+,
// escrita no painel Admin · Notícias próprias. Lê a cópia pública da
// coleção "noticias"; notícia agendada só aparece quando chega a hora.
//
// Os dados chegam só por noticias-proprias-dados.js (os roteiros de teste
// trocam esse arquivo por uma cópia de mentira).
import { lerNoticiaPublicada } from './noticias-proprias-dados.js';
import { htmlDaMateria } from './noticia-materia.js';
import { ligarCompartilhar } from './compartilhar-noticia.js';
import { linkDaMateria, paraData } from './noticias-proprias-util.js';
import { escapeHtml } from './noticias-util.js';

const caixa = document.getElementById('materia');
const id = new URLSearchParams(location.search).get('id');

function aviso(titulo, texto) {
    caixa.removeAttribute('aria-busy');
    caixa.innerHTML = `
        <div class="materia-aviso">
            <h1>${escapeHtml(titulo)}</h1>
            <p>${escapeHtml(texto)}</p>
            <a class="materia-voltar" href="noticias.html">&larr; Ver todas as notícias</a>
        </div>`;
}

function mostrar(noticia) {
    document.title = `${noticia.titulo} | Futuro+`;
    document.querySelector('meta[name="description"]')?.setAttribute('content', noticia.linhaApoio || noticia.titulo);
    caixa.removeAttribute('aria-busy');
    caixa.innerHTML = htmlDaMateria(noticia);
    // o endereço limpo da matéria, no site em que a pessoa está
    ligarCompartilhar(caixa, noticia, new URL(linkDaMateria(id), location.href).href);
}

// "Copiar link": o endereço desta página, sem nada a mais
caixa?.addEventListener('click', async (evento) => {
    const botao = evento.target.closest('[data-acao="copiar-link"]');
    if (!botao) return;
    const texto = botao.querySelector('span');
    try {
        await navigator.clipboard.writeText(location.href);
        texto.textContent = 'Link copiado!';
    } catch {
        texto.textContent = 'Não deu para copiar';
    }
    setTimeout(() => { texto.textContent = 'Copiar link'; }, 2500);
});

async function carregar() {
    if (!caixa) return;
    if (!id) {
        aviso('Notícia não encontrada', 'O endereço está incompleto. Veja as outras notícias enquanto isso.');
        return;
    }
    try {
        const noticia = await lerNoticiaPublicada(id);
        const noAr = noticia?.propria && (!noticia.publicarEm || paraData(noticia.publicarEm) <= new Date());
        if (!noAr) {
            aviso('Notícia não encontrada', 'Ela pode ter saído do ar ou ainda não ter sido publicada.');
            return;
        }
        mostrar(noticia);
    } catch (erro) {
        console.error('Erro ao abrir a notícia:', erro);
        aviso('Não deu para abrir a notícia', 'Confira sua internet e tente de novo.');
    }
}

carregar();
