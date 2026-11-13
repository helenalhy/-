const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');

const appRoot = path.join(__dirname, '..');
const source = fs.readFileSync(path.join(appRoot, 'lib/habit-progression.ts'), 'utf8');
const output = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true },
}).outputText;
const loaded = { exports: {} };
new Function('require', 'module', 'exports', output)(
  () => { throw new Error('Habit progression helpers must not require runtime modules.'); },
  loaded,
  loaded.exports,
);

const {
  applyHabitProgressPathAction,
  buildHabitProgressPath,
  createHabitProgressPath,
  getActiveHabitProgressPathStep,
  normalizeHabitProgressPath,
  sanitizeHabitProgressSteps,
  updateHabitProgressPathCheckIn,
  HABIT_PROGRESS_PATH_ADVANCE_AFTER,
} = loaded.exports;

test('progress paths keep two to five trimmed, unique steps with safe lengths', () => {
  assert.deepEqual(sanitizeHabitProgressSteps([' 讀 1 頁 ', '', '讀 1 頁', '讀 5 頁', '讀 10 頁']), ['讀 1 頁', '讀 5 頁', '讀 10 頁']);
  assert.equal(sanitizeHabitProgressSteps(['1', '2', '3', '4', '5', '6']).length, 5);
  assert.equal(sanitizeHabitProgressSteps(['x'.repeat(150)])[0].length, 120);
  assert.equal(normalizeHabitProgressPath({ steps: ['只有一階'] }), undefined);
  assert.equal(HABIT_PROGRESS_PATH_ADVANCE_AFTER, 5);
});

test('a route only becomes ready after five unique check-in dates and never auto-advances', () => {
  let path = createHabitProgressPath(['閱讀 1 頁', '閱讀 5 頁', '閱讀 10 頁']);
  for (let day = 1; day <= 4; day += 1) {
    const date = `2026-11-${String(day).padStart(2, '0')}`;
    path = updateHabitProgressPathCheckIn(path, date, true);
    path = updateHabitProgressPathCheckIn(path, date, true);
    assert.equal(path.completedDates.length, day, 'duplicate check-ins do not count twice');
    assert.equal(path.currentStepIndex, 0, 'progress never advances automatically');
  }
  path = updateHabitProgressPathCheckIn(path, '2026-11-05', true);
  assert.equal(path.completedDates.length, HABIT_PROGRESS_PATH_ADVANCE_AFTER);
  assert.equal(getActiveHabitProgressPathStep(path), '閱讀 1 頁');

  path = applyHabitProgressPathAction(path, 'advance');
  assert.equal(path.currentStepIndex, 1);
  assert.equal(path.completedDates.length, 0);
  assert.equal(getActiveHabitProgressPathStep(path), '閱讀 5 頁');
});

test('undoing a check-in removes its route progress, and pause/resume preserves it', () => {
  let path = createHabitProgressPath(['散步 2 分鐘', '散步 5 分鐘']);
  path = updateHabitProgressPathCheckIn(path, '2026-11-10', true);
  path = updateHabitProgressPathCheckIn(path, '2026-11-10', false);
  assert.deepEqual(path.completedDates, []);

  path = updateHabitProgressPathCheckIn(path, '2026-11-11', true);
  path = applyHabitProgressPathAction(path, 'pause');
  assert.equal(path.status, 'paused');
  assert.equal(updateHabitProgressPathCheckIn(path, '2026-11-12', true).completedDates.length, 1);
  path = applyHabitProgressPathAction(path, 'resume');
  assert.equal(path.status, 'active');
  assert.deepEqual(path.completedDates, ['2026-11-11']);
});

test('stay, finish, and restart all require an explicit user choice', () => {
  let path = createHabitProgressPath(['喝 1 杯水', '喝 3 杯水']);
  for (let day = 1; day <= 5; day += 1) {
    path = updateHabitProgressPathCheckIn(path, `2026-11-${String(day).padStart(2, '0')}`, true);
  }
  path = applyHabitProgressPathAction(path, 'stay');
  assert.equal(path.currentStepIndex, 0);
  assert.deepEqual(path.completedDates, []);

  for (let day = 6; day <= 10; day += 1) {
    path = updateHabitProgressPathCheckIn(path, `2026-11-${String(day).padStart(2, '0')}`, true);
  }
  path = applyHabitProgressPathAction(path, 'advance');
  for (let day = 11; day <= 15; day += 1) {
    path = updateHabitProgressPathCheckIn(path, `2026-11-${String(day).padStart(2, '0')}`, true);
  }
  path = applyHabitProgressPathAction(path, 'finish');
  assert.equal(path.status, 'completed');
  assert.equal(getActiveHabitProgressPathStep(path), undefined);
  path = applyHabitProgressPathAction(path, 'restart');
  assert.equal(path.status, 'active');
  assert.equal(path.currentStepIndex, 0);
  assert.deepEqual(path.completedDates, []);
});

test('editing steps preserves the active stage only when that action remains', () => {
  const previous = {
    steps: ['讀一頁', '讀五頁', '讀十頁'],
    currentStepIndex: 1,
    completedDates: ['2026-11-10', '2026-11-11'],
    status: 'active',
  };
  const reordered = buildHabitProgressPath(previous, ['讀一頁', '讀七頁', '讀五頁', '讀十頁'], true);
  assert.equal(reordered.currentStepIndex, 2);
  assert.deepEqual(reordered.completedDates, previous.completedDates);

  const changedCurrentStep = buildHabitProgressPath(previous, ['讀一頁', '讀三頁', '讀十頁'], true);
  assert.equal(changedCurrentStep.currentStepIndex, 0);
  assert.deepEqual(changedCurrentStep.completedDates, []);

  const editedCompletedPath = buildHabitProgressPath({
    steps: ['讀一頁', '讀五頁'],
    currentStepIndex: 1,
    completedDates: ['2026-11-10', '2026-11-11', '2026-11-12', '2026-11-13', '2026-11-14'],
    status: 'completed',
  }, ['讀一頁', '讀五頁', '讀十分鐘'], true);
  assert.equal(editedCompletedPath.status, 'active');
  assert.equal(editedCompletedPath.currentStepIndex, 0);
});

test('the route is saved with the habit, synced, and uses existing check-in handling', () => {
  const context = fs.readFileSync(path.join(appRoot, 'context/HabitsContext.tsx'), 'utf8');
  const sync = fs.readFileSync(path.join(appRoot, 'context/ProgressSyncBridge.tsx'), 'utf8');
  const editor = fs.readFileSync(path.join(appRoot, 'app/habit-editor.tsx'), 'utf8');
  const today = fs.readFileSync(path.join(appRoot, 'app/(tabs)/index.tsx'), 'utf8');

  assert.match(context, /progressPath: updateHabitProgressPathCheckIn\(item\.progressPath, checkInDate, !alreadyDone\)/);
  assert.match(context, /updateHabitProgressPath, deleteHabit/);
  assert.match(sync, /habit\.progressPath === undefined/);
  assert.match(editor, /testID="habit-progress-path-input"/);
  assert.match(editor, /progressPath,/);
  assert.match(today, /testID=\{`habit-progress-path-\$\{habit\.id\}`\}/);
  assert.match(today, /testID=\{`advance-progress-path-\$\{habit\.id\}`\}/);
  assert.match(today, /getMinimumActionReward\(focusHabit\.title, focusHabit\.minimumAction/);
});
