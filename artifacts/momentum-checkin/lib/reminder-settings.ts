import AsyncStorage from '@react-native-async-storage/async-storage';

export const REMINDER_SETTINGS_KEY = 'momentum.web-reminder-settings.v1';

export interface ReminderSettings {
  enabled: boolean;
  reminderTime: string;
  endpoint: string | null;
}

export const DEFAULT_REMINDER_SETTINGS: ReminderSettings = {
  enabled: false,
  reminderTime: '20:00',
  endpoint: null,
};

export async function readReminderSettings(): Promise<ReminderSettings> {
  const raw = await AsyncStorage.getItem(REMINDER_SETTINGS_KEY);
  if (!raw) return DEFAULT_REMINDER_SETTINGS;

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return DEFAULT_REMINDER_SETTINGS;
    const value = parsed as Partial<ReminderSettings>;
    return {
      enabled: value.enabled === true,
      reminderTime: /^\d{2}:\d{2}$/.test(value.reminderTime ?? '')
        ? value.reminderTime!
        : DEFAULT_REMINDER_SETTINGS.reminderTime,
      endpoint: typeof value.endpoint === 'string' ? value.endpoint : null,
    };
  } catch {
    return DEFAULT_REMINDER_SETTINGS;
  }
}

export async function saveReminderSettings(settings: ReminderSettings): Promise<void> {
  await AsyncStorage.setItem(REMINDER_SETTINGS_KEY, JSON.stringify(settings));
}
