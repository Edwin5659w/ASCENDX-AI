import { Link } from 'react-router-dom';
import { MessageCircle, Target, CheckSquare, Flame, Wallet } from 'lucide-react';
import { QUICK_ACTIONS } from '@shared/dashboard-helpers';

const ICONS = {
  tasks: CheckSquare,
  habits: Flame,
  goals: Target,
  finance: Wallet,
  chat: MessageCircle,
} as const;

export function DashboardQuickActions() {
  return (
    <div className="mb-8">
      <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide mb-3">Acciones rápidas</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {QUICK_ACTIONS.map((action) => {
          const Icon = ICONS[action.id];
          return (
            <Link
              key={action.id}
              to={action.webPath}
              className="group flex flex-col gap-2 p-4 rounded-xl border border-white/10 bg-[#1c1c2e]/60 hover:border-violet-500/40 hover:bg-violet-500/10 transition-all">
              <Icon className="text-violet-400 group-hover:text-violet-300" size={22} />
              <div>
                <p className="text-white text-sm font-semibold">{action.label}</p>
                <p className="text-zinc-500 text-xs">{action.hint}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
