const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const appRoot = path.resolve(__dirname, '..');
const todayScreen = fs.readFileSync(path.join(appRoot, 'app/(tabs)/index.tsx'), 'utf8');
const settingsScreen = fs.readFileSync(path.join(appRoot, 'app/reminders.tsx'), 'utf8');

test('the active browser reminder subscription refreshes timezone and check-in status', () => {
  assert.match(todayScreen, /window\.setInterval\(refreshTimeZone, 30_000\)/);
  assert.match(todayScreen, /hasCheckedInToday: habits\.some\(\(habit\) => habit\.checkIns\.includes\(localDate\)\)/);
  assert.match(todayScreen, /timeZone,/);
  assert.match(settingsScreen, /setTimeZone\(getBrowserTimeZone\(\)\)/);
  assert.match(settingsScreen, /hasCheckedInOnCurrentLocalDate\(habits, timeZone\)/);
});
