import { useId } from 'react';
import { View } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { AppText } from '@/components/ui/AppText';
import { darkPalette } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

/**
 * Isotipo de ASCENDX AI (sección 15.1): una X cuyo trazo ascendente se
 * convierte en una flecha que sube. Representa «ascender mediante decisiones
 * inteligentes». El mismo dibujo se usa para el ícono de la app
 * (assets/brand/*.svg).
 *
 * El isotipo conserva siempre los colores de marca, en tema claro u oscuro.
 */
export function BrandMark({ size = 44, tile = true }: { size?: number; tile?: boolean }) {
  const gradientId = `asc-${useId().replace(/:/g, '')}`;
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" accessibilityLabel="ASCENDX AI">
      <Defs>
        <LinearGradient id={gradientId} x1="14" y1="50" x2="48" y2="16" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor={darkPalette.primary} />
          <Stop offset="1" stopColor={darkPalette.mint} />
        </LinearGradient>
      </Defs>
      {tile ? (
        <Rect x="0.5" y="0.5" width="63" height="63" rx="18" fill={darkPalette.surface} stroke={darkPalette.border} />
      ) : null}
      <Path
        d="M20 20 L27.5 27.5 M36.5 36.5 L44 44"
        stroke={darkPalette.text}
        strokeWidth={5.5}
        strokeLinecap="round"
        fill="none"
      />
      <Path d="M18 46 L45.5 18.5" stroke={`url(#${gradientId})`} strokeWidth={6.5} strokeLinecap="round" fill="none" />
      <Path
        d="M35 18.5 H45.5 V29"
        stroke={`url(#${gradientId})`}
        strokeWidth={6.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}

/** Logotipo completo: isotipo + nombre. El nombre tiene protagonismo (15.1). */
export function BrandLockup({ size = 36 }: { size?: number }) {
  const { fonts, spacing } = useTheme();
  return (
    <View
      style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}
      accessible
      accessibilityRole="header"
      accessibilityLabel="ASCENDX AI"
    >
      <BrandMark size={size} />
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
        <AppText style={{ fontFamily: fonts.extrabold, fontSize: size * 0.5, letterSpacing: 1.6 }}>ASCENDX</AppText>
        <AppText style={{ fontFamily: fonts.bold, fontSize: size * 0.5, letterSpacing: 1.6 }} color="mint">
          AI
        </AppText>
      </View>
    </View>
  );
}
