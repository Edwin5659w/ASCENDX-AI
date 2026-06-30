import { Check, Crown, Sparkles } from 'lucide-react';
import { PLAN_COMPARISON_ROWS, FREE_VALUE_PITCH, PRO_VALUE_PITCH } from '@shared/plan-marketing';
import { PLAN_PRICING } from '@shared/plans';

interface PlanComparisonProps {
  compact?: boolean;
  showPitchLists?: boolean;
  className?: string;
}

const accentCell = 'text-cyan-300 font-semibold';

export function PlanComparison({ compact, showPitchLists, className = '' }: PlanComparisonProps) {
  return (
    <div className={className}>
      {showPitchLists ? (
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <div className="rounded-xl border border-white/10 bg-[#14141f] p-5">
            <p className="text-emerald-400 text-xs font-semibold uppercase tracking-wide mb-3">Plan Gratis</p>
            <ul className="space-y-2">
              {FREE_VALUE_PITCH.map((line) => (
                <li key={line} className="flex gap-2 text-sm text-zinc-300">
                  <Check className="text-emerald-400 shrink-0 mt-0.5" size={14} />
                  {line}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-violet-500/35 bg-gradient-to-br from-violet-950/50 to-[#14141f] p-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/10 rounded-full blur-3xl" />
            <p className="text-violet-300 text-xs font-semibold uppercase tracking-wide mb-1 flex items-center gap-1">
              <Crown size={12} /> Pro — ${PLAN_PRICING.PRO.price}/mes
            </p>
            <p className="text-zinc-500 text-xs mb-3">Para quien quiere más IA y menos límites</p>
            <ul className="space-y-2 relative">
              {PRO_VALUE_PITCH.map((line) => (
                <li key={line} className="flex gap-2 text-sm text-zinc-200">
                  <Sparkles className="text-cyan-400 shrink-0 mt-0.5" size={14} />
                  {line}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}

      <div className={`overflow-hidden rounded-xl border border-white/10 ${compact ? 'text-xs' : 'text-sm'}`}>
        <table className="w-full">
          <thead>
            <tr className="bg-[#14141f] border-b border-white/10">
              <th className="text-left text-zinc-500 font-medium px-4 py-3">Función</th>
              <th className="text-center text-zinc-400 font-medium px-3 py-3 w-24">Gratis</th>
              <th className="text-center text-violet-300 font-semibold px-3 py-3 w-24">
                <span className="inline-flex items-center gap-1">
                  <Crown size={compact ? 12 : 14} /> Pro
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            {PLAN_COMPARISON_ROWS.map((row) => (
              <tr
                key={row.label}
                className={`border-b border-white/5 ${row.highlight ? 'bg-violet-500/5' : 'bg-[#0a0a0f]/50'}`}>
                <td className="text-zinc-300 px-4 py-2.5">{row.label}</td>
                <td className="text-center text-zinc-400 px-3 py-2.5 tabular-nums">{row.free}</td>
                <td className={`text-center px-3 py-2.5 tabular-nums ${row.highlight ? accentCell : 'text-zinc-200'}`}>
                  {row.pro}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
