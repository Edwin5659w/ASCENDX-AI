import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';
import type { z } from 'zod';
import type { createFinanceSchema, updateFinanceSchema } from '@ascendx/shared/validators/finance.validator';

type CreateFinanceInput = z.infer<typeof createFinanceSchema>;
type UpdateFinanceInput = z.infer<typeof updateFinanceSchema>;

export const financeService = {
  async list(userId: string) {
    return prisma.financeRecord.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  },

  async getById(userId: string, id: string) {
    const record = await prisma.financeRecord.findFirst({ where: { id, userId } });
    if (!record) throw new AppError(404, 'Registro financiero no encontrado');
    return record;
  },

  async create(userId: string, data: CreateFinanceInput) {
    return prisma.financeRecord.create({ data: { ...data, userId } });
  },

  async update(userId: string, id: string, data: UpdateFinanceInput) {
    await financeService.getById(userId, id);
    return prisma.financeRecord.update({ where: { id }, data });
  },

  async remove(userId: string, id: string) {
    await financeService.getById(userId, id);
    await prisma.financeRecord.delete({ where: { id } });
  },

  async summary(userId: string) {
    const records = await prisma.financeRecord.findMany({ where: { userId } });
    const income = records.filter((r) => r.type === 'INCOME').reduce((s, r) => s + r.amount, 0);
    const expense = records.filter((r) => r.type === 'EXPENSE').reduce((s, r) => s + r.amount, 0);
    return {
      income: Math.round(income * 100) / 100,
      expense: Math.round(expense * 100) / 100,
      balance: Math.round((income - expense) * 100) / 100,
      totalRecords: records.length,
    };
  },
};
