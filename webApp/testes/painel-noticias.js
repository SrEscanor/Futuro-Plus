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
import { montarTelaDeNoticias, prepararEstado, texto } from './noticias-montagem.js';
import { noticiasDeExemplo } from './noticias-exemplo.js';

async function mostrar(opcoes = {}) {
    let noticias = noticiasDeExemplo();

    if (opcoes.pendentes !== undefined) {
        const modelo = noticias.filter((n) => n.status === 'pendente');
        const pendentes = Array.from({ length: opcoes.pendentes }, (_, i) => ({
            ...structuredClone(modelo[i % modelo.length]),
            id: `p${String(i + 1).padStart(3, '0')}`
        }));
        noticias = [...pendentes, ...noticias.filter((n) => n.status !== 'pendente')];
    }

    const teste = prepararEstado({
        noticias, demora: opcoes.demora, logado: opcoes.logado, admin: opcoes.admin, semColeta: opcoes.semColeta
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
