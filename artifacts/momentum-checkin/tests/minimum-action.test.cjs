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
  assert.match(today, /habit\.minimumAction \? '正常完成' : '完成'\}\$\{habit\.title\}/);
  assert.match(today, /onCompleteMinimumAction=\{focusHabit\.minimumAction[\s\S]*?getMinimumActionReward\(focusHabit\.title, focusHabit\.minimumAction/);
  assert.match(today, /完整 \+\{reward\} · 小步 \+\{minimumActionReward\} 金幣/);
  assert.match(today, /完成小步 \+\{minimumActionReward\} 金幣 · 完整目標 \+\{FULL_CHECK_IN_REWARD\} 金幣/);
});

test('today offers situation-based quick starts with each unfinished goal and its recommended first step', () => {
  assert.match(today, /START_SCENARIOS:[\s\S]*short-time[\s\S]*stuck/);
  assert.match(today, /testID="toggle-low-energy-mode"/);
  assert.match(today, /低電量模式/);
  assert.match(today, /LOW_ENERGY_PROMPT/);
  assert.match(today, /testID="quick-start-card"/);
  assert.match(today, /testID=\{`start-scenario-\$\{scenario\.id\}`\}/);
  assert.match(today, /testID=\{`quick-start-habit-\$\{habit\.id\}`\}/);
  assert.match(today, /const action = progressPathAction \?\? habit\.minimumAction \?\? recommendMinimumAction\(habit\)/);
  assert.match(today, /setFocusStartPrompt\(lowEnergyMode \? LOW_ENERGY_PROMPT/);
  assert.match(today, /testID="quick-start-prompt"/);
});

test('today can temporarily focus one unfinished goal and restore the full list', () => {
  assert.match(today, /testID="today-focus-toggle"/);
  assert.match(today, /testID="today-focus-chooser"/);
  assert.match(today, /testID=\{`choose-focus-habit-\$\{habit\.id\}`\}/);
  assert.match(today, /const visibleHabits = focusedHabit \? \[focusedHabit\] : habits/);
  assert.match(today, /visibleHabits\.map\(\(habit\)/);
  assert.match(today, /testID="show-all-habits"/);
  assert.match(today, /其他目標會保留/);
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
