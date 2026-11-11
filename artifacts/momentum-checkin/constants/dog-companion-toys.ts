export type DogCompanionToyKind = 'frisbee' | 'ball' | 'tug' | 'plush' | 'squeaker';
export type DogCompanionToyIcon = 'disc' | 'circle' | 'link' | 'smile' | 'star';

export type DogCompanionToy = {
  id: string;
  dogKey: string;
  name: string;
  kind: DogCompanionToyKind;
  icon: DogCompanionToyIcon;
  color: string;
};

const DOG_TOY_PROFILES: Record<string, { color: string; names: [string, string, string, string, string] }> = {
  'fluffy-staff-huahua': {
    color: '#e88cae',
    names: ['花花・粉紅布飛盤', '花花・櫻花絨球', '花花・小羊毛拉繩', '花花・雲朵布偶', '花花・星星啾啾骨'],
  },
  'fluffy-staff-milkshake': {
    color: '#9c83c7',
    names: ['奶昔・薰衣草布飛盤', '奶昔・紫莓彈力球', '奶昔・葡萄藤拉繩', '奶昔・月亮兔布偶', '奶昔・紫星啾啾骨'],
  },
  'fluffy-staff-xiaoniu': {
    color: '#6195c5',
    names: ['小牛・藍色宇宙飛盤', '小牛・海浪彈跳球', '小牛・棋盤結繩', '小牛・小牛仔布偶', '小牛・雷電啾啾骨'],
  },
  'fluffy-staff-pudding': {
    color: '#e9a14f',
    names: ['布丁・橙子棉布飛盤', '布丁・焦糖彈力球', '布丁・南瓜麻花拉繩', '布丁・小太陽布偶', '布丁・奶油啾啾骨'],
  },
  'fluffy-staff-tangtang': {
    color: '#bc8b68',
    names: ['糖糖・蜜糖熊布飛盤', '糖糖・蜂蜜軟球', '糖糖・小熊掌拉繩', '糖糖・栗子熊布偶', '糖糖・蜂蜜星啾啾骨'],
  },
  'fluffy-staff-pipi': {
    color: '#72a8a0',
    names: ['皮皮・薄荷布飛盤', '皮皮・青蘋果彈力球', '皮皮・探險結繩', '皮皮・小背包布偶', '皮皮・營火啾啾骨'],
  },
  'fluffy-staff-amber': {
    color: '#c9915b',
    names: ['琥珀・琥珀金布飛盤', '琥珀・蜂蜜彈力球', '琥珀・麥穗結拉繩', '琥珀・小狐狸布偶', '琥珀・金葉啾啾骨'],
  },
  'fluffy-staff-cloud': {
    color: '#91b9d8',
    names: ['雲朵・天空棉布飛盤', '雲朵・雨滴彈力球', '雲朵・彩虹結繩', '雲朵・小雲羊布偶', '雲朵・星雲啾啾骨'],
  },
  'fluffy-staff-wonton': {
    color: '#84aeb1',
    names: ['雲吞・青瓷布飛盤', '雲吞・小籠包軟球', '雲吞・竹葉結繩', '雲吞・包子兔布偶', '雲吞・湯圓啾啾骨'],
  },
  'fluffy-staff-butter': {
    color: '#dfc274',
    names: ['奶油・奶黃布飛盤', '奶油・香草彈力球', '奶油・奶油花拉繩', '奶油・小牛奶布偶', '奶油・奶酪啾啾骨'],
  },
  'fluffy-staff-sesame': {
    color: '#8b7a8d',
    names: ['芝麻・黑白拼布飛盤', '芝麻・芝麻糰彈力球', '芝麻・麻花結拉繩', '芝麻・小熊貓布偶', '芝麻・月夜啾啾骨'],
  },
  'fluffy-staff-snowball': {
    color: '#9fc7df',
    names: ['雪球・雪花布飛盤', '雪球・冰晶彈力球', '雪球・雪兔結繩', '雪球・雪人布偶', '雪球・冬星啾啾骨'],
  },
  'fluffy-staff-maomao': {
    color: '#c8a2b0',
    names: ['毛毛・粉霧布飛盤', '毛毛・棉花彈力球', '毛毛・絨球結拉繩', '毛毛・羊咩咩布偶', '毛毛・軟糖啾啾骨'],
  },
  'fluffy-staff-poppy': {
    color: '#ca9179',
    names: ['波比・奶茶布飛盤', '波比・小蝴蝶彈力球', '波比・蝴蝶結拉繩', '波比・臘腸小屋布偶', '波比・肉桂啾啾骨'],
  },
};

const TOY_KINDS: DogCompanionToyKind[] = ['frisbee', 'ball', 'tug', 'plush', 'squeaker'];
const TOY_ICONS: DogCompanionToyIcon[] = ['disc', 'circle', 'link', 'smile', 'star'];

export function getDogCompanionToys(dogKey: string): DogCompanionToy[] {
  const profile = DOG_TOY_PROFILES[dogKey];
  if (!profile) return [];
  return profile.names.map((name, index) => ({
    id: `${dogKey}-toy-${index + 1}`,
    dogKey,
    name,
    kind: TOY_KINDS[index],
    icon: TOY_ICONS[index],
    color: profile.color,
  }));
}

export const DOG_COMPANION_TOY_DOG_KEYS = Object.keys(DOG_TOY_PROFILES);
