import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';
import type { z } from 'zod';
import type { createHabitSchema, updateHabitSchema } from '@ascendx/shared/validators/habit.validator';

type CreateHabitInput = z.infer<typeof createHabitSchema>;
type UpdateHabitInput = z.infer<typeof updateHabitSchema>;

export const habitService = {
  async list(userId: string) {
    return prisma.habit.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
  },

  async getById(userId: string, id: string) {
    const habit = await prisma.habit.findFirst({ where: { id, userId } });
    if (!habit) throw new AppError(404, 'Hábito no encontrado');
    return habit;
  },

  async create(userId: string, data: CreateHabitInput) {
    return prisma.habit.create({ data: { ...data, userId } });
  },

  async update(userId: string, id: string, data: UpdateHabitInput) {
    await habitService.getById(userId, id);
    return prisma.habit.update({ where: { id }, data });
  },

  async complete(userId: string, id: string) {
    const habit = await habitService.getById(userId, id);
    return prisma.habit.update({
      where: { id },
      data: { streak: habit.streak + 1 },
    });
  },

  async remove(userId: string, id: string) {
    await habitService.getById(userId, id);
    await prisma.habit.delete({ where: { id } });
  },
};
