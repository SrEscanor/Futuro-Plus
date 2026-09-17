import { auth, db } from './firebase-config.js';
import { signOut, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

document.addEventListener('DOMContentLoaded', () => {

    // Limpa Service Workers antigos para evitar cache travado
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then((registrations) => {
            for (let registration of registrations) {
                registration.unregister();
            }
        });
    }

    // Monitora a sessão e busca o nome no Firestore (Login Opcional)
    onAuthStateChanged(auth, async (user) => {
        const spanNome = document.getElementById("nomeUsuario");

        if (user) {
            console.log("Usuário logado UID:", user.uid);
            try {
                const docRef = doc(db, "usuarios", user.uid);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const dados = docSnap.data();
                    console.log("Dados encontrados no Firestore:", dados);
                    if (dados.nome && spanNome) {
                        spanNome.textContent = dados.nome;
                    } else {
                        console.warn("O campo 'nome' não existe no documento do Firestore.");
                    }

                    const menuAdmin = document.getElementById("menu-admin");
                    if (dados.admin === true && menuAdmin) {
                        menuAdmin.style.display = "";
                    }
                } else {
                    console.warn("Nenhum documento encontrado na coleção 'usuarios' para este UID.");
                }
            } catch (error) {
                console.error("Erro ao buscar dados no Firestore:", error);
            }
        } else {
            console.log("Nenhum usuário logado. Modo visitante ativado.");
            if (spanNome) {
                spanNome.textContent = "ESTUDANTE";
            }
        }
    });

    const hamburger = document.querySelector('.hamburger');
    const menuPanel = document.querySelector('.menu-panel');

    const overlay = document.createElement('div');
    overlay.classList.add('menu-overlay');
    document.body.appendChild(overlay);

    function toggleMenu() {
        if (menuPanel) menuPanel.classList.toggle('aberto');
        if (overlay) overlay.classList.toggle('ativo');
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

    // --- LÓGICA DO CHATBOT COM TRAVAS DE SEGURANÇA ---
    const chatToggleBtn = document.getElementById('chatbot-toggle');
    const chatWindow = document.getElementById('chatbot-window');
    const closeChatBtn = document.getElementById('close-chat');
    const chatInput = document.getElementById('chat-input');
    const sendChatBtn = document.getElementById('send-chat');
    const chatMessages = document.getElementById('chat-messages');

    const toggleChat = () => {
        if (chatWindow) chatWindow.classList.toggle('oculta');
    };

    // URL da função do chatbot: usa o emulador local só quando o site está
    // rodando em localhost/127.0.0.1; em produção (Firebase Hosting) usa a
    // Cloud Function publicada na nuvem.
    const isLocalhost = ["localhost", "127.0.0.1"].includes(window.location.hostname);
    const CHATBOT_URL = isLocalhost
        ? "http://127.0.0.1:5001/futuroplus-bce54/us-central1/chat_bot"
        : "https://us-central1-futuroplus-bce54.cloudfunctions.net/chat_bot";

    // Só adiciona o evento de clique se os botões existirem
    if (chatToggleBtn) chatToggleBtn.addEventListener('click', toggleChat);
    if (closeChatBtn) closeChatBtn.addEventListener('click', toggleChat);

      function limparMarkdown(texto) {
        return texto
            .replace(/^#{1,6}\s+/gm, '')
            .replace(/\*\*(.*?)\*\*/g, '$1')
            .replace(/\*(.*?)\*/g, '$1')
            .replace(/`([^`]+)`/g, '$1');
    }

    function addMessage(text, sender) {
        if (!text.trim() || !chatMessages) return;
        const msgDiv = document.createElement('div');
        msgDiv.classList.add('msg', sender);
        msgDiv.textContent = sender === 'bot' ? limparMarkdown(text) : text;
        chatMessages.appendChild(msgDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function mostrarDigitando() {
        if (!chatMessages) return;
        const typingDiv = document.createElement('div');
        typingDiv.classList.add('msg', 'bot');
        typingDiv.textContent = "Digitando...";
        typingDiv.id = "typing-indicator";
        chatMessages.appendChild(typingDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function removerDigitando() {
        document.getElementById('typing-indicator')?.remove();
    }

    const CHAT_BOT_URL = (location.hostname === "localhost" || location.hostname === "127.0.0.1")
        ? "http://127.0.0.1:5001/futuroplus-bce54/southamerica-east1/chat_bot"
        : "https://southamerica-east1-futuroplus-bce54.cloudfunctions.net/chat_bot";

    const handleSend = async () => {
        const text = chatInput.value.trim();
        if (!text) return;

        addMessage(text, 'user');
        chatInput.value = '';

        const user = auth.currentUser;
        if (!user) {
            addMessage("Você precisa estar logado para usar o assistente.", "bot");
            return;
        }

        mostrarDigitando();

        try {
            const token = await user.getIdToken();

            const resp = await fetch(CHAT_BOT_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + token
                },
                body: JSON.stringify({ mensagem: text })
            });
            const dados = await resp.json();
            removerDigitando();
            addMessage(dados.resposta || dados.erro || "Erro ao obter resposta.", "bot");
        } catch (err) {
            console.error("Erro ao chamar o chatbot:", err);
            removerDigitando();
            addMessage("Não consegui me conectar agora. Tente novamente.", "bot");
        }
    };

    // Só adiciona os eventos de enviar se os elementos existirem
    if (sendChatBtn) sendChatBtn.addEventListener('click', handleSend);
    if (chatInput) {
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleSend();
        });
    }
});