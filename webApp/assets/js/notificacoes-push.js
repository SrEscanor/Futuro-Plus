// Push de verdade (chega mesmo com o site fechado), via Firebase Cloud
// Messaging. Separado do sistema de avisos do sino/modal (notificacoes.js),
// que só aparece com o site aberto.
//
// Quem efetivamente manda o push é a function enviar_push_da_notificacao
// (functions/main.py), disparada sozinha toda vez que o painel Admin ·
// Notificações cria um aviso — nada aqui chama servidor nenhum pra enviar.
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';
import { doc, setDoc } from 'firebase/firestore';
import { app, auth, db } from './firebase-config.js';
import { linkSeguroDaNotificacao } from './notificacoes-util.js';

// Gerada no Console do Firebase: Configurações do projeto (⚙️) > Cloud
// Messaging > aba "Web Push certificates" > "Generate key pair". É uma
// chave pública (vai no cliente, não é segredo), mas sem ela getToken()
// não funciona — enquanto não for trocada, ativarNotificacoesPush()
// devolve 'sem-suporte' sem tentar nada.
const VAPID_KEY = 'BGfCH96mTFUR5dABBQfZ67BbUlc7wlmuMK2BFTjUksBF23aT9Sg92fCdspvjGmQ9EXeBzt3XJsRAH1F6xdLFDso';

function chaveConfigurada() {
    return Boolean(VAPID_KEY) && !VAPID_KEY.startsWith('COLE_AQUI');
}

async function registrarTokenNoFirestore(token) {
    const uid = auth.currentUser?.uid || null;
    const agora = new Date().toISOString();

    // Coleção à parte (não dentro de usuarios/{uid}): um token de visitante
    // sem conta precisa de um lugar pra morar também, e um mesmo token some
    // sozinho se a pessoa revogar a permissão no navegador (ver o cron de
    // limpeza de inválidos, do lado do envio).
    await setDoc(doc(db, 'fcm_tokens', token), { uid, atualizadoEm: agora }, { merge: true });

    if (uid) {
        await setDoc(doc(db, 'usuarios', uid), {
            permissoes: { notificacoesPush: { concedida: true, atualizadoEm: agora } }
        }, { merge: true });
    }
}

// 'concedida' | 'negada' | 'sem-suporte' | 'erro'
export async function ativarNotificacoesPush() {
    if (!('serviceWorker' in navigator) || !('Notification' in window) || !chaveConfigurada()) {
        return 'sem-suporte';
    }
    if (!(await isSupported().catch(() => false))) return 'sem-suporte';

    try {
        const permissao = await Notification.requestPermission();
        if (permissao !== 'granted') return 'negada';

        const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        const messaging = getMessaging(app);
        const token = await getToken(messaging, { vapidKey: VAPID_KEY, serviceWorkerRegistration: registration });
        if (!token) return 'erro';

        await registrarTokenNoFirestore(token);

        // Com a aba aberta, o FCM não desenha nada sozinho — isso aqui é o
        // que faz uma mensagem chegando em primeiro plano virar notificação.
        // Vai pelo service worker (e não por new Notification()): assim o
        // clique abre a notícia do mesmo jeito que com o site fechado (ver
        // firebase-messaging-sw.js), e funciona também no Android, onde
        // new Notification() não existe. O servidor manda tudo em "data".
        onMessage(messaging, (payload) => {
            if (Notification.permission !== 'granted') return;
            const dados = payload.data || {};
            const { title, body } = payload.notification || {};
            registration.showNotification(dados.titulo || title || 'Futuro+', {
                body: dados.mensagem || body || '',
                icon: '/favicon.svg',
                badge: '/favicon.svg',
                data: { link: linkSeguroDaNotificacao(dados.link) }
            });
        });

        return 'concedida';
    } catch (erro) {
        console.error('Erro ao ativar notificações push:', erro);
        return 'erro';
    }
}

// 'granted' | 'denied' | 'default' | 'sem-suporte' — pra desenhar o botão
// certo sem precisar pedir a permissão de novo à toa.
export function statusNotificacaoPush() {
    if (!('Notification' in window)) return 'sem-suporte';
    return Notification.permission;
}
