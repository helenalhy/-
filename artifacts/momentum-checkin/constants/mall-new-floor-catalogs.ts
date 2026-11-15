import type { RewardCategory } from '@/context/HabitsContext';
import type { MallFloorTheme, MallItem } from './mall';
import palette from './colors';

type NewFloorCatalogSeed = {
  floor: number;
  motifs: [string, string, string, string, string, string, string, string, string, string];
};

const NEW_FLOOR_CATALOGS: NewFloorCatalogSeed[] = [
  { floor: 10, motifs: ['花車慶典', '星彩馬戲', '轉轉木馬', '金粉遊行', '氣球巡遊', '月光帳篷', '緞帶舞會', '喜悅鈴鼓', '煙火花街', '繽紛舞台'] },
  { floor: 11, motifs: ['銀幕首映', '片場光影', '導演劇本', '攝影鏡頭', '星光試鏡', '服裝造型', '幕後剪輯', '電影膠卷', '場記板', '夢境布景'] },
  { floor: 12, motifs: ['冰晶雪花', '極光綺色', '霜雪玻璃', '雪橇旅程', '冷月冰藍', '雪絨白霧', '凍湖星點', '冰柱鈴光', '雪國暖屋', '冰雕月夜'] },
  { floor: 13, motifs: ['古陶銘紋', '沙岩遺址', '考古手札', '石刻圖騰', '古卷印記', '青銅日晷', '碑文星圖', '探險羅盤', '陶器彩釉', '古城遺珍'] },
  { floor: 14, motifs: ['星咒書頁', '月光藥瓶', '魔法星環', '學院徽章', '咒語墨水', '水晶權杖', '奇幻羽毛', '魔法課表', '銀河藥草', '法術符文'] },
  { floor: 15, motifs: ['櫻花暖湯', '木屐花火', '湯宿木格', '白梅香氣', '浴衣花紋', '紙燈晚風', '雪見溫泉', '松枝茶香', '湯煙月色', '竹簾雨聲'] },
  { floor: 16, motifs: ['宮廷刺繡', '石板王城', '絲絨冠冕', '絹綢舞會', '城堡長廊', '玫瑰宮苑', '金線禮服', '古典舞宴', '琥珀王座', '寶石袖口'] },
  { floor: 17, motifs: ['夜曲琴聲', '旋律節拍', '唱片金紋', '琴弦微光', '舞鞋旋影', '合唱和聲', '鼓點星火', '樂譜飛頁', '舞台花束', '弦樂月色'] },
  { floor: 18, motifs: ['積木彩街', '拼砌小鎮', '方塊火車', '幾何樂園', '積木星城', '彩磚工坊', '迷你積木', '小小建築師', '拼拼方屋', '積木花園'] },
  { floor: 19, motifs: ['毛茸茸爪印', '奶油犬屋', '緞帶貓咪', '小小獸醫', '雲朵犬舍', '尾巴搖搖', '肉球日常', '毛球樂園', '暖爪診所', '好朋友寵物'] },
  { floor: 21, motifs: ['雲橋城堡', '水晶尖塔', '月桂舞廳', '星冠王庭', '玫瑰塔樓', '玻璃宮門', '羽翼信使', '珍珠噴泉', '童話王座', '天空庭園'] },
  { floor: 22, motifs: ['黃銅齒輪', '蒸汽火車', '銅管工房', '發條木偶', '琥珀鍋爐', '機械鳥籠', '復古儀表', '蒸汽咖啡', '螺旋煙囪', '齒輪鐘樓'] },
  { floor: 23, motifs: ['時光郵票', '鐘塔信箋', '慢遞包裹', '月曆工房', '沙漏街角', '復古郵筒', '古典明信片', '時刻印章', '鐘擺長廊', '星夜信使'] },
  { floor: 24, motifs: ['夢境幕布', '月光舞台', '幻境拱門', '天鵝絨包廂', '星幕劇院', '魔術道具', '戲服衣櫥', '追光長廊', '音樂盒舞台', '夢遊迷宮'] },
  { floor: 25, motifs: ['小小機器人', '發明工作站', '智慧齒輪', '電路積木', '機械手臂', '雲端程式', '友善助手', '電池充電座', '光點實驗室', '創意控制台'] },
  { floor: 26, motifs: ['綠洲噴泉', '香料香囊', '棕櫚樹影', '琥珀沙丘', '陶壺花紋', '駝鈴小徑', '日落市集', '涼棚茶座', '綠洲花磚', '沙漠月色'] },
  { floor: 27, motifs: ['燈塔微光', '玻璃海灣', '帆船港口', '珍珠潮汐', '海岸信號', '白浪碼頭', '海風長廊', '船帆工房', '燈塔守望', '海鹽夕照'] },
  { floor: 28, motifs: ['熱氣球航線', '雲端旅券', '彩球織帶', '高空行李', '晴空窗景', '飛行日誌', '晨曦港台', '鳥瞰旅店', '風向標記', '雲上遠行'] },
  { floor: 29, motifs: ['紫晶洞門', '粉晶花園', '海藍寶座', '水晶礦脈', '彩虹晶柱', '閃耀切面', '晶洞秘境', '寶石收藏', '月光礦坑', '幻彩晶簇'] },
  { floor: 30, motifs: ['紙燈古街', '月下木橋', '暖燈町屋', '晚風茶舖', '夜行郵亭', '流光小巷', '金魚燈影', '石板夜市', '月色庭院', '星燈回廊'] },
];

const SUFFIXES: Record<RewardCategory, string[]> = {
  shop: ['紀念店', '服飾舖', '道具屋', '體驗工房', '收藏選物店'],
  facility: ['休息座', '體驗桌', '表演台', '互動景池', '故事亭'],
  decor: ['花盆', '街燈', '吊飾', '拱門', '展示架'],
};

const ICONS: Record<RewardCategory, string[]> = {
  shop: ['shopping-bag', 'gift', 'coffee', 'heart', 'package'],
  facility: ['home', 'grid', 'music', 'droplet', 'activity'],
  decor: ['feather', 'sun', 'moon', 'image', 'wind'],
};

const SWATCHES = [
  palette.light.candyPink,
  palette.light.candyMint,
  palette.light.candySky,
  palette.light.candyLavender,
  palette.light.candyPeach,
  palette.light.candyLemon,
  palette.light.candyCoral,
];

function buildFloorItems(seed: NewFloorCatalogSeed, theme: MallFloorTheme): MallItem[] {
  const categories: RewardCategory[] = ['shop', 'facility', 'decor'];
  return categories.flatMap((category) =>
    seed.motifs.flatMap((motif, motifIndex) =>
      SUFFIXES[category].map((suffix, suffixIndex) => {
        const index = motifIndex * SUFFIXES[category].length + suffixIndex;
        const name = `${motif}${suffix}`;
        const categoryName = category === 'shop' ? '店鋪' : category === 'facility' ? '設施' : '裝潢';
        const basePrice = category === 'shop' ? 55 : category === 'facility' ? 40 : 20;
        return {
          id: `theme-floor-${seed.floor}-${category}-${index + 1}`,
          floor: seed.floor,
          name,
          description: `${theme.title}專屬${categoryName}，為商場添上${motif}主題風景。`,
          icon: ICONS[category][(motifIndex + suffixIndex) % ICONS[category].length],
          color: SWATCHES[(seed.floor + index) % SWATCHES.length],
          category,
          price: basePrice + seed.floor * 4 + (suffixIndex * 10),
          ticketCost: 0,
        };
      }),
    ),
  );
}

export function createNewFloorItems(themes: MallFloorTheme[]): MallItem[] {
  return NEW_FLOOR_CATALOGS.flatMap((seed) => {
    const theme = themes[seed.floor - 1];
    if (!theme) throw new Error(`Missing mall theme for floor ${seed.floor}`);
    return buildFloorItems(seed, theme);
  });
}
