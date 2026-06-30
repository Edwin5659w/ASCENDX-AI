import { Link } from 'react-router-dom';
import { Target, Zap } from 'lucide-react';
import { Card } from '../Card';
import { XP } from '@shared/retention';
import type { UserStats } from '../../types';

interface FirstWinHeroProps {
  stats: UserStats | null;
}

export function FirstWinHero({ stats }: FirstWinHeroProps) {
  if (!stats || stats.completedTasks > 0) return null;
  if (stats.totalTasks === 0) return null;

  return (
    <Card className="mb-6 border-amber-500/40 bg-gradient-to-r from-amber-950/40 to-violet-950/30 overflow-hidden relative">
      <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl -mr-10 -mt-10" />
      <div className="relative flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Target className="text-amber-400" size={22} />
            <span className="text-amber-200 text-xs font-semibold uppercase tracking-wide">
              Tu primera victoria
            </span>
          </div>
          <h2 className="text-lg font-bold text-white mb-1">
            Gana +{XP.TASK_COMPLETE} XP en menos de 2 minutos
          </h2>
          <p className="text-zinc-400 text-sm">
            Tienes {stats.totalTasks - stats.completedTasks} tarea(s) lista(s). Márcala hecha y sube de
            nivel.
          </p>
        </div>
        <Link
          to="/tasks"
          className="inline-flex items-center justify-center gap-2 shrink-0 px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm transition-colors">
          <Zap size={18} />
          Ir a mis tareas
        </Link>
      </div>
    </Card>
  );
}
