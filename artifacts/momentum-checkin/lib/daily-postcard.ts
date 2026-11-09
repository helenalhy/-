import { DOG_ATTENDANT_LOOKS } from '@/constants/dog-attendant-looks';

const DAY_MS = 24 * 60 * 60 * 1000;

const POSTCARD_PALETTES = [
  ['#FFF2E7', '#F3A788', '#9E587B', '#FFFDF8'],
  ['#EAF7F2', '#73BFA6', '#437F78', '#F9FFFC'],
  ['#F5EEFF', '#AB88D6', '#67568D', '#FFFCFF'],
  ['#FFF0F5', '#F18EAE', '#A64E78', '#FFFAFC'],
  ['#EAF5FF', '#72A9D7', '#456D9B', '#FCFEFF'],
  ['#FFF6D9', '#E7B95E', '#9B6A35', '#FFFEF8'],
  ['#E9F6F7', '#67B8C0', '#397985', '#FAFFFF'],
  ['#FCEBDD', '#DA8C63', '#905D4C', '#FFFCF8'],
  ['#F0F3E6', '#9BB56E', '#64764C', '#FEFFF9'],
  ['#F5EAFE', '#BD91CF', '#79578A', '#FFFCFF'],
  ['#EAF0FF', '#8499DB', '#53649D', '#FCFDFF'],
  ['#FFF0E9', '#E69377', '#A35D58', '#FFFCFA'],
  ['#ECF8E9', '#79B877', '#4D7956', '#FCFFFA'],
  ['#FFF0D9', '#E7A84E', '#98633B', '#FFFEFA'],
  ['#EAF7F8', '#6DAEB4', '#446F78', '#FCFFFF'],
  ['#FCEAF0', '#D77D9C', '#92566E', '#FFFBFC'],
  ['#F2F0FF', '#9690D1', '#625F9A', '#FDFDFF'],
  ['#F6F0E8', '#B69A75', '#786349', '#FFFEFB'],
  ['#E9F5FF', '#72B5D2', '#4F718F', '#FCFEFF'],
  ['#F9ECFF', '#CF8FCE', '#925E91', '#FFFCFF'],
  ['#EDF6EB', '#88B59C', '#527866', '#FDFFFC'],
  ['#FFF2D7', '#E4A56F', '#98684B', '#FFFEFA'],
  ['#EFF1FF', '#8B9DDD', '#586B9C', '#FDFEFF'],
  ['#FFF0EF', '#E58D8A', '#9B5D65', '#FFFCFC'],
  ['#EAF6F2', '#6DBBA6', '#477E72', '#FBFFFD'],
  ['#F4EFFF', '#A78FC8', '#6D5E85', '#FFFDFF'],
  ['#FFF5E9', '#E6A979', '#9D7053', '#FFFEFB'],
  ['#ECF4FF', '#779FCB', '#536E93', '#FCFEFF'],
  ['#FDF0F7', '#D895B5', '#925E79', '#FFFCFE'],
  ['#F3F6E8', '#A7B56B', '#6B774C', '#FFFFFB'],
  ['#F0F9F9', '#78B7B3', '#4F7C7A', '#FCFFFF'],
] as const;

const POSTCARD_TITLES = [
  '把今天收藏起來',
  '一小步也會發光',
  '給努力的你',
  '今天值得被記住',
  '慢慢來，仍在前進',
  '留一點溫柔給自己',
  '今日的小小勝利',
] as const;

function getOrdinal(dateKey: string): number {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) return 0;
  const [year, month, day] = dateKey.split('-').map(Number);
  const timestamp = Date.UTC(year, month - 1, day);
  const date = new Date(timestamp);
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return 0;
  return Math.floor(timestamp / DAY_MS);
}

export function getDailyStyleIndex(dateKey: string, profileCount: number, optionCount: number): number {
  if (profileCount < 1 || optionCount < 1) return 0;
  return Math.floor(getOrdinal(dateKey) / profileCount) % optionCount;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function wrapText(text: string, maxCharacters = 18): string[] {
  const characters = Array.from(text);
  const lines: string[] = [];
  for (let index = 0; index < characters.length; index += maxCharacters) {
    lines.push(characters.slice(index, index + maxCharacters).join(''));
  }
  return lines.slice(0, 5);
}

function makeDecoration(ordinal: number, accent: string, softAccent: string, motif: number): string {
  const marks: string[] = [];
  for (let index = 0; index < 12; index += 1) {
    const x = 68 + ((index * 173 + ordinal * 31) % 584);
    const y = 90 + ((index * 127 + ordinal * 17) % 760);
    const size = 5 + ((index + motif + ordinal) % 8);
    if ((motif + index) % 3 === 0) {
      marks.push(`<path d="M${x} ${y - size} L${x + size * 0.28} ${y - size * 0.28} L${x + size} ${y} L${x + size * 0.28} ${y + size * 0.28} L${x} ${y + size} L${x - size * 0.28} ${y + size * 0.28} L${x - size} ${y} L${x - size * 0.28} ${y - size * 0.28} Z" fill="${accent}" opacity=".55"/>`);
    } else if ((motif + index) % 3 === 1) {
      marks.push(`<circle cx="${x}" cy="${y}" r="${size}" fill="${softAccent}" opacity=".8"/>`);
    } else {
      marks.push(`<path d="M${x} ${y - size} Q${x + size * 1.5} ${y - size * 1.3} ${x + size} ${y} Q${x + size * 1.3} ${y + size * 1.5} ${x} ${y + size} Q${x - size * 1.5} ${y + size * 1.3} ${x - size} ${y} Q${x - size * 1.3} ${y - size * 1.5} ${x} ${y - size}Z" fill="${accent}" opacity=".42"/>`);
    }
  }
  return marks.join('');
}

export interface DailyPostcardDog {
  name: string;
  kind: string;
  coatColor: string;
  outfit: {
    name: string;
    color: string;
    accentColor: string;
    cut: string;
    pattern: string;
    lace?: boolean;
  };
  accessory: {
    name: string;
    color: string;
    accentColor: string;
    shape: string;
    animalKind?: string;
  };
}

export interface DailyPostcardShop {
  floor: number;
  name: string;
  roomImageUri: string;
}

function legacyDogArtwork(dog: DailyPostcardDog, outline: string): string {
  const fur = escapeXml(dog.coatColor);
  const outfit = escapeXml(dog.outfit.color);
  const trim = escapeXml(dog.outfit.accentColor);
  const accessory = escapeXml(dog.accessory.color);
  const accessoryTrim = escapeXml(dog.accessory.accentColor);
  const earShape = dog.kind === 'poppy' || dog.kind === 'butter' || dog.kind === 'wonton'
    ? 'M-70 -30 Q-123 8 -91 60 Q-69 45 -54 -3 Z M70 -30 Q123 8 91 60 Q69 45 54 -3 Z'
    : dog.kind === 'xiaoniu'
      ? 'M-67 -43 Q-124 -93 -112 -10 Q-99 30 -61 21 Z M67 -43 Q124 -93 112 -10 Q99 30 61 21 Z'
      : 'M-70 -34 Q-118 -66 -108 -5 Q-98 31 -58 21 Z M70 -34 Q118 -66 108 -5 Q98 31 58 21 Z';
  const bodyLength = dog.kind === 'poppy' ? 'rx="94" ry="67"' : 'rx="76" ry="76"';
  const facePatch = dog.kind === 'xiaoniu'
    ? `<path d="M-4 -82 Q18 -91 31 -66 L25 -19 Q15 -3 4 -20 Z" fill="#FFFDF8" opacity=".92"/><ellipse cx="-49" cy="-22" rx="22" ry="28" fill="#36323C" opacity=".84"/>`
    : dog.kind === 'sesame'
      ? `<ellipse cx="-51" cy="-21" rx="22" ry="24" fill="#37333D" opacity=".85"/><ellipse cx="52" cy="-21" rx="21" ry="24" fill="#37333D" opacity=".85"/>`
      : dog.kind === 'snowball'
        ? `<path d="M-34 16 Q0 4 34 16 L24 42 Q0 55 -24 42 Z" fill="#FFFDF8" stroke="${outline}" stroke-width="2"/>`
        : '';
  const clothingBase = dog.outfit.cut === 'cape'
    ? `<path d="M-70 82 Q0 58 70 82 L111 202 Q0 234 -111 202 Z" fill="${outfit}" stroke="${outline}" stroke-width="4"/><path d="M-62 93 Q0 116 62 93" fill="none" stroke="${trim}" stroke-width="7"/>`
    : dog.outfit.cut === 'dress' || dog.outfit.cut === 'princess' || dog.outfit.cut === 'little-skirt'
      || dog.outfit.cut === 'magical-girl' || dog.outfit.cut.includes('dress')
      ? `<path d="M-47 87 Q0 69 47 87 L99 202 Q0 224 -99 202 Z" fill="${outfit}" stroke="${outline}" stroke-width="4"/><path d="M-91 191 Q0 217 91 191 L99 205 Q0 234 -99 205 Z" fill="${trim}" stroke="${outline}" stroke-width="3"/>`
      : `<path d="M-64 86 Q0 63 64 86 L81 205 Q0 224 -81 205 Z" fill="${outfit}" stroke="${outline}" stroke-width="4"/>`;
  const pattern = dog.outfit.pattern === 'stripes'
    ? `<path d="M-52 116 H52 M-60 146 H60 M-65 176 H65" stroke="${trim}" stroke-width="7" opacity=".92"/>`
    : dog.outfit.pattern === 'checks'
      ? `<path d="M-40 118 H40 M-50 146 H50 M-58 174 H58 M-20 105 V190 M18 105 V190" stroke="${trim}" stroke-width="5" opacity=".82"/>`
      : dog.outfit.pattern === 'stars'
        ? `<path d="M-38 123 l5 10 11 2-8 8 2 11-10-5-10 5 2-11-8-8 11-2z M34 155 l4 8 9 1-7 6 2 9-8-4-8 4 2-9-7-6 9-1z" fill="${trim}"/>`
        : dog.outfit.pattern === 'flowers'
          ? `<circle cx="-35" cy="138" r="7" fill="${trim}"/><circle cx="-42" cy="138" r="4" fill="#FFFDF8"/><circle cx="-28" cy="138" r="4" fill="#FFFDF8"/><circle cx="32" cy="167" r="7" fill="${trim}"/><circle cx="25" cy="167" r="4" fill="#FFFDF8"/><circle cx="39" cy="167" r="4" fill="#FFFDF8"/>`
          : `<circle cx="-34" cy="145" r="5" fill="${trim}"/><circle cx="34" cy="164" r="5" fill="${trim}"/>`;
  const lace = dog.outfit.lace
    ? `<path d="M-86 201 Q-75 186 -64 201 Q-53 216 -42 201 Q-31 186 -20 201 Q-9 216 2 201 Q13 186 24 201 Q35 216 46 201 Q57 186 68 201 Q79 216 90 201" fill="none" stroke="#FFFDF8" stroke-width="7" stroke-linecap="round"/>`
    : '';
  const headAccessory = dog.accessory.shape === 'animal-ears'
    ? dog.accessory.animalKind === 'rabbit'
      ? `<path d="M-48 -74 Q-70 -156 -36 -160 Q-15 -147 -22 -71 Z M48 -74 Q70 -156 36 -160 Q15 -147 22 -71 Z" fill="${accessory}" stroke="${outline}" stroke-width="4"/><path d="M-42 -82 Q-53 -132 -39 -138 Q-30 -129 -30 -78 Z M42 -82 Q53 -132 39 -138 Q30 -129 30 -78 Z" fill="${accessoryTrim}"/>`
      : `<path d="M-68 -70 Q-88 -139 -47 -133 Q-17 -120 -24 -68 Z M68 -70 Q88 -139 47 -133 Q17 -120 24 -68 Z" fill="${accessory}" stroke="${outline}" stroke-width="4"/><path d="M-56 -82 Q-66 -115 -48 -116 L-39 -76 Z M56 -82 Q66 -115 48 -116 L39 -76 Z" fill="${accessoryTrim}"/>`
    : dog.accessory.shape === 'beret'
      ? `<ellipse cx="0" cy="-83" rx="55" ry="19" fill="${accessory}" stroke="${outline}" stroke-width="4"/><path d="M-44 -84 Q-35 -135 14 -126 Q53 -119 52 -83 Z" fill="${accessory}" stroke="${outline}" stroke-width="4"/><circle cx="13" cy="-125" r="7" fill="${accessoryTrim}"/>`
      : dog.accessory.shape === 'headband'
        ? `<path d="M-68 -45 Q0 -119 68 -45" fill="none" stroke="${accessory}" stroke-width="12" stroke-linecap="round"/><path d="M-10 -105 Q0 -121 10 -105 Q0 -92 -10 -105Z" fill="${accessoryTrim}"/>`
        : dog.accessory.shape === 'scarf'
          ? `<path d="M-50 73 Q0 91 50 73 L43 96 Q0 112 -43 96 Z" fill="${accessory}" stroke="${outline}" stroke-width="3"/><path d="M35 93 L54 132 L29 126Z" fill="${accessoryTrim}"/>`
          : dog.accessory.shape === 'flower'
            ? `<g transform="translate(55 -88)"><circle r="13" fill="${accessoryTrim}"/><circle cx="0" cy="-12" r="9" fill="${accessory}"/><circle cx="12" cy="0" r="9" fill="${accessory}"/><circle cy="12" r="9" fill="${accessory}"/><circle cx="-12" r="9" fill="${accessory}"/></g>`
            : `<path d="M-15 -87 Q-40 -112 -53 -94 Q-57 -78 -31 -74 Q-42 -51 -21 -52 Q-5 -56 -5 -77 Q18 -58 32 -73 Q40 -91 13 -96 Q24 -120 3 -120 Q-11 -117 -15 -87Z" fill="${accessory}" stroke="${outline}" stroke-width="3"/><circle cx="-8" cy="-84" r="6" fill="${accessoryTrim}"/>`;
  const magicalAccents = dog.outfit.cut === 'magical-girl'
    ? `<path d="M0 92 L8 110 L28 112 L13 125 L17 145 L0 135 L-17 145 L-13 125 L-28 112 L-8 110 Z" fill="#FFF5AE" stroke="${outline}" stroke-width="2"/><path d="M-37 83 Q-17 61 0 83 Q17 61 37 83 L19 100 L0 91 L-19 100Z" fill="${trim}" stroke="${outline}" stroke-width="3"/><circle cx="0" cy="91" r="7" fill="#FFF5AE"/>`
    : dog.outfit.cut === 'sweater'
      ? `<path d="M-43 101 H43 M-48 116 H48" stroke="${trim}" stroke-width="6" stroke-linecap="round"/><path d="M-26 145 l9 9 9-9 M12 170 l9 9 9-9" fill="none" stroke="${trim}" stroke-width="4"/>`
      : dog.outfit.cut === 'animal-costume'
        ? `<ellipse cx="0" cy="145" rx="24" ry="20" fill="${trim}" stroke="${outline}" stroke-width="3"/><circle cx="0" cy="145" r="8" fill="${outfit}"/>`
        : '';

  return `<g transform="translate(360 560)">
    <path d="M-71 169 Q-132 141 -112 107 Q-101 89 -83 109" fill="none" stroke="${fur}" stroke-width="20" stroke-linecap="round"/>
    <path d="${earShape}" fill="${fur}" stroke="${outline}" stroke-width="4"/>
    <ellipse cx="0" cy="153" ${bodyLength} fill="${fur}" stroke="${outline}" stroke-width="4"/>
    ${clothingBase}
    ${pattern}
    ${lace}
    <path d="M-18 89 Q0 110 18 89" fill="none" stroke="${trim}" stroke-width="6" stroke-linecap="round"/>
    ${magicalAccents}
    <ellipse cx="-40" cy="220" rx="23" ry="17" fill="${fur}" stroke="${outline}" stroke-width="3"/>
    <ellipse cx="40" cy="220" rx="23" ry="17" fill="${fur}" stroke="${outline}" stroke-width="3"/>
    <ellipse cx="0" cy="0" rx="93" ry="82" fill="${fur}" stroke="${outline}" stroke-width="4"/>
    <ellipse cx="-38" cy="34" rx="21" ry="13" fill="#F5B0B5" opacity=".7"/>
    <ellipse cx="38" cy="34" rx="21" ry="13" fill="#F5B0B5" opacity=".7"/>
    ${facePatch}
    <ellipse cx="-33" cy="-9" rx="9" ry="12" fill="${outline}"/>
    <ellipse cx="33" cy="-9" rx="9" ry="12" fill="${outline}"/>
    <circle cx="-30" cy="-13" r="3" fill="#FFFDF8"/>
    <circle cx="36" cy="-13" r="3" fill="#FFFDF8"/>
    <ellipse cx="0" cy="17" rx="12" ry="9" fill="#754C58"/>
    <path d="M0 25 Q-5 39 -17 37 M0 25 Q5 39 17 37" fill="none" stroke="#754C58" stroke-width="3" stroke-linecap="round"/>
    ${headAccessory}
    ${dog.kind === 'huahua' ? `<circle cx="-74" cy="-32" r="8" fill="#FFFDF8" stroke="${trim}" stroke-width="3"/><circle cx="76" cy="-17" r="7" fill="#FFFDF8" stroke="${trim}" stroke-width="3"/>` : ''}
  </g>`;
}

function dogArtwork(dog: DailyPostcardDog, _outline: string): string {
  const outline = '#98672D';
  const look = DOG_ATTENDANT_LOOKS[dog.kind] ?? {
    coat: dog.coatColor,
    ear: outline,
    muzzle: '#FFFBF4',
    collar: dog.outfit.accentColor,
    marking: '#FFFBF4',
    earStyle: 'small',
    bodyStyle: 'regular',
    tailStyle: 'round',
    facePattern: 'none',
    fluffy: false,
  };
  const fur = escapeXml(look.coat);
  const ear = escapeXml(look.ear);
  const muzzle = escapeXml(look.muzzle);
  const marking = escapeXml(look.marking);
  const collar = escapeXml(look.collar);
  const outfit = escapeXml(dog.outfit.color);
  const trim = escapeXml(dog.outfit.accentColor);
  const accessory = escapeXml(dog.accessory.color);
  const accessoryTrim = escapeXml(dog.accessory.accentColor);
  const earShapes = look.earStyle === 'upright'
    ? 'M16 12 Q12 -3 20 2 L23 14Z M28 14 L31 2 Q39 -3 35 12Z'
    : look.earStyle === 'floppy'
      ? 'M15 12 Q7 8 10 20 Q13 25 19 20Z M31 12 Q39 8 36 20 Q33 25 27 20Z'
      : 'M15 13 Q10 5 18 6 L22 15Z M28 15 L32 6 Q40 5 35 13Z';
  const facePattern = look.facePattern === 'collie'
    ? `<path d="M24 11 Q27 8 29 11 L28 18 Q27 21 25 19Z" fill="${marking}"/><ellipse cx="20" cy="16" rx="3" ry="4" fill="${ear}"/>`
    : look.facePattern === 'shih-tzu'
      ? `<ellipse cx="20" cy="16" rx="3.2" ry="3.8" fill="${marking}"/><ellipse cx="29" cy="16" rx="3.2" ry="3.8" fill="${marking}"/>`
      : look.facePattern === 'schnauzer'
        ? `<path d="M21 23 Q25 20 29 23 L28 27 Q25 29 22 27Z" fill="${marking}" stroke="${ear}" stroke-width=".45"/>`
        : '';
  const tail = look.tailStyle === 'long'
    ? `<path d="M36 34 Q44 28 48 33 Q49 38 40 38" fill="none" stroke="${fur}" stroke-width="2.6" stroke-linecap="round"/>`
    : `<circle cx="41.5" cy="34.5" r="3.6" fill="${fur}" stroke="${ear}" stroke-width=".8"/><circle cx="42.5" cy="33.5" r=".8" fill="#FFFDF8" opacity=".75"/>`;
  const bodyWidth = look.bodyStyle === 'long' ? 31 : look.bodyStyle === 'low' ? 29 : 25;
  const bodyX = (50 - bodyWidth) / 2;
  const bodyY = look.bodyStyle === 'low' ? 27 : 25;
  const bodyHeight = look.bodyStyle === 'low' ? 13 : look.bodyStyle === 'long' ? 13 : 15;
  const furPuffs = look.fluffy
    ? `<circle cx="16" cy="18" r="3.2" fill="${fur}"/><circle cx="34" cy="18" r="3.2" fill="${fur}"/><circle cx="25" cy="7" r="3.4" fill="${fur}"/>`
    : '';
  const clothingShape = dog.outfit.cut === 'magical-girl' || dog.outfit.cut === 'princess' || dog.outfit.cut === 'dress'
    || dog.outfit.cut === 'little-skirt' || dog.outfit.cut.includes('dress') || dog.outfit.cut === 'animal-costume'
    ? `<path d="M15 26 Q25 24 35 26 L40 40 Q25 43 10 40Z" fill="${outfit}" stroke="${outline}" stroke-width=".75"/>`
    : dog.outfit.cut === 'cape' || dog.outfit.cut === 'snowflake-cape' || dog.outfit.cut === 'ghost-poncho'
      ? `<path d="M13 26 Q25 23 37 26 L40 40 Q25 43 10 40Z" fill="${outfit}" stroke="${outline}" stroke-width=".75"/>`
      : `<path d="M16 26 Q25 24 34 26 L36 39 Q25 42 14 39Z" fill="${outfit}" stroke="${outline}" stroke-width=".75"/>`;
  const pattern = dog.outfit.pattern === 'stripes'
    ? `<path d="M16 30 H34 M14 34 H36 M13 38 H37" stroke="${trim}" stroke-width="1.1"/>`
    : dog.outfit.pattern === 'checks'
      ? `<path d="M16 30 H34 M15 35 H35 M22 28 V40 M29 28 V40" stroke="${trim}" stroke-width=".8"/>`
      : dog.outfit.pattern === 'stars'
        ? `<path d="M20 30 l.8 1.8 2 .2-1.5 1.3.5 2-1.8-1-1.8 1 .5-2-1.5-1.3 2-.2z M31 35 l.7 1.4 1.5.2-1.1 1 .3 1.6-1.4-.8-1.4.8.3-1.6-1.1-1 1.5-.2z" fill="${trim}"/>`
        : dog.outfit.pattern === 'flowers'
          ? `<circle cx="20" cy="33" r="1.2" fill="${trim}"/><circle cx="31" cy="36" r="1.2" fill="${trim}"/><circle cx="20" cy="33" r=".55" fill="#FFFDF8"/><circle cx="31" cy="36" r=".55" fill="#FFFDF8"/>`
          : `<circle cx="20" cy="34" r=".8" fill="${trim}"/><circle cx="31" cy="36" r=".8" fill="${trim}"/>`;
  const lace = dog.outfit.lace
    ? `<path d="M11 40 Q12 38.5 13 40 Q14 41.5 15 40 Q16 38.5 17 40 Q18 41.5 19 40 Q20 38.5 21 40 Q22 41.5 23 40 Q24 38.5 25 40 Q26 41.5 27 40 Q28 38.5 29 40 Q30 41.5 31 40 Q32 38.5 33 40 Q34 41.5 35 40 Q36 38.5 37 40 Q38 41.5 39 40" fill="none" stroke="#FFFBF4" stroke-width=".8"/>`
    : '';
  const accessorySvg = dog.accessory.shape === 'animal-ears'
    ? `<path d="M18 9 Q14 -1 19 1 L22 10Z M28 10 L31 1 Q36 -1 32 9Z" fill="${accessory}" stroke="${outline}" stroke-width=".7"/><path d="M19 8 L19 3 M31 8 L31 3" stroke="${accessoryTrim}" stroke-width=".7"/>`
    : dog.accessory.shape === 'beret'
      ? `<path d="M16 9 Q17 3 26 3 Q34 3 35 9Z" fill="${accessory}" stroke="${outline}" stroke-width=".7"/><circle cx="29" cy="4" r="1.2" fill="${accessoryTrim}"/>`
      : dog.accessory.shape === 'headband'
        ? `<path d="M15 13 Q25 4 35 13" fill="none" stroke="${accessory}" stroke-width="2.2"/><circle cx="25" cy="8" r="1.3" fill="${accessoryTrim}"/>`
        : dog.accessory.shape === 'scarf'
          ? `<path d="M18 25 Q25 28 32 25 L31 28 Q25 30 19 28Z" fill="${accessory}" stroke="${outline}" stroke-width=".5"/><path d="M29 27 L32 34 L28 32Z" fill="${accessoryTrim}"/>`
          : dog.accessory.shape === 'flower'
            ? `<g transform="translate(33 9)"><circle r="1.5" fill="${accessoryTrim}"/><circle cy="-2" r="1.5" fill="${accessory}"/><circle cx="2" r=".8" fill="${accessory}"/><circle cy="2" r="1.1" fill="${accessory}"/><circle cx="-2" r="1.1" fill="${accessory}"/></g>`
            : `<path d="M25 9 Q21 5 18 8 Q17 11 22 12 Q19 16 23 16 Q26 16 26 12 Q30 16 33 13 Q34 10 29 9 Q31 5 27 5Z" fill="${accessory}" stroke="${outline}" stroke-width=".6"/><circle cx="26" cy="10" r="1" fill="${accessoryTrim}"/>`;
  const magicalAccents = dog.outfit.cut === 'magical-girl'
    ? `<path d="M25 27 l1 2 2 .2-1.5 1.2.5 2-2-1-2 1 .5-2-1.5-1.2 2-.2Z" fill="#FFF5AE" stroke="${outline}" stroke-width=".4"/><path d="M19 26 Q22 23 25 26 Q28 23 31 26 L28 29 L25 27.5 L22 29Z" fill="${trim}" stroke="${outline}" stroke-width=".5"/><circle cx="25" cy="27" r="1" fill="#FFF5AE"/>`
    : dog.outfit.cut === 'sweater'
      ? `<path d="M16 29 H34 M15 38 H35" stroke="${trim}" stroke-width=".9"/><path d="M21 33 l1 1 1-1 M29 35 l1 1 1-1" fill="none" stroke="${trim}" stroke-width=".7"/>`
      : dog.outfit.cut === 'animal-costume'
        ? `<ellipse cx="25" cy="34" rx="3" ry="2.3" fill="${trim}" stroke="${outline}" stroke-width=".5"/><circle cx="25" cy="34" r=".9" fill="${outfit}"/>`
        : '';
  const bodyXMarkup = bodyX.toFixed(1);

  return `<g transform="translate(220 540) scale(5.6)">
    ${tail}
    <ellipse cx="25" cy="${bodyY + bodyHeight / 2}" rx="${bodyWidth / 2}" ry="${bodyHeight / 2}" fill="${fur}" stroke="${ear}" stroke-width=".8"/>
    <path d="M23 26 Q25 28 27 26 L27 37 Q25 40 23 37Z" fill="${marking}"/>
    ${clothingShape}${pattern}
    <path d="M19 26 Q25 29 31 26" fill="none" stroke="${trim}" stroke-width="1.1" stroke-linecap="round"/>
    ${lace}${magicalAccents}
    <path d="M${bodyXMarkup} 39 Q${bodyXMarkup} 44 ${bodyX + 4} 44 Q${bodyX + 6} 44 ${bodyX + 6} 40 M${bodyX + bodyWidth - 9} 40 Q${bodyX + bodyWidth - 9} 44 ${bodyX + bodyWidth - 5} 44 Q${bodyX + bodyWidth - 1} 44 ${bodyX + bodyWidth - 1} 39" fill="${fur}" stroke="${ear}" stroke-width=".7"/>
    <path d="${earShapes}" fill="${fur}" stroke="${ear}" stroke-width=".8" stroke-linejoin="round"/>
    <ellipse cx="25" cy="17" rx="12" ry="11" fill="${fur}" stroke="${ear}" stroke-width=".8"/>
    ${furPuffs}${facePattern}
    <ellipse cx="20.5" cy="16" rx="1.2" ry="1.5" fill="#493348"/>
    <ellipse cx="29.5" cy="16" rx="1.2" ry="1.5" fill="#493348"/>
    <circle cx="20.8" cy="15.5" r=".4" fill="#FFFFFF"/><circle cx="29.8" cy="15.5" r=".4" fill="#FFFFFF"/>
    <ellipse cx="19" cy="20.5" rx="2.4" ry="1.4" fill="#F1A7C5" opacity=".78"/>
    <ellipse cx="31" cy="20.5" rx="2.4" ry="1.4" fill="#F1A7C5" opacity=".78"/>
    <ellipse cx="25" cy="21" rx="5.5" ry="3.5" fill="${muzzle}"/>
    ${look.facePattern === 'schnauzer' ? `<path d="M20 22 Q25 20 30 22 Q29 27 25 27 Q21 26 20 22Z" fill="${marking}"/>` : ''}
    <ellipse cx="25" cy="20.3" rx="1.15" ry=".8" fill="#98672D"/>
    <path d="M25 21 Q23.5 23.5 21.8 23 M25 21 Q26.5 23.5 28.2 23" fill="none" stroke="#98672D" stroke-width=".55" stroke-linecap="round"/>
    <rect x="19" y="25" width="12" height="2.4" rx="1.2" fill="${collar}"/><circle cx="25" cy="27.5" r=".9" fill="#FFF1B8"/>
    ${accessorySvg}
    ${dog.kind === 'huahua' ? `<circle cx="15" cy="12" r="1.6" fill="#FFFBF4" stroke="${trim}" stroke-width=".5"/><circle cx="35" cy="17" r="1.3" fill="#FFFBF4" stroke="${trim}" stroke-width=".5"/>` : ''}
  </g>`;
}

export function buildDailyPostcardSvg(
  dateKey: string,
  quote: string,
  dog: DailyPostcardDog,
  shop: DailyPostcardShop,
): string {
  const ordinal = getOrdinal(dateKey);
  const paletteIndex = ordinal % POSTCARD_PALETTES.length;
  const motifIndex = Math.floor(ordinal / POSTCARD_PALETTES.length) % 7;
  const titleIndex = Math.floor(ordinal / (POSTCARD_PALETTES.length * 7)) % POSTCARD_TITLES.length;
  const [background, accent, ink, paper] = POSTCARD_PALETTES[paletteIndex];
  const lines = wrapText(quote);
  const firstLineY = 425 - Math.floor(lines.length / 2) * 43;
  const quoteSvg = lines.map((line, index) =>
    `<text x="360" y="${firstLineY + index * 48}" text-anchor="middle" font-family="sans-serif" font-size="32" font-weight="600" fill="${ink}">${escapeXml(line)}</text>`,
  ).join('');
  const decorations = makeDecoration(ordinal, accent, paper, motifIndex);
  const dateText = escapeXml(dateKey.replace(/-/g, ' / '));
  const title = escapeXml(POSTCARD_TITLES[titleIndex]);
  const dogImage = DOG_ATTENDANT_LOOKS[dog.kind]
    ? dogArtwork(dog, ink)
    : legacyDogArtwork(dog, ink);
  const shopName = escapeXml(shop.name);
  const outfitName = escapeXml(dog.outfit.name);
  const accessoryName = escapeXml(dog.accessory.name);
  const roomImage = escapeXml(shop.roomImageUri);
  const shopFloor = escapeXml(`${shop.floor}F`);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1440" viewBox="0 0 720 960">
    <defs>
      <linearGradient id="shade" x1="0" y1="0" x2="0" y2="1"><stop stop-color="${ink}" stop-opacity=".18"/><stop offset=".44" stop-color="${paper}" stop-opacity=".28"/><stop offset="1" stop-color="${ink}" stop-opacity=".3"/></linearGradient>
    </defs>
    <image href="${roomImage}" x="0" y="0" width="720" height="960" preserveAspectRatio="xMidYMid slice"/>
    <rect width="720" height="960" rx="46" fill="url(#shade)"/>
    <rect x="38" y="40" width="644" height="880" rx="38" fill="none" stroke="${paper}" stroke-opacity=".9" stroke-width="4"/>
    <g>${decorations}</g>
    <rect x="66" y="74" width="588" height="365" rx="30" fill="${paper}" opacity=".88" stroke="${accent}" stroke-width="3"/>
    <circle cx="360" cy="132" r="29" fill="${background}" stroke="${accent}" stroke-width="2"/>
    <path d="M360 111 L366 127 L384 128 L370 139 L375 157 L360 147 L345 157 L350 139 L336 128 L354 127 Z" fill="${accent}"/>
    <text x="360" y="193" text-anchor="middle" font-family="sans-serif" font-size="19" font-weight="700" letter-spacing="3" fill="${accent}">MOMENTUM · 每日小卡</text>
    <text x="360" y="234" text-anchor="middle" font-family="sans-serif" font-size="25" font-weight="700" fill="${ink}">${title}</text>
    ${quoteSvg}
    <ellipse cx="360" cy="800" rx="126" ry="17" fill="${ink}" opacity=".18"/>
    ${dogImage}
    <rect x="66" y="832" width="588" height="96" rx="24" fill="${paper}" opacity=".93" stroke="${accent}" stroke-width="2"/>
    <text x="360" y="863" text-anchor="middle" font-family="sans-serif" font-size="22" font-weight="700" fill="${ink}">${escapeXml(dog.name)}今天陪你 · ${shopFloor} ${shopName}</text>
    <text x="360" y="893" text-anchor="middle" font-family="sans-serif" font-size="14" fill="${accent}">${outfitName} · ${accessoryName}</text>
    <text x="360" y="916" text-anchor="middle" font-family="sans-serif" font-size="13" letter-spacing="1" fill="${ink}" opacity=".72">${dateText} · 今日的努力值得收藏</text>
  </svg>`;
}
