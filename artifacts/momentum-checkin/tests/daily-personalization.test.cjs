const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');

const appRoot = path.join(__dirname, '..');

function loadTs(relativePath, extraModules = {}) {
  const source = fs.readFileSync(path.join(appRoot, relativePath), 'utf8');
  const output = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true },
  }).outputText;
  const module = { exports: {} };
  new Function('require', 'module', 'exports', output)(
    (request) => {
      if (request in extraModules) return extraModules[request];
      throw new Error(`Unexpected test dependency: ${request}`);
    },
    module,
    module.exports,
  );
  return module.exports;
}

test('daily postcard art changes every day and safely includes the daily quote', () => {
  const { buildDailyPostcardSvg } = loadTs('lib/daily-postcard.ts');
  const cards = Array.from({ length: 40 }, (_, index) => {
    const date = new Date(Date.UTC(2026, 0, 1 + index));
    const dateKey = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
    return buildDailyPostcardSvg(dateKey, '不必急著抵達，<今天>也值得收藏。', '糖糖 & 花花');
  });
  assert.equal(new Set(cards).size, cards.length);
  assert.match(cards[0], /&lt;今天&gt;/);
  assert.match(cards[0], /糖糖 &amp; 花花今天陪你/);
  assert.match(cards[0], /viewBox="0 0 720 960"/);
});

test('encouragement style and daily moods persist locally without replacing a date entry', async () => {
  const saved = new Map();
  const asyncStorage = {
    async getItem(key) { return saved.get(key) ?? null; },
    async setItem(key, value) { saved.set(key, value); },
  };
  const personalization = loadTs('lib/daily-personalization.ts', {
    '@react-native-async-storage/async-storage': { __esModule: true, default: asyncStorage },
  });

  assert.equal(await personalization.readEncouragementStyle(), 'gentle');
  await personalization.saveEncouragementStyle('energetic');
  assert.equal(await personalization.readEncouragementStyle(), 'energetic');
  assert.notEqual(
    personalization.getEncouragementText('gentle'),
    personalization.getEncouragementText('concise'),
  );

  await personalization.saveDailyMood('2026-11-08', 'tired');
  await personalization.saveDailyMood('2026-11-09', 'happy');
  await personalization.saveDailyMood('2026-11-08', 'calm');
  assert.deepEqual(await personalization.readMoodHistory(), [
    { date: '2026-11-09', mood: 'happy' },
    { date: '2026-11-08', mood: 'calm' },
  ]);
});

test('today and settings expose all four motivation features', () => {
  const today = fs.readFileSync(path.join(appRoot, 'app/(tabs)/index.tsx'), 'utf8');
  const settings = fs.readFileSync(path.join(appRoot, 'app/(tabs)/settings.tsx'), 'utf8');
  const card = fs.readFileSync(path.join(appRoot, 'components/DailyPersonalization.tsx'), 'utf8');
  assert.match(today, /<DailyMoodCard/);
  assert.match(today, /<DailyPostcardCard/);
  assert.match(today, /testID="toggle-low-energy-mode"/);
  assert.match(settings, /ENCOURAGEMENT_STYLES\.map/);
  assert.match(card, /testID="download-daily-postcard"/);
  assert.match(card, /下載明信片 PNG/);
  assert.match(card, /最近 7 天/);
});
