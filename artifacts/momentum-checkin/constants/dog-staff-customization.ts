import palette from './colors';

const c = palette.light;

export interface DogStaffProfile {
  decorationId: string;
  key: string;
  name: string;
  breed: string;
  description: string;
  icon: string;
  price: number;
  color: string;
  visual: string;
  kind: string;
}

export const DOG_STAFF_PROFILES: DogStaffProfile[] = [
  { decorationId: 'general-fluffy-staff-huahua', key: 'fluffy-staff-huahua', name: '花花', breed: '淺啡色博美', description: '淺啡色博美花花會在店裡熱情迎接每位客人。', icon: 'heart', price: 80, color: c.candyPeach, visual: 'dog-staff-huahua', kind: 'huahua' },
  { decorationId: 'general-fluffy-staff-milkshake', key: 'fluffy-staff-milkshake', name: '奶昔', breed: '白色博美', description: '白色博美奶昔會陪客人挑選蓬鬆的棉花糖。', icon: 'coffee', price: 80, color: c.candyCream, visual: 'dog-staff-milkshake', kind: 'milkshake' },
  { decorationId: 'general-fluffy-staff-xiaoniu', key: 'fluffy-staff-xiaoniu', name: '小牛', breed: '黑白色邊牧', description: '黑白邊境牧羊犬小牛會精神奕奕地照看店內。', icon: 'star', price: 95, color: c.candyMint, visual: 'dog-staff-xiaoniu', kind: 'xiaoniu' },
  { decorationId: 'general-fluffy-staff-pudding', key: 'fluffy-staff-pudding', name: '布丁', breed: '黃金獵犬寶寶', description: '黃金獵犬寶寶布丁用暖暖的笑容陪伴客人。', icon: 'gift', price: 90, color: c.candyLemon, visual: 'dog-staff-pudding', kind: 'pudding' },
  { decorationId: 'general-fluffy-staff-tangtang', key: 'fluffy-staff-tangtang', name: '糖糖', breed: '白色比熊', description: '白色比熊糖糖有蓬鬆的毛毛，最喜歡迎接客人。', icon: 'heart', price: 85, color: c.candyCream, visual: 'dog-staff-tangtang', kind: 'tangtang' },
  { decorationId: 'general-fluffy-staff-pipi', key: 'fluffy-staff-pipi', name: '皮皮', breed: '黃白柯基', description: '黃白色柯基皮皮會搖著尾巴在店內巡場。', icon: 'star', price: 80, color: c.candyLemon, visual: 'dog-staff-pipi', kind: 'pipi' },
  { decorationId: 'general-fluffy-staff-amber', key: 'fluffy-staff-amber', name: '琥珀', breed: '淺啡色比熊', description: '淺啡色比熊琥珀會在櫃台旁陪伴大家。', icon: 'sun', price: 90, color: c.candyPeach, visual: 'dog-staff-amber', kind: 'amber' },
  { decorationId: 'general-fluffy-staff-cloud', key: 'fluffy-staff-cloud', name: '雲朵', breed: '白色博美', description: '白色博美雲朵像一團柔軟的小雲。', icon: 'cloud', price: 85, color: c.candySky, visual: 'dog-staff-cloud', kind: 'cloud' },
  { decorationId: 'general-fluffy-staff-wonton', key: 'fluffy-staff-wonton', name: '雲吞', breed: '白色馬爾濟斯', description: '白色馬爾濟斯雲吞會乖巧地陪客人挑選甜點。', icon: 'heart', price: 85, color: c.candyLavender, visual: 'dog-staff-wonton', kind: 'wonton' },
  { decorationId: 'general-fluffy-staff-butter', key: 'fluffy-staff-butter', name: '奶油', breed: '奶油色貴賓', description: '奶油色貴賓奶油有俏皮的捲毛和溫柔笑容。', icon: 'coffee', price: 80, color: c.candyLemon, visual: 'dog-staff-butter', kind: 'butter' },
  { decorationId: 'general-fluffy-staff-sesame', key: 'fluffy-staff-sesame', name: '芝麻', breed: '黑白西施', description: '黑白西施芝麻會在店裡開心地陪伴客人。', icon: 'gift', price: 90, color: c.candyInk, visual: 'dog-staff-sesame', kind: 'sesame' },
  { decorationId: 'general-fluffy-staff-snowball', key: 'fluffy-staff-snowball', name: '雪球', breed: '白色迷你雪納瑞', description: '白色迷你雪納瑞雪球有蓬鬆的小鬍鬚和眉毛。', icon: 'star', price: 90, color: c.card, visual: 'dog-staff-snowball', kind: 'snowball' },
  { decorationId: 'general-fluffy-staff-maomao', key: 'fluffy-staff-maomao', name: '毛毛', breed: '白色薩摩耶', description: '白色薩摩耶毛毛會用暖暖的笑容迎接大家。', icon: 'sun', price: 110, color: c.candyCream, visual: 'dog-staff-maomao', kind: 'maomao' },
  { decorationId: 'general-fluffy-staff-poppy', key: 'fluffy-staff-poppy', name: '波比', breed: '淺啡臘腸犬', description: '淺啡色臘腸波比會慢慢走到每個角落打招呼。', icon: 'heart', price: 95, color: c.candyCaramel, visual: 'dog-staff-poppy', kind: 'poppy' },
];

export type DogOutfitCut =
  | 'apron' | 'vest' | 'jacket' | 'cape' | 'dress' | 'princess' | 'little-skirt'
  | 'santa-coat' | 'snowflake-cape' | 'pumpkin-dress' | 'ghost-poncho' | 'moon-rabbit'
  | 'sakura-kimono' | 'tropical-sailor' | 'lion-dance' | 'star-fairy' | 'forest-leaf'
  | 'magical-girl' | 'sweater' | 'animal-costume';
export type DogAnimalKind =
  | 'lion' | 'rabbit' | 'fox' | 'duck' | 'bear' | 'cat' | 'deer'
  | 'koala' | 'lamb' | 'panda' | 'polar-bear' | 'seal' | 'tiger' | 'raccoon';
export type DogAccessoryShape = 'bow' | 'beret' | 'headband' | 'flower' | 'scarf' | 'animal-ears';
export type DogOutfitPattern = 'dots' | 'stripes' | 'checks' | 'stars' | 'flowers';

export interface DogStaffOutfit {
  id: string;
  name: string;
  dogDecorationId: string;
  color: string;
  accentColor: string;
  cut: DogOutfitCut;
  pattern: DogOutfitPattern;
  theme?: string;
  lace?: boolean;
  animalKind?: DogAnimalKind;
}

export interface DogStaffAccessory {
  id: string;
  name: string;
  dogDecorationId: string;
  color: string;
  accentColor: string;
  shape: DogAccessoryShape;
  motif: string;
  animalKind?: DogAnimalKind;
}

export interface DogStaffLook {
  outfitId: string;
  accessoryId: string;
}

export type DogStaffExtensionAreaId = 'extension-1' | 'extension-2' | 'extension-3' | 'extension-4' | 'extension-5';
export type DogStaffAreaId = 'main' | DogStaffExtensionAreaId;
export type DogStaffAreaPlacements = Partial<Record<string, DogStaffAreaId>>;

export const DOG_STAFF_ROUTES = [
  { from: 7, to: 72, top: 78, duration: 14000 },
  { from: 79, to: 19, top: 84, duration: 13200 },
  { from: 18, to: 80, top: 89, duration: 15800 },
  { from: 84, to: 16, top: 92, duration: 15100 },
  { from: 10, to: 66, top: 81, duration: 16000 },
  { from: 72, to: 25, top: 87, duration: 13600 },
  { from: 24, to: 76, top: 93, duration: 16800 },
  { from: 80, to: 8, top: 79, duration: 15400 },
  { from: 6, to: 84, top: 86, duration: 17400 },
  { from: 75, to: 20, top: 90, duration: 14500 },
  { from: 15, to: 70, top: 83, duration: 15300 },
  { from: 86, to: 30, top: 91, duration: 16500 },
  { from: 31, to: 80, top: 88, duration: 14700 },
  { from: 68, to: 12, top: 82, duration: 15900 },
] as const;

export function isDogStaffAreaId(value: unknown): value is DogStaffAreaId {
  return value === 'main'
    || value === 'extension-1'
    || value === 'extension-2'
    || value === 'extension-3'
    || value === 'extension-4'
    || value === 'extension-5';
}

export function getDogStaffAreaLabel(areaId: DogStaffAreaId): string {
  return areaId === 'main' ? '主區' : `延伸區 ${areaId.slice('extension-'.length)}`;
}

export const DOG_STAFF_STATIONS = [
  { id: 'entrance-greeting', label: '入口迎賓', areaId: 'extension-1' },
  { id: 'window-side', label: '窗邊座位', areaId: 'extension-1' },
  { id: 'counter-left', label: '櫃台左側', areaId: 'extension-1' },
  { id: 'counter-right', label: '櫃台右側', areaId: 'extension-2' },
  { id: 'cotton-candy-machine', label: '棉花糖機旁', areaId: 'extension-2' },
  { id: 'coffee-bar', label: '咖啡吧旁', areaId: 'extension-2' },
  { id: 'dessert-display', label: '甜點展示櫃', areaId: 'extension-3' },
  { id: 'center-seating', label: '中央座位', areaId: 'extension-3' },
  { id: 'lounge-left', label: '左側沙發', areaId: 'extension-3' },
  { id: 'lounge-right', label: '右側沙發', areaId: 'extension-4' },
  { id: 'garden-window', label: '花園窗邊', areaId: 'extension-4' },
  { id: 'event-corner', label: '活動角落', areaId: 'extension-4' },
  { id: 'kitchen-door', label: '後場入口', areaId: 'extension-5' },
  { id: 'photo-corner', label: '拍照小角落', areaId: 'extension-5' },
] as const;

export type DogStaffStationId = typeof DOG_STAFF_STATIONS[number]['id'];
export function getDogStaffStationAreaLabel(areaId: DogStaffExtensionAreaId): string {
  return `延伸區 ${areaId.slice('extension-'.length)}`;
}
const outfitThemes = [
  '草莓雲朵',
  '莓果奶霜',
  '焦糖泡芙',
  '蜂蜜星砂',
  '薄荷糖霜',
  '櫻桃棉花',
  '香草奶泡',
  '彩虹糖粒',
  '月光珍珠',
  '雛菊蜜糖',
] as const;

const outfitCuts: { id: DogOutfitCut; label: string }[] = [
  { id: 'apron', label: '圍裙制服' },
  { id: 'vest', label: '針織背心' },
  { id: 'jacket', label: '泡泡袖短外套' },
  { id: 'cape', label: '棉花糖披肩' },
  { id: 'dress', label: '蓬蓬裙制服' },
];

const outfitPatterns: DogOutfitPattern[] = ['dots', 'stripes', 'checks', 'stars', 'flowers'];
const accessoryMotifs = ['草莓', '櫻桃', '雛菊', '星月', '雲朵', '奶油', '彩虹', '珍珠', '薄荷', '蜂蜜'] as const;
const accessoryShapes: { id: DogAccessoryShape; label: string }[] = [
  { id: 'bow', label: '蝴蝶結' },
  { id: 'beret', label: '貝雷帽' },
  { id: 'headband', label: '髮箍' },
  { id: 'flower', label: '花朵髮夾' },
  { id: 'scarf', label: '領巾' },
];
const styleColors = [
  c.candyPink,
  c.candyPeach,
  c.candyMint,
  c.candyLavender,
  c.candySky,
  c.candyLemon,
  c.candyCoral,
  c.candyRose,
  c.candyCream,
  c.candyCaramel,
];

const specialSkirtAccents = [c.candyRose, c.candyCoral, c.candyLavender, c.candyLemon, c.candyMint];
const specialSkirtPatterns: DogOutfitPattern[] = ['dots', 'stripes', 'checks', 'stars', 'flowers'];
const festivalVariantLabels = ['繽紛款 1', '繽紛款 2', '繽紛款 3', '繽紛款 4', '繽紛款 5'];
const festivalThemes: { id: string; label: string; cut: DogOutfitCut; hue: number }[] = [
  { id: 'christmas', label: '聖誕節雪花大衣', cut: 'santa-coat', hue: 350 },
  { id: 'winter', label: '冰雪節雪晶斗篷', cut: 'snowflake-cape', hue: 205 },
  { id: 'halloween', label: '萬聖節南瓜蓬蓬裙', cut: 'pumpkin-dress', hue: 40 },
  { id: 'ghost', label: '夜光幽靈斗篷', cut: 'ghost-poncho', hue: 280 },
  { id: 'moon-rabbit', label: '中秋月兔套裝', cut: 'moon-rabbit', hue: 65 },
  { id: 'sakura', label: '櫻花祭和風服', cut: 'sakura-kimono', hue: 325 },
  { id: 'tropical', label: '夏日海灘水手服', cut: 'tropical-sailor', hue: 175 },
  { id: 'new-year', label: '新年舞獅慶典服', cut: 'lion-dance', hue: 15 },
  { id: 'star-fairy', label: '星空仙子禮服', cut: 'star-fairy', hue: 255 },
  { id: 'forest', label: '森林精靈葉片披風', cut: 'forest-leaf', hue: 120 },
];
const magicalGirlColors = [
  { label: '粉紅', hue: 338 },
  { label: '紫色', hue: 260 },
  { label: '藍色', hue: 208 },
  { label: '橙色', hue: 26 },
  { label: '莓果紅', hue: 0 },
  { label: '檸檬黃', hue: 52 },
  { label: '嫩芽黃綠', hue: 78 },
  { label: '草木綠', hue: 104 },
  { label: '薄荷綠', hue: 130 },
  { label: '薄荷青', hue: 156 },
  { label: '湖水青', hue: 182 },
  { label: '靛藍', hue: 234 },
  { label: '葡萄紫', hue: 286 },
  { label: '櫻花紫粉', hue: 312 },
] as const;
const dogAnimalCostumes: Record<string, { kind: DogAnimalKind; label: string; hue: number }> = {
  'general-fluffy-staff-huahua': { kind: 'lion', label: '小獅子', hue: 34 },
  'general-fluffy-staff-milkshake': { kind: 'rabbit', label: '小兔子', hue: 330 },
  'general-fluffy-staff-xiaoniu': { kind: 'fox', label: '小狐狸', hue: 22 },
  'general-fluffy-staff-pudding': { kind: 'duck', label: '小鴨子', hue: 54 },
  'general-fluffy-staff-tangtang': { kind: 'bear', label: '小熊', hue: 28 },
  'general-fluffy-staff-pipi': { kind: 'cat', label: '小貓咪', hue: 198 },
  'general-fluffy-staff-amber': { kind: 'deer', label: '小鹿', hue: 42 },
  'general-fluffy-staff-cloud': { kind: 'koala', label: '無尾熊', hue: 210 },
  'general-fluffy-staff-wonton': { kind: 'lamb', label: '小綿羊', hue: 275 },
  'general-fluffy-staff-butter': { kind: 'panda', label: '小熊貓', hue: 155 },
  'general-fluffy-staff-sesame': { kind: 'polar-bear', label: '北極熊', hue: 188 },
  'general-fluffy-staff-snowball': { kind: 'seal', label: '小海豹', hue: 225 },
  'general-fluffy-staff-maomao': { kind: 'tiger', label: '小老虎', hue: 18 },
  'general-fluffy-staff-poppy': { kind: 'raccoon', label: '小浣熊', hue: 245 },
};
const animalEarHats: { kind: DogAnimalKind; label: string; hue: number }[] = [
  { kind: 'lion', label: '獅子', hue: 34 },
  { kind: 'bear', label: '小熊', hue: 28 },
  { kind: 'rabbit', label: '兔子', hue: 330 },
  { kind: 'cat', label: '小貓', hue: 198 },
  { kind: 'fox', label: '狐狸', hue: 22 },
  { kind: 'deer', label: '小鹿', hue: 42 },
  { kind: 'panda', label: '熊貓', hue: 155 },
  { kind: 'koala', label: '無尾熊', hue: 210 },
  { kind: 'tiger', label: '小老虎', hue: 18 },
  { kind: 'lamb', label: '綿羊', hue: 275 },
];

function hslToHex(hue: number, saturation: number, lightness: number) {
  const h = ((hue % 360) + 360) % 360;
  const s = saturation / 100;
  const l = lightness / 100;
  const chroma = (1 - Math.abs(2 * l - 1)) * s;
  const section = h / 60;
  const x = chroma * (1 - Math.abs((section % 2) - 1));
  const [r, g, b] = section < 1 ? [chroma, x, 0]
    : section < 2 ? [x, chroma, 0]
      : section < 3 ? [0, chroma, x]
        : section < 4 ? [0, x, chroma]
          : section < 5 ? [x, 0, chroma]
            : [chroma, 0, x];
  const m = l - chroma / 2;
  return `#${[r, g, b].map((channel) =>
    Math.round((channel + m) * 255).toString(16).padStart(2, '0')).join('')}`;
}

export const DOG_STAFF_STYLE_CATALOGS = Object.fromEntries(
  DOG_STAFF_PROFILES.map((dog, dogIndex) => {
    const standardOutfits = outfitThemes.flatMap((theme, themeIndex) =>
      outfitCuts.map((cut, cutIndex) => {
        const index = themeIndex * outfitCuts.length + cutIndex;
        return {
          id: `${dog.decorationId}:outfit:${String(index + 1).padStart(2, '0')}`,
          name: `${dog.name}・${theme}${cut.label}`,
          dogDecorationId: dog.decorationId,
          color: styleColors[(dogIndex * 3 + themeIndex + cutIndex) % styleColors.length],
          accentColor: styleColors[(dogIndex + themeIndex * 2 + cutIndex + 3) % styleColors.length],
          cut: cut.id,
          pattern: outfitPatterns[(themeIndex + cutIndex) % outfitPatterns.length],
        };
      }),
    );
    const specialOutfits = dog.decorationId === 'general-fluffy-staff-huahua'
      ? [
        {
          id: `${dog.decorationId}:outfit:special-pink-princess`,
          name: '花花・粉紅色公主裙',
          dogDecorationId: dog.decorationId,
          color: c.candyPink,
          accentColor: c.candyRose,
          cut: 'princess' as const,
          pattern: 'stars' as const,
          lace: true,
        },
        ...specialSkirtAccents.map((accentColor, index) => ({
          id: `${dog.decorationId}:outfit:special-pink-skirt-${index + 1}`,
          name: `花花・粉紅色小裙子 ${index + 1}`,
          dogDecorationId: dog.decorationId,
          color: c.candyPink,
          accentColor,
          cut: 'little-skirt' as const,
          pattern: specialSkirtPatterns[index],
        })),
      ]
      : dog.decorationId === 'general-fluffy-staff-milkshake'
        ? [
          {
            id: `${dog.decorationId}:outfit:special-purple-princess`,
            name: '奶昔・紫色公主裙',
            dogDecorationId: dog.decorationId,
            color: c.candyLavender,
            accentColor: c.candyLavenderDark,
            cut: 'princess' as const,
            pattern: 'stars' as const,
          },
          ...specialSkirtAccents.map((accentColor, index) => ({
            id: `${dog.decorationId}:outfit:special-purple-skirt-${index + 1}`,
            name: `奶昔・紫色小裙子 ${index + 1}`,
            dogDecorationId: dog.decorationId,
            color: c.candyLavender,
            accentColor,
            cut: 'little-skirt' as const,
            pattern: specialSkirtPatterns[index],
          })),
        ]
        : [];
    const festivalOutfits = festivalThemes.flatMap((theme, themeIndex) =>
      festivalVariantLabels.map((variantLabel, variantIndex) => {
        const hue = theme.hue + variantIndex * 4.2 + dogIndex * 0.35;
        return {
          id: `${dog.decorationId}:outfit:festival:${theme.id}:${variantIndex + 1}`,
          name: `${dog.name}・${theme.label} ${variantLabel}`,
          dogDecorationId: dog.decorationId,
          color: hslToHex(hue, 64 + (variantIndex % 2) * 6, 66 + (variantIndex % 3) * 3),
          accentColor: hslToHex(hue + 154 + themeIndex * 2, 58, 80 - (variantIndex % 3) * 3),
          cut: theme.cut,
          pattern: outfitPatterns[(dogIndex + themeIndex + variantIndex) % outfitPatterns.length],
          theme: theme.id,
        };
      }),
    );
    const magicalColor = magicalGirlColors[dogIndex];
    const animalCostume = dogAnimalCostumes[dog.decorationId];
    const themedCostumes = [
      {
        id: `${dog.decorationId}:outfit:magical-girl`,
        name: `${dog.name}・${magicalColor.label}魔法少女星願裙`,
        dogDecorationId: dog.decorationId,
        color: hslToHex(magicalColor.hue, 64, 74),
        accentColor: hslToHex(magicalColor.hue + 152, 66, 83),
        cut: 'magical-girl' as const,
        pattern: 'stars' as const,
        theme: 'magical-girl',
      },
      {
        id: `${dog.decorationId}:outfit:cozy-sweater`,
        name: `${dog.name}・暖暖毛衣`,
        dogDecorationId: dog.decorationId,
        color: hslToHex(24 + dogIndex * 23, 58, 72),
        accentColor: hslToHex(24 + dogIndex * 23 + 150, 52, 84),
        cut: 'sweater' as const,
        pattern: outfitPatterns[dogIndex % outfitPatterns.length],
        theme: 'cozy-sweater',
      },
      {
        id: `${dog.decorationId}:outfit:animal-costume`,
        name: `${dog.name}・${animalCostume.label}動物造型服`,
        dogDecorationId: dog.decorationId,
        color: hslToHex(animalCostume.hue, 58, 74),
        accentColor: hslToHex(animalCostume.hue + 155, 55, 83),
        cut: 'animal-costume' as const,
        pattern: 'dots' as const,
        theme: 'animal-costume',
        animalKind: animalCostume.kind,
      },
    ];
    const outfits = [...standardOutfits, ...specialOutfits, ...festivalOutfits];
    outfits.push(...themedCostumes);
    const standardAccessories = accessoryMotifs.flatMap((motif, motifIndex) =>
      accessoryShapes.map((shape, shapeIndex) => {
        const index = motifIndex * accessoryShapes.length + shapeIndex;
        return {
          id: `${dog.decorationId}:accessory:${String(index + 1).padStart(2, '0')}`,
          name: `${dog.name}・${motif}${shape.label}`,
          dogDecorationId: dog.decorationId,
          color: styleColors[(dogIndex + motifIndex + shapeIndex * 2) % styleColors.length],
          accentColor: styleColors[(dogIndex + motifIndex * 2 + shapeIndex + 4) % styleColors.length],
          shape: shape.id,
          motif,
        };
      }),
    );
    const animalAccessories = animalEarHats.map((animal, index) => ({
      id: `${dog.decorationId}:accessory:animal-ears:${animal.kind}`,
      name: `${dog.name}・${animal.label}耳朵帽`,
      dogDecorationId: dog.decorationId,
      color: hslToHex(animal.hue + dogIndex * 3, 57, 75),
      accentColor: hslToHex(animal.hue + 150 + dogIndex * 3, 56, 84),
      shape: 'animal-ears' as const,
      motif: animal.label,
      animalKind: animal.kind,
    }));
    const accessories = [...standardAccessories, ...animalAccessories];
    return [dog.decorationId, { outfits, accessories }];
  }),
) as Record<string, { outfits: DogStaffOutfit[]; accessories: DogStaffAccessory[] }>;

export const DOG_STAFF_PROFILE_BY_DECORATION_ID = Object.fromEntries(
  DOG_STAFF_PROFILES.map((profile) => [profile.decorationId, profile]),
) as Record<string, DogStaffProfile | undefined>;

export const DOG_STAFF_OUTFIT_BY_ID = Object.fromEntries(
  Object.values(DOG_STAFF_STYLE_CATALOGS).flatMap(({ outfits }) => outfits.map((outfit) => [outfit.id, outfit])),
) as Record<string, DogStaffOutfit | undefined>;

export const DOG_STAFF_ACCESSORY_BY_ID = Object.fromEntries(
  Object.values(DOG_STAFF_STYLE_CATALOGS).flatMap(({ accessories }) => accessories.map((accessory) => [accessory.id, accessory])),
) as Record<string, DogStaffAccessory | undefined>;

export function getDefaultDogStaffLook(dogDecorationId: string): DogStaffLook | null {
  const catalog = DOG_STAFF_STYLE_CATALOGS[dogDecorationId];
  if (!catalog) return null;
  return {
    outfitId: catalog.outfits[0].id,
    accessoryId: catalog.accessories[0].id,
  };
}

export function resolveDogStaffLook(
  dogDecorationId: string,
  savedLook?: Partial<DogStaffLook>,
): DogStaffLook | null {
  const catalog = DOG_STAFF_STYLE_CATALOGS[dogDecorationId];
  if (!catalog) return null;
  return {
    outfitId: catalog.outfits.some(({ id }) => id === savedLook?.outfitId)
      ? savedLook!.outfitId!
      : catalog.outfits[0].id,
    accessoryId: catalog.accessories.some(({ id }) => id === savedLook?.accessoryId)
      ? savedLook!.accessoryId!
      : catalog.accessories[0].id,
  };
}

export function isValidDogStaffLook(
  dogDecorationId: string,
  look: unknown,
): look is DogStaffLook {
  if (!look || typeof look !== 'object') return false;
  const candidate = look as Partial<DogStaffLook>;
  const catalog = DOG_STAFF_STYLE_CATALOGS[dogDecorationId];
  return !!catalog
    && typeof candidate.outfitId === 'string'
    && typeof candidate.accessoryId === 'string'
    && catalog.outfits.some(({ id }) => id === candidate.outfitId)
    && catalog.accessories.some(({ id }) => id === candidate.accessoryId);
}
