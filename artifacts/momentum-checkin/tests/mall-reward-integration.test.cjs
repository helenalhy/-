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
  const alerts = [];
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
      if (!(index in frame.states)) frame.states[index] = initial;
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
    ActivityIndicator: 'ActivityIndicator',
    Alert: { alert: (...args) => alerts.push(args) },
    AccessibilityInfo: {
      announceForAccessibility() {},
      announceForAccessibilityWithOptions() {},
      setAccessibilityFocus() {},
    },
    Animated: {
      Value: class { setValue() {} },
      View: 'Animated.View',
      parallel: () => ({ start() {}, stop() {} }),
      spring: () => ({ start() {}, stop() {} }),
      timing: () => ({ start() {}, stop() {} }),
      multiply: () => 1,
    },
    findNodeHandle: () => 1,
    ImageBackground: 'ImageBackground',
    Keyboard: { dismiss() {} },
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
      push: (route) => navigation.push(['push', route]),
      navigate: (route) => navigation.push(['navigate', route]),
    },
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

  function renderToday(key = 'today') {
    return render(key, () => todayModule.TodayScreen());
  }

  async function runEffects(key) {
    for (const effect of effects.get(key) ?? []) effect();
    await new Promise((resolve) => setImmediate(resolve));
    await new Promise((resolve) => setImmediate(resolve));
  }

  const contextExports = loadTsModule(path.join(appRoot, 'context/HabitsContext.tsx'));
  const mallScreen = loadTsModule(path.join(appRoot, 'app/(tabs)/mall.tsx'));
  const todayModule = loadTsModule(path.join(appRoot, 'app/(tabs)/index.tsx'), {
    './mall': { __esModule: true, default: function MallScreenStub() {} },
  });
  const mallCatalog = loadTsModule(path.join(appRoot, 'constants/mall.ts'));

  return {
    alerts,
    contextExports,
    mallCatalog,
    navigation,
    render,
    renderMall,
    renderProvider,
    renderToday,
    runEffects,
    storage,
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

function findCatalogPager(tree) {
  return findNodes(tree, (node) => node.props?.id === 'catalog-top')[0];
}

function textContent(node) {
  if (node == null || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(textContent).join('');
  return textContent(node.props?.children);
}

async function press(tree, testID) {
  const button = findByTestId(tree, testID);
  assert.ok(button, `Expected ${testID} to be rendered`);
  assert.ok(!button.props.disabled, `Expected ${testID} to be enabled`);
  await button.props.onPress();
}

test('goal reward updates an active affordable catalog and survives provider reload', async () => {
  const app = createHarness();
  const exactPriceItem = app.mallCatalog.MALL_ITEMS.find((item) => item.floor === 1 && item.price === 20);
  const ownedItem = app.mallCatalog.MALL_ITEMS.find((item) => item.floor === 1 && item.id === 'welcome-flowers');
  assert.ok(exactPriceItem, 'the current floor includes an item priced exactly at the check-in reward');
  assert.ok(ownedItem, 'the current floor includes a pre-owned item to exclude');

  app.storage.set(storageKeys.mall, JSON.stringify({
    schemaVersion: 2,
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
  assert.equal(findCatalogPager(mallTree).props.total, 150);
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

function renderHabitRow(app, habitRow) {
  return app.render('today-habit-row', () => habitRow.type(habitRow.props));
}
