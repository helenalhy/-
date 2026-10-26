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
  itemKind?: 'equipment' | 'decoration';
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
  | 'craft';

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
  craft: [
    { key: 'craft-workbench', name: '手作材料工作台', description: '準備剪刀、布料和各種創作材料。', icon: 'tool', price: 50, color: c.candyPeach, visual: 'craft-station' },
    { key: 'mini-kiln', name: '糖果色迷你窯爐', description: '為陶作和小型工藝提供燒製空間。', icon: 'sun', price: 62, color: c.candyCoral, visual: 'bakery-oven' },
    { key: 'sewing-machine', name: '桌上型縫紉機', description: '縫製布藝、玩偶衣服和小型手作。', icon: 'settings', price: 54, color: c.candyMint, visual: 'sewing-machine' },
    { key: 'display-turntable', name: '手作品旋轉展示台', description: '轉動展示剛完成的獨一無二作品。', icon: 'star', price: 42, color: c.candyLavender, visual: 'sculpture-plaza' },
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
};

const generalSpecialtyPatterns: [GeneralShopSpecialty, RegExp][] = [
  ['cafe', /咖啡|coffee|cafe|烘豆/i],
  ['candy', /糖果|軟糖|棉花糖|彩糖|糖藝|糖霜/i],
  ['icecream', /雪糕|冰淇淋|冰棒|冰沙|gelato/i],
  ['bakery', /烘焙|麵包|曲奇|餅乾|甜甜圈|鬆餅|布丁|馬卡龍|巧克力|甜點|甜品|果塔/i],
  ['tea', /奶茶|茶|汽水|飲品|飲料|smoothie|冰飲/i],
  ['food', /食堂|食館|小食|飯糰|咖喱|咖哩|披薩|意粉|可麗餅|捲餅|起司|香料|料理|餐/i],
  ['flower', /花|植物|園藝|苗圃|盆栽|花藝/i],
  ['book', /書|文具|手帳|紙品|明信片|繪本|漫畫|雜誌/i],
  ['toy', /扭蛋|玩偶|玩具|遊戲|模型|積木|卡牌|街機/i],
  ['craft', /工房|工藝|陶|畫室|畫作|手作|編織|刺繡|玻璃|皮革/i],
];

function inferGeneralShopSpecialty(shopId = '', shopName = ''): GeneralShopSpecialty | undefined {
  const text = `${shopId} ${shopName}`;
  return generalSpecialtyPatterns.find(([, pattern]) => pattern.test(text))?.[0];
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

const variantDecorations = (type: MallShopType, fixtureLimit?: number): ShopInteriorDecoration[] => {
  const allFixtures = type === 'general' ? generalFixtures : shopFixtures[type];
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

const fluffyMarshmallowCafeStaff: ShopInteriorDecoration[] = [
  option('general', 'fluffy-staff-huahua', '花花・淺啡色博美店員', '淺啡色博美花花會在店裡熱情迎接每位客人。', 'heart', 80, c.candyPeach, 'dog-staff-huahua'),
  option('general', 'fluffy-staff-milkshake', '奶昔・白色博美店員', '白色博美奶昔會陪客人挑選蓬鬆的棉花糖。', 'coffee', 80, c.candyCream, 'dog-staff-milkshake'),
  option('general', 'fluffy-staff-xiaoniu', '小牛・黑白色邊牧店員', '黑白邊境牧羊犬小牛會精神奕奕地照看店內。', 'star', 95, c.candyMint, 'dog-staff-xiaoniu'),
  option('general', 'fluffy-staff-pudding', '布丁・黃金獵犬寶寶店員', '黃金獵犬寶寶布丁用暖暖的笑容陪伴客人。', 'gift', 90, c.candyLemon, 'dog-staff-pudding'),
];

const fluffyCafeReplacedDecorationIds = new Set(
  variantDecorations('general', 10)
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
};

export const SHOP_INTERIOR_DECORATION_BY_ID = Object.fromEntries(
  [
    ...Object.values(previousShopInteriorDecorations).flat(),
    ...Object.values(SHOP_INTERIOR_DECORATIONS).flat(),
    ...fluffyMarshmallowCafeStaff,
    ...Object.entries(generalShopEquipment).flatMap(([specialty, seeds]) =>
      seedDecorations('general', seeds, `equipment-${specialty}`),
    ),
  ].map((decoration) => [decoration.id, decoration]),
) as Record<string, ShopInteriorDecoration>;

export const SHOP_INTERIOR_DECORATION_IDS = Object.keys(SHOP_INTERIOR_DECORATION_BY_ID);
export const SHOP_INTERIOR_SLOT_IDS = SHOP_INTERIOR_SLOTS.map(({ id }) => id);

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
      ...legacyDecorations.general,
      ...variantDecorations('general', 10),
      ...specialtyEquipment('general', specialty),
    ]
    : SHOP_INTERIOR_DECORATIONS[type];
  const shopActive = shopId === 'fluffy-marshmallow-cafe' && specialty === 'cafe'
    ? [
      ...active.filter(({ id }) => !fluffyCafeReplacedDecorationIds.has(id)),
      ...fluffyMarshmallowCafeStaff,
    ]
    : active;
  const activeIds = new Set(shopActive.map(({ id }) => id));
  const ownedLegacy = ownedDecorationIds
    .filter((id) => !activeIds.has(id))
    .map((id) => SHOP_INTERIOR_DECORATION_BY_ID[id])
    .filter((decoration): decoration is ShopInteriorDecoration => !!decoration);
  return [...shopActive, ...ownedLegacy];
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
    swimwear: '泳衣店',
    cosplay: 'Cosplay服裝店',
    electronics: '電器店',
    boutique: '精品店',
  };
  return labels[shopType ?? 'general'];
}
