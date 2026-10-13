import { apiRequest } from '@/lib/api';

export type RateType = 'EFFECTIVE_ANNUAL' | 'MONTHLY';

export interface CompareInput {
  assetPrice: number;
  downPayment: number;
  interestRate: number;
  rateType: RateType;
  termMonths: number;
  monthlyFees?: number;
  monthlySavingAmount: number;
  currentSavings?: number;
}

/** Forma de la respuesta de POST /simulator/compare (ver docs/api.md). */
export interface CompareResult {
  financing: {
    financedAmount: number;
    effectiveAnnualRate: number;
    monthlyRate: number;
    loan: {
      monthlyPayment: number;
      monthlyOutflow: number;
      totalInterest: number;
      totalFees: number;
      totalPaid: number;
      termMonths: number;
    };
    totalCost: number;
    extraCostOverPrice: number;
    monthsUntilOwnership: number | null;
  };
  saving: {
    monthsToSave: number | null;
    priceAtPurchase: number;
    totalCost: number;
  };
  difference: {
    extraCostOfFinancing: number;
    monthsGainedByFinancing: number | null;
  };
  assumptions: string[];
  warnings: { code: string; message: string }[];
  disclaimer: string;
}

export function compareSavingVsFinancing(input: CompareInput) {
  return apiRequest<CompareResult>('/simulator/compare', { method: 'POST', body: input, auth: true });
}
