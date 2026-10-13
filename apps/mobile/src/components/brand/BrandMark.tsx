import { Image, View } from 'react-native';
import { useTheme } from '@/theme/useTheme';
import { LOGO_ASPECT, LogoSymbol } from './LogoSymbol';

/**
 * Marca de ASCENDX AI basada en el logo oficial del autor.
 *
 * - BrandMark: solo el símbolo (encabezados, íconos pequeños).
 * - Wordmark: el nombre «ASCENDX AI» tal como aparece en el logo, extraído
 *   del original con fondo transparente; versión clara y oscura.
 * - BrandLockup: símbolo + nombre, para la bienvenida y pantallas de marca.
 */

const WORDMARK = {
  dark: require('../../../assets/brand/wordmark-dark.png'),
  light: require('../../../assets/brand/wordmark-light.png'),
};
/** Proporción del nombre extraído (872 × 174 px). */
export const WORDMARK_ASPECT = 872 / 174;

/** Símbolo del logo. `size` es el alto en puntos. */
export function BrandMark({ size = 44 }: { size?: number }) {
  return <LogoSymbol width={size * LOGO_ASPECT} accessibilityLabel="ASCENDX AI" />;
}

/** Nombre «ASCENDX AI» del logo. `width` en puntos. */
export function Wordmark({ width = 200, forceDark = false }: { width?: number; forceDark?: boolean }) {
  const { isDark } = useTheme();
  return (
    <Image
      source={isDark || forceDark ? WORDMARK.dark : WORDMARK.light}
      style={{ width, height: width / WORDMARK_ASPECT }}
      resizeMode="contain"
      accessibilityRole="image"
      accessibilityLabel="ASCENDX AI"
    />
  );
}

/** Símbolo + nombre en horizontal. `size` es el alto del símbolo. */
export function BrandLockup({ size = 36 }: { size?: number }) {
  const { spacing } = useTheme();
  return (
    <View
      style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}
      accessible
      accessibilityRole="header"
      accessibilityLabel="ASCENDX AI"
    >
      <LogoSymbol width={size * LOGO_ASPECT} />
      <Wordmark width={size * 3.6} />
    </View>
  );
}
