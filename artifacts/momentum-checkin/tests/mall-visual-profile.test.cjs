const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const sourcePath = path.join(__dirname, '../constants/mall-visual-profile.ts');
const source = ts.transpileModule(fs.readFileSync(sourcePath, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText;
const loadedModule = { exports: {} };
new Function('exports', source)(loadedModule.exports);
const { getShopFacadeVariant, resolveMallObjectArchetype } = loadedModule.exports;

test('shop facade variants are stable and use all four storefront designs', () => {
  const ids = Array.from({ length: 80 }, (_, index) => `shop-${index}`);
  const variants = ids.map((id) => getShopFacadeVariant(id));

  assert.deepEqual([...new Set(variants)].sort(), [0, 1, 2, 3]);
  assert.equal(getShopFacadeVariant('sunny-cafe'), getShopFacadeVariant('sunny-cafe'));
});

test('known visual IDs stay intact and unsupported items resolve to themed category objects', () => {
  assert.equal(resolveMallObjectArchetype('coral-aquarium', 'droplet', 'facility'), 'coral-aquarium');
  assert.equal(resolveMallObjectArchetype('unknown-facility', 'droplet', 'facility'), 'central-fountain');
  assert.equal(resolveMallObjectArchetype('unknown-decor', 'moon', 'decor'), 'starlight-mobile');

  const facility = resolveMallObjectArchetype('unmapped-facility', 'coffee', 'facility');
  const decor = resolveMallObjectArchetype('unmapped-decor', 'coffee', 'decor');
  assert.ok(['central-fountain', 'rest-pavilion', 'tasting-court', 'cloud-swing', 'rhythm-stage', 'coral-aquarium', 'observatory-dome', 'sculpture-plaza', 'yoga-deck', 'cloud-walk'].includes(facility));
  assert.ok(['colorful-planter', 'garden-lights', 'gallery-frames', 'shell-lantern', 'starlight-mobile', 'neon-sign', 'aroma-diffuser', 'spice-display', 'rainbow-arch', 'wooden-bench', 'sculpture-plaza'].includes(decor));
});

test('each dog staff decoration keeps its distinct illustrated visual', () => {
  for (const visual of [
    'dog-staff-huahua',
    'dog-staff-milkshake',
    'dog-staff-xiaoniu',
    'dog-staff-pudding',
  ]) {
    assert.equal(resolveMallObjectArchetype(visual, 'heart', 'decor'), visual);
  }
});
