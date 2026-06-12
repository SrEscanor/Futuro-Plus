import {
  getAuth,
  signInWithEmailAndPassword
} from "firebase/auth";

import { app } from "./firebase-config.js";

const auth = getAuth(app);

document
  .querySelector(".btn-login")
  .addEventListener("click", async () => {

    const email =
      document.getElementById("email").value.trim();

    const senha =
      document.getElementById("senha").value;

    if (!email || !senha) {
      alert("Preencha todos os campos.");
      return;
    }

    try {

      await signInWithEmailAndPassword(
        auth,
        email,
        senha
      );

      alert("Login realizado com sucesso!");

      window.location.href = "index.html";

    } catch (erro) {

      switch (erro.code) {

        case "auth/invalid-credential":
          alert("Email ou senha inválidos.");
          break;

        case "auth/user-not-found":
          alert("Usuário não encontrado.");
          break;

        case "auth/wrong-password":
          alert("Senha incorreta.");
          break;

        default:
          alert("Erro ao realizar login.");
      }

      console.error(erro);
    }
});