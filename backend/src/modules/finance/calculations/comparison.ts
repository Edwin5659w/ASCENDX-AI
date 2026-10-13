/**
 * Simulador: ahorrar vs financiar la compra de un bien.
 *
 * Calcula ambos caminos con los mismos supuestos y devuelve hechos
 * comparables (cuánto cuesta cada uno y cuándo se tendría el bien). No emite
 * una recomendación: la decisión es del usuario, y la IA solo explica.
 */
import { formatCop, assertNonNegative, assertPositive, assertPositiveInteger, roundCop } from './money.js';
import { summarizeLoan, type LoanSummary } from './loan.js';
import { effectiveAnnualToMonthly, monthlyToEffectiveAnnual, toMonthlyRate, type RateType } from './rates.js';
import { projectSavings } from './savings.js';

export interface ComparisonInput {
  /** Precio del bien hoy */
  assetPrice: number;
  /** Cuota inicial que se pagaría al financiar */
  downPayment: number;
  interestRate: number;
  rateType: RateType;
  termMonths: number;
  /** Cargos mensuales conocidos del crédito (seguros, cuota de manejo) */
  monthlyFees?: number;
  /** Lo que el usuario puede ahorrar cada mes */
  monthlySavingAmount: number;
  /** Ahorro que ya tiene disponible para este bien */
  currentSavings?: number;
  /** Aumento anual esperado del precio del bien (fracción). Por defecto 0. */
  annualPriceIncrease?: number;
  /** Ingreso mensual, para calcular qué parte se iría en la cuota (opcional) */
  monthlyIncome?: number;
}

export type WarningCode =
  | 'PAYMENT_EXCEEDS_SAVING_CAPACITY'
  | 'HIGH_INCOME_SHARE'
  | 'SAVING_NOT_REACHABLE'
  | 'DOWN_PAYMENT_NOT_AVAILABLE'
  | 'HIGH_RATE';

export interface ComparisonWarning {
  code: WarningCode;
  message: string;
}

export interface ComparisonResult {
  input: Required<Omit<ComparisonInput, 'monthlyIncome'>> & { monthlyIncome: number | null };
  financing: {
    financedAmount: number;
    monthlyRate: number;
    effectiveAnnualRate: number;
    loan: Omit<LoanSummary, 'schedule'>;
    schedule: LoanSummary['schedule'];
    /** Cuota inicial + cuotas + cargos */
    totalCost: number;
    /** Cuánto más que el precio de contado se paga */
    extraCostOverPrice: number;
    /** Meses hasta tener el bien (0 si la cuota inicial ya está disponible) */
    monthsUntilOwnership: number | null;
    /** Porción del ingreso mensual que se iría en cuota + cargos (0–1) */
    incomeShare: number | null;
  };
  saving: {
    monthsToSave: number | null;
    /** Precio que tendría el bien cuando se termine de ahorrar */
    priceAtPurchase: number;
    totalCost: number;
  };
  /** Diferencias positivas = financiar cuesta más / ahorrar tarda más */
  difference: {
    extraCostOfFinancing: number;
    monthsGainedByFinancing: number | null;
  };
  assumptions: string[];
  warnings: ComparisonWarning[];
  disclaimer: string;
}

export const SIMULATION_DISCLAIMER =
  'Esta simulación es una estimación educativa con los datos que ingresaste. No es una oferta ni una aprobación de crédito; ' +
  'las condiciones reales dependen de cada entidad financiera.';

/** Porción del ingreso a partir de la cual se advierte sobre la cuota (30 %). */
export const HIGH_INCOME_SHARE_THRESHOLD = 0.3;

export function compareSavingVsFinancing(rawInput: ComparisonInput): ComparisonResult {
  const input = {
    monthlyFees: 0,
    currentSavings: 0,
    annualPriceIncrease: 0,
    ...rawInput,
  };
  assertPositive(input.assetPrice, 'El precio del bien');
  assertNonNegative(input.downPayment, 'La cuota inicial');
  assertPositiveInteger(input.termMonths, 'El plazo');
  assertNonNegative(input.monthlySavingAmount, 'El ahorro mensual');
  assertNonNegative(input.currentSavings, 'El ahorro actual');
  assertNonNegative(input.annualPriceIncrease, 'El aumento anual del precio');
  if (input.downPayment > input.assetPrice) {
    throw new RangeError('La cuota inicial no puede ser mayor que el precio del bien');
  }

  const warnings: ComparisonWarning[] = [];

  // ── Camino 1: financiar ──
  const monthlyRate = toMonthlyRate(input.interestRate, input.rateType);
  const effectiveAnnualRate = monthlyToEffectiveAnnual(monthlyRate);
  const financedAmount = roundCop(input.assetPrice - input.downPayment);
  const { schedule, ...loan } = summarizeLoan(financedAmount, monthlyRate, input.termMonths, input.monthlyFees);
  const financingTotalCost = roundCop(input.downPayment) + loan.totalPaid;

  // Si la cuota inicial no está ahorrada, hay que ahorrarla primero.
  const missingDownPayment = Math.max(0, input.downPayment - input.currentSavings);
  const monthsUntilOwnership =
    missingDownPayment === 0
      ? 0
      : projectSavings({
          targetAmount: input.downPayment,
          currentAmount: input.currentSavings,
          monthlyContribution: input.monthlySavingAmount,
        }).months;
  if (missingDownPayment > 0) {
    warnings.push({
      code: 'DOWN_PAYMENT_NOT_AVAILABLE',
      message: `Aún te faltan ${formatCop(missingDownPayment)} para la cuota inicial.`,
    });
  }

  if (input.monthlySavingAmount > 0 && loan.monthlyOutflow > input.monthlySavingAmount) {
    warnings.push({
      code: 'PAYMENT_EXCEEDS_SAVING_CAPACITY',
      message: `La cuota mensual (${formatCop(loan.monthlyOutflow)}) supera lo que hoy puedes ahorrar al mes (${formatCop(input.monthlySavingAmount)}).`,
    });
  }

  const incomeShare = input.monthlyIncome && input.monthlyIncome > 0 ? loan.monthlyOutflow / input.monthlyIncome : null;
  if (incomeShare !== null && incomeShare > HIGH_INCOME_SHARE_THRESHOLD) {
    warnings.push({
      code: 'HIGH_INCOME_SHARE',
      message: `La cuota se llevaría el ${Math.round(incomeShare * 100)} % de tu ingreso mensual.`,
    });
  }

  if (effectiveAnnualRate > 0.35) {
    warnings.push({
      code: 'HIGH_RATE',
      message: 'La tasa ingresada es alta. Verifica que sea correcta y compárala con la tasa de usura vigente.',
    });
  }

  // ── Camino 2: ahorrar ──
  const monthlyPriceGrowth = input.annualPriceIncrease > 0 ? effectiveAnnualToMonthly(input.annualPriceIncrease) : 0;
  const savingProjection = projectSavings({
    targetAmount: input.assetPrice,
    currentAmount: input.currentSavings,
    monthlyContribution: input.monthlySavingAmount,
    monthlyTargetGrowthRate: monthlyPriceGrowth,
  });
  if (savingProjection.months === null) {
    warnings.push({
      code: 'SAVING_NOT_REACHABLE',
      message: 'Con el ahorro mensual indicado no se alcanza el precio del bien en un plazo razonable.',
    });
  }
  const savingTotalCost = savingProjection.finalTarget;

  const assumptions = [
    `Crédito con cuota fija (sistema francés) a ${input.termMonths} meses.`,
    `Tasa equivalente: ${(effectiveAnnualRate * 100).toFixed(2)} % E.A. (${(monthlyRate * 100).toFixed(4)} % mensual).`,
    input.monthlyFees > 0
      ? `Cargos mensuales del crédito: ${formatCop(input.monthlyFees)}.`
      : 'No se incluyeron seguros ni cargos adicionales del crédito.',
    input.annualPriceIncrease > 0
      ? `El precio del bien sube ${(input.annualPriceIncrease * 100).toFixed(1)} % al año mientras ahorras.`
      : 'El precio del bien se mantiene igual mientras ahorras.',
    'El ahorro no genera rendimientos (supuesto conservador).',
    'Los aportes de ahorro se hacen al final de cada mes.',
  ];

  return {
    input: { ...input, monthlyIncome: input.monthlyIncome ?? null },
    financing: {
      financedAmount,
      monthlyRate,
      effectiveAnnualRate,
      loan,
      schedule,
      totalCost: financingTotalCost,
      extraCostOverPrice: financingTotalCost - roundCop(input.assetPrice),
      monthsUntilOwnership,
      incomeShare,
    },
    saving: {
      monthsToSave: savingProjection.months,
      priceAtPurchase: savingProjection.finalTarget,
      totalCost: savingTotalCost,
    },
    difference: {
      extraCostOfFinancing: financingTotalCost - savingTotalCost,
      monthsGainedByFinancing:
        savingProjection.months !== null && monthsUntilOwnership !== null
          ? savingProjection.months - monthsUntilOwnership
          : null,
    },
    assumptions,
    warnings,
    disclaimer: SIMULATION_DISCLAIMER,
  };
}
