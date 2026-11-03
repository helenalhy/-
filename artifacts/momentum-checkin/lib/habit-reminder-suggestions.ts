export interface HabitReminderSuggestionInput {
  title: string;
  reason?: string;
}

const HABIT_REMINDER_SUGGESTIONS: { pattern: RegExp; times: string[] }[] = [
  { pattern: /早上|早晨|晨間|起床|早起|早餐|morning|wake.?up|breakfast/i, times: ['08:00'] },
  { pattern: /喝水|飲水|補水|水分|water|hydrate/i, times: ['10:00', '15:00'] },
  { pattern: /午餐|中午|午休|lunch|noon/i, times: ['12:00'] },
  { pattern: /運動|跑步|健身|瑜伽|伸展|散步|exercise|workout|yoga|walk/i, times: ['18:00'] },
  { pattern: /下班|放學|讀書|學習|功課|工作|study|homework|after work/i, times: ['19:00'] },
  { pattern: /閱讀|看書|日記|冥想|睡前|睡覺|休息|reading|journal|meditat|before bed/i, times: ['21:00'] },
];

export function recommendHabitReminderTimes(habit: HabitReminderSuggestionInput): string[] {
  const text = `${habit.title} ${habit.reason ?? ''}`.trim();
  return HABIT_REMINDER_SUGGESTIONS.find(({ pattern }) => pattern.test(text))?.times ?? ['20:00'];
}
