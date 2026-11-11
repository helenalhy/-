export type DogFoodIllustrationKind =
  | 'chicken'
  | 'turkey'
  | 'duck'
  | 'beef'
  | 'fish'
  | 'bone'
  | 'pumpkin'
  | 'carrot'
  | 'apple'
  | 'berry'
  | 'milk'
  | 'greens'
  | 'sweet-potato'
  | 'lamb'
  | 'venison'
  | 'liver'
  | 'banana'
  | 'oats'
  | 'cake'
  | 'ice-cream'
  | 'egg'
  | 'cookie'
  | 'yogurt'
  | 'dumpling'
  | 'soup'
  | 'cheese'
  | 'corn'
  | 'sesame'
  | 'bread';

export type DogStaffFoodOption = {
  id: string;
  name: string;
  illustration: DogFoodIllustrationKind;
  favorite?: boolean;
};

function foodMenu(
  dogKey: string,
  items: readonly (readonly [slug: string, name: string, illustration: DogFoodIllustrationKind, favorite?: boolean])[],
): DogStaffFoodOption[] {
  return items.map(([slug, name, illustration, favorite]) => ({
    id: `${dogKey}-food-${slug}`,
    name,
    illustration,
    ...(favorite ? { favorite: true } : {}),
  }));
}

export const DOG_STAFF_FOOD_OPTIONS: Record<string, DogStaffFoodOption[]> = {
  'fluffy-staff-huahua': foodMenu('fluffy-staff-huahua', [
    ['freeze-dried-chicken', '凍乾雞肉', 'chicken', true],
    ['freeze-dried-duck', '凍乾鴨肉', 'duck'],
    ['chicken-jerky', '雞肉乾', 'chicken'],
    ['carrot', '紅蘿蔔', 'carrot'],
    ['apple', '蘋果', 'apple'],
    ['banana', '香蕉', 'banana'],
    ['oat-biscuit', '狗用燕麥餅', 'oats'],
    ['strawberry-dog-cake', '狗用無添加糖草莓蛋糕', 'cake'],
  ]),
  'fluffy-staff-milkshake': foodMenu('fluffy-staff-milkshake', [
    ['freeze-dried-salmon', '凍乾三文魚', 'fish', true],
    ['freeze-dried-duck', '凍乾鴨肉', 'duck'],
    ['freeze-dried-chicken', '凍乾雞肉', 'chicken'],
    ['salmon-jerky', '三文魚乾', 'fish'],
    ['blueberries', '藍莓', 'berry'],
    ['banana', '香蕉', 'banana'],
    ['oat-biscuit', '狗用燕麥餅', 'oats'],
    ['banana-ice-cream', '狗用無添加糖香蕉雪糕', 'ice-cream'],
  ]),
  'fluffy-staff-xiaoniu': foodMenu('fluffy-staff-xiaoniu', [
    ['bone-biscuit', '骨頭餅乾', 'bone', true],
    ['freeze-dried-beef', '凍乾牛肉', 'beef'],
    ['beef-jerky', '牛肉乾', 'beef'],
    ['carrot', '紅蘿蔔', 'carrot'],
    ['apple', '蘋果', 'apple'],
    ['cheese-stick', '芝士條', 'cheese'],
    ['oat-biscuit', '狗用燕麥餅', 'oats'],
    ['carrot-cake', '狗用無添加糖紅蘿蔔蛋糕', 'cake'],
  ]),
  'fluffy-staff-pudding': foodMenu('fluffy-staff-pudding', [
    ['pumpkin-pudding', '狗用無添加糖南瓜布甸', 'pumpkin', true],
    ['freeze-dried-duck', '凍乾鴨肉', 'duck'],
    ['egg', '雞蛋', 'egg'],
    ['sweet-potato', '番薯', 'sweet-potato'],
    ['banana', '香蕉', 'banana'],
    ['oat-biscuit', '狗用燕麥餅', 'oats'],
    ['dog-biscuit', '狗餅乾', 'cookie'],
    ['blueberry-yogurt', '狗用無添加糖藍莓乳酪', 'yogurt'],
  ]),
  'fluffy-staff-tangtang': foodMenu('fluffy-staff-tangtang', [
    ['freeze-dried-salmon', '凍乾三文魚', 'fish', true],
    ['freeze-dried-chicken', '凍乾雞肉', 'chicken'],
    ['banana', '香蕉', 'banana'],
    ['blueberries', '藍莓', 'berry'],
    ['apple', '蘋果', 'apple'],
    ['oat-biscuit', '狗用燕麥餅', 'oats'],
    ['dog-biscuit', '狗餅乾', 'cookie'],
    ['strawberry-dog-cake', '狗用無添加糖草莓蛋糕', 'cake'],
  ]),
  'fluffy-staff-pipi': foodMenu('fluffy-staff-pipi', [
    ['chicken-jerky', '雞肉乾', 'chicken', true],
    ['freeze-dried-chicken', '凍乾雞肉', 'chicken'],
    ['bone-biscuit', '骨頭餅乾', 'bone'],
    ['sweet-potato', '番薯', 'sweet-potato'],
    ['carrot', '紅蘿蔔', 'carrot'],
    ['beef-jerky', '牛肉乾', 'beef'],
    ['cheese-stick', '芝士條', 'cheese'],
    ['peanut-banana-pie', '狗用無木糖醇花生醬香蕉批', 'cake'],
  ]),
  'fluffy-staff-amber': foodMenu('fluffy-staff-amber', [
    ['honey-chicken-jerky', '蜂蜜雞肉乾', 'chicken', true],
    ['freeze-dried-beef', '凍乾牛肉', 'beef'],
    ['egg', '雞蛋', 'egg'],
    ['apple', '蘋果', 'apple'],
    ['carrot', '紅蘿蔔', 'carrot'],
    ['oat-biscuit', '狗用燕麥餅', 'oats'],
    ['sweet-potato', '番薯', 'sweet-potato'],
    ['honey-yogurt', '狗用無添加糖蜂蜜乳酪', 'yogurt'],
  ]),
  'fluffy-staff-cloud': foodMenu('fluffy-staff-cloud', [
    ['freeze-dried-duck', '凍乾鴨肉', 'duck', true],
    ['freeze-dried-chicken', '凍乾雞肉', 'chicken'],
    ['banana', '香蕉', 'banana'],
    ['blueberries', '藍莓', 'berry'],
    ['oat-biscuit', '狗用燕麥餅', 'oats'],
    ['egg', '雞蛋', 'egg'],
    ['dog-biscuit', '狗餅乾', 'cookie'],
    ['cloud-yogurt-cup', '狗用無添加糖雲朵乳酪杯', 'yogurt'],
  ]),
  'fluffy-staff-wonton': foodMenu('fluffy-staff-wonton', [
    ['chicken-wontons', '雞肉雲吞', 'dumpling', true],
    ['doggy-dumplings', '狗仔餃子', 'dumpling'],
    ['chicken-broth', '無鹽雞湯', 'soup'],
    ['vegetable-broth', '無鹽蔬菜湯', 'soup'],
    ['carrot', '紅蘿蔔', 'carrot'],
    ['corn', '粟米', 'corn'],
    ['egg', '雞蛋', 'egg'],
    ['pumpkin-pudding', '狗用無添加糖南瓜布甸', 'pumpkin'],
  ]),
  'fluffy-staff-butter': foodMenu('fluffy-staff-butter', [
    ['freeze-dried-duck', '凍乾鴨肉', 'duck', true],
    ['freeze-dried-chicken', '凍乾雞肉', 'chicken'],
    ['egg', '雞蛋', 'egg'],
    ['banana', '香蕉', 'banana'],
    ['blueberries', '藍莓', 'berry'],
    ['oat-biscuit', '狗用燕麥餅', 'oats'],
    ['dog-biscuit', '狗餅乾', 'cookie'],
    ['cream-yogurt-cup', '狗用無添加糖乳酪杯', 'yogurt'],
  ]),
  'fluffy-staff-sesame': foodMenu('fluffy-staff-sesame', [
    ['sesame-dog-biscuit', '芝麻狗餅乾', 'sesame', true],
    ['freeze-dried-beef', '凍乾牛肉', 'beef'],
    ['oat-biscuit', '狗用燕麥餅', 'oats'],
    ['carrot', '紅蘿蔔', 'carrot'],
    ['egg', '雞蛋', 'egg'],
    ['sweet-potato', '番薯', 'sweet-potato'],
    ['pumpkin', '南瓜', 'pumpkin'],
    ['sesame-yogurt-cup', '狗用無添加糖芝麻乳酪杯', 'yogurt'],
  ]),
  'fluffy-staff-snowball': foodMenu('fluffy-staff-snowball', [
    ['freeze-dried-salmon', '凍乾三文魚', 'fish', true],
    ['salmon-jerky', '三文魚乾', 'fish'],
    ['blueberries', '藍莓', 'berry'],
    ['banana', '香蕉', 'banana'],
    ['egg', '雞蛋', 'egg'],
    ['oat-biscuit', '狗用燕麥餅', 'oats'],
    ['dog-biscuit', '狗餅乾', 'cookie'],
    ['blueberry-ice-cream', '狗用無添加糖藍莓雪糕', 'ice-cream'],
  ]),
  'fluffy-staff-maomao': foodMenu('fluffy-staff-maomao', [
    ['freeze-dried-beef', '凍乾牛肉', 'beef', true],
    ['freeze-dried-chicken', '凍乾雞肉', 'chicken'],
    ['banana', '香蕉', 'banana'],
    ['blueberries', '藍莓', 'berry'],
    ['oat-biscuit', '狗用燕麥餅', 'oats'],
    ['egg', '雞蛋', 'egg'],
    ['dog-biscuit', '狗餅乾', 'cookie'],
    ['banana-ice-cream', '狗用無添加糖香蕉雪糕', 'ice-cream'],
  ]),
  'fluffy-staff-poppy': foodMenu('fluffy-staff-poppy', [
    ['freeze-dried-beef', '凍乾牛肉', 'beef', true],
    ['wholewheat-dog-bread', '全麥狗麵包', 'bread'],
    ['freeze-dried-chicken', '凍乾雞肉', 'chicken'],
    ['chicken-jerky', '雞肉乾', 'chicken'],
    ['sweet-potato', '番薯', 'sweet-potato'],
    ['carrot', '紅蘿蔔', 'carrot'],
    ['corn', '粟米', 'corn'],
    ['pumpkin-pudding', '狗用無添加糖南瓜布甸', 'pumpkin'],
  ]),
};
