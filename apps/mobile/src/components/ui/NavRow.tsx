import { View } from 'react-native';
import { PressableScale } from '@/components/motion';
import { useTheme } from '@/theme/useTheme';
import { AppText } from './AppText';
import { Icon, type IconName } from './Icon';

interface NavRowProps {
  icon: IconName;
  title: string;
  subtitle?: string;
  onPress: () => void;
  tone?: 'default' | 'danger';
  /** Etiqueta pequeña a la derecha, p. ej. «Pronto» */
  badge?: string;
}

/** Fila tocable de menú: ícono, texto y flecha. Área táctil ≥ 48 dp (RNF-08). */
export function NavRow({ icon, title, subtitle, onPress, tone = 'default', badge }: NavRowProps) {
  const { colors, radius, spacing } = useTheme();
  const danger = tone === 'danger';
  return (
    <PressableScale
      scaleTo={0.98}
      accessibilityRole="button"
      accessibilityLabel={subtitle ? `${title}. ${subtitle}` : title}
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        minHeight: 56,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.sm,
        marginHorizontal: -spacing.sm,
        borderRadius: radius.md,
        backgroundColor: pressed ? colors.surfaceAlt : 'transparent',
      })}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: radius.md,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: danger ? colors.dangerSoft : colors.primarySoft,
        }}
      >
        <Icon name={icon} size={20} color={danger ? 'danger' : 'primary'} />
      </View>
      <View style={{ flex: 1 }}>
        <AppText variant="bodyStrong" color={danger ? 'danger' : 'text'}>
          {title}
        </AppText>
        {subtitle ? (
          <AppText variant="caption" color="textMuted">
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {badge ? (
        <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.pill, backgroundColor: colors.surfaceAlt }}>
          <AppText variant="caption" color="textMuted">
            {badge}
          </AppText>
        </View>
      ) : null}
      <Icon name="chevronRight" size={20} color="textSubtle" />
    </PressableScale>
  );
}
