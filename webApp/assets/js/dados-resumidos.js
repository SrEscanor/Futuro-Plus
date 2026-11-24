// Listas resumidas das unidades e dos cursos, servidas pela função
// dados_resumidos (functions/main.py) em /dados/unidades.json e
// /dados/cursos.json, com 1h de cache na rede do Firebase.
//
// Antes, cada visita à Início, ao catálogo, à lista de instituições, à
// página de um curso ou ao Teste Vocacional lia as 324 unidades ou os 363
// cursos direto do Firestore: a cota grátis de leituras (50 mil por dia)
// acabava em umas 150 visitas. Agora essas páginas leem a lista pronta.
//
// Se a lista não vier (no "npm run dev", que não tem a função, ou se ela
// falhar), lê do Firestore como antes, então nada deixa de funcionar.
import { collection, getDocs } from 'firebase/firestore';
import { db } from './firebase-config.js';

const pedidos = new Map();

async function doFirestore(colecao) {
    const snap = await getDocs(collection(db, colecao));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

function carregar(colecao, endereco, chave) {
    if (!pedidos.has(colecao)) {
        const pedido = fetch(endereco)
            .then((resposta) => {
                if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`);
                return resposta.json();
            })
            .then((dados) => {
                if (!Array.isArray(dados?.[chave])) throw new Error('formato inesperado');
                return dados[chave];
            })
            .catch(() => doFirestore(colecao));
        pedidos.set(colecao, pedido);
        // se até o Firestore falhar, a próxima chamada tenta de novo
        pedido.catch(() => pedidos.delete(colecao));
    }
    // cópia de cada item: uma página que acrescente algo num objeto (a
    // distância, por exemplo) não muda o que outra parte da mesma página lê
    return pedidos.get(colecao).then((lista) => lista.map((item) => ({ ...item })));
}

// [{ id, nome, tipo, municipio, regiao, logotipoUrl, localizacao, cursos: [{ nome, categoria }] }]
export const carregarUnidades = () => carregar('instituicoes', '/dados/unidades.json', 'unidades');

// [{ id, nome, nivel, eixos, duracao, descricao, demanda, ... }], sem as matrizes
export const carregarCursos = () => carregar('cursos', '/dados/cursos.json', 'cursos');
