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

function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
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

export function buildDailyPostcardSvg(dateKey: string, quote: string, dogName: string): string {
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
  const dateText = escapeXml(dateKey.replaceAll('-', ' / '));
  const safeDogName = escapeXml(dogName);
  const title = escapeXml(POSTCARD_TITLES[titleIndex]);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1440" viewBox="0 0 720 960">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${background}"/><stop offset="1" stop-color="${paper}"/></linearGradient>
    </defs>
    <rect width="720" height="960" rx="46" fill="url(#bg)"/>
    <g>${decorations}</g>
    <rect x="54" y="64" width="612" height="832" rx="38" fill="${paper}" opacity=".92" stroke="${accent}" stroke-opacity=".5" stroke-width="2"/>
    <rect x="83" y="93" width="554" height="774" rx="28" fill="none" stroke="${accent}" stroke-opacity=".45" stroke-width="2" stroke-dasharray="${motifIndex % 2 === 0 ? '2 13' : '8 9'}"/>
    <circle cx="360" cy="206" r="70" fill="${background}" stroke="${accent}" stroke-width="3"/>
    <path d="M360 146 L374 184 L414 185 L382 208 L394 247 L360 224 L326 247 L338 208 L306 185 L346 184 Z" fill="${accent}" opacity=".9"/>
    <circle cx="360" cy="204" r="12" fill="${paper}"/>
    <text x="360" y="322" text-anchor="middle" font-family="sans-serif" font-size="22" font-weight="700" letter-spacing="4" fill="${accent}">MOMENTUM · 每日小卡</text>
    <text x="360" y="378" text-anchor="middle" font-family="sans-serif" font-size="27" font-weight="700" fill="${ink}">${title}</text>
    ${quoteSvg}
    <path d="M238 650 Q360 621 482 650" fill="none" stroke="${accent}" stroke-width="3" stroke-linecap="round" opacity=".65"/>
    <text x="360" y="715" text-anchor="middle" font-family="sans-serif" font-size="25" font-weight="700" fill="${ink}">${safeDogName}今天陪你</text>
    <text x="360" y="770" text-anchor="middle" font-family="sans-serif" font-size="19" fill="${accent}">願你記得，今天的努力也值得肯定</text>
    <text x="360" y="827" text-anchor="middle" font-family="sans-serif" font-size="17" letter-spacing="2" fill="${ink}" opacity=".68">${dateText}</text>
  </svg>`;
}
