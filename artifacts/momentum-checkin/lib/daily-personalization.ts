import AsyncStorage from '@react-native-async-storage/async-storage';

export type EncouragementStyle = 'gentle' | 'energetic' | 'concise';
export type DailyMood = 'happy' | 'satisfied' | 'calm' | 'tired';
export type MoodEntry = { date: string; mood: DailyMood };

const ENCOURAGEMENT_STYLE_KEY = 'momentum.encouragement-style.v1';
const MOOD_HISTORY_KEY = 'momentum.daily-mood-history.v1';
const MOOD_OPTIONS: readonly DailyMood[] = ['happy', 'satisfied', 'calm', 'tired'];
let moodWriteQueue: Promise<void> = Promise.resolve();

export const ENCOURAGEMENT_STYLES: readonly {
  id: EncouragementStyle;
  label: string;
  description: string;
}[] = [
  { id: 'gentle', label: '溫柔陪伴', description: '慢慢來，完成一點就很好。' },
  { id: 'energetic', label: '活潑打氣', description: '今天也有新的可能，出發吧！' },
  { id: 'concise', label: '簡短直接', description: '先做一小步。' },
];

export const DAILY_MOOD_OPTIONS: readonly {
  id: DailyMood;
  label: string;
  icon: 'smile' | 'heart' | 'sun' | 'cloud';
}[] = [
  { id: 'happy', label: '開心', icon: 'smile' },
  { id: 'satisfied', label: '滿足', icon: 'heart' },
  { id: 'calm', label: '平靜', icon: 'sun' },
  { id: 'tired', label: '有點累', icon: 'cloud' },
];

export const DEFAULT_ENCOURAGEMENT_STYLE: EncouragementStyle = 'gentle';

export function isEncouragementStyle(value: unknown): value is EncouragementStyle {
  return value === 'gentle' || value === 'energetic' || value === 'concise';
}

export function getEncouragementText(style: EncouragementStyle): string {
  if (style === 'energetic') return '今天也有新的可能！先開始一小步，讓好心情跟上來。';
  if (style === 'concise') return '先做一小步，就很好。';
  return '不用一次做到完美，願意開始就很了不起。';
}

export async function readEncouragementStyle(): Promise<EncouragementStyle> {
  const saved = await AsyncStorage.getItem(ENCOURAGEMENT_STYLE_KEY);
  return isEncouragementStyle(saved) ? saved : DEFAULT_ENCOURAGEMENT_STYLE;
}

export async function saveEncouragementStyle(style: EncouragementStyle): Promise<void> {
  await AsyncStorage.setItem(ENCOURAGEMENT_STYLE_KEY, style);
}

export function isDailyMood(value: unknown): value is DailyMood {
  return typeof value === 'string' && MOOD_OPTIONS.includes(value as DailyMood);
}

export async function readMoodHistory(): Promise<MoodEntry[]> {
  const raw = await AsyncStorage.getItem(MOOD_HISTORY_KEY);
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((entry): entry is MoodEntry =>
        Boolean(entry)
        && typeof entry === 'object'
        && typeof (entry as MoodEntry).date === 'string'
        && /^\d{4}-\d{2}-\d{2}$/.test((entry as MoodEntry).date)
        && isDailyMood((entry as MoodEntry).mood),
      )
      .sort((left, right) => right.date.localeCompare(left.date))
      .slice(0, 180);
  } catch {
    return [];
  }
}

export function saveDailyMood(date: string, mood: DailyMood): Promise<void> {
  const write = moodWriteQueue.then(async () => {
    const existing = await readMoodHistory();
    const next = [
      { date, mood },
      ...existing.filter((entry) => entry.date !== date),
    ].sort((left, right) => right.date.localeCompare(left.date)).slice(0, 180);
    await AsyncStorage.setItem(MOOD_HISTORY_KEY, JSON.stringify(next));
  });
  moodWriteQueue = write.catch(() => {});
  return write;
}
