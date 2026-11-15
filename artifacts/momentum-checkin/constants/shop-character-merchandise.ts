export type CharacterMerchandiseTheme = 'chiikawa' | 'winnie';

export type CharacterMerchandiseProfile = {
  id: string;
  name: string;
  theme: CharacterMerchandiseTheme;
  companionIds?: string[];
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
  if (theme === 'chiikawa' && productName.includes('星月魔法少女變身')) {
    return {
      id: 'chiikawa-carousel',
      name: '吉伊卡哇魔法少女夥伴',
      theme,
      companionIds: ['hachiware', 'usagi', 'momonga'],
    };
  }
  if (theme === 'chiikawa' && productName.includes('旋轉木馬')) {
    return {
      id: 'chiikawa-carousel',
      name: '吉伊卡哇旋轉木馬造型',
      theme,
      companionIds: ['hachiware', 'usagi'],
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
  return specific ?? characters[normalizeIndex(variant, characters.length)];
}
