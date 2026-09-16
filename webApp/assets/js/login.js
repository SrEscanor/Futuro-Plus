import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "./firebase-config.js"; // Certifique-se de importar o 'auth' exportado do seu config
import { integrarResultadoPendenteComPerfil } from "./resultado-teste.js";

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
        const credencial = await signInWithEmailAndPassword(auth, email, senha);

        // Se a pessoa fez o teste antes de logar, vincula o resultado agora
        await integrarResultadoPendenteComPerfil(credencial.user.uid)
            .catch(erro => console.error("Erro ao vincular resultado do teste:", erro));

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