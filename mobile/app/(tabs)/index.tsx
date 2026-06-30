import { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useAuth } from '@/src/context/AuthContext';
import { userApi, aiApi, billingApi, type AIContextLevel } from '@/src/api/services';
import { StatCard } from '@/src/components/StatCard';
import { FirstStepsCard } from '@/src/components/FirstStepsCard';
import { GamificationPanel } from '@/src/components/GamificationPanel';
import { DashboardQuickActions } from '@/src/components/DashboardQuickActions';
import { DailyFocus } from '@/src/components/dashboard/DailyFocus';
import { WeeklyRecap } from '@/src/components/dashboard/WeeklyRecap';
import { UpgradeBanner } from '@/src/components/dashboard/UpgradeBanner';
import { AIMentorCard } from '@/src/components/dashboard/AIMentorCard';
import { ProductTour } from '@/src/components/tour/ProductTour';
import { FirstWinHero } from '@/src/components/dashboard/FirstWinHero';
import { AscensoScoreCard } from '@/src/components/dashboard/AscensoScoreCard';
import { MorningRitualModal } from '@/src/components/dashboard/MorningRitualModal';
import { PomodoroTimer } from '@/src/components/dashboard/PomodoroTimer';
import { QuickSearchModal } from '@/src/components/QuickSearchModal';
import { consumePendingDailyBonus } from '@/src/lib/pending-daily-bonus';
import { consumePendingProCheckout } from '@/src/lib/pending-pro-checkout';
import { useToast } from '@/src/context/ToastContext';
import { BarChartCard } from '@/src/components/charts/BarChartCard';
import { Card } from '@/src/components/ui/Card';
import type { UserStats } from '@/src/types/api';
import { theme } from '@/constants/theme';
import { computeSetupScore, getTimeGreeting } from '../../../shared/dashboard-helpers';
import { RETENTION_MESSAGES } from '../../../shared/retention';
import { useMoneyFormat } from '@/src/hooks/useMoneyFormat';
import { CONTEXT_LEVEL_LABELS } from '../../../shared/chat-helpers';

export default function DashboardScreen() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();
  const { formatMoney } = useMoneyFormat();
  const { showToast } = useToast();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [tourOpen, setTourOpen] = useState(false);
  const [dailyPlan, setDailyPlan] = useState('');
  const [warning, setWarning] = useState<string | null>(null);
  const [aiPrompts, setAiPrompts] = useState<string[]>([]);
  const [contextLevel, setContextLevel] = useState<AIContextLevel>('empty');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [ritualOpen, setRitualOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const prevBadgesRef = useRef<Set<string>>(new Set());
  const dailyBonusShownRef = useRef(false);
  const proCheckoutRanRef = useRef(false);

  const load = useCallback(async () => {
    try {
      const [s, plan] = await Promise.all([userApi.stats(), aiApi.dailyPlan()]);
      setStats(s);
      setDailyPlan(plan.plan);
      setWarning(plan.procrastinationWarning);
      setAiPrompts(plan.suggestedPrompts ?? []);
      setContextLevel(plan.contextLevel);
      setLoadError(null);

      if (s.firstStepsBonus) {
        showToast(s.firstStepsBonus.message, 'success');
      }

      const unlocked = new Set(s.badges.filter((b) => b.unlocked).map((b) => b.slug));
      for (const slug of unlocked) {
        if (!prevBadgesRef.current.has(slug)) {
          const badge = s.badges.find((b) => b.slug === slug);
          if (badge && prevBadgesRef.current.size > 0) {
            showToast(`🏆 Logro: ${badge.title}`, 'success');
          }
        }
      }
      prevBadgesRef.current = unlocked;
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : 'No se pudo cargar el dashboard');
    }
  }, [showToast]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      if (user?.onboardingDone && user.productTourDone === false) {
        setTourOpen(true);
      }
      if (!proCheckoutRanRef.current) {
        proCheckoutRanRef.current = true;
        void consumePendingProCheckout().then(async (pending) => {
          if (!pending) return;
          try {
            const status = await billingApi.status();
            if (status.billingConfigured && status.plan !== 'PRO') {
              const { url } = await billingApi.checkout();
              const { default: WebBrowser } = await import('expo-web-browser');
              await WebBrowser.openBrowserAsync(url);
            }
          } catch {
            /* ignore */
          }
        });
      }
      if (!dailyBonusShownRef.current) {
        dailyBonusShownRef.current = true;
        const pending = consumePendingDailyBonus();
        if (pending?.xpGained) {
          showToast(pending.message ?? RETENTION_MESSAGES.dailyBonus(pending.xpGained), 'success');
        } else {
          void refreshUser().then((bonus) => {
            if (bonus?.xpGained) {
              showToast(bonus.message ?? RETENTION_MESSAGES.dailyBonus(bonus.xpGained), 'success');
            }
          });
        }
      }
      load().finally(() => setLoading(false));
    }, [load, refreshUser, showToast, user?.onboardingDone, user?.productTourDone]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const setupScore = useMemo(
    () =>
      stats
        ? computeSetupScore({
            totalGoals: stats.totalGoals,
            totalTasks: stats.totalTasks,
            completedTasks: stats.completedTasks,
            activeHabits: stats.activeHabits,
            habitsCompletedToday: stats.habitsCompletedToday ?? 0,
            financeRecordsCount: stats.financeRecordsCount ?? 0,
          })
        : 0,
    [stats],
  );

  const chartData = useMemo(
    () => [
      { name: 'Objetivos', value: stats?.totalGoals ?? 0, color: '#8b5cf6' },
      { name: 'Tareas OK', value: stats?.completedTasks ?? 0, color: '#34d399' },
      { name: 'Hábitos', value: stats?.activeHabits ?? 0, color: '#fbbf24' },
      { name: 'Racha', value: stats?.longestStreak ?? 0, color: '#22d3ee' },
    ],
    [stats],
  );

  const pendingTasks = (stats?.totalTasks ?? 0) - (stats?.completedTasks ?? 0);
  const balancePositive = (stats?.financeBalance ?? 0) >= 0;
  const ctxLabel = CONTEXT_LEVEL_LABELS[contextLevel]?.label ?? contextLevel;

  if (loading && !stats) {
    return (
      <View style={styles.boot}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.bootText}>Cargando tu espacio...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
      }>
      <ProductTour
        visible={tourOpen}
        userName={user?.name}
        onClose={() => {
          setTourOpen(false);
          void refreshUser();
        }}
      />

      <LinearGradient colors={['#1a1033', '#0a0a0f']} style={styles.header}>
        <View style={styles.headerTop}>
          <View style={{ flex: 1 }}>
            <Text style={styles.greeting}>{getTimeGreeting(user?.name)} 👋</Text>
            <Text style={styles.tagline}>
              Nivel {user?.level ?? 1} · {user?.xp ?? 0} XP
            </Text>
          </View>
          <Pressable style={styles.searchBtn} onPress={() => setSearchOpen(true)} accessibilityLabel="Buscar">
            <FontAwesome name="search" size={18} color={theme.colors.accent} />
          </Pressable>
        </View>
        <View style={styles.badgeRow}>
          <View style={styles.iaBadge}>
            <Text style={styles.iaBadgeText}>IA: {ctxLabel}</Text>
          </View>
        </View>
      </LinearGradient>

      {loadError ? (
        <Card style={styles.errorCard}>
          <Text style={styles.errorText}>{loadError}</Text>
          <Pressable onPress={() => load()}>
            <Text style={styles.retryText}>Reintentar</Text>
          </Pressable>
        </Card>
      ) : null}

      {setupScore < 100 && stats ? (
        <Card style={styles.setupCard}>
          <View style={styles.setupHeader}>
            <Text style={styles.setupLabel}>Configuración del espacio</Text>
            <Text style={styles.setupPct}>{setupScore}%</Text>
          </View>
          <View style={styles.setupTrack}>
            <View style={[styles.setupFill, { width: `${setupScore}%` }]} />
          </View>
        </Card>
      ) : null}

      <UpgradeBanner planUsage={stats?.planUsage} />
      {user?.proTrialEndsAt && new Date(user.proTrialEndsAt) > new Date() ? (
        <Card style={styles.trialBanner}>
          <Text style={styles.trialText}>
            Pro de prueba activo hasta{' '}
            {new Date(user.proTrialEndsAt).toLocaleDateString('es', { day: 'numeric', month: 'long' })}
          </Text>
        </Card>
      ) : null}
      {stats?.ascendScore != null ? (
        <AscensoScoreCard score={stats.ascendScore} label={stats.ascendLabel ?? ''} tips={stats.ascendTips} />
      ) : null}
      {!stats?.morningRitualDone ? (
        <Pressable style={styles.ritualBtn} onPress={() => setRitualOpen(true)}>
          <FontAwesome name="sun-o" size={16} color="#fcd34d" />
          <Text style={styles.ritualBtnText}>Empezar ritual matutino (2 min)</Text>
        </Pressable>
      ) : null}
      <MorningRitualModal
        visible={ritualOpen}
        onClose={() => {
          setRitualOpen(false);
          void load();
        }}
      />
      <QuickSearchModal visible={searchOpen} onClose={() => setSearchOpen(false)} />
      <PomodoroTimer />
      <AIMentorCard
        contextLevel={contextLevel}
        suggestedPrompts={aiPrompts}
        aiUsed={stats?.planUsage?.usage.aiChatToday}
        aiLimit={stats?.planUsage?.limits.aiChatPerDay}
      />
      <FirstWinHero stats={stats} />
      <DailyFocus />
      {(stats?.completedTasks ?? 0) > 0 || user?.plan === 'PRO' ? <WeeklyRecap /> : null}
      <FirstStepsCard stats={stats} />
      <GamificationPanel user={user} stats={stats} compact />
      <DashboardQuickActions />

      {warning ? (
        <Card style={styles.warningCard}>
          <Text style={styles.warningTitle}>⚠️ Alerta de procrastinación</Text>
          <Text style={styles.warningText}>{warning}</Text>
          <Pressable onPress={() => router.push('/(tabs)/tasks' as never)}>
            <Text style={styles.warningLink}>Ir a tareas →</Text>
          </Pressable>
        </Card>
      ) : null}

      <View style={styles.statsGrid}>
        <Pressable style={styles.statPress} onPress={() => router.push('/(tabs)/goals' as never)}>
          <StatCard label="Objetivos" value={stats?.totalGoals ?? 0} icon="bullseye" />
        </Pressable>
        <Pressable style={styles.statPress} onPress={() => router.push('/(tabs)/tasks' as never)}>
          <StatCard
            label="Tareas"
            value={`${stats?.completedTasks ?? 0}/${stats?.totalTasks ?? 0}`}
            icon="check"
            color={theme.colors.success}
          />
        </Pressable>
        <Pressable style={styles.statPress} onPress={() => router.push('/(tabs)/habits' as never)}>
          <StatCard
            label="Hábitos hoy"
            value={`${stats?.habitsCompletedToday ?? 0}/${stats?.activeHabits ?? 0}`}
            icon="fire"
            color={theme.colors.warning}
          />
        </Pressable>
        <Pressable style={styles.statPress} onPress={() => router.push('/(tabs)/finance' as never)}>
          <StatCard
            label="Balance"
            value={formatMoney(stats?.financeBalance ?? 0)}
            icon="money"
            color={balancePositive ? theme.colors.accent : theme.colors.expense}
          />
        </Pressable>
      </View>

      {pendingTasks > 0 ? (
        <Text style={styles.hintLine}>{pendingTasks} tarea(s) pendiente(s) — prioriza hoy</Text>
      ) : null}

      <BarChartCard title="Progreso general" data={chartData} />

      <Text style={styles.sectionTitle}>Plan del día — IA</Text>
      <Card style={styles.planCard}>
        <Text style={styles.planText}>{dailyPlan || 'Cargando tu plan personalizado...'}</Text>
        {aiPrompts.length > 0 ? (
          <View style={styles.promptRow}>
            {aiPrompts.slice(0, 3).map((p) => (
              <Pressable
                key={p}
                style={styles.promptChip}
                onPress={() => router.push({ pathname: '/(tabs)/chat', params: { prefill: p } })}>
                <Text style={styles.promptChipText} numberOfLines={2}>
                  {p}
                </Text>
              </Pressable>
            ))}
            <Pressable style={styles.chatLink} onPress={() => router.push('/(tabs)/chat' as never)}>
              <Text style={styles.chatLinkText}>Abrir mentor IA →</Text>
            </Pressable>
          </View>
        ) : null}
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { paddingBottom: 32 },
  boot: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    gap: 12,
  },
  bootText: { color: theme.colors.textMuted },
  header: {
    padding: theme.spacing.lg,
    paddingTop: 8,
    marginBottom: theme.spacing.sm,
  },
  headerTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  searchBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface + '99',
  },
  greeting: { fontSize: 24, fontWeight: '700', color: theme.colors.text },
  tagline: { color: theme.colors.textMuted, fontSize: 14, marginTop: 6 },
  badgeRow: { flexDirection: 'row', marginTop: 10 },
  iaBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: theme.colors.primary + '22',
    borderWidth: 1,
    borderColor: theme.colors.primary + '44',
  },
  iaBadgeText: { color: theme.colors.primaryLight, fontSize: 11, fontWeight: '600' },
  setupCard: { marginHorizontal: theme.spacing.md, marginBottom: theme.spacing.sm },
  setupHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  setupLabel: { color: theme.colors.textMuted, fontSize: 13 },
  setupPct: { color: theme.colors.primaryLight, fontWeight: '700' },
  setupTrack: {
    height: 6,
    backgroundColor: theme.colors.surface,
    borderRadius: 3,
    overflow: 'hidden',
  },
  setupFill: { height: '100%', backgroundColor: theme.colors.primary, borderRadius: 3 },
  trialBanner: {
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderColor: theme.colors.primary + '55',
    borderWidth: 1,
    backgroundColor: theme.colors.primary + '15',
  },
  trialText: { color: theme.colors.primaryLight, fontSize: 13 },
  ritualBtn: {
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.35)',
    backgroundColor: 'rgba(251,191,36,0.1)',
  },
  ritualBtnText: { color: '#fcd34d', fontWeight: '600', fontSize: 14 },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingHorizontal: theme.spacing.md,
    marginBottom: 4,
  },
  statPress: { flex: 1, minWidth: '45%' },
  hintLine: {
    color: theme.colors.textMuted,
    fontSize: 12,
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  warningCard: {
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderColor: theme.colors.warning,
    borderWidth: 1,
  },
  warningTitle: { color: theme.colors.warning, fontWeight: '600', marginBottom: 4 },
  warningText: { color: theme.colors.text, fontSize: 14, lineHeight: 20 },
  warningLink: { color: theme.colors.warning, fontSize: 13, fontWeight: '600', marginTop: 8 },
  sectionTitle: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: '600',
    marginHorizontal: theme.spacing.md,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  planCard: { marginHorizontal: theme.spacing.md },
  planText: { color: theme.colors.text, lineHeight: 22, fontSize: 15 },
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
  chatLink: { marginTop: 4, alignItems: 'flex-start' },
  chatLinkText: { color: theme.colors.primaryLight, fontSize: 13, fontWeight: '600' },
  errorCard: {
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderColor: theme.colors.danger,
    borderWidth: 1,
  },
  errorText: { color: theme.colors.text, fontSize: 14, marginBottom: 8 },
  retryText: { color: theme.colors.primaryLight, fontWeight: '600', fontSize: 14 },
});

