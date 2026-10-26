export type MallVisualCategory = 'shop' | 'facility' | 'decor';
export type MallObjectArchetype =
  | 'cloud-walk'
  | 'central-fountain'
  | 'wooden-bench'
  | 'garden-lights'
  | 'colorful-planter'
  | 'rest-pavilion'
  | 'coral-aquarium'
  | 'rhythm-stage'
  | 'yoga-deck'
  | 'sculpture-plaza'
  | 'observatory-dome'
  | 'tasting-court'
  | 'cloud-swing'
  | 'shell-lantern'
  | 'neon-sign'
  | 'aroma-diffuser'
  | 'gallery-frames'
  | 'starlight-mobile'
  | 'spice-display'
  | 'rainbow-arch'
  | 'clothing-rack'
  | 'clothing-wardrobe'
  | 'blouse-display'
  | 'skirt-display'
  | 'dress-display'
  | 'kimono-display'
  | 'coffee-machine'
  | 'ice-cream-machine'
  | 'cotton-candy-machine'
  | 'candy-display'
  | 'bakery-oven'
  | 'tea-brewer'
  | 'food-prep'
  | 'flower-station'
  | 'book-carousel'
  | 'capsule-machine'
  | 'craft-station'
  | 'sewing-machine'
  | 'electronics-bench'
  | 'jewelry-case'
  | 'dog-staff-huahua'
  | 'dog-staff-milkshake'
  | 'dog-staff-xiaoniu'
  | 'dog-staff-pudding';

const ARCHETYPES = new Set<MallObjectArchetype>([
  'cloud-walk',
  'central-fountain',
  'wooden-bench',
  'garden-lights',
  'colorful-planter',
  'rest-pavilion',
  'coral-aquarium',
  'rhythm-stage',
  'yoga-deck',
  'sculpture-plaza',
  'observatory-dome',
  'tasting-court',
  'cloud-swing',
  'shell-lantern',
  'neon-sign',
  'aroma-diffuser',
  'gallery-frames',
  'starlight-mobile',
  'spice-display',
  'rainbow-arch',
  'clothing-rack',
  'clothing-wardrobe',
  'blouse-display',
  'skirt-display',
  'dress-display',
  'kimono-display',
  'coffee-machine',
  'ice-cream-machine',
  'cotton-candy-machine',
  'candy-display',
  'bakery-oven',
  'tea-brewer',
  'food-prep',
  'flower-station',
  'book-carousel',
  'capsule-machine',
  'craft-station',
  'sewing-machine',
  'electronics-bench',
  'jewelry-case',
  'dog-staff-huahua',
  'dog-staff-milkshake',
  'dog-staff-xiaoniu',
  'dog-staff-pudding',
]);

const ICON_ARCHETYPES: Record<string, MallObjectArchetype> = {
  anchor: 'cloud-swing',
  activity: 'cloud-walk',
  book: 'gallery-frames',
  'book-open': 'gallery-frames',
  camera: 'gallery-frames',
  circle: 'yoga-deck',
  compass: 'observatory-dome',
  droplet: 'central-fountain',
  edit: 'tasting-court',
  'edit-2': 'tasting-court',
  'edit-3': 'tasting-court',
  feather: 'colorful-planter',
  gift: 'sculpture-plaza',
  grid: 'tasting-court',
  heart: 'rest-pavilion',
  hexagon: 'sculpture-plaza',
  home: 'rest-pavilion',
  image: 'gallery-frames',
  minus: 'wooden-bench',
  moon: 'starlight-mobile',
  music: 'rhythm-stage',
  package: 'spice-display',
  star: 'starlight-mobile',
  sun: 'garden-lights',
  sunrise: 'colorful-planter',
  target: 'yoga-deck',
  triangle: 'sculpture-plaza',
  wind: 'aroma-diffuser',
  zap: 'neon-sign',
};

const FACILITY_ARCHETYPES: MallObjectArchetype[] = [
  'central-fountain',
  'rest-pavilion',
  'tasting-court',
  'cloud-swing',
  'rhythm-stage',
  'coral-aquarium',
  'observatory-dome',
  'sculpture-plaza',
  'yoga-deck',
  'cloud-walk',
];

const DECOR_ARCHETYPES: MallObjectArchetype[] = [
  'colorful-planter',
  'garden-lights',
  'gallery-frames',
  'shell-lantern',
  'starlight-mobile',
  'neon-sign',
  'aroma-diffuser',
  'spice-display',
  'rainbow-arch',
  'wooden-bench',
  'sculpture-plaza',
];

function stableHash(value: string): number {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash;
}

export function getShopFacadeVariant(itemId: string): number {
  return stableHash(itemId) % 4;
}

export function resolveMallObjectArchetype(
  id: string,
  icon: string,
  category: MallVisualCategory,
): MallObjectArchetype {
  if (ARCHETYPES.has(id as MallObjectArchetype)) return id as MallObjectArchetype;
  const iconArchetype = ICON_ARCHETYPES[icon];
  if (iconArchetype) return iconArchetype;

  const options = category === 'facility' ? FACILITY_ARCHETYPES : DECOR_ARCHETYPES;
  return options[stableHash(id) % options.length];
}
