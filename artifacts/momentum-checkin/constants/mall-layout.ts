type Column = 'left' | 'center' | 'right';
type PlazaRow = 1 | 2 | 3;
type AnnexRow = 1 | 2 | 3 | 4;
export type MallWing = 'main' | 'annex';
export type MallSlotId = `floor-${number}-${Column | `plaza-${PlazaRow}-${Column}` | `annex-${AnnexRow}-${'left' | 'right'}`}`;

const COLUMNS: Column[] = ['left', 'center', 'right'];
const FLOORS = [3, 2, 1, 4, 5, 6, 7, 8, 9, 10];
export const MALL_POSITIONS_PER_FLOOR = 20;
// Keep every original ID and its ordering before appending the new plaza locations.
export const MALL_SLOT_IDS: MallSlotId[] = [
  ...FLOORS.flatMap((floor) => COLUMNS.map((column): MallSlotId => `floor-${floor}-${column}`)),
  ...FLOORS.flatMap((floor) => ([1, 2, 3] as const).flatMap((row) =>
    COLUMNS.map((column): MallSlotId => `floor-${floor}-plaza-${row}-${column}`),
  )),
  ...FLOORS.flatMap((floor) => ([1, 2, 3, 4] as const).flatMap((row) =>
    (['left', 'right'] as const).map((column): MallSlotId => `floor-${floor}-annex-${row}-${column}`),
  )),
];

export function getMallSlotPosition(slotId: MallSlotId) {
  const parts = slotId.split('-');
  const floor = `${parts[1]}F`;
  const column = parts[parts.length - 1];
  const columnLabel = column === 'left' ? '左側' : column === 'center' ? '中央' : '右側';
  const annex = parts[2] === 'annex';
  const wing: MallWing = annex ? 'annex' : 'main';
  const row = parts[2] === 'plaza' || annex ? Number(parts[3]) : 0;
  const plaza = parts[2] === 'plaza' || (annex && row > 1);
  const plazaRow = annex ? row - 1 : row;
  const left: `${number}%` = plaza
    ? column === 'left' ? '6%' : column === 'center' ? '39%' : '72%'
    : column === 'left' ? '12%' : column === 'center' ? '38%' : '64%';
  return {
    floor,
    wing,
    label: `${annex ? '延伸區' : ''}${plaza ? `中庭第 ${plazaRow} 排` : '店面區'}${columnLabel}`,
    left,
    top: (plaza ? `${61 + (plazaRow - 1) * 12}%` : '39%') as `${number}%`,
    width: (plaza ? '22%' : '24%') as `${number}%`,
    height: (plaza ? '12%' : '18%') as `${number}%`,
    scale: plaza ? 0.62 : 1,
    plaza,
  };
}
