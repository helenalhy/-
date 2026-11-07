const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const reminders = fs.readFileSync(
  path.resolve(__dirname, '../app/reminders.tsx'),
  'utf8',
);

test('reminder settings can request browser notification permission and send a local test notification', () => {
  assert.match(reminders, /Notification\.requestPermission\(\)/);
  assert.match(reminders, /registration\.showNotification\('Momentum 通知測試成功'/);
  assert.match(reminders, /testID="test-web-notification"/);
  assert.match(reminders, /立即測試通知/);
});

test('reminder settings explain local test scope and refresh permission after returning to the page', () => {
  assert.match(reminders, /不會測試關閉網頁後的背景排程/);
  assert.match(reminders, /window\.addEventListener\('focus', refreshPermission\)/);
  assert.match(reminders, /document\.addEventListener\('visibilitychange', refreshPermission\)/);
  assert.match(reminders, /瀏覽器通知權限：/);
});
