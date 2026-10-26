const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const source = fs.readFileSync(path.join(__dirname, '../constants/habit-icons.ts'), 'utf8');
const output = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true },
}).outputText;
const loaded = { exports: {} };
new Function('require', 'module', 'exports', output)(
  () => {
    throw new Error('A type-only import unexpectedly became a runtime dependency.');
  },
  loaded,
  loaded.exports,
);

test('the goal icon picker offers 30 unique, supported icons and colors', () => {
  const { HABIT_ICON_OPTIONS } = loaded.exports;
  assert.equal(HABIT_ICON_OPTIONS.length, 30);
  assert.equal(new Set(HABIT_ICON_OPTIONS.map((option) => option.icon)).size, 30);
  assert.equal(new Set(HABIT_ICON_OPTIONS.map((option) => option.color)).size, 30);
  assert.equal(new Set(HABIT_ICON_OPTIONS.map((option) => option.label)).size, 30);
  assert.ok(HABIT_ICON_OPTIONS.every((option) => ['facility', 'shop', 'decor'].includes(option.rewardCategory)));

  const featherGlyphMap = require(require.resolve(
    '@expo/vector-icons/build/vendor/react-native-vector-icons/glyphmaps/Feather.json',
    { paths: [path.join(__dirname, '..')] },
  ));
  assert.ok(HABIT_ICON_OPTIONS.every((option) => Object.hasOwn(featherGlyphMap, option.icon)));
});
