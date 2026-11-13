import { DOG_STAFF_PROFILES, type DogStaffProfile } from '@/constants/dog-staff-customization';
import { MALL_ITEMS, type MallItem } from '@/constants/mall';

export type DailyMallSurprise =
  | { kind: 'dog'; dog: DogStaffProfile }
  | { kind: 'decoration'; item: MallItem };

const DOG_VISITORS = DOG_STAFF_PROFILES;
const decorationCatalog = MALL_ITEMS.filter(
  (item) => item.category === 'decor' && item.unlockCheckIns === undefined,
);
const TEMPORARY_DECORATIONS = Array.from(
  { length: Math.min(DOG_VISITORS.length, decorationCatalog.length) },
  (_, index) => decorationCatalog[Math.floor(index * decorationCatalog.length / DOG_VISITORS.length)],
);

function getDateOrdinal(dateKey: string): number {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) throw new RangeError(`Invalid local date key: ${dateKey}`);
  const [year, month, day] = dateKey.split('-').map(Number);
  const timestamp = Date.UTC(year, month - 1, day);
  const date = new Date(timestamp);
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    throw new RangeError(`Invalid local date key: ${dateKey}`);
  }
  return Math.floor(timestamp / (24 * 60 * 60 * 1000));
}

export function getDailyMallSurprise(dateKey: string): DailyMallSurprise {
  const ordinal = getDateOrdinal(dateKey);
  const surpriseCount = DOG_VISITORS.length + TEMPORARY_DECORATIONS.length;
  const index = ((ordinal * 11 + 5) % surpriseCount + surpriseCount) % surpriseCount;
  if (index < DOG_VISITORS.length) {
    return { kind: 'dog', dog: DOG_VISITORS[index] };
  }
  return { kind: 'decoration', item: TEMPORARY_DECORATIONS[index - DOG_VISITORS.length] };
}

export function getDailyMallSurpriseRedeemPrice(regularPrice: number): number {
  if (!Number.isFinite(regularPrice) || regularPrice < 0) {
    throw new RangeError('A daily surprise price must be a non-negative number.');
  }
  return Math.max(1, Math.floor(regularPrice / 2));
}

export function getDailyMallSurpriseRotationLength(): number {
  return DOG_VISITORS.length + TEMPORARY_DECORATIONS.length;
}
