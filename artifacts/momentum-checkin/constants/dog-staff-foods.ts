export type DogStaffFoodOption = {
  id: string;
  name: string;
};

function foodMenu(
  dogKey: string,
  items: readonly (readonly [slug: string, name: string])[],
): DogStaffFoodOption[] {
  return items.map(([slug, name]) => ({
    id: `${dogKey}-food-${slug}`,
    name,
  }));
}

export const DOG_STAFF_FOOD_OPTIONS: Record<string, DogStaffFoodOption[]> = {
  'fluffy-staff-huahua': foodMenu('fluffy-staff-huahua', [
    ['chicken-bites', '雞肉小肉乾'],
    ['salmon-sweet-potato', '鮭魚地瓜餅'],
    ['pumpkin-meatballs', '南瓜小肉丸'],
    ['carrot-oat-crisps', '胡蘿蔔燕麥脆片'],
    ['apple-goat-milk', '蘋果羊奶凍乾'],
  ]),
  'fluffy-staff-milkshake': foodMenu('fluffy-staff-milkshake', [
    ['beef-cubes', '牛肉小方塊'],
    ['turkey-strips', '火雞胸肉條'],
    ['cod-sweet-potato', '鱈魚地瓜脆片'],
    ['blueberry-oat-bites', '藍莓燕麥餅'],
    ['lamb-pumpkin', '羊肉南瓜酥'],
  ]),
  'fluffy-staff-xiaoniu': foodMenu('fluffy-staff-xiaoniu', [
    ['duck-carrot-rolls', '鴨肉胡蘿蔔卷'],
    ['tuna-rice-bites', '鮪魚小飯糰'],
    ['chicken-freeze-dried', '雞胸凍乾'],
    ['apple-goat-mousse', '羊奶蘋果慕斯'],
    ['venison-sweet-potato', '鹿肉地瓜丸'],
  ]),
  'fluffy-staff-pudding': foodMenu('fluffy-staff-pudding', [
    ['lamb-carrot-balls', '羊肉胡蘿蔔球'],
    ['salmon-spinach-crisps', '鮭魚菠菜脆餅'],
    ['turkey-pumpkin-soup', '火雞南瓜濃湯'],
    ['cod-sweet-potato-strips', '鱈魚地瓜條'],
    ['chicken-apple-cookies', '雞肉蘋果小餅'],
  ]),
  'fluffy-staff-tangtang': foodMenu('fluffy-staff-tangtang', [
    ['salmon-chicken-duo', '鮭魚雞肉雙拼'],
    ['lamb-sweet-potato-dice', '羊肉地瓜丁'],
    ['pumpkin-goat-milk-cup', '南瓜羊奶小杯'],
    ['blueberry-oat-balls', '藍莓燕麥丸'],
    ['turkey-carrot-floss', '火雞胡蘿蔔鬆'],
  ]),
  'fluffy-staff-pipi': foodMenu('fluffy-staff-pipi', [
    ['beef-liver-nibbles', '牛肝肉粒'],
    ['duck-pumpkin-strips', '鴨肉南瓜條'],
    ['cod-apple-crisps', '鱈魚蘋果酥'],
    ['chicken-sweet-potato-rolls', '雞肉地瓜卷'],
    ['broccoli-goat-milk-biscuits', '西蘭花羊奶餅'],
  ]),
  'fluffy-staff-amber': foodMenu('fluffy-staff-amber', [
    ['salmon-goat-milk-balls', '鮭魚羊奶小丸'],
    ['duck-sweet-potato-chips', '鴨胸甜薯片'],
    ['beef-pumpkin-soft-bites', '牛肉南瓜軟餅'],
    ['apple-chicken-tart', '蘋果雞肉小塔'],
    ['carrot-lamb-crunch', '胡蘿蔔羊肉脆球'],
  ]),
  'fluffy-staff-cloud': foodMenu('fluffy-staff-cloud', [
    ['cod-pumpkin-bites', '鱈魚南瓜小船'],
    ['turkey-oat-biscuits', '火雞燕麥小餅'],
    ['banana-goat-milk-crisps', '香蕉羊奶凍乾'],
    ['duck-sweet-potato-balls', '鴨肉地瓜丸'],
    ['chicken-broccoli-dice', '雞肉西蘭花粒'],
  ]),
  'fluffy-staff-wonton': foodMenu('fluffy-staff-wonton', [
    ['beef-apple-cubes', '牛肉蘋果小方'],
    ['salmon-carrot-strips', '鮭魚胡蘿蔔條'],
    ['lamb-oat-cookies', '羊肉燕麥餅'],
    ['turkey-pumpkin-dice', '火雞南瓜小丁'],
    ['blueberry-chicken-crisps', '藍莓雞肉脆片'],
  ]),
  'fluffy-staff-butter': foodMenu('fluffy-staff-butter', [
    ['chicken-pumpkin-tart', '雞肉南瓜小塔'],
    ['duck-apple-rolls', '鴨胸蘋果卷'],
    ['salmon-goat-milk-crisps', '鮭魚羊奶脆餅'],
    ['turkey-spinach-balls', '火雞菠菜肉丸'],
    ['sweet-potato-beef-pastry', '地瓜牛肉酥'],
  ]),
  'fluffy-staff-sesame': foodMenu('fluffy-staff-sesame', [
    ['venison-meatballs', '鹿肉小肉丸'],
    ['cod-sweet-potato-chips', '鱈魚地瓜小片'],
    ['chicken-oat-biscuits', '雞胸燕麥餅'],
    ['lamb-carrot-crisps', '羊肉胡蘿蔔凍乾'],
    ['salmon-pumpkin-bowl', '鮭魚南瓜小碗'],
  ]),
  'fluffy-staff-snowball': foodMenu('fluffy-staff-snowball', [
    ['turkey-apple-cookies', '火雞肉蘋果小餅'],
    ['duck-blueberry-balls', '鴨肉藍莓小球'],
    ['goat-milk-pumpkin-mousse', '羊奶南瓜慕斯'],
    ['chicken-broccoli-crisps', '雞肉西蘭花脆片'],
    ['cod-sweet-potato-rolls', '鱈魚甜薯小卷'],
  ]),
  'fluffy-staff-maomao': foodMenu('fluffy-staff-maomao', [
    ['lamb-apple-cubes', '羊肉蘋果小方'],
    ['salmon-oat-strips', '鮭魚燕麥脆條'],
    ['chicken-liver-carrot-balls', '雞肝胡蘿蔔球'],
    ['duck-pumpkin-crisps', '鴨肉南瓜凍乾'],
    ['goat-milk-blueberry-tart', '羊奶藍莓小塔'],
  ]),
  'fluffy-staff-poppy': foodMenu('fluffy-staff-poppy', [
    ['beef-sweet-potato-cookies', '牛肉地瓜小餅'],
    ['turkey-spinach-rolls', '火雞肉菠菜卷'],
    ['cod-goat-milk-balls', '鱈魚羊奶小球'],
    ['salmon-apple-strips', '鮭魚蘋果條'],
    ['chicken-pumpkin-mousse', '雞肉南瓜慕斯'],
  ]),
};
