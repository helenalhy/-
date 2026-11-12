import AsyncStorage from '@react-native-async-storage/async-storage';

const PERSONAL_REWARDS_KEY = 'momentum.personal-rewards.v1';
export const MAX_PERSONAL_REWARDS = 12;

export async function readPersonalRewards(): Promise<string[]> {
  const raw = await AsyncStorage.getItem(PERSONAL_REWARDS_KEY);
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return [...new Set(parsed.filter((item): item is string => (
      typeof item === 'string' && item.trim().length > 0
    )).map((item) => item.trim().slice(0, 48)))].slice(0, MAX_PERSONAL_REWARDS);
  } catch {
    return [];
  }
}

export async function savePersonalRewards(rewards: readonly string[]): Promise<void> {
  const normalized = [...new Set(rewards.map((reward) => reward.trim().slice(0, 48)).filter(Boolean))]
    .slice(0, MAX_PERSONAL_REWARDS);
  await AsyncStorage.setItem(PERSONAL_REWARDS_KEY, JSON.stringify(normalized));
}

export function getDailyPersonalReward(rewards: readonly string[], date: string): string | null {
  if (rewards.length === 0) return null;
  const [year, month, day] = date.split('-').map(Number);
  const ordinal = year && month && day
    ? Math.floor(Date.UTC(year, month - 1, day) / 86_400_000)
    : 0;
  return rewards[((ordinal % rewards.length) + rewards.length) % rewards.length] ?? null;
}
