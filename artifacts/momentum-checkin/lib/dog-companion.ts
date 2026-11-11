export type DogCompanionAction = 'feed' | 'pet' | 'play' | 'photo';

export interface DogCompanionDailyProgress {
  date: string;
  actions: DogCompanionAction[];
  affectionEarned: number;
}

export interface DogCompanionState {
  affection: Record<string, number>;
  daily: Record<string, DogCompanionDailyProgress>;
  affectionMilestoneClaimed: string[];
  collectionRewardTiers: number[];
  collectionRewardUnlocks: string[];
}

export interface DogCompanionInteractionResult {
  state: DogCompanionState;
  affection: number;
  affectionGained: number;
  affectionRewardCoins: number;
  alreadyCountedToday: boolean;
  dailyLimitReached: boolean;
}

export interface DogCollectionRewardResult {
  state: DogCompanionState;
  bonusCoins: number;
  newlyClaimedTiers: number[];
}

export const DOG_COMPANION_SHOP_ID = 'fluffy-marshmallow-cafe';
export const DOG_FEED_COST = 5;
export const DAILY_DOG_AFFECTION_LIMIT = 4;
export const DOG_AFFECTION_REWARD_THRESHOLD = 10;
export const DOG_AFFECTION_REWARD_COINS = 20;

export const DOG_COLLECTION_REWARD_UNLOCKS = {
  limitedDecoration: 'dog-collection-limited-decoration',
  masterTitle: 'dog-master-title',
  goldenMarshmallow: 'dog-collection-golden-marshmallow',
} as const;

export const DOG_COLLECTION_REWARD_TIERS = [5, 10, 14] as const;

const DOG_COMPANION_ACTIONS = new Set<DogCompanionAction>(['feed', 'pet', 'play', 'photo']);
const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === 'string');
}

function isIntegerRecord(value: unknown): value is Record<string, number> {
  return isRecord(value)
    && Object.values(value).every((entry) => Number.isInteger(entry) && Number(entry) >= 0);
}

export function createEmptyDogCompanionState(): DogCompanionState {
  return {
    affection: {},
    daily: {},
    affectionMilestoneClaimed: [],
    collectionRewardTiers: [],
    collectionRewardUnlocks: [],
  };
}

export function isValidDogCompanionState(value: unknown): value is DogCompanionState {
  if (!isRecord(value)
    || !isIntegerRecord(value.affection)
    || !isRecord(value.daily)
    || !isStringArray(value.affectionMilestoneClaimed)
    || !Array.isArray(value.collectionRewardTiers)
    || !value.collectionRewardTiers.every((tier) => DOG_COLLECTION_REWARD_TIERS.includes(tier as 5 | 10 | 14))
    || !isStringArray(value.collectionRewardUnlocks)) {
    return false;
  }
  return Object.values(value.daily).every((entry) => (
    isRecord(entry)
    && typeof entry.date === 'string'
    && DATE_KEY_PATTERN.test(entry.date)
    && Array.isArray(entry.actions)
    && entry.actions.every((action) => DOG_COMPANION_ACTIONS.has(action as DogCompanionAction))
    && new Set(entry.actions).size === entry.actions.length
    && Number.isInteger(entry.affectionEarned)
    && Number(entry.affectionEarned) >= 0
    && Number(entry.affectionEarned) <= DAILY_DOG_AFFECTION_LIMIT
  ));
}

export function normalizeDogCompanionState(value: unknown): DogCompanionState {
  if (!isValidDogCompanionState(value)) return createEmptyDogCompanionState();
  return {
    affection: { ...value.affection },
    daily: Object.fromEntries(Object.entries(value.daily).map(([dogId, entry]) => [
      dogId,
      {
        date: entry.date,
        actions: [...entry.actions],
        affectionEarned: entry.affectionEarned,
      },
    ])),
    affectionMilestoneClaimed: [...new Set(value.affectionMilestoneClaimed)],
    collectionRewardTiers: [...new Set(value.collectionRewardTiers)],
    collectionRewardUnlocks: [...new Set(value.collectionRewardUnlocks)],
  };
}

export function recordDogCompanionInteraction(
  previous: DogCompanionState | undefined,
  dogId: string,
  date: string,
  action: DogCompanionAction,
  requestedAffection: number,
): DogCompanionInteractionResult {
  const current = normalizeDogCompanionState(previous);
  const previousDaily = current.daily[dogId];
  const daily = previousDaily?.date === date
    ? previousDaily
    : { date, actions: [], affectionEarned: 0 };
  const alreadyCountedToday = daily.actions.includes(action);
  const requested = alreadyCountedToday ? 0 : Math.max(0, Math.floor(requestedAffection));
  const affectionGained = Math.min(
    requested,
    Math.max(0, DAILY_DOG_AFFECTION_LIMIT - daily.affectionEarned),
  );
  const affection = (current.affection[dogId] ?? 0) + affectionGained;
  const nextDaily: DogCompanionDailyProgress = {
    date,
    actions: alreadyCountedToday ? [...daily.actions] : [...daily.actions, action],
    affectionEarned: daily.affectionEarned + affectionGained,
  };
  const rewardClaimed = current.affectionMilestoneClaimed.includes(dogId);
  const affectionRewardCoins = !rewardClaimed && affection >= DOG_AFFECTION_REWARD_THRESHOLD
    ? DOG_AFFECTION_REWARD_COINS
    : 0;
  const state: DogCompanionState = {
    ...current,
    affection: { ...current.affection, [dogId]: affection },
    daily: { ...current.daily, [dogId]: nextDaily },
    affectionMilestoneClaimed: affectionRewardCoins > 0
      ? [...current.affectionMilestoneClaimed, dogId]
      : current.affectionMilestoneClaimed,
  };
  return {
    state,
    affection,
    affectionGained,
    affectionRewardCoins,
    alreadyCountedToday,
    dailyLimitReached: affectionGained < requested && requested > 0,
  };
}

export function claimDogCollectionRewards(
  previous: DogCompanionState | undefined,
  ownedDecorationIds: string[],
  dogDecorationIds: string[],
): DogCollectionRewardResult {
  const current = normalizeDogCompanionState(previous);
  const owned = new Set(ownedDecorationIds);
  const ownedCount = dogDecorationIds.filter((id) => owned.has(id)).length;
  const claimed = new Set(current.collectionRewardTiers);
  const unlocks = new Set(current.collectionRewardUnlocks);
  const newlyClaimedTiers: number[] = [];
  let bonusCoins = 0;

  for (const tier of DOG_COLLECTION_REWARD_TIERS) {
    if (ownedCount < tier || claimed.has(tier)) continue;
    claimed.add(tier);
    newlyClaimedTiers.push(tier);
    if (tier === 5) bonusCoins += 50;
    if (tier === 10) unlocks.add(DOG_COLLECTION_REWARD_UNLOCKS.limitedDecoration);
    if (tier === 14) {
      bonusCoins += 200;
      unlocks.add(DOG_COLLECTION_REWARD_UNLOCKS.masterTitle);
      unlocks.add(DOG_COLLECTION_REWARD_UNLOCKS.goldenMarshmallow);
    }
  }

  return {
    state: {
      ...current,
      collectionRewardTiers: [...claimed].sort((left, right) => left - right),
      collectionRewardUnlocks: [...unlocks],
    },
    bonusCoins,
    newlyClaimedTiers,
  };
}
