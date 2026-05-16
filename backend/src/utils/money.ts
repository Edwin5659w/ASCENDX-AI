/** Redondeo monetario a 2 decimales (evita errores de coma flotante en API). */
export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

export function toMoneyNumber(amount: { toNumber?: () => number } | number | string): number {
  if (typeof amount === 'number') return roundMoney(amount);
  if (typeof amount === 'string') return roundMoney(parseFloat(amount));
  if (amount && typeof amount.toNumber === 'function') return roundMoney(amount.toNumber());
  return roundMoney(Number(amount));
}
