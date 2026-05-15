import { useCallback, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/src/context/AuthContext';
import { userApi, aiApi } from '@/src/api/services';
import { StatCard } from '@/src/components/StatCard';
import { Card } from '@/src/components/ui/Card';
import type { UserStats } from '@/src/types/api';
import { theme } from '@/constants/theme';

export default function DashboardScreen() {
  const { user } = useAuth();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [dailyPlan, setDailyPlan] = useState('');
  const [warning, setWarning] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [s, plan] = await Promise.all([userApi.stats(), aiApi.dailyPlan()]);
      setStats(s);
      setDailyPlan(plan.plan);
      setWarning(plan.procrastinationWarning);
    } catch {
      /* silencioso en dashboard */
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />}>
      <LinearGradient colors={['#1a1033', '#0a0a0f']} style={styles.header}>
        <Text style={styles.greeting}>Hola, {user?.name?.split(' ')[0] ?? 'viajero'}</Text>
        <View style={styles.levelRow}>
          <Text style={styles.level}>Nivel {user?.level ?? 1}</Text>
          <Text style={styles.xp}>{user?.xp ?? 0} XP</Text>
        </View>
      </LinearGradient>

      <View style={styles.statsGrid}>
        <StatCard label="Objetivos" value={stats?.totalGoals ?? 0} icon="bullseye" />
        <StatCard label="Tareas hechas" value={`${stats?.completedTasks ?? 0}/${stats?.totalTasks ?? 0}`} icon="check" color={theme.colors.success} />
        <StatCard label="Hábitos" value={stats?.activeHabits ?? 0} icon="fire" color={theme.colors.warning} />
        <StatCard label="Racha máxima" value={stats?.longestStreak ?? 0} icon="bolt" color={theme.colors.primaryLight} />
        <StatCard label="Balance $" value={stats?.financeBalance ?? 0} icon="money" color={theme.colors.accent} />
      </View>

      {warning ? (
        <Card style={styles.warningCard}>
          <Text style={styles.warningTitle}>⚠️ Alerta de procrastinación</Text>
          <Text style={styles.warningText}>{warning}</Text>
        </Card>
      ) : null}

      <Text style={styles.sectionTitle}>Plan del día — IA</Text>
      <Card>
        <Text style={styles.planText}>{dailyPlan || 'Cargando tu plan personalizado...'}</Text>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { paddingBottom: 32 },
  header: {
    padding: theme.spacing.lg,
    paddingTop: 8,
    marginBottom: theme.spacing.md,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.text,
  },
  levelRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
  },
  level: {
    color: theme.colors.primaryLight,
    fontWeight: '600',
  },
  xp: {
    color: theme.colors.textMuted,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingHorizontal: theme.spacing.md,
  },
  warningCard: {
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderColor: theme.colors.warning,
    borderWidth: 1,
  },
  warningTitle: {
    color: theme.colors.warning,
    fontWeight: '600',
    marginBottom: 4,
  },
  warningText: {
    color: theme.colors.text,
    fontSize: 14,
    lineHeight: 20,
  },
  sectionTitle: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: '600',
    marginHorizontal: theme.spacing.md,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  planText: {
    color: theme.colors.text,
    lineHeight: 22,
    fontSize: 15,
  },
});
