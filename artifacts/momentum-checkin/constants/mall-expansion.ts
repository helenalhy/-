import type { MallFloorTheme, MallItem } from './mall';
import type { RewardCategory } from '@/context/HabitsContext';
import palette from './colors';
import { LOWER_COLLECTIONS } from './mall-additions-lower';
import { UPPER_COLLECTIONS } from './mall-additions-upper';

type Visual = NonNullable<MallItem['visual']>;
const c = palette.light;

// Append-only collections: never reorder or rename existing entries without an ID migration.
// The ordinal IDs are persisted with purchases; the original 90 entries remain untouched.
const COLLECTIONS: Record<RewardCategory, string[]>[] = [
  {
    shop: ['甜甜圈工房', '焦糖布丁屋', '手工巧克力店', '棉花糖小舖', '蜂蜜鬆餅店', '奶油曲奇屋', '馬卡龍專門店', '水果軟糖店', '彩糖文具店', '微笑玩偶屋', '暖心卡片店', '糖果飾物舖', '緞帶包裝店', '香草雪糕屋', '熊熊精品店', '花瓣糖藝店', '週末禮盒店'],
    facility: ['糖果許願池', '迎賓等候座', '親子共享桌', '午後涼亭', '晨間伸展台', '棉花糖鞦韆', '迎賓演奏台', '氣泡水景缸', '街角觀景鏡', '糖果造型展台', '星光迎賓步道', '幸運水花池', '手作體驗桌', '親子故事亭', '雙人休閒鞦韆', '放鬆呼吸角', '週末活動舞台'],
    decor: ['糖果鬱金香盆', '蜜糖小路燈', '甜點插畫組', '奶油貝殼燈', '棉花雲吊飾', '微笑霓虹牌', '香草擴香瓶', '糖果罐展示架', '迎賓彩虹門', '草莓色長椅', '軟糖幾何雕塑', '奶油雛菊盆', '焦糖暖光燈', '手繪歡迎畫框', '小熊星星吊飾', '杏桃柔光燈', '緞帶禮物展示架'],
  },
  {
    shop: ['蕨類研究所', '苔蘚小森林', '多肉植物舖', '蘭花溫室店', '四季種子屋', '盆栽工具店', '森林蜂蜜店', '香草苗圃', '乾燥花工房', '葉脈手作店', '花園野餐舖', '草本香皂店', '森系木作店', '果樹苗木店', '蝴蝶標本藝舖', '花語卡片屋', '植物陶盆店'],
    facility: ['葉影流水池', '樹蔭休息座', '園藝體驗桌', '蕨葉觀察亭', '森林伸展台', '花藤雙人鞦韆', '林間木舞台', '溪流生態缸', '賞鳥觀察鏡', '葉形雕塑台', '林蔭漫步道', '青石湧泉池', '種子交換桌', '雨聲休憩亭', '綠葉吊椅架', '晨露呼吸平台', '花季分享舞台'],
    decor: ['龜背葉花盆', '螢光蘑菇燈', '植物手繪畫框', '葉脈柔光燈', '蝴蝶葉片吊飾', '森林入口燈牌', '雪松擴香瓶', '種子玻璃瓶架', '藤葉花園拱門', '樹皮長椅', '葉芽木雕', '繡球花陶盆', '花苞庭園燈', '森林風景畫組', '小鳥風鈴吊飾', '花瓣玻璃燈', '園藝工具展示架'],
  },
  {
    shop: ['旅行書店', '推理小說屋', '詩集小書房', '繪本故事店', '古籍選書舖', '漫畫收藏屋', '獨立雜誌店', '鋼筆墨水舖', '手帳工房', '書籤專門店', '地圖與紙品', '二手好書店', '攝影集藝舖', '文學明信片店', '紙膠帶小屋', '藏書票工房', '有聲故事小店'],
    facility: ['靜讀水景池', '單人閱讀座', '讀書會長桌', '詩歌朗讀亭', '護眼休息台', '書香吊椅架', '作者分享舞台', '河川知識水族缸', '天文閱讀觀察鏡', '翻頁書本展台', '書廊散步道', '墨香流水池', '交換書共享桌', '繪本故事小亭', '親子閱讀鞦韆', '閱讀伸展角', '新書發表舞台'],
    decor: ['書桌綠植盆', '黃銅閱讀燈', '經典封面畫組', '紙頁柔光燈', '字母星月吊飾', '閱讀時光燈牌', '紙木香擴香器', '墨水瓶展示架', '故事彩虹拱門', '胡桃木書廊椅', '摺紙幾何雕塑', '窗邊常春藤盆', '書房暖光立燈', '作家肖像畫框', '羽毛書籤吊飾', '琥珀玻璃書燈', '藏書珍品展示架'],
  },
  {
    shop: ['珊瑚手作屋', '海鹽餅乾店', '浪花玻璃舖', '潛水選物店', '海星玩偶店', '珍珠小飾店', '帆船模型屋', '海圖明信片店', '沙灘編織舖', '海藻護膚店', '海豚精品店', '海鹽香氛屋', '水母燈藝店', '珊瑚陶器舖', '海風冰棒店', '漂流木工房', '藍鯨紀念店'],
    facility: ['海浪互動泉', '貝形休息座', '海洋手作桌', '浪花休憩亭', '潮聲冥想台', '海風吊椅架', '海豚故事舞台', '水母觀賞缸', '海景觀察鏡', '鯨尾雕塑台', '海藍玻璃步道', '貝殼流水池', '海洋科普桌', '珊瑚觀察亭', '珍珠雙人鞦韆', '潮汐呼吸平台', '海洋保育舞台'],
    decor: ['海草造景盆', '珍珠庭園燈', '海洋生物畫組', '海星柔光燈', '水母流蘇吊飾', '浪花霓虹牌', '海鹽擴香瓶', '貝殼標本架', '珊瑚彩虹拱門', '海藍休閒長椅', '浪花玻璃雕塑', '珊瑚花藝盆', '燈塔造型路燈', '帆船海景畫框', '小魚星月吊飾', '蚌殼夜光燈', '漂流瓶展示架'],
  },
  {
    shop: ['桌遊冒險店', '拼圖研究室', '掌機配件舖', '像素積木店', '電競周邊屋', '卡牌收藏店', '迷你模型舖', '節奏耳機店', '街機貼紙舖', '遊戲畫集店', '角色玩偶屋', '復古唱片店', '霓虹飾物舖', '魔方挑戰店', '掌上棋盤屋', '遊戲徽章店', '像素汽水站'],
    facility: ['像素音樂噴泉', '玩家休息座', '桌遊對戰桌', '遊戲攻略亭', '手腕伸展台', '像素雙人吊椅', '電競頒獎舞台', '發光像素水景缸', '遊樂城觀景鏡', '積木造型展台', '節拍地磚步道', '霓虹氣泡池', '拼圖協作長桌', '角色故事小亭', '歡樂街機鞦韆', '玩家舒展平台', '舞力挑戰舞台'],
    decor: ['像素仙人掌盆', '能量方塊燈', '遊戲海報畫框', '金幣柔光燈', '遊戲星星吊飾', '通關霓虹牌', '薄荷能量擴香器', '收藏卡牌展示架', '像素彩虹拱門', '電玩休閒長椅', '立方積木雕塑', '霓虹多肉盆', '街機暖光路燈', '復古遊戲畫組', '音符星月吊飾', '搖桿柔光燈', '迷你主機展示架'],
  },
  {
    shop: ['草本護膚屋', '天然精油舖', '柔軟毛巾店', '瑜伽選物店', '冥想音樂舖', '溫熱眼罩屋', '草本熱茶店', '手工沐浴球店', '睡眠枕頭舖', '香氛蠟燭工房', '柔光燈具店', '療癒石小舖', '伸展工具屋', '竹纖家品店', '晚安日記店', '晨光花草屋', '舒心抱枕舖'],
    facility: ['竹林靜水泉', '放空休息座', '花草茶共享桌', '香氣休憩亭', '柔軟伸展平台', '雲抱吊椅架', '療癒音樂台', '靜心水景缸', '晨光觀景鏡', '平衡石展示台', '赤足慢行步道', '溫柔流水池', '呼吸練習桌', '晚安故事小亭', '慢搖療癒鞦韆', '竹影靜心平台', '正念分享舞台'],
    decor: ['竹葉綠植盆', '晚安琥珀燈', '療癒風景畫組', '滿月柔光燈', '白雲羽毛吊飾', '慢慢呼吸燈牌', '洋甘菊擴香器', '草本香料瓶架', '療癒色彩拱門', '柔霧休息長椅', '平衡卵石雕塑', '薄荷香草盆', '晨光小路燈', '正念靜心畫框', '風聲月亮吊飾', '竹編柔光燈', '精油收藏展示架'],
  },
  {
    shop: ['水彩顏料店', '版畫工房', '雕塑工具舖', '刺繡手作屋', '皮革藝品店', '玻璃工藝舖', '編織毛線屋', '篆刻小印店', '藝術明信片舖', '攝影選物店', '彩色紙藝店', '木版印章屋', '手染布藝店', '琺瑯飾品舖', '藝術書籍店', '拼貼素材屋', '工藝紀念店'],
    facility: ['色彩流動噴泉', '藝廊欣賞座', '陶藝體驗桌', '靈感討論亭', '創作舒展台', '編織吊椅架', '街頭表演舞台', '光影水景缸', '景框觀察鏡', '流線雕塑展台', '馬賽克藝術步道', '水彩映光池', '拼貼共享桌', '畫家故事小亭', '彩繩雙人鞦韆', '藝術靜觀平台', '創作者發表舞台'],
    decor: ['陶土藝術花盆', '畫筆造型路燈', '抽象色彩畫組', '玻璃花瓣燈', '摺紙幾何吊飾', '靈感閃現霓虹牌', '雪松畫室擴香瓶', '顏料瓶展示架', '水彩暈染拱門', '藝廊拼色長椅', '幾何藝術雕塑', '手繪釉彩花盆', '暖橙展覽燈', '風景速寫畫框', '彩珠星月吊飾', '琉璃藝術夜燈', '手作陶器展示架'],
  },
  {
    shop: ['宇宙模型屋', '星圖文具店', '天文書籍舖', '太空玩偶店', '行星巧克力屋', '星砂飾品店', '極光香氛舖', '火箭模型工房', '銀河玻璃店', '太空種子屋', '星象明信片舖', '月球礦石店', '彗星徽章舖', '軌道積木屋', '星雲印物店', '星空投影小店', '宇航員紀念舖'],
    facility: ['星河循環噴泉', '太空艙休息座', '星圖討論桌', '宇宙導覽亭', '無重力伸展台', '月球吊椅架', '太空故事舞台', '星雲光影水景缸', '深空觀測鏡', '火箭模型展台', '銀河星光步道', '月面映光池', '火箭手作體驗桌', '星象故事小亭', '行星軌道鞦韆', '極光冥想平台', '天文發現分享台'],
    decor: ['太空植物盆', '土星環路燈', '銀河攝影畫組', '月面柔光燈', '火箭星星吊飾', '星際航行霓虹牌', '夜空香氛擴香器', '星球礦石展示架', '極光彩虹拱門', '銀河休息長椅', '行星環幾何雕塑', '星砂玻璃花盆', '彗星尾光燈', '天文星圖畫框', '流星軌道吊飾', '星雲玻璃夜燈', '宇宙模型展示架'],
  },
  {
    shop: ['手工披薩屋', '香料咖喱店', '日式飯糰舖', '港式茶點屋', '地中海輕食店', '手工意粉舖', '法式可麗餅店', '韓式小食屋', '墨西哥捲餅舖', '泰式甜品店', '手作果醬屋', '起司專門店', '烘豆咖啡舖', '茶葉研究所', '手工麵包店', '世界香料舖', '季節果塔屋'],
    facility: ['香橙水景泉', '食客休息座', '家庭聚餐桌', '市集遮蔭亭', '餐後舒展平台', '果園休閒吊椅', '市集音樂舞台', '流水食材展示缸', '市集觀景鏡', '料理文化展台', '風味市集步道', '清涼飲水景池', '烘焙教室長桌', '飲食故事小亭', '野餐雙人鞦韆', '花草品茶平台', '主廚示範舞台'],
    decor: ['香草料理盆', '麵包暖光路燈', '世界料理畫組', '蜂蜜玻璃燈', '水果星月吊飾', '美味出爐霓虹牌', '柑橘清香擴香器', '果醬玻璃瓶架', '豐收彩虹拱門', '市集木製長椅', '香料幾何雕塑', '迷迭香陶盆', '咖啡暖光燈', '手繪食譜畫框', '果實風鈴吊飾', '南瓜柔光夜燈', '手作麵包展示架'],
  },
  {
    shop: ['高空明信片店', '夕陽香氛舖', '露台咖啡屋', '天空園藝店', '風箏手作舖', '雲朵棉品屋', '虹光玻璃店', '城市攝影舖', '天際紀念屋', '晚霞珠寶店', '風鈴工藝舖', '高山茶選物店', '飛鳥紙藝屋', '晨曦麵包店', '雲端香草舖', '四季花冠工房', '日出禮物店'],
    facility: ['天際映光泉', '城市遠眺座', '露台野餐桌', '晨曦觀景亭', '高空伸展平台', '晚霞雙人吊椅', '雲端音樂舞台', '天空倒影水景缸', '日落觀景長鏡', '飛鳥雕塑展台', '彩霞花園步道', '雲影流水池', '花冠手作桌', '星夜休憩小亭', '日出花藤鞦韆', '天台瑜伽平台', '天空慶典舞台'],
    decor: ['高空繡球花盆', '夕陽庭園燈', '城市天際畫組', '雲彩柔光燈', '飛鳥星月吊飾', '追夢雲端霓虹牌', '清晨花香擴香器', '天空種子展示架', '晨曦花園拱門', '晚霞觀景長椅', '風之羽翼雕塑', '日出向日葵盆', '虹光小路燈', '雲海攝影畫框', '彩虹風鈴吊飾', '暮色玻璃夜燈', '四季花冠展示架'],
  },
];

const FACILITY_VISUALS: Visual[] = [
  'central-fountain', 'wooden-bench', 'tasting-court', 'rest-pavilion', 'yoga-deck',
  'cloud-swing', 'rhythm-stage', 'coral-aquarium', 'observatory-dome', 'sculpture-plaza',
  'cloud-walk', 'central-fountain', 'tasting-court', 'rest-pavilion', 'cloud-swing', 'yoga-deck', 'rhythm-stage',
];
const DECOR_VISUALS: Visual[] = [
  'colorful-planter', 'garden-lights', 'gallery-frames', 'shell-lantern', 'starlight-mobile',
  'neon-sign', 'aroma-diffuser', 'spice-display', 'rainbow-arch', 'wooden-bench',
  'sculpture-plaza', 'colorful-planter', 'garden-lights', 'gallery-frames', 'starlight-mobile', 'shell-lantern', 'spice-display',
];
const VISUAL_ICONS: Record<Visual, string> = {
  'central-fountain': 'droplet', 'wooden-bench': 'minus', 'tasting-court': 'grid',
  'rest-pavilion': 'home', 'yoga-deck': 'target', 'cloud-swing': 'anchor',
  'rhythm-stage': 'music', 'coral-aquarium': 'droplet', 'observatory-dome': 'compass',
  'sculpture-plaza': 'hexagon', 'cloud-walk': 'activity', 'colorful-planter': 'feather',
  'garden-lights': 'sun', 'gallery-frames': 'image', 'shell-lantern': 'sun',
  'starlight-mobile': 'moon', 'neon-sign': 'zap', 'aroma-diffuser': 'wind',
  'spice-display': 'package', 'rainbow-arch': 'sunrise',
};
const SWATCHES = [c.candyPink, c.candyMint, c.candySky, c.candyLavender, c.candyPeach, c.candyLemon, c.candyCoral];
const SHOP_ICONS = ['shopping-bag', 'gift', 'coffee', 'heart', 'package', 'feather', 'book-open', 'star'];
const CATEGORIES: RewardCategory[] = ['shop', 'facility', 'decor'];

function buildCollections(collections: Record<RewardCategory, string[]>[], themes: MallFloorTheme[], offset: number): MallItem[] {
  return collections.flatMap((collection, floorIndex) => CATEGORIES.flatMap((category, categoryIndex) =>
    collection[category].map((name, entryIndex) => {
      const index = entryIndex + offset;
      const visual = category === 'facility' ? FACILITY_VISUALS[index % FACILITY_VISUALS.length] : category === 'decor' ? DECOR_VISUALS[index % DECOR_VISUALS.length] : undefined;
      const price = (category === 'shop' ? 45 : category === 'facility' ? 35 : 15) + floorIndex * 5 + (index % 5) * 10;
      return {
        id: `collection-${floorIndex + 1}-${category}-${index + 1}`,
        floor: floorIndex + 1,
        name,
        description: category === 'shop'
          ? `在${name}慢慢逛，為今天挑一份喜歡的東西。`
          : `${themes[floorIndex].title}專屬${category === 'facility' ? '設施' : '裝修'}，讓${name}成為你的日常風景。`,
        category,
        icon: visual ? VISUAL_ICONS[visual] : SHOP_ICONS[index % SHOP_ICONS.length],
        color: SWATCHES[(floorIndex + categoryIndex + index) % SWATCHES.length],
        price,
        ticketCost: 0,
        visual,
      };
    }),
  ));
}

export function createExpandedItems(themes: MallFloorTheme[]): MallItem[] {
  return [
    ...buildCollections(COLLECTIONS, themes, 0),
    ...buildCollections([...LOWER_COLLECTIONS, ...UPPER_COLLECTIONS], themes, 17),
  ];
}
