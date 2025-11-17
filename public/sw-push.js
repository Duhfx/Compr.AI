// Event listeners para Push Notifications
// Este arquivo é importado pelo Service Worker principal

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
      vibrate: [200, 100, 200],
      requireInteraction: false,
    };

    event.waitUntil(
      self.registration.showNotification(title, options)
    );
  } catch (error) {
    console.error('[SW] Erro ao processar push:', error);
  }
});

// Event listener para cliques na notificação
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
        for (const client of clientList) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }

        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Event listener para mudança de subscription
self.addEventListener('pushsubscriptionchange', (event) => {
  console.log('[SW] Push subscription mudou:', event);

  event.waitUntil(
    self.registration.pushManager.subscribe(event.oldSubscription.options)
      .then((subscription) => {
        console.log('[SW] Resubscrito com sucesso:', subscription);
      })
      .catch((error) => {
        console.error('[SW] Erro ao resubscrever:', error);
      })
  );
});

console.log('[SW] Push notification handlers registrados');
