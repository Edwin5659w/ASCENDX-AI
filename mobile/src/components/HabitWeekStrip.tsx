import { Text, View } from 'react-native';
import type { AppTheme } from '@/constants/theme';
import { useThemedStyles } from '@/src/hooks/useThemedStyles';

const DAY_LABELS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

type Props = {
  weekHistory?: boolean[];
  weekCompletionRate?: number;
};

function createStyles(theme: AppTheme) {
  return {
    wrap: { marginTop: 8 },
    row: { flexDirection: 'row' as const, justifyContent: 'space-between' as const, gap: 4 },
    cell: { alignItems: 'center' as const, flex: 1 },
    dot: {
      width: 22,
      height: 22,
      borderRadius: 6,
      backgroundColor: theme.colors.surfaceLight,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    dotDone: {
      backgroundColor: theme.colors.success,
      borderColor: theme.colors.success,
    },
    label: { color: theme.colors.textMuted, fontSize: 10, marginTop: 4 },
    rate: { color: theme.colors.textMuted, fontSize: 11, marginTop: 6 },
  };
}

export function HabitWeekStrip({ weekHistory, weekCompletionRate }: Props) {
  const styles = useThemedStyles(createStyles);
  const days = weekHistory ?? Array(7).fill(false);
  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        {days.map((done, i) => (
          <View key={i} style={styles.cell}>
            <View style={[styles.dot, done && styles.dotDone]} />
            <Text style={styles.label}>{DAY_LABELS[i]}</Text>
          </View>
        ))}
      </View>
      {weekCompletionRate != null ? (
        <Text style={styles.rate}>{weekCompletionRate}% esta semana</Text>
      ) : null}
    </View>
  );
}
