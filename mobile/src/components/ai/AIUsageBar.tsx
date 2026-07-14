import { Text, View, Pressable } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import type { AIUsage } from '../../../../shared/ai-prompts';
import type { AppTheme } from '@/constants/theme';
import { useAppTheme } from '@/src/context/AppThemeContext';
import { useThemedStyles } from '@/src/hooks/useThemedStyles';

interface AIUsageBarProps {
  usage: AIUsage | null;
  compact?: boolean;
  onUpgrade?: () => void;
}

function createStyles(theme: AppTheme) {
  return {
    wrap: {
      marginHorizontal: theme.spacing.md,
      marginBottom: theme.spacing.sm,
      padding: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: 'rgba(139, 92, 246, 0.25)',
      backgroundColor: 'rgba(139, 92, 246, 0.08)',
    },
    wrapCompact: { paddingVertical: 8, paddingHorizontal: 10 },
    wrapLimit: { borderColor: 'rgba(239, 68, 68, 0.4)', backgroundColor: 'rgba(239, 68, 68, 0.08)' },
    wrapWarn: { borderColor: 'rgba(245, 158, 11, 0.35)', backgroundColor: 'rgba(245, 158, 11, 0.06)' },
    row: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      marginBottom: 8,
    },
    left: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 8 },
    label: { color: theme.colors.text, fontSize: 13, fontWeight: '600' as const },
    labelCompact: { fontSize: 12 },
    labelLimit: { color: theme.colors.danger },
    upgradeBtn: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 4 },
    upgradeText: { color: theme.colors.primaryLight, fontSize: 12, fontWeight: '700' as const },
    track: {
      height: 6,
      backgroundColor: theme.colors.border,
      borderRadius: 3,
      overflow: 'hidden' as const,
    },
    fill: { height: '100%' as const, borderRadius: 3 },
  };
}

export function AIUsageBar({ usage, compact = false, onUpgrade }: AIUsageBarProps) {
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);

  if (!usage) return null;

  const pct = usage.limit > 0 ? Math.round((usage.used / usage.limit) * 100) : 0;
  const atLimit = usage.remaining <= 0;
  const warning = pct >= 60 && !atLimit;
  const barColor = atLimit ? theme.colors.danger : warning ? theme.colors.warning : theme.colors.primary;

  return (
    <View
      style={[
        styles.wrap,
        compact && styles.wrapCompact,
        atLimit && styles.wrapLimit,
        warning && !atLimit && styles.wrapWarn,
      ]}>
      <View style={styles.row}>
        <View style={styles.left}>
          <FontAwesome
            name="magic"
            size={compact ? 12 : 14}
            color={atLimit ? theme.colors.danger : theme.colors.primaryLight}
          />
          <Text style={[styles.label, compact && styles.labelCompact, atLimit && styles.labelLimit]}>
            Mentor IA · {usage.used}/{usage.limit}
          </Text>
        </View>
        {usage.plan === 'FREE' && (warning || atLimit) && onUpgrade ? (
          <Pressable onPress={onUpgrade} style={styles.upgradeBtn}>
            <FontAwesome name="star" size={11} color={theme.colors.primaryLight} />
            <Text style={styles.upgradeText}>Pro</Text>
          </Pressable>
        ) : null}
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${Math.min(pct, 100)}%`, backgroundColor: barColor }]} />
      </View>
    </View>
  );
}
