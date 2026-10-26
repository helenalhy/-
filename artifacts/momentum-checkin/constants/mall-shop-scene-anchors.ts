import type { ShopInteriorSceneKey, ShopInteriorSlotId } from './mall-shop-interior';

/**
 * Anchor points are measured against the square shop-room illustrations
 * (0..1 of image width/height). `table` is the contact point of an object's
 * bottom edge on a real tabletop / counter / shelf in the artwork; `floor` is
 * the contact point on the floor near the same slot. Positions are mapped to
 * the on-screen frame with the same "cover" crop the ImageBackground uses.
 */
export type AnchorPoint = { x: number; y: number };
export interface SlotAnchor { table: AnchorPoint; floor: AnchorPoint }
export type SceneAnchors = Record<ShopInteriorSlotId, SlotAnchor>;
export type PlacementClass = 'tabletop' | 'floor' | 'wall';

const a = (tx: number, ty: number, fx: number, fy: number): SlotAnchor => ({
  table: { x: tx, y: ty },
  floor: { x: fx, y: fy },
});

const build = (
  win: SlotAnchor, left: SlotAnchor, center: SlotAnchor,
  right: SlotAnchor, back: SlotAnchor, counter: SlotAnchor,
  leftTable: SlotAnchor, rightTable: SlotAnchor,
): SceneAnchors => ({
  'front-window': win,
  'left-wall': left,
  center,
  'right-wall': right,
  'back-wall': back,
  counter,
  'left-table': leftTable,
  'right-table': rightTable,
});

// Order: window, left, center, right, back, counter.
export const SCENE_ANCHORS: Record<ShopInteriorSceneKey, SceneAnchors> = {
  cafe: build(a(0.45, 0.625, 0.38, 0.80), a(0.07, 0.725, 0.14, 0.96), a(0.20, 0.665, 0.45, 0.90), a(0.95, 0.60, 0.88, 0.95), a(0.78, 0.375, 0.58, 0.80), a(0.74, 0.58, 0.68, 0.84), a(0.16, 0.69, 0.18, 0.96), a(0.89, 0.57, 0.88, 0.84)),
  general: build(a(0.58, 0.47, 0.60, 0.62), a(0.07, 0.60, 0.14, 0.90), a(0.50, 0.615, 0.52, 0.84), a(0.84, 0.70, 0.80, 0.94), a(0.69, 0.375, 0.64, 0.58), a(0.19, 0.505, 0.28, 0.72), a(0.29, 0.59, 0.30, 0.82), a(0.83, 0.60, 0.82, 0.88)),
  candy: build(a(0.08, 0.385, 0.20, 0.62), a(0.14, 0.93, 0.20, 0.97), a(0.66, 0.525, 0.50, 0.78), a(0.90, 0.525, 0.82, 0.82), a(0.22, 0.285, 0.46, 0.62), a(0.25, 0.52, 0.32, 0.86), a(0.13, 0.58, 0.16, 0.78), a(0.82, 0.58, 0.82, 0.80)),
  icecream: build(a(0.27, 0.325, 0.42, 0.60), a(0.07, 0.56, 0.14, 0.95), a(0.88, 0.665, 0.68, 0.90), a(0.63, 0.555, 0.70, 0.80), a(0.45, 0.37, 0.52, 0.62), a(0.24, 0.55, 0.30, 0.84), a(0.77, 0.77, 0.72, 0.94), a(0.91, 0.74, 0.88, 0.96)),
  bakery: build(a(0.07, 0.485, 0.14, 0.70), a(0.08, 0.745, 0.18, 0.96), a(0.22, 0.46, 0.35, 0.78), a(0.92, 0.45, 0.86, 0.90), a(0.56, 0.35, 0.50, 0.75), a(0.58, 0.45, 0.48, 0.78), a(0.10, 0.77, 0.16, 0.92), a(0.71, 0.43, 0.70, 0.70)),
  tea: build(a(0.62, 0.58, 0.60, 0.78), a(0.12, 0.54, 0.10, 0.90), a(0.80, 0.69, 0.60, 0.92), a(0.92, 0.80, 0.84, 0.97), a(0.20, 0.34, 0.50, 0.66), a(0.28, 0.585, 0.32, 0.82), a(0.76, 0.75, 0.74, 0.94), a(0.90, 0.76, 0.88, 0.95)),
  food: build(a(0.18, 0.60, 0.30, 0.82), a(0.10, 0.70, 0.12, 0.95), a(0.82, 0.78, 0.55, 0.96), a(0.88, 0.54, 0.80, 0.78), a(0.75, 0.40, 0.58, 0.72), a(0.45, 0.55, 0.45, 0.80), a(0.15, 0.56, 0.18, 0.82), a(0.78, 0.84, 0.76, 0.97)),
  flower: build(a(0.55, 0.60, 0.60, 0.80), a(0.20, 0.75, 0.30, 0.95), a(0.45, 0.60, 0.50, 0.82), a(0.82, 0.74, 0.80, 0.93), a(0.50, 0.46, 0.50, 0.66), a(0.45, 0.60, 0.48, 0.88), a(0.36, 0.63, 0.35, 0.84), a(0.75, 0.61, 0.77, 0.84)),
  book: build(a(0.62, 0.50, 0.58, 0.72), a(0.07, 0.65, 0.15, 0.90), a(0.38, 0.68, 0.45, 0.82), a(0.95, 0.66, 0.84, 0.95), a(0.64, 0.51, 0.55, 0.70), a(0.82, 0.62, 0.72, 0.90), a(0.29, 0.59, 0.27, 0.82), a(0.79, 0.72, 0.75, 0.94)),
  toy: build(a(0.30, 0.52, 0.34, 0.78), a(0.10, 0.50, 0.12, 0.95), a(0.55, 0.64, 0.50, 0.88), a(0.80, 0.71, 0.76, 0.96), a(0.50, 0.55, 0.40, 0.58), a(0.82, 0.69, 0.74, 0.95), a(0.15, 0.79, 0.17, 0.95), a(0.74, 0.80, 0.74, 0.96)),
  craft: build(a(0.48, 0.55, 0.50, 0.72), a(0.15, 0.58, 0.20, 0.82), a(0.45, 0.62, 0.50, 0.86), a(0.88, 0.60, 0.80, 0.84), a(0.55, 0.47, 0.60, 0.62), a(0.60, 0.64, 0.64, 0.92), a(0.25, 0.58, 0.25, 0.80), a(0.70, 0.57, 0.70, 0.80)),
  womenswear: build(a(0.38, 0.62, 0.40, 0.76), a(0.12, 0.69, 0.25, 0.92), a(0.60, 0.62, 0.55, 0.84), a(0.92, 0.82, 0.78, 0.96), a(0.44, 0.53, 0.50, 0.70), a(0.66, 0.84, 0.58, 0.97), a(0.18, 0.63, 0.20, 0.84), a(0.81, 0.70, 0.80, 0.93)),
  bridal: build(a(0.12, 0.67, 0.18, 0.80), a(0.04, 0.58, 0.14, 0.78), a(0.78, 0.84, 0.50, 0.92), a(0.92, 0.45, 0.80, 0.70), a(0.76, 0.38, 0.70, 0.62), a(0.75, 0.84, 0.64, 0.95), a(0.26, 0.80, 0.25, 0.91), a(0.78, 0.83, 0.75, 0.95)),
  eveningwear: build(a(0.38, 0.62, 0.42, 0.78), a(0.07, 0.80, 0.18, 0.95), a(0.68, 0.80, 0.55, 0.95), a(0.92, 0.70, 0.86, 0.90), a(0.33, 0.66, 0.40, 0.72), a(0.40, 0.66, 0.46, 0.78), a(0.13, 0.65, 0.17, 0.85), a(0.73, 0.72, 0.77, 0.92)),
  kimono: build(a(0.10, 0.62, 0.14, 0.80), a(0.30, 0.56, 0.32, 0.78), a(0.52, 0.70, 0.50, 0.88), a(0.92, 0.88, 0.80, 0.95), a(0.63, 0.55, 0.60, 0.74), a(0.76, 0.76, 0.72, 0.92), a(0.34, 0.71, 0.34, 0.89), a(0.74, 0.74, 0.76, 0.93)),
  supermarket: build(a(0.32, 0.55, 0.30, 0.74), a(0.12, 0.84, 0.10, 0.96), a(0.45, 0.72, 0.50, 0.92), a(0.93, 0.74, 0.85, 0.92), a(0.80, 0.58, 0.70, 0.74), a(0.40, 0.55, 0.42, 0.78), a(0.46, 0.72, 0.49, 0.92), a(0.54, 0.74, 0.58, 0.94)),
  hyakuen: build(a(0.15, 0.62, 0.20, 0.82), a(0.18, 0.80, 0.22, 0.94), a(0.50, 0.56, 0.50, 0.78), a(0.80, 0.80, 0.70, 0.96), a(0.20, 0.45, 0.30, 0.64), a(0.90, 0.66, 0.84, 0.90), a(0.28, 0.76, 0.28, 0.92), a(0.75, 0.76, 0.72, 0.94)),
  swimwear: build(a(0.62, 0.67, 0.55, 0.84), a(0.15, 0.82, 0.22, 0.95), a(0.55, 0.78, 0.60, 0.92), a(0.90, 0.70, 0.84, 0.90), a(0.38, 0.55, 0.40, 0.78), a(0.52, 0.66, 0.54, 0.88), a(0.45, 0.72, 0.45, 0.90), a(0.66, 0.71, 0.68, 0.90)),
  cosplay: build(a(0.28, 0.62, 0.25, 0.78), a(0.08, 0.80, 0.12, 0.92), a(0.50, 0.70, 0.50, 0.88), a(0.95, 0.80, 0.88, 0.95), a(0.55, 0.48, 0.60, 0.62), a(0.82, 0.60, 0.78, 0.80), a(0.28, 0.69, 0.29, 0.87), a(0.82, 0.70, 0.82, 0.88)),
  electronics: build(a(0.58, 0.64, 0.55, 0.78), a(0.20, 0.73, 0.15, 0.92), a(0.46, 0.50, 0.50, 0.72), a(0.88, 0.60, 0.90, 0.80), a(0.50, 0.46, 0.60, 0.60), a(0.85, 0.80, 0.70, 0.96), a(0.37, 0.67, 0.38, 0.86), a(0.80, 0.66, 0.80, 0.86)),
  boutique: build(a(0.62, 0.52, 0.66, 0.78), a(0.12, 0.60, 0.20, 0.84), a(0.55, 0.63, 0.50, 0.88), a(0.92, 0.84, 0.86, 0.94), a(0.70, 0.37, 0.58, 0.58), a(0.20, 0.64, 0.28, 0.90), a(0.19, 0.58, 0.22, 0.80), a(0.84, 0.76, 0.82, 0.94)),
};

const FLOOR_ID = /staff|oven|freezer|warmer|steamer|kiln|wardrobe|rack|mannequin|bench|chair|sofa|lounge|fountain|pavilion|aquarium|stage|arch|shelf|shelves|showcase|display-case|display.?cabinet|chilled|island|cabinet|podium|pedestal|vase|plant|planter|carousel|stand|wall-?rack|photo-set|fitting|kimono-display|dress-display|blouse-display|skirt-display|clothing|展示櫃|展示柜|陳列櫃|陳列柜|衣櫃|衣柜|衣架|冷藏|烤爐|烤箱|冰櫃|冰柜|展示台|展示架|展示島|展示岛|貨架|货架|店員|店员|長椅|长椅|沙發|沙发|座椅/;
const WALL_ID = /(?:^|[- ])(?:wall|frame|gallery|neon|sign|lamp|light|mobile|mirror|picture|curtain|banner|lantern)(?:$|[- ])|牆|墙|掛畫|挂画|招牌|吊燈|吊灯|掛燈|挂灯|掛鏡|挂镜/;
const TABLE_VISUAL = /coffee-machine|ice-cream-machine|cotton-candy|tea-brewer|capsule|sewing|food-prep|craft-station|electronics-bench|jewelry|candy-display|flower-station|spice|mixer|waffle|grinder|shaker|sealing|dessert|noodle/;

export interface PlacementProfile { cls: PlacementClass; scale: number }

export function classifyDecoration(d: { id: string; name?: string; icon?: string; visual?: string; itemKind?: string }): PlacementProfile {
  const id = d.id.toLowerCase();
  const visual = (d.visual ?? '').toLowerCase();
  const icon = (d.icon ?? '').toLowerCase();
  const text = `${id} ${visual} ${(d.name ?? '').toLowerCase()}`;
  // Staff and large appliances/furniture stand on the floor, even when the
  // artwork id contains "machine" or "oven".
  if (/staff/.test(text) || /freezer|warmer|steamer|kiln|wardrobe|oven-large/.test(id)) return { cls: 'floor', scale: 1.2 };
  if (/oven/.test(text) && !/mixer|waffle|cone/.test(id)) return { cls: 'floor', scale: 1.15 };
  if (/mixer|waffle|cone/.test(id)) return { cls: 'tabletop', scale: 0.78 };
  if (TABLE_VISUAL.test(visual) || TABLE_VISUAL.test(id)) return { cls: 'tabletop', scale: 0.8 };
  if (FLOOR_ID.test(text)) return { cls: 'floor', scale: /display|case|rack|wardrobe|fountain|aquarium|stage|arch/.test(text) ? 1.1 : 1 };
  if (
    WALL_ID.test(text)
    || (['image', 'monitor', 'map-pin', 'tag'].includes(icon) && /wall|frame|screen|sign|board|畫|牆|墙|牌|螢幕|屏/.test(text))
  ) return { cls: 'wall', scale: 0.82 };
  return { cls: 'tabletop', scale: d.itemKind === 'equipment' ? 0.84 : 0.78 };
}

export const WALL_LIFT = 0.1; // wall decor hangs this far above the slot's table line

export function resolveObjectAnchor(
  sceneKey: ShopInteriorSceneKey,
  slot: ShopInteriorSlotId,
  cls: PlacementClass,
): AnchorPoint {
  const anchor = SCENE_ANCHORS[sceneKey][slot];
  if (cls === 'floor') return anchor.floor;
  if (cls === 'wall') return { x: anchor.table.x, y: Math.max(0.12, anchor.table.y - WALL_LIFT) };
  return anchor.table;
}

/** Maps an image-space point into frame pixels for a "cover" square image. */
export function mapCoverPoint(p: AnchorPoint, width: number, height: number): { x: number; y: number } {
  const size = Math.max(width, height);
  return { x: (width - size) / 2 + p.x * size, y: (height - size) / 2 + p.y * size };
}
