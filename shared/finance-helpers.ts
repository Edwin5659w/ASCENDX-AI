import { DEFAULT_CURRENCY, getCurrencyLocale, type CurrencyCode } from './currencies';

export const EXPENSE_CATEGORIES = [
  'Inventario / mercancía',
  'Envíos y logística',
  'Publicidad',
  'Comida',
  'Transporte',
  'Vivienda',
  'Salud',
  'Ocio',
  'Educación',
  'Suscripciones',
  'Ropa',
  'Servicios',
  'Otros',
] as const;

export const INCOME_CATEGORIES = [
  'Salario',
  'Freelance',
  'Ventas — productos',
  'Ventas — servicios',
  'Ventas online',
  'Cobros a clientes',
  'Comisiones',
  'Inversiones',
  'Regalo',
  'Reembolso',
  'Otros',
] as const;

export const CATEGORY_CHART_COLORS = [
  '#8b5cf6',
  '#22d3ee',
  '#34d399',
  '#fbbf24',
  '#f87171',
  '#fb923c',
  '#a78bfa',
  '#4ade80',
  '#f472b6',
  '#94a3b8',
] as const;

export interface FinanceCategoryTotal {
  category: string;
  total: number;
}

export interface FinanceMonthTotal {
  key: string;
  label: string;
  income: number;
  expense: number;
}

export interface FinanceSummaryFull {
  income: number;
  expense: number;
  balance: number;
  totalRecords: number;
  savingsRate: number;
  expenseByCategory: FinanceCategoryTotal[];
  incomeByCategory: FinanceCategoryTotal[];
  monthly: FinanceMonthTotal[];
  budget503020: { needs: number; wants: number; savings: number } | null;
  topExpenseCategory: string | null;
}

export function formatMoney(
  amount: number,
  currency: string = DEFAULT_CURRENCY,
  locale?: string,
): string {
  const loc = locale ?? getCurrencyLocale(currency);
  const fractionDigits = currency === 'JPY' ? 0 : 2;
  try {
    return new Intl.NumberFormat(loc, {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: fractionDigits,
    }).format(amount);
  } catch {
    return new Intl.NumberFormat(getCurrencyLocale(DEFAULT_CURRENCY), {
      style: 'currency',
      currency: DEFAULT_CURRENCY,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  }
}

/** Formato corto para gráficos (ej. $1.2M en COP/USD según moneda). */
export function formatMoneyCompact(amount: number, currency: string = DEFAULT_CURRENCY): string {
  const sample = formatMoney(0, currency);
  const symbol = sample.replace(/[\d\s.,\-]/g, '').trim() || '$';
  const abs = Math.abs(amount);
  if (abs >= 1_000_000) {
    return `${symbol}${(amount / 1_000_000).toFixed(1)}M`;
  }
  if (abs >= 1000) {
    return `${symbol}${(amount / 1000).toFixed(1)}k`;
  }
  return formatMoney(amount, currency);
}

export type { CurrencyCode };

export function isOnboardingFinanceRecord(category: string, amount: number): boolean {
  return category === 'Onboarding' && amount <= 0.01;
}
