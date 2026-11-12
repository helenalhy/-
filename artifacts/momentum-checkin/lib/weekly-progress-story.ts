export function getWeeklyProgressStory({
  completedCount,
  bestDayLabel,
  bestDayCount,
}: {
  completedCount: number;
  bestDayLabel?: string;
  bestDayCount?: number;
}): string {
  if (completedCount <= 0) {
    return '這週的故事正等著第一步，今天從最小的一件事開始就好。';
  }
  if (completedCount < 3) {
    return `這週你已經完成 ${completedCount} 次小練習。每次願意回來，都在替自己多留一點空間。`;
  }
  const bestDay = bestDayLabel && bestDayCount
    ? ` 星期${bestDayLabel}是你最有行動力的一天，完成了 ${bestDayCount} 次。`
    : '';
  return `你把 ${completedCount} 次小練習寫成了這週的故事；不需要每天滿分，願意繼續就很了不起。${bestDay}`;
}
