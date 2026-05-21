import type { FinanceRecord } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';
import { roundMoney, toMoneyNumber } from '../utils/money';
import type { z } from 'zod';
import type { createFinanceSchema, updateFinanceSchema } from '@ascendx/shared/validators/finance.validator';
import type { FinanceSummaryFull } from '@ascendx/shared/finance-helpers';

type CreateFinanceInput = z.infer<typeof createFinanceSchema>;
type UpdateFinanceInput = z.infer<typeof updateFinanceSchema>;

function mapRecord(record: FinanceRecord) {
  return { ...record, amount: toMoneyNumber(record.amount) };
}

function groupByCategory(records: FinanceRecord[], type: 'INCOME' | 'EXPENSE') {
  const map = new Map<string, number>();
  for (const r of records) {
    if (r.type !== type) continue;
    const amt = toMoneyNumber(r.amount);
    map.set(r.category, (map.get(r.category) ?? 0) + amt);
  }
  return [...map.entries()]
    .map(([category, total]) => ({ category, total: roundMoney(total) }))
    .sort((a, b) => b.total - a.total);
}

function buildMonthly(records: FinanceRecord[]): FinanceSummaryFull['monthly'] {
  const now = new Date();
  const months: FinanceSummaryFull['monthly'] = [];

  for (let i = 5; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleDateString('es', { month: 'short', year: '2-digit' });
    let income = 0;
    let expense = 0;

    for (const r of records) {
      const created = new Date(r.createdAt);
      const rKey = `${created.getUTCFullYear()}-${String(created.getUTCMonth() + 1).padStart(2, '0')}`;
      if (rKey !== key) continue;
      const amt = toMoneyNumber(r.amount);
      if (r.type === 'INCOME') income += amt;
      else expense += amt;
    }

    months.push({
      key,
      label: label.charAt(0).toUpperCase() + label.slice(1),
      income: roundMoney(income),
      expense: roundMoney(expense),
    });
  }

  return months;
}

export const financeService = {
  async list(userId: string) {
    const rows = await prisma.financeRecord.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(mapRecord);
  },

  async getById(userId: string, id: string) {
    const record = await prisma.financeRecord.findFirst({ where: { id, userId } });
    if (!record) throw new AppError(404, 'Registro financiero no encontrado');
    return mapRecord(record);
  },

  async create(userId: string, data: CreateFinanceInput) {
    const record = await prisma.financeRecord.create({
      data: { ...data, amount: roundMoney(data.amount), userId },
    });
    return mapRecord(record);
  },

  async update(userId: string, id: string, data: UpdateFinanceInput) {
    await financeService.getById(userId, id);
    const payload = { ...data };
    if (payload.amount !== undefined) payload.amount = roundMoney(payload.amount);
    const record = await prisma.financeRecord.update({ where: { id }, data: payload });
    return mapRecord(record);
  },

  async remove(userId: string, id: string) {
    await financeService.getById(userId, id);
    await prisma.financeRecord.delete({ where: { id } });
  },

  async summary(userId: string): Promise<FinanceSummaryFull> {
    const records = await prisma.financeRecord.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    const income = records
      .filter((r) => r.type === 'INCOME')
      .reduce((s, r) => s + toMoneyNumber(r.amount), 0);
    const expense = records
      .filter((r) => r.type === 'EXPENSE')
      .reduce((s, r) => s + toMoneyNumber(r.amount), 0);

    const expenseByCategory = groupByCategory(records, 'EXPENSE');
    const incomeByCategory = groupByCategory(records, 'INCOME');
    const monthly = buildMonthly(records);

    const savingsRate =
      income > 0 ? roundMoney(Math.max(-100, Math.min(100, ((income - expense) / income) * 100))) : 0;

    return {
      income: roundMoney(income),
      expense: roundMoney(expense),
      balance: roundMoney(income - expense),
      totalRecords: records.length,
      savingsRate,
      expenseByCategory,
      incomeByCategory,
      monthly,
      budget503020:
        income > 0
          ? {
              needs: roundMoney(income * 0.5),
              wants: roundMoney(income * 0.3),
              savings: roundMoney(income * 0.2),
            }
          : null,
      topExpenseCategory: expenseByCategory[0]?.category ?? null,
    };
  },
};
