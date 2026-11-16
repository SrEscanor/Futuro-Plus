// Monta o painel Admin · Notícias com login de administrador e notícias de
// exemplo (8 pendentes, 14 no site, 3 recusadas — ver noticias-exemplo.js).
// Uso, a partir de http://localhost:5173/404.html:
//
//     await import('/testes/painel-noticias.js');
//
// Depois, em window.teste:
//
//     teste.gravacoes                      // o que o painel mandou gravar: ['aprovar', ['n01', 'n02']], ...
//     teste.noticias                       // a "fila" inteira, com o status de cada uma
//     teste.falhar = 'gravar'              // as próximas gravações dão erro (null desliga)
//     teste.falhar = 'listar'              // idem para as leituras
//     teste.falhar = 'buscar'              // idem para o botão "Buscar notícias agora"
//     teste.demora = 3000                  // resposta lenta
//     teste.proximasNovas = 5              // quantas notícias a próxima busca acha
//                                          // (a primeira acha 2; as seguintes, nenhuma)
//
//     teste.mostrar({ pendentes: 0 })      // monta de novo sem nada para aprovar
//     teste.mostrar({ pendentes: 60 })     // fila grande (as de exemplo repetidas)
//     teste.mostrar({ semColeta: true })   // nenhuma busca rodou ainda
//     teste.mostrar({ admin: false })      // conta que não é administradora
//     teste.mostrar({ logado: false })     // ninguém logado: o painel manda para o login
//     teste.mostrar({ noticias: [...] })   // a sua própria lista (ver noticias-exemplo.js)
//     teste.mostrar({ propriasPendentes: [] })  // sem notícia do Futuro+ esperando aprovação
//                                          // (por padrão vem a pendente de noticias-proprias-exemplo.js)
//     teste.mostrar({ comPropria: true })  // a notícia do Futuro+ publicada também na aba No site
//     teste.mostrar({ destaques: ['np-publicada', 'n09'] })  // o carrossel da Início já com essas
//                                          // ('sumiu' = uma que saiu do site); teste.destaques
import { montarTelaDeNoticias, prepararEstado, propriaNoSite, texto } from './noticias-montagem.js';
import { noticiasDeExemplo } from './noticias-exemplo.js';
import { noticiasPropriasDeExemplo } from './noticias-proprias-exemplo.js';

async function mostrar(opcoes = {}) {
    // opcoes.noticias: a sua lista (para pôr notícias do Futuro+ na aba No
    // site, por exemplo: status 'aprovada' e propria: true)
    let noticias = opcoes.noticias || noticiasDeExemplo();
    if (opcoes.comPropria) noticias = [propriaNoSite(), ...noticias];

    if (opcoes.pendentes !== undefined) {
        const modelo = noticias.filter((n) => n.status === 'pendente');
        const pendentes = Array.from({ length: opcoes.pendentes }, (_, i) => ({
            ...structuredClone(modelo[i % modelo.length]),
            id: `p${String(i + 1).padStart(3, '0')}`
        }));
        noticias = [...pendentes, ...noticias.filter((n) => n.status !== 'pendente')];
    }

    const propriasPendentes = opcoes.propriasPendentes
        ?? [...noticiasPropriasDeExemplo().proprias.values()].filter((n) => n.status === 'pendente');
    const teste = prepararEstado({
        noticias, demora: opcoes.demora, logado: opcoes.logado, admin: opcoes.admin, semColeta: opcoes.semColeta,
        propriasPendentes, destaques: opcoes.destaques
    });
    teste.mostrar = mostrar;
    teste.texto = texto;

    // o painel pergunta antes de recusar várias de uma vez; aqui sempre "sim"
    window.confirm = () => true;

    // Atenção: com { logado: false } o painel vai para login.html de verdade
    // (é o que ele deve fazer). Para testar outra coisa depois, volte a
    // /404.html e carregue este roteiro de novo.
    await montarTelaDeNoticias('/admin-noticias.html', 'admin-noticias.js');
    const contar = (status) => noticias.filter((n) => n.status === status).length;
    return `${contar('pendente')} pendentes, ${contar('aprovada')} no site, ${contar('recusada')} recusadas`;
}

await mostrar();
