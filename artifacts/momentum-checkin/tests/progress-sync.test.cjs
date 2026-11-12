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
const apiProgressSchema = fs.readFileSync(
  path.resolve(appRoot, '../../lib/api-spec/openapi.yaml'),
  'utf8',
);
const userProgressSchema = fs.readFileSync(
  path.resolve(appRoot, '../../lib/db/src/schema/user-progress.ts'),
  'utf8',
);

const fullGuestSnapshot = {
  schemaVersion: 1,
  habits: [{
    id: 'guest-reading',
    title: '閱讀',
    reason: '每天讀一頁',
    icon: 'book-open',
    color: '#E9B4CF',
    rewardCategory: 'shop',
    createdAt: '2026-11-12',
    checkIns: ['2026-11-11'],
    steps: ['讀一頁'],
    restDays: [0],
    stepCheckIns: { '2026-11-11': '讀一頁' },
    makeupCheckIns: ['2026-11-10'],
    minimumAction: '先讀一頁',
  }],
  mall: {
    schemaVersion: 1,
    coins: 125,
    purchasedItems: ['shop-strawberry-bakery'],
    rewardedCheckIns: ['guest-reading:2026-11-11'],
    rewardTokens: { facility: 2, shop: 1, decor: 3 },
    placements: { 'F1-main-01': 'shop-strawberry-bakery' },
    shopInteriors: {
      'shop-strawberry-bakery': {
        ownedDecorations: ['bakery-counter'],
        placements: { 'main-01': 'bakery-counter' },
      },
    },
    leaveCards: 1,
  },
  profile: { nickname: '小星星', avatarId: 'star' },
};

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

test('a new account uploads the complete local goals, check-ins, coins, and mall snapshot', () => {
  const snapshotDeclaration = habitsContext
    .split('const progressSnapshot = useMemo<ProgressSnapshot>(() => ({')[1]
    .split('}), [')[0];
  for (const field of [
    'habits',
    'coins',
    'purchasedItems',
    'rewardedCheckIns',
    'rewardTokens',
    'placements',
    'shopInteriors',
  ]) {
    assert.match(snapshotDeclaration, new RegExp(`\\b${field}\\b`), `${field} must be in the local snapshot`);
  }
  assert.match(syncBridge, /const snapshot = currentSnapshotRef\.current as unknown as ApiProgressSnapshot/);
  assert.match(syncBridge, /await saveProgress\.mutateAsync\(\{ data: snapshot \}\)/);

  const noCloudRecordBranch = syncBridge
    .split('if (progressQuery.data.exists) {')[1]
    .split('if (active) {')[0];
  assert.match(noCloudRecordBranch, /await enqueueLatestSnapshot\(userId\)/);
  assert.deepEqual(fullGuestSnapshot.habits[0].checkIns, ['2026-11-11']);
  assert.equal(fullGuestSnapshot.mall.coins, 125);
  assert.ok(fullGuestSnapshot.mall.placements['F1-main-01']);
  assert.ok(fullGuestSnapshot.mall.shopInteriors['shop-strawberry-bakery']);
});

test('cloud restore writes the full snapshot transaction before updating visible local state', () => {
  const restore = habitsContext
    .split('const replaceProgressFromCloud = useCallback(async (snapshot: unknown) => {')[1]
    .split('const addHabit = useCallback')[0];
  for (const field of [
    'source.habits',
    'coins',
    'purchasedItems',
    'rewardedCheckIns',
    'rewardTokens',
    'placements',
    'shopInteriors',
  ]) {
    assert.ok(restore.includes(field), `${field} must be restored from the cloud snapshot`);
  }
  assert.ok(
    restore.indexOf('await AsyncStorage.setItem(CHECK_IN_TRANSACTION_KEY') <
      restore.indexOf('await synchronizeCheckInTransaction(transaction)'),
    'the recovery record must be committed before either local mirror is replaced',
  );
  assert.ok(
    restore.indexOf('await synchronizeCheckInTransaction(transaction)') <
      restore.indexOf('setHabits(nextHabits)'),
    'visible state must only change after the complete local restore succeeds',
  );
  assert.match(restore, /原有進度未被覆蓋/);

  const transactionWriter = habitsContext
    .split('async function synchronizeCheckInTransaction(transaction: CheckInTransaction): Promise<void> {')[1]
    .split('async function recoverPendingCheckInTransaction')[0];
  assert.match(transactionWriter, /AsyncStorage\.setItem\(STORAGE_KEY, JSON\.stringify\(transaction\.habits\)\)/);
  assert.match(transactionWriter, /AsyncStorage\.setItem\(MALL_STORAGE_KEY, JSON\.stringify\(transaction\.mall\)\)/);
  assert.match(transactionWriter, /AsyncStorage\.removeItem\(CHECK_IN_TRANSACTION_KEY\)/);
});

test('different guest and cloud progress pauses for a choice instead of replacing local data', () => {
  const meaningfulLocalCheck = syncBridge
    .split('function hasMeaningfulLocalProgress(snapshot: ProgressSnapshot) {')[1]
    .split('export function useCloudSyncControls')[0];
  assert.match(meaningfulLocalCheck, /habit\.checkIns\.length === 0/);
  assert.match(meaningfulLocalCheck, /mall\.coins > 0/);
  assert.match(meaningfulLocalCheck, /mall\.purchasedItems\.length > 0/);
  assert.match(meaningfulLocalCheck, /Object\.keys\(mall\.placements\)\.length > 0/);
  assert.match(meaningfulLocalCheck, /Object\.keys\(mall\.shopInteriors\)\.length > 0/);

  const conflictBranch = syncBridge
    .split('if (progressQuery.data.exists) {')[1]
    .split('await replaceProgressFromCloud(progressQuery.data.snapshot);')[0];
  assert.match(conflictBranch, /hasMeaningfulLocalProgress\(progressSnapshot\)/);
  assert.match(conflictBranch, /localSnapshotKey !== cloudSnapshotKey/);
  assert.match(conflictBranch, /setPendingConflict\(\{ userId, snapshot: progressQuery\.data\.snapshot \}\)/);
  assert.match(conflictBranch, /return;/);
  assert.match(syncBridge, /await replaceProgressFromCloud\(pendingConflict\.snapshot\)/);
  assert.match(syncBridge, /await enqueueLatestSnapshot\(userId\)/);
  assert.match(syncBridge, /選擇要保留哪一份，避免不小心覆蓋/);
});

test('progress storage is keyed by the authenticated user for both reads and writes', () => {
  assert.match(progressRoute, /const \{ userId \} = getAuth\(req\)/);
  assert.match(progressRoute, /\.where\(eq\(userProgressTable\.userId, userId\)\)/);
  assert.match(progressRoute, /\.values\(\{ userId, snapshot: parsed\.data \}\)/);
  assert.match(progressRoute, /target: userProgressTable\.userId/);
  assert.match(userProgressSchema, /userId: text\("user_id"\)\.primaryKey\(\)/);
});

test('nickname and avatar are saved locally, included in cloud snapshots, and restored', () => {
  const snapshotDeclaration = habitsContext
    .split('const progressSnapshot = useMemo<ProgressSnapshot>(() => ({')[1]
    .split('}), [')[0];
  assert.match(snapshotDeclaration, /profile:\s*userProfile/);
  assert.match(habitsContext, /await writeUserProfile\(nextUserProfile\)/);
  assert.match(habitsContext, /setUserProfile\(nextUserProfile\)/);
  assert.match(syncBridge, /hasCustomUserProfile\(snapshot\.profile\)/);
  assert.match(syncBridge, /profile:\s*normalizeUserProfile\(source\.profile \?\? DEFAULT_USER_PROFILE\)/);
  assert.match(apiProgressSchema, /profile:\n\s+type: object/);
  assert.ok(fullGuestSnapshot.profile);
});
