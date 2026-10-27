const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const constantsPath = path.join(__dirname, '../constants/mall-shop-display.ts');
const constantsOutput = ts.transpileModule(fs.readFileSync(constantsPath, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true },
}).outputText;
const constantsModule = { exports: {} };
new Function('require', 'module', 'exports', constantsOutput)(
  (request) => {
    if (request === './colors') {
      return {
        light: new Proxy({}, { get: (_target, key) => `palette-${String(key)}` }),
      };
    }
    throw new Error(`Unexpected dependency: ${request}`);
  },
  constantsModule,
  constantsModule.exports,
);

const {
  canDisplayShopProducts,
  getShopFixtureProductCatalog,
  SHOP_DISPLAY_SLOT_COUNT,
} = constantsModule.exports;
const displayFixture = {
  id: 'general-display-shelf',
  name: '糖果色展示架',
  description: '擺放相關商品',
};

test('display fixtures are recognized without treating ordinary lamps as shelves', () => {
  assert.equal(canDisplayShopProducts(displayFixture), true);
  assert.equal(canDisplayShopProducts({ id: 'general-warm-lamp', name: '暖光吊燈', description: '照明' }), false);
  assert.equal(SHOP_DISPLAY_SLOT_COUNT, 6);
});

test('each shop type gets eight distinct, shop-specific products', () => {
  const shopTypes = [
    'general',
    'womenswear',
    'bridal',
    'eveningwear',
    'kimono',
    'supermarket',
    'hyakuen',
    'swimwear',
    'cosplay',
    'electronics',
    'boutique',
  ];

  for (const shopType of shopTypes) {
    const products = getShopFixtureProductCatalog(
      `${shopType}-shop`,
      '專屬商店',
      shopType,
      displayFixture,
    );
    assert.equal(products.length, 8, `${shopType} should have eight stock choices`);
    assert.equal(new Set(products.map(({ id }) => id)).size, 8, `${shopType} ids should be unique`);
    assert.equal(new Set(products.map(({ name }) => name)).size, 8, `${shopType} names should be unique`);
    assert.ok(products.every(({ name, description, icon, color }) => name && description && icon && color));
  }
});

test('cloud fragrance shop has fragrance bottles and diffuser stones', () => {
  const products = getShopFixtureProductCatalog(
    'cloud-spa',
    '雲朵香氛館',
    'general',
    displayFixture,
  );
  assert.ok(products.some(({ name }) => name.includes('香氛')));
  assert.ok(products.some(({ name }) => name.includes('擴香石')));
  assert.equal(new Set(products.map(({ id }) => id)).size, products.length);
});

test('the shop scene opens a fixture-specific product panel and renders its merchandise', () => {
  const scene = fs.readFileSync(path.join(__dirname, '../components/ShopInteriorScene.tsx'), 'utf8');
  const panel = fs.readFileSync(path.join(__dirname, '../components/ShopDisplayFixturePanel.tsx'), 'utf8');
  const route = fs.readFileSync(path.join(__dirname, '../app/mall-shop/[itemId].tsx'), 'utf8');
  assert.match(scene, /onOpenDisplayFixture\(decoration\.id\)/);
  assert.match(scene, /displayedProductsRow/);
  assert.match(panel, /shop-display-slot-/);
  assert.match(panel, /shop-display-product-/);
  assert.match(panel, /擺放不扣金幣/);
  assert.match(route, /setShopInteriorFixtureProduct/);
  assert.match(route, /ShopDisplayFixturePanel/);
});
