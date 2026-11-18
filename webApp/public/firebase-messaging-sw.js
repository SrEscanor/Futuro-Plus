// Service worker do Firebase Cloud Messaging: é quem mostra a notificação
// quando a mensagem chega com o site fechado ou em segundo plano. Com a aba
// aberta, quem trata é onMessage() em assets/js/notificacoes-push.js.
//
// Fica em public/ (raiz do site publicado) de propósito: um service worker
// só controla as páginas dentro da sua própria pasta, e precisamos que ele
// valha pro site inteiro.
importScripts('https://www.gstatic.com/firebasejs/12.14.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/12.14.0/firebase-messaging-compat.js');

// Mesma config pública de assets/js/firebase-config.js — não dá para
// importar um módulo ES daqui, por isso duplicada.
firebase.initializeApp({
    apiKey: 'AIzaSyBFZqeWzcFlZJRSf4PR1vPu-RNxFPvJgSs',
    authDomain: 'futuroplus-bce54.firebaseapp.com',
    projectId: 'futuroplus-bce54',
    storageBucket: 'futuroplus-bce54.firebasestorage.app',
    messagingSenderId: '809256060399',
    appId: '1:809256060399:web:faa209ea8869daab3d621a'
});

const messaging = firebase.messaging();

// Página do próprio site ("noticia.html?id=...", ou "instituicao.html?u=...#duvidas"
// já na parte certa) ou endereço https (notícia de outro site). Mesma regra de
// assets/js/notificacoes-util.js.
function linkSeguro(link) {
    const texto = String(link || '').trim();
    if (/^[a-z0-9-]+\.html(\?[^\s#]*)?(#[a-z0-9-]+)?$/i.test(texto)) return texto;
    if (/^https:\/\/\S+$/i.test(texto) && texto.length <= 1000) return texto;
    return '';
}

// O servidor (enviar_push_da_notificacao) manda só "data": título, mensagem
// e o link da notícia, quando o aviso tem uma. Quem desenha é este código,
// guardando o link para o clique. Uma mensagem com "notification" (um teste
// pelo Console do Firebase, por exemplo) o SDK já desenha sozinho antes de
// chegar aqui; desenhar de novo deixaria repetida.
messaging.onBackgroundMessage((payload) => {
    if (payload.notification) return undefined;
    const dados = payload.data || {};
    return self.registration.showNotification(dados.titulo || 'Futuro+', {
        body: dados.mensagem || '',
        icon: '/favicon.svg',
        badge: '/favicon.svg',
        data: { link: linkSeguro(dados.link) }
    });
});

// Clique na notificação: abre a notícia (ou a Início, se o aviso não tem
// link). Se essa página já está aberta, só traz a aba para a frente. As que o
// SDK desenhou ele mesmo trata (não têm "link" nos dados).
self.addEventListener('notificationclick', (evento) => {
    const link = evento.notification.data?.link;
    if (link === undefined) return;
    evento.notification.close();
    const destino = new URL(linkSeguro(link) || '/', self.location.origin).href;
    evento.waitUntil((async () => {
        const abertas = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
        const mesma = abertas.find((janela) => janela.url === destino);
        if (mesma) return mesma.focus();
        return self.clients.openWindow(destino);
    })());
});
