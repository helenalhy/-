export const DAILY_DOG_TASK_REWARD = 10;
const DAILY_DOG_TASK_REWARD_PREFIX = 'daily-dog-task:';
const DAY_MS = 24 * 60 * 60 * 1000;

export type DailyDogTask = {
  id: string;
  title: string;
};

const DAILY_DOG_TASKS: readonly DailyDogTask[] = [
  { id: 'water-3-cups', title: '今日飲 3 杯水' },
  { id: 'stretch-2-minutes', title: '伸展身體 2 分鐘' },
  { id: 'read-one-page', title: '讀一頁喜歡的書' },
  { id: 'walk-5-minutes', title: '輕鬆散步 5 分鐘' },
  { id: 'deep-breaths', title: '慢慢深呼吸 5 次' },
  { id: 'tidy-one-thing', title: '把一件物品放回原位' },
  { id: 'write-gratitude', title: '寫下一件今天感謝的小事' },
  { id: 'look-far-away', title: '望向遠處，讓眼睛休息 20 秒' },
  { id: 'wash-cup', title: '清洗一個用過的杯子' },
  { id: 'move-one-minute', title: '起身活動 1 分鐘' },
  { id: 'listen-song', title: '聽一首喜歡的歌' },
  { id: 'water-plant', title: '替一盆植物澆水' },
  { id: 'clear-desk', title: '整理桌面 2 分鐘' },
  { id: 'write-kind-note', title: '寫一句鼓勵自己的話' },
  { id: 'prepare-tomorrow', title: '為明天準備一件用品' },
  { id: 'fruit-snack', title: '享用一份水果' },
  { id: 'shoulder-rolls', title: '輕輕轉動肩膀 5 次' },
  { id: 'phone-pause', title: '放下手機，休息 5 分鐘' },
  { id: 'fresh-air', title: '到窗邊呼吸新鮮空氣 1 分鐘' },
  { id: 'tidy-small-corner', title: '整理一個小角落 2 分鐘' },
  { id: 'capture-good-moment', title: '記下今天一件小美好' },
  { id: 'put-away-clothes', title: '收好一件衣物' },
  { id: 'stretch-arms', title: '伸展雙手 30 秒' },
  { id: 'kind-message', title: '傳一句關心給在意的人' },
];

function getDayOrdinal(dateKey: string): number {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
    throw new RangeError(`Invalid local date key: ${dateKey}`);
  }
  const [year, month, day] = dateKey.split('-').map(Number);
  const timestamp = Date.UTC(year, month - 1, day);
  const date = new Date(timestamp);
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    throw new RangeError(`Invalid local date key: ${dateKey}`);
  }
  return Math.floor(timestamp / DAY_MS);
}

export function getDailyDogTask(dateKey: string): DailyDogTask {
  const ordinal = getDayOrdinal(dateKey);
  // A permuted daily rotation looks unpredictable while ensuring consecutive days differ.
  const index = (ordinal * 17 + 11) % DAILY_DOG_TASKS.length;
  return DAILY_DOG_TASKS[index];
}

export function getDailyDogTaskRewardKey(dateKey: string): string {
  getDayOrdinal(dateKey);
  return `${DAILY_DOG_TASK_REWARD_PREFIX}${dateKey}`;
}

export function getDailyDogTaskCount(): number {
  return DAILY_DOG_TASKS.length;
}
