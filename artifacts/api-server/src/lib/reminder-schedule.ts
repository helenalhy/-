export interface DueReminderTimesInput {
  reminderTimes: string[];
  fallbackReminderTime: string;
  localDate: string;
  localTime: string;
  lastSentLocalDates: Record<string, string> | null;
  legacyLastSentLocalDate: string | null;
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
