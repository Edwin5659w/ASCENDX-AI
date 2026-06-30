import { PENDING_PRO_CHECKOUT_KEY } from '@shared/checkout-intent';

export function setPendingProCheckout(): void {
  sessionStorage.setItem(PENDING_PRO_CHECKOUT_KEY, '1');
}

export function consumePendingProCheckout(): boolean {
  const v = sessionStorage.getItem(PENDING_PRO_CHECKOUT_KEY);
  if (v) sessionStorage.removeItem(PENDING_PRO_CHECKOUT_KEY);
  return v === '1';
}
