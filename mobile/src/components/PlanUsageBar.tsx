import { Pressable, Text, View } from 'react-native';
import type { AppTheme } from '@/constants/theme';
import { useThemedStyles } from '@/src/hooks/useThemedStyles';
import type { PlanUsage } from '@/src/types/api';

interface PlanUsageBarProps {
  usage: PlanUsage | null | undefined;
  metric: 'goals' | 'habits' | 'ai';
  onUpgrade?: () => void;
}

function createStyles(theme: AppTheme) {
  return {
    wrap: {
      marginBottom: 16,
      padding: 14,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.card,
    },
    row: { flexDirection: 'row' as const, justifyContent: 'space-between' as const, marginBottom: 8 },
    label: { color: theme.colors.textMuted, fontSize: 12 },
    countRow: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 8 },
    count: { color: theme.colors.text, fontSize: 12, fontWeight: '600' as const },
    countWarn: { color: theme.colors.warning },
    proLink: { color: theme.colors.primaryLight, fontSize: 12, fontWeight: '600' as const },
    track: {
      height: 6,
      backgroundColor: theme.colors.background,
      borderRadius: 99,
      overflow: 'hidden' as const,
    },
    fill: { height: '100%' as const, borderRadius: 99 },
    fillOk: { backgroundColor: theme.colors.accent },
    fillNear: { backgroundColor: theme.colors.primaryLight },
    fillWarn: { backgroundColor: theme.colors.warning },
  };
}

export function PlanUsageBar({ usage, metric, onUpgrade }: PlanUsageBarProps) {
  const styles = useThemedStyles(createStyles);

  if (!usage) return null;

  const { plan, limits, usage: u } = usage;
  let used = 0;
  let limit = 0;
  let label = '';

  if (metric === 'goals') {
    used = u.goals;
    limit = limits.maxGoals;
    label = 'Objetivos';
  } else if (metric === 'habits') {
    used = u.habits;
    limit = limits.maxHabits;
    label = 'Hábitos';
  } else {
    used = u.aiChatToday;
    limit = limits.aiChatPerDay;
    label = 'Mensajes IA hoy';
  }

  const pct = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;
  const atLimit = used >= limit;
  const nearLimit = pct >= 80;

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <Text style={styles.label}>{label}</Text>
        <View style={styles.countRow}>
          <Text style={[styles.count, atLimit && styles.countWarn]}>
            {used}/{limit}
          </Text>
          {plan === 'FREE' && nearLimit && onUpgrade ? (
            <Pressable onPress={onUpgrade}>
              <Text style={styles.proLink}>Pro →</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
      <View style={styles.track}>
        <View
          style={[
            styles.fill,
            { width: `${pct}%` },
            atLimit ? styles.fillWarn : nearLimit ? styles.fillNear : styles.fillOk,
          ]}
        />
      </View>
    </View>
  );
}
