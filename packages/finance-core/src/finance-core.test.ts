import { describe, expect, it } from 'vitest';
import {
  addMonths,
  allocateGoals,
  amortizationSchedule,
  applyGoalMovement,
  assertIntegerInRange,
  availableEffect,
  compareDates,
  countsAsExpense,
  debtLoad,
  effectiveAnnualToMonthly,
  emergencyFundMonths,
  estimateSavingCapacity,
  expensesByCategory,
  fixedInstallment,
  formatCop,
  formatPercent,
  goalProgress,
  isPossibleDuplicate,
  monthlyIndicators,
  monthlyToEffectiveAnnual,
  monthsBetween,
  parseCalendarDate,
  previousCompletedMonths,
  requiredMonthlyContribution,
  roundPesos,
  simulatePurchase,
  summarizeLoan,
  toEffectiveAnnualRate,
  toMonthlyRate,
  todayInBogota,
  type SimulationInput,
} from './index.js';

// Los valores esperados de cuotas e intereses se verificaron de forma
// independiente con la fórmula del sistema francés (Python / hoja de cálculo).

describe('dinero y formato', () => {
  it('redondea al peso sin producir -0', () => {
    expect(roundPesos(1234.5)).toBe(1235);
    expect(Object.is(roundPesos(-0.2), 0)).toBe(true);
  });

  it('formatea pesos y porcentajes en español de Colombia', () => {
    expect(formatCop(1250000).replace(/\s/g, ' ')).toBe('$ 1.250.000');
    expect(formatPercent(0.185)).toBe('18,50 %');
  });

  it('valida enteros en rango', () => {
    expect(() => assertIntegerInRange(0, 1, 10, 'X')).toThrow(RangeError);
    expect(() => assertIntegerInRange(2.5, 1, 10, 'X')).toThrow(RangeError);
    expect(() => assertIntegerInRange(5, 1, 10, 'X')).not.toThrow();
  });
});

describe('tasas (6.4, RF-21)', () => {
  it('convierte E.A. a mensual con error menor a 0,0001 %', () => {
    expect(Math.abs(effectiveAnnualToMonthly(0.24) - 0.018087582483510722)).toBeLessThan(1e-6);
  });

  it('la conversión es reversible', () => {
    expect(monthlyToEffectiveAnnual(effectiveAnnualToMonthly(0.185))).toBeCloseTo(0.185, 12);
    expect(toEffectiveAnnualRate(0.015, 'MV')).toBeCloseTo(Math.pow(1.015, 12) - 1, 12);
    expect(toEffectiveAnnualRate(0.2, 'EA')).toBe(0.2);
    expect(toMonthlyRate(0.015, 'MV')).toBe(0.015);
  });

  it('rechaza tasas negativas', () => {
    expect(() => toMonthlyRate(-0.01, 'MV')).toThrow(RangeError);
    expect(() => effectiveAnnualToMonthly(Number.NaN)).toThrow(RangeError);
  });
});

describe('fechas en Bogotá (6.5)', () => {
  it('calcula hoy en Bogotá aunque en UTC ya sea el día siguiente', () => {
    // 13-oct-2026 02:00 UTC = 12-oct-2026 21:00 en Bogotá
    expect(todayInBogota(new Date('2026-10-13T02:00:00Z'))).toBe('2026-10-12');
  });

  it('suma meses ajustando fin de mes y cruza años', () => {
    expect(addMonths('2026-01-31', 1)).toBe('2026-02-28');
    expect(addMonths('2028-01-31', 1)).toBe('2028-02-29');
    expect(addMonths('2026-11-15', 3)).toBe('2027-02-15');
    expect(addMonths('2026-02-15', -3)).toBe('2025-11-15');
  });

  it('cuenta meses completos', () => {
    expect(monthsBetween('2026-01-15', '2026-04-15')).toBe(3);
    expect(monthsBetween('2026-01-15', '2026-04-14')).toBe(2);
    expect(monthsBetween('2026-05-01', '2026-01-01')).toBe(0);
  });

  it('lista los meses completos anteriores', () => {
    expect(previousCompletedMonths('2026-10-13', 3)).toEqual(['2026-07', '2026-08', '2026-09']);
    expect(previousCompletedMonths('2026-01-05', 2)).toEqual(['2025-11', '2025-12']);
  });

  it('valida fechas', () => {
    expect(() => parseCalendarDate('2026-02-30')).toThrow(RangeError);
    expect(() => parseCalendarDate('13/10/2026')).toThrow(RangeError);
    expect(compareDates('2026-01-01', '2026-01-02')).toBe(-1);
    expect(compareDates('2026-01-02', '2026-01-01')).toBe(1);
    expect(compareDates('2026-01-01', '2026-01-01')).toBe(0);
  });
});

describe('tipos de movimiento e indicadores (6.1, 6.2)', () => {
  const month = [
    { type: 'ingreso' as const, amount: 3_000_000 },
    { type: 'gasto' as const, amount: 1_200_000 },
    { type: 'gasto' as const, amount: 300_000 },
    { type: 'pago_deuda' as const, amount: 400_000 },
    { type: 'aporte_meta' as const, amount: 500_000 },
    { type: 'retiro_meta' as const, amount: 100_000 },
  ];

  it('calcula flujo neto y disponible sin contar dos veces', () => {
    expect(monthlyIndicators(month)).toEqual({
      income: 3_000_000,
      expenses: 1_500_000,
      debtPayments: 400_000,
      netGoalContributions: 400_000,
      netFlow: 1_100_000, // 3.000.000 − 1.500.000 − 400.000
      available: 700_000, // 1.100.000 − 400.000
    });
  });

  it('solo el gasto cuenta como gasto y el efecto sobre el disponible depende del tipo', () => {
    expect(countsAsExpense('gasto')).toBe(true);
    expect(countsAsExpense('pago_deuda')).toBe(false);
    expect(countsAsExpense('aporte_meta')).toBe(false);
    expect(availableEffect('ingreso')).toBe(1);
    expect(availableEffect('retiro_meta')).toBe(1);
    expect(availableEffect('gasto')).toBe(-1);
    expect(availableEffect('aporte_meta')).toBe(-1);
  });

  it('rechaza montos no positivos', () => {
    expect(() => monthlyIndicators([{ type: 'gasto', amount: 0 }])).toThrow(RangeError);
  });

  it('agrupa gastos por categoría ignorando otros tipos', () => {
    expect(
      expensesByCategory([
        { type: 'gasto', amount: 100, categoryId: 'mercado' },
        { type: 'gasto', amount: 300, categoryId: 'transporte' },
        { type: 'gasto', amount: 50, categoryId: 'mercado' },
        { type: 'pago_deuda', amount: 999, categoryId: 'deuda' },
      ]),
    ).toEqual([
      { categoryId: 'transporte', total: 300 },
      { categoryId: 'mercado', total: 150 },
    ]);
  });

  it('detecta posibles duplicados en menos de 2 minutos (RF-09)', () => {
    const base = { type: 'gasto' as const, amount: 25_000, categoryId: 'cafe', createdAt: new Date('2026-10-13T10:00:00Z') };
    expect(isPossibleDuplicate({ ...base, createdAt: new Date('2026-10-13T10:01:30Z') }, [base])).toBe(true);
    expect(isPossibleDuplicate({ ...base, createdAt: new Date('2026-10-13T10:02:00Z') }, [base])).toBe(false);
    expect(isPossibleDuplicate({ ...base, amount: 26_000 }, [base])).toBe(false);
    expect(isPossibleDuplicate({ ...base, categoryId: 'otro' }, [base])).toBe(false);
  });
});

describe('capacidad de ahorro (6.2, RF-14)', () => {
  it('usa los últimos 3 meses completos y aplica el margen prudente del 80 %', () => {
    const estimate = estimateSavingCapacity({
      completedMonths: [{ netFlow: 5_000_000 }, { netFlow: 900_000 }, { netFlow: 1_200_000 }, { netFlow: 600_000 }],
    });
    expect(estimate.base).toBe('historial');
    expect(estimate.monthsUsed).toBe(3);
    expect(estimate.capacity).toBe(900_000); // promedio de los 3 últimos
    expect(estimate.prudentCapacity).toBe(720_000);
    expect(estimate.alert).toBe(false);
  });

  it('marca la estimación con pocos datos si hay 1 o 2 meses', () => {
    const one = estimateSavingCapacity({ completedMonths: [{ netFlow: 1_000_000 }] });
    expect(one.base).toBe('pocos_datos');
    expect(one.explanation).toMatch(/1 mes completo/);
    const two = estimateSavingCapacity({ completedMonths: [{ netFlow: 1_000_000 }, { netFlow: 500_000 }] });
    expect(two.capacity).toBe(750_000);
    expect(two.explanation).toMatch(/2 meses completos/);
  });

  it('sin meses completos usa el perfil: ingreso − gastos fijos − cuotas', () => {
    const estimate = estimateSavingCapacity({
      completedMonths: [],
      profile: { estimatedIncome: 3_500_000, estimatedFixedExpenses: 2_000_000 },
      monthlyDebtInstallments: 500_000,
    });
    expect(estimate.base).toBe('perfil');
    expect(estimate.capacity).toBe(1_000_000);
    expect(estimate.prudentCapacity).toBe(800_000);
  });

  it('si CA ≤ 0 no propone aportes y alerta', () => {
    const estimate = estimateSavingCapacity({ completedMonths: [{ netFlow: -200_000 }] });
    expect(estimate.prudentCapacity).toBe(0);
    expect(estimate.alert).toBe(true);
  });

  it('sin datos ni perfil lo indica', () => {
    expect(estimateSavingCapacity({ completedMonths: [] }).base).toBe('sin_datos');
  });

  it('acepta un margen configurable y valida su rango', () => {
    expect(estimateSavingCapacity({ completedMonths: [{ netFlow: 1_000_000 }], safetyMargin: 0.5 }).prudentCapacity).toBe(500_000);
    expect(() => estimateSavingCapacity({ completedMonths: [], safetyMargin: 1.5 })).toThrow(RangeError);
  });
});

describe('carga de deuda y fondo de emergencia (6.2)', () => {
  it('clasifica la carga de deuda', () => {
    expect(debtLoad(500_000, 2_000_000)).toEqual({ ratio: 0.25, level: 'verde' });
    expect(debtLoad(700_000, 2_000_000)?.level).toBe('amarillo');
    expect(debtLoad(800_000, 2_000_000)?.level).toBe('amarillo'); // 40 % exacto
    expect(debtLoad(900_000, 2_000_000)?.level).toBe('rojo');
    expect(debtLoad(100_000, 0)).toBeNull();
  });

  it('calcula los meses cubiertos por el fondo de emergencia', () => {
    expect(emergencyFundMonths(3_000_000, 2_000_000)).toBe(1.5);
    expect(emergencyFundMonths(1_000_000, 0)).toBeNull();
  });
});

describe('metas múltiples (6.3)', () => {
  const today = '2026-10-13';

  it('calcula progreso e hitos', () => {
    expect(goalProgress(10_000_000, 5_200_000)).toEqual({
      saved: 5_200_000,
      remaining: 4_800_000,
      percent: 52,
      completed: false,
      milestones: [25, 50],
    });
    expect(goalProgress(0, 0).percent).toBe(100);
    expect(goalProgress(1_000_000, 1_500_000).milestones).toEqual([25, 50, 75, 100]);
  });

  it('aplica aportes y no permite retiros que dejen la meta en negativo (RF-17)', () => {
    expect(applyGoalMovement(100_000, 50_000, 'aporte')).toBe(150_000);
    expect(applyGoalMovement(100_000, 100_000, 'retiro')).toBe(0);
    expect(() => applyGoalMovement(100_000, 100_001, 'retiro')).toThrow(RangeError);
    expect(() => applyGoalMovement(100_000, 0, 'aporte')).toThrow(RangeError);
  });

  it('calcula el aporte requerido redondeando hacia arriba', () => {
    expect(requiredMonthlyContribution(1_000_000, 3)).toBe(333_334);
    expect(requiredMonthlyContribution(0, 3)).toBe(0);
    expect(() => requiredMonthlyContribution(100, 0)).toThrow(RangeError);
  });

  it('si la capacidad alcanza, todas las metas están en curso', () => {
    const result = allocateGoals(
      [
        { id: 'moto', targetAmount: 6_000_000, savedAmount: 0, priority: 'media', targetDate: '2027-10-13' },
        { id: 'pc', targetAmount: 3_000_000, savedAmount: 600_000, priority: 'baja', targetDate: '2027-04-13' },
      ],
      1_000_000,
      today,
    );
    expect(result.allOnTrack).toBe(true);
    expect(result.totalRequired).toBe(500_000 + 400_000);
    expect(result.unassigned).toBe(100_000);
    expect(result.plans.map((p) => p.status)).toEqual(['en_curso', 'en_curso']);
    expect(result.plans[0]?.projectedDate).toBe('2027-10-13');
  });

  it('si no alcanza, reparte por prioridad y luego por fecha y marca metas en riesgo con dos sugerencias', () => {
    const result = allocateGoals(
      [
        { id: 'viaje', targetAmount: 2_400_000, savedAmount: 0, priority: 'baja', targetDate: '2027-04-13' }, // requiere 400.000
        { id: 'emergencia', targetAmount: 3_000_000, savedAmount: 0, priority: 'alta', targetDate: '2027-10-13' }, // 250.000
        { id: 'moto', targetAmount: 6_000_000, savedAmount: 0, priority: 'media', targetDate: '2027-10-13' }, // 500.000
      ],
      800_000,
      today,
    );
    const byId = Object.fromEntries(result.plans.map((plan) => [plan.id, plan]));
    expect(result.allOnTrack).toBe(false);
    expect(byId.emergencia?.assignedMonthly).toBe(250_000);
    expect(byId.moto?.assignedMonthly).toBe(500_000);
    expect(byId.viaje?.assignedMonthly).toBe(50_000);
    expect(byId.viaje?.status).toBe('en_riesgo');
    expect(byId.viaje?.suggestions).toEqual({ reachableDate: addMonths(today, 48), contributionToKeepDate: 400_000 });
    expect(byId.moto?.suggestions).toBeNull();
  });

  it('dentro de la misma prioridad atiende primero la fecha más cercana', () => {
    const result = allocateGoals(
      [
        { id: 'lejana', targetAmount: 1_200_000, savedAmount: 0, priority: 'alta', targetDate: '2027-10-13' },
        { id: 'cercana', targetAmount: 600_000, savedAmount: 0, priority: 'alta', targetDate: '2026-12-13' },
      ],
      300_000,
      today,
    );
    const byId = Object.fromEntries(result.plans.map((plan) => [plan.id, plan]));
    expect(byId.cercana?.assignedMonthly).toBe(300_000);
    expect(byId.cercana?.status).toBe('en_curso');
    expect(byId.lejana?.assignedMonthly).toBe(0);
    expect(byId.lejana?.status).toBe('en_riesgo');
    expect(byId.lejana?.projectedDate).toBeNull();
  });

  it('las metas sin fecha reciben lo que sobra y las completas no reciben nada', () => {
    const result = allocateGoals(
      [
        { id: 'libre', targetAmount: 5_000_000, savedAmount: 0, priority: 'alta' },
        { id: 'lista', targetAmount: 1_000_000, savedAmount: 1_000_000, priority: 'alta' },
        { id: 'fecha', targetAmount: 1_200_000, savedAmount: 0, priority: 'baja', targetDate: '2027-10-13' },
      ],
      500_000,
      today,
    );
    const byId = Object.fromEntries(result.plans.map((plan) => [plan.id, plan]));
    expect(byId.fecha?.assignedMonthly).toBe(100_000);
    expect(byId.libre?.assignedMonthly).toBe(400_000);
    expect(byId.libre?.status).toBe('en_curso');
    expect(byId.libre?.requiredMonthly).toBeNull();
    expect(byId.lista?.status).toBe('completada');
    expect(byId.lista?.assignedMonthly).toBe(0);
  });

  it('una meta sin fecha y sin capacidad queda en riesgo', () => {
    const result = allocateGoals([{ id: 'libre', targetAmount: 1_000_000, savedAmount: 0, priority: 'media' }], 0, today);
    expect(result.plans[0]?.status).toBe('en_riesgo');
    expect(result.plans[0]?.suggestions?.reachableDate).toBeNull();
  });

  it('una meta con la fecha vencida se marca como vencida', () => {
    const result = allocateGoals(
      [{ id: 'tarde', targetAmount: 1_000_000, savedAmount: 400_000, priority: 'alta', targetDate: '2026-09-01' }],
      200_000,
      today,
    );
    expect(result.plans[0]?.status).toBe('vencida');
    expect(result.plans[0]?.requiredMonthly).toBe(600_000);
    expect(result.plans[0]?.suggestions).toEqual({ reachableDate: addMonths(today, 3), contributionToKeepDate: null });
  });

  it('una fecha futura a menos de un mes cuenta como 1 mes', () => {
    const result = allocateGoals(
      [{ id: 'pronto', targetAmount: 500_000, savedAmount: 0, priority: 'alta', targetDate: '2026-10-30' }],
      500_000,
      today,
    );
    expect(result.plans[0]?.monthsToTargetDate).toBe(1);
    expect(result.plans[0]?.status).toBe('en_curso');
  });
});

describe('crédito con cuota fija (6.4)', () => {
  it('calcula la cuota de $10.000.000 al 1 % mensual a 12 meses', () => {
    expect(fixedInstallment(10_000_000, 0.01, 12)).toBeCloseTo(888_487.89, 2);
    expect(fixedInstallment(1_200_000, 0, 12)).toBe(100_000);
    expect(fixedInstallment(0, 0.01, 12)).toBe(0);
  });

  it('la tabla termina en saldo 0 y suma el capital exacto', () => {
    const schedule = amortizationSchedule(10_000_000, 0.01, 12);
    expect(schedule.at(-1)?.balance).toBe(0);
    expect(schedule.reduce((total, row) => total + row.principal, 0)).toBe(10_000_000);
    const loan = summarizeLoan(10_000_000, 0.01, 12);
    expect(loan.installment).toBe(888_488);
    expect(loan.totalInterest).toBe(661_853);
    expect(loan.totalInstallments).toBe(10_661_853);
  });

  it('valida el plazo entre 1 y 360 meses', () => {
    expect(() => fixedInstallment(1_000_000, 0.01, 0)).toThrow(RangeError);
    expect(() => fixedInstallment(1_000_000, 0.01, 361)).toThrow(RangeError);
  });
});

describe('simulador ahorro vs. crédito vs. mixto (6.4, RF-20)', () => {
  const carro: SimulationInput = {
    price: 60_000_000,
    downPayment: 12_000_000,
    currentSavings: 12_000_000,
    monthlySaving: 1_500_000,
    rate: 0.18,
    rateType: 'EA',
    termMonths: 48,
  };

  it('calcula el crédito: cuota, intereses, total y costo extra', () => {
    const result = simulatePurchase(carro);
    expect(result.credit.financedAmount).toBe(48_000_000);
    expect(result.credit.installment).toBe(1_376_764);
    expect(result.credit.totalInterest).toBe(18_084_701);
    expect(result.credit.totalPaid).toBe(12_000_000 + 48_000_000 + 18_084_701);
    expect(result.credit.extraCost).toBe(18_084_701);
    expect(result.credit.monthsToOwnership).toBe(0);
    expect(result.mixed).toBeNull();
  });

  it('calcula el ahorro: ⌈(precio − ahorro actual) ÷ aporte⌉', () => {
    expect(simulatePurchase(carro).saving).toEqual({ months: 32, totalPaid: 60_000_000 });
  });

  it('incluye cargos mensuales y únicos en el total pagado', () => {
    const result = simulatePurchase({ ...carro, monthlyFees: 80_000, oneTimeFees: 500_000 });
    expect(result.credit.monthlyOutflow).toBe(1_376_764 + 80_000);
    expect(result.credit.totalPaid).toBe(12_000_000 + 48_000_000 + 18_084_701 + 80_000 * 48 + 500_000);
    expect(result.assumptions.join(' ')).toMatch(/cargos únicos/);
  });

  it('el escenario mixto ahorra la cuota inicial y financia el resto', () => {
    const result = simulatePurchase({ ...carro, currentSavings: 3_000_000, downPayment: 6_000_000 });
    // Crédito hoy: solo hay 3.000.000 de cuota inicial
    expect(result.credit.financedAmount).toBe(57_000_000);
    // Mixto: ahorra 2 meses (3.000.000 ÷ 1.500.000) y financia 54.000.000
    expect(result.mixed?.monthsToOwnership).toBe(2);
    expect(result.mixed?.financedAmount).toBe(54_000_000);
    expect(result.mixed?.installment).toBe(1_548_860);
    expect(result.mixed?.totalInterest).toBe(20_345_279);
    expect(result.warnings.map((w) => w.code)).toContain('DOWN_PAYMENT_NOT_AVAILABLE');
  });

  it('avisa si la tasa supera la usura de referencia y si la cuota supera el ahorro mensual', () => {
    const result = simulatePurchase({
      ...carro,
      rate: 0.3,
      monthlySaving: 1_000_000,
      usury: { effectiveAnnualRate: 0.25, validFrom: '2026-10-01' },
    });
    const codes = result.warnings.map((w) => w.code);
    expect(codes).toContain('USURY_EXCEEDED');
    expect(codes).toContain('PAYMENT_EXCEEDS_SAVING');
    expect(result.warnings.find((w) => w.code === 'USURY_EXCEEDED')?.message).toMatch(/2026-10-01/);
  });

  it('sin ahorro mensual no puede calcular el camino de ahorro', () => {
    const result = simulatePurchase({ ...carro, monthlySaving: 0, currentSavings: 0, downPayment: 0 });
    expect(result.saving.months).toBeNull();
    expect(result.warnings.map((w) => w.code)).toContain('SAVING_NOT_POSSIBLE');
  });

  it('acepta tasa mensual vencida', () => {
    const result = simulatePurchase({ ...carro, rate: 0.015, rateType: 'MV' });
    expect(result.monthlyRate).toBe(0.015);
    expect(result.effectiveAnnualRate).toBeCloseTo(Math.pow(1.015, 12) - 1, 12);
  });

  it('valida entradas: tasa ≤ 100 % E.A., cuota inicial ≤ precio, plazo y montos', () => {
    expect(() => simulatePurchase({ ...carro, rate: 1.2 })).toThrow(/100 %/);
    expect(() => simulatePurchase({ ...carro, rate: 0.07, rateType: 'MV' })).toThrow(/100 %/);
    expect(() => simulatePurchase({ ...carro, downPayment: 70_000_000 })).toThrow(RangeError);
    expect(() => simulatePurchase({ ...carro, termMonths: 400 })).toThrow(RangeError);
    expect(() => simulatePurchase({ ...carro, price: 0 })).toThrow(RangeError);
  });

  it('es determinista e incluye versión, supuestos y aviso fijo', () => {
    const a = simulatePurchase(carro);
    expect(a).toEqual(simulatePurchase(carro));
    expect(a.engineVersion).toBe('2.0.0');
    expect(a.disclaimer).toMatch(/No es una oferta ni una aprobación de crédito/);
    expect(a.assumptions.join(' ')).toMatch(/No se incluyeron seguros/);
  });
});
