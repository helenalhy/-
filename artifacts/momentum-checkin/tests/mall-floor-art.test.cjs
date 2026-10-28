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

test('all twenty floors have their own theme name and emblem', () => {
  const profiles = Array.from({ length: 20 }, (_, index) => getMallFloorArtProfile(index + 1, 'theme-check'));
  assert.equal(new Set(MALL_FLOOR_ART_TITLES).size, 20);
  assert.equal(new Set(profiles.map(({ emblem }) => emblem)).size, 20);
  assert.deepEqual(profiles.map(({ title }) => title), MALL_FLOOR_ART_TITLES);
  assert.equal(getMallFloorArtProfile(0, 'fallback').title, MALL_FLOOR_ART_TITLES[0]);
  assert.equal(getMallFloorArtProfile(21, 'fallback').title, MALL_FLOOR_ART_TITLES[19]);
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
