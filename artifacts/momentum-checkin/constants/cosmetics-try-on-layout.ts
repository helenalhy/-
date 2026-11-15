export const COSMETICS_TRY_ON_COMPACT_BREAKPOINT = 360;

export function getCosmeticsTryOnPreviewLayout(viewportWidth: number) {
  const isCompact = viewportWidth < COSMETICS_TRY_ON_COMPACT_BREAKPOINT;

  return {
    isCompact,
    direction: isCompact ? 'column' : 'row',
    portraitSize: isCompact ? 148 : 132,
  } as const;
}
