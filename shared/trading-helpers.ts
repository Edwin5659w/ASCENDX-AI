export const TRADE_EMOTION_TAGS = [
  'DISCIPLINA',
  'FOMO',
  'MIEDO',
  'REVENGE',
  'PACIENCIA',
  'EUFORIA',
] as const;

export const TRADING_DISCLAIMER =
  'Diario personal de operaciones. No es asesoría financiera ni recomendación de compra o venta.';

export function formatTradeSide(side: 'BUY' | 'SELL'): string {
  return side === 'BUY' ? 'Compra' : 'Venta';
}

export function computeNotional(quantity: number, price: number): number {
  return Math.round(quantity * price * 100) / 100;
}
