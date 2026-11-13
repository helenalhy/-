const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');

const appRoot = path.join(__dirname, '..');

function loadTypeScript(relativePath, dependencies = {}) {
  const source = fs.readFileSync(path.join(appRoot, relativePath), 'utf8');
  const output = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true },
  }).outputText;
  const loaded = { exports: {} };
  const mockRequire = (name) => {
    if (Object.hasOwn(dependencies, name)) return dependencies[name];
    throw new Error(`Unexpected dependency: ${name}`);
  };
  new Function('require', 'module', 'exports', output)(mockRequire, loaded, loaded.exports);
  return loaded.exports;
}

function dateKey(offset) {
  const date = new Date(Date.UTC(2026, 0, 1 + offset));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
}

const dateHelpers = {
  getPreviousLocalDate(key) {
    const date = new Date(`${key}T12:00:00Z`);
    date.setUTCDate(date.getUTCDate() - 1);
    return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
  },
};

const dogs = Array.from({ length: 14 }, (_, index) => ({ name: `狗狗${index + 1}`, kind: `dog-${index + 1}` }));
const decorations = Array.from({ length: 24 }, (_, index) => ({
  id: `decor-${index + 1}`,
  name: `裝飾${index + 1}`,
  category: 'decor',
  price: 50,
  unlockCheckIns: undefined,
}));
const login = loadTypeScript('lib/daily-login-rewards.ts', {
  '@/lib/habit-schedule': dateHelpers,
  '@/constants/mall': { MALL_ITEMS: decorations },
});
const surprise = loadTypeScript('lib/daily-mall-surprise.ts', {
  '@/constants/dog-staff-customization': { DOG_STAFF_PROFILES: dogs },
  '@/constants/mall': { MALL_ITEMS: decorations },
});

test('daily login streak advances consecutively and resets after a missed date', () => {
  const {
    DAILY_LOGIN_COINS,
    DAILY_LOGIN_STREAK_BONUS_COINS,
    DAILY_LOGIN_STREAK_LENGTH,
    getDailyLoginDecorationPrize,
    getNextDailyLoginStreak,
  } = login;
  assert.equal(DAILY_LOGIN_COINS, 5);
  assert.equal(DAILY_LOGIN_STREAK_BONUS_COINS, 30);
  assert.equal(DAILY_LOGIN_STREAK_LENGTH, 7);
  assert.equal(getDailyLoginDecorationPrize([]).id, 'decor-1');
  assert.equal(getDailyLoginDecorationPrize(['decor-1']).id, 'decor-2');
  assert.equal(getNextDailyLoginStreak(dateKey(1), dateKey(0), 1), 2);
  assert.equal(getNextDailyLoginStreak(dateKey(6), dateKey(5), 6), 7);
  assert.equal(getNextDailyLoginStreak(dateKey(7), dateKey(6), 7), 1, 'the next week starts a new streak');
  assert.equal(getNextDailyLoginStreak(dateKey(8), dateKey(6), 6), 1, 'skipping a day resets the streak');
  assert.equal(getNextDailyLoginStreak(dateKey(6), dateKey(6), 6), 6, 'same-day refresh cannot advance the streak');
  assert.throws(() => getNextDailyLoginStreak('2026-02-30', null, 0), RangeError);
});

test('mall surprise rotates through temporary decorations and dog visitors without same-day persistence', () => {
  const {
    getDailyMallSurprise,
    getDailyMallSurpriseRedeemPrice,
    getDailyMallSurpriseRotationLength,
  } = surprise;
  const events = Array.from({ length: getDailyMallSurpriseRotationLength() }, (_, index) => getDailyMallSurprise(dateKey(index)));
  const eventIds = events.map((event) => event.kind === 'dog' ? event.dog.kind : event.item.id);
  assert.equal(new Set(eventIds).size, events.length, 'each daily entry in a full rotation is distinct');
  assert.ok(events.some((event) => event.kind === 'dog'));
  assert.ok(events.some((event) => event.kind === 'decoration'));
  assert.equal(getDailyMallSurprise(dateKey(0)).kind, getDailyMallSurprise(dateKey(0)).kind, 'the same date is deterministic');
  assert.throws(() => getDailyMallSurprise('2026-02-30'), RangeError);
  assert.equal(getDailyMallSurpriseRedeemPrice(50), 25, 'daily surprise redemption is half the regular price');
  assert.equal(getDailyMallSurpriseRedeemPrice(15), 7, 'discount rounds down to a whole coin');
  assert.equal(getDailyMallSurpriseRedeemPrice(0), 1, 'redeemable items have a minimum coin price');
  assert.throws(() => getDailyMallSurpriseRedeemPrice(-1), RangeError);
});
