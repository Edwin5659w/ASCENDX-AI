const copFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
});

/** 1234567 → "$ 1.234.567" */
export function formatCop(value: number): string {
  return copFormatter.format(value);
}

/** Convierte lo que escribe el usuario ("1.250.000", "$ 1250000") en número. */
export function parseAmount(text: string): number | null {
  const digits = text.replace(/[^\d]/g, '');
  if (!digits) return null;
  const value = Number(digits);
  return Number.isSafeInteger(value) ? value : null;
}

/** Muestra un monto mientras se escribe: "1250000" → "1.250.000" */
export function formatAmountInput(text: string): string {
  const value = parseAmount(text);
  return value === null ? '' : new Intl.NumberFormat('es-CO').format(value);
}

/** "24,5" o "24.5" → 0.245 */
export function parsePercent(text: string): number | null {
  const normalized = text.replace(',', '.').replace(/[^\d.]/g, '');
  if (!normalized) return null;
  const value = Number(normalized);
  return Number.isFinite(value) ? value / 100 : null;
}

export function formatMonths(months: number): string {
  if (months === 0) return 'De inmediato';
  const years = Math.floor(months / 12);
  const rest = months % 12;
  const parts: string[] = [];
  if (years > 0) parts.push(`${years} ${years === 1 ? 'año' : 'años'}`);
  if (rest > 0) parts.push(`${rest} ${rest === 1 ? 'mes' : 'meses'}`);
  return parts.join(' y ');
}

export function firstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] ?? fullName;
}
