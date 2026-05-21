import { useCallback, useMemo, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/src/context/AuthContext';
import { userApi, aiApi } from '@/src/api/services';
import { StatCard } from '@/src/components/StatCard';
import { FirstStepsCard } from '@/src/components/FirstStepsCard';
import { GamificationPanel } from '@/src/components/GamificationPanel';
import { BarChartCard } from '@/src/components/charts/BarChartCard';
import { Card } from '@/src/components/ui/Card';
import type { UserStats } from '@/src/types/api';
import { theme } from '@/constants/theme';

export default function DashboardScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [dailyPlan, setDailyPlan] = useState('');
  const [warning, setWarning] = useState<string | null>(null);
  const [aiPrompts, setAiPrompts] = useState<string[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [s, plan] = await Promise.all([userApi.stats(), aiApi.dailyPlan()]);
      setStats(s);
      setDailyPlan(plan.plan);
      setWarning(plan.procrastinationWarning);
      setAiPrompts(plan.suggestedPrompts ?? []);
      setLoadError(null);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : 'No se pudo cargar el dashboard');
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

  const chartData = useMemo(
    () => [
      { name: 'Objetivos', value: stats?.totalGoals ?? 0, color: '#8b5cf6' },
      { name: 'Tareas OK', value: stats?.completedTasks ?? 0, color: '#34d399' },
      { name: 'Hábitos', value: stats?.activeHabits ?? 0, color: '#fbbf24' },
      { name: 'Racha', value: stats?.longestStreak ?? 0, color: '#22d3ee' },
    ],
    [stats],
  );

  const planDisplay = dailyPlan || 'Cargando tu plan personalizado...';

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
      }>
      <LinearGradient colors={['#1a1033', '#0a0a0f']} style={styles.header}>
        <Text style={styles.greeting}>Hola, {user?.name?.split(' ')[0] ?? 'viajero'} 👋</Text>
        <Text style={styles.tagline}>Sigue sumando XP con tareas y hábitos</Text>
      </LinearGradient>

      {loadError ? (
        <Card style={styles.errorCard}>
          <Text style={styles.errorText}>{loadError}</Text>
          <Pressable onPress={() => load()}>
            <Text style={styles.retryText}>Reintentar</Text>
          </Pressable>
        </Card>
      ) : null}

      <FirstStepsCard stats={stats} />
      <GamificationPanel user={user} stats={stats} />

      {warning ? (
        <Card style={styles.warningCard}>
          <Text style={styles.warningTitle}>⚠️ Alerta de procrastinación</Text>
          <Text style={styles.warningText}>{warning}</Text>
        </Card>
      ) : null}

      <View style={styles.statsGrid}>
        <StatCard label="Objetivos" value={stats?.totalGoals ?? 0} icon="bullseye" />
        <StatCard
          label="Tareas"
          value={`${stats?.completedTasks ?? 0}/${stats?.totalTasks ?? 0}`}
          icon="check"
          color={theme.colors.success}
        />
        <StatCard label="Racha" value={stats?.longestStreak ?? 0} icon="bolt" color={theme.colors.warning} />
        <StatCard
          label="Balance"
          value={`$${stats?.financeBalance ?? 0}`}
          icon="money"
          color={theme.colors.accent}
        />
      </View>

      <BarChartCard title="Progreso general" data={chartData} />

      <Text style={styles.sectionTitle}>Plan del día — IA</Text>
      <Card style={styles.planCard}>
        <Text style={styles.planText}>{planDisplay}</Text>
        {aiPrompts.length > 0 ? (
          <View style={styles.promptRow}>
            {aiPrompts.slice(0, 2).map((p) => (
              <Pressable
                key={p}
                style={styles.promptChip}
                onPress={() => router.push({ pathname: '/(tabs)/chat', params: { prefill: p } })}>
                <Text style={styles.promptChipText} numberOfLines={2}>
                  {p}
                </Text>
              </Pressable>
            ))}
          </View>
        ) : null}
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
    fontSize: 26,
    fontWeight: '700',
    color: theme.colors.text,
  },
  tagline: {
    color: theme.colors.textMuted,
    fontSize: 14,
    marginTop: 6,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
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
  planCard: { marginHorizontal: theme.spacing.md },
  planText: {
    color: theme.colors.text,
    lineHeight: 22,
    fontSize: 15,
  },
  promptRow: { marginTop: 14, gap: 8 },
  promptChip: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.35)',
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
  },
  promptChipText: { color: theme.colors.primaryLight, fontSize: 12 },
  errorCard: {
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderColor: theme.colors.danger,
    borderWidth: 1,
  },
  errorText: { color: theme.colors.text, fontSize: 14, marginBottom: 8 },
  retryText: { color: theme.colors.primaryLight, fontWeight: '600', fontSize: 14 },
});
