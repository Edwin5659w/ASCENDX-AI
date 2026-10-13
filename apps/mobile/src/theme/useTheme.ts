import { useColorScheme } from 'react-native';
import { darkPalette, elevation, fonts, lightPalette, radius, spacing, typography, type ElevationLevel } from './tokens';
import { useThemePreference } from './ThemePreference';

/** Tema actual: la preferencia del usuario (Perfil → Apariencia) o, por defecto, la del sistema. */
export function useTheme() {
  const scheme = useColorScheme();
  const { preference } = useThemePreference();
  const isDark = preference === 'system' ? scheme !== 'light' : preference === 'dark';
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
