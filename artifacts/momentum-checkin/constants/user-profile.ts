export const USER_PROFILE_STORAGE_KEY = 'momentum.user-profile.v1';
export const USER_PROFILE_NICKNAME_MAX_LENGTH = 24;

export const PROFILE_AVATARS = [
  { id: 'sun', label: '陽光', icon: 'sun', colorKey: 'candyLemon' },
  { id: 'star', label: '星星', icon: 'star', colorKey: 'candyPeach' },
  { id: 'heart', label: '愛心', icon: 'heart', colorKey: 'candyPink' },
  { id: 'moon', label: '月亮', icon: 'moon', colorKey: 'candyLavender' },
  { id: 'cloud', label: '雲朵', icon: 'cloud', colorKey: 'candySky' },
  { id: 'smile', label: '笑臉', icon: 'smile', colorKey: 'candyMint' },
  { id: 'flower', label: '小花', icon: 'feather', colorKey: 'candyRose' },
  { id: 'book', label: '書本', icon: 'book-open', colorKey: 'candySky' },
  { id: 'gift', label: '禮物', icon: 'gift', colorKey: 'candyPeach' },
  { id: 'coffee', label: '咖啡', icon: 'coffee', colorKey: 'candyCaramel' },
  { id: 'music', label: '音符', icon: 'music', colorKey: 'candyLavender' },
  { id: 'compass', label: '指南針', icon: 'compass', colorKey: 'candyMint' },
] as const;

export const PROFILE_DOG_AVATAR_IDS = [
  'fluffy-staff-huahua',
  'fluffy-staff-milkshake',
  'fluffy-staff-xiaoniu',
  'fluffy-staff-pudding',
  'fluffy-staff-tangtang',
  'fluffy-staff-pipi',
  'fluffy-staff-amber',
  'fluffy-staff-cloud',
  'fluffy-staff-wonton',
  'fluffy-staff-butter',
  'fluffy-staff-sesame',
  'fluffy-staff-snowball',
  'fluffy-staff-maomao',
  'fluffy-staff-poppy',
] as const;

export type ProfileAvatarId =
  | typeof PROFILE_AVATARS[number]['id']
  | typeof PROFILE_DOG_AVATAR_IDS[number];
export type ProfileAvatarColorKey = typeof PROFILE_AVATARS[number]['colorKey'];

export interface UserProfile {
  nickname: string;
  avatarId: ProfileAvatarId;
}

export const DEFAULT_USER_PROFILE: UserProfile = {
  nickname: '',
  avatarId: 'sun',
};

export function normalizeUserProfile(value: unknown): UserProfile {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { ...DEFAULT_USER_PROFILE };
  }

  const source = value as Record<string, unknown>;
  const avatarId = PROFILE_AVATARS.some((avatar) => avatar.id === source.avatarId)
    || PROFILE_DOG_AVATAR_IDS.some((dogId) => dogId === source.avatarId)
    ? source.avatarId as ProfileAvatarId
    : DEFAULT_USER_PROFILE.avatarId;

  return {
    nickname: typeof source.nickname === 'string'
      ? source.nickname.trim().slice(0, USER_PROFILE_NICKNAME_MAX_LENGTH)
      : '',
    avatarId,
  };
}

export function hasCustomUserProfile(value: unknown): boolean {
  const profile = normalizeUserProfile(value);
  return profile.nickname.length > 0 || profile.avatarId !== DEFAULT_USER_PROFILE.avatarId;
}
