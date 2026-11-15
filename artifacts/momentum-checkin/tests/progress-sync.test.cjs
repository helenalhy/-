const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const typescript = require('typescript');

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

function findVariableArrowCallback(source, variableName) {
  const sourceFile = typescript.createSourceFile('source.ts', source, typescript.ScriptTarget.Latest, true);
  let callback;
  function visit(node) {
    if (
      typescript.isVariableDeclaration(node)
      && typescript.isIdentifier(node.name)
      && node.name.text === variableName
      && typescript.isCallExpression(node.initializer)
      && typescript.isArrowFunction(node.initializer.arguments[0])
    ) {
      callback = node.initializer.arguments[0];
    }
    typescript.forEachChild(node, visit);
  }
  visit(sourceFile);
  assert.ok(callback, `Could not find the ${variableName} callback`);
  return typescript.transpileModule(`const callback = ${callback.getText(sourceFile)};`, {
    compilerOptions: {
      module: typescript.ModuleKind.None,
      target: typescript.ScriptTarget.ES2022,
    },
  }).outputText;
}

function findFunctionDeclarations(source, functionNames) {
  const sourceFile = typescript.createSourceFile('source.ts', source, typescript.ScriptTarget.Latest, true);
  const declarations = new Map();
  function visit(node) {
    if (typescript.isFunctionDeclaration(node) && node.name && functionNames.includes(node.name.text)) {
      declarations.set(node.name.text, node.getText(sourceFile));
    }
    typescript.forEachChild(node, visit);
  }
  visit(sourceFile);
  for (const name of functionNames) assert.ok(declarations.has(name), `Could not find ${name}`);
  return typescript.transpileModule([...declarations.values()].join('\n'), {
    compilerOptions: {
      module: typescript.ModuleKind.None,
      target: typescript.ScriptTarget.ES2022,
    },
  }).outputText;
}

function createMemoryStorage() {
  const values = new Map();
  let failedSetKey = null;
  return {
    values,
    failNextSet(key) {
      failedSetKey = key;
    },
    async getItem(key) {
      return values.get(key) ?? null;
    },
    async setItem(key, value) {
      if (failedSetKey === key) {
        failedSetKey = null;
        throw new Error(`simulated storage failure: ${key}`);
      }
      values.set(key, value);
    },
    async removeItem(key) {
      values.delete(key);
    },
  };
}

function loadScheduleHelpers() {
  const scheduleSource = fs.readFileSync(path.join(appRoot, 'lib/habit-schedule.ts'), 'utf8');
  const compiled = typescript.transpileModule(scheduleSource, {
    compilerOptions: {
      module: typescript.ModuleKind.CommonJS,
      target: typescript.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
  }).outputText;
  const loaded = { exports: {} };
  new Function('require', 'module', 'exports', compiled)(
    () => { throw new Error('Habit schedule helpers should not require runtime modules.'); },
    loaded,
    loaded.exports,
  );
  return loaded.exports;
}

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

test('web API calls keep the current origin while native uses the configured host', () => {
  const configureBaseUrl = layout
    .split('const publicDomain = process.env.EXPO_PUBLIC_DOMAIN;')[1]
    .split('const clerkPublishableKey:')[0];
  function configuredUrls(platform, domain, apiBaseUrl) {
    const calls = [];
    vm.runInNewContext(
      `const publicDomain = process.env.EXPO_PUBLIC_DOMAIN;\n${configureBaseUrl}`,
      {
        Platform: { OS: platform },
        process: { env: { EXPO_PUBLIC_DOMAIN: domain, EXPO_PUBLIC_API_BASE_URL: apiBaseUrl } },
        setBaseUrl: (url) => calls.push(url),
      },
    );
    return calls;
  }
  assert.deepEqual(configuredUrls('web', 'build-host.example.com'), [null]);
  assert.deepEqual(configuredUrls('web', undefined), [null]);
  assert.deepEqual(
    configuredUrls('web', 'build-host.example.com', 'https://momentum-api-ue0x.onrender.com'),
    ['https://momentum-api-ue0x.onrender.com'],
  );
  for (const platform of ['ios', 'android']) {
    assert.deepEqual(configuredUrls(platform, 'build-host.example.com'), [
      'https://build-host.example.com',
    ]);
    assert.deepEqual(configuredUrls(platform, undefined), []);
    assert.deepEqual(
      configuredUrls(platform, 'build-host.example.com', 'https://momentum-api-ue0x.onrender.com'),
      ['https://momentum-api-ue0x.onrender.com'],
    );
  }
  assert.match(layout, /setAuthTokenGetter\(\(\) => getToken\(\)\)/);
});

test('the configured Clerk token is sent as a bearer Authorization header', async () => {
  const customFetchSource = fs.readFileSync(
    path.resolve(appRoot, '../../lib/api-client-react/src/custom-fetch.ts'),
    'utf8',
  );
  const typescript = require('typescript');
  const compiled = typescript.transpileModule(customFetchSource, {
    compilerOptions: {
      module: typescript.ModuleKind.CommonJS,
      target: typescript.ScriptTarget.ES2022,
    },
  }).outputText;
  const module = { exports: {} };
  let capturedAuthorization;
  const context = {
    exports: module.exports,
    module,
    Headers,
    Request,
    URL,
    Response,
    fetch: async (_input, init) => {
      capturedAuthorization = new Headers(init.headers).get('authorization');
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    },
  };
  vm.runInNewContext(compiled, context);
  module.exports.setAuthTokenGetter(() => 'test-clerk-token');
  const result = await module.exports.customFetch('/api/progress', { responseType: 'json' });

  assert.equal(capturedAuthorization, 'Bearer test-clerk-token');
  assert.deepEqual(JSON.parse(JSON.stringify(result)), { ok: true });
});

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

test('a failed local mirror is repaired after restart without repeating makeup coins or weekly use', async () => {
  const storageKeys = {
    habits: 'momentum.habits.v1',
    mall: 'momentum.mall.v1',
    transaction: 'momentum.checkin-transaction.v1',
  };
  const transactionFunctions = findFunctionDeclarations(habitsContext, [
    'synchronizeCheckInTransaction',
    'recoverPendingCheckInTransaction',
  ]);
  const makeTransactionModule = new Function(
    'STORAGE_KEY',
    'MALL_STORAGE_KEY',
    'CHECK_IN_TRANSACTION_KEY',
    'parseCheckInTransaction',
    `return (AsyncStorage) => { ${transactionFunctions}; return { synchronizeCheckInTransaction, recoverPendingCheckInTransaction }; };`,
  )(
    storageKeys.habits,
    storageKeys.mall,
    storageKeys.transaction,
    (value) => value === null ? null : JSON.parse(value),
  );
  const { canMakeUpYesterday, getPreviousLocalDate } = loadScheduleHelpers();
  const initialHabits = [
    { id: 'habit-a', checkIns: [], makeupCheckIns: [], restDays: [] },
    { id: 'habit-b', checkIns: [], makeupCheckIns: [], restDays: [] },
  ];
  const initialMall = {
    coins: 50,
    purchasedItems: [],
    rewardedCheckIns: [],
    rewardTokens: { facility: 0, shop: 0, decor: 0 },
  };

  for (const failedMirrorKey of [storageKeys.habits, storageKeys.mall]) {
    const storage = createMemoryStorage();
    const transactionModule = makeTransactionModule(storage);
    storage.failNextSet(failedMirrorKey);
    const actionLock = { current: false };
    const setStorageError = () => {};
    const context = {
      actionLock,
      mallLoadErrorRef: { current: false },
      habits: initialHabits,
      rewardedCheckIns: initialMall.rewardedCheckIns,
      today: '2026-05-04',
      canMakeUpYesterday,
      getPreviousLocalDate,
      recoverPendingCheckInTransaction: () => transactionModule.recoverPendingCheckInTransaction(),
      setHabits: () => {},
      setCoins: () => {},
      setRewardedCheckIns: () => {},
      setRewardTokens: () => {},
      setStorageError,
      AsyncStorage: storage,
      CHECK_IN_TRANSACTION_KEY: storageKeys.transaction,
      MALL_SCHEMA_VERSION: 6,
      CHECK_IN_REWARD: 20,
      MAKEUP_USE_PREFIX: 'makeup-used:',
      coins: initialMall.coins,
      purchasedItems: initialMall.purchasedItems,
      mallPlacements: {},
      shopInteriors: {},
      rewardTokens: initialMall.rewardTokens,
      leaveCards: 0,
      protectedStreakDates: [],
      weeklyChallengeRewardPlans: {},
      weeklyChallengeRewardedWeeks: [],
      dailyLoginLastDate: null,
      dailyLoginStreak: 0,
      dailyLoginLastPrizeItemId: null,
      synchronizeCheckInTransaction: transactionModule.synchronizeCheckInTransaction,
      Haptics: { notificationAsync: async () => {} },
    };
    const callbackSource = findVariableArrowCallback(habitsContext, 'makeUpYesterday');
    const makeUpYesterday = new Function(
      ...Object.keys(context),
      `${callbackSource}; return callback;`,
    )(...Object.values(context));

    assert.equal(await makeUpYesterday('habit-a'), 20);
    assert.ok(storage.values.has(storageKeys.transaction), 'a failed mirror must leave the recovery record');

    // A fresh app session replays the committed transaction to both local mirrors.
    await transactionModule.recoverPendingCheckInTransaction();
    assert.equal(storage.values.has(storageKeys.transaction), false);
    const recoveredHabits = JSON.parse(storage.values.get(storageKeys.habits));
    const recoveredMall = JSON.parse(storage.values.get(storageKeys.mall));
    assert.deepEqual(recoveredHabits[0].checkIns, ['2026-05-03']);
    assert.deepEqual(recoveredHabits[0].makeupCheckIns, ['2026-05-03']);
    assert.equal(recoveredMall.coins, 70);
    assert.equal(recoveredMall.rewardedCheckIns.filter((key) => key === 'habit-a:2026-05-03').length, 1);
    assert.equal(recoveredMall.rewardedCheckIns.filter((key) => key === 'makeup-used:2026-05-03').length, 1);

    // The account-wide usage record still blocks a different goal after the original is deleted.
    const remainingHabit = { checkIns: [], makeupCheckIns: [], restDays: [] };
    const accountMakeups = [
      ...remainingHabit.makeupCheckIns,
      ...recoveredMall.rewardedCheckIns
        .filter((key) => key.startsWith('makeup-used:'))
        .map((key) => key.slice('makeup-used:'.length)),
    ];
    assert.equal(canMakeUpYesterday(remainingHabit, '2026-05-04', accountMakeups), false);
  }
});

test('a cloud save retry sends the same makeup snapshot without adding its reward again', async () => {
  const snapshot = {
    schemaVersion: 1,
    habits: [{
      id: 'habit-a',
      checkIns: ['2026-05-03'],
      makeupCheckIns: ['2026-05-03'],
    }],
    mall: {
      coins: 70,
      rewardedCheckIns: ['habit-a:2026-05-03', 'makeup-used:2026-05-03'],
    },
  };
  const currentUserRef = { current: 'user-1' };
  const currentSnapshotRef = { current: snapshot };
  const lastSyncedSnapshotRef = { current: null };
  const saveQueueRef = { current: Promise.resolve() };
  const savedPayloads = [];
  let cloudSnapshot = null;
  let attempts = 0;
  const context = {
    saveQueueRef,
    currentUserRef,
    currentSnapshotRef,
    saveProgress: {
      mutateAsync: async ({ data }) => {
        attempts += 1;
        savedPayloads.push(JSON.stringify(data));
        if (attempts === 1) throw new Error('simulated offline cloud save');
        // The API stores a snapshot, replacing the row instead of applying a coin delta.
        cloudSnapshot = structuredClone(data);
      },
    },
    lastSyncedSnapshotRef,
  };
  const callbackSource = findVariableArrowCallback(syncBridge, 'enqueueLatestSnapshot');
  const enqueueLatestSnapshot = new Function(
    ...Object.keys(context),
    `${callbackSource}; return callback;`,
  )(...Object.values(context));

  await assert.rejects(enqueueLatestSnapshot('user-1'), /simulated offline cloud save/);
  assert.equal(await enqueueLatestSnapshot('user-1'), JSON.stringify(snapshot));
  assert.equal(attempts, 2);
  assert.equal(savedPayloads[0], savedPayloads[1]);
  assert.equal(cloudSnapshot.mall.coins, 70);
  assert.equal(cloudSnapshot.mall.rewardedCheckIns.filter((key) => key === 'habit-a:2026-05-03').length, 1);
  assert.equal(cloudSnapshot.mall.rewardedCheckIns.filter((key) => key === 'makeup-used:2026-05-03').length, 1);
  assert.equal(lastSyncedSnapshotRef.current, JSON.stringify(snapshot));
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
