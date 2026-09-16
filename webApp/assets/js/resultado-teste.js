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

// Chamado logo após login/cadastro: se existir um resultado pendente
// (feito antes de logar), vincula ele ao perfil que acabou de autenticar.
export async function integrarResultadoPendenteComPerfil(uid) {
    const pendente = lerResultadoPendente();
    if (!pendente) return false;

    await salvarResultadoNoPerfil(uid, pendente.chaveTeste, pendente.dadosResultado);
    limparResultadoPendente();
    return true;
}
