import { useCallback } from 'react';
import { DEFAULT_CURRENCY } from '@shared/currencies';
import { formatMoney, formatMoneyCompact } from '@shared/finance-helpers';
import { useAuth } from '../context/AuthContext';

export function useMoneyFormat() {
  const { user } = useAuth();
  const currency = user?.preferredCurrency ?? DEFAULT_CURRENCY;

  const fmt = useCallback((amount: number) => formatMoney(amount, currency), [currency]);
  const fmtCompact = useCallback(
    (amount: number) => formatMoneyCompact(amount, currency),
    [currency],
  );

  return { currency, formatMoney: fmt, formatMoneyCompact: fmtCompact };
}
