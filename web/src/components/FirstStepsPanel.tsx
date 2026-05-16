import { Link } from 'react-router-dom';
import { CheckCircle2, Circle, ListChecks, Medal } from 'lucide-react';
import {
  buildFirstSteps,
  firstStepsProgress,
  isFirstStepsComplete,
  nextLockedBadgeHint,
} from '@shared/first-steps';
import type { UserStats } from '../types';
import { Card } from './Card';

interface FirstStepsPanelProps {
  stats: UserStats | null;
}

export function FirstStepsPanel({ stats }: FirstStepsPanelProps) {
  if (!stats) return null;

  const steps = buildFirstSteps({
    totalGoals: stats.totalGoals,
    totalTasks: stats.totalTasks,
    completedTasks: stats.completedTasks,
    activeHabits: stats.activeHabits,
    habitsCompletedToday: stats.habitsCompletedToday ?? 0,
    financeRecordsCount: stats.financeRecordsCount ?? 0,
  });

  if (isFirstStepsComplete(steps)) return null;

  const { done, total, percent } = firstStepsProgress(steps);
  const nextBadge = nextLockedBadgeHint(stats.badges);
  const nextStep = steps.find((s) => !s.done);

  return (
    <Card className="mb-8 border-cyan-500/25 bg-gradient-to-br from-cyan-950/30 to-transparent">
      <div className="flex items-start gap-3 mb-4">
        <ListChecks className="text-cyan-400 shrink-0 mt-0.5" size={22} />
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-white">Configura ASCENDX</h2>
          <p className="text-zinc-400 text-sm mt-1">
            {done}/{total} pasos · {percent}% listo para aprovechar la IA y la gamificación
          </p>
        </div>
      </div>
      <div className="h-2 rounded-full bg-zinc-800 overflow-hidden mb-4">
        <div
          className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-violet-500 transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>
      <ul className="space-y-2 mb-4">
        {steps.map((step) => (
          <li key={step.id}>
            <Link
              to={step.webPath}
              className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                step.done
                  ? 'border-emerald-500/30 bg-emerald-500/5 pointer-events-none'
                  : 'border-white/10 hover:border-cyan-500/40 hover:bg-white/5'
              }`}>
              {step.done ? (
                <CheckCircle2 className="text-emerald-400 shrink-0" size={20} />
              ) : (
                <Circle className="text-zinc-500 shrink-0" size={20} />
              )}
              <div className="min-w-0">
                <p className={`text-sm font-medium ${step.done ? 'text-zinc-500 line-through' : 'text-white'}`}>
                  {step.label}
                </p>
                <p className="text-xs text-zinc-500">{step.hint}</p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
      {nextBadge && (
        <p className="flex items-center gap-2 text-xs text-amber-200/90 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
          <Medal size={14} className="text-amber-400 shrink-0" />
          Próximo logro: {nextBadge}
        </p>
      )}
      {nextStep && (
        <Link
          to={nextStep.webPath}
          className="mt-3 block text-center text-sm font-medium text-cyan-300 hover:text-cyan-200">
          Continuar: {nextStep.label} →
        </Link>
      )}
    </Card>
  );
}
