export interface StreakHabitSchedule {
  checkIns: readonly string[];
  restDays?: readonly number[];
  createdAt?: string;
}

function parseDateKey(dateKey: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey);
  if (!match) throw new RangeError(`Invalid local date: ${dateKey}`);
  const [, year, month, day] = match.map(Number);
  const date = new Date(year, month - 1, day, 12);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    throw new RangeError(`Invalid local date: ${dateKey}`);
  }
  return date;
}

function formatDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function addDays(dateKey: string, days: number): string {
  const date = parseDateKey(dateKey);
  date.setDate(date.getDate() + days);
  return formatDateKey(date);
}

function isScheduledDate(habits: readonly StreakHabitSchedule[], dateKey: string): boolean {
  const weekday = parseDateKey(dateKey).getDay();
  return habits.some((habit) => (
    (!habit.createdAt || habit.createdAt <= dateKey)
    && !(habit.restDays ?? []).includes(weekday)
  ));
}

/**
 * Returns missed scheduled days after the most recent day with a real check-in
 * or a previously protected streak day. These dates affect streak continuity
 * only; they are never inserted into a goal's check-in history.
 */
export function getMissedScheduledStreakDates(
  habits: readonly StreakHabitSchedule[],
  today: string,
  protectedDates: readonly string[] = [],
): string[] {
  const yesterday = addDays(today, -1);
  const activityDates = new Set([
    ...habits.flatMap((habit) => habit.checkIns),
    ...protectedDates,
  ].filter((date) => date <= yesterday));
  const latestActivity = [...activityDates].sort().at(-1);
  if (!latestActivity) return [];

  const missed: string[] = [];
  let cursor = addDays(latestActivity, 1);
  let scanned = 0;
  while (cursor <= yesterday && scanned < 3660) {
    scanned += 1;
    if (isScheduledDate(habits, cursor) && !activityDates.has(cursor)) missed.push(cursor);
    cursor = addDays(cursor, 1);
  }
  return missed;
}

export function getStreakRescueDate(
  habits: readonly StreakHabitSchedule[],
  today: string,
  protectedDates: readonly string[],
  now = new Date(),
): string | null {
  const yesterday = addDays(today, -1);
  const missed = getMissedScheduledStreakDates(habits, today, protectedDates);
  if (missed[0] !== yesterday) return null;

  const todayStart = parseDateKey(today);
  todayStart.setHours(0, 0, 0, 0);
  const deadline = todayStart.getTime() + 24 * 60 * 60 * 1000;
  return now.getTime() < deadline ? yesterday : null;
}

export function getLocalMonthCalendarDays(year: number, monthIndex: number): Array<string | null> {
  const first = new Date(year, monthIndex, 1, 12);
  const dayCount = new Date(year, monthIndex + 1, 0, 12).getDate();
  const leadingBlanks = (first.getDay() + 6) % 7;
  const cellCount = Math.ceil((leadingBlanks + dayCount) / 7) * 7;
  return Array.from({ length: cellCount }, (_, index) => {
    const day = index - leadingBlanks + 1;
    if (day < 1 || day > dayCount) return null;
    return `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  });
}

export type CalendarDayStatus = 'future' | 'rest' | 'complete' | 'partial' | 'leave' | 'empty';

export function getCalendarDayStatus(
  habits: readonly StreakHabitSchedule[],
  dateKey: string,
  today: string,
  protectedDates: readonly string[] = [],
): CalendarDayStatus {
  if (dateKey > today) return 'future';
  const weekday = parseDateKey(dateKey).getDay();
  const active = habits.filter((habit) => !habit.createdAt || habit.createdAt <= dateKey);
  const scheduled = active.filter((habit) => !(habit.restDays ?? []).includes(weekday));
  if (scheduled.length === 0) return 'rest';
  const completedCount = scheduled.filter((habit) => habit.checkIns.includes(dateKey)).length;
  if (completedCount === scheduled.length) return 'complete';
  if (completedCount > 0) return 'partial';
  if (protectedDates.includes(dateKey)) return 'leave';
  return 'empty';
}

export function getCalendarDaySummary(
  habits: readonly StreakHabitSchedule[],
  dateKey: string,
): { completed: string[]; scheduled: string[]; isRestDay: boolean } {
  const weekday = parseDateKey(dateKey).getDay();
  const active = habits.filter((habit) => !habit.createdAt || habit.createdAt <= dateKey);
  const scheduledHabits = active.filter((habit) => !(habit.restDays ?? []).includes(weekday));
  return {
    completed: scheduledHabits.filter((habit) => habit.checkIns.includes(dateKey)).map((habit) => (
      'title' in habit && typeof habit.title === 'string' ? habit.title : ''
    )).filter(Boolean),
    scheduled: scheduledHabits.map((habit) => (
      'title' in habit && typeof habit.title === 'string' ? habit.title : ''
    )).filter(Boolean),
    isRestDay: scheduledHabits.length === 0,
  };
}
