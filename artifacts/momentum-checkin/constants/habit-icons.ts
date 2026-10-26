import type { RewardCategory } from '@/context/HabitsContext';

type HabitIconOption = {
  icon: string;
  color: string;
  label: string;
  rewardCategory: RewardCategory;
};

export const HABIT_ICON_OPTIONS = [
  { icon: 'activity', color: '#D5F2DF', label: '身體', rewardCategory: 'facility' },
  { icon: 'book-open', color: '#E8DDF9', label: '學習', rewardCategory: 'shop' },
  { icon: 'heart', color: '#FFE1EC', label: '心情', rewardCategory: 'decor' },
  { icon: 'coffee', color: '#FFE3CE', label: '生活', rewardCategory: 'shop' },
  { icon: 'target', color: '#D5ECFA', label: '目標', rewardCategory: 'facility' },
  { icon: 'zap', color: '#FFF1B8', label: '衝刺', rewardCategory: 'facility' },
  { icon: 'droplet', color: '#FFD5D0', label: '喝水', rewardCategory: 'facility' },
  { icon: 'moon', color: '#DCD4F7', label: '睡眠', rewardCategory: 'decor' },
  { icon: 'sun', color: '#F7C9A5', label: '早起', rewardCategory: 'facility' },
  { icon: 'award', color: '#E7D6C5', label: '成就', rewardCategory: 'decor' },
  { icon: 'feather', color: '#C4E5D8', label: '寫作', rewardCategory: 'decor' },
  { icon: 'bookmark', color: '#F2CEE6', label: '閱讀', rewardCategory: 'shop' },
  { icon: 'calendar', color: '#CFDFF4', label: '規劃', rewardCategory: 'facility' },
  { icon: 'check-circle', color: '#F6D9B6', label: '完成', rewardCategory: 'facility' },
  { icon: 'smile', color: '#DCECBF', label: '微笑', rewardCategory: 'decor' },
  { icon: 'camera', color: '#F3C5B8', label: '記錄', rewardCategory: 'decor' },
  { icon: 'music', color: '#C9E8EE', label: '音樂', rewardCategory: 'shop' },
  { icon: 'briefcase', color: '#D7C8EC', label: '工作', rewardCategory: 'facility' },
  { icon: 'home', color: '#F7E5A9', label: '居家', rewardCategory: 'facility' },
  { icon: 'gift', color: '#EFC7D2', label: '獎勵', rewardCategory: 'shop' },
  { icon: 'star', color: '#CFEBCE', label: '靈感', rewardCategory: 'decor' },
  { icon: 'compass', color: '#C9D5F6', label: '探索', rewardCategory: 'facility' },
  { icon: 'users', color: '#F4D1A0', label: '交流', rewardCategory: 'shop' },
  { icon: 'globe', color: '#C6E6DF', label: '語言', rewardCategory: 'shop' },
  { icon: 'edit-3', color: '#E7CEE9', label: '筆記', rewardCategory: 'decor' },
  { icon: 'map', color: '#D3E5B7', label: '散步', rewardCategory: 'facility' },
  { icon: 'shopping-bag', color: '#F5C7A6', label: '購物', rewardCategory: 'shop' },
  { icon: 'headphones', color: '#D2D2F0', label: '聆聽', rewardCategory: 'shop' },
  { icon: 'bell', color: '#F1D4B9', label: '提醒', rewardCategory: 'facility' },
  { icon: 'wind', color: '#BFE4E8', label: '呼吸', rewardCategory: 'decor' },
] as const satisfies readonly HabitIconOption[];
