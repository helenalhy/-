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
const { canMakeUpYesterday, getLocalWeekStart, getPreviousScheduledDate, getStreak, getWeekday, getWeeklyChallengeLimit, getWeeklyCheckInCount } = loaded.exports;

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

test('the weekly makeup limit remains used after deleting the goal that claimed it', () => {
  const today = '2026-05-04';
  const remainingHabit = { checkIns: [], makeupCheckIns: [], restDays: [] };
  const accountMakeups = ['2026-05-03'];
  assert.equal(canMakeUpYesterday(remainingHabit, today, accountMakeups), false);
});

test('weekly goals count unique check-in dates only in the current week through today', () => {
  assert.equal(getWeeklyCheckInCount([
    '2026-05-10',
    '2026-05-11',
    '2026-05-11',
    '2026-05-12',
  ], '2026-05-11'), 1);
});

test('weekly challenge limit reflects the number of scheduled days', () => {
  assert.equal(getWeeklyChallengeLimit([]), 7);
  assert.equal(getWeeklyChallengeLimit([0, 6]), 5);
  assert.equal(getWeeklyChallengeLimit([0, 1, 2, 3, 4, 5, 6]), 0);
});

test('restart prompts use the latest scheduled day and skip configured rest days', () => {
  assert.equal(getPreviousScheduledDate('2026-05-04', [0, 6], '2026-01-01'), '2026-05-01');
  assert.equal(getPreviousScheduledDate('2026-05-04', [0, 6, 5, 4, 3, 2, 1], '2026-01-01'), null);
  assert.equal(getPreviousScheduledDate('2026-05-04', [], '2026-05-04'), null);
});

test('invalid date keys fail explicitly instead of being silently normalized', () => {
  assert.throws(() => getWeekday('2026-02-30'), RangeError);
  assert.throws(() => getLocalWeekStart('not-a-date'), RangeError);
});
