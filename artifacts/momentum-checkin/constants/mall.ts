import type { ImageSourcePropType } from 'react-native';
import type { RewardCategory } from '@/context/HabitsContext';
import palette from './colors';
import { createExpandedItems } from './mall-expansion';

const c = palette.light;

export interface MallItem {
  id: string;
  floor: number;
  name: string;
  description: string;
  icon: string;
  color: string;
  category: RewardCategory;
  price: number;
  /** Legacy compatibility field; redemptions now use earned coins only. */
  ticketCost: number;
  shopType?: MallShopType;
  visual?: 'cloud-walk' | 'central-fountain' | 'wooden-bench' | 'garden-lights' | 'colorful-planter' | 'rest-pavilion' | 'coral-aquarium' | 'rhythm-stage' | 'yoga-deck' | 'sculpture-plaza' | 'observatory-dome' | 'tasting-court' | 'cloud-swing' | 'shell-lantern' | 'neon-sign' | 'aroma-diffuser' | 'gallery-frames' | 'starlight-mobile' | 'spice-display' | 'rainbow-arch';
}

export type MallShopType =
  | 'general'
  | 'womenswear'
  | 'bridal'
  | 'eveningwear'
  | 'kimono'
  | 'supermarket'
  | 'hyakuen'
  | 'swimwear'
  | 'cosplay'
  | 'electronics'
  | 'boutique';

export interface MallFloorTheme {
  title: string;
  description: string;
  image: ImageSourcePropType;
  accent: string;
  surface: string;
}

export const MALL_FLOORS: MallFloorTheme[] = [
  { title: '糖果迎賓街', description: '暖陽、咖啡與柔和燈光，從這裡開始一天。', image: require('../assets/images/mall-floor.png'), accent: c.primary, surface: c.candyPink },
  { title: '森林花園', description: '走進綠意與花香，讓每個小目標開花。', image: require('../assets/images/mall-floor-2.jpg'), accent: c.candyMintDark, surface: c.candyMint },
  { title: '慢讀書廊', description: '書香、流水和安靜座位，留一點時間給自己。', image: require('../assets/images/mall-floor-3.jpg'), accent: c.candyLavenderDark, surface: c.candyLavender },
  { title: '海洋奇遇', description: '在水光與珊瑚之間，收集今天的新發現。', image: require('../assets/images/mall-floor-4.jpg'), accent: c.candySkyDark, surface: c.candySky },
  { title: '像素遊樂城', description: '霓虹、節奏與遊戲，把努力變成快樂。', image: require('../assets/images/mall-floor-5.jpg'), accent: c.candyLavenderDark, surface: c.candyLavender },
  { title: '雲朵療癒館', description: '放慢呼吸，用舒服的空間照顧自己。', image: require('../assets/images/mall-floor-6.jpg'), accent: c.candyMintDark, surface: c.candyPeach },
  { title: '彩虹藝術廊', description: '用顏色、雕塑和畫作記錄每一份靈感。', image: require('../assets/images/mall-floor-7.jpg'), accent: c.candyRoseDark, surface: c.candyCoral },
  { title: '星際觀測站', description: '仰望星空，讓小小進步走向更遠的地方。', image: require('../assets/images/mall-floor-8.jpg'), accent: c.candyLavenderDark, surface: c.candyLavender },
  { title: '世界美食集', description: '用暖暖的香氣，慶祝認真生活的自己。', image: require('../assets/images/mall-floor-9.jpg'), accent: c.candyCaramelDark, surface: c.candyLemon },
  { title: '天空花園', description: '來到雲端，在彩虹和城市風景中休息。', image: require('../assets/images/mall-floor-10.jpg'), accent: c.candySkyDark, surface: c.candySky },
];

function item(floor: number, id: string, name: string, description: string, icon: string, category: RewardCategory, price: number, _legacyTicketCost: number, color: string, visual?: MallItem['visual'], shopType?: MallShopType): MallItem {
  return { floor, id, name, description, icon, category, price, ticketCost: 0, color, visual, shopType };
}

// Existing IDs and prices remain stable so previous purchases keep their identity.
export const MALL_ITEMS: MallItem[] = [
  item(1, 'sunny-cafe', '暖陽咖啡館', '迎賓街的一杯暖暖咖啡', 'coffee', 'shop', 45, 1, c.candyPeach),
  item(1, 'cloud-walk', '雲朵步道', '柔和的小路，連接每天的努力', 'activity', 'facility', 30, 1, c.candyMint),
  item(1, 'garden-lights', '花園路燈', '為迎賓街點起溫柔燈光', 'sun', 'decor', 20, 1, c.candyLemon),
  item(2, 'flower-shop', '花花日常', '把森林街角變成一束花', 'feather', 'shop', 55, 1, c.candyPink),
  item(2, 'rest-pavilion', '林間休息亭', '在綠意之間，坐下休息一會', 'home', 'facility', 80, 3, c.candyLavender),
  item(2, 'colorful-planter', '彩色花圃', '讓森林花園長出新的色彩', 'sunrise', 'decor', 35, 2, c.candyCoral),
  item(3, 'little-bookshop', '慢讀書屋', '一間可以待上一整個下午的店', 'book-open', 'shop', 70, 2, c.candySky),
  item(3, 'central-fountain', '中央噴泉', '陪伴閱讀的細細流水聲', 'droplet', 'facility', 55, 2, c.candySky),
  item(3, 'wooden-bench', '木製長椅', '帶一本書，在這裡坐坐', 'minus', 'decor', 25, 1, c.candyPeach),
  item(4, 'ocean-treasures', '海洋寶物舖', '收藏貝殼與藍色的小驚喜', 'anchor', 'shop', 75, 2, c.candySky),
  item(4, 'coral-aquarium', '珊瑚水族缸', '一座會發光的海底小世界', 'droplet', 'facility', 60, 2, c.candySky),
  item(4, 'shell-lantern', '貝殼燈飾', '把海面的光留在商場裡', 'sun', 'decor', 30, 1, c.candyPeach),
  item(5, 'pixel-arcade', '像素遊戲屋', '把今日的努力換成一場遊戲', 'cpu', 'shop', 80, 2, c.candyLavender),
  item(5, 'rhythm-stage', '節奏舞台', '站上舞台，為自己鼓掌', 'music', 'facility', 60, 2, c.candyPink),
  item(5, 'neon-sign', '霓虹招牌', '一束專屬你的快樂電光', 'zap', 'decor', 30, 1, c.candyCoral),
  item(6, 'cloud-spa', '雲朵香氛館', '用喜歡的香氣慢慢放鬆', 'heart', 'shop', 90, 2, c.candyPeach),
  item(6, 'yoga-deck', '呼吸瑜伽台', '留一個位置，安靜伸展', 'target', 'facility', 65, 2, c.candyMint),
  item(6, 'aroma-diffuser', '香薰擴香器', '讓療癒的氣息輕輕散開', 'wind', 'decor', 35, 1, c.candyLavender),
  item(7, 'color-atelier', '彩虹畫室', '讓腦海中的顏色成為作品', 'edit-2', 'shop', 100, 2, c.candyCoral),
  item(7, 'sculpture-plaza', '靈感雕塑台', '為每天的創意搭一座展台', 'hexagon', 'facility', 70, 2, c.candyLavender),
  item(7, 'gallery-frames', '繽紛畫框牆', '把努力裝進漂亮的畫框', 'image', 'decor', 40, 1, c.candyPink),
  item(8, 'orbit-shop', '星球紀念店', '把星空的小禮物帶回家', 'star', 'shop', 120, 3, c.candyLavender),
  item(8, 'observatory-dome', '星空望遠鏡', '尋找下一顆想抵達的星星', 'compass', 'facility', 90, 3, c.candySky),
  item(8, 'starlight-mobile', '星月吊飾', '讓月亮和星星陪你前進', 'moon', 'decor', 45, 2, c.candyLemon),
  item(9, 'world-kitchen', '環球小食堂', '一餐小小的慶祝，也很重要', 'coffee', 'shop', 110, 3, c.candyPeach),
  item(9, 'tasting-court', '共享餐桌', '好好坐下來，享受生活', 'grid', 'facility', 80, 2, c.candyCaramel),
  item(9, 'spice-display', '香料展示架', '用世界各地的香氣裝點美食街', 'package', 'decor', 40, 1, c.candyCoral),
  item(10, 'skyline-tea', '雲端茶屋', '在城市最高處喝一杯茶', 'feather', 'shop', 150, 3, c.candyMint),
  item(10, 'cloud-swing', '天空鞦韆', '輕輕擺動，看雲慢慢走過', 'anchor', 'facility', 100, 3, c.candySky),
  item(10, 'rainbow-arch', '彩虹拱門', '為走到這裡的自己留一道彩虹', 'sunrise', 'decor', 50, 2, c.candyPink),
  item(1, 'strawberry-bakery', '草莓烘焙屋', '剛出爐的甜香，為今天加一點糖', 'heart', 'shop', 40, 1, c.candyPink),
  item(1, 'candy-gift-shop', '糖果禮物店', '把小小心意包裝成驚喜', 'gift', 'shop', 50, 1, c.candyLavender),
  item(1, 'cream-pavilion', '奶油休息亭', '像奶油蛋糕一樣柔和的歇腳處', 'home', 'facility', 45, 1, c.candyPeach, 'rest-pavilion'),
  item(1, 'pink-fountain', '粉紅許願泉', '讓每個小願望泛起漣漪', 'droplet', 'facility', 50, 2, c.candyPink, 'central-fountain'),
  item(1, 'welcome-flowers', '迎賓花盆', '在入口放一束今天喜歡的花', 'sunrise', 'decor', 15, 1, c.candyPink, 'colorful-planter'),
  item(1, 'sweet-window-art', '糖霜小畫框', '用甜甜的色彩點綴迎賓街', 'image', 'decor', 25, 1, c.candyPeach, 'gallery-frames'),
  item(2, 'seedling-shop', '小苗植物店', '選一株植物，陪自己慢慢成長', 'feather', 'shop', 45, 1, c.candyMint),
  item(2, 'herbal-tea-shop', '森林花草茶', '把草木香氣泡進一杯熱茶', 'coffee', 'shop', 65, 2, c.candyLemon),
  item(2, 'garden-swing', '藤蔓鞦韆', '在葉影之間，輕輕盪一會', 'anchor', 'facility', 65, 2, c.candyMint, 'cloud-swing'),
  item(2, 'moss-trail', '青苔石板路', '一步一步，走進自己的小森林', 'activity', 'facility', 35, 1, c.candyMint, 'cloud-walk'),
  item(2, 'firefly-lamp', '螢火小夜燈', '像林間螢火一樣的溫柔光點', 'sun', 'decor', 25, 1, c.candyLemon, 'garden-lights'),
  item(2, 'forest-bench', '花園木椅', '聞著花香，慢慢整理心情', 'minus', 'decor', 30, 1, c.candyMint, 'wooden-bench'),
  item(3, 'stationery-shop', '紙間文具舖', '挑一支喜歡的筆，寫下新目標', 'edit-3', 'shop', 55, 1, c.candyLavender),
  item(3, 'reading-tea-room', '書香茶室', '翻一頁書，再喝一口暖茶', 'coffee', 'shop', 80, 2, c.candyPeach),
  item(3, 'reading-gazebo', '靜讀小亭', '為專心閱讀留一個安靜角落', 'home', 'facility', 65, 2, c.candyLavender, 'rest-pavilion'),
  item(3, 'study-table', '共讀書桌', '和朋友一起閱讀，也是一種陪伴', 'book-open', 'facility', 50, 1, c.candyCaramel, 'tasting-court'),
  item(3, 'reading-lamp', '暖光閱讀燈', '照亮還沒讀完的那一頁', 'sun', 'decor', 20, 1, c.candyLemon, 'garden-lights'),
  item(3, 'literary-frames', '詩句畫框', '把喜歡的文字留在身邊', 'image', 'decor', 30, 1, c.candySky, 'gallery-frames'),
  item(4, 'shell-jewelry', '貝殼飾品店', '收藏來自海邊的閃亮小物', 'disc', 'shop', 65, 2, c.candyPeach),
  item(4, 'blue-soda-shop', '藍海汽水吧', '一杯清爽的藍色假期', 'coffee', 'shop', 55, 1, c.candySky),
  item(4, 'tide-fountain', '潮汐噴泉', '看水花像海浪一樣輕輕起伏', 'droplet', 'facility', 70, 2, c.candySky, 'central-fountain'),
  item(4, 'ocean-rest-deck', '海風休息台', '在水光旁邊做一次深呼吸', 'wind', 'facility', 45, 1, c.candySky, 'yoga-deck'),
  item(4, 'coral-planter', '珊瑚色花盆', '讓海洋街角多一點暖色', 'feather', 'decor', 25, 1, c.candyCoral, 'colorful-planter'),
  item(4, 'pearl-mobile', '珍珠月光吊飾', '把海面上的月光掛起來', 'moon', 'decor', 40, 2, c.candyPeach, 'starlight-mobile'),
  item(5, 'toy-capsule-shop', '扭蛋玩具店', '每一次轉動，都是一個小驚喜', 'box', 'shop', 60, 2, c.candyLemon),
  item(5, 'retro-game-shop', '復古遊戲舖', '收集像素世界裡的快樂回憶', 'monitor', 'shop', 90, 2, c.candySky),
  item(5, 'karaoke-stage', '歡唱小舞台', '把今天的心情唱成一首歌', 'mic', 'facility', 75, 2, c.candyLavender, 'rhythm-stage'),
  item(5, 'pixel-photo-booth', '像素打卡展台', '為努力完成任務的自己留念', 'camera', 'facility', 55, 1, c.candyPink, 'sculpture-plaza'),
  item(5, 'lightning-marquee', '閃電霓虹牌', '一點亮光，就能改變整條街的心情', 'zap', 'decor', 35, 1, c.candySky, 'neon-sign'),
  item(5, 'pixel-art-frames', '像素畫作組', '把遊戲裡的色彩帶進現實', 'image', 'decor', 25, 1, c.candyLavender, 'gallery-frames'),
  item(6, 'bath-boutique', '泡泡沐浴小舖', '把疲倦交給柔軟的泡泡', 'droplet', 'shop', 70, 2, c.candySky),
  item(6, 'sleep-boutique', '好眠選物店', '讓晚安成為一天最舒服的時刻', 'moon', 'shop', 85, 2, c.candyLavender),
  item(6, 'meditation-platform', '靜心冥想墊', '安靜坐下，聽聽自己的呼吸', 'circle', 'facility', 45, 1, c.candyLavender, 'yoga-deck'),
  item(6, 'spa-rest-pavilion', '療癒休息亭', '不用趕路，這裡可以慢一點', 'home', 'facility', 75, 2, c.candyMint, 'rest-pavilion'),
  item(6, 'lavender-pot', '薰衣草花盆', '用淡淡花香裝點休息的角落', 'feather', 'decor', 25, 1, c.candyLavender, 'colorful-planter'),
  item(6, 'warm-glow-lantern', '暖光療癒燈', '讓空間和心情都柔和下來', 'sun', 'decor', 30, 1, c.candyPeach, 'shell-lantern'),
  item(7, 'ceramic-studio', '陶土小店', '把不完美捏成獨一無二的作品', 'hexagon', 'shop', 75, 2, c.candyPeach),
  item(7, 'art-print-shop', '插畫印物舖', '把喜歡的畫帶回每天的生活', 'image', 'shop', 85, 2, c.candySky),
  item(7, 'art-workshop-table', '手作工作桌', '留一張桌子，讓靈感慢慢發生', 'edit-2', 'facility', 60, 2, c.candyCaramel, 'tasting-court'),
  item(7, 'color-stage', '色彩分享台', '展示作品，也分享創作的快樂', 'layers', 'facility', 80, 2, c.candyCoral, 'rhythm-stage'),
  item(7, 'gallery-light', '藝廊暖光燈', '用柔和燈光照亮喜歡的角落', 'sun', 'decor', 25, 1, c.candyLemon, 'garden-lights'),
  item(7, 'mini-color-sculpture', '迷你色塊雕塑', '小小一件，也可以很有個性', 'triangle', 'decor', 45, 2, c.candySky, 'sculpture-plaza'),
  item(8, 'moon-dessert-shop', '月亮甜點店', '嚐一口來自星空的甜蜜', 'moon', 'shop', 95, 2, c.candyLemon),
  item(8, 'meteor-gift-shop', '流星禮物舖', '把閃亮的願望送給重要的人', 'gift', 'shop', 100, 3, c.candyPink),
  item(8, 'moon-viewing-deck', '賞月休息台', '在月光下，讓心情慢慢沉澱', 'moon', 'facility', 65, 2, c.candyLavender, 'yoga-deck'),
  item(8, 'planet-display', '行星展示台', '一顆顆星球，都是新的好奇心', 'globe', 'facility', 80, 2, c.candySky, 'sculpture-plaza'),
  item(8, 'orbit-neon-sign', '軌道霓虹燈', '讓星際走廊亮起夢想的顏色', 'zap', 'decor', 40, 2, c.candyLavender, 'neon-sign'),
  item(8, 'constellation-art', '星座畫框', '為今天找到屬於自己的星座', 'star', 'decor', 35, 1, c.candySky, 'gallery-frames'),
  item(9, 'fruit-smoothie-bar', '鮮果冰沙吧', '用繽紛水果補充一點元氣', 'coffee', 'shop', 65, 2, c.candyCoral),
  item(9, 'noodle-kitchen', '暖心麵食館', '一碗熱麵，讓努力的一天圓滿', 'sun', 'shop', 85, 2, c.candyLemon),
  item(9, 'picnic-court', '野餐共享桌', '把平凡的一餐變成小聚會', 'grid', 'facility', 60, 2, c.candyMint, 'tasting-court'),
  item(9, 'food-demo-stage', '料理分享台', '看見食物，也看見製作的用心', 'layers', 'facility', 90, 3, c.candyPeach, 'rhythm-stage'),
  item(9, 'fruit-crate-display', '鮮果展示架', '把市場裡的繽紛色彩排整齊', 'package', 'decor', 25, 1, c.candyCoral, 'spice-display'),
  item(9, 'market-welcome-lamp', '市集迎賓燈', '用暖暖燈光等你來吃飯', 'sun', 'decor', 30, 1, c.candyLemon, 'garden-lights'),
  item(10, 'cloud-flower-shop', '雲上花藝店', '為走到高處的自己送一束花', 'feather', 'shop', 120, 3, c.candyPink),
  item(10, 'sunset-dessert-room', '日落甜點室', '看城市亮起燈，吃一口喜歡的甜點', 'coffee', 'shop', 130, 3, c.candyPeach),
  item(10, 'sky-observation-scope', '城市觀景鏡', '看看遠方，也看看已經走過的路', 'compass', 'facility', 110, 3, c.candySky, 'observatory-dome'),
  item(10, 'rooftop-pavilion', '天台花園亭', '在雲和花之間，給自己一個擁抱', 'home', 'facility', 90, 2, c.candyMint, 'rest-pavilion'),
  item(10, 'rainbow-flower-bed', '彩虹花圃', '把一路的努力種成一片花海', 'sunrise', 'decor', 40, 2, c.candyCoral, 'colorful-planter'),
  item(10, 'sunset-wind-mobile', '晚霞風鈴', '讓風輕輕唱出今天的好心情', 'wind', 'decor', 45, 2, c.candyPeach, 'starlight-mobile'),
  item(1, 'ladies-fashion-boutique', '女裝店', '挑選適合今天心情的服飾搭配', 'shopping-bag', 'shop', 65, 0, c.candyPink, undefined, 'womenswear'),
  item(2, 'japanese-hyakuen-store', '日本百元店', '逛逛日系生活小物與實用選品', 'grid', 'shop', 70, 0, c.candyLemon, undefined, 'hyakuen'),
  item(3, 'kimono-house', '和服店', '欣賞細緻花色與傳統和服配件', 'feather', 'shop', 85, 0, c.candyCoral, undefined, 'kimono'),
  item(7, 'evening-gown-salon', '晚禮服店', '為特別的日子挑一套優雅禮服', 'star', 'shop', 115, 0, c.candyLavender, undefined, 'eveningwear'),
  item(9, 'sunny-supermarket', '陽光超市', '把日常所需和新鮮食材一次買齊', 'shopping-cart', 'shop', 130, 0, c.candyMint, undefined, 'supermarket'),
  item(10, 'bridal-gown-house', '婚紗店', '在柔光之中挑選夢想中的婚紗', 'heart', 'shop', 160, 0, c.candyPeach, undefined, 'bridal'),
  item(4, 'blue-tide-swimwear', '泳衣店', '挑選泳衣、沙灘罩衫和度假配件', 'sun', 'shop', 95, 0, c.candySky, undefined, 'swimwear'),
  item(5, 'cosplay-costume-studio', 'Cosplay服裝店', '挑選角色服裝、假髮和舞台配件', 'star', 'shop', 110, 0, c.candyLavender, undefined, 'cosplay'),
  item(6, 'little-circuit-electronics', '電器店', '發現日常家電、耳機和可愛小科技', 'cpu', 'shop', 125, 0, c.candyMint, undefined, 'electronics'),
  item(8, 'starlight-luxury-boutique', '精品店', '收藏精緻手袋、首飾和限量配件', 'shopping-bag', 'shop', 145, 0, c.candyRose, undefined, 'boutique'),
  ...createExpandedItems(MALL_FLOORS),
  item(6, 'fluffy-marshmallow-cafe', '毛茸茸棉花糖cafe', '在雲朵棉花糖香氣中，和可愛狗狗店員一起休息。', 'coffee', 'shop', 105, 0, c.candyPeach),
];

export const MALL_ITEM_BY_ID = Object.fromEntries(MALL_ITEMS.map((entry) => [entry.id, entry])) as Record<string, MallItem>;
