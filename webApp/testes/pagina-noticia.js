// Monta a página da matéria (noticia.html) com a notícia própria publicada
// de exemplo. Uso, a partir de http://localhost:5173/404.html:
//
//     await import('/testes/pagina-noticia.js');
//
// Depois, window.teste.mostrar({ id }) abre outra:
//
//     teste.mostrar({ id: 'np-agendada' })   // agendada: "não encontrada" até a hora
//     teste.mostrar({ id: 'nao-existe' })    // endereço errado
//     teste.mostrar({ falhar: 'listar' })    // erro ao buscar
import { montarTela, prepararEstado, texto } from './noticias-proprias-montagem.js';

async function mostrar(opcoes = {}) {
    const teste = prepararEstado(opcoes);
    teste.mostrar = mostrar;
    teste.texto = texto;
    const id = opcoes.id || 'np-publicada';
    await montarTela('/noticia.html', 'noticia.js', { endereco: `/noticia.html?id=${encodeURIComponent(id)}` });
    return texto('.materia-titulo') || texto('.materia-aviso h1');
}

await mostrar();
