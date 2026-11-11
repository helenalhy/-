function escapeXml(value: string): string {
  return value.replace(/[<>&'"]/g, (character) => ({
    '<': '&lt;',
    '>': '&gt;',
    '&': '&amp;',
    "'": '&apos;',
    '"': '&quot;',
  })[character] ?? character);
}

export function buildDogCompanionPostcardSvg(
  dogName: string,
  dateKey: string,
  dogSceneImageUri: string,
): string {
  const safeName = escapeXml(dogName);
  const safeDate = escapeXml(dateKey.replace(/-/g, ' / '));
  const safeImageUri = escapeXml(dogSceneImageUri);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1440" viewBox="0 0 720 960">
    <defs>
      <linearGradient id="photoShade" x1="0" y1="0" x2="0" y2="1">
        <stop stop-color="#553F45" stop-opacity=".12"/>
        <stop offset=".63" stop-color="#FFF9F2" stop-opacity=".02"/>
        <stop offset="1" stop-color="#553F45" stop-opacity=".3"/>
      </linearGradient>
    </defs>
    <image href="${safeImageUri}" x="0" y="0" width="720" height="960" preserveAspectRatio="xMidYMid slice"/>
    <rect width="720" height="960" fill="url(#photoShade)"/>
    <rect x="36" y="36" width="648" height="888" rx="42" fill="none" stroke="#FFF9F2" stroke-width="5" opacity=".94"/>
    <rect x="72" y="74" width="576" height="134" rx="28" fill="#FFF9F2" fill-opacity=".9" stroke="#E9B5CB" stroke-width="3"/>
    <circle cx="360" cy="119" r="21" fill="#F5D5E3" stroke="#B53F7A" stroke-width="2"/>
    <path d="M360 104 L364 115 L376 116 L367 124 L370 137 L360 130 L350 137 L353 124 L344 116 L356 115 Z" fill="#B53F7A"/>
    <text x="360" y="172" text-anchor="middle" font-family="sans-serif" font-size="18" font-weight="800" letter-spacing="3" fill="#B53F7A">MOMENTUM CAFE · DOG PHOTO</text>
    <rect x="80" y="788" width="560" height="112" rx="25" fill="#FFF9F2" fill-opacity=".92" stroke="#E9B5CB" stroke-width="2"/>
    <text x="360" y="835" text-anchor="middle" font-family="sans-serif" font-size="31" font-weight="800" fill="#573C4A">${safeName} · 今天的陪伴</text>
    <text x="360" y="872" text-anchor="middle" font-family="sans-serif" font-size="18" font-weight="600" fill="#836977">${safeDate}</text>
  </svg>`;
}
