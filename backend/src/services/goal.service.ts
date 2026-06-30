import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';
import { planService } from './plan.service';
import { getPlanLimits } from '@ascendx/shared/plans';
import { buildPaginatedResult } from '@ascendx/shared/pagination';
import type { z } from 'zod';
import type { createGoalSchema, updateGoalSchema } from '@ascendx/shared/validators/goal.validator';

type CreateGoalInput = z.infer<typeof createGoalSchema>;
type UpdateGoalInput = z.infer<typeof updateGoalSchema>;

export const goalService = {
  async list(userId: string, pagination?: { page: number; limit: number }) {
    const where = { userId };
    const include = { tasks: true };
    const orderBy = { createdAt: 'desc' as const };
    if (!pagination) {
      return prisma.goal.findMany({ where, include, orderBy });
    }
    const { page, limit } = pagination;
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      prisma.goal.findMany({ where, include, orderBy, skip, take: limit }),
      prisma.goal.count({ where }),
    ]);
    return buildPaginatedResult(items, total, page, limit);
  },

  async getById(userId: string, id: string) {
    const goal = await prisma.goal.findFirst({
      where: { id, userId },
      include: { tasks: true },
    });
    if (!goal) throw new AppError(404, 'Objetivo no encontrado');
    return goal;
  },

  async create(userId: string, data: CreateGoalInput) {
    const plan = await planService.getUserPlan(userId);
    const limits = getPlanLimits(plan);
    const count = await prisma.goal.count({ where: { userId } });
    if (count >= limits.maxGoals) {
      throw new AppError(
        402,
        plan === 'FREE'
          ? `Límite de ${limits.maxGoals} objetivos en plan Gratis. Pasa a Pro para más.`
          : `Límite de ${limits.maxGoals} objetivos alcanzado.`,
      );
    }
    return prisma.goal.create({ data: { ...data, userId } });
  },

  async update(userId: string, id: string, data: UpdateGoalInput) {
    await goalService.getById(userId, id);
    return prisma.goal.update({ where: { id }, data });
  },

  async remove(userId: string, id: string) {
    await goalService.getById(userId, id);
    await prisma.goal.delete({ where: { id } });
  },
};
