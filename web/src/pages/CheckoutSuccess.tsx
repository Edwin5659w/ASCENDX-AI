import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle, Crown } from 'lucide-react';
import { billingApi } from '../api/services';
import { useAuth } from '../context/AuthContext';
import { BrandLoader } from '../components/brand/BrandLoader';
import { PRO_VALUE_PROPS } from '@shared/retention-playbook';

export function CheckoutSuccess() {
  const [params] = useSearchParams();
  const { refreshUser } = useAuth();
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const sessionId = params.get('session_id');
    if (!sessionId) {
      setError('Sesión de pago no encontrada');
      setReady(true);
      return;
    }
    billingApi
      .syncSession(sessionId)
      .then(() => refreshUser())
      .catch((e) => setError(e instanceof Error ? e.message : 'Error al confirmar pago'))
      .finally(() => setReady(true));
  }, [params, refreshUser]);

  if (!ready) {
    return <BrandLoader className="min-h-screen flex items-center justify-center bg-[#0a0a0f]" />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-6 text-center">
        <div className="max-w-md">
          <p className="text-red-400 mb-4">{error}</p>
          <Link to="/profile" className="text-violet-400 hover:underline">
            Ir a Perfil
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-6">
      <div className="max-w-lg w-full rounded-2xl border border-violet-500/40 bg-[#14141f] p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="text-emerald-400" size={36} />
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-600/30 text-violet-300 text-sm font-medium mb-4">
          <Crown size={14} /> ASCENDX Pro activo
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">¡Pago confirmado! 🎉</h1>
        <p className="text-zinc-400 text-sm mb-6 leading-relaxed">
          Tu membresía Pro está activa. Revisa tu email de confirmación y empieza a usar todo el
          potencial de ASCENDX.
        </p>
        <ul className="text-left text-sm text-zinc-300 space-y-2 mb-8">
          {PRO_VALUE_PROPS.map((p) => (
            <li key={p} className="flex items-start gap-2">
              <CheckCircle className="text-cyan-400 shrink-0 mt-0.5" size={16} />
              {p}
            </li>
          ))}
        </ul>
        <Link
          to="/dashboard"
          className="block w-full brand-btn-primary py-3 rounded-xl text-white font-semibold mb-2">
          Ir al dashboard
        </Link>
        <Link to="/profile" className="text-zinc-500 text-sm hover:text-zinc-300">
          Gestionar suscripción
        </Link>
      </div>
    </div>
  );
}
