const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const constantsSource = ts.transpileModule(
  fs.readFileSync(path.join(__dirname, '../constants/mall-shop-interior.ts'), 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true } },
).outputText;
const constantsModule = { exports: {} };
new Function('require', 'module', 'exports', constantsSource)(
  (name) => name === './colors' ? { light: new Proxy({}, { get: () => '#f0f0f0' }) } : require(name),
  constantsModule,
  constantsModule.exports,
);
const { getShopInteriorSceneKey } = constantsModule.exports;

test('shop type and all inferred general specialties resolve to stable scene variants', () => {
  const specialtyCases = [
    ['sunny-cafe', '暖陽咖啡館', 'cafe'],
    ['sugar-candy-shop', '糖果店', 'candy'],
    ['gelato-room', '雪糕小舖', 'icecream'],
    ['strawberry-bakery', '草莓烘焙屋', 'bakery'],
    ['tea-room', '森林花草茶', 'tea'],
    ['world-kitchen', '環球小食堂', 'food'],
    ['flower-shop', '花花日常', 'flower'],
    ['little-bookshop', '慢讀書屋', 'book'],
    ['toy-capsule-shop', '扭蛋玩具店', 'toy'],
    ['ceramic-studio', '陶土小店', 'craft'],
  ];
  for (const [id, name, expected] of specialtyCases) {
    assert.equal(getShopInteriorSceneKey('general', id, name), expected, `${id} uses ${expected} room`);
  }
  for (const type of [
    'womenswear', 'bridal', 'eveningwear', 'kimono', 'supermarket',
    'hyakuen', 'swimwear', 'cosplay', 'electronics', 'boutique',
  ]) {
    assert.equal(getShopInteriorSceneKey(type), type);
  }
  assert.equal(getShopInteriorSceneKey('general', 'unclassified-shop', '小店'), 'general');
  assert.equal(getShopInteriorSceneKey('general', 'tea-room', '花草茶'), 'tea');
});

test('interior page retains six accessible slots and wires scene selection to persisted placement state', () => {
  const page = fs.readFileSync(path.join(__dirname, '../app/mall-shop/[itemId].tsx'), 'utf8');
  const scene = fs.readFileSync(path.join(__dirname, '../components/ShopInteriorScene.tsx'), 'utf8');
  assert.match(page, /<ShopInteriorScene/);
  assert.match(page, /onSelectSlot=\{setSelectedSlot\}/);
  assert.match(page, /placeShopInteriorDecoration\(shop\.id, decorationId, selectedSlot\)/);
  assert.match(page, /storeShopInteriorDecoration\(shop\.id, selectedSlot\)/);
  const slotIds = [...fs.readFileSync(path.join(__dirname, '../constants/mall-shop-interior.ts'), 'utf8')
    .matchAll(/^\s*\{\s*id:\s*'([^']+)'/gm)].map(([, id]) => id).slice(0, 6);
  assert.deepEqual(slotIds, ['front-window', 'left-wall', 'center', 'right-wall', 'back-wall', 'counter']);
  assert.equal((scene.match(/accessibilityRole="button"/g) ?? []).length, 1, 'all six mapped hotspots share an accessible button template');
  assert.match(scene, /accessibilityLabel=/);
  assert.match(scene, /accessibilityState=\{\{ selected \}\}/);
});

const anchorSource = ts.transpileModule(
  fs.readFileSync(path.join(__dirname, '../constants/mall-shop-scene-anchors.ts'), 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true } },
).outputText;
const anchorModule = { exports: {} };
new Function('require', 'module', 'exports', anchorSource)(require, anchorModule, anchorModule.exports);
const { SCENE_ANCHORS, classifyDecoration, resolveObjectAnchor, mapCoverPoint } = anchorModule.exports;

test('every scene defines in-bounds anchors for all six slots', () => {
  const slots = ['front-window', 'left-wall', 'center', 'right-wall', 'back-wall', 'counter'];
  assert.equal(Object.keys(SCENE_ANCHORS).length, 21);
  for (const [scene, anchors] of Object.entries(SCENE_ANCHORS)) {
    assert.deepEqual(Object.keys(anchors).sort(), [...slots].sort(), scene);
    for (const { table, floor } of Object.values(anchors)) {
      for (const p of [table, floor]) assert.ok(p.x >= 0 && p.x <= 1 && p.y >= 0.1 && p.y <= 1, scene);
      assert.ok(floor.y >= table.y - 0.001, `${scene} floor is not above table`);
    }
  }
});

test('equipment classification: espresso is tabletop, oven/cabinets/staff are floor', () => {
  assert.equal(classifyDecoration({ id: 'general-equipment-cafe-espresso-machine', visual: 'coffee-machine', itemKind: 'equipment' }).cls, 'tabletop');
  assert.ok(classifyDecoration({ id: 'x-espresso-machine', visual: 'coffee-machine' }).scale <= 0.85, 'coffee machine is not enlarged');
  assert.equal(classifyDecoration({ id: 'bakery-oven', visual: 'bakery-oven' }).cls, 'floor');
  assert.equal(classifyDecoration({ id: 'ice-cream-freezer', visual: 'ice-cream-machine' }).cls, 'floor');
  assert.equal(classifyDecoration({ id: 'fluffy-staff-butter', visual: 'dog-staff-butter' }).cls, 'floor');
  assert.equal(classifyDecoration({ id: 'curved-showcase', visual: 'gallery-frames' }).cls, 'wall');
  assert.equal(classifyDecoration({ id: 'tops-wardrobe', visual: 'clothing-wardrobe' }).cls, 'floor');
});

test('cafe coffee machine lands on the right counter top, not window or floor', () => {
  const counter = resolveObjectAnchor('cafe', 'counter', 'tabletop');
  assert.ok(counter.x > 0.65 && counter.y > 0.5 && counter.y < 0.62, 'counter top on right side');
  const floor = resolveObjectAnchor('cafe', 'counter', 'floor');
  assert.ok(floor.y > counter.y + 0.2, 'floor anchor is separate');
  const window = SCENE_ANCHORS.cafe['front-window'].table;
  assert.ok(Math.abs(window.x - counter.x) > 0.2, 'counter slot is not at the window');
  const mapped = mapCoverPoint(counter, 360, 383);
  assert.ok(mapped.x > 250 && mapped.y > 200);
});

test('scene renders objects with MallObjectVisual, contact shadow only, and keeps hotspots accessible', () => {
  const scene = fs.readFileSync(path.join(__dirname, '../components/ShopInteriorScene.tsx'), 'utf8');
  assert.match(scene, /<MallObjectVisual/);
  assert.match(scene, /resolveObjectAnchor\(sceneKey, slot\.id/);
  assert.match(scene, /contactShadow/);
  assert.doesNotMatch(scene, /floorBase|tableBase|shelfBase/);
});
