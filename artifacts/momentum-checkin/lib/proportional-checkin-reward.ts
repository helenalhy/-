export const FULL_CHECK_IN_REWARD = 20;
export const UNMEASURABLE_MINIMUM_REWARD_RATIO = 0.25;

type MeasurementUnit =
  | 'minutes'
  | 'pages'
  | 'distance'
  | 'repetitions'
  | 'milliliters'
  | 'words'
  | 'items'
  | 'sentences'
  | 'chapters';

interface Measurement {
  amount: number;
  unit: MeasurementUnit;
}

const NUMBER_WORDS: Record<string, number> = {
  zero: 0,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  一: 1,
  二: 2,
  兩: 2,
  两: 2,
  三: 3,
  四: 4,
  五: 5,
  六: 6,
  七: 7,
  八: 8,
  九: 9,
  十: 10,
};

const QUANTITY_PATTERN = /(\d+(?:\.\d+)?|zero|one|two|three|four|five|six|seven|eight|nine|ten|[一二兩两三四五六七八九十]+)\s*(小時|小时|hours?|hrs?|分鐘|分钟|minutes?|mins?|分|頁|页|pages?|公里|千米|km|公尺|meters?|米|毫升|milliliters?|millilitres?|ml|公升|升|liters?|litres?|l|m|次|回|下|reps?|字|words?|個|件|項|个|项|句|篇|章)/i;

function parseAmount(value: string): number | undefined {
  const normalized = value.toLowerCase();
  if (/^\d/.test(normalized)) {
    const amount = Number(normalized);
    return Number.isFinite(amount) && amount >= 0 ? amount : undefined;
  }
  if (/^(?:zero|one|two|three|four|five|six|seven|eight|nine|ten)$/.test(normalized)) {
    return NUMBER_WORDS[normalized];
  }
  if (NUMBER_WORDS[value] !== undefined) return NUMBER_WORDS[value];

  const tensIndex = value.indexOf('十');
  if (tensIndex >= 0) {
    const tensWord = value.slice(0, tensIndex);
    const onesWord = value.slice(tensIndex + 1);
    const tens = tensWord ? NUMBER_WORDS[tensWord] : 1;
    const ones = onesWord ? NUMBER_WORDS[onesWord] : 0;
    if (tens !== undefined && ones !== undefined) return tens * 10 + ones;
  }
  return undefined;
}

function normalizeUnit(unit: string): MeasurementUnit | undefined {
  const value = unit.toLowerCase();
  if (/^(?:小時|小时|hours?|hrs?)$/.test(value)) return 'minutes';
  if (/^(?:分鐘|分钟|minutes?|mins?|分)$/.test(value)) return 'minutes';
  if (/^(?:頁|页|pages?)$/.test(value)) return 'pages';
  if (/^(?:公里|千米|km|公尺|meters?|米|m)$/.test(value)) return 'distance';
  if (/^(?:次|回|下|reps?)$/.test(value)) return 'repetitions';
  if (/^(?:毫升|milliliters?|millilitres?|ml|公升|升|liters?|litres?|l)$/.test(value)) return 'milliliters';
  if (/^(?:字|words?)$/.test(value)) return 'words';
  if (/^(?:個|件|項|个|项)$/.test(value)) return 'items';
  if (/^(?:句|篇)$/.test(value)) return 'sentences';
  if (value === '章') return 'chapters';
  return undefined;
}

function toBaseUnits(amount: number, unit: string): Measurement | undefined {
  const normalizedUnit = normalizeUnit(unit);
  if (!normalizedUnit) return undefined;

  let baseAmount = amount;
  if (/^(?:小時|小时|hours?|hrs?)$/i.test(unit)) baseAmount *= 60;
  if (/^(?:公里|千米|km)$/i.test(unit)) baseAmount *= 1000;
  if (/^(?:公升|升|liters?|litres?|l)$/i.test(unit)) baseAmount *= 1000;
  return { amount: baseAmount, unit: normalizedUnit };
}

function extractMeasurement(text: string): Measurement | undefined {
  const match = QUANTITY_PATTERN.exec(text);
  if (!match) return undefined;
  const amount = parseAmount(match[1]);
  return amount === undefined ? undefined : toBaseUnits(amount, match[2]);
}

/**
 * Pays a fraction of the normal daily reward for a confirmed minimum action.
 * Matching measurable units use the action/goal ratio. Unmeasurable goals
 * receive a modest quarter reward, with at least one coin for a valid action.
 */
export function getMinimumActionReward(
  goalTitle: string,
  minimumAction: string,
  fullReward = FULL_CHECK_IN_REWARD,
): number {
  const safeFullReward = Number.isFinite(fullReward)
    ? Math.max(0, Math.floor(fullReward))
    : FULL_CHECK_IN_REWARD;
  if (safeFullReward === 0) return 0;

  const goal = extractMeasurement(goalTitle);
  const action = extractMeasurement(minimumAction);
  const ratio = goal && action && goal.unit === action.unit && goal.amount > 0
    ? Math.min(1, action.amount / goal.amount)
    : UNMEASURABLE_MINIMUM_REWARD_RATIO;

  return Math.min(safeFullReward, Math.max(1, Math.floor(safeFullReward * ratio)));
}
