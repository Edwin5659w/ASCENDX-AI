import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { AlertTriangle, Target, CheckSquare, Flame, Wallet } from 'lucide-react';
import { Card } from '../components/Card';
import { PageLoader } from '../components/ui/PageLoader';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { userApi, aiApi } from '../api/services';
import type { UserStats } from '../types';

export function Dashboard() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [plan, setPlan] = useState('');
  const [warning, setWarning] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [s, ai] = await Promise.all([userApi.stats(), aiApi.dailyPlan()]);
        setStats(s);
        setPlan(ai.plan);
        setWarning(ai.procrastinationWarning);
      } catch (e) {
        showToast(e instanceof Error ? e.message : 'Error al cargar dashboard', 'error');
      } finally {
        setLoading(false);
      }
    })();
  }, [showToast]);

  const chartData = [
    { name: 'Objetivos', value: stats?.totalGoals ?? 0, color: '#8b5cf6' },
    { name: 'Tareas OK', value: stats?.completedTasks ?? 0, color: '#34d399' },
    { name: 'Hábitos', value: stats?.activeHabits ?? 0, color: '#fbbf24' },
    { name: 'Racha', value: stats?.longestStreak ?? 0, color: '#22d3ee' },
  ];

  const kpis = [
    { label: 'Objetivos', value: stats?.totalGoals ?? 0, icon: Target, color: 'text-violet-400' },
    { label: 'Tareas', value: `${stats?.completedTasks ?? 0}/${stats?.totalTasks ?? 0}`, icon: CheckSquare, color: 'text-emerald-400' },
    { label: 'Racha', value: stats?.longestStreak ?? 0, icon: Flame, color: 'text-amber-400' },
    { label: 'Balance', value: `$${stats?.financeBalance ?? 0}`, icon: Wallet, color: 'text-cyan-400' },
  ];

  if (loading) return <PageLoader />;

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-1">
        Hola, {user?.name?.split(' ')[0]} 👋
      </h1>
      <p className="text-zinc-500 mb-6">
        Nivel {user?.level} · {user?.xp} XP
      </p>

      {warning && (
        <div className="mb-6 flex gap-3 p-4 rounded-xl border border-amber-500/30 bg-amber-500/10">
          <AlertTriangle className="text-amber-400 shrink-0 mt-0.5" size={20} />
          <div>
            <p className="text-amber-200 font-medium text-sm">Alerta de procrastinación</p>
            <p className="text-amber-200/80 text-sm mt-1">{warning}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {kpis.map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <Icon className={`${color} mb-2`} size={22} />
            <p className="text-2xl font-bold text-white">{value}</p>
            <p className="text-zinc-500 text-sm">{label}</p>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <h2 className="text-lg font-semibold text-white mb-4">Progreso general</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData}>
              <XAxis dataKey="name" tick={{ fill: '#a1a1aa', fontSize: 12 }} />
              <YAxis tick={{ fill: '#a1a1aa', fontSize: 12 }} />
              <Tooltip
                contentStyle={{ background: '#1c1c2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}
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
          <h2 className="text-lg font-semibold text-white mb-3">Plan del día — IA</h2>
          <p className="text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap">
            {plan || 'Generando tu plan personalizado...'}
          </p>
        </Card>
      </div>
    </div>
  );
}
