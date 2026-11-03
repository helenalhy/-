import AsyncStorage from '@react-native-async-storage/async-storage';

export const REMINDER_SETTINGS_KEY = 'momentum.web-reminder-settings.v1';

export interface ReminderSettings {
  enabled: boolean;
  reminderTimes: string[];
  habitReminders: Record<string, string[]>;
  endpoint: string | null;
}

export const DEFAULT_REMINDER_SETTINGS: ReminderSettings = {
  enabled: false,
  reminderTimes: ['20:00'],
  habitReminders: {},
  endpoint: null,
};

export async function readReminderSettings(): Promise<ReminderSettings> {
  const raw = await AsyncStorage.getItem(REMINDER_SETTINGS_KEY);
  if (!raw) return DEFAULT_REMINDER_SETTINGS;

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return DEFAULT_REMINDER_SETTINGS;
    const value = parsed as Partial<ReminderSettings>;
    const legacyTime = (value as { reminderTime?: unknown }).reminderTime;
    const storedTimes = Array.isArray(value.reminderTimes)
      ? value.reminderTimes
      : typeof legacyTime === 'string'
        ? [legacyTime]
        : DEFAULT_REMINDER_SETTINGS.reminderTimes;
    const reminderTimes = [...new Set(
      storedTimes
        .filter((time): time is string => typeof time === 'string' && /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(time))
        .slice(0, 5),
    )].sort();
    const habitReminders: Record<string, string[]> = {};
    if (value.habitReminders && typeof value.habitReminders === 'object' && !Array.isArray(value.habitReminders)) {
      for (const [habitId, times] of Object.entries(value.habitReminders)) {
        if (!Array.isArray(times)) continue;
        const validTimes = [...new Set(
          times
            .filter((time): time is string => typeof time === 'string' && /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(time))
            .slice(0, 5),
        )].sort();
        if (validTimes.length > 0) habitReminders[habitId] = validTimes;
      }
    }
    return {
      enabled: value.enabled === true,
      reminderTimes: reminderTimes.length > 0 ? reminderTimes : DEFAULT_REMINDER_SETTINGS.reminderTimes,
      habitReminders,
      endpoint: typeof value.endpoint === 'string' ? value.endpoint : null,
    };
  } catch {
    return DEFAULT_REMINDER_SETTINGS;
  }
}

export async function saveReminderSettings(settings: ReminderSettings): Promise<void> {
  await AsyncStorage.setItem(REMINDER_SETTINGS_KEY, JSON.stringify(settings));
}
