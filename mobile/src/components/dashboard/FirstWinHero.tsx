import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { XP } from '../../../../shared/retention';
import { Card } from '@/src/components/ui/Card';
import type { UserStats } from '@/src/types/api';
import { theme } from '@/constants/theme';

interface FirstWinHeroProps {
  stats: UserStats | null;
}

export function FirstWinHero({ stats }: FirstWinHeroProps) {
  const router = useRouter();

  if (!stats || stats.completedTasks > 0 || stats.totalTasks === 0) return null;

  const pending = stats.totalTasks - stats.completedTasks;

  return (
    <Card style={styles.card}>
      <View style={styles.row}>
        <View style={styles.body}>
          <View style={styles.labelRow}>
            <FontAwesome name="bullseye" size={18} color={theme.colors.warning} />
            <Text style={styles.label}>Tu primera victoria</Text>
          </View>
          <Text style={styles.title}>Gana +{XP.TASK_COMPLETE} XP en menos de 2 minutos</Text>
          <Text style={styles.desc}>
            Tienes {pending} tarea(s) lista(s). Márcala hecha y sube de nivel.
          </Text>
        </View>
        <Pressable style={styles.btn} onPress={() => router.push('/(tabs)/tasks' as never)}>
          <FontAwesome name="bolt" size={16} color="#000" />
          <Text style={styles.btnText}>Ir a tareas</Text>
        </Pressable>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderColor: 'rgba(245, 158, 11, 0.4)',
    borderWidth: 1,
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
  },
  row: { gap: 14 },
  body: { flex: 1 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  label: {
    color: theme.colors.warning,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  title: { color: theme.colors.text, fontSize: 17, fontWeight: '700', marginBottom: 4 },
  desc: { color: theme.colors.textMuted, fontSize: 13, lineHeight: 19 },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: theme.colors.warning,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  btnText: { color: '#000', fontSize: 14, fontWeight: '700' },
});
