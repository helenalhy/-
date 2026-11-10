const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const root = path.join(__dirname, '..');

function loadTypeScript(relativePath, dependencies = {}) {
  const source = fs.readFileSync(path.join(root, relativePath), 'utf8');
  const output = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true },
  }).outputText;
  const loaded = { exports: {} };
  new Function('require', 'module', 'exports', output)(
    (name) => {
      if (Object.hasOwn(dependencies, name)) return dependencies[name];
      throw new Error(`Unexpected dependency: ${name}`);
    },
    loaded,
    loaded.exports,
  );
  return loaded.exports;
}

const streakProtection = loadTypeScript('lib/streak-protection.ts');
const { getStreak } = loadTypeScript('lib/habit-schedule.ts');

test('missed scheduled days are identified after real activity and existing leave days', () => {
  const habits = [
    { id: 'walk', title: '散步', createdAt: '2026-11-01', checkIns: ['2026-11-09'], restDays: [] },
    { id: 'read', title: '閱讀', createdAt: '2026-11-01', checkIns: [], restDays: [0] },
  ];
  assert.deepEqual(
    streakProtection.getMissedScheduledStreakDates(habits, '2026-11-12', ['2026-11-10']),
    ['2026-11-11'],
  );
  assert.deepEqual(
    streakProtection.getMissedScheduledStreakDates(
      [{ checkIns: [], createdAt: '2026-11-01', restDays: [] }],
      '2026-11-12',
    ),
    [],
    'a card does not invent a streak before the first real check-in',
  );
});

test('one leave day protects streak continuity without becoming a goal check-in', () => {
  const checkIns = ['2026-11-08'];
  const protectedDates = ['2026-11-09'];
  assert.equal(getStreak(checkIns, '2026-11-10', [], protectedDates), 2);
  assert.deepEqual(checkIns, ['2026-11-08']);
});

test('paid streak rescue is limited to the first missed scheduled day and a 24-hour window', () => {
  const habits = [{ checkIns: ['2026-11-09'], createdAt: '2026-11-01', restDays: [] }];
  assert.equal(
    streakProtection.getStreakRescueDate(habits, '2026-11-11', [], new Date(2026, 10, 11, 10, 0)),
    '2026-11-10',
  );
  assert.equal(
    streakProtection.getStreakRescueDate(habits, '2026-11-11', [], new Date(2026, 10, 12, 0, 0)),
    null,
  );
  assert.equal(
    streakProtection.getStreakRescueDate(
      [{ checkIns: ['2026-11-07'], createdAt: '2026-11-01', restDays: [] }],
      '2026-11-11',
      [],
      new Date(2026, 10, 11, 10, 0),
    ),
    null,
    'a previous missed day means the current streak already broke earlier',
  );
});

test('month calendar distinguishes full, partial, rest, and protected days and lists completed goals', () => {
  const habits = [
    { title: '散步', createdAt: '2026-11-01', checkIns: ['2026-11-02', '2026-11-03'], restDays: [0] },
    { title: '閱讀', createdAt: '2026-11-01', checkIns: ['2026-11-02'], restDays: [0] },
  ];
  assert.equal(streakProtection.getCalendarDayStatus(habits, '2026-11-02', '2026-11-05'), 'complete');
  assert.equal(streakProtection.getCalendarDayStatus(habits, '2026-11-03', '2026-11-05'), 'partial');
  assert.equal(streakProtection.getCalendarDayStatus(habits, '2026-11-01', '2026-11-05'), 'rest');
  assert.equal(streakProtection.getCalendarDayStatus(habits, '2026-11-04', '2026-11-05', ['2026-11-04']), 'leave');
  assert.deepEqual(
    streakProtection.getCalendarDaySummary(habits, '2026-11-02'),
    { completed: ['散步', '閱讀'], scheduled: ['散步', '閱讀'], isRestDay: false },
  );
  const cells = streakProtection.getLocalMonthCalendarDays(2026, 10);
  assert.equal(cells.length % 7, 0);
  assert.ok(cells.includes('2026-11-30'));
});

test('weekly challenge prize selects only an existing unowned catalog decoration', () => {
  const itemIds = ['decor-a', 'decor-b', 'decor-c'];
  const weeklyRewards = loadTypeScript('lib/weekly-challenge-rewards.ts', {
    '@/constants/mall': { MALL_ITEMS: itemIds.map((id) => ({ id, category: 'decor' })) },
    '@/lib/habit-schedule': {
      getLocalWeekStart: () => '2026-11-09',
    },
  });
  const selected = weeklyRewards.getWeeklyChallengeRewardItemId('2026-11-12', ['decor-a']);
  assert.ok(itemIds.includes(selected));
  assert.notEqual(selected, 'decor-a');
  assert.equal(
    weeklyRewards.getWeeklyChallengeRewardItemId('2026-11-12', ['decor-a']),
    selected,
    'the displayed prize is deterministic until the user owns it',
  );
});

test('published web HTML loader embeds fourteen animated dogs and hides after the app mounts', () => {
  const { injectLoadingScreen } = require('../scripts/web-loading-screen.js');
  const html = injectLoadingScreen('<html><body><div id="root"></div></body></html>');
  assert.equal((html.match(/class="loader-dog"/g) ?? []).length, 14);
  assert.match(html, /載入中/);
  assert.ok(html.indexOf('id="root"') < html.indexOf('new MutationObserver'));
  assert.match(html, /observer\.observe\(root/);
  assert.equal(injectLoadingScreen(html), html, 'the post-export step can be safely rerun');
});
