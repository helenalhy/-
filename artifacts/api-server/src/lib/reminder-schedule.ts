export interface DueReminderTimesInput {
  reminderTimes: string[];
  fallbackReminderTime: string;
  localDate: string;
  localTime: string;
  lastSentLocalDates: Record<string, string> | null;
  legacyLastSentLocalDate: string | null;
  hasCheckedInToday?: boolean;
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
  hasCheckedInToday?: boolean;
}

export interface DueReminderBatch {
  time: string;
  keysToMarkSent: string[];
  habitTitles: string[];
}

export interface SnoozedReminderRecord {
  status: "pending" | "sent";
  habitId: string;
  habitTitle: string;
  fireAt: string;
  localDate: string;
}

export interface StoredSnoozedReminder {
  key: string;
  rawValue: string;
  record: SnoozedReminderRecord;
}

export function getStoredSnoozedReminders(
  values: Record<string, string> | null,
): StoredSnoozedReminder[] {
  return Object.entries(values ?? {}).flatMap(([key, rawValue]) => {
    if (!key.startsWith("snooze:")) return [];
    try {
      const value: unknown = JSON.parse(rawValue);
      if (!value || typeof value !== "object") return [];
      const record = value as Partial<SnoozedReminderRecord>;
      if (
        (record.status !== "pending" && record.status !== "sent")
        || typeof record.habitId !== "string"
        || key !== `snooze:${record.habitId}`
        || typeof record.habitTitle !== "string"
        || typeof record.fireAt !== "string"
        || !Number.isFinite(Date.parse(record.fireAt))
        || typeof record.localDate !== "string"
      ) return [];
      return [{
        key,
        rawValue,
        record: record as SnoozedReminderRecord,
      }];
    } catch {
      return [];
    }
  });
}

export function serializeSnoozedReminder(record: SnoozedReminderRecord): string {
  return JSON.stringify(record);
}

export function getActiveSnoozedReminders(
  values: Record<string, string> | null,
  localDate: string,
): StoredSnoozedReminder[] {
  return getStoredSnoozedReminders(values)
    .filter((entry) => entry.record.localDate === localDate);
}

export function getDueSnoozedReminders(
  values: Record<string, string> | null,
  localDate: string,
  now: Date,
  hasCheckedInToday = false,
): StoredSnoozedReminder[] {
  if (hasCheckedInToday) return [];
  return getActiveSnoozedReminders(values, localDate)
    .filter((entry) => (
      entry.record.status === "pending"
      && Date.parse(entry.record.fireAt) <= now.getTime()
    ));
}

export function getDueReminderBatch(input: DueReminderBatchInput): DueReminderBatch | null {
  if (input.hasCheckedInToday) return null;
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
  if (input.hasCheckedInToday) return [];
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
