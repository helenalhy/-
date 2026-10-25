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
  visual?: string;
  limitedEdition?: boolean;
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
  visual?: string,
  limitedEdition = false,
): ShopInteriorDecoration => ({
  id: `${type}-${key}`,
  name,
  description,
  icon,
  price,
  color,
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
};

const variantDecorations = (type: MallShopType): ShopInteriorDecoration[] => {
  const fixtures = type === 'general' ? generalFixtures : shopFixtures[type];
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

export const SHOP_INTERIOR_DECORATIONS: Record<MallShopType, ShopInteriorDecoration[]> = {
  general: [...legacyDecorations.general, ...variantDecorations('general')],
  womenswear: [...legacyDecorations.womenswear, ...variantDecorations('womenswear'), ...featureDecorations('womenswear')],
  bridal: [...legacyDecorations.bridal, ...variantDecorations('bridal'), ...featureDecorations('bridal')],
  eveningwear: [...legacyDecorations.eveningwear, ...variantDecorations('eveningwear'), ...featureDecorations('eveningwear')],
  kimono: [...legacyDecorations.kimono, ...variantDecorations('kimono'), ...featureDecorations('kimono')],
  supermarket: [...legacyDecorations.supermarket, ...variantDecorations('supermarket'), ...featureDecorations('supermarket')],
  hyakuen: [...legacyDecorations.hyakuen, ...variantDecorations('hyakuen'), ...featureDecorations('hyakuen')],
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
