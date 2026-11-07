export interface MinimumActionSuggestionInput {
  title: string;
  reason?: string;
}

const SUGGESTIONS: { pattern: RegExp; action: string }[] = [
  { pattern: /閱讀|看書|讀書|書本|read(?:ing)?|books?/i, action: '先讀一頁' },
  { pattern: /散步|步行|走路|遛狗|walk(?:ing)?/i, action: '先走 2 分鐘' },
  { pattern: /運動|健身|跑步|瑜伽|伸展|exercise|workout|running|yoga/i, action: '先做 2 分鐘' },
  { pattern: /喝水|飲水|補水|水分|water|hydrat/i, action: '先喝幾口水' },
  { pattern: /日記|寫作|寫字|寫文章|journal|writing|write/i, action: '先寫一句' },
  { pattern: /冥想|靜心|正念|呼吸|meditat|mindfulness|breath/i, action: '先做 3 次慢呼吸' },
  { pattern: /語言|英文|日文|單字|背詞|language|vocab|english|japanese/i, action: '先學 1 個單字' },
  { pattern: /整理|收拾|清潔|打掃|家務|tidy|clean|organize/i, action: '先收好 1 件物品' },
  { pattern: /護膚|保養|洗臉|護理|skincare|skin care/i, action: '先完成 1 個保養步驟' },
  { pattern: /早睡|睡前|睡眠|上床|sleep|bedtime/i, action: '先放下手機 2 分鐘' },
  { pattern: /記帳|存錢|理財|budget|expense|saving money/i, action: '先記下一筆支出' },
  { pattern: /樂器|練琴|音樂|唱歌|guitar|piano|music|practice/i, action: '先練習 2 分鐘' },
];

export function recommendMinimumAction(habit: MinimumActionSuggestionInput): string {
  const text = `${habit.title} ${habit.reason ?? ''}`.trim();
  return SUGGESTIONS.find(({ pattern }) => pattern.test(text))?.action
    ?? '先做 2 分鐘，做到哪裡都可以';
}
