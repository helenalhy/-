const DAILY_MOTIVATIONAL_QUOTE_PAIRS = [
  ['不需要和別人比較。你只要比昨天更靠近自己一點。', 'If you want the rainbow, you have to tolerate the rain.'],
  ['不經一番寒徹骨， 焉得梅花撲鼻香？', 'Failure is a success if we learn from it.'],
  ['莫問前程凶吉，但求落幕無悔。', 'Small steps still move you forward.'],
  ['不經歷風雨，怎看見彩虹。', "You don't have to be perfect to begin."],
  ['日日行，不怕千萬里；常常做，不怕千萬事。', 'Progress is built one choice at a time.'],
  ['你不必一次走很遠，只要今天比昨天多一步。', 'Rest is part of the journey, not a reason to quit.'],
  ['每一個小小的開始，都在替未來累積力量。', "Keep showing up for the person you're becoming."],
  ['慢慢來也沒關係，只要你沒有停下。', 'A little progress today is still progress.'],
  ['你已經走過的路，都是你努力的證明。', 'Your pace is valid; keep moving.'],
  ['把大目標拆成今天能做到的一小步。', 'Every completed task is proof that you can follow through.'],
  ['不完美的開始，勝過完美的等待。', 'Start where you are, and use what you have.'],
  ['願意重新開始，本身就是一種勇氣。', 'Hard days do not erase how far you have come.'],
  ['進步不一定很快，但每一步都算數。', 'Consistency turns small efforts into lasting change.'],
  ['今天做得到的事，就是最好的起點。', 'You are allowed to learn as you go.'],
  ['讓堅持成為習慣，讓習慣帶你前進。', 'Courage can be as simple as trying again.'],
  ['你可以休息，但不要忘記自己正在前行。', 'One focused minute can begin a better habit.'],
  ['每一次練習，都讓未來的自己多一份底氣。', "Your next step matters more than yesterday's setback."],
  ['先相信自己，然後持續努力。', 'There is strength in choosing to continue.'],
  ['不必等到準備好，開始後你會越來越好。', 'You can make progress without having everything figured out.'],
  ['微小的改變，會慢慢累積成巨大的不同。', 'Be patient with yourself; growth takes time.'],
  ['只要願意前進，速度慢一點也沒關係。', 'What you practice today becomes easier tomorrow.'],
  ['你的努力，也許今天看不見，時間會替你回答。', 'A goal is a direction, not a demand for perfection.'],
  ['目標不是要你完美，而是幫你找到方向。', 'You have made it through difficult days before.'],
  ['每一個完成的今天，都讓明天更有力量。', 'The effort you give today is an investment in tomorrow.'],
  ['你不需要被催促，照自己的步伐就很好。', 'Every new beginning starts with one small decision.'],
  ['只要開始，就比停在原地更接近目標。', "You don't need to feel ready to take one step."],
  ['即使只有一點點，也值得為自己感到驕傲。', 'Your best can look different each day, and it still counts.'],
  ['遇到困難時，記得你已經克服過很多次。', 'Build a routine that supports you, not one that punishes you.'],
  ['路不會白走，每一步都帶你更靠近想成為的自己。', 'Small acts of care can change the shape of a day.'],
  ['今天能完成的一小步，也是值得肯定的進展。', 'Keep your promise to yourself, one moment at a time.'],
  ['先照顧好自己，才有力量走向目標。', 'You are growing, even when the change feels quiet.'],
  ['再小的行動，也能打破停滯。', 'A pause can help you return with more strength.'],
  ['遇到阻礙時，換一條路也是前進。', 'Celebrate the effort, not only the outcome.'],
  ['你正在累積的，不只是成果，還有信心。', 'You can begin again at any point in the day.'],
  ['給自己一點耐心，改變會慢慢發生。', 'Make room for progress, not pressure.'],
  ['把注意力放回眼前，你能做的下一步。', 'The path gets clearer as you keep walking.'],
  ['今天的努力，不必等到完美才算數。', 'Today is a fresh chance to practice what matters.'],
  ['每一次堅持，都是在為自己加一分。', 'Your effort deserves kindness, especially from you.'],
  ['允許自己慢下來，也別忘了繼續前行。', 'Slow progress is still a form of progress.'],
  ['不怕起點小，只怕忘了再次出發。', 'Each small win gives the next one a place to start.'],
  ['你可以重新選擇，今天依然來得及。', 'You can do hard things one manageable step at a time.'],
  ['不用急著抵達，正在走的路也有意義。', 'A setback is one moment, not your whole story.'],
  ['願你對目標堅定，對自己溫柔。', 'Focus on what you can do next.'],
  ['先做好眼前一件事，剩下的慢慢來。', 'The future is shaped by the small choices you make today.'],
  ['不必一次改變全部，持續一點就很了不起。', "You don't have to do it all; do the next useful thing."],
  ['每天留一點時間給重要的自己。', 'The habit of returning matters more than never slipping.'],
  ['完成比想像更小的步驟，也是在累積力量。', "Your journey does not need to look like anyone else's."],
  ['你比自己以為的更有韌性。', 'A gentle restart is still a restart.'],
  ['你今天走的每一步，都在成為未來的底氣。', 'Keep choosing what helps you feel more like yourself.'],
  ['不求一口氣改變，只求今天再試一次。', 'There is no wasted effort in learning and trying again.'],
] as const;

export const DAILY_MOTIVATIONAL_QUOTES: string[] = [
  ...DAILY_MOTIVATIONAL_QUOTE_PAIRS.flatMap(
    ([chineseQuote, englishQuote]) => [chineseQuote, englishQuote],
  ),
  "One bad chapter doesn't mean your story is over.",
  'The best way to predict your future is to create it.',
];

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
