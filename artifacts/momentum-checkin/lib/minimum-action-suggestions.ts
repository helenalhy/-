export interface MinimumActionSuggestionInput {
  title: string;
  reason?: string;
  steps?: string[];
  icon?: string;
}

const SUGGESTIONS: { pattern: RegExp; action: string }[] = [
  { pattern: /閱讀|看書|讀書|書本|read(?:ing)?|books?/i, action: '先讀一頁' },
  { pattern: /散步|步行|走路|遛狗|walk(?:ing)?/i, action: '先走 2 分鐘' },
  { pattern: /運動|健身|跑步|瑜伽|伸展|exercise|workout|running|yoga/i, action: '先做 2 分鐘' },
  { pattern: /喝水|飲水|補水|水分|water|hydrat/i, action: '先喝幾口水' },
  { pattern: /牙線|刷牙|口腔|dental|floss|brush teeth/i, action: '先清潔一顆牙齒' },
  { pattern: /日記|寫作|寫字|寫文章|journal|writing|write/i, action: '先寫一句' },
  { pattern: /冥想|靜心|正念|呼吸|meditat|mindfulness|breath/i, action: '先做 3 次慢呼吸' },
  { pattern: /聽書|播客|音訊|聆聽|podcast|audiobook|listen/i, action: '先聽 2 分鐘' },
  { pattern: /語言|英文|日文|單字|背詞|language|vocab|english|japanese/i, action: '先學 1 個單字' },
  { pattern: /整理|收拾|清潔|打掃|家務|tidy|clean|organize/i, action: '先收好 1 件物品' },
  { pattern: /煮飯|烹飪|備餐|料理|食譜|cook|cooking|meal prep/i, action: '先準備 1 樣食材' },
  { pattern: /護膚|保養|洗臉|護理|skincare|skin care/i, action: '先完成 1 個保養步驟' },
  { pattern: /早睡|睡前|睡眠|上床|sleep|bedtime/i, action: '先放下手機 2 分鐘' },
  { pattern: /早起|起床|晨間|morning|wake.?up/i, action: '先坐起來，拉開窗簾' },
  { pattern: /記帳|存錢|理財|budget|expense|saving money/i, action: '先記下一筆支出' },
  { pattern: /樂器|練琴|音樂|唱歌|guitar|piano|music|practice/i, action: '先練習 2 分鐘' },
  { pattern: /工作|專案|報告|郵件|待辦|work|project|email|task/i, action: '先打開文件，做 2 分鐘' },
  { pattern: /規劃|計畫|計劃|安排|plan|planning|schedule/i, action: '先寫下最重要的一件事' },
  { pattern: /朋友|家人|聯絡|交流|relationship|friend|family|message/i, action: '先寫下一句想說的話' },
  { pattern: /寵物|狗狗|貓咪|餵貓|遛狗|pet|dog|cat/i, action: '先準備一份飲水或食物' },
  { pattern: /記錄|拍照|相片|日常|track|record|photo/i, action: '先記下一個今天的片刻' },
];

const ICON_SUGGESTIONS: Record<string, string> = {
  activity: '先活動 2 分鐘',
  map: '先走 2 分鐘',
  'book-open': '先讀一頁',
  bookmark: '先讀一頁',
  droplet: '先喝幾口水',
  moon: '先放下手機 2 分鐘',
  sun: '先坐起來，拉開窗簾',
  feather: '先寫一句',
  'edit-3': '先寫一句',
  calendar: '先寫下最重要的一件事',
  briefcase: '先打開文件，做 2 分鐘',
  home: '先收好 1 件物品',
  globe: '先學 1 個單字',
  wind: '先做 3 次慢呼吸',
  headphones: '先聽 2 分鐘',
  music: '先練習 2 分鐘',
  users: '先寫下一句想說的話',
};

const SMALL_STEP_START = /^(?:先|只要|只做|打開|翻開|拿出|穿上|放好|收好|收起|喝幾|讀一|看一|寫一|走到|做[一兩二\d]\s*分鐘|練習[一兩二\d]\s*分鐘|整理一|刷一|洗一|準備一|選一)/i;
const TOO_LARGE_STEP = /(\d{2,}|[3-9])\s*(?:分鐘|min(?:ute)?s?|頁|pages?)/i;

function getExplicitSmallStep(steps: string[] | undefined): string | undefined {
  const firstSmallStep = steps?.map((step) => step.trim()).find((step) => (
    step.length > 0
    && step.length <= 60
    && SMALL_STEP_START.test(step)
    && !TOO_LARGE_STEP.test(step)
  ));
  return firstSmallStep;
}

function matchSuggestion(text: string): string | undefined {
  return SUGGESTIONS.find(({ pattern }) => pattern.test(text))?.action;
}

export function recommendMinimumAction(habit: MinimumActionSuggestionInput): string {
  const title = habit.title.trim();
  const reason = habit.reason?.trim() ?? '';
  const textSuggestion = matchSuggestion(title) ?? matchSuggestion(reason);
  return getExplicitSmallStep(habit.steps)
    ?? textSuggestion
    ?? ICON_SUGGESTIONS[habit.icon ?? '']
    ?? '先做 2 分鐘，做到哪裡都可以';
}
