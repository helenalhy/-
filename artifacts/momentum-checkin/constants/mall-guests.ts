import type { ImageSourcePropType } from 'react-native';

// Each floor has a separately illustrated cast. Frames are 4 columns × 2 rows.
export const GUEST_SHEETS: ImageSourcePropType[] = [
  require('../assets/images/guests-floor-1.png'),
  require('../assets/images/guests-floor-2.png'),
  require('../assets/images/guests-floor-3.png'),
  require('../assets/images/guests-floor-4.png'),
  require('../assets/images/guests-floor-5.png'),
  require('../assets/images/guests-floor-6.png'),
  require('../assets/images/guests-floor-7.png'),
  require('../assets/images/guests-floor-8.png'),
  require('../assets/images/guests-floor-9.png'),
  require('../assets/images/guests-floor-10.png'),
];

export const GUESTS_PER_FLOOR = 8;
export const GUEST_FRAME_WIDTH = 32;
export const GUEST_FRAME_HEIGHT = 64;
