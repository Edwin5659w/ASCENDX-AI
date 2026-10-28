import type { RateType, SimulationResult } from '@ascendx/finance-core';
import { apiRequest } from '@/lib/api';
import { invalidate } from '@/lib/query';

export type { RateType };

export interface CompareInput {
  price: number;
  downPayment: number;
  currentSavings: number;
  monthlySaving: number;
  rate: number;
  rateType: RateType;
  termMonths: number;
  monthlyFees?: number;
  oneTimeFees?: number;
}

/** Respuesta de POST /simulator/compare: el resultado de finance-core sin la tabla de amortización. */
type WithoutSchedule<T> = Omit<T, 'schedule'>;
export type CompareResult = Omit<SimulationResult, 'credit' | 'mixed'> & {
  credit: WithoutSchedule<SimulationResult['credit']>;
  mixed: WithoutSchedule<NonNullable<SimulationResult['mixed']>> | null;
};

export function compareScenarios(input: CompareInput) {
  return apiRequest<CompareResult>('/simulator/compare', { method: 'POST', body: input, auth: true });
}

export interface SavedScenario {
  id: string;
  name: string;
  goalId: string | null;
  input: CompareInput;
  results: CompareResult;
  engineVersion: string;
  createdAt: string;
}

/** RF-22: guardar y consultar escenarios. */
export async function saveScenario(input: { name: string; goalId?: string | null; input: CompareInput }) {
  const result = await apiRequest<{ scenario: SavedScenario }>('/simulator/scenarios', { method: 'POST', body: input, auth: true });
  invalidate('scenarios');
  return result;
}

export const getScenarios = () => apiRequest<{ scenarios: SavedScenario[] }>('/simulator/scenarios', { auth: true });

export const getScenario = (id: string) => apiRequest<{ scenario: SavedScenario }>(`/simulator/scenarios/${id}`, { auth: true });

export async function deleteScenario(id: string) {
  await apiRequest<void>(`/simulator/scenarios/${id}`, { method: 'DELETE', auth: true });
  invalidate('scenarios');
}
