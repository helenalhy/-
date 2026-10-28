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

  assert.equal(assetNames.length, 44, 'four storefront illustrations and forty mall/shop fixtures have mapped artwork');
  assert.equal(new Set(assetNames).size, assetNames.length, 'each mapped artwork path is unique');
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

  assert.match(mallSource, /const isStorefront = item\.category === 'shop'/);
  assert.match(mallSource, /styles\.sceneStoreContactShadow/);
  assert.match(mallSource, /presentation=\{isStorefront && !position\.plaza \? 'mall-storefront' : 'standard'\}/);
  assert.match(mallSource, /sceneStoreName: \{[\s\S]*?backgroundColor: 'rgba\(255,248,239,0\.72\)'/);
  assert.match(visualsSource, /mallStorefrontCanvas: \{ width: 84, height: 63 \}/);
});

test('mall customers render above placed objects without blocking touch input', () => {
  const source = fs.readFileSync(visualsPath, 'utf8');

  assert.match(source, /pointerEvents="none" style=\{\[StyleSheet\.absoluteFill, s\.visitorLayer\]\}/);
  assert.match(source, /visitorLayer: \{ zIndex: 10, elevation: 10 \}/);
});
