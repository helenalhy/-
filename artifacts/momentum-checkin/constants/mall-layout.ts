type Column = 'left' | 'center' | 'right';
type PlazaRow = 1 | 2 | 3;
type AnnexRow = 1 | 2 | 3 | 4;
type ExtensionRow = 1 | 2 | 3 | 4;
export type MallWing = 'main' | 'annex' | 'extension' | 'extension3' | 'extension4';
export type MallSlotId = `floor-${number}-${Column | `plaza-${PlazaRow}-${Column}` | `annex-${AnnexRow}-${'left' | 'right'}` | `extension-${ExtensionRow}-${Column}` | `extension3-${ExtensionRow}-${Column}` | `extension4-${ExtensionRow}-${Column}`}`;

const COLUMNS: Column[] = ['left', 'center', 'right'];
const LEGACY_FLOORS = [3, 2, 1, 4, 5, 6, 7, 8, 9, 10];
const EXPANSION_FLOORS = [11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
const NEW_FLOORS = [21, 22, 23, 24, 25, 26, 27, 28, 29, 30];
export const MALL_POSITIONS_PER_FLOOR = 56;
// Preserve all original slot IDs and ordering before adding either annex.
function createFloorSlotIds(floors: number[]): MallSlotId[] {
  return [
    ...floors.flatMap((floor) => COLUMNS.map((column): MallSlotId => `floor-${floor}-${column}`)),
    ...floors.flatMap((floor) => ([1, 2, 3] as const).flatMap((row) =>
      COLUMNS.map((column): MallSlotId => `floor-${floor}-plaza-${row}-${column}`),
    )),
    ...floors.flatMap((floor) => ([1, 2, 3, 4] as const).flatMap((row) =>
      (['left', 'right'] as const).map((column): MallSlotId => `floor-${floor}-annex-${row}-${column}`),
    )),
    ...floors.flatMap((floor) => ([1, 2, 3, 4] as const).flatMap((row) =>
      COLUMNS.map((column): MallSlotId => `floor-${floor}-extension-${row}-${column}`),
    )),
    ...floors.flatMap((floor) => ([1, 2, 3, 4] as const).flatMap((row) =>
      COLUMNS.map((column): MallSlotId => `floor-${floor}-extension3-${row}-${column}`),
    )),
    ...floors.flatMap((floor) => ([1, 2, 3, 4] as const).flatMap((row) =>
      COLUMNS.map((column): MallSlotId => `floor-${floor}-extension4-${row}-${column}`),
    )),
  ];
}

export const MALL_SLOT_IDS: MallSlotId[] = [
  ...createFloorSlotIds(LEGACY_FLOORS),
  ...createFloorSlotIds(EXPANSION_FLOORS),
  ...createFloorSlotIds(NEW_FLOORS),
];

export function getMallSlotFloor(slotId: MallSlotId): number {
  return Number(slotId.split('-')[1]);
}

export function getMallSlotPosition(slotId: MallSlotId) {
  const parts = slotId.split('-');
  const floor = `${getMallSlotFloor(slotId)}F`;
  const column = parts[parts.length - 1];
  const columnLabel = column === 'left' ? '左側' : column === 'center' ? '中央' : '右側';
  const annex = parts[2] === 'annex';
  const extension = parts[2] === 'extension' || parts[2] === 'extension3' || parts[2] === 'extension4';
  const wing: MallWing = parts[2] === 'extension3' ? 'extension3'
    : parts[2] === 'extension4' ? 'extension4'
      : extension ? 'extension' : annex ? 'annex' : 'main';
  const row = parts[2] === 'plaza' || annex || extension ? Number(parts[3]) : 0;
  const plaza = parts[2] === 'plaza' || (annex && row > 1) || extension;
  const plazaRow = annex ? row - 1 : row;
  const left: `${number}%` = plaza
    ? column === 'left' ? '6%' : column === 'center' ? '39%' : '72%'
    : column === 'left' ? '12%' : column === 'center' ? '37%' : '62%';
  const scale = extension
    ? 0.52 + (row - 1) * 0.04
    : plaza
      ? 0.56 + (plazaRow - 1) * 0.04
      : 1;
  return {
    floor,
    wing,
    label: `${parts[2] === 'extension3' ? '延伸區三' : parts[2] === 'extension4' ? '延伸區四' : extension ? '延伸區二' : annex ? '延伸區' : ''}${plaza ? `中庭第 ${plazaRow} 排` : '店面區'}${columnLabel}`,
    left,
    top: (extension ? `${53 + (row - 1) * 11}%` : plaza ? `${60 + (plazaRow - 1) * 12}%` : '38%') as `${number}%`,
    width: (plaza ? '22%' : '26%') as `${number}%`,
    height: (extension ? '10%' : plaza ? '12%' : '22%') as `${number}%`,
    scale,
    plaza,
  };
}
