import { useEffect } from 'react';
import { Crown, Sparkles } from 'lucide-react';
import { PRO_VALUE_PROPS } from '@shared/retention-playbook';
import { PLAN_LIMITS, PLAN_PRICING } from '@shared/plans';
import { PlanComparison } from '../marketing/PlanComparison';
import { track, AnalyticsEvents } from '../../lib/analytics';

interface AILimitModalProps {
  open: boolean;
  onClose: () => void;
  onUpgrade: () => void;
  upgrading?: boolean;
}

export function AILimitModal({ open, onClose, onUpgrade, upgrading }: AILimitModalProps) {
  useEffect(() => {
    if (open) track(AnalyticsEvents.AI_LIMIT_HIT, { source: 'web_chat' });
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm tour-overlay-enter">
      <div className="relative w-full max-w-lg rounded-2xl border border-violet-500/40 bg-[#14141f] p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-500 hover:text-white p-1 text-xl"
          aria-label="Cerrar">
          ×
        </button>

        <div className="flex justify-center mb-4 tour-icon-bounce">
          <div className="w-16 h-16 rounded-2xl bg-violet-500/20 flex items-center justify-center">
            <Sparkles className="text-violet-400" size={32} />
          </div>
        </div>

        <h2 className="text-xl font-bold text-white text-center mb-1">Tu mentor quiere seguir ayudándote</h2>
        <p className="text-zinc-400 text-sm text-center mb-4 leading-relaxed">
          Usaste tus {PLAN_LIMITS.FREE.aiChatPerDay} mensajes gratis de hoy. Con Pro sigues conversando con
          contexto de tus tareas, hábitos y finanzas reales.
        </p>

        <ul className="space-y-2 mb-4">
          {PRO_VALUE_PROPS.map((p) => (
            <li key={p} className="flex items-start gap-2 text-sm text-zinc-300 bg-white/[0.03] rounded-lg px-3 py-2">
              <Sparkles className="text-cyan-400 shrink-0 mt-0.5" size={14} />
              {p}
            </li>
          ))}
        </ul>

        <div className="mb-5 scale-95 origin-top">
          <PlanComparison compact />
        </div>

        <button
          type="button"
          onClick={onUpgrade}
          disabled={upgrading}
          className="w-full brand-btn-primary text-white font-semibold py-3.5 rounded-xl mb-2 flex items-center justify-center gap-2 disabled:opacity-50 tour-cta-pulse">
          <Crown size={18} />
          {upgrading ? 'Redirigiendo...' : `Activar Pro — $${PLAN_PRICING.PRO.price}/mes`}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="w-full text-center text-zinc-500 text-sm py-2 hover:text-zinc-300">
          Volver mañana (plan Gratis)
        </button>
      </div>
    </div>
  );
}
