import type { CapacityEstimate, GoalPlan, MonthlyIndicators, MovementType } from '@ascendx/finance-core';
import { apiRequest } from '@/lib/api';
import { invalidate } from '@/lib/query';

/** Tipos de las respuestas de la API (ver docs/api.md). */

export interface Category {
  id: string;
  name: string;
  kind: 'ingreso' | 'gasto';
  icon: string | null;
  color: string | null;
  isDefault: boolean;
}

export interface Transaction {
  id: string;
  type: MovementType;
  amount: number;
  date: string;
  description: string | null;
  source: 'manual' | 'ocr' | 'recurrente';
  category: { id: string; name: string; icon: string | null; color: string | null } | null;
  debt: { id: string; name: string } | null;
  goal: { id: string; name: string } | null;
  account: { id: string; name: string } | null;
  principalAmount: number | null;
  interestAmount: number | null;
  createdAt: string;
}

export interface TransactionList {
  transactions: Transaction[];
  totals: MonthlyIndicators;
  count: number;
  nextCursor: string | null;
}

export interface Debt {
  id: string;
  creditor: string;
  name: string | null;
  originalAmount: number;
  balance: number;
  paidAmount: number;
  percentPaid: number;
  rate: number | null;
  rateType: 'EA' | 'MV' | null;
  effectiveAnnualRate: number | null;
  installment: number | null;
  termMonths: number | null;
  paymentDay: number | null;
  nextPaymentDate: string | null;
  status: 'activa' | 'pagada' | 'cancelada';
}

export interface Goal {
  id: string;
  name: string;
  icon: string | null;
  priority: 'alta' | 'media' | 'baja';
  status: 'activa' | 'pausada' | 'completada' | 'cancelada';
  targetAmount: number;
  savedAmount: number;
  targetDate: string | null;
  isEmergencyFund: boolean;
  plan: GoalPlan | null;
}

export interface Allocation {
  prudentCapacity: number;
  totalRequired: number;
  allOnTrack: boolean;
  unassigned: number;
}

export interface Dashboard {
  today: string;
  month: string;
  hasMovements: boolean;
  profile: { estimatedIncome: number; estimatedFixedExpenses: number } | null;
  indicators: MonthlyIndicators;
  capacity: CapacityEstimate;
  averages: { income: number | null; expenses: number | null };
  debtLoad: { ratio: number; level: 'verde' | 'amarillo' | 'rojo' } | null;
  emergency: { goalId: string; saved: number; months: number | null } | null;
  byCategory: { category: { id: string; name: string; color: string | null; icon: string | null }; total: number; percent: number }[];
  evolution: { month: string; income: number; expenses: number; debtPayments: number; netFlow: number }[];
  debts: {
    count: number;
    totalBalance: number;
    monthlyInstallments: number;
    upcoming: { id: string; name: string; installment: number | null; nextPaymentDate: string }[];
  };
  goals: Goal[];
  allocation: Allocation;
  priorityGoal: Goal | null;
  recent: Transaction[];
}

const auth = true;
/** Después de cambiar datos financieros, todas estas vistas se recalculan. */
const refreshFinance = () => invalidate('dashboard', 'transactions', 'debts', 'debt:', 'goals', 'goal:', 'assistant');

// ── Panel ──
export const getDashboard = (month?: string) =>
  apiRequest<Dashboard>(`/dashboard${month ? `?month=${month}` : ''}`, { auth });

// ── Categorías ──
export const getCategories = () => apiRequest<{ categories: Category[] }>('/categories', { auth });

export async function createCategory(input: { name: string; kind: 'ingreso' | 'gasto'; color?: string; icon?: string }) {
  const result = await apiRequest<{ category: Category }>('/categories', { method: 'POST', body: input, auth });
  invalidate('categories');
  return result;
}

export async function deleteCategory(id: string) {
  await apiRequest<void>(`/categories/${id}`, { method: 'DELETE', auth });
  invalidate('categories');
}

// ── Movimientos ──
export interface MovementFilters {
  month?: string;
  type?: MovementType;
  categoryId?: string;
  q?: string;
  cursor?: string;
}

export function getTransactions(filters: MovementFilters = {}) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) if (value) params.set(key, value);
  const query = params.toString();
  return apiRequest<TransactionList>(`/transactions${query ? `?${query}` : ''}`, { auth });
}

export const getTransaction = (id: string) => apiRequest<{ transaction: Transaction }>(`/transactions/${id}`, { auth });

export interface MovementInput {
  type: MovementType;
  amount: number;
  date: string;
  categoryId?: string | null;
  description?: string | null;
  debtId?: string | null;
  goalId?: string | null;
  accountId?: string | null;
  source?: 'manual' | 'ocr' | 'recurrente';
  clientOpId?: string;
  confirmDuplicate?: boolean;
  /** RF-28: datos del recibo leído por OCR (sin la imagen) */
  receipt?: { merchant?: string | null; date?: string | null; total?: number | null } | null;
}

export async function createTransaction(input: MovementInput) {
  const result = await apiRequest<{ transaction: Transaction }>('/transactions', { method: 'POST', body: input, auth });
  refreshFinance();
  return result;
}

export async function updateTransaction(id: string, changes: Partial<Pick<MovementInput, 'amount' | 'date' | 'categoryId' | 'description'>>) {
  const result = await apiRequest<{ transaction: Transaction }>(`/transactions/${id}`, { method: 'PATCH', body: changes, auth });
  refreshFinance();
  return result;
}

export async function deleteTransaction(id: string) {
  await apiRequest<void>(`/transactions/${id}`, { method: 'DELETE', auth });
  refreshFinance();
}

// ── Deudas ──
export const getDebts = () =>
  apiRequest<{ debts: Debt[]; totals: { balance: number; monthlyInstallments: number; active: number } }>('/debts', { auth });

export const getDebt = (id: string) =>
  apiRequest<{ debt: Debt; payments: Transaction[]; totals: { paid: number; interest: number; principal: number } }>(`/debts/${id}`, { auth });

export interface DebtInput {
  creditor: string;
  name?: string | null;
  originalAmount: number;
  balance?: number;
  rate?: number | null;
  rateType?: 'EA' | 'MV' | null;
  installment?: number | null;
  termMonths?: number | null;
  paymentDay?: number | null;
}

export async function createDebt(input: DebtInput) {
  const result = await apiRequest<{ debt: Debt }>('/debts', { method: 'POST', body: input, auth });
  refreshFinance();
  return result;
}

export async function updateDebt(id: string, changes: Partial<Omit<DebtInput, 'originalAmount' | 'balance'>> & { status?: 'activa' | 'cancelada' }) {
  const result = await apiRequest<{ debt: Debt }>(`/debts/${id}`, { method: 'PATCH', body: changes, auth });
  refreshFinance();
  return result;
}

export async function deleteDebt(id: string) {
  await apiRequest<void>(`/debts/${id}`, { method: 'DELETE', auth });
  refreshFinance();
}

export async function payDebt(id: string, input: { amount: number; date?: string; clientOpId?: string }) {
  const result = await apiRequest<{ transaction: Transaction; debt: Debt }>(`/debts/${id}/payments`, { method: 'POST', body: input, auth });
  refreshFinance();
  return result;
}

// ── Metas ──
export const getGoals = () =>
  apiRequest<{ goals: Goal[]; allocation: Allocation; capacity: CapacityEstimate }>('/goals', { auth });

export const getGoal = (id: string) =>
  apiRequest<{ goal: Goal; movements: Transaction[] }>(`/goals/${id}`, { auth });

export interface GoalInput {
  name: string;
  targetAmount: number;
  targetDate?: string | null;
  priority?: 'alta' | 'media' | 'baja';
  icon?: string | null;
  isEmergencyFund?: boolean;
}

export async function createGoal(input: GoalInput & { initialSavedAmount?: number }) {
  const result = await apiRequest<{ goal: Goal }>('/goals', { method: 'POST', body: input, auth });
  refreshFinance();
  return result;
}

export async function updateGoal(id: string, changes: Partial<GoalInput> & { status?: 'activa' | 'pausada' | 'cancelada' }) {
  const result = await apiRequest<{ goal: Goal | null }>(`/goals/${id}`, { method: 'PATCH', body: changes, auth });
  refreshFinance();
  return result;
}

export async function deleteGoal(id: string) {
  await apiRequest<void>(`/goals/${id}`, { method: 'DELETE', auth });
  refreshFinance();
}

export async function moveGoal(id: string, input: { kind: 'aporte' | 'retiro'; amount: number; clientOpId?: string }) {
  const result = await apiRequest<{ transaction: Transaction; goal: Goal | null }>(`/goals/${id}/movements`, {
    method: 'POST',
    body: input,
    auth,
  });
  refreshFinance();
  return result;
}
