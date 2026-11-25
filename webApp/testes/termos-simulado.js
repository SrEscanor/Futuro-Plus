// Cópia de mentira de assets/js/termos-dados.js: as mesmas funções, mas os
// dados moram em window.teste e nada vai para o Firebase. O roteiro
// painel-termos.js troca o import da tela por este arquivo.
//
//   teste.documentos   { termos, privacidade }: o que está no ar, cada um
//                      { versao, html, atualizadoEm, atualizadoPorEmail } ou
//                      null (nunca publicado)
//   teste.historico    lista de registros { id, documento, titulo, acao,
//                      versao, versaoAnterior, html, email, uid, em }
//   teste.gravacoes    o que a tela mandou gravar, na ordem
//   teste.falhar       'listar', 'publicar' ou 'senha': essas chamadas dão erro
//   teste.senha        a senha certa (padrão 'segredo')
//   teste.demora       milissegundos de cada chamada (padrão 200)
//   teste.logado / teste.admin / teste.google / teste.email
export const DOCUMENTOS = {
    termos: { colecaoId: 'termos-de-uso', titulo: 'Termos de Uso' },
    privacidade: { colecaoId: 'politica-privacidade', titulo: 'Política de Privacidade' }
};

const estado = () => window.teste;
const copia = (valor) => structuredClone(valor);

async function chamada(tipo) {
    await new Promise((r) => setTimeout(r, estado().demora ?? 200));
    if (estado().falhar === tipo) throw new Error(`Falha simulada ao ${tipo}.`);
}

export function observarAdmin(aoMudar) {
    setTimeout(() => {
        const usuario = estado().logado === false ? null : { email: estado().email || 'admin@teste', uid: 'u1' };
        aoMudar({ usuario, ehAdmin: Boolean(usuario) && estado().admin !== false, entrouComGoogle: Boolean(estado().google) });
    }, 60);
    return () => {};
}

export async function sairDaConta() {
    estado().gravacoes.push(['sair']);
}

export async function confirmarIdentidade(senha) {
    await chamada('senha');
    if (estado().google) return;
    if (!senha) throw Object.assign(new Error('Senha necessária'), { code: 'senha-necessaria' });
    if (senha !== (estado().senha || 'segredo')) throw Object.assign(new Error('Senha errada'), { code: 'auth/wrong-password' });
}

export async function lerDocumento(chave) {
    await chamada('listar');
    const noAr = estado().documentos[chave];
    return noAr ? copia(noAr) : null;
}

export async function listarHistoricoPagina({ quantos = 100, depois = null } = {}) {
    await chamada('listar');
    const todos = estado().historico.map(copia).sort((a, b) => String(b.em).localeCompare(String(a.em)));
    const inicio = depois || 0;
    return { registros: todos.slice(inicio, inicio + quantos), cursor: inicio + quantos, haMais: todos.length > inicio + quantos };
}

// Como no site: confere que ninguém publicou desde que o texto foi carregado
// (teste.outraPublicacao simula outra pessoa publicando antes) e grava tudo
// de uma vez.
export async function publicarDocumentos(lista) {
    await chamada('publicar');
    for (const { chave, versaoBase } of lista) {
        const noAr = estado().documentos[chave]?.versao || 0;
        if (noAr !== versaoBase) {
            throw Object.assign(new Error(`Outra pessoa publicou uma versão nova de ${DOCUMENTOS[chave].titulo}.`),
                { code: 'versao-mudou', titulo: DOCUMENTOS[chave].titulo });
        }
    }
    const agora = new Date().toISOString();
    const novas = {};
    for (const { chave, html, versaoBase } of lista) {
        const versao = versaoBase + 1;
        novas[chave] = versao;
        estado().documentos[chave] = { versao, html, atualizadoEm: agora, atualizadoPorEmail: estado().email || 'admin@teste' };
        estado().historico.push({
            id: `t${estado().historico.length + 1}`, documento: chave, titulo: DOCUMENTOS[chave].titulo, acao: 'publicou',
            versao, versaoAnterior: versaoBase, html, email: estado().email || 'admin@teste', uid: 'u1', em: agora
        });
    }
    estado().gravacoes.push(['publicar', lista.map(({ chave }) => `${chave}:${novas[chave]}`)]);
    return novas;
}
