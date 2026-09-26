import { auth, db } from './firebase-config.js';
import { signOut, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc, deleteField } from "firebase/firestore";
import { verificarTermosAtualizados } from './gate-termos.js';
import { iniciarAtencaoChat } from './chat-atencao.js';

document.addEventListener('DOMContentLoaded', () => {

    // Limpa Service Workers antigos para evitar cache travado
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then((registrations) => {
            for (let registration of registrations) {
                registration.unregister();
            }
        });
    }

    // Iniciais do avatar do topo: nome + sobrenome, ou só a primeira letra do
    // e-mail quando a pessoa ainda não tem nome salvo.
    function iniciaisDoNome(nome) {
        const partes = (nome || '?').trim().split(/\s+/).filter(Boolean);
        return partes.slice(0, 2).map((parte) => parte[0].toUpperCase()).join('') || '?';
    }

    // Monitora a sessão e busca o nome no Firestore (Login Opcional)
    onAuthStateChanged(auth, async (user) => {
        const spanNome = document.getElementById("nomeUsuario");
        const avatarMenu = document.getElementById("avatar-menu");
        const avatarIniciais = document.getElementById("avatar-iniciais");
        const navAuth = document.getElementById("nav-auth");
        const menuNavAuth = document.getElementById("menu-nav-auth");

        if (user) {
            console.log("Usuário logado UID:", user.uid);
            let nomeCompleto = '';
            try {
                const docRef = doc(db, "usuarios", user.uid);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const dados = docSnap.data();
                    console.log("Dados encontrados no Firestore:", dados);

                    // A pessoa tinha pedido para excluir a conta e voltou a
                    // entrar antes do prazo: cancela o pedido na hora.
                    if (dados.exclusao) {
                        await setDoc(docRef, { exclusao: deleteField() }, { merge: true });
                        alert("Você tinha pedido para excluir sua conta. Como você entrou de novo, esse pedido foi cancelado e sua conta continua normal.");
                    }

                    // Bloqueia o site com um aviso se os Termos/Política mudaram
                    // desde o último aceite (ou se a conta nunca aceitou nenhuma
                    // versão, caso de contas criadas antes desse controle existir).
                    verificarTermosAtualizados(dados).catch((erro) => console.error("Erro ao checar termos:", erro));

                    nomeCompleto = [dados.nome, dados.sobrenome].filter(Boolean).join(' ').trim();
                    if (dados.nome && spanNome) {
                        spanNome.textContent = dados.nome;
                    } else if (!dados.nome) {
                        console.warn("O campo 'nome' não existe no documento do Firestore.");
                    }

                    if (dados.admin === true) {
                        document.querySelectorAll(".menu-admin-area")
                            .forEach((item) => { item.hidden = false; });
                    }

                    atualizarBarraPermissaoLocalizacao(dados.permissoes?.localizacaoChatbot?.concedida === true);
                } else {
                    console.warn("Nenhum documento encontrado na coleção 'usuarios' para este UID.");
                }
            } catch (error) {
                console.error("Erro ao buscar dados no Firestore:", error);
            }

            if (avatarIniciais) avatarIniciais.textContent = iniciaisDoNome(nomeCompleto || user.email);
            if (avatarMenu) avatarMenu.hidden = false;
            if (navAuth) navAuth.hidden = true;
            if (menuNavAuth) menuNavAuth.hidden = true;
        } else {
            console.log("Nenhum usuário logado. Modo visitante ativado.");
            if (spanNome) {
                spanNome.textContent = "ESTUDANTE";
            }
            if (avatarMenu) avatarMenu.hidden = true;
            if (navAuth) navAuth.hidden = false;
            if (menuNavAuth) menuNavAuth.hidden = false;
            fecharAvatarDropdown();
        }
    });

    // Balão do avatar: abre no clique, fecha clicando fora, com Esc ou ao
    // escolher uma opção.
    const avatarBotao = document.getElementById("avatar-botao");
    const avatarDropdown = document.getElementById("avatar-dropdown");

    function fecharAvatarDropdown() {
        if (!avatarDropdown || avatarDropdown.hidden) return;
        avatarDropdown.hidden = true;
        avatarBotao?.setAttribute("aria-expanded", "false");
    }

    if (avatarBotao && avatarDropdown) {
        avatarBotao.addEventListener("click", (e) => {
            e.stopPropagation();
            const vaiAbrir = avatarDropdown.hidden;
            avatarDropdown.hidden = !vaiAbrir;
            avatarBotao.setAttribute("aria-expanded", String(vaiAbrir));
        });

        document.addEventListener("click", (e) => {
            if (!avatarDropdown.hidden && !e.target.closest("#avatar-menu")) fecharAvatarDropdown();
        });

        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape") fecharAvatarDropdown();
        });
    }

    // Pausa enquanto o tour de boas-vindas da home estiver na tela, pra não
    // empilhar dois avisos ao mesmo tempo (window.__tourAtivo vem de
    // tour-boas-vindas.js, carregado só no index.html).
    iniciarAtencaoChat({ pausar: () => window.__tourAtivo === true });

    // Botão do topo pra repetir o tour guiado. Ele só existe de fato na
    // home (onde tem o que destacar) — em outra página, manda pra lá com um
    // sinal na URL que inicio-tour.js lê pra começar sozinho.
    async function abrirTourGuiado() {
        if (document.getElementById('card-vocacional')) {
            const { iniciarTourBoasVindas } = await import('./tour-boas-vindas.js');
            iniciarTourBoasVindas({ forcar: true });
        } else {
            window.location.href = 'index.html?tour=1';
        }
    }
    document.getElementById('btn-repetir-tour')?.addEventListener('click', abrirTourGuiado);

    // Mesmo atalho, só que no topo do menu hamburguer (mais visível no
    // celular do que o ícone sozinho na barra de topo). Fecha o menu antes
    // de abrir o tour, senão a barra lateral aberta ficaria por cima.
    document.getElementById('btn-tour-menu')?.addEventListener('click', () => {
        if (menuPanel?.classList.contains('aberto')) toggleMenu();
        abrirTourGuiado();
    });

    // Balão de dica perto do botão de repetir tour: o ícone sozinho passava
    // despercebido, então avisa por escrito pra quem ainda não fez o tour.
    (function destacarBotaoTour() {
        const CHAVE_TOUR_VISTO = 'futuroplus_tour_visto';
        const botaoTour = document.getElementById('btn-repetir-tour');
        if (!botaoTour) return;

        function jaViuTour() {
            try {
                return localStorage.getItem(CHAVE_TOUR_VISTO) === '1';
            } catch {
                return false;
            }
        }

        setTimeout(() => {
            // window.__tourAtivo vem de tour-boas-vindas.js: se o tour de
            // boas-vindas já estiver na tela, não empilha os dois avisos.
            if (jaViuTour() || window.__tourAtivo || document.getElementById('tour-dica-balao')) return;

            const dica = document.createElement('div');
            dica.id = 'tour-dica-balao';
            dica.className = 'tour-dica-balao';
            dica.innerHTML = 'Ainda não fez o tour guiado? Clique aqui! <span class="tour-dica-fechar" role="button" tabindex="0" aria-label="Fechar">×</span>';
            botaoTour.appendChild(dica);

            const fechar = (e) => {
                e.stopPropagation();
                dica.remove();
            };
            const botaoFechar = dica.querySelector('.tour-dica-fechar');
            botaoFechar.addEventListener('click', fechar);
            botaoFechar.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') fechar(e);
            });
            botaoTour.addEventListener('click', () => dica.remove(), { once: true });
            setTimeout(() => dica.remove(), 8000);
        }, 900);
    })();

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
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && menuPanel?.classList.contains('aberto')) toggleMenu();
        });
    }

    // No desktop o menu já fica aberto por CSS; se a tela crescer com ele
    // "aberto" pelo celular, o overlay escuro ficaria sobrando.
    const telaGrande = window.matchMedia('(min-width: 1024px)');
    const ajustarMenu = () => {
        if (!telaGrande.matches) return;
        menuPanel?.classList.remove('aberto');
        overlay?.classList.remove('ativo');
    };
    telaGrande.addEventListener('change', ajustarMenu);
    ajustarMenu();

    // Barra de busca do topo: por enquanto o que dá pra buscar de verdade no
    // site são os cursos, então ela manda pra lá com o mesmo parâmetro
    // (?curso=) que os links de recomendação já usam — se a pessoa já
    // estiver em cursos.html, só filtra na hora, sem recarregar a página.
    const buscaTopo = document.getElementById('busca-topo');
    if (buscaTopo) {
        function buscarNoTopo() {
            const termo = buscaTopo.value.trim();
            if (!termo) return;

            const campoCursos = document.getElementById('busca-cursos');
            if (campoCursos) {
                campoCursos.value = termo;
                campoCursos.dispatchEvent(new Event('input'));
                campoCursos.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } else {
                window.location.href = `cursos.html?curso=${encodeURIComponent(termo)}`;
            }
        }

        buscaTopo.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') buscarNoTopo();
        });
        buscaTopo.parentElement.querySelector('svg')?.addEventListener('click', buscarNoTopo);
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
            addMessage("Opa, essa parte eu só consigo fazer com você logado 😊 Entra na sua conta rapidinho que te ajudo na hora!", "bot");
            mostrarLinksDoSite([{ texto: "Entrar na conta", url: "login.html" }]);
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
            <p>O assistente usa só a distância até as unidades. Seu endereço não aparece na conversa, e você pode desativar quando quiser.</p>
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
            addMessage("Tudo bem! Se preferir, me diga a sua cidade que eu procuro as unidades de lá.", "bot");
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