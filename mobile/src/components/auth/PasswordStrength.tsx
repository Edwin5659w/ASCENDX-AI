import { Text, View } from 'react-native';
import {
  PASSWORD_REQUIREMENTS,
  PasswordChecks,
  STRENGTH_LABELS,
} from '@/src/lib/auth.rules';
import type { AppTheme } from '@/constants/theme';
import { useAppTheme } from '@/src/context/AppThemeContext';
import { useThemedStyles } from '@/src/hooks/useThemedStyles';

const COLORS = ['#f87171', '#fb923c', '#fbbf24', '#a3e635', '#34d399'];

interface PasswordStrengthProps {
  checks: PasswordChecks;
  strength: 0 | 1 | 2 | 3 | 4;
  visible: boolean;
}

function createStyles(theme: AppTheme) {
  return {
    wrap: { marginTop: 8, marginBottom: theme.spacing.sm },
    bars: { flexDirection: 'row' as const, gap: 4, marginBottom: 8 },
    bar: { flex: 1, height: 4, borderRadius: 2 },
    strengthLabel: { color: theme.colors.textMuted, fontSize: 12, marginBottom: 6 },
    req: { color: theme.colors.textMuted, fontSize: 12, marginBottom: 2 },
    reqOk: { color: theme.colors.success },
  };
}

export function PasswordStrength({ checks, strength, visible }: PasswordStrengthProps) {
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);

  if (!visible) return null;

  return (
    <View style={styles.wrap}>
      <View style={styles.bars}>
        {[0, 1, 2, 3, 4].map((i) => (
          <View
            key={i}
            style={[
              styles.bar,
              { backgroundColor: i <= strength ? COLORS[strength] : theme.colors.surface },
            ]}
          />
        ))}
      </View>
      <Text style={styles.strengthLabel}>Seguridad: {STRENGTH_LABELS[strength]}</Text>
      {PASSWORD_REQUIREMENTS.map(({ key, label }) => (
        <Text key={key} style={[styles.req, checks[key] && styles.reqOk]}>
          {checks[key] ? '✓' : '○'} {label}
        </Text>
      ))}
    </View>
  );
}
