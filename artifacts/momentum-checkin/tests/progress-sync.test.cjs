const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const appRoot = path.resolve(__dirname, '..');
const readApp = (relativePath) => fs.readFileSync(path.join(appRoot, relativePath), 'utf8');
const layout = readApp('app/_layout.tsx');
const syncBridge = readApp('context/ProgressSyncBridge.tsx');
const habitsContext = readApp('context/HabitsContext.tsx');
const progressRoute = fs.readFileSync(
  path.resolve(appRoot, '../api-server/src/routes/progress.ts'),
  'utf8',
);

test('a restored connection wakes progress synchronization on native and web', () => {
  assert.match(layout, /onlineManager\.setEventListener/);
  assert.match(layout, /Network\.addNetworkStateListener/);
  assert.match(layout, /Network\.getNetworkStateAsync/);
  assert.match(syncBridge, /refetchOnReconnect: true/);
  assert.match(syncBridge, /const reconnected = !wasOnline && isOnline/);
  assert.match(syncBridge, /if \([\s\S]*reconnected[\s\S]*void retry\(\)/);
});

test('an offline account lookup keeps local progress pending until cloud reconciliation', () => {
  assert.match(
    syncBridge,
    /if \(progressQuery\.isError\) \{\s*reconcilePendingRef\.current = true;\s*setReadyUserId\(null\);/,
  );
  assert.match(syncBridge, /reconcilePendingRef\.current\s*\|\|/);
  assert.match(syncBridge, /setPendingConflict\(\{ userId, snapshot: progressQuery\.data\.snapshot \}\)/);
  assert.match(syncBridge, /選擇要保留哪一份，避免不小心覆蓋/);
});

test('queued cloud writes serialize and take the newest local snapshot at send time', () => {
  assert.match(syncBridge, /saveQueueRef\.current\.catch\(\(\) => \{\}\)\.then\(async \(\) => \{/);
  assert.match(syncBridge, /const snapshot = currentSnapshotRef\.current as unknown as ApiProgressSnapshot/);
  assert.match(syncBridge, /saveQueueRef\.current = work\.then\(\(\) => undefined, \(\) => undefined\)/);
  assert.match(syncBridge, /await enqueueLatestSnapshot\(userId\)/);
});

test('offline check-ins journal completion and its coin reward before mirroring local storage', () => {
  const checkIn = habitsContext.split('const toggleCheckIn = useCallback')[1]
    .split('const makeUpYesterday = useCallback')[0];
  assert.match(checkIn, /if \(!snapshot\.rewardedCheckIns\.includes\(rewardKey\)\) reward = requestedReward/);
  assert.match(checkIn, /coins: snapshot\.coins \+ reward/);
  assert.match(checkIn, /rewardedCheckIns: \[\.\.\.snapshot\.rewardedCheckIns, rewardKey\]/);
  assert.ok(
    checkIn.indexOf('await AsyncStorage.setItem(CHECK_IN_TRANSACTION_KEY') <
      checkIn.indexOf('await synchronizeCheckInTransaction(transaction)'),
  );
});

test('repeating a sync replaces the saved snapshot instead of applying rewards again', () => {
  assert.match(progressRoute, /\.insert\(userProgressTable\)/);
  assert.match(progressRoute, /\.onConflictDoUpdate\(/);
  assert.match(progressRoute, /set: \{ snapshot: parsed\.data, updatedAt: new Date\(\) \}/);
  assert.doesNotMatch(progressRoute, /coins\s*\+\s*parsed\.data/);
});
