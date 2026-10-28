const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

function resolveColors(platform, systemScheme) {
  const sourcePath = path.join(__dirname, '../hooks/useColors.ts');
  const source = ts.transpileModule(fs.readFileSync(sourcePath, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true },
  }).outputText;
  let schemeReads = 0;
  const palettes = {
    light: { background: '#light', foreground: '#ink-light' },
    dark: { background: '#dark', foreground: '#ink-dark' },
    radius: 20,
  };
  const mockRequire = (name) => {
    if (name === 'react-native') return {
      Platform: { OS: platform },
      useColorScheme: () => {
        schemeReads += 1;
        return systemScheme;
      },
    };
    if (name === '@/constants/colors') return palettes;
    throw new Error(`Unexpected dependency: ${name}`);
  };
  const module = { exports: {} };
  new Function('require', 'module', 'exports', source)(mockRequire, module, module.exports);
  return { colors: module.exports.useColors(), schemeReads };
}

test('mobile web always uses the preview light palette even when the device is dark', () => {
  const { colors, schemeReads } = resolveColors('web', 'dark');
  assert.equal(colors.background, '#light');
  assert.equal(colors.foreground, '#ink-light');
  assert.equal(colors.radius, 20);
  assert.equal(schemeReads, 1, 'color scheme hook remains unconditional');
});

test('native apps continue to follow the device color scheme', () => {
  const { colors } = resolveColors('ios', 'dark');
  assert.equal(colors.background, '#dark');
  assert.equal(colors.foreground, '#ink-dark');
});

test('web stays light when the device is also light', () => {
  const { colors } = resolveColors('web', 'light');
  assert.equal(colors.background, '#light');
});
