import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  Target,
  CheckSquare,
  Flame,
  Wallet,
  RefreshCw,
  Sparkles,
  Sunrise,
} from 'lucide-react';
import { Card } from '../components/Card';
import { DashboardSkeleton } from '../components/ui/DashboardSkeleton';
import { GamificationPanel } from '../components/GamificationPanel';
import { FirstStepsPanel } from '../components/FirstStepsPanel';
import { DashboardQuickActions } from '../components/dashboard/DashboardQuickActions';
import { DailyFocus } from '../components/dashboard/DailyFocus';
import { WeeklyRecap } from '../components/dashboard/WeeklyRecap';
import { UpgradeBanner } from '../components/dashboard/UpgradeBanner';
import { AIMentorCard } from '../components/dashboard/AIMentorCard';
import { AscensoScoreCard } from '../components/dashboard/AscensoScoreCard';
import { MorningRitualModal } from '../components/dashboard/MorningRitualModal';
import { PomodoroTimer } from '../components/dashboard/PomodoroTimer';
import { WelcomeModal, useWelcomeModal } from '../components/dashboard/WelcomeModal';
import { FirstWinHero } from '../components/dashboard/FirstWinHero';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { usePendingProCheckout } from '../hooks/usePendingProCheckout';
import { ProductTour } from '../components/tour/ProductTour';
import { ProTeaserStrip } from '../components/dashboard/ProTeaserStrip';
import { userApi, aiApi, type AIContextLevel } from '../api/services';
import type { UserStats } from '../types';
import { getTimeGreeting } from '@shared/dashboard-helpers';
import { RETENTION_MESSAGES } from '@shared/retention';
import { consumePendingDailyBonus } from '../lib/pending-daily-bonus';
import { useMoneyFormat } from '../hooks/useMoneyFormat';
import { CONTEXT_LEVEL_LABELS } from '@shared/chat-helpers';

const CONTEXT_BADGE: Record<AIContextLevel, string> = {
  empty: 'bg-zinc-500/20 text-zinc-300 border-zinc-500/30',
  partial: 'bg-amber-500/15 text-amber-200 border-amber-500/30',
  ready: 'bg-emerald-500/15 text-emerald-200 border-emerald-500/30',
};

export function Dashboard() {
  const { user, refreshUser } = useAuth();
  const { formatMoney } = useMoneyFormat();
  const { showToast } = useToast();
  const [tourOpen, setTourOpen] = useState(false);
  const tourDone = user?.productTourDone !== false;
  usePendingProCheckout(tourDone && !tourOpen);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [plan, setPlan] = useState('');
  const [warning, setWarning] = useState<string | null>(null);
  const [aiPrompts, setAiPrompts] = useState<string[]>([]);
  const [contextLevel, setContextLevel] = useState<AIContextLevel>('empty');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [ritualOpen, setRitualOpen] = useState(false);
  const { open: welcomeOpen, close: closeWelcome } = useWelcomeModal();
  const prevBadgesRef = useRef<Set<string>>(new Set());
  const dailyBonusShownRef = useRef(false);

  useEffect(() => {
    if (user?.onboardingDone && user.productTourDone === false) {
      setTourOpen(true);
    }
  }, [user?.onboardingDone, user?.productTourDone]);

  useEffect(() => {
    if (dailyBonusShownRef.current) return;
    dailyBonusShownRef.current = true;
    const pending = consumePendingDailyBonus();
    if (pending?.xpGained) {
      showToast(pending.message ?? RETENTION_MESSAGES.dailyBonus(pending.xpGained), 'success');
      return;
    }
    void refreshUser().then((bonus) => {
      if (bonus?.xpGained) {
        showToast(bonus.message ?? RETENTION_MESSAGES.dailyBonus(bonus.xpGained), 'success');
      }
    });
  }, [refreshUser, showToast]);

  const load = useCallback(async () => {
    try {
      const [s, ai] = await Promise.all([userApi.stats(), aiApi.dailyPlan()]);
      setStats(s);
      setPlan(ai.plan);
      setWarning(ai.procrastinationWarning);
      setAiPrompts(ai.suggestedPrompts ?? []);
      setContextLevel(ai.contextLevel);

      const unlocked = new Set(s.badges.filter((b) => b.unlocked).map((b) => b.slug));
      for (const slug of unlocked) {
        if (!prevBadgesRef.current.has(slug)) {
          const badge = s.badges.find((b) => b.slug === slug);
          if (badge && prevBadgesRef.current.size > 0) {
            showToast(`🏆 Logro desbloqueado: ${badge.title}`, 'success');
          }
        }
      }
      prevBadgesRef.current = unlocked;

      if (s.firstStepsBonus) {
        showToast(s.firstStepsBonus.message, 'success');
      }
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Error al cargar dashboard', 'error');
    }
  }, [showToast]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await load();
      setLoading(false);
    })();
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
    showToast('Dashboard actualizado', 'success');
  };

  const pendingTasks = (stats?.totalTasks ?? 0) - (stats?.completedTasks ?? 0);
  const balancePositive = (stats?.financeBalance ?? 0) >= 0;

  const kpis = [
    { label: 'Objetivos', value: stats?.totalGoals ?? 0, icon: Target, color: 'text-violet-400', to: '/goals' },
    {
      label: 'Tareas',
      value: `${stats?.completedTasks ?? 0}/${stats?.totalTasks ?? 0}`,
      icon: CheckSquare,
      color: 'text-emerald-400',
      to: '/tasks',
      sub: pendingTasks > 0 ? `${pendingTasks} pendientes` : 'Al día',
    },
    {
      label: 'Hábitos hoy',
      value: `${stats?.habitsCompletedToday ?? 0}/${stats?.activeHabits ?? 0}`,
      icon: Flame,
      color: 'text-amber-400',
      to: '/habits',
    },
    {
      label: 'Balance',
      value: formatMoney(stats?.financeBalance ?? 0),
      icon: Wallet,
      color: balancePositive ? 'text-cyan-400' : 'text-red-400',
      to: '/finance',
    },
  ];

  if (loading) return <DashboardSkeleton />;

  const ctxMeta = CONTEXT_LEVEL_LABELS[contextLevel];
  const greeting = getTimeGreeting(user?.name);

  return (
    <div>
      <ProductTour
        open={tourOpen}
        userName={user?.name}
        onClose={() => {
          setTourOpen(false);
          void refreshUser();
        }}
      />
      {welcomeOpen && !tourOpen ? (
        <WelcomeModal userName={user?.name} onDismiss={closeWelcome} />
      ) : null}
      <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">{greeting} 👋</h1>
          <p className="text-zinc-500 text-sm">
            Tu Life OS — nivel {user?.level ?? 1} · {user?.xp ?? 0} XP
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`text-xs px-2.5 py-1 rounded-full border font-medium ${CONTEXT_BADGE[contextLevel]}`}>
            IA: {ctxMeta?.label ?? contextLevel}
          </span>
          <button
            type="button"
            onClick={onRefresh}
            disabled={refreshing}
            className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white px-3 py-1.5 rounded-lg border border-white/10 hover:border-white/20 disabled:opacity-50">
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            Actualizar
          </button>
        </div>
      </div>

      <FirstWinHero stats={stats} />

      <UpgradeBanner planUsage={stats?.planUsage} />
      {user?.proTrialEndsAt && new Date(user.proTrialEndsAt) > new Date() ? (
        <div className="mb-4 rounded-xl border border-violet-500/30 bg-violet-500/10 px-4 py-3 text-sm text-violet-200">
          Pro de prueba activo hasta{' '}
          {new Date(user.proTrialEndsAt).toLocaleDateString('es', { day: 'numeric', month: 'long' })}
        </div>
      ) : null}
      {stats?.ascendScore != null ? (
        <div className="mb-4">
          <AscensoScoreCard score={stats.ascendScore} label={stats.ascendLabel ?? ''} tips={stats.ascendTips} />
        </div>
      ) : null}
      {!stats?.morningRitualDone ? (
        <button
          type="button"
          onClick={() => setRitualOpen(true)}
          className="mb-4 w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-200 text-sm font-medium hover:bg-amber-500/15">
          <Sunrise size={18} />
          Empezar ritual matutino (2 min)
        </button>
      ) : null}
      <MorningRitualModal open={ritualOpen} onClose={() => setRitualOpen(false)} />
      <PomodoroTimer />
      {user?.plan !== 'PRO' ? <ProTeaserStrip /> : null}
      <AIMentorCard
        contextLevel={contextLevel}
        suggestedPrompts={aiPrompts}
        aiUsed={stats?.planUsage?.usage.aiChatToday}
        aiLimit={stats?.planUsage?.limits.aiChatPerDay}
      />
      <DailyFocus />
      <FirstStepsPanel stats={stats} />
      {(stats?.completedTasks ?? 0) > 0 || user?.plan === 'PRO' ? <WeeklyRecap /> : null}
      <GamificationPanel user={user ?? null} stats={stats} compact />
      <DashboardQuickActions />

      {warning && (
        <div className="mb-6 flex gap-3 p-4 rounded-xl border border-amber-500/30 bg-amber-500/10">
          <AlertTriangle className="text-amber-400 shrink-0 mt-0.5" size={20} />
          <div className="flex-1">
            <p className="text-amber-200 font-medium text-sm">Alerta de procrastinación</p>
            <p className="text-amber-200/80 text-sm mt-1">{warning}</p>
            <Link to="/tasks" className="text-amber-300 text-xs font-medium mt-2 inline-block hover:underline">
              Ir a mis tareas →
            </Link>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {kpis.map(({ label, value, icon: Icon, color, to, sub }) => (
          <Link key={label} to={to} className="block group">
            <Card className="h-full transition-colors group-hover:border-violet-500/30">
              <Icon className={`${color} mb-2`} size={22} />
              <p className="text-2xl font-bold text-white tabular-nums">{value}</p>
              <p className="text-zinc-500 text-sm">{label}</p>
              {sub && <p className="text-zinc-600 text-xs mt-1">{sub}</p>}
            </Card>
          </Link>
        ))}
      </div>

      <Card>
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="text-violet-400" size={20} />
          <h2 className="text-lg font-semibold text-white">Plan del día — IA</h2>
        </div>
        <p className="text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap">
          {plan || 'Generando tu plan personalizado...'}
        </p>
        {aiPrompts.length > 0 && (
          <div className="mt-4 pt-4 border-t border-white/10">
            <p className="text-zinc-500 text-xs mb-2">Pregúntale al mentor:</p>
            <div className="flex flex-col gap-2">
              {aiPrompts.slice(0, 3).map((p) => (
                <Link
                  key={p}
                  to="/chat"
                  state={{ prefill: p }}
                  className="text-xs px-3 py-2 rounded-lg border border-violet-500/30 text-violet-300 hover:bg-violet-500/10 transition-colors">
                  {p}
                </Link>
              ))}
            </div>
            <Link to="/chat" className="text-violet-400 text-xs font-medium mt-3 inline-block hover:underline">
              Abrir mentor IA →
            </Link>
          </div>
        )}
      </Card>
    </div>
  );
}
