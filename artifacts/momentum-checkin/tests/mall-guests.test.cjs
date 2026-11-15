const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const zlib = require('node:zlib');
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

function readRgbaPng(filePath) {
  const png = fs.readFileSync(filePath);
  let width;
  let height;
  let bitDepth;
  let colorType;
  let interlace;
  const compressed = [];
  for (let offset = 8; offset < png.length;) {
    const length = png.readUInt32BE(offset);
    const type = png.toString('ascii', offset + 4, offset + 8);
    const data = png.subarray(offset + 8, offset + 8 + length);
    if (type === 'IHDR') {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      bitDepth = data[8];
      colorType = data[9];
      interlace = data[12];
    } else if (type === 'IDAT') {
      compressed.push(data);
    }
    offset += length + 12;
    if (type === 'IEND') break;
  }
  assert.equal(bitDepth, 8, `${path.basename(filePath)} should use 8-bit pixels`);
  assert.equal(colorType, 6, `${path.basename(filePath)} should retain its RGBA transparency`);
  assert.equal(interlace, 0, `${path.basename(filePath)} should be non-interlaced`);
  const raw = zlib.inflateSync(Buffer.concat(compressed));
  const stride = width * 4;
  const pixels = Buffer.alloc(height * stride);
  const paeth = (left, above, upperLeft) => {
    const estimate = left + above - upperLeft;
    const leftDistance = Math.abs(estimate - left);
    const aboveDistance = Math.abs(estimate - above);
    const upperLeftDistance = Math.abs(estimate - upperLeft);
    if (leftDistance <= aboveDistance && leftDistance <= upperLeftDistance) return left;
    if (aboveDistance <= upperLeftDistance) return above;
    return upperLeft;
  };
  for (let y = 0; y < height; y += 1) {
    const sourceOffset = y * (stride + 1);
    const filter = raw[sourceOffset];
    const rowOffset = y * stride;
    const previousOffset = rowOffset - stride;
    for (let i = 0; i < stride; i += 1) {
      const value = raw[sourceOffset + 1 + i];
      const left = i >= 4 ? pixels[rowOffset + i - 4] : 0;
      const above = y > 0 ? pixels[previousOffset + i] : 0;
      const upperLeft = y > 0 && i >= 4 ? pixels[previousOffset + i - 4] : 0;
      let predictor = 0;
      if (filter === 1) predictor = left;
      else if (filter === 2) predictor = above;
      else if (filter === 3) predictor = Math.floor((left + above) / 2);
      else if (filter === 4) predictor = paeth(left, above, upperLeft);
      else assert.equal(filter, 0, `unsupported PNG filter ${filter}`);
      pixels[rowOffset + i] = (value + predictor) & 0xff;
    }
  }
  return { width, height, pixels };
}

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

test('new-floor shopper edges stay clean and match the 5F visible height on mobile', () => {
  const { GUEST_COUNTS_BY_FLOOR, GUEST_FRAME_CELLS } = guestConstants.exports;
  const imageDirectory = path.join(__dirname, '../assets/images');
  const visibleHeights = (floor) => {
    const file = floor === 10 ? 'guests-floor-10-carnival.png' : `guests-floor-${floor}.png`;
    const { width, height, pixels } = readRgbaPng(path.join(imageDirectory, file));
    const cellWidth = width / 5;
    const cellHeight = height / 3;
    const displayHeight = floor === 5 ? 64 : 60;
    const count = GUEST_COUNTS_BY_FLOOR[floor - 1];
    const heights = [];
    for (const { column, row } of GUEST_FRAME_CELLS.slice(0, count)) {
      const left = Math.round(column * cellWidth);
      const right = Math.round((column + 1) * cellWidth);
      const top = Math.round(row * cellHeight);
      const bottom = Math.round((row + 1) * cellHeight);
      let firstVisibleRow = bottom;
      let lastVisibleRow = top - 1;
      for (let y = top; y < bottom; y += 1) {
        for (let x = left; x < right; x += 1) {
          if (pixels[(y * width + x) * 4 + 3] > 32) {
            firstVisibleRow = Math.min(firstVisibleRow, y);
            lastVisibleRow = Math.max(lastVisibleRow, y);
          }
        }
      }
      if (lastVisibleRow >= firstVisibleRow) {
        heights.push((lastVisibleRow - firstVisibleRow + 1) / cellHeight * displayHeight);
      }
    }
    return heights;
  };
  const referenceHeight = visibleHeights(5).reduce((sum, height) => sum + height, 0) / visibleHeights(5).length;
  for (let floor = 10; floor <= 19; floor += 1) {
    const file = floor === 10 ? 'guests-floor-10-carnival.png' : `guests-floor-${floor}.png`;
    const { pixels } = readRgbaPng(path.join(imageDirectory, file));
    for (let i = 0; i < pixels.length; i += 4) {
      const [red, green, blue, alpha] = pixels.subarray(i, i + 4);
      assert.ok(
        !(alpha > 0 && alpha < 250 && green > 80 && green > Math.max(red, blue) * 1.25),
        `${file} contains a visible green-screen edge`,
      );
    }
    const heights = visibleHeights(floor);
    const averageHeight = heights.reduce((sum, height) => sum + height, 0) / heights.length;
    assert.ok(
      Math.abs(averageHeight - referenceHeight) <= 3,
      `${floor}F visible height ${averageHeight.toFixed(1)}px should match 5F at ${referenceHeight.toFixed(1)}px`,
    );
  }
});

test('10F–19F shopper routes stay inside common phone-sized scenes', () => {
  const {
    GUEST_FRAME_SIZES_BY_FLOOR,
    GUEST_ROUTES,
    getGuestRouteBounds,
  } = guestConstants.exports;
  for (const sceneSize of [320, 360, 375, 390, 402, 430]) {
    for (let floor = 10; floor <= 19; floor += 1) {
      const frameSize = GUEST_FRAME_SIZES_BY_FLOOR[floor - 1];
      for (const route of GUEST_ROUTES.slice(0, 13)) {
        const bounds = getGuestRouteBounds(route, frameSize, sceneSize);
        assert.ok(bounds.fromX >= 0 && bounds.fromX + frameSize.width <= sceneSize);
        assert.ok(bounds.toX >= 0 && bounds.toX + frameSize.width <= sceneSize);
        assert.ok(bounds.top >= 0 && bounds.top + frameSize.height <= sceneSize);
      }
    }
  }
});

test('7F beauty totes belong to the full original cast without extra animated layers', () => {
  const {
    BEAUTY_BAG_GUEST_INDICES,
    COSMETICS_SHOP_FLOOR,
    GUEST_COUNTS_BY_FLOOR,
  } = guestConstants.exports;
  assert.equal(COSMETICS_SHOP_FLOOR, 7);
  assert.deepEqual(BEAUTY_BAG_GUEST_INDICES, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  assert.equal(new Set(BEAUTY_BAG_GUEST_INDICES).size, BEAUTY_BAG_GUEST_INDICES.length);
  assert.ok(BEAUTY_BAG_GUEST_INDICES.every((index) => index < GUEST_COUNTS_BY_FLOOR[COSMETICS_SHOP_FLOOR - 1]));

  const customerScene = fs.readFileSync(path.join(__dirname, '../components/MallCustomers.tsx'), 'utf8');
  assert.match(customerScene, /const sheet = GUEST_SHEETS\[floor - 1\]/);
  assert.match(customerScene, /source=\{sheet\}/);
  assert.match(customerScene, /scaleX: facing/);
  assert.match(customerScene, /translateY: bob/);
  assert.match(customerScene, /if \(reducedMotion\) return/);
  assert.doesNotMatch(customerScene, /beautyBagWrap|mall-guest-beauty-bag-/, 'painted totes must not be covered by duplicate floating bags');
});

test('7F beauty atlas preserves transparent cells, full silhouettes, and the 5F scale', () => {
  const { GUEST_COUNTS_BY_FLOOR, GUEST_FRAME_CELLS, GUEST_FRAME_SIZES_BY_FLOOR } = guestConstants.exports;
  const imageDirectory = path.join(__dirname, '../assets/images');
  const boundsForFloor = (floor) => {
    const { width, height, pixels } = readRgbaPng(path.join(imageDirectory, `guests-floor-${floor}.png`));
    const cellWidth = width / 5;
    const cellHeight = height / 3;
    return GUEST_FRAME_CELLS.slice(0, GUEST_COUNTS_BY_FLOOR[floor - 1]).map(({ column, row }) => {
      let left = cellWidth;
      let right = -1;
      let top = cellHeight;
      let bottom = -1;
      for (let y = 0; y < cellHeight; y += 1) {
        for (let x = 0; x < cellWidth; x += 1) {
          if (pixels[((row * cellHeight + y) * width + column * cellWidth + x) * 4 + 3] > 32) {
            left = Math.min(left, x);
            right = Math.max(right, x);
            top = Math.min(top, y);
            bottom = Math.max(bottom, y);
          }
        }
      }
      return { left, right, top, bottom, visibleHeight: (bottom - top + 1) / cellHeight * GUEST_FRAME_SIZES_BY_FLOOR[floor - 1].height };
    });
  };
  const reference = boundsForFloor(5);
  const referenceHeight = reference.reduce((sum, bounds) => sum + bounds.visibleHeight, 0) / reference.length;
  const beautyGuests = boundsForFloor(7);
  assert.equal(beautyGuests.length, 11, 'retain the ten shoppers plus the rainbow princess');
  assert.deepEqual(GUEST_FRAME_SIZES_BY_FLOOR[6], GUEST_FRAME_SIZES_BY_FLOOR[4]);
  for (const [index, bounds] of beautyGuests.entries()) {
    assert.ok(bounds.left >= 4 && bounds.right < 188, `guest ${index} and their tote fit horizontally`);
    assert.ok(bounds.top >= 10 && bounds.bottom < 246, `guest ${index} retains clear top and foot margins`);
    assert.ok(Math.abs(bounds.visibleHeight - referenceHeight) <= 3, `guest ${index} matches the 5F visible height`);
  }
  const { width, pixels } = readRgbaPng(path.join(imageDirectory, 'guests-floor-7.png'));
  for (let y = 512; y < 768; y += 1) {
    for (let x = 192; x < width; x += 1) {
      assert.equal(pixels[(y * width + x) * 4 + 3], 0, 'unused cells stay transparent');
    }
  }
});

test('7F beauty shoppers keep the shared phone-safe walking routes and pacing', () => {
  const { GUEST_COUNTS_BY_FLOOR, GUEST_FRAME_SIZES_BY_FLOOR, GUEST_ROUTES, getGuestRouteBounds } = guestConstants.exports;
  const frame = GUEST_FRAME_SIZES_BY_FLOOR[6];
  for (const sceneSize of [320, 360, 375, 390, 402, 430]) {
    for (const route of GUEST_ROUTES.slice(0, GUEST_COUNTS_BY_FLOOR[6])) {
      const bounds = getGuestRouteBounds(route, frame, sceneSize);
      assert.ok(bounds.fromX >= 0 && bounds.fromX + frame.width <= sceneSize);
      assert.ok(bounds.toX >= 0 && bounds.toX + frame.width <= sceneSize);
      assert.ok(bounds.top >= 0 && bounds.top + frame.height <= sceneSize);
      assert.notEqual(bounds.fromX, bounds.toX);
      assert.ok(route.duration >= 11000 && route.duration <= 19000);
    }
  }
});
