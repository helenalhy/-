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
    'fragrance',
    'cafe',
    'candy',
    'icecream',
    'bakery',
    'tea',
    'food',
    'flower',
    'book',
    'toy',
    'craft',
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
    'cosmetics',
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
    assert.equal(new Set(products.map(({ variant }) => variant)).size, 60, `${shopType} products should each have an illustration variation`);
    const illustrationCount = new Set(products.slice(0, 8).map(({ illustration }) => illustration)).size;
    assert.ok(
      illustrationCount >= (shopType === 'fragrance' ? 2 : 3),
      `${shopType} should show multiple distinct product illustrations`,
    );
    assert.deepEqual(products.slice(0, 8).map(({ id }) => id), Array.from(
      { length: 8 },
      (_, index) => `display-${shopType}-${index + 1}`,
    ));
  }
});

test('fashion and boutique products use item-shaped animated illustrations instead of repeated jars', () => {
  const boutique = getShopFixtureProductCatalog(
    'starlight-luxury-boutique',
    '精品店',
    'boutique',
    displayFixture,
  );
  assert.deepEqual(
    boutique.slice(0, 8).map(({ illustration }) => illustration),
    ['handbag', 'earring', 'watch', 'scarf', 'jewel', 'wallet', 'necklace', 'hairclip'],
  );

  const womenswear = getShopFixtureProductCatalog(
    'ladies-fashion-boutique',
    '女裝店',
    'womenswear',
    displayFixture,
  );
  assert.ok(womenswear.some(({ illustration }) => illustration === 'garment'));
  assert.ok(womenswear.some(({ illustration }) => illustration === 'handbag'));
  assert.ok(womenswear.some(({ illustration }) => illustration === 'earring'));
  assert.ok(womenswear.some(({ illustration }) => illustration === 'scarf'));

  const cosmetics = getShopFixtureProductCatalog(
    'rainbow-cosmetics',
    '繽紛彩妝屋',
    'cosmetics',
    displayFixture,
  );
  assert.deepEqual(
    cosmetics.slice(0, 8).map(({ illustration }) => illustration),
    ['compact', 'lipstick', 'palette', 'mascara', 'bottle', 'brush', 'compact', 'nailPolish'],
  );
  const lipsticks = cosmetics.filter(({ illustration }) => illustration === 'lipstick');
  const eyeshadows = cosmetics.filter(({ illustration }) => illustration === 'palette');
  assert.ok(lipsticks.length >= 4, 'cosmetics inventory has several try-on lipstick colors');
  assert.ok(eyeshadows.length >= 4, 'cosmetics inventory has several try-on eyeshadow colors');
  assert.ok(new Set(lipsticks.map(({ color }) => color)).size > 1, 'lipsticks offer different shades');
  assert.ok(new Set(eyeshadows.map(({ color }) => color)).size > 1, 'eyeshadows offer different shades');

  const tryOn = fs.readFileSync(path.join(__dirname, '../components/CosmeticsTryOn.tsx'), 'utf8');
  assert.match(tryOn, /setSelectedLipstickId/);
  assert.match(tryOn, /setSelectedEyeshadowId/);
  assert.match(tryOn, /cosmetics-try-on-lips/);
  assert.match(tryOn, /cosmetics-try-on-guest-art/);
  assert.match(tryOn, /cosmetics-tryon-guest-portrait\.png/);
  assert.match(tryOn, /styles\.eyeshadowOverlay/);
  assert.ok(fs.existsSync(path.join(__dirname, '../assets/images/cosmetics-tryon-guest-portrait.png')));
  assert.doesNotMatch(tryOn, /hairCap|hairBangs|eyeRow/);
  assert.match(tryOn, /試色只會改變預覽，不扣金幣/);
  assert.doesNotMatch(tryOn, /useHabits|placeShopInteriorDecoration|setShopInteriorFixtureProduct/);
  const shopPage = fs.readFileSync(path.join(__dirname, '../app/mall-shop/[itemId].tsx'), 'utf8');
  assert.match(shopPage, /shop\.shopType === 'cosmetics'/);
  assert.match(shopPage, /<CosmeticsTryOn products=\{cosmeticsTryOnProducts\}/);

  const visual = fs.readFileSync(path.join(__dirname, '../components/ShopMerchandiseVisual.tsx'), 'utf8');
  for (const illustration of ['handbag', 'earring', 'watch', 'scarf', 'hairclip', 'shoe', 'wallet', 'necklace', 'towel', 'fan']) {
    assert.match(visual, new RegExp(`product\\.illustration === '${illustration}'`));
  }
});

test('other shops use product-specific animated silhouettes across food, toys and electronics', () => {
  const illustrationCases = [
    ['cafe', ['drink', 'cake', 'pancake', 'cookie', 'cloud', 'pudding']],
    ['candy', ['candy', 'bottle', 'lollipop', 'box']],
    ['icecream', ['icecream', 'drink', 'popsicle']],
    ['bakery', ['cake', 'bread', 'cookie', 'croissant']],
    ['food', ['riceball', 'bread', 'pizza', 'pancake', 'bento', 'produce']],
    ['toy', ['plush', 'blocks', 'capsule', 'puzzle', 'musicbox', 'train']],
    ['electronics', ['headphones', 'camera', 'speaker', 'gameConsole', 'watch', 'cable', 'projector']],
    ['supermarket', ['produce', 'carton', 'cookie', 'snack', 'flower']],
    ['cosmetics', ['compact', 'lipstick', 'palette', 'mascara', 'bottle', 'brush', 'nailPolish']],
  ];

  for (const [shopType, expectedIllustrations] of illustrationCases) {
    const products = getShopFixtureProductCatalog(
      `${shopType}-shop`,
      '主題商店',
      shopType,
      displayFixture,
    );
    const firstPageIllustrations = products.slice(0, 8).map(({ illustration }) => illustration);
    for (const expected of expectedIllustrations) {
      assert.ok(firstPageIllustrations.includes(expected), `${shopType} should use the ${expected} illustration`);
    }
  }

  const visual = fs.readFileSync(path.join(__dirname, '../components/ShopMerchandiseVisual.tsx'), 'utf8');
  assert.match(visual, /bottleRound/);
  assert.match(visual, /bottleSquare/);
  for (const illustration of ['cloud', 'diffuserStone', 'pudding', 'icecream', 'popsicle', 'pizza', 'riceball', 'plush', 'blocks', 'capsule', 'musicbox', 'train', 'yarn', 'pottery', 'basket', 'wand', 'carton', 'headphones', 'camera', 'speaker', 'gameConsole', 'cable', 'projector', 'brush', 'mask', 'postcard', 'pencil', 'bucket', 'swimwear', 'teaCup', 'compact', 'lipstick', 'palette', 'mascara', 'nailPolish']) {
    assert.match(visual, new RegExp(`${illustration}: \\{ shape:`));
  }
  assert.match(visual, /productArtwork &&/);
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

test('Sakura Hot Spring display cabinet offers a unique 60-item bath-goods catalog', () => {
  const suppliesCabinet = {
    id: 'general-equipment-onsen-onsen-supply-case',
    name: '溫泉用品玻璃展示櫃',
    description: '分格展示入浴鹽、香皂、浴巾與泡湯小物。',
  };
  assert.equal(canDisplayShopProducts(suppliesCabinet), true);
  const products = getShopFixtureProductCatalog(
    'theme-floor-15-shop-1',
    '櫻花暖湯紀念店',
    'general',
    suppliesCabinet,
  );
  assert.equal(products.length, 60);
  assert.equal(new Set(products.map(({ id }) => id)).size, 60);
  assert.ok(products.every(({ theme }) => theme === 'onsen'));
  assert.ok(products.some(({ name }) => name === '櫻花入浴鹽小罐'));
  assert.ok(products.some(({ name }) => name === '溫泉旅館毛巾組'));
  assert.ok(products.some(({ name }) => name === '櫻花紋浴衣'));
});

test('bakery croissants have a matching animated pastry illustration', () => {
  const products = getShopFixtureProductCatalog(
    'strawberry-bakery',
    '草莓烘焙屋',
    'general',
    displayFixture,
  );
  const croissant = products.find(({ name }) => name === '蜂蜜可頌');
  const visual = fs.readFileSync(path.join(__dirname, '../components/ShopMerchandiseVisual.tsx'), 'utf8');
  const interior = fs.readFileSync(path.join(__dirname, '../components/ShopInteriorScene.tsx'), 'utf8');
  const panel = fs.readFileSync(path.join(__dirname, '../components/ShopDisplayFixturePanel.tsx'), 'utf8');
  assert.equal(croissant?.illustration, 'croissant');
  assert.match(visual, /product\.illustration === 'croissant'/);
  assert.match(visual, /croissantBody/);
  assert.match(visual, /croissantRollCenter/);
  assert.match(visual, /croissantSteam/);
  assert.match(visual, /croissant: \{ lift: 2\.3, tilt: 4, scale: 1\.075/);
  assert.match(interior, /if \(!hasMerchandise \|\| reducedMotion\)/);
  assert.match(panel, /reduceMotion !== false/);
  assert.match(visual, /const reducedMotion = useReducedMotion\(\) !== false/);
});

test('character outfits appear in their matching wardrobe while old displayed choices remain renderable', () => {
  const wardrobeCases = [
    ['cosplay-hero-cape-collection', ['卡卡西・上忍綠色背心套裝'], ['鳴人・第七代火影橘黑斗篷', '佐助・深藍高領忍者外套', '鼬・深色紅雲旅行斗篷', '小櫻・玫瑰紅忍者裙裝']],
    ['cosplay-limited-starlight-magician', ['鳴人・第七代火影橘黑斗篷', '鳴人・橘黑忍者服'], ['卡卡西・上忍綠色背心套裝', '佐助・深藍高領忍者外套', '鼬・深色紅雲旅行斗篷', '小櫻・玫瑰紅忍者裙裝']],
    ['cosplay-sasuke-character-wardrobe', ['佐助・深藍高領忍者外套'], ['鳴人・第七代火影橘黑斗篷', '卡卡西・上忍綠色背心套裝', '鼬・深色紅雲旅行斗篷', '小櫻・玫瑰紅忍者裙裝']],
    ['cosplay-itachi-character-wardrobe', ['鼬・深色紅雲旅行斗篷'], ['鳴人・第七代火影橘黑斗篷', '佐助・深藍高領忍者外套', '卡卡西・上忍綠色背心套裝', '小櫻・玫瑰紅忍者裙裝']],
    ['cosplay-fairy-wing-costume', ['小櫻・玫瑰紅忍者裙裝'], ['鳴人・第七代火影橘黑斗篷', '佐助・深藍高領忍者外套', '鼬・深色紅雲旅行斗篷', '卡卡西・上忍綠色背心套裝']],
  ];

  for (const [fixtureId, expectedNames, misplacedNames] of wardrobeCases) {
    const products = getShopFixtureProductCatalog(
      'cosplay-costume-studio',
      'Cosplay服裝店',
      'cosplay',
      { id: fixtureId, name: '角色衣櫃', description: '展示角色服裝' },
    );
    assert.equal(products.length, 70);
    assert.deepEqual(products.slice(0, 60).map(({ id }) => id), Array.from(
      { length: 60 },
      (_, index) => `display-cosplay-${index + 1}`,
    ));
    const selectable = products.filter(({ legacyOnly }) => !legacyOnly);
    for (const name of expectedNames) {
      assert.ok(selectable.some((product) => product.name === name), `${name} should be selectable in ${fixtureId}`);
    }
    for (const name of misplacedNames) {
      assert.ok(products.some((product) => product.name === name && product.legacyOnly), `${name} should not be newly selected in ${fixtureId}`);
    }
  }

  const kakashiProducts = getShopFixtureProductCatalog(
    'cosplay-costume-studio',
    'Cosplay服裝店',
    'cosplay',
    { id: 'cosplay-hero-cape-collection', name: '卡卡西衣櫃', description: '展示角色服裝' },
  );
  const kakashiVest = kakashiProducts.find(({ name }) => name === '卡卡西・上忍綠色背心套裝');
  const hokageCloak = kakashiProducts.find(({ name }) => name === '鳴人・第七代火影橘黑斗篷');
  assert.equal(kakashiVest?.illustration, 'garment');
  assert.equal(hokageCloak?.illustration, 'cloak');
  assert.equal(hokageCloak?.legacyOnly, true);
});

test('Akatsuki wardrobe offers rings, wigs and cloaks for every member in a unique 60-item catalog', () => {
  const products = getShopFixtureProductCatalog(
    'cosplay-costume-studio',
    'Cosplay服裝店',
    'cosplay',
    {
      id: 'cosplay-akatsuki-collection-wardrobe',
      name: '曉成員主題珍藏衣櫃',
      description: '展示角色服裝、戒指和假髮',
    },
  );
  const members = [
    '佩恩・長門', '小南', '宇智波鼬', '干柿鬼鮫', '迪達拉', '蠍',
    '飛段', '角都', '阿飛・帶土', '絕', '大蛇丸（前成員）',
  ];
  assert.equal(products.length, 60);
  assert.equal(new Set(products.map(({ id }) => id)).size, 60);
  assert.equal(new Set(products.map(({ name }) => name)).size, 60);
  for (const member of members) {
    assert.ok(products.some(({ name, illustration }) => name === `曉・${member}角色戒指` && illustration === 'ring'));
    assert.ok(products.some(({ name, illustration }) => name === `曉・${member}造型假髮` && illustration === 'wig'));
    assert.ok(products.some(({ name, illustration }) => name === `曉・${member}紅雲長斗篷` && illustration === 'cloak'));
  }
});

test('fixture merchandise uses animated illustrations and paginated 18-slot arrangements', () => {
  const scene = fs.readFileSync(path.join(__dirname, '../components/ShopInteriorScene.tsx'), 'utf8');
  const panel = fs.readFileSync(path.join(__dirname, '../components/ShopDisplayFixturePanel.tsx'), 'utf8');
  const visual = fs.readFileSync(path.join(__dirname, '../components/ShopMerchandiseVisual.tsx'), 'utf8');
  const context = fs.readFileSync(path.join(__dirname, '../context/HabitsContext.tsx'), 'utf8');
  const route = fs.readFileSync(path.join(__dirname, '../app/mall-shop/[itemId].tsx'), 'utf8');
  assert.match(scene, /onOpenDisplayFixture\(decoration\.id\)/);
  assert.match(scene, /displayedProductsRow/);
  assert.match(scene, /ShopMerchandiseVisual/);
  assert.match(panel, /shop-display-slot-/);
  assert.match(panel, /shop-display-product-/);
  assert.match(panel, /商品不扣金幣/);
  assert.match(panel, /catalogPageSize = 12/);
  assert.match(panel, /shop-display-page-next/);
  assert.match(panel, /products\.filter\(\(\{ legacyOnly \}\) => !legacyOnly\)/);
  assert.match(visual, /Animated\.View/);
  assert.match(visual, /product\.illustration === 'bottle'/);
  assert.match(visual, /product\.illustration === 'garment'/);
  assert.match(visual, /product\.illustration === 'cloak'/);
  assert.match(visual, /product\.illustration === 'wig'/);
  assert.match(visual, /product\.illustration === 'ring'/);
  assert.match(visual, /MERCHANDISE_MOTION_PROFILES: Partial<Record<ShopProductIllustration, MerchandiseMotionProfile>>/);
  assert.match(context, /product\.legacyOnly/);
  assert.match(context, /product\.fixtureIds\.includes\(fixtureDecorationId\)/);
  assert.match(route, /setShopInteriorFixtureProduct/);
  assert.match(route, /ShopDisplayFixturePanel/);
});
