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

export type DogOutfitCut = 'apron' | 'vest' | 'jacket' | 'cape' | 'dress' | 'princess' | 'little-skirt';
export type DogAccessoryShape = 'bow' | 'beret' | 'headband' | 'flower' | 'scarf';
export type DogOutfitPattern = 'dots' | 'stripes' | 'checks' | 'stars' | 'flowers';

export interface DogStaffOutfit {
  id: string;
  name: string;
  dogDecorationId: string;
  color: string;
  accentColor: string;
  cut: DogOutfitCut;
  pattern: DogOutfitPattern;
}

export interface DogStaffAccessory {
  id: string;
  name: string;
  dogDecorationId: string;
  color: string;
  accentColor: string;
  shape: DogAccessoryShape;
  motif: string;
}

export interface DogStaffLook {
  outfitId: string;
  accessoryId: string;
}

export const DOG_STAFF_STATIONS = [
  { id: 'entrance-greeting', label: '入口迎賓' },
  { id: 'window-side', label: '窗邊座位' },
  { id: 'counter-left', label: '櫃台左側' },
  { id: 'counter-right', label: '櫃台右側' },
  { id: 'cotton-candy-machine', label: '棉花糖機旁' },
  { id: 'coffee-bar', label: '咖啡吧旁' },
  { id: 'dessert-display', label: '甜點展示櫃' },
  { id: 'center-seating', label: '中央座位' },
  { id: 'lounge-left', label: '左側沙發' },
  { id: 'lounge-right', label: '右側沙發' },
  { id: 'garden-window', label: '花園窗邊' },
  { id: 'event-corner', label: '活動角落' },
  { id: 'kitchen-door', label: '後場入口' },
  { id: 'photo-corner', label: '拍照小角落' },
] as const;

export type DogStaffStationId = typeof DOG_STAFF_STATIONS[number]['id'];
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
    const outfits = [...standardOutfits, ...specialOutfits];
    const accessories = accessoryMotifs.flatMap((motif, motifIndex) =>
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
