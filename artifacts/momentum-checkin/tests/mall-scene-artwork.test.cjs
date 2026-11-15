const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const appRoot = path.join(__dirname, '..');
const visualsPath = path.join(appRoot, 'components/MallVisuals.tsx');

test('mall shops, facilities and decor use the matching illustrated scene assets', () => {
  const source = fs.readFileSync(visualsPath, 'utf8');
  const assetNames = [...source.matchAll(/require\('\.\.\/assets\/images\/(mall-[^']+\.png)'\)/g)]
    .map((match) => match[1]);

  assert.equal(assetNames.length, 45, 'four storefront illustrations and forty-one mall/shop fixtures have mapped artwork');
  const sharedAssets = assetNames.filter((name, index) => assetNames.indexOf(name) !== index);
  assert.deepEqual([...new Set(sharedAssets)], ['mall-craft-station.png'], 'only the two craft-worktable variants share a scene asset');
  for (const assetName of assetNames) {
    const assetPath = path.join(appRoot, 'assets/images', assetName);
    assert.ok(fs.existsSync(assetPath), `missing artwork asset ${assetName}`);
    assert.ok(fs.statSync(assetPath).size > 0, `empty artwork asset ${assetName}`);
  }

  assert.match(source, /Image source=\{artwork\} resizeMode="contain"/);
});

test('storefront animations preserve the original illustrated facades with floor and shop details', () => {
  const source = fs.readFileSync(visualsPath, 'utf8');
  for (const image of ['mall-shop-classic.png', 'mall-shop-arched.png', 'mall-shop-wide.png', 'mall-shop-corner.png']) {
    assert.match(source, new RegExp(`assets/images/${image.replaceAll('.', '\\.')}`));
  }
  assert.match(source, /<MallStorefrontArt itemId=\{animationSeed\} itemName=\{itemName \?\? '特色小店'\} itemIcon=\{icon\} floor=\{floor\} itemColor=\{color\}/);
  assert.match(source, /testID=\{`mall-storefront-art-\$\{floor\}-\$\{itemId\}`\}/);
  assert.match(source, /source=\{facade\}[\s\S]*?style=\{s\.storefrontArtworkImage\}/);
  assert.match(source, /SHOP_FACADE_ARTWORK\[art\.variant % SHOP_FACADE_ARTWORK\.length\]/);
  assert.match(source, /getMallFloorArtProfile\(floor, itemId\)/);
  assert.match(source, /style=\{\[s\.storefrontFloorEmblem, \{ backgroundColor: art\.accent/);
  assert.match(source, /storefrontSignText:[\s\S]*?fontWeight: '900'/);
  assert.match(source, /storefrontDisplayTagLeft/);
  assert.match(source, /storefrontDisplayTagRight/);
  assert.match(source, /useReducedMotion\(\) !== false/);
  assert.match(source, /if \(!isActive \|\| reducedMotion\)/);
});

test('placed storefronts fill their mall bays and rest on a floor contact shadow', () => {
  const mallSource = fs.readFileSync(path.join(appRoot, 'app/(tabs)/mall.tsx'), 'utf8');
  const visualsSource = fs.readFileSync(visualsPath, 'utf8');
  const interiorSource = fs.readFileSync(path.join(appRoot, 'components/ShopInteriorScene.tsx'), 'utf8');
  const facadeAssets = ['mall-shop-classic.png', 'mall-shop-arched.png', 'mall-shop-wide.png', 'mall-shop-corner.png'];

  assert.match(mallSource, /const isStorefront = item\.category === 'shop'/);
  assert.match(mallSource, /styles\.sceneStoreContactShadow/);
  assert.match(mallSource, /sceneObjectContactShadow/);
  assert.match(mallSource, /isStorefront \? \([\s\S]*?sceneStoreContactShadow[\s\S]*?\) : \([\s\S]*?sceneObjectContactShadow/);
  assert.match(mallSource, /height: position\.plaza \? 30 : isStorefront \? 74 : 47/);
  assert.match(mallSource, /presentation=\{isStorefront && !position\.plaza \? 'mall-storefront' : 'standard'\}/);
  assert.match(mallSource, /sceneStorefrontBadge: \{ width: '100%' \}/);
  assert.match(mallSource, /sceneStoreName: \{[\s\S]*?backgroundColor: 'rgba\(255,248,239,0\.72\)'/);
  assert.match(visualsSource, /mallStorefrontCanvas: \{ width: '100%', aspectRatio: 1 \}/);
  assert.match(visualsSource, /mallStorefrontMotion: \{ width: '100%', aspectRatio: 1 \}/);
  assert.match(visualsSource, /storefrontArt: \{ width: '100%', height: '100%'/);
  assert.doesNotMatch(visualsSource, /sceneObjectContactShadow|sceneStoreContactShadow/);
  assert.doesNotMatch(interiorSource, /sceneObjectContactShadow|sceneStoreContactShadow/);

  const narrowMallArtworkWidth = 300;
  const narrowStorefrontBayWidth = narrowMallArtworkWidth * 0.26;
  assert.ok(narrowStorefrontBayWidth < 84, 'a 300px phone scene has store bays narrower than the old fixed artwork');
  assert.ok(narrowStorefrontBayWidth > 0, 'the art now scales to each narrow store bay');
  for (const filename of facadeAssets) {
    const png = fs.readFileSync(path.join(appRoot, 'assets/images', filename));
    assert.equal(png.toString('ascii', 1, 4), 'PNG');
    const width = png.readUInt32BE(16);
    const height = png.readUInt32BE(20);
    assert.ok(width < 256 && height < 192, `${filename} has had its transparent margins trimmed`);
  }
  assert.match(mallSource, /<Text numberOfLines=\{isStorefront && !position\.plaza \? 2 : 1\} ellipsizeMode="tail"/);
  assert.match(visualsSource, /storefrontSignText: \{ maxWidth: '100%', flexShrink: 1, fontSize: 5/);
});

test('mall motion effects stop cleanly when reduced motion is enabled', () => {
  const mallSource = fs.readFileSync(path.join(appRoot, 'app/(tabs)/mall.tsx'), 'utf8');
  const visualsSource = fs.readFileSync(visualsPath, 'utf8');

  assert.match(visualsSource, /if \(!isActive \|\| reducedMotion\)/);
  assert.match(visualsSource, /const reducedMotion = useReducedMotion\(\) !== false;[\s\S]*?if \(reducedMotion\) \{\s*shimmer\.setValue\(0\.25\)/);
  assert.match(mallSource, /const reducedMotion = useReducedMotion\(\) !== false;/);
  assert.match(mallSource, /if \(reducedMotion\) \{\s*popIn\.setValue\(1\);\s*fadeIn\.setValue\(item \? 1 : 0\)/);
});

test('mall customers render above placed objects without blocking touch input', () => {
  const source = fs.readFileSync(visualsPath, 'utf8');

  assert.match(source, /pointerEvents="none" style=\{\[StyleSheet\.absoluteFill, s\.visitorLayer\]\}/);
  assert.match(source, /visitorLayer: \{ zIndex: 10, elevation: 10 \}/);
});
