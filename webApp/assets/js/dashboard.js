import './firebase-config.js';
import { getAuth, signOut, onAuthStateChanged } from "firebase/auth";

document.addEventListener('DOMContentLoaded', () => {
    const auth = getAuth();

    // Limpa Service Workers antigos para evitar cache travado
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (let registration of registrations) {
      registration.unregister();
    }
  });
}

    // Atualiza a saudação se o usuário estiver logado, senão mantém "Usuário"
    onAuthStateChanged(auth, (user) => {
        const spanNome = document.getElementById("nomeUsuario");
        if (user && spanNome) {
            const nomeDoUsuario = user.displayName || user.email.split('@')[0];
            spanNome.textContent = nomeDoUsuario; // Corrigido de spanName para spanNome
        }
    });

    const hamburger = document.querySelector('.hamburger');
    const menuPanel = document.querySelector('.menu-panel');

    const overlay = document.createElement('div');
    overlay.classList.add('menu-overlay');
    document.body.appendChild(overlay);

    function toggleMenu() {
        menuPanel.classList.toggle('aberto');
        overlay.classList.toggle('ativo');
    }

    if (hamburger && overlay) {
        hamburger.addEventListener('click', toggleMenu);
        overlay.addEventListener('click', toggleMenu);
    }

    const logoutBtn = document.getElementById("logout-btn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", async () => {
            try {
                await signOut(auth);
                window.location.href = "login.html";
            } catch (error) {
                console.error("Erro ao fazer logout:", error);
                alert("Não foi possível encerrar a sessão. Tente novamente.");
            }
        });
    }

});