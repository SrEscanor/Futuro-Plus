// Monta o painel Admin · Notícias próprias com notícias de exemplo (uma no
// site, uma pendente de aprovação, uma agendada e um rascunho, com
// histórico). Para abrir direto a revisão, como o link do painel Notícias:
// teste.mostrar({ revisar: 'np-pendente' }). Uso, a partir de
// http://localhost:5173/404.html:
//
//     await import('/testes/painel-noticias-proprias.js');
//
// Depois, window.teste.mostrar({ ... }) monta de novo com variações:
//
//     teste.mostrar({ vazio: true })       // nenhuma notícia ainda
//     teste.mostrar({ falhar: 'gravar' })  // salvar dá erro
//     teste.mostrar({ admin: false })      // conta sem acesso
//     teste.mostrar({ destaques: ['np-publicada', 'n09'] })  // a publicada está no
//                                          // carrossel da Início: tirar do site ou
//                                          // excluir tira ela de lá (teste.destaques)
//     teste.mostrar({ fixadas: ['np-publicada', 'n09'] })  // idem para as fixadas
//                                          // da página Notícias (teste.fixadas); o
//                                          // botão Fixar da aba No site mexe nelas
//
// O que o painel grava fica em teste.gravacoes; o histórico, em
// teste.historico; a cópia que o site leria, em teste.publicadas; o que
// iria para o histórico do painel Notícias, em teste.historicoNoticias.
import { montarTela, prepararEstado, texto } from './noticias-proprias-montagem.js';

async function mostrar(opcoes = {}) {
    const teste = prepararEstado(opcoes);
    teste.mostrar = mostrar;
    teste.texto = texto;
    const endereco = '/admin-noticias-proprias.html'
        + (opcoes.revisar ? `?revisar=${encodeURIComponent(opcoes.revisar)}` : '');
    await montarTela('/admin-noticias-proprias.html', 'admin-noticias-proprias.js', { endereco });
    return `${teste.proprias.size} notícias próprias no painel`;
}

await mostrar();
