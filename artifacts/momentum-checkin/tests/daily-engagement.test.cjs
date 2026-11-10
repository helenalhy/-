const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const appRoot = path.join(__dirname, '..');
const source = fs.readFileSync(path.join(appRoot, 'lib/daily-engagement.ts'), 'utf8');
const output = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true },
}).outputText;

const mallFloors = Array.from({ length: 20 }, (_, index) => ({ title: `樓層${index + 1}` }));
const guestCounts = Array.from({ length: 20 }, () => 10);
const dogProfiles = Array.from({ length: 14 }, (_, index) => ({ key: `dog-${index}`, name: `狗狗${index}` }));
const helpers = { exports: {} };
new Function('require', 'module', 'exports', output)(
  (request) => {
    if (request === '@/constants/mall') return { MALL_FLOORS: mallFloors };
    if (request === '@/constants/mall-guests') return { GUEST_COUNTS_BY_FLOOR: guestCounts };
    if (request === '@/constants/dog-staff-customization') return { DOG_STAFF_PROFILES: dogProfiles };
    if (request === '@/lib/habit-schedule') {
      return {
        getLocalWeekStart(dateKey) {
          const [year, month, day] = dateKey.split('-').map(Number);
          const date = new Date(year, month - 1, day, 12);
          date.setDate(date.getDate() - ((date.getDay() + 6) % 7));
          return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        },
      };
    }
    throw new Error(`Unexpected daily-engagement dependency: ${request}`);
  },
  helpers,
  helpers.exports,
);

const {
  getDailyDogGreeting,
  getDailyMallVisitor,
  getNextDailyDogPose,
  getVisitorDiaryDates,
  getWeeklyMallEvent,
  getWeeklyMomentumDays,
} = helpers.exports;

test('daily visitors rotate across all twenty existing floor themes', () => {
  const visitors = Array.from({ length: 20 }, (_, index) => {
    const day = String(index + 1).padStart(2, '0');
    return getDailyMallVisitor(`2026-01-${day}`);
  });
  assert.equal(new Set(visitors.map((visitor) => visitor.floor)).size, 20);
  assert.ok(visitors.every((visitor) => visitor.floorTitle === `樓層${visitor.floor}`));
  assert.ok(visitors.every((visitor) => visitor.guestIndex >= 0 && visitor.guestIndex < 10));
});

test('visitor diary keeps recent unique completed dates and excludes future entries', () => {
  assert.deepEqual(
    getVisitorDiaryDates([
      '2026-11-01',
      '2026-11-02',
      '2026-11-02',
      '2026-11-03',
      '2026-11-04',
      '2026-11-05',
      '2026-11-06',
      '2026-11-07',
      '2026-11-08',
      '2026-11-09',
    ], '2026-11-08'),
    ['2026-11-08', '2026-11-07', '2026-11-06', '2026-11-05', '2026-11-04', '2026-11-03', '2026-11-02', '2026-11-01'],
  );
});

test('weekly mall event counts distinct completed dates only in the current week', () => {
  const habits = [
    { checkIns: ['2026-11-02', '2026-11-03', '2026-10-31'] },
    { checkIns: ['2026-11-02', '2026-11-06', '2026-11-10'] },
  ];
  assert.equal(getWeeklyMomentumDays(habits, '2026-11-06'), 3);
  assert.equal(getWeeklyMallEvent('2026-11-06').targetDays, 5);
  assert.equal(getWeeklyMallEvent('2026-11-06').title, getWeeklyMallEvent('2026-11-07').title);
});

test('daily companion rotates through all fourteen profiles and greetings', () => {
  const companions = Array.from({ length: 14 }, (_, index) => {
    const day = String(index + 1).padStart(2, '0');
    return getDailyDogGreeting(`2026-01-${day}`);
  });
  assert.equal(new Set(companions.map(({ dog }) => dog.key)).size, 14);
  assert.equal(new Set(companions.map(({ greeting }) => greeting)).size, 14);
  assert.ok(companions.every(({ greeting }) => typeof greeting === 'string' && greeting.length > 0));
  assert.equal(
    getDailyDogGreeting('2026-01-01').greeting,
    getDailyDogGreeting('2026-01-01').greeting,
  );
  assert.notEqual(
    getDailyDogGreeting('2026-01-01', 'gentle').greeting,
    getDailyDogGreeting('2026-01-01', 'concise').greeting,
  );
  assert.notEqual(
    getDailyDogGreeting('2026-01-01', 'gentle').greeting,
    getDailyDogGreeting('2026-01-01', 'energetic').greeting,
  );
});

test('daily dog heart pose cycle stays on poses two through four', () => {
  assert.equal(getNextDailyDogPose(2), 3);
  assert.equal(getNextDailyDogPose(3), 4);
  assert.equal(getNextDailyDogPose(4), 2);
});

test('engagement cards show up in Today without adding reward or changing restart behavior', () => {
  const today = fs.readFileSync(path.join(appRoot, 'app/(tabs)/index.tsx'), 'utf8');
  const components = fs.readFileSync(path.join(appRoot, 'components/DailyEngagement.tsx'), 'utf8');
  const dogStaff = fs.readFileSync(path.join(appRoot, 'components/DogStaffCustomizer.tsx'), 'utf8');
  assert.match(today, /<DailyDogGreetingCard/);
  assert.match(today, /<DailyDogTaskCard/);
  assert.match(today, /<DailyLoginRewardCard/);
  assert.match(today, /<DailyMallVisitorCard/);
  assert.match(today, /<WeeklyMallEventCard/);
  assert.match(today, /<DailyRecapCard/);
  assert.match(today, /<DailyMoodCard/);
  assert.match(today, /<DailyPostcardCard/);
  assert.match(today, /<UrgeSupportCard today=\{today\} \/>/);
  assert.match(today, /readEncouragementStyle/);
  assert.match(today, /toggle-low-energy-mode/);
  assert.match(today, /gentle-restart-card/);
  assert.match(components, /source=\{getDogFluffyImage\(dog\.key, displayedPose\)\}/);
  assert.match(components, /setGreeted\(true\)/);
  assert.match(components, /setPoseState/);
  assert.match(dogStaff, /AsyncStorage\.getItem\(DOG_STAFF_LIST_ART_STYLE_KEY\)/);
  assert.match(dogStaff, /AsyncStorage\.setItem\(DOG_STAFF_LIST_ART_STYLE_KEY, style\)/);
  assert.match(dogStaff, /useState<DogStaffListArtStyle>\('fluffy'\)/);
  assert.match(dogStaff, /id: 'fluffy'/);
  assert.match(dogStaff, /id: 'original'/);
  assert.match(dogStaff, /testID=\{`dog-staff-art-style-\$\{option\.id\}`\}/);
  assert.match(components, /平常的目標就會累積/);
  assert.match(components, /本週活動完成/);
  assert.match(components, /商場訪客日記/);
  assert.match(components, /每日小任務/);
  assert.match(components, /claim-daily-dog-task/);
  assert.match(components, /每日簽到獎勵/);
  assert.match(components, /claim-daily-login-reward/);
  assert.match(components, /daily-login-prize-preview/);
  assert.match(components, /daily-login-prize-modal/);
  assert.match(components, /DAILY_DOG_TASK_REWARD/);
  assert.match(components, /celebrationCount <= previousCelebrationCount\.current/);
  assert.match(components, /outputRange: \[0, -20\]/);
  assert.match(components, /const confettiPieces =/);
  assert.match(components, /styles\.confettiPiece/);
});

test('all 56 README-mapped dog poses and transparent staff images are bundled', () => {
  const assetDir = path.join(appRoot, 'assets/dogs-fluffy');
  const readme = fs.readFileSync(path.join(assetDir, 'README.txt'), 'utf8');
  const expectedNames = [...readme.matchAll(/^(\S+\.webp)\s*=/gm)].map((match) => match[1]).sort();
  const bundledNames = fs.readdirSync(assetDir).filter((name) => name.endsWith('.webp')).sort();
  const imageMap = fs.readFileSync(path.join(appRoot, 'constants/dog-fluffy-images.ts'), 'utf8');
  const profileSource = fs.readFileSync(path.join(appRoot, 'constants/dog-staff-customization.ts'), 'utf8');
  const staffCustomizer = fs.readFileSync(path.join(appRoot, 'components/DogStaffCustomizer.tsx'), 'utf8');
  const dailyEngagement = fs.readFileSync(path.join(appRoot, 'components/DailyEngagement.tsx'), 'utf8');
  const expectedTransparentNames = expectedNames
    .filter((name) => /-1-wave\.webp$/.test(name))
    .map((name) => name.replace(/\.webp$/, '-nobg.png'))
    .sort();
  const mappedPoseNames = [...imageMap.matchAll(/require\(['"]\.\.\/assets\/dogs-fluffy\/([^'"]+\.webp)['"]\)/g)]
    .map((match) => match[1])
    .sort();
  const bundledTransparentNames = fs.readdirSync(assetDir).filter((name) => name.endsWith('-nobg.png')).sort();
  const mappedTransparentNames = [...imageMap.matchAll(/require\(['"]\.\.\/assets\/dogs-fluffy\/([^'"]+-nobg\.png)['"]\)/g)]
    .map((match) => match[1])
    .sort();
  const mappedProfileKeys = [...imageMap.matchAll(/^  '([^']+)': \{$/gm)].map((match) => match[1]).sort();
  const profileKeys = [...profileSource.matchAll(/key: '(fluffy-staff-[^']+)'/g)].map((match) => match[1]).sort();
  assert.equal(expectedNames.length, 56);
  assert.deepEqual(bundledNames, expectedNames);
  assert.deepEqual(mappedPoseNames, expectedNames);
  assert.deepEqual(bundledTransparentNames, expectedTransparentNames);
  assert.deepEqual(mappedTransparentNames, expectedTransparentNames);
  assert.deepEqual(mappedProfileKeys, profileKeys);
  assert.match(imageMap, /'fluffy-staff-amber':[\s\S]*hupo-1-wave\.webp/);
  assert.match(imageMap, /'fluffy-staff-cloud':[\s\S]*yunduo-1-wave\.webp/);
  assert.match(imageMap, /'fluffy-staff-poppy':[\s\S]*bobi-1-wave\.webp/);
  assert.match(imageMap, /getDogFluffyStaffImage/);
  assert.match(staffCustomizer, /source=\{getDogFluffyStaffImage\(dog\.key\)\}/);
  assert.match(dailyEngagement, /source=\{getDogFluffyImage\(dog\.key, displayedPose\)\}/);
});
