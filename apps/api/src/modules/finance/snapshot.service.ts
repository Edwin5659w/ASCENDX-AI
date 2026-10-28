import {
  addMonths,
  allocateGoals,
  CAPACITY_WINDOW_MONTHS,
  debtLoad,
  emergencyFundMonths,
  estimateSavingCapacity,
  expensesByCategory,
  monthKey,
  monthlyIndicators,
  nextPaymentDate,
  previousCompletedMonths,
  todayInBogota,
  type CalendarDate,
  type MonthlyIndicators,
  type MovementType,
} from '@ascendx/finance-core';
import { fromCalendarDate, toCalendarDate } from '../../lib/calendar.js';
import { prisma } from '../../lib/prisma.js';

const EVOLUTION_MONTHS = 6;

function lastMonths(today: CalendarDate, count: number): string[] {
  const first = `${monthKey(today)}-01`;
  const keys: string[] = [];
  for (let offset = count - 1; offset >= 0; offset--) keys.push(monthKey(addMonths(first, -offset)));
  return keys;
}

/**
 * Foto financiera del usuario calculada SOLO con finance-core: la usan el
 * panel, las metas y el contexto de la IA. Mismos datos → mismas cifras.
 */
export async function financialSnapshot(userId: string, options: { month?: string; today?: CalendarDate } = {}) {
  const today = options.today ?? todayInBogota();
  const month = options.month ?? monthKey(today);
  const evolutionKeys = lastMonths(today, EVOLUTION_MONTHS);
  const windowStart = `${[evolutionKeys[0]!, month].sort()[0]}-01`;
  const windowEnd = addMonths(`${[monthKey(today), month].sort().at(-1)}-01`, 1);

  const [profile, debts, goals, firstTransaction, movements] = await Promise.all([
    prisma.financialProfile.findUnique({ where: { userId } }),
    prisma.debt.findMany({ where: { userId, deletedAt: null, status: 'activa' }, orderBy: { createdAt: 'asc' } }),
    prisma.financialGoal.findMany({
      where: { userId, deletedAt: null, status: { in: ['activa', 'completada', 'pausada'] } },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.transaction.findFirst({ where: { userId, deletedAt: null }, orderBy: { date: 'asc' }, select: { date: true } }),
    prisma.transaction.findMany({
      where: { userId, deletedAt: null, date: { gte: fromCalendarDate(windowStart), lt: fromCalendarDate(windowEnd) } },
      select: { type: true, amount: true, date: true, categoryId: true },
    }),
  ]);

  const byMonth = new Map<string, { type: MovementType; amount: number; categoryId: string | null }[]>();
  for (const movement of movements) {
    const key = monthKey(toCalendarDate(movement.date));
    const list = byMonth.get(key) ?? [];
    list.push({ type: movement.type, amount: Number(movement.amount), categoryId: movement.categoryId });
    byMonth.set(key, list);
  }
  const indicatorsOf = (key: string): MonthlyIndicators => monthlyIndicators(byMonth.get(key) ?? []);

  // Solo cuentan los meses completos desde que el usuario empezó a registrar.
  const firstMonth = firstTransaction ? monthKey(toCalendarDate(firstTransaction.date)) : null;
  const completedKeys = firstMonth
    ? previousCompletedMonths(today, CAPACITY_WINDOW_MONTHS).filter((key) => key >= firstMonth)
    : [];
  const completedMonths = completedKeys.map(indicatorsOf);

  const monthlyInstallments = debts.reduce((total, debt) => total + Number(debt.installment ?? 0), 0);
  const hasProfile = profile?.estimatedIncome != null && profile.estimatedFixedExpenses != null;
  const capacity = estimateSavingCapacity({
    completedMonths,
    profile: hasProfile
      ? { estimatedIncome: Number(profile!.estimatedIncome), estimatedFixedExpenses: Number(profile!.estimatedFixedExpenses) }
      : null,
    monthlyDebtInstallments: monthlyInstallments,
    safetyMargin: profile ? Number(profile.safetyMargin) : undefined,
  });

  const average = (pick: (m: MonthlyIndicators) => number) =>
    completedMonths.length ? Math.round(completedMonths.reduce((t, m) => t + pick(m), 0) / completedMonths.length) : null;
  const averageIncome = average((m) => m.income) ?? (hasProfile ? Number(profile!.estimatedIncome) : null);
  const averageExpenses = average((m) => m.expenses) ?? (hasProfile ? Number(profile!.estimatedFixedExpenses) : null);

  const activeGoals = goals.filter((goal) => goal.status !== 'pausada');
  const allocation = allocateGoals(
    activeGoals.map((goal) => ({
      id: goal.id,
      targetAmount: Number(goal.targetAmount),
      savedAmount: Number(goal.savedAmount),
      priority: goal.priority,
      targetDate: goal.targetDate ? toCalendarDate(goal.targetDate) : null,
    })),
    capacity.prudentCapacity,
    today,
  );
  const emergencyGoal = goals.find((goal) => goal.isEmergencyFund);

  const categories = await prisma.category.findMany({
    where: { id: { in: [...new Set(movements.map((m) => m.categoryId).filter((id): id is string => Boolean(id)))] } },
    select: { id: true, name: true, color: true, icon: true },
  });
  const categoryById = new Map(categories.map((c) => [c.id, c]));
  const monthMovements = byMonth.get(month) ?? [];
  const monthIndicators = indicatorsOf(month);
  const byCategory = expensesByCategory(
    monthMovements.filter((m): m is typeof m & { categoryId: string } => m.categoryId !== null),
  ).map(({ categoryId, total }) => ({
    category: categoryById.get(categoryId) ?? { id: categoryId, name: 'Sin categoría', color: null, icon: null },
    total,
    percent: monthIndicators.expenses > 0 ? Math.round((total / monthIndicators.expenses) * 1000) / 10 : 0,
  }));

  return {
    today,
    month,
    hasMovements: Boolean(firstTransaction),
    profile: hasProfile
      ? { estimatedIncome: Number(profile!.estimatedIncome), estimatedFixedExpenses: Number(profile!.estimatedFixedExpenses) }
      : null,
    indicators: monthIndicators,
    capacity,
    completedMonthsUsed: completedKeys,
    averages: { income: averageIncome, expenses: averageExpenses },
    debtLoad: averageIncome ? debtLoad(monthlyInstallments, averageIncome) : null,
    emergency: emergencyGoal
      ? {
          goalId: emergencyGoal.id,
          saved: Number(emergencyGoal.savedAmount),
          months: averageExpenses ? emergencyFundMonths(Number(emergencyGoal.savedAmount), averageExpenses) : null,
        }
      : null,
    byCategory,
    evolution: evolutionKeys.map((key) => {
      const m = indicatorsOf(key);
      return { month: key, income: m.income, expenses: m.expenses, debtPayments: m.debtPayments, netFlow: m.netFlow };
    }),
    debts: {
      count: debts.length,
      totalBalance: debts.reduce((total, debt) => total + Number(debt.balance), 0),
      monthlyInstallments,
      upcoming: debts
        .filter((debt) => debt.paymentDay)
        .map((debt) => ({
          id: debt.id,
          name: debt.name ?? debt.creditor,
          installment: debt.installment === null ? null : Number(debt.installment),
          nextPaymentDate: nextPaymentDate(debt.paymentDay!, today),
        }))
        .sort((a, b) => a.nextPaymentDate.localeCompare(b.nextPaymentDate)),
    },
    goals: goals.map((goal) => ({
      id: goal.id,
      name: goal.name,
      icon: goal.icon,
      priority: goal.priority,
      status: goal.status,
      targetAmount: Number(goal.targetAmount),
      savedAmount: Number(goal.savedAmount),
      targetDate: goal.targetDate ? toCalendarDate(goal.targetDate) : null,
      isEmergencyFund: goal.isEmergencyFund,
      plan: allocation.plans.find((plan) => plan.id === goal.id) ?? null,
    })),
    allocation: {
      prudentCapacity: allocation.prudentCapacity,
      totalRequired: allocation.totalRequired,
      allOnTrack: allocation.allOnTrack,
      unassigned: allocation.unassigned,
    },
  };
}

export type FinancialSnapshot = Awaited<ReturnType<typeof financialSnapshot>>;
