import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import {
  buildFirstSteps,
  firstStepsProgress,
  isFirstStepsComplete,
  nextLockedBadgeHint,
} from '../../../shared/first-steps';
import type { UserStats } from '@/src/types/api';
import { Card } from '@/src/components/ui/Card';
import { theme } from '@/constants/theme';

interface FirstStepsCardProps {
  stats: UserStats | null;
}

export function FirstStepsCard({ stats }: FirstStepsCardProps) {
  const router = useRouter();
  if (!stats) return null;

  const steps = buildFirstSteps({
    totalGoals: stats.totalGoals,
    totalTasks: stats.totalTasks,
    completedTasks: stats.completedTasks,
    activeHabits: stats.activeHabits,
    habitsCompletedToday: stats.habitsCompletedToday ?? 0,
    financeRecordsCount: stats.financeRecordsCount ?? 0,
  });

  if (isFirstStepsComplete(steps)) return null;

  const { done, total, percent } = firstStepsProgress(steps);
  const nextBadge = nextLockedBadgeHint(stats.badges);
  const nextStep = steps.find((s) => !s.done);

  return (
    <Card style={styles.card}>
      <Text style={styles.title}>Configura ASCENDX</Text>
      <Text style={styles.subtitle}>
        {done}/{total} pasos · {percent}% listo
      </Text>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${percent}%` }]} />
      </View>
      {steps.map((step) => (
        <Pressable
          key={step.id}
          style={[styles.row, step.done && styles.rowDone]}
          onPress={() => !step.done && router.push(step.mobilePath as never)}
          disabled={step.done}>
          <FontAwesome
            name={step.done ? 'check-circle' : 'circle-o'}
            size={20}
            color={step.done ? theme.colors.success : theme.colors.textMuted}
          />
          <View style={styles.rowText}>
            <Text style={[styles.rowLabel, step.done && styles.rowLabelDone]}>{step.label}</Text>
            <Text style={styles.rowHint}>{step.hint}</Text>
          </View>
        </Pressable>
      ))}
      {nextBadge ? <Text style={styles.badgeHint}>🏅 Próximo logro: {nextBadge}</Text> : null}
      {nextStep ? (
        <Pressable style={styles.cta} onPress={() => router.push(nextStep.mobilePath as never)}>
          <Text style={styles.ctaText}>Continuar: {nextStep.label} →</Text>
        </Pressable>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderColor: 'rgba(34, 211, 238, 0.35)',
    borderWidth: 1,
  },
  title: { color: theme.colors.text, fontSize: 17, fontWeight: '700', marginBottom: 4 },
  subtitle: { color: theme.colors.textMuted, fontSize: 13, marginBottom: 12 },
  track: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 14,
  },
  fill: { height: '100%', backgroundColor: theme.colors.accent, borderRadius: 3 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  rowDone: { opacity: 0.65 },
  rowText: { flex: 1 },
  rowLabel: { color: theme.colors.text, fontSize: 14, fontWeight: '500' },
  rowLabelDone: { textDecorationLine: 'line-through', color: theme.colors.textMuted },
  rowHint: { color: theme.colors.textMuted, fontSize: 11, marginTop: 2 },
  badgeHint: {
    color: theme.colors.warning,
    fontSize: 12,
    marginTop: 12,
    lineHeight: 18,
  },
  cta: { marginTop: 12, alignItems: 'center' },
  ctaText: { color: theme.colors.accent, fontSize: 14, fontWeight: '600' },
});
