// Verify that capacity expansions retain saved IDs and fit in the visible scene.
// Run: node --test artifacts/momentum-checkin/tests/mall-layout.test.cjs
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const layoutSource = ts.transpileModule(
  fs.readFileSync(path.join(__dirname, '../constants/mall-layout.ts'), 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.CommonJS } },
).outputText;
const layoutModule = { exports: {} };
new Function('require', 'module', 'exports', layoutSource)(
  require, layoutModule, layoutModule.exports,
);
const { MALL_POSITIONS_PER_FLOOR, MALL_SLOT_IDS, getMallSlotPosition } = layoutModule.exports;
const FLOOR_ORDER = [3, 2, 1, 4, 5, 6, 7, 8, 9, 10];
const COLUMNS = ['left', 'center', 'right'];

test('each floor has56 positions split across the main mall and four annex areas', () => {
  assert.equal(MALL_POSITIONS_PER_FLOOR, 56);
  assert.equal(MALL_SLOT_IDS.length, 560);
  assert.equal(new Set(MALL_SLOT_IDS).size, 560);
  for (let floor = 1; floor <= 10; floor += 1) {
    const floorSlots = MALL_SLOT_IDS.filter((slot) => slot.startsWith(`floor-${floor}-`));
    assert.equal(floorSlots.length, 56);
    assert.equal(floorSlots.filter((slot) => getMallSlotPosition(slot).wing === 'main').length, 12);
    assert.equal(floorSlots.filter((slot) => getMallSlotPosition(slot).wing === 'annex').length, 8);
    assert.equal(floorSlots.filter((slot) => getMallSlotPosition(slot).wing === 'extension').length, 12);
    assert.equal(floorSlots.filter((slot) => getMallSlotPosition(slot).wing === 'extension3').length, 12);
    assert.equal(floorSlots.filter((slot) => getMallSlotPosition(slot).wing === 'extension4').length, 12);
  }
});

test('the original320 IDs and order remain stable; all three new zones fit the scene', () => {
  const legacySlots = [
    ...FLOOR_ORDER.flatMap((floor) => COLUMNS.map((column) => `floor-${floor}-${column}`)),
    ...FLOOR_ORDER.flatMap((floor) => [1, 2, 3].flatMap((row) =>
      COLUMNS.map((column) => `floor-${floor}-plaza-${row}-${column}`))),
    ...FLOOR_ORDER.flatMap((floor) => [1, 2, 3, 4].flatMap((row) =>
      ['left', 'right'].map((column) => `floor-${floor}-annex-${row}-${column}`))),
    ...FLOOR_ORDER.flatMap((floor) => [1, 2, 3, 4].flatMap((row) =>
      COLUMNS.map((column) => `floor-${floor}-extension-${row}-${column}`))),
  ];
  assert.deepEqual(MALL_SLOT_IDS.slice(0, 320), legacySlots);

  for (const [zone, expectedLabel] of [
    ['extension', '延伸區二'],
    ['extension3', '延伸區三'],
    ['extension4', '延伸區四'],
  ]) {
    for (let floor = 1; floor <= 10; floor += 1) {
      const slots = MALL_SLOT_IDS.filter((slot) => slot.startsWith(`floor-${floor}-${zone}-`));
      assert.equal(slots.length, 12);
      assert.equal(new Set(slots.map((slot) => {
        const { left, top } = getMallSlotPosition(slot);
        return `${left}:${top}`;
      })).size, 12);
      for (const slot of slots) {
        const position = getMallSlotPosition(slot);
        assert.equal(position.wing, zone);
        assert.match(position.label, new RegExp(`${expectedLabel}.*(?:左側|中央|右側)`));
        assert.ok(parseFloat(position.left) + parseFloat(position.width) <= 100);
        assert.ok(parseFloat(position.top) + parseFloat(position.height) <= 100);
      }
    }
  }
});
