export type CharacterMerchandiseTheme = 'chiikawa' | 'winnie';
export type CharacterMerchandiseReferenceArtwork =
  | 'standard'
  | 'magical'
  | 'magical-group'
  | 'carousel'
  | 'pens'
  | 'propeller-plush'
  | 'mermaid-poster'
  | 'mid-autumn-plush'
  | 'baby-plush'
  | 'character-dictionary'
  | 'character-cover'
  | 'taiko-collab'
  | 'christmas-plush';

export type CharacterMerchandiseProfile = {
  id: string;
  name: string;
  theme: CharacterMerchandiseTheme;
  companionIds?: string[];
  referenceArtwork?: CharacterMerchandiseReferenceArtwork;
};

const CHIIKAWA_CHARACTERS: CharacterMerchandiseProfile[] = [
  { id: 'chiikawa', name: '吉伊卡哇', theme: 'chiikawa' },
  { id: 'hachiware', name: '小八貓', theme: 'chiikawa' },
  { id: 'usagi', name: '兔兔', theme: 'chiikawa' },
  { id: 'momonga', name: '飛鼠', theme: 'chiikawa' },
  { id: 'shisa', name: '獅薩', theme: 'chiikawa' },
  { id: 'kurimanju', name: '栗子饅頭', theme: 'chiikawa' },
  { id: 'rakko', name: '海獺師傅', theme: 'chiikawa' },
  { id: 'chiikawa-carousel', name: '旋轉木馬變裝版', theme: 'chiikawa' },
];

const WINNIE_CHARACTERS: CharacterMerchandiseProfile[] = [
  { id: 'pooh', name: '小熊維尼', theme: 'winnie' },
  { id: 'piglet', name: '小豬', theme: 'winnie' },
  { id: 'tigger', name: '跳跳虎', theme: 'winnie' },
  { id: 'eeyore', name: '屹耳', theme: 'winnie' },
  { id: 'rabbit', name: '兔子', theme: 'winnie' },
  { id: 'kanga', name: '袋鼠媽媽', theme: 'winnie' },
  { id: 'roo', name: '小豆', theme: 'winnie' },
  { id: 'owl', name: '貓頭鷹', theme: 'winnie' },
];

function normalizeIndex(index: number, length: number): number {
  return ((Math.trunc(index) % length) + length) % length;
}

export function getShopCharacterMerchandiseProfile(
  theme: string,
  productName: string,
  variant = 0,
): CharacterMerchandiseProfile | undefined {
  if (theme !== 'chiikawa' && theme !== 'winnie') return undefined;
  const characters = theme === 'chiikawa' ? CHIIKAWA_CHARACTERS : WINNIE_CHARACTERS;
  if (theme === 'chiikawa' && productName.includes('原子筆')) {
    return {
      id: 'chiikawa-carousel',
      name: '吉伊卡哇角色造型原子筆',
      theme,
      companionIds: ['hachiware', 'usagi'],
      referenceArtwork: 'pens',
    };
  }
  if (theme === 'chiikawa' && (productName.includes('旋翼帽') || productName.includes('討伐隊'))) {
    return {
      id: 'chiikawa-carousel',
      name: '旋翼帽討伐隊毛絨玩偶',
      theme,
      companionIds: ['hachiware', 'usagi'],
      referenceArtwork: 'propeller-plush',
    };
  }
  if (theme === 'chiikawa' && productName.includes('人魚島')) {
    return {
      id: 'chiikawa-carousel',
      name: '人魚島海上冒險',
      theme,
      companionIds: ['hachiware', 'usagi'],
      referenceArtwork: 'mermaid-poster',
    };
  }
  if (theme === 'chiikawa' && productName.includes('中秋')) {
    return {
      id: 'chiikawa-carousel',
      name: '中秋燈會毛絨玩偶',
      theme,
      companionIds: ['hachiware', 'usagi'],
      referenceArtwork: 'mid-autumn-plush',
    };
  }
  if (theme === 'chiikawa' && (productName.includes('Baby') || productName.includes('寶寶'))) {
    return {
      id: 'chiikawa-carousel',
      name: 'Chiikawa Baby 玩偶',
      theme,
      companionIds: ['hachiware', 'usagi'],
      referenceArtwork: 'baby-plush',
    };
  }
  if (theme === 'chiikawa' && productName.includes('圖鑑')) {
    return {
      id: 'chiikawa',
      name: '吉伊卡哇角色圖鑑',
      theme,
      referenceArtwork: 'character-dictionary',
    };
  }
  if (theme === 'chiikawa' && productName.includes('聖誕')) {
    return {
      id: 'chiikawa-carousel',
      name: '吉伊卡哇聖誕派對',
      theme,
      companionIds: ['hachiware', 'usagi'],
      referenceArtwork: 'christmas-plush',
    };
  }
  if (theme === 'chiikawa' && productName.includes('太鼓')) {
    return {
      id: 'chiikawa-carousel',
      name: '太鼓之達人合作造型',
      theme,
      companionIds: ['hachiware', 'usagi'],
      referenceArtwork: 'taiko-collab',
    };
  }
  if (theme === 'chiikawa' && productName.includes('封面')) {
    return {
      id: 'chiikawa',
      name: '吉伊卡哇角色封面收藏',
      theme,
      referenceArtwork: 'character-cover',
    };
  }
  if (theme === 'chiikawa' && productName.includes('星月魔法少女變身')) {
    return {
      id: 'chiikawa-carousel',
      name: '吉伊卡哇魔法少女夥伴',
      theme,
      companionIds: ['hachiware', 'usagi', 'momonga'],
      referenceArtwork: 'magical-group',
    };
  }
  if (theme === 'chiikawa' && productName.includes('旋轉木馬')) {
    return {
      id: 'chiikawa-carousel',
      name: '吉伊卡哇旋轉木馬造型',
      theme,
      companionIds: ['hachiware', 'usagi'],
      referenceArtwork: 'carousel',
    };
  }
  if (theme === 'winnie' && productName.includes('袋鼠媽媽')) {
    return {
      id: 'kanga',
      name: '袋鼠媽媽與小豆',
      theme,
      companionIds: ['roo'],
    };
  }
  if (theme === 'winnie' && productName.includes('維尼與朋友')) {
    return {
      id: 'pooh',
      name: '維尼與森林朋友',
      theme,
      companionIds: ['piglet', 'tigger', 'eeyore'],
    };
  }
  const specific = characters.find(({ name }) => productName.includes(name));
  const profile = specific ?? characters[normalizeIndex(variant, characters.length)];
  if (theme === 'chiikawa') {
    return {
      ...profile,
      referenceArtwork: productName.includes('魔法少女') ? 'magical' : 'standard',
    };
  }
  return profile;
}
