import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Crown, Sparkles } from 'lucide-react';
import { MarketingLayout } from '../components/marketing/MarketingLayout';
import { PlanComparison } from '../components/marketing/PlanComparison';
import { FREE_VALUE_PITCH, PRO_VALUE_PITCH } from '@shared/plan-marketing';
import { PLAN_PRICING } from '@shared/plans';
import { useProCheckout } from '../hooks/useProCheckout';
import { billingApi } from '../api/services';
import { useAuth } from '../context/AuthContext';

export function Pricing() {
  const { isAuthenticated } = useAuth();
  const { startCheckout, loading } = useProCheckout();
  const [stripeReady, setStripeReady] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      billingApi.status().then((s) => setStripeReady(s.billingConfigured)).catch(() => {});
    }
  }, [isAuthenticated]);

  return (
    <MarketingLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-3">Invierte en tu ascenso</h1>
          <p className="text-zinc-500 max-w-xl mx-auto">
            Gratis es generoso — todo el núcleo sin tarjeta. Pro es para quien quiere más IA, más
            límites y resumen semanal inteligente.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-14">
          <div className="rounded-2xl border border-white/10 bg-[#14141f] p-8">
            <h2 className="text-xl font-bold text-white mb-1">Gratis</h2>
            <p className="text-zinc-500 text-sm mb-6">Para siempre — sin trucos</p>
            <p className="text-4xl font-bold text-white mb-6">
              $0<span className="text-lg text-zinc-500 font-normal">/mes</span>
            </p>
            <ul className="space-y-3 mb-8">
              {FREE_VALUE_PITCH.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-zinc-300">
                  <Check className="text-emerald-400 shrink-0 mt-0.5" size={16} />
                  {f}
                </li>
              ))}
            </ul>
            <Link
              to="/register"
              className="block w-full text-center py-3 rounded-xl border border-white/15 text-white font-medium hover:border-violet-500/40 transition-colors">
              Empezar gratis
            </Link>
          </div>

          <div className="rounded-2xl border border-violet-500/40 bg-gradient-to-br from-violet-950/40 to-[#14141f] p-8 relative brand-glow">
            <div className="absolute -top-3 right-6 px-3 py-1 rounded-full bg-violet-600 text-white text-xs font-semibold flex items-center gap-1">
              <Crown size={12} />
              Más popular
            </div>
            <h2 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
              Pro
              <Sparkles className="text-violet-400" size={18} />
            </h2>
            <p className="text-zinc-500 text-sm mb-6">Menos de un café al mes</p>
            <p className="text-4xl font-bold text-white mb-6">
              ${PLAN_PRICING.PRO.price}
              <span className="text-lg text-zinc-500 font-normal">/mes</span>
            </p>
            <ul className="space-y-3 mb-8">
              {PRO_VALUE_PITCH.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-zinc-300">
                  <Check className="text-cyan-400 shrink-0 mt-0.5" size={16} />
                  {f}
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => void startCheckout()}
              disabled={loading}
              className="block w-full text-center brand-btn-primary py-3 rounded-xl text-white font-semibold disabled:opacity-50">
              {loading ? 'Redirigiendo...' : isAuthenticated ? 'Suscribirme a Pro' : 'Crear cuenta y suscribirme'}
            </button>
            <p className="text-zinc-600 text-xs text-center mt-3">
              {stripeReady
                ? 'Pago seguro con Stripe. Cancela cuando quieras desde Perfil.'
                : 'Configura Stripe en el servidor para activar pagos.'}
            </p>
          </div>
        </div>

        <div className="mb-10">
          <h2 className="text-2xl font-bold text-white text-center mb-2">Comparación lado a lado</h2>
          <p className="text-zinc-500 text-sm text-center mb-8">Transparencia total — sin letra pequeña</p>
          <PlanComparison showPitchLists={false} />
        </div>

        <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-6 text-center">
          <p className="text-cyan-200 text-sm font-medium mb-1">¿Aún no estás seguro?</p>
          <p className="text-zinc-400 text-sm mb-4">
            Empieza Gratis, usa la app una semana y decide. Pro estará ahí cuando sientas el valor.
          </p>
          <Link to="/register" className="text-violet-400 font-medium hover:underline">
            Crear cuenta gratis →
          </Link>
        </div>
      </div>
    </MarketingLayout>
  );
}
