import * as SecureStore from 'expo-secure-store';
import { PENDING_PRO_CHECKOUT_KEY } from '../../../shared/checkout-intent';

export async function setPendingProCheckout(): Promise<void> {
  await SecureStore.setItemAsync(PENDING_PRO_CHECKOUT_KEY, '1');
}

export async function consumePendingProCheckout(): Promise<boolean> {
  const v = await SecureStore.getItemAsync(PENDING_PRO_CHECKOUT_KEY);
  if (v) await SecureStore.deleteItemAsync(PENDING_PRO_CHECKOUT_KEY);
  return v === '1';
}
