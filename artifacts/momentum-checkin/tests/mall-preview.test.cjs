// Exercise the actual screen handlers without a device or persistent test data.
// Run: node --test artifacts/momentum-checkin/tests/mall-preview.test.cjs
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

global.requestAnimationFrame ??= (callback) => setImmediate(callback);
global.cancelAnimationFrame ??= (frame) => clearImmediate(frame);

const source = ts.transpileModule(
  fs.readFileSync(path.join(__dirname, '../app/(tabs)/mall.tsx'), 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React, esModuleInterop: true } },
).outputText;
const tsModuleCache = new Map();
function loadTsModule(filename) {
  const resolved = path.resolve(filename.endsWith('.ts') ? filename : `${filename}.ts`);
  if (tsModuleCache.has(resolved)) return tsModuleCache.get(resolved).exports;
  const loadedModule = { exports: {} };
  tsModuleCache.set(resolved, loadedModule);
  const output = ts.transpileModule(fs.readFileSync(resolved, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true },
  }).outputText;
  const mockRequire = (request) => {
    const dependency = path.resolve(path.dirname(resolved), request);
    if (fs.existsSync(`${dependency}.ts`)) return loadTsModule(`${dependency}.ts`);
    if (fs.existsSync(dependency)) return dependency;
    return `asset:${request}`;
  };
  new Function('require', 'module', 'exports', output)(mockRequire, loadedModule, loadedModule.exports);
  return loadedModule.exports;
}
const mallCatalog = loadTsModule(path.join(__dirname, '../constants/mall.ts'));
const shopInteriorCatalog = loadTsModule(path.join(__dirname, '../constants/mall-shop-interior.ts'));
const layoutModule = { exports: {} };
new Function('exports', ts.transpileModule(
  fs.readFileSync(path.join(__dirname, '../constants/mall-layout.ts'), 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.CommonJS } },
).outputText)(layoutModule.exports);
const wingPagerSource = ts.transpileModule(
  fs.readFileSync(path.join(__dirname, '../components/MallWingPager.tsx'), 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React, esModuleInterop: true } },
).outputText;

function mount(overrides = {}, catalog, platformOS = 'ios', slotIds, floorThemes = mallCatalog.MALL_FLOORS, options = {}) {
  const states = [];
  let cursor = 0;
  let first = true;
  let tree;
  const calls = [];
  const mallWingPager = ({ renderWing, ...props }) => ({
    type: 'MallWingPager',
    props: { ...props, renderWing, children: renderWing('main', true) },
  });
  const announcements = [];
  const announcementOptions = [];
  const alerts = [];
  const keyboardDismissals = [];
  const storage = new Map(Object.entries(options.initialStorage ?? {}));
  const storageCalls = [];
  const asyncStorage = {
    async getItem(key) {
      storageCalls.push(['get', key]);
      return storage.get(key) ?? null;
    },
    async setItem(key, value) {
      storageCalls.push(['set', key, value]);
      if (options.failWrites) throw new Error('simulated storage failure');
      storage.set(key, value);
    },
  };
  const item = { id: 'test-planter', visual: 'colorful-planter', floor: 1, name: '彩色花圃', category: 'decor', price: 20, ticketCost: 0 };
  const owned = { ...item, id: 'owned', name: '已擁有花圃' };
  const items = catalog ?? [item, owned];
  const habits = {
    coins: 100, purchasedItems: ['owned'], mallPlacements: { 'floor-1-right': 'owned' },
    isLoading: false,
    purchaseMallItem: async (...args) => { calls.push(['purchase', ...args]); },
    moveMallItem: async (...args) => { calls.push(['move', ...args]); },
    storeMallItem: async (...args) => { calls.push(['store', ...args]); },
    ...overrides,
  };
  const react = {
    createElement: (type, props, ...children) => type === mallWingPager
      ? mallWingPager({ ...props, children })
      : ({ type, props: { ...props, children } }),
    useState(initial) {
      const index = cursor++;
      if (first) states[index] = initial;
      return [states[index], (next) => { states[index] = typeof next === 'function' ? next(states[index]) : next; }];
    },
    useRef(initial) {
      const index = cursor++;
      if (first) states[index] = { current: initial };
      return states[index];
    },
    useCallback: (fn) => fn,
    useEffect: (effect) => { if (options.runEffects) effect(); },
    useMemo: (fn) => fn(),
  };
  const animation = () => ({ start() {}, stop() {} });
  const mockRequire = (name) => {
    if (name === 'react') return react;
    if (name === 'react-native') return {
      Animated: { Value: class { setValue() {} }, View: 'View', timing: animation, spring: animation, parallel: animation, multiply: () => 1 },
      AccessibilityInfo: {
        announceForAccessibility: (message) => announcements.push(message),
        announceForAccessibilityWithOptions: (message, options) => {
          announcements.push(message);
          announcementOptions.push(options);
        },
        setAccessibilityFocus() {},
      },
      findNodeHandle: () => 1,
      Keyboard: { dismiss: () => keyboardDismissals.push(true) },
      Alert: { alert: (...args) => alerts.push(args) }, StyleSheet: { create: (s) => s }, Platform: { OS: platformOS },
      ...Object.fromEntries(['ImageBackground', 'Pressable', 'ScrollView', 'Text', 'TextInput', 'View'].map((key) => [key, key])),
    };
    if (name === '@expo/vector-icons') return { Feather: 'Feather' };
    if (name === '@react-native-async-storage/async-storage') return { __esModule: true, default: asyncStorage };
    if (name === 'expo-router') return { router: { push() {}, navigate() {} } };
    if (name === 'react-native-safe-area-context') return { SafeAreaView: 'SafeAreaView', useSafeAreaInsets: () => ({ top: 0, bottom: 0 }) };
    if (name === '@/constants/colors') return { light: {} };
    if (name === '@/hooks/useColors') return { useColors: () => ({}) };
    if (name === '@/context/HabitsContext') return {
      useHabits: () => habits, MALL_FLOOR_COUNT: 10,
      MALL_SLOT_IDS: slotIds ?? Array.from({ length: 10 }, (_, i) => ['left', 'center', 'right'].map((col) => `floor-${i + 1}-${col}`)).flat(),
    };
    if (name === '@/constants/mall-layout') return layoutModule.exports;
    if (name === '@/components/MallWingPager') return { MallWingPager: mallWingPager };
    if (name === '@/constants/mall') return {
      MALL_ITEMS: items, MALL_ITEM_BY_ID: Object.fromEntries(items.map((entry) => [entry.id, entry])),
      MALL_FLOORS: floorThemes,
    };
    if (name === '@/components/MallVisuals') return { MallObjectVisual: 'MallObjectVisual', MallAmbience: 'MallAmbience' };
    if (name === '@/components/CatalogPager') return { CatalogPager: 'CatalogPager' };
    throw new Error(`Unexpected dependency: ${name}`);
  };
  const module = { exports: {} };
  new Function('require', 'module', 'exports', source)(mockRequire, module, module.exports);
  function render() {
    cursor = 0;
    tree = module.exports.default();
    first = false;
  }
  function nodes(node) {
    if (!node || typeof node !== 'object') return [];
    if (Array.isArray(node)) return node.flatMap((child) => nodes(child));
    return [node, ...(node.props?.children ? nodes(node.props.children) : []),
      ...(node.props?.renderWing ? nodes(node.props.renderWing('main', true)) : [])];
  }
  function find(id) {
    return nodes(tree).find((node) => node.props.testID === id || (node.props.slotId && `mall-slot-${node.props.slotId}` === id));
  }
  render();
  return {
    habits, calls, announcements, announcementOptions, alerts, storage, storageCalls, keyboardDismissals, render, find, nodes: (node = tree) => nodes(node),
    async settle() {
      await new Promise((resolve) => setImmediate(resolve));
      render();
    },
    slot(id) {
      const node = find(`mall-slot-${id}`);
      cursor = states.length;
      first = true;
      const result = node.type(node.props);
      first = false;
      return result;
    },
    async press(id) {
      const node = find(id);
      assert.ok(node, `Missing ${id}`);
      assert.ok(!node.props.disabled, `${id} disabled`);
      await node.props.onPress();
      render();
    },
  };
}

const filterCatalog = Array.from({ length: 60 }, (_, i) => ({
  id: `option-${i}`, floor: 1, name: `款式 ${i}`, description: '測試選物',
  category: ['shop', 'facility', 'decor'][i % 3], price: 60 - i, ticketCost: 0,
}));
filterCatalog.push({ ...filterCatalog[0], id: 'other-floor', name: '外層款式', floor: 2, price: 10 });

test('every shop type has 50 unique interior choices and clothing shops include wardrobes and character editions', () => {
  const optionsByType = shopInteriorCatalog.SHOP_INTERIOR_DECORATIONS;
  for (const [type, options] of Object.entries(optionsByType)) {
    assert.equal(options.length, 50, `${type} should offer exactly 50 choices`);
    assert.equal(new Set(options.map((option) => option.id)).size, 50, `${type} choices should have unique IDs`);
  }

  const womenswear = optionsByType.womenswear;
  assert.ok(womenswear.some((option) => option.name.includes('上衣與外套衣櫃')));
  assert.ok(womenswear.some((option) => option.name.includes('百褶裙與長裙衣櫃')));
  assert.ok(womenswear.some((option) => option.limitedEdition && option.name.includes('上衣')));
  assert.ok(womenswear.some((option) => option.limitedEdition && option.name.includes('長裙')));

  const swimwear = optionsByType.swimwear;
  assert.ok(swimwear.some((option) => option.name.includes('泳衣上衣衣櫃')));
  assert.ok(swimwear.some((option) => option.name.includes('泳裝裙裝衣櫃')));
  assert.ok(swimwear.some((option) => option.limitedEdition && /火影忍者鳴人/.test(option.name)));

  const cosplay = optionsByType.cosplay;
  assert.ok(cosplay.some((option) => option.name.includes('角色上衣與外套衣櫃')));
  assert.ok(cosplay.some((option) => option.name.includes('角色裙裝與連身服衣櫃')));
  const cosplayCharacterEditions = cosplay.filter((option) => option.limitedEdition);
  assert.equal(cosplayCharacterEditions.length, 4);
  assert.ok(cosplayCharacterEditions.every((option) => option.name.includes('火影忍者')));

  const kimonoLimitedEditions = optionsByType.kimono.filter((option) => option.limitedEdition);
  assert.equal(kimonoLimitedEditions.length, 4);
  assert.ok(kimonoLimitedEditions.every((option) =>
    option.name.includes('限定版') && /和服|浴衣|振袖/.test(option.name),
  ));

  assert.ok(womenswear.some((option) => option.id === 'womenswear-clothing-rack'), 'existing decoration IDs remain stable');
});

test('shop interiors offer shop-specific equipment while keeping each default catalog at 50 choices', () => {
  for (const shopType of Object.keys(shopInteriorCatalog.SHOP_INTERIOR_DECORATIONS)) {
    const options = shopInteriorCatalog.getShopInteriorDecorations(shopType, `fixture-${shopType}`, '測試商店');
    assert.equal(options.length, 50, `${shopType} catalog should remain at 50 choices`);
    assert.equal(
      options.filter((option) => option.id.startsWith(`${shopType}-equipment-`)).length,
      shopType === 'general' ? 0 : 4,
      `${shopType} should have its own equipment choices`,
    );
  }

  const cafe = shopInteriorCatalog.getShopInteriorDecorations('general', 'sunny-cafe', '暖陽咖啡館');
  assert.equal(cafe.length, 50);
  assert.ok(cafe.some((option) => option.name === '雙頭咖啡機'));
  assert.ok(cafe.some((option) => option.name === '綿滑雪糕機'));
  assert.ok(cafe.some((option) => option.name === '雲朵棉花糖機'));
  assert.ok(cafe.some((option) => option.visual === 'coffee-machine'));

  const candyShop = shopInteriorCatalog.getShopInteriorDecorations('general', 'candy-gift-shop', '糖果禮物店');
  assert.equal(candyShop.length, 50);
  assert.ok(candyShop.some((option) => option.name === '彩糖分格展示櫃'));
  assert.ok(candyShop.some((option) => option.name === '棒棒糖旋轉展示架'));
  assert.ok(candyShop.some((option) => option.name === '夢幻棉花糖機'));

  const seasonalBakery = shopInteriorCatalog.getShopInteriorDecorations('general', 'strawberry-bakery', '草莓烘焙屋');
  assert.ok(seasonalBakery.some((option) => option.name === '奶油色旋風烤爐'));

  const archivedDecorationId = 'kimono-tatami-fitting-sakura';
  const kimonoWithOwnedArchive = shopInteriorCatalog.getShopInteriorDecorations(
    'kimono',
    'kimono-house',
    '和服店',
    [archivedDecorationId],
  );
  assert.ok(
    kimonoWithOwnedArchive.some((option) => option.id === archivedDecorationId),
    'previously owned decorations remain available even when the refreshed catalog makes room for equipment',
  );
});

function pager(app) {
  return app.nodes().find((node) => node.type === 'CatalogPager');
}
function selectionIds(app) {
  return app.nodes().map((node) => node.props.testID).filter((id) => /^(build|search-select)-/.test(id ?? ''));
}

test('affordable filter includes exact balance, excludes owned items, updates counts and follows balance changes', async () => {
  const app = mount({ coins: 10, purchasedItems: ['option-59'], mallPlacements: {} }, filterCatalog);
  assert.equal(pager(app).props.total, 60);
  await app.press('mall-affordable-toggle');
  assert.equal(pager(app).props.total, 9);
  assert.ok(app.find('build-option-50'));
  assert.equal(app.find('build-option-49'), undefined);
  assert.equal(app.find('build-option-59'), undefined);
  assert.match(textContent(app.find('mall-filter-results')), /10 金幣.*9 款.*不含已擁有/);
  assert.match(textContent(app.find('mall-category-decor')), /裝潢 3/);
  app.habits.coins = 2;
  app.render();
  assert.equal(pager(app).props.total, 1);
  assert.ok(app.find('build-option-58'));
  app.habits.purchasedItems.push('option-58');
  app.render();
  assert.equal(pager(app).props.total, 0);
  assert.match(textContent(app.find('mall-affordable-empty')), /完成目標賺取更多金幣/);
  assert.equal(app.calls.length, 0);
});

test('price sorting works across pages without mutating the complete catalog and resets pagination', async () => {
  const originalIds = filterCatalog.map((item) => item.id);
  const app = mount({ coins: 100, purchasedItems: [], mallPlacements: {} }, filterCatalog);
  pager(app).props.onChange(3);
  app.render();
  assert.equal(pager(app).props.page, 3);
  await app.press('mall-price-sort');
  assert.equal(pager(app).props.page, 1);
  assert.deepEqual(selectionIds(app), Array.from({ length: 10 }, (_, i) => `build-option-${59 - i}`));
  pager(app).props.onChange(2);
  app.render();
  assert.deepEqual(selectionIds(app), Array.from({ length: 10 }, (_, i) => `build-option-${49 - i}`));
  await app.press('mall-affordable-toggle');
  assert.equal(pager(app).props.page, 1);
  await app.press('mall-category-shop');
  assert.equal(pager(app).props.total, 20);
  assert.deepEqual(selectionIds(app).slice(0, 3), ['build-option-57', 'build-option-54', 'build-option-51']);
  await app.press('mall-price-sort');
  assert.equal(selectionIds(app)[0], 'build-option-0');
  assert.deepEqual(filterCatalog.map((item) => item.id), originalIds);
});

test('search combines affordability and category; complete-list entry clears every condition', async () => {
  const app = mount({ coins: 10, purchasedItems: [], mallPlacements: {} }, filterCatalog);
  await app.press('mall-affordable-toggle');
  await app.press('mall-price-sort');
  await app.press('mall-category-shop');
  app.find('mall-search-input').props.onChangeText('外層');
  app.render();
  assert.equal(pager(app).props.total, 1);
  assert.ok(app.find('search-select-other-floor'));
  app.find('mall-search-input').props.onChangeText('沒有這款');
  app.render();
  assert.equal(pager(app).props.total, 0);
  assert.ok(app.find('mall-affordable-empty'));
  assert.equal(app.find('mall-search-empty'), undefined);
  await app.press('mall-full-catalog');
  assert.equal(app.find('mall-search-input').props.value, '');
  assert.equal(app.find('mall-affordable-toggle').props.accessibilityState.selected, false);
  assert.equal(app.find('mall-price-sort').props.accessibilityState.selected, false);
  assert.equal(pager(app).props.total, 60);
  assert.equal(pager(app).props.page, 1);
  for (const category of ['shop', 'facility', 'decor']) {
    await app.press(`mall-category-${category}`);
    assert.equal(pager(app).props.total, 20);
  }
  await app.press('floor-next');
  assert.equal(pager(app).props.page, 1);
  await app.press('mall-full-catalog');
  assert.ok(app.find('build-other-floor'));
  assert.equal(app.calls.length, 0);
});

test('recent searches load, apply, deduplicate, remove and clear without changing mall items or rewards', async () => {
  const storageKey = '@momentum/mall/recent-searches';
  const app = mount(
    { coins: 73, purchasedItems: ['owned'], mallPlacements: { 'floor-1-right': 'owned' } },
    undefined,
    'ios',
    undefined,
    mallCatalog.MALL_FLOORS,
    {
      runEffects: true,
      initialStorage: { [storageKey]: JSON.stringify(['花圃', '彩色', '花圃', '  ']) },
    },
  );
  await app.settle();

  assert.ok(app.find('mall-recent-searches'));
  assert.equal(textContent(app.find('mall-recent-search-0')), '花圃');
  assert.equal(textContent(app.find('mall-recent-search-1')), '彩色');
  assert.equal(app.find('mall-recent-search-2'), undefined, 'loaded history is normalized and deduplicated');

  const coinsBefore = app.habits.coins;
  const ownershipBefore = [...app.habits.purchasedItems];
  const placementsBefore = { ...app.habits.mallPlacements };
  await app.press('mall-recent-search-1');
  assert.equal(app.find('mall-search-input').props.value, '彩色');
  assert.ok(pager(app).props.total > 0, 'applying a recent keyword runs the regular search');

  app.find('mall-search-input').props.onChangeText('彩色');
  app.render();
  await app.find('mall-search-input').props.onSubmitEditing();
  await app.press('mall-search-clear');
  app.render();
  assert.equal(textContent(app.find('mall-recent-search-0')), '彩色');
  assert.equal(textContent(app.find('mall-recent-search-1')), '花圃');
  assert.equal(app.find('mall-recent-search-2'), undefined, 'searching an existing term moves it to the top');
  assert.deepEqual(JSON.parse(app.storage.get(storageKey)), ['彩色', '花圃']);

  await app.press('mall-recent-search-remove-1');
  assert.equal(textContent(app.find('mall-recent-search-0')), '彩色');
  assert.equal(app.find('mall-recent-search-1'), undefined);
  assert.deepEqual(JSON.parse(app.storage.get(storageKey)), ['彩色']);

  await app.press('mall-recent-searches-clear-all');
  assert.equal(app.find('mall-recent-searches'), undefined);
  assert.deepEqual(JSON.parse(app.storage.get(storageKey)), []);

  const reopened = mount(
    { coins: 73, purchasedItems: ['owned'], mallPlacements: { 'floor-1-right': 'owned' } },
    undefined,
    'ios',
    undefined,
    mallCatalog.MALL_FLOORS,
    { runEffects: true, initialStorage: Object.fromEntries(app.storage) },
  );
  await reopened.settle();
  assert.equal(reopened.find('mall-recent-searches'), undefined, 'cleared history stays cleared after reopening');

  for (const instance of [app, reopened]) {
    assert.equal(instance.habits.coins, coinsBefore);
    assert.deepEqual(instance.habits.purchasedItems, ownershipBefore);
    assert.deepEqual(instance.habits.mallPlacements, placementsBefore);
    assert.equal(instance.calls.length, 0, 'search history actions never redeem, move, or store items');
  }
  assert.deepEqual(app.storageCalls.filter(([operation]) => operation === 'set').map(([, key]) => key), [
    storageKey, storageKey, storageKey,
  ]);
});

test('a local history write failure does not interrupt search and explains that the query was not saved', async () => {
  const app = mount(
    { coins: 25, purchasedItems: [], mallPlacements: {} },
    undefined,
    'ios',
    undefined,
    mallCatalog.MALL_FLOORS,
    { runEffects: true, failWrites: true },
  );
  await app.settle();
  app.find('mall-search-input').props.onChangeText('花圃');
  app.render();

  await app.find('mall-search-input').props.onSubmitEditing();
  app.render();

  assert.equal(app.find('mall-search-input').props.value, '花圃');
  assert.ok(app.find('mall-recent-search-storage-error'));
  assert.equal(app.keyboardDismissals.length, 1, 'the search keyboard still closes');
  assert.ok(pager(app).props.total > 0, 'search results remain usable');
  assert.equal(app.calls.length, 0);
  assert.equal(app.habits.coins, 25);
});

test('search filters keep original floor separate from the current mall placement and clear without mutations', async () => {
  const base = mallCatalog.MALL_ITEMS.find((item) => item.category === 'shop');
  const floorOneItem = { ...base, id: 'origin-floor-one', floor: 1, name: '花園甲' };
  const floorTwoItem = { ...base, id: 'origin-floor-two', floor: 2, name: '花園乙' };
  const unplacedItem = { ...base, id: 'unplaced-item', floor: 1, name: '花園丙' };
  const items = [floorOneItem, floorTwoItem, unplacedItem];
  const placements = {
    'floor-2-extension3-1-left': floorOneItem.id,
    'floor-1-annex-1-left': floorTwoItem.id,
  };
  const app = mount(
    { coins: 120, purchasedItems: ['origin-floor-one', 'origin-floor-two'], mallPlacements: placements },
    items,
    'ios',
    layoutModule.exports.MALL_SLOT_IDS,
  );
  const coinsBefore = app.habits.coins;
  const ownedBefore = [...app.habits.purchasedItems];
  const placementsBefore = { ...app.habits.mallPlacements };

  app.find('mall-search-input').props.onChangeText('花園');
  app.render();
  assert.equal(pager(app).props.total, 3);

  await app.press('mall-search-floor-1');
  assert.equal(pager(app).props.total, 2);
  assert.ok(app.find('search-select-origin-floor-one'));
  assert.ok(app.find('search-select-unplaced-item'));
  assert.equal(app.find('search-select-origin-floor-two'), undefined);

  await app.press('mall-search-floor-all');
  await app.press('mall-search-wing-annex');
  assert.equal(pager(app).props.total, 1);
  assert.ok(app.find('search-select-origin-floor-two'), 'annex is determined from its current slot, not its original floor');
  assert.equal(app.find('search-select-origin-floor-one'), undefined);

  await app.press('mall-search-wing-extension3');
  assert.equal(pager(app).props.total, 1);
  assert.ok(app.find('search-select-origin-floor-one'), 'extension filter follows the placement on floor 2');
  await app.press('mall-search-floor-1');
  assert.equal(pager(app).props.total, 1, 'original floor and actual wing can be combined independently');

  await app.press('mall-search-floor-all');
  await app.press('mall-search-wing-unplaced');
  assert.equal(pager(app).props.total, 1);
  assert.ok(app.find('search-select-unplaced-item'));

  await app.press('mall-search-clear-filters');
  assert.equal(pager(app).props.total, 3, 'clearing both filters restores every name or description match');
  assert.equal(app.find('mall-search-wing-all').props.accessibilityState.selected, true);
  assert.equal(app.find('mall-search-floor-all').props.accessibilityState.selected, true);
  assert.equal(app.find('mall-search-clear-filters'), undefined);

  await app.press('mall-search-wing-extension3');
  await app.press('mall-search-floor-2');
  assert.equal(pager(app).props.total, 0, 'filters combine rather than conflating placement floor with original floor');
  await app.press('mall-search-clear');
  assert.equal(pager(app).props.total, 2, 'clearing the search restores the current-floor catalog');
  assert.equal(app.find('mall-search-floor-1'), undefined, 'search filters are hidden after leaving search');
  assert.deepEqual(app.habits.mallPlacements, placementsBefore);
  assert.deepEqual(app.habits.purchasedItems, ownedBefore);
  assert.equal(app.habits.coins, coinsBefore);
  assert.equal(app.calls.length, 0, 'filtering never starts a move, restore, or redemption');
});

test('real catalog is fully searchable and includes ten specialized shop types on their assigned floors', () => {
  const { MALL_FLOORS, MALL_ITEMS } = mallCatalog;
  assert.equal(MALL_ITEMS.length, 1511);
  assert.equal(MALL_FLOORS.length, 10);
  assert.deepEqual(
    MALL_FLOORS.map((floor) => floor.title),
    ['糖果迎賓街', '森林花園', '慢讀書廊', '海洋奇遇', '像素遊樂城', '雲朵療癒館', '彩虹藝術廊', '星際觀測站', '世界美食集', '天空花園'],
  );
  assert.deepEqual(
    Object.fromEntries(['shop', 'facility', 'decor'].map((category) => [
      category, MALL_ITEMS.filter((item) => item.category === category).length,
    ])),
    { shop: 511, facility: 500, decor: 500 },
  );
  assert.equal(new Set(MALL_ITEMS.map((item) => item.name)).size, MALL_ITEMS.length, 'every catalog name is distinct');
  assert.deepEqual(
    MALL_ITEMS.filter((item) => item.shopType && item.shopType !== 'general').map(({ id, floor, shopType }) => [id, floor, shopType]),
    [
      ['ladies-fashion-boutique', 1, 'womenswear'],
      ['japanese-hyakuen-store', 2, 'hyakuen'],
      ['kimono-house', 3, 'kimono'],
      ['evening-gown-salon', 7, 'eveningwear'],
      ['sunny-supermarket', 9, 'supermarket'],
      ['bridal-gown-house', 10, 'bridal'],
      ['blue-tide-swimwear', 4, 'swimwear'],
      ['cosplay-costume-studio', 5, 'cosplay'],
      ['little-circuit-electronics', 6, 'electronics'],
      ['starlight-luxury-boutique', 8, 'boutique'],
    ],
  );

  const app = mount({ purchasedItems: [], mallPlacements: {} }, MALL_ITEMS);
  for (const item of MALL_ITEMS) {
    app.find('mall-search-input').props.onChangeText(item.name);
    app.render();

    const query = item.name.toLocaleLowerCase();
    const matchingItems = MALL_ITEMS.filter((candidate) =>
      `${candidate.name} ${candidate.description}`.toLocaleLowerCase().includes(query),
    );
    assert.equal(pager(app).props.total, matchingItems.length, `${item.id} (${item.name}) search count`);
    const result = app.find(`search-select-${item.id}`);
    assert.ok(result, `${item.id} appears in the search results`);
    assert.match(result.props.accessibilityLabel, new RegExp(`前往 ${item.floor}F`));
    assert.ok(
      app.nodes().some((node) => textContent(node) === `${item.floor}F · ${MALL_FLOORS[item.floor - 1].title} · ${item.price} 金幣`),
      `${item.id} shows its original floor and floor name`,
    );
  }
});

test('search whitespace, empty results, category counts, pagination and clear restore the current floor list', async () => {
  const app = mount({ purchasedItems: [], mallPlacements: {} }, mallCatalog.MALL_ITEMS);
  const floorOneItems = mallCatalog.MALL_ITEMS.filter((item) => item.floor === 1);
  assert.equal(floorOneItems.length, 151);

  app.find('mall-search-input').props.onChangeText('   ');
  app.render();
  assert.equal(pager(app).props.total, 151, 'whitespace is treated as an empty search');
  assert.equal(app.find('mall-search-empty'), undefined);
  for (const [category, expected] of [['shop', 51], ['facility', 50], ['decor', 50]]) {
    assert.match(textContent(app.find(`mall-category-${category}`)), new RegExp(`${expected}$`));
  }

  app.find('mall-search-input').props.onChangeText('不存在的商場款式');
  app.render();
  assert.equal(pager(app).props.total, 0);
  assert.ok(app.find('mall-search-empty'));

  const pageQuery = '店';
  const expectedResults = mallCatalog.MALL_ITEMS.filter((item) => `${item.name} ${item.description}`.includes(pageQuery));
  app.find('mall-search-input').props.onChangeText(pageQuery);
  app.render();
  assert.equal(pager(app).props.total, expectedResults.length);
  for (const category of ['shop', 'facility', 'decor']) {
    const categoryCount = expectedResults.filter((item) => item.category === category).length;
    assert.match(textContent(app.find(`mall-category-${category}`)), new RegExp(`${categoryCount}$`));
  }

  const renderedIds = [];
  for (let page = 1; page <= pager(app).props.pages; page += 1) {
    pager(app).props.onChange(page);
    app.render();
    renderedIds.push(...selectionIds(app));
  }
  assert.deepEqual(
    renderedIds,
    expectedResults.map((item) => `search-select-${item.id}`),
    'every matching catalog result appears once across the pages',
  );

  app.find('mall-search-input').props.onChangeText('');
  app.render();
  assert.equal(pager(app).props.total, 151);
  assert.equal(pager(app).props.page, 1);
  assert.ok(app.find(`build-${floorOneItems[0].id}`), 'clearing search returns to the original floor list');
});

test('description keywords return catalog items with correct category counts, pagination and clear behavior', () => {
  const descriptionCatalog = Array.from({ length: 21 }, (_, i) => ({
    id: `description-match-${i}`,
    floor: i === 0 ? 2 : 1,
    name: `獨特選物 ${i}`,
    description: '雨天也能安心休息的好去處',
    category: ['shop', 'facility', 'decor'][i % 3],
    price: 20 + i,
    ticketCost: 0,
  }));
  descriptionCatalog.push({
    id: 'name-only-match',
    floor: 1,
    name: '雨天小舖',
    description: '明亮的日常選物',
    category: 'shop',
    price: 30,
    ticketCost: 0,
  });
  const app = mount({ purchasedItems: ['description-match-0'], mallPlacements: {} }, descriptionCatalog);

  app.find('mall-search-input').props.onChangeText('雨天');
  app.render();
  assert.equal(pager(app).props.total, 22);
  assert.equal(pager(app).props.page, 1);
  assert.match(textContent(app.find('mall-category-shop')), /店鋪 8$/);
  assert.match(textContent(app.find('mall-category-facility')), /設施 7$/);
  assert.match(textContent(app.find('mall-category-decor')), /裝潢 7$/);
  assert.ok(app.find('search-select-description-match-0'), 'description-only keyword match is included');
  assert.match(
    app.find('search-select-description-match-0').props.accessibilityLabel,
    /前往 2F.*已兌換，可免費重擺/,
    'description-only result keeps its original floor and redeemed state',
  );
  assert.ok(app.nodes().some((node) =>
    textContent(node) === `2F · ${mallCatalog.MALL_FLOORS[1].title} · 20 金幣`,
  ), 'description-only result shows the original floor theme and price');
  assert.ok(app.nodes().some((node) =>
    textContent(node) === '已兌換 · 倉庫保存中 · 免費擺放',
  ), 'description-only result keeps its warehouse status');

  const renderedIds = [];
  for (let page = 1; page <= pager(app).props.pages; page += 1) {
    pager(app).props.onChange(page);
    app.render();
    renderedIds.push(...selectionIds(app));
  }
  assert.ok(renderedIds.includes('search-select-name-only-match'), 'name-only keyword match remains included');
  assert.deepEqual(renderedIds, [
    ...descriptionCatalog.map((item) => `search-select-${item.id}`),
  ], 'all description and name matches appear once across pages');

  app.find('mall-search-input').props.onChangeText('');
  app.render();
  assert.equal(pager(app).props.total, 21, 'clearing search restores the current-floor catalog');
  assert.equal(pager(app).props.page, 1);
  assert.ok(app.find('build-description-match-1'));
});

test('search selection and cancellation preserve coins, ownership and placements', async () => {
  const target = mallCatalog.MALL_ITEMS.find((item) => item.floor === 10 && item.category === 'shop');
  const startingCoins = 400;
  const app = mount(
    { coins: startingCoins, purchasedItems: [], mallPlacements: {} },
    mallCatalog.MALL_ITEMS,
    'ios',
    layoutModule.exports.MALL_SLOT_IDS,
  );
  const ownedBefore = [...app.habits.purchasedItems];
  const placementsBefore = { ...app.habits.mallPlacements };
  app.find('mall-search-input').props.onChangeText(target.name);
  app.render();
  assert.ok(app.find(`search-select-${target.id}`));
  assert.equal(app.habits.coins, startingCoins);
  assert.deepEqual(app.habits.purchasedItems, ownedBefore);
  assert.deepEqual(app.habits.mallPlacements, placementsBefore);
  assert.equal(app.calls.length, 0);

  await app.press(`search-select-${target.id}`);
  assert.match(textContent(app.find('floor-current')), /^10F/);
  assert.match(app.announcements.at(-1), /尚未兌換或扣除金幣|試擺，確認兌換才扣金幣/);
  assert.equal(app.habits.coins, startingCoins);
  assert.deepEqual(app.habits.purchasedItems, ownedBefore);
  assert.deepEqual(app.habits.mallPlacements, placementsBefore);
  assert.equal(app.calls.length, 0);

  const cancelButton = app.nodes().find((node) => node.props.accessibilityLabel === '取消擺放');
  assert.ok(cancelButton, 'selected search result can be cancelled');
  await cancelButton.props.onPress();
  app.render();
  assert.match(textContent(app.find('mall-placement-status')), /已取消試擺.*尚未兌換或扣除金幣/);
  assert.equal(app.nodes().some((node) => node.props.accessibilityLabel === '取消擺放'), false, 'placement intent is cleared');
  assert.equal(app.habits.coins, startingCoins);
  assert.deepEqual(app.habits.purchasedItems, ownedBefore);
  assert.deepEqual(app.habits.mallPlacements, placementsBefore);
  assert.equal(app.calls.length, 0);
});

test('search shows redeemed state and selecting an owned result remains free', async () => {
  const ownedItem = mallCatalog.MALL_ITEMS.find((item) => item.floor === 8 && item.category === 'facility');
  const storedItem = mallCatalog.MALL_ITEMS.find((item) => item.floor === 6 && item.category === 'decor');
  const placedSlot = 'floor-8-left';
  const app = mount(
    { coins: 0, purchasedItems: [ownedItem.id, storedItem.id], mallPlacements: { [placedSlot]: ownedItem.id } },
    mallCatalog.MALL_ITEMS,
    'ios',
    layoutModule.exports.MALL_SLOT_IDS,
  );
  const ownedBefore = [...app.habits.purchasedItems];
  const placementsBefore = { ...app.habits.mallPlacements };

  app.find('mall-search-input').props.onChangeText(ownedItem.name);
  app.render();
  assert.ok(app.nodes().some((node) => textContent(node) === '已兌換 · 已擺放 · 免費搬動'));
  assert.match(app.find(`search-select-${ownedItem.id}`).props.accessibilityLabel, /已兌換，可免費重擺/);
  await app.press(`search-select-${ownedItem.id}`);
  assert.match(textContent(app.find('floor-current')), /^8F/);
  assert.equal(app.habits.coins, 0);
  assert.deepEqual(app.habits.purchasedItems, ownedBefore);
  assert.deepEqual(app.habits.mallPlacements, placementsBefore);
  assert.equal(app.calls.length, 0);

  const cancelButton = app.nodes().find((node) => node.props.accessibilityLabel === '取消擺放');
  assert.ok(cancelButton);
  await cancelButton.props.onPress();
  app.render();

  app.find('mall-search-input').props.onChangeText(storedItem.name);
  app.render();
  assert.ok(app.nodes().some((node) => textContent(node) === '已兌換 · 倉庫保存中 · 免費擺放'));
  assert.equal(app.habits.coins, 0);
  assert.deepEqual(app.habits.purchasedItems, ownedBefore);
  assert.deepEqual(app.habits.mallPlacements, placementsBefore);
  assert.equal(app.calls.length, 0);
});

test('search location jumps to the saved floor and annex, highlights it, and leaves placement and coins unchanged', async () => {
  const savedSlot = 'floor-9-extension4-1-left';
  const slots = [...Array.from({ length: 10 }, (_, i) => ['left', 'center', 'right'].map((col) => `floor-${i + 1}-${col}`)).flat(), savedSlot];
  const app = mount({
    coins: 7,
    purchasedItems: ['owned'],
    mallPlacements: { [savedSlot]: 'owned' },
  }, undefined, 'ios', slots);
  app.find('mall-search-input').props.onChangeText('已擁有花圃');
  app.render();

  assert.ok(app.find('search-location-owned'));
  assert.ok(app.find('search-select-owned'), 'the existing select/rearrange action remains available');
  await app.press('search-location-owned');

  const pagerNode = app.nodes().find((node) => node.type === 'MallWingPager');
  assert.equal(pagerNode.props.focusWing, 'extension4');
  assert.equal(pagerNode.props.focusRequestId, 1);
  assert.match(textContent(app.find('floor-current')), /^9F/);
  assert.match(app.announcements.at(-1), /9F・延伸區四.*沒有進入搬動模式.*未更改擺放或扣除金幣/);
  const wingScene = pagerNode.props.renderWing('extension4', true);
  const targetSlot = wingScene.props.children.flat(Infinity)
    .find((child) => child.props.slotId === savedSlot);
  assert.ok(targetSlot, `Rendered slots: ${wingScene.props.children.flat(Infinity).map((child) => child.props.slotId).filter(Boolean).join(', ')}`);
  assert.equal(targetSlot.props.isLocationHighlighted, true);
  assert.deepEqual(app.habits.mallPlacements, { [savedSlot]: 'owned' });
  assert.equal(app.habits.coins, 7);
  assert.equal(app.calls.length, 0);
});

test('the existing search select action still enters free rearrangement on the item’s catalog floor', async () => {
  const savedSlot = 'floor-9-extension4-1-left';
  const slots = [...Array.from({ length: 10 }, (_, i) => ['left', 'center', 'right'].map((col) => `floor-${i + 1}-${col}`)).flat(), savedSlot];
  const app = mount({
    coins: 7,
    purchasedItems: ['owned'],
    mallPlacements: { [savedSlot]: 'owned' },
  }, undefined, 'ios', slots);
  app.find('mall-search-input').props.onChangeText('已擁有花圃');
  app.render();

  await app.press('search-select-owned');

  assert.match(textContent(app.find('mall-placement-status')), /已前往 1F.*免費重新擺放/);
  assert.match(app.nodes().map(textContent).join(' '), /搬動或存入倉庫/);
  assert.equal(app.habits.coins, 7);
  assert.deepEqual(app.habits.mallPlacements, { [savedSlot]: 'owned' });
  assert.equal(app.calls.length, 0);
});

test('affordable filtering preserves confirmation-only charging and free warehouse placement at zero coins', async () => {
  const app = mount({ mallPlacements: {} });
  await app.press('mall-affordable-toggle');
  await app.press('mall-price-sort');
  await preview(app);
  assert.equal(app.calls.length, 0);
  await app.press('confirm-purchase-preview');
  assert.deepEqual(app.calls, [['purchase', 'test-planter', 20, 'decor', 0, 'floor-1-left']]);
  app.habits.coins = 0;
  app.render();
  assert.ok(app.find('mall-affordable-empty'));
  await app.press('collection-tab');
  assert.equal(app.find('mall-affordable-toggle'), undefined);
  assert.equal(pager(app).props.total, 1);
  await app.press('restore-owned');
  await app.press('mall-slot-floor-1-center');
  assert.deepEqual(app.calls[1], ['move', 'owned', 'floor-1-center']);
});

async function preview(app) {
  await app.press('build-test-planter');
  await app.press('mall-slot-floor-1-left');
}

test('screen readers distinguish every location including plaza rows and annex', () => {
  const labels = layoutModule.exports.MALL_SLOT_IDS.map((id) => {
    const position = layoutModule.exports.getMallSlotPosition(id);
    return `${position.floor} ${position.label}`;
  });
  assert.equal(new Set(labels).size, labels.length);
  const app = mount();
  for (const [column, label] of [['left', '左側'], ['center', '中央'], ['right', '右側']]) {
    assert.match(app.slot(`floor-1-${column}`).props.accessibilityLabel, new RegExp(`1F 店面區${label}`));
  }
  for (const [slotId, expected] of [
    ['floor-1-plaza-1-left', /1F 中庭第 1 排左側/],
    ['floor-1-plaza-3-right', /1F 中庭第 3 排右側/],
    ['floor-1-annex-2-left', /1F 延伸區中庭第 1 排左側/],
    ['floor-1-extension-4-center', /1F 延伸區二中庭第 4 排中央/],
    ['floor-1-extension3-1-right', /1F 延伸區三中庭第 1 排右側/],
    ['floor-1-extension4-2-center', /1F 延伸區四中庭第 2 排中央/],
  ]) {
    const position = layoutModule.exports.getMallSlotPosition(slotId);
    assert.match(`${position.floor} ${position.label}`, expected);
  }
  assert.match(app.slot('floor-1-right').props.accessibilityLabel, /已兌換/);
});

test('mall wing controls announce their section name, capacity and selected state', () => {
  const state = [360, 'main', ''];
  let cursor = 0;
  const react = {
    createElement: (type, props, ...children) => ({ type, props: { ...props, children } }),
    useRef: (current) => ({ current }),
    useEffect: (effect) => { effect(); },
    useState: (initial) => {
      const index = cursor++;
      return [state[index] ?? initial, (next) => { state[index] = typeof next === 'function' ? next(state[index]) : next; }];
    },
  };
  const module = { exports: {} };
  new Function('require', 'module', 'exports', wingPagerSource)(
    (name) => {
      if (name === 'react') return react;
      if (name === 'react-native') return {
        Platform: { OS: 'web' },
        Pressable: 'Pressable', ScrollView: 'ScrollView', StyleSheet: { create: (styles) => styles },
        Text: 'Text', View: 'View',
      };
      if (name === '@/hooks/useColors') return { useColors: () => ({}) };
      throw new Error(`Unexpected dependency: ${name}`);
    },
    module,
    module.exports,
  );
  let wingChanges = 0;
  let focusWing = null;
  let focusRequestId = null;
  const focusedWings = [];
  function wingNodes(node) {
    return !node || typeof node !== 'object' ? [] : Array.isArray(node) ? node.flatMap(wingNodes) : [
      node,
      ...wingNodes(node.props?.children),
    ];
  }
  const renderPager = () => {
    cursor = 0;
    const tree = module.exports.MallWingPager({
      counts: { main: 0, annex: 0, extension: 0, extension3: 0, extension4: 0 },
      onWingChange() { wingChanges += 1; },
      focusWing,
      focusRequestId,
      renderWing: (wing) => ({ type: 'WingContent', props: { testID: `wing-content-${wing}` } }),
    });
    for (const node of wingNodes(tree)) {
      if (node.props.testID?.startsWith('mall-wing-') && node.props.testID !== 'mall-wing-tabs' && node.props.testID !== 'mall-wing-pager') {
        const wing = node.props.testID.slice('mall-wing-'.length);
        node.props.ref?.({ focus() { focusedWings.push(wing); } });
      }
    }
    return tree;
  };
  let pager = renderPager();
  const findWing = (id) => wingNodes(pager).find((node) => node.props.testID === id);
  assert.equal(findWing('mall-wing-tabs').props.accessibilityRole, 'tablist');
  const extension = findWing('mall-wing-extension');
  assert.equal(extension.props.accessibilityLabel, '延伸區二分區，0 個位置已使用，共 12 個位置');
  assert.equal(findWing('mall-wing-main').props.accessibilityRole, 'tab');
  assert.equal(findWing('mall-wing-main').props.accessibilityState.selected, true);
  assert.equal(findWing('mall-wing-main').props.tabIndex, 0);
  assert.equal(extension.props.accessibilityState.selected, false);
  assert.equal(extension.props.tabIndex, -1);
  assert.equal(findWing('mall-wing-announcement').props.role, 'status');
  assert.equal(findWing('mall-wing-announcement').props['aria-live'], 'polite');
  assert.deepEqual(findWing('mall-wing-announcement').props.children, ['']);

  const assertOnlyWingIsAccessible = (activeWing) => {
    for (const wing of ['main', 'annex', 'extension', 'extension3', 'extension4']) {
      const content = findWing(`mall-wing-content-${wing}`);
      const active = wing === activeWing;
      assert.equal(content.props.accessibilityElementsHidden, !active, `${wing} native iOS visibility`);
      assert.equal(content.props.importantForAccessibility, active ? 'auto' : 'no-hide-descendants', `${wing} Android visibility`);
      assert.equal(content.props['aria-hidden'], !active, `${wing} web visibility`);
      assert.ok(findWing(`wing-content-${wing}`), `${wing} remains mounted and visually available`);
    }
  };
  assertOnlyWingIsAccessible('main');

  findWing('mall-wing-annex').props.onPress();
  pager = renderPager();
  assert.deepEqual(findWing('mall-wing-announcement').props.children, ['目前所在區域：延伸區']);
  assertOnlyWingIsAccessible('annex');
  assert.equal(findWing('mall-wing-annex').props.accessibilityState.selected, true);
  assert.equal(findWing('mall-wing-annex').props.tabIndex, 0);
  assert.equal(findWing('mall-wing-main').props.tabIndex, -1);
  assert.equal(wingChanges, 1);
  findWing('mall-wing-annex').props.onPress();
  pager = renderPager();
  assert.deepEqual(findWing('mall-wing-announcement').props.children, ['目前所在區域：延伸區']);
  assert.equal(wingChanges, 1, 'reselecting the current wing does not announce again');

  let prevented = false;
  findWing('mall-wing-annex').props.onKeyDown({ key: 'ArrowRight', preventDefault() { prevented = true; } });
  pager = renderPager();
  assert.deepEqual(findWing('mall-wing-announcement').props.children, ['目前所在區域：延伸區二']);
  assert.equal(prevented, true);
  assert.equal(findWing('mall-wing-extension').props.accessibilityState.selected, true);
  assert.deepEqual(focusedWings.at(-1), 'extension');

  findWing('mall-wing-extension').props.onKeyDown({ key: 'ArrowRight', preventDefault() {} });
  pager = renderPager();
  assert.equal(findWing('mall-wing-extension3').props.accessibilityState.selected, true);
  findWing('mall-wing-extension3').props.onKeyDown({ key: 'ArrowLeft', preventDefault() {} });
  pager = renderPager();
  assert.equal(findWing('mall-wing-extension').props.accessibilityState.selected, true);

  findWing('mall-wing-extension').props.onKeyDown({ key: 'Home', preventDefault() {} });
  pager = renderPager();
  assert.equal(findWing('mall-wing-main').props.accessibilityState.selected, true);
  findWing('mall-wing-main').props.onKeyDown({ key: 'End', preventDefault() {} });
  pager = renderPager();
  assert.equal(findWing('mall-wing-extension4').props.accessibilityState.selected, true);
  findWing('mall-wing-extension4').props.onKeyDown({ key: 'ArrowRight', preventDefault() {} });
  pager = renderPager();
  assert.equal(findWing('mall-wing-main').props.accessibilityState.selected, true, 'right arrow wraps to the first wing');
  findWing('mall-wing-main').props.onKeyDown({ key: 'ArrowLeft', preventDefault() {} });
  pager = renderPager();
  assert.equal(findWing('mall-wing-extension4').props.accessibilityState.selected, true, 'left arrow wraps to the last wing');

  findWing('mall-wing-pager').props.onMomentumScrollEnd({ nativeEvent: { contentOffset: { x: 2 * 360 } } });
  pager = renderPager();
  assert.deepEqual(findWing('mall-wing-announcement').props.children, ['目前所在區域：延伸區二']);
  assertOnlyWingIsAccessible('extension');
  assert.equal(findWing('mall-wing-extension').props.accessibilityState.selected, true);
  assert.equal(wingChanges, 9);
  assert.deepEqual(findWing('mall-wing-content-extension').props.style, { width: 360, height: 360 });

  focusWing = 'extension4';
  focusRequestId = 1;
  pager = renderPager();
  pager = renderPager();
  assertOnlyWingIsAccessible('extension4');
  assert.equal(findWing('mall-wing-extension4').props.accessibilityState.selected, true);
  assert.deepEqual(findWing('mall-wing-announcement').props.children, ['目前所在區域：延伸區二']);
  assert.equal(wingChanges, 9, 'programmatic location navigation does not trigger a placement change');
});

test('native mall wing changes use one platform-appropriate polite announcement', () => {
  for (const platformOS of ['ios', 'android']) {
    const state = [360, 'main', ''];
    let cursor = 0;
    const announcements = [];
    const react = {
      createElement: (type, props, ...children) => ({ type, props: { ...props, children } }),
      useRef: (current) => ({ current }),
      useEffect: () => {},
      useState: (initial) => {
        const index = cursor++;
        return [state[index] ?? initial, (next) => { state[index] = next; }];
      },
    };
    const module = { exports: {} };
    new Function('require', 'module', 'exports', wingPagerSource)(
      (name) => {
        if (name === 'react') return react;
        if (name === 'react-native') return {
          AccessibilityInfo: { announceForAccessibility: (message) => announcements.push(message) },
          Platform: { OS: platformOS },
          Pressable: 'Pressable', ScrollView: 'ScrollView', StyleSheet: { create: (styles) => styles },
          Text: 'Text', View: 'View',
        };
        if (name === '@/hooks/useColors') return { useColors: () => ({}) };
        throw new Error(`Unexpected dependency: ${name}`);
      },
      module,
      module.exports,
    );
    const renderPager = () => {
      cursor = 0;
      return module.exports.MallWingPager({
        counts: { main: 0, annex: 0, extension: 0, extension3: 0, extension4: 0 },
        onWingChange() {},
        renderWing: () => null,
      });
    };
    const nodes = (node) => !node || typeof node !== 'object' ? [] : Array.isArray(node)
      ? node.flatMap(nodes)
      : [node, ...nodes(node.props?.children)];
    let pager = renderPager();
    const find = (testID) => nodes(pager).find((node) => node.props.testID === testID);
    find('mall-wing-annex').props.onPress();
    pager = renderPager();
    find('mall-wing-pager').props.onMomentumScrollEnd({ nativeEvent: { contentOffset: { x: 2 * 360 } } });
    pager = renderPager();

    if (platformOS === 'ios') {
      assert.deepEqual(announcements, ['目前所在區域：延伸區', '目前所在區域：延伸區二']);
      assert.equal(find('mall-wing-announcement'), undefined, 'iOS does not also render a live region');
    } else {
      assert.deepEqual(announcements, [], 'Android does not also call the iOS announcement API');
      assert.equal(find('mall-wing-announcement').props.accessibilityLiveRegion, 'polite');
      assert.deepEqual(find('mall-wing-announcement').props.children, ['目前所在區域：延伸區二']);
    }
  }
});

test('preview announces position and unredeemed state; changing and cancelling update the status', async () => {
  const app = mount();
  await preview(app);
  assert.match(app.announcements.at(-1), /1F 店面區左側.*尚未兌換或扣除金幣/);
  assert.equal(app.slot('floor-1-left').props.accessibilityState.selected, true);
  assert.match(app.find('confirm-purchase-preview').props.accessibilityLabel, /彩色花圃.*1F 店面區左側.*20 金幣/);
  await app.press('mall-slot-floor-1-center');
  assert.match(app.announcements.at(-1), /1F 店面區中央/);
  assert.equal(app.slot('floor-1-center').props.accessibilityState.selected, true);
  assert.match(textContent(app.find('mall-placement-status')), /中央.*尚未兌換/);
  await app.press('floor-next');
  assert.match(app.announcements.at(-1), /2F.*預覽已清除.*尚未兌換/);
  await app.press('mall-slot-floor-2-left');
  app.nodes().find((node) => node.type === 'MallWingPager').props.onWingChange();
  app.render();
  assert.equal(app.find('mall-purchase-preview'), undefined);
  assert.match(app.announcements.at(-1), /分區.*預覽已清除.*尚未兌換/);
  await app.press('mall-slot-floor-2-left');
  await app.press('cancel-purchase-preview');
  assert.match(app.announcements.at(-1), /已取消試擺.*尚未兌換或扣除金幣/);
  assert.equal(app.calls.length, 0);
});

test('confirmation exposes busy and disabled states, then announces the actual outcome', async () => {
  const app = mount();
  let release;
  app.habits.purchaseMallItem = (itemId, _price, _category, _ticketCost, slotId) => new Promise((resolve) => {
    release = () => {
      app.habits.purchasedItems.push(itemId);
      app.habits.mallPlacements[slotId] = itemId;
      resolve();
    };
  });
  await preview(app);
  await app.press('confirm-purchase-preview');
  assert.match(app.announcements.at(-1), /正在兌換.*1F 店面區左側/);
  assert.deepEqual(app.find('confirm-purchase-preview').props.accessibilityState, { disabled: true, busy: true });
  assert.deepEqual(app.slot('floor-1-left').props.accessibilityState, { selected: true, disabled: true, busy: true });
  assert.equal(app.find('cancel-purchase-preview').props.accessibilityState.disabled, true);
  release();
  await new Promise((resolve) => setImmediate(resolve));
  app.render();
  assert.match(app.announcements.at(-1), /已兌換.*1F 店面區左側.*扣除 20 金幣/);
  assert.match(textContent(app.find('mall-placement-status')), /已兌換/);
  assert.deepEqual(app.announcementOptions.at(-1), { queue: true });
  assert.deepEqual(app.alerts, [], 'purchase result should not be repeated in a modal alert');
  assert.match(app.slot('floor-1-left').props.accessibilityLabel, /1F 店面區左側 彩色花圃，已兌換/);

  const failed = mount({ purchaseMallItem: async () => { throw new Error('disk full'); } });
  await preview(failed);
  await failed.press('confirm-purchase-preview');
  await new Promise((resolve) => setImmediate(resolve));
  failed.render();
  assert.match(failed.announcements.at(-1), /兌換未完成.*disk full.*1F 店面區左側.*重新確認/);
  assert.deepEqual(failed.announcementOptions.at(-1), { queue: true });
  assert.deepEqual(failed.alerts, [], 'purchase failure should not cover the live result or retry controls');
  assert.ok(failed.find('confirm-purchase-preview'), 'retry remains available after a failed redemption');
  assert.deepEqual(failed.find('confirm-purchase-preview').props.accessibilityState, { disabled: false, busy: false });
  assert.ok(failed.find('mall-purchase-preview'));
});

test('Android relies on one polite live region for progress and redemption results', async () => {
  const app = mount({}, undefined, 'android');
  let release;
  app.habits.purchaseMallItem = () => new Promise((resolve) => { release = resolve; });
  await preview(app);
  await app.press('confirm-purchase-preview');
  assert.equal(app.announcements.length, 0, 'Android must not receive a duplicate explicit announcement');
  assert.equal(app.find('mall-placement-status').props.accessibilityLiveRegion, 'polite');
  assert.match(textContent(app.find('mall-placement-status')), /正在兌換/);
  release();
  await new Promise((resolve) => setImmediate(resolve));
  app.render();
  assert.equal(app.announcements.length, 0);
  assert.match(textContent(app.find('mall-placement-status')), /已兌換/);
  assert.deepEqual(app.alerts, []);
});

test('preview uses the real visual mapping without purchase, ownership or placement changes; cancel discards it', async () => {
  const app = mount();
  await preview(app);
  const slot = app.find('mall-slot-floor-1-left');
  assert.equal(slot.props.isPreview, true);
  assert.equal(slot.props.item.visual, 'colorful-planter');
  assert.ok(app.find('mall-purchase-preview'));
  assert.equal(app.calls.length, 0);
  assert.equal(app.habits.coins, 100);
  assert.equal(app.habits.mallPlacements['floor-1-left'], undefined);
  assert.deepEqual(app.habits.purchasedItems, ['owned']);
  await app.press('cancel-purchase-preview');
  assert.equal(app.find('mall-purchase-preview'), undefined);
  assert.equal(app.find('mall-slot-floor-1-left').props.item, undefined);
  assert.equal(app.calls.length, 0);
});

test('changing floor removes preview but keeps the selected item; another slot replaces preview', async () => {
  const app = mount();
  await preview(app);
  await app.press('mall-slot-floor-1-center');
  assert.equal(app.find('mall-slot-floor-1-left').props.item, undefined);
  assert.equal(app.find('mall-slot-floor-1-center').props.isPreview, true);
  await app.press('floor-next');
  assert.equal(app.find('mall-purchase-preview'), undefined);
  await app.press('mall-slot-floor-2-left');
  assert.equal(app.find('mall-slot-floor-2-left').props.isPreview, true);
  assert.equal(app.calls.length, 0);
});

test('only confirmation purchases and rapid repeated taps call purchase once', async () => {
  const app = mount();
  let release;
  app.habits.purchaseMallItem = (...args) => {
    app.calls.push(['purchase', ...args]);
    return new Promise((resolve) => { release = resolve; });
  };
  await preview(app);
  const confirm = app.find('confirm-purchase-preview').props.onPress;
  confirm();
  confirm();
  assert.deepEqual(app.calls, [['purchase', 'test-planter', 20, 'decor', 0, 'floor-1-left']]);
  app.render();
  assert.equal(app.find('confirm-purchase-preview').props.disabled, true);
  release();
  await new Promise((resolve) => setImmediate(resolve));
  app.render();
  assert.equal(app.find('mall-purchase-preview'), undefined);
});

test('failed confirmation keeps preview available for retry; move and restore remain immediate and free', async () => {
  const app = mount();
  app.habits.purchaseMallItem = async () => { throw new Error('disk full'); };
  await preview(app);
  await app.press('confirm-purchase-preview');
  await new Promise((resolve) => setImmediate(resolve));
  app.render();
  assert.ok(app.find('mall-purchase-preview'));
  assert.equal(app.find('confirm-purchase-preview').props.disabled, false);
  await app.press('cancel-purchase-preview');
  await app.press('mall-slot-floor-1-right');
  await app.press('mall-slot-floor-1-left');
  assert.deepEqual(app.calls, [['move', 'owned', 'floor-1-left']]);
  await app.press('mall-slot-floor-1-right');
  await app.press('store-selected-item');
  assert.equal(app.calls[1][0], 'store');
  app.habits.mallPlacements = {};
  app.render();
  await app.press('collection-tab');
  await app.press('restore-owned');
  await app.press('mall-slot-floor-1-center');
  assert.deepEqual(app.calls[2], ['move', 'owned', 'floor-1-center']);
  assert.equal(app.find('mall-purchase-preview'), undefined);
});

const fullFirstFloor = {
  'floor-1-left': 'owned',
  'floor-1-center': 'other-center',
  'floor-1-right': 'other-right',
};

function mountHabitsContext(initialStorage = new Map(), options = {}) {
  const storage = initialStorage;
  const storageCalls = [];
  let failWrites = options.failWrites ?? false;
  const asyncStorage = {
    async getItem(key) {
      storageCalls.push(['get', key]);
      return storage.get(key) ?? null;
    },
    async setItem(key, value) {
      storageCalls.push(['set', key, value]);
      if (failWrites) throw new Error('simulated storage failure');
      storage.set(key, value);
    },
    async removeItem(key) {
      storageCalls.push(['remove', key]);
      if (failWrites) throw new Error('simulated storage failure');
      storage.delete(key);
    },
  };

  const hooks = [];
  let hookCursor = 0;
  let effectStarted = false;
  const context = { Provider: Symbol('HabitsContext.Provider'), value: null };
  const react = {
    createContext: () => context,
    createElement(type, props, ...children) {
      if (type === context.Provider) context.value = props.value;
      return { type, props: { ...props, children } };
    },
    useState(initial) {
      const index = hookCursor++;
      if (!(index in hooks)) hooks[index] = initial;
      return [hooks[index], (next) => {
        hooks[index] = typeof next === 'function' ? next(hooks[index]) : next;
      }];
    },
    useRef(initial) {
      const index = hookCursor++;
      if (!(index in hooks)) hooks[index] = { current: initial };
      return hooks[index];
    },
    useCallback: (callback) => callback,
    useContext: (value) => value.value,
    useEffect(effect) {
      if (!effectStarted) {
        effectStarted = true;
        effect();
      }
    },
    useMemo: (callback) => callback(),
  };
  const mockRequire = (name) => {
    if (name === 'react') return react;
    if (name === '@react-native-async-storage/async-storage') return { __esModule: true, default: asyncStorage };
    if (name === 'expo-haptics') return {
      ImpactFeedbackStyle: { Light: 'light' },
      NotificationFeedbackType: { Success: 'success' },
      impactAsync: async () => {},
      notificationAsync: async () => {},
      selectionAsync: async () => {},
    };
    if (name === '@/constants/colors') return {
      default: { light: { candyMint: '#0f0', candyLavender: '#f0f', candyPink: '#f00' } },
      light: { candyMint: '#0f0', candyLavender: '#f0f', candyPink: '#f00' },
    };
    if (name === '@/constants/mall-layout') return {
      MALL_SLOT_IDS: [
        'floor-1-left', 'floor-1-center', 'floor-1-right',
        ...Array.from({ length: 9 }, (_, index) => ['left', 'center', 'right']
          .map((column) => `floor-${index + 2}-${column}`)).flat(),
      ],
    };
    if (name === '@/constants/mall-shop-interior') return {
      SHOP_INTERIOR_DECORATION_IDS: ['test-decoration'],
      SHOP_INTERIOR_SLOT_IDS: ['test-interior-slot'],
      SHOP_INTERIOR_DECORATION_BY_ID: { 'test-decoration': { price: 10 } },
    };
    throw new Error(`Unexpected HabitsContext dependency: ${name}`);
  };
  const filename = path.join(__dirname, '../context/HabitsContext.tsx');
  const output = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.React,
      esModuleInterop: true,
    },
  }).outputText;
  const loadedModule = { exports: {} };
  new Function('require', 'module', 'exports', output)(mockRequire, loadedModule, loadedModule.exports);
  const provider = loadedModule.exports.HabitsProvider;
  function render() {
    hookCursor = 0;
    provider({ children: null });
    return context.value;
  }
  render();
  return {
    storage,
    storageCalls,
    render,
    get value() { return context.value; },
    setFailWrites(value) { failWrites = value; },
  };
}

test('AsyncStorage mall write failures preserve ownership, coins and placement after reload', async () => {
  const mallKey = 'momentum.mall.v1';
  const initialMall = {
    schemaVersion: 3,
    coins: 100,
    purchasedItems: ['owned'],
    rewardedCheckIns: [],
    rewardTokens: { facility: 0, shop: 0, decor: 0 },
    placements: { 'floor-1-right': 'owned' },
    shopInteriors: {},
  };
  const storage = new Map([[mallKey, JSON.stringify(initialMall)]]);
  const app = mountHabitsContext(storage);
  await new Promise((resolve) => setImmediate(resolve));
  let habits = app.render();
  assert.equal(habits.isLoading, false);
  assert.equal(habits.coins, 100);
  assert.deepEqual(habits.purchasedItems, ['owned']);
  assert.deepEqual(habits.mallPlacements, { 'floor-1-right': 'owned' });
  const persistedBefore = storage.get(mallKey);

  app.setFailWrites(true);
  await assert.rejects(
    habits.purchaseMallItem('new-item', 20, 'decor', 0, 'floor-1-left'),
    /無法儲存商場資料/,
  );
  habits = app.render();
  assert.equal(habits.coins, 100, 'failed redemption does not deduct coins');
  assert.deepEqual(habits.purchasedItems, ['owned'], 'failed redemption does not grant ownership');
  assert.deepEqual(habits.mallPlacements, { 'floor-1-right': 'owned' }, 'existing item stays in its original slot');

  await assert.rejects(habits.moveMallItem('owned', 'floor-1-left'), /無法儲存商場資料/);
  habits = app.render();
  assert.equal(habits.coins, 100);
  assert.deepEqual(habits.purchasedItems, ['owned']);
  assert.deepEqual(habits.mallPlacements, { 'floor-1-right': 'owned' }, 'failed move does not change placement');

  await assert.rejects(habits.storeMallItem('owned'), /無法儲存商場資料/);
  habits = app.render();
  assert.equal(habits.coins, 100);
  assert.deepEqual(habits.purchasedItems, ['owned'], 'failed warehouse storage keeps ownership');
  assert.deepEqual(habits.mallPlacements, { 'floor-1-right': 'owned' }, 'failed warehouse storage keeps original placement');
  assert.equal(storage.get(mallKey), persistedBefore, 'failed writes do not replace persisted mall data');
  assert.equal(app.storageCalls.filter(([operation, key]) => operation === 'set' && key === mallKey).length, 3);

  const reloaded = mountHabitsContext(storage);
  await new Promise((resolve) => setImmediate(resolve));
  habits = reloaded.render();
  assert.equal(habits.coins, 100, 'reload shows the pre-failure coin balance');
  assert.deepEqual(habits.purchasedItems, ['owned'], 'reload preserves the previously redeemed item');
  assert.deepEqual(habits.mallPlacements, { 'floor-1-right': 'owned' }, 'reload restores the pre-failure position');
});

function textContent(node) {
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(textContent).join('');
  return node?.props ? textContent(node.props.children) : '';
}

function mountWithPlacementMutation(overrides = {}, catalog, platformOS = 'ios', failures = {}) {
  let app;
  let failMoveOnce = failures.moveOnce === true;
  let failStoreOnce = failures.storeOnce === true;
  const moveMallItem = async (itemId, slotId) => {
    if (failMoveOnce) {
      failMoveOnce = false;
      throw new Error('暫時無法儲存');
    }
    app.calls.push(['move', itemId, slotId]);
    const originalSlot = Object.entries(app.habits.mallPlacements).find(([, placedId]) => placedId === itemId)?.[0];
    const displacedItem = app.habits.mallPlacements[slotId];
    if (originalSlot) delete app.habits.mallPlacements[originalSlot];
    app.habits.mallPlacements[slotId] = itemId;
    if (originalSlot && displacedItem) app.habits.mallPlacements[originalSlot] = displacedItem;
  };
  const storeMallItem = async (itemId) => {
    if (failStoreOnce) {
      failStoreOnce = false;
      throw new Error('暫時無法存倉');
    }
    app.calls.push(['store', itemId]);
    for (const [slotId, placedId] of Object.entries(app.habits.mallPlacements)) {
      if (placedId === itemId) delete app.habits.mallPlacements[slotId];
    }
  };
  app = mount({ ...overrides, moveMallItem, storeMallItem }, catalog, platformOS);
  return app;
}

async function settle(app) {
  await new Promise((resolve) => setImmediate(resolve));
  app.render();
}

for (const platformOS of ['ios', 'android']) {
  test(`${platformOS}: move, exchange, warehouse storage and free restore each focus one clear success result`, async () => {
    const app = mountWithPlacementMutation({}, undefined, platformOS);
    const coinsBefore = app.habits.coins;
    const ownershipBefore = [...app.habits.purchasedItems];

    await app.press('mall-slot-floor-1-right');
    await app.press('mall-slot-floor-1-left');
    await settle(app);
    assert.match(textContent(app.find('mall-placement-status')), /搬動完成.*已移至 1F 店面區左側.*沒有扣除金幣/);
    assert.equal(app.find('mall-placement-status').props.accessibilityLiveRegion, 'none');
    assert.match(app.slot('floor-1-left').props.accessibilityLabel, /操作結果：搬動完成/);
    assert.equal(app.find('mall-slot-floor-1-left').props.focusAfterResult, true);
    assert.deepEqual(app.alerts, []);

    const base = mallCatalog.MALL_ITEMS.find((item) => item.category === 'facility');
    assert.ok(base, 'the exchange fixture uses a facility so the test continues to cover tap-to-move behavior');
    const firstOwned = { ...base, id: 'owned', name: '已擁有花圃' };
    const secondOwned = { ...base, id: 'second-owned', name: '已擁有噴泉' };
    const exchange = mountWithPlacementMutation({
      purchasedItems: ['owned', 'second-owned'],
      mallPlacements: { 'floor-1-right': 'owned', 'floor-1-left': 'second-owned' },
    }, [firstOwned, secondOwned], platformOS);
    await exchange.press('mall-slot-floor-1-right');
    await exchange.press('mall-slot-floor-1-left');
    await settle(exchange);
    assert.match(textContent(exchange.find('mall-placement-status')), /交換完成.*已擁有花圃與已擁有噴泉已交換位置/);
    assert.match(exchange.slot('floor-1-left').props.accessibilityLabel, /操作結果：交換完成/);
    assert.equal(exchange.find('mall-slot-floor-1-left').props.focusAfterResult, true);
    assert.equal(exchange.habits.mallPlacements['floor-1-right'], 'second-owned');
    assert.equal(exchange.habits.coins, 100);
    assert.deepEqual(exchange.alerts, []);

    const storage = mountWithPlacementMutation({}, undefined, platformOS);
    await storage.press('mall-slot-floor-1-right');
    await storage.press('store-selected-item');
    await settle(storage);
    assert.match(textContent(storage.find('warehouse-notice')), /存入倉庫完成.*所有權保留.*免費取出重擺.*沒有退款或扣除金幣/);
    assert.equal(storage.find('warehouse-notice').props.accessibilityRole, 'text');
    const restoreAction = storage.find('restore-owned');
    assert.ok(restoreAction.props.ref, 'focus is attached to the next free restore action');
    assert.match(restoreAction.props.accessibilityLabel, /操作結果：存入倉庫完成/);
    assert.equal(storage.habits.mallPlacements['floor-1-right'], undefined);
    assert.deepEqual(storage.habits.purchasedItems, ownershipBefore);
    assert.equal(storage.habits.coins, coinsBefore);
    assert.deepEqual(storage.alerts, []);

    const restore = mountWithPlacementMutation({ mallPlacements: {} }, undefined, platformOS);
    await restore.press('collection-tab');
    await restore.press('restore-owned');
    await restore.press('mall-slot-floor-1-center');
    await settle(restore);
    assert.match(textContent(restore.find('mall-placement-status')), /免費重擺完成.*已從倉庫放在 1F 店面區中央.*沒有扣除金幣/);
    assert.equal(restore.find('mall-slot-floor-1-center').props.focusAfterResult, true);
    assert.match(restore.slot('floor-1-center').props.accessibilityLabel, /操作結果：免費重擺完成/);
    assert.deepEqual(restore.habits.purchasedItems, ownershipBefore);
    assert.equal(restore.habits.coins, coinsBefore);
    assert.deepEqual(restore.alerts, []);
  });

  test(`${platformOS}: failed move, storage and restore remain retryable or cancellable`, async () => {
    const moving = mountWithPlacementMutation({}, undefined, platformOS, { moveOnce: true });
    await moving.press('mall-slot-floor-1-right');
    await moving.press('mall-slot-floor-1-left');
    await settle(moving);
    assert.match(textContent(moving.find('mall-placement-status')), /搬動或交換未成功.*可重試.*取消擺放/);
    if (platformOS === 'ios') {
      assert.match(moving.announcements.at(-1), /搬動或交換未成功/);
    } else {
      assert.equal(moving.find('mall-placement-status').props.accessibilityLiveRegion, 'polite');
    }
    assert.ok(moving.nodes().some((node) => node.props.accessibilityLabel === '取消擺放'));
    assert.deepEqual(moving.alerts, []);
    await moving.press('mall-slot-floor-1-left');
    await settle(moving);
    assert.match(textContent(moving.find('mall-placement-status')), /搬動完成/);
    assert.equal(moving.habits.mallPlacements['floor-1-left'], 'owned');

    const storage = mountWithPlacementMutation({}, undefined, platformOS, { storeOnce: true });
    await storage.press('mall-slot-floor-1-right');
    await storage.press('store-selected-item');
    await settle(storage);
    assert.match(textContent(storage.find('mall-placement-status')), /存入倉庫未成功.*可重試.*取消擺放/);
    assert.ok(storage.find('store-selected-item'), 'the store action remains available for retry');
    assert.ok(storage.nodes().some((node) => node.props.accessibilityLabel === '取消擺放'));
    assert.equal(storage.habits.mallPlacements['floor-1-right'], 'owned');
    assert.deepEqual(storage.alerts, []);
    await storage.press('cancel-placement');
    assert.match(textContent(storage.find('mall-placement-status')), /已取消搬動.*原位置未更改/);
    assert.equal(storage.habits.mallPlacements['floor-1-right'], 'owned');

    const restore = mountWithPlacementMutation({ mallPlacements: {} }, undefined, platformOS, { moveOnce: true });
    await restore.press('collection-tab');
    await restore.press('restore-owned');
    await restore.press('mall-slot-floor-1-center');
    await settle(restore);
    assert.match(textContent(restore.find('mall-placement-status')), /免費重擺未成功.*仍留在倉庫.*可重試選空位或取消/);
    assert.ok(restore.nodes().some((node) => node.props.accessibilityLabel === '取消擺放'));
    assert.equal(restore.habits.mallPlacements['floor-1-center'], undefined);
    assert.deepEqual(restore.alerts, []);
    await restore.press('mall-slot-floor-1-center');
    await settle(restore);
    assert.match(textContent(restore.find('mall-placement-status')), /免費重擺完成/);
    assert.equal(restore.habits.mallPlacements['floor-1-center'], 'owned');
  });
}

test('a full floor lists actual vacancies and can jump floors without spending or losing purchase intent', async () => {
  const app = mount({ mallPlacements: { ...fullFirstFloor, 'floor-2-left': 'other-floor' } });
  assert.equal(app.find('mall-floor-full'), undefined);
  await app.press('build-test-planter');
  assert.match(textContent(app.find('mall-floor-full')), /1F 本層已滿/);
  assert.equal(app.find('mall-available-floor-1'), undefined);
  assert.match(textContent(app.find('mall-available-floor-2')), /2F · 2 空位/);
  assert.match(textContent(app.find('mall-available-floor-10')), /10F · 3 空位/);
  await app.press('mall-slot-floor-1-center');
  assert.equal(app.calls.length, 0);
  assert.equal(app.find('mall-purchase-preview'), undefined);
  await app.press('mall-available-floor-10');
  assert.equal(app.find('mall-floor-full'), undefined);
  await app.press('mall-slot-floor-10-right');
  assert.equal(app.find('mall-slot-floor-10-right').props.isPreview, true);
  assert.equal(app.calls.length, 0);
  assert.equal(app.habits.coins, 100);
  await app.press('confirm-purchase-preview');
  assert.deepEqual(app.calls, [['purchase', 'test-planter', 20, 'decor', 0, 'floor-10-right']]);
});

test('when all floors are full purchase and restore explain how to free space without charging', async () => {
  const placements = Object.fromEntries(
    Array.from({ length: 10 }, (_, i) => ['left', 'center', 'right'].map((column) => [`floor-${i + 1}-${column}`, 'occupied'])).flat(),
  );
  const app = mount({ mallPlacements: placements });
  await app.press('build-test-planter');
  const notice = textContent(app.find('mall-floor-full'));
  assert.match(notice, /十層都已放滿/);
  assert.match(notice, /先取消擺放.*存入倉庫/);
  assert.match(notice, /尚未扣除金幣/);
  assert.equal(app.find('mall-available-floor-2'), undefined);
  assert.equal(app.calls.length, 0);
  // Cancel using the existing banner control, then restore the owned item.
  const cancelButton = app.nodes().find((node) => node.props.accessibilityLabel === '取消擺放');
  await cancelButton.props.onPress();
  app.render();
  await app.press('collection-tab');
  await app.press('restore-owned');
  assert.match(textContent(app.find('mall-floor-full')), /十層都已放滿/);
  assert.equal(app.calls.length, 0);
});

test('full-floor move retains exchanges and storage, while restore can use another floor for free', async () => {
  const app = mount({ mallPlacements: { ...fullFirstFloor } });
  await app.press('mall-slot-floor-1-left');
  assert.match(textContent(app.find('mall-floor-full')), /交換位置/);
  await app.press('mall-slot-floor-1-center');
  assert.deepEqual(app.calls, [['move', 'owned', 'floor-1-center']]);
  await app.press('mall-slot-floor-1-left');
  await app.press('store-selected-item');
  assert.deepEqual(app.calls[1], ['store', 'owned']);
  app.habits.mallPlacements['floor-1-left'] = 'another-item';
  app.render();
  await app.press('collection-tab');
  await app.press('restore-owned');
  assert.ok(app.find('mall-floor-full'));
  await app.press('mall-available-floor-2');
  await app.press('mall-slot-floor-2-left');
  assert.deepEqual(app.calls[2], ['move', 'owned', 'floor-2-left']);
  assert.equal(app.habits.coins, 100);
});

test('6F 毛茸茸棉花糖cafe keeps 50 choices and adds fourteen redeemable dog attendants', () => {
  const shop = mallCatalog.MALL_ITEMS.find((item) => item.id === 'fluffy-marshmallow-cafe');
  assert.ok(shop);
  assert.equal(shop.floor, 6);
  assert.equal(shop.name, '毛茸茸棉花糖cafe');

  const options = shopInteriorCatalog.getShopInteriorDecorations('general', shop.id, shop.name);
  assert.equal(options.length, 50);
  assert.equal(new Set(options.map((option) => option.id)).size, 50);

  const dogStaff = options.filter((option) => option.id.startsWith('general-fluffy-staff-'));
  assert.deepEqual(
    dogStaff.map(({ name, visual }) => [name, visual]),
    [
      ['花花・淺啡色博美店員', 'dog-staff-huahua'],
      ['奶昔・白色博美店員', 'dog-staff-milkshake'],
      ['小牛・黑白色邊牧店員', 'dog-staff-xiaoniu'],
      ['布丁・黃金獵犬寶寶店員', 'dog-staff-pudding'],
      ['糖糖・白色比熊店員', 'dog-staff-tangtang'],
      ['皮皮・黃白柯基店員', 'dog-staff-pipi'],
      ['琥珀・淺啡色比熊店員', 'dog-staff-amber'],
      ['雲朵・白色博美店員', 'dog-staff-cloud'],
      ['雲吞・白色馬爾濟斯店員', 'dog-staff-wonton'],
      ['奶油・奶油色貴賓店員', 'dog-staff-butter'],
      ['芝麻・黑白西施店員', 'dog-staff-sesame'],
      ['雪球・白色迷你雪納瑞店員', 'dog-staff-snowball'],
      ['毛毛・白色薩摩耶店員', 'dog-staff-maomao'],
      ['波比・淺啡臘腸店員', 'dog-staff-poppy'],
    ],
  );
  assert.equal(dogStaff.length, 14);
  assert.ok(dogStaff.every((option) => option.price > 0 && option.itemKind === 'decoration'));
});
