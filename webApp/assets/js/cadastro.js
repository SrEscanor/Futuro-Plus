import {
  getAuth,
  createUserWithEmailAndPassword,
  updateProfile
} from "firebase/auth";

import { app } from "./firebase-config.js";

const auth = getAuth(app);

document
  .querySelector(".btn-login")
  .addEventListener("click", async () => {

    const nome = document.getElementById("nome").value.trim();
    const email = document.getElementById("email").value.trim();
    const senha = document.getElementById("senha").value;

    if (!nome || !email || !senha) {
      alert("Preencha todos os campos.");
      return;
    }

    try {

      const userCredential =
        await createUserWithEmailAndPassword(
          auth,
          email,
          senha
        );

      await updateProfile(userCredential.user, {
        displayName: nome
      });

      alert("Conta criada com sucesso!");

      window.location.href = "login.html";

    } catch (erro) {

      alert("Erro: " + erro.message);

    }
});