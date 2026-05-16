import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';
import { roundMoney, toMoneyNumber } from '../utils/money';
import type { z } from 'zod';
import type { createFinanceSchema, updateFinanceSchema } from '@ascendx/shared/validators/finance.validator';

type CreateFinanceInput = z.infer<typeof createFinanceSchema>;
type UpdateFinanceInput = z.infer<typeof updateFinanceSchema>;

function mapRecord<T extends { amount: unknown }>(record: T) {
  return { ...record, amount: toMoneyNumber(record.amount) };
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

  async summary(userId: string) {
    const records = await prisma.financeRecord.findMany({ where: { userId } });
    const income = records
      .filter((r) => r.type === 'INCOME')
      .reduce((s, r) => s + toMoneyNumber(r.amount), 0);
    const expense = records
      .filter((r) => r.type === 'EXPENSE')
      .reduce((s, r) => s + toMoneyNumber(r.amount), 0);
    return {
      income: roundMoney(income),
      expense: roundMoney(expense),
      balance: roundMoney(income - expense),
      totalRecords: records.length,
    };
  },
};
