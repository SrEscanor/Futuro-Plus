// Cópia de mentira de assets/js/instituicao-dados.js: as mesmas funções, mas
// os dados moram em window.teste e nada vai para o Firestore. O roteiro
// pagina-instituicao.js troca o import da página por este arquivo.
//
//   teste.unidade       o documento instituicoes/{id} (null = não existe)
//   teste.comentarios   Map uid -> comentário { texto, nota, nome, curso, ano, ... }
//   teste.perguntas     Map id -> pergunta { texto, autorUid, nome, criadaEm, respostas }
//   teste.conta         o que observarConta entrega: { logado: false } ou
//                       { logado, uid, nome, admin, certificado }
//   teste.gravacoes     o que a página mandou gravar, na ordem
//   teste.falhar        'ler' (as leituras dão erro), 'gravar' (erro de
//                       conexão) ou 'recusar' (as regras do Firestore negam)
//   teste.demora        milissegundos que cada chamada espera (padrão 150)
import { COMENTARIOS_POR_VEZ, PERGUNTAS_POR_VEZ } from '../assets/js/instituicao-util.js';

const estado = () => window.teste;
const copia = (valor) => structuredClone(valor);
const quando = (valor) => new Date(valor).getTime() || 0;

async function chamada(tipo) {
    await new Promise((r) => setTimeout(r, estado().demora ?? 150));
    if (estado().falhar === tipo) throw new Error(`Falha simulada ao ${tipo}.`);
    if (tipo === 'gravar' && estado().falhar === 'recusar') {
        const erro = new Error('Missing or insufficient permissions.');
        erro.code = 'permission-denied';
        throw erro;
    }
}

// mesma paginação da real: da mais nova para a mais antiga, cursor = o último mostrado
function pagina(lista, campo, chave, depois, quantos) {
    const ordenada = [...lista].sort((a, b) => quando(b[campo]) - quando(a[campo]));
    const inicio = depois ? ordenada.findIndex((item) => item[chave] === depois[chave]) + 1 : 0;
    const itens = ordenada.slice(inicio, inicio + quantos);
    return { itens, cursor: itens.length ? { [chave]: itens.at(-1)[chave] } : null, haMais: ordenada.length > inicio + quantos };
}

export async function lerUnidade(unidadeId) {
    await chamada('ler');
    const unidade = estado().unidade;
    return unidade && unidade.id === unidadeId ? copia(unidade) : null;
}

export async function lerAvaliacao() {
    await chamada('ler');
    const notas = [...estado().comentarios.values()].map((c) => c.nota);
    return { media: notas.length ? notas.reduce((a, b) => a + b, 0) / notas.length : 0, total: notas.length };
}

export async function lerComentarios(unidadeId, { depois = null } = {}) {
    await chamada('ler');
    const lista = [...estado().comentarios].map(([uid, comentario]) => ({ uid, ...copia(comentario) }));
    return pagina(lista, 'criadoEm', 'uid', depois, COMENTARIOS_POR_VEZ);
}

export async function lerMeuComentario(unidadeId, uid) {
    await chamada('ler');
    const comentario = estado().comentarios.get(uid);
    return comentario ? { uid, ...copia(comentario) } : null;
}

export async function salvarComentario(unidadeId, conta, { texto, nota }, existente = null) {
    await chamada('gravar');
    const campos = {
        texto: texto.trim(), nota, nome: conta.nome, curso: conta.certificado.titulo,
        ano: conta.certificado.anoConclusao ?? null, certificadoId: conta.certificado.id
    };
    const agora = new Date().toISOString();
    const salvo = existente
        ? { ...estado().comentarios.get(conta.uid), ...campos, editadoEm: agora }
        : { ...campos, criadoEm: agora };
    estado().comentarios.set(conta.uid, salvo);
    estado().gravacoes.push([existente ? 'editou comentário' : 'comentou', conta.uid, nota]);
    return { uid: conta.uid, ...copia(salvo) };
}

export async function apagarComentario(unidadeId, uid) {
    await chamada('gravar');
    estado().comentarios.delete(uid);
    estado().gravacoes.push(['apagou comentário', uid]);
}

export async function lerPerguntas(unidadeId, { depois = null } = {}) {
    await chamada('ler');
    const lista = [...estado().perguntas].map(([id, pergunta]) => ({ id, ...copia(pergunta) }));
    return pagina(lista, 'criadaEm', 'id', depois, PERGUNTAS_POR_VEZ);
}

export async function criarPergunta(unidadeId, conta, texto) {
    await chamada('gravar');
    const id = `q${Date.now()}`;
    const nova = { texto: texto.trim(), autorUid: conta.uid, nome: conta.nome, criadaEm: new Date().toISOString(), respostas: {} };
    estado().perguntas.set(id, nova);
    estado().gravacoes.push(['perguntou', id]);
    return { id, ...copia(nova) };
}

export async function responderPergunta(unidadeId, perguntaId, conta, texto) {
    await chamada('gravar');
    const resposta = conta.certificado
        ? {
            texto: texto.trim(), nome: conta.nome, curso: conta.certificado.titulo,
            ano: conta.certificado.anoConclusao ?? null, certificadoId: conta.certificado.id, equipe: false
        }
        : { texto: texto.trim(), nome: conta.nome, equipe: true };
    resposta.em = new Date().toISOString();
    estado().perguntas.get(perguntaId).respostas[conta.uid] = resposta;
    estado().gravacoes.push(['respondeu', perguntaId, conta.uid]);
    return copia(resposta);
}

export async function apagarResposta(unidadeId, perguntaId, uid) {
    await chamada('gravar');
    delete estado().perguntas.get(perguntaId).respostas[uid];
    estado().gravacoes.push(['apagou resposta', perguntaId, uid]);
}

export async function apagarPergunta(unidadeId, perguntaId) {
    await chamada('gravar');
    estado().perguntas.delete(perguntaId);
    estado().gravacoes.push(['apagou pergunta', perguntaId]);
}

export function observarConta(unidadeId, aoMudar) {
    setTimeout(() => aoMudar(copia(estado().conta)), estado().demora ?? 150);
    return () => {};
}
