import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  DEFAULT_USER_PROFILE,
  normalizeUserProfile,
  USER_PROFILE_STORAGE_KEY,
  type UserProfile,
} from '@/constants/user-profile';

export async function readUserProfile(): Promise<UserProfile> {
  const raw = await AsyncStorage.getItem(USER_PROFILE_STORAGE_KEY);
  if (!raw) return { ...DEFAULT_USER_PROFILE };

  try {
    return normalizeUserProfile(JSON.parse(raw));
  } catch {
    return { ...DEFAULT_USER_PROFILE };
  }
}

export async function writeUserProfile(value: unknown): Promise<UserProfile> {
  const profile = normalizeUserProfile(value);
  await AsyncStorage.setItem(USER_PROFILE_STORAGE_KEY, JSON.stringify(profile));
  return profile;
}
