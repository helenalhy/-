import palette from './colors';

const c = palette.light;

export interface MallFloorArtProfile {
  title: string;
  emblem: string;
  accent: string;
  secondary: string;
  soft: string;
  shopAccent: string;
  shopSoft: string;
  variant: number;
  pattern: number;
  displayMark: number;
  objectPattern: number;
  objectVariant: number;
  objectAnimation: number;
  roofStyle: number;
  canopyStyle: number;
  signStyle: number;
  windowStyle: number;
  displayStyle: number;
  trimStyle: number;
  ornament: string;
  secondaryOrnament: string;
}

const FLOOR_ART: readonly Omit<MallFloorArtProfile, 'variant' | 'pattern' | 'displayMark' | 'objectPattern' | 'objectVariant' | 'objectAnimation' | 'roofStyle' | 'canopyStyle' | 'signStyle' | 'windowStyle' | 'displayStyle' | 'trimStyle' | 'ornament' | 'secondaryOrnament' | 'shopAccent' | 'shopSoft'>[] = [
  { title: '糖果迎賓街', emblem: 'sun', accent: c.candyRose, secondary: c.candyPeach, soft: c.candyPink },
  { title: '森林花園', emblem: 'feather', accent: c.candyMintDark, secondary: c.candyLemon, soft: c.candyMint },
  { title: '慢讀書廊', emblem: 'book-open', accent: c.candyLavenderDark, secondary: c.candyCaramel, soft: c.candyLavender },
  { title: '海洋奇遇', emblem: 'anchor', accent: c.candySkyDark, secondary: c.candyCoral, soft: c.candySky },
  { title: '像素遊樂城', emblem: 'cpu', accent: c.candyLavenderDark, secondary: c.candyLemon, soft: c.candyLavender },
  { title: '雲朵療癒館', emblem: 'cloud', accent: c.candyMintDark, secondary: c.candySky, soft: c.candyPeach },
  { title: '彩虹藝術廊', emblem: 'image', accent: c.candyRoseDark, secondary: c.candyLavender, soft: c.candyCoral },
  { title: '星際觀測站', emblem: 'moon', accent: c.candyLavenderDark, secondary: c.candySky, soft: c.candyLavender },
  { title: '世界美食集', emblem: 'coffee', accent: c.candyCaramelDark, secondary: c.candyCoral, soft: c.candyLemon },
  { title: '巡遊嘉年華大街', emblem: 'gift', accent: c.candyRoseDark, secondary: c.candyLemon, soft: c.candyCoral },
  { title: '影視製片夢工場', emblem: 'video', accent: c.candyLavenderDark, secondary: c.candyRose, soft: c.candyLavender },
  { title: '冰晶雪國', emblem: 'thermometer', accent: c.candySkyDark, secondary: c.candyLavender, soft: c.candySky },
  { title: '古文明探險館', emblem: 'compass', accent: c.candyCaramelDark, secondary: c.candyMint, soft: c.candyLemon },
  { title: '魔法學院', emblem: 'zap', accent: c.candyLavenderDark, secondary: c.candyRose, soft: c.candyLavender },
  { title: '櫻花溫泉小町', emblem: 'droplet', accent: c.candyRoseDark, secondary: c.candyPeach, soft: c.candyPink },
  { title: '復古中世紀石板城', emblem: 'shield', accent: c.candyCaramelDark, secondary: c.candyRose, soft: c.candyPeach },
  { title: '音樂舞台街', emblem: 'music', accent: c.candyRoseDark, secondary: c.candyLavender, soft: c.candyCoral },
  { title: '積木創想樂園', emblem: 'box', accent: c.candyCaramelDark, secondary: c.candySky, soft: c.candyLemon },
  { title: '毛茸茸寵物樂園', emblem: 'heart', accent: c.candyMintDark, secondary: c.candyRose, soft: c.candyMint },
  { title: '天空花園', emblem: 'sunrise', accent: c.candySkyDark, secondary: c.candyPink, soft: c.candySky },
  { title: '童話天空城堡', emblem: 'star', accent: c.candyRoseDark, secondary: c.candySky, soft: c.candyPink },
  { title: '月球探索基地', emblem: 'globe', accent: c.candyLavenderDark, secondary: c.candySky, soft: c.candyLavender },
  { title: '時光郵局鐘塔街', emblem: 'clock', accent: c.candyLavenderDark, secondary: c.candyRose, soft: c.candyLavender },
  { title: '夢境劇場迷宮', emblem: 'film', accent: c.candyRoseDark, secondary: c.candyLavender, soft: c.candyCoral },
  { title: '機器人發明研究院', emblem: 'aperture', accent: c.candyMintDark, secondary: c.candySky, soft: c.candyMint },
  { title: '雨林瀑布生態谷', emblem: 'map', accent: c.candyMintDark, secondary: c.candySky, soft: c.candyMint },
  { title: '玻璃海岸燈塔港', emblem: 'navigation', accent: c.candySkyDark, secondary: c.candyPeach, soft: c.candySky },
  { title: '熱氣球環遊港站', emblem: 'send', accent: c.candyRoseDark, secondary: c.candyLemon, soft: c.candyPeach },
  { title: '幻彩寶石洞窟', emblem: 'hexagon', accent: c.candyLavenderDark, secondary: c.candySky, soft: c.candyLavender },
  { title: '月下燈籠古街', emblem: 'radio', accent: c.candyRoseDark, secondary: c.candyCaramel, soft: c.candyPeach },
];

const ORNAMENTS = ['star', 'circle', 'heart', 'triangle', 'moon', 'sun', 'plus', 'hexagon'] as const;
const SHOP_ACCENTS = [c.candyPink, c.candyLavender, c.candyMint, c.candySky, c.candyCoral, c.candyPeach, c.candyLemon, c.candyRose] as const;

function stableHash(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  hash += hash << 13;
  hash ^= hash >>> 7;
  hash += hash << 3;
  hash ^= hash >>> 17;
  hash += hash << 5;
  return hash >>> 0;
}

/** Produces a stable, floor-specific and item-specific illustrated identity. */
export function getMallFloorArtProfile(floor: number, itemId: string): MallFloorArtProfile {
  const boundedFloor = Math.max(1, Math.min(FLOOR_ART.length, Math.floor(floor || 1)));
  const base = FLOOR_ART[boundedFloor - 1];
  const key = `${boundedFloor}:${itemId}`;
  return {
    ...base,
    shopAccent: SHOP_ACCENTS[stableHash(`${key}:accent`) % SHOP_ACCENTS.length],
    shopSoft: SHOP_ACCENTS[stableHash(`${key}:soft`) % SHOP_ACCENTS.length],
    variant: stableHash(`${key}:art-0`) % 4,
    roofStyle: stableHash(`${key}:art-1`) % 6,
    canopyStyle: stableHash(`${key}:art-2`) % 8,
    signStyle: stableHash(`${key}:art-3`) % 9,
    windowStyle: stableHash(`${key}:art-4`) % 10,
    displayStyle: stableHash(`${key}:art-5`) % 11,
    trimStyle: stableHash(`${key}:art-6`) % 12,
    pattern: stableHash(`${key}:pattern`) % 8,
    displayMark: stableHash(`${key}:mark`) % 997,
    objectPattern: stableHash(`${key}:object-pattern`) % 7,
    objectVariant: stableHash(`${key}:object-variant`) % 9,
    objectAnimation: stableHash(`${key}:object-animation`) % 6,
    ornament: ORNAMENTS[stableHash(`${key}:ornament`) % ORNAMENTS.length],
    secondaryOrnament: ORNAMENTS[stableHash(`${key}:secondary`) % ORNAMENTS.length],
  };
}

export const MALL_FLOOR_ART_TITLES = FLOOR_ART.map(({ title }) => title);
