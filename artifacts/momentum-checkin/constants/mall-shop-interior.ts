import palette from './colors';
import type { MallShopType } from './mall';

export type ShopInteriorSlotId =
  | 'front-window'
  | 'left-wall'
  | 'center'
  | 'right-wall'
  | 'back-wall'
  | 'counter';

export interface ShopInteriorDecoration {
  id: string;
  name: string;
  description: string;
  icon: string;
  price: number;
  color: string;
}

export const SHOP_INTERIOR_SLOTS: { id: ShopInteriorSlotId; label: string; icon: string }[] = [
  { id: 'front-window', label: '櫥窗', icon: 'image' },
  { id: 'left-wall', label: '左牆', icon: 'grid' },
  { id: 'center', label: '中央', icon: 'star' },
  { id: 'right-wall', label: '右牆', icon: 'grid' },
  { id: 'back-wall', label: '後牆', icon: 'home' },
  { id: 'counter', label: '櫃台', icon: 'shopping-bag' },
];

const c = palette.light;

const option = (
  type: string,
  key: string,
  name: string,
  description: string,
  icon: string,
  price: number,
  color: string,
): ShopInteriorDecoration => ({
  id: `${type}-${key}`,
  name,
  description,
  icon,
  price,
  color,
});

const general = [
  option('general', 'display-shelf', '糖果色展示架', '把本店的人氣選物整齊展示。', 'grid', 20, c.candyMint),
  option('general', 'warm-lamp', '暖光吊燈', '為店內添上柔和的燈光。', 'sun', 25, c.candyLemon),
  option('general', 'welcome-plant', '迎賓綠植', '放在入口旁的一盆小植物。', 'feather', 15, c.candyMint),
  option('general', 'feature-table', '中央焦點桌', '讓本店主打商品更顯眼。', 'package', 35, c.candyPeach),
  option('general', 'wall-art', '手繪主題畫', '用插畫裝飾空白牆面。', 'image', 30, c.candyLavender),
  option('general', 'welcome-sign', '小店招牌燈', '點亮店內的品牌小招牌。', 'star', 40, c.candyPink),
];

export const SHOP_INTERIOR_DECORATIONS: Record<MallShopType, ShopInteriorDecoration[]> = {
  general,
  womenswear: [
    option('womenswear', 'clothing-rack', '新品衣架牆', '展示本週新到的服飾。', 'shopping-bag', 30, c.candyPink),
    option('womenswear', 'full-length-mirror', '花邊穿搭鏡', '試穿後從不同角度看看搭配。', 'square', 25, c.candyLavender),
    option('womenswear', 'fitting-room', '奶油色試衣間', '為店內加入柔軟簾幕試衣區。', 'columns', 45, c.candyPeach),
    option('womenswear', 'accessory-table', '飾品搭配桌', '把服飾配件放在一起展示。', 'gift', 35, c.candyLemon),
    option('womenswear', 'shoe-display', '鞋款展示台', '用小巧平台陳列當季鞋款。', 'grid', 40, c.candySky),
    option('womenswear', 'boutique-lamp', '精品吊燈', '在試衣區上方添一盞柔光燈。', 'sun', 50, c.candyCoral),
  ],
  bridal: [
    option('bridal', 'gown-pedestal', '婚紗展示台', '為主打婚紗留一個柔光舞台。', 'star', 45, c.candyPink),
    option('bridal', 'lace-arch', '蕾絲花拱門', '用花朵和蕾絲迎接準新娘。', 'sunrise', 55, c.candyPeach),
    option('bridal', 'crystal-light', '水晶吊燈', '讓婚紗細節在燈光下閃耀。', 'sun', 60, c.candyLemon),
    option('bridal', 'flower-wall', '柔粉花牆', '打造適合拍照的花藝背景。', 'feather', 45, c.candyLavender),
    option('bridal', 'bridal-mirror', '金邊試衣鏡', '完整欣賞婚紗與頭紗造型。', 'square', 35, c.candySky),
    option('bridal', 'consultation-sofa', '婚禮相談沙發', '讓選婚紗的時光坐得更舒服。', 'heart', 50, c.candyCoral),
  ],
  eveningwear: [
    option('eveningwear', 'gown-mannequin', '晚禮服模特架', '展示剪裁優雅的晚宴服。', 'user', 40, c.candyLavender),
    option('eveningwear', 'spotlight-rail', '伸展台聚光燈', '照亮本季主打禮服。', 'sun', 50, c.candyLemon),
    option('eveningwear', 'velvet-curtain', '莓果絲絨布幕', '為試穿區加上柔軟布幕。', 'columns', 45, c.candyRose),
    option('eveningwear', 'clutch-display', '手拿包展示櫃', '把晚宴配件一起搭配陳列。', 'gift', 35, c.candyPeach),
    option('eveningwear', 'gold-mirror', '金框全身鏡', '試穿後看看完整晚宴造型。', 'square', 30, c.candySky),
    option('eveningwear', 'rose-vase', '玫瑰迎賓花瓶', '在店內放一束柔和花藝。', 'feather', 25, c.candyPink),
  ],
  kimono: [
    option('kimono', 'kimono-rack', '和服衣架', '展示花色細緻的和服。', 'shopping-bag', 35, c.candyCoral),
    option('kimono', 'shoji-screen', '櫻花障子屏風', '分隔出安靜的試穿角落。', 'columns', 45, c.candyPeach),
    option('kimono', 'tatami-platform', '榻榻米試穿台', '在柔軟榻榻米上整理衣袖。', 'square', 40, c.candyMint),
    option('kimono', 'sakura-branch', '櫻花掛枝', '讓粉色花枝點亮和風店內。', 'feather', 25, c.candyPink),
    option('kimono', 'geta-display', '木屐展示架', '將木屐和配件整齊陳列。', 'grid', 30, c.candyLemon),
    option('kimono', 'paper-lantern', '和紙暖燈', '加一盞手繪和紙燈籠。', 'sun', 35, c.candyLavender),
  ],
  supermarket: [
    option('supermarket', 'produce-island', '繽紛蔬果島', '把新鮮蔬果排成一座小島。', 'grid', 40, c.candyMint),
    option('supermarket', 'grocery-shelves', '糖果色貨架', '補上店內必備的商品層架。', 'package', 35, c.candySky),
    option('supermarket', 'chilled-case', '玻璃冷藏櫃', '展示冰涼飲品和甜點。', 'droplet', 50, c.candyLavender),
    option('supermarket', 'basket-stack', '購物籃架', '在入口準備一疊輕巧購物籃。', 'shopping-bag', 20, c.candyPeach),
    option('supermarket', 'aisle-sign', '樓層分類牌', '讓每一區的商品一目了然。', 'map-pin', 25, c.candyLemon),
    option('supermarket', 'checkout-counter', '迷你收銀櫃台', '完成超市店內的結帳區。', 'credit-card', 45, c.candyPink),
  ],
  hyakuen: [
    option('hyakuen', 'organizer-wall', '百元收納牆', '整齊陳列各式生活小物。', 'grid', 30, c.candyMint),
    option('hyakuen', 'stationery-corner', '文具小物架', '把筆記本和文具集中展示。', 'edit-3', 25, c.candySky),
    option('hyakuen', 'seasonal-table', '季節好物桌', '用小桌展示當季新選物。', 'package', 35, c.candyPeach),
    option('hyakuen', 'basket-stack', '迷你購物籃', '放在入口方便挑選小物。', 'shopping-bag', 15, c.candyLemon),
    option('hyakuen', 'price-sign', '百元價目燈牌', '為店內加上一盞醒目的招牌。', 'tag', 30, c.candyPink),
    option('hyakuen', 'gift-wrap-corner', '禮物包裝角', '用緞帶包裝剛挑好的小禮物。', 'gift', 40, c.candyLavender),
  ],
};

export const SHOP_INTERIOR_DECORATION_BY_ID = Object.fromEntries(
  Object.values(SHOP_INTERIOR_DECORATIONS).flat().map((decoration) => [decoration.id, decoration]),
) as Record<string, ShopInteriorDecoration>;

export const SHOP_INTERIOR_DECORATION_IDS = Object.keys(SHOP_INTERIOR_DECORATION_BY_ID);
export const SHOP_INTERIOR_SLOT_IDS = SHOP_INTERIOR_SLOTS.map(({ id }) => id);

export function getShopInteriorDecorations(shopType?: MallShopType): ShopInteriorDecoration[] {
  return SHOP_INTERIOR_DECORATIONS[shopType ?? 'general'];
}

export function getShopTypeLabel(shopType?: MallShopType): string {
  const labels: Record<MallShopType, string> = {
    general: '特色商店',
    womenswear: '女裝店',
    bridal: '婚紗店',
    eveningwear: '晚禮服店',
    kimono: '和服店',
    supermarket: '超市',
    hyakuen: '日本百元店',
  };
  return labels[shopType ?? 'general'];
}
