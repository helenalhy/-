import palette from './colors';
import type { MallShopType } from './mall';
import type { ShopInteriorDecoration } from './mall-shop-interior';

export const SHOP_DISPLAY_SLOT_COUNT = 18;

export type ShopProductIllustration =
  | 'bottle'
  | 'bathSalt'
  | 'bathPouch'
  | 'bathSoap'
  | 'yukata'
  | 'woodenComb'
  | 'woodenBath'
  | 'garment'
  | 'cloak'
  | 'wig'
  | 'ring'
  | 'treat'
  | 'croissant'
  | 'drink'
  | 'produce'
  | 'device'
  | 'book'
  | 'flower'
  | 'gift'
  | 'jewel'
  | 'handbag'
  | 'earring'
  | 'watch'
  | 'scarf'
  | 'hairclip'
  | 'shoe'
  | 'wallet'
  | 'necklace'
  | 'towel'
  | 'fan'
  | 'cloud'
  | 'box'
  | 'mug'
  | 'sticker'
  | 'charm'
  | 'diffuserStone'
  | 'cake'
  | 'pancake'
  | 'cookie'
  | 'pudding'
  | 'candy'
  | 'icecream'
  | 'popsicle'
  | 'lollipop'
  | 'bread'
  | 'pizza'
  | 'riceball'
  | 'bento'
  | 'plant'
  | 'plush'
  | 'blocks'
  | 'capsule'
  | 'puzzle'
  | 'musicbox'
  | 'train'
  | 'yarn'
  | 'pottery'
  | 'basket'
  | 'wand'
  | 'hat'
  | 'carton'
  | 'snack'
  | 'headphones'
  | 'camera'
  | 'speaker'
  | 'gameConsole'
  | 'cable'
  | 'projector'
  | 'brush'
  | 'sachet'
  | 'mask'
  | 'postcard'
  | 'pencil'
  | 'bucket'
  | 'swimwear'
  | 'teaCup'
  | 'compact'
  | 'lipstick'
  | 'palette'
  | 'mascara'
  | 'nailPolish';

export interface ShopDisplayProduct {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  theme: ProductTheme;
  illustration: ShopProductIllustration;
  variant: number;
  finish?: 'matte' | 'satin' | 'gloss' | 'shimmer' | 'glitter';
  fixtureIds?: string[];
  legacyOnly?: boolean;
}

type ProductTheme =
  | MallShopType
  | 'fragrance'
  | 'cafe'
  | 'candy'
  | 'icecream'
  | 'bakery'
  | 'onsen'
  | 'tea'
  | 'food'
  | 'flower'
  | 'book'
  | 'toy'
  | 'craft'
  | 'general'
  | 'photoStudio'
  | 'chiikawa'
  | 'winnie'
  | 'animalPajama'
  | 'laceFabric'
  | 'halloween'
  | 'easter'
  | 'christmas'
  | 'fruitMarket'
  | 'chineseCuisine'
  | 'icecreamParlor';

type ProductSeed = {
  name: string;
  description: string;
  icon: string;
  color: string;
  illustration?: ShopProductIllustration;
  fixtureIds?: string[];
};
type FeaturedProductSeed = ProductSeed & { key: string };
const c = palette.light;

const productSeeds: Record<ProductTheme, ProductSeed[]> = {
  fragrance: [
    { name: '薰衣草晚風香氛', description: '柔和花草調香氛瓶', icon: 'wind', color: c.candyLavender },
    { name: '白茶晨露香氛', description: '清新茶香擴香瓶', icon: 'droplet', color: c.candyMint },
    { name: '柚子花香擴香', description: '明亮柑橘與花香', icon: 'sun', color: c.candyLemon },
    { name: '玫瑰柔霧香氛', description: '淡淡玫瑰香調', icon: 'heart', color: c.candyPink },
    { name: '海鹽微風擴香石', description: '海風造型擴香石', icon: 'cloud', color: c.candySky },
    { name: '棉花糖香氛石', description: '柔軟雲朵造型香氛石', icon: 'star', color: c.candyPeach },
    { name: '暖木香調香氛', description: '溫暖木質調香水瓶', icon: 'feather', color: c.candyCaramel },
    { name: '月光陶瓷擴香石', description: '月亮造型的陶瓷擴香石', icon: 'moon', color: c.candyLavender },
  ],
  general: [
    { name: '雲朵造型小物', description: '柔軟配色的日常選物', icon: 'cloud', color: c.candySky },
    { name: '星星收納盒', description: '放置細小收藏的盒子', icon: 'star', color: c.candyLemon },
    { name: '緞帶禮物包', description: '適合送給朋友的小禮物', icon: 'gift', color: c.candyPink },
    { name: '花花筆記本', description: '記下今天的小點子', icon: 'book-open', color: c.candyMint },
    { name: '迷你陶瓷杯', description: '手繪花紋的迷你杯', icon: 'coffee', color: c.candyPeach },
    { name: '彩色貼紙包', description: '為手帳添上亮眼圖案', icon: 'image', color: c.candyLavender },
    { name: '月亮吊飾', description: '掛在包袋上的小吊飾', icon: 'moon', color: c.candyCoral },
    { name: '迷你花束', description: '以柔和彩紙包好的花束', icon: 'feather', color: c.candyRose },
  ],
  onsen: [
    { name: '櫻花入浴鹽小罐', description: '帶有淡淡櫻花香氣的泡湯入浴鹽', icon: 'droplet', color: c.candyPink, illustration: 'bathSalt' },
    { name: '柚子暖湯香包', description: '泡澡時散發柚子香氣的溫泉香包', icon: 'sun', color: c.candyLemon, illustration: 'sachet' },
    { name: '檜木香氛沐浴露', description: '以柔和檜木香調製成的沐浴露', icon: 'wind', color: c.candyCaramel, illustration: 'bottle' },
    { name: '溫泉旅館毛巾組', description: '柔軟吸水的浴巾與小毛巾組合', icon: 'heart', color: c.candySky, illustration: 'towel' },
    { name: '櫻花紋浴衣', description: '印有柔粉櫻花圖案的輕柔浴衣', icon: 'feather', color: c.candyRose, illustration: 'yukata' },
    { name: '泡湯竹木按摩梳', description: '適合沐浴後梳理頭髮的竹木梳', icon: 'star', color: c.candyCaramel, illustration: 'woodenComb' },
    { name: '雪見泡腳木桶組', description: '可愛迷你的木桶與足浴用品組', icon: 'package', color: c.candyPeach, illustration: 'woodenBath' },
    { name: '草本蒸氣眼罩', description: '以溫熱草本香氣陪伴泡湯後休息', icon: 'moon', color: c.candyLavender, illustration: 'mask' },
  ],
  cafe: [
    { name: '星星拿鐵', description: '奶泡上有小星星圖案', icon: 'coffee', color: c.candyPeach },
    { name: '草莓雲朵蛋糕', description: '粉紅奶油與鬆軟蛋糕', icon: 'heart', color: c.candyPink },
    { name: '蜂蜜鬆餅', description: '配上蜂蜜的小份鬆餅', icon: 'sun', color: c.candyLemon },
    { name: '牛奶糖曲奇', description: '烤成金黃色的小曲奇', icon: 'gift', color: c.candyCaramel },
    { name: '果香氣泡飲', description: '繽紛水果風味飲品', icon: 'droplet', color: c.candySky },
    { name: '可可小馬芬', description: '撒上糖粉的迷你蛋糕', icon: 'heart', color: c.candyLavender },
    { name: '棉花糖杯', description: '裝滿彩色棉花糖的小杯', icon: 'star', color: c.candyRose },
    { name: '焦糖布丁', description: '滑嫩的焦糖風味布丁', icon: 'sun', color: c.candyPeach },
  ],
  candy: [
    { name: '彩虹軟糖', description: '一顆顆排列的水果軟糖', icon: 'heart', color: c.candyCoral },
    { name: '星星棉花糖', description: '蓬鬆的星形棉花糖', icon: 'star', color: c.candyPink },
    { name: '水果糖罐', description: '裝有多種果味的小糖果', icon: 'gift', color: c.candyLemon },
    { name: '雲朵巧克力', description: '奶香巧克力小點心', icon: 'cloud', color: c.candyPeach },
    { name: '酸甜莓果糖', description: '莓果口味的繽紛糖果', icon: 'heart', color: c.candyRose },
    { name: '薄荷小糖球', description: '清爽薄荷口味糖球', icon: 'circle', color: c.candyMint },
    { name: '星月棒棒糖', description: '星星與月亮造型棒棒糖', icon: 'moon', color: c.candyLavender },
    { name: '彩糖小禮盒', description: '包裝成禮物的小糖果', icon: 'gift', color: c.candySky },
  ],
  icecream: [
    { name: '草莓雲朵冰淇淋', description: '粉色草莓風味冰淇淋', icon: 'heart', color: c.candyPink },
    { name: '抹茶小雪球', description: '淡淡茶香的冰淇淋球', icon: 'sun', color: c.candyMint },
    { name: '香草星星甜筒', description: '香草口味星形甜筒', icon: 'star', color: c.candyLemon },
    { name: '藍莓氣泡冰沙', description: '帶有藍莓果香的冰沙', icon: 'droplet', color: c.candySky },
    { name: '焦糖脆片雪糕', description: '焦糖脆片裹著香草雪糕', icon: 'gift', color: c.candyCaramel },
    { name: '芒果陽光雪糕', description: '明亮果香的芒果雪糕', icon: 'sun', color: c.candyPeach },
    { name: '葡萄紫冰棒', description: '清爽葡萄口味冰棒', icon: 'droplet', color: c.candyLavender },
    { name: '彩虹三球杯', description: '三種口味的迷你冰品', icon: 'circle', color: c.candyCoral },
  ],
  bakery: [
    { name: '草莓奶油小蛋糕', description: '擺上新鮮草莓的奶油蛋糕', icon: 'heart', color: c.candyPink },
    { name: '奶油菠蘿包', description: '剛出爐的金黃色麵包', icon: 'sun', color: c.candyLemon },
    { name: '星星糖霜曲奇', description: '星形糖霜餅乾', icon: 'star', color: c.candyLavender },
    { name: '蜂蜜可頌', description: '外層酥脆的蜂蜜可頌', icon: 'gift', color: c.candyPeach, illustration: 'croissant' },
    { name: '藍莓小塔', description: '盛著藍莓餡的小塔', icon: 'circle', color: c.candySky },
    { name: '雲朵棉花糖麵包', description: '鬆軟的雲朵造型甜麵包', icon: 'cloud', color: c.candyMint },
    { name: '巧克力甜甜圈', description: '淋上巧克力糖衣的甜甜圈', icon: 'circle', color: c.candyCaramel },
    { name: '季節限定蛋塔', description: '當季口味的小蛋塔', icon: 'sun', color: c.candyCoral },
  ],
  tea: [
    { name: '珍珠奶茶', description: '香濃奶茶配上Q彈珍珠', icon: 'coffee', color: c.candyCaramel },
    { name: '蜜桃烏龍茶', description: '清甜蜜桃與茶香', icon: 'droplet', color: c.candyPeach },
    { name: '抹茶奶蓋飲', description: '綿密奶蓋與淡雅抹茶', icon: 'coffee', color: c.candyMint },
    { name: '柚子氣泡茶', description: '帶有柑橘香氣的氣泡茶', icon: 'sun', color: c.candyLemon },
    { name: '莓果冰茶', description: '莓果與冰茶的清爽組合', icon: 'heart', color: c.candyRose },
    { name: '紫薯珍珠飲', description: '柔和紫色的香甜飲品', icon: 'circle', color: c.candyLavender },
    { name: '檸檬蜂蜜水', description: '清新檸檬搭配蜂蜜', icon: 'sun', color: c.candySky },
    { name: '桂花熱茶', description: '淡雅花香的暖茶', icon: 'feather', color: c.candyCoral },
  ],
  food: [
    { name: '彩色飯糰盒', description: '不同口味的小飯糰', icon: 'package', color: c.candyMint },
    { name: '香料咖喱包', description: '暖香咖喱的小份餐點', icon: 'gift', color: c.candyCaramel },
    { name: '番茄起司小披薩', description: '迷你披薩分享點心', icon: 'heart', color: c.candyCoral },
    { name: '水果可麗餅', description: '包著水果與奶油的可麗餅', icon: 'sun', color: c.candyPeach },
    { name: '鮮蔬便當', description: '繽紛蔬菜搭配米飯', icon: 'grid', color: c.candyLemon },
    { name: '海苔小卷', description: '方便帶著走的小食', icon: 'package', color: c.candySky },
    { name: '芝麻湯圓', description: '暖暖的甜湯小點心', icon: 'circle', color: c.candyLavender },
    { name: '香草烤蔬菜', description: '以香草調味的烤蔬菜', icon: 'feather', color: c.candyPink },
  ],
  flower: [
    { name: '粉紅鬱金香花束', description: '以薄紙包好的春日花束', icon: 'feather', color: c.candyPink },
    { name: '迷你向日葵盆栽', description: '為桌面添一點陽光', icon: 'sun', color: c.candyLemon },
    { name: '紫藤小花瓶', description: '淡紫花朵搭配透明花瓶', icon: 'droplet', color: c.candyLavender },
    { name: '薄荷綠多肉盆', description: '可愛的小型多肉植物', icon: 'cloud', color: c.candyMint },
    { name: '野花玻璃瓶', description: '收集繽紛的小野花', icon: 'heart', color: c.candyCoral },
    { name: '玫瑰花瓣禮盒', description: '將花瓣收進小小禮盒', icon: 'gift', color: c.candyRose },
    { name: '白色小雛菊', description: '清新的白色花朵', icon: 'star', color: c.candySky },
    { name: '彩葉觀葉盆栽', description: '葉片帶有柔和的漸層色', icon: 'feather', color: c.candyPeach },
  ],
  book: [
    { name: '手繪花園筆記本', description: '封面有手繪花草的筆記本', icon: 'book-open', color: c.candyMint },
    { name: '星空故事繪本', description: '裝滿星星故事的小書', icon: 'star', color: c.candyLavender },
    { name: '彩虹便利貼', description: '方便記下靈感的便利貼', icon: 'edit-2', color: c.candyCoral },
    { name: '動物造型書籤', description: '夾在書頁間的小動物書籤', icon: 'bookmark', color: c.candyPeach },
    { name: '旅行明信片組', description: '收錄不同城市的風景', icon: 'image', color: c.candySky },
    { name: '珍藏漫畫單行本', description: '一冊適合收藏的小漫畫', icon: 'book', color: c.candyPink },
    { name: '透明花朵貼紙', description: '為手帳增添花朵圖案', icon: 'feather', color: c.candyRose },
    { name: '迷你彩色筆組', description: '適合畫畫與做筆記', icon: 'edit-3', color: c.candyLemon },
  ],
  toy: [
    { name: '小熊布偶', description: '柔軟蓬鬆的小熊玩偶', icon: 'heart', color: c.candyPeach },
    { name: '星星積木組', description: '可以拼出不同造型的積木', icon: 'star', color: c.candyLemon },
    { name: '迷你扭蛋', description: '打開有驚喜的小收藏', icon: 'gift', color: c.candyPink },
    { name: '彩虹拼圖盒', description: '拼出一幅繽紛的小圖畫', icon: 'grid', color: c.candyLavender },
    { name: '兔兔音樂盒', description: '轉動後會播放輕快旋律', icon: 'music', color: c.candySky },
    { name: '手作黏土套裝', description: '用柔軟黏土捏出小角色', icon: 'edit-2', color: c.candyCoral },
    { name: '迷你火車模型', description: '適合收藏的小火車模型', icon: 'truck', color: c.candyMint },
    { name: '貼紙收藏包', description: '收錄可愛圖案的貼紙', icon: 'image', color: c.candyRose },
  ],
  chiikawa: [
    { name: '吉伊卡哇奶油白毛絨玩偶', description: '圓圓白色身形、粉紅臉頰的吉伊卡哇。', icon: 'gift', color: c.candyCream, illustration: 'plush' },
    { name: '小八貓藍白耳朵玩偶', description: '藍色貓耳和白色臉龐的小八貓。', icon: 'heart', color: c.candySky, illustration: 'plush' },
    { name: '兔兔長耳跳跳玩偶', description: '長長耳朵和活潑表情的黃色兔兔。', icon: 'star', color: c.candyLemon, illustration: 'plush' },
    { name: '飛鼠藍灰蝴蝶結吊飾', description: '帶蓬鬆側翼和蝴蝶結的飛鼠吊飾。', icon: 'gift', color: c.candyLavender, illustration: 'charm' },
    { name: '獅薩花花髮箍角色貼紙', description: '橙色耳朵與花朵髮飾的獅薩。', icon: 'image', color: c.candyCoral, illustration: 'sticker' },
    { name: '栗子饅頭茶香馬克杯', description: '栗子色帽頂和招牌粗眉的角色杯。', icon: 'coffee', color: c.candyCaramel, illustration: 'mug' },
    { name: '海獺師傅藍披風收藏盒', description: '藍灰海獺師傅造型的角色珍藏盒。', icon: 'package', color: c.candySky, illustration: 'box' },
    { name: '旋轉木馬變裝角色小卡', description: '收藏吉伊卡哇夥伴的遊行服裝造型。', icon: 'book-open', color: c.candyPink, illustration: 'postcard' },
  ],
  winnie: [
    { name: '維尼蜂蜜罐造型毛絨玩偶', description: '抱著蜂蜜罐的柔軟小熊收藏。', icon: 'gift', color: c.candyLemon, illustration: 'plush' },
    { name: '小豬粉紅條紋圍巾玩偶', description: '粉紅長耳和條紋圍巾的小豬。', icon: 'heart', color: c.candyPink, illustration: 'plush' },
    { name: '跳跳虎橘黑條紋玩偶', description: '橘色身形、黑色條紋和彈跳尾巴。', icon: 'star', color: c.candyCoral, illustration: 'plush' },
    { name: '屹耳藍灰長耳玩偶', description: '灰藍色垂耳和粉紅蝴蝶結的屹耳。', icon: 'cloud', color: c.candySky, illustration: 'plush' },
    { name: '瑞比綠衣兔子角色盒', description: '長耳朵和薄荷綠衣服的森林兔子。', icon: 'book-open', color: c.candyMint, illustration: 'box' },
    { name: '袋鼠媽媽與小豆合照卡', description: '袋鼠媽媽和袋袋裡的小豆一起入鏡。', icon: 'image', color: c.candyPeach, illustration: 'postcard' },
    { name: '百畝森林貓頭鷹收藏杯', description: '圓眼睛貓頭鷹圖案的森林角色杯。', icon: 'coffee', color: c.candyCaramel, illustration: 'mug' },
    { name: '維尼與朋友角色貼紙包', description: '收藏維尼、小豬、跳跳虎和屹耳。', icon: 'image', color: c.candyLemon, illustration: 'sticker' },
  ],
  animalPajama: [
    { name: '兔兔耳朵連身睡衣', description: '柔軟長耳帽與一體式睡衣', icon: 'moon', color: c.candyPink, illustration: 'garment' },
    { name: '熊熊口袋絨毛睡衣', description: '胸前小熊口袋的暖絨連身款', icon: 'heart', color: c.candyCaramel, illustration: 'garment' },
    { name: '狐狸尾巴連身睡衣', description: '橘白配色和蓬鬆尾巴細節', icon: 'feather', color: c.candyCoral, illustration: 'garment' },
    { name: '奶牛斑點睡衣套裝', description: '黑白斑點造型的一體式睡衣', icon: 'shopping-bag', color: c.candyCream, illustration: 'garment' },
    { name: '小恐龍背棘睡衣', description: '薄荷綠背棘與連帽設計', icon: 'star', color: c.candyMint, illustration: 'garment' },
    { name: '貓咪鬍鬚連身睡衣', description: '圓耳帽與小鬍鬚刺繡', icon: 'heart', color: c.candyLavender, illustration: 'garment' },
    { name: '企鵝肚肚連身睡衣', description: '冰藍連帽與奶油白肚肚', icon: 'cloud', color: c.candySky, illustration: 'garment' },
    { name: '動物腳套睡衣配件', description: '搭配連身睡衣的柔軟腳套', icon: 'gift', color: c.candyPeach, illustration: 'shoe' },
  ],
  laceFabric: [
    { name: '玫瑰花邊蕾絲布料', description: '適合裙襬與領口裝飾的柔粉花邊', icon: 'feather', color: c.candyPink, illustration: 'garment' },
    { name: '星點薄紗布卷', description: '細小星點透紗，適合袖口和披肩', icon: 'star', color: c.candyLavender, illustration: 'scarf' },
    { name: '珍珠白緞面布料', description: '帶柔和光澤的訂製裙裝用布', icon: 'sun', color: c.candyCream, illustration: 'garment' },
    { name: '櫻花刺繡棉布', description: '粉色櫻花刺繡的輕柔棉布', icon: 'feather', color: c.candyRose, illustration: 'garment' },
    { name: '薄荷格紋布料', description: '清新格紋，可用於上衣和裙裝', icon: 'grid', color: c.candyMint, illustration: 'garment' },
    { name: '緞帶袖口訂製套件', description: '配合布料加上柔色袖口和蝴蝶結', icon: 'gift', color: c.candyPeach, illustration: 'scarf' },
    { name: '雲朵網紗拼接布', description: '輕盈網紗和奶油白棉布組合', icon: 'cloud', color: c.candySky, illustration: 'garment' },
    { name: '花瓣鈕扣與蕾絲包', description: '為客製衣物挑選花瓣鈕扣和花邊', icon: 'circle', color: c.candyCoral, illustration: 'jewel' },
  ],
  halloween: [
    { name: '微笑南瓜變裝斗篷', description: '橘色南瓜圖樣的節日小斗篷', icon: 'star', color: c.candyCoral, illustration: 'cloak' },
    { name: '星月小魔法師帽', description: '柔紫色帽身配星星緞帶', icon: 'moon', color: c.candyLavender, illustration: 'hat' },
    { name: '蝙蝠翅膀披肩', description: '不嚇人的小蝙蝠造型披肩', icon: 'wind', color: c.candySky, illustration: 'cloak' },
    { name: '幽靈笑臉毛絨吊飾', description: '圓圓笑臉的小幽靈收藏', icon: 'cloud', color: c.candyCream, illustration: 'plush' },
    { name: '南瓜糖果小禮袋', description: '裝節日小禮物的南瓜口袋袋', icon: 'gift', color: c.candyLemon, illustration: 'handbag' },
    { name: '紫霧星點髮夾', description: '以星月和小蝙蝠作裝飾', icon: 'star', color: c.candyLavender, illustration: 'hairclip' },
    { name: '橘糖魔法手杖', description: '南瓜星星造型的派對手杖', icon: 'wand', color: c.candyOrange, illustration: 'wand' },
    { name: '萬聖節故事明信片', description: '南瓜、月亮與森林小屋場景', icon: 'image', color: c.candyRose, illustration: 'postcard' },
  ],
  easter: [
    { name: '兔兔彩蛋禮物盒', description: '手繪花朵和兔耳彩蛋收藏盒', icon: 'gift', color: c.candyLemon, illustration: 'box' },
    { name: '春日兔兔毛絨吊飾', description: '戴著小花冠的柔軟兔兔', icon: 'heart', color: c.candyPink, illustration: 'plush' },
    { name: '彩蛋花籃手提包', description: '編織小籃搭配春日彩蛋圖案', icon: 'shopping-bag', color: c.candyMint, illustration: 'handbag' },
    { name: '胡蘿蔔兔耳髮箍', description: '橘色胡蘿蔔與柔軟兔耳裝飾', icon: 'feather', color: c.candyCoral, illustration: 'hairclip' },
    { name: '花園尋蛋小卡組', description: '森林花園裡的尋蛋任務卡', icon: 'book-open', color: c.candySky, illustration: 'postcard' },
    { name: '粉彩彩蛋耳環', description: '以小彩蛋造型製作的耳飾', icon: 'circle', color: c.candyLavender, illustration: 'earring' },
    { name: '春日花冠連身裙', description: '搭配小兔尾巴的柔色裙裝', icon: 'sun', color: c.candyRose, illustration: 'garment' },
    { name: '兔兔野餐布巾', description: '彩蛋與野花圖樣的野餐布', icon: 'grid', color: c.candyPeach, illustration: 'scarf' },
  ],
  christmas: [
    { name: '雪花星星樹頂飾', description: '冰藍與銀白色的聖誕樹裝飾', icon: 'star', color: c.candySky, illustration: 'jewel' },
    { name: '聖誕毛衣連身裙', description: '紅綠雪花圖樣的冬日穿搭', icon: 'heart', color: c.candyRose, illustration: 'garment' },
    { name: '鈴鐺緞帶禮物包', description: '綁著小鈴鐺和緞帶的節日禮物', icon: 'gift', color: c.candyCoral, illustration: 'box' },
    { name: '雪人毛絨玩偶', description: '圍著薄荷色圍巾的小雪人', icon: 'cloud', color: c.candyMint, illustration: 'plush' },
    { name: '聖誕襪造型手提包', description: '柔軟紅襪造型的冬日小包', icon: 'shopping-bag', color: c.candyPink, illustration: 'handbag' },
    { name: '星光雪花髮夾', description: '冬日造型的銀白星雪髮飾', icon: 'star', color: c.candyLavender, illustration: 'hairclip' },
    { name: '冬日暖圍巾', description: '奶油白與莓果紅的柔軟圍巾', icon: 'wind', color: c.candyPeach, illustration: 'scarf' },
    { name: '雪國祝福明信片', description: '窗邊燈光和雪花街道的插畫卡', icon: 'image', color: c.candySky, illustration: 'postcard' },
  ],
  fruitMarket: [
    { name: '晨露草莓果籃', description: '新鮮草莓與小葉片組成的果籃', icon: 'heart', color: c.candyCoral, illustration: 'produce' },
    { name: '陽光柑橘分享盒', description: '橙子、檸檬和柚子的季節禮盒', icon: 'sun', color: c.candyLemon, illustration: 'produce' },
    { name: '藍莓乳酪水果杯', description: '藍莓與乳酪搭配的清爽點心', icon: 'circle', color: c.candyLavender, illustration: 'carton' },
    { name: '熱帶水果切片盒', description: '芒果、奇異果和鳳梨小切片', icon: 'grid', color: c.candyPeach, illustration: 'produce' },
    { name: '蘋果梨子藤編籃', description: '當季蘋果與水梨組成的小果籃', icon: 'gift', color: c.candyMint, illustration: 'basket' },
    { name: '鮮榨橙汁瓶', description: '以當季橙子現榨的果汁', icon: 'coffee', color: c.candyOrange, illustration: 'carton' },
    { name: '葡萄小果串', description: '紫葡萄與青葡萄的分享小串', icon: 'circle', color: c.candySky, illustration: 'produce' },
    { name: '季節水果塔', description: '以新鮮莓果和奶油裝飾的小塔', icon: 'star', color: c.candyPink, illustration: 'cake' },
  ],
  chineseCuisine: [
    { name: '蝦餃皇蒸籠組', description: '晶瑩蝦餃與竹蒸籠造型小物', icon: 'grid', color: c.candyPeach, illustration: 'bento' },
    { name: '迷你燒賣點心盒', description: '一口大小的手作燒賣組合', icon: 'gift', color: c.candyCoral, illustration: 'bento' },
    { name: '雲吞雞湯麵碗', description: '暖湯雲吞麵與青菜配料', icon: 'coffee', color: c.candyLemon, illustration: 'bento' },
    { name: '荷葉珍珠糯米雞', description: '糯米與香菇造型的點心包', icon: 'leaf', color: c.candyMint, illustration: 'riceball' },
    { name: '廣式蘿蔔糕小盤', description: '煎香蘿蔔糕搭配小醬碟', icon: 'sun', color: c.candySky, illustration: 'bento' },
    { name: '月下青花茶杯', description: '手繪月亮紋樣的中式茶杯', icon: 'coffee', color: c.candyLavender, illustration: 'teaCup' },
    { name: '中式點心餐具組', description: '筷子、茶匙和小點心碟', icon: 'gift', color: c.candyRose, illustration: 'bento' },
    { name: '桂花蓮子糖水碗', description: '桂花香氣的溫暖中式甜湯', icon: 'heart', color: c.candyPeach, illustration: 'pudding' },
  ],
  icecreamParlor: [
    { name: '雪花草莓雙球甜筒', description: '草莓與香草雪糕搭配脆筒', icon: 'heart', color: c.candyPink, illustration: 'icecream' },
    { name: '薄荷抹茶雪酪杯', description: '抹茶和薄荷色的清爽雪酪', icon: 'droplet', color: c.candyMint, illustration: 'icecream' },
    { name: '藍莓雲朵聖代', description: '藍莓醬、奶油和雲朵雪糕', icon: 'cloud', color: c.candySky, illustration: 'icecream' },
    { name: '焦糖脆片雪糕蛋糕', description: '焦糖脆片與冰淇淋層疊蛋糕', icon: 'star', color: c.candyCaramel, illustration: 'cake' },
    { name: '芒果陽光水果冰棒', description: '芒果和百香果製成的冰棒', icon: 'sun', color: c.candyOrange, illustration: 'popsicle' },
    { name: '彩糖迷你甜筒組', description: '多色小甜筒和脆餅分享組', icon: 'gift', color: c.candyLavender, illustration: 'icecream' },
    { name: '櫻桃牛奶雪糕杯', description: '牛奶雪糕搭配櫻桃果醬', icon: 'circle', color: c.candyCoral, illustration: 'icecream' },
    { name: '香草星星脆餅杯', description: '香草雪糕和星形餅乾碎', icon: 'star', color: c.candyLemon, illustration: 'cookie' },
  ],
  craft: [
    { name: '手繪陶瓷小碟', description: '每一只都有不同手繪花紋', icon: 'circle', color: c.candySky },
    { name: '彩色編織線團', description: '柔軟的多色手作毛線', icon: 'feather', color: c.candyCoral },
    { name: '玻璃花朵吊飾', description: '透亮的手工玻璃小花', icon: 'star', color: c.candyLavender },
    { name: '皮革迷你卡套', description: '手作縫線的小卡套', icon: 'credit-card', color: c.candyCaramel },
    { name: '緞帶髮夾組', description: '不同顏色的手作髮夾', icon: 'gift', color: c.candyPink },
    { name: '彩繪木製胸針', description: '手工畫上的繽紛圖案', icon: 'sun', color: c.candyLemon },
    { name: '迷你編織花籃', description: '可放在桌面的小花籃', icon: 'package', color: c.candyMint },
    { name: '陶土星月擺飾', description: '星星與月亮造型的手作品', icon: 'moon', color: c.candyPeach },
  ],
  womenswear: [
    { name: '粉彩針織上衣', description: '柔軟親膚的日常上衣', icon: 'shopping-bag', color: c.candyPink },
    { name: '百褶小裙子', description: '輕盈好搭的短裙', icon: 'shopping-bag', color: c.candyLavender },
    { name: '花朵襯衫', description: '印有小花圖案的襯衫', icon: 'feather', color: c.candyMint },
    { name: '奶油色連身裙', description: '適合日常外出的連身裙', icon: 'heart', color: c.candyPeach },
    { name: '蝴蝶結髮飾', description: '為穿搭添上柔和亮點', icon: 'gift', color: c.candyCoral },
    { name: '柔軟圍巾', description: '適合微涼天氣的圍巾', icon: 'wind', color: c.candySky },
    { name: '珍珠小耳環', description: '細緻珍珠造型耳環', icon: 'circle', color: c.candyLemon },
    { name: '手提小方包', description: '方便搭配日常服裝', icon: 'shopping-bag', color: c.candyRose },
  ],
  bridal: [
    { name: '蕾絲白紗禮服', description: '有細緻蕾絲花邊的婚紗', icon: 'heart', color: c.candyPink },
    { name: '珍珠頭紗', description: '點綴小珍珠的柔紗頭飾', icon: 'star', color: c.candyLemon },
    { name: '玫瑰捧花', description: '粉白色系的新娘捧花', icon: 'feather', color: c.candyRose },
    { name: '緞面婚鞋', description: '簡約柔亮的緞面鞋款', icon: 'shopping-bag', color: c.candyPeach },
    { name: '水晶髮梳', description: '閃耀小水晶的髮飾', icon: 'sun', color: c.candySky },
    { name: '蕾絲手套', description: '輕柔透膚的婚禮手套', icon: 'gift', color: c.candyLavender },
    { name: '香檳色伴娘裙', description: '適合婚禮場合的柔色裙裝', icon: 'shopping-bag', color: c.candyCaramel },
    { name: '婚戒小禮盒', description: '為戒指準備的收藏盒', icon: 'circle', color: c.candyMint },
  ],
  eveningwear: [
    { name: '莓果粉晚宴裙', description: '輕盈裙襬的晚宴服', icon: 'shopping-bag', color: c.candyRose },
    { name: '星光亮片披肩', description: '在燈光下閃耀的小披肩', icon: 'star', color: c.candyLavender },
    { name: '珍珠手拿包', description: '搭配晚宴造型的手拿包', icon: 'gift', color: c.candyPeach },
    { name: '緞面高跟鞋', description: '優雅簡潔的緞面鞋款', icon: 'shopping-bag', color: c.candyPink },
    { name: '水晶項鍊', description: '細緻閃亮的晚宴配件', icon: 'sun', color: c.candySky },
    { name: '蝴蝶結胸針', description: '為禮服加上一點光彩', icon: 'heart', color: c.candyLemon },
    { name: '薄紗長手套', description: '輕柔透明的長手套', icon: 'wind', color: c.candyMint },
    { name: '金色耳墜', description: '小巧的金色晚宴耳飾', icon: 'circle', color: c.candyCaramel },
  ],
  kimono: [
    { name: '櫻花振袖', description: '有柔粉櫻花花紋的和服', icon: 'feather', color: c.candyPink },
    { name: '紫藤浴衣', description: '帶有紫藤圖案的夏日浴衣', icon: 'shopping-bag', color: c.candyLavender },
    { name: '金魚腰帶', description: '搭配浴衣的小巧腰帶', icon: 'gift', color: c.candyCoral },
    { name: '木屐與緞帶', description: '適合夏日祭典的木屐', icon: 'shopping-bag', color: c.candyCaramel },
    { name: '和風髮簪', description: '點綴花朵的傳統髮飾', icon: 'star', color: c.candyLemon },
    { name: '手繪扇子', description: '畫有柔和花草的摺扇', icon: 'wind', color: c.candyMint },
    { name: '絞染羽織', description: '帶有漸層紋樣的羽織', icon: 'shopping-bag', color: c.candySky },
    { name: '櫻花小荷包', description: '繫在腰帶上的和風小包', icon: 'gift', color: c.candyPeach },
  ],
  supermarket: [
    { name: '新鮮草莓籃', description: '一籃鮮紅多汁的草莓', icon: 'heart', color: c.candyRose },
    { name: '彩色水果盒', description: '裝有多種當季水果', icon: 'package', color: c.candyLemon },
    { name: '牛奶玻璃瓶', description: '新鮮牛奶的玻璃瓶裝', icon: 'droplet', color: c.candySky },
    { name: '蔬菜小菜籃', description: '精選新鮮的日常蔬菜', icon: 'grid', color: c.candyMint },
    { name: '果汁紙盒組', description: '方便帶著走的果汁飲品', icon: 'coffee', color: c.candyPeach },
    { name: '餅乾分享包', description: '適合午後分享的小餅乾', icon: 'gift', color: c.candyCaramel },
    { name: '彩糖零食包', description: '繽紛的季節限定小零食', icon: 'star', color: c.candyPink },
    { name: '迷你花束', description: '新鮮花朵包成的小花束', icon: 'feather', color: c.candyLavender },
  ],
  hyakuen: [
    { name: '便利貼收納包', description: '多色便利貼與索引標籤', icon: 'edit-2', color: c.candyLemon },
    { name: '迷你收納盒', description: '整理桌面小物的收納盒', icon: 'package', color: c.candyMint },
    { name: '動物造型杯', description: '可愛造型的日用杯子', icon: 'coffee', color: c.candyPeach },
    { name: '緞帶與包裝紙', description: '包裝禮物用的手作材料', icon: 'gift', color: c.candyPink },
    { name: '彩色餐具組', description: '適合野餐使用的小餐具', icon: 'grid', color: c.candySky },
    { name: '迷你盆栽', description: '容易照顧的小型綠植', icon: 'feather', color: c.candyMint },
    { name: '手機掛繩', description: '方便攜帶的彩色掛繩', icon: 'smartphone', color: c.candyLavender },
    { name: '星星貼紙包', description: '手帳和卡片都能使用', icon: 'star', color: c.candyCoral },
  ],
  swimwear: [
    { name: '海鹽藍連身泳衣', description: '清爽藍色系的連身泳衣', icon: 'shopping-bag', color: c.candySky },
    { name: '珊瑚粉比基尼', description: '柔和粉色系的泳裝套裝', icon: 'heart', color: c.candyCoral },
    { name: '薄荷綠防曬上衣', description: '適合海邊活動的防曬衣', icon: 'wind', color: c.candyMint },
    { name: '花朵沙灘裙', description: '輕柔花紋的沙灘裙', icon: 'feather', color: c.candyPink },
    { name: '貝殼遮陽帽', description: '夏日海邊的遮陽配件', icon: 'sun', color: c.candyLemon },
    { name: '彩虹沙灘巾', description: '繽紛柔軟的沙灘毛巾', icon: 'grid', color: c.candyLavender },
    { name: '透明水母包', description: '方便收納海邊用品的小包', icon: 'shopping-bag', color: c.candyPeach },
    { name: '星星水鞋', description: '適合沙灘與水邊活動', icon: 'star', color: c.candyRose },
  ],
  cosplay: [
    { name: '星光魔法裙裝', description: '以星月色彩設計的角色服', icon: 'star', color: c.candyLavender },
    { name: '忍者風斗篷', description: '原創忍者主題的輕便斗篷', icon: 'wind', color: c.candySky },
    { name: '櫻花角色上衣', description: '粉色系的原創角色上衣', icon: 'heart', color: c.candyPink },
    { name: '彩虹舞台裙', description: '適合表演的繽紛裙裝', icon: 'sun', color: c.candyCoral },
    { name: '精靈耳朵髮箍', description: '搭配奇幻造型的耳朵配件', icon: 'feather', color: c.candyMint },
    { name: '魔法星星手杖', description: '星形裝飾的原創道具', icon: 'star', color: c.candyLemon },
    { name: '月光假髮', description: '柔和銀紫色的造型假髮', icon: 'moon', color: c.candyPeach },
    { name: '角色徽章組', description: '收藏原創角色的小徽章', icon: 'gift', color: c.candyRose },
  ],
  electronics: [
    { name: '薄荷色耳機', description: '輕巧舒適的日常耳機', icon: 'headphones', color: c.candyMint },
    { name: '迷你拍立得相機', description: '記錄出遊時的可愛瞬間', icon: 'camera', color: c.candyPink },
    { name: '星星藍牙喇叭', description: '播放音樂的迷你喇叭', icon: 'music', color: c.candySky },
    { name: '便攜遊戲機', description: '適合休息時使用的小遊戲機', icon: 'cpu', color: c.candyLavender },
    { name: '智慧手錶', description: '顯示時間與日常提醒', icon: 'watch', color: c.candyCoral },
    { name: '多色充電線', description: '收納方便的柔色充電線', icon: 'zap', color: c.candyLemon },
    { name: '迷你投影機', description: '在牆面播放影片的小裝置', icon: 'monitor', color: c.candyPeach },
    { name: '相機小腳架', description: '適合拍照和錄影的配件', icon: 'camera', color: c.candyRose },
  ],
  boutique: [
    { name: '珍珠手提包', description: '搭配日常穿搭的小手袋', icon: 'shopping-bag', color: c.candyPeach },
    { name: '水晶耳環', description: '細緻閃亮的小型耳飾', icon: 'star', color: c.candySky },
    { name: '月光腕錶', description: '柔和色系的收藏腕錶', icon: 'clock', color: c.candyLavender },
    { name: '絲緞方巾', description: '有細緻花紋的柔軟方巾', icon: 'feather', color: c.candyPink },
    { name: '花朵胸針', description: '為外套加上一點色彩', icon: 'sun', color: c.candyCoral },
    { name: '迷你皮革卡夾', description: '方便收納卡片的小皮件', icon: 'credit-card', color: c.candyCaramel },
    { name: '珍珠項鍊', description: '簡潔優雅的珍珠配件', icon: 'circle', color: c.candyLemon },
    { name: '緞帶髮夾', description: '柔和色系的日常髮飾', icon: 'gift', color: c.candyMint },
  ],
  cosmetics: [
    { name: '雲朵氣墊粉餅', description: '輕透底妝粉餅與柔軟粉撲', icon: 'sun', color: c.candyPink, illustration: 'compact' },
    { name: '莓果緞光唇膏', description: '柔滑顯色的莓果系唇膏', icon: 'heart', color: c.candyRoseDark, illustration: 'lipstick' },
    { name: '星河九色眼影盤', description: '星點亮片搭配日常霧面眼影', icon: 'star', color: c.candyLavenderDark, illustration: 'palette' },
    { name: '花瓣捲翹睫毛膏', description: '輕盈刷頭打造自然捲翹睫毛', icon: 'eye', color: c.candyCoral, illustration: 'mascara' },
    { name: '柔霧水光粉底液', description: '奶油柔霧妝感的輕盈粉底', icon: 'droplet', color: c.candyPeach, illustration: 'bottle' },
    { name: '奶油雲朵刷具組', description: '收納粉底刷、腮紅刷和眼影刷', icon: 'edit-2', color: c.candyMint, illustration: 'brush' },
    { name: '櫻花透亮腮紅盤', description: '自然提氣色的柔粉腮紅餅', icon: 'sun', color: c.candyPink, illustration: 'compact' },
    { name: '糖果星點指甲油', description: '帶有細緻星點的糖果色指甲油', icon: 'droplet', color: c.candySky, illustration: 'nailPolish' },
    { name: '玫瑰豆沙霧面唇膏', description: '帶紫調的玫瑰豆沙色霧面唇膏', icon: 'heart', color: c.candyRoseDark, illustration: 'lipstick' },
    { name: '蜜桃奶茶水光唇釉', description: '溫柔蜜桃奶茶色的透亮唇釉', icon: 'heart', color: c.candyCaramelDark, illustration: 'lipstick' },
    { name: '櫻桃紅莓鏡面唇釉', description: '鮮明紅莓色與鏡面水光妝效', icon: 'heart', color: c.primary, illustration: 'lipstick' },
    { name: '珊瑚橘花瓣唇膏', description: '明亮珊瑚橘色的柔滑唇膏', icon: 'heart', color: c.candyOrange, illustration: 'lipstick' },
    { name: '紫葡萄星砂唇釉', description: '深紫葡萄色配細緻星砂亮片', icon: 'heart', color: c.candyLavenderDark, illustration: 'lipstick' },
    { name: '櫻花粉棕六色眼影盤', description: '柔粉、玫瑰棕與細閃香檳色', icon: 'star', color: c.candyRoseDark, illustration: 'palette' },
    { name: '海鹽藍紫暈染盤', description: '海霧藍與淡紫色的清透眼影', icon: 'star', color: c.candySkyDark, illustration: 'palette' },
    { name: '楓糖暖棕眼影盤', description: '楓糖棕、焦糖金與奶油米色', icon: 'star', color: c.candyCaramelDark, illustration: 'palette' },
    { name: '薄荷晨露珠光眼影', description: '薄荷綠與晨露銀光的清新色系', icon: 'star', color: c.candyMintDark, illustration: 'palette' },
    { name: '珊瑚夕陽眼影盤', description: '珊瑚粉、暖橘與夕陽金色', icon: 'star', color: c.candyOrange, illustration: 'palette' },
    { name: '夜空星塵深紫眼影盤', description: '深紫、莓果與月光銀的晚宴色系', icon: 'star', color: c.candyLavenderDark, illustration: 'palette' },
  ],
  photoStudio: [
    { name: '春日花拱背景幕', description: '柔粉花拱門前的明亮人像布景', icon: 'feather', color: c.candyPink, illustration: 'postcard' },
    { name: '星河夜景攝影幕', description: '點亮月色與星光的深藍背景', icon: 'moon', color: c.candyLavender, illustration: 'postcard' },
    { name: '古典宮廷窗景布', description: '奶油金拱窗與柔垂帷幕場景', icon: 'home', color: c.candyCaramel, illustration: 'postcard' },
    { name: '海風花園背景布', description: '以清新海藍和花園拱門拍照', icon: 'wind', color: c.candySky, illustration: 'postcard' },
    { name: '復古學院造型洋裝', description: '適合書廊與窗景拍攝的學院風服飾', icon: 'shopping-bag', color: c.candyMint, illustration: 'garment' },
    { name: '星光芭蕾舞會禮服', description: '淡紫薄紗與星點細節的拍攝禮服', icon: 'star', color: c.candyLavender, illustration: 'garment' },
    { name: '珍珠緞帶髮飾', description: '為人像造型加上柔和亮點', icon: 'gift', color: c.candyPeach, illustration: 'hairclip' },
    { name: '復古拍立得相機', description: '記錄每一套服飾與布景搭配', icon: 'camera', color: c.candyCoral, illustration: 'camera' },
  ],
};

type CosmeticsTryOnShade = {
  name: string;
  color: string;
  finish: NonNullable<ShopDisplayProduct['finish']>;
};

const cosmeticsTryOnLipsticks: CosmeticsTryOnShade[] = [
  { name: '豆沙玫瑰唇膏', color: '#B87582', finish: 'satin' },
  { name: '櫻桃果凍唇釉', color: '#E91E63', finish: 'gloss' },
  { name: '電光莓粉唇釉', color: '#FF168C', finish: 'gloss' },
  { name: '覆盆子星閃唇釉', color: '#D5006D', finish: 'glitter' },
  { name: '珊瑚汽水唇膏', color: '#FF5A5F', finish: 'gloss' },
  { name: '蜜桃果醬唇釉', color: '#F47C73', finish: 'gloss' },
  { name: '日落橘紅唇膏', color: '#F04E23', finish: 'matte' },
  { name: '南瓜糖橘唇膏', color: '#E96B20', finish: 'satin' },
  { name: '朱砂紅唇膏', color: '#C62828', finish: 'matte' },
  { name: '正紅絲絨唇膏', color: '#B5122A', finish: 'matte' },
  { name: '石榴深紅唇釉', color: '#8E1538', finish: 'satin' },
  { name: '酒釀莓紅唇膏', color: '#720026', finish: 'matte' },
  { name: '玫瑰木棕唇膏', color: '#8D4A47', finish: 'matte' },
  { name: '焦糖裸棕唇釉', color: '#B96D4C', finish: 'gloss' },
  { name: '奶茶裸色唇膏', color: '#C8866B', finish: 'satin' },
  { name: '蜜糖杏色唇膏', color: '#DDA284', finish: 'matte' },
  { name: '夕霧裸粉唇釉', color: '#C77F8B', finish: 'satin' },
  { name: '玫瑰金砂唇釉', color: '#C37A82', finish: 'glitter' },
  { name: '紫葡萄唇釉', color: '#8025A0', finish: 'gloss' },
  { name: '梅子紅酒唇膏', color: '#5D1C44', finish: 'satin' },
  { name: '午夜莓紫唇膏', color: '#42104A', finish: 'matte' },
  { name: '極光紫閃唇釉', color: '#9327C5', finish: 'glitter' },
  { name: '水晶桃粉唇釉', color: '#FF7FA8', finish: 'shimmer' },
  { name: '冰糖櫻粉唇膏', color: '#F5A3C7', finish: 'gloss' },
  { name: '薔薇紅晶唇釉', color: '#B5265D', finish: 'glitter' },
  { name: '柿子蜜橙唇膏', color: '#F28C28', finish: 'satin' },
  { name: '香檳粉光唇釉', color: '#E5A8A7', finish: 'shimmer' },
  { name: '星河幻彩唇釉', color: '#C070D8', finish: 'glitter' },
  { name: '深海莓果唇膏', color: '#4E1D55', finish: 'satin' },
  { name: '蜜金微閃唇釉', color: '#D4A43A', finish: 'glitter' },
];

const cosmeticsTryOnEyeshadows: CosmeticsTryOnShade[] = [
  { name: '玫瑰花瓣眼影', color: '#E91E63', finish: 'matte' },
  { name: '電光莓粉眼影', color: '#FF168C', finish: 'satin' },
  { name: '珊瑚亮粉眼影', color: '#F50057', finish: 'glitter' },
  { name: '蜜桃橘粉眼影', color: '#FF6F61', finish: 'matte' },
  { name: '日落橙紅眼影', color: '#E64A19', finish: 'satin' },
  { name: '蜜糖金棕眼影', color: '#A96012', finish: 'matte' },
  { name: '香檳金砂眼影', color: '#C5961A', finish: 'glitter' },
  { name: '焦糖奶茶眼影', color: '#98604A', finish: 'matte' },
  { name: '可可煙棕眼影', color: '#5F3A32', finish: 'satin' },
  { name: '古銅星塵眼影', color: '#8A4B08', finish: 'glitter' },
  { name: '薄荷森林眼影', color: '#007F5F', finish: 'matte' },
  { name: '翠綠寶石眼影', color: '#00875A', finish: 'satin' },
  { name: '海玻璃青眼影', color: '#007C91', finish: 'shimmer' },
  { name: '湖水藍眼影', color: '#0284C7', finish: 'matte' },
  { name: '藍寶石眼影', color: '#1748A8', finish: 'satin' },
  { name: '午夜海軍藍眼影', color: '#172554', finish: 'matte' },
  { name: '冰川銀藍眼影', color: '#5E8FA8', finish: 'shimmer' },
  { name: '深海藍星砂眼影', color: '#2459B3', finish: 'glitter' },
  { name: '薰衣草霧眼影', color: '#A78BFA', finish: 'matte' },
  { name: '紫羅蘭眼影', color: '#7B2CBF', finish: 'satin' },
  { name: '午夜深紫眼影', color: '#4B0082', finish: 'matte' },
  { name: '電光皇家紫眼影', color: '#5B18A8', finish: 'gloss' },
  { name: '葡萄酒紫眼影', color: '#642B73', finish: 'satin' },
  { name: '紫水晶星塵眼影', color: '#8A2BE2', finish: 'glitter' },
  { name: '梅子煙燻眼影', color: '#5D1F46', finish: 'matte' },
  { name: '煙灰紫眼影', color: '#6E607D', finish: 'shimmer' },
  { name: '霜晶銀眼影', color: '#B9C4D1', finish: 'glitter' },
  { name: '玫瑰粉鑽眼影', color: '#D81B60', finish: 'glitter' },
  { name: '極光靛紫眼影', color: '#4338CA', finish: 'glitter' },
  { name: '薔薇星雲眼影', color: '#F10D83', finish: 'glitter' },
];

export function getCosmeticsTryOnCatalog(): ShopDisplayProduct[] {
  const createShade = (
    shade: CosmeticsTryOnShade,
    category: 'lipstick' | 'palette',
    index: number,
  ): ShopDisplayProduct => {
    const finishLabel = {
      matte: '柔霧',
      satin: '緞光',
      gloss: '水光',
      shimmer: '珠光',
      glitter: '細閃亮片',
    }[shade.finish];
    return {
      id: `cosmetics-tryon-${category}-${String(index + 1).padStart(2, '0')}`,
      name: shade.name,
      description: `${finishLabel}妝效，只套用於試妝預覽。`,
      icon: category === 'lipstick' ? 'heart' : 'star',
      color: shade.color,
      theme: 'cosmetics',
      illustration: category,
      variant: index,
      finish: shade.finish,
    };
  };

  return [
    ...cosmeticsTryOnLipsticks.map((shade, index) => createShade(shade, 'lipstick', index)),
    ...cosmeticsTryOnEyeshadows.map((shade, index) => createShade(shade, 'palette', index)),
  ];
}

const productIllustrationByTheme: Record<ProductTheme, ShopProductIllustration> = {
  fragrance: 'bottle',
  general: 'gift',
  cafe: 'drink',
  candy: 'treat',
  icecream: 'treat',
  bakery: 'treat',
  onsen: 'gift',
  tea: 'drink',
  food: 'treat',
  flower: 'flower',
  book: 'book',
  toy: 'gift',
  craft: 'gift',
  womenswear: 'garment',
  bridal: 'garment',
  eveningwear: 'garment',
  kimono: 'garment',
  supermarket: 'produce',
  hyakuen: 'gift',
  swimwear: 'garment',
  cosplay: 'garment',
  electronics: 'device',
  boutique: 'jewel',
  cosmetics: 'compact',
  photoStudio: 'camera',
  chiikawa: 'plush',
  winnie: 'plush',
  animalPajama: 'garment',
  laceFabric: 'garment',
  halloween: 'gift',
  easter: 'gift',
  christmas: 'gift',
  fruitMarket: 'produce',
  chineseCuisine: 'bento',
  icecreamParlor: 'icecream',
};

function inferProductIllustration(
  name: string,
  theme: ProductTheme,
  fallback?: ShopProductIllustration,
): ShopProductIllustration {
  if (/氣墊粉餅|蜜粉餅|腮紅盤|修容餅|打亮餅/.test(name)) return 'compact';
  if (/背景幕|背景布|攝影幕|布景|背景牆/.test(name)) return 'postcard';
  if (/唇膏|唇釉|口紅|唇蜜/.test(name)) return 'lipstick';
  if (/眼影盤|眼影色盤|九色眼影/.test(name)) return 'palette';
  if (/睫毛膏|眼線液/.test(name)) return 'mascara';
  if (/指甲油/.test(name)) return 'nailPolish';
  if (/粉底刷|彩妝刷|刷具/.test(name)) return 'brush';
  if (/手提包|手袋|小方包|手拿包|包袋|水母包|荷包/.test(name)) return 'handbag';
  if (/卡夾|卡套|錢包|零錢包/.test(name)) return 'wallet';
  if (/耳環|耳飾/.test(name)) return 'earring';
  if (/腕錶|手錶|手表|時計/.test(name)) return 'watch';
  if (/圍巾|方巾|披肩|絲巾/.test(name)) return 'scarf';
  if (/假髮/.test(name)) return 'wig';
  if (/斗篷|披風/.test(name)) return 'cloak';
  if (/髮飾|髮夾|髮簪|髮梳|髮箍|頭紗/.test(name)) return 'hairclip';
  if (/鞋|木屐/.test(name)) return 'shoe';
  if (/項鍊|項鏈|珍珠鍊/.test(name)) return 'necklace';
  if (/浴巾|毛巾|沙灘巾/.test(name)) return 'towel';
  if (/扇子|摺扇/.test(name)) return 'fan';
  if (/胸針|別針|徽章/.test(name)) return 'jewel';
  if (/香氛石|擴香石/.test(name)) return 'diffuserStone';
  if (/按摩梳|木梳/.test(name)) return 'brush';
  if (/香包/.test(name)) return 'sachet';
  if (/眼罩/.test(name)) return 'mask';
  if (/木桶|泡腳桶/.test(name)) return 'bucket';
  if (/禮盒|收納盒/.test(name)) return 'box';
  if (/冰棒/.test(name)) return 'popsicle';
  if (/冰淇淋|雪糕|冰品|雪球|三球杯/.test(name)) return 'icecream';
  if (/烏龍茶|冰茶|熱茶|奶蓋/.test(name)) return 'teaCup';
  if (/蜂蜜水/.test(name)) return 'bottle';
  if (/冰沙|飲|拿鐵|奶茶|氣泡茶/.test(name)) return 'drink';
  if (/布丁/.test(name)) return 'pudding';
  if (/蛋糕|馬芬|小塔|蛋塔/.test(name)) return 'cake';
  if (/鬆餅|可麗餅/.test(name)) return 'pancake';
  if (/曲奇|餅乾/.test(name)) return 'cookie';
  if (/可頌/.test(name)) return 'croissant';
  if (/麵包|菠蘿包|咖喱包/.test(name)) return 'bread';
  if (/棒棒糖/.test(name)) return 'lollipop';
  if (/糖罐/.test(name)) return 'bottle';
  if (/棉花糖/.test(name)) return 'cloud';
  if (/軟糖|糖果|糖球|巧克力/.test(name)) return 'candy';
  if (/披薩/.test(name)) return 'pizza';
  if (/飯糰|飯團|海苔|小卷|壽司/.test(name)) return 'riceball';
  if (/便當|餐盒|餐具/.test(name)) return 'bento';
  if (/泳衣|比基尼|防曬上衣/.test(name)) return 'swimwear';
  if (/上衣|襯衫|裙|禮服|手套|羽織|和服|浴衣/.test(name)) return 'garment';
  if (/盆栽|多肉/.test(name)) return 'plant';
  if (/水果|蔬菜|草莓|莓果|鮮蔬/.test(name)) return 'produce';
  if (/小熊布偶|布偶|玩偶/.test(name)) return 'plush';
  if (/積木/.test(name)) return 'blocks';
  if (/扭蛋/.test(name)) return 'capsule';
  if (/拼圖/.test(name)) return 'puzzle';
  if (/音樂盒/.test(name)) return 'musicbox';
  if (/火車/.test(name)) return 'train';
  if (/編織線|毛線/.test(name)) return 'yarn';
  if (/陶瓷杯|造型杯|迷你陶瓷杯/.test(name)) return 'mug';
  if (/陶瓷|陶土/.test(name)) return 'pottery';
  if (/花籃|編織花籃/.test(name)) return 'basket';
  if (/手杖|魔法棒/.test(name)) return 'wand';
  if (/帽/.test(name)) return 'hat';
  if (/紙盒/.test(name)) return 'carton';
  if (/零食包|分享包/.test(name)) return 'snack';
  if (/耳機/.test(name)) return 'headphones';
  if (/相機|拍立得/.test(name)) return 'camera';
  if (/喇叭/.test(name)) return 'speaker';
  if (/遊戲機/.test(name)) return 'gameConsole';
  if (/充電線/.test(name)) return 'cable';
  if (/投影機/.test(name)) return 'projector';
  if (/貼紙/.test(name)) return 'sticker';
  if (/明信片/.test(name)) return 'postcard';
  if (/彩色筆|畫筆/.test(name)) return 'pencil';
  if (/雲朵造型/.test(name)) return 'cloud';
  if (/杯/.test(name)) return 'mug';
  if (/吊飾|掛繩/.test(name)) return 'charm';
  if (/花束|捧花|盆栽|花瓶/.test(name)) return 'flower';
  if (/戒指/.test(name)) return 'ring';
  return fallback ?? productIllustrationByTheme[theme];
}

const additionalOnsenProductSeeds: ProductSeed[] = [
  { name: '櫻花手工沐浴皂', description: '以櫻花花瓣作為靈感的柔和香皂', icon: 'heart', color: c.candyRose, illustration: 'bathSoap' },
  { name: '柚香泡湯香氛袋', description: '可掛在浴室中的柚子香草布香包', icon: 'sun', color: c.candyLemon, illustration: 'bathPouch' },
  { name: '檜木洗浴木盆', description: '檜木色的小型洗浴盆與木紋細節', icon: 'droplet', color: c.candyCaramel, illustration: 'woodenBath' },
  { name: '梅花浴衣小禮服', description: '以梅花紋樣點綴的輕柔泡湯浴衣', icon: 'feather', color: c.candyLavender, illustration: 'yukata' },
];

const packageVariants = [
  { label: '春日櫻花限定', color: c.candyRose },
  { label: '星河月光限定', color: c.candyLavender },
  { label: '海風藍調限定', color: c.candySky },
  { label: '薄荷花園限定', color: c.candyMint },
  { label: '陽光蜂蜜限定', color: c.candyLemon },
  { label: '奶油焦糖限定', color: c.candyCaramel },
  { label: '珊瑚晚霞限定', color: c.candyCoral },
];

const NARUTO_CHARACTER_FIXTURE_IDS = new Set([
  'cosplay-limited-starlight-magician',
  'cosplay-limited-galaxy-armor',
  'cosplay-fairy-wing-costume',
  'cosplay-hero-cape-collection',
  'cosplay-sasuke-character-wardrobe',
  'cosplay-itachi-character-wardrobe',
  'cosplay-hero-costume-wardrobe',
]);

const narutoWardrobeProducts: FeaturedProductSeed[] = [
  {
    key: 'kakashi-jonin-vest',
    name: '卡卡西・上忍綠色背心套裝',
    description: '綠色多口袋背心搭配深藍內搭與護額風布帶的原創角色服。',
    icon: 'shield',
    color: c.candyMintDark,
    illustration: 'garment',
    fixtureIds: ['cosplay-hero-cape-collection'],
  },
  {
    key: 'naruto-seventh-hokage-cloak',
    name: '鳴人・第七代火影橘黑斗篷',
    description: '以橘黑拼色、高領和長斗篷輪廓設計的原創火影主題服。',
    icon: 'wind',
    color: c.candyCoral,
    illustration: 'cloak',
    fixtureIds: ['cosplay-limited-starlight-magician'],
  },
  {
    key: 'naruto-classic-ninja-suit',
    name: '鳴人・橘黑忍者服',
    description: '橘色上衣配黑色細節與護額風髮帶的角色造型。',
    icon: 'star',
    color: c.candyCoral,
    illustration: 'garment',
    fixtureIds: ['cosplay-limited-starlight-magician'],
  },
  {
    key: 'sasuke-high-collar-jacket',
    name: '佐助・深藍高領忍者外套',
    description: '深藍高領剪裁搭配淺色腰帶的角色服裝。',
    icon: 'wind',
    color: c.candySkyDark,
    illustration: 'garment',
    fixtureIds: ['cosplay-sasuke-character-wardrobe'],
  },
  {
    key: 'sakura-rose-ninja-dress',
    name: '小櫻・玫瑰紅忍者裙裝',
    description: '粉紅與莓紅拼色的短外套裙裝，加入俐落忍者風袖口。',
    icon: 'heart',
    color: c.candyRose,
    illustration: 'garment',
    fixtureIds: ['cosplay-fairy-wing-costume'],
  },
  {
    key: 'itachi-crimson-travel-cloak',
    name: '鼬・深色紅雲旅行斗篷',
    description: '深色長斗篷搭配柔紅雲紋布章的原創角色造型。',
    icon: 'cloud',
    color: c.candyInk,
    illustration: 'cloak',
    fixtureIds: ['cosplay-itachi-character-wardrobe'],
  },
  {
    key: 'gaara-desert-kage-robe',
    name: '我愛羅・砂色風影長袍',
    description: '砂金與珊瑚色層次構成的長袍造型。',
    icon: 'sun',
    color: c.candyCaramel,
    illustration: 'cloak',
    fixtureIds: ['cosplay-hero-costume-wardrobe'],
  },
  {
    key: 'hinata-lilac-ninja-tunic',
    name: '雛田・紫藤忍者束袖服',
    description: '柔紫束袖上衣配奶油白護具與腰帶。',
    icon: 'feather',
    color: c.candyLavender,
    illustration: 'garment',
    fixtureIds: ['cosplay-hero-costume-wardrobe'],
  },
  {
    key: 'jiraiya-sage-travel-coat',
    name: '自來也・赤紅仙人旅行外袍',
    description: '赤紅外袍配淺色內搭與寬鬆旅人輪廓。',
    icon: 'wind',
    color: c.candyCoral,
    illustration: 'cloak',
    fixtureIds: ['cosplay-hero-costume-wardrobe'],
  },
  {
    key: 'tsunade-green-haori',
    name: '綱手・薄荷綠忍者外套',
    description: '薄荷綠外套搭配暖色腰帶與袖口細節。',
    icon: 'star',
    color: c.candyMint,
    illustration: 'garment',
    fixtureIds: ['cosplay-hero-costume-wardrobe'],
  },
];

const akatsukiMembers = [
  { key: 'pain-nagato', name: '佩恩・長門', color: c.candyCoral, hair: c.candyCaramel },
  { key: 'konan', name: '小南', color: c.candyLavender, hair: c.candySky },
  { key: 'itachi', name: '宇智波鼬', color: c.candyRose, hair: c.candyInk },
  { key: 'kisame', name: '干柿鬼鮫', color: c.candySky, hair: c.candySkyDark },
  { key: 'deidara', name: '迪達拉', color: c.candyLemon, hair: c.candyLemon },
  { key: 'sasori', name: '蠍', color: c.candyCoral, hair: c.candyRose },
  { key: 'hidan', name: '飛段', color: c.candyCream, hair: c.candyCream },
  { key: 'kakuzu', name: '角都', color: c.candyMintDark, hair: c.candyInk },
  { key: 'tobi-obito', name: '阿飛・帶土', color: c.candyPeach, hair: c.candyInk },
  { key: 'zetsu', name: '絕', color: c.candyMint, hair: c.candyInk },
  { key: 'orochimaru', name: '大蛇丸（前成員）', color: c.candyLavender, hair: c.candyCream },
];

const akatsukiWardrobeProducts: FeaturedProductSeed[] = akatsukiMembers.flatMap((member) => [
  {
    key: `${member.key}-ring`,
    name: `曉・${member.name}角色戒指`,
    description: `以${member.name}的角色色彩設計，配柔紅主題鑲飾的原創收藏戒指。`,
    icon: 'circle',
    color: member.color,
    illustration: 'ring',
  },
  {
    key: `${member.key}-wig`,
    name: `曉・${member.name}造型假髮`,
    description: `以${member.name}的髮型輪廓和代表色設計的 Cosplay 假髮。`,
    icon: 'user',
    color: member.hair,
    illustration: 'wig',
  },
  {
    key: `${member.key}-cloak`,
    name: `曉・${member.name}紅雲長斗篷`,
    description: `以${member.name}為靈感的深色長斗篷，配原創柔紅雲紋布章。`,
    icon: 'cloud',
    color: c.candyInk,
    illustration: 'cloak',
  },
]);

function createFeaturedProduct(
  theme: ProductTheme,
  seed: FeaturedProductSeed,
  idPrefix: string,
  variant: number,
  color = seed.color,
  suffix = '',
): ShopDisplayProduct {
  return {
    id: `${idPrefix}-${seed.key}${suffix}`,
    name: suffix ? `${seed.name}・${packageVariants[variant % packageVariants.length].label}配色` : seed.name,
    description: suffix
      ? `${seed.description}，採用柔和彩色主題重新搭配。`
      : seed.description,
    icon: seed.icon,
    color,
    theme,
    illustration: seed.illustration ?? inferProductIllustration(seed.name, theme),
    variant,
    ...(seed.fixtureIds ? { fixtureIds: seed.fixtureIds } : {}),
  };
}

function createAkatsukiWardrobeCatalog(): ShopDisplayProduct[] {
  const base = akatsukiWardrobeProducts.map((seed, index) =>
    createFeaturedProduct('cosplay', seed, 'display-cosplay-akatsuki', index),
  );
  const alternatePalettes = akatsukiWardrobeProducts.slice(0, 27).map((seed, index) =>
    createFeaturedProduct(
      'cosplay',
      seed,
      'display-cosplay-akatsuki',
      index + 1,
      packageVariants[index % packageVariants.length].color,
      `-palette-${String(index + 1).padStart(2, '0')}`,
    ),
  );
  return [...base, ...alternatePalettes];
}

const fixturePattern = /shelf|shelves|rack|showcase|display|display-case|display-cabinet|wardrobe|cabinet|pedestal|island|counter|陳列|展示|貨架|衣架|衣櫃|衣柜|收納架|櫥窗|櫃台|櫃|柜|架/i;

export function canDisplayShopProducts(decoration: ShopInteriorDecoration): boolean {
  return fixturePattern.test(`${decoration.id} ${decoration.name} ${decoration.description}`);
}

function resolveProductTheme(
  shopId: string,
  shopName: string,
  shopType: MallShopType | undefined,
): ProductTheme {
  const identity = `${shopId} ${shopName}`;
  if (/fragrance|aroma|diffuser|香氛|香薰|擴香|扩香|香氣|香气/i.test(identity)) return 'fragrance';
  if (/portrait-photo-studio|寫真館|個人寫真|photo.?studio|portrait.?studio/i.test(identity)) return 'photoStudio';
  if (/chiikawa|吉伊卡哇|ちいかわ/i.test(identity)) return 'chiikawa';
  if (/winnie|pooh|小熊維尼|百畝森林|跳跳虎|屹耳/i.test(identity)) return 'winnie';
  if (/animal-pajama|animal-onesie|動物睡衣|連身睡衣/i.test(identity)) return 'animalPajama';
  if (/lace-fabric|萊斯布料|蕾絲布料|服裝訂製/i.test(identity)) return 'laceFabric';
  if (/halloween|萬聖節/i.test(identity)) return 'halloween';
  if (/easter|復活節|彩蛋店/i.test(identity)) return 'easter';
  if (/christmas|聖誕節|聖誕雪花/i.test(identity)) return 'christmas';
  if (/fresh-fruit-market|鮮果專門店|水果專賣/i.test(identity)) return 'fruitMarket';
  if (/chinese-cuisine|中菜館|中式餐館/i.test(identity)) return 'chineseCuisine';
  if (/snowflake-icecream|雪花雪糕|霜雪雪糕/i.test(identity)) return 'icecreamParlor';
  if (shopType && shopType !== 'general') return shopType;
  if (/溫泉|櫻花暖湯|湯宿|湯煙|泡湯|浴衣|onsen|hot.?spring/i.test(identity)) return 'onsen';
  if (/咖啡|coffee|cafe|烘豆/i.test(identity)) return 'cafe';
  if (/糖果|軟糖|棉花糖|彩糖|糖藝|糖霜|candy|sweets/i.test(identity)) return 'candy';
  if (/雪糕|冰淇淋|冰棒|冰沙|gelato|ice.?cream|smoothie/i.test(identity)) return 'icecream';
  if (/烘焙|麵包|曲奇|餅乾|甜甜圈|鬆餅|布丁|馬卡龍|巧克力|甜點|甜品|bakery|pastry/i.test(identity)) return 'bakery';
  if (/奶茶|茶|飲品|飲料|bubble.?tea|tea.?shop|冰飲/i.test(identity)) return 'tea';
  if (/食堂|食館|小食|飯糰|咖喱|咖哩|披薩|意粉|可麗餅|料理|餐|kitchen|noodle|food|restaurant/i.test(identity)) return 'food';
  if (/花|植物|園藝|苗圃|盆栽|花藝|flower|florist|plant/i.test(identity)) return 'flower';
  if (/書|文具|手帳|紙品|明信片|繪本|漫畫|雜誌|book|stationery/i.test(identity)) return 'book';
  if (/扭蛋|玩偶|玩具|遊戲|模型|積木|卡牌|街機|toy|capsule|arcade/i.test(identity)) return 'toy';
  if (/工房|工藝|陶|畫室|畫作|手作|編織|刺繡|玻璃|皮革|craft|studio|atelier|ceramic/i.test(identity)) return 'craft';
  return 'general';
}

export function getShopFixtureProductCatalog(
  shopId: string,
  shopName: string,
  shopType: MallShopType | undefined,
  decoration: ShopInteriorDecoration,
): ShopDisplayProduct[] {
  if (!canDisplayShopProducts(decoration)) return [];
  const theme = resolveProductTheme(shopId, shopName, shopType);
  const illustration = productIllustrationByTheme[theme];
  const catalog: ShopDisplayProduct[] = productSeeds[theme].map((seed, index) => ({
    id: `display-${theme}-${index + 1}`,
    ...seed,
    theme,
    illustration: seed.illustration ?? inferProductIllustration(seed.name, theme, illustration),
    variant: index,
  }));
  for (let variantIndex = 0; variantIndex < packageVariants.length && catalog.length < 60; variantIndex += 1) {
    const variant = packageVariants[variantIndex];
    for (const seed of productSeeds[theme]) {
      if (catalog.length >= 60) break;
      catalog.push({
        id: `display-${theme}-${catalog.length + 1}`,
        name: `${seed.name}・${variant.label}款`,
        description: `${seed.description}，採用${variant.label}包裝。`,
        icon: seed.icon,
        color: variant.color,
        theme,
        illustration: seed.illustration ?? inferProductIllustration(seed.name, theme, illustration),
        variant: catalog.length,
      });
    }
  }
  if (theme === 'onsen') {
    const existingProducts = catalog.slice(0, 56);
    catalog.splice(
      0,
      catalog.length,
      ...existingProducts,
      ...additionalOnsenProductSeeds.map((seed, index) => ({
        id: `display-onsen-${index + 57}`,
        ...seed,
        theme: 'onsen' as const,
        illustration: seed.illustration ?? 'gift',
        variant: index + 56,
      })),
    );
  }
  if (theme === 'cosplay' && decoration.id === 'cosplay-akatsuki-collection-wardrobe') {
    return createAkatsukiWardrobeCatalog();
  }
  if (theme === 'cosplay' && NARUTO_CHARACTER_FIXTURE_IDS.has(decoration.id)) {
    return [
      ...catalog,
      ...narutoWardrobeProducts.map((seed, index) => {
        const product = createFeaturedProduct('cosplay', seed, 'display-cosplay-naruto', catalog.length + index);
        return {
          ...product,
          legacyOnly: !!seed.fixtureIds && !seed.fixtureIds.includes(decoration.id),
        };
      }),
    ];
  }
  return catalog;
}
