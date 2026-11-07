const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');

const editor = read('app/habit-editor.tsx');
const today = read('app/(tabs)/index.tsx');
const companionPicker = read('components/DogCompanionPicker.tsx');
const habitsContext = read('context/HabitsContext.tsx');
const syncBridge = read('context/ProgressSyncBridge.tsx');
const apiSchema = fs.readFileSync(path.resolve(root, '../../lib/api-spec/openapi.yaml'), 'utf8');

test('minimum action is optional, editable, sanitized, and included in progress snapshots', () => {
  assert.match(editor, /最小行動（選填）/);
  assert.match(editor, /testID="habit-minimum-action-input"/);
  assert.equal((editor.match(/minimumAction: minimumAction\.trim\(\)/g) ?? []).length, 2);
  assert.match(habitsContext, /minimumAction\?: string;/);
  assert.match(habitsContext, /habit\.minimumAction\.trim\(\)\.slice\(0, 120\)/);
  assert.match(habitsContext, /updates\.minimumAction\?\.trim\(\)\.slice\(0, 120\)/);
  assert.match(syncBridge, /habit\.minimumAction === undefined/);
  assert.match(apiSchema, /items:\s*\n\s+type: object\s*\n\s+additionalProperties: true/);
});

test('today offers a minimum-action timer and a separate normal completion choice', () => {
  assert.match(today, /開始最小行動 · 2 分鐘/);
  assert.match(today, /建議最小行動/);
  assert.match(today, /habit\.minimumAction \?\? recommendMinimumAction\(habit\)/);
  assert.match(today, /完成最小行動並打卡/);
  assert.match(today, /正常完成\$\{habit\.title\}/);
  assert.match(today, /onCompleteMinimumAction=\{focusHabit\.minimumAction \? \(\) => handleToggle\(focusHabit\) : undefined\}/);
});

test('the timer does not check in automatically', () => {
  const modal = today.split('function TwoMinuteStarterModal')[1].split('function HabitRow')[0];
  assert.doesNotMatch(modal, /toggleCheckIn/);
  assert.match(modal, /onPress=\{\(\) => void recordMinimumAction\(\)\}/);
  assert.match(modal, /改做正常目標/);
});

test('dog companions celebrate and paused or skipped goals offer a two-minute retry or one-time snooze', () => {
  const modal = today.split('function TwoMinuteStarterModal')[1].split('function HabitRow')[0];
  assert.match(companionPicker, /DOG_STAFF_PROFILES\.map/);
  assert.match(companionPicker, /happy=\{celebrating\}/);
  assert.match(today, /celebrating=\{completed \|\| minimumActionRecorded\}/);
  assert.match(modal, /改做 2 分鐘版本/);
  assert.match(today, /SNOOZE_DELAY_MINUTES = 30/);
  assert.match(modal, /scheduleLater/);
  assert.match(today, /scheduleReminderSnooze/);
});
