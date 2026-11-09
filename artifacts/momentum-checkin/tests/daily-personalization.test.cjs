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
  const { buildDailyPostcardSvg, getDailyStyleIndex } = loadTs('lib/daily-postcard.ts', {
    '@/constants/dog-attendant-looks': {
      DOG_ATTENDANT_LOOKS: {
        tangtang: {
          coat: '#FFFBF4',
          ear: '#FFFBF4',
          muzzle: '#FFFFFF',
          collar: '#FFE1EC',
          marking: '#FFE3CE',
          earStyle: 'small',
          bodyStyle: 'regular',
          tailStyle: 'round',
          facePattern: 'none',
          fluffy: true,
        },
        xiaoniu: {
          coat: '#36323C',
          ear: '#36323C',
          muzzle: '#FFFFFF',
          collar: '#A9DDD1',
          marking: '#FFFFFF',
          earStyle: 'upright',
          bodyStyle: 'regular',
          tailStyle: 'long',
          facePattern: 'collie',
          fluffy: false,
        },
      },
    },
  });
  const dog = {
    name: '糖糖',
    kind: 'tangtang',
    coatColor: '#FFF7EA',
    outfit: {
      name: '糖糖・粉彩星願裙',
      color: '#E9B8D5',
      accentColor: '#FFF4C1',
      cut: 'magical-girl',
      pattern: 'stars',
    },
    accessory: {
      name: '糖糖・小熊耳朵帽',
      color: '#E6C49C',
      accentColor: '#FFF1D9',
      shape: 'animal-ears',
      animalKind: 'bear',
    },
  };
  const shop = { floor: 6, name: '毛茸茸棉花糖CAFE', roomImageUri: 'https://example.com/shop-room-cafe.jpg' };
  const cards = Array.from({ length: 40 }, (_, index) => {
    const date = new Date(Date.UTC(2026, 0, 1 + index));
    const dateKey = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
    return buildDailyPostcardSvg(dateKey, '不必急著抵達，<今天>也值得收藏。', dog, shop);
  });
  assert.equal(new Set(cards).size, cards.length);
  assert.match(cards[0], /&lt;今天&gt;/);
  assert.match(cards[0], /糖糖今天陪你/);
  assert.match(cards[0], /shop-room-cafe\.jpg/);
  assert.match(cards[0], /糖糖・粉彩星願裙 · 糖糖・小熊耳朵帽/);
  assert.match(cards[0], /translate\(220 540\) scale\(5\.6\)/);
  assert.match(cards[0], /<ellipse cx="20\.5" cy="16" rx="1\.2" ry="1\.5" fill="#493348"/);
  assert.match(cards[0], /<circle cx="16" cy="18" r="3\.2" fill="#FFFBF4"/);
  assert.match(cards[0], /<circle cx="41\.5" cy="34\.5" r="3\.6" fill="#FFFBF4"/);
  assert.doesNotMatch(cards[0], /<path d="<path/);
  assert.match(cards[0], /viewBox="0 0 720 960"/);
  assert.notEqual(
    getDailyStyleIndex('2026-01-01', 14, 50),
    getDailyStyleIndex('2026-01-15', 14, 50),
    'a returning dog receives a different outfit on its next daily appearance',
  );

  const longTailDog = { ...dog, name: '小牛', kind: 'xiaoniu' };
  const longTailCard = buildDailyPostcardSvg('2026-01-01', '今天也一步一步來。', longTailDog, shop);
  assert.match(longTailCard, /M36 34 Q44 28 48 33 Q49 38 40 38/);
  assert.doesNotMatch(longTailCard, /<circle cx="41\.5" cy="34\.5" r="3\.6"/);
});

test('dog illustration tail styles use round puffs except naturally long-tailed breeds', () => {
  const colors = new Proxy({}, { get: (_target, key) => `#${String(key).padEnd(6, '0').slice(0, 6)}` });
  const { DOG_ATTENDANT_LOOKS } = loadTs('constants/dog-attendant-looks.ts', {
    './colors': { __esModule: true, default: { light: colors } },
  });
  const longTailBreeds = ['xiaoniu', 'pudding', 'wonton', 'poppy'];

  assert.equal(Object.keys(DOG_ATTENDANT_LOOKS).length, 14);
  for (const [kind, look] of Object.entries(DOG_ATTENDANT_LOOKS)) {
    assert.equal(look.tailStyle, longTailBreeds.includes(kind) ? 'long' : 'round', kind);
  }
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
