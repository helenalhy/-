const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');

const appRoot = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(appRoot, 'constants/user-profile.ts'), 'utf8');
const settings = fs.readFileSync(path.join(appRoot, 'app/(tabs)/settings.tsx'), 'utf8');
const apiSpec = fs.readFileSync(path.resolve(appRoot, '../../lib/api-spec/openapi.yaml'), 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
const loadedModule = { exports: {} };
new Function('module', 'exports', compiled)(loadedModule, loadedModule.exports);
const {
  DEFAULT_USER_PROFILE,
  PROFILE_AVATARS,
  PROFILE_DOG_AVATAR_IDS,
  hasCustomUserProfile,
  normalizeUserProfile,
} = loadedModule.exports;

test('profile normalizer trims and limits nicknames and validates avatar choices', () => {
  assert.deepEqual(normalizeUserProfile({ nickname: '  小星星  ', avatarId: 'star' }), {
    nickname: '小星星',
    avatarId: 'star',
  });
  assert.equal(normalizeUserProfile({ nickname: 'A'.repeat(40), avatarId: 'unknown' }).nickname.length, 24);
  assert.equal(normalizeUserProfile({ nickname: 'Name', avatarId: 'unknown' }).avatarId, DEFAULT_USER_PROFILE.avatarId);
  assert.equal(PROFILE_AVATARS.length, 12);
  assert.equal(PROFILE_DOG_AVATAR_IDS.length, 14);
  assert.equal(normalizeUserProfile({ nickname: '小星星', avatarId: 'fluffy-staff-huahua' }).avatarId, 'fluffy-staff-huahua');
  for (const id of PROFILE_DOG_AVATAR_IDS) assert.ok(apiSpec.includes(`- ${id}`), `${id} must be accepted by cloud sync`);
});

test('settings offers bundled cartoon dog staff images as selectable profile avatars', () => {
  assert.match(settings, /DOG_STAFF_PROFILES/);
  assert.match(settings, /getUserProfileDogImage\(dog\.key\)/);
  assert.match(settings, /testID=\{`profile-avatar-\$\{dog\.key\}`\}/);
  assert.match(settings, /profileDogAvatarFrame/);
  assert.doesNotMatch(settings, /getDogFluffyStaffImage/);
  const imageMap = fs.readFileSync(path.join(appRoot, 'constants/user-profile-images.ts'), 'utf8');
  const assets = [...imageMap.matchAll(/require\('(\.\.\/assets\/profile-avatars\/[^']+\.png)'\)/g)];
  assert.equal(assets.length, 14);
  for (const id of PROFILE_DOG_AVATAR_IDS) assert.ok(imageMap.includes(`'${id}'`), id);
  for (const [, relativePath] of assets) {
    const png = fs.readFileSync(path.resolve(appRoot, 'constants', relativePath));
    assert.equal(png.readUInt32BE(16), 512, `${relativePath} has a padded square canvas`);
    assert.equal(png.readUInt32BE(20), 512);
  }
});

test('only a custom nickname or non-default avatar counts as local profile data', () => {
  assert.equal(hasCustomUserProfile(DEFAULT_USER_PROFILE), false);
  assert.equal(hasCustomUserProfile({ nickname: '小星星', avatarId: 'sun' }), true);
  assert.equal(hasCustomUserProfile({ nickname: '', avatarId: 'heart' }), true);
});
