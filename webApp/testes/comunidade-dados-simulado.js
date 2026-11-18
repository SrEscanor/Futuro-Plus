// Cópia de mentira de assets/js/comunidade-dados.js: as mesmas funções, mas
// os dados moram em window.teste e nada vai para o Firestore. O roteiro
// painel-comunidade.js troca o import do painel (e do contador do menu) por
// este arquivo.
//
//   teste.avisos      avisos_admin: avaliações e dúvidas novas
//   teste.historico   comunidade_historico
//   teste.vistosEm    avisosAdminVistosEm da conta (ISO ou '')
//   teste.gravacoes   o que o painel mandou gravar, na ordem
//   teste.falhar      'listar' ou 'gravar': as chamadas desse tipo dão erro
//   teste.demora      milissegundos de cada chamada (padrão 200)
//   teste.logado / teste.admin / teste.email
const estado = () => window.teste;
const copia = (valor) => structuredClone(valor);

async function chamada(tipo) {
    await new Promise((r) => setTimeout(r, estado().demora ?? 200));
    if (estado().falhar === tipo) throw new Error(`Falha simulada ao ${tipo}.`);
}

function pagina(lista, quantos, depois) {
    const todos = copia(lista).sort((a, b) => String(b.em).localeCompare(String(a.em)));
    const inicio = depois || 0;
    return { registros: todos.slice(inicio, inicio + quantos), cursor: inicio + quantos, haMais: todos.length > inicio + quantos };
}

export function observarAdmin(aoMudar) {
    setTimeout(() => {
        const usuario = estado().logado === false ? null : { email: estado().email || 'admin@teste', uid: 'u1' };
        aoMudar({ usuario, ehAdmin: Boolean(usuario) && estado().admin !== false, vistosEm: estado().vistosEm || '' });
    }, 60);
    return () => {};
}

export async function sairDaConta() {
    estado().gravacoes.push(['sair']);
}

export async function listarAvisos({ quantos = 30, depois = null } = {}) {
    await chamada('listar');
    return pagina(estado().avisos, quantos, depois);
}

export async function listarHistoricoPagina({ quantos = 100, depois = null } = {}) {
    await chamada('listar');
    estado().paginasLidas = (estado().paginasLidas || 0) + 1;
    return pagina(estado().historico, quantos, depois);
}

export async function marcarAvisosVistos() {
    await chamada('gravar');
    const agora = new Date().toISOString();
    estado().vistosEm = agora;
    estado().gravacoes.push(['vistos', agora]);
    return agora;
}

export function observarNovidades(aoContar) {
    setTimeout(() => {
        if (estado().logado === false || estado().admin === false) return;
        const vistos = estado().vistosEm || '';
        aoContar(estado().avisos.filter((a) => !vistos || a.em > vistos).length);
    }, 60);
    return () => {};
}
