// Service Worker customizado para Push Notifications
// Este arquivo usa injectManifest do Workbox para PWA com push

import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { NetworkFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';

console.log('[SW] Service Worker carregado');

// Precache assets (injetado automaticamente pelo vite-plugin-pwa)
precacheAndRoute(self.__WB_MANIFEST || []);

// Cache strategy para API do Supabase
registerRoute(
  /^https:\/\/.*\.supabase\.co\/.*/i,
  new NetworkFirst({
    cacheName: 'supabase-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 60 * 60 * 24, // 24 horas
      }),
    ],
  })
);

// Event listener para Push Notifications
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification recebida:', event);

  if (!event.data) {
    console.warn('[SW] Push sem dados');
    return;
  }

  try {
    const data = event.data.json();
    console.log('[SW] Push data:', data);

    const title = data.title || 'Compr.AI';
    const options = {
      body: data.body || 'Nova atualização disponível',
      icon: data.icon || '/icons/icon-192.png',
      badge: data.badge || '/icons/icon-192.png',
      tag: data.data?.listId || 'default',
      data: data.data || {},
      vibrate: [200, 100, 200], // Padrão de vibração
      requireInteraction: false, // Notificação some automaticamente
    };

    event.waitUntil(
      self.registration.showNotification(title, options)
    );
  } catch (error) {
    console.error('[SW] Erro ao processar push:', error);
  }
});

// Event listener para quando usuário clica na notificação
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notificação clicada:', event);

  event.notification.close();

  const urlToOpen = event.notification.data?.url
    ? new URL(event.notification.data.url, self.location.origin).href
    : self.location.origin;

  console.log('[SW] Abrindo URL:', urlToOpen);

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Tentar focar em janela existente
        for (const client of clientList) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }

        // Se não houver janela aberta, abrir uma nova
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Event listener para erros de push subscription
self.addEventListener('pushsubscriptionchange', (event) => {
  console.log('[SW] Push subscription mudou:', event);

  event.waitUntil(
    self.registration.pushManager.subscribe(event.oldSubscription.options)
      .then((subscription) => {
        console.log('[SW] Resubscrito com sucesso:', subscription);
        // TODO: Enviar nova subscription para o backend
      })
      .catch((error) => {
        console.error('[SW] Erro ao resubscrever:', error);
      })
  );
});

console.log('[SW] Service Worker configurado com sucesso');
