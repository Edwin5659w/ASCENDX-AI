import { useColorScheme } from 'react-native';
import { darkPalette, elevation, fonts, lightPalette, radius, spacing, typography, type ElevationLevel } from './tokens';

/** Tema actual según el modo claro/oscuro del sistema. */
export function useTheme() {
  const scheme = useColorScheme();
  const isDark = scheme !== 'light';
  const colors = isDark ? darkPalette : lightPalette;
  return {
    isDark,
    colors,
    /** Sombra discreta con el color de sombra del tema */
    elevate: (level: ElevationLevel) => ({ ...elevation[level], shadowColor: colors.shadow }),
    spacing,
    radius,
    typography,
    fonts,
  };
}

export type Theme = ReturnType<typeof useTheme>;
