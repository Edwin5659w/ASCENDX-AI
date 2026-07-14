import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { billingApi } from '../api/services';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { track, AnalyticsEvents } from '../lib/analytics';

export function useProCheckout() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);

  const startCheckout = async (interval: 'month' | 'year' = 'month') => {
    track(AnalyticsEvents.UPGRADE_CTA, { interval, authenticated: isAuthenticated });
    if (!isAuthenticated) {
      navigate('/register?plan=pro');
      return;
    }
    setLoading(true);
    try {
      const status = await billingApi.status();
      if (status.plan === 'PRO') {
        showToast('Ya tienes Pro activo', 'info');
        return;
      }
      if (!status.billingConfigured) {
        showToast('Pagos no disponibles aún. Configura Stripe en el servidor o contacta soporte.', 'error');
        return;
      }
      track(AnalyticsEvents.CHECKOUT_START, { interval, provider: 'stripe' });
      const { url } = await billingApi.checkout(interval);
      window.location.href = url;
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'No se pudo iniciar el pago', 'error');
    } finally {
      setLoading(false);
    }
  };

  const openPortal = async () => {
    setLoading(true);
    try {
      const { url } = await billingApi.portal();
      window.location.href = url;
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'No se pudo abrir el portal', 'error');
    } finally {
      setLoading(false);
    }
  };

  return { startCheckout, openPortal, loading };
}
