import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "./firebase-config.js"; // Certifique-se de importar o 'auth' exportado do seu config
import { integrarResultadoPendenteComPerfil } from "./resultado-teste.js";

const formLogin = document.getElementById("formLogin");
const botaoEntrar = document.querySelector(".btn-login");

// O Enter em um campo de formulário já envia sozinho na maioria dos
// navegadores, mas tratamos a tecla também: preventDefault evita que os dois
// caminhos disparem dois logins seguidos.
formLogin.addEventListener("keydown", (e) => {
    if (e.key !== "Enter" || e.target.tagName !== "INPUT") return;
    e.preventDefault();
    formLogin.requestSubmit();
});

// O envio é tratado no 'submit' (e não no clique do botão) porque assim o
// Enter em qualquer campo também entra, sem precisar clicar no botão.
formLogin.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Enter apertado de novo enquanto o login anterior ainda está em curso
    if (botaoEntrar.disabled) return;

    const email = document.getElementById("email").value.trim();
    const senha = document.getElementById("senha").value;

    if (!email || !senha) {
        alert("Preencha todos os campos.");
        return;
    }

    // Sem isso, apertar Enter duas vezes dispara dois logins seguidos.
    botaoEntrar.disabled = true;
    botaoEntrar.textContent = "Entrando...";

    try {
        const credencial = await signInWithEmailAndPassword(auth, email, senha);

        // Se a pessoa fez o teste antes de logar, vincula o resultado agora
        await integrarResultadoPendenteComPerfil(credencial.user.uid)
            .catch(erro => console.error("Erro ao vincular resultado do teste:", erro));

        // Login bem-sucedido, redireciona para a home
        window.location.href = "index.html";

    } catch (erro) {
        botaoEntrar.disabled = false;
        botaoEntrar.textContent = "Entrar";

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