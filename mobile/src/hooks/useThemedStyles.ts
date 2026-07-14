import { useMemo } from 'react';
import { StyleSheet, type ImageStyle, type TextStyle, type ViewStyle } from 'react-native';
import type { AppTheme } from '@/constants/theme';
import { useAppTheme } from '@/src/context/AppThemeContext';

type NamedStyles<T> = { [P in keyof T]: ViewStyle | TextStyle | ImageStyle };

/**
 * Estilos que se regeneran al cambiar dark/light.
 * Pasa un factory estable (función definida fuera del render o useCallback).
 */
export function useThemedStyles<T extends NamedStyles<T>>(factory: (theme: AppTheme) => T): T {
  const { theme, mode } = useAppTheme();
  return useMemo(() => StyleSheet.create(factory(theme)), [theme, mode, factory]);
}

export type { AppTheme };
