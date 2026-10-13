import type { RateType, SimulationResult } from '@ascendx/finance-core';
import { apiRequest } from '@/lib/api';

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
