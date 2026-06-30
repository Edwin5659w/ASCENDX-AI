/** Monedas soportadas para finanzas y diario de trading. */
export const SUPPORTED_CURRENCIES = [
  { code: 'COP', label: 'Peso colombiano (COP)', locale: 'es-CO' },
  { code: 'USD', label: 'Dólar estadounidense (USD)', locale: 'en-US' },
  { code: 'EUR', label: 'Euro (EUR)', locale: 'es-ES' },
  { code: 'MXN', label: 'Peso mexicano (MXN)', locale: 'es-MX' },
  { code: 'ARS', label: 'Peso argentino (ARS)', locale: 'es-AR' },
  { code: 'CLP', label: 'Peso chileno (CLP)', locale: 'es-CL' },
  { code: 'PEN', label: 'Sol peruano (PEN)', locale: 'es-PE' },
  { code: 'BRL', label: 'Real brasileño (BRL)', locale: 'pt-BR' },
  { code: 'GBP', label: 'Libra esterlina (GBP)', locale: 'en-GB' },
  { code: 'CAD', label: 'Dólar canadiense (CAD)', locale: 'en-CA' },
  { code: 'CHF', label: 'Franco suizo (CHF)', locale: 'de-CH' },
  { code: 'JPY', label: 'Yen japonés (JPY)', locale: 'ja-JP' },
] as const;

export type CurrencyCode = (typeof SUPPORTED_CURRENCIES)[number]['code'];

export const DEFAULT_CURRENCY: CurrencyCode = 'COP';

export const CURRENCY_CODES: readonly CurrencyCode[] = SUPPORTED_CURRENCIES.map((c) => c.code);

export function isValidCurrency(code: string): code is CurrencyCode {
  return (CURRENCY_CODES as readonly string[]).includes(code);
}

export function getCurrencyLocale(code: string): string {
  return SUPPORTED_CURRENCIES.find((c) => c.code === code)?.locale ?? 'es-CO';
}

export function getCurrencyLabel(code: string): string {
  return SUPPORTED_CURRENCIES.find((c) => c.code === code)?.label ?? code;
}
