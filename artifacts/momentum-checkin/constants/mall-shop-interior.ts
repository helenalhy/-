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
    { key: 'swim-suit-wardrobe', name: '連身泳衣衣櫃', description: '按顏色收納連身泳衣和運動泳裝。', icon: 'shopping-bag', price: 38, visual: 'clothing-wardrobe' },
    { key: 'bikini-rack', name: '比基尼分層衣架', description: '展示不同剪裁和色彩的比基尼。', icon: 'shopping-bag', price: 36, visual: 'clothing-rack' },
    { key: 'rash-guard-wall', name: '防曬上衣展示牆', description: '陳列輕薄防曬上衣和水母衣。', icon: 'grid', price: 33, visual: 'clothing-rack' },
    { key: 'beach-dress-display', name: '海灘洋裝模特台', description: '展示泳裝外搭和度假洋裝。', icon: 'user', price: 38, visual: 'dress-display' },
    { key: 'swim-short-shelf', name: '泳褲與沙灘短褲架', description: '把不同長度的泳褲整齊展示。', icon: 'shopping-bag', price: 30, visual: 'clothing-rack' },
    { key: 'sunscreen-counter', name: '防曬用品小櫃台', description: '收納防曬乳、護唇膏和海邊用品。', icon: 'sun', price: 29, visual: 'spice-display' },
    { key: 'beach-towel-rack', name: '海灘毛巾掛架', description: '把柔軟的大浴巾掛在入口旁。', icon: 'grid', price: 26, visual: 'clothing-rack' },
    { key: 'float-ring-display', name: '彩色泳圈展示架', description: '展示適合戲水的繽紛泳圈。', icon: 'circle', price: 34, visual: 'coral-aquarium' },
    { key: 'sandals-shelf', name: '沙灘涼鞋展示台', description: '陳列舒適的涼鞋和水鞋。', icon: 'grid', price: 28, visual: 'sculpture-plaza' },
    { key: 'shell-accessory-case', name: '貝殼泳裝配件櫃', description: '展示髮夾、太陽眼鏡和海洋飾品。', icon: 'gift', price: 35, visual: 'gallery-frames' },
  ],
  cosplay: [
    { key: 'hero-costume-wardrobe', name: '英雄角色服裝衣櫃', description: '收納制服、披風和成套角色服。', icon: 'shopping-bag', price: 44, visual: 'clothing-wardrobe' },
    { key: 'fantasy-costume-rack', name: '奇幻服裝衣架', description: '展示魔法師、騎士和精靈造型。', icon: 'shopping-bag', price: 40, visual: 'clothing-rack' },
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
    { key: 'limited-moonlit-swimsuit', name: '限定款・月光珍珠泳衣', description: '以月光與珍珠色設計的收藏款泳衣。', icon: 'shopping-bag', price: 82, color: c.candySky, visual: 'dress-display', limitedEdition: true },
    { key: 'limited-sunset-coverup', name: '限定款・夕陽薄紗罩衫', description: '夕陽配色的輕柔沙灘罩衫。', icon: 'shopping-bag', price: 78, color: c.candyCoral, visual: 'clothing-rack', limitedEdition: true },
    { key: 'shell-bikini-display', name: '貝殼刺繡比基尼展示台', description: '用貝殼小刺繡點綴的泳裝造型。', icon: 'user', price: 56, color: c.candyPeach, visual: 'dress-display' },
    { key: 'tropical-surf-set', name: '熱帶浪花泳裝套組', description: '展示泳衣、防曬衣和海灘短褲。', icon: 'shopping-bag', price: 60, color: c.candyMint, visual: 'clothing-wardrobe' },
  ],
  cosplay: [
    { key: 'limited-starlight-magician', name: '限定款・星月魔法師套裝', description: '星月刺繡與披風組成的限定角色服。', icon: 'shopping-bag', price: 88, color: c.candyLavender, visual: 'clothing-wardrobe', limitedEdition: true },
    { key: 'limited-galaxy-armor', name: '限定款・銀河機甲Cosplay裝', description: '帶有銀河配色的收藏版機甲造型。', icon: 'user', price: 92, color: c.candySky, visual: 'dress-display', limitedEdition: true },
    { key: 'fairy-wing-costume', name: '夢幻精靈翅膀套裝', description: '搭配薄紗翅膀的精靈角色服。', icon: 'feather', price: 64, color: c.candyPink, visual: 'clothing-wardrobe' },
    { key: 'hero-cape-collection', name: '英雄披風收藏架', description: '展示不同配色的角色披風。', icon: 'shopping-bag', price: 58, color: c.candyCoral, visual: 'clothing-rack' },
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
  swimwear: [...legacyDecorations.swimwear, ...variantDecorations('swimwear'), ...featureDecorations('swimwear')],
  cosplay: [...legacyDecorations.cosplay, ...variantDecorations('cosplay'), ...featureDecorations('cosplay')],
  electronics: [...legacyDecorations.electronics, ...variantDecorations('electronics'), ...featureDecorations('electronics')],
  boutique: [...legacyDecorations.boutique, ...variantDecorations('boutique'), ...featureDecorations('boutique')],
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
    swimwear: '泳衣店',
    cosplay: 'Cosplay服裝店',
    electronics: '電器店',
    boutique: '精品店',
  };
  return labels[shopType ?? 'general'];
}
