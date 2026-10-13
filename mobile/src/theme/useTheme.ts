import { useColorScheme } from 'react-native';
import { darkPalette, lightPalette, radius, spacing, typography } from './tokens';

/** Tema actual según el modo claro/oscuro del sistema. */
export function useTheme() {
  const scheme = useColorScheme();
  const isDark = scheme !== 'light';
  return {
    isDark,
    colors: isDark ? darkPalette : lightPalette,
    spacing,
    radius,
    typography,
  };
}

export type Theme = ReturnType<typeof useTheme>;
