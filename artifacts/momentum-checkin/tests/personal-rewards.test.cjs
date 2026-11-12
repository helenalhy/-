const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const appRoot = path.join(__dirname, '..');
const source = fs.readFileSync(path.join(appRoot, 'lib/personal-rewards.ts'), 'utf8');
const output = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true },
}).outputText;
const saved = new Map();
const asyncStorage = {
  async getItem(key) { return saved.get(key) ?? null; },
  async setItem(key, value) { saved.set(key, value); },
};
const moduleObject = { exports: {} };
new Function('require', 'module', 'exports', output)(
  (request) => {
    if (request === '@react-native-async-storage/async-storage') return { __esModule: true, default: asyncStorage };
    throw new Error(`Unexpected dependency: ${request}`);
  },
  moduleObject,
  moduleObject.exports,
);
const { getDailyPersonalReward, readPersonalRewards, savePersonalRewards } = moduleObject.exports;

test('personal reward list persists locally and rotates one reward per date', async () => {
  await savePersonalRewards(['散步', '看一集喜歡的節目']);
  assert.deepEqual(await readPersonalRewards(), ['散步', '看一集喜歡的節目']);
  assert.notEqual(
    getDailyPersonalReward(await readPersonalRewards(), '2026-01-01'),
    getDailyPersonalReward(await readPersonalRewards(), '2026-01-02'),
  );
  await savePersonalRewards(['  散步 ', '散步', '看一集喜歡的節目']);
  assert.deepEqual(await readPersonalRewards(), ['散步', '看一集喜歡的節目']);
});
