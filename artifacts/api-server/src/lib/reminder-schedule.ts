export interface DueReminderTimesInput {
  reminderTimes: string[];
  fallbackReminderTime: string;
  localDate: string;
  localTime: string;
  lastSentLocalDates: Record<string, string> | null;
  legacyLastSentLocalDate: string | null;
}

export interface ReminderScheduleDefinition {
  scheduleId: string;
  reminderTimes: string[];
  habitTitle?: string;
}

export interface DueReminderBatchInput {
  schedules: ReminderScheduleDefinition[];
  fallbackReminderTime: string;
  localDate: string;
  localTime: string;
  lastSentLocalDates: Record<string, string> | null;
  legacyLastSentLocalDate: string | null;
}

export interface DueReminderBatch {
  time: string;
  keysToMarkSent: string[];
  habitTitles: string[];
}

export function getDueReminderBatch(input: DueReminderBatchInput): DueReminderBatch | null {
  const sentDates = input.lastSentLocalDates ?? {};
  const globalTimes = input.schedules
    .filter((schedule) => schedule.scheduleId === "global")
    .flatMap((schedule) => schedule.reminderTimes);
  const hasGlobalScheduleHistory = Object.keys(sentDates).some((key) => (
    key.startsWith("global:")
    || globalTimes.includes(key)
  ));
  const legacyAlreadySentToday = !hasGlobalScheduleHistory
    && input.legacyLastSentLocalDate === input.localDate;
  const dueSlots = input.schedules.flatMap((schedule) => (
    [...new Set(schedule.reminderTimes)].flatMap((time) => {
      const isGlobal = schedule.scheduleId === "global";
      const sentKey = `${schedule.scheduleId}:${time}`;
      if (time > input.localTime) return [];
      if (isGlobal && legacyAlreadySentToday) return [];
      if (sentDates[sentKey] === input.localDate) return [];
      if (isGlobal && sentDates[time] === input.localDate) return [];
      return [{ time, sentKey, habitTitle: schedule.habitTitle }];
    })
  )).sort((left, right) => left.time.localeCompare(right.time));

  if (dueSlots.length === 0) return null;
  const latestTime = dueSlots[dueSlots.length - 1].time;
  return {
    time: latestTime,
    keysToMarkSent: dueSlots.map((slot) => slot.sentKey),
    habitTitles: [...new Set(
      dueSlots
        .filter((slot) => slot.time === latestTime && slot.habitTitle)
        .map((slot) => slot.habitTitle as string),
    )],
  };
}

export function getDueReminderTimes(input: DueReminderTimesInput): string[] {
  const sentDates = input.lastSentLocalDates ?? {};
  const hasNewScheduleHistory = Object.keys(sentDates).length > 0;
  if (!hasNewScheduleHistory && input.legacyLastSentLocalDate === input.localDate) {
    return [];
  }

  const times = [...new Set(
    input.reminderTimes.length > 0
      ? input.reminderTimes
      : [input.fallbackReminderTime],
  )].sort();

  return times.filter((time) => (
    time <= input.localTime
    && sentDates[time] !== input.localDate
  ));
}
