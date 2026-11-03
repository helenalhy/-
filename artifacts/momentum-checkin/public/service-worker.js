const CACHE_NAME = 'momentum-shell-v1';

self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  let message = {
    title: 'Momentum 打卡時間到啦',
    body: '今天留一小步給自己，完成目標後回來打卡吧。',
    url: '/today',
  };

  if (event.data) {
    try {
      message = { ...message, ...event.data.json() };
    } catch {
      message.body = event.data.text() || message.body;
    }
  }

  event.waitUntil(self.registration.showNotification(message.title, {
    body: message.body,
    icon: '/icons/momentum-icon.png',
    badge: '/icons/momentum-icon.png',
    tag: 'momentum-daily-check-in',
    renotify: false,
    data: { url: message.url },
  }));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = new URL(event.notification.data?.url || '/today', self.location.origin).href;
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of windows) {
      if ('focus' in client) {
        await client.focus();
        if ('navigate' in client) await client.navigate(targetUrl);
        return;
      }
    }
    await self.clients.openWindow(targetUrl);
  })());
});
