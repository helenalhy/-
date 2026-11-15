const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const source = fs.readFileSync(path.join(__dirname, '../constants/progress-milestones.ts'), 'utf8');
const output = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true },
}).outputText;
const loaded = { exports: {} };
new Function('require', 'module', 'exports', output)(
  () => { throw new Error('Milestone constants should not require runtime modules.'); },
  loaded,
  loaded.exports,
);

test('milestone decorations unlock at their exact cumulative reward thresholds', () => {
  const { getNextMilestone, getRewardedCheckInCount, getUnlockedMilestones, PROGRESS_MILESTONES } = loaded.exports;
  assert.deepEqual(PROGRESS_MILESTONES.map(({ total, floor }) => [total, floor]), [[25, 1], [75, 15], [150, 20]]);
  assert.deepEqual(getUnlockedMilestones(74).map(({ id }) => id), ['starlight-lanterns']);
  assert.equal(getNextMilestone(75).id, 'rainbow-sparkles');
  assert.equal(getNextMilestone(150), null);
  assert.equal(getRewardedCheckInCount(['walk:2026-01-01', 'makeup-used:2026-01-02']), 1);
  assert.equal(getRewardedCheckInCount(['walk:2026-01-01', 'daily-dog-task:2026-01-02']), 1);
});

test('milestone rewards are free decor items for existing floors, not new themes or floors', () => {
  const mallSource = fs.readFileSync(path.join(__dirname, '../constants/mall.ts'), 'utf8');
  const contextSource = fs.readFileSync(path.join(__dirname, '../context/HabitsContext.tsx'), 'utf8');
  const progressSource = fs.readFileSync(path.join(__dirname, '../app/(tabs)/progress.tsx'), 'utf8');
  for (const id of [
    'milestone-starlight-lanterns',
    'milestone-sakura-lantern',
    'milestone-cloud-mobile',
  ]) {
    assert.match(mallSource, new RegExp(id));
  }
  assert.match(mallSource, /'decor', 0, 0, c\.candyLemon/);
  assert.match(contextSource, /catalogItem\.unlockCheckIns/);
  assert.match(progressSource, /不會改變現有樓層主題/);
});
