const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const source = fs.readFileSync(path.join(__dirname, '../constants/daily-motivation.ts'), 'utf8');
const output = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true },
}).outputText;
const loaded = { exports: {} };
new Function('require', 'module', 'exports', output)(
  () => {
    throw new Error('Daily motivation constants should not require runtime modules.');
  },
  loaded,
  loaded.exports,
);

test('daily motivational quotes are unique and include the user-provided lines', () => {
  const { DAILY_MOTIVATIONAL_QUOTES } = loaded.exports;
  assert.ok(DAILY_MOTIVATIONAL_QUOTES.length >= 30);
  assert.equal(new Set(DAILY_MOTIVATIONAL_QUOTES).size, DAILY_MOTIVATIONAL_QUOTES.length);
  for (const quote of [
    '不經一番寒徹骨，焉得梅花撲鼻香?',
    '莫問前程凶吉，但求落幕無悔。',
    'If you want the rainbow, you have to tolerate the rain.',
    'Failure is a success if we learn from it.',
  ]) {
    assert.ok(DAILY_MOTIVATIONAL_QUOTES.includes(quote));
  }
});

test('the quote stays fixed for a local date and changes on each consecutive day', () => {
  const { DAILY_MOTIVATIONAL_QUOTES, getDailyMotivationalQuote } = loaded.exports;
  const day = new Date(Date.UTC(2026, 9, 26));
  const quotes = [];
  for (let offset = 0; offset < DAILY_MOTIVATIONAL_QUOTES.length; offset += 1) {
    const date = new Date(day);
    date.setUTCDate(day.getUTCDate() + offset);
    const key = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
    const quote = getDailyMotivationalQuote(key);
    assert.equal(getDailyMotivationalQuote(key), quote);
    if (quotes.length > 0) assert.notEqual(quote, quotes.at(-1));
    quotes.push(quote);
  }
  assert.equal(new Set(quotes).size, DAILY_MOTIVATIONAL_QUOTES.length);
});

test('invalid date keys fail explicitly', () => {
  assert.throws(() => loaded.exports.getDailyMotivationalQuote('2026-02-30'), RangeError);
  assert.throws(() => loaded.exports.getDailyMotivationalQuote('today'), RangeError);
});
