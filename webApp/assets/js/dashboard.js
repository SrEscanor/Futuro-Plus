import {
  getAuth,
  onAuthStateChanged
} from "firebase/auth";

import { app } from "./firebase-config.js";

const auth = getAuth(app);

onAuthStateChanged(auth, (user) => {

  if (user) {

    const nome =
      user.displayName || "Usuário";

    document.getElementById("nomeUsuario")
      .textContent = nome;

  } else {

    window.location.href = "login.html";

  }

});

document.addEventListener('DOMContentLoaded', () => {
    const hamburger = document.querySelector('.hamburger');
    const menuPanel = document.querySelector('.menu-panel');

    // Cria o fundo escuro (overlay) para dar foco ao menu no celular
    const overlay = document.createElement('div');
    overlay.classList.add('menu-overlay');
    document.body.appendChild(overlay);

    // Função para abrir e fechar
    function toggleMenu() {
        menuPanel.classList.toggle('aberto');
        overlay.classList.toggle('ativo');
    }

    // Eventos de clique
    hamburger.addEventListener('click', toggleMenu);
    overlay.addEventListener('click', toggleMenu); // Fecha o menu se o usuário tocar fora dele
});