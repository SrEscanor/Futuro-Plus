import { auth, db } from './firebase-config.js';
import { signOut, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";

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

                    atualizarBarraPermissaoLocalizacao(dados.permissoes?.localizacaoChatbot?.concedida === true);
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
            // [texto](https://link) -> https://link (o chat mostra texto puro)
            .replace(/\[([^\]]*)\]\((https?:\/\/[^)\s]+)\)/g, '$2')
            .replace(/^#{1,6}\s+/gm, '')
            .replace(/\*\*(.*?)\*\*/g, '$1')
            .replace(/\*(.*?)\*/g, '$1')
            .replace(/`([^`]+)`/g, '$1');
    }

    // Monta o texto com nós de texto e <a> criados pelo DOM (nunca innerHTML),
    // então nada que venha na resposta consegue virar HTML na página.
    function preencherComLinks(elemento, texto) {
        const partes = texto.split(/(https?:\/\/[^\s<>"')\]]+)/g);
        partes.forEach((parte, indice) => {
            if (indice % 2 === 0) {
                if (parte) elemento.appendChild(document.createTextNode(parte));
                return;
            }
            // pontuação colada no fim ("...site.com.") fica fora do link
            const [, url, pontuacao] = parte.match(/^(.*?)([.,;:!?]*)$/);
            const link = document.createElement('a');
            link.href = url;
            link.textContent = url;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            elemento.appendChild(link);
            if (pontuacao) elemento.appendChild(document.createTextNode(pontuacao));
        });
    }

    function addMessage(text, sender) {
        if (!text.trim() || !chatMessages) return;
        const msgDiv = document.createElement('div');
        msgDiv.classList.add('msg', sender);
        if (sender === 'bot') {
            preencherComLinks(msgDiv, limparMarkdown(text));
        } else {
            msgDiv.textContent = text;
        }
        chatMessages.appendChild(msgDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Botões para páginas do próprio site, enviados pelo backend. Só aceita
    // caminhos internos como "cursos.html?curso=...".
    function mostrarLinksDoSite(links) {
        if (!chatMessages || !Array.isArray(links) || !links.length) return;
        const grupo = document.createElement('div');
        grupo.className = 'chat-links-site';
        links.forEach(({ texto, url }) => {
            if (typeof url !== 'string' || !/^[a-z0-9-]+\.html(\?[^\s<>"']*)?$/i.test(url)) return;
            const botao = document.createElement('a');
            botao.className = 'chat-link-site';
            botao.href = url;
            botao.textContent = `${texto} →`;
            grupo.appendChild(botao);
        });
        if (!grupo.children.length) return;
        chatMessages.appendChild(grupo);
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

    async function enviarParaAssistente(texto) {
        addMessage(texto, 'user');

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
                body: JSON.stringify({ mensagem: texto })
            });
            const dados = await resp.json();
            removerDigitando();
            addMessage(dados.resposta || dados.erro || "Erro ao obter resposta.", "bot");
            mostrarLinksDoSite(dados.links);

            if (Array.isArray(dados.acoes) && dados.acoes.includes("pedir_permissao_localizacao")) {
                mostrarPedidoPermissaoLocalizacao();
            }
        } catch (err) {
            console.error("Erro ao chamar o chatbot:", err);
            removerDigitando();
            addMessage("Não consegui me conectar agora. Tente novamente.", "bot");
        }
    }

    const handleSend = () => {
        const text = chatInput.value.trim();
        if (!text) return;
        chatInput.value = '';
        enviarParaAssistente(text);
    };

    // --- PERMISSÃO DE LOCALIZAÇÃO PARA O ASSISTENTE ---
    // A permissão só é gravada pelo clique da própria pessoa nos botões: o
    // assistente nunca "decide" sozinho que recebeu autorização pelo texto.
    async function gravarPermissaoLocalizacao(concedida) {
        const user = auth.currentUser;
        if (!user) return false;
        try {
            await setDoc(doc(db, "usuarios", user.uid), {
                permissoes: {
                    localizacaoChatbot: { concedida, atualizadoEm: new Date().toISOString() }
                }
            }, { merge: true });
            atualizarBarraPermissaoLocalizacao(concedida);
            return true;
        } catch (erro) {
            console.error("Erro ao salvar a permissão de localização:", erro);
            addMessage("Não consegui salvar sua escolha agora. Tente novamente.", "bot");
            return false;
        }
    }

    function mostrarPedidoPermissaoLocalizacao() {
        if (!chatMessages || document.getElementById("cartao-permissao-localizacao")) return;

        const cartao = document.createElement("div");
        cartao.id = "cartao-permissao-localizacao";
        cartao.className = "msg bot cartao-permissao";
        cartao.innerHTML = `
            <p><strong>📍 Usar a localização do seu perfil?</strong></p>
            <p>O assistente usa só a distância até as Etecs. Seu endereço não aparece na conversa, e você pode desativar quando quiser.</p>
            <div class="cartao-permissao-botoes">
                <button type="button" class="btn-permitir">Permitir</button>
                <button type="button" class="btn-agora-nao">Agora não</button>
            </div>
        `;

        cartao.querySelector(".btn-permitir").addEventListener("click", async () => {
            cartao.querySelectorAll("button").forEach((b) => { b.disabled = true; });
            if (await gravarPermissaoLocalizacao(true)) {
                cartao.remove();
                enviarParaAssistente("Pode usar a localização do meu perfil.");
            } else {
                cartao.querySelectorAll("button").forEach((b) => { b.disabled = false; });
            }
        });

        cartao.querySelector(".btn-agora-nao").addEventListener("click", () => {
            cartao.remove();
            addMessage("Tudo bem! Se preferir, me diga a sua cidade que eu procuro as Etecs de lá.", "bot");
        });

        chatMessages.appendChild(cartao);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function atualizarBarraPermissaoLocalizacao(concedida) {
        const barra = document.getElementById("chat-permissao-localizacao");
        if (barra) barra.hidden = !concedida;
    }

    const botaoDesativarLocalizacao = document.getElementById("desativar-localizacao-chat");
    if (botaoDesativarLocalizacao) {
        botaoDesativarLocalizacao.addEventListener("click", async () => {
            if (await gravarPermissaoLocalizacao(false)) {
                addMessage("Pronto, não vou mais usar a localização do seu perfil. Se quiser, é só me dizer uma cidade.", "bot");
            }
        });
    }

    // Só adiciona os eventos de enviar se os elementos existirem
    if (sendChatBtn) sendChatBtn.addEventListener('click', handleSend);
    if (chatInput) {
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleSend();
        });
    }
});