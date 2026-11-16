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
import { prepararGravacao } from '../assets/js/noticias-proprias-util.js';
import { detalheComSaidaDoCarrossel, mudarListaDeDestaques } from '../assets/js/destaques-util.js';

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

// Como no site: a notícia que sai do site sai do carrossel, com o registro
// no histórico do painel Notícias. Devolve true se ela estava lá.
function tirarDoCarrossel(id, titulo, motivo) {
    const mudanca = mudarListaDeDestaques(estado().destaques?.itens || [], 'tirar', { id, titulo }, { motivo });
    if (!mudanca) return false;
    estado().destaques = {
        itens: mudanca.itens, atualizadoEm: new Date().toISOString(), atualizadoPor: estado().email || 'admin@teste'
    };
    const historico = estado().historicoNoticias || (estado().historicoNoticias = []);
    historico.push({
        id: `hn${historico.length + 1}`, noticiaId: id, titulo: mudanca.titulo, acao: mudanca.acao,
        detalhe: mudanca.detalhe, email: estado().email || 'admin@teste', uid: 'u1', em: new Date().toISOString()
    });
    estado().gravacoes.push(['destaques', 'tirar', id, mudanca.itens.map((item) => item.id)]);
    return true;
}

export async function salvarNoticiaPropria(noticia, acao, opcoes = {}) {
    await chamada('gravar');
    const id = noticia.id || novoId();
    const { registro, publica, acaoHistorico, detalhe } = prepararGravacao(
        noticia, acao, opcoes, { email: estado().email || 'admin@teste' });
    const saiuDoCarrossel = publica === null ? tirarDoCarrossel(id, registro.titulo, 'saiu do site') : undefined;
    estado().proprias.set(id, { id, ...copia(registro) });
    if (publica) estado().publicadas.set(id, { id, ...copia(publica) });
    else if (publica === null) estado().publicadas.delete(id);
    registrar(id, registro.titulo, acaoHistorico, saiuDoCarrossel ? detalheComSaidaDoCarrossel(acaoHistorico, detalhe) : detalhe);
    estado().gravacoes.push([acao, id, registro.status]);
    return publica === null ? { id, ...copia(registro), saiuDoCarrossel } : { id, ...copia(registro) };
}

export async function excluirNoticiaPropria(noticia) {
    await chamada('gravar');
    const saiuDoCarrossel = tirarDoCarrossel(noticia.id, noticia.titulo, 'a notícia foi excluída');
    estado().proprias.delete(noticia.id);
    estado().publicadas.delete(noticia.id);
    registrar(noticia.id, noticia.titulo, 'excluiu', saiuDoCarrossel ? detalheComSaidaDoCarrossel('excluiu') : '');
    estado().gravacoes.push(['excluir', noticia.id]);
    return { saiuDoCarrossel };
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
