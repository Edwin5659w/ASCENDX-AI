import { describe, expect, it } from 'vitest';
import {
  addMonths,
  amortizationSchedule,
  compareSavingVsFinancing,
  effectiveAnnualToMonthly,
  estimateSavingCapacity,
  fixedMonthlyPayment,
  goalProgress,
  monthlyToEffectiveAnnual,
  monthsBetween,
  monthsToReachTarget,
  planGoal,
  projectSavings,
  requiredMonthlyContribution,
  roundCop,
  summarizeLoan,
  summarizePeriod,
  toMonthlyRate,
} from './index.js';

// Los valores esperados se verificaron de forma independiente con la fórmula
// del sistema francés (calculadora / Python).

describe('tasas', () => {
  it('convierte 24 % E.A. a mensual', () => {
    expect(effectiveAnnualToMonthly(0.24)).toBeCloseTo(0.0180875825, 9);
  });

  it('la conversión E.A. ↔ mensual es reversible', () => {
    expect(monthlyToEffectiveAnnual(effectiveAnnualToMonthly(0.185))).toBeCloseTo(0.185, 12);
  });

  it('una tasa mensual se usa tal cual', () => {
    expect(toMonthlyRate(0.015, 'MONTHLY')).toBe(0.015);
  });

  it('rechaza tasas negativas', () => {
    expect(() => toMonthlyRate(-0.1, 'EFFECTIVE_ANNUAL')).toThrow(RangeError);
  });
});

describe('crédito con cuota fija', () => {
  it('calcula la cuota de $10.000.000 al 1 % mensual a 12 meses', () => {
    expect(fixedMonthlyPayment(10_000_000, 0.01, 12)).toBeCloseTo(888_487.89, 2);
  });

  it('con tasa 0 divide el capital entre las cuotas', () => {
    expect(fixedMonthlyPayment(1_200_000, 0, 12)).toBe(100_000);
  });

  it('la tabla de amortización termina en saldo 0 y suma el capital exacto', () => {
    const schedule = amortizationSchedule(10_000_000, 0.01, 12);
    expect(schedule).toHaveLength(12);
    expect(schedule.at(-1)?.balance).toBe(0);
    expect(schedule.reduce((total, row) => total + row.principal, 0)).toBe(10_000_000);
    // El interés del primer mes es el 1 % del capital
    expect(schedule[0]?.interest).toBe(100_000);
  });

  it('resume intereses y total pagado', () => {
    const loan = summarizeLoan(10_000_000, 0.01, 12);
    expect(loan.monthlyPayment).toBe(888_488);
    expect(loan.totalInterest).toBe(661_853);
    expect(loan.totalPaid).toBe(10_661_853);
  });

  it('incluye los cargos mensuales en lo que sale del bolsillo', () => {
    const loan = summarizeLoan(10_000_000, 0.01, 12, 25_000);
    expect(loan.monthlyOutflow).toBe(888_488 + 25_000);
    expect(loan.totalFees).toBe(300_000);
    expect(loan.totalPaid).toBe(10_661_853 + 300_000);
  });

  it('rechaza plazos no enteros o en cero', () => {
    expect(() => fixedMonthlyPayment(1_000_000, 0.01, 0)).toThrow(RangeError);
    expect(() => fixedMonthlyPayment(1_000_000, 0.01, 6.5)).toThrow(RangeError);
  });
});

describe('ahorro', () => {
  it('calcula los meses para llegar a la meta sin rentabilidad', () => {
    // Faltan 4.000.000 ahorrando 500.000 → 8 meses
    expect(monthsToReachTarget(5_000_000, 1_000_000, 500_000)).toBe(8);
    // Si no es exacto, se redondea hacia arriba: 4.000.000 / 600.000 → 7 meses
    expect(monthsToReachTarget(5_000_000, 1_000_000, 600_000)).toBe(7);
  });

  it('devuelve 0 si la meta ya está cubierta', () => {
    expect(monthsToReachTarget(1_000_000, 1_500_000, 0)).toBe(0);
  });

  it('devuelve null si no hay aportes', () => {
    expect(monthsToReachTarget(1_000_000, 0, 0)).toBeNull();
  });

  it('la inflación del precio alarga el plazo', () => {
    const withoutInflation = projectSavings({ targetAmount: 6_000_000, currentAmount: 0, monthlyContribution: 500_000 });
    const withInflation = projectSavings({
      targetAmount: 6_000_000,
      currentAmount: 0,
      monthlyContribution: 500_000,
      monthlyTargetGrowthRate: effectiveAnnualToMonthly(0.1),
    });
    expect(withoutInflation.months).toBe(12);
    expect(withInflation.months).toBeGreaterThan(12);
    expect(withInflation.finalTarget).toBeGreaterThan(6_000_000);
  });

  it('calcula el aporte mensual necesario redondeando hacia arriba', () => {
    expect(requiredMonthlyContribution(1_000_000, 3)).toBe(333_334);
    expect(requiredMonthlyContribution(0, 3)).toBe(0);
  });
});

describe('flujo de caja y capacidad de ahorro', () => {
  it('resume un periodo', () => {
    const summary = summarizePeriod([
      { type: 'INCOME', amount: 3_000_000 },
      { type: 'EXPENSE', amount: 1_200_000 },
      { type: 'EXPENSE', amount: 600_000 },
    ]);
    expect(summary).toEqual({ income: 3_000_000, expenses: 1_800_000, net: 1_200_000, savingsRate: 0.4 });
  });

  it('sin ingresos la tasa de ahorro es null', () => {
    expect(summarizePeriod([{ type: 'EXPENSE', amount: 100 }]).savingsRate).toBeNull();
  });

  it('estima la capacidad como el promedio neto y nunca negativa', () => {
    const months = [
      summarizePeriod([{ type: 'INCOME', amount: 3_000_000 }, { type: 'EXPENSE', amount: 2_000_000 }]),
      summarizePeriod([{ type: 'INCOME', amount: 3_000_000 }, { type: 'EXPENSE', amount: 2_600_000 }]),
      summarizePeriod([{ type: 'INCOME', amount: 3_000_000 }, { type: 'EXPENSE', amount: 2_300_000 }]),
    ];
    const estimate = estimateSavingCapacity(months);
    expect(estimate.monthlyCapacity).toBe(700_000);
    expect(estimate.worstMonthNet).toBe(400_000);
    expect(estimate.confidence).toBe('MEDIUM');

    const withNewDebt = estimateSavingCapacity(months, 900_000);
    expect(withNewDebt.averageNet).toBe(-200_000);
    expect(withNewDebt.monthlyCapacity).toBe(0);
  });

  it('sin meses registrados indica datos insuficientes', () => {
    expect(estimateSavingCapacity([]).confidence).toBe('INSUFFICIENT');
  });
});

describe('metas', () => {
  const today = new Date(Date.UTC(2026, 9, 13)); // 13-oct-2026

  it('calcula el progreso y lo limita a 100 %', () => {
    expect(goalProgress(10_000_000, 1_000_000, 1_500_000)).toEqual({
      saved: 2_500_000,
      remaining: 7_500_000,
      percent: 25,
      completed: false,
    });
    expect(goalProgress(1_000_000, 0, 1_200_000).percent).toBe(100);
  });

  it('cuenta meses calendario completos', () => {
    expect(monthsBetween(new Date(Date.UTC(2026, 0, 15)), new Date(Date.UTC(2026, 3, 15)))).toBe(3);
    expect(monthsBetween(new Date(Date.UTC(2026, 0, 15)), new Date(Date.UTC(2026, 3, 14)))).toBe(2);
  });

  it('suma meses ajustando fin de mes', () => {
    expect(addMonths(new Date(Date.UTC(2026, 0, 31)), 1).toISOString().slice(0, 10)).toBe('2026-02-28');
  });

  it('meta a tiempo vs en riesgo', () => {
    const base = {
      targetAmount: 6_000_000,
      initialAmount: 0,
      contributions: 0,
      targetDate: new Date(Date.UTC(2027, 9, 13)), // 12 meses
      today,
    };
    const onTrack = planGoal({ ...base, plannedMonthlyContribution: 500_000 });
    expect(onTrack.status).toBe('ON_TRACK');
    expect(onTrack.projectedMonths).toBe(12);
    expect(onTrack.requiredMonthly).toBe(500_000);

    const atRisk = planGoal({ ...base, plannedMonthlyContribution: 400_000 });
    expect(atRisk.status).toBe('AT_RISK');
    expect(atRisk.projectedMonths).toBe(15);
  });

  it('detecta metas completas, sin aporte, sin fecha y con fecha vencida', () => {
    const base = { targetAmount: 1_000_000, initialAmount: 0, contributions: 0, today };
    expect(planGoal({ ...base, contributions: 1_000_000, plannedMonthlyContribution: 0 }).status).toBe('COMPLETED');
    expect(planGoal({ ...base, plannedMonthlyContribution: 0 }).status).toBe('NO_CONTRIBUTION');
    expect(planGoal({ ...base, plannedMonthlyContribution: 100_000 }).status).toBe('NO_TARGET_DATE');
    expect(
      planGoal({ ...base, plannedMonthlyContribution: 100_000, targetDate: new Date(Date.UTC(2026, 8, 1)) }).status,
    ).toBe('DATE_PASSED');
  });

  it('una fecha futura a menos de un mes cuenta como 1 mes', () => {
    const plan = planGoal({
      targetAmount: 1_000_000,
      initialAmount: 0,
      contributions: 0,
      plannedMonthlyContribution: 1_000_000,
      targetDate: new Date(Date.UTC(2026, 9, 30)),
      today,
    });
    expect(plan.monthsUntilTargetDate).toBe(1);
    expect(plan.status).toBe('ON_TRACK');
  });
});

describe('simulador ahorro vs financiación', () => {
  const carro = {
    assetPrice: 60_000_000,
    downPayment: 12_000_000,
    interestRate: 0.18,
    rateType: 'EFFECTIVE_ANNUAL' as const,
    termMonths: 48,
    monthlySavingAmount: 1_500_000,
    currentSavings: 12_000_000,
  };

  it('calcula el camino de financiación', () => {
    const result = compareSavingVsFinancing(carro);
    expect(result.financing.financedAmount).toBe(48_000_000);
    expect(result.financing.loan.monthlyPayment).toBe(roundCop(1_376_764.437));
    expect(result.financing.monthsUntilOwnership).toBe(0);
    expect(result.financing.totalCost).toBe(12_000_000 + result.financing.loan.totalPaid);
    expect(result.financing.extraCostOverPrice).toBe(result.financing.loan.totalInterest);
  });

  it('calcula el camino de ahorro y las diferencias', () => {
    const result = compareSavingVsFinancing(carro);
    // Faltan 48.000.000 ahorrando 1.500.000 → 32 meses
    expect(result.saving.monthsToSave).toBe(32);
    expect(result.saving.totalCost).toBe(60_000_000);
    expect(result.difference.monthsGainedByFinancing).toBe(32);
    expect(result.difference.extraCostOfFinancing).toBe(result.financing.loan.totalInterest);
  });

  it('advierte cuando la cuota supera la capacidad de ahorro o una parte alta del ingreso', () => {
    const result = compareSavingVsFinancing({ ...carro, monthlySavingAmount: 1_000_000, monthlyIncome: 3_500_000 });
    const codes = result.warnings.map((w) => w.code);
    expect(codes).toContain('PAYMENT_EXCEEDS_SAVING_CAPACITY');
    expect(codes).toContain('HIGH_INCOME_SHARE');
  });

  it('advierte si falta la cuota inicial y calcula cuándo se tendría', () => {
    const result = compareSavingVsFinancing({ ...carro, currentSavings: 6_000_000 });
    expect(result.warnings.map((w) => w.code)).toContain('DOWN_PAYMENT_NOT_AVAILABLE');
    expect(result.financing.monthsUntilOwnership).toBe(4);
  });

  it('siempre incluye supuestos y la advertencia legal', () => {
    const result = compareSavingVsFinancing(carro);
    expect(result.assumptions.length).toBeGreaterThan(3);
    expect(result.disclaimer).toMatch(/no es una oferta/i);
  });

  it('es determinista', () => {
    expect(compareSavingVsFinancing(carro)).toEqual(compareSavingVsFinancing(carro));
  });

  it('rechaza una cuota inicial mayor que el precio', () => {
    expect(() => compareSavingVsFinancing({ ...carro, downPayment: 70_000_000 })).toThrow(RangeError);
  });
});
