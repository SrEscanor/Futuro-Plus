// Fotos da fachada das unidades, tiradas do site do Centro Paula Souza.
//
// O site do CPS (WordPress) tem uma API pública que lista as Etecs e as
// Fatecs com a foto de cada uma. O botão "Buscar fotos no site do CPS"
// (Admin · Unidades) lê essa lista, acha cada unidade pelo nome e grava em
// instituicoes/{id} o endereço da foto (foto: { url, largura, altura }) e o
// da página da unidade no CPS (paginaCps). A imagem continua no servidor do
// CPS: o Futuro+ guarda só o link, e a página da instituição mostra.
import { normalizar } from './card-unidade.js';

const API_CPS = 'https://www.cps.sp.gov.br/wp-json/wp/v2';
const TIPOS = ['etecs', 'fatecs'];
const POR_PAGINA = 100;
const LARGURA_BOA = 1000;     // a capa da página ocupa até ~860 px de largura
// Acima disso o arquivo fica pesado demais para uma capa (uma Fatec só tem a
// foto original, com 10.301 px): melhor a ilustração padrão.
const LARGURA_MAXIMA = 3000;

// Os títulos vêm com entidades do HTML ("Fatec Praia Grande &#8211; Maracanã").
export function textoDoTitulo(html) {
    const nomes = { amp: '&', nbsp: ' ', quot: '"', apos: "'", lt: '<', gt: '>', ndash: '–', mdash: '—' };
    return String(html || '')
        .replace(/<[^>]*>/g, '')
        .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
        .replace(/&#(\d+);/g, (_, numero) => String.fromCodePoint(Number(numero)))
        .replace(/&([a-z]+);/gi, (inteira, nome) => nomes[nome.toLowerCase()] ?? inteira)
        .replace(/\s+/g, ' ')
        .trim();
}

// Das versões que o CPS guarda da foto (até 3000 px), a menor com pelo menos
// 1000 px de largura; se nenhuma chega lá, a maior. Só https.
export function melhorFoto(midia) {
    const detalhes = midia?.media_details || {};
    const versoes = Object.values(detalhes.sizes || {})
        .map((v) => ({ url: v.source_url, largura: v.width, altura: v.height }));
    if (midia?.source_url) versoes.push({ url: midia.source_url, largura: detalhes.width, altura: detalhes.height });
    const aceitas = versoes.filter((v) => /^https:\/\//i.test(v.url || '')
        && v.largura > 0 && v.altura > 0 && v.largura <= LARGURA_MAXIMA);
    if (!aceitas.length) return null;
    const grandes = aceitas.filter((v) => v.largura >= LARGURA_BOA).sort((a, b) => a.largura - b.largura);
    return grandes[0] || aceitas.sort((a, b) => b.largura - a.largura)[0];
}

// Todas as unidades do site do CPS: 4 ou 5 consultas para as 324.
// buscar: o fetch (trocável nos testes).
export async function listarUnidadesDoCps(buscar = fetch) {
    const itens = [];
    for (const tipo of TIPOS) {
        for (let pagina = 1; pagina <= 20; pagina++) {
            const url = `${API_CPS}/${tipo}?per_page=${POR_PAGINA}&page=${pagina}`
                + '&_embed=wp:featuredmedia&_fields=id,title,link,_links,_embedded';
            const resposta = await buscar(url);
            if (!resposta.ok) throw new Error(`o site do CPS respondeu ${resposta.status}`);
            const lista = await resposta.json();
            itens.push(...lista.map((item) => ({
                nome: textoDoTitulo(item.title?.rendered),
                pagina: item.link || '',
                midia: item._embedded?.['wp:featuredmedia']?.[0] || null
            })));
            const paginas = Number(resposta.headers.get('X-WP-TotalPages')) || 1;
            if (pagina >= paginas || lista.length < POR_PAGINA) break;
        }
    }
    return itens;
}

// unidades: as do Firestore ({ id, nome, foto, paginaCps }); itensCps: o que
// listarUnidadesDoCps devolveu. Devolve só o que muda ([{ id, foto,
// paginaCps }]; foto null quando o CPS não tem foto da unidade) e os nomes
// que não acharam par no site do CPS.
export function casarFotos(unidades, itensCps) {
    const porNome = new Map(itensCps.map((item) => [normalizar(item.nome), item]));
    const mudancas = [];
    const semPar = [];
    for (const unidade of unidades) {
        const item = porNome.get(normalizar(unidade.nome));
        if (!item) {
            semPar.push(unidade.nome);
            continue;
        }
        const foto = melhorFoto(item.midia);
        const paginaCps = /^https:\/\//i.test(item.pagina) ? item.pagina : '';
        const mesmaFoto = (unidade.foto?.url || '') === (foto?.url || '');
        if (mesmaFoto && (unidade.paginaCps || '') === paginaCps) continue;
        mudancas.push({ id: unidade.id, foto, paginaCps });
    }
    return { mudancas, semPar };
}
