export const WEEKDAY_OPTIONS = [
  { value: 1, label: '一' },
  { value: 2, label: '二' },
  { value: 3, label: '三' },
  { value: 4, label: '四' },
  { value: 5, label: '五' },
  { value: 6, label: '六' },
  { value: 0, label: '日' },
] as const;

export const MAKEUP_USE_PREFIX = 'makeup-used:';

export interface HabitSchedule {
  checkIns: readonly string[];
  restDays?: readonly number[];
  makeupCheckIns?: readonly string[];
  createdAt?: string;
}

function parseDateKey(dateKey: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey);
  if (!match) throw new RangeError(`Invalid local date: ${dateKey}`);
  const [, year, month, day] = match.map(Number);
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year
    || date.getMonth() !== month - 1
    || date.getDate() !== day
  ) {
    throw new RangeError(`Invalid local date: ${dateKey}`);
  }
  return date;
}

export function getWeekday(dateKey: string): number {
  return parseDateKey(dateKey).getDay();
}

export function getPreviousLocalDate(dateKey: string): string {
  const date = parseDateKey(dateKey);
  date.setDate(date.getDate() - 1);
  return formatLocalDate(date);
}

export function getLocalWeekStart(dateKey: string): string {
  const date = parseDateKey(dateKey);
  date.setDate(date.getDate() - ((date.getDay() + 6) % 7));
  return formatLocalDate(date);
}

export function getWeeklyCheckInCount(checkIns: readonly string[], today: string): number {
  const weekStart = getLocalWeekStart(today);
  return new Set(checkIns.filter((dateKey) => dateKey >= weekStart && dateKey <= today)).size;
}

export function getWeeklyChallengeLimit(restDays: readonly number[]): number {
  return Math.max(0, 7 - new Set(restDays).size);
}

export function getPreviousScheduledDate(
  today: string,
  restDays: readonly number[] = [],
  createdAt?: string,
): string | null {
  const scheduledRestDays = new Set(restDays);
  let cursor = getPreviousLocalDate(today);
  for (let scanned = 0; scanned < 7; scanned += 1) {
    if (createdAt && cursor < createdAt) return null;
    if (!scheduledRestDays.has(getWeekday(cursor))) return cursor;
    cursor = getPreviousLocalDate(cursor);
  }
  return null;
}

export function canMakeUpYesterday(
  habit: HabitSchedule,
  today: string,
  allMakeupDates: readonly string[] = habit.makeupCheckIns ?? [],
): boolean {
  const yesterday = getPreviousLocalDate(today);
  if (habit.createdAt && habit.createdAt > yesterday) return false;
  if (habit.checkIns.includes(yesterday)) return false;
  if (habit.restDays?.includes(getWeekday(yesterday))) return false;
  const yesterdayWeek = getLocalWeekStart(yesterday);
  return !allMakeupDates.some((dateKey) => getLocalWeekStart(dateKey) === yesterdayWeek);
}

export function getStreak(checkIns: readonly string[], today: string, restDays: readonly number[] = []): number {
  const dates = new Set(checkIns);
  const scheduledRestDays = new Set(restDays);
  let cursor = dates.has(today) || scheduledRestDays.has(getWeekday(today))
    ? today
    : getPreviousLocalDate(today);
  let count = 0;
  let scanned = 0;
  while (scanned < 3660) {
    scanned += 1;
    if (dates.has(cursor)) {
      count += 1;
    } else if (!scheduledRestDays.has(getWeekday(cursor))) {
      break;
    }
    cursor = getPreviousLocalDate(cursor);
  }
  return count;
}

function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
