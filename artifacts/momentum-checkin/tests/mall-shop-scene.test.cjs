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
