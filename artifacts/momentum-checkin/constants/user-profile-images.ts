const PROFILE_DOG_IMAGES: Record<string, number> = {
  'fluffy-staff-huahua': require('../assets/profile-avatars/huahua.png'),
  'fluffy-staff-milkshake': require('../assets/profile-avatars/naixi.png'),
  'fluffy-staff-xiaoniu': require('../assets/profile-avatars/xiaoniu.png'),
  'fluffy-staff-pudding': require('../assets/profile-avatars/buding.png'),
  'fluffy-staff-tangtang': require('../assets/profile-avatars/tangtang.png'),
  'fluffy-staff-pipi': require('../assets/profile-avatars/pipi.png'),
  'fluffy-staff-amber': require('../assets/profile-avatars/hupo.png'),
  'fluffy-staff-cloud': require('../assets/profile-avatars/yunduo.png'),
  'fluffy-staff-wonton': require('../assets/profile-avatars/yuntun.png'),
  'fluffy-staff-butter': require('../assets/profile-avatars/naiyou.png'),
  'fluffy-staff-sesame': require('../assets/profile-avatars/zhima.png'),
  'fluffy-staff-snowball': require('../assets/profile-avatars/xueqiu.png'),
  'fluffy-staff-maomao': require('../assets/profile-avatars/maomao.png'),
  'fluffy-staff-poppy': require('../assets/profile-avatars/bobi.png'),
};

export function getUserProfileDogImage(dogKey: string): number {
  const image = PROFILE_DOG_IMAGES[dogKey];
  if (image === undefined) {
    throw new Error(`Missing bundled profile avatar for ${dogKey}.`);
  }
  return image;
}
