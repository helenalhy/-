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
const dogId = 'general-fluffy-staff-huahua';
const dogOutfits = [`${dogId}:outfit:01`, `${dogId}:outfit:02`];
const dogAccessories = [`${dogId}:accessory:01`, `${dogId}:accessory:02`];
const dogStations = [
  { id: 'entrance-greeting', label: '入口迎賓', areaId: 'extension-1' },
  { id: 'window-side', label: '窗邊座位', areaId: 'extension-1' },
];

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
      if (firstRender) states[index] = typeof initial === 'function' ? initial() : initial;
      return [states[index], (next) => {
        states[index] = typeof next === 'function' ? next(states[index]) : next;
      }];
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
        'floor-20-left',
      ],
    };
    if (name === '@/constants/mall-shop-interior') return {
      SHOP_INTERIOR_DECORATION_IDS: ['general-display-shelf', 'general-warm-lamp', dogId],
      SHOP_INTERIOR_SLOT_IDS: [
        'front-window', 'left-wall', 'center', 'right-wall', 'back-wall', 'counter', 'left-table', 'right-table',
      ],
      SHOP_INTERIOR_PLACEMENT_IDS: [
        'front-window', 'left-wall', 'center', 'right-wall', 'back-wall', 'counter', 'left-table', 'right-table',
        ...['extension-1', 'extension-2', 'extension-3', 'extension-4', 'extension-5'].flatMap((area) =>
          ['front-window', 'left-wall', 'center', 'right-wall', 'back-wall', 'counter', 'left-table', 'right-table']
            .map((slot) => `${area}:${slot}`)),
      ],
      parseShopInteriorPlacementId: (placementId) => placementId === 'front-window'
        ? { areaId: 'main', slotId: 'front-window' }
        : null,
      SHOP_INTERIOR_DECORATION_BY_ID: {
        'general-display-shelf': { id: 'general-display-shelf', name: '糖果色展示架', description: '展示商品', price: 20 },
        'general-warm-lamp': { id: 'general-warm-lamp', name: '暖光吊燈', description: '燈', price: 25 },
        [dogId]: { id: dogId, price: 80 },
      },
      getShopInteriorDecorations: (_shopType, _shopId, _shopName, owned = []) => [
        { id: 'general-display-shelf', name: '糖果色展示架', description: '展示商品', price: 20 },
        { id: 'general-warm-lamp', name: '暖光吊燈', description: '燈', price: 25 },
        ...owned.filter((id) => id.startsWith('general-')).map((id) => ({ id, name: id, description: '' })),
      ],
    };
    if (name === '@/constants/mall') return {
      MALL_ITEM_BY_ID: {
        a: { id: 'a', name: '雲朵香氛館', category: 'shop', shopType: 'general' },
        b: { id: 'b', name: '一般商店', category: 'shop', shopType: 'general' },
        c: { id: 'c', name: '測試裝飾', category: 'decor' },
        'skyline-tea': { id: 'skyline-tea', floor: 20, category: 'shop' },
      },
      MALL_ITEMS: [{ id: 'c', name: '測試裝飾', category: 'decor' }],
    };
    if (name === '@/constants/progress-milestones') return {
      getRewardedCheckInCount: (rewardedCheckIns) => rewardedCheckIns.filter((item) => !item.startsWith('makeup-used:')).length,
    };
    if (name === '@/lib/habit-schedule') return {
      MAKEUP_USE_PREFIX: 'makeup-used:',
      getWeekday: (dateKey) => new Date(`${dateKey}T12:00:00`).getDay(),
      getPreviousLocalDate: (dateKey) => {
        const date = new Date(`${dateKey}T12:00:00`);
        date.setDate(date.getDate() - 1);
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      },
      getWeeklyChallengeLimit: (restDays) => Math.max(0, 7 - new Set(restDays).size),
      getWeeklyCheckInCount: (checkIns, today) => {
        const date = new Date(`${today}T12:00:00`);
        date.setDate(date.getDate() - ((date.getDay() + 6) % 7));
        const weekStart = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        return new Set(checkIns.filter((dateKey) => dateKey >= weekStart && dateKey <= today)).size;
      },
      getLocalWeekStart: (dateKey) => {
        const date = new Date(`${dateKey}T12:00:00`);
        date.setDate(date.getDate() - ((date.getDay() + 6) % 7));
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      },
      getStreak: (checkIns) => checkIns.length,
      canMakeUpYesterday: () => true,
    };
    if (name === '@/lib/streak-protection') return {
      getMissedScheduledStreakDates: () => [],
      getStreakRescueDate: (habits, today, protectedDates) => {
        const date = new Date(`${today}T12:00:00`);
        date.setDate(date.getDate() - 1);
        const yesterday = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        const activityDates = new Set([
          ...habits.flatMap((habit) => habit.checkIns ?? []),
          ...protectedDates,
        ].filter((dateKey) => dateKey < today));
        const latest = [...activityDates].sort().at(-1);
        if (!latest) return null;
        const next = new Date(`${latest}T12:00:00`);
        next.setDate(next.getDate() + 1);
        let cursor = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}-${String(next.getDate()).padStart(2, '0')}`;
        const due = (dateKey) => {
          const weekday = new Date(`${dateKey}T12:00:00`).getDay();
          return habits.some((habit) => (!habit.createdAt || habit.createdAt <= dateKey) && !(habit.restDays ?? []).includes(weekday));
        };
        while (cursor < yesterday) {
          if (due(cursor) && !activityDates.has(cursor)) return null;
          const day = new Date(`${cursor}T12:00:00`);
          day.setDate(day.getDate() + 1);
          cursor = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
        }
        const todayStart = new Date(`${today}T00:00:00`).getTime();
        return due(yesterday)
          && !activityDates.has(yesterday)
          && Date.now() < todayStart + 24 * 60 * 60 * 1000
          ? yesterday
          : null;
      },
    };
    if (name === '@/lib/weekly-challenge-rewards') return {
      getWeeklyChallengeRewardItemId: () => 'c',
    };
    if (name === '@/constants/mall-shop-display') return {
      SHOP_DISPLAY_SLOT_COUNT: 18,
      canDisplayShopProducts: (decoration) => /shelf|rack|display|展示|貨架/i.test(`${decoration.id} ${decoration.name}`),
      getShopFixtureProductCatalog: () => [
        { id: 'display-fragrance-1', name: '薰衣草晚風香氛' },
        { id: 'display-fragrance-2', name: '月光陶瓷擴香石' },
      ],
    };
    if (name === '@/constants/dog-staff-customization') return {
      DOG_STAFF_PROFILE_BY_DECORATION_ID: {
        [dogId]: { decorationId: dogId },
      },
      DOG_STAFF_STATIONS: dogStations,
      isDogStaffAreaId: (value) => ['main', 'extension-1', 'extension-2', 'extension-3', 'extension-4', 'extension-5'].includes(value),
      DOG_STAFF_STYLE_CATALOGS: {
        [dogId]: {
          outfits: dogOutfits.map((id) => ({ id })),
          accessories: dogAccessories.map((id) => ({ id })),
        },
      },
      resolveDogStaffLook: (decorationId, look) => {
        if (decorationId !== dogId) return null;
        return {
          outfitId: dogOutfits.includes(look?.outfitId) ? look.outfitId : dogOutfits[0],
          accessoryId: dogAccessories.includes(look?.accessoryId) ? look.accessoryId : dogAccessories[0],
        };
      },
      isValidDogStaffLook: (decorationId, look) => decorationId === dogId
        && dogOutfits.includes(look?.outfitId)
        && dogAccessories.includes(look?.accessoryId),
    };
    if (name === 'expo-haptics') return {
      selectionAsync: async () => {},
      notificationAsync: async () => {},
      impactAsync: async () => {},
      ImpactFeedbackStyle: { Light: 'light' },
      NotificationFeedbackType: { Success: 'success' },
    };
    if (name === 'react-native') return {
      AppState: {
        currentState: 'active',
        addEventListener: () => ({ remove() {} }),
      },
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
  new Function('require', 'module', 'exports', 'setTimeout', 'clearTimeout', source)(
    mockedRequire,
    module,
    module.exports,
    () => 1,
    () => {},
  );
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
  assert.equal(JSON.parse(storage[key]).schemaVersion, 6);
  const noPositions = await mount(seed({ placements: undefined }));
  assert.deepEqual(noPositions.value.mallPlacements, { 'floor-3-left': 'a', 'floor-3-center': 'b' });
});

test('legacy Sky Garden placements move to the rooftop while other floor-ten objects stay put', async () => {
  const storage = seed({
    schemaVersion: 4,
    purchasedItems: ['a', 'skyline-tea'],
    placements: { 'floor-10-left': 'skyline-tea', 'floor-10-center': 'a' },
  });
  const app = await mount(storage);
  assert.deepEqual(app.value.mallPlacements, {
    'floor-20-left': 'skyline-tea',
    'floor-10-center': 'a',
  });
  assert.equal(JSON.parse(storage[key]).schemaVersion, 6);
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
  assert.equal(JSON.parse(storage[key]).schemaVersion, 6);
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
  assert.equal(Object.keys(app.value.mallPlacements).length, 561);
  assert.equal(app.value.purchasedItems.length, 570);
  await app.value.storeMallItem('item-0');
  app = await mount(storage);
  assert.equal(Object.keys(app.value.mallPlacements).length, 560);
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

test('rapid duplicate check-ins for one goal award and persist the daily reward only once', async () => {
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

  const results = await Promise.all([
    app.value.toggleCheckIn('starter-walk'),
    app.value.toggleCheckIn('starter-walk'),
    app.value.toggleCheckIn('starter-walk'),
    app.value.toggleCheckIn('starter-walk'),
  ]);

  assert.deepEqual(results, [20, 0, 0, 0], 'only the first in-flight request should run');
  assert.equal(app.value.coins, 20);
  assert.deepEqual(JSON.parse(storage[key]).rewardedCheckIns, [rewardKey]);
  assert.equal(JSON.parse(storage[key]).coins, 20);
  assert.ok(app.value.habits.find((habit) => habit.id === 'starter-walk').checkIns.includes(today));
  assert.ok(JSON.parse(storage[habitsKey]).find((habit) => habit.id === 'starter-walk').checkIns.includes(today));
  assert.equal(storage[checkInTransactionKey], undefined, 'the committed transaction is fully mirrored');

  app = await mount(storage);
  assert.equal(app.value.coins, 20);
  assert.deepEqual(JSON.parse(storage[key]).rewardedCheckIns, [rewardKey]);
  assert.ok(app.value.habits.find((habit) => habit.id === 'starter-walk').checkIns.includes(today));
});

test('different goals completed on the same day each earn and persist their own 20-coin reward', async () => {
  const storage = seed({
    schemaVersion: 3,
    coins: 0,
    purchasedItems: [],
    rewardedCheckIns: [],
    placements: {},
  });
  let app = await mount(storage);
  const today = app.value.today;
  const firstRewardKey = `starter-walk:${today}`;
  const secondRewardKey = `starter-read:${today}`;

  assert.equal(app.value.coins, 0);
  assert.equal(await app.value.toggleCheckIn('starter-walk'), 20);
  assert.equal(app.value.coins, 20);

  assert.equal(await app.value.toggleCheckIn('starter-read'), 20);
  assert.equal(app.value.coins, 40, 'each different goal earns its own 20 coins today');
  assert.ok(app.value.habits.find((habit) => habit.id === 'starter-walk').checkIns.includes(today));
  assert.ok(app.value.habits.find((habit) => habit.id === 'starter-read').checkIns.includes(today));
  assert.deepEqual(JSON.parse(storage[key]).rewardedCheckIns, [firstRewardKey, secondRewardKey]);

  app = await mount(storage);
  assert.equal(app.value.coins, 40);
  assert.ok(app.value.habits.find((habit) => habit.id === 'starter-walk').checkIns.includes(today));
  assert.ok(app.value.habits.find((habit) => habit.id === 'starter-read').checkIns.includes(today));
  assert.deepEqual(JSON.parse(storage[key]).rewardedCheckIns, [firstRewardKey, secondRewardKey]);
});

test('a minimum-action check-in earns its proportional amount once and persists with the completion', async () => {
  const storage = seed({
    schemaVersion: 3,
    coins: 0,
    purchasedItems: [],
    rewardedCheckIns: [],
    placements: {},
  });
  let app = await mount(storage);
  const today = app.value.today;

  assert.equal(await app.value.toggleCheckIn('starter-read', undefined, 2), 2);
  assert.equal(app.value.coins, 2);
  assert.ok(app.value.habits.find((habit) => habit.id === 'starter-read').checkIns.includes(today));
  assert.deepEqual(JSON.parse(storage[key]).rewardedCheckIns, [`starter-read:${today}`]);

  app = await mount(storage);
  assert.equal(app.value.coins, 2);
  await app.value.toggleCheckIn('starter-read');
  assert.equal(await app.value.toggleCheckIn('starter-read'), 0, 'unchecking and checking again cannot award twice');
  assert.equal(app.value.coins, 2);
});

test('a failed partial-reward transaction leaves the check-in and coin balance unchanged', async () => {
  const storage = seed({
    schemaVersion: 3,
    coins: 0,
    purchasedItems: [],
    rewardedCheckIns: [],
    placements: {},
  });
  const app = await mount(storage);
  const today = app.value.today;

  app.setFailWrites(true);
  await assert.rejects(app.value.toggleCheckIn('starter-read', undefined, 2), /無法儲存打卡紀錄/);

  assert.ok(!app.value.habits.find((habit) => habit.id === 'starter-read').checkIns.includes(today));
  assert.equal(app.value.coins, 0);
  assert.equal(storage[checkInTransactionKey], undefined);
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

test('shop fixture merchandise is free, validated, and persists through reload and storage', async () => {
  const storage = seed({
    schemaVersion: 4,
    coins: 100,
    purchasedItems: ['a', 'b'],
    shopInteriors: {
      a: {
        ownedDecorations: ['general-display-shelf', 'general-warm-lamp'],
        placements: { center: 'general-display-shelf' },
      },
    },
  });
  let app = await mount(storage);

  await app.value.setShopInteriorFixtureProduct('a', 'general-display-shelf', 2, 'display-fragrance-1');
  await app.value.setShopInteriorFixtureProduct('a', 'general-display-shelf', 17, 'display-fragrance-2');
  assert.equal(app.value.coins, 100, 'displaying included products never spends coins');
  assert.equal(app.value.shopInteriors.a.fixtureContents['general-display-shelf'].length, 18);
  const expectedFixtureContents = Array(18).fill(null);
  expectedFixtureContents[2] = 'display-fragrance-1';
  expectedFixtureContents[17] = 'display-fragrance-2';
  assert.deepEqual(app.value.shopInteriors.a.fixtureContents['general-display-shelf'], expectedFixtureContents);
  await assert.rejects(
    app.value.setShopInteriorFixtureProduct('a', 'general-display-shelf', 2, 'unrelated-product'),
    /不屬於這間商店/,
  );

  app = await mount(storage);
  assert.equal(app.value.shopInteriors.a.fixtureContents['general-display-shelf'][2], 'display-fragrance-1');
  assert.equal(app.value.shopInteriors.a.fixtureContents['general-display-shelf'][17], 'display-fragrance-2');
  await app.value.storeShopInteriorDecoration('a', 'center');
  assert.equal(app.value.coins, 100, 'storing a fixture does not refund or charge coins');
  assert.equal(app.value.shopInteriors.a.fixtureContents['general-display-shelf'][2], 'display-fragrance-1');

  app = await mount(storage);
  await app.value.placeShopInteriorDecoration('a', 'general-display-shelf', 'left-wall');
  assert.equal(app.value.shopInteriors.a.fixtureContents['general-display-shelf'][2], 'display-fragrance-1');
  await assert.rejects(
    app.value.setShopInteriorFixtureProduct('a', 'general-warm-lamp', 0, 'display-fragrance-1'),
    /沒有商品展示位置/,
  );
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

test('redeemed cafe dog looks persist while dogs are freely assigned across interior areas', async () => {
  const shopId = 'fluffy-marshmallow-cafe';
  const storage = seed({
    schemaVersion: 3,
    coins: 100,
    purchasedItems: [shopId],
    placements: {},
    shopInteriors: {
      [shopId]: {
        ownedDecorations: [dogId],
        placements: { 'front-window': dogId },
      },
    },
  });
  let app = await mount(storage);
  assert.deepEqual(app.value.shopInteriors[shopId].placements, {}, 'legacy dog positions are removed from the 48 general slots');
  assert.deepEqual(app.value.shopInteriors[shopId].dogStaffPlacements, { [dogId]: 'main' });
  app.setFailWriteKey(key);
  await assert.rejects(
    app.value.updateShopInteriorDogLook(shopId, dogId, {
      outfitId: dogOutfits[1],
      accessoryId: dogAccessories[1],
    }),
    /無法儲存商場資料/,
  );
  assert.equal(app.value.shopInteriors[shopId].dogStaffLooks, undefined, 'a failed save keeps the previous look');
  app.setFailWriteKey(null);
  await app.value.updateShopInteriorDogLook(shopId, dogId, {
    outfitId: dogOutfits[1],
    accessoryId: dogAccessories[1],
  });
  assert.equal(app.value.coins, 100, 'changing an included look does not cost coins');
  assert.deepEqual(app.value.shopInteriors[shopId].placements, {});
  assert.deepEqual(app.value.shopInteriors[shopId].dogStaffPlacements, { [dogId]: 'main' });
  assert.deepEqual(app.value.shopInteriors[shopId].dogStaffLooks[dogId], {
    outfitId: dogOutfits[1],
    accessoryId: dogAccessories[1],
  });

  app = await mount(storage);
  assert.deepEqual(app.value.shopInteriors[shopId].dogStaffLooks[dogId], {
    outfitId: dogOutfits[1],
    accessoryId: dogAccessories[1],
  });
  await app.value.placeShopInteriorDogStaff(shopId, dogId, 'extension-5');
  assert.equal(app.value.coins, 100, 'moving an owned dog between areas is free');
  assert.deepEqual(app.value.shopInteriors[shopId].dogStaffPlacements, { [dogId]: 'extension-5' });
  await app.value.storeShopInteriorDogStaff(shopId, dogId);
  assert.equal(app.value.coins, 100, 'storing an owned dog does not refund or charge coins');
  assert.deepEqual(app.value.shopInteriors[shopId].dogStaffPlacements, {});
  assert.ok(app.value.shopInteriors[shopId].ownedDecorations.includes(dogId), 'the dog remains owned in the collection');
  assert.deepEqual(app.value.shopInteriors[shopId].dogStaffLooks[dogId], {
    outfitId: dogOutfits[1],
    accessoryId: dogAccessories[1],
  }, 'storing a dog preserves its saved look');
  await assert.rejects(
    app.value.updateShopInteriorDogLook(shopId, 'unowned-dog', {
      outfitId: dogOutfits[0],
      accessoryId: dogAccessories[0],
    }),
    /先兌換/,
  );
  await assert.rejects(
    app.value.updateShopInteriorDogLook(shopId, dogId, {
      outfitId: 'another-dogs-outfit',
      accessoryId: dogAccessories[0],
    }),
    /不屬於/,
  );
});

test('legacy dedicated dog stations migrate into their matching extension areas', async () => {
  const shopId = 'fluffy-marshmallow-cafe';
  const app = await mount(seed({
    schemaVersion: 3,
    coins: 100,
    purchasedItems: [shopId],
    placements: {},
    shopInteriors: {
      [shopId]: {
        ownedDecorations: [dogId],
        placements: {},
        dogStaffPlacements: { 'window-side': dogId },
      },
    },
  }));
  assert.deepEqual(app.value.shopInteriors[shopId].dogStaffPlacements, { [dogId]: 'extension-1' });
});

test('existing versioned habits and mall hydrate without any startup writes on a full device', async () => {
  const storage = seed({ schemaVersion: 6, placements: { 'floor-1-left': 'a' } });
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

test('streak leave cards cost 50 coins, persist, and cannot exceed two held cards', async () => {
  const storage = seed({ coins: 100, leaveCards: 0 });
  let app = await mount(storage);
  await app.value.purchaseStreakLeaveCard();
  assert.equal(app.value.coins, 50);
  assert.equal(app.value.leaveCards, 1);
  assert.equal(JSON.parse(storage[key]).leaveCards, 1);

  await app.value.purchaseStreakLeaveCard();
  assert.equal(app.value.coins, 0);
  assert.equal(app.value.leaveCards, 2);
  await assert.rejects(app.value.purchaseStreakLeaveCard(), /最多持有 2 張/);
  assert.equal(app.value.coins, 0);

  app = await mount(storage);
  assert.equal(app.value.leaveCards, 2);
  assert.equal(app.value.coins, 0);
});

test('paid streak repair costs 80 coins and protects continuity without adding a target check-in', async () => {
  const asKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  const today = asKey(new Date());
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const previousDay = new Date(yesterday);
  previousDay.setDate(previousDay.getDate() - 1);
  const yesterdayKey = asKey(yesterday);
  const storage = seed({ coins: 100, leaveCards: 0, protectedStreakDates: [] });
  storage[habitsKey] = JSON.stringify([{
    id: 'walk',
    title: '散步',
    reason: '',
    icon: 'activity',
    color: '#fff',
    rewardCategory: 'facility',
    createdAt: asKey(previousDay),
    checkIns: [asKey(previousDay)],
    steps: [],
    restDays: [],
    stepCheckIns: {},
    makeupCheckIns: [],
  }]);
  const app = await mount(storage);
  assert.equal(app.value.today, today);
  assert.equal(await app.value.rescueStreakBreak(), yesterdayKey);
  assert.equal(app.value.coins, 20);
  assert.deepEqual(app.value.protectedStreakDates, [yesterdayKey]);
  assert.deepEqual(app.value.habits[0].checkIns, [asKey(previousDay)]);
  assert.deepEqual(JSON.parse(storage[key]).rewardedCheckIns, []);
  assert.equal(JSON.parse(storage[key]).coins, 20);
});

test('weekly challenge grants its existing catalog decor and 30 coins only once per week', async () => {
  const asKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  const today = asKey(new Date());
  const storage = seed({ coins: 75, purchasedItems: [] });
  storage[habitsKey] = JSON.stringify([{
    id: 'walk',
    title: '散步',
    reason: '',
    icon: 'activity',
    color: '#fff',
    rewardCategory: 'facility',
    createdAt: today,
    checkIns: [today],
    steps: [],
    restDays: [],
    stepCheckIns: {},
    makeupCheckIns: [],
    weeklyChallengeTarget: 1,
  }]);
  const app = await mount(storage);
  assert.equal(await app.value.claimWeeklyChallengeReward(), 'c');
  assert.equal(app.value.coins, 105);
  assert.deepEqual(app.value.purchasedItems, ['c']);
  assert.equal(await app.value.claimWeeklyChallengeReward(), null);
  assert.equal(app.value.coins, 105);
  const saved = JSON.parse(storage[key]);
  assert.deepEqual(saved.weeklyChallengeRewardedWeeks, [app.value.progressSnapshot.mall.weeklyChallengeRewardedWeeks[0]]);
  assert.deepEqual(saved.weeklyChallengeRewardPlans, app.value.progressSnapshot.mall.weeklyChallengeRewardPlans);
});
