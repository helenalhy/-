// Exercise the real HabitsProvider, TodayScreen handler, MallScreen and AsyncStorage boundary.
// Run: node --test artifacts/momentum-checkin/tests/mall-reward-integration.test.cjs
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const appRoot = path.join(__dirname, '..');
const storageKeys = {
  habits: 'momentum.habits.v1',
  mall: 'momentum.mall.v1',
};

function createHarness() {
  const storage = new Map();
  const frames = new Map();
  const effects = new Map();
  let activeFrame;
  const navigation = [];
  const navigationStack = ['/'];
  let localSearchParams = {};
  const alerts = [];
  const announcements = [];
  const scheduledTimers = [];
  const appStateListeners = new Set();
  const palette = { light: new Proxy({}, { get: (_, key) => String(key) }) };
  const mallContext = { currentValue: null };
  const contextProvider = { context: mallContext };
  mallContext.Provider = contextProvider;

  const react = {
    createContext: () => mallContext,
    createElement(type, props, ...children) {
      const resolvedProps = {
        ...(props ?? {}),
        ...(children.length === 1 ? { children: children[0] } : children.length > 1 ? { children } : {}),
      };
      if (type?.context) {
        type.context.currentValue = resolvedProps.value;
        return resolvedProps.children ?? null;
      }
      return { type, props: resolvedProps };
    },
    useContext: (context) => context.currentValue,
    useState(initial) {
      const frame = activeFrame;
      const index = frame.cursor++;
      if (!(index in frame.states)) frame.states[index] = typeof initial === 'function' ? initial() : initial;
      return [frame.states[index], (next) => {
        frame.states[index] = typeof next === 'function' ? next(frame.states[index]) : next;
      }];
    },
    useRef(initial) {
      const frame = activeFrame;
      const index = frame.cursor++;
      if (!(index in frame.states)) frame.states[index] = { current: initial };
      return frame.states[index];
    },
    useEffect(effect) {
      const index = activeFrame.cursor++;
      if (!(index in activeFrame.effects)) {
        activeFrame.effects[index] = effect;
        effects.get(activeFrame.key).push(effect);
      }
    },
    useCallback: (callback) => callback,
    useMemo: (factory) => factory(),
  };

  const native = {
    AppState: {
      addEventListener(_event, listener) {
        appStateListeners.add(listener);
        return { remove: () => appStateListeners.delete(listener) };
      },
    },
    ActivityIndicator: 'ActivityIndicator',
    Alert: { alert: (...args) => alerts.push(args) },
    AccessibilityInfo: {
      announceForAccessibility: (message) => announcements.push(message),
      announceForAccessibilityWithOptions() {},
      setAccessibilityFocus() {},
    },
    Animated: {
      Value: class {
        setValue() {}
        interpolate() { return 1; }
      },
      View: 'Animated.View',
      parallel: () => ({ start() {}, stop() {} }),
      spring: () => ({ start() {}, stop() {} }),
      timing: () => ({ start() {}, stop() {} }),
      multiply: () => 1,
    },
    findNodeHandle: () => 1,
    ImageBackground: 'ImageBackground',
    Keyboard: { dismiss() {} },
    Modal: 'Modal',
    Platform: { OS: 'ios' },
    Pressable: 'Pressable',
    ScrollView: 'ScrollView',
    StyleSheet: { create: (styles) => styles },
    Text: 'Text',
    TextInput: 'TextInput',
    View: 'View',
  };
  const asyncStorage = {
    async getItem(key) { return storage.get(key) ?? null; },
    async setItem(key, value) { storage.set(key, value); },
    async removeItem(key) { storage.delete(key); },
  };
  const haptics = {
    ImpactFeedbackStyle: { Light: 'light' },
    NotificationFeedbackType: { Success: 'success' },
    async impactAsync() {},
    async notificationAsync() {},
    async selectionAsync() {},
  };
  const expoRouter = {
    router: {
      push: (route) => {
        navigation.push(['push', route]);
        navigationStack.push(route);
      },
      navigate: (route) => {
        navigation.push(['navigate', route]);
        navigationStack[navigationStack.length - 1] = route;
      },
      back: () => {
        navigation.push(['back']);
        if (navigationStack.length > 1) navigationStack.pop();
      },
      replace: (route) => {
        navigation.push(['replace', route]);
        navigationStack[navigationStack.length - 1] = route;
      },
    },
    useLocalSearchParams: () => localSearchParams,
  };
  const colorsHook = { useColors: () => palette.light };
  const componentStubs = {
    '@/components/CatalogPager': { CatalogPager: function CatalogPager() {} },
    '@/components/MallWingPager': { MallWingPager: function MallWingPager() {} },
    '@/components/MallVisuals': { MallAmbience: 'MallAmbience', MallObjectVisual: 'MallObjectVisual' },
    '@/hooks/useColors': colorsHook,
  };
  const moduleCache = new Map();

  function resolveLocalTs(filename) {
    const resolved = path.resolve(filename);
    for (const extension of ['.ts', '.tsx']) {
      if (fs.existsSync(`${resolved}${extension}`)) return `${resolved}${extension}`;
    }
    return null;
  }

  function loadTsModule(filename, overrides = {}) {
    const resolved = path.resolve(filename);
    const cached = moduleCache.get(resolved);
    if (cached) return cached.exports;
    const source = ts.transpileModule(fs.readFileSync(resolved, 'utf8'), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        jsx: ts.JsxEmit.React,
        esModuleInterop: true,
      },
    }).outputText;
    const module = { exports: {} };
    moduleCache.set(resolved, module);
    const mockedRequire = (request) => {
      if (request in overrides) return overrides[request];
      if (request === 'react') return react;
      if (request === 'react-native') return native;
      if (request === '@expo/vector-icons') return { Feather: 'Feather' };
      if (request === 'react-native-safe-area-context') {
        return { SafeAreaView: 'SafeAreaView', useSafeAreaInsets: () => ({ top: 0, bottom: 0 }) };
      }
      if (request === '@react-native-async-storage/async-storage') return asyncStorage;
      if (request === 'expo-haptics') return haptics;
      if (request === 'expo-router') return expoRouter;
      if (request === '@/constants/colors') return { __esModule: true, default: palette };
      if (request === '@/context/HabitsContext') return contextExports;
      if (request in componentStubs) return componentStubs[request];
      if (request.startsWith('@/')) {
        const localPath = path.join(appRoot, request.slice(2));
        const localTs = resolveLocalTs(localPath);
        if (localTs) return loadTsModule(localTs);
      } else if (request.startsWith('.')) {
        const localPath = path.resolve(path.dirname(resolved), request);
        const localTs = resolveLocalTs(localPath);
        if (localTs) return loadTsModule(localTs);
        if (fs.existsSync(localPath)) return localPath;
      }
      return `asset:${request}`;
    };
    new Function('require', 'module', 'exports', source)(mockedRequire, module, module.exports);
    return module.exports;
  }

  function render(key, component) {
    let frame = frames.get(key);
    if (!frame) {
      frame = { key, cursor: 0, states: [], effects: [] };
      frames.set(key, frame);
      effects.set(key, []);
    }
    frame.cursor = 0;
    activeFrame = frame;
    try {
      return component();
    } finally {
      activeFrame = null;
    }
  }

  function renderProvider(key = 'provider') {
    return render(key, () => contextExports.HabitsProvider({ children: null }));
  }

  function renderMall(key = 'mall') {
    return render(key, () => mallScreen.default());
  }

  function renderShopInterior(key = 'shop-interior') {
    return render(key, () => shopInteriorScreen.default());
  }

  function renderShopInteriorScene(tree) {
    const sceneElement = findByTestId(tree, 'shop-interior-scene');
    if (!sceneElement || typeof sceneElement.type !== 'function') return null;
    return render('shop-interior-scene', () => sceneElement.type(sceneElement.props));
  }

  function renderDogStaffCustomizer(tree) {
    const customizerElement = findNodes(tree, (node) =>
      typeof node.type === 'function' && node.type.name === 'DogStaffCustomizer')[0];
    if (!customizerElement) return null;
    return render('dog-staff-customizer', () => customizerElement.type(customizerElement.props));
  }

  function renderToday(key = 'today') {
    return render(key, () => todayRouteModule.default());
  }

  function renderCurrentRoute() {
    const route = navigationStack.at(-1);
    if (route === '/today') return renderToday();
    if (route === '/' || route === '/mall') return renderMall();
    throw new Error(`Unexpected route in test harness: ${route}`);
  }

  function goBack() {
    expoRouter.router.back();
  }

  function navigateTo(route) {
    expoRouter.router.navigate(route);
  }

  async function runEffects(key) {
    const originalSetTimeout = global.setTimeout;
    const originalClearTimeout = global.clearTimeout;
    global.setTimeout = (callback, delay) => {
      const timer = { callback, delay, cleared: false };
      scheduledTimers.push(timer);
      return timer;
    };
    global.clearTimeout = (timer) => {
      if (timer) timer.cleared = true;
    };
    try {
      for (const effect of effects.get(key) ?? []) effect();
    } finally {
      global.setTimeout = originalSetTimeout;
      global.clearTimeout = originalClearTimeout;
    }
    await new Promise((resolve) => setImmediate(resolve));
    await new Promise((resolve) => setImmediate(resolve));
  }

  function runNextTimer(delay) {
    const timer = scheduledTimers.find((candidate) =>
      !candidate.cleared && (delay === undefined || candidate.delay === delay));
    assert.ok(timer, delay === undefined
      ? 'a future timer is scheduled'
      : `a timer with a ${delay}ms delay is scheduled`);
    timer.cleared = true;
    const originalSetTimeout = global.setTimeout;
    const originalClearTimeout = global.clearTimeout;
    global.setTimeout = (callback, delay) => {
      const nextTimer = { callback, delay, cleared: false };
      scheduledTimers.push(nextTimer);
      return nextTimer;
    };
    global.clearTimeout = (nextTimer) => {
      if (nextTimer) nextTimer.cleared = true;
    };
    try {
      timer.callback();
    } finally {
      global.setTimeout = originalSetTimeout;
      global.clearTimeout = originalClearTimeout;
    }
  }

  const contextExports = loadTsModule(path.join(appRoot, 'context/HabitsContext.tsx'));
  const mallScreen = loadTsModule(path.join(appRoot, 'app/(tabs)/mall.tsx'));
  const shopInteriorScreen = loadTsModule(path.join(appRoot, 'app/mall-shop/[itemId].tsx'));
  const todayRouteModule = loadTsModule(path.join(appRoot, 'app/(tabs)/today.tsx'));
  const mallCatalog = loadTsModule(path.join(appRoot, 'constants/mall.ts'));

  return {
    alerts,
    announcements,
    contextExports,
    mallCatalog,
    navigation,
    navigationStack,
    goBack,
    navigateTo,
    render,
    renderCurrentRoute,
    renderMall,
    renderShopInterior,
    renderShopInteriorScene,
    renderDogStaffCustomizer,
    renderProvider,
    renderToday,
    runEffects,
    runNextTimer,
    shopInteriorCatalog: loadTsModule(path.join(appRoot, 'constants/mall-shop-interior.ts')),
    storage,
    setPlatform: (platform) => { native.Platform.OS = platform; },
    setLocalSearchParams: (params) => { localSearchParams = params; },
  };
}

function findNodes(tree, predicate) {
  if (!tree || typeof tree !== 'object') return [];
  if (Array.isArray(tree)) return tree.flatMap((child) => findNodes(child, predicate));
  return [
    ...(predicate(tree) ? [tree] : []),
    ...findNodes(tree.props?.children, predicate),
  ];
}

function findByTestId(tree, testID) {
  return findNodes(tree, (node) => node.props?.testID === testID)[0];
}

function findByTestIdPrefixAndSuffix(tree, prefix, suffix) {
  return findNodes(
    tree,
    (node) => typeof node.props?.testID === 'string'
      && node.props.testID.startsWith(prefix)
      && node.props.testID.endsWith(suffix),
  )[0];
}

function findCatalogPager(tree) {
  return findNodes(tree, (node) => node.props?.id === 'catalog-top')[0];
}

function textContent(node) {
  if (node == null || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(textContent).join('');
  return textContent(node.props?.children);
}

test('development preview can top up enough coins for every mall item and shop-interior catalog', async () => {
  const previousDev = global.__DEV__;
  global.__DEV__ = true;
  try {
    const app = createHarness();
    app.renderProvider();
    await app.runEffects('provider');
    app.renderProvider();

    const mallTree = app.renderMall();
    assert.ok(findByTestId(mallTree, 'dev-fill-mall-coins'), 'the test-only coin control is visible in development preview');
    await press(mallTree, 'dev-fill-mall-coins');

    const savedMall = JSON.parse(app.storage.get(storageKeys.mall));
    const mallCost = app.mallCatalog.MALL_ITEMS.reduce((total, item) => total + item.price, 0);
    const shopCount = app.mallCatalog.MALL_ITEMS.filter((item) => item.category === 'shop').length;
    const maxInteriorCost = Math.max(...Object.values(app.shopInteriorCatalog.SHOP_INTERIOR_DECORATIONS)
      .map((catalog) => catalog.reduce((total, item) => total + item.price, 0)));
    assert.equal(savedMall.coins, mallCost + shopCount * maxInteriorCost);
  } finally {
    if (previousDev === undefined) delete global.__DEV__;
    else global.__DEV__ = previousDev;
  }
});

test('production build hides and rejects the development-only coin control', async () => {
  const previousDev = global.__DEV__;
  global.__DEV__ = false;
  try {
    const app = createHarness();
    app.renderProvider();
    await app.runEffects('provider');
    app.renderProvider();

    const mallTree = app.renderMall();
    assert.equal(findByTestId(mallTree, 'dev-fill-mall-coins'), undefined);
    const { grantTestCoins } = app.contextExports.useHabits();
    await assert.rejects(grantTestCoins(100), /測試金幣只供開發預覽使用/);
  } finally {
    if (previousDev === undefined) delete global.__DEV__;
    else global.__DEV__ = previousDev;
  }
});

async function press(tree, testID) {
  const button = findByTestId(tree, testID);
  assert.ok(button, `Expected ${testID} to be rendered`);
  assert.ok(!button.props.disabled, `Expected ${testID} to be enabled`);
  await button.props.onPress();
  await new Promise((resolve) => setImmediate(resolve));
  await new Promise((resolve) => setImmediate(resolve));
}

test('today and first check-in reward roll over after local midnight without duplicate claims', async () => {
  const OriginalDate = global.Date;
  let clock = new OriginalDate(2026, 3, 1, 23, 59, 50);
  global.Date = class ControlledDate extends OriginalDate {
    constructor(...args) {
      if (args.length === 0) super(clock.getTime());
      else super(...args);
    }

    static now() {
      return clock.getTime();
    }
  };

  try {
    const app = createHarness();
    app.renderProvider();
    await app.runEffects('provider');
    app.renderProvider();

    const yesterday = app.contextExports.getLocalDate();
    assert.equal(await app.contextExports.useHabits().toggleCheckIn('starter-walk'), 20);
    app.renderProvider();

    clock = new OriginalDate(2026, 3, 2, 0, 0, 1);
    app.runNextTimer();
    app.renderProvider();

    const today = app.contextExports.getLocalDate();
    assert.notEqual(today, yesterday);
    assert.equal(app.contextExports.useHabits().today, today);
    assert.equal(app.contextExports.useHabits().getCheckInReward('starter-walk'), 20);

    const todayTree = app.renderToday();
    const dateLabel = `${clock.getMonth() + 1} 月 ${clock.getDate()} 日`;
    assert.ok(textContent(todayTree).includes(dateLabel), 'the Today screen shows the new local date');
    const row = findNodes(todayTree, (node) =>
      typeof node.type === 'function'
      && node.type.name === 'HabitRow'
      && node.props?.habit?.id === 'starter-walk',
    )[0];
    assert.ok(row, 'the existing goal remains visible on the new day');
    assert.equal(row.props.done, false, 'yesterday’s completion does not mark today complete');
    assert.equal(row.props.reward, 20, 'the new day shows its first-check-in reward');

    assert.equal(await app.contextExports.useHabits().toggleCheckIn('starter-walk'), 20);
    app.renderProvider();
    assert.equal(await app.contextExports.useHabits().toggleCheckIn('starter-walk'), 0);
    app.renderProvider();
    assert.equal(await app.contextExports.useHabits().toggleCheckIn('starter-walk'), 0);
    app.renderProvider();

    const state = app.contextExports.useHabits();
    assert.equal(state.coins, 40, 'the goal earns once yesterday and once today');
    assert.ok(state.habits[0].checkIns.includes(yesterday));
    assert.ok(state.habits[0].checkIns.includes(today));
    assert.deepEqual(
      JSON.parse(app.storage.get(storageKeys.mall)).rewardedCheckIns,
      [`starter-walk:${yesterday}`, `starter-walk:${today}`],
    );
  } finally {
    global.Date = OriginalDate;
  }
});

test('DST spring-forward and fall-back advance local reward dates exactly once', async () => {
  const OriginalDate = global.Date;
  const originalTimezone = process.env.TZ;
  process.env.TZ = 'America/New_York';

  const transitions = [
    {
      name: 'spring-forward',
      start: [2026, 2, 8, 0, 0, 0],
      next: [2026, 2, 9, 0, 0, 0],
      startDate: '2026-03-08',
      nextDate: '2026-03-09',
      elapsed: 23 * 60 * 60 * 1000,
    },
    {
      name: 'fall-back',
      start: [2026, 10, 1, 0, 0, 0],
      next: [2026, 10, 2, 0, 0, 0],
      startDate: '2026-11-01',
      nextDate: '2026-11-02',
      elapsed: 25 * 60 * 60 * 1000,
    },
  ];

  try {
    for (const transition of transitions) {
      let clock = new OriginalDate(...transition.start);
      global.Date = class ControlledDate extends OriginalDate {
        constructor(...args) {
          if (args.length === 0) super(clock.getTime());
          else super(...args);
        }

        static now() {
          return clock.getTime();
        }
      };

      const app = createHarness();
      app.renderProvider();
      await app.runEffects('provider');
      app.renderProvider();

      assert.equal(
        app.contextExports.useHabits().today,
        transition.startDate,
        `${transition.name} starts on the expected local date`,
      );
      assert.equal(
        await app.contextExports.useHabits().toggleCheckIn('starter-walk'),
        20,
        `${transition.name} date grants its first reward`,
      );
      app.renderProvider();
      assert.equal(
        await app.contextExports.useHabits().toggleCheckIn('starter-walk'),
        0,
        `${transition.name} date cannot grant the same goal twice`,
      );
      app.renderProvider();

      const nextMidnightDelay = transition.elapsed;
      clock = new OriginalDate(...transition.next);
      app.runNextTimer(nextMidnightDelay);
      app.renderProvider();

      assert.equal(
        app.contextExports.useHabits().today,
        transition.nextDate,
        `${transition.name} midnight advances to the next local calendar date`,
      );
      assert.equal(app.contextExports.useHabits().getCheckInReward('starter-walk'), 20);
      assert.equal(
        await app.contextExports.useHabits().toggleCheckIn('starter-walk'),
        20,
        'the same goal can earn once on the next local date',
      );
      app.renderProvider();
      assert.equal(
        await app.contextExports.useHabits().toggleCheckIn('starter-walk'),
        0,
        'the same goal cannot earn twice on the next local date',
      );
      app.renderProvider();

      const state = app.contextExports.useHabits();
      assert.equal(state.coins, 40, 'the goal earns once on each of the two dates');
      assert.deepEqual(
        JSON.parse(app.storage.get(storageKeys.mall)).rewardedCheckIns,
        [`starter-walk:${transition.startDate}`, `starter-walk:${transition.nextDate}`],
      );
    }
  } finally {
    global.Date = OriginalDate;
    if (originalTimezone === undefined) delete process.env.TZ;
    else process.env.TZ = originalTimezone;
  }
});

test('timezone changes refresh today while earned rewards stay on their original local date', async () => {
  const OriginalDate = global.Date;
  const originalTimezone = process.env.TZ;
  process.env.TZ = 'UTC';
  let clock = new OriginalDate('2026-03-31T23:30:00Z');
  global.Date = class ControlledDate extends OriginalDate {
    constructor(...args) {
      if (args.length === 0) super(clock.getTime());
      else super(...args);
    }

    static now() {
      return clock.getTime();
    }
  };

  try {
    const app = createHarness();
    app.renderProvider();
    await app.runEffects('provider');
    app.renderProvider();

    assert.equal(app.contextExports.useHabits().today, '2026-03-31');
    assert.equal(await app.contextExports.useHabits().toggleCheckIn('starter-walk'), 20);
    app.renderProvider();

    process.env.TZ = 'Asia/Tokyo';
    app.runNextTimer(30_000);
    app.renderProvider();

    let state = app.contextExports.useHabits();
    assert.equal(state.today, '2026-04-01');
    assert.equal(state.getCheckInReward('starter-walk'), 20);
    assert.equal(state.coins, 20, 'changing timezone does not grant coins again');
    assert.deepEqual(
      JSON.parse(app.storage.get(storageKeys.mall)).rewardedCheckIns,
      ['starter-walk:2026-03-31'],
    );

    process.env.TZ = 'UTC';
    app.runNextTimer(30_000);
    app.renderProvider();

    state = app.contextExports.useHabits();
    assert.equal(state.today, '2026-03-31');
    assert.equal(state.getCheckInReward('starter-walk'), 0);
    assert.equal(state.coins, 20, 'returning to the earned date cannot claim its reward twice');
  } finally {
    global.Date = OriginalDate;
    if (originalTimezone === undefined) delete process.env.TZ;
    else process.env.TZ = originalTimezone;
  }
});

test('goal reward updates an active affordable catalog and survives provider reload', async () => {
  const app = createHarness();
  const exactPriceItem = app.mallCatalog.MALL_ITEMS.find((item) => item.floor === 1 && item.price === 20);
  const ownedItem = app.mallCatalog.MALL_ITEMS.find((item) => item.floor === 1 && item.id === 'welcome-flowers');
  assert.ok(exactPriceItem, 'the current floor includes an item priced exactly at the check-in reward');
  assert.ok(ownedItem, 'the current floor includes a pre-owned item to exclude');

  app.storage.set(storageKeys.mall, JSON.stringify({
    schemaVersion: 3,
    coins: 0,
    purchasedItems: [ownedItem.id],
    rewardedCheckIns: [],
    rewardTokens: { facility: 0, shop: 0, decor: 0 },
    placements: {},
  }));

  app.renderProvider();
  await app.runEffects('provider');
  app.renderProvider();

  let mallTree = app.renderMall();
  assert.equal(findCatalogPager(mallTree).props.total, 151);
  await press(mallTree, 'mall-affordable-toggle');
  mallTree = app.renderMall();
  assert.equal(findCatalogPager(mallTree).props.total, 0);
  assert.match(textContent(findByTestId(mallTree, 'mall-filter-results')), /目前 0 金幣.*換得到 0 款/);
  assert.ok(findByTestId(mallTree, 'mall-affordable-empty'));

  await press(mallTree, 'mall-earn-coins');
  assert.deepEqual(app.navigation.at(-1), ['push', '/today']);

  const todayTree = app.renderToday();
  const habitRow = findNodes(todayTree, (node) =>
    typeof node.type === 'function'
    && node.type.name === 'HabitRow'
    && node.props?.habit?.id === 'starter-walk',
  )[0];
  assert.ok(habitRow, 'the today page renders the starter goal');
  const rowTree = renderHabitRow(app, habitRow);
  await press(rowTree, 'checkin-starter-walk');

  app.renderProvider();
  assert.equal(app.contextExports.useHabits().coins, 20);
  const afterReward = JSON.parse(app.storage.get(storageKeys.mall));
  assert.equal(afterReward.coins, 20);
  assert.ok(JSON.parse(app.storage.get(storageKeys.habits))[0].checkIns.includes(app.contextExports.getLocalDate()));

  mallTree = app.renderMall();
  const expectedAvailable = app.mallCatalog.MALL_ITEMS.filter((item) =>
    item.floor === 1
    && item.price <= 20
    && item.id !== ownedItem.id,
  );
  assert.equal(findCatalogPager(mallTree).props.total, expectedAvailable.length);
  assert.match(
    textContent(findByTestId(mallTree, 'mall-filter-results')),
    new RegExp(`目前 20 金幣.*換得到 ${expectedAvailable.length} 款.*不含已擁有`),
  );

  const selectableIds = new Set();
  const pages = findCatalogPager(mallTree).props.pages;
  for (let page = 1; page <= pages; page += 1) {
    const pager = findCatalogPager(mallTree);
    if (pager.props.page !== page) {
      pager.props.onChange(page);
      mallTree = app.renderMall();
    }
    for (const node of findNodes(mallTree, (candidate) =>
      typeof candidate.props?.testID === 'string' && candidate.props.testID.startsWith('build-'),
    )) {
      selectableIds.add(node.props.testID.slice('build-'.length));
    }
  }
  assert.ok(selectableIds.has(exactPriceItem.id), 'the just-affordable item is selectable without an extra coin');
  assert.ok(!selectableIds.has(ownedItem.id), 'an owned item never appears in affordable selections');
  assert.equal(selectableIds.size, expectedAvailable.length, 'all and only affordable unowned items are selectable');

  app.renderProvider('provider-reopened');
  await app.runEffects('provider-reopened');
  app.renderProvider('provider-reopened');
  assert.equal(JSON.parse(app.storage.get(storageKeys.mall)).coins, 20);
  assert.deepEqual(JSON.parse(app.storage.get(storageKeys.mall)).purchasedItems, [ownedItem.id]);
  let reopenedMall = app.renderMall('mall-reopened');
  await press(reopenedMall, 'mall-affordable-toggle');
  reopenedMall = app.renderMall('mall-reopened');
  assert.equal(findCatalogPager(reopenedMall).props.total, expectedAvailable.length);
  assert.match(textContent(findByTestId(reopenedMall, 'mall-filter-results')), /目前 20 金幣/);
  const reopenedIds = new Set();
  const reopenedPages = findCatalogPager(reopenedMall).props.pages;
  for (let page = 1; page <= reopenedPages; page += 1) {
    const pager = findCatalogPager(reopenedMall);
    if (pager.props.page !== page) {
      pager.props.onChange(page);
      reopenedMall = app.renderMall('mall-reopened');
    }
    for (const node of findNodes(reopenedMall, (candidate) =>
      typeof candidate.props?.testID === 'string' && candidate.props.testID.startsWith('build-'),
    )) {
      reopenedIds.add(node.props.testID.slice('build-'.length));
    }
  }
  assert.ok(reopenedIds.has(exactPriceItem.id));
  assert.ok(!reopenedIds.has(ownedItem.id));
  assert.equal(reopenedIds.size, expectedAvailable.length);
});

test('mall to today and back preserves the filtered catalog, purchase preview and saved mall state', async () => {
  const app = createHarness();
  const ownedItem = app.mallCatalog.MALL_ITEMS.find((item) => item.id === 'welcome-flowers');
  assert.ok(ownedItem, 'the seeded owned item exists in the real catalog');

  app.storage.set(storageKeys.mall, JSON.stringify({
    schemaVersion: 3,
    coins: 20,
    purchasedItems: [ownedItem.id],
    rewardedCheckIns: [],
    rewardTokens: { facility: 0, shop: 0, decor: 0 },
    placements: { 'floor-1-left': ownedItem.id },
  }));

  app.renderProvider();
  await app.runEffects('provider');
  app.renderProvider();

  let mallTree = app.renderCurrentRoute();
  await press(mallTree, 'mall-category-decor');
  mallTree = app.renderCurrentRoute();
  await press(mallTree, 'mall-price-sort');
  mallTree = app.renderCurrentRoute();

  const firstBuildButton = findNodes(mallTree, (node) =>
    typeof node.props?.testID === 'string'
    && node.props.testID.startsWith('build-')
    && !node.props.disabled,
  )[0];
  assert.ok(firstBuildButton, 'sorting the selected decor category exposes a purchasable item');
  const previewItemId = firstBuildButton.props.testID.slice('build-'.length);
  const previewItem = app.mallCatalog.MALL_ITEMS.find((item) => item.id === previewItemId);
  assert.equal(previewItem.category, 'decor');
  assert.ok(previewItem.price <= 20, 'the seeded balance can start the preview');

  await press(mallTree, firstBuildButton.props.testID);
  mallTree = app.renderCurrentRoute();
  const wingPager = findNodes(mallTree, (node) => node.type?.name === 'MallWingPager')[0];
  assert.ok(wingPager, 'the real mall route renders its wing pager');
  const mainWing = wingPager.props.renderWing('main', true);
  const emptySlot = findNodes(mainWing, (node) =>
    node.type?.name === 'MallSceneSlot'
    && node.props.slotId.startsWith('floor-1-')
    && !node.props.item,
  )[0];
  assert.ok(emptySlot, 'the real mall scene contains an empty slot for the preview');
  emptySlot.props.onPress();

  mallTree = app.renderCurrentRoute();
  assert.ok(findByTestId(mallTree, 'mall-purchase-preview'), 'the selected item is still only a preview');

  await press(mallTree, 'mall-category-facility');
  mallTree = app.renderCurrentRoute();
  await press(mallTree, 'mall-affordable-toggle');
  mallTree = app.renderCurrentRoute();
  assert.equal(findCatalogPager(mallTree).props.total, 0, 'facilities cost more than the current balance');
  assert.ok(findByTestId(mallTree, 'mall-affordable-empty'));

  const beforeNavigation = app.contextExports.useHabits();
  const savedMallBeforeNavigation = app.storage.get(storageKeys.mall);
  assert.equal(beforeNavigation.coins, 20);
  assert.deepEqual(beforeNavigation.purchasedItems, [ownedItem.id]);
  assert.deepEqual(beforeNavigation.mallPlacements, { 'floor-1-left': ownedItem.id });
  assert.equal(findByTestId(mallTree, 'mall-category-facility').props.accessibilityState.selected, true);
  assert.equal(findByTestId(mallTree, 'mall-affordable-toggle').props.accessibilityState.selected, true);

  await press(mallTree, 'mall-earn-coins');
  assert.deepEqual(app.navigationStack, ['/', '/today']);
  const todayTree = app.renderCurrentRoute();
  assert.match(textContent(todayTree), /今天，先完成一小步。/, 'the pushed today route renders the real today screen');
  assert.ok(findNodes(todayTree, (node) =>
    node.type?.name === 'HabitRow' && node.props?.habit?.id === 'starter-walk',
  )[0], 'the pushed today route renders its real goal list');

  app.goBack();
  assert.deepEqual(app.navigationStack, ['/']);
  mallTree = app.renderCurrentRoute();

  assert.equal(findByTestId(mallTree, 'mall-category-facility').props.accessibilityState.selected, true);
  assert.equal(findByTestId(mallTree, 'mall-affordable-toggle').props.accessibilityState.selected, true);
  assert.equal(findCatalogPager(mallTree).props.total, 0);
  assert.ok(findByTestId(mallTree, 'mall-affordable-empty'));
  assert.match(
    textContent(findByTestId(mallTree, 'mall-purchase-preview')),
    new RegExp(previewItem.name),
    'the unconfirmed preview survives the route transition',
  );

  const afterNavigation = app.contextExports.useHabits();
  assert.equal(afterNavigation.coins, beforeNavigation.coins);
  assert.deepEqual(afterNavigation.purchasedItems, beforeNavigation.purchasedItems);
  assert.deepEqual(afterNavigation.mallPlacements, beforeNavigation.mallPlacements);
  assert.equal(app.storage.get(storageKeys.mall), savedMallBeforeNavigation);

  await press(mallTree, 'cancel-purchase-preview');
  mallTree = app.renderCurrentRoute();
  assert.equal(findByTestId(mallTree, 'mall-purchase-preview'), undefined, 'cancel removes the returned preview');
  const afterCancel = app.contextExports.useHabits();
  assert.equal(afterCancel.coins, beforeNavigation.coins, 'cancel does not spend coins');
  assert.deepEqual(afterCancel.purchasedItems, beforeNavigation.purchasedItems, 'cancel does not grant ownership');
  assert.deepEqual(afterCancel.mallPlacements, beforeNavigation.mallPlacements, 'cancel does not change saved placements');
  assert.equal(app.storage.get(storageKeys.mall), savedMallBeforeNavigation, 'cancel leaves persisted mall data untouched');
});

test('mall to today and back keeps purchase confirmation actionable', async () => {
  const app = createHarness();
  const ownedItem = app.mallCatalog.MALL_ITEMS.find((item) => item.id === 'welcome-flowers');
  app.storage.set(storageKeys.mall, JSON.stringify({
    schemaVersion: 3,
    coins: 20,
    purchasedItems: [ownedItem.id],
    rewardedCheckIns: [],
    rewardTokens: { facility: 0, shop: 0, decor: 0 },
    placements: { 'floor-1-left': ownedItem.id },
  }));

  app.renderProvider();
  await app.runEffects('provider');
  app.renderProvider();

  let mallTree = app.renderCurrentRoute();
  await press(mallTree, 'mall-category-decor');
  mallTree = app.renderCurrentRoute();
  await press(mallTree, 'mall-price-sort');
  mallTree = app.renderCurrentRoute();

  const buildButton = findNodes(mallTree, (node) =>
    typeof node.props?.testID === 'string'
    && node.props.testID.startsWith('build-')
    && !node.props.disabled,
  )[0];
  assert.ok(buildButton, 'an affordable decoration can be selected');
  const itemId = buildButton.props.testID.slice('build-'.length);
  const item = app.mallCatalog.MALL_ITEMS.find((candidate) => candidate.id === itemId);
  await press(mallTree, buildButton.props.testID);

  mallTree = app.renderCurrentRoute();
  const wingPager = findNodes(mallTree, (node) => node.type?.name === 'MallWingPager')[0];
  const mainWing = wingPager.props.renderWing('main', true);
  const emptySlot = findNodes(mainWing, (node) =>
    node.type?.name === 'MallSceneSlot'
    && node.props.slotId.startsWith('floor-1-')
    && !node.props.item,
  )[0];
  assert.ok(emptySlot, 'the selected item has an empty preview slot');
  const previewSlotId = emptySlot.props.slotId;
  emptySlot.props.onPress();

  mallTree = app.renderCurrentRoute();
  assert.ok(findByTestId(mallTree, 'confirm-purchase-preview'), 'confirmation is available before leaving');
  const beforeNavigation = app.contextExports.useHabits();
  const savedMallBeforeNavigation = app.storage.get(storageKeys.mall);
  app.navigateTo('/today');
  assert.deepEqual(app.navigationStack, ['/today'], 'switching to Today keeps the mall screen mounted');
  const todayTree = app.renderCurrentRoute();
  await press(todayTree, 'today-mall-shortcut');
  assert.deepEqual(app.navigationStack, ['/mall'], 'the Today shortcut returns to the mall tab');

  mallTree = app.renderCurrentRoute();
  assert.ok(findByTestId(mallTree, 'mall-purchase-preview'), 'the same preview returns with the mall route');
  assert.ok(findByTestId(mallTree, 'confirm-purchase-preview'), 'confirmation remains actionable after returning');
  assert.equal(app.contextExports.useHabits().coins, beforeNavigation.coins);
  assert.equal(app.storage.get(storageKeys.mall), savedMallBeforeNavigation, 'navigation alone does not change saved mall data');

  await press(mallTree, 'confirm-purchase-preview');
  app.renderProvider();
  const afterPurchase = app.contextExports.useHabits();
  assert.equal(afterPurchase.coins, beforeNavigation.coins - item.price, 'confirmation deducts the item price once');
  assert.ok(afterPurchase.purchasedItems.includes(itemId), 'confirmation grants ownership');
  assert.equal(afterPurchase.mallPlacements[previewSlotId], itemId, 'confirmation persists the previewed placement');
  assert.equal(afterPurchase.purchasedItems.filter((purchasedId) => purchasedId === itemId).length, 1);

  const savedMall = JSON.parse(app.storage.get(storageKeys.mall));
  assert.equal(savedMall.coins, afterPurchase.coins);
  assert.ok(savedMall.purchasedItems.includes(itemId));
  assert.equal(savedMall.placements[previewSlotId], itemId);
});

test('today mall shortcut returns to the same affordable category without changing saved mall data', async () => {
  const app = createHarness();
  const ownedItem = app.mallCatalog.MALL_ITEMS.find((item) => item.id === 'welcome-flowers');
  assert.ok(ownedItem, 'the seeded owned item exists in the real catalog');

  app.storage.set(storageKeys.mall, JSON.stringify({
    schemaVersion: 3,
    coins: 250,
    purchasedItems: [ownedItem.id],
    rewardedCheckIns: [],
    rewardTokens: { facility: 0, shop: 0, decor: 0 },
    placements: { 'floor-1-left': ownedItem.id },
  }));

  app.renderProvider();
  await app.runEffects('provider');
  app.renderProvider();

  let mallTree = app.renderCurrentRoute();
  await press(mallTree, 'mall-category-facility');
  mallTree = app.renderCurrentRoute();
  await press(mallTree, 'mall-affordable-toggle');
  mallTree = app.renderCurrentRoute();

  const beforeNavigation = app.contextExports.useHabits();
  const savedMallBeforeNavigation = app.storage.get(storageKeys.mall);
  const expectedAvailable = app.mallCatalog.MALL_ITEMS.filter((item) =>
    item.floor === 1
    && item.category === 'facility'
    && item.price <= beforeNavigation.coins
    && !beforeNavigation.purchasedItems.includes(item.id),
  );
  assert.equal(findByTestId(mallTree, 'mall-category-facility').props.accessibilityState.selected, true);
  assert.equal(findByTestId(mallTree, 'mall-affordable-toggle').props.accessibilityState.selected, true);
  assert.equal(findCatalogPager(mallTree).props.total, expectedAvailable.length);

  app.navigateTo('/today');
  assert.deepEqual(app.navigationStack, ['/today'], 'switching to Today uses tab navigation');
  const todayTree = app.renderCurrentRoute();
  assert.match(textContent(todayTree), /今天，先完成一小步。/, 'the Today tab renders its real screen');
  await press(todayTree, 'today-mall-shortcut');
  assert.deepEqual(app.navigationStack, ['/mall'], 'the mall shortcut navigates back to the mall tab');

  mallTree = app.renderCurrentRoute();
  assert.equal(findByTestId(mallTree, 'mall-category-facility').props.accessibilityState.selected, true);
  assert.equal(findByTestId(mallTree, 'mall-affordable-toggle').props.accessibilityState.selected, true);
  assert.equal(findCatalogPager(mallTree).props.total, expectedAvailable.length);

  const afterNavigation = app.contextExports.useHabits();
  assert.equal(afterNavigation.coins, beforeNavigation.coins);
  assert.deepEqual(afterNavigation.purchasedItems, beforeNavigation.purchasedItems);
  assert.deepEqual(afterNavigation.mallPlacements, beforeNavigation.mallPlacements);
  assert.equal(app.storage.get(storageKeys.mall), savedMallBeforeNavigation);
});

test('tapping a redeemed shop opens its interior, while long-press keeps shop movement available', async () => {
  const app = createHarness();
  const shop = app.mallCatalog.MALL_ITEMS.find((item) => item.id === 'ladies-fashion-boutique');
  assert.ok(shop);
  app.storage.set(storageKeys.mall, JSON.stringify({
    schemaVersion: 3,
    coins: 120,
    purchasedItems: [shop.id],
    rewardedCheckIns: [],
    rewardTokens: { facility: 0, shop: 0, decor: 0 },
    placements: { 'floor-1-left': shop.id },
    shopInteriors: {},
  }));
  app.renderProvider();
  await app.runEffects('provider');
  app.renderProvider();

  let mallTree = app.renderMall();
  const wingPager = findNodes(mallTree, (node) => node.type?.name === 'MallWingPager')[0];
  assert.ok(wingPager, 'the mall renders its floor section pager');
  const mainWing = wingPager.props.renderWing('main', true);
  const shopSlot = findNodes(mainWing, (node) =>
    node.type?.name === 'MallSceneSlot' && node.props.slotId === 'floor-1-left',
  )[0];
  assert.ok(shopSlot?.props.item, 'the redeemed shop is visible in its floor scene');
  assert.equal(shopSlot.props.item.id, shop.id);
  shopSlot.props.onPress();
  assert.deepEqual(app.navigation.at(-1), [
    'push',
    { pathname: '/mall-shop/[itemId]', params: { itemId: shop.id } },
  ]);

  mallTree = app.renderMall();
  assert.equal(findNodes(mallTree, (node) => node.props?.testID === 'cancel-placement').length, 0);
  shopSlot.props.onLongPress();
  mallTree = app.renderMall();
  assert.ok(findByTestId(mallTree, 'open-shop-interior'), 'the selected shop exposes its interior action');
  assert.ok(findByTestId(mallTree, 'cancel-placement'), 'long-press still enters the move flow');
});

test('long-pressing facilities and decor allows free movement or warehouse storage', async () => {
  const app = createHarness();
  const facility = app.mallCatalog.MALL_ITEMS.find((item) => item.id === 'cloud-walk');
  const decor = app.mallCatalog.MALL_ITEMS.find((item) => item.id === 'garden-lights');
  assert.equal(facility?.category, 'facility');
  assert.equal(decor?.category, 'decor');
  app.storage.set(storageKeys.mall, JSON.stringify({
    schemaVersion: 3,
    coins: 27,
    purchasedItems: [facility.id, decor.id],
    rewardedCheckIns: [],
    rewardTokens: { facility: 0, shop: 0, decor: 0 },
    placements: { 'floor-1-left': facility.id, 'floor-1-center': decor.id },
    shopInteriors: {},
  }));
  app.renderProvider();
  await app.runEffects('provider');
  app.renderProvider();

  const findSceneSlot = (tree, slotId) => {
    const wingPager = findNodes(tree, (node) => node.type?.name === 'MallWingPager')[0];
    assert.ok(wingPager, 'the floor scene is rendered');
    const mainWing = wingPager.props.renderWing('main', true);
    return findNodes(mainWing, (node) =>
      node.type?.name === 'MallSceneSlot' && node.props.slotId === slotId,
    )[0];
  };

  let mallTree = app.renderMall();
  const facilitySlot = findSceneSlot(mallTree, 'floor-1-left');
  facilitySlot.props.onLongPress();
  mallTree = app.renderMall();
  assert.ok(findByTestId(mallTree, 'store-selected-item'), 'a long-pressed facility can be stored');

  const openSlot = findSceneSlot(mallTree, 'floor-1-right');
  openSlot.props.onPress();
  await new Promise((resolve) => setImmediate(resolve));
  app.renderProvider();
  mallTree = app.renderMall();
  assert.equal(app.contextExports.useHabits().mallPlacements['floor-1-right'], facility.id);
  assert.equal(app.contextExports.useHabits().coins, 27, 'moving does not spend coins');

  const decorSlot = findSceneSlot(mallTree, 'floor-1-center');
  decorSlot.props.onLongPress();
  mallTree = app.renderMall();
  assert.ok(findByTestId(mallTree, 'store-selected-item'), 'a long-pressed decoration can be stored');
  await press(mallTree, 'store-selected-item');
  app.renderProvider();

  const savedMall = app.contextExports.useHabits();
  assert.equal(savedMall.mallPlacements['floor-1-center'], undefined);
  assert.ok(savedMall.purchasedItems.includes(decor.id), 'storing keeps the decoration owned');
  assert.equal(savedMall.coins, 27, 'storing does not refund or spend coins');
});

test('search cards follow saved moves, show warehouse state after storage, and stay unchanged when canceled', async () => {
  const app = createHarness();
  const item = app.mallCatalog.MALL_ITEMS.find((candidate) => candidate.id === 'welcome-flowers');
  assert.ok(item);
  app.storage.set(storageKeys.mall, JSON.stringify({
    schemaVersion: 3,
    coins: 20,
    purchasedItems: [item.id],
    rewardedCheckIns: [],
    rewardTokens: { facility: 0, shop: 0, decor: 0 },
    placements: { 'floor-1-left': item.id },
    shopInteriors: {},
  }));
  app.renderProvider();
  await app.runEffects('provider');
  app.renderProvider();

  const renderWingScene = (mallTree, wing) => {
    const pager = findNodes(mallTree, (node) => node.type?.name === 'MallWingPager')[0];
    assert.ok(pager, 'the mall renders its floor and wing pager');
    return pager.props.renderWing(wing, true);
  };
  const searchItem = (mallTree) => findByTestId(mallTree, `search-item-location-${item.id}`);
  const enterSearch = (mallTree, mallKey = 'mall') => {
    findByTestId(mallTree, 'mall-search-input').props.onChangeText(item.name);
    return app.renderMall(mallKey);
  };

  let mallTree = enterSearch(app.renderMall());
  assert.match(textContent(searchItem(mallTree)), /1F · 主商場 · 店面區左側/);
  assert.match(textContent(findByTestId(mallTree, `search-item-status-${item.id}`)), /已擺放/);

  await press(mallTree, `search-select-${item.id}`);
  mallTree = app.renderMall();
  await press(mallTree, 'cancel-placement');
  mallTree = app.renderMall();
  assert.match(textContent(searchItem(mallTree)), /1F · 主商場 · 店面區左側/);

  await press(mallTree, `search-select-${item.id}`);
  mallTree = app.renderMall();
  await press(mallTree, 'floor-next');
  mallTree = app.renderMall();
  const newSlot = findNodes(renderWingScene(mallTree, 'annex'), (node) =>
    node.type?.name === 'MallSceneSlot' && node.props.slotId === 'floor-2-annex-1-left',
  )[0];
  assert.ok(newSlot, 'the selected annex contains the target slot');
  newSlot.props.onPress();
  await new Promise((resolve) => setImmediate(resolve));
  await new Promise((resolve) => setImmediate(resolve));
  app.renderProvider();
  mallTree = app.renderMall();
  assert.match(textContent(searchItem(mallTree)), /2F · 延伸區 · 延伸區店面區左側/);
  assert.match(textContent(findByTestId(mallTree, `search-item-status-${item.id}`)), /已擺放/);

  const movedState = app.contextExports.useHabits();
  assert.deepEqual(movedState.purchasedItems, [item.id], 'moving keeps ownership unchanged');
  assert.equal(movedState.coins, 20, 'moving does not spend coins');
  app.renderProvider('provider-after-move-reload');
  await app.runEffects('provider-after-move-reload');
  app.renderProvider('provider-after-move-reload');
  mallTree = enterSearch(app.renderMall('mall-after-move-reload'), 'mall-after-move-reload');
  assert.match(textContent(searchItem(mallTree)), /2F · 延伸區 · 延伸區店面區左側/);
  assert.match(textContent(findByTestId(mallTree, `search-item-status-${item.id}`)), /已擺放/);
  assert.deepEqual(app.contextExports.useHabits().purchasedItems, [item.id], 'reload preserves ownership');
  assert.equal(app.contextExports.useHabits().coins, 20, 'reload preserves the coin balance');

  await press(mallTree, `search-select-${item.id}`);
  mallTree = app.renderMall('mall-after-move-reload');
  assert.ok(findByTestId(mallTree, 'store-selected-item'), 'the reloaded search result can still be stored');
  await press(mallTree, 'store-selected-item');

  app.renderProvider('provider-after-storage-reload');
  await app.runEffects('provider-after-storage-reload');
  app.renderProvider('provider-after-storage-reload');
  mallTree = enterSearch(
    app.renderMall('mall-after-storage-reload'),
    'mall-after-storage-reload',
  );
  assert.match(textContent(searchItem(mallTree)), /倉庫保存中 · 原屬 1F/);
  assert.doesNotMatch(textContent(searchItem(mallTree)), /店面區|延伸區/);
  assert.match(textContent(findByTestId(mallTree, `search-item-status-${item.id}`)), /倉庫保存中 · 免費擺放/);
  assert.deepEqual(app.contextExports.useHabits().mallPlacements, {});
  assert.ok(app.contextExports.useHabits().purchasedItems.includes(item.id), 'storage keeps ownership for free placement');
  assert.equal(app.contextExports.useHabits().coins, 20, 'reload after storage preserves coins');

  await press(mallTree, `search-select-${item.id}`);
  mallTree = app.renderMall('mall-after-storage-reload');
  assert.match(textContent(mallTree), /從倉庫免費擺放/);
  await press(mallTree, 'cancel-placement');
  mallTree = app.renderMall('mall-after-storage-reload');
  assert.match(textContent(searchItem(mallTree)), /倉庫保存中 · 原屬 1F/);

  await press(mallTree, `search-select-${item.id}`);
  mallTree = app.renderMall('mall-after-storage-reload');
  const restoreSlot = findNodes(renderWingScene(mallTree, 'main'), (node) =>
    node.type?.name === 'MallSceneSlot' && node.props.slotId === 'floor-1-left',
  )[0];
  assert.ok(restoreSlot, 'the item can be selected for free placement from its search result');
  restoreSlot.props.onPress();
  await new Promise((resolve) => setImmediate(resolve));
  app.renderProvider('provider-after-storage-reload');
  mallTree = app.renderMall('mall-after-storage-reload');
  assert.match(textContent(searchItem(mallTree)), /1F · 主商場 · 店面區左側/);
  assert.match(textContent(findByTestId(mallTree, `search-item-status-${item.id}`)), /已擺放/);
  assert.equal(app.contextExports.useHabits().coins, 20, 'movement and free placement do not spend coins');
});

test('both search cards show their new locations after an exchange without changing ownership or coins', async () => {
  const app = createHarness();
  const movingItem = app.mallCatalog.MALL_ITEMS.find((item) => item.id === 'flower-shop');
  const displacedItem = app.mallCatalog.MALL_ITEMS.find((item) => item.id === 'colorful-planter');
  assert.ok(movingItem && displacedItem, 'both searchable owned items exist in the catalog');
  const purchasedItems = [movingItem.id, displacedItem.id];
  const startingCoins = 19;
  app.storage.set(storageKeys.mall, JSON.stringify({
    schemaVersion: 3,
    coins: startingCoins,
    purchasedItems,
    rewardedCheckIns: [],
    rewardTokens: { facility: 0, shop: 0, decor: 0 },
    placements: {
      'floor-1-left': movingItem.id,
      'floor-2-annex-1-right': displacedItem.id,
    },
    shopInteriors: {},
  }));
  app.renderProvider();
  await app.runEffects('provider');
  app.renderProvider();

  let mallTree = app.renderMall();
  findByTestId(mallTree, 'mall-search-input').props.onChangeText('花');
  mallTree = app.renderMall();
  const searchLocation = (tree, itemId) => findByTestId(tree, `search-item-location-${itemId}`);
  assert.match(textContent(searchLocation(mallTree, movingItem.id)), /1F · 主商場 · 店面區左側/);
  assert.match(textContent(searchLocation(mallTree, displacedItem.id)), /2F · 延伸區 · 延伸區店面區右側/);

  await press(mallTree, `search-select-${movingItem.id}`);
  mallTree = app.renderMall();
  const wingPager = findNodes(mallTree, (node) => node.type?.name === 'MallWingPager')[0];
  assert.ok(wingPager, 'the mall renders the destination floor sections');
  const annex = wingPager.props.renderWing('annex', true);
  const occupiedSlot = findNodes(annex, (node) =>
    node.type?.name === 'MallSceneSlot' && node.props.slotId === 'floor-2-annex-1-right',
  )[0];
  assert.ok(occupiedSlot, 'the selected item can target the other item in the annex');
  occupiedSlot.props.onPress();
  await new Promise((resolve) => setImmediate(resolve));
  await new Promise((resolve) => setImmediate(resolve));
  app.renderProvider();
  mallTree = app.renderMall();

  assert.match(textContent(searchLocation(mallTree, movingItem.id)), /2F · 延伸區 · 延伸區店面區右側/);
  assert.match(textContent(searchLocation(mallTree, displacedItem.id)), /1F · 主商場 · 店面區左側/);
  const state = app.contextExports.useHabits();
  assert.deepEqual(state.mallPlacements, {
    'floor-2-annex-1-right': movingItem.id,
    'floor-1-left': displacedItem.id,
  });
  assert.deepEqual(state.purchasedItems, purchasedItems, 'the exchange keeps both items owned');
  assert.equal(state.coins, startingCoins, 'the exchange does not spend coins');
  const savedMall = JSON.parse(app.storage.get(storageKeys.mall));
  assert.deepEqual(savedMall.placements, state.mallPlacements, 'both exchanged locations are persisted together');
  assert.deepEqual(savedMall.purchasedItems, purchasedItems, 'persisted ownership is unchanged');
  assert.equal(savedMall.coins, startingCoins, 'persisted coins are unchanged');
});

test('shop interior page shows its matching decor catalog and charges only goal-earned coins', async () => {
  const app = createHarness();
  const shop = app.mallCatalog.MALL_ITEMS.find((item) => item.id === 'ladies-fashion-boutique');
  assert.ok(shop);
  app.storage.set(storageKeys.mall, JSON.stringify({
    schemaVersion: 3,
    coins: 120,
    purchasedItems: [shop.id],
    rewardedCheckIns: [],
    rewardTokens: { facility: 0, shop: 0, decor: 0 },
    placements: {},
    shopInteriors: {},
  }));
  app.renderProvider();
  await app.runEffects('provider');
  app.renderProvider();
  app.setLocalSearchParams({ itemId: shop.id });

  let interiorTree = app.renderShopInterior();
  assert.equal(textContent(findByTestId(interiorTree, 'shop-interior-name')), '女裝店');
  assert.ok(findByTestId(interiorTree, 'shop-interior-scene'));
  assert.equal(
    textContent(findByTestId(interiorTree, 'shop-decoration-page-count')),
    '第 1 / 5 頁 · 共 50 款',
  );
  const animatedVisuals = findNodes(
    interiorTree,
    (node) => node.type?.name === 'ShopInteriorAnimatedObject',
  );
  assert.ok(animatedVisuals.some((node) =>
    node.props.testID === 'shop-interior-storefront-visual' && node.props.category === 'shop',
  ), 'the shop facade uses the shared animated mall visual');
  assert.ok(animatedVisuals.some((node) =>
    node.props.testID?.endsWith('womenswear-clothing-rack') && node.props.category === 'decor',
  ), 'decoration choices preview with the shared animated mall visual');
  const catalogVisuals = (tree) => findNodes(
    tree,
    (node) => node.type?.name === 'ShopInteriorAnimatedObject' && node.props.testID?.startsWith('shop-decoration-visual-'),
  );
  assert.equal(catalogVisuals(interiorTree).length, 10, 'only one page of animated choices is mounted at a time');
  for (let page = 2; page <= 5; page += 1) {
    await press(interiorTree, 'shop-decoration-page-next');
    interiorTree = app.renderShopInterior();
  }
  assert.equal(
    textContent(findByTestId(interiorTree, 'shop-decoration-page-count')),
    '第 5 / 5 頁 · 共 50 款',
  );
  assert.ok(findByTestIdPrefixAndSuffix(interiorTree, 'shop-decoration-limited-', 'womenswear-limited-starlight-top'));
  for (let page = 5; page > 1; page -= 1) {
    await press(interiorTree, 'shop-decoration-page-prev');
    interiorTree = app.renderShopInterior();
  }
  assert.equal(catalogVisuals(interiorTree).length, 10);
  let sceneTree = app.renderShopInteriorScene(interiorTree);
  for (const slot of ['front-window', 'left-wall', 'center', 'right-wall', 'back-wall', 'counter', 'left-table', 'right-table']) {
    assert.ok(findByTestId(sceneTree, `shop-interior-slot-${slot}`), `${slot} can be selected`);
  }
  assert.equal(
    findNodes(sceneTree, (node) => typeof node.props?.testID === 'string' && node.props.testID.startsWith('shop-interior-slot-')).length,
    8,
    'the main area exposes eight placement positions',
  );
  assert.ok(findByTestIdPrefixAndSuffix(interiorTree, 'shop-decoration-store-', 'womenswear-clothing-rack'));

  const placementActionId = findByTestIdPrefixAndSuffix(
    interiorTree,
    'shop-decoration-place-store-',
    'womenswear-clothing-rack',
  ).props.testID;
  const rackDecorationId = placementActionId.replace('shop-decoration-place-', '');
  await press(interiorTree, placementActionId);
  app.renderProvider();
  interiorTree = app.renderShopInterior();
  sceneTree = app.renderShopInteriorScene(interiorTree);
  assert.equal(app.contextExports.useHabits().coins, 90);
  assert.deepEqual(app.contextExports.useHabits().shopInteriors[shop.id], {
    ownedDecorations: [rackDecorationId],
    placements: { 'front-window': rackDecorationId },
  });
  const installedSlot = findByTestId(sceneTree, 'shop-interior-slot-front-window');
  const installedVisual = findNodes(installedSlot, (node) => node.type === 'MallObjectVisual')[0];
  assert.equal(installedVisual.props.category, 'decor');
  assert.match(installedVisual.props.id, /^clothing-(rack|wardrobe)$/);
  assert.match(
    textContent(findByTestIdPrefixAndSuffix(interiorTree, 'shop-decoration-store-', 'womenswear-clothing-rack')),
    /已佈置於主區櫥窗/,
  );
});

test('screen readers can identify and use every shop-interior position', async () => {
  const app = createHarness();
  const shop = app.mallCatalog.MALL_ITEMS.find((item) => item.id === 'ladies-fashion-boutique');
  assert.ok(shop);
  app.storage.set(storageKeys.mall, JSON.stringify({
    schemaVersion: 3,
    coins: 120,
    purchasedItems: [shop.id],
    rewardedCheckIns: [],
    rewardTokens: { facility: 0, shop: 0, decor: 0 },
    placements: {},
    shopInteriors: {},
  }));
  app.renderProvider();
  await app.runEffects('provider');
  app.renderProvider();
  app.setLocalSearchParams({ itemId: shop.id });

  let interiorTree = app.renderShopInterior();
  const areaLabels = ['主區', '延伸區 1', '延伸區 2', '延伸區 3', '延伸區 4', '延伸區 5'];
  const slotIds = ['front-window', 'left-wall', 'center', 'right-wall', 'back-wall', 'counter', 'left-table', 'right-table'];
  for (let areaIndex = 0; areaIndex < areaLabels.length; areaIndex += 1) {
    const sceneTree = app.renderShopInteriorScene(interiorTree);
    for (const slot of slotIds) {
      const hotspot = findByTestId(sceneTree, `shop-interior-slot-${slot}`);
      assert.equal(hotspot.props.accessible, true, `${areaLabels[areaIndex]} ${slot} can receive focus`);
      assert.equal(hotspot.props.accessibilityRole, 'button');
      assert.match(hotspot.props.accessibilityLabel, new RegExp(areaLabels[areaIndex]));
      assert.match(hotspot.props.accessibilityLabel, /尚未佈置/);
      assert.equal(hotspot.props.accessibilityState.selected, slot === 'front-window');
    }
    if (areaIndex < areaLabels.length - 1) {
      await press(interiorTree, 'shop-interior-area-next');
      interiorTree = app.renderShopInterior();
    }
  }

  for (let areaIndex = areaLabels.length - 1; areaIndex > 0; areaIndex -= 1) {
    await press(interiorTree, 'shop-interior-area-prev');
    interiorTree = app.renderShopInterior();
  }
  let sceneTree = app.renderShopInteriorScene(interiorTree);
  await press(sceneTree, 'shop-interior-slot-left-wall');
  interiorTree = app.renderShopInterior();
  sceneTree = app.renderShopInteriorScene(interiorTree);
  const selectedWall = findByTestId(sceneTree, 'shop-interior-slot-left-wall');
  assert.equal(selectedWall.props.accessibilityState.selected, true);
  assert.match(selectedWall.props.accessibilityLabel, /左牆，尚未佈置.*目前選取/);

  await press(sceneTree, 'shop-interior-slot-front-window');
  interiorTree = app.renderShopInterior();
  const getRackPlacementActionId = (tree) => findNodes(
    tree,
    (node) => node.props?.testID?.startsWith('shop-decoration-place-')
      && node.props.testID.endsWith('womenswear-clothing-rack'),
  )[0]?.props.testID;
  const initialPlacementActionId = getRackPlacementActionId(interiorTree);
  assert.ok(initialPlacementActionId);
  await press(interiorTree, initialPlacementActionId);
  app.renderProvider();
  interiorTree = app.renderShopInterior();
  sceneTree = app.renderShopInteriorScene(interiorTree);
  const redeemedSlot = findByTestId(sceneTree, 'shop-interior-slot-front-window');
  assert.match(redeemedSlot.props.accessibilityLabel, /主區，櫥窗，目前是.*新品衣架牆/);
  assert.match(redeemedSlot.props.accessibilityLabel, /操作結果：已兌換並放在主區櫥窗，扣除 30 金幣。/);

  await press(sceneTree, 'shop-interior-slot-left-wall');
  interiorTree = app.renderShopInterior();
  await press(interiorTree, getRackPlacementActionId(interiorTree));
  app.renderProvider();
  interiorTree = app.renderShopInterior();
  sceneTree = app.renderShopInteriorScene(interiorTree);
  const movedSlot = findByTestId(sceneTree, 'shop-interior-slot-left-wall');
  assert.match(movedSlot.props.accessibilityLabel, /目前是.*新品衣架牆/);
  assert.match(movedSlot.props.accessibilityLabel, /操作結果：已免費將項目移至主區左牆/);

  await press(interiorTree, 'shop-interior-store-decoration');
  app.renderProvider();
  interiorTree = app.renderShopInterior();
  sceneTree = app.renderShopInteriorScene(interiorTree);
  const storedSlot = findByTestId(sceneTree, 'shop-interior-slot-left-wall');
  assert.match(storedSlot.props.accessibilityLabel, /左牆，尚未佈置/);
  assert.match(storedSlot.props.accessibilityLabel, /操作結果：已將.*新品衣架牆收進這間店的收藏/);
});

test('cafe equipment is clearly labeled, illustrated, and purchased with earned coins', async () => {
  const app = createHarness();
  const shop = app.mallCatalog.MALL_ITEMS.find((item) => item.id === 'sunny-cafe');
  assert.ok(shop);
  app.storage.set(storageKeys.mall, JSON.stringify({
    schemaVersion: 3,
    coins: 120,
    purchasedItems: [shop.id],
    rewardedCheckIns: [],
    rewardTokens: { facility: 0, shop: 0, decor: 0 },
    placements: {},
    shopInteriors: {},
  }));
  app.renderProvider();
  await app.runEffects('provider');
  app.renderProvider();
  app.setLocalSearchParams({ itemId: shop.id });

  let interiorTree = app.renderShopInterior();
  for (let page = 1; page < 5; page += 1) {
    await press(interiorTree, 'shop-decoration-page-next');
    interiorTree = app.renderShopInterior();
  }
  const coffeeMachine = findByTestIdPrefixAndSuffix(interiorTree, 'shop-decoration-store-', 'general-equipment-cafe-espresso-machine');
  assert.equal(textContent(coffeeMachine).includes('雙頭咖啡機'), true);
  assert.ok(findByTestIdPrefixAndSuffix(interiorTree, 'shop-decoration-equipment-store-', 'general-equipment-cafe-espresso-machine'));
  const machineVisual = findByTestIdPrefixAndSuffix(interiorTree, 'shop-decoration-visual-store-', 'general-equipment-cafe-espresso-machine');
  assert.equal(machineVisual.props.visual, 'coffee-machine');

  const machinePlacementActionId = findByTestIdPrefixAndSuffix(
    interiorTree,
    'shop-decoration-place-store-',
    'general-equipment-cafe-espresso-machine',
  ).props.testID;
  const machineDecorationId = machinePlacementActionId.replace('shop-decoration-place-', '');
  await press(interiorTree, machinePlacementActionId);
  app.renderProvider();
  interiorTree = app.renderShopInterior();
  const sceneTree = app.renderShopInteriorScene(interiorTree);
  assert.equal(app.contextExports.useHabits().coins, 58);
  assert.equal(
    app.contextExports.useHabits().shopInteriors[shop.id].placements['front-window'],
    machineDecorationId,
  );
  const installedSlot = findByTestId(sceneTree, 'shop-interior-slot-front-window');
  assert.equal(
    findNodes(installedSlot, (node) => node.type === 'MallObjectVisual')[0].props.id,
    'coffee-machine',
  );
});

test('redeemed cafe dogs walk, open free care actions, and stay outside the 48 interior slots', async () => {
  const app = createHarness();
  const shop = app.mallCatalog.MALL_ITEMS.find((item) => item.id === 'fluffy-marshmallow-cafe');
  assert.ok(shop);
  app.storage.set(storageKeys.mall, JSON.stringify({
    schemaVersion: 3,
    coins: 120,
    purchasedItems: [shop.id],
    rewardedCheckIns: [],
    rewardTokens: { facility: 0, shop: 0, decor: 0 },
    placements: {},
    shopInteriors: {},
  }));
  app.renderProvider();
  await app.runEffects('provider');
  app.renderProvider();
  app.setLocalSearchParams({ itemId: shop.id });

  const dogId = 'general-fluffy-staff-huahua';
  let interiorTree = app.renderShopInterior();
  let customizerTree = app.renderDogStaffCustomizer(interiorTree);
  assert.ok(findByTestId(customizerTree, 'dog-staff-area-main'));
  assert.ok(findByTestId(customizerTree, 'dog-staff-area-extension-5'));
  await press(customizerTree, 'dog-staff-redeem-fluffy-staff-huahua');
  app.renderProvider();
  interiorTree = app.renderShopInterior();
  customizerTree = app.renderDogStaffCustomizer(interiorTree);
  const sceneTree = app.renderShopInteriorScene(interiorTree);

  assert.equal(app.contextExports.useHabits().coins, 40);
  const cafe = app.contextExports.useHabits().shopInteriors[shop.id];
  assert.equal(cafe.dogStaffPlacements[dogId], 'main');
  assert.deepEqual(cafe.placements, {}, 'dedicated dog staff do not consume any of the 48 decor positions');
  assert.ok(cafe.ownedDecorations.includes(dogId));
  assert.ok(!findNodes(sceneTree, (node) => node.type === 'MallObjectVisual' && node.props.id === 'dog-staff-huahua').length);
  const staffArea = findByTestId(sceneTree, 'dog-staff-scene-area-main');
  assert.ok(staffArea, 'the assigned dog is drawn in the main area');
  assert.equal(
    findNodes(staffArea, (node) => node.props?.testID?.startsWith('dog-staff-walker-')).length,
    1,
    'the assigned dog gets its own moving floor character',
  );
  assert.ok(findNodes(staffArea, (node) => node.props?.testID?.startsWith('dog-staff-walker-')).length);
  assert.equal(findByTestId(sceneTree, 'dog-staff-scene-area-extension-1'), undefined);

  const walker = findNodes(staffArea, (node) => node.props?.testID?.startsWith('dog-staff-walker-'))[0];
  await press(sceneTree, walker.props.testID);
  let interactionTree = app.renderShopInteriorScene(interiorTree);
  assert.ok(findByTestId(interactionTree, 'dog-staff-interaction-sheet'), 'tapping the redeemed dog opens its care panel');

  for (const [action, feedback] of [
    ['groom', '享受梳毛'],
    ['pet', '享受你的摸摸'],
    ['feed', '雞肉小肉乾'],
    ['play', '玩得很開心'],
  ]) {
    await press(interactionTree, `dog-staff-interaction-fluffy-staff-huahua-${action}`);
    interactionTree = app.renderShopInteriorScene(interiorTree);
    if (action === 'feed') {
      const foodPicker = findByTestId(interactionTree, 'dog-staff-food-picker');
      assert.ok(foodPicker, 'choosing feed opens the dog-specific food picker');
      assert.equal(
        findNodes(foodPicker, (node) => /^dog-staff-food-fluffy-staff-huahua-food-/.test(node.props?.testID ?? '')).length,
        5,
        'Huahua can choose from five foods',
      );
      assert.ok(
        findByTestId(interactionTree, 'dog-food-illustration-fluffy-staff-huahua-food-chicken-bites'),
        'the chicken option has its matching cartoon illustration',
      );
      await press(interactionTree, 'dog-staff-food-fluffy-staff-huahua-food-chicken-bites');
      interactionTree = app.renderShopInteriorScene(interiorTree);
    }
    assert.ok(textContent(findByTestId(interactionTree, 'dog-staff-interaction-feedback')).includes(feedback));
    assert.equal(app.contextExports.useHabits().coins, 40, `${action} is included and does not spend coins`);
    assert.equal(app.contextExports.useHabits().shopInteriors[shop.id].dogStaffPlacements[dogId], 'main');
  }
  await press(interactionTree, 'dog-staff-interaction-close');
  interactionTree = app.renderShopInteriorScene(interiorTree);
  assert.equal(findByTestId(interactionTree, 'dog-staff-interaction-sheet'), undefined);
});

test('animal ear hat filter finds Huahua and Tangtang styles without saving a look or spending coins', async () => {
  const app = createHarness();
  const shop = app.mallCatalog.MALL_ITEMS.find((item) => item.id === 'fluffy-marshmallow-cafe');
  assert.ok(shop);
  app.storage.set(storageKeys.mall, JSON.stringify({
    schemaVersion: 3,
    coins: 500,
    purchasedItems: [shop.id],
    rewardedCheckIns: [],
    rewardTokens: { facility: 0, shop: 0, decor: 0 },
    placements: {},
    shopInteriors: {},
  }));
  app.renderProvider();
  await app.runEffects('provider');
  app.renderProvider();
  app.setLocalSearchParams({ itemId: shop.id });

  const huahuaId = 'general-fluffy-staff-huahua';
  const tangtangId = 'general-fluffy-staff-tangtang';
  let interiorTree = app.renderShopInterior();
  let customizerTree = app.renderDogStaffCustomizer(interiorTree);
  await press(customizerTree, 'dog-staff-redeem-fluffy-staff-huahua');
  app.renderProvider();
  interiorTree = app.renderShopInterior();
  customizerTree = app.renderDogStaffCustomizer(interiorTree);
  await press(customizerTree, 'dog-staff-tab-accessory');
  customizerTree = app.renderDogStaffCustomizer(interiorTree);
  await press(customizerTree, 'dog-staff-look-fluffy-staff-huahua-accessory-2');
  app.renderProvider();
  interiorTree = app.renderShopInterior();
  customizerTree = app.renderDogStaffCustomizer(interiorTree);
  await press(customizerTree, 'dog-staff-select-fluffy-staff-tangtang');
  customizerTree = app.renderDogStaffCustomizer(interiorTree);
  await press(customizerTree, 'dog-staff-redeem-fluffy-staff-tangtang');
  app.renderProvider();
  interiorTree = app.renderShopInterior();
  customizerTree = app.renderDogStaffCustomizer(interiorTree);
  await press(customizerTree, 'dog-staff-select-fluffy-staff-huahua');
  customizerTree = app.renderDogStaffCustomizer(interiorTree);

  const coinsBeforeFilter = app.contextExports.useHabits().coins;
  const huahuaLookBeforeFilter = { ...app.contextExports.useHabits().shopInteriors[shop.id].dogStaffLooks[huahuaId] };
  await press(customizerTree, 'dog-staff-tab-accessory');
  customizerTree = app.renderDogStaffCustomizer(interiorTree);
  assert.ok(findByTestId(customizerTree, 'dog-staff-accessory-filter-all'));
  assert.ok(findByTestId(customizerTree, 'dog-staff-accessory-filter-animal-ears'));
  await press(customizerTree, 'dog-staff-accessory-filter-animal-ears');
  customizerTree = app.renderDogStaffCustomizer(interiorTree);

  assert.match(textContent(customizerTree), /花花・獅子耳朵帽/);
  assert.doesNotMatch(textContent(customizerTree), /草莓蝴蝶結/);
  assert.equal(app.contextExports.useHabits().coins, coinsBeforeFilter, 'changing the filter does not spend coins');
  assert.deepEqual(
    app.contextExports.useHabits().shopInteriors[shop.id].dogStaffLooks[huahuaId],
    huahuaLookBeforeFilter,
    'changing the filter does not save or replace the worn accessory',
  );
  assert.match(textContent(findByTestId(customizerTree, 'dog-staff-look-page')), /第 1 \/ 1 頁/);
  assert.equal(
    findNodes(customizerTree, (node) => node.props?.testID?.startsWith('dog-staff-look-fluffy-staff-huahua-accessory-')).length,
    10,
    'all ten animal ear hats fit on the filtered page',
  );

  await press(customizerTree, 'dog-staff-select-fluffy-staff-tangtang');
  customizerTree = app.renderDogStaffCustomizer(interiorTree);
  assert.match(textContent(customizerTree), /糖糖・小熊耳朵帽/);
  assert.equal(app.contextExports.useHabits().coins, coinsBeforeFilter, 'switching dogs while filtered also remains free');
  assert.equal(
    app.contextExports.useHabits().shopInteriors[shop.id].dogStaffLooks?.[tangtangId],
    undefined,
    'filtering does not change Tangtang’s saved accessory either',
  );

  assert.match(textContent(customizerTree), /熊耳朵帽/);
  assert.equal(
    findNodes(customizerTree, (node) => node.props?.testID?.startsWith('dog-staff-look-fluffy-staff-tangtang-accessory-')).length,
    10,
    'all ten animal ear hats are available to Tangtang without paging',
  );
});

test('dog outfits persist when walking dogs move between all six areas, while the 48 decor slots remain independent', async () => {
  const app = createHarness();
  const shop = app.mallCatalog.MALL_ITEMS.find((item) => item.id === 'fluffy-marshmallow-cafe');
  const dogId = 'general-fluffy-staff-huahua';
  assert.ok(shop);
  app.storage.set(storageKeys.mall, JSON.stringify({
    schemaVersion: 3,
    coins: 120,
    purchasedItems: [shop.id],
    rewardedCheckIns: [],
    rewardTokens: { facility: 0, shop: 0, decor: 0 },
    placements: {},
    shopInteriors: {},
  }));
  app.renderProvider();
  await app.runEffects('provider');
  app.renderProvider();
  app.setLocalSearchParams({ itemId: shop.id });

  let interiorTree = app.renderShopInterior();
  let customizerTree = app.renderDogStaffCustomizer(interiorTree);
  await press(customizerTree, `dog-staff-redeem-fluffy-staff-huahua`);
  app.renderProvider();
  interiorTree = app.renderShopInterior();
  customizerTree = app.renderDogStaffCustomizer(interiorTree);
  assert.ok(findByTestId(customizerTree, 'dog-staff-customizer'));
  const selectedDogButton = findByTestId(customizerTree, 'dog-staff-select-fluffy-staff-huahua');
  assert.match(selectedDogButton.props.accessibilityLabel, /花花.*淺啡色博美.*目前選取/);
  assert.equal(selectedDogButton.props.accessibilityState.selected, true);
  assert.match(textContent(customizerTree), /服裝 56 款/);
  assert.match(textContent(customizerTree), /主題服裝 53 款/);
  assert.match(textContent(customizerTree), /配飾 60 款/);
  assert.match(textContent(customizerTree), /不佔每區 8 個一般位置/);

  await press(customizerTree, 'dog-staff-tab-accessory');
  customizerTree = app.renderDogStaffCustomizer(interiorTree);
  const wornAccessory = findNodes(customizerTree, (node) =>
    node.props?.testID?.startsWith('dog-staff-look-fluffy-staff-huahua-accessory-')
      && node.props?.accessibilityState?.selected)[0];
  assert.match(wornAccessory.props.accessibilityLabel, /花花.*目前穿戴中.*免費附送/);
  const accessoryAnnouncementCount = app.announcements.length;
  await press(customizerTree, `dog-staff-look-fluffy-staff-huahua-accessory-2`);
  assert.equal(app.announcements.length, accessoryAnnouncementCount + 1, 'iOS announces each saved look once');
  assert.match(app.announcements.at(-1), /花花.*配飾.*免費穿戴/);
  app.renderProvider();
  interiorTree = app.renderShopInterior();
  customizerTree = app.renderDogStaffCustomizer(interiorTree);
  const savedAccessory = findByTestId(customizerTree, 'dog-staff-look-fluffy-staff-huahua-accessory-2');
  assert.match(savedAccessory.props.accessibilityLabel, /花花.*目前穿戴中.*免費附送/);
  assert.equal(savedAccessory.props.accessibilityState.selected, true);
  await press(customizerTree, 'dog-staff-tab-outfit');
  customizerTree = app.renderDogStaffCustomizer(interiorTree);
  for (let page = 1; page < 6; page += 1) {
    await press(customizerTree, 'dog-staff-look-page-next');
    customizerTree = app.renderDogStaffCustomizer(interiorTree);
  }
  assert.match(textContent(customizerTree), /花花・粉紅色公主裙/);
  await press(customizerTree, 'dog-staff-look-fluffy-staff-huahua-outfit-53');
  app.renderProvider();
  interiorTree = app.renderShopInterior();
  customizerTree = app.renderDogStaffCustomizer(interiorTree);
  assert.equal(app.contextExports.useHabits().shopInteriors[shop.id].dogStaffLooks[dogId].outfitId, `${dogId}:outfit:special-pink-skirt-2`);
  await press(customizerTree, 'dog-staff-tab-theme');
  customizerTree = app.renderDogStaffCustomizer(interiorTree);
  for (let page = 1; page < 5; page += 1) {
    await press(customizerTree, 'dog-staff-look-page-next');
    customizerTree = app.renderDogStaffCustomizer(interiorTree);
  }
  assert.match(textContent(customizerTree), /森林精靈葉片披風/);
  await press(customizerTree, 'dog-staff-look-fluffy-staff-huahua-theme-50');
  app.renderProvider();
  interiorTree = app.renderShopInterior();
  customizerTree = app.renderDogStaffCustomizer(interiorTree);
  assert.equal(app.contextExports.useHabits().shopInteriors[shop.id].dogStaffLooks[dogId].outfitId, `${dogId}:outfit:festival:forest:5`);
  await press(customizerTree, 'dog-staff-look-page-next');
  customizerTree = app.renderDogStaffCustomizer(interiorTree);
  assert.match(textContent(customizerTree), /魔法少女星願裙/);
  await press(customizerTree, 'dog-staff-look-fluffy-staff-huahua-theme-51');
  app.renderProvider();
  interiorTree = app.renderShopInterior();
  customizerTree = app.renderDogStaffCustomizer(interiorTree);
  assert.equal(app.contextExports.useHabits().shopInteriors[shop.id].dogStaffLooks[dogId].outfitId, `${dogId}:outfit:magical-girl`);
  await press(customizerTree, 'dog-staff-look-fluffy-staff-huahua-theme-52');
  app.renderProvider();
  interiorTree = app.renderShopInterior();
  customizerTree = app.renderDogStaffCustomizer(interiorTree);
  assert.equal(app.contextExports.useHabits().shopInteriors[shop.id].dogStaffLooks[dogId].outfitId, `${dogId}:outfit:cozy-sweater`);
  await press(customizerTree, 'dog-staff-look-fluffy-staff-huahua-theme-53');
  app.renderProvider();
  interiorTree = app.renderShopInterior();
  customizerTree = app.renderDogStaffCustomizer(interiorTree);
  assert.equal(app.contextExports.useHabits().shopInteriors[shop.id].dogStaffLooks[dogId].outfitId, `${dogId}:outfit:animal-costume`);
  await press(customizerTree, 'dog-staff-tab-accessory');
  customizerTree = app.renderDogStaffCustomizer(interiorTree);
  for (let page = 1; page < 6; page += 1) {
    await press(customizerTree, 'dog-staff-look-page-next');
    customizerTree = app.renderDogStaffCustomizer(interiorTree);
  }
  assert.match(textContent(customizerTree), /花花・獅子耳朵帽/);
  await press(customizerTree, 'dog-staff-look-fluffy-staff-huahua-accessory-51');
  app.renderProvider();
  interiorTree = app.renderShopInterior();
  customizerTree = app.renderDogStaffCustomizer(interiorTree);
  const savedLook = app.contextExports.useHabits().shopInteriors[shop.id].dogStaffLooks[dogId];
  assert.equal(savedLook.outfitId, `${dogId}:outfit:animal-costume`);
  assert.equal(savedLook.accessoryId, `${dogId}:accessory:animal-ears:lion`);
  assert.equal(app.contextExports.useHabits().coins, 40);

  let sceneTree = app.renderShopInteriorScene(interiorTree);
  assert.ok(!findNodes(sceneTree, (node) => node.type === 'MallObjectVisual' && node.props.id === 'dog-staff-huahua').length);
  const activeWalker = findNodes(sceneTree, (node) => node.props?.testID?.startsWith('dog-staff-walker-'))[0];
  assert.ok(activeWalker);
  assert.equal(activeWalker.props.look.outfitId, savedLook.outfitId);
  assert.equal(activeWalker.props.look.accessoryId, savedLook.accessoryId);
  assert.equal(app.contextExports.useHabits().shopInteriors[shop.id].dogStaffPlacements[dogId], 'main');

  app.setPlatform('android');
  const moveAnnouncementCount = app.announcements.length;
  await press(customizerTree, 'dog-staff-area-extension-5');
  customizerTree = app.renderDogStaffCustomizer(interiorTree);
  await press(customizerTree, `dog-staff-move-fluffy-staff-huahua`);
  assert.equal(app.announcements.length, moveAnnouncementCount, 'Android uses the live region without a second explicit announcement');
  customizerTree = app.renderDogStaffCustomizer(interiorTree);
  assert.equal(findByTestId(customizerTree, 'dog-staff-customizer-notice').props.accessibilityLiveRegion, 'polite');
  assert.match(
    textContent(findByTestId(customizerTree, 'dog-staff-customizer-notice')),
    /已將花花免費移到延伸區 5.*目前造型保留/,
  );
  app.renderProvider();
  interiorTree = app.renderShopInterior();
  assert.equal(findByTestId(interiorTree, 'shop-interior-notice'), undefined, 'the parent page does not duplicate the dog move result');
  sceneTree = app.renderShopInteriorScene(interiorTree);

  const currentState = app.contextExports.useHabits();
  assert.equal(currentState.coins, 40, 'moving a redeemed dog is free');
  assert.deepEqual(currentState.shopInteriors[shop.id].placements, {});
  assert.deepEqual(currentState.shopInteriors[shop.id].dogStaffPlacements, { [dogId]: 'extension-5' });
  assert.deepEqual(currentState.shopInteriors[shop.id].dogStaffLooks[dogId], savedLook);
  assert.ok(findNodes(sceneTree, (node) => node.props?.testID?.startsWith('dog-staff-walker-')).length, 'the dog is visible in the selected extension after moving');
  customizerTree = app.renderDogStaffCustomizer(interiorTree);
  await press(customizerTree, 'dog-staff-store-fluffy-staff-huahua');
  app.renderProvider();
  interiorTree = app.renderShopInterior();
  const stored = app.contextExports.useHabits().shopInteriors[shop.id];
  assert.deepEqual(stored.dogStaffPlacements, {});
  assert.ok(stored.ownedDecorations.includes(dogId), 'storing the dog keeps its ownership');
  assert.deepEqual(stored.dogStaffLooks[dogId], savedLook, 'storing the dog keeps its look');
  assert.equal(app.contextExports.useHabits().coins, 40, 'storage is free and does not refund its redemption price');
});

test('each dog can save, apply, delete and restore named outfits without spending coins', async () => {
  const app = createHarness();
  const shop = app.mallCatalog.MALL_ITEMS.find((item) => item.id === 'fluffy-marshmallow-cafe');
  const dogId = 'general-fluffy-staff-huahua';
  assert.ok(shop);
  app.storage.set(storageKeys.mall, JSON.stringify({
    schemaVersion: 5,
    coins: 500,
    purchasedItems: [shop.id],
    rewardedCheckIns: [],
    rewardTokens: { facility: 0, shop: 0, decor: 0 },
    placements: {},
    shopInteriors: {
      [shop.id]: {
        ownedDecorations: [dogId],
        placements: {},
        dogStaffPlacements: { [dogId]: 'main' },
      },
    },
  }));
  app.renderProvider();
  await app.runEffects('provider');
  app.renderProvider();
  app.setLocalSearchParams({ itemId: shop.id });

  let interiorTree = app.renderShopInterior();
  let customizerTree = app.renderDogStaffCustomizer(interiorTree);
  const coinsBefore = app.contextExports.useHabits().coins;

  async function changeName(name) {
    customizerTree = app.renderDogStaffCustomizer(interiorTree);
    const input = findByTestId(customizerTree, 'dog-staff-saved-look-name-fluffy-staff-huahua');
    assert.ok(input);
    input.props.onChangeText(name);
    customizerTree = app.renderDogStaffCustomizer(interiorTree);
    await press(customizerTree, 'dog-staff-saved-look-save-fluffy-staff-huahua');
    app.renderProvider();
    interiorTree = app.renderShopInterior();
    customizerTree = app.renderDogStaffCustomizer(interiorTree);
  }

  await press(customizerTree, 'dog-staff-tab-outfit');
  customizerTree = app.renderDogStaffCustomizer(interiorTree);
  await press(customizerTree, 'dog-staff-look-fluffy-staff-huahua-outfit-2');
  app.renderProvider();
  interiorTree = app.renderShopInterior();
  customizerTree = app.renderDogStaffCustomizer(interiorTree);
  await press(customizerTree, 'dog-staff-tab-accessory');
  customizerTree = app.renderDogStaffCustomizer(interiorTree);
  await press(customizerTree, 'dog-staff-look-fluffy-staff-huahua-accessory-2');
  app.renderProvider();
  interiorTree = app.renderShopInterior();
  await changeName('魔法少女');

  const firstSaved = app.contextExports.useHabits().shopInteriors[shop.id].dogStaffOutfits[dogId][0];
  assert.equal(firstSaved.name, '魔法少女');

  await press(customizerTree, 'dog-staff-tab-outfit');
  customizerTree = app.renderDogStaffCustomizer(interiorTree);
  await press(customizerTree, 'dog-staff-look-fluffy-staff-huahua-outfit-3');
  app.renderProvider();
  interiorTree = app.renderShopInterior();
  customizerTree = app.renderDogStaffCustomizer(interiorTree);
  await press(customizerTree, 'dog-staff-tab-accessory');
  customizerTree = app.renderDogStaffCustomizer(interiorTree);
  await press(customizerTree, 'dog-staff-look-fluffy-staff-huahua-accessory-3');
  app.renderProvider();
  interiorTree = app.renderShopInterior();
  await changeName('節日派對');

  const savedLooks = app.contextExports.useHabits().shopInteriors[shop.id].dogStaffOutfits[dogId];
  assert.equal(savedLooks.length, 2);
  const secondSaved = savedLooks[1];
  assert.notEqual(firstSaved.look.outfitId, secondSaved.look.outfitId);
  assert.notEqual(firstSaved.look.accessoryId, secondSaved.look.accessoryId);

  customizerTree = app.renderDogStaffCustomizer(interiorTree);
  await press(customizerTree, `dog-staff-saved-look-apply-fluffy-staff-huahua-${firstSaved.id}`);
  app.renderProvider();
  interiorTree = app.renderShopInterior();
  customizerTree = app.renderDogStaffCustomizer(interiorTree);
  assert.deepEqual(
    app.contextExports.useHabits().shopInteriors[shop.id].dogStaffLooks[dogId],
    firstSaved.look,
    'applying a named preset restores both its outfit and accessory',
  );

  await press(customizerTree, `dog-staff-saved-look-delete-fluffy-staff-huahua-${secondSaved.id}`);
  app.renderProvider();
  assert.deepEqual(
    app.contextExports.useHabits().shopInteriors[shop.id].dogStaffOutfits[dogId],
    [firstSaved],
    'deleting one preset keeps the other preset',
  );
  assert.equal(app.contextExports.useHabits().coins, coinsBefore, 'saving, applying and deleting presets are free');

  const storedMall = app.storage.get(storageKeys.mall);
  const reopenedApp = createHarness();
  reopenedApp.storage.set(storageKeys.mall, storedMall);
  reopenedApp.renderProvider();
  await reopenedApp.runEffects('provider');
  reopenedApp.renderProvider();
  assert.deepEqual(
    reopenedApp.contextExports.useHabits().shopInteriors[shop.id].dogStaffOutfits[dogId],
    [firstSaved],
    'the dog’s named preset remains available after reopening',
  );
  assert.deepEqual(
    reopenedApp.contextExports.useHabits().shopInteriors[shop.id].dogStaffLooks[dogId],
    firstSaved.look,
    'the active outfit and accessory also remain after reopening',
  );
  assert.equal(reopenedApp.contextExports.useHabits().coins, coinsBefore);
});

test('long-pressing a goal only opens management actions; the plus button only checks in', async () => {
  const app = createHarness();
  app.renderProvider();
  await app.runEffects('provider');
  app.renderProvider();

  const todayTree = app.renderToday();
  const habitRow = findNodes(todayTree, (node) =>
    typeof node.type === 'function'
    && node.type.name === 'HabitRow'
    && node.props?.habit?.id === 'starter-walk',
  )[0];
  assert.ok(habitRow, 'the default goal appears in the today list');

  const rowTree = renderHabitRow(app, habitRow);
  const goalButton = findByTestId(rowTree, 'habit-info-starter-walk');
  assert.equal(typeof goalButton.props.onLongPress, 'function');
  const optionsButton = findByTestId(rowTree, 'manage-habit-starter-walk');
  assert.ok(optionsButton, 'web and assistive users also have a visible options button');

  await optionsButton.props.onPress();
  let actionsTree = app.renderToday();
  assert.equal(findByTestId(actionsTree, 'habit-action-modal').props.visible, true);
  assert.ok(findByTestId(actionsTree, 'edit-habit-starter-walk'));
  assert.ok(findByTestId(actionsTree, 'delete-habit-starter-walk'));
  await press(actionsTree, 'dismiss-habit-actions');
  actionsTree = app.renderToday();
  assert.equal(findByTestId(actionsTree, 'habit-action-modal').props.visible, false);

  const checkInsBeforeLongPress = [...app.contextExports.useHabits().habits.find((habit) => habit.id === 'starter-walk').checkIns];
  const coinsBeforeLongPress = app.contextExports.useHabits().coins;
  goalButton.props.onLongPress();

  actionsTree = app.renderToday();
  assert.equal(findByTestId(actionsTree, 'habit-action-modal').props.visible, true);
  assert.ok(findByTestId(actionsTree, 'edit-habit-starter-walk'));
  assert.ok(findByTestId(actionsTree, 'delete-habit-starter-walk'));
  assert.deepEqual(app.navigation, [], 'opening management does not navigate to the editor');
  assert.deepEqual(
    app.contextExports.useHabits().habits.find((habit) => habit.id === 'starter-walk').checkIns,
    checkInsBeforeLongPress,
    'opening management does not create a check-in',
  );
  assert.equal(app.contextExports.useHabits().coins, coinsBeforeLongPress, 'opening management does not award coins');

  goalButton.props.onPress();
  assert.deepEqual(app.navigation, [], 'the release after a long press must not trigger the normal edit tap');
  await press(actionsTree, 'dismiss-habit-actions');

  await press(rowTree, 'checkin-starter-walk');
  app.renderProvider();
  assert.deepEqual(app.navigation, [], 'checking in does not open the editor');
  assert.ok(app.contextExports.useHabits().habits.find((habit) => habit.id === 'starter-walk').checkIns.includes(app.contextExports.getLocalDate()));
  assert.equal(app.contextExports.useHabits().coins, 20, 'the plus button earns only the expected check-in reward');

  goalButton.props.onPressIn();
  goalButton.props.onPress();
  assert.deepEqual(app.navigation, [
    ['push', { pathname: '/habit-editor', params: { id: 'starter-walk' } }],
  ], 'a new ordinary tap still opens the editor');
});

test('today shows only an unclaimed first-check-in reward and hides it after earning', async () => {
  const app = createHarness();
  app.renderProvider();
  await app.runEffects('provider');
  app.renderProvider();

  const getStarterRow = (tree) => findNodes(tree, (node) =>
    typeof node.type === 'function'
    && node.type.name === 'HabitRow'
    && node.props?.habit?.id === 'starter-walk',
  )[0];
  const initialRow = getStarterRow(app.renderToday());
  assert.equal(initialRow.props.reward, 20);
  let rowTree = renderHabitRow(app, initialRow);
  assert.equal(
    findByTestId(rowTree, 'habit-info-starter-walk').props.accessibilityLabel,
    '編輯散步 20 分鐘，今日首次打卡可獲得 20 金幣',
    'the accessible goal button announces its available first-check-in reward',
  );
  assert.match(textContent(findByTestId(rowTree, 'habit-reward-starter-walk')), /首次打卡 \+20 金幣/);

  assert.equal(await app.contextExports.useHabits().toggleCheckIn('starter-walk'), 20);
  app.renderProvider();
  let rewardedRow = getStarterRow(app.renderToday());
  assert.equal(rewardedRow.props.done, true);
  assert.equal(rewardedRow.props.reward, 0);
  rowTree = renderHabitRow(app, rewardedRow);
  assert.equal(
    findByTestId(rowTree, 'habit-info-starter-walk').props.accessibilityLabel,
    '編輯散步 20 分鐘',
    'a completed goal does not announce a repeatable reward',
  );
  assert.equal(findByTestId(rowTree, 'habit-reward-starter-walk'), undefined);

  assert.equal(await app.contextExports.useHabits().toggleCheckIn('starter-walk'), 0);
  app.renderProvider();
  const uncheckedRow = getStarterRow(app.renderToday());
  assert.equal(uncheckedRow.props.done, false);
  assert.equal(uncheckedRow.props.reward, 0, 'a reward already earned today is not offered again');
  assert.equal(app.contextExports.useHabits().coins, 20);
  rowTree = renderHabitRow(app, uncheckedRow);
  assert.equal(
    findByTestId(rowTree, 'habit-info-starter-walk').props.accessibilityLabel,
    '編輯散步 20 分鐘',
    'an already-claimed reward is not announced after unchecking the goal',
  );
  assert.equal(findByTestId(rowTree, 'habit-reward-starter-walk'), undefined);
});

test('deleting a goal confirms lost check-in history and preserves earned coins after reload', async () => {
  const app = createHarness();
  app.storage.set(storageKeys.mall, JSON.stringify({
    schemaVersion: 3,
    coins: 60,
    purchasedItems: [],
    rewardedCheckIns: [],
    rewardTokens: { facility: 0, shop: 0, decor: 0 },
    placements: {},
  }));
  app.renderProvider();
  await app.runEffects('provider');
  app.renderProvider();

  let todayTree = app.renderToday();
  const habitRow = findNodes(todayTree, (node) =>
    typeof node.type === 'function'
    && node.type.name === 'HabitRow'
    && node.props?.habit?.id === 'starter-walk',
  )[0];
  const rowTree = renderHabitRow(app, habitRow);
  findByTestId(rowTree, 'habit-info-starter-walk').props.onLongPress();

  todayTree = app.renderToday();
  await press(todayTree, 'delete-habit-starter-walk');
  todayTree = app.renderToday();
  assert.match(textContent(todayTree), /過去的打卡紀錄也會一併刪除/);
  assert.match(textContent(todayTree), /已領取的金幣不會扣回/);

  await press(todayTree, 'confirm-delete-habit');
  app.renderProvider();
  assert.equal(app.contextExports.useHabits().habits.some((habit) => habit.id === 'starter-walk'), false);
  assert.equal(app.contextExports.useHabits().coins, 60);
  assert.equal(JSON.parse(app.storage.get(storageKeys.mall)).coins, 60);

  app.renderProvider('provider-reopened');
  await app.runEffects('provider-reopened');
  app.renderProvider('provider-reopened');
  assert.equal(app.contextExports.useHabits().habits.length, 2);
  assert.equal(app.contextExports.useHabits().coins, 60);
});

function renderHabitRow(app, habitRow) {
  return app.render('today-habit-row', () => habitRow.type(habitRow.props));
}
