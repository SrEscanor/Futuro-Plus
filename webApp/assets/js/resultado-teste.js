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

// Salva em usuarios/{uid}, dentro do mapa resultadosTestes.
//
// Aqui vai o objeto aninhado, e não a chave "resultadosTestes.gardner":
// em setDoc, uma chave com ponto vira o NOME do campo, com ponto e tudo
// (só updateDoc entende "a.b" como caminho). Com merge:true, o mapa
// aninhado junta com o que já existe, sem apagar os outros testes.
export async function salvarResultadoNoPerfil(uid, chaveTeste, dadosResultado) {
    await setDoc(
        doc(db, "usuarios", uid),
        { resultadosTestes: { [chaveTeste]: dadosResultado } },
        { merge: true }
    );
}

// Quando existir mais de um teste feito, vale sempre o mais recente
// (comparando a data de conclusão de cada um).
// Junta num mapa só os resultados salvos, venham eles do formato atual, do
// campo com ponto (antes da correção acima) ou do nome antigo de tudo.
export function resultadosSalvos(dadosUsuario) {
    const camposComPonto = Object.fromEntries(
        Object.entries(dadosUsuario || {})
            .filter(([chave]) => chave.startsWith('resultadosTestes.'))
            .map(([chave, valor]) => [chave.slice('resultadosTestes.'.length), valor])
    );

    return {
        ...camposComPonto,
        ...(dadosUsuario?.resultadosTestes || {}),
        ...(dadosUsuario?.resultadoTesteGardner && !dadosUsuario?.resultadosTestes?.gardner
            ? { gardner: dadosUsuario.resultadoTesteGardner }
            : {})
    };
}

// Um resultado só conta se tiver conteúdo: já apareceu perfil salvo pela
// metade, que virava "0%" na home em vez do convite para fazer o teste.
export function resultadoDePerfilValido(resultado) {
    return Boolean(
        resultado?.concluidoEm
        && resultado?.ranking?.length
        && Object.values(resultado.porcentagens || {}).some((valor) => Number(valor) > 0)
    );
}

export function extrairResultadoVocacional(dadosUsuario) {
    const vocacional = resultadosSalvos(dadosUsuario).vocacional;
    return vocacional?.cursos?.length ? vocacional : null;
}

// "resultadoTesteGardner" era o nome antigo (de antes de suportar vários
// testes). Quem fez o teste naquela época ainda tem o resultado guardado só
// ali — incluímos ele pra não "sumir". Só os testes de perfil (Gardner e
// Afinidades) entram aqui: quem chama espera ranking e porcentagens. O
// vocacional tem outro formato e sai por extrairResultadoVocacional.
function entradasDeResultadosDePerfilValidos(dadosUsuario) {
    return Object.entries(resultadosSalvos(dadosUsuario))
        .filter(([, resultado]) => resultadoDePerfilValido(resultado));
}

export function extrairResultadoMaisRecente(dadosUsuario) {
    return entradasDeResultadosDePerfilValidos(dadosUsuario)
        .reduce((maisRecente, [, atual]) =>
            !maisRecente || atual.concluidoEm > maisRecente.concluidoEm ? atual : maisRecente
        , null);
}

// Como extrairResultadoMaisRecente, mas também diz de qual teste o
// resultado veio ("gardner" ou "afinidades") — quem só recebe o resultado
// pronto não tem como saber pra qual página linkar de volta (ex: o botão
// "ver resultado" na tela de resultados salvos, em testes-resultados.js).
export function extrairTesteDePerfilMaisRecente(dadosUsuario) {
    const vencedor = entradasDeResultadosDePerfilValidos(dadosUsuario)
        .reduce((maisRecente, entrada) =>
            !maisRecente || entrada[1].concluidoEm > maisRecente[1].concluidoEm ? entrada : maisRecente
        , null);

    return vencedor ? { chaveTeste: vencedor[0], resultado: vencedor[1] } : null;
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
