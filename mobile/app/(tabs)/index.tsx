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
import { FirstStepsCard } from '@/src/components/FirstStepsCard';
import { Card } from '@/src/components/ui/Card';
import type { UserStats, AIInsight } from '@/src/types/api';
import { theme } from '@/constants/theme';

const XP_PER_LEVEL = 100;

function countUnlockedBadges(stats: UserStats | null, level: number, xp: number) {
  const checks = [
    (stats?.completedTasks ?? 0) >= 1,
    (stats?.longestStreak ?? 0) >= 7,
    (stats?.totalGoals ?? 0) >= 3,
    level >= 5,
    (stats?.activeHabits ?? 0) >= 3 && (stats?.longestStreak ?? 0) >= 3,
    (stats?.totalXp ?? xp) >= 500,
  ];
  return { unlocked: checks.filter(Boolean).length, total: checks.length };
}

export default function DashboardScreen() {
  const { user } = useAuth();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [dailyPlan, setDailyPlan] = useState('');
  const [warning, setWarning] = useState<string | null>(null);
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [s, plan, ins] = await Promise.all([
        userApi.stats(),
        aiApi.dailyPlan(),
        aiApi.insights(),
      ]);
      setStats(s);
      setDailyPlan(plan.plan);
      setWarning(plan.procrastinationWarning);
      setInsights(ins.slice(0, 5));
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

  const xp = user?.xp ?? 0;
  const level = user?.level ?? 1;
  const xpIntoLevel = xp % XP_PER_LEVEL;
  const xpToNext = xpIntoLevel === 0 && xp > 0 ? XP_PER_LEVEL : XP_PER_LEVEL - xpIntoLevel;
  const badgeCounts =
    stats?.badges && stats.badges.length > 0
      ? {
          unlocked: stats.badges.filter((b) => b.unlocked).length,
          total: stats.badges.length,
        }
      : countUnlockedBadges(stats, level, xp);
  const { unlocked, total } = badgeCounts;

  const isEmptyWorkspace =
    (stats?.totalGoals ?? 0) === 0 &&
    (stats?.totalTasks ?? 0) === 0 &&
    (stats?.activeHabits ?? 0) === 0;

  const planDisplay =
    isEmptyWorkspace && !dailyPlan.includes('objetivos activos')
      ? 'Completa los pasos de configuración para que la IA genere un plan personalizado con tus metas y hábitos.'
      : dailyPlan || 'Cargando tu plan personalizado...';

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />}>
      <LinearGradient colors={['#1a1033', '#0a0a0f']} style={styles.header}>
        <Text style={styles.greeting}>Hola, {user?.name?.split(' ')[0] ?? 'viajero'}</Text>
        <View style={styles.levelRow}>
          <Text style={styles.level}>Nivel {level}</Text>
          <Text style={styles.xp}>{xp} XP</Text>
          <Text style={styles.badgesMini}>{unlocked}/{total} logros</Text>
        </View>
        <View style={styles.xpTrack}>
          <View style={[styles.xpFill, { width: `${xpIntoLevel}%` }]} />
        </View>
        <Text style={styles.xpHint}>{xpToNext} XP hasta nivel {level + 1}</Text>
      </LinearGradient>

      <FirstStepsCard stats={stats} />

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

      {insights.length > 0 ? (
        <>
          <Text style={styles.sectionTitle}>Insights recientes</Text>
          <Card style={styles.insightsCard}>
            {insights.map((it) => (
              <View key={it.id} style={styles.insightRow}>
                <Text style={styles.insightType}>{it.type}</Text>
                <Text style={styles.insightMsg}>{it.message}</Text>
                <Text style={styles.insightDate}>
                  {new Date(it.createdAt).toLocaleDateString('es', { day: 'numeric', month: 'short' })}
                </Text>
              </View>
            ))}
          </Card>
        </>
      ) : null}

      <Text style={styles.sectionTitle}>Plan del día — IA</Text>
      <Card>
        <Text style={styles.planText}>{planDisplay}</Text>
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
    gap: 12,
    marginTop: 8,
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  badgesMini: {
    color: theme.colors.warning,
    fontSize: 13,
    fontWeight: '600',
  },
  xpTrack: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 4,
    marginTop: 12,
    overflow: 'hidden',
  },
  xpFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: theme.colors.primaryLight,
  },
  xpHint: {
    color: theme.colors.textMuted,
    fontSize: 12,
    marginTop: 6,
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
  insightsCard: { marginHorizontal: theme.spacing.md, marginBottom: theme.spacing.sm },
  insightRow: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  insightType: {
    color: theme.colors.primaryLight,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  insightMsg: { color: theme.colors.text, fontSize: 14, lineHeight: 20 },
  insightDate: { color: theme.colors.textMuted, fontSize: 11, marginTop: 6 },
});
