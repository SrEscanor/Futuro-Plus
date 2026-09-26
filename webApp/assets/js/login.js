import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { auth } from "./firebase-config.js"; // Certifique-se de importar o 'auth' exportado do seu config
import { integrarResultadoPendenteComPerfil } from "./resultado-teste.js";
import { entrarComGoogle } from "./auth-google.js";

const formLogin = document.getElementById("formLogin");
const botaoEntrar = document.querySelector(".btn-login");
const botaoGoogle = document.getElementById("btnGoogleLogin");
const linkEsqueciSenha = document.querySelector(".forgot a");
const msgErroLogin = document.getElementById("msgErroLogin");

function mostrarErroLogin(mensagem) {
    if (!msgErroLogin) {
        alert(mensagem);
        return;
    }
    msgErroLogin.textContent = mensagem;
    msgErroLogin.style.display = "block";
}

function limparErroLogin() {
    if (!msgErroLogin) return;
    msgErroLogin.textContent = "";
    msgErroLogin.style.display = "none";
}

// ---------------------------------------------------------------
// Trava depois de muitas tentativas erradas seguidas (por e-mail, guardado
// no navegador): dificulta um ataque de força bruta sem precisar de nada no
// backend. Zera sozinha quando o login dá certo ou quando o tempo de
// bloqueio passa.
// ---------------------------------------------------------------
const CHAVE_TENTATIVAS = "futuroplus_login_tentativas";
const MAX_TENTATIVAS = 5;
const BLOQUEIO_MS = 5 * 60 * 1000; // 5 minutos

function lerTentativas() {
    try {
        return JSON.parse(localStorage.getItem(CHAVE_TENTATIVAS)) || {};
    } catch {
        return {};
    }
}

function salvarTentativas(dados) {
    try {
        localStorage.setItem(CHAVE_TENTATIVAS, JSON.stringify(dados));
    } catch {
        // localStorage bloqueado (modo privado etc.): sem trava entre sessões, sem problema
    }
}

function statusBloqueio(email) {
    const chave = email.toLowerCase();
    const dados = lerTentativas();
    const registro = dados[chave];
    if (!registro) return { bloqueado: false, tentativas: 0 };

    if (registro.bloqueadoAte) {
        if (registro.bloqueadoAte > Date.now()) {
            return { bloqueado: true, restanteMs: registro.bloqueadoAte - Date.now() };
        }
        // Bloqueio já passou: começa do zero de novo.
        delete dados[chave];
        salvarTentativas(dados);
        return { bloqueado: false, tentativas: 0 };
    }

    return { bloqueado: false, tentativas: registro.tentativas || 0 };
}

function registrarTentativaFalha(email) {
    const chave = email.toLowerCase();
    const dados = lerTentativas();
    const registro = dados[chave] || { tentativas: 0 };
    registro.tentativas += 1;
    if (registro.tentativas >= MAX_TENTATIVAS) {
        registro.bloqueadoAte = Date.now() + BLOQUEIO_MS;
    }
    dados[chave] = registro;
    salvarTentativas(dados);
    return registro;
}

function limparTentativas(email) {
    const dados = lerTentativas();
    delete dados[email.toLowerCase()];
    salvarTentativas(dados);
}

// Reaproveita o e-mail já digitado no campo de login; se ainda estiver
// vazio, só avisa em vez de abrir mais uma tela pra isso.
linkEsqueciSenha.addEventListener("click", async (e) => {
    e.preventDefault();
    if (linkEsqueciSenha.dataset.enviando === "1") return;

    const campoEmail = document.getElementById("email");
    const email = campoEmail.value.trim();

    if (!email) {
        alert('Digite seu e-mail no campo acima e clique de novo em "esqueci minha senha".');
        campoEmail.focus();
        return;
    }

    linkEsqueciSenha.dataset.enviando = "1";
    const textoOriginal = linkEsqueciSenha.textContent;
    linkEsqueciSenha.textContent = "enviando...";

    try {
        await sendPasswordResetEmail(auth, email);
        alert(`Enviamos um link pra redefinir sua senha para ${email}. Confira também a caixa de spam.`);
    } catch (erro) {
        switch (erro.code) {
            case "auth/invalid-email":
                alert("Esse e-mail não parece válido.");
                break;
            case "auth/user-not-found":
                alert("Não encontramos nenhuma conta com esse e-mail.");
                break;
            default:
                alert("Não foi possível enviar o e-mail de redefinição: " + erro.message);
        }
        console.error("Erro ao enviar redefinição de senha:", erro);
    } finally {
        linkEsqueciSenha.textContent = textoOriginal;
        delete linkEsqueciSenha.dataset.enviando;
    }
});

botaoGoogle.addEventListener("click", async () => {
    if (await entrarComGoogle(botaoGoogle)) {
        window.location.href = "index.html";
    }
});

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

    limparErroLogin();

    const email = document.getElementById("email").value.trim();
    const senha = document.getElementById("senha").value;

    if (!email || !senha) {
        mostrarErroLogin("Preencha todos os campos.");
        return;
    }

    const bloqueio = statusBloqueio(email);
    if (bloqueio.bloqueado) {
        mostrarErroLogin('Muitas tentativas erradas. Tente novamente mais tarde, ou clique em "esqueci minha senha".');
        return;
    }

    // Sem isso, apertar Enter duas vezes dispara dois logins seguidos.
    botaoEntrar.disabled = true;
    botaoEntrar.textContent = "Entrando...";

    try {
        const credencial = await signInWithEmailAndPassword(auth, email, senha);
        limparTentativas(email);

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
            case "auth/wrong-password": {
                const registro = registrarTentativaFalha(email);
                const restantes = MAX_TENTATIVAS - registro.tentativas;
                if (restantes > 0) {
                    mostrarErroLogin(`E-mail ou senha inválidos. Tentativa ${registro.tentativas} de ${MAX_TENTATIVAS} — depois disso, o login fica bloqueado por um tempo.`);
                } else {
                    mostrarErroLogin('E-mail ou senha inválidos. Muitas tentativas erradas: tente novamente mais tarde, ou clique em "esqueci minha senha".');
                }
                break;
            }
            default:
                mostrarErroLogin("Erro ao realizar login: " + erro.message);
        }

        console.error("Erro Firebase:", erro);
    }
});