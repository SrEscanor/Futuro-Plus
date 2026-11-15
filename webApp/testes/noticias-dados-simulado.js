// Cópia de mentira de assets/js/noticias-dados.js: as mesmas funções, mas os
// dados moram em window.teste e nada vai para o Firestore. Os roteiros
// pagina-noticias.js e painel-noticias.js trocam o import das telas por este
// arquivo (ver noticias-montagem.js).
//
// O estado fica em window.teste, não em variável daqui, porque o Vite às
// vezes carrega o mesmo arquivo duas vezes com endereços diferentes:
//
//   teste.noticias    lista com tudo o que "a coleta trouxe"; cada item tem
//                     "status" (pendente, aprovada ou recusada)
//   teste.gravacoes   o que as telas mandaram gravar, na ordem
//   teste.falhar      'listar', 'gravar' ou 'buscar': as chamadas desse tipo
//                     dão erro (null desliga)
//   teste.demora      milissegundos que cada chamada espera (padrão 250)
//   teste.ultimaColeta   o resumo da última busca (null = nunca rodou)
//   teste.proximasNovas  quantas notícias a próxima busca "acha" (padrão 2)
//   teste.logado / teste.admin   quem observarAdmin() diz que entrou
import { INSTITUICOES, imagemSegura, linkSeguro } from '../assets/js/noticias-util.js';

export const LIMITE_TITULO = 200;
export const LIMITE_RESUMO = 400;

const estado = () => window.teste;
const maisNovaPrimeiro = (a, b) => (b.publicadaEm || '').localeCompare(a.publicadaEm || '');
const copia = (noticia) => structuredClone(noticia);
const etiquetasValidas = (lista) => (Array.isArray(lista) ? lista : []).filter((id) => id in INSTITUICOES);

async function chamada(tipo) {
    await new Promise((r) => setTimeout(r, estado().demora ?? 250));
    if (estado().falhar === tipo) throw new Error(`Falha simulada ao ${tipo}.`);
}

function publica(noticia) {
    const { id, titulo, resumo, link, imagem, fonte, instituicoes, publicadaEm, aprovadaEm } = noticia;
    const base = { id, titulo, resumo, link, imagem, fonte, instituicoes: [...(instituicoes || [])], publicadaEm, aprovadaEm };
    // notícia própria (painel Admin · Notícias próprias): vai com o resto do texto
    return noticia.propria ? { ...copia(noticia), ...base } : base;
}

const guardada = (noticia) => estado().noticias.find((n) => n.id === noticia.id);

export async function listarNoticiasPublicadas(limite = 60) {
    await chamada('listar');
    // a agendada (notícia própria) só aparece quando chega a hora, como no site
    const agora = new Date().toISOString();
    return estado().noticias
        .filter((n) => n.status === 'aprovada' && (!n.publicarEm || n.publicarEm <= agora))
        .sort(maisNovaPrimeiro).slice(0, limite).map(publica);
}

export async function listarFila(status) {
    if (status === 'aprovada') {
        return (await listarNoticiasPublicadas(200)).map((noticia) => ({ ...noticia, status: 'aprovada' }));
    }
    await chamada('listar');
    const lista = estado().noticias.filter((n) => n.status === status).map(copia);
    return status === 'recusada'
        ? lista.sort((a, b) => (b.recusadaEm || '').localeCompare(a.recusadaEm || ''))
        : lista.sort(maisNovaPrimeiro);
}

export async function contarFila() {
    await chamada('listar');
    const contar = (status) => estado().noticias.filter((n) => n.status === status).length;
    return { pendente: contar('pendente'), aprovada: contar('aprovada'), recusada: contar('recusada') };
}

async function mudarStatus(acao, noticias, status) {
    await chamada('gravar');
    const agora = new Date().toISOString();
    noticias.forEach((noticia) => {
        const alvo = guardada(noticia);
        if (!alvo) return;
        alvo.status = status;
        alvo.revisadaEm = agora;
        alvo.revisadaPor = 'admin@teste';
        if (status === 'aprovada') alvo.aprovadaEm = agora;
        if (status === 'recusada') alvo.recusadaEm = agora;
        else delete alvo.recusadaEm;
    });
    estado().gravacoes.push([acao, noticias.map((n) => n.id)]);
}

export async function aprovarNoticias(noticias) {
    const semLink = noticias.find((noticia) => !linkSeguro(noticia.link));
    if (semLink) throw new Error(`A notícia "${semLink.titulo || semLink.id}" está sem um link válido.`);
    await mudarStatus('aprovar', noticias, 'aprovada');
}

export async function recusarNoticias(noticias) {
    await mudarStatus('recusar', noticias, 'recusada');
}

export async function devolverParaPendentes(noticias) {
    await mudarStatus('devolver', noticias, 'pendente');
}

export async function salvarEdicao(noticia, campos) {
    const titulo = String(campos.titulo || '').trim();
    if (!titulo) throw new Error('A notícia precisa de um título.');

    const imagemDigitada = String(campos.imagem || '').trim();
    if (imagemDigitada && !imagemSegura(imagemDigitada)) {
        throw new Error('O endereço da imagem precisa começar com https://');
    }

    await chamada('gravar');
    const novos = {
        titulo: titulo.slice(0, LIMITE_TITULO),
        resumo: String(campos.resumo || '').trim().slice(0, LIMITE_RESUMO),
        imagem: imagemSegura(imagemDigitada),
        instituicoes: etiquetasValidas(campos.instituicoes)
    };
    Object.assign(guardada(noticia) || {}, novos);
    estado().gravacoes.push(['editar', noticia.id, novos]);
    return { ...noticia, ...novos };
}

// A primeira busca traz teste.proximasNovas notícias (padrão 2); as seguintes,
// nenhuma. Uma das fontes sempre vem com erro, para o painel ter o que mostrar.
export async function buscarNoticiasAgora() {
    await chamada('buscar');
    const agora = new Date().toISOString();
    const novas = estado().proximasNovas ?? 2;
    estado().proximasNovas = 0;

    for (let i = 0; i < novas; i += 1) {
        estado().noticias.push({
            id: `busca-${Date.now()}-${i}`,
            titulo: i % 2 ? 'Fatec abre inscrições para cursos de curta duração gratuitos' : 'Etec divulga lista de classificados do Vestibulinho',
            resumo: i % 2 ? 'São 300 vagas em dez unidades.' : 'Matrículas começam na próxima semana.',
            link: `https://www.exemplo.sp.gov.br/noticias/recem-chegada-${i}/`,
            imagem: i % 2 ? '' : '/central-cps.webp',
            fonte: 'Centro Paula Souza',
            instituicoes: [i % 2 ? 'fatec' : 'etec'],
            publicadaEm: agora,
            coletadaEm: agora,
            status: 'pendente'
        });
    }

    estado().ultimaColeta = {
        coletadaEm: agora,
        origem: 'painel',
        novas,
        repetidas: 61,
        fontes: [
            { id: 'cps', nome: 'Centro Paula Souza', encontradas: 24, erro: null },
            { id: 'agenciasp-etec', nome: 'Agência SP · Etec', encontradas: 4, erro: null },
            { id: 'agenciasp-fatec', nome: 'Agência SP · Fatec', encontradas: 0, erro: 'o site respondeu com erro 500' },
            { id: 'google', nome: 'Google Notícias', encontradas: 31, erro: null }
        ]
    };
    estado().gravacoes.push(['buscar', novas]);
    return copia(estado().ultimaColeta);
}

export async function lerUltimaColeta() {
    await chamada('listar');
    return estado().ultimaColeta ? copia(estado().ultimaColeta) : null;
}

// As notícias próprias pendentes que o painel mostra no alto da aba
// Pendentes. Ficam em teste.propriasPendentes (lista; vazia se não houver).
export async function listarNoticiasPropriasPendentes() {
    await chamada('listar');
    return copia(estado().propriasPendentes || []);
}

// Apaga as recusadas com mais de 30 dias (no site quem faz é a função
// limpar_noticias_recusadas). Devolve { apagadas }.
export async function limparRecusadasAntigas() {
    await chamada('gravar');
    const limite = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();
    const antes = estado().noticias.length;
    estado().noticias = estado().noticias.filter((n) => !(n.status === 'recusada' && (n.recusadaEm || '') < limite));
    const apagadas = antes - estado().noticias.length;
    estado().gravacoes.push(['limpar-recusadas', apagadas]);
    return { apagadas };
}

export function observarAdmin(aoMudar) {
    setTimeout(() => {
        const usuario = estado().logado === false ? null : { email: 'admin@teste', uid: 'u1' };
        aoMudar({ usuario, ehAdmin: Boolean(usuario) && estado().admin !== false });
    }, 60);
    return () => {};
}

export async function sairDaConta() {
    estado().gravacoes.push(['sair']);
}
