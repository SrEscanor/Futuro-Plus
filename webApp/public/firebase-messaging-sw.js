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

messaging.onBackgroundMessage((payload) => {
    const { title, body, icon } = payload.notification || {};
    self.registration.showNotification(title || 'Futuro+', {
        body: body || '',
        icon: icon || '/favicon.svg',
        badge: '/favicon.svg'
    });
});
