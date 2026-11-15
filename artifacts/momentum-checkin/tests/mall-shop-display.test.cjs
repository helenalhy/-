const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');
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
  getCosmeticsTryOnCatalog,
  getShopFixtureProductCatalog,
  SHOP_DISPLAY_SLOT_COUNT,
} = constantsModule.exports;
const tryOnLayoutPath = path.join(__dirname, '../constants/cosmetics-try-on-layout.ts');
const tryOnLayoutOutput = ts.transpileModule(fs.readFileSync(tryOnLayoutPath, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText;
const tryOnLayoutModule = { exports: {} };
new Function('require', 'module', 'exports', tryOnLayoutOutput)(
  require,
  tryOnLayoutModule,
  tryOnLayoutModule.exports,
);
const { getCosmeticsTryOnPreviewLayout } = tryOnLayoutModule.exports;
const displayFixture = {
  id: 'general-display-shelf',
  name: '糖果色展示架',
  description: '擺放相關商品',
};

function getPngAlphaCoverage(png, startY, endY) {
  assert.equal(png.toString('hex', 0, 8), '89504e470d0a1a0a', 'portrait should be a PNG image');
  const width = png.readUInt32BE(16);
  const height = png.readUInt32BE(20);
  assert.equal(png[24], 8, 'portrait should use 8-bit channels');
  assert.equal(png[25], 6, 'portrait should use RGBA pixels');
  assert.equal(png[28], 0, 'portrait should use non-interlaced rows');

  const compressedChunks = [];
  for (let offset = 8; offset < png.length;) {
    const length = png.readUInt32BE(offset);
    const type = png.toString('ascii', offset + 4, offset + 8);
    if (type === 'IDAT') compressedChunks.push(png.subarray(offset + 8, offset + 8 + length));
    offset += length + 12;
    if (type === 'IEND') break;
  }
  const decoded = zlib.inflateSync(Buffer.concat(compressedChunks));
  const stride = width * 4;
  const pixels = Buffer.alloc(height * stride);
  const paeth = (left, above, upperLeft) => {
    const estimate = left + above - upperLeft;
    const leftDistance = Math.abs(estimate - left);
    const aboveDistance = Math.abs(estimate - above);
    const upperLeftDistance = Math.abs(estimate - upperLeft);
    if (leftDistance <= aboveDistance && leftDistance <= upperLeftDistance) return left;
    return aboveDistance <= upperLeftDistance ? above : upperLeft;
  };

  for (let y = 0; y < height; y += 1) {
    const filter = decoded[y * (stride + 1)];
    assert.ok(filter >= 0 && filter <= 4, `portrait row ${y} should use a supported PNG filter`);
    const sourceStart = y * (stride + 1) + 1;
    const rowStart = y * stride;
    for (let index = 0; index < stride; index += 1) {
      const raw = decoded[sourceStart + index];
      const left = index >= 4 ? pixels[rowStart + index - 4] : 0;
      const above = y > 0 ? pixels[rowStart - stride + index] : 0;
      const upperLeft = y > 0 && index >= 4 ? pixels[rowStart - stride + index - 4] : 0;
      const predictor = filter === 1
        ? left
        : filter === 2
          ? above
          : filter === 3
            ? Math.floor((left + above) / 2)
            : filter === 4
              ? paeth(left, above, upperLeft)
              : 0;
      pixels[rowStart + index] = (raw + predictor) & 0xff;
    }
  }

  let visiblePixels = 0;
  for (let y = startY; y < endY; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (pixels[y * stride + x * 4 + 3] > 0) visiblePixels += 1;
    }
  }
  return visiblePixels / (width * (endY - startY));
}

function getGuestAnchorRecords(componentSource) {
  return [...componentSource.matchAll(
    /id: 'guest-(\d+)',\s+source: require\('\.\.\/assets\/images\/(cosmetics-tryon-guest-portrait-\d+)\.png'\),\s+makeup: \{\s*leftEye: \{([^}]+)\},\s*rightEye: \{([^}]+)\},\s*lipsX: ([\d.]+),\s*lipsY: ([\d.]+),\s*\}/g,
  )].map((match) => ({
    id: Number(match[1]),
    source: match[2],
    leftEye: match[3],
    rightEye: match[4],
    lipsX: Number(match[5]),
    lipsY: Number(match[6]),
  }));
}

test('display fixtures are recognized without treating ordinary lamps as shelves', () => {
  assert.equal(canDisplayShopProducts(displayFixture), true);
  assert.equal(canDisplayShopProducts({ id: 'general-warm-lamp', name: '暖光吊燈', description: '照明' }), false);
  assert.equal(SHOP_DISPLAY_SLOT_COUNT, 18);
});

test('cosmetics try-on offers thirty distinct lip and eyeshadow shades, including visible glitter', () => {
  const products = getCosmeticsTryOnCatalog();
  const lipsticks = products.filter(({ illustration }) => illustration === 'lipstick');
  const eyeshadows = products.filter(({ illustration }) => illustration === 'palette');
  assert.equal(lipsticks.length, 30);
  assert.equal(eyeshadows.length, 30);
  assert.equal(new Set(lipsticks.map(({ name }) => name)).size, 30);
  assert.equal(new Set(eyeshadows.map(({ name }) => name)).size, 30);
  assert.equal(new Set(lipsticks.map(({ color }) => color)).size, 30);
  assert.equal(new Set(eyeshadows.map(({ color }) => color)).size, 30);
  assert.ok(lipsticks.filter(({ finish }) => finish === 'glitter').length >= 6);
  assert.ok(eyeshadows.filter(({ finish }) => finish === 'glitter').length >= 6);

  const pink = eyeshadows.find(({ name }) => name === '電光莓粉眼影');
  const purple = eyeshadows.find(({ name }) => name === '午夜深紫眼影');
  const rgb = (hex) => hex.match(/[a-f\d]{2}/gi).map((part) => Number.parseInt(part, 16));
  const contrast = Math.hypot(...rgb(pink.color).map((channel, index) => channel - rgb(purple.color)[index]));
  assert.ok(contrast > 100, 'pink and purple eyeshadows must remain visibly distinct');
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

test('the photo studio receives its own sixty-item clothing and backdrop catalog and live preview', () => {
  const products = getShopFixtureProductCatalog(
    'portrait-photo-studio',
    '寫真館',
    undefined,
    displayFixture,
  );
  assert.equal(products.length, 60);
  assert.ok(products.every(({ theme }) => theme === 'photoStudio'));
  assert.equal(new Set(products.map(({ name }) => name)).size, 60);
  assert.ok(products.some(({ illustration }) => illustration === 'garment'));
  assert.ok(products.some(({ illustration }) => illustration === 'postcard'));
  assert.ok(products.some(({ illustration }) => illustration === 'camera'));

  const component = fs.readFileSync(path.join(__dirname, '../components/PhotoStudioTryOn.tsx'), 'utf8');
  const shopPage = fs.readFileSync(path.join(__dirname, '../app/mall-shop/[itemId].tsx'), 'utf8');
  assert.match(component, /卡通寫真試拍/);
  assert.match(component, /PHOTO_OUTFITS/);
  assert.match(component, /PHOTO_BACKDROPS/);
  assert.match(component, /setOutfitId/);
  assert.match(component, /setBackdropId/);
  assert.match(component, /testID="photo-studio-preview"/);
  assert.match(shopPage, /shop\.id === 'portrait-photo-studio' && <PhotoStudioTryOn \/>/);
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

  const visual = fs.readFileSync(path.join(__dirname, '../components/ShopMerchandiseVisual.tsx'), 'utf8');
  for (const illustration of ['handbag', 'earring', 'watch', 'scarf', 'hairclip', 'shoe', 'wallet', 'necklace', 'towel', 'fan']) {
    assert.match(visual, new RegExp(`product\\.illustration === '${illustration}'`));
  }

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
  assert.ok(lipsticks.length >= 18, 'cosmetics inventory offers a broad lipstick shade selection');
  assert.ok(eyeshadows.length >= 18, 'cosmetics inventory offers a broad eyeshadow shade selection');
  assert.ok(new Set(lipsticks.map(({ color }) => color)).size > 5, 'lipsticks offer many distinct shades');
  assert.ok(new Set(eyeshadows.map(({ color }) => color)).size > 5, 'eyeshadows offer many distinct shades');
});

test('try-on protects the eight portrait crops, responsive sizing, and guest-specific makeup anchors', () => {
  const tryOn = fs.readFileSync(path.join(__dirname, '../components/CosmeticsTryOn.tsx'), 'utf8');
  assert.match(tryOn, /setSelectedLipstickId/);
  assert.match(tryOn, /setSelectedEyeshadowId/);
  assert.match(tryOn, /setSelectedGuestIndex/);
  assert.match(tryOn, /source=\{selectedGuest\.source\}/);
  assert.match(tryOn, /GUEST_PORTRAITS\.map/);
  assert.match(tryOn, /const \{ width \} = useWindowDimensions\(\)/);
  assert.match(tryOn, /getCosmeticsTryOnPreviewLayout\(width\)/);
  assert.match(tryOn, /const compactLayout = previewLayout\.isCompact/);
  assert.match(tryOn, /flexDirection: previewLayout\.direction/);
  assert.match(tryOn, /width: previewLayout\.portraitSize, height: previewLayout\.portraitSize/);
  assert.match(tryOn, /<ScrollView horizontal showsHorizontalScrollIndicator=\{false\} contentContainerStyle=\{styles\.choiceList\}>/);
  assert.match(tryOn, /portraitStage: \{ flexShrink: 0/);
  assert.match(tryOn, /guestPortrait: \{ position: 'absolute', width: '100%', height: '100%'/);
  assert.match(tryOn, /makeupLayer: \{ \.\.\.StyleSheet\.absoluteFill, zIndex: 2/);
  assert.match(tryOn, /viewBox="0 0 120 120"/);
  assert.match(tryOn, /leftEye: \{ centerX:/);
  assert.match(tryOn, /rightEye: \{ centerX:/);
  assert.match(tryOn, /lipsY/);
  assert.match(tryOn, /id: 'guest-2'.*?centerY: 54.*?lipsY: 78/s);
  assert.match(tryOn, /centerY \+ eye\.bend/);
  assert.match(tryOn, /Positive bend follows a downward-curving lid/);
  assert.match(tryOn, /唇色（\$\{lipsticks\.length\}款）/);
  assert.match(tryOn, /眼影（\$\{eyeshadows\.length\}款）/);
  assert.match(tryOn, /cosmetics-try-on-lips/);
  assert.match(tryOn, /cosmetics-try-on-guest-art/);
  assert.match(tryOn, /getEyeSparklePoints/);
  assert.match(tryOn, /getLipSparklePoints/);
  assert.match(tryOn, /<Circle/);
  assert.match(tryOn, /<Path/);
  assert.match(tryOn, /halfWidth/);
  assert.match(tryOn, /fillOpacity=\{0\.56\}/);
  assert.match(tryOn, /fillOpacity=\{0\.68\}/);
  assert.match(tryOn, /resizeMode="cover"/);
  assert.match(tryOn, /cosmetics-try-on-makeup-layer/);
  for (const [viewportWidth, expected] of [
    [320, { isCompact: true, direction: 'column', portraitSize: 148 }],
    [359, { isCompact: true, direction: 'column', portraitSize: 148 }],
    [360, { isCompact: false, direction: 'row', portraitSize: 132 }],
    [390, { isCompact: false, direction: 'row', portraitSize: 132 }],
  ]) {
    const layout = getCosmeticsTryOnPreviewLayout(viewportWidth);
    assert.deepEqual(layout, expected, `portrait should keep its full square size at ${viewportWidth}px`);
  }
  assert.match(tryOn, /width: previewLayout\.portraitSize, height: previewLayout\.portraitSize/);

  const guestAnchors = getGuestAnchorRecords(tryOn);
  assert.equal(guestAnchors.length, 8, 'all eight portraits should define their own makeup anchors');
  for (const [index, guest] of guestAnchors.entries()) {
    const portrait = String(index + 1).padStart(2, '0');
    assert.equal(guest.id, index + 1, 'guest and anchor order should stay aligned');
    assert.equal(guest.source, `cosmetics-tryon-guest-portrait-${portrait}`, `guest ${index + 1} should use its matching portrait`);
    for (const eye of [guest.leftEye, guest.rightEye]) {
      const centerX = Number(eye.match(/centerX: ([\d.]+)/)?.[1]);
      const centerY = Number(eye.match(/centerY: ([\d.]+)/)?.[1]);
      const halfWidth = Number(eye.match(/halfWidth: ([\d.]+)/)?.[1]);
      assert.ok(centerX - halfWidth >= 0 && centerX + halfWidth <= 120, `guest ${index + 1} eye shadow should stay inside the portrait`);
      assert.ok(centerY >= 0 && centerY <= 120, `guest ${index + 1} eye anchor should stay inside the portrait`);
    }
    assert.ok(guest.lipsX >= 0 && guest.lipsX <= 120, `guest ${index + 1} lip anchor should stay inside the portrait`);
    assert.ok(guest.lipsY >= 0 && guest.lipsY <= 120, `guest ${index + 1} lip anchor should stay inside the portrait`);
  }
  assert.equal(new Set(guestAnchors.map(({ leftEye, rightEye, lipsY }) => `${leftEye}${rightEye}${lipsY}`)).size, 8, 'each guest should keep distinct face-position anchors');
  assert.match(tryOn, /const selectedGuest = GUEST_PORTRAITS\[selectedGuestIndex\]/);
  assert.match(tryOn, /source=\{selectedGuest\.source\}/);
  assert.match(tryOn, /getEyeshadowPath\(selectedGuest\.makeup\.leftEye\)/);
  assert.match(tryOn, /getEyeshadowPath\(selectedGuest\.makeup\.rightEye\)/);
  assert.match(tryOn, /getLipstickPath\(selectedGuest\.makeup\.lipsX, selectedGuest\.makeup\.lipsY\)/);
  assert.match(tryOn, /fill=\{selectedEyeshadow\.color\}/);
  assert.match(tryOn, /fill=\{selectedLipstick\.color\}/);
  assert.match(tryOn, /onPress=\{\(\) => onSelect\(product\.id\)\}/);
  assert.match(tryOn, /onPress=\{\(\) => setSelectedGuestIndex\(index\)\}/);
  for (let index = 1; index <= 8; index += 1) {
    const portrait = String(index).padStart(2, '0');
    const portraitPath = path.join(__dirname, `../assets/images/cosmetics-tryon-guest-portrait-${portrait}.png`);
    assert.ok(fs.existsSync(portraitPath), `guest portrait ${portrait} should be available for selection`);
    const portraitPng = fs.readFileSync(portraitPath);
    assert.equal(portraitPng.readUInt32BE(16), 360, `guest portrait ${portrait} should retain its full-size square framing`);
    assert.equal(portraitPng.readUInt32BE(20), 360, `guest portrait ${portrait} should retain its full-size square framing`);
    assert.ok(getPngAlphaCoverage(portraitPng, 0, 30) > 0.05, `guest portrait ${portrait} should retain the top of the head`);
    assert.ok(getPngAlphaCoverage(portraitPng, 330, 360) > 0.6, `guest portrait ${portrait} should retain the shoulders through the bottom crop`);
  }
  assert.match(tryOn, /選擇試妝客人/);
  assert.doesNotMatch(tryOn, /hairCap|hairBangs|eyeRow/);
  assert.match(tryOn, /試色只會改變預覽，不扣金幣/);
  assert.doesNotMatch(tryOn, /useHabits|placeShopInteriorDecoration|setShopInteriorFixtureProduct/);
  const shopPage = fs.readFileSync(path.join(__dirname, '../app/mall-shop/[itemId].tsx'), 'utf8');
  assert.match(shopPage, /shop\.shopType === 'cosmetics'/);
  assert.match(shopPage, /<CosmeticsTryOn products=\{cosmeticsTryOnProducts\}/);
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
  const productArt = {
    '櫻花入浴鹽小罐': 'bathSalt',
    '柚子暖湯香包': 'sachet',
    '檜木香氛沐浴露': 'bottle',
    '溫泉旅館毛巾組': 'towel',
    '櫻花紋浴衣': 'yukata',
    '泡湯竹木按摩梳': 'woodenComb',
    '雪見泡腳木桶組': 'woodenBath',
    '草本蒸氣眼罩': 'mask',
  };
  for (const [name, illustration] of Object.entries(productArt)) {
    assert.equal(products.find((product) => product.name === name)?.illustration, illustration, `${name} should use its matching illustration`);
  }
  const visual = fs.readFileSync(path.join(__dirname, '../components/ShopMerchandiseVisual.tsx'), 'utf8');
  assert.match(visual, /sachet: \{ shape: 'sachet', icon: 'sun' \}/);
  assert.match(visual, /productArtwork\.shape === 'sachet'/);
  assert.deepEqual(
    products.slice(0, 8).map(({ illustration }) => illustration),
    ['bathSalt', 'sachet', 'bottle', 'towel', 'yukata', 'woodenComb', 'woodenBath', 'mask'],
  );
  assert.deepEqual(
    products.slice(56).map(({ id, illustration }) => [id, illustration]),
    [
      ['display-onsen-57', 'bathSoap'],
      ['display-onsen-58', 'bathPouch'],
      ['display-onsen-59', 'woodenBath'],
      ['display-onsen-60', 'yukata'],
    ],
  );
  assert.deepEqual(
    products.map(({ id }) => id),
    Array.from({ length: 60 }, (_, index) => `display-onsen-${index + 1}`),
  );
  assert.ok(products.some(({ name }) => name === '櫻花手工沐浴皂'));
  assert.ok(products.some(({ name }) => name === '檜木洗浴木盆'));

  for (const illustration of ['bathSalt', 'bathPouch', 'bathSoap', 'yukata', 'woodenComb', 'woodenBath']) {
    assert.match(visual, new RegExp(`${illustration}: \\{ shape:`));
    assert.match(visual, new RegExp(`${illustration}: \\{ lift:`));
  }
  assert.match(visual, /useReducedMotion\(\) !== false/);
  assert.match(visual, /reducedMotion \? 0 : motion\.interpolate/);
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
