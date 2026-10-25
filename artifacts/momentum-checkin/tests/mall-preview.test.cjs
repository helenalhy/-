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
const layoutModule = { exports: {} };
new Function('exports', ts.transpileModule(
  fs.readFileSync(path.join(__dirname, '../constants/mall-layout.ts'), 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.CommonJS } },
).outputText)(layoutModule.exports);

function mount(overrides = {}) {
  const states = [];
  let cursor = 0;
  let first = true;
  let tree;
  const calls = [];
  const mallWingPager = ({ renderWing, ...props }) => ({
    type: 'MallWingPager',
    props: { ...props, children: renderWing('main', true) },
  });
  const announcements = [];
  const item = { id: 'test-planter', visual: 'colorful-planter', floor: 1, name: '彩色花圃', category: 'decor', price: 20, ticketCost: 0 };
  const owned = { ...item, id: 'owned', name: '已擁有花圃' };
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
      Animated: { Value: class { setValue() {} }, View: 'View', timing: animation, spring: animation, parallel: animation, multiply: () => 1 },
      AccessibilityInfo: { announceForAccessibility: (message) => announcements.push(message) },
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
    if (name === '@/constants/mall-layout') return layoutModule.exports;
    if (name === '@/components/MallWingPager') return { MallWingPager: mallWingPager };
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
    return [node, ...(node.props?.children ? nodes(node.props.children) : []),
      ...(node.props?.renderWing ? nodes(node.props.renderWing('main', true)) : [])];
  }
  function find(id) {
    return nodes(tree).find((node) => node.props.testID === id || (node.props.slotId && `mall-slot-${node.props.slotId}` === id));
  }
  render();
  return {
    habits, calls, announcements, render, find, nodes: (node = tree) => nodes(node),
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
  assert.match(app.slot('floor-1-right').props.accessibilityLabel, /已兌換/);
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
  app.habits.purchaseMallItem = () => new Promise((resolve) => { release = resolve; });
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

  const failed = mount({ purchaseMallItem: async () => { throw new Error('disk full'); } });
  await preview(failed);
  await failed.press('confirm-purchase-preview');
  await new Promise((resolve) => setImmediate(resolve));
  failed.render();
  assert.match(failed.announcements.at(-1), /兌換未完成.*disk full.*1F 店面區左側.*重新確認/);
  assert.deepEqual(failed.find('confirm-purchase-preview').props.accessibilityState, { disabled: false, busy: false });
  assert.ok(failed.find('mall-purchase-preview'));
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

function textContent(node) {
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(textContent).join('');
  return node?.props ? textContent(node.props.children) : '';
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
