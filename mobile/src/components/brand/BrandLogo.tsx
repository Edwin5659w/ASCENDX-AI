import Svg, { Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { theme } from '@/constants/theme';

type BrandLogoSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

const heights: Record<BrandLogoSize, number> = {
  xs: theme.logo.sizes.xs,
  sm: theme.logo.sizes.sm,
  md: theme.logo.sizes.md,
  lg: theme.logo.sizes.lg,
  xl: theme.logo.sizes.xl,
};

interface BrandLogoProps {
  size?: BrandLogoSize;
  style?: StyleProp<ViewStyle>;
  animate?: boolean;
  breathe?: boolean;
}

function Monogram({ size }: { size: number }) {
  const h = Math.min(size, 56);
  const w = h * 0.85;
  return (
    <Svg width={w} height={h} viewBox="0 0 48 56">
      <Defs>
        <LinearGradient id="grad" x1="0%" y1="100%" x2="100%" y2="0%">
          <Stop offset="0%" stopColor="#8A2BE2" />
          <Stop offset="35%" stopColor="#C026D3" />
          <Stop offset="70%" stopColor="#00A3FF" />
          <Stop offset="100%" stopColor="#00E5FF" />
        </LinearGradient>
      </Defs>
      <Rect x="4" y="8" width="28" height="4" rx="2" fill="url(#grad)" opacity="0.9" />
      <Rect x="4" y="18" width="20" height="4" rx="2" fill="url(#grad)" opacity="0.75" />
      <Rect x="4" y="28" width="24" height="4" rx="2" fill="url(#grad)" opacity="0.85" />
      <Path d="M28 8 L40 28 L34 28 L38 44 L24 24 L30 24 L22 8 Z" fill="url(#grad)" />
    </Svg>
  );
}

export function BrandLogo({ size = 'md', style }: BrandLogoProps) {
  const h = heights[size];
  const showText = size !== 'xs';

  return (
    <View style={[styles.row, style]}>
      <Monogram size={h} />
      {showText && (
        <View>
          <Text style={[styles.title, { fontSize: Math.max(14, h * 0.22) }]}>ASCENDX</Text>
          <Text style={[styles.sub, { fontSize: Math.max(10, h * 0.12) }]}>AI</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { color: theme.colors.primaryLight, fontWeight: '800', letterSpacing: -0.5 },
  sub: { color: theme.colors.accent, fontWeight: '600' },
});
