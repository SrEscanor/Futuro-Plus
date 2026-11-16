// Cópia de mentira de assets/js/notificacoes-dados.js: as mesmas funções, mas
// os dados moram em window.teste e nada vai para o Firestore. O roteiro
// painel-notificacoes.js troca o import do painel por este arquivo.
//
//   teste.notificacoes   Map id -> notificação
//   teste.historico      lista de registros { notificacaoId, titulo, acao, detalhe, email, em }
//   teste.noticiasDoSite as notícias que dá para ligar a um aviso
//   teste.gravacoes      o que o painel mandou gravar, na ordem
//   teste.falhar         'listar' ou 'gravar': as chamadas desse tipo dão erro
//   teste.demora         milissegundos de cada chamada (padrão 200)
//   teste.logado / teste.admin / teste.email
const estado = () => window.teste;
const copia = (valor) => structuredClone(valor);
let contador = 0;

async function chamada(tipo) {
    await new Promise((r) => setTimeout(r, estado().demora ?? 200));
    if (estado().falhar === tipo) throw new Error(`Falha simulada ao ${tipo}.`);
}

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
    return `aviso-${Date.now().toString(36)}-${contador}`;
}

export async function listarNotificacoes() {
    await chamada('listar');
    return [...estado().notificacoes.values()].map(copia)
        .sort((a, b) => (b.criadoEm || '').localeCompare(a.criadoEm || ''));
}

function registrar(notificacaoId, titulo, { acao, detalhe = '' }) {
    estado().historico.push({
        id: `h${estado().historico.length + 1}`,
        notificacaoId,
        titulo: String(titulo || '').trim() || '(sem título)',
        acao,
        detalhe,
        email: estado().email || 'admin@teste',
        uid: 'u1',
        em: new Date().toISOString()
    });
}

export async function salvarNotificacao(id, dados, historico) {
    await chamada('gravar');
    estado().notificacoes.set(id, { id, ...copia(dados), criadoPor: dados.criadoPor || 'u1' });
    registrar(id, dados.titulo, historico);
    estado().gravacoes.push(['salvar', id, historico.acao]);
}

export async function excluirNotificacao(notificacao) {
    await chamada('gravar');
    estado().notificacoes.delete(notificacao.id);
    registrar(notificacao.id, notificacao.titulo, { acao: 'excluiu' });
    estado().gravacoes.push(['excluir', notificacao.id]);
}

export async function listarHistorico({ quantos = 100 } = {}) {
    await chamada('listar');
    return copia(estado().historico)
        .sort((a, b) => String(b.em).localeCompare(String(a.em)))
        .slice(0, quantos);
}

export async function listarNoticiasDoSite(quantas = 80) {
    await chamada('listar');
    const agora = new Date().toISOString();
    return copia(estado().noticiasDoSite)
        .filter((n) => !n.publicarEm || n.publicarEm <= agora)
        .sort((a, b) => String(b.publicadaEm || '').localeCompare(String(a.publicadaEm || '')))
        .slice(0, quantas);
}

export async function lerNoticiaDoSite(id) {
    await chamada('listar');
    const noticia = estado().noticiasDoSite.find((n) => n.id === id);
    return noticia ? copia(noticia) : null;
}
