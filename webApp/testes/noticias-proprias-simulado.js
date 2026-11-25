// Cópia de mentira de assets/js/noticias-proprias-dados.js: as mesmas
// funções, mas os dados moram em window.teste e nada vai para o Firebase. Os
// roteiros painel-noticias-proprias.js e pagina-noticia.js trocam o import
// das telas por este arquivo.
//
// O que muda de estado usa a mesma prepararGravacao() do site, então o teste
// confere a regra de verdade (rascunho, agendada, publicada, histórico).
//
//   teste.proprias     Map id -> notícia completa (o que o painel guarda)
//   teste.publicadas   Map id -> cópia pública (o que o site lê)
//   teste.historico    lista de registros { noticiaId, titulo, acao, detalhe, email, uid, em }
//   teste.gravacoes    o que as telas mandaram gravar, na ordem
//   teste.falhar       'listar', 'gravar' ou 'imagem': as chamadas desse tipo dão erro
//   teste.demora       milissegundos de cada chamada (padrão 200)
//   teste.logado / teste.admin / teste.email
//   teste.destaques    o carrossel da Início { itens: [{ id, titulo }] } (null =
//                      nunca mexeram); a notícia que sai do site sai dele, e
//                      essa saída vai para teste.historicoNoticias (o
//                      histórico do painel Notícias)
//   teste.fixadas      as fixadas da página Notícias, no mesmo formato e com
//                      a mesma regra; o Blog também fixa e desafixa
import { prepararGravacao } from '../assets/js/noticias-proprias-util.js';
import {
    detalheComSaidaDasListas, itensDasFixadas, mudarListaDeDestaques, mudarListaDeFixadas
} from '../assets/js/destaques-util.js';

const estado = () => window.teste;
let contador = 0;

async function chamada(tipo) {
    await new Promise((r) => setTimeout(r, estado().demora ?? 200));
    if (estado().falhar === tipo) throw new Error(`Falha simulada ao ${tipo}.`);
}

const copia = (valor) => structuredClone(valor);

export function observarAdmin(aoMudar) {
    setTimeout(() => {
        const usuario = estado().logado === false ? null : { email: estado().email || 'admin@teste', uid: 'u1' };
        aoMudar({ usuario, ehAdmin: Boolean(usuario) && estado().admin !== false });
    }, 60);
    return () => {};
}

export async function sairDaConta() {
    estado().gravacoes.push(['sair']);
}

export function novoId() {
    contador += 1;
    return `nova-${Date.now().toString(36)}-${contador}`;
}

export async function listarNoticiasProprias() {
    await chamada('listar');
    return [...estado().proprias.values()].map(copia)
        .sort((a, b) => String(b.alteradaEm || '').localeCompare(String(a.alteradaEm || '')));
}

export async function lerNoticiaPropria(id) {
    await chamada('listar');
    const noticia = estado().proprias.get(id);
    return noticia ? copia(noticia) : null;
}

export async function lerNoticiaPublicada(id) {
    await chamada('listar');
    const noticia = estado().publicadas.get(id);
    return noticia ? copia(noticia) : null;
}

export async function listarHistorico({ noticiaId, quantos = 100 } = {}) {
    await chamada('listar');
    return estado().historico
        .filter((registro) => !noticiaId || registro.noticiaId === noticiaId)
        .sort((a, b) => String(b.em).localeCompare(String(a.em)))
        .slice(0, quantos)
        .map(copia);
}

export async function listarHistoricoPagina({ quantos = 100, depois = null } = {}) {
    await chamada('listar');
    const todos = estado().historico.map(copia).sort((a, b) => String(b.em).localeCompare(String(a.em)));
    const inicio = depois || 0;
    return { registros: todos.slice(inicio, inicio + quantos), cursor: inicio + quantos, haMais: todos.length > inicio + quantos };
}

function registrar(noticiaId, titulo, acao, detalhe = '') {
    estado().historico.push({
        id: `h${estado().historico.length + 1}`,
        noticiaId,
        titulo: titulo || '(sem título)',
        acao,
        detalhe,
        email: estado().email || 'admin@teste',
        uid: 'u1',
        em: new Date().toISOString()
    });
}

// Uma mudança no carrossel (teste.destaques) ou nas fixadas (teste.fixadas),
// com o registro no histórico do painel Notícias, como no site. Devolve a
// mudança (null se nada mudou).
function mudarLista(qual, mudar, acao, noticia, motivo = '') {
    const mudanca = mudar(estado()[qual]?.itens || [], acao, noticia, { motivo });
    if (!mudanca) return null;
    estado()[qual] = {
        itens: mudanca.itens, atualizadoEm: new Date().toISOString(), atualizadoPor: estado().email || 'admin@teste'
    };
    const historico = estado().historicoNoticias || (estado().historicoNoticias = []);
    historico.push({
        id: `hn${historico.length + 1}`, noticiaId: noticia.id, titulo: mudanca.titulo, acao: mudanca.acao,
        detalhe: mudanca.detalhe, email: estado().email || 'admin@teste', uid: 'u1', em: new Date().toISOString()
    });
    estado().gravacoes.push([qual, acao, noticia.id, mudanca.itens.map((item) => item.id)]);
    return mudanca;
}

// Como no site: a notícia que sai do site sai do carrossel e das fixadas.
// Devolve de onde ela saiu: { carrossel, fixadas }.
function tirarDasListas(id, titulo, motivo) {
    return {
        carrossel: Boolean(mudarLista('destaques', mudarListaDeDestaques, 'tirar', { id, titulo }, motivo)),
        fixadas: Boolean(mudarLista('fixadas', mudarListaDeFixadas, 'tirar', { id, titulo }, motivo))
    };
}

// As fixadas da página Notícias; a notícia de cada uma vem de teste.publicadas.
export async function lerFixadas() {
    await chamada('listar');
    const dados = estado().fixadas || {};
    return {
        itens: itensDasFixadas(dados.itens).map((item) => {
            const publicada = estado().publicadas.get(item.id);
            return { ...item, noticia: publicada ? { id: item.id, ...copia(publicada) } : null };
        }),
        atualizadoEm: dados.atualizadoEm || null,
        atualizadoPor: dados.atualizadoPor || ''
    };
}

export async function mudarFixadas(acao, noticia, opcoes = {}) {
    await chamada('gravar');
    const itens = itensDasFixadas(estado().fixadas?.itens);
    const mudanca = mudarLista('fixadas', mudarListaDeFixadas, acao, noticia, opcoes.motivo || '');
    return copia(mudanca ? mudanca.itens : itens);
}

export async function salvarNoticiaPropria(noticia, acao, opcoes = {}) {
    await chamada('gravar');
    const id = noticia.id || novoId();
    const { registro, publica, acaoHistorico, detalhe } = prepararGravacao(
        noticia, acao, opcoes, { email: estado().email || 'admin@teste' });
    const saiu = publica === null ? tirarDasListas(id, registro.titulo, 'saiu do site') : {};
    estado().proprias.set(id, { id, ...copia(registro) });
    if (publica) estado().publicadas.set(id, { id, ...copia(publica) });
    else if (publica === null) estado().publicadas.delete(id);
    registrar(id, registro.titulo, acaoHistorico, detalheComSaidaDasListas(acaoHistorico, detalhe, saiu));
    estado().gravacoes.push([acao, id, registro.status]);
    return publica === null
        ? { id, ...copia(registro), saiuDoCarrossel: saiu.carrossel, saiuDasFixadas: saiu.fixadas }
        : { id, ...copia(registro) };
}

export async function excluirNoticiaPropria(noticia) {
    await chamada('gravar');
    const saiu = tirarDasListas(noticia.id, noticia.titulo, 'a notícia foi excluída');
    estado().proprias.delete(noticia.id);
    estado().publicadas.delete(noticia.id);
    registrar(noticia.id, noticia.titulo, 'excluiu', detalheComSaidaDasListas('excluiu', '', saiu));
    estado().gravacoes.push(['excluir', noticia.id]);
    return { saiuDoCarrossel: saiu.carrossel, saiuDasFixadas: saiu.fixadas };
}

// Não sobe nada: devolve uma das ilustrações do próprio site.
export async function enviarImagemNoticia(noticiaId, arquivo) {
    await chamada('imagem');
    if (!arquivo?.type?.startsWith('image/')) throw new Error('O arquivo não é uma imagem (use JPG, PNG ou WebP).');
    const imagens = ['cursos-formatura.webp', 'central-cps.webp', 'cerebro-testes.webp'];
    estado().gravacoes.push(['imagem', noticiaId, arquivo.name]);
    contador += 1;
    return `${location.origin}/${imagens[contador % imagens.length]}?n=${contador}`;
}
