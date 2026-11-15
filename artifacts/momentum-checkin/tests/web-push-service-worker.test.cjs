const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');

const serviceWorkerSource = fs.readFileSync(
  path.resolve(__dirname, '../public/service-worker.js'),
  'utf8',
);

function createServiceWorker(clients = []) {
  const listeners = new Map();
  const shownNotifications = [];
  const openedWindows = [];
  const self = {
    location: { origin: 'https://momentum.example' },
    clients: {
      matchAll: async () => clients,
      openWindow: async (url) => openedWindows.push(url),
    },
    registration: {
      showNotification: async (title, options) => {
        shownNotifications.push({ title, options });
      },
    },
    addEventListener: (name, listener) => listeners.set(name, listener),
  };
  vm.runInNewContext(serviceWorkerSource, { self, URL });
  return { listeners, shownNotifications, openedWindows };
}

function createExtendableEvent(extra = {}) {
  let pending;
  return {
    ...extra,
    waitUntil: (promise) => { pending = promise; },
    settled: () => pending,
  };
}

test('background push displays one daily reminder with a stable replacement tag', async () => {
  const worker = createServiceWorker();
  const event = createExtendableEvent({
    data: {
      json: () => ({ title: 'Momentum 打卡提醒 · 09:00', url: '/today' }),
    },
  });

  worker.listeners.get('push')(event);
  await event.settled();

  assert.equal(worker.shownNotifications.length, 1);
  assert.equal(worker.shownNotifications[0].title, 'Momentum 打卡提醒 · 09:00');
  assert.equal(worker.shownNotifications[0].options.tag, 'momentum-daily-check-in');
  assert.equal(worker.shownNotifications[0].options.renotify, false);
  assert.equal(worker.shownNotifications[0].options.data.url, '/today');
});

test('notification click opens Today when no app window is open', async () => {
  const worker = createServiceWorker();
  let closed = false;
  const event = createExtendableEvent({
    notification: {
      data: { url: '/today' },
      close: () => { closed = true; },
    },
  });

  worker.listeners.get('notificationclick')(event);
  await event.settled();

  assert.equal(closed, true);
  assert.deepEqual(worker.openedWindows, ['https://momentum.example/today']);
});

test('notification click focuses and navigates an existing app window to Today', async () => {
  const calls = [];
  const client = {
    focus: async () => { calls.push('focus'); },
    navigate: async (url) => { calls.push(url); },
  };
  const worker = createServiceWorker([client]);
  const event = createExtendableEvent({
    notification: {
      data: { url: '/today' },
      close: () => {},
    },
  });

  worker.listeners.get('notificationclick')(event);
  await event.settled();

  assert.deepEqual(calls, ['focus', 'https://momentum.example/today']);
  assert.deepEqual(worker.openedWindows, []);
});
