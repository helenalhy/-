// Exercise the real provider and persistence with a minimal hook runner.
// Run: node --test artifacts/momentum-checkin/tests/mall-collection.test.cjs
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const source = ts.transpileModule(
  fs.readFileSync(path.join(__dirname, '../context/HabitsContext.tsx'), 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React, esModuleInterop: true } },
).outputText;
const key = 'momentum.mall.v1';
const habitsKey = 'momentum.habits.v1';
const checkInTransactionKey = 'momentum.checkin-transaction.v1';

async function mount(storage, { failWritesOnLoad = false, expectedStorageError = null } = {}) {
  const states = [];
  const effects = [];
  let cursor = 0;
  let firstRender = true;
  let value;
  let failWrites = failWritesOnLoad;
  let failWriteKey = null;
  let writeCount = 0;
  const react = {
    createContext: () => ({ Provider: 'Provider' }),
    createElement: (_, props) => { value = props.value; },
    useState: (initial) => {
      const index = cursor++;
      if (firstRender) states[index] = initial;
      return [states[index], (next) => { states[index] = next; }];
    },
    useRef: (initial) => {
      const index = cursor++;
      if (firstRender) states[index] = { current: initial };
      return states[index];
    },
    useEffect: (effect) => { if (firstRender) effects.push(effect); },
    useCallback: (fn) => fn,
    useMemo: (fn) => fn(),
  };
  const module = { exports: {} };
  const mockedRequire = (name) => {
    if (name === 'react') return react;
    if (name === '@/constants/colors') return { light: {} };
    if (name === '@/constants/mall-layout') return {
      MALL_SLOT_IDS: [
        ...[3, 2, 1, 4, 5, 6, 7, 8, 9, 10].flatMap((floor) =>
          ['left', 'center', 'right'].map((column) => `floor-${floor}-${column}`)),
        ...[3, 2, 1, 4, 5, 6, 7, 8, 9, 10].flatMap((floor) =>
          [1, 2, 3].flatMap((row) => ['left', 'center', 'right'].map((column) => `floor-${floor}-plaza-${row}-${column}`))),
        ...[3, 2, 1, 4, 5, 6, 7, 8, 9, 10].flatMap((floor) =>
          [1, 2, 3, 4].flatMap((row) => ['left', 'right'].map((column) => `floor-${floor}-annex-${row}-${column}`))),
        ...[3, 2, 1, 4, 5, 6, 7, 8, 9, 10].flatMap((floor) =>
          [1, 2, 3, 4].flatMap((row) => ['left', 'center', 'right'].map((column) => `floor-${floor}-extension-${row}-${column}`))),
        ...[3, 2, 1, 4, 5, 6, 7, 8, 9, 10].flatMap((floor) =>
          [1, 2, 3, 4].flatMap((row) => ['left', 'center', 'right'].map((column) => `floor-${floor}-extension3-${row}-${column}`))),
        ...[3, 2, 1, 4, 5, 6, 7, 8, 9, 10].flatMap((floor) =>
          [1, 2, 3, 4].flatMap((row) => ['left', 'center', 'right'].map((column) => `floor-${floor}-extension4-${row}-${column}`))),
      ],
    };
    if (name === '@/constants/mall-shop-interior') return {
      SHOP_INTERIOR_DECORATION_IDS: ['general-display-shelf', 'general-warm-lamp'],
      SHOP_INTERIOR_SLOT_IDS: [
        'front-window', 'left-wall', 'center', 'right-wall', 'back-wall', 'counter', 'left-table', 'right-table',
      ],
      SHOP_INTERIOR_PLACEMENT_IDS: [
        'front-window', 'left-wall', 'center', 'right-wall', 'back-wall', 'counter', 'left-table', 'right-table',
        ...['extension-1', 'extension-2', 'extension-3', 'extension-4', 'extension-5'].flatMap((area) =>
          ['front-window', 'left-wall', 'center', 'right-wall', 'back-wall', 'counter', 'left-table', 'right-table']
            .map((slot) => `${area}:${slot}`)),
      ],
      SHOP_INTERIOR_DECORATION_BY_ID: {
        'general-display-shelf': { id: 'general-display-shelf', price: 20 },
        'general-warm-lamp': { id: 'general-warm-lamp', price: 25 },
      },
    };
    if (name === 'expo-haptics') return {
      selectionAsync: async () => {},
      notificationAsync: async () => {},
      impactAsync: async () => {},
      ImpactFeedbackStyle: { Light: 'light' },
      NotificationFeedbackType: { Success: 'success' },
    };
    if (name === '@react-native-async-storage/async-storage') return {
      getItem: async (name) => storage[name] ?? null,
      setItem: async (name, data) => {
        writeCount += 1;
        if (failWrites || name === failWriteKey) throw new Error('disk full');
        storage[name] = data;
      },
      removeItem: async (name) => {
        if (failWrites || name === failWriteKey) throw new Error('disk full');
        delete storage[name];
      },
    };
    throw new Error(`Unexpected dependency: ${name}`);
  };
  new Function('require', 'module', 'exports', source)(mockedRequire, module, module.exports);
  const render = () => {
    cursor = 0;
    module.exports.HabitsProvider({ children: null });
    firstRender = false;
    return value;
  };
  render();
  effects.forEach((effect) => effect());
  await new Promise((resolve) => setImmediate(resolve));
  render();
  assert.equal(value.isLoading, false);
  if (expectedStorageError) assert.match(value.storageError, expectedStorageError);
  else assert.equal(value.storageError, null);
  return {
    get value() { return render(); },
    get writeCount() { return writeCount; },
    setFailWrites(next) { failWrites = next; },
    setFailWriteKey(next) { failWriteKey = next; },
  };
}

function seed(overrides = {}) {
  return { [key]: JSON.stringify({
    coins: 100, purchasedItems: ['a', 'b'], rewardedCheckIns: [],
    rewardTokens: { facility: 3, shop: 4, decor: 5 },
    placements: { 'floor-1-left': 'a', 'floor-3-right': 'b' },
    ...overrides,
  }) };
}

test('legacy migration preserves positions and assigns only missing legacy purchases', async () => {
  const storage = seed({ purchasedItems: ['a', 'b', 'c'] });
  const app = await mount(storage);
  assert.deepEqual(app.value.mallPlacements, {
    'floor-1-left': 'a', 'floor-3-right': 'b', 'floor-3-left': 'c',
  });
  assert.equal(JSON.parse(storage[key]).schemaVersion, 3);
  const noPositions = await mount(seed({ placements: undefined }));
  assert.deepEqual(noPositions.value.mallPlacements, { 'floor-3-left': 'a', 'floor-3-center': 'b' });
});

test('store, reload, reward, restore on another floor, swap and reload preserve ownership and balances', async () => {
  const storage = seed();
  let app = await mount(storage);
  const originalTokens = { ...app.value.rewardTokens };
  await app.value.storeMallItem('a');
  assert.deepEqual(app.value.mallPlacements, { 'floor-3-right': 'b' });
  assert.deepEqual(app.value.purchasedItems, ['a', 'b']);
  assert.equal(app.value.coins, 100);
  assert.deepEqual(app.value.rewardTokens, originalTokens);
  app = await mount(storage);
  assert.deepEqual(app.value.mallPlacements, { 'floor-3-right': 'b' });
  await app.value.toggleCheckIn('starter-walk');
  assert.equal(JSON.parse(storage[key]).schemaVersion, 3);
  app = await mount(storage);
  assert.equal(Object.values(app.value.mallPlacements).includes('a'), false);
  const before = { coins: app.value.coins, tokens: { ...app.value.rewardTokens } };
  await assert.rejects(app.value.moveMallItem('a', 'floor-3-right'));
  await app.value.moveMallItem('a', 'floor-10-center');
  await app.value.moveMallItem('a', 'floor-3-right');
  app = await mount(storage);
  assert.deepEqual(app.value.mallPlacements, { 'floor-3-right': 'a', 'floor-10-center': 'b' });
  assert.equal(app.value.coins, before.coins);
  assert.deepEqual(app.value.rewardTokens, before.tokens);
  await assert.rejects(app.value.purchaseMallItem('a', 20, 'shop', 1, 'floor-1-center'));
});

test('empty versioned placements stay empty, even with more purchases than slots', async () => {
  const items = Array.from({ length: 570 }, (_, index) => `item-${index}`);
  const storage = seed({ schemaVersion: 2, purchasedItems: items, placements: {} });
  const app = await mount(storage);
  assert.deepEqual(app.value.mallPlacements, {});
  assert.deepEqual(app.value.purchasedItems, items);
  const reopened = await mount(storage);
  assert.deepEqual(reopened.value.mallPlacements, {});
});

test('normalization removes invalid slots, duplicate placements and unowned items without placing collection items', async () => {
  const storage = seed({
    schemaVersion: 2,
    placements: {
      'floor-1-left': 'a', 'floor-2-right': 'a',
      'floor-11-left': 'b', 'floor-3-right': 'unowned',
    },
  });
  const app = await mount(storage);
  assert.deepEqual(app.value.mallPlacements, { 'floor-1-left': 'a' });
  assert.deepEqual(app.value.purchasedItems, ['a', 'b']);
});

test('legacy overflow retains every purchase and does not refill a deliberately emptied slot on reload', async () => {
  const items = Array.from({ length: 570 }, (_, index) => `item-${index}`);
  const storage = seed({ purchasedItems: items, placements: undefined });
  let app = await mount(storage);
  assert.equal(Object.keys(app.value.mallPlacements).length, 560);
  assert.equal(app.value.purchasedItems.length, 570);
  await app.value.storeMallItem('item-0');
  app = await mount(storage);
  assert.equal(Object.keys(app.value.mallPlacements).length, 559);
  assert.equal(app.value.purchasedItems.length, 570);
  assert.equal(Object.values(app.value.mallPlacements).includes('item-0'), false);
});

test('failed storage does not remove the scene item or alter saved ownership', async () => {
  const storage = seed();
  const app = await mount(storage);
  const original = storage[key];
  app.setFailWrites(true);
  await assert.rejects(app.value.storeMallItem('a'), /無法儲存/);
  assert.equal(app.value.mallPlacements['floor-1-left'], 'a');
  assert.equal(storage[key], original);
  app.setFailWrites(false);
  await app.value.storeMallItem('a');
  assert.equal(app.value.mallPlacements['floor-1-left'], undefined);
  await assert.rejects(app.value.storeMallItem('not-owned'));
  await assert.rejects(app.value.moveMallItem('not-owned', 'floor-1-left'));
});

test('new purchase still charges once and persists alongside a stored item', async () => {
  const storage = seed();
  let app = await mount(storage);
  await app.value.storeMallItem('a');
  await app.value.purchaseMallItem('c', 30, 'decor', 2, 'floor-1-left');
  app = await mount(storage);
  assert.equal(app.value.coins, 70);
  assert.equal(app.value.rewardTokens.decor, 5);
  assert.deepEqual(app.value.purchasedItems, ['a', 'b', 'c']);
  assert.deepEqual(app.value.mallPlacements, { 'floor-3-right': 'b', 'floor-1-left': 'c' });
  await app.value.moveMallItem('a', 'floor-9-right');
  assert.equal(app.value.coins, 70);
  assert.equal(app.value.rewardTokens.decor, 5);
});

test('checking out and completing the same goal again today only awards coins once, including after reload', async () => {
  const storage = seed({
    schemaVersion: 3,
    coins: 0,
    purchasedItems: [],
    rewardedCheckIns: [],
    placements: {},
  });
  let app = await mount(storage);
  const today = app.value.today;
  const rewardKey = `starter-walk:${today}`;

  assert.equal(app.value.coins, 0);
  assert.equal(await app.value.toggleCheckIn('starter-walk'), 20);
  assert.ok(app.value.habits.find((habit) => habit.id === 'starter-walk').checkIns.includes(today));
  assert.equal(app.value.coins, 20);

  assert.equal(await app.value.toggleCheckIn('starter-walk'), 0);
  assert.ok(!app.value.habits.find((habit) => habit.id === 'starter-walk').checkIns.includes(today));
  assert.equal(app.value.coins, 20);
  assert.deepEqual(JSON.parse(storage[key]).rewardedCheckIns, [rewardKey]);

  assert.equal(await app.value.toggleCheckIn('starter-walk'), 0);
  assert.ok(app.value.habits.find((habit) => habit.id === 'starter-walk').checkIns.includes(today));
  assert.equal(app.value.coins, 20, 'the same goal cannot award a second 20 coins today');
  assert.deepEqual(JSON.parse(storage[key]).rewardedCheckIns, [rewardKey]);

  app = await mount(storage);
  assert.ok(app.value.habits.find((habit) => habit.id === 'starter-walk').checkIns.includes(today));
  assert.equal(app.value.coins, 20);
  assert.deepEqual(JSON.parse(storage[key]).rewardedCheckIns, [rewardKey]);
});

test('a failed write-ahead record leaves both the completion and coin balance unchanged', async () => {
  const storage = seed({
    schemaVersion: 3,
    coins: 0,
    purchasedItems: [],
    rewardedCheckIns: [],
    placements: {},
  });
  const app = await mount(storage);
  const originalHabits = storage[habitsKey];
  const originalMall = storage[key];
  const today = app.value.today;

  app.setFailWrites(true);
  await assert.rejects(app.value.toggleCheckIn('starter-walk'), /無法儲存打卡紀錄/);

  assert.ok(!app.value.habits.find((habit) => habit.id === 'starter-walk').checkIns.includes(today));
  assert.equal(app.value.coins, 0);
  assert.equal(storage[habitsKey], originalHabits);
  assert.equal(storage[key], originalMall);
  assert.equal(storage[checkInTransactionKey], undefined);
});

for (const failingMirrorKey of [habitsKey, key]) {
  test(`partial ${failingMirrorKey} write keeps the check-in and coin balance together and recovers after reload`, async () => {
    const storage = seed({
      schemaVersion: 3,
      coins: 0,
      purchasedItems: [],
      rewardedCheckIns: [],
      placements: {},
    });
    let app = await mount(storage);
    const today = app.value.today;
    const rewardKey = `starter-walk:${today}`;

    app.setFailWriteKey(failingMirrorKey);
    assert.equal(await app.value.toggleCheckIn('starter-walk'), 20);
    assert.ok(app.value.habits.find((habit) => habit.id === 'starter-walk').checkIns.includes(today));
    assert.equal(app.value.coins, 20);
    assert.match(app.value.storageError, /打卡與金幣已一致記錄/);
    assert.ok(storage[checkInTransactionKey], 'the recovery record remains until both mirrors sync');

    app.setFailWriteKey(null);
    app = await mount(storage);
    assert.ok(app.value.habits.find((habit) => habit.id === 'starter-walk').checkIns.includes(today));
    assert.equal(app.value.coins, 20);
    assert.deepEqual(JSON.parse(storage[key]).rewardedCheckIns, [rewardKey]);
    assert.equal(storage[checkInTransactionKey], undefined);

    assert.equal(await app.value.toggleCheckIn('starter-walk'), 0);
    assert.equal(await app.value.toggleCheckIn('starter-walk'), 0);
    assert.ok(app.value.habits.find((habit) => habit.id === 'starter-walk').checkIns.includes(today));
    assert.equal(app.value.coins, 20);
  });
}

test('shop interior decorations spend earned coins once, can move for free, and persist per shop', async () => {
  const storage = seed({
    schemaVersion: 3,
    purchasedItems: ['a', 'b'],
    shopInteriors: {},
  });
  let app = await mount(storage);
  await app.value.placeShopInteriorDecoration('a', 'general-display-shelf', 'front-window');
  assert.equal(app.value.coins, 80);
  assert.deepEqual(app.value.shopInteriors.a, {
    ownedDecorations: ['general-display-shelf'],
    placements: { 'front-window': 'general-display-shelf' },
  });

  await app.value.placeShopInteriorDecoration('a', 'general-display-shelf', 'left-wall');
  assert.equal(app.value.coins, 80, 'moving an owned decoration is free');
  assert.deepEqual(app.value.shopInteriors.a.placements, { 'left-wall': 'general-display-shelf' });

  await app.value.placeShopInteriorDecoration('a', 'general-warm-lamp', 'front-window');
  assert.equal(app.value.coins, 55);
  assert.deepEqual(app.value.shopInteriors.a.ownedDecorations, ['general-display-shelf', 'general-warm-lamp']);
  app = await mount(storage);
  assert.deepEqual(app.value.shopInteriors.a, {
    ownedDecorations: ['general-display-shelf', 'general-warm-lamp'],
    placements: { 'left-wall': 'general-display-shelf', 'front-window': 'general-warm-lamp' },
  });

  await app.value.storeShopInteriorDecoration('a', 'left-wall');
  assert.equal(app.value.coins, 55, 'storing interior decor does not refund coins');
  assert.deepEqual(app.value.shopInteriors.a.ownedDecorations, ['general-display-shelf', 'general-warm-lamp']);
  assert.deepEqual(app.value.shopInteriors.a.placements, { 'front-window': 'general-warm-lamp' });
  const reopened = await mount(storage);
  assert.deepEqual(reopened.value.shopInteriors.a.placements, { 'front-window': 'general-warm-lamp' });

  await assert.rejects(reopened.value.placeShopInteriorDecoration('not-owned', 'general-display-shelf', 'left-wall'), /先兌換/);
  await assert.rejects(reopened.value.placeShopInteriorDecoration('a', 'unknown-decoration', 'left-wall'), /找不到/);
});

test('five interior extensions accept eight-position placement keys and preserve legacy main-area saves', async () => {
  const storage = seed({
    schemaVersion: 3,
    coins: 100,
    purchasedItems: ['a'],
    shopInteriors: {},
  });
  let app = await mount(storage);
  await app.value.placeShopInteriorDecoration('a', 'general-display-shelf', 'front-window');
  await app.value.placeShopInteriorDecoration('a', 'general-warm-lamp', 'center');
  await app.value.placeShopInteriorDecoration('a', 'general-warm-lamp', 'extension-3:right-table');

  assert.equal(app.value.coins, 55, 'moving owned decor into an extension is free');
  assert.deepEqual(app.value.shopInteriors.a.placements, {
    'front-window': 'general-display-shelf',
    'extension-3:right-table': 'general-warm-lamp',
  });

  app = await mount(storage);
  assert.deepEqual(app.value.shopInteriors.a.placements, {
    'front-window': 'general-display-shelf',
    'extension-3:right-table': 'general-warm-lamp',
  });
  await app.value.storeShopInteriorDecoration('a', 'extension-3:right-table');
  assert.deepEqual(app.value.shopInteriors.a.placements, {
    'front-window': 'general-display-shelf',
  });
  await assert.rejects(
    app.value.placeShopInteriorDecoration('a', 'general-warm-lamp', 'extension-6:center'),
    /不存在/,
  );
});

test('existing versioned habits and mall hydrate without any startup writes on a full device', async () => {
  const storage = seed({ schemaVersion: 3, placements: { 'floor-1-left': 'a' } });
  const habits = [{
    id: 'saved-habit', title: '已儲存目標', reason: '保留我的紀錄',
    icon: 'activity', rewardCategory: 'facility', createdAt: '2026-01-01', checkIns: ['2026-10-20'],
  }];
  storage['momentum.habits.v1'] = JSON.stringify(habits);
  const original = { ...storage };
  const app = await mount(storage, { failWritesOnLoad: true });
  assert.equal(app.writeCount, 0);
  assert.equal(app.value.habits[0].title, '已儲存目標');
  assert.deepEqual(app.value.habits[0].checkIns, ['2026-10-20']);
  assert.equal(app.value.coins, 100);
  assert.deepEqual(app.value.rewardTokens, { facility: 3, shop: 4, decor: 5 });
  assert.deepEqual(app.value.purchasedItems, ['a', 'b']);
  assert.deepEqual(app.value.mallPlacements, { 'floor-1-left': 'a' });
  assert.deepEqual(storage, original);
});

test('failed legacy migration writes still show successfully read habits, ownership and placements', async () => {
  const storage = seed();
  storage['momentum.habits.v1'] = JSON.stringify([{
    id: 'saved', title: '已儲存目標', icon: 'book-open', checkIns: ['2026-10-20'],
  }]);
  const original = { ...storage };
  const app = await mount(storage, { failWritesOnLoad: true, expectedStorageError: /紀錄已載入/ });
  assert.equal(app.value.habits[0].title, '已儲存目標');
  assert.equal(app.value.coins, 100);
  assert.deepEqual(app.value.purchasedItems, ['a', 'b']);
  assert.deepEqual(app.value.mallPlacements, { 'floor-1-left': 'a', 'floor-3-right': 'b' });
  assert.deepEqual(storage, original);
});
