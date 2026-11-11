const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const source = fs.readFileSync(path.join(__dirname, '../lib/dog-companion.ts'), 'utf8');
const output = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true },
}).outputText;
const helpers = { exports: {} };
new Function('module', 'exports', output)(helpers, helpers.exports);

const {
  createEmptyDogCompanionState,
  recordDogCompanionInteraction,
  claimDogCollectionRewards,
  DOG_COLLECTION_REWARD_UNLOCKS,
} = helpers.exports;

test('dog affection is once per interaction type per day and capped at four', () => {
  const dogId = 'dog-huahua';
  let state = createEmptyDogCompanionState();
  const firstFeed = recordDogCompanionInteraction(state, dogId, '2026-11-11', 'feed', 2);
  assert.equal(firstFeed.affectionGained, 2);
  state = firstFeed.state;

  const repeatFeed = recordDogCompanionInteraction(state, dogId, '2026-11-11', 'feed', 2);
  assert.equal(repeatFeed.affectionGained, 0);
  assert.equal(repeatFeed.alreadyCountedToday, true);
  state = repeatFeed.state;

  const pet = recordDogCompanionInteraction(state, dogId, '2026-11-11', 'pet', 1);
  state = pet.state;
  const play = recordDogCompanionInteraction(state, dogId, '2026-11-11', 'play', 1);
  state = play.state;
  const photoAtLimit = recordDogCompanionInteraction(state, dogId, '2026-11-11', 'photo', 1);
  assert.equal(photoAtLimit.affectionGained, 0);
  assert.equal(photoAtLimit.dailyLimitReached, true);
  assert.equal(photoAtLimit.state.daily[dogId].actions.length, 4);
  assert.equal(photoAtLimit.affection, 4);

  const nextDay = recordDogCompanionInteraction(photoAtLimit.state, dogId, '2026-11-12', 'feed', 2);
  assert.equal(nextDay.affectionGained, 2);
  assert.equal(nextDay.affection, 6);
});

test('ten affection hearts grant one 20-coin milestone per dog', () => {
  const dogId = 'dog-pipi';
  const previous = {
    ...createEmptyDogCompanionState(),
    affection: { [dogId]: 9 },
  };
  const milestone = recordDogCompanionInteraction(previous, dogId, '2026-11-11', 'pet', 1);
  assert.equal(milestone.affection, 10);
  assert.equal(milestone.affectionRewardCoins, 20);

  const afterClaim = recordDogCompanionInteraction(milestone.state, dogId, '2026-11-12', 'pet', 1);
  assert.equal(afterClaim.affectionRewardCoins, 0);
  assert.deepEqual(afterClaim.state.affectionMilestoneClaimed, [dogId]);
});

test('collection rewards grant once at five, ten, and fourteen owned dogs', () => {
  const dogs = Array.from({ length: 14 }, (_, index) => `dog-${index + 1}`);
  let state = createEmptyDogCompanionState();
  let result = claimDogCollectionRewards(state, dogs.slice(0, 4), dogs);
  assert.equal(result.bonusCoins, 0);
  assert.deepEqual(result.newlyClaimedTiers, []);

  result = claimDogCollectionRewards(state, dogs.slice(0, 5), dogs);
  assert.equal(result.bonusCoins, 50);
  assert.deepEqual(result.newlyClaimedTiers, [5]);
  state = result.state;

  result = claimDogCollectionRewards(state, dogs.slice(0, 10), dogs);
  assert.equal(result.bonusCoins, 0);
  assert.ok(result.state.collectionRewardUnlocks.includes(DOG_COLLECTION_REWARD_UNLOCKS.limitedDecoration));
  state = result.state;

  result = claimDogCollectionRewards(state, dogs, dogs);
  assert.equal(result.bonusCoins, 200);
  assert.deepEqual(result.newlyClaimedTiers, [14]);
  assert.ok(result.state.collectionRewardUnlocks.includes(DOG_COLLECTION_REWARD_UNLOCKS.masterTitle));
  assert.ok(result.state.collectionRewardUnlocks.includes(DOG_COLLECTION_REWARD_UNLOCKS.goldenMarshmallow));

  result = claimDogCollectionRewards(result.state, dogs, dogs);
  assert.equal(result.bonusCoins, 0);
  assert.deepEqual(result.newlyClaimedTiers, []);
});
