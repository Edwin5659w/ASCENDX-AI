export const EXPENSE_CATEGORIES = [
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
  'Ventas',
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

export function formatMoney(amount: number, locale = 'es-CO'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatMoneyCompact(amount: number): string {
  if (Math.abs(amount) >= 1000) {
    return `$${(amount / 1000).toFixed(1)}k`;
  }
  return `$${amount.toFixed(amount % 1 === 0 ? 0 : 2)}`;
}

export function isOnboardingFinanceRecord(category: string, amount: number): boolean {
  return category === 'Onboarding' && amount <= 0.01;
}
