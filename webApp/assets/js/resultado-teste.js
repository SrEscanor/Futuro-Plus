import { doc, setDoc } from "firebase/firestore";
import { db } from "./firebase-config.js";

const CHAVE_RESULTADO_PENDENTE = "resultadoTestePendente";

// Guarda o resultado no navegador quando a pessoa faz o teste deslogada,
// pra poder vincular ao perfil assim que ela criar conta ou logar.
// "chaveTeste" identifica QUAL teste é (ex: "gardner", "afinidades"),
// pra um teste não sobrescrever o resultado do outro.
export function salvarResultadoPendente(chaveTeste, dadosResultado) {
    localStorage.setItem(
        CHAVE_RESULTADO_PENDENTE,
        JSON.stringify({ chaveTeste, dadosResultado })
    );
}

export function lerResultadoPendente() {
    const bruto = localStorage.getItem(CHAVE_RESULTADO_PENDENTE);
    return bruto ? JSON.parse(bruto) : null;
}

export function limparResultadoPendente() {
    localStorage.removeItem(CHAVE_RESULTADO_PENDENTE);
}

// Salva em usuarios/{uid}.resultadosTestes.{chaveTeste} — o caminho com
// ponto é o jeito do Firestore mesclar só essa chave do mapa, sem apagar
// o resultado de outros testes que já estejam salvos ali.
export async function salvarResultadoNoPerfil(uid, chaveTeste, dadosResultado) {
    await setDoc(
        doc(db, "usuarios", uid),
        { [`resultadosTestes.${chaveTeste}`]: dadosResultado },
        { merge: true }
    );
}

// Quando existir mais de um teste feito, vale sempre o mais recente
// (comparando a data de conclusão de cada um).
export function extrairResultadoMaisRecente(dadosUsuario) {
    // "resultadoTesteGardner" era o nome antigo (de antes de suportar
    // vários testes). Quem fez o teste naquela época ainda tem o
    // resultado guardado só ali — incluímos ele pra não "sumir".
    const resultadosTestes = {
        ...(dadosUsuario?.resultadosTestes || {}),
        ...(dadosUsuario?.resultadoTesteGardner && !dadosUsuario?.resultadosTestes?.gardner
            ? { gardner: dadosUsuario.resultadoTesteGardner }
            : {})
    };

    return Object.values(resultadosTestes).reduce((maisRecente, atual) =>
        !maisRecente || atual.concluidoEm > maisRecente.concluidoEm ? atual : maisRecente
    , null);
}

// Chamado logo após login/cadastro: se existir um resultado pendente
// (feito antes de logar), vincula ele ao perfil que acabou de autenticar.
export async function integrarResultadoPendenteComPerfil(uid) {
    const pendente = lerResultadoPendente();
    if (!pendente) return false;

    await salvarResultadoNoPerfil(uid, pendente.chaveTeste, pendente.dadosResultado);
    limparResultadoPendente();
    return true;
}
