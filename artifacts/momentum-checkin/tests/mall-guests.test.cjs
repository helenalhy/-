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

test('each mall floor has ten distinct guest frames in its transparent sprite sheet', () => {
  const { GUEST_FRAME_CELLS, GUEST_ROUTES, GUEST_SHEETS, GUESTS_PER_FLOOR } = guestConstants.exports;
  assert.equal(GUESTS_PER_FLOOR, 10);
  assert.equal(GUEST_ROUTES.length, GUESTS_PER_FLOOR);
  assert.equal(GUEST_FRAME_CELLS.length, GUESTS_PER_FLOOR);
  assert.equal(new Set(GUEST_FRAME_CELLS.map(({ column, row }) => `${column},${row}`)).size, GUESTS_PER_FLOOR);
  assert.equal(GUEST_SHEETS.length, 10);

  const imageDirectory = path.join(__dirname, '../assets/images');
  const sheetHashes = new Set();
  for (let floor = 1; floor <= 10; floor += 1) {
    const image = fs.readFileSync(path.join(imageDirectory, `guests-floor-${floor}.png`));
    assert.equal(image.readUInt32BE(16), 640, `floor ${floor} sheet width`);
    assert.equal(image.readUInt32BE(20), 512, `floor ${floor} sheet height`);
    sheetHashes.add(crypto.createHash('sha256').update(image).digest('hex'));
  }
  assert.equal(sheetHashes.size, 10, 'floor casts should not reuse the same sheet');
});
