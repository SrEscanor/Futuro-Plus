// Monta a Início com o carrossel "Destaques para você" e as "Últimas
// notícias" lendo notícias de exemplo no lugar do Firestore. Os outros
// pedaços da Início (resultado do teste, cursos, mural...) ficam só no HTML,
// sem script: cada um falaria com o Firebase de verdade. Uso, a partir de
// http://localhost:5173/404.html:
//
//     await import('/testes/pagina-inicio.js');
//
// Já abre com duas notícias no carrossel (a do Futuro+ e uma de fora); a
// terceira vaga mostra o primeiro destaque padrão. Depois,
// window.teste.mostrar({ ... }) monta de novo com variações:
//
//     teste.mostrar({ destaques: [] })                     // nenhuma escolhida: os 3 padrão
//     teste.mostrar({ destaques: ['n09', 'n10', 'n12'] })  // três de fora (a n12 não tem foto)
//     teste.mostrar({ destaques: ['n15'] })               // foto que não carrega: capa desenhada
//     teste.mostrar({ destaques: ['sumiu', 'n09'] })      // uma saiu do site: fica de fora
//     teste.mostrar({ destaques: ['np-agendada'] })       // agendada: só entra na hora
//     teste.mostrar({ falhar: true })                       // erro ao ler: os 3 padrão
//     teste.mostrar({ demora: 3000 })                       // resposta lenta: o esqueleto
import { conferirQueACopiaEstaCompleta, prepararEstado, propriaNoSite, texto } from './noticias-montagem.js';
import { noticiasDeExemplo } from './noticias-exemplo.js';

const SCRIPTS = ['inicio-destaques.js', 'inicio-noticias.js'];

async function montarInicioSemScripts() {
    const html = await (await fetch('/index.html')).text();
    const semScripts = html.replace(/<script type="module"[^>]*><\/script>/g, '');
    if (/<script type="module"/.test(semScripts)) throw new Error('sobrou um script na Início');
    document.open();
    document.write(semScripts);
    document.close();
    await new Promise((r) => setTimeout(r, 600));
}

// O módulo da Início com o import de noticias-dados.js trocado pela cópia
// de mentira (ver noticias-montagem.js).
async function carregarModulo(nome) {
    let codigo = await (await fetch(`/assets/js/${nome}?t=${Date.now()}`)).text();
    const antes = codigo;
    codigo = codigo.replace(/from "\/assets\/js\/noticias-dados\.js[^"]*"/, 'from "/testes/noticias-dados-simulado.js"');
    if (codigo === antes) throw new Error(`${nome} não importa ./noticias-dados.js`);
    if (/firebase/.test(codigo.replace(/\/\/.*$/gm, ''))) {
        throw new Error(`${nome} importa o Firebase direto; o acesso deve passar por noticias-dados.js`);
    }
    codigo = codigo.replace(/from "\//g, `from "${location.origin}/`);
    await import(URL.createObjectURL(new Blob([codigo], { type: 'text/javascript' })));
}

async function mostrar(opcoes = {}) {
    // as duas do Futuro+ que estão na coleção do site (a agendada só aparece na hora)
    const noticias = [propriaNoSite('np-publicada'), propriaNoSite('np-agendada'), ...noticiasDeExemplo()];
    const teste = prepararEstado({
        noticias,
        demora: opcoes.demora,
        falhar: opcoes.falhar ? 'listar' : null,
        destaques: opcoes.destaques ?? ['np-publicada', 'n10']
    });
    teste.mostrar = mostrar;
    teste.texto = texto;

    await conferirQueACopiaEstaCompleta();
    await montarInicioSemScripts();
    for (const nome of SCRIPTS) await carregarModulo(nome);

    // tempo de ler a lista (a cópia de mentira demora de propósito) e desenhar
    await new Promise((r) => setTimeout(r, (teste.demora ?? 250) * 2 + 900));
    const titulos = [...document.querySelectorAll('#destaques-trilho .destaque-titulo-item')].map((h) => h.textContent);
    return titulos.length ? titulos : 'carrossel ainda carregando';
}

await mostrar();
