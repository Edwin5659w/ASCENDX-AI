import { Link } from 'react-router-dom';

import { Crown, Sparkles } from 'lucide-react';

import type { PlanUsage } from '../../types';



interface UpgradeBannerProps {

  planUsage?: PlanUsage | null;

}



export function UpgradeBanner({ planUsage }: UpgradeBannerProps) {

  if (!planUsage || planUsage.plan === 'PRO') return null;



  const { aiChatToday } = planUsage.usage;

  const { aiChatPerDay } = planUsage.limits;

  const pct = Math.round((aiChatToday / aiChatPerDay) * 100);

  const remaining = aiChatPerDay - aiChatToday;



  if (pct < 40 && remaining > 2) return null;



  return (

    <div className="mb-6 flex flex-wrap items-center gap-3 p-4 rounded-xl border border-violet-500/30 bg-violet-500/10">

      <Sparkles className="text-violet-400 shrink-0" size={20} />

      <div className="flex-1 min-w-[200px]">

        <p className="text-violet-200 font-medium text-sm">

          {pct >= 100

            ? 'Límite diario de IA alcanzado — el mentor se detuvo'

            : remaining <= 2

              ? `Solo ${remaining} mensaje${remaining !== 1 ? 's' : ''} IA restante${remaining !== 1 ? 's' : ''} hoy`

              : `${aiChatToday}/${aiChatPerDay} mensajes IA usados hoy`}

        </p>

        <p className="text-violet-200/70 text-xs mt-0.5">

          Pro: 100 mensajes/día, resumen semanal y mentor con todo tu contexto.

        </p>

      </div>

      <Link

        to="/pricing"

        className="flex items-center gap-1.5 px-4 py-2 rounded-lg brand-btn-primary text-white text-sm font-medium">

        <Crown size={14} />

        {pct >= 100 ? 'Desbloquear Pro' : 'Ver Pro'}

      </Link>

    </div>

  );

}

