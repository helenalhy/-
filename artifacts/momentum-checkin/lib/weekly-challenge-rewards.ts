import { MALL_ITEMS } from '@/constants/mall';
import { getLocalWeekStart } from '@/lib/habit-schedule';

const DECORATION_REWARDS = MALL_ITEMS.filter((item) => item.category === 'decor');

function getDateOrdinal(dateKey: string): number {
  const [year, month, day] = dateKey.split('-').map(Number);
  return Math.floor(Date.UTC(year, month - 1, day) / 86_400_000);
}

export function getWeeklyChallengeRewardItemId(
  today: string,
  ownedItemIds: readonly string[],
): string | null {
  if (DECORATION_REWARDS.length === 0) return null;
  const weekStart = getLocalWeekStart(today);
  const startIndex = getDateOrdinal(weekStart) % DECORATION_REWARDS.length;
  const owned = new Set(ownedItemIds);
  for (let offset = 0; offset < DECORATION_REWARDS.length; offset += 1) {
    const item = DECORATION_REWARDS[(startIndex + offset) % DECORATION_REWARDS.length];
    if (!owned.has(item.id)) return item.id;
  }
  return DECORATION_REWARDS[startIndex].id;
}
