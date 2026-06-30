import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { loadAnalyticsScripts } from '../../lib/analytics';

const STORAGE_KEY = 'ascendx_cookie_consent';

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      setVisible(localStorage.getItem(STORAGE_KEY) !== '1' && localStorage.getItem(STORAGE_KEY) !== 'essential');
    } catch {
      setVisible(true);
    }
  }, []);

  const accept = () => {
    try {
      localStorage.setItem(STORAGE_KEY, '1');
    } catch {
      /* ignore */
    }
    loadAnalyticsScripts();
    setVisible(false);
  };

  const reject = () => {
    try {
      localStorage.setItem(STORAGE_KEY, 'essential');
    } catch {
      /* ignore */
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-[70] p-4 sm:p-6 pointer-events-none">
      <div className="max-w-3xl mx-auto pointer-events-auto rounded-2xl border border-white/10 bg-[#14141f]/95 backdrop-blur-md p-4 sm:p-5 shadow-2xl flex flex-col sm:flex-row sm:items-center gap-4">
        <p className="text-zinc-400 text-sm flex-1 leading-relaxed">
          Usamos cookies esenciales para la sesión y, si lo aceptas, analítica anónima para mejorar ASCENDX.
          Más info en{' '}
          <Link to="/privacy" className="text-violet-400 hover:underline">
            Privacidad
          </Link>
          .
        </p>
        <div className="flex gap-2 shrink-0">
          <button
            type="button"
            onClick={reject}
            className="px-4 py-2 rounded-lg border border-white/15 text-zinc-400 text-sm hover:text-white">
            Solo esenciales
          </button>
          <button
            type="button"
            onClick={accept}
            className="brand-btn-primary px-4 py-2 rounded-lg text-white text-sm font-semibold">
            Aceptar todo
          </button>
        </div>
      </div>
    </div>
  );
}
