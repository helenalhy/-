export type DogFluffyPose = 1 | 2 | 3 | 4;

type DogPoseAssets = Record<DogFluffyPose, number>;

const DOG_FLUFFY_IMAGES: Record<string, DogPoseAssets> = {
  'fluffy-staff-huahua': {
    1: require('../assets/dogs-fluffy/huahua-1-wave.webp'),
    2: require('../assets/dogs-fluffy/huahua-2-coffee.webp'),
    3: require('../assets/dogs-fluffy/huahua-3-marshmallow.webp'),
    4: require('../assets/dogs-fluffy/huahua-4-jump.webp'),
  },
  'fluffy-staff-milkshake': {
    1: require('../assets/dogs-fluffy/naixi-1-wave.webp'),
    2: require('../assets/dogs-fluffy/naixi-2-milkshake.webp'),
    3: require('../assets/dogs-fluffy/naixi-3-snow.webp'),
    4: require('../assets/dogs-fluffy/naixi-4-jump.webp'),
  },
  'fluffy-staff-xiaoniu': {
    1: require('../assets/dogs-fluffy/xiaoniu-1-wave.webp'),
    2: require('../assets/dogs-fluffy/xiaoniu-2-frisbee.webp'),
    3: require('../assets/dogs-fluffy/xiaoniu-3-cloud.webp'),
    4: require('../assets/dogs-fluffy/xiaoniu-4-jump.webp'),
  },
  'fluffy-staff-pudding': {
    1: require('../assets/dogs-fluffy/buding-1-wave.webp'),
    2: require('../assets/dogs-fluffy/buding-2-pudding.webp'),
    3: require('../assets/dogs-fluffy/buding-3-dessert.webp'),
    4: require('../assets/dogs-fluffy/buding-4-jump.webp'),
  },
  'fluffy-staff-tangtang': {
    1: require('../assets/dogs-fluffy/tangtang-1-wave.webp'),
    2: require('../assets/dogs-fluffy/tangtang-2-candy.webp'),
    3: require('../assets/dogs-fluffy/tangtang-3-cloud.webp'),
    4: require('../assets/dogs-fluffy/tangtang-4-jump.webp'),
  },
  'fluffy-staff-pipi': {
    1: require('../assets/dogs-fluffy/pipi-1-wave.webp'),
    2: require('../assets/dogs-fluffy/pipi-2-checkin.webp'),
    3: require('../assets/dogs-fluffy/pipi-3-coins.webp'),
    4: require('../assets/dogs-fluffy/pipi-4-jump.webp'),
  },
  'fluffy-staff-amber': {
    1: require('../assets/dogs-fluffy/hupo-1-wave.webp'),
    2: require('../assets/dogs-fluffy/hupo-2-honey.webp'),
    3: require('../assets/dogs-fluffy/hupo-3-leaves.webp'),
    4: require('../assets/dogs-fluffy/hupo-4-jump.webp'),
  },
  'fluffy-staff-cloud': {
    1: require('../assets/dogs-fluffy/yunduo-1-wave.webp'),
    2: require('../assets/dogs-fluffy/yunduo-2-cloud.webp'),
    3: require('../assets/dogs-fluffy/yunduo-3-clouds.webp'),
    4: require('../assets/dogs-fluffy/yunduo-4-jump.webp'),
  },
  'fluffy-staff-wonton': {
    1: require('../assets/dogs-fluffy/yuntun-1-wave.webp'),
    2: require('../assets/dogs-fluffy/yuntun-2-wonton.webp'),
    3: require('../assets/dogs-fluffy/yuntun-3-dumpling.webp'),
    4: require('../assets/dogs-fluffy/yuntun-4-jump.webp'),
  },
  'fluffy-staff-butter': {
    1: require('../assets/dogs-fluffy/naiyou-1-wave.webp'),
    2: require('../assets/dogs-fluffy/naiyou-2-cream.webp'),
    3: require('../assets/dogs-fluffy/naiyou-3-cake.webp'),
    4: require('../assets/dogs-fluffy/naiyou-4-jump.webp'),
  },
  'fluffy-staff-sesame': {
    1: require('../assets/dogs-fluffy/zhima-1-wave.webp'),
    2: require('../assets/dogs-fluffy/zhima-2-sesame.webp'),
    3: require('../assets/dogs-fluffy/zhima-3-bun.webp'),
    4: require('../assets/dogs-fluffy/zhima-4-jump.webp'),
  },
  'fluffy-staff-snowball': {
    1: require('../assets/dogs-fluffy/xueqiu-1-wave.webp'),
    2: require('../assets/dogs-fluffy/xueqiu-2-snowball.webp'),
    3: require('../assets/dogs-fluffy/xueqiu-3-snow.webp'),
    4: require('../assets/dogs-fluffy/xueqiu-4-jump.webp'),
  },
  'fluffy-staff-maomao': {
    1: require('../assets/dogs-fluffy/maomao-1-wave.webp'),
    2: require('../assets/dogs-fluffy/maomao-2-cloud.webp'),
    3: require('../assets/dogs-fluffy/maomao-3-clouds.webp'),
    4: require('../assets/dogs-fluffy/maomao-4-jump.webp'),
  },
  'fluffy-staff-poppy': {
    1: require('../assets/dogs-fluffy/bobi-1-wave.webp'),
    2: require('../assets/dogs-fluffy/bobi-2-bun.webp'),
    3: require('../assets/dogs-fluffy/bobi-3-rolls.webp'),
    4: require('../assets/dogs-fluffy/bobi-4-jump.webp'),
  },
};

export function getDogFluffyImage(dogProfileKey: string, pose: DogFluffyPose): number {
  const source = DOG_FLUFFY_IMAGES[dogProfileKey]?.[pose];
  if (source === undefined) {
    throw new Error(`Missing bundled fluffy dog image for ${dogProfileKey}, pose ${pose}.`);
  }
  return source;
}

export function getDogFluffyImageCount(): number {
  return Object.values(DOG_FLUFFY_IMAGES).reduce((sum, poses) => sum + Object.keys(poses).length, 0);
}
