const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

function loadDogStaffStyles() {
  const source = ts.transpileModule(
    fs.readFileSync(path.join(__dirname, '../constants/dog-staff-customization.ts'), 'utf8'),
    { compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true } },
  ).outputText;
  const module = { exports: {} };
  new Function('require', 'module', 'exports', source)(
    (name) => name === './colors' ? { light: new Proxy({}, { get: () => '#f0f0f0' }) } : require(name),
    module,
    module.exports,
  );
  return module.exports;
}
const dogStaffStyles = loadDogStaffStyles();
const dogFoodsSource = ts.transpileModule(
  fs.readFileSync(path.join(__dirname, '../constants/dog-staff-foods.ts'), 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true } },
).outputText;
const dogFoodsModule = { exports: {} };
new Function('module', 'exports', dogFoodsSource)(dogFoodsModule, dogFoodsModule.exports);
const { DOG_STAFF_FOOD_OPTIONS } = dogFoodsModule.exports;
const constantsSource = ts.transpileModule(
  fs.readFileSync(path.join(__dirname, '../constants/mall-shop-interior.ts'), 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true } },
).outputText;
const constantsModule = { exports: {} };
new Function('require', 'module', 'exports', constantsSource)(
  (name) => {
    if (name === './colors') return { light: new Proxy({}, { get: () => '#f0f0f0' }) };
    if (name === './dog-staff-customization') return dogStaffStyles;
    return require(name);
  },
  constantsModule,
  constantsModule.exports,
);
const {
  getShopInteriorSceneKey,
  SHOP_INTERIOR_AREAS,
  SHOP_INTERIOR_SLOTS,
  SHOP_INTERIOR_PLACEMENT_IDS,
  getShopInteriorPlacementId,
  parseShopInteriorPlacementId,
  getShopInteriorAreaPlacements,
} = constantsModule.exports;

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
    ['theme-floor-15-shop-1', '櫻花暖湯紀念店', 'kimono'],
  ];
  for (const [id, name, expected] of specialtyCases) {
    assert.equal(getShopInteriorSceneKey('general', id, name), expected, `${id} uses ${expected} room`);
  }
  for (const type of [
    'womenswear', 'bridal', 'eveningwear', 'kimono', 'supermarket',
    'hyakuen', 'swimwear', 'cosplay', 'electronics', 'boutique',
    'cosmetics',
  ]) {
    assert.equal(getShopInteriorSceneKey(type), type);
  }
  assert.equal(getShopInteriorSceneKey('general', 'unclassified-shop', '小店'), 'general');
  assert.equal(getShopInteriorSceneKey('general', 'tea-room', '花草茶'), 'tea');
});

test('interior page retains accessible slots and routes placement operations through the selected area key', () => {
  const page = fs.readFileSync(path.join(__dirname, '../app/mall-shop/[itemId].tsx'), 'utf8');
  const scene = fs.readFileSync(path.join(__dirname, '../components/ShopInteriorScene.tsx'), 'utf8');
  assert.match(page, /<ShopInteriorScene/);
  assert.match(page, /onSelectSlot=\{\(slot\) => \{[\s\S]*?setSelectedSlot\(slot\);/);
  assert.match(page, /placeShopInteriorDecoration\(shop\.id, decorationId, selectedPlacementId\)/);
  assert.match(page, /storeShopInteriorDecoration\(shop\.id, selectedPlacementId\)/);
  assert.match(page, /placements=\{areaPlacements\}/);
  assert.match(page, /getShopInteriorAreaPlacements\(placements, selectedArea\)/);
  assert.match(page, /testID="shop-interior-area-prev"/);
  assert.match(page, /testID="shop-interior-area-next"/);
  const slotIds = SHOP_INTERIOR_SLOTS.map(({ id }) => id);
  assert.deepEqual(slotIds, ['front-window', 'left-wall', 'center', 'right-wall', 'back-wall', 'counter', 'left-table', 'right-table']);
  assert.match(scene, /<Pressable\s+key=\{slot\.id\}[\s\S]*?accessibilityRole="button"[\s\S]*?style=\{\[styles\.hotspot/);
  assert.match(scene, /accessible\s+accessibilityRole="button"/);
  assert.match(scene, /accessibilityLabel=/);
  assert.match(scene, /accessibilityState=\{\{ selected \}\}/);
  assert.match(scene, /操作結果：\$\{accessibilityResult\}/);
  assert.match(scene, /AccessibilityInfo\.setAccessibilityFocus\(node\)/);
  assert.match(scene, /\?\.focus\?\.\(\)/);
});

test('every shop interior keeps its specialty illustration and adds a unique floor-aware design', () => {
  const scene = fs.readFileSync(path.join(__dirname, '../components/ShopInteriorScene.tsx'), 'utf8');
  assert.match(scene, /source=\{SHOP_ROOM_IMAGES\[sceneKey\]\}/, 'keep the correct illustrated room for each shop category');
  assert.match(scene, /import \{ SHOP_ROOM_IMAGES \} from '@\/constants\/shop-room-images'/);
  assert.match(scene, /getMallFloorArtProfile\(floor, shopId\)/, 'use the shop identity and its actual floor');
  assert.match(scene, /testID=\{`shop-interior-identity-\$\{floor\}-\$\{shopId\}`\}/);
  assert.match(scene, /testID=\{`shop-interior-display-\$\{floor\}-\$\{shopId\}`\}/);
  assert.match(scene, /floorArt\.signStyle/);
  assert.match(scene, /floorArt\.roofStyle/);
  assert.match(scene, /floorArt\.canopyStyle/);
  assert.match(scene, /floorArt\.windowStyle/);
  assert.match(scene, /floorArt\.displayStyle/);
  assert.match(scene, /floorArt\.trimStyle/);
  assert.match(scene, /pointerEvents="none"[\s\S]*?styles\.interiorWallDisplay/);
});

test('six areas each expose eight slots (48 total) and legacy/main placements remain backward compatible', () => {
  assert.equal(SHOP_INTERIOR_AREAS.length, 6);
  assert.equal(SHOP_INTERIOR_SLOTS.length, 8);
  assert.equal(SHOP_INTERIOR_AREAS.length * SHOP_INTERIOR_SLOTS.length, 48);
  assert.equal(SHOP_INTERIOR_PLACEMENT_IDS.length, 48);
  for (const slot of SHOP_INTERIOR_SLOTS) {
    assert.equal(getShopInteriorPlacementId('main', slot.id), slot.id);
    assert.deepEqual(parseShopInteriorPlacementId(slot.id), { areaId: 'main', slotId: slot.id });
  }
  assert.equal(getShopInteriorPlacementId('extension-3', 'left-table'), 'extension-3:left-table');
  assert.deepEqual(parseShopInteriorPlacementId('extension-3:left-table'), { areaId: 'extension-3', slotId: 'left-table' });
  assert.equal(parseShopInteriorPlacementId('extension-8:left-table'), null);
  assert.equal(parseShopInteriorPlacementId('extension-3:unknown'), null);
});

test('cafe dog staff can walk in all six areas without using furniture slots', () => {
  assert.equal(dogStaffStyles.DOG_STAFF_PROFILES.length, 14);
  assert.equal(dogStaffStyles.DOG_STAFF_ROUTES.length, 14);
  assert.ok(SHOP_INTERIOR_AREAS.every(({ id }) => dogStaffStyles.isDogStaffAreaId(id)));
  assert.equal(dogStaffStyles.getDogStaffAreaLabel('main'), '主區');
  assert.equal(dogStaffStyles.getDogStaffAreaLabel('extension-5'), '延伸區 5');
  const scene = fs.readFileSync(path.join(__dirname, '../components/ShopInteriorScene.tsx'), 'utf8');
  const page = fs.readFileSync(path.join(__dirname, '../app/mall-shop/[itemId].tsx'), 'utf8');
  const customizer = fs.readFileSync(path.join(__dirname, '../components/DogStaffCustomizer.tsx'), 'utf8');
  const imageEnd = scene.indexOf('</ImageBackground>');
  const staffWalkers = scene.indexOf('<WalkingStaffDog');
  assert.ok(imageEnd >= 0 && staffWalkers >= 0 && staffWalkers < imageEnd, 'dogs walk inside the selected room image');
  assert.doesNotMatch(scene, /dog-staff-scene-dock/);
  assert.match(scene, /sceneKey === 'cafe'/);
  assert.match(scene, /DOG_STAFF_PROFILES/);
  assert.match(scene, /dogStaffPlacements\?\.\[dog\.decorationId\] !== areaId/);
  assert.match(scene, /testID=\{`dog-staff-walker-\$\{dog\.key\}`\}/);
  assert.match(scene, /useReducedMotion/);
  assert.match(scene, /dog-staff-interaction-sheet/);
  assert.match(scene, /兌換後附送/);
  assert.match(scene, /onPress=\{onPress\}/);
  assert.match(page, /areaId=\{selectedArea\}/);
  assert.match(page, /setSelectedArea\(areaId\)/);
  assert.match(customizer, /SHOP_INTERIOR_AREAS\.map/);
  assert.match(customizer, /餵食每次 5 金幣/);
  assert.match(customizer, /onOpenDogCompanion/);
});

test('dog outfit previews and controls stay clear and operable on narrow screens', () => {
  const customizer = fs.readFileSync(path.join(__dirname, '../components/DogStaffCustomizer.tsx'), 'utf8');
  const attendant = fs.readFileSync(path.join(__dirname, '../components/DogAttendant.tsx'), 'utf8');

  assert.match(customizer, /<ScrollView\s+horizontal[\s\S]*?contentContainerStyle=\{styles\.dogPicker\}/);
  assert.match(customizer, /dogChipPreview: \{ width: 54, height: 48/);
  assert.match(customizer, /lookPreview: \{ width: 68, height: 60,[^}]*\}/);
  assert.doesNotMatch(customizer.match(/lookPreview: \{[^}]*\}/)?.[0] ?? '', /overflow: 'hidden'/);
  assert.match(customizer, /lookCard: \{ width: '48%', minHeight: 132/);
  assert.match(customizer, /LOOKS_PER_PAGE = 10/);
  assert.match(customizer, /tabs: \{ flexDirection: 'row', gap: 6 \}/);
  assert.match(customizer, /tab: \{ flex: 1, minWidth: 0, minHeight: 44/);
  assert.match(customizer, /actionRow: \{ flexDirection: 'row', flexWrap: 'wrap'/);
  assert.match(customizer, /actionButton: \{ minHeight: 44/);
  assert.match(customizer, /storeButton: \{ minHeight: 44/);
  assert.match(attendant, /canvas: \{ width: 50, height: 45/);
});

test('all fourteen dogs get distinct illustrated care colors and five-second action animations', () => {
  const scene = fs.readFileSync(path.join(__dirname, '../components/ShopInteriorScene.tsx'), 'utf8');
  const colorBlock = scene.match(/const DOG_CARE_COLOR_TOKENS:[\s\S]*?\n};/)?.[0];
  assert.ok(colorBlock, 'the dog-specific care color map exists');
  const colors = [...colorBlock.matchAll(/'([^']+)': '([^']+)'/g)]
    .map(([, dogKey, colorToken]) => [dogKey, colorToken]);
  assert.equal(colors.length, 14);
  assert.equal(new Set(colors.map(([, token]) => token)).size, 14, 'every dog uses a distinct color');
  assert.deepEqual(
    colors.map(([dogKey]) => dogKey).sort(),
    dogStaffStyles.DOG_STAFF_PROFILES.map(({ key }) => key).sort(),
    'every café dog has a dedicated color',
  );
  const colorByDog = Object.fromEntries(colors);
  assert.equal(colorByDog['fluffy-staff-huahua'], 'candyPink');
  assert.equal(colorByDog['fluffy-staff-milkshake'], 'candyLavender');
  assert.equal(colorByDog['fluffy-staff-pudding'], 'candyOrange');
  assert.equal(colorByDog['fluffy-staff-xiaoniu'], 'candySky');
  assert.match(scene, /DOG_STAFF_INTERACTION_DURATION_MS = 5000/);
  assert.match(scene, /iterations: DOG_STAFF_INTERACTION_DURATION_MS \/ cycleDuration/);
  assert.match(scene, /interactionActions: \{[^}]*flexWrap: 'wrap'/);
  assert.match(scene, /interactionAction: \{ width: '47%'/);
  assert.match(scene, /testID="dog-care-icon-comb"/);
  assert.match(scene, /testID="dog-care-icon-food"/);
  assert.match(scene, /testID="dog-care-icon-pet"/);
  assert.match(scene, /testID="dog-care-icon-ball"/);
  assert.match(scene, /每次互動約 5 秒/);
});

test('every café dog has eight safe food choices and exactly one favorite', () => {
  const profileKeys = dogStaffStyles.DOG_STAFF_PROFILES.map(({ key }) => key).sort();
  assert.deepEqual(Object.keys(DOG_STAFF_FOOD_OPTIONS).sort(), profileKeys);
  const everyFood = Object.values(DOG_STAFF_FOOD_OPTIONS).flat();
  assert.equal(everyFood.length, 112);
  assert.ok(everyFood.every(({ illustration }) => typeof illustration === 'string'), 'every food has a cartoon illustration kind');
  assert.ok(!everyFood.some(({ name }) => /朱古力|提子|洋蔥|糖果|砂糖/.test(name)), 'unsafe foods are excluded');
  for (const dogKey of profileKeys) {
    const foods = DOG_STAFF_FOOD_OPTIONS[dogKey];
    assert.equal(foods.length, 8, `${dogKey} has eight food choices`);
    assert.equal(new Set(foods.map(({ id }) => id)).size, 8, `${dogKey} has no repeated food IDs`);
    assert.equal(new Set(foods.map(({ name }) => name)).size, 8, `${dogKey} has no repeated food names`);
    assert.equal(foods.filter(({ favorite }) => favorite).length, 1, `${dogKey} has one favorite`);
  }
  const huahuaChicken = DOG_STAFF_FOOD_OPTIONS['fluffy-staff-huahua'].find(({ name }) => name.includes('雞肉'));
  assert.equal(huahuaChicken?.illustration, 'chicken');
  assert.equal(huahuaChicken?.favorite, true);
  assert.equal(DOG_STAFF_FOOD_OPTIONS['fluffy-staff-milkshake'].find(({ favorite }) => favorite)?.name, '凍乾三文魚');
  assert.equal(DOG_STAFF_FOOD_OPTIONS['fluffy-staff-xiaoniu'].find(({ favorite }) => favorite)?.name, '骨頭餅乾');
  assert.equal(DOG_STAFF_FOOD_OPTIONS['fluffy-staff-wonton'].find(({ favorite }) => favorite)?.name, '雞肉雲吞');
  const scene = fs.readFileSync(path.join(__dirname, '../components/ShopInteriorScene.tsx'), 'utf8');
  assert.match(scene, /每隻狗都有 8 款專屬小食/);
  assert.match(scene, /food\.illustration/);
  assert.match(scene, /dog-food-illustration-\$\{food\.id\}/);
  assert.match(scene, /food=\{interaction\.food\}[\s\S]*?testID="dog-care-selected-food"/);
});

test('grooming and petting give the walking dog a closed-eye smile', () => {
  const scene = fs.readFileSync(path.join(__dirname, '../components/ShopInteriorScene.tsx'), 'utf8');
  const dog = fs.readFileSync(path.join(__dirname, '../components/DogAttendant.tsx'), 'utf8');
  assert.match(scene, /happy=\{interaction\?\.action === 'groom' \|\| interaction\?\.action === 'pet'\}/);
  assert.match(dog, /happy = false/);
  assert.match(dog, /happy \? s\.happyEye : s\.eye/);
  assert.match(dog, /happy \? c\.candyPink : look\.marking/);
  assert.match(dog, /happySmile/);
});

const anchorSource = ts.transpileModule(
  fs.readFileSync(path.join(__dirname, '../constants/mall-shop-scene-anchors.ts'), 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true } },
).outputText;
const anchorModule = { exports: {} };
new Function('require', 'module', 'exports', anchorSource)(require, anchorModule, anchorModule.exports);
const {
  SCENE_ANCHORS,
  classifyDecoration,
  resolveObjectAnchor,
  mapCoverPoint,
  clampHotspotPoint,
  separateHotspotPoints,
} = anchorModule.exports;

test('every one of twenty-two scenes defines in-bounds anchors for all eight slots', () => {
  const slots = ['front-window', 'left-wall', 'center', 'right-wall', 'back-wall', 'counter', 'left-table', 'right-table'];
  assert.equal(Object.keys(SCENE_ANCHORS).length, 22);
  for (const [scene, anchors] of Object.entries(SCENE_ANCHORS)) {
    assert.deepEqual(Object.keys(anchors).sort(), [...slots].sort(), scene);
    for (const { table, floor } of Object.values(anchors)) {
      for (const p of [table, floor]) assert.ok(p.x >= 0 && p.x <= 1 && p.y >= 0.1 && p.y <= 1, scene);
      assert.ok(floor.y >= table.y - 0.001, `${scene} floor is not above table`);
    }
  }
});

test('all 22 shop illustrations fit the scene and keep every slot marker visible in portrait and landscape', () => {
  const scene = fs.readFileSync(path.join(__dirname, '../components/ShopInteriorScene.tsx'), 'utf8');
  const roomAssetsSource = fs.readFileSync(path.join(__dirname, '../constants/shop-room-images.ts'), 'utf8');
  const sceneAssets = [...roomAssetsSource.matchAll(/require\('\.\.\/assets\/images\/(shop-room-[^']+\.jpg)'\)/g)]
    .map(([, asset]) => asset);
  assert.equal(sceneAssets.length, 22);
  assert.equal(new Set(sceneAssets).size, 22);
  for (const asset of sceneAssets) {
    const assetPath = path.join(__dirname, '../assets/images', asset);
    assert.ok(fs.existsSync(assetPath), `missing scene illustration ${asset}`);
    assert.ok(fs.statSync(assetPath).size > 0, `empty scene illustration ${asset}`);
  }
  assert.match(scene, /imageStage: \{[^}]*maxWidth: 510, aspectRatio: 1/);

  for (const [sceneKey, anchors] of Object.entries(SCENE_ANCHORS)) {
    for (const anchorClass of ['table', 'floor']) {
      for (const width of [320, 375, 430, 510]) {
        const points = separateHotspotPoints(
          Object.values(anchors).map((anchor) => mapCoverPoint(anchor[anchorClass], width, width)),
          width,
          width,
        );
        for (const [index, point] of points.entries()) {
          assert.ok(point.x >= 42 && point.x <= width - 42, `${sceneKey}/${anchorClass}/${index} horizontal bounds at ${width}px`);
          assert.ok(point.y >= 50 && point.y <= width - 18, `${sceneKey}/${anchorClass}/${index} vertical bounds at ${width}px`);
          for (const other of points.slice(0, index)) {
            assert.ok(
              Math.abs(point.x - other.x) >= 84 || Math.abs(point.y - other.y) >= 58,
              `${sceneKey}/${anchorClass} controls do not overlap at ${width}px`,
            );
          }
        }
      }
    }
  }
});

test('equipment classification: espresso is tabletop, oven/cabinets/staff are floor', () => {
  assert.equal(classifyDecoration({ id: 'general-equipment-cafe-espresso-machine', visual: 'coffee-machine', itemKind: 'equipment' }).cls, 'tabletop');
  assert.ok(classifyDecoration({ id: 'x-espresso-machine', visual: 'coffee-machine' }).scale <= 0.85, 'coffee machine is not enlarged');
  assert.equal(classifyDecoration({ id: 'bakery-oven', visual: 'bakery-oven' }).cls, 'floor');
  assert.equal(classifyDecoration({ id: 'ice-cream-freezer', visual: 'ice-cream-machine' }).cls, 'floor');
  assert.equal(
    classifyDecoration({ id: 'general-equipment-onsen-sakura-onsen-pool', visual: 'onsen-bath' }).cls,
    'floor',
    'the hot spring basin should occupy floor space rather than a shelf',
  );
  assert.equal(classifyDecoration({ id: 'fluffy-staff-butter', visual: 'dog-staff-butter' }).cls, 'floor');
  assert.equal(classifyDecoration({ id: 'picture-wall', name: '手繪商品畫框組', visual: 'gallery-frames' }).cls, 'wall');
  assert.equal(classifyDecoration({ id: 'tops-wardrobe', visual: 'clothing-wardrobe' }).cls, 'floor');
});

test('cafe coffee machine lands on the right counter top; new side-table slots use real tables', () => {
  const counter = resolveObjectAnchor('cafe', 'counter', 'tabletop');
  assert.ok(counter.x > 0.65 && counter.y > 0.5 && counter.y < 0.62, 'counter top on right side');
  const floor = resolveObjectAnchor('cafe', 'counter', 'floor');
  assert.ok(floor.y > counter.y + 0.2, 'floor anchor is separate');
  const window = SCENE_ANCHORS.cafe['front-window'].table;
  assert.ok(Math.abs(window.x - counter.x) > 0.2, 'counter slot is not at the window');
  const leftTable = resolveObjectAnchor('cafe', 'left-table', 'tabletop');
  const rightTable = resolveObjectAnchor('cafe', 'right-table', 'tabletop');
  assert.ok(leftTable.x < 0.3 && leftTable.y > 0.5 && leftTable.y < 0.7);
  assert.ok(rightTable.x > 0.8 && rightTable.y > 0.5 && rightTable.y < 0.7);
  const mapped = mapCoverPoint(counter, 360, 383);
  assert.ok(mapped.x > 250 && mapped.y > 200);
});

test('extension placement keys filter, render, move and store independently of other areas', () => {
  const legacy = { counter: 'coffee-machine' };
  const allPlacements = {
    ...legacy,
    'extension-2:right-table': 'flower-vase',
    'extension-4:left-wall': 'wall-art',
  };
  assert.deepEqual(getShopInteriorAreaPlacements(allPlacements, 'main'), { counter: 'coffee-machine' });
  assert.deepEqual(getShopInteriorAreaPlacements(allPlacements, 'extension-2'), { 'right-table': 'flower-vase' });
  const movedKey = getShopInteriorPlacementId('extension-5', 'left-table');
  const moved = Object.fromEntries(Object.entries(allPlacements).filter(([, id]) => id !== 'flower-vase'));
  moved[movedKey] = 'flower-vase';
  assert.deepEqual(getShopInteriorAreaPlacements(moved, 'extension-2'), {});
  assert.deepEqual(getShopInteriorAreaPlacements(moved, 'extension-5'), { 'left-table': 'flower-vase' });
  const stored = Object.fromEntries(Object.entries(moved).filter(([key]) => key !== movedKey));
  assert.deepEqual(stored, { counter: 'coffee-machine', 'extension-4:left-wall': 'wall-art' });
  const scene = fs.readFileSync(path.join(__dirname, '../components/ShopInteriorScene.tsx'), 'utf8');
  assert.match(scene, /SHOP_INTERIOR_SLOTS\.map/);
  assert.match(scene, /placements\[slot\.id\]/);
});

test('scene renders objects with MallObjectVisual, contact shadow only, and keeps hotspots accessible', () => {
  const scene = fs.readFileSync(path.join(__dirname, '../components/ShopInteriorScene.tsx'), 'utf8');
  assert.match(scene, /<MallObjectVisual/);
  assert.match(scene, /resolveObjectAnchor\(sceneKey, slot\.id/);
  assert.match(scene, /contactShadow/);
  assert.doesNotMatch(scene, /floorBase|tableBase|shelfBase/);
});
