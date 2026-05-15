import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';
import { userService } from './user.service';
import type { z } from 'zod';
import type { createTaskSchema, updateTaskSchema } from '@ascendx/shared/validators/task.validator';

type CreateTaskInput = z.infer<typeof createTaskSchema>;
type UpdateTaskInput = z.infer<typeof updateTaskSchema>;

export const taskService = {
  async list(userId: string, goalId?: string) {
    return prisma.task.findMany({
      where: { userId, ...(goalId ? { goalId } : {}) },
      include: { goal: { select: { id: true, title: true } } },
      orderBy: { createdAt: 'desc' },
    });
  },

  async getById(userId: string, id: string) {
    const task = await prisma.task.findFirst({
      where: { id, userId },
      include: { goal: { select: { id: true, title: true } } },
    });
    if (!task) throw new AppError(404, 'Tarea no encontrada');
    return task;
  },

  async create(userId: string, data: CreateTaskInput) {
    if (data.goalId) {
      const goal = await prisma.goal.findFirst({ where: { id: data.goalId, userId } });
      if (!goal) throw new AppError(404, 'Objetivo no encontrado');
    }
    return prisma.task.create({ data: { ...data, userId } });
  },

  async update(userId: string, id: string, data: UpdateTaskInput) {
    const existing = await taskService.getById(userId, id);

    if (data.goalId) {
      const goal = await prisma.goal.findFirst({ where: { id: data.goalId, userId } });
      if (!goal) throw new AppError(404, 'Objetivo no encontrado');
    }

    const task = await prisma.task.update({ where: { id }, data });

    if (data.completed !== undefined && data.completed !== existing.completed) {
      if (data.completed) await userService.addXp(userId, 10);
      if (existing.goalId) {
        const goalTasks = await prisma.task.findMany({ where: { goalId: existing.goalId } });
        const completed = goalTasks.filter((t) => (t.id === id ? data.completed : t.completed)).length;
        const progress = goalTasks.length ? Math.round((completed / goalTasks.length) * 100) : 0;
        await prisma.goal.update({ where: { id: existing.goalId }, data: { progress } });
      }
    }

    return task;
  },

  async remove(userId: string, id: string) {
    await taskService.getById(userId, id);
    await prisma.task.delete({ where: { id } });
  },
};
