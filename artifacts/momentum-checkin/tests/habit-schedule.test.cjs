const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const source = fs.readFileSync(path.join(__dirname, '../lib/habit-schedule.ts'), 'utf8');
const output = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true },
}).outputText;
const loaded = { exports: {} };
new Function('require', 'module', 'exports', output)(
  () => { throw new Error('Habit schedule helpers should not require runtime modules.'); },
  loaded,
  loaded.exports,
);
const { canMakeUpYesterday, getLocalWeekStart, getStreak, getWeekday } = loaded.exports;

test('streaks skip configured weekly rest days but stop at an unplanned gap', () => {
  assert.equal(getStreak(['2026-05-01'], '2026-05-03', [6]), 1);
  assert.equal(getStreak(['2026-05-01'], '2026-05-04', []), 0);
  assert.equal(getStreak(['2026-05-01'], '2026-05-02', [6]), 1);
});

test('a previous day can be made up once per account per week, except on rest days', () => {
  const yesterday = '2026-05-03';
  const today = '2026-05-04';
  assert.equal(getWeekday(yesterday), 0);
  assert.equal(canMakeUpYesterday({ checkIns: [], makeupCheckIns: [], restDays: [], createdAt: '2026-01-01' }, today), true);
  assert.equal(canMakeUpYesterday({ checkIns: [], makeupCheckIns: [], restDays: [] }, today, ['2026-05-01']), false);
  assert.equal(canMakeUpYesterday({ checkIns: [], makeupCheckIns: [], restDays: [0] }, today), false);
  assert.equal(canMakeUpYesterday({ checkIns: [yesterday], makeupCheckIns: [], restDays: [] }, today), false);
  assert.equal(canMakeUpYesterday({ checkIns: [], makeupCheckIns: [], restDays: [], createdAt: today }, today), false);
});

test('invalid date keys fail explicitly instead of being silently normalized', () => {
  assert.throws(() => getWeekday('2026-02-30'), RangeError);
  assert.throws(() => getLocalWeekStart('not-a-date'), RangeError);
});
