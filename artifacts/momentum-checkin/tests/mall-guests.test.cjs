const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const ts = require('typescript');

const constantsPath = path.join(__dirname, '../constants/mall-guests.ts');
const constantsOutput = ts.transpileModule(fs.readFileSync(constantsPath, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true },
}).outputText;
const guestConstants = { exports: {} };
new Function('require', 'module', 'exports', constantsOutput)(
  (request) => `asset:${request}`,
  guestConstants,
  guestConstants.exports,
);

test('floor guest counts, unique frame positions, routes, and sprite sheets stay aligned', () => {
  const {
    BEAUTY_BAG_GUEST_INDICES,
    COSMETICS_SHOP_FLOOR,
    GUEST_ATLAS_FRAME_WIDTH,
    GUEST_COLUMNS,
    GUEST_COUNTS_BY_FLOOR,
    GUEST_FRAME_CELLS,
    GUEST_FRAME_SIZES_BY_FLOOR,
    GUEST_ROWS,
    GUEST_ROUTES,
    GUEST_SHEETS,
    GUESTS_PER_FLOOR,
  } = guestConstants.exports;
  assert.equal(GUESTS_PER_FLOOR, 10);
  assert.deepEqual(GUEST_COUNTS_BY_FLOOR, [10, 10, 10, 12, 11, 10, 11, 13, 10, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 10]);
  assert.equal(GUEST_ROUTES.length, 13);
  assert.equal(GUEST_FRAME_CELLS.length, GUEST_ROUTES.length);
  assert.ok(GUEST_COUNTS_BY_FLOOR.every((count) => count <= GUEST_ROUTES.length));
  assert.equal(new Set(GUEST_FRAME_CELLS.map(({ column, row }) => `${column},${row}`)).size, GUEST_ROUTES.length);
  assert.equal(GUEST_SHEETS.length, 20);
  assert.equal(GUEST_FRAME_SIZES_BY_FLOOR.length, 20);
  assert.deepEqual(GUEST_FRAME_SIZES_BY_FLOOR[4], { width: 48, height: 64 }, '5F remains the size reference');
  assert.ok(
    GUEST_FRAME_SIZES_BY_FLOOR.slice(9, 19).every(({ width, height }) => width === 36 && height === 60),
    'new floor atlases scale uniformly to match the visible 5F guest height',
  );

  const imageDirectory = path.join(__dirname, '../assets/images');
  const sheetHashes = new Set();
  const sheetPaths = new Set();
  for (let floor = 1; floor <= 20; floor += 1) {
    const asset = GUEST_SHEETS[floor - 1];
    const relativePath = asset.replace(/^asset:\.\.\/assets\/images\//, '');
    sheetPaths.add(relativePath);
    const image = fs.readFileSync(path.join(imageDirectory, relativePath));
    const frameSize = GUEST_FRAME_SIZES_BY_FLOOR[floor - 1];
    if (floor >= 10 && floor <= 19) {
      assert.equal(image.readUInt32BE(16), 512, `floor ${floor} sheet width`);
      assert.equal(image.readUInt32BE(20), 512, `floor ${floor} sheet height`);
      assert.equal(frameSize.width * GUEST_COLUMNS, frameSize.height * GUEST_ROWS, `floor ${floor} uses a uniform scale`);
    } else {
      assert.equal(image.readUInt32BE(16), GUEST_ATLAS_FRAME_WIDTH * GUEST_COLUMNS, `floor ${floor} sheet width`);
      assert.equal(image.readUInt32BE(20), 768, `floor ${floor} sheet height`);
    }
    sheetHashes.add(crypto.createHash('sha256').update(image).digest('hex'));
  }
  assert.equal(sheetPaths.size, 20, 'every floor uses its own shopper sheet');
  assert.equal(sheetHashes.size, 20, 'floor casts should keep their own unique sheets');
});

test('7F cosmetics shoppers carry moving pastel beauty bags', () => {
  const {
    BEAUTY_BAG_GUEST_INDICES,
    COSMETICS_SHOP_FLOOR,
    GUEST_COUNTS_BY_FLOOR,
  } = guestConstants.exports;
  assert.equal(COSMETICS_SHOP_FLOOR, 7);
  assert.deepEqual(BEAUTY_BAG_GUEST_INDICES, [0, 2, 4, 6, 8, 10]);
  assert.equal(new Set(BEAUTY_BAG_GUEST_INDICES).size, BEAUTY_BAG_GUEST_INDICES.length);
  assert.ok(BEAUTY_BAG_GUEST_INDICES.every((index) => index < GUEST_COUNTS_BY_FLOOR[COSMETICS_SHOP_FLOOR - 1]));

  const customerScene = fs.readFileSync(path.join(__dirname, '../components/MallCustomers.tsx'), 'utf8');
  assert.match(customerScene, /floor === COSMETICS_SHOP_FLOOR/);
  assert.match(customerScene, /mall-guest-beauty-bag-/);
  assert.match(customerScene, /Animated\.View/);
  assert.match(customerScene, /candyPink.*candyLavender.*candyPeach.*candySky.*candyMint.*candyCoral/);
});
