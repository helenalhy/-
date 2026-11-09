import { MALL_FLOORS } from '@/constants/mall';
import { GUEST_COUNTS_BY_FLOOR } from '@/constants/mall-guests';
import { DOG_STAFF_PROFILES } from '@/constants/dog-staff-customization';
import { getLocalWeekStart } from '@/lib/habit-schedule';
import type { EncouragementStyle } from '@/lib/daily-personalization';
import type { Habit } from '@/context/HabitsContext';

const DAY_MS = 24 * 60 * 60 * 1000;

const VISITOR_STORIES = [
  '今天先到窗邊看看陽光，決定把自己的步調放慢一點。',
  '在花園裡聞到一朵小花的香氣，想起照顧自己也很重要。',
  '挑了一本薄薄的書，說讀幾頁也能替今天留下一點安靜。',
  '沿著水光走了一圈，發現探索一小段也很開心。',
  '玩完一局後笑著說，休息一下再繼續也很好。',
  '找了個柔軟座位，提醒大家今天不必急著做到完美。',
  '在畫廊遇見喜歡的顏色，想把靈感帶回自己的日常。',
  '抬頭看見星星，決定先完成眼前最小的一件事。',
  '聞到熟悉的香氣，說每個值得慶祝的日子都從小事開始。',
  '跟著音樂走了幾步，心情也慢慢亮了起來。',
  '在片場挑了一個喜歡的角色，說今天也可以重新出發。',
  '堆好一小塊積木，發現慢慢來也能完成很棒的作品。',
  '在遺跡裡找到一枚小陶片，說微小發現也值得記住。',
  '從魔法教室帶走一顆星星，準備把勇氣放進今天的一小步。',
  '泡完溫泉後深呼吸，提醒自己留一點時間好好休息。',
  '在古城街角看見漂亮的衣裳，說每個人都能走自己的路。',
  '聽完一首歌，帶著新的節奏回去完成手邊的小事。',
  '拼好一座小房子，說每天一塊積木就會慢慢成形。',
  '跟新朋友玩了一會，說陪伴和進步一樣都不必比較。',
  '在雲端看見彩虹，決定把今天的好心情收藏起來。',
] as const;

const WEEKLY_EVENTS = [
  { title: '星光巡遊週', description: '用每個完成目標的日子，點亮巡遊街的小燈。', icon: 'star' },
  { title: '花園散步週', description: '每次踏出一小步，都為花園添一點生氣。', icon: 'sun' },
  { title: '慢讀時光週', description: '把日常的小練習，收藏成一段安靜時光。', icon: 'book-open' },
  { title: '海洋發現週', description: '每天一點點探索，慢慢收集海洋故事。', icon: 'droplet' },
  { title: '手作靈感週', description: '讓平常完成的目標，拼成一件小作品。', icon: 'edit-3' },
  { title: '雲端休息週', description: '用適合自己的步調，收集舒服的日常。', icon: 'cloud' },
  { title: '音樂節奏週', description: '不用趕進度，每一個完成日都是一拍。', icon: 'music' },
  { title: '彩虹回憶週', description: '把完成的小事串起來，留下一道彩虹。', icon: 'heart' },
] as const;

const DOG_GREETINGS: Record<EncouragementStyle, readonly string[]> = {
  gentle: [
    '早安！今天不用急，我陪你先做一小步。',
    '看到你打開 App，我就知道今天又有新的可能。',
    '先深呼吸一下吧，我會在旁邊陪你開始。',
    '今天也可以照自己的速度來，完成一點就很棒。',
    '準備好了嗎？我們先挑一件最容易的事。',
    '如果有點累也沒關係，我們一起慢慢來。',
    '你願意回來看看自己，這件事本身就很值得肯定。',
    '今天的小進度，也會變成商場裡的新回憶。',
    '不需要一次做到全部，我陪你走下一小步。',
    '休息過後再出發也很好，今天由你決定節奏。',
    '記得喝口水、放鬆肩膀，再選一件想做的事。',
    '把目標變小一點，開始就會容易一些。',
    '謝謝你今天來打招呼，我也替你加油。',
    '不和昨天比較，今天的你只要往前一點點。',
  ],
  energetic: [
    '早安！今天也有新機會，我們先完成一小步！',
    '你回來了！今天的進度就從現在開始發亮。',
    '深呼吸、伸個懶腰，準備好就出發！',
    '照自己的速度前進，今天也能收穫小勝利。',
    '來挑一件最容易的事，完成後替自己喝采！',
    '有點累也沒關係，做一小步就很值得慶祝。',
    '你願意回來就是很棒的開始，替你加油！',
    '每個小進度都在替商場添上新的光彩。',
    '不用一次完成全部，我們先拿下一小步！',
    '現在重新開始也來得及，今天由你掌握！',
    '喝口水、放鬆肩膀，讓好心情一起出發。',
    '把目標縮小一點，開始後就會越來越順！',
    '謝謝你來打招呼，今天也一起加油！',
    '不必比較，今天往前一點就是好消息。',
  ],
  concise: [
    '早安。先做一小步。',
    '你回來了，今天可以開始。',
    '深呼吸，挑一件容易的事。',
    '照自己的速度完成一點。',
    '先做最容易的那件事。',
    '累了就慢一點，仍算進步。',
    '願意回來，就是好的開始。',
    '今天的小進度也值得記下。',
    '先走下一步，不必一次做完。',
    '現在開始也來得及。',
    '喝口水，放鬆一下再開始。',
    '把目標縮小，現在就開始。',
    '謝謝你來，我陪著你。',
    '只和昨天的自己比較。',
  ],
};

export interface DailyMallVisitor {
  date: string;
  floor: number;
  guestIndex: number;
  floorTitle: string;
  story: string;
}

export function getDateOrdinal(dateKey: string): number {
  const [year, month, day] = dateKey.split('-').map(Number);
  if (!year || !month || !day) return 0;
  return Math.floor(Date.UTC(year, month - 1, day) / DAY_MS);
}

function positiveModulo(value: number, divisor: number): number {
  return ((value % divisor) + divisor) % divisor;
}

export function getDailyMallVisitor(date: string): DailyMallVisitor {
  const ordinal = getDateOrdinal(date);
  const floorIndex = positiveModulo(ordinal, MALL_FLOORS.length);
  const floor = floorIndex + 1;
  const guestCount = GUEST_COUNTS_BY_FLOOR[floorIndex] ?? 1;
  const guestIndex = positiveModulo(Math.floor(ordinal / MALL_FLOORS.length) + floorIndex * 3, guestCount);
  return {
    date,
    floor,
    guestIndex,
    floorTitle: MALL_FLOORS[floorIndex].title,
    story: VISITOR_STORIES[floorIndex],
  };
}

export function getVisitorDiaryDates(checkInDates: readonly string[], today: string): string[] {
  return [...new Set(checkInDates)]
    .filter((date) => date <= today)
    .sort((left, right) => right.localeCompare(left))
    .slice(0, 14);
}

export function getWeeklyMallEvent(today: string) {
  const weekStart = getLocalWeekStart(today);
  const weekOrdinal = Math.floor(getDateOrdinal(weekStart) / 7);
  return {
    ...WEEKLY_EVENTS[positiveModulo(weekOrdinal, WEEKLY_EVENTS.length)],
    weekStart,
    targetDays: 5,
  };
}

export function getWeeklyMomentumDays(habits: readonly Pick<Habit, 'checkIns'>[], today: string): number {
  const weekStart = getLocalWeekStart(today);
  return new Set(
    habits.flatMap((habit) => habit.checkIns)
      .filter((date) => date >= weekStart && date <= today),
  ).size;
}

export function getDailyDogGreeting(today: string, style: EncouragementStyle = 'gentle') {
  const ordinal = getDateOrdinal(today);
  const profileIndex = positiveModulo(ordinal, DOG_STAFF_PROFILES.length);
  const greetings = DOG_GREETINGS[style] ?? DOG_GREETINGS.gentle;
  const greetingIndex = positiveModulo(ordinal, greetings.length);
  return {
    dog: DOG_STAFF_PROFILES[profileIndex],
    greeting: greetings[greetingIndex],
  };
}
