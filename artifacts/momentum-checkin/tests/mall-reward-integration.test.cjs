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

  function renderToday(key = 'today') {
    return render(key, () => todayRouteModule.default());
  }

  function renderCurrentRoute() {
    const route = navigationStack.at(-1);
    if (route === '/today') return renderToday();
    if (route === '/') {
      const routeElement = todayModule.default();
      return render('mall', () => routeElement.type(routeElement.props));
    }
    throw new Error(`Unexpected route in test harness: ${route}`);
  }

  function goBack() {
    expoRouter.router.back();
  }

  async function runEffects(key) {
    for (const effect of effects.get(key) ?? []) effect();
    await new Promise((resolve) => setImmediate(resolve));
    await new Promise((resolve) => setImmediate(resolve));
  }

  const contextExports = loadTsModule(path.join(appRoot, 'context/HabitsContext.tsx'));
  const mallScreen = loadTsModule(path.join(appRoot, 'app/(tabs)/mall.tsx'));
  const shopInteriorScreen = loadTsModule(path.join(appRoot, 'app/mall-shop/[itemId].tsx'));
  const todayModule = loadTsModule(path.join(appRoot, 'app/(tabs)/index.tsx'));
  const todayRouteModule = loadTsModule(path.join(appRoot, 'app/(tabs)/today.tsx'));
  const mallCatalog = loadTsModule(path.join(appRoot, 'constants/mall.ts'));

  return {
    alerts,
    contextExports,
    mallCatalog,
    navigation,
    navigationStack,
    goBack,
    render,
    renderCurrentRoute,
    renderMall,
    renderShopInterior,
    renderProvider,
    renderToday,
    runEffects,
    storage,
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
  for (const slot of ['front-window', 'left-wall', 'center', 'right-wall', 'back-wall', 'counter']) {
    assert.ok(findByTestId(interiorTree, `shop-interior-slot-${slot}`), `${slot} can be selected`);
  }
  assert.ok(findByTestId(interiorTree, 'shop-decoration-womenswear-clothing-rack'));

  await press(interiorTree, 'shop-decoration-place-womenswear-clothing-rack');
  app.renderProvider();
  interiorTree = app.renderShopInterior();
  assert.equal(app.contextExports.useHabits().coins, 90);
  assert.deepEqual(app.contextExports.useHabits().shopInteriors[shop.id], {
    ownedDecorations: ['womenswear-clothing-rack'],
    placements: { 'front-window': 'womenswear-clothing-rack' },
  });
  assert.match(
    textContent(findByTestId(interiorTree, 'shop-decoration-womenswear-clothing-rack')),
    /已佈置於櫥窗/,
  );
});

test('long-pressing a goal opens edit and delete actions', async () => {
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
  await press(actionsTree, 'dismiss-habit-actions');
  actionsTree = app.renderToday();
  assert.equal(findByTestId(actionsTree, 'habit-action-modal').props.visible, false);

  goalButton.props.onLongPress();

  actionsTree = app.renderToday();
  assert.equal(findByTestId(actionsTree, 'habit-action-modal').props.visible, true);
  assert.ok(findByTestId(actionsTree, 'edit-habit-starter-walk'));
  assert.ok(findByTestId(actionsTree, 'delete-habit-starter-walk'));

  await press(actionsTree, 'edit-habit-starter-walk');
  assert.deepEqual(app.navigation.at(-1), [
    'push',
    { pathname: '/habit-editor', params: { id: 'starter-walk' } },
  ]);
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
