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
  assert.equal(SHOP_DISPLAY_SLOT_COUNT, 18);
});

test('each shop type gets sixty distinct, shop-specific illustrated products', () => {
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
    assert.equal(products.length, 60, `${shopType} should have sixty stock choices`);
    assert.equal(new Set(products.map(({ id }) => id)).size, 60, `${shopType} ids should be unique`);
    assert.equal(new Set(products.map(({ name }) => name)).size, 60, `${shopType} names should be unique`);
    assert.ok(products.every(({ name, description, icon, color, theme, illustration, variant }) => (
      name && description && icon && color && theme && illustration && Number.isInteger(variant)
    )));
    assert.deepEqual(products.slice(0, 8).map(({ id }) => id), Array.from(
      { length: 8 },
      (_, index) => `display-${shopType}-${index + 1}`,
    ));
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
  assert.equal(products.length, 60);
  assert.equal(new Set(products.map(({ id }) => id)).size, 60);
});

test('fixture merchandise uses animated illustrations and paginated 18-slot arrangements', () => {
  const scene = fs.readFileSync(path.join(__dirname, '../components/ShopInteriorScene.tsx'), 'utf8');
  const panel = fs.readFileSync(path.join(__dirname, '../components/ShopDisplayFixturePanel.tsx'), 'utf8');
  const visual = fs.readFileSync(path.join(__dirname, '../components/ShopMerchandiseVisual.tsx'), 'utf8');
  const route = fs.readFileSync(path.join(__dirname, '../app/mall-shop/[itemId].tsx'), 'utf8');
  assert.match(scene, /onOpenDisplayFixture\(decoration\.id\)/);
  assert.match(scene, /displayedProductsRow/);
  assert.match(scene, /ShopMerchandiseVisual/);
  assert.match(panel, /shop-display-slot-/);
  assert.match(panel, /shop-display-product-/);
  assert.match(panel, /商品不扣金幣/);
  assert.match(panel, /catalogPageSize = 12/);
  assert.match(panel, /shop-display-page-next/);
  assert.match(visual, /Animated\.View/);
  assert.match(visual, /product\.illustration === 'bottle'/);
  assert.match(visual, /product\.illustration === 'garment'/);
  assert.match(route, /setShopInteriorFixtureProduct/);
  assert.match(route, /ShopDisplayFixturePanel/);
});
