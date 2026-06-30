import { useEffect, useRef } from 'react';
import { consumePendingProCheckout } from '../lib/pending-pro-checkout';
import { useProCheckout } from './useProCheckout';

/** Tras registro con ?plan=pro, inicia checkout al llegar al dashboard */
export function usePendingProCheckout(enabled = true) {
  const { startCheckout } = useProCheckout();
  const ran = useRef(false);

  useEffect(() => {
    if (!enabled || ran.current || !consumePendingProCheckout()) return;
    ran.current = true;
    void startCheckout();
  }, [startCheckout, enabled]);
}
