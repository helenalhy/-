import { Platform, useColorScheme } from 'react-native';
import colors from '@/constants/colors';

/**
 * Returns design tokens for the current app appearance.
 *
 * The returned object contains all color tokens for the active palette
 * plus scheme-independent values like `radius`.
 *
 * Web always uses the preview's light candy palette for consistent
 * appearance across mobile browsers. Native apps follow the device setting.
 */
export function useColors() {
  const systemScheme = useColorScheme();
  const scheme = Platform.OS === 'web' ? 'light' : systemScheme;
  const palette = scheme === 'dark' ? colors.dark : colors.light;
  return { ...palette, radius: colors.radius };
}
