import { apiRequest } from '@/lib/api';
import { invalidate } from '@/lib/query';

const auth = true;

// ── Movimientos recurrentes (RF-30) ──
export type Frequency = 'semanal' | 'quincenal' | 'mensual';

export interface RecurringRule {
  id: string;
  type: 'ingreso' | 'gasto';
  amount: number;
  description: string | null;
  frequency: Frequency;
  anchorDay: number | null;
  nextDate: string;
  active: boolean;
  category: { id: string; name: string; icon: string | null; color: string | null } | null;
  account: { id: string; name: string } | null;
}

export const FREQUENCY_LABELS: Record<Frequency, string> = { semanal: 'Cada semana', quincenal: 'Cada quincena', mensual: 'Cada mes' };

export const getRecurring = () => apiRequest<{ rules: RecurringRule[]; monthly: { income: number; expenses: number } }>('/recurring', { auth });

const refresh = () => invalidate('recurring', 'dashboard', 'transactions', 'accounts', 'habits');

export async function createRecurring(input: {
  type: 'ingreso' | 'gasto';
  amount: number;
  categoryId: string;
  description?: string | null;
  frequency: Frequency;
  startDate: string;
  accountId?: string | null;
}) {
  const result = await apiRequest<{ rule: RecurringRule; created: number }>('/recurring', { method: 'POST', body: input, auth });
  refresh();
  return result;
}

export async function updateRecurring(id: string, changes: Partial<{ amount: number; active: boolean; nextDate: string; description: string | null }>) {
  const result = await apiRequest<{ rule: RecurringRule; created: number }>(`/recurring/${id}`, { method: 'PATCH', body: changes, auth });
  refresh();
  return result;
}

export async function deleteRecurring(id: string) {
  await apiRequest<void>(`/recurring/${id}`, { method: 'DELETE', auth });
  invalidate('recurring');
}

// ── Racha y logros (RF-32) ──
export interface Achievement {
  code: string;
  title: string;
  description: string;
  icon: string;
  target: number;
  current: number;
  earned: boolean;
  earnedAt: string | null;
}

export interface Habits {
  streak: { current: number; best: number; activeThisWeek: boolean };
  achievements: Achievement[];
  earnedCount: number;
  newlyEarned: string[];
}

export const getHabits = () => apiRequest<Habits>('/habits', { auth });
