import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import {
  AlertTriangle,
  Target,
  CheckSquare,
  Flame,
  Wallet,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { Card } from '../components/Card';
import { DashboardSkeleton } from '../components/ui/DashboardSkeleton';
import { GamificationPanel } from '../components/GamificationPanel';
import { FirstStepsPanel } from '../components/FirstStepsPanel';
import { DashboardQuickActions } from '../components/dashboard/DashboardQuickActions';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { userApi, aiApi, type AIContextLevel } from '../api/services';
import type { UserStats } from '../types';
import { computeSetupScore, getTimeGreeting } from '@shared/dashboard-helpers';
import { formatMoney } from '@shared/finance-helpers';
import { CONTEXT_LEVEL_LABELS } from '@shared/chat-helpers';

const CONTEXT_BADGE: Record<AIContextLevel, string> = {
  empty: 'bg-zinc-500/20 text-zinc-300 border-zinc-500/30',
  partial: 'bg-amber-500/15 text-amber-200 border-amber-500/30',
  ready: 'bg-emerald-500/15 text-emerald-200 border-emerald-500/30',
};

export function Dashboard() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [plan, setPlan] = useState('');
  const [warning, setWarning] = useState<string | null>(null);
  const [aiPrompts, setAiPrompts] = useState<string[]>([]);
  const [contextLevel, setContextLevel] = useState<AIContextLevel>('empty');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [s, ai] = await Promise.all([userApi.stats(), aiApi.dailyPlan()]);
      setStats(s);
      setPlan(ai.plan);
      setWarning(ai.procrastinationWarning);
      setAiPrompts(ai.suggestedPrompts ?? []);
      setContextLevel(ai.contextLevel);
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

  const pendingTasks = (stats?.totalTasks ?? 0) - (stats?.completedTasks ?? 0);
  const balancePositive = (stats?.financeBalance ?? 0) >= 0;

  const chartData = [
    { name: 'Objetivos', value: stats?.totalGoals ?? 0, color: '#8b5cf6' },
    { name: 'Tareas OK', value: stats?.completedTasks ?? 0, color: '#34d399' },
    { name: 'Hábitos', value: stats?.activeHabits ?? 0, color: '#fbbf24' },
    { name: 'Racha', value: stats?.longestStreak ?? 0, color: '#22d3ee' },
  ];

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
      <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">{greeting} 👋</h1>
          <p className="text-zinc-500 text-sm">Tu Life OS — nivel {user?.level ?? 1} · {user?.xp ?? 0} XP</p>
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

      {setupScore < 100 && stats && (
        <Card className="mb-6 border-violet-500/20">
          <div className="flex justify-between items-center mb-2">
            <p className="text-zinc-300 text-sm font-medium">Configuración del espacio</p>
            <span className="text-violet-300 font-bold">{setupScore}%</span>
          </div>
          <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-violet-500 to-cyan-500 rounded-full transition-all"
              style={{ width: `${setupScore}%` }}
            />
          </div>
          <p className="text-zinc-500 text-xs mt-2">
            Completa objetivos, tareas, hábitos y finanzas para planes de IA más precisos.
          </p>
        </Card>
      )}

      <FirstStepsPanel stats={stats} />
      <GamificationPanel user={user ?? null} stats={stats} />
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

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <h2 className="text-lg font-semibold text-white mb-4">Progreso general</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData}>
              <XAxis dataKey="name" tick={{ fill: '#a1a1aa', fontSize: 11 }} />
              <YAxis tick={{ fill: '#a1a1aa', fontSize: 11 }} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  background: '#1c1c2e',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 8,
                }}
                labelStyle={{ color: '#fff' }}
              />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {chartData.map((e, i) => (
                  <Cell key={i} fill={e.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

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
    </div>
  );
}
