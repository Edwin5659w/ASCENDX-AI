import { Link } from 'react-router-dom';
import { Crown, Sparkles } from 'lucide-react';
import { PLAN_LIMITS, PLAN_PRICING } from '@shared/plans';
import { useProCheckout } from '../../hooks/useProCheckout';

/** Cinta compacta para usuarios Free — recuerda el valor Pro sin ser agresivo */
export function ProTeaserStrip() {
  const { startCheckout, loading } = useProCheckout();

  return (
    <div className="mb-6 rounded-2xl border border-violet-500/25 bg-gradient-to-r from-violet-950/40 via-[#14141f] to-cyan-950/30 p-4 flex flex-col sm:flex-row sm:items-center gap-4">
      <div className="flex items-start gap-3 flex-1">
        <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center shrink-0">
          <Sparkles className="text-violet-400" size={20} />
        </div>
        <div>
          <p className="text-white font-semibold text-sm flex items-center gap-1.5">
            <Crown size={14} className="text-amber-400" />
            Desbloquea el 100% de ASCENDX
          </p>
          <p className="text-zinc-500 text-xs mt-0.5 leading-relaxed">
            {PLAN_LIMITS.PRO.aiChatPerDay} mensajes IA/día · resumen semanal · {PLAN_LIMITS.PRO.maxGoals}{' '}
            objetivos — desde ${PLAN_PRICING.PRO.price}/mes
          </p>
        </div>
      </div>
      <div className="flex gap-2 shrink-0">
        <Link
          to="/pricing"
          className="px-4 py-2 rounded-xl border border-white/10 text-zinc-300 text-sm hover:border-violet-500/40 hover:text-white transition-colors">
          Comparar
        </Link>
        <button
          type="button"
          onClick={() => void startCheckout()}
          disabled={loading}
          className="px-4 py-2 rounded-xl brand-btn-primary text-white text-sm font-semibold disabled:opacity-50">
          {loading ? '...' : 'Pro'}
        </button>
      </div>
    </div>
  );
}
