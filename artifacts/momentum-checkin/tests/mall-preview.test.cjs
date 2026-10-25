// Exercise the actual screen handlers without a device or persistent test data.
// Run: node --test artifacts/momentum-checkin/tests/mall-preview.test.cjs
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const source = ts.transpileModule(
  fs.readFileSync(path.join(__dirname, '../app/(tabs)/mall.tsx'), 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React, esModuleInterop: true } },
).outputText;

function mount() {
  const states = [];
  let cursor = 0;
  let first = true;
  let tree;
  const calls = [];
  const item = { id: 'test-planter', visual: 'colorful-planter', floor: 1, name: '彩色花圃', category: 'decor', price: 20, ticketCost: 0 };
  const owned = { ...item, id: 'owned', name: '已擁有花圃' };
  const habits = {
    coins: 100, purchasedItems: ['owned'], mallPlacements: { 'floor-1-right': 'owned' },
    isLoading: false,
    purchaseMallItem: async (...args) => { calls.push(['purchase', ...args]); },
    moveMallItem: async (...args) => { calls.push(['move', ...args]); },
    storeMallItem: async (...args) => { calls.push(['store', ...args]); },
  };
  const react = {
    createElement: (type, props, ...children) => ({ type, props: { ...props, children } }),
    useState(initial) {
      const index = cursor++;
      if (first) states[index] = initial;
      return [states[index], (next) => { states[index] = next; }];
    },
    useRef(initial) {
      const index = cursor++;
      if (first) states[index] = { current: initial };
      return states[index];
    },
    useEffect: () => {},
    useMemo: (fn) => fn(),
  };
  const animation = () => ({ start() {}, stop() {} });
  const mockRequire = (name) => {
    if (name === 'react') return react;
    if (name === 'react-native') return {
      Animated: { Value: class { setValue() {} }, View: 'View', timing: animation, spring: animation, parallel: animation },
      Alert: { alert() {} }, StyleSheet: { create: (s) => s }, Platform: { OS: 'ios' },
      ...Object.fromEntries(['ImageBackground', 'Pressable', 'ScrollView', 'Text', 'View'].map((key) => [key, key])),
    };
    if (name === '@expo/vector-icons') return { Feather: 'Feather' };
    if (name === 'react-native-safe-area-context') return { SafeAreaView: 'SafeAreaView', useSafeAreaInsets: () => ({ top: 0, bottom: 0 }) };
    if (name === '@/constants/colors') return { light: {} };
    if (name === '@/hooks/useColors') return { useColors: () => ({}) };
    if (name === '@/context/HabitsContext') return {
      useHabits: () => habits, MALL_FLOOR_COUNT: 10,
      MALL_SLOT_IDS: Array.from({ length: 10 }, (_, i) => ['left', 'center', 'right'].map((col) => `floor-${i + 1}-${col}`)).flat(),
    };
    if (name === '@/constants/mall') return {
      MALL_ITEMS: [item, owned], MALL_ITEM_BY_ID: { [item.id]: item, owned },
      MALL_FLOORS: Array.from({ length: 10 }, () => ({ title: '測試樓層' })),
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
    return [node, ...(node.props?.children ? nodes(node.props.children) : [])];
  }
  function find(id) {
    return nodes(tree).find((node) => node.props.testID === id || (node.props.slotId && `mall-slot-${node.props.slotId}` === id));
  }
  render();
  return {
    habits, calls, render, find, nodes,
    async press(id) {
      const node = find(id);
      assert.ok(node, `Missing ${id}`);
      assert.ok(!node.props.disabled, `${id} disabled`);
      await node.props.onPress();
      render();
    },
  };
}

async function preview(app) {
  await app.press('build-test-planter');
  await app.press('mall-slot-floor-1-left');
}

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
