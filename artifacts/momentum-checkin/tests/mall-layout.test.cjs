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
const LEGACY_FLOOR_ORDER = [3, 2, 1, 4, 5, 6, 7, 8, 9, 10];
const COLUMNS = ['left', 'center', 'right'];

test('each of twenty floors has 56 positions split across the main mall and four annex areas', () => {
  assert.equal(MALL_POSITIONS_PER_FLOOR, 56);
  assert.equal(MALL_SLOT_IDS.length, 1680);
  assert.equal(new Set(MALL_SLOT_IDS).size, 1680);
  for (let floor = 1; floor <= 30; floor += 1) {
    const floorSlots = MALL_SLOT_IDS.filter((slot) => slot.startsWith(`floor-${floor}-`));
    assert.equal(floorSlots.length, 56);
    assert.equal(floorSlots.filter((slot) => getMallSlotPosition(slot).wing === 'main').length, 12);
    assert.equal(floorSlots.filter((slot) => getMallSlotPosition(slot).wing === 'annex').length, 8);
    assert.equal(floorSlots.filter((slot) => getMallSlotPosition(slot).wing === 'extension').length, 12);
    assert.equal(floorSlots.filter((slot) => getMallSlotPosition(slot).wing === 'extension3').length, 12);
    assert.equal(floorSlots.filter((slot) => getMallSlotPosition(slot).wing === 'extension4').length, 12);
  }
});

test('all original 560 IDs and order remain stable; new floors append without moving saved slots', () => {
  const legacySlots = [
    ...LEGACY_FLOOR_ORDER.flatMap((floor) => COLUMNS.map((column) => `floor-${floor}-${column}`)),
    ...LEGACY_FLOOR_ORDER.flatMap((floor) => [1, 2, 3].flatMap((row) =>
      COLUMNS.map((column) => `floor-${floor}-plaza-${row}-${column}`))),
    ...LEGACY_FLOOR_ORDER.flatMap((floor) => [1, 2, 3, 4].flatMap((row) =>
      ['left', 'right'].map((column) => `floor-${floor}-annex-${row}-${column}`))),
    ...LEGACY_FLOOR_ORDER.flatMap((floor) => [1, 2, 3, 4].flatMap((row) =>
      COLUMNS.map((column) => `floor-${floor}-extension-${row}-${column}`))),
    ...LEGACY_FLOOR_ORDER.flatMap((floor) => [1, 2, 3, 4].flatMap((row) =>
      COLUMNS.map((column) => `floor-${floor}-extension3-${row}-${column}`))),
    ...LEGACY_FLOOR_ORDER.flatMap((floor) => [1, 2, 3, 4].flatMap((row) =>
      COLUMNS.map((column) => `floor-${floor}-extension4-${row}-${column}`))),
  ];
  assert.deepEqual(MALL_SLOT_IDS.slice(0, 560), legacySlots);
  const laterOriginalSlots = [
    ...[11, 12, 13, 14, 15, 16, 17, 18, 19, 20].flatMap((floor) => COLUMNS.map((column) => `floor-${floor}-${column}`)),
    ...[11, 12, 13, 14, 15, 16, 17, 18, 19, 20].flatMap((floor) => [1, 2, 3].flatMap((row) =>
      COLUMNS.map((column) => `floor-${floor}-plaza-${row}-${column}`))),
    ...[11, 12, 13, 14, 15, 16, 17, 18, 19, 20].flatMap((floor) => [1, 2, 3, 4].flatMap((row) =>
      ['left', 'right'].map((column) => `floor-${floor}-annex-${row}-${column}`))),
    ...[11, 12, 13, 14, 15, 16, 17, 18, 19, 20].flatMap((floor) => [1, 2, 3, 4].flatMap((row) =>
      COLUMNS.map((column) => `floor-${floor}-extension-${row}-${column}`))),
    ...[11, 12, 13, 14, 15, 16, 17, 18, 19, 20].flatMap((floor) => [1, 2, 3, 4].flatMap((row) =>
      COLUMNS.map((column) => `floor-${floor}-extension3-${row}-${column}`))),
    ...[11, 12, 13, 14, 15, 16, 17, 18, 19, 20].flatMap((floor) => [1, 2, 3, 4].flatMap((row) =>
      COLUMNS.map((column) => `floor-${floor}-extension4-${row}-${column}`))),
  ];
  assert.deepEqual(MALL_SLOT_IDS.slice(560, 1120), laterOriginalSlots);

  const newFloorIds = MALL_SLOT_IDS.slice(1120);
  assert.equal(newFloorIds.length, 560);
  assert.ok(newFloorIds.every((slot) => Number(slot.split('-')[1]) >= 21));

  for (const column of COLUMNS) {
    const position = getMallSlotPosition(`floor-21-${column}`);
    assert.deepEqual(
      [position.left, position.top, position.width, position.height, position.scale],
      [{ left: '12%', center: '37%', right: '62%' }[column], '38%', '26%', '22%', 1],
      `main storefront ${column} aligns to the 1F bays and floor line`,
    );
  }

  for (const [zone, expectedLabel] of [
    ['extension', '延伸區二'],
    ['extension3', '延伸區三'],
    ['extension4', '延伸區四'],
  ]) {
    for (let floor = 1; floor <= 30; floor += 1) {
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
