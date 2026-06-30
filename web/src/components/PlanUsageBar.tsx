import { Link } from 'react-router-dom';
import type { PlanUsage } from '../types';

interface PlanUsageBarProps {
  usage: PlanUsage | null | undefined;
  metric: 'goals' | 'habits' | 'ai';
  className?: string;
}

export function PlanUsageBar({ usage, metric, className = '' }: PlanUsageBarProps) {
  if (!usage) return null;

  const { plan, limits, usage: u } = usage;
  let used = 0;
  let limit = 0;
  let label = '';

  if (metric === 'goals') {
    used = u.goals;
    limit = limits.maxGoals;
    label = 'Objetivos';
  } else if (metric === 'habits') {
    used = u.habits;
    limit = limits.maxHabits;
    label = 'Hábitos';
  } else {
    used = u.aiChatToday;
    limit = limits.aiChatPerDay;
    label = 'Mensajes IA hoy';
  }

  const pct = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;
  const atLimit = used >= limit;
  const nearLimit = pct >= 80;

  return (
    <div className={`rounded-xl border border-white/10 bg-[#14141f] px-4 py-3 ${className}`}>
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-zinc-400 text-xs">{label}</span>
        <span className={`text-xs font-medium tabular-nums ${atLimit ? 'text-amber-300' : 'text-zinc-300'}`}>
          {used}/{limit}
          {plan === 'FREE' && nearLimit ? (
            <Link to="/pricing" className="ml-2 text-violet-400 hover:underline">
              Pro →
            </Link>
          ) : null}
        </span>
      </div>
      <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${atLimit ? 'bg-amber-500' : nearLimit ? 'bg-violet-500' : 'bg-cyan-500'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
