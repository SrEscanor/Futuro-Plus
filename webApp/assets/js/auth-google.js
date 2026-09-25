// Login/cadastro com Google, compartilhado entre login.js e cadastro.js.
//
// A conta é criada na hora, com só o que o Google já entrega (nome, e-mail,
// foto) — sem CPF nem endereço, que só o cadastro por e-mail pede. Isso deixa
// o checklist de completude do perfil (perfil.js) com itens em aberto pra
// essa pessoa, mas não trava o uso do app por isso.
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "./firebase-config.js";
import { integrarResultadoPendenteComPerfil } from "./resultado-teste.js";

const provedorGoogle = new GoogleAuthProvider();

// O Google só devolve o nome completo; nome/sobrenome são campos separados
// no resto do app, então quebramos na primeira palavra.
function separarNome(nomeCompleto) {
    const partes = (nomeCompleto || "").trim().split(/\s+/).filter(Boolean);
    return {
        nome: partes[0] || "",
        sobrenome: partes.slice(1).join(" ")
    };
}

async function garantirPerfil(user) {
    const referencia = doc(db, "usuarios", user.uid);
    const existente = await getDoc(referencia);
    if (existente.exists()) return;

    const { nome, sobrenome } = separarNome(user.displayName);
    await setDoc(referencia, {
        nome,
        sobrenome,
        email: user.email || "",
        foto: user.photoURL || "",
        provedor: "google",
        criadoEm: new Date().toISOString()
    });
}

// botao: elemento a desabilitar durante o fluxo (evita duplo clique).
// Devolve true se o login deu certo (quem chamou decide o redirecionamento).
export async function entrarComGoogle(botao) {
    const textoOriginal = botao?.textContent;
    if (botao) {
        botao.disabled = true;
        botao.textContent = "Conectando...";
    }

    try {
        const credencial = await signInWithPopup(auth, provedorGoogle);
        await garantirPerfil(credencial.user);
        await integrarResultadoPendenteComPerfil(credencial.user.uid)
            .catch((erro) => console.error("Erro ao vincular resultado do teste:", erro));
        return true;

    } catch (erro) {
        // Fechar o popup ou cancelar não é erro de verdade, não precisa de alerta.
        if (erro.code !== "auth/popup-closed-by-user" && erro.code !== "auth/cancelled-popup-request") {
            console.error("Erro no login com Google:", erro);
            alert("Não deu para entrar com o Google. Tente de novo.");
        }
        return false;

    } finally {
        if (botao) {
            botao.disabled = false;
            botao.textContent = textoOriginal;
        }
    }
}
