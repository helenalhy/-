const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');

const appRoot = path.join(__dirname, '..');
const source = fs.readFileSync(path.join(appRoot, 'lib/daily-dog-task.ts'), 'utf8');
const output = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true },
}).outputText;
const loaded = { exports: {} };
new Function('require', 'module', 'exports', output)(
  () => { throw new Error('Daily dog task selection should not require runtime modules.'); },
  loaded,
  loaded.exports,
);

test('daily dog tasks rotate to a different small action each day', () => {
  const { DAILY_DOG_TASK_REWARD, getDailyDogTask, getDailyDogTaskCount, getDailyDogTaskRewardKey } = loaded.exports;
  assert.equal(DAILY_DOG_TASK_REWARD, 10);
  assert.ok(getDailyDogTaskCount() >= 20);
  const tasks = Array.from({ length: 30 }, (_, index) => {
    const date = new Date(Date.UTC(2026, 0, 1 + index));
    const key = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
    return getDailyDogTask(key);
  });
  for (let index = 1; index < tasks.length; index += 1) {
    assert.notEqual(tasks[index].id, tasks[index - 1].id, 'adjacent days do not repeat the same task');
  }
  assert.equal(new Set(tasks.slice(0, 24).map(({ id }) => id)).size, 24);
  assert.ok(tasks.some(({ title }) => title === '今日飲 3 杯水'));
  assert.equal(getDailyDogTaskRewardKey('2026-01-01'), 'daily-dog-task:2026-01-01');
  assert.throws(() => getDailyDogTask('2026-02-30'), RangeError);
});
