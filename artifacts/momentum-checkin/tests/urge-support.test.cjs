const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');

const appRoot = path.join(__dirname, '..');

function loadUrgeSupport(storage) {
  const source = fs.readFileSync(path.join(appRoot, 'lib/urge-support.ts'), 'utf8');
  const output = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true },
  }).outputText;
  const module = { exports: {} };
  new Function('require', 'module', 'exports', output)(
    (request) => {
      if (request === '@react-native-async-storage/async-storage') {
        return { __esModule: true, default: storage };
      }
      throw new Error(`Unexpected urge-support dependency: ${request}`);
    },
    module,
    module.exports,
  );
  return module.exports;
}

test('replacement suggestions respond to common habit descriptions', () => {
  const support = loadUrgeSupport({});
  assert.match(support.getReplacementActions('睡前一直滑手機')[0], /手機/);
  assert.match(support.getReplacementActions('忍不住吃宵夜')[0], /水/);
  assert.match(support.getReplacementActions('衝動網購')[0], /願望清單/);
  assert.match(support.getReplacementActions('拖延讀書')[0], /2 分鐘/);
  assert.equal(support.getReplacementActions('其他習慣').length, 3);
});

test('urge records and settings persist locally and reject unreadable data', async () => {
  const saved = new Map();
  const storage = {
    async getItem(key) { return saved.get(key) ?? null; },
    async setItem(key, value) { saved.set(key, value); },
  };
  const support = loadUrgeSupport(storage);
  const record = support.createUrgeRecord('睡前滑手機', '疲倦', '睡前躺在床上', '2026-11-10T12:30:00.000Z');
  const state = {
    habitName: '睡前滑手機',
    records: [record],
    activeSession: { startedAt: 1000, endsAt: 301000, durationMinutes: 5 },
  };

  await support.saveUrgeSupportData(state);
  assert.deepEqual(await support.readUrgeSupportData(), state);

  saved.set(support.URGE_SUPPORT_STORAGE_KEY, '{broken json');
  await assert.rejects(support.readUrgeSupportData(), /無法讀取本機保存的陪伴記錄/);
});

test('Today exposes the urge-support actions and explains that data stays on device', () => {
  const today = fs.readFileSync(path.join(appRoot, 'app/(tabs)/index.tsx'), 'utf8');
  const card = fs.readFileSync(path.join(appRoot, 'components/UrgeSupportCard.tsx'), 'utf8');
  assert.match(today, /<UrgeSupportCard today=\{today\} \/>/);
  assert.match(card, /想做時，陪我一下/);
  assert.match(card, /記錄觸發/);
  assert.match(card, /換個小行動/);
  assert.match(card, /記錄只保存在這部裝置，不同步雲端/);
});
