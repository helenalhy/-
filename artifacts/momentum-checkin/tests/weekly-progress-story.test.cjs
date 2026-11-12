const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const appRoot = path.join(__dirname, '..');
const source = fs.readFileSync(path.join(appRoot, 'lib/weekly-progress-story.ts'), 'utf8');
const output = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true },
}).outputText;
const moduleObject = { exports: {} };
new Function('require', 'module', 'exports', output)(require, moduleObject, moduleObject.exports);
const { getWeeklyProgressStory } = moduleObject.exports;

test('weekly story reflects whether the user has started and their weekly activity', () => {
  assert.match(getWeeklyProgressStory({ completedCount: 0 }), /第一步/);
  assert.match(getWeeklyProgressStory({ completedCount: 2 }), /2 次/);
  assert.match(getWeeklyProgressStory({ completedCount: 8, bestDayLabel: '三', bestDayCount: 3 }), /星期三/);
  assert.match(getWeeklyProgressStory({ completedCount: 8, bestDayLabel: '三', bestDayCount: 3 }), /8 次/);
});
