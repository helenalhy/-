import palette from './colors';
import type { MallShopType } from './mall';
import { DOG_STAFF_PROFILES } from './dog-staff-customization';

export type ShopInteriorSlotId =
  | 'front-window'
  | 'left-wall'
  | 'center'
  | 'right-wall'
  | 'back-wall'
  | 'counter'
  | 'left-table'
  | 'right-table';

export type ShopInteriorExtensionId = `extension-${1 | 2 | 3 | 4 | 5}`;
export type ShopInteriorAreaId = 'main' | ShopInteriorExtensionId;
export type ShopInteriorPlacementId =
  | ShopInteriorSlotId
  | `${ShopInteriorExtensionId}:${ShopInteriorSlotId}`;

export const SHOP_INTERIOR_AREAS: { id: ShopInteriorAreaId; label: string }[] = [
  { id: 'main', label: '主區' },
  { id: 'extension-1', label: '延伸區 1' },
  { id: 'extension-2', label: '延伸區 2' },
  { id: 'extension-3', label: '延伸區 3' },
  { id: 'extension-4', label: '延伸區 4' },
  { id: 'extension-5', label: '延伸區 5' },
];

export interface ShopInteriorDecoration {
  id: string;
  name: string;
  description: string;
  icon: string;
  price: number;
  color: string;
  itemKind?: 'equipment' | 'decoration';
  visual?: string;
  limitedEdition?: boolean;
  dogOutfitId?: string;
  dogAccessoryId?: string;
}

export const SHOP_INTERIOR_SLOTS: { id: ShopInteriorSlotId; label: string; icon: string }[] = [
  { id: 'front-window', label: '櫥窗', icon: 'image' },
  { id: 'left-wall', label: '左牆', icon: 'grid' },
  { id: 'center', label: '中央', icon: 'star' },
  { id: 'right-wall', label: '右牆', icon: 'grid' },
  { id: 'back-wall', label: '後牆', icon: 'home' },
  { id: 'counter', label: '櫃台', icon: 'shopping-bag' },
  { id: 'left-table', label: '左側桌面', icon: 'square' },
  { id: 'right-table', label: '右側桌面', icon: 'square' },
];

export const SHOP_INTERIOR_SLOT_IDS = SHOP_INTERIOR_SLOTS.map(({ id }) => id);
export const SHOP_INTERIOR_AREA_CAPACITY = SHOP_INTERIOR_SLOTS.length;
export const SHOP_INTERIOR_PLACEMENT_IDS: ShopInteriorPlacementId[] = [
  ...SHOP_INTERIOR_SLOT_IDS,
  ...SHOP_INTERIOR_AREAS
    .filter(({ id }) => id !== 'main')
    .flatMap(({ id }) => SHOP_INTERIOR_SLOT_IDS.map((slotId) => `${id}:${slotId}` as ShopInteriorPlacementId)),
];

export function getShopInteriorPlacementId(areaId: ShopInteriorAreaId, slotId: ShopInteriorSlotId): ShopInteriorPlacementId {
  return areaId === 'main' ? slotId : `${areaId}:${slotId}`;
}

export function parseShopInteriorPlacementId(placementId: string): { areaId: ShopInteriorAreaId; slotId: ShopInteriorSlotId } | null {
  if ((SHOP_INTERIOR_SLOT_IDS as readonly string[]).includes(placementId)) {
    return { areaId: 'main', slotId: placementId as ShopInteriorSlotId };
  }
  const [areaId, slotId, ...extra] = placementId.split(':');
  if (
    extra.length === 0
    && SHOP_INTERIOR_AREAS.some(({ id }) => id === areaId && id !== 'main')
    && (SHOP_INTERIOR_SLOT_IDS as readonly string[]).includes(slotId)
  ) {
    return { areaId: areaId as ShopInteriorAreaId, slotId: slotId as ShopInteriorSlotId };
  }
  return null;
}

export function getShopInteriorAreaPlacements(
  placements: Partial<Record<ShopInteriorPlacementId, string>>,
  areaId: ShopInteriorAreaId,
): Partial<Record<ShopInteriorSlotId, string>> {
  const areaPlacements: Partial<Record<ShopInteriorSlotId, string>> = {};
  for (const [placementId, decorationId] of Object.entries(placements)) {
    const parsed = parseShopInteriorPlacementId(placementId);
    if (parsed?.areaId === areaId) areaPlacements[parsed.slotId] = decorationId;
  }
  return areaPlacements;
}

export function getShopInteriorAreaLabel(areaId: ShopInteriorAreaId): string {
  return SHOP_INTERIOR_AREAS.find(({ id }) => id === areaId)?.label ?? '主區';
}

const c = palette.light;

const option = (
  type: string,
  key: string,
  name: string,
  description: string,
  icon: string,
  price: number,
  color: string,
  visual?: string,
  limitedEdition = false,
  itemKind: ShopInteriorDecoration['itemKind'] = 'decoration',
): ShopInteriorDecoration => ({
  id: `${type}-${key}`,
  name,
  description,
  icon,
  price,
  color,
  itemKind,
  visual,
  limitedEdition,
});

const legacyDecorations: Record<MallShopType, ShopInteriorDecoration[]> = {
  general: [
  option('general', 'display-shelf', '糖果色展示架', '把本店的人氣選物整齊展示。', 'grid', 20, c.candyMint),
  option('general', 'warm-lamp', '暖光吊燈', '為店內添上柔和的燈光。', 'sun', 25, c.candyLemon),
  option('general', 'welcome-plant', '迎賓綠植', '放在入口旁的一盆小植物。', 'feather', 15, c.candyMint),
  option('general', 'feature-table', '中央焦點桌', '讓本店主打商品更顯眼。', 'package', 35, c.candyPeach),
  option('general', 'wall-art', '手繪主題畫', '用插畫裝飾空白牆面。', 'image', 30, c.candyLavender),
  option('general', 'welcome-sign', '小店招牌燈', '點亮店內的品牌小招牌。', 'star', 40, c.candyPink),
  ],
  womenswear: [
    option('womenswear', 'clothing-rack', '新品衣架牆', '展示本週新到的服飾。', 'shopping-bag', 30, c.candyPink, 'clothing-rack'),
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
    option('kimono', 'kimono-rack', '和服衣架', '展示花色細緻的和服。', 'shopping-bag', 35, c.candyCoral, 'kimono-display'),
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
  swimwear: [
    option('swimwear', 'swimwear-rack', '繽紛泳衣衣架', '展示各種顏色的連身泳衣與比基尼。', 'shopping-bag', 35, c.candySky, 'clothing-rack'),
    option('swimwear', 'coverup-wardrobe', '沙灘罩衫衣櫃', '收納薄紗罩衫和海邊洋裝。', 'shopping-bag', 40, c.candyPeach, 'clothing-wardrobe'),
    option('swimwear', 'swim-mannequin', '泳裝模特展示台', '把整套度假穿搭展示在入口旁。', 'user', 38, c.candyCoral, 'dress-display'),
    option('swimwear', 'shell-mirror', '貝殼全身鏡', '試穿泳衣後看看完整造型。', 'square', 30, c.candyPink),
    option('swimwear', 'sunhat-display', '遮陽帽與涼鞋架', '把海邊配件搭配好方便挑選。', 'sun', 28, c.candyLemon, 'sculpture-plaza'),
    option('swimwear', 'beach-photo-wall', '海島拍照背景', '用海浪和棕櫚葉佈置打卡角落。', 'image', 45, c.candyMint, 'coral-aquarium'),
  ],
  cosplay: [
    option('cosplay', 'costume-wardrobe', '角色服裝衣櫃', '依角色主題收納服裝和披風。', 'shopping-bag', 42, c.candyLavender, 'clothing-wardrobe'),
    option('cosplay', 'costume-rack', 'Cosplay服裝衣架', '展示不同作品的角色服裝。', 'shopping-bag', 38, c.candyPink, 'clothing-rack'),
    option('cosplay', 'wig-wall', '假髮造型展示牆', '展示長短髮型和角色色彩。', 'user', 35, c.candyCoral, 'gallery-frames'),
    option('cosplay', 'prop-showcase', '角色道具展示櫃', '陳列手杖、徽章和收藏道具。', 'star', 40, c.candySky, 'gallery-frames'),
    option('cosplay', 'stage-fitting-room', '舞台試裝間', '在柔和布幕後整理角色造型。', 'columns', 45, c.candyPeach, 'rainbow-arch'),
    option('cosplay', 'character-photo-set', '角色拍照佈景', '為完成造型的客人準備拍照角落。', 'camera', 48, c.candyLavender, 'rhythm-stage'),
  ],
  electronics: [
    option('electronics', 'gadget-shelf', '糖果色科技展示架', '陳列耳機、相機和日常小電器。', 'grid', 38, c.candySky, 'spice-display'),
    option('electronics', 'headphone-stand', '耳機試聽展示台', '讓客人試聽不同款式的耳機。', 'headphones', 35, c.candyLavender, 'gallery-frames'),
    option('electronics', 'smart-home-counter', '智慧家電體驗桌', '展示方便生活的小型智慧家電。', 'cpu', 45, c.candyMint, 'tasting-court'),
    option('electronics', 'camera-display', '相機收藏展示櫃', '把相機和拍攝配件放在透明櫃中。', 'camera', 42, c.candyPeach, 'gallery-frames'),
    option('electronics', 'charging-station', '多色充電體驗站', '整理手機和穿戴裝置的充電配件。', 'zap', 30, c.candyCoral, 'neon-sign'),
    option('electronics', 'screen-demo-wall', '大螢幕體驗牆', '展示影音和居家娛樂設備。', 'monitor', 50, c.candySky, 'gallery-frames'),
  ],
  boutique: [
    option('boutique', 'handbag-display', '精品手袋展示櫃', '用柔光陳列手袋和小皮件。', 'shopping-bag', 45, c.candyPeach, 'gallery-frames'),
    option('boutique', 'jewelry-case', '珠寶玻璃展示櫃', '展示首飾、腕錶和精緻配件。', 'gift', 48, c.candyLemon, 'starlight-mobile'),
    option('boutique', 'silk-scarf-rack', '絲巾與披肩衣架', '把絲巾依色彩和花紋排列。', 'shopping-bag', 35, c.candyPink, 'clothing-rack'),
    option('boutique', 'luxury-mannequin', '精品穿搭模特台', '搭配展示手袋和當季造型。', 'user', 42, c.candyLavender, 'dress-display'),
    option('boutique', 'watch-pedestal', '腕錶收藏展示台', '讓腕錶在小型展示台上閃耀。', 'clock', 40, c.candySky, 'sculpture-plaza'),
    option('boutique', 'boutique-lounge', '香檳色精品休息椅', '讓客人舒適地慢慢挑選。', 'heart', 32, c.candyCoral, 'wooden-bench'),
  ],
  cosmetics: [
    option('cosmetics', 'vanity-mirror', '暖光化妝鏡台', '在柔和燈光下試看不同妝容。', 'sun', 38, c.candyPink, 'gallery-frames'),
    option('cosmetics', 'lip-color-rack', '唇彩旋轉展示架', '按色系陳列唇膏、唇釉與護唇膏。', 'droplet', 34, c.candyRose, 'sculpture-plaza'),
    option('cosmetics', 'eye-palette-shelf', '眼影色盤展示櫃', '展示大地色、莓果色與星光色眼影。', 'grid', 40, c.candyLavender, 'spice-display'),
    option('cosmetics', 'brush-organizer', '彩妝刷具收納架', '整理粉底刷、腮紅刷和眼影刷。', 'edit-2', 29, c.candyPeach, 'craft-station'),
    option('cosmetics', 'tester-counter', '試妝體驗桌', '提供試色卡與整潔的試妝空間。', 'heart', 42, c.candyMint, 'tasting-court'),
    option('cosmetics', 'nail-color-wall', '糖果色指甲油牆', '把不同色調的指甲油排成彩虹。', 'droplet', 33, c.candyCoral, 'gallery-frames'),
  ],
};

interface DecorationSeed {
  key: string;
  name: string;
  description: string;
  icon: string;
  price: number;
  color: string;
  visual?: string;
  limitedEdition?: boolean;
}

interface DecorationFixture {
  key: string;
  name: string;
  description: string;
  icon: string;
  price: number;
  visual: string;
}

interface FinishStyle {
  key: string;
  name: string;
  description: string;
  color: string;
  priceExtra: number;
}

const generalFixtures: DecorationFixture[] = [
  { key: 'curved-showcase', name: '曲面玻璃展示櫃', description: '玻璃櫃中可陳列店內精選小物。', icon: 'grid', price: 30, visual: 'gallery-frames' },
  { key: 'cloud-lamp', name: '雲朵吊燈', description: '為店內帶來柔和而明亮的光線。', icon: 'sun', price: 28, visual: 'garden-lights' },
  { key: 'rest-bench', name: '雙人休息長椅', description: '讓逛店的客人稍作休息。', icon: 'heart', price: 25, visual: 'wooden-bench' },
  { key: 'picture-wall', name: '手繪商品畫框組', description: '用一組小畫框裝飾店內牆面。', icon: 'image', price: 24, visual: 'gallery-frames' },
  { key: 'mini-fountain', name: '迷你迎賓噴泉', description: '在角落放一座輕巧的小噴泉。', icon: 'droplet', price: 45, visual: 'central-fountain' },
  { key: 'soft-rug', name: '棉花糖拼色地毯', description: '為店內地面添上柔軟色塊。', icon: 'square', price: 22, visual: 'cloud-walk' },
  { key: 'star-mobile', name: '星星彩球吊飾', description: '讓小星星在天花板下輕輕搖曳。', icon: 'star', price: 32, visual: 'starlight-mobile' },
  { key: 'glass-vase', name: '琉璃花瓶', description: '把一束小花放在展示區旁。', icon: 'feather', price: 20, visual: 'colorful-planter' },
  { key: 'music-box', name: '旋律音樂盒', description: '為店內角落添上可愛的裝飾。', icon: 'music', price: 35, visual: 'rhythm-stage' },
  { key: 'gift-carousel', name: '旋轉禮品展示台', description: '讓人氣禮物在中央位置更醒目。', icon: 'gift', price: 34, visual: 'sculpture-plaza' },
  { key: 'rainbow-entry', name: '彩虹迎賓拱門', description: '用柔和彩色拱門點亮入口。', icon: 'sunrise', price: 48, visual: 'rainbow-arch' },
];

const shopFixtures: Record<Exclude<MallShopType, 'general'>, DecorationFixture[]> = {
  womenswear: [
    { key: 'tops-wardrobe', name: '上衣與外套衣櫃', description: '掛放襯衫、針織上衣和短外套。', icon: 'shopping-bag', price: 38, visual: 'clothing-wardrobe' },
    { key: 'skirts-wardrobe', name: '裙裝衣櫃', description: '收納百褶裙、短裙和飄逸長裙。', icon: 'shopping-bag', price: 40, visual: 'clothing-wardrobe' },
    { key: 'blouse-mannequin', name: '襯衫模特展示台', description: '展示領口與袖口細節的上衣。', icon: 'user', price: 34, visual: 'blouse-display' },
    { key: 'pleated-skirt-rack', name: '百褶裙旋轉衣架', description: '讓不同長度的裙款一目了然。', icon: 'shopping-bag', price: 35, visual: 'skirt-display' },
    { key: 'dress-rack', name: '連身洋裝衣架', description: '陳列適合日常和約會的洋裝。', icon: 'shopping-bag', price: 36, visual: 'dress-display' },
    { key: 'cardigan-wall', name: '針織外套展示牆', description: '把柔軟開襟衫按顏色排好。', icon: 'grid', price: 33, visual: 'clothing-rack' },
    { key: 'denim-skirt-case', name: '丹寧裙款陳列櫃', description: '展示俐落的丹寧短裙與長裙。', icon: 'layers', price: 35, visual: 'skirt-display' },
    { key: 'accessory-stand', name: '配件穿搭展示架', description: '把包包、帽子和首飾搭配展示。', icon: 'gift', price: 30, visual: 'sculpture-plaza' },
    { key: 'shoe-wall', name: '鞋款穿搭牆', description: '依穿搭風格展示當季鞋款。', icon: 'grid', price: 32, visual: 'gallery-frames' },
    { key: 'seasonal-look', name: '當季造型模特台', description: '展示整套搭配好的季節造型。', icon: 'user', price: 42, visual: 'dress-display' },
  ],
  bridal: [
    { key: 'bridal-gown-rack', name: '婚紗長裙展示架', description: '展示不同裙襬與蕾絲細節。', icon: 'shopping-bag', price: 45, visual: 'dress-display' },
    { key: 'veil-wardrobe', name: '頭紗珍藏衣櫃', description: '收納長頭紗、短頭紗和髮飾。', icon: 'shopping-bag', price: 42, visual: 'clothing-wardrobe' },
    { key: 'bridal-mannequin', name: '新娘禮服模特台', description: '讓主打禮服成為店內焦點。', icon: 'user', price: 46, visual: 'dress-display' },
    { key: 'lace-display', name: '蕾絲面料展示牆', description: '展示婚紗的蕾絲與刺繡樣本。', icon: 'image', price: 35, visual: 'gallery-frames' },
    { key: 'pearl-accessory-case', name: '珍珠飾品玻璃櫃', description: '陳列頭飾、項鍊和耳環。', icon: 'gift', price: 38, visual: 'gallery-frames' },
    { key: 'bridal-shoe-podium', name: '新娘鞋展示台', description: '把婚鞋放在柔光小平台上。', icon: 'star', price: 32, visual: 'sculpture-plaza' },
    { key: 'flower-photo-wall', name: '花藝拍照牆', description: '用柔粉花朵打造合照角落。', icon: 'feather', price: 40, visual: 'colorful-planter' },
    { key: 'ring-presentation', name: '戒指禮盒展示台', description: '展示婚禮配件與紀念小物。', icon: 'gift', price: 34, visual: 'sculpture-plaza' },
    { key: 'bridal-fitting-room', name: '新娘試衣間衣櫃', description: '為試穿禮服準備隱密空間。', icon: 'columns', price: 48, visual: 'clothing-wardrobe' },
    { key: 'bridal-consultation', name: '婚禮相談桌', description: '讓挑選禮服時可以坐下慢慢聊。', icon: 'heart', price: 36, visual: 'tasting-court' },
  ],
  eveningwear: [
    { key: 'evening-gown-rack', name: '晚宴長裙衣架', description: '陳列剪裁優雅的晚宴禮服。', icon: 'shopping-bag', price: 42, visual: 'dress-display' },
    { key: 'velvet-wardrobe', name: '絲絨禮服衣櫃', description: '收納絲絨長裙與亮片洋裝。', icon: 'shopping-bag', price: 46, visual: 'clothing-wardrobe' },
    { key: 'tuxedo-display', name: '典禮西裝模特台', description: '搭配展示正式西裝與晚宴造型。', icon: 'user', price: 40, visual: 'blouse-display' },
    { key: 'clutch-case', name: '晚宴手拿包展示櫃', description: '把手拿包和小型晚宴包陳列整齊。', icon: 'gift', price: 34, visual: 'gallery-frames' },
    { key: 'jewelry-light', name: '珠寶柔光展示台', description: '讓首飾在聚光燈下閃耀。', icon: 'star', price: 38, visual: 'starlight-mobile' },
    { key: 'formal-shoe-wall', name: '正式鞋款展示牆', description: '展示適合舞會和宴會的鞋款。', icon: 'grid', price: 32, visual: 'gallery-frames' },
    { key: 'velvet-curtain', name: '莓果絲絨試衣幕', description: '為試穿區加上柔軟布幕。', icon: 'columns', price: 36, visual: 'rainbow-arch' },
    { key: 'spotlight-mannequin', name: '伸展台模特聚光燈', description: '照亮本季主打禮服。', icon: 'sun', price: 40, visual: 'garden-lights' },
    { key: 'bowtie-display', name: '領結與披肩收納架', description: '把晚宴配件按色系收納。', icon: 'grid', price: 30, visual: 'clothing-rack' },
    { key: 'runway-podium', name: '迷你禮服伸展台', description: '讓新款禮服有專屬展示位置。', icon: 'activity', price: 44, visual: 'rhythm-stage' },
  ],
  kimono: [
    { key: 'kimono-wardrobe', name: '和服珍藏衣櫃', description: '收納振袖、小紋和浴衣。', icon: 'shopping-bag', price: 44, visual: 'kimono-display' },
    { key: 'furisode-display', name: '振袖模特展示台', description: '展示長袖振袖與腰帶搭配。', icon: 'user', price: 46, visual: 'kimono-display' },
    { key: 'yukata-rack', name: '浴衣與腰帶衣架', description: '陳列浴衣、腰帶和夏日配件。', icon: 'shopping-bag', price: 38, visual: 'kimono-display' },
    { key: 'obi-case', name: '和風腰帶展示櫃', description: '展示織紋細緻的腰帶。', icon: 'grid', price: 34, visual: 'gallery-frames' },
    { key: 'kimono-fabric-wall', name: '和服布樣展示牆', description: '把花色布樣排列成一面小牆。', icon: 'image', price: 36, visual: 'gallery-frames' },
    { key: 'geta-display', name: '木屐與手袋展示台', description: '將木屐、手袋和髮簪搭配展示。', icon: 'gift', price: 31, visual: 'sculpture-plaza' },
    { key: 'sakura-kimono-stand', name: '櫻花小紋衣架', description: '展示粉色花紋的小紋和服。', icon: 'shopping-bag', price: 37, visual: 'kimono-display' },
    { key: 'shibori-display', name: '絞染浴衣衣櫃', description: '把藍染與絞染浴衣分層收納。', icon: 'shopping-bag', price: 40, visual: 'kimono-display' },
    { key: 'hairpin-showcase', name: '和風髮簪玻璃櫃', description: '陳列髮簪、梳子與小花飾。', icon: 'star', price: 30, visual: 'gallery-frames' },
    { key: 'tatami-fitting', name: '榻榻米試穿角', description: '留一處整理衣袖和腰帶的空間。', icon: 'square', price: 42, visual: 'yoga-deck' },
  ],
  supermarket: [
    { key: 'produce-island', name: '鮮蔬水果展示島', description: '把當季蔬果排成繽紛小島。', icon: 'grid', price: 38, visual: 'colorful-planter' },
    { key: 'grocery-shelf', name: '日用品補貨貨架', description: '陳列每天都用得到的生活用品。', icon: 'package', price: 35, visual: 'spice-display' },
    { key: 'chilled-drinks', name: '玻璃冷藏飲品櫃', description: '展示果汁、牛奶和冰涼飲品。', icon: 'droplet', price: 46, visual: 'coral-aquarium' },
    { key: 'bakery-case', name: '新鮮麵包展示櫃', description: '把剛出爐的麵包排在透明櫃中。', icon: 'shopping-bag', price: 39, visual: 'tasting-court' },
    { key: 'checkout-counter', name: '迷你結帳櫃台', description: '為店內安排一個小小結帳區。', icon: 'credit-card', price: 43, visual: 'tasting-court' },
    { key: 'basket-stand', name: '購物籃收納架', description: '在入口放好方便拿取的購物籃。', icon: 'shopping-bag', price: 25, visual: 'wooden-bench' },
    { key: 'flower-bucket', name: '鮮花水桶展示區', description: '在蔬果區旁陳列一束束鮮花。', icon: 'feather', price: 29, visual: 'colorful-planter' },
    { key: 'seasonal-goods', name: '季節商品端架', description: '把當季人氣商品放在走道前端。', icon: 'star', price: 33, visual: 'spice-display' },
    { key: 'frozen-dessert', name: '冰品甜點冷凍櫃', description: '展示冰淇淋和各種冷凍甜點。', icon: 'droplet', price: 45, visual: 'coral-aquarium' },
    { key: 'aisle-signage', name: '彩色分類指示牌', description: '讓客人快速找到想逛的商品區。', icon: 'map-pin', price: 24, visual: 'neon-sign' },
  ],
  hyakuen: [
    { key: 'organizer-wall', name: '生活收納小物牆', description: '整齊展示盒子、掛勾和收納用品。', icon: 'grid', price: 32, visual: 'spice-display' },
    { key: 'stationery-rack', name: '文具與手帳展示架', description: '陳列筆記本、貼紙和各式文具。', icon: 'edit-3', price: 28, visual: 'gallery-frames' },
    { key: 'seasonal-table', name: '季節選物展示桌', description: '用小桌展示每季的實用好物。', icon: 'package', price: 34, visual: 'tasting-court' },
    { key: 'basket-stack', name: '迷你購物籃收納架', description: '方便客人進店後拿取購物籃。', icon: 'shopping-bag', price: 22, visual: 'wooden-bench' },
    { key: 'gift-wrap', name: '手作禮物包裝角', description: '準備緞帶、紙袋和包裝小物。', icon: 'gift', price: 36, visual: 'sculpture-plaza' },
    { key: 'kitchen-tools', name: '廚房用品陳列牆', description: '展示杯子、餐具和小型廚房用品。', icon: 'grid', price: 31, visual: 'spice-display' },
    { key: 'bathroom-shelf', name: '浴室小物展示櫃', description: '把清潔和收納小物分類陳列。', icon: 'droplet', price: 30, visual: 'gallery-frames' },
    { key: 'craft-corner', name: '手作材料整理架', description: '放好緞帶、貼紙和手作材料。', icon: 'feather', price: 33, visual: 'spice-display' },
    { key: 'toy-basket', name: '迷你玩具展示籃', description: '展示小玩具、吊飾和趣味選物。', icon: 'gift', price: 25, visual: 'sculpture-plaza' },
    { key: 'price-board', name: '百元好物價目燈牌', description: '為店內加上一塊明亮的商品指示牌。', icon: 'tag', price: 27, visual: 'neon-sign' },
  ],
  swimwear: [
    { key: 'swim-suit-wardrobe', name: '泳衣上衣衣櫃', description: '按顏色收納泳衣上衣、防曬上衣和罩衫。', icon: 'shopping-bag', price: 38, visual: 'clothing-wardrobe' },
    { key: 'bikini-rack', name: '比基尼上衣與泳褲衣櫃', description: '展示不同剪裁的泳衣上衣和泳褲。', icon: 'shopping-bag', price: 36, visual: 'clothing-wardrobe' },
    { key: 'rash-guard-wall', name: '防曬上衣展示牆', description: '陳列輕薄防曬上衣和水母衣。', icon: 'grid', price: 33, visual: 'clothing-rack' },
    { key: 'beach-dress-display', name: '泳裝裙裝衣櫃', description: '收納沙灘裙、泳裝裙和度假洋裝。', icon: 'shopping-bag', price: 38, visual: 'clothing-wardrobe' },
    { key: 'swim-short-shelf', name: '泳褲與沙灘短褲架', description: '把不同長度的泳褲整齊展示。', icon: 'shopping-bag', price: 30, visual: 'clothing-rack' },
    { key: 'sunscreen-counter', name: '防曬用品小櫃台', description: '收納防曬乳、護唇膏和海邊用品。', icon: 'sun', price: 29, visual: 'spice-display' },
    { key: 'beach-towel-rack', name: '海灘毛巾掛架', description: '把柔軟的大浴巾掛在入口旁。', icon: 'grid', price: 26, visual: 'clothing-rack' },
    { key: 'float-ring-display', name: '彩色泳圈展示架', description: '展示適合戲水的繽紛泳圈。', icon: 'circle', price: 34, visual: 'coral-aquarium' },
    { key: 'sandals-shelf', name: '沙灘涼鞋展示台', description: '陳列舒適的涼鞋和水鞋。', icon: 'grid', price: 28, visual: 'sculpture-plaza' },
    { key: 'shell-accessory-case', name: '貝殼泳裝配件櫃', description: '展示髮夾、太陽眼鏡和海洋飾品。', icon: 'gift', price: 35, visual: 'gallery-frames' },
  ],
  cosplay: [
    { key: 'hero-costume-wardrobe', name: '角色上衣與外套衣櫃', description: '收納角色制服上衣、外套和忍者服。', icon: 'shopping-bag', price: 44, visual: 'clothing-wardrobe' },
    { key: 'fantasy-costume-rack', name: '角色裙裝與連身服衣櫃', description: '展示不同角色的裙裝、連身服和舞台服。', icon: 'shopping-bag', price: 40, visual: 'clothing-wardrobe' },
    { key: 'wig-style-wall', name: '角色假髮造型牆', description: '按長度和顏色展示造型假髮。', icon: 'user', price: 35, visual: 'gallery-frames' },
    { key: 'cape-display', name: '披風旋轉展示架', description: '讓不同角色的披風展開展示。', icon: 'shopping-bag', price: 37, visual: 'clothing-rack' },
    { key: 'armor-mannequin', name: '盔甲角色模特台', description: '展示奇幻風格的服裝與護甲。', icon: 'user', price: 46, visual: 'dress-display' },
    { key: 'prop-glass-case', name: '舞台道具玻璃櫃', description: '收藏手杖、徽章與角色小道具。', icon: 'star', price: 39, visual: 'gallery-frames' },
    { key: 'mask-display', name: '角色面具展示牆', description: '陳列不同作品的面具和頭飾。', icon: 'eye', price: 34, visual: 'gallery-frames' },
    { key: 'cosplay-lighting', name: '角色聚光燈組', description: '為主打服裝加上舞台般的柔光。', icon: 'sun', price: 36, visual: 'garden-lights' },
    { key: 'photo-backdrop', name: '幻想世界拍照背景', description: '用星光與彩色布景佈置拍照區。', icon: 'camera', price: 42, visual: 'rainbow-arch' },
    { key: 'badge-accessory-board', name: '徽章與配件展示板', description: '把徽章、髮飾和角色小物分類展示。', icon: 'star', price: 32, visual: 'starlight-mobile' },
  ],
  electronics: [
    { key: 'phone-display-wall', name: '手機與平板展示牆', description: '展示不同尺寸的手機和平板。', icon: 'smartphone', price: 42, visual: 'gallery-frames' },
    { key: 'headphone-listening-stand', name: '耳機試聽展示台', description: '陳列耳罩式耳機和無線耳機。', icon: 'headphones', price: 36, visual: 'starlight-mobile' },
    { key: 'camera-demo-counter', name: '相機體驗展示桌', description: '展示相機、鏡頭和拍攝配件。', icon: 'camera', price: 40, visual: 'tasting-court' },
    { key: 'smart-home-shelf', name: '智慧家電展示架', description: '陳列方便日常生活的小型家電。', icon: 'cpu', price: 39, visual: 'spice-display' },
    { key: 'speaker-stage', name: '藍牙喇叭體驗台', description: '把不同造型的喇叭放上展示台。', icon: 'music', price: 35, visual: 'rhythm-stage' },
    { key: 'kitchen-appliance-shelf', name: '廚房小家電層架', description: '展示烤麵包機、熱水壺和攪拌機。', icon: 'grid', price: 44, visual: 'spice-display' },
    { key: 'gaming-gear-wall', name: '電競配件展示牆', description: '陳列鍵盤、滑鼠和遊戲控制器。', icon: 'monitor', price: 43, visual: 'neon-sign' },
    { key: 'charging-dock-counter', name: '充電配件體驗櫃', description: '展示充電座、線材和行動電源。', icon: 'zap', price: 31, visual: 'gallery-frames' },
    { key: 'television-demo-wall', name: '影音螢幕展示牆', description: '讓電視和投影設備成為店內焦點。', icon: 'monitor', price: 48, visual: 'gallery-frames' },
    { key: 'robot-vacuum-display', name: '智能清潔家電展示台', description: '展示掃地機械人和居家清潔設備。', icon: 'settings', price: 45, visual: 'sculpture-plaza' },
  ],
  boutique: [
    { key: 'designer-bag-wardrobe', name: '設計師手袋收藏櫃', description: '依大小和款式展示精緻手袋。', icon: 'shopping-bag', price: 46, visual: 'gallery-frames' },
    { key: 'jewelry-light-case', name: '珠寶柔光展示櫃', description: '讓項鍊、耳環和戒指閃閃發亮。', icon: 'gift', price: 44, visual: 'starlight-mobile' },
    { key: 'silk-scarf-wardrobe', name: '真絲圍巾衣櫃', description: '收納花色不同的絲巾和披肩。', icon: 'shopping-bag', price: 38, visual: 'clothing-wardrobe' },
    { key: 'watch-collection-shelf', name: '腕錶收藏展示架', description: '為每款腕錶安排專屬展示位置。', icon: 'clock', price: 40, visual: 'gallery-frames' },
    { key: 'designer-shoe-podium', name: '精品鞋履展示台', description: '展示精緻鞋履和限定配色。', icon: 'star', price: 39, visual: 'sculpture-plaza' },
    { key: 'leather-goods-wall', name: '皮件與卡夾展示牆', description: '陳列皮夾、卡套和小型皮件。', icon: 'grid', price: 34, visual: 'gallery-frames' },
    { key: 'perfume-glass-case', name: '香水收藏玻璃櫃', description: '展示香水瓶和香氛禮盒。', icon: 'droplet', price: 36, visual: 'shell-lantern' },
    { key: 'luxury-mannequin-stand', name: '精品造型模特台', description: '展示搭配手袋與首飾的完整造型。', icon: 'user', price: 44, visual: 'dress-display' },
    { key: 'gift-box-table', name: '精品禮盒陳列桌', description: '擺放緞帶禮盒和收藏小物。', icon: 'gift', price: 32, visual: 'tasting-court' },
    { key: 'velvet-lounge-chair', name: '天鵝絨貴賓座椅', description: '為挑選精品的客人準備舒適座位。', icon: 'heart', price: 35, visual: 'wooden-bench' },
  ],
  cosmetics: [
    { key: 'compact-powder-case', name: '氣墊粉餅珍藏展示櫃', description: '展示不同色號的氣墊粉餅和蜜粉餅。', icon: 'circle', price: 38, visual: 'jewelry-case' },
    { key: 'lipstick-carousel', name: '唇膏試色旋轉台', description: '讓客人比較唇膏、唇釉與唇蜜色號。', icon: 'droplet', price: 36, visual: 'sculpture-plaza' },
    { key: 'eyeshadow-palette-wall', name: '九色眼影盤展示牆', description: '分格陳列日常、派對和限定眼影盤。', icon: 'grid', price: 40, visual: 'gallery-frames' },
    { key: 'makeup-brush-rack', name: '彩妝刷具玻璃收納架', description: '展示粉底刷、蜜粉刷和細節眼影刷。', icon: 'edit-2', price: 32, visual: 'craft-station' },
    { key: 'beauty-tester-island', name: '夢幻試妝色彩島', description: '集中擺放試色品、棉花棒與試妝卡。', icon: 'sun', price: 42, visual: 'tasting-court' },
    { key: 'nail-polish-shelf', name: '迷你指甲油彩虹層架', description: '按色系排列不同光澤的指甲油。', icon: 'droplet', price: 34, visual: 'spice-display' },
    { key: 'skincare-bottle-window', name: '保養精華櫥窗', description: '陳列化妝水、精華液與保濕乳霜。', icon: 'heart', price: 36, visual: 'jewelry-case' },
    { key: 'shade-card-wall', name: '粉底色號比對牆', description: '以色卡協助挑選合適的粉底色號。', icon: 'image', price: 30, visual: 'gallery-frames' },
    { key: 'blush-display-podium', name: '花瓣腮紅展示台', description: '讓腮紅盤與打亮餅成為店內焦點。', icon: 'sun', price: 35, visual: 'sculpture-plaza' },
    { key: 'beauty-lounge-seat', name: '奶油雲朵試妝座', description: '留一張柔軟座位，慢慢試出喜歡的妝容。', icon: 'heart', price: 33, visual: 'wooden-bench' },
  ],
};

const finishes: Record<MallShopType, FinishStyle[]> = {
  general: [
    { key: 'cream', name: '奶油白', description: '奶油白與香檳金', color: c.candyCream, priceExtra: 0 },
    { key: 'cherry', name: '櫻桃粉', description: '櫻桃粉與珍珠白', color: c.candyPink, priceExtra: 4 },
    { key: 'mint', name: '薄荷糖', description: '薄荷綠與柔和奶油色', color: c.candyMint, priceExtra: 6 },
    { key: 'lavender', name: '星光紫', description: '薰衣草紫與銀白', color: c.candyLavender, priceExtra: 8 },
  ],
  womenswear: [
    { key: 'sakura', name: '櫻花粉', description: '櫻花粉與珍珠白', color: c.candyPink, priceExtra: 5 },
    { key: 'pearl', name: '珍珠奶油', description: '奶油白與香檳金', color: c.candyCream, priceExtra: 7 },
    { key: 'mint', name: '薄荷夢', description: '薄荷綠與柔粉色', color: c.candyMint, priceExtra: 3 },
    { key: 'violet', name: '月光紫', description: '月光紫與銀白', color: c.candyLavender, priceExtra: 9 },
  ],
  bridal: [
    { key: 'rose', name: '玫瑰奶霜', description: '柔粉色與珍珠白', color: c.candyPink, priceExtra: 9 },
    { key: 'champagne', name: '香檳金', description: '奶油金與象牙白', color: c.candyLemon, priceExtra: 12 },
    { key: 'sky', name: '晨光藍', description: '天空藍與柔白', color: c.candySky, priceExtra: 7 },
    { key: 'lilac', name: '紫藤蕾絲', description: '薰衣草紫與銀白', color: c.candyLavender, priceExtra: 11 },
  ],
  eveningwear: [
    { key: 'berry', name: '莓果紅', description: '莓果色與柔金色', color: c.candyRose, priceExtra: 11 },
    { key: 'starlight', name: '星河紫', description: '深紫色與星光金', color: c.candyLavender, priceExtra: 14 },
    { key: 'rose-gold', name: '玫瑰香檳', description: '玫瑰粉與香檳金', color: c.candyCoral, priceExtra: 12 },
    { key: 'midnight', name: '午夜藍', description: '夜空藍與珍珠白', color: c.candySky, priceExtra: 10 },
  ],
  kimono: [
    { key: 'sakura', name: '櫻花染', description: '櫻花粉與米白', color: c.candyPink, priceExtra: 7 },
    { key: 'indigo', name: '靛藍染', description: '靛藍與柔白', color: c.candySky, priceExtra: 8 },
    { key: 'wisteria', name: '紫藤染', description: '薰衣草紫與淡金', color: c.candyLavender, priceExtra: 10 },
    { key: 'momiji', name: '紅葉染', description: '珊瑚紅與奶油色', color: c.candyCoral, priceExtra: 9 },
  ],
  supermarket: [
    { key: 'mint', name: '清新薄荷', description: '薄荷綠與乾淨白色', color: c.candyMint, priceExtra: 5 },
    { key: 'sky', name: '晴空藍', description: '晴空藍與清爽白色', color: c.candySky, priceExtra: 4 },
    { key: 'lemon', name: '檸檬黃', description: '檸檬黃與奶油白', color: c.candyLemon, priceExtra: 3 },
    { key: 'tomato', name: '番茄珊瑚', description: '珊瑚紅與薄荷綠', color: c.candyCoral, priceExtra: 6 },
  ],
  hyakuen: [
    { key: 'soda', name: '汽水薄荷', description: '薄荷綠與清爽白色', color: c.candyMint, priceExtra: 3 },
    { key: 'peach', name: '蜜桃奶油', description: '蜜桃粉與奶油白', color: c.candyPeach, priceExtra: 5 },
    { key: 'sky', name: '天空藍', description: '天空藍與柔和白色', color: c.candySky, priceExtra: 4 },
    { key: 'lemon', name: '檸檬汽水', description: '檸檬黃與薄荷綠', color: c.candyLemon, priceExtra: 6 },
  ],
  swimwear: [
    { key: 'lagoon', name: '潟湖藍', description: '清透海藍與珍珠白', color: c.candySky, priceExtra: 6 },
    { key: 'coral', name: '珊瑚粉', description: '珊瑚粉與暖沙色', color: c.candyCoral, priceExtra: 5 },
    { key: 'palm', name: '棕櫚薄荷', description: '棕櫚綠與奶油白', color: c.candyMint, priceExtra: 4 },
    { key: 'sunset', name: '日落蜜桃', description: '日落橘粉與柔金色', color: c.candyPeach, priceExtra: 8 },
  ],
  cosplay: [
    { key: 'stardust', name: '星塵紫', description: '星光紫與柔和銀白', color: c.candyLavender, priceExtra: 9 },
    { key: 'hero-red', name: '英雄莓紅', description: '莓紅色與亮金點綴', color: c.candyRose, priceExtra: 8 },
    { key: 'magic-blue', name: '魔法晴藍', description: '晴空藍與珍珠白', color: c.candySky, priceExtra: 6 },
    { key: 'fairy-pink', name: '精靈櫻粉', description: '櫻花粉與薄荷綠', color: c.candyPink, priceExtra: 7 },
  ],
  electronics: [
    { key: 'pixel-mint', name: '像素薄荷', description: '薄荷綠與清爽白色', color: c.candyMint, priceExtra: 5 },
    { key: 'glacier-blue', name: '冰晶藍', description: '冰藍色與銀白細節', color: c.candySky, priceExtra: 8 },
    { key: 'peach-tech', name: '蜜桃科技', description: '柔和蜜桃色與奶油白', color: c.candyPeach, priceExtra: 6 },
    { key: 'lavender-tech', name: '薰衣草科技', description: '薰衣草紫與星光銀', color: c.candyLavender, priceExtra: 10 },
  ],
  boutique: [
    { key: 'champagne-gold', name: '香檳金', description: '香檳金與珍珠白', color: c.candyLemon, priceExtra: 12 },
    { key: 'rose-quartz', name: '玫瑰晶石', description: '玫瑰粉與柔金色', color: c.candyPink, priceExtra: 10 },
    { key: 'lilac-silk', name: '紫藤絲緞', description: '紫藤紫與銀白光澤', color: c.candyLavender, priceExtra: 11 },
    { key: 'ocean-pearl', name: '海洋珍珠', description: '海水藍與珍珠奶油色', color: c.candySky, priceExtra: 9 },
  ],
  cosmetics: [
    { key: 'rose-petal', name: '玫瑰花瓣', description: '柔粉與奶油白的花瓣妝台', color: c.candyPink, priceExtra: 5 },
    { key: 'berry-glaze', name: '莓果糖霜', description: '莓果紅與亮面香檳色', color: c.candyRose, priceExtra: 8 },
    { key: 'mint-glow', name: '薄荷柔光', description: '薄荷綠與珍珠白', color: c.candyMint, priceExtra: 6 },
    { key: 'starlight-lilac', name: '星光丁香', description: '淡紫與星點銀光', color: c.candyLavender, priceExtra: 9 },
  ],
};

const signatureDecorations: Partial<Record<MallShopType, DecorationSeed[]>> = {
  womenswear: [
    { key: 'ribbon-top-wardrobe', name: '蝴蝶結上衣衣櫃', description: '收納荷葉領上衣、襯衫和針織衫。', icon: 'shopping-bag', price: 58, color: c.candyPink, visual: 'clothing-wardrobe' },
    { key: 'pleated-skirt-closet', name: '百褶裙與長裙衣櫃', description: '展示不同長度和布料的裙裝。', icon: 'shopping-bag', price: 60, color: c.candyLavender, visual: 'clothing-wardrobe' },
    { key: 'limited-starlight-top', name: '限定款・星夜蝴蝶結上衣', description: '只在本店收藏中登場的星光限定上衣。', icon: 'shopping-bag', price: 82, color: c.candyLavender, visual: 'blouse-display', limitedEdition: true },
    { key: 'limited-moonlight-skirt', name: '限定款・月光絲絨長裙', description: '以月光色布料呈現的限定裙款。', icon: 'shopping-bag', price: 86, color: c.candySky, visual: 'skirt-display', limitedEdition: true },
  ],
  bridal: [
    { key: 'limited-pearl-gown', name: '限定款・珍珠晨曦婚紗', description: '以珍珠白蕾絲點綴的限定婚紗。', icon: 'shopping-bag', price: 90, color: c.candyCream, visual: 'dress-display', limitedEdition: true },
    { key: 'limited-rose-veil', name: '限定款・玫瑰星紗頭紗', description: '閃著柔粉光澤的收藏版頭紗。', icon: 'shopping-bag', price: 82, color: c.candyPink, visual: 'clothing-wardrobe', limitedEdition: true },
    { key: 'bridal-gold-mannequin', name: '香檳金禮服模特台', description: '為香檳色婚紗搭配專屬展示台。', icon: 'user', price: 56, color: c.candyLemon, visual: 'dress-display' },
    { key: 'bridal-flower-arch', name: '白紗花拱門', description: '以柔粉和象牙白花朵迎接客人。', icon: 'sunrise', price: 54, color: c.candyPeach, visual: 'rainbow-arch' },
  ],
  eveningwear: [
    { key: 'limited-galaxy-gown', name: '限定款・銀河舞會禮服', description: '以星河亮片呈現的限定舞會禮服。', icon: 'shopping-bag', price: 88, color: c.candyLavender, visual: 'dress-display', limitedEdition: true },
    { key: 'limited-rose-cape', name: '限定款・玫瑰金晚宴披肩', description: '為晚宴造型增添柔亮光澤的收藏款。', icon: 'shopping-bag', price: 80, color: c.candyCoral, visual: 'clothing-rack', limitedEdition: true },
    { key: 'midnight-tuxedo', name: '午夜藍典禮西裝', description: '展示剪裁俐落的深藍正式服飾。', icon: 'user', price: 57, color: c.candySky, visual: 'blouse-display' },
    { key: 'crystal-clutch', name: '水晶手拿包展示櫃', description: '陳列適合舞會的閃亮小包。', icon: 'gift', price: 52, color: c.candyLemon, visual: 'gallery-frames' },
  ],
  kimono: [
    { key: 'limited-sakura-furisode', name: '限定版・櫻花金線振袖', description: '繡有櫻花與金線的特別版振袖。', icon: 'shopping-bag', price: 92, color: c.candyPink, visual: 'kimono-display', limitedEdition: true },
    { key: 'limited-starry-kimono', name: '限定版・星河夜空和服', description: '以星河圖樣設計的收藏版和服。', icon: 'shopping-bag', price: 96, color: c.candyLavender, visual: 'kimono-display', limitedEdition: true },
    { key: 'limited-crane-kimono', name: '限定版・白鶴金箔和服', description: '白鶴與金箔花紋的特別版和服。', icon: 'shopping-bag', price: 98, color: c.candyLemon, visual: 'kimono-display', limitedEdition: true },
    { key: 'limited-summer-yukata', name: '限定版・夏祭燈影浴衣', description: '繪有夏祭燈籠的季節限定浴衣。', icon: 'shopping-bag', price: 84, color: c.candyCoral, visual: 'kimono-display', limitedEdition: true },
  ],
  supermarket: [
    { key: 'seasonal-fruit-box', name: '季節水果禮盒展示台', description: '把當令水果包成繽紛小禮盒。', icon: 'gift', price: 52, color: c.candyCoral, visual: 'colorful-planter' },
    { key: 'limited-sakura-sweets', name: '限定款・櫻花季甜點櫃', description: '陳列櫻花季節限定的甜點與飲品。', icon: 'shopping-bag', price: 64, color: c.candyPink, visual: 'tasting-court', limitedEdition: true },
    { key: 'local-produce-stand', name: '在地農產小攤', description: '用木架展示新鮮在地蔬果。', icon: 'feather', price: 44, color: c.candyMint, visual: 'spice-display' },
    { key: 'bread-sample-table', name: '麵包試吃小桌', description: '為每日新鮮麵包準備試吃位置。', icon: 'package', price: 38, color: c.candyPeach, visual: 'tasting-court' },
  ],
  hyakuen: [
    { key: 'limited-sakura-stationery', name: '限定款・櫻花文具組展示架', description: '陳列櫻花季限定的文具與貼紙。', icon: 'edit-3', price: 58, color: c.candyPink, visual: 'gallery-frames', limitedEdition: true },
    { key: 'limited-seasonal-bento', name: '限定款・季節便當盒牆', description: '展示季節花色的收納與便當盒。', icon: 'package', price: 62, color: c.candyMint, visual: 'spice-display', limitedEdition: true },
    { key: 'travel-organizer-set', name: '旅行收納袋展示台', description: '把旅行用收納袋分類展示。', icon: 'shopping-bag', price: 42, color: c.candySky, visual: 'gallery-frames' },
    { key: 'craft-gift-shelf', name: '手作小禮物陳列架', description: '展示包裝好的季節小禮物。', icon: 'gift', price: 40, color: c.candyLavender, visual: 'spice-display' },
  ],
  swimwear: [
    { key: 'limited-moonlit-swimsuit', name: '限定款・火影忍者鳴人風格泳衣', description: '以鳴人的橘黑配色和旋渦元素構思的泳裝展示款。', icon: 'shopping-bag', price: 82, color: c.candyCoral, visual: 'dress-display', limitedEdition: true },
    { key: 'limited-sunset-coverup', name: '限定款・火影忍者小櫻花語罩衫', description: '以小櫻的粉色系為靈感設計的沙灘罩衫。', icon: 'shopping-bag', price: 78, color: c.candyPink, visual: 'clothing-rack', limitedEdition: true },
    { key: 'shell-bikini-display', name: '貝殼刺繡比基尼展示台', description: '用貝殼小刺繡點綴的泳裝造型。', icon: 'user', price: 56, color: c.candyPeach, visual: 'dress-display' },
    { key: 'tropical-surf-set', name: '熱帶浪花泳裝套組', description: '展示泳衣、防曬衣和海灘短褲。', icon: 'shopping-bag', price: 60, color: c.candyMint, visual: 'clothing-wardrobe' },
  ],
  cosplay: [
    { key: 'akatsuki-collection-wardrobe', name: '曉成員主題珍藏衣櫃', description: '以紅黑柔彩配色展示曉成員靈感斗篷、假髮與戒指。', icon: 'shopping-bag', price: 96, color: c.candyRose, visual: 'clothing-wardrobe' },
    { key: 'sasuke-character-wardrobe', name: '佐助・深藍忍者服衣櫃', description: '專門展示佐助靈感的高領忍者服與深藍外套。', icon: 'shopping-bag', price: 94, color: c.candySky, visual: 'clothing-wardrobe' },
    { key: 'itachi-character-wardrobe', name: '鼬・暗紅角色服衣櫃', description: '專門展示鼬靈感的暗紅斗篷與角色服裝。', icon: 'shopping-bag', price: 94, color: c.candyRose, visual: 'clothing-wardrobe' },
    { key: 'limited-starlight-magician', name: '限定款・火影忍者鳴人忍者服衣櫃', description: '以鳴人的橘色忍者服和護額元素構思的服裝展示。', icon: 'shopping-bag', price: 88, color: c.candyCoral, visual: 'clothing-wardrobe', limitedEdition: true },
    { key: 'limited-galaxy-armor', name: '限定款・火影忍者佐助服裝展示台', description: '以佐助的深藍配色和忍者服輪廓為靈感。', icon: 'user', price: 92, color: c.candySky, visual: 'dress-display', limitedEdition: true },
    { key: 'fairy-wing-costume', name: '限定款・火影忍者小櫻裙裝衣櫃', description: '以小櫻的粉色造型為靈感設計的裙裝收藏。', icon: 'shopping-bag', price: 64, color: c.candyPink, visual: 'clothing-wardrobe', limitedEdition: true },
    { key: 'hero-cape-collection', name: '限定款・火影忍者卡卡西上衣衣櫃', description: '以卡卡西的忍者上衣和護額元素構思的收藏款。', icon: 'shopping-bag', price: 78, color: c.candyLavender, visual: 'clothing-wardrobe', limitedEdition: true },
  ],
  electronics: [
    { key: 'limited-starlight-projector', name: '限定款・星空迷你投影機', description: '把星河投影帶回家的特別版家電。', icon: 'star', price: 90, color: c.candyLavender, visual: 'gallery-frames', limitedEdition: true },
    { key: 'limited-pearl-headphones', name: '限定款・珍珠白無線耳機', description: '珍珠白與香檳金配色的收藏款耳機。', icon: 'headphones', price: 84, color: c.candyCream, visual: 'starlight-mobile', limitedEdition: true },
    { key: 'smart-speaker-display', name: '薄荷智慧音箱展示台', description: '展示可愛造型的智慧音箱和語音助理。', icon: 'music', price: 62, color: c.candyMint, visual: 'rhythm-stage' },
    { key: 'camera-lens-set', name: '晴空相機鏡頭組', description: '搭配展示相機機身和不同鏡頭。', icon: 'camera', price: 68, color: c.candySky, visual: 'tasting-court' },
  ],
  boutique: [
    { key: 'limited-rose-handbag', name: '限定款・玫瑰金珍藏手袋', description: '玫瑰金配色的限定收藏手袋。', icon: 'shopping-bag', price: 96, color: c.candyPink, visual: 'gallery-frames', limitedEdition: true },
    { key: 'limited-pearl-necklace', name: '限定款・星河珍珠項鍊', description: '以珍珠和星光細節設計的限定首飾。', icon: 'gift', price: 92, color: c.candyLavender, visual: 'starlight-mobile', limitedEdition: true },
    { key: 'silk-scarf-collection', name: '晨光真絲圍巾收藏', description: '展示手繪花色與柔亮絲緞。', icon: 'shopping-bag', price: 68, color: c.candyPeach, visual: 'clothing-rack' },
    { key: 'designer-watch-podium', name: '月光設計腕錶展示台', description: '為精緻腕錶留一座柔光展示台。', icon: 'clock', price: 72, color: c.candySky, visual: 'sculpture-plaza' },
  ],
  cosmetics: [
    { key: 'limited-prism-palette', name: '限定款・虹光九色眼影盤', description: '以彩虹藝術廊為靈感的珍藏眼影色盤。', icon: 'grid', price: 90, color: c.candyLavender, visual: 'gallery-frames', limitedEdition: true },
    { key: 'limited-rose-lipstick', name: '限定款・玫瑰星砂唇膏', description: '柔粉色唇膏搭配細緻星砂光澤。', icon: 'heart', price: 84, color: c.candyPink, visual: 'sculpture-plaza', limitedEdition: true },
    { key: 'pearl-compact-display', name: '珍珠光氣墊粉餅展示台', description: '以奶油白與珍珠光展示多款粉餅。', icon: 'circle', price: 58, color: c.candyCream, visual: 'jewelry-case' },
    { key: 'makeup-brush-collection', name: '柔雲刷具收藏架', description: '陳列不同尺寸的柔軟彩妝刷具。', icon: 'edit-2', price: 52, color: c.candyPeach, visual: 'craft-station' },
  ],
};

type GeneralShopSpecialty =
  | 'cafe'
  | 'candy'
  | 'icecream'
  | 'bakery'
  | 'tea'
  | 'food'
  | 'flower'
  | 'book'
  | 'toy'
  | 'craft'
  | 'onsen'
  | 'privateClub'
  | 'chiikawa'
  | 'winnie'
  | 'animalPajama'
  | 'laceFabric'
  | 'halloween'
  | 'easter'
  | 'christmas'
  | 'fruitMarket'
  | 'chineseCuisine'
  | 'icecreamParlor'
  | 'photoStudio';

const generalShopEquipment: Record<GeneralShopSpecialty, DecorationSeed[]> = {
  cafe: [
    { key: 'espresso-machine', name: '雙頭咖啡機', description: '現磨咖啡豆，沖出一杯香濃咖啡。', icon: 'coffee', price: 62, color: c.candyPeach, visual: 'coffee-machine' },
    { key: 'soft-serve-machine', name: '綿滑雪糕機', description: '為咖啡店準備香甜的雪糕甜品。', icon: 'droplet', price: 66, color: c.candySky, visual: 'ice-cream-machine' },
    { key: 'cotton-candy-machine', name: '雲朵棉花糖機', description: '把糖絲轉成蓬鬆的彩色棉花糖。', icon: 'sun', price: 58, color: c.candyPink, visual: 'cotton-candy-machine' },
    { key: 'coffee-grinder', name: '透明咖啡豆研磨機', description: '現場研磨咖啡豆，讓香氣留在店裡。', icon: 'settings', price: 48, color: c.candyLavender, visual: 'coffee-machine' },
  ],
  candy: [
    { key: 'candy-display-case', name: '彩糖分格展示櫃', description: '把軟糖、硬糖和水果糖分格陳列。', icon: 'grid', price: 48, color: c.candyPink, visual: 'candy-display' },
    { key: 'lollipop-carousel', name: '棒棒糖旋轉展示架', description: '讓一圈繽紛棒棒糖成為店內焦點。', icon: 'star', price: 42, color: c.candyLemon, visual: 'candy-display' },
    { key: 'gumball-dispenser', name: '彩珠糖果販賣機', description: '轉動旋鈕就能取出一顆彩色糖果。', icon: 'circle', price: 55, color: c.candySky, visual: 'candy-display' },
    { key: 'cotton-candy-machine', name: '夢幻棉花糖機', description: '現做蓬鬆棉花糖，帶來甜甜香氣。', icon: 'sun', price: 60, color: c.candyLavender, visual: 'cotton-candy-machine' },
  ],
  icecream: [
    { key: 'gelato-machine', name: '繽紛雪糕機', description: '製作不同口味的雪糕與霜淇淋。', icon: 'droplet', price: 66, color: c.candySky, visual: 'ice-cream-machine' },
    { key: 'ice-cream-freezer', name: '玻璃雪糕冷凍櫃', description: '展示多種口味的雪糕球和冰棒。', icon: 'grid', price: 58, color: c.candyMint, visual: 'ice-cream-machine' },
    { key: 'cone-waffle-maker', name: '脆皮甜筒烘烤機', description: '烘出香脆甜筒，搭配新鮮雪糕。', icon: 'sun', price: 54, color: c.candyPeach, visual: 'bakery-oven' },
    { key: 'topping-bar', name: '雪糕配料自選台', description: '準備水果粒、糖針和巧克力醬。', icon: 'package', price: 44, color: c.candyPink, visual: 'candy-display' },
  ],
  bakery: [
    { key: 'bakery-oven', name: '奶油色旋風烤爐', description: '烘焙麵包、曲奇和每日新鮮甜點。', icon: 'sun', price: 68, color: c.candyPeach, visual: 'bakery-oven' },
    { key: 'dough-mixer', name: '桌上型攪拌機', description: '將麵粉和奶油攪拌成柔軟麵糰。', icon: 'settings', price: 52, color: c.candyMint, visual: 'bakery-oven' },
    { key: 'pastry-display-case', name: '玻璃甜點保鮮櫃', description: '整齊展示剛出爐的蛋糕和麵包。', icon: 'grid', price: 58, color: c.candyPink, visual: 'candy-display' },
    { key: 'cotton-candy-machine', name: '棉花糖甜點機', description: '為烘焙甜點加上一朵現做糖雲。', icon: 'cloud', price: 55, color: c.candyLavender, visual: 'cotton-candy-machine' },
  ],
  tea: [
    { key: 'tea-brewer', name: '透明茶葉沖泡機', description: '把茶葉沖泡成清香熱茶或冰茶。', icon: 'coffee', price: 56, color: c.candyMint, visual: 'tea-brewer' },
    { key: 'milk-tea-shaker', name: '珍珠奶茶搖搖機', description: '搖出冰涼奶茶，配上香Q珍珠。', icon: 'droplet', price: 52, color: c.candyPeach, visual: 'tea-brewer' },
    { key: 'syrup-dispenser', name: '風味糖漿按壓台', description: '提供花果茶和汽水的多種風味。', icon: 'package', price: 42, color: c.candyPink, visual: 'candy-display' },
    { key: 'cup-sealing-machine', name: '飲品封膜機', description: '替外帶飲品封好杯口，方便帶走。', icon: 'square', price: 48, color: c.candySky, visual: 'tea-brewer' },
  ],
  food: [
    { key: 'warm-food-counter', name: '暖心保溫餐檯', description: '讓剛完成的餐點保持溫暖可口。', icon: 'sun', price: 58, color: c.candyPeach, visual: 'food-prep' },
    { key: 'noodle-cooker', name: '迷你麵食煮鍋', description: '為麵食小店準備快速煮麵設備。', icon: 'coffee', price: 62, color: c.candyLemon, visual: 'food-prep' },
    { key: 'prep-counter', name: '食材備料工作台', description: '把新鮮配料分類放好，方便料理。', icon: 'grid', price: 48, color: c.candyMint, visual: 'food-prep' },
    { key: 'dessert-machine', name: '餐後甜點製作機', description: '為每一餐加上一份迷你甜點。', icon: 'heart', price: 54, color: c.candyPink, visual: 'ice-cream-machine' },
  ],
  flower: [
    { key: 'flower-cooler', name: '鮮花保鮮展示櫃', description: '讓花束在清涼明亮的櫃內保持新鮮。', icon: 'feather', price: 56, color: c.candySky, visual: 'flower-station' },
    { key: 'bouquet-workbench', name: '花束包裝工作台', description: '準備花剪、緞帶和包裝紙。', icon: 'gift', price: 48, color: c.candyPink, visual: 'flower-station' },
    { key: 'potting-station', name: '盆栽換土工作站', description: '整理花盆、泥土和小型園藝工具。', icon: 'sunrise', price: 44, color: c.candyMint, visual: 'flower-station' },
    { key: 'flower-vase-rack', name: '花瓶與花器展示架', description: '依形狀和顏色展示各式花器。', icon: 'grid', price: 40, color: c.candyLavender, visual: 'colorful-planter' },
  ],
  book: [
    { key: 'book-carousel', name: '新書旋轉展示架', description: '讓本週推薦的新書更容易被看見。', icon: 'book-open', price: 42, color: c.candyPeach, visual: 'book-carousel' },
    { key: 'book-sorting-desk', name: '書籍分類整理台', description: '把新書和歸還書籍分區整理。', icon: 'grid', price: 40, color: c.candyLavender, visual: 'book-carousel' },
    { key: 'stationery-display', name: '文具選物展示台', description: '陳列筆記本、書籤和閱讀小物。', icon: 'edit-3', price: 38, color: c.candySky, visual: 'gallery-frames' },
    { key: 'book-press', name: '書本修復小工具台', description: '整理書角、封面和保護書套。', icon: 'tool', price: 44, color: c.candyMint, visual: 'craft-station' },
  ],
  toy: [
    { key: 'capsule-machine', name: '彩色扭蛋機', description: '轉動扭蛋機，帶走一個小驚喜。', icon: 'box', price: 58, color: c.candyLemon, visual: 'capsule-machine' },
    { key: 'prize-display', name: '玩偶與模型展示櫃', description: '把可愛玩偶和迷你模型排好展示。', icon: 'gift', price: 46, color: c.candyPink, visual: 'candy-display' },
    { key: 'toy-repair-table', name: '玩具整理工作台', description: '整理積木、模型零件和小玩具。', icon: 'tool', price: 40, color: c.candySky, visual: 'craft-station' },
    { key: 'game-card-display', name: '卡牌收藏展示架', description: '把熱門卡牌放進透明收藏格。', icon: 'grid', price: 44, color: c.candyLavender, visual: 'book-carousel' },
  ],
  chiikawa: [
    { key: 'character-plush-sorter', name: 'Chiikawa角色玩偶補貨台', description: '整理吉伊卡哇、小八和兔兔的毛絨收藏。', icon: 'gift', price: 54, color: c.candyPink, visual: 'gallery-frames' },
    { key: 'blue-white-plush-case', name: '小八貓藍白玩偶展示櫃', description: '以柔和藍白燈光展示小八貓玩偶。', icon: 'grid', price: 52, color: c.candySky, visual: 'candy-display' },
    { key: 'sticker-sorting-board', name: '角色貼紙分款收納牆', description: '把角色貼紙和小卡依系列分類。', icon: 'image', price: 42, color: c.candyLavender, visual: 'gallery-frames' },
    { key: 'character-card-printer', name: '角色小卡印製工作台', description: '為收藏卡和角色小卡準備包裝。', icon: 'camera', price: 50, color: c.candyPeach, visual: 'craft-station' },
  ],
  winnie: [
    { key: 'honey-pot-display', name: '百畝森林蜂蜜罐展示櫃', description: '以蜂蜜金色燈光陳列森林主題收藏。', icon: 'gift', price: 56, color: c.candyLemon, visual: 'candy-display' },
    { key: 'forest-plush-rack', name: '百畝森林玩偶木架', description: '展示維尼、小豬、跳跳虎與屹耳玩偶。', icon: 'feather', price: 54, color: c.candyMint, visual: 'gallery-frames' },
    { key: 'storybook-sorting-table', name: '森林故事繪本整理桌', description: '整理百畝森林繪本與故事卡片。', icon: 'book-open', price: 44, color: c.candyPeach, visual: 'book-carousel' },
    { key: 'honey-gift-box-station', name: '蜂蜜罐禮物包裝台', description: '用森林葉片與蜂蜜色緞帶包裝小禮物。', icon: 'package', price: 48, color: c.candyCaramel, visual: 'craft-station' },
  ],
  animalPajama: [
    { key: 'onesie-fitting-mirror', name: '動物連身睡衣試穿鏡', description: '從帽耳到腳套都能看清楚的全身鏡。', icon: 'square', price: 48, color: c.candyMint, visual: 'dress-display' },
    { key: 'pajama-size-rack', name: '動物睡衣尺寸衣架', description: '依尺寸整理柔軟連身睡衣。', icon: 'shopping-bag', price: 54, color: c.candyPeach, visual: 'clothing-rack' },
    { key: 'bunny-onesie-wardrobe', name: '兔兔耳連身睡衣衣櫃', description: '收納長耳、短耳與垂耳兔兔款。', icon: 'moon', price: 58, color: c.candyPink, visual: 'clothing-wardrobe' },
    { key: 'animal-slipper-display', name: '動物腳套拖鞋展示台', description: '搭配睡衣陳列柔軟小腳套。', icon: 'gift', price: 38, color: c.candySky, visual: 'sculpture-plaza' },
  ],
  laceFabric: [
    { key: 'lace-swatch-wall', name: '蕾絲布料花色選擇牆', description: '比較細緻花邊、網紗與棉布花色。', icon: 'grid', price: 48, color: c.candyLavender, visual: 'gallery-frames' },
    { key: 'custom-measure-table', name: '訂製服裝量身工作台', description: '量度尺寸並整理客製剪裁需求。', icon: 'edit-3', price: 60, color: c.candyPeach, visual: 'craft-station' },
    { key: 'fabric-roll-rack', name: '柔紗與緞布展示架', description: '展示不同色調的蕾絲、緞布和薄紗。', icon: 'feather', price: 52, color: c.candyPink, visual: 'clothing-rack' },
    { key: 'custom-dress-preview-mirror', name: '訂製洋裝搭配鏡', description: '預覽布料、裙型和飾邊的組合。', icon: 'square', price: 44, color: c.candySky, visual: 'dress-display' },
  ],
  halloween: [
    { key: 'pumpkin-costume-rack', name: '南瓜變裝服展示架', description: '陳列可愛南瓜和小魔法師造型服。', icon: 'shopping-bag', price: 50, color: c.candyCoral, visual: 'clothing-rack' },
    { key: 'friendly-bat-mobile', name: '友善蝙蝠星月吊飾', description: '以不嚇人的小蝙蝠和星星點綴店內。', icon: 'moon', price: 32, color: c.candyLavender, visual: 'starlight-mobile' },
    { key: 'halloween-candy-case', name: '萬聖節糖果分格櫃', description: '把南瓜造型糖果和小禮物分類展示。', icon: 'gift', price: 42, color: c.candyLemon, visual: 'candy-display' },
    { key: 'witch-hat-stand', name: '星星巫師帽展示台', description: '搭配柔和彩色帽帶展示派對帽款。', icon: 'star', price: 38, color: c.candyLavender, visual: 'sculpture-plaza' },
  ],
  easter: [
    { key: 'painted-egg-display', name: '手繪復活節彩蛋架', description: '展示花朵、星星與格紋彩蛋。', icon: 'gift', price: 38, color: c.candyLemon, visual: 'candy-display' },
    { key: 'bunny-basket-table', name: '兔兔彩蛋花籃桌', description: '把彩蛋和春日小花放進編織籃。', icon: 'package', price: 42, color: c.candyMint, visual: 'colorful-planter' },
    { key: 'spring-ribbon-wall', name: '春日緞帶禮物牆', description: '展示復活節小禮物與柔色緞帶。', icon: 'feather', price: 34, color: c.candyPink, visual: 'gallery-frames' },
    { key: 'easter-bunny-plush-rack', name: '復活節兔兔玩偶架', description: '陳列不同花色的兔兔絨毛玩偶。', icon: 'heart', price: 46, color: c.candyPeach, visual: 'clothing-rack' },
  ],
  christmas: [
    { key: 'ornament-tree-display', name: '聖誕樹飾品展示台', description: '展示星星、雪花和糖果色吊飾。', icon: 'star', price: 46, color: c.candyMint, visual: 'starlight-mobile' },
    { key: 'holiday-gift-wall', name: '冬日禮盒陳列牆', description: '按尺寸排列包好緞帶的節日禮盒。', icon: 'gift', price: 44, color: c.candyRose, visual: 'gallery-frames' },
    { key: 'stocking-hanger', name: '雪花襪與花環掛架', description: '懸掛手作聖誕襪、花環和小卡片。', icon: 'package', price: 38, color: c.candyCoral, visual: 'clothing-rack' },
    { key: 'cocoa-warming-counter', name: '熱可可迎賓暖檯', description: '為逛店客人準備一杯暖暖可可。', icon: 'coffee', price: 52, color: c.candyCaramel, visual: 'food-prep' },
  ],
  fruitMarket: [
    { key: 'seasonal-fruit-island', name: '當季鮮果分層展示島', description: '分色擺放草莓、柑橘、葡萄和熱帶水果。', icon: 'sun', price: 42, color: c.candyCoral, visual: 'colorful-planter' },
    { key: 'fruit-gift-box-table', name: '水果禮盒包裝工作台', description: '把新鮮水果和緞帶包成探訪禮盒。', icon: 'gift', price: 48, color: c.candyPeach, visual: 'craft-station' },
    { key: 'fresh-cut-chiller', name: '鮮切水果玻璃冷藏櫃', description: '展示冰涼水果杯和當日果盤。', icon: 'droplet', price: 58, color: c.candySky, visual: 'coral-aquarium' },
    { key: 'fruit-sampling-counter', name: '時令水果試吃吧台', description: '準備小份切片讓客人品嚐果香。', icon: 'heart', price: 44, color: c.candyLemon, visual: 'tasting-court' },
  ],
  chineseCuisine: [
    { key: 'dim-sum-steamer-stack', name: '港式點心蒸籠展示架', description: '展示蒸餃、包子與迷你燒賣。', icon: 'sun', price: 58, color: c.candyPeach, visual: 'food-prep' },
    { key: 'round-table-dining-set', name: '中式圓桌用餐組', description: '擺好茶壺、餐碟與共享點心。', icon: 'grid', price: 54, color: c.candyCoral, visual: 'tasting-court' },
    { key: 'tea-service-cabinet', name: '中式茶具與餐具櫃', description: '收納茶杯、筷子和陶瓷小碟。', icon: 'coffee', price: 46, color: c.candyLemon, visual: 'gallery-frames' },
    { key: 'noodle-broth-counter', name: '暖湯麵食備餐檯', description: '準備湯麵、蔥花和每日新鮮配料。', icon: 'droplet', price: 56, color: c.candyMint, visual: 'food-prep' },
  ],
  icecreamParlor: [
    { key: 'gelato-flavor-freezer', name: '雪花口味玻璃冷凍櫃', description: '分格展示當日雪糕與雪酪口味。', icon: 'droplet', price: 58, color: c.candySky, visual: 'ice-cream-machine' },
    { key: 'waffle-cone-stand', name: '現烤脆皮甜筒架', description: '收納新鮮烘好的甜筒與餅杯。', icon: 'sun', price: 50, color: c.candyPeach, visual: 'bakery-oven' },
    { key: 'sundae-topping-island', name: '彩果聖代配料島', description: '陳列莓果、堅果和餅乾碎配料。', icon: 'package', price: 44, color: c.candyPink, visual: 'candy-display' },
    { key: 'snowflake-sundae-table', name: '雪花雙球分享桌', description: '安排座位分享雙球雪糕和聖代。', icon: 'heart', price: 42, color: c.candyLavender, visual: 'tasting-court' },
  ],
  craft: [
    { key: 'craft-workbench', name: '手作材料工作台', description: '準備剪刀、布料和各種創作材料。', icon: 'tool', price: 50, color: c.candyPeach, visual: 'craft-station' },
    { key: 'mini-kiln', name: '糖果色迷你窯爐', description: '為陶作和小型工藝提供燒製空間。', icon: 'sun', price: 62, color: c.candyCoral, visual: 'bakery-oven' },
    { key: 'sewing-machine', name: '桌上型縫紉機', description: '縫製布藝、玩偶衣服和小型手作。', icon: 'settings', price: 54, color: c.candyMint, visual: 'sewing-machine' },
    { key: 'display-turntable', name: '手作品旋轉展示台', description: '轉動展示剛完成的獨一無二作品。', icon: 'star', price: 42, color: c.candyLavender, visual: 'sculpture-plaza' },
  ],
  onsen: [
    { key: 'sakura-onsen-pool', name: '櫻花露天暖湯池', description: '在櫻花木格旁擺放一座冒著暖霧的溫泉池。', icon: 'droplet', price: 92, color: c.candySky, visual: 'onsen-bath' },
    { key: 'onsen-supply-case', name: '溫泉用品玻璃展示櫃', description: '分格展示入浴鹽、香皂、浴巾與泡湯小物。', icon: 'grid', price: 58, color: c.candyPink, visual: 'onsen-supplies' },
    { key: 'yuzu-steam-kettle', name: '柚香蒸氣暖浴器', description: '以柚子與木香蒸氣營造暖湯氣氛。', icon: 'wind', price: 64, color: c.candyLemon, visual: 'onsen-steamer' },
    { key: 'yukata-care-rack', name: '浴衣與腰帶整理架', description: '掛放浴衣、腰帶與乾爽替換衣物。', icon: 'shopping-bag', price: 56, color: c.candyLavender, visual: 'onsen-yukata-rack' },
  ],
  privateClub: [
    { key: 'members-reception-desk', name: '古堡會員迎賓櫃台', description: '在石拱門旁迎接會所會員與餐廳賓客。', icon: 'home', price: 58, color: c.candyCaramel, visual: 'food-prep' },
    { key: 'private-dining-table', name: '聖愛德華私人宴席桌', description: '為會所餐廳安排一席雅緻的私人用餐空間。', icon: 'grid', price: 72, color: c.candyPeach, visual: 'tasting-court' },
    { key: 'castle-menu-board', name: '西堡主廚菜單牌', description: '展示當日餐點與主廚推薦菜色。', icon: 'book-open', price: 38, color: c.candyRose, visual: 'gallery-frames' },
    { key: 'club-service-console', name: '金邊餐飲服務台', description: '整理餐具、餐巾與桌邊服務用品。', icon: 'coffee', price: 52, color: c.candyLemon, visual: 'food-prep' },
  ],
  photoStudio: [
    { key: 'ring-light-set', name: '柔光環形補光燈', description: '為人像拍攝提供均勻柔和的補光。', icon: 'sun', price: 58, color: c.candyPink, visual: 'garden-lights' },
    { key: 'tripod-camera', name: '復古三腳架相機', description: '固定相機位置，方便拍攝不同造型。', icon: 'camera', price: 68, color: c.candyCaramel, visual: 'gallery-frames' },
    { key: 'backdrop-roller', name: '多色背景布升降架', description: '快速更換花園、星空與宮廷背景。', icon: 'image', price: 54, color: c.candyLavender, visual: 'rainbow-arch' },
    { key: 'instant-photo-printer', name: '拍立得照片印製台', description: '把喜歡的拍攝造型印成小卡留念。', icon: 'printer', price: 62, color: c.candySky, visual: 'craft-station' },
  ],
};

const shopEquipment: Record<Exclude<MallShopType, 'general'>, DecorationSeed[]> = {
  womenswear: [
    { key: 'garment-steamer', name: '直立式服裝蒸氣機', description: '整理上衣和裙裝的布料皺褶。', icon: 'sun', price: 54, color: c.candyPink, visual: 'sewing-machine' },
    { key: 'sewing-machine', name: '蝴蝶結縫紉工作台', description: '為衣物修改尺寸或縫上精緻裝飾。', icon: 'settings', price: 58, color: c.candyLavender, visual: 'sewing-machine' },
    { key: 'fabric-swatch-wall', name: '布料色卡選擇牆', description: '依顏色挑選服飾布料和搭配色。', icon: 'grid', price: 42, color: c.candySky, visual: 'clothing-wardrobe' },
    { key: 'style-matching-mirror', name: '穿搭配色鏡台', description: '把上衣、裙裝和配件放在一起搭配。', icon: 'square', price: 46, color: c.candyPeach, visual: 'dress-display' },
  ],
  bridal: [
    { key: 'bridal-steamer', name: '婚紗蒸氣護理櫃', description: '為蕾絲婚紗和長裙整理柔順裙襬。', icon: 'sun', price: 64, color: c.candyCream, visual: 'sewing-machine' },
    { key: 'lace-sewing-station', name: '蕾絲縫製工作台', description: '整理頭紗、蕾絲和婚紗細節。', icon: 'settings', price: 60, color: c.candyPink, visual: 'sewing-machine' },
    { key: 'bridal-accessory-case', name: '頭紗飾品玻璃櫃', description: '展示頭紗、髮飾和珍珠配件。', icon: 'gift', price: 52, color: c.candyLavender, visual: 'jewelry-case' },
    { key: 'gown-measuring-stand', name: '婚紗量身調整台', description: '預留量身和裙襬整理的空間。', icon: 'user', price: 56, color: c.candySky, visual: 'dress-display' },
  ],
  eveningwear: [
    { key: 'eveningwear-steamer', name: '晚禮服蒸氣護理機', description: '整理絲絨、薄紗和亮片禮服。', icon: 'sun', price: 62, color: c.candyLavender, visual: 'sewing-machine' },
    { key: 'tailoring-station', name: '晚裝修改縫紉台', description: '為禮服裙襬和西裝作細節調整。', icon: 'settings', price: 60, color: c.candyRose, visual: 'sewing-machine' },
    { key: 'runway-spotlight-console', name: '伸展台燈光控制台', description: '調整主打禮服展示時的柔和燈光。', icon: 'zap', price: 48, color: c.candyLemon, visual: 'garden-lights' },
    { key: 'formal-accessory-case', name: '晚宴配件玻璃櫃', description: '集中展示手拿包、領結和珠寶。', icon: 'gift', price: 52, color: c.candySky, visual: 'jewelry-case' },
  ],
  kimono: [
    { key: 'kimono-steamer', name: '和服蒸氣整理櫃', description: '整理和服長袖、腰帶和布料摺線。', icon: 'sun', price: 64, color: c.candyCoral, visual: 'sewing-machine' },
    { key: 'obi-shaping-table', name: '腰帶造型整理台', description: '協助整理腰帶、結飾和配件。', icon: 'grid', price: 48, color: c.candyPeach, visual: 'kimono-display' },
    { key: 'yukata-care-rack', name: '浴衣晾掛衣架', description: '展示並整理浴衣與夏祭配件。', icon: 'shopping-bag', price: 44, color: c.candySky, visual: 'kimono-display' },
    { key: 'kimono-sewing-station', name: '和服修補工作台', description: '收納針線與布料，整理細緻縫線。', icon: 'settings', price: 56, color: c.candyPink, visual: 'sewing-machine' },
  ],
  supermarket: [
    { key: 'supermarket-freezer', name: '雙門冰品冷凍櫃', description: '冷藏雪糕、冰棒和冷凍甜點。', icon: 'droplet', price: 58, color: c.candySky, visual: 'ice-cream-machine' },
    { key: 'supermarket-candy-shelf', name: '糖果自選分格櫃', description: '把糖果和小零食按種類分格展示。', icon: 'grid', price: 42, color: c.candyPink, visual: 'candy-display' },
    { key: 'supermarket-bakery-warmer', name: '麵包保溫展示櫃', description: '讓烘焙區的麵包保持溫熱。', icon: 'sun', price: 52, color: c.candyPeach, visual: 'bakery-oven' },
    { key: 'supermarket-self-checkout', name: '迷你自助結帳機', description: '為超市增設方便的自助結帳位置。', icon: 'credit-card', price: 60, color: c.candyMint, visual: 'electronics-bench' },
  ],
  hyakuen: [
    { key: 'hyakuen-capsule-machine', name: '驚喜扭蛋販賣機', description: '放入迷你玩具和小飾物扭蛋。', icon: 'box', price: 54, color: c.candyLemon, visual: 'capsule-machine' },
    { key: 'label-printer', name: '商品標籤印字機', description: '替生活用品和文具整理分類標籤。', icon: 'edit-3', price: 42, color: c.candySky, visual: 'electronics-bench' },
    { key: 'hyakuen-gift-wrap', name: '小物包裝工作台', description: '為挑選好的小物加上紙袋和緞帶。', icon: 'gift', price: 40, color: c.candyPink, visual: 'craft-station' },
    { key: 'hyakuen-candy-rack', name: '迷你糖果展示架', description: '陳列包裝糖果和季節限定零食。', icon: 'grid', price: 38, color: c.candyPeach, visual: 'candy-display' },
  ],
  swimwear: [
    { key: 'swimwear-steamer', name: '泳裝護理蒸氣機', description: '整理泳裝和薄紗罩衫的展示造型。', icon: 'sun', price: 52, color: c.candySky, visual: 'sewing-machine' },
    { key: 'beach-accessory-case', name: '海灘配件展示櫃', description: '收納泳鏡、泳帽和防水小物。', icon: 'grid', price: 40, color: c.candyMint, visual: 'jewelry-case' },
    { key: 'swimwear-fitting-mirror', name: '泳裝穿搭全身鏡', description: '方便比較泳衣和沙灘裙裝搭配。', icon: 'square', price: 44, color: c.candyPink, visual: 'dress-display' },
    { key: 'towel-warmer', name: '柔暖浴巾收納櫃', description: '把柔軟毛巾整齊收在店內一角。', icon: 'heart', price: 46, color: c.candyPeach, visual: 'clothing-wardrobe' },
  ],
  cosplay: [
    { key: 'cosplay-sewing-machine', name: '角色服裝縫紉機', description: '修改制服、披風和舞台服裝細節。', icon: 'settings', price: 60, color: c.candyLavender, visual: 'sewing-machine' },
    { key: 'wig-styling-station', name: '假髮造型整理台', description: '整理假髮、髮夾和角色造型配件。', icon: 'user', price: 50, color: c.candyPink, visual: 'craft-station' },
    { key: 'cosplay-prop-workbench', name: '角色道具製作工作台', description: '收納泡棉、顏料和安全造型道具。', icon: 'tool', price: 54, color: c.candySky, visual: 'craft-station' },
    { key: 'costume-steamer', name: '舞台服裝蒸氣整理機', description: '讓角色服裝上台前保持整潔。', icon: 'sun', price: 48, color: c.candyPeach, visual: 'sewing-machine' },
  ],
  electronics: [
    { key: 'electronics-demo-bench', name: '小家電體驗工作台', description: '讓客人試用桌上型電器和生活科技。', icon: 'cpu', price: 60, color: c.candyMint, visual: 'electronics-bench' },
    { key: 'device-repair-station', name: '迷你電器檢修台', description: '展示安全的維修工具和檢測設備。', icon: 'settings', price: 58, color: c.candySky, visual: 'electronics-bench' },
    { key: 'electronics-charging-wall', name: '多裝置充電體驗牆', description: '展示手機、耳機和穿戴裝置充電配件。', icon: 'zap', price: 48, color: c.candyLavender, visual: 'electronics-bench' },
    { key: 'electronics-cable-organizer', name: '線材分類收納櫃', description: '將充電線和轉接配件分格收好。', icon: 'grid', price: 40, color: c.candyPeach, visual: 'gallery-frames' },
  ],
  boutique: [
    { key: 'boutique-jewelry-case', name: '珍藏珠寶柔光櫃', description: '在柔和燈光下展示首飾和腕錶。', icon: 'gift', price: 62, color: c.candyLemon, visual: 'jewelry-case' },
    { key: 'boutique-polishing-station', name: '首飾保養整理台', description: '收納擦拭布和小型首飾整理工具。', icon: 'sun', price: 50, color: c.candyPink, visual: 'jewelry-case' },
    { key: 'boutique-handbag-stand', name: '手袋輪替展示台', description: '把當季手袋放在專屬展示位置。', icon: 'shopping-bag', price: 54, color: c.candyPeach, visual: 'gallery-frames' },
    { key: 'boutique-gift-wrap', name: '精品禮盒包裝台', description: '以緞帶和包裝紙整理收藏小禮物。', icon: 'gift', price: 48, color: c.candyLavender, visual: 'craft-station' },
  ],
  cosmetics: [
    { key: 'shade-matching-mirror', name: '智慧粉底色號比對鏡', description: '用柔和補光協助挑選合適的粉底色號。', icon: 'sun', price: 60, color: c.candyPink, visual: 'gallery-frames' },
    { key: 'lipstick-mixer', name: '唇膏色彩調配台', description: '搭配顏料盤調出專屬唇彩色調。', icon: 'droplet', price: 56, color: c.candyRose, visual: 'craft-station' },
    { key: 'brush-sanitizer', name: '彩妝刷具清潔消毒櫃', description: '讓試妝用刷具保持乾淨整齊。', icon: 'wind', price: 54, color: c.candySky, visual: 'electronics-bench' },
    { key: 'compact-refill-station', name: '氣墊粉餅補充工作站', description: '整理粉芯、粉撲與替換補充蕊。', icon: 'settings', price: 50, color: c.candyLavender, visual: 'craft-station' },
  ],
};

const generalSpecialtyPatterns: [GeneralShopSpecialty, RegExp][] = [
  ['chiikawa', /chiikawa|吉伊卡哇|ちいかわ/i],
  ['winnie', /winnie|pooh|小熊維尼|百畝森林|跳跳虎|屹耳/i],
  ['animalPajama', /animal-pajama|animal-onesie|動物睡衣|連身睡衣/i],
  ['laceFabric', /lace-fabric|fabric-studio|萊斯布料|蕾絲布料|服裝訂製/i],
  ['halloween', /halloween|萬聖節|南瓜變裝/i],
  ['easter', /easter|復活節|彩蛋店/i],
  ['christmas', /christmas|聖誕節|聖誕雪花/i],
  ['fruitMarket', /fresh-fruit-market|鮮果專門店|水果專賣/i],
  ['chineseCuisine', /chinese-cuisine|中菜館|中式餐館/i],
  ['icecreamParlor', /snowflake-icecream|雪花雪糕|霜雪雪糕/i],
  ['privateClub', /saint-edward-west-castle|聖愛德華西堡|私人會所/i],
  ['photoStudio', /portrait-photo-studio|寫真館|個人寫真|photo.?studio|portrait.?studio/i],
  ['onsen', /溫泉|櫻花暖湯|湯宿|湯煙|泡湯|onsen|hot.?spring/i],
  ['cafe', /咖啡|coffee|cafe|烘豆/i],
  ['candy', /糖果|軟糖|棉花糖|彩糖|糖藝|糖霜|candy|sweets/i],
  ['icecream', /雪糕|冰淇淋|冰棒|冰沙|gelato|ice.?cream|smoothie/i],
  ['bakery', /烘焙|麵包|曲奇|餅乾|甜甜圈|鬆餅|布丁|馬卡龍|巧克力|甜點|甜品|果塔|bakery|bake|pastry/i],
  ['tea', /奶茶|茶|汽水|飲品|飲料|bubble.?tea|tea.?shop|冰飲/i],
  ['food', /食堂|食館|小食|飯糰|咖喱|咖哩|披薩|意粉|可麗餅|捲餅|起司|香料|料理|餐|kitchen|noodle|food.?bar/i],
  ['flower', /花|植物|園藝|苗圃|盆栽|花藝|flower|florist|plant.?shop/i],
  ['book', /書|文具|手帳|紙品|明信片|繪本|漫畫|雜誌|book|stationery/i],
  ['toy', /扭蛋|玩偶|玩具|遊戲|模型|積木|卡牌|街機|toy|capsule|arcade/i],
  ['craft', /工房|工藝|陶|畫室|畫作|手作|編織|刺繡|玻璃|皮革|craft|studio|atelier|ceramic/i],
];

const specialtyFixture = (
  specialty: GeneralShopSpecialty,
  key: string,
  name: string,
  description: string,
  icon: string,
  price: number,
  visual: string,
): DecorationFixture => ({ key: `${specialty}-${key}`, name, description, icon, price, visual });

const GENERAL_SPECIALTY_FIXTURES: Record<GeneralShopSpecialty, DecorationFixture[]> = {
  cafe: [
    specialtyFixture('cafe', 'bean-wall', '產地咖啡豆玻璃罐牆', '依烘焙深淺陳列不同產地的咖啡豆。', 'grid', 34, 'spice-display'),
    specialtyFixture('cafe', 'latte-art-board', '拉花咖啡展示畫板', '展示每日更新的奶泡拉花圖案。', 'image', 29, 'gallery-frames'),
    specialtyFixture('cafe', 'cup-rack', '手繪咖啡杯吊架', '把馬克杯和外帶杯整齊掛放。', 'coffee', 31, 'spice-display'),
    specialtyFixture('cafe', 'pastry-pairing-case', '咖啡甜點搭配櫃', '將小蛋糕與手沖咖啡搭配陳列。', 'gift', 40, 'tasting-court'),
    specialtyFixture('cafe', 'syrup-station', '風味糖漿小吧台', '整理香草、焦糖與果香糖漿。', 'package', 32, 'food-prep'),
    specialtyFixture('cafe', 'roast-sign', '今日烘豆霓虹牌', '標示今天的咖啡豆與推薦風味。', 'zap', 28, 'neon-sign'),
    specialtyFixture('cafe', 'coffee-seat', '窗邊咖啡雙人座', '留一個能慢慢喝咖啡的窗邊位置。', 'heart', 35, 'wooden-bench'),
    specialtyFixture('cafe', 'filter-display', '手沖濾杯收藏架', '展示不同材質與形狀的手沖器具。', 'coffee', 30, 'gallery-frames'),
    specialtyFixture('cafe', 'cafe-plant', '咖啡樹盆栽角', '用一株小咖啡樹點綴店內角落。', 'feather', 25, 'colorful-planter'),
    specialtyFixture('cafe', 'bean-scent-mobile', '咖啡香氣吊飾', '以咖啡果實與星點裝飾天花板。', 'wind', 26, 'starlight-mobile'),
  ],
  candy: [
    specialtyFixture('candy', 'gummy-color-wall', '水果軟糖彩色分格牆', '按果味和顏色排列一格格軟糖。', 'grid', 34, 'candy-display'),
    specialtyFixture('candy', 'lollipop-carousel', '棒棒糖旋轉陳列台', '讓繽紛棒棒糖在店中央緩緩轉動。', 'star', 38, 'sculpture-plaza'),
    specialtyFixture('candy', 'sugar-jar-shelf', '手作糖果玻璃罐架', '展示手工硬糖與水果糖罐。', 'package', 31, 'spice-display'),
    specialtyFixture('candy', 'marshmallow-cloud', '棉花糖雲朵展示台', '用柔軟雲朵造型展示不同口味棉花糖。', 'cloud', 36, 'cotton-candy-machine'),
    specialtyFixture('candy', 'chocolate-counter', '巧克力切片小櫃檯', '排列不同可可口味的巧克力薄片。', 'gift', 33, 'tasting-court'),
    specialtyFixture('candy', 'sweet-menu', '糖果口味插畫牌', '介紹今日新做的糖果口味。', 'image', 27, 'gallery-frames'),
    specialtyFixture('candy', 'candy-arch', '糖果包裝迎賓拱門', '以糖果色紙包裝裝飾店門入口。', 'sunrise', 39, 'rainbow-arch'),
    specialtyFixture('candy', 'gumball-corner', '彩珠糖果轉轉角', '陳列可愛的轉珠糖罐和糖球。', 'circle', 35, 'capsule-machine'),
    specialtyFixture('candy', 'sweet-lamp', '糖霜玻璃吊燈', '用糖霜紋樣映出柔和的彩色光。', 'sun', 29, 'shell-lantern'),
    specialtyFixture('candy', 'gift-wrap-table', '糖果禮盒包裝桌', '準備彩紙、緞帶與小型禮盒。', 'gift', 34, 'craft-station'),
  ],
  icecream: [
    specialtyFixture('icecream', 'scoop-freezer', '雪糕球口味冷凍櫃', '分格展示當日供應的雪糕口味。', 'droplet', 42, 'coral-aquarium'),
    specialtyFixture('icecream', 'cone-rack', '脆皮甜筒收納架', '把新鮮烘好的甜筒分類放好。', 'package', 32, 'spice-display'),
    specialtyFixture('icecream', 'topping-bar', '雪糕配料自選台', '擺放莓果、巧克力粒與糖針。', 'grid', 39, 'candy-display'),
    specialtyFixture('icecream', 'sundae-menu', '繽紛聖代口味牌', '用插畫介紹店內人氣聖代組合。', 'image', 27, 'gallery-frames'),
    specialtyFixture('icecream', 'popsicle-freezer', '水果冰棒直立冷櫃', '展示各種水果形狀的冰棒。', 'droplet', 40, 'coral-aquarium'),
    specialtyFixture('icecream', 'waffle-maker', '迷你鬆餅甜筒烤台', '烘烤剛出爐的鬆餅與甜筒。', 'sun', 44, 'bakery-oven'),
    specialtyFixture('icecream', 'sundae-table', '雙人雪糕分享桌', '讓客人坐下分享一杯雙球雪糕。', 'heart', 35, 'tasting-court'),
    specialtyFixture('icecream', 'scoop-sign', '雪花霓虹招牌', '用雪花圖案點亮冰品櫃上方。', 'star', 30, 'neon-sign'),
    specialtyFixture('icecream', 'sprinkle-mobile', '糖針星星吊飾', '用彩色糖針和小雪花點綴空間。', 'star', 26, 'starlight-mobile'),
    specialtyFixture('icecream', 'flavor-planter', '薄荷冰品花盆', '為冰品角落添上清爽薄荷葉。', 'feather', 24, 'colorful-planter'),
  ],
  bakery: [
    specialtyFixture('bakery', 'croissant-case', '現烤可頌玻璃展示櫃', '陳列剛出爐的可頌與酥皮點心。', 'shopping-bag', 40, 'bakery-oven'),
    specialtyFixture('bakery', 'bread-wall', '每日麵包木層架', '按出爐時間擺放麵包與小餐包。', 'package', 35, 'spice-display'),
    specialtyFixture('bakery', 'cookie-jars', '糖霜曲奇玻璃罐架', '展示手工餅乾與季節糖霜造型。', 'gift', 33, 'candy-display'),
    specialtyFixture('bakery', 'dough-table', '麵糰揉製工作桌', '準備麵粉、麵糰和烘焙工具。', 'grid', 38, 'food-prep'),
    specialtyFixture('bakery', 'cooling-rack', '蛋糕出爐冷卻架', '讓小蛋糕和派塔在架上放涼。', 'grid', 31, 'gallery-frames'),
    specialtyFixture('bakery', 'pie-podium', '每日派塔展示台', '把季節水果派放在店內焦點位置。', 'star', 36, 'tasting-court'),
    specialtyFixture('bakery', 'recipe-board', '手寫烘焙食譜牆', '展示店主每日使用的烘焙配方。', 'edit-3', 28, 'gallery-frames'),
    specialtyFixture('bakery', 'jam-shelf', '果醬與奶油搭配架', '陳列自製果醬與抹醬小罐。', 'package', 30, 'spice-display'),
    specialtyFixture('bakery', 'oven-lamp', '奶油色麵包暖燈', '為新鮮麵包櫃提供柔和暖光。', 'sun', 26, 'garden-lights'),
    specialtyFixture('bakery', 'bakery-bench', '麵包香休息長椅', '讓等候出爐的客人坐一會兒。', 'heart', 32, 'wooden-bench'),
  ],
  tea: [
    specialtyFixture('tea', 'tea-jar-wall', '茶葉香氣玻璃罐牆', '展示焙茶、烏龍與花草茶葉。', 'grid', 34, 'spice-display'),
    specialtyFixture('tea', 'teapot-showcase', '手作茶壺展示櫃', '陳列不同釉色的泡茶壺與茶海。', 'coffee', 38, 'gallery-frames'),
    specialtyFixture('tea', 'cup-display', '茶杯與茶托收藏架', '把茶杯和茶托依色系配成一組。', 'coffee', 32, 'spice-display'),
    specialtyFixture('tea', 'tea-ceremony-table', '小型品茶茶席', '為試飲與品茶留一張矮桌。', 'grid', 40, 'tasting-court'),
    specialtyFixture('tea', 'tea-menu', '手繪茶香風味牌', '標示茶葉產地、香氣與沖泡方式。', 'image', 28, 'gallery-frames'),
    specialtyFixture('tea', 'tea-bloom-case', '花草茶乾燥花展示瓶', '展示可沖泡的乾燥花與香草。', 'feather', 29, 'flower-station'),
    specialtyFixture('tea', 'bamboo-divider', '竹編茶室隔屏', '為茶席留出安靜的半開放角落。', 'columns', 36, 'clothing-wardrobe'),
    specialtyFixture('tea', 'tea-steam-lamp', '茶煙暖光吊燈', '讓暖茶蒸氣映出柔和燈影。', 'sun', 30, 'shell-lantern'),
    specialtyFixture('tea', 'tea-mobile', '茶花風鈴吊飾', '以茶花和小鈴鐺點綴天花板。', 'wind', 25, 'starlight-mobile'),
    specialtyFixture('tea', 'tea-seat', '窗邊品茶長椅', '提供一處安靜喝茶的小座位。', 'heart', 33, 'wooden-bench'),
  ],
  food: [
    specialtyFixture('food', 'noodle-counter', '暖湯麵食備餐檯', '整理麵條、湯碗與熱食配料。', 'coffee', 41, 'food-prep'),
    specialtyFixture('food', 'dumpling-steamer', '手作點心蒸籠架', '展示熱騰騰的包子與蒸點。', 'sun', 43, 'bakery-oven'),
    specialtyFixture('food', 'spice-shelf', '各地香料玻璃罐牆', '依料理風味排列香料與調味罐。', 'package', 34, 'spice-display'),
    specialtyFixture('food', 'bento-case', '當日便當保鮮櫃', '陳列每日新鮮製作的餐盒。', 'grid', 40, 'coral-aquarium'),
    specialtyFixture('food', 'pizza-board', '手工披薩口味展示板', '介紹每日現做的披薩口味。', 'image', 28, 'gallery-frames'),
    specialtyFixture('food', 'sauce-station', '自選醬料小站', '收納辣醬、香草醬與沾醬。', 'droplet', 31, 'candy-display'),
    specialtyFixture('food', 'produce-basket', '料理新鮮食材籃', '把每日使用的蔬菜與香草擺好。', 'feather', 28, 'colorful-planter'),
    specialtyFixture('food', 'menu-sign', '今日熱食燈牌', '標示現做餐點和每日套餐。', 'zap', 30, 'neon-sign'),
    specialtyFixture('food', 'family-table', '家庭共享餐桌', '為一起用餐的客人準備座位。', 'grid', 39, 'tasting-court'),
    specialtyFixture('food', 'market-lamp', '市集暖香路燈', '為熱食攤位添上一盞暖色小燈。', 'sun', 26, 'garden-lights'),
  ],
  privateClub: [
    specialtyFixture('privateClub', 'stone-arch-lounge', '石拱門會員休息廳', '以暖色軟座迎接會所會員，延續古堡石拱廊氛圍。', 'home', 46, 'rest-pavilion'),
    specialtyFixture('privateClub', 'reservation-stand', '餐廳訂席迎賓台', '整理私人宴席預約與迎賓安排。', 'book-open', 38, 'food-prep'),
    specialtyFixture('privateClub', 'castle-banquet-table', '西堡長桌宴席區', '讓賓客在木雕長桌旁享用會所餐點。', 'grid', 48, 'tasting-court'),
    specialtyFixture('privateClub', 'silverware-cabinet', '銀器與瓷器展示櫃', '展示餐盤、茶具和細緻餐具。', 'gift', 42, 'jewelry-case'),
    specialtyFixture('privateClub', 'chef-recommendation-board', '主廚精選餐牌', '介紹每日套餐、甜點與無酒精飲品。', 'image', 32, 'gallery-frames'),
    specialtyFixture('privateClub', 'members-crest-frame', '會員徽章古典畫框', '以原創盾形徽章裝飾私人會所牆面。', 'shield', 34, 'gallery-frames'),
    specialtyFixture('privateClub', 'velvet-dining-bench', '絲絨餐廳長椅', '為靠牆餐席增添柔軟舒適的座位。', 'heart', 40, 'wooden-bench'),
    specialtyFixture('privateClub', 'brass-castle-sconce', '古堡黃銅壁燈', '用溫暖燈光照亮石牆與餐桌。', 'sun', 30, 'garden-lights'),
    specialtyFixture('privateClub', 'dessert-trolley', '餐後甜點推車', '推送小蛋糕、水果塔和茶點。', 'shopping-bag', 44, 'food-prep'),
    specialtyFixture('privateClub', 'private-room-divider', '雕花私人包廂屏風', '為會所餐廳分隔出安靜的用餐包廂。', 'columns', 50, 'rest-pavilion'),
    specialtyFixture('privateClub', 'dining-room-reservation-card', '會員餐席預約牌', '標示今日包廂與宴席安排。', 'book-open', 28, 'gallery-frames'),
    specialtyFixture('privateClub', 'castle-tea-service-cart', '古堡茶點服務推車', '端上茶飲與無酒精餐後小點。', 'coffee', 36, 'food-prep'),
  ],
  flower: [
    specialtyFixture('flower', 'bouquet-wall', '季節花束展示牆', '按花色展示每日新鮮花束。', 'feather', 37, 'flower-station'),
    specialtyFixture('flower', 'seedling-rack', '小苗與種子木架', '排列盆栽幼苗、種子與栽培小包。', 'grid', 32, 'colorful-planter'),
    specialtyFixture('flower', 'vase-case', '手作花瓶展示櫃', '展示不同釉色和形狀的小花器。', 'gift', 35, 'gallery-frames'),
    specialtyFixture('flower', 'wrap-table', '花束緞帶包裝桌', '準備花紙、緞帶與花剪。', 'gift', 38, 'craft-station'),
    specialtyFixture('flower', 'hanging-planter', '藤蔓垂掛花盆架', '讓小型垂吊植物沿牆生長。', 'feather', 31, 'starlight-mobile'),
    specialtyFixture('flower', 'watering-station', '園藝澆水工具站', '收好小水壺、噴霧器和園藝手套。', 'droplet', 30, 'flower-station'),
    specialtyFixture('flower', 'petal-lamp', '花瓣玻璃柔光燈', '投映像花瓣般柔和的燈影。', 'sun', 27, 'shell-lantern'),
    specialtyFixture('flower', 'floral-menu', '花語插畫畫框組', '用畫框介紹不同花束的花語。', 'image', 28, 'gallery-frames'),
    specialtyFixture('flower', 'arrangement-table', '迷你插花體驗桌', '為客人留一張體驗插花的小桌。', 'grid', 39, 'tasting-court'),
    specialtyFixture('flower', 'garden-seat', '花園休憩長椅', '讓客人坐在花香旁慢慢挑選。', 'heart', 33, 'wooden-bench'),
  ],
  book: [
    specialtyFixture('book', 'new-release-shelf', '本週新書推薦架', '展示本週剛上架的精選新書。', 'book-open', 36, 'book-carousel'),
    specialtyFixture('book', 'bookmark-case', '手作書籤收藏櫃', '陳列布藝、紙藝與壓花書籤。', 'gift', 29, 'gallery-frames'),
    specialtyFixture('book', 'reading-lamp', '暖光閱讀立燈', '照亮安靜閱讀的小角落。', 'sun', 28, 'garden-lights'),
    specialtyFixture('book', 'return-cart', '圖書歸還整理車', '把歸還書籍分類後送回書架。', 'book-open', 35, 'book-carousel'),
    specialtyFixture('book', 'quote-wall', '每日一句文字畫牆', '展示讓人停下來想一想的句子。', 'image', 30, 'gallery-frames'),
    specialtyFixture('book', 'author-table', '作家簽書小桌', '為新書分享和簽名活動預留位置。', 'edit-3', 38, 'tasting-court'),
    specialtyFixture('book', 'paper-goods-rack', '紙品與明信片層架', '陳列明信片、手帳與紙膠帶。', 'grid', 32, 'spice-display'),
    specialtyFixture('book', 'story-chair', '繪本故事閱讀椅', '為親子閱讀時光準備舒適座位。', 'heart', 36, 'wooden-bench'),
    specialtyFixture('book', 'book-mobile', '書頁星月吊飾', '以書頁和星月點綴閱讀空間。', 'moon', 25, 'starlight-mobile'),
    specialtyFixture('book', 'book-scent', '紙木香氣擴香角', '為書架旁添上淡淡紙木香。', 'wind', 31, 'aroma-diffuser'),
  ],
  toy: [
    specialtyFixture('toy', 'plush-wall', '毛絨玩偶展示牆', '把不同大小的玩偶排成一面笑臉牆。', 'gift', 36, 'gallery-frames'),
    specialtyFixture('toy', 'capsule-corner', '迷你扭蛋機集合台', '展示不同主題的扭蛋小機台。', 'circle', 40, 'capsule-machine'),
    specialtyFixture('toy', 'block-play-table', '彩色積木體驗桌', '讓客人現場拼出小小積木造型。', 'grid', 39, 'tasting-court'),
    specialtyFixture('toy', 'boardgame-shelf', '桌遊盒與卡牌展示架', '收納適合朋友同玩的桌遊與卡牌。', 'package', 34, 'spice-display'),
    specialtyFixture('toy', 'toy-car-track', '迷你玩具車軌道台', '讓小車沿著繽紛軌道繞一圈。', 'activity', 42, 'sculpture-plaza'),
    specialtyFixture('toy', 'mystery-boxes', '驚喜盲盒陳列櫃', '展示各種主題的收藏盲盒。', 'gift', 35, 'candy-display'),
    specialtyFixture('toy', 'prize-light', '玩具星光展示燈', '為人氣收藏玩具加上一圈柔光。', 'sun', 28, 'garden-lights'),
    specialtyFixture('toy', 'toy-sign', '歡樂玩具店霓虹牌', '以繽紛圖案迎接來逛店的小朋友。', 'zap', 30, 'neon-sign'),
    specialtyFixture('toy', 'plush-seat', '熊熊造型休息椅', '準備一張像玩偶般柔軟的小椅子。', 'heart', 37, 'wooden-bench'),
    specialtyFixture('toy', 'collectible-stand', '模型收藏旋轉展示台', '讓模型從不同角度都能被看見。', 'star', 34, 'sculpture-plaza'),
  ],
  chiikawa: [
    specialtyFixture('chiikawa', 'character-plush-wall', '吉伊卡哇角色玩偶展示牆', '依角色整理吉伊卡哇、小八、兔兔與朋友們的玩偶。', 'gift', 40, 'gallery-frames'),
    specialtyFixture('chiikawa', 'hachiware-glass-case', '小八貓藍白收藏玻璃櫃', '以清爽藍白色系展示小八貓主題收藏。', 'grid', 42, 'candy-display'),
    specialtyFixture('chiikawa', 'usagi-charm-carousel', '兔兔長耳吊飾旋轉台', '讓兔兔和朋友們的角色吊飾輪流亮相。', 'star', 38, 'sculpture-plaza'),
    specialtyFixture('chiikawa', 'character-sticker-rack', '角色貼紙與小卡展示架', '整齊陳列不同角色的貼紙和收藏卡。', 'image', 32, 'gallery-frames'),
    specialtyFixture('chiikawa', 'chiikawa-story-shelf', '吉伊卡哇漫畫繪本書架', '展示角色故事書與插畫小冊。', 'book-open', 36, 'book-carousel'),
    specialtyFixture('chiikawa', 'character-capsule-machine', '角色收藏扭蛋展示機', '把角色吊飾與迷你徽章放入驚喜扭蛋。', 'circle', 42, 'capsule-machine'),
    specialtyFixture('chiikawa', 'shisa-gift-display', '獅薩限定禮盒陳列櫃', '以溫暖橘色點綴角色禮盒與紀念品。', 'gift', 39, 'candy-display'),
    specialtyFixture('chiikawa', 'kurimanju-photo-frame', '栗子饅頭拍照打卡框', '用角色插畫相框記錄逛店時光。', 'camera', 34, 'rainbow-arch'),
    specialtyFixture('chiikawa', 'friendship-plush-bench', '角色好友毛絨休息椅', '讓玩偶收藏在柔軟座椅旁一起合照。', 'heart', 37, 'wooden-bench'),
    specialtyFixture('chiikawa', 'chiikawa-star-mobile', '星星角色吊飾展示牆', '用柔粉星星和角色吊飾裝飾店內。', 'moon', 30, 'starlight-mobile'),
  ],
  winnie: [
    specialtyFixture('winnie', 'honey-pot-showcase', '維尼蜂蜜罐玻璃展示櫃', '展示蜂蜜罐造型紀念品與森林小物。', 'gift', 42, 'candy-display'),
    specialtyFixture('winnie', 'hundred-acre-plush-shelf', '百畝森林毛絨玩偶木架', '排列維尼、小豬、跳跳虎和屹耳玩偶。', 'feather', 40, 'gallery-frames'),
    specialtyFixture('winnie', 'pooh-red-shirt-display', '維尼紅衣造型收藏展示台', '為經典紅衣熊造型安排主題展示位置。', 'star', 38, 'sculpture-plaza'),
    specialtyFixture('winnie', 'piglet-tigger-plush-case', '小豬與跳跳虎玩偶櫥窗', '展示粉紅小豬與橘色跳跳虎的森林夥伴造型。', 'heart', 41, 'candy-display'),
    specialtyFixture('winnie', 'forest-storybook-rack', '百畝森林故事繪本架', '陳列森林冒險繪本和角色故事小冊。', 'book-open', 36, 'book-carousel'),
    specialtyFixture('winnie', 'honey-gift-box-display', '蜂蜜罐禮盒分格櫃', '把蜂蜜罐、貼紙和小吊飾分類展示。', 'package', 39, 'spice-display'),
    specialtyFixture('winnie', 'acorn-capsule-machine', '森林橡果驚喜扭蛋機', '轉出橡果與森林夥伴主題的小收藏。', 'circle', 42, 'capsule-machine'),
    specialtyFixture('winnie', 'forest-tea-mug-rack', '森林蜂蜜杯與茶具架', '展示蜂蜜罐馬克杯和葉片圖案茶具。', 'coffee', 34, 'gallery-frames'),
    specialtyFixture('winnie', 'eeyore-blue-gift-case', '屹耳藍灰收藏禮盒櫃', '以藍灰色調陳列屹耳主題紀念品。', 'gift', 37, 'candy-display'),
    specialtyFixture('winnie', 'hundred-acre-lantern', '百畝森林蜂蜜暖燈', '為森林故事角落添上一盞蜂蜜色小燈。', 'sun', 30, 'garden-lights'),
  ],
  animalPajama: [
    specialtyFixture('animalPajama', 'onesie-wardrobe', '動物連身睡衣衣櫃', '按動物造型展示完整連身睡衣。', 'shopping-bag', 42, 'clothing-wardrobe'),
    specialtyFixture('animalPajama', 'bunny-ear-rack', '兔耳睡衣展示架', '陳列長耳兔兔與短耳兔兔睡衣。', 'heart', 36, 'clothing-rack'),
    specialtyFixture('animalPajama', 'bear-suit-display', '熊熊睡衣造型展示台', '展示柔軟熊耳帽與連身衣套裝。', 'gift', 38, 'dress-display'),
    specialtyFixture('animalPajama', 'animal-slipper-shelf', '動物腳套拖鞋架', '配搭連身睡衣的動物造型腳套。', 'grid', 31, 'gallery-frames'),
    specialtyFixture('animalPajama', 'fitting-curtain', '星月睡衣試穿簾幕', '留出舒適私密的睡衣試穿空間。', 'moon', 40, 'rainbow-arch'),
    specialtyFixture('animalPajama', 'pajama-fabric-case', '親膚睡衣布料展示櫃', '展示柔軟棉布與透氣絨料樣本。', 'feather', 34, 'candy-display'),
    specialtyFixture('animalPajama', 'sleep-cap-wall', '動物睡帽與眼罩牆', '以兔耳、貓耳睡帽搭配眼罩。', 'cloud', 29, 'gallery-frames'),
    specialtyFixture('animalPajama', 'cozy-lounge-bench', '雲朵睡衣休息椅', '讓客人試穿後坐下感受布料。', 'heart', 35, 'wooden-bench'),
    specialtyFixture('animalPajama', 'night-light', '月光晚安小夜燈', '以柔和月亮光點亮睡衣店角落。', 'sun', 27, 'garden-lights'),
    specialtyFixture('animalPajama', 'animal-pajama-sign', '動物夢鄉迎賓牌', '用星星和爪印迎接睡衣店客人。', 'star', 28, 'neon-sign'),
  ],
  laceFabric: [
    specialtyFixture('laceFabric', 'lace-swatch-wall', '蕾絲花色布卡展示牆', '排列蕾絲、網紗與棉布花樣布卡。', 'grid', 38, 'gallery-frames'),
    specialtyFixture('laceFabric', 'fabric-roll-rack', '柔紗緞布卷料架', '按顏色整理緞布、棉布和薄紗。', 'feather', 36, 'clothing-rack'),
    specialtyFixture('laceFabric', 'custom-measure-table', '訂製服裝量身工作台', '放置軟尺、打版紙與布料樣本。', 'edit-3', 44, 'craft-station'),
    specialtyFixture('laceFabric', 'sewing-machine-table', '花邊服裝縫製工作桌', '展示縫紉機、線軸與未完成的衣樣。', 'settings', 46, 'craft-station'),
    specialtyFixture('laceFabric', 'dress-preview-mirror', '訂製裙裝試搭全身鏡', '預覽布料與裙型搭配後的造型。', 'square', 40, 'dress-display'),
    specialtyFixture('laceFabric', 'pattern-drafting-board', '服裝紙樣打版板', '用原創剪裁紙樣規劃訂製服裝。', 'image', 33, 'gallery-frames'),
    specialtyFixture('laceFabric', 'button-and-ribbon-case', '鈕扣與緞帶配件櫃', '分類展示珍珠鈕扣、花邊和緞帶。', 'gift', 35, 'candy-display'),
    specialtyFixture('laceFabric', 'fitting-room', '柔粉蕾絲試衣間', '為客製服裝預留換裝和整理空間。', 'columns', 42, 'rainbow-arch'),
    specialtyFixture('laceFabric', 'finished-garment-rack', '訂製成衣掛架', '展示已完成的洋裝和上衣作品。', 'shopping-bag', 39, 'clothing-wardrobe'),
    specialtyFixture('laceFabric', 'atelier-lamp', '布料工房柔光燈', '照亮蕾絲紋理與細緻縫線。', 'sun', 28, 'garden-lights'),
  ],
  halloween: [
    specialtyFixture('halloween', 'pumpkin-costume-rack', '南瓜變裝服衣架', '展示柔和可愛的南瓜與魔法師服裝。', 'shopping-bag', 38, 'clothing-rack'),
    specialtyFixture('halloween', 'friendly-bat-mobile', '星星友善蝙蝠吊飾', '以微笑蝙蝠和小星星裝飾天花板。', 'moon', 29, 'starlight-mobile'),
    specialtyFixture('halloween', 'pumpkin-candy-case', '南瓜糖果分格展示櫃', '用南瓜小格收納節日糖果與貼紙。', 'gift', 40, 'candy-display'),
    specialtyFixture('halloween', 'witch-hat-carousel', '星月魔法帽旋轉架', '展示不同顏色的尖帽和緞帶。', 'star', 34, 'sculpture-plaza'),
    specialtyFixture('halloween', 'costume-fitting-mirror', '變裝造型試衣鏡', '從帽子到斗篷完整查看派對造型。', 'square', 39, 'dress-display'),
    specialtyFixture('halloween', 'ghost-plush-display', '微笑小幽靈玩偶架', '陳列不嚇人的幽靈和南瓜玩偶。', 'cloud', 36, 'gallery-frames'),
    specialtyFixture('halloween', 'trick-or-treat-basket', '不給糖就搗蛋禮物籃', '準備糖果袋和可愛變裝小禮物。', 'package', 33, 'colorful-planter'),
    specialtyFixture('halloween', 'moonlight-lantern', '萬聖節月光燈籠', '用柔和紫橘光營造魔法夜色。', 'sun', 28, 'shell-lantern'),
    specialtyFixture('halloween', 'spooky-story-frame', '奇幻夜故事畫框', '展示南瓜、月亮和小蝙蝠插畫。', 'image', 30, 'gallery-frames'),
    specialtyFixture('halloween', 'halloween-welcome-sign', '萬聖節星光招牌', '以星星與糖果圖案迎接節日來客。', 'zap', 31, 'neon-sign'),
  ],
  easter: [
    specialtyFixture('easter', 'painted-egg-display', '手繪彩蛋分格架', '以花朵、星星和彩點裝飾春日彩蛋。', 'gift', 35, 'candy-display'),
    specialtyFixture('easter', 'bunny-plush-shelf', '復活節兔兔玩偶層架', '展示不同耳朵與蝴蝶結的兔兔玩偶。', 'heart', 38, 'gallery-frames'),
    specialtyFixture('easter', 'spring-basket-table', '彩蛋花籃體驗桌', '用小花籃整理彩蛋和春日卡片。', 'package', 40, 'colorful-planter'),
    specialtyFixture('easter', 'ribbon-gift-wall', '春日緞帶禮物牆', '展示以柔色緞帶包裝的節日禮物。', 'feather', 32, 'gallery-frames'),
    specialtyFixture('easter', 'carrot-cookie-stand', '胡蘿蔔造型餅乾架', '陳列兔兔最喜歡的胡蘿蔔點心。', 'sun', 36, 'tasting-court'),
    specialtyFixture('easter', 'egg-painting-station', '復活節彩蛋彩繪台', '準備顏料、筆刷和待完成的彩蛋。', 'edit-3', 42, 'craft-station'),
    specialtyFixture('easter', 'flower-crown-display', '春日花冠展示架', '把小兔耳花冠和緞帶髮飾排好。', 'feather', 34, 'clothing-rack'),
    specialtyFixture('easter', 'garden-bunny-bench', '森林兔兔休息椅', '在花園背景旁放一張柔軟小椅。', 'heart', 36, 'wooden-bench'),
    specialtyFixture('easter', 'spring-window-lights', '春日彩蛋窗燈', '用柔粉和薄荷綠點亮森林小店。', 'sun', 27, 'garden-lights'),
    specialtyFixture('easter', 'easter-greeting-frame', '復活節祝福畫框', '以原創兔子和彩蛋插畫迎接春天。', 'image', 29, 'gallery-frames'),
  ],
  christmas: [
    specialtyFixture('christmas', 'ornament-display-tree', '星雪聖誕樹飾品架', '展示星星、雪花和小鈴鐺掛飾。', 'star', 40, 'starlight-mobile'),
    specialtyFixture('christmas', 'wrapped-gift-wall', '緞帶聖誕禮盒牆', '依顏色展示緞帶與節日禮盒。', 'gift', 42, 'gallery-frames'),
    specialtyFixture('christmas', 'stocking-rack', '雪花聖誕襪展示架', '掛上手繪圖案與小口袋聖誕襪。', 'package', 34, 'clothing-rack'),
    specialtyFixture('christmas', 'winter-scarf-wardrobe', '冬日圍巾與斗篷衣櫃', '收納保暖圍巾、斗篷和毛帽。', 'shopping-bag', 44, 'clothing-wardrobe'),
    specialtyFixture('christmas', 'snow-globe-table', '雪景水晶球展示桌', '擺放搖動後飄雪的迷你水晶球。', 'cloud', 38, 'sculpture-plaza'),
    specialtyFixture('christmas', 'cocoa-service-counter', '熱可可迎賓服務檯', '為客人準備可可杯與小餅乾。', 'coffee', 48, 'food-prep'),
    specialtyFixture('christmas', 'candy-cane-case', '糖果杖與糖果展示櫃', '收納彩色糖果杖與雪花糖果。', 'gift', 36, 'candy-display'),
    specialtyFixture('christmas', 'holiday-card-rack', '冬日賀卡與信封架', '陳列節日賀卡和手寫祝福紙品。', 'book-open', 30, 'book-carousel'),
    specialtyFixture('christmas', 'frosted-lamp', '霜雪窗邊暖燈', '在冰晶窗邊添上一盞蜂蜜色小燈。', 'sun', 28, 'garden-lights'),
    specialtyFixture('christmas', 'christmas-welcome-sign', '聖誕雪花招牌', '以雪花和星星迎接冬日來客。', 'zap', 31, 'neon-sign'),
  ],
  fruitMarket: [
    specialtyFixture('fruitMarket', 'seasonal-fruit-display', '當季鮮果分層展示櫃', '把不同顏色的水果分層陳列。', 'sun', 40, 'colorful-planter'),
    specialtyFixture('fruitMarket', 'citrus-crate-stack', '柑橘木箱陳列台', '整齊堆放橙子、檸檬與柚子。', 'package', 34, 'spice-display'),
    specialtyFixture('fruitMarket', 'berry-cold-case', '莓果鮮切冷藏櫃', '展示草莓、藍莓與水果杯。', 'droplet', 46, 'coral-aquarium'),
    specialtyFixture('fruitMarket', 'fruit-gift-wrap-table', '水果禮盒包裝桌', '準備紙盒、緞帶和手繪祝福卡。', 'gift', 38, 'craft-station'),
    specialtyFixture('fruitMarket', 'fresh-juice-press', '鮮果現榨小吧台', '用當季水果製作現榨果汁。', 'coffee', 52, 'tea-brewer'),
    specialtyFixture('fruitMarket', 'fruit-tasting-counter', '水果試吃小吧台', '準備新鮮切片讓客人試吃。', 'heart', 37, 'tasting-court'),
    specialtyFixture('fruitMarket', 'leafy-fruit-wall', '水果產地插畫牆', '用手繪地圖介紹水果產季與產地。', 'image', 29, 'gallery-frames'),
    specialtyFixture('fruitMarket', 'woven-fruit-basket-rack', '藤編水果籃展示架', '以不同大小的藤籃盛放水果。', 'grid', 33, 'gallery-frames'),
    specialtyFixture('fruitMarket', 'orchard-branch-lamp', '果園枝葉吊燈', '用葉片造型燈影增添果園氣氛。', 'sun', 27, 'garden-lights'),
    specialtyFixture('fruitMarket', 'fruit-market-seat', '果香小憩長椅', '讓客人坐下慢慢挑選水果。', 'heart', 32, 'wooden-bench'),
  ],
  chineseCuisine: [
    specialtyFixture('chineseCuisine', 'dim-sum-steamer', '港式點心蒸籠展示架', '展示蒸餃、包子、燒賣和蝦餃。', 'sun', 46, 'food-prep'),
    specialtyFixture('chineseCuisine', 'round-dining-table', '中式圓桌共食席', '用轉盤共享點心與家常菜餚。', 'grid', 48, 'tasting-court'),
    specialtyFixture('chineseCuisine', 'tea-and-porcelain-case', '茶具與青花瓷展示櫃', '陳列茶壺、茶杯和青花瓷小碟。', 'coffee', 38, 'gallery-frames'),
    specialtyFixture('chineseCuisine', 'noodle-broth-counter', '暖湯麵食備餐檯', '整理湯麵、青菜和每日湯底。', 'droplet', 44, 'food-prep'),
    specialtyFixture('chineseCuisine', 'dumpling-menu-board', '手作點心風味菜牌', '以插畫介紹不同蒸點與餃子餡料。', 'book-open', 30, 'gallery-frames'),
    specialtyFixture('chineseCuisine', 'chopstick-service-station', '筷子與餐巾服務台', '收好筷子、茶匙和餐巾。', 'package', 32, 'food-prep'),
    specialtyFixture('chineseCuisine', 'moon-window-lattice', '月下木格窗屏風', '以木格和月色營造安靜用餐角落。', 'columns', 40, 'rainbow-arch'),
    specialtyFixture('chineseCuisine', 'lantern-dining-mobile', '燈籠餐席吊飾', '在餐桌上方掛起柔亮小燈籠。', 'sun', 29, 'starlight-mobile'),
    specialtyFixture('chineseCuisine', 'family-banquette', '家常團圓長椅', '為家人朋友共食留出舒適座位。', 'heart', 38, 'wooden-bench'),
    specialtyFixture('chineseCuisine', 'chef-specials-frame', '主廚今日推薦畫框', '展示每日點心和時令菜色插畫。', 'image', 31, 'gallery-frames'),
  ],
  icecreamParlor: [
    specialtyFixture('icecreamParlor', 'gelato-flavor-case', '雪花口味玻璃冷凍櫃', '分格展示雪糕球、雪酪和季節口味。', 'droplet', 46, 'ice-cream-machine'),
    specialtyFixture('icecreamParlor', 'waffle-cone-holder', '現烤脆皮甜筒收納架', '放好剛烤好的甜筒與餅杯。', 'sun', 38, 'bakery-oven'),
    specialtyFixture('icecreamParlor', 'sundae-topping-bar', '彩果聖代配料吧台', '準備莓果、脆片和堅果配料。', 'package', 40, 'candy-display'),
    specialtyFixture('icecreamParlor', 'ice-pop-freezer', '水果冰棒直立冷凍櫃', '展示草莓、芒果與葡萄造型冰棒。', 'droplet', 44, 'ice-cream-machine'),
    specialtyFixture('icecreamParlor', 'gelato-menu-board', '手繪雪糕口味牌', '以插畫標出每日供應的雪糕口味。', 'image', 28, 'gallery-frames'),
    specialtyFixture('icecreamParlor', 'scoop-counter', '雪花雙球點餐櫃台', '為客人準備甜筒、雪糕球和小碟。', 'coffee', 48, 'food-prep'),
    specialtyFixture('icecreamParlor', 'snowflake-table', '雪花雙人分享桌', '安排座位一起分享冰淇淋聖代。', 'heart', 36, 'tasting-court'),
    specialtyFixture('icecreamParlor', 'mint-snow-lamp', '薄荷雪花吊燈', '用薄荷綠與冰藍光點亮店內。', 'sun', 29, 'garden-lights'),
    specialtyFixture('icecreamParlor', 'sprinkle-star-mobile', '糖針星星吊飾', '以彩色糖針和雪花點綴天花板。', 'star', 27, 'starlight-mobile'),
    specialtyFixture('icecreamParlor', 'cone-display-stand', '三角甜筒展示台', '把繽紛甜筒造型陳列成小冰塔。', 'package', 34, 'sculpture-plaza'),
  ],
  craft: [
    specialtyFixture('craft', 'pottery-wheel', '手作陶藝體驗轉盤', '留出一張桌面體驗捏陶和拉坯。', 'refresh-cw', 42, 'craft-station'),
    specialtyFixture('craft', 'yarn-wall', '彩線與毛線收納牆', '按色系排列編織用毛線和線軸。', 'grid', 34, 'spice-display'),
    specialtyFixture('craft', 'painting-easel', '水彩小畫架展示區', '展示正在完成的水彩與插畫。', 'image', 33, 'gallery-frames'),
    specialtyFixture('craft', 'tool-board', '手作工具分類板', '將剪刀、刻刀和量尺掛放整齊。', 'tool', 32, 'craft-station'),
    specialtyFixture('craft', 'ceramic-shelf', '釉彩陶器作品架', '陳列杯盤和小型手作陶器。', 'package', 36, 'gallery-frames'),
    specialtyFixture('craft', 'color-palette-table', '顏料調色體驗桌', '擺放顏料盤、畫筆與試色卡。', 'droplet', 38, 'tasting-court'),
    specialtyFixture('craft', 'woven-lamp', '編織藤線吊燈', '用手編藤線投下溫暖的光影。', 'sun', 30, 'shell-lantern'),
    specialtyFixture('craft', 'mini-kiln', '手作陶品迷你窯', '為小件陶作和釉彩作品準備窯爐。', 'sun', 44, 'bakery-oven'),
    specialtyFixture('craft', 'craft-kit-case', '手作材料工具展示櫃', '陳列刺繡線、珠子和小型工具包。', 'gift', 35, 'candy-display'),
    specialtyFixture('craft', 'artist-seat', '創作靈感休息長椅', '讓創作者坐下來整理新的靈感。', 'heart', 33, 'wooden-bench'),
  ],
  onsen: [
    specialtyFixture('onsen', 'sakura-partition', '櫻花木格屏風', '用木格與櫻花圖樣分隔泡湯休息區。', 'columns', 38, 'clothing-wardrobe'),
    specialtyFixture('onsen', 'stone-lantern', '湯宿石燈籠', '在暖湯旁點亮柔和的庭園燈影。', 'sun', 33, 'shell-lantern'),
    specialtyFixture('onsen', 'sakura-branch', '櫻花暖湯掛枝', '以粉色花枝裝飾溫泉小町的牆面。', 'feather', 28, 'colorful-planter'),
    specialtyFixture('onsen', 'bathhouse-noren', '暖湯入口布簾', '用櫻花紋布簾標示泡湯區入口。', 'image', 30, 'gallery-frames'),
    specialtyFixture('onsen', 'wooden-bucket-stand', '檜木澡桶與木杓架', '展示木桶、木杓和泡湯用品。', 'package', 32, 'spice-display'),
    specialtyFixture('onsen', 'footbath-bench', '足湯休息木椅', '讓客人坐著享受溫熱足湯時光。', 'heart', 36, 'wooden-bench'),
    specialtyFixture('onsen', 'bamboo-stool-set', '檜木浴椅與洗浴盆', '擺放傳統木浴椅和圓形洗浴盆。', 'grid', 34, 'tasting-court'),
    specialtyFixture('onsen', 'sakura-aroma-lamp', '櫻花蒸氣柔光燈', '把櫻花色光影映在暖湯木格上。', 'sun', 31, 'garden-lights'),
    specialtyFixture('onsen', 'onsen-menu-board', '湯屋泡湯禮儀牌', '以親切圖示介紹泡湯小提醒。', 'image', 25, 'neon-sign'),
    specialtyFixture('onsen', 'rain-chain-mobile', '湯煙竹簾風鈴', '讓竹簾和小鈴隨風輕輕搖曳。', 'wind', 27, 'starlight-mobile'),
  ],
  photoStudio: [
    specialtyFixture('photoStudio', 'flower-arch-set', '春日花拱人像布景', '以花拱門與柔粉帷幕拍攝春日人像。', 'feather', 42, 'rainbow-arch'),
    specialtyFixture('photoStudio', 'starlight-curtain', '星河夜景攝影幕', '在深藍星幕前拍下閃亮造型。', 'moon', 38, 'starlight-mobile'),
    specialtyFixture('photoStudio', 'palace-window-set', '古典宮廷窗景布景', '以金色拱窗和奶油色帷幕呈現典雅氛圍。', 'home', 45, 'gallery-frames'),
    specialtyFixture('photoStudio', 'seasonal-backdrop-wall', '四季花景背景牆', '把春櫻、夏花、秋葉與冬雪收進場景。', 'image', 39, 'gallery-frames'),
    specialtyFixture('photoStudio', 'portrait-dress-rack', '人像服飾造型衣架', '展示適合寫真的洋裝與套裝。', 'shopping-bag', 43, 'clothing-rack'),
    specialtyFixture('photoStudio', 'gown-mannequin', '星光禮服展示台', '以柔和聚光展示拍攝用禮服。', 'star', 44, 'dress-display'),
    specialtyFixture('photoStudio', 'posing-platform', '圓形人像拍攝台', '為全身造型拍攝留出明亮中心位置。', 'camera', 46, 'sculpture-plaza'),
    specialtyFixture('photoStudio', 'portrait-preview-gallery', '拍攝造型作品畫廊', '展示不同服飾與背景搭配的作品卡。', 'image', 34, 'gallery-frames'),
    specialtyFixture('photoStudio', 'softbox-light-stand', '雙側柔光燈架', '用兩側補光讓人物輪廓更柔和。', 'sun', 37, 'garden-lights'),
    specialtyFixture('photoStudio', 'velvet-waiting-bench', '試裝等候長椅', '讓客人整理服飾後再開始拍攝。', 'heart', 31, 'wooden-bench'),
  ],
};

function inferGeneralShopSpecialty(shopId = '', shopName = ''): GeneralShopSpecialty | undefined {
  const text = `${shopId} ${shopName}`;
  return generalSpecialtyPatterns.find(([, pattern]) => pattern.test(text))?.[0];
}

export type ShopInteriorSceneKey =
  | 'general' | 'cafe' | 'candy' | 'icecream' | 'bakery' | 'tea' | 'food' | 'private-club' | 'flower' | 'book' | 'toy' | 'craft'
  | 'chiikawa' | 'winnie' | 'animal-pajamas' | 'lace-fabric' | 'halloween' | 'easter' | 'christmas'
  | 'fruit-market' | 'chinese-restaurant' | 'icecream-parlor'
  | 'womenswear' | 'bridal' | 'eveningwear' | 'kimono' | 'supermarket' | 'hyakuen'
  | 'swimwear' | 'cosplay' | 'electronics' | 'boutique' | 'cosmetics' | 'photo-studio';

const GENERAL_SCENE_BY_SPECIALTY: Record<GeneralShopSpecialty, ShopInteriorSceneKey> = {
  cafe: 'cafe',
  candy: 'candy',
  icecream: 'icecream',
  bakery: 'bakery',
  tea: 'tea',
  food: 'food',
  privateClub: 'private-club',
  chiikawa: 'chiikawa',
  winnie: 'winnie',
  animalPajama: 'animal-pajamas',
  laceFabric: 'lace-fabric',
  halloween: 'halloween',
  easter: 'easter',
  christmas: 'christmas',
  fruitMarket: 'fruit-market',
  chineseCuisine: 'chinese-restaurant',
  icecreamParlor: 'icecream-parlor',
  flower: 'flower',
  book: 'book',
  toy: 'toy',
  craft: 'craft',
  onsen: 'kimono',
  photoStudio: 'photo-studio',
};

/** One shared illustrated room per shop type/specialty; names and placements remain store-specific. */
export function getShopInteriorSceneKey(
  shopType?: MallShopType,
  shopId?: string,
  shopName?: string,
): ShopInteriorSceneKey {
  const type = shopType ?? 'general';
  if (type !== 'general') return type;
  const specialty = inferGeneralShopSpecialty(shopId, shopName);
  return specialty ? GENERAL_SCENE_BY_SPECIALTY[specialty] : 'general';
}

function seedDecorations(type: MallShopType, seeds: DecorationSeed[], idPrefix: string): ShopInteriorDecoration[] {
  return seeds.map((seed) => option(
    type,
    `${idPrefix}-${seed.key}`,
    seed.name,
    seed.description,
    seed.icon,
    seed.price,
    seed.color,
    seed.visual,
    seed.limitedEdition,
    'equipment',
  ));
}

const specialtyEquipment = (type: MallShopType, specialty?: GeneralShopSpecialty) => {
  if (type === 'general') {
    return specialty
      ? seedDecorations(type, generalShopEquipment[specialty], `equipment-${specialty}`)
      : [];
  }
  return seedDecorations(type, shopEquipment[type], 'equipment');
};

const variantDecorations = (
  type: MallShopType,
  fixtureLimit?: number,
  themedFixtures?: DecorationFixture[],
): ShopInteriorDecoration[] => {
  const allFixtures = themedFixtures ?? (type === 'general' ? generalFixtures : shopFixtures[type]);
  const fixtures = fixtureLimit === undefined ? allFixtures : allFixtures.slice(0, fixtureLimit);
  return fixtures.flatMap((fixture) =>
    finishes[type].map((finish) =>
      option(
        type,
        `${fixture.key}-${finish.key}`,
        `${finish.name}・${fixture.name}`,
        `${fixture.description}${finish.description}的配色。`,
        fixture.icon,
        fixture.price + finish.priceExtra,
        finish.color,
        fixture.visual,
      ),
    ),
  );
};

const specialtyVariantDecorations = (specialty: GeneralShopSpecialty) =>
  variantDecorations('general', specialty === 'privateClub' ? 12 : 10, GENERAL_SPECIALTY_FIXTURES[specialty]);

const featureDecorations = (type: MallShopType): ShopInteriorDecoration[] =>
  (signatureDecorations[type] ?? []).map((seed) =>
    option(
      type,
      seed.key,
      seed.name,
      seed.description,
      seed.icon,
      seed.price,
      seed.color,
      seed.visual,
      seed.limitedEdition,
    ),
  );

const fluffyMarshmallowCafeStaff: ShopInteriorDecoration[] = DOG_STAFF_PROFILES.map((dog) =>
  option(
    'general',
    dog.key,
    `${dog.name}・${dog.breed}店員`,
    dog.description,
    dog.icon,
    dog.price,
    dog.color,
    dog.visual,
  ),
);

const fluffyCafeReplacedDecorationIds = new Set(
  specialtyVariantDecorations('cafe')
    .slice(-fluffyMarshmallowCafeStaff.length)
    .map(({ id }) => id),
);

const previousShopInteriorDecorations: Record<MallShopType, ShopInteriorDecoration[]> = {
  general: [...legacyDecorations.general, ...variantDecorations('general')],
  womenswear: [...legacyDecorations.womenswear, ...variantDecorations('womenswear'), ...featureDecorations('womenswear')],
  bridal: [...legacyDecorations.bridal, ...variantDecorations('bridal'), ...featureDecorations('bridal')],
  eveningwear: [...legacyDecorations.eveningwear, ...variantDecorations('eveningwear'), ...featureDecorations('eveningwear')],
  kimono: [...legacyDecorations.kimono, ...variantDecorations('kimono'), ...featureDecorations('kimono')],
  supermarket: [...legacyDecorations.supermarket, ...variantDecorations('supermarket'), ...featureDecorations('supermarket')],
  hyakuen: [...legacyDecorations.hyakuen, ...variantDecorations('hyakuen'), ...featureDecorations('hyakuen')],
  swimwear: [...legacyDecorations.swimwear, ...variantDecorations('swimwear'), ...featureDecorations('swimwear')],
  cosplay: [...legacyDecorations.cosplay, ...variantDecorations('cosplay'), ...featureDecorations('cosplay')],
  electronics: [...legacyDecorations.electronics, ...variantDecorations('electronics'), ...featureDecorations('electronics')],
  boutique: [...legacyDecorations.boutique, ...variantDecorations('boutique'), ...featureDecorations('boutique')],
  cosmetics: [...legacyDecorations.cosmetics, ...variantDecorations('cosmetics'), ...featureDecorations('cosmetics')],
};

export const SHOP_INTERIOR_DECORATIONS: Record<MallShopType, ShopInteriorDecoration[]> = {
  general: previousShopInteriorDecorations.general,
  womenswear: [...legacyDecorations.womenswear, ...variantDecorations('womenswear', 9), ...featureDecorations('womenswear'), ...specialtyEquipment('womenswear')],
  bridal: [...legacyDecorations.bridal, ...variantDecorations('bridal', 9), ...featureDecorations('bridal'), ...specialtyEquipment('bridal')],
  eveningwear: [...legacyDecorations.eveningwear, ...variantDecorations('eveningwear', 9), ...featureDecorations('eveningwear'), ...specialtyEquipment('eveningwear')],
  kimono: [...legacyDecorations.kimono, ...variantDecorations('kimono', 9), ...featureDecorations('kimono'), ...specialtyEquipment('kimono')],
  supermarket: [...legacyDecorations.supermarket, ...variantDecorations('supermarket', 9), ...featureDecorations('supermarket'), ...specialtyEquipment('supermarket')],
  hyakuen: [...legacyDecorations.hyakuen, ...variantDecorations('hyakuen', 9), ...featureDecorations('hyakuen'), ...specialtyEquipment('hyakuen')],
  swimwear: [...legacyDecorations.swimwear, ...variantDecorations('swimwear', 9), ...featureDecorations('swimwear'), ...specialtyEquipment('swimwear')],
  cosplay: [...legacyDecorations.cosplay, ...variantDecorations('cosplay', 9), ...featureDecorations('cosplay'), ...specialtyEquipment('cosplay')],
  electronics: [...legacyDecorations.electronics, ...variantDecorations('electronics', 9), ...featureDecorations('electronics'), ...specialtyEquipment('electronics')],
  boutique: [...legacyDecorations.boutique, ...variantDecorations('boutique', 9), ...featureDecorations('boutique'), ...specialtyEquipment('boutique')],
  cosmetics: [...legacyDecorations.cosmetics, ...variantDecorations('cosmetics', 9), ...featureDecorations('cosmetics'), ...specialtyEquipment('cosmetics')],
};

export const SHOP_INTERIOR_DECORATION_BY_ID = Object.fromEntries(
  [
    ...Object.values(previousShopInteriorDecorations).flat(),
    ...Object.values(SHOP_INTERIOR_DECORATIONS).flat(),
    ...Object.values(GENERAL_SPECIALTY_FIXTURES).flatMap((fixtures) =>
      variantDecorations('general', 10, fixtures),
    ),
    ...fluffyMarshmallowCafeStaff,
    ...Object.entries(generalShopEquipment).flatMap(([specialty, seeds]) =>
      seedDecorations('general', seeds, `equipment-${specialty}`),
    ),
  ].map((decoration) => [decoration.id, decoration]),
) as Record<string, ShopInteriorDecoration>;

export const SHOP_INTERIOR_DECORATION_IDS = Object.keys(SHOP_INTERIOR_DECORATION_BY_ID);

const SHOP_INTERIOR_STORE_SWATCHES = [
  c.candyPink,
  c.candyMint,
  c.candySky,
  c.candyLavender,
  c.candyPeach,
  c.candyLemon,
  c.candyCoral,
  c.candyRose,
  c.candyCaramel,
  c.candyCream,
  c.candyMintDark,
  c.candySkyDark,
  c.candyLavenderDark,
  c.candyCaramelDark,
];

const SHOP_INTERIOR_VISUAL_VARIANTS: Record<string, string[]> = {
  'spice-display': ['spice-display', 'candy-display', 'flower-station'],
  'candy-display': ['candy-display', 'spice-display', 'flower-station'],
  'flower-station': ['flower-station', 'colorful-planter', 'aroma-diffuser'],
  'colorful-planter': ['colorful-planter', 'flower-station', 'aroma-diffuser'],
  'garden-lights': ['garden-lights', 'shell-lantern', 'starlight-mobile'],
  'shell-lantern': ['shell-lantern', 'garden-lights', 'starlight-mobile'],
  'starlight-mobile': ['starlight-mobile', 'shell-lantern', 'neon-sign'],
  'neon-sign': ['neon-sign', 'gallery-frames', 'garden-lights'],
  'wooden-bench': ['wooden-bench', 'rest-pavilion', 'tasting-court'],
  'rest-pavilion': ['rest-pavilion', 'wooden-bench', 'tasting-court'],
  'tasting-court': ['tasting-court', 'craft-station', 'food-prep'],
  'craft-station': ['craft-station', 'food-prep', 'tasting-court'],
  'food-prep': ['food-prep', 'craft-station', 'tasting-court'],
  'clothing-rack': ['clothing-rack', 'clothing-wardrobe', 'dress-display'],
  'clothing-wardrobe': ['clothing-wardrobe', 'clothing-rack', 'dress-display'],
  'dress-display': ['dress-display', 'clothing-wardrobe', 'clothing-rack'],
  'book-carousel': ['book-carousel', 'gallery-frames', 'spice-display'],
  'capsule-machine': ['capsule-machine', 'candy-display', 'sculpture-plaza'],
};

function stableStoreHash(value: string): number {
  let hash = 2166136261;
  for (const character of value) {
    hash ^= character.codePointAt(0) ?? 0;
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function createStoreSpecificDecorations(
  decorations: ShopInteriorDecoration[],
  shopId: string,
  shopName: string,
): ShopInteriorDecoration[] {
  const hash = stableStoreHash(shopId);
  const slug = shopId.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'store';
  const namespace = `store-${slug}-${hash.toString(36)}`;
  const storeLabel = shopName.trim() || '特色商店';

  return decorations.map((decoration) => {
    // Dog attendant IDs are consumed by the cafe's separate walking/interaction system.
    if (decoration.id.startsWith('general-fluffy-staff-')) return decoration;

    const id = `${namespace}-${decoration.id}`;
    const variants = decoration.visual
      ? SHOP_INTERIOR_VISUAL_VARIANTS[decoration.visual]
      : undefined;
    const colorVariant = stableStoreHash(`${shopId}:${decoration.id}:color`) % SHOP_INTERIOR_STORE_SWATCHES.length;
    const visualVariant = variants
      ? stableStoreHash(`${shopId}:${decoration.id}:visual`) % variants.length
      : 0;
    const personalized: ShopInteriorDecoration = {
      ...decoration,
      id,
      name: `${storeLabel}專屬・${decoration.name}`,
      description: `${storeLabel}限定款。${decoration.description}`,
      color: SHOP_INTERIOR_STORE_SWATCHES[colorVariant],
      visual: variants?.[visualVariant] ?? decoration.visual,
    };
    SHOP_INTERIOR_DECORATION_BY_ID[id] = personalized;
    return personalized;
  });
}

export function getShopInteriorDecorations(
  shopType?: MallShopType,
  shopId?: string,
  shopName?: string,
  ownedDecorationIds: string[] = [],
): ShopInteriorDecoration[] {
  const type = shopType ?? 'general';
  const specialty = type === 'general' ? inferGeneralShopSpecialty(shopId, shopName) : undefined;
  const active = type === 'general' && specialty
    ? [
      ...(specialty === 'privateClub' ? [] : legacyDecorations.general),
      ...specialtyVariantDecorations(specialty),
      ...specialtyEquipment('general', specialty),
    ]
    : SHOP_INTERIOR_DECORATIONS[type];
  const shopActive = shopId === 'fluffy-marshmallow-cafe' && specialty === 'cafe'
    ? [
      ...active.filter(({ id }) => !fluffyCafeReplacedDecorationIds.has(id)),
      ...fluffyMarshmallowCafeStaff,
    ]
    : active;
  const personalized = shopId
    ? createStoreSpecificDecorations(shopActive, shopId, shopName ?? getShopTypeLabel(type))
    : shopActive;
  const activeIds = new Set(personalized.map(({ id }) => id));
  const ownedLegacy = ownedDecorationIds
    .filter((id) => !activeIds.has(id))
    .map((id) => SHOP_INTERIOR_DECORATION_BY_ID[id])
    .filter((decoration): decoration is ShopInteriorDecoration => !!decoration);
  return [...personalized, ...ownedLegacy];
}

export function getShopTypeLabel(shopType?: MallShopType, shopId?: string): string {
  if (shopId === 'saint-edward-west-castle-restaurant') return '私人會所餐廳';
  if (shopId === 'portrait-photo-studio') return '寫真館';
  if (shopId === 'chiikawa-land') return 'Chiikawa專賣店';
  if (shopId === 'winnie-hundred-acre-wood') return '小熊維尼專賣店';
  const specialStoreLabels: Record<string, string> = {
    'animal-pajama-boutique': '動物連身睡衣店',
    'lace-fabric-studio': '蕾絲布料訂製店',
    'halloween-magic-boutique': '萬聖節主題店',
    'easter-bunny-egg-shop': '復活節主題店',
    'christmas-snowflake-gifts': '聖誕節主題店',
    'fresh-fruit-market': '水果專賣店',
    'moonlit-chinese-restaurant': '中菜館',
    'snowflake-icecream-parlor': '雪糕專賣店',
  };
  if (shopId && specialStoreLabels[shopId]) return specialStoreLabels[shopId];
  const labels: Record<MallShopType, string> = {
    general: '特色商店',
    womenswear: '女裝店',
    bridal: '婚紗店',
    eveningwear: '晚禮服店',
    kimono: '和服店',
    supermarket: '超市',
    hyakuen: '日本百元店',
    swimwear: '泳衣店',
    cosplay: 'Cosplay服裝店',
    electronics: '電器店',
    boutique: '精品店',
  cosmetics: '化妝品店',
  };
  return labels[shopType ?? 'general'];
}
