const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const appRoot = path.join(__dirname, '..');
const helperSource = ts.transpileModule(
  fs.readFileSync(path.join(appRoot, 'constants/mall-floor-art.ts'), 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true } },
).outputText;
const helperModule = { exports: {} };
new Function('require', 'module', 'exports', helperSource)(
  (name) => name === './colors'
    ? { light: new Proxy({}, { get: () => '#f0f0f0' }) }
    : require(name),
  helperModule,
  helperModule.exports,
);
const { getMallFloorArtProfile, MALL_FLOOR_ART_TITLES } = helperModule.exports;

const catalogModuleCache = new Map();
function loadCatalogTsModule(filename) {
  const resolved = path.resolve(filename.endsWith('.ts') ? filename : `${filename}.ts`);
  if (catalogModuleCache.has(resolved)) return catalogModuleCache.get(resolved).exports;
  const loadedModule = { exports: {} };
  catalogModuleCache.set(resolved, loadedModule);
  const output = ts.transpileModule(fs.readFileSync(resolved, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true },
  }).outputText;
  const mockRequire = (request) => {
    const dependency = path.resolve(path.dirname(resolved), request);
    if (fs.existsSync(`${dependency}.ts`)) return loadCatalogTsModule(`${dependency}.ts`);
    if (fs.existsSync(dependency)) return dependency;
    throw new Error(`Unexpected catalog dependency: ${request}`);
  };
  new Function('require', 'module', 'exports', output)(mockRequire, loadedModule, loadedModule.exports);
  return loadedModule.exports;
}
const mallCatalog = loadCatalogTsModule(path.join(appRoot, 'constants/mall.ts'));

test('all thirty floors have their own theme name and emblem', () => {
  const profiles = Array.from({ length: 30 }, (_, index) => getMallFloorArtProfile(index + 1, 'theme-check'));
  assert.equal(new Set(MALL_FLOOR_ART_TITLES).size, 30);
  assert.equal(new Set(profiles.map(({ emblem }) => emblem)).size, 30);
  assert.deepEqual(profiles.map(({ title }) => title), MALL_FLOOR_ART_TITLES);
  assert.equal(getMallFloorArtProfile(0, 'fallback').title, MALL_FLOOR_ART_TITLES[0]);
  assert.equal(getMallFloorArtProfile(31, 'fallback').title, MALL_FLOOR_ART_TITLES[29]);
});

test('all thirty floors have real shop samples, unique themes and bundled scene artwork', () => {
  const mallScreen = fs.readFileSync(path.join(appRoot, 'app/(tabs)/mall.tsx'), 'utf8');
  const mallSource = fs.readFileSync(path.join(appRoot, 'constants/mall.ts'), 'utf8');
  const shopsByFloor = Array.from({ length: 30 }, (_, index) => (
    mallCatalog.MALL_ITEMS.filter((item) => item.category === 'shop' && item.floor === index + 1)
  ));
  const storefronts = shopsByFloor.flat();

  assert.ok(shopsByFloor.every((shops) => shops.length > 0), 'all thirty floors have shop test data');
  assert.ok(storefronts.length > 100, 'exercise the real shop catalog, not hand-picked examples');
  assert.equal(mallCatalog.MALL_FLOORS.length, 30);
  assert.equal(new Set(mallCatalog.MALL_FLOORS.map(({ title }) => title)).size, 30);
  const floorImageNames = [...mallSource.matchAll(/image: require\('\.\.\/assets\/images\/(mall-floor-[^']+\.jpg)'\)/g)]
    .map(([, name]) => name);
  assert.equal(floorImageNames.length, 30);
  assert.equal(new Set(floorImageNames).size, 30);
  for (const filename of floorImageNames) {
    assert.ok(fs.statSync(path.join(appRoot, 'assets/images', filename)).size > 0, `${filename} is bundled`);
  }
  for (let floor = 1; floor <= 30; floor += 1) {
    const shop = shopsByFloor[floor - 1][0];
    const art = getMallFloorArtProfile(floor, shop.id);
    assert.equal(art.title, MALL_FLOOR_ART_TITLES[floor - 1], `${shop.name} uses its floor title`);
    assert.ok(art.emblem, `${shop.name} has a floor emblem`);
    assert.deepEqual(
      art,
      getMallFloorArtProfile(floor, shop.id),
      `${shop.name} keeps its storefront and interior look after navigation`,
    );
  }
  assert.equal(mallCatalog.MALL_FLOORS[20].title, '童話天空城堡');
  assert.match(mallCatalog.MALL_FLOORS[20].description, /城堡/);

  assert.match(mallScreen, /itemName=\{item\.name\}[\s\S]*?floor=\{item\.floor\}/);
});

test('shop illustrations use stable but item-specific storefront and interior variations', () => {
  const items = Array.from({ length: 60 }, (_, index) => getMallFloorArtProfile(5, `shop-item-${index}`));
  const signatures = items.map(({ shopAccent, shopSoft, variant, pattern, displayMark, ornament, secondaryOrnament }) => (
    [shopAccent, shopSoft, variant, pattern, displayMark, ornament, secondaryOrnament].join('|')
  ));
  assert.equal(new Set(signatures).size, signatures.length, 'sample shop items should not reuse the same visual combination');
  assert.deepEqual(
    getMallFloorArtProfile(5, 'retro-game-shop'),
    getMallFloorArtProfile(5, 'retro-game-shop'),
    'the same shop should keep its art after navigating away and back',
  );
  assert.notDeepEqual(
    getMallFloorArtProfile(5, 'retro-game-shop'),
    getMallFloorArtProfile(4, 'retro-game-shop'),
    'the same item on another floor should use that floor theme',
  );
});

test('facility and decor themes stay stable while varying by floor and item', () => {
  const facilitiesAndDecor = mallCatalog.MALL_ITEMS.filter(({ category }) => category !== 'shop');
  const signature = ({ accent, secondary, soft, emblem, objectPattern, objectVariant, objectAnimation, displayMark }) => (
    [accent, secondary, soft, emblem, objectPattern, objectVariant, objectAnimation, displayMark].join('|')
  );
  const sample = facilitiesAndDecor.slice(0, 48);

  assert.ok(facilitiesAndDecor.length > 30, 'exercise the real facility and decor catalog');
  assert.ok(sample.every(({ id, floor }) => {
    const art = getMallFloorArtProfile(floor, id);
    return signature(art) === signature(getMallFloorArtProfile(floor, id));
  }), 'each item retains its theme after leaving and revisiting the floor');
  assert.ok(sample.some(({ id, floor }) => (
    signature(getMallFloorArtProfile(floor, id)) !== signature(getMallFloorArtProfile(floor === 20 ? 19 : floor + 1, id))
  )), 'the same fixture gets a distinct theme on another floor');
  assert.ok(
    new Set(sample.map(({ id, floor }) => signature(getMallFloorArtProfile(floor, id)))).size > sample.length * 0.9,
    'different fixtures receive varied floor-aware accents',
  );
});

test('mall fixture themes preserve the original drawing, touch behavior, and reduced-motion handling', () => {
  const mall = fs.readFileSync(path.join(appRoot, 'app/(tabs)/mall.tsx'), 'utf8');
  const visuals = fs.readFileSync(path.join(appRoot, 'components/MallVisuals.tsx'), 'utf8');

  assert.match(mall, /floor=\{item\.floor\}/);
  assert.match(visuals, /category !== 'shop' && \(\s*<MallObjectFloorTheme/);
  assert.match(visuals, /testID=\{`mall-object-floor-theme-\$\{floor\}-\$\{itemId\}`\}/);
  assert.match(visuals, /pointerEvents="none" testID=\{`mall-object-floor-theme/);
  assert.match(visuals, /const drawing = artwork[\s\S]*?Image source=\{artwork\} resizeMode="contain"/);
  assert.match(visuals, /<MallObjectFloorTheme[\s\S]*?<Animated\.View style=\{\[s\.illustrationMotion[\s\S]*?zIndex: 1/);
  assert.match(visuals, /objectThemeLayer: \{ \.\.\.StyleSheet\.absoluteFill, zIndex: 0 \}/);
  assert.match(visuals, /if \(!isActive \|\| reducedMotion\)/);
  assert.match(visuals, /objectAnimationDelay/);
});

test('every redeemable shop has a unique, stable facade design for its floor', () => {
  const shops = mallCatalog.MALL_ITEMS.filter(({ category }) => category === 'shop');
  const signatures = shops.map(({ id, floor }) => {
    const art = getMallFloorArtProfile(floor, id);
    return [
      floor,
      art.variant,
      art.roofStyle,
      art.canopyStyle,
      art.signStyle,
      art.windowStyle,
      art.displayStyle,
      art.trimStyle,
    ].join('|');
  });
  const interiorSignatures = shops.map(({ id, floor }) => {
    const art = getMallFloorArtProfile(floor, id);
    return [
      floor,
      art.signStyle,
      art.roofStyle,
      art.canopyStyle,
      art.windowStyle,
      art.displayStyle,
      art.trimStyle,
    ].join('|');
  });
  assert.ok(shops.length > 1000, 'test the complete redeemable-shop catalog, not a small sample');
  assert.equal(new Set(signatures).size, shops.length, 'each shop must get a non-repeating illustrated facade composition');
  assert.equal(new Set(interiorSignatures).size, shops.length, 'each shop must get a non-repeating floor-aware interior composition');
  for (const shop of shops) {
    assert.deepEqual(
      getMallFloorArtProfile(shop.floor, shop.id),
      getMallFloorArtProfile(shop.floor, shop.id),
      `the facade for ${shop.name} must remain stable after navigating away and back`,
    );
  }
});

test('mall and interior screens pass each store floor into theme-aware animated art', () => {
  const mall = fs.readFileSync(path.join(appRoot, 'app/(tabs)/mall.tsx'), 'utf8');
  const page = fs.readFileSync(path.join(appRoot, 'app/mall-shop/[itemId].tsx'), 'utf8');
  const visuals = fs.readFileSync(path.join(appRoot, 'components/MallVisuals.tsx'), 'utf8');
  const interior = fs.readFileSync(path.join(appRoot, 'components/ShopInteriorScene.tsx'), 'utf8');

  assert.match(mall, /itemName=\{item\.name\}[\s\S]*?floor=\{item\.floor\}/);
  assert.match(page, /itemName=\{shop\.name\}[\s\S]*?floor=\{shop\.floor\}/);
  assert.match(page, /shopId=\{shop\.id\}[\s\S]*?floor=\{shop\.floor\}/);
  assert.match(visuals, /<MallStorefrontArt itemId=\{animationSeed\} itemName=\{itemName/);
  assert.match(visuals, /getMallFloorArtProfile\(floor, itemId\)/);
  assert.match(visuals, /storefrontRoofAccent/);
  assert.match(visuals, /storefrontCanopyStripe/);
  assert.match(visuals, /storefrontDisplayProduct/);
  assert.match(interior, /getMallFloorArtProfile\(floor, shopId\)/);
  assert.match(interior, /testID=\{`shop-interior-floor-theme-\$\{floor\}-\$\{shopId\}`\}/);
  assert.match(interior, /Animated\.loop\(Animated\.sequence\(\[[\s\S]*?themeMotion/);
});
