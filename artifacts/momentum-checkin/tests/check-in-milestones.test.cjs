const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const appRoot = path.join(__dirname, '..');
const source = fs.readFileSync(path.join(appRoot, 'lib/check-in-milestones.ts'), 'utf8');
const output = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true },
}).outputText;
const moduleObject = { exports: {} };
new Function('require', 'module', 'exports', output)(require, moduleObject, moduleObject.exports);
const { getCheckInMilestones } = moduleObject.exports;

test('commemorative cards unlock exactly at 10, 30 and 50 check-ins', () => {
  assert.deepEqual(getCheckInMilestones(9).map(({ unlocked, remaining }) => [unlocked, remaining]), [
    [false, 1], [false, 21], [false, 41],
  ]);
  assert.deepEqual(getCheckInMilestones(30).map(({ unlocked, remaining }) => [unlocked, remaining]), [
    [true, 0], [true, 0], [false, 20],
  ]);
  assert.ok(getCheckInMilestones(50).every(({ unlocked }) => unlocked));
});
