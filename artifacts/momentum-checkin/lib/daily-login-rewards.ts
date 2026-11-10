import { getPreviousLocalDate } from '@/lib/habit-schedule';
import { MALL_ITEMS, type MallItem } from '@/constants/mall';

export const DAILY_LOGIN_COINS = 5;
export const DAILY_LOGIN_STREAK_LENGTH = 7;
export const DAILY_LOGIN_STREAK_BONUS_COINS = 30;

export function getDailyLoginDecorationPrize(purchasedItemIds: readonly string[]): MallItem | null {
  return MALL_ITEMS.find((item) => (
    item.category === 'decor'
    && item.unlockCheckIns === undefined
    && item.price >= 40
    && !purchasedItemIds.includes(item.id)
  )) ?? null;
}

export function getNextDailyLoginStreak(
  today: string,
  lastLoginDate: string | null,
  previousStreak: number,
): number {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(today)) throw new RangeError(`Invalid local date key: ${today}`);
  const [year, month, day] = today.split('-').map(Number);
  const parsedDate = new Date(Date.UTC(year, month - 1, day));
  if (parsedDate.getUTCFullYear() !== year
    || parsedDate.getUTCMonth() !== month - 1
    || parsedDate.getUTCDate() !== day) {
    throw new RangeError(`Invalid local date key: ${today}`);
  }
  if (lastLoginDate === today) return Math.max(0, Math.min(DAILY_LOGIN_STREAK_LENGTH, previousStreak));
  if (lastLoginDate === getPreviousLocalDate(today)) {
    return previousStreak >= DAILY_LOGIN_STREAK_LENGTH ? 1 : Math.max(1, previousStreak + 1);
  }
  return 1;
}
