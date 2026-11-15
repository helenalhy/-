import type { ImageSourcePropType } from 'react-native';

// Every floor has its own cast. The original eight keep their 4×2 positions,
// and the remaining guests occupy the fifth column and the third atlas row.
export const GUEST_SHEETS: ImageSourcePropType[] = [
  require('../assets/images/guests-floor-1.png'),
  require('../assets/images/guests-floor-2.png'),
  require('../assets/images/guests-floor-3.png'),
  require('../assets/images/guests-floor-4.png'),
  require('../assets/images/guests-floor-5.png'),
  require('../assets/images/guests-floor-6.png'),
  require('../assets/images/guests-floor-7.png'), // Beauty totes are painted into each shopper, so they share the existing walk/turn animation.
  require('../assets/images/guests-floor-8.png'),
  require('../assets/images/guests-floor-9.png'),
  require('../assets/images/guests-floor-10-carnival.png'),
  require('../assets/images/guests-floor-11.png'),
  require('../assets/images/guests-floor-12.png'),
  require('../assets/images/guests-floor-13.png'),
  require('../assets/images/guests-floor-14.png'),
  require('../assets/images/guests-floor-15.png'),
  require('../assets/images/guests-floor-16.png'),
  require('../assets/images/guests-floor-17.png'),
  require('../assets/images/guests-floor-18.png'),
  require('../assets/images/guests-floor-19.png'),
  require('../assets/images/guests-floor-10.png'),
];

export const GUESTS_PER_FLOOR = 10;
export const GUEST_COLUMNS = 5;
export const GUEST_ROWS = 3;
export const GUEST_ATLAS_FRAME_WIDTH = 192;
export const GUEST_FRAME_WIDTH = 48;
export const GUEST_FRAME_HEIGHT = 64;
// New square atlases have larger character cutouts; this frame yields about 55px of visible character height, matching 5F.
export const GUEST_FRAME_SIZES_BY_FLOOR = Array.from({ length: 20 }, (_, index) =>
  index >= 9 && index <= 18
    ? { width: 36, height: 60 }
    : { width: GUEST_FRAME_WIDTH, height: GUEST_FRAME_HEIGHT },
);
export const GUEST_COUNTS_BY_FLOOR = [10, 10, 10, 12, 11, 10, 11, 13, 10, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 10] as const;
export const COSMETICS_SHOP_FLOOR = 7;
// Atlas metadata: all 11 original 7F guests (including the rainbow princess) now carry beauty totes.
export const BEAUTY_BAG_GUEST_INDICES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

export const GUEST_FRAME_CELLS: ReadonlyArray<{ column: number; row: number }> = [
  { column: 0, row: 0 },
  { column: 1, row: 0 },
  { column: 2, row: 0 },
  { column: 3, row: 0 },
  { column: 0, row: 1 },
  { column: 1, row: 1 },
  { column: 2, row: 1 },
  { column: 3, row: 1 },
  { column: 4, row: 0 },
  { column: 4, row: 1 },
  { column: 0, row: 2 },
  { column: 1, row: 2 },
  { column: 2, row: 2 },
];

export const GUEST_ROUTES: ReadonlyArray<{ from: number; to: number; top: number; duration: number }> = [
  { from: 8, to: 65, top: 62, duration: 14500 },
  { from: 77, to: 31, top: 64, duration: 12000 },
  { from: 22, to: 73, top: 73, duration: 17500 },
  { from: 70, to: 12, top: 82, duration: 16000 },
  { from: 45, to: 5, top: 82, duration: 13000 },
  { from: 12, to: 52, top: 74, duration: 18000 },
  { from: 54, to: 85, top: 63, duration: 11000 },
  { from: 85, to: 46, top: 76, duration: 19000 },
  { from: 28, to: 78, top: 69, duration: 15500 },
  { from: 91, to: 38, top: 86, duration: 13500 },
  { from: 5, to: 89, top: 68, duration: 16400 },
  { from: 88, to: 17, top: 78, duration: 14200 },
  { from: 18, to: 76, top: 88, duration: 17600 },
];

export function getGuestRouteBounds(
  route: (typeof GUEST_ROUTES)[number],
  frameSize: { width: number; height: number },
  sceneSize: number,
) {
  const maxLeft = Math.max(0, sceneSize - frameSize.width);
  const maxTop = Math.max(0, sceneSize - frameSize.height);
  const clamp = (value: number, max: number) => Math.max(0, Math.min(max, value));
  return {
    fromX: clamp(route.from * sceneSize / 100, maxLeft),
    toX: clamp(route.to * sceneSize / 100, maxLeft),
    top: clamp(route.top * sceneSize / 100, maxTop),
  };
}
