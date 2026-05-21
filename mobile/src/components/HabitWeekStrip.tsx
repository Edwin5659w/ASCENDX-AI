import { StyleSheet, Text, View } from 'react-native';
import { theme } from '@/constants/theme';

const DAY_LABELS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

type Props = {
  weekHistory?: boolean[];
  weekCompletionRate?: number;
};

export function HabitWeekStrip({ weekHistory, weekCompletionRate }: Props) {
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

const styles = StyleSheet.create({
  wrap: { marginTop: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 4 },
  cell: { alignItems: 'center', flex: 1 },
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
});
