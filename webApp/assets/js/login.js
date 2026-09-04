import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "./firebase-config.js"; // Certifique-se de importar o 'auth' exportado do seu config

document.querySelector(".btn-login").addEventListener("click", async (e) => {
    // Impede o recarregamento padrão da página caso o botão esteja dentro de um formulário
    if (e) e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const senha = document.getElementById("senha").value;

    if (!email || !senha) {
        alert("Preencha todos os campos.");
        return;
    }

    try {
        await signInWithEmailAndPassword(auth, email, senha);

        // Login bem-sucedido, redireciona para a home
        window.location.href = "index.html";

    } catch (erro) {
        switch (erro.code) {
            case "auth/invalid-credential":
            case "auth/user-not-found":
            case "auth/wrong-password":
                alert("E-mail ou senha inválidos.");
                break;
            default:
                alert("Erro ao realizar login: " + erro.message);
        }

        console.error("Erro Firebase:", erro);
    }
});