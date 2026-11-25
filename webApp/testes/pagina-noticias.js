// Monta a página Notícias com notícias de exemplo. No computador de quem
// desenvolve não há Firestore, então a página de verdade fica vazia.
// Uso, a partir de http://localhost:5173/404.html:
//
//     await import('/testes/pagina-noticias.js');
//
// Já abre com as 14 notícias aprovadas de noticias-exemplo.js. Depois,
// window.teste.mostrar({ ... }) monta a página de novo com variações:
//
//     teste.mostrar({ quantas: 3 })       // poucas: sem paginação
//     teste.mostrar({ quantas: 1 })       // uma só
//     teste.mostrar({ quantas: 0 })       // nenhuma: o aviso de página vazia
//     teste.mostrar({ falhar: true })     // erro ao buscar as notícias
//     teste.mostrar({ demora: 4000 })     // resposta lenta, para ver o "carregando"
//     teste.mostrar({ noticias: [...] })  // a sua própria lista (itens com status 'aprovada')
//     teste.mostrar({ fixadas: ['n09', 'n03'] })  // essas no alto, nessa ordem
//     teste.mostrar({ quantas: 25 })      // mais notícias: as de exemplo repetidas, 3 páginas
import { montarTelaDeNoticias, prepararEstado, texto } from './noticias-montagem.js';
import { noticiasDeExemplo } from './noticias-exemplo.js';

async function mostrar(opcoes = {}) {
    let noticias = opcoes.noticias || noticiasDeExemplo();
    if (opcoes.quantas !== undefined) {
        const modelo = noticias.filter((n) => n.status === 'aprovada');
        // mais do que as de exemplo: repete, um pouco mais antigas a cada volta
        const aprovadas = Array.from({ length: opcoes.quantas }, (_, i) => {
            const volta = Math.floor(i / modelo.length);
            const base = modelo[i % modelo.length];
            if (!volta) return base;
            const publicadaEm = new Date(new Date(base.publicadaEm).getTime() - volta * 20 * 86400000).toISOString();
            return { ...structuredClone(base), id: `${base.id}-${volta}`, publicadaEm };
        });
        noticias = [...aprovadas, ...noticias.filter((n) => n.status !== 'aprovada')];
    }

    const teste = prepararEstado({
        noticias, demora: opcoes.demora, falhar: opcoes.falhar ? 'listar' : null, fixadas: opcoes.fixadas
    });
    teste.mostrar = mostrar;
    teste.texto = texto;
    await montarTelaDeNoticias('/noticias.html', 'noticias.js');
    return `${noticias.filter((n) => n.status === 'aprovada').length} notícias aprovadas na página`;
}

await mostrar();
