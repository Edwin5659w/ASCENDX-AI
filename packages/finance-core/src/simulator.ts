/**
 * Simulador ahorro vs. crédito vs. mixto (sección 6.4).
 *
 * - Crédito: comprar hoy con la cuota inicial que ya se tiene y financiar el resto.
 * - Ahorro: ahorrar hasta reunir el precio completo.
 * - Mixto: ahorrar k meses hasta reunir la cuota inicial deseada y financiar el resto.
 *
 * No recomienda un camino: devuelve hechos comparables, supuestos y avisos.
 */
import { summarizeLoan, type AmortizationRow, MAX_TERM_MONTHS } from './loan.js';
import { assertIntegerInRange, assertNonNegative, assertPositive, formatCop, formatPercent, roundPesos } from './money.js';
import { assertRateWithinLimit, toEffectiveAnnualRate, toMonthlyRate, type RateType } from './rates.js';

/** Versión del motor; se guarda con cada escenario (credit_scenarios.engine_version). */
export const ENGINE_VERSION = '2.0.0';

export const SIMULATION_DISCLAIMER =
  'Simulación aproximada. No es una oferta ni una aprobación de crédito; la entidad puede aplicar otros cargos.';

export interface UsuryReference {
  /** Tasa de usura efectiva anual (fracción) */
  effectiveAnnualRate: number;
  /** Fecha de vigencia «AAAA-MM-DD», se actualiza a mano */
  validFrom: string;
}

export interface SimulationInput {
  /** Precio del bien hoy */
  price: number;
  /** Cuota inicial deseada al financiar */
  downPayment: number;
  /** Ahorro disponible hoy para este bien */
  currentSavings: number;
  /** Lo que se puede ahorrar cada mes */
  monthlySaving: number;
  rate: number;
  rateType: RateType;
  termMonths: number;
  /** Seguros y cargos mensuales conocidos */
  monthlyFees?: number;
  /** Cargos únicos (estudio de crédito, avalúo…) */
  oneTimeFees?: number;
  usury?: UsuryReference | null;
}

export interface CreditPath {
  downPayment: number;
  financedAmount: number;
  installment: number;
  /** Cuota + cargos mensuales */
  monthlyOutflow: number;
  totalInterest: number;
  /** Cuota inicial + cuotas + cargos mensuales × n + cargos únicos */
  totalPaid: number;
  /** Total pagado − precio */
  extraCost: number;
  /** Meses hasta tener el bien */
  monthsToOwnership: number | null;
  schedule: AmortizationRow[];
}

export interface SavingPath {
  /** ⌈(precio − ahorro actual) ÷ aporte mensual⌉; null si no hay aporte */
  months: number | null;
  totalPaid: number;
}

export type WarningCode =
  | 'USURY_EXCEEDED'
  | 'PAYMENT_EXCEEDS_SAVING'
  | 'SAVING_NOT_POSSIBLE'
  | 'DOWN_PAYMENT_NOT_AVAILABLE';

export interface SimulationResult {
  engineVersion: string;
  monthlyRate: number;
  effectiveAnnualRate: number;
  credit: CreditPath;
  saving: SavingPath;
  /** null si la cuota inicial ya está disponible (sería igual al crédito) */
  mixed: CreditPath | null;
  warnings: { code: WarningCode; message: string }[];
  assumptions: string[];
  disclaimer: string;
}

function validate(input: SimulationInput) {
  assertPositive(input.price, 'El precio');
  assertNonNegative(input.downPayment, 'La cuota inicial');
  assertNonNegative(input.currentSavings, 'El ahorro actual');
  assertNonNegative(input.monthlySaving, 'El ahorro mensual');
  assertNonNegative(input.monthlyFees ?? 0, 'Los cargos mensuales');
  assertNonNegative(input.oneTimeFees ?? 0, 'Los cargos únicos');
  assertIntegerInRange(input.termMonths, 1, MAX_TERM_MONTHS, 'El plazo');
  assertRateWithinLimit(input.rate, input.rateType);
  if (input.downPayment > input.price) throw new RangeError('La cuota inicial no puede ser mayor que el precio');
}

function monthsToSave(target: number, current: number, monthly: number): number | null {
  const missing = target - current;
  if (missing <= 0) return 0;
  if (monthly <= 0) return null;
  return Math.ceil(missing / monthly);
}

function creditPath(
  price: number,
  downPayment: number,
  monthlyRate: number,
  input: SimulationInput,
  monthsToOwnership: number | null,
): CreditPath {
  const monthlyFees = roundPesos(input.monthlyFees ?? 0);
  const oneTimeFees = roundPesos(input.oneTimeFees ?? 0);
  const financedAmount = roundPesos(price - downPayment);
  const loan = summarizeLoan(financedAmount, monthlyRate, input.termMonths);
  const totalPaid = roundPesos(downPayment) + loan.totalInstallments + monthlyFees * input.termMonths + oneTimeFees;
  return {
    downPayment: roundPesos(downPayment),
    financedAmount,
    installment: loan.installment,
    monthlyOutflow: loan.installment + monthlyFees,
    totalInterest: loan.totalInterest,
    totalPaid,
    extraCost: totalPaid - roundPesos(price),
    monthsToOwnership,
    schedule: loan.schedule,
  };
}

export function simulatePurchase(input: SimulationInput): SimulationResult {
  validate(input);
  const monthlyRate = toMonthlyRate(input.rate, input.rateType);
  const effectiveAnnualRate = toEffectiveAnnualRate(input.rate, input.rateType);
  const warnings: SimulationResult['warnings'] = [];

  // Crédito hoy: la cuota inicial es lo que ya se tiene (hasta la cuota deseada).
  const availableDownPayment = Math.min(input.downPayment, input.currentSavings);
  const credit = creditPath(input.price, availableDownPayment, monthlyRate, input, 0);

  // Ahorro: reunir el precio completo.
  const savingMonths = monthsToSave(input.price, input.currentSavings, input.monthlySaving);
  const saving: SavingPath = { months: savingMonths, totalPaid: roundPesos(input.price) };

  // Mixto: solo tiene sentido si aún falta parte de la cuota inicial deseada.
  const mixed =
    input.currentSavings < input.downPayment
      ? creditPath(
          input.price,
          input.downPayment,
          monthlyRate,
          input,
          monthsToSave(input.downPayment, input.currentSavings, input.monthlySaving),
        )
      : null;

  if (mixed) {
    warnings.push({
      code: 'DOWN_PAYMENT_NOT_AVAILABLE',
      message: `Hoy tienes ${formatCop(input.currentSavings)} de los ${formatCop(input.downPayment)} de cuota inicial que quieres dar.`,
    });
  }
  if (input.usury && effectiveAnnualRate > input.usury.effectiveAnnualRate) {
    warnings.push({
      code: 'USURY_EXCEEDED',
      message: `La tasa (${formatPercent(effectiveAnnualRate)} E.A.) supera la tasa de usura de referencia (${formatPercent(input.usury.effectiveAnnualRate)} E.A., vigente desde ${input.usury.validFrom}). Verifícala con la entidad.`,
    });
  }
  if (input.monthlySaving > 0 && credit.monthlyOutflow > input.monthlySaving) {
    warnings.push({
      code: 'PAYMENT_EXCEEDS_SAVING',
      message: `La cuota mensual (${formatCop(credit.monthlyOutflow)}) supera lo que hoy puedes ahorrar al mes (${formatCop(input.monthlySaving)}).`,
    });
  }
  if (savingMonths === null) {
    warnings.push({
      code: 'SAVING_NOT_POSSIBLE',
      message: 'Sin un ahorro mensual no se puede calcular cuánto tardarías en reunir el precio.',
    });
  }

  const assumptions = [
    `Crédito con cuota fija (sistema francés) a ${input.termMonths} meses.`,
    `Tasa equivalente: ${formatPercent(effectiveAnnualRate)} E.A. (${formatPercent(monthlyRate, 4)} mensual).`,
    (input.monthlyFees ?? 0) > 0 || (input.oneTimeFees ?? 0) > 0
      ? `Incluye cargos mensuales de ${formatCop(input.monthlyFees ?? 0)} y cargos únicos de ${formatCop(input.oneTimeFees ?? 0)}.`
      : 'No se incluyeron seguros ni otros cargos del crédito.',
    'El precio del bien se mantiene igual mientras ahorras.',
    'El ahorro no genera rendimientos y los aportes se hacen al final de cada mes.',
  ];

  return {
    engineVersion: ENGINE_VERSION,
    monthlyRate,
    effectiveAnnualRate,
    credit,
    saving,
    mixed,
    warnings,
    assumptions,
    disclaimer: SIMULATION_DISCLAIMER,
  };
}
