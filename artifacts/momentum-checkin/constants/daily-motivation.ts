export const DAILY_MOTIVATIONAL_QUOTES = [
  '不需要和別人比較。你只要比昨天更靠近自己一點。',
  '不經一番寒徹骨，焉得梅花撲鼻香?',
  '莫問前程凶吉，但求落幕無悔。',
  'If you want the rainbow, you have to tolerate the rain.',
  'Failure is a success if we learn from it.',
  '日日行，不怕千萬里；常常做，不怕千萬事。',
  '你不必一次走很遠，只要今天比昨天多一步。',
  '每一個小小的開始，都在替未來累積力量。',
  '慢慢來也沒關係，只要你沒有停下。',
  '你已經走過的路，都是你努力的證明。',
  '把大目標拆成今天能做到的一小步。',
  '不完美的開始，勝過完美的等待。',
  '願意重新開始，本身就是一種勇氣。',
  '進步不一定很快，但每一步都算數。',
  '今天做得到的事，就是最好的起點。',
  '讓堅持成為習慣，讓習慣帶你前進。',
  '你可以休息，但不要忘記自己正在前行。',
  '每一次練習，都讓未來的自己多一份底氣。',
  '先相信自己，然後持續努力。',
  '不必等到準備好，開始後你會越來越好。',
  '微小的改變，會慢慢累積成巨大的不同。',
  '只要願意前進，速度慢一點也沒關係。',
  '你的努力，也許今天看不見，時間會替你回答。',
  '目標不是要你完美，而是幫你找到方向。',
  '每一個完成的今天，都讓明天更有力量。',
  '你不需要被催促，照自己的步伐就很好。',
  '只要開始，就比停在原地更接近目標。',
  '即使只有一點點，也值得為自己感到驕傲。',
  '遇到困難時，記得你已經克服過很多次。',
  '路不會白走，每一步都帶你更靠近想成為的自己。',
] as const;

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

export function getDailyMotivationalQuote(dateKey: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
    throw new RangeError(`Invalid local date key: ${dateKey}`);
  }
  const [year, month, day] = dateKey.split('-').map(Number);
  const timestamp = Date.UTC(year, month - 1, day);
  const date = new Date(timestamp);
  if (
    date.getUTCFullYear() !== year
    || date.getUTCMonth() !== month - 1
    || date.getUTCDate() !== day
  ) {
    throw new RangeError(`Invalid local date key: ${dateKey}`);
  }
  const dayNumber = Math.floor(timestamp / MILLISECONDS_PER_DAY);
  const index = ((dayNumber % DAILY_MOTIVATIONAL_QUOTES.length) + DAILY_MOTIVATIONAL_QUOTES.length)
    % DAILY_MOTIVATIONAL_QUOTES.length;
  return DAILY_MOTIVATIONAL_QUOTES[index];
}
