import { Crown, Sparkles } from 'lucide-react';
import type { AIUsage } from '@shared/ai-prompts';

interface AIUsageBarProps {
  usage: AIUsage | null;
  compact?: boolean;
  onUpgrade?: () => void;
}

export function AIUsageBar({ usage, compact = false, onUpgrade }: AIUsageBarProps) {
  if (!usage) return null;

  const pct = usage.limit > 0 ? Math.round((usage.used / usage.limit) * 100) : 0;
  const atLimit = usage.remaining <= 0;
  const warning = pct >= 60 && !atLimit;
  const barColor = atLimit ? 'bg-red-500' : warning ? 'bg-amber-500' : 'bg-violet-500';

  return (
    <div
      className={`rounded-xl border ${
        atLimit
          ? 'border-red-500/40 bg-red-500/10'
          : warning
            ? 'border-amber-500/30 bg-amber-500/5'
            : 'border-violet-500/20 bg-violet-500/5'
      } ${compact ? 'px-3 py-2' : 'px-4 py-3'}`}>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <Sparkles size={compact ? 14 : 16} className={atLimit ? 'text-red-400' : 'text-violet-400'} />
          <span className={`font-medium ${compact ? 'text-xs' : 'text-sm'} ${atLimit ? 'text-red-200' : 'text-zinc-300'}`}>
            Mentor IA · {usage.used}/{usage.limit} hoy
          </span>
          {usage.plan === 'FREE' && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-700/50 text-zinc-400">Gratis</span>
          )}
        </div>
        {usage.plan === 'FREE' && (warning || atLimit) && onUpgrade ? (
          <button
            type="button"
            onClick={onUpgrade}
            className="flex items-center gap-1 text-xs font-semibold text-violet-300 hover:text-white">
            <Crown size={12} />
            Pro 100/día
          </button>
        ) : null}
      </div>
      <div className={`h-1.5 rounded-full bg-zinc-800 overflow-hidden ${compact ? '' : 'mb-1'}`}>
        <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
      {!compact && atLimit && usage.plan === 'FREE' ? (
        <p className="text-red-300/80 text-xs mt-2">
          Límite alcanzado. Pro desbloquea 100 mensajes/día + resumen semanal inteligente.
        </p>
      ) : null}
    </div>
  );
}
