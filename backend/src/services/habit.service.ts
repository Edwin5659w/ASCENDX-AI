import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';
import { userService } from './user.service';
import { startOfDayUTC, isSameDayUTC, yesterdayUTC } from '../utils/date';
import { pushService } from './push.service';
import type { z } from 'zod';
import type { createHabitSchema, updateHabitSchema } from '@ascendx/shared/validators/habit.validator';

type CreateHabitInput = z.infer<typeof createHabitSchema>;
type UpdateHabitInput = z.infer<typeof updateHabitSchema>;

async function enrichHabits<T extends { id: string }>(userId: string, habits: T[]) {
  const today = startOfDayUTC();
  const completions = await prisma.habitCompletion.findMany({
    where: { userId, completedDate: today },
  });
  const done = new Set(completions.map((c) => c.habitId));
  return habits.map((h) => ({ ...h, completedToday: done.has(h.id) }));
}

export const habitService = {
  async list(userId: string) {
    const habits = await prisma.habit.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return enrichHabits(userId, habits);
  },

  async getById(userId: string, id: string) {
    const habit = await prisma.habit.findFirst({ where: { id, userId } });
    if (!habit) throw new AppError(404, 'Hábito no encontrado');
    const [enriched] = await enrichHabits(userId, [habit]);
    return enriched;
  },

  async create(userId: string, data: CreateHabitInput) {
    const habit = await prisma.habit.create({ data: { ...data, userId } });
    return { ...habit, completedToday: false };
  },

  async update(userId: string, id: string, data: UpdateHabitInput) {
    await habitService.getById(userId, id);
    const habit = await prisma.habit.update({ where: { id }, data });
    const [enriched] = await enrichHabits(userId, [habit]);
    return enriched;
  },

  async complete(userId: string, id: string) {
    const habit = await prisma.habit.findFirst({ where: { id, userId } });
    if (!habit) throw new AppError(404, 'Hábito no encontrado');

    const today = startOfDayUTC();

    const already = await prisma.habitCompletion.findUnique({
      where: { habitId_completedDate: { habitId: id, completedDate: today } },
    });
    if (already) throw new AppError(400, 'Ya completaste este hábito hoy');

    let newStreak = 1;
    if (habit.lastCompletedAt) {
      const lastDay = startOfDayUTC(habit.lastCompletedAt);
      const yday = yesterdayUTC();
      if (isSameDayUTC(lastDay, yday)) {
        newStreak = habit.streak + 1;
      } else if (!isSameDayUTC(lastDay, today)) {
        newStreak = 1;
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      await tx.habitCompletion.create({
        data: { habitId: id, userId, completedDate: today },
      });
      return tx.habit.update({
        where: { id },
        data: { streak: newStreak, lastCompletedAt: new Date() },
      });
    });

    await userService.addXp(userId, 15);

    void pushService
      .sendToUser(userId, {
        title: '¡Hábito listo!',
        body: `"${habit.name}" hecho · +15 XP · racha ${updated.streak}`,
        data: { type: 'habit_completed', habitId: id },
      })
      .catch((err) => console.warn('[ascendx] push hábito:', err));

    return { ...updated, completedToday: true };
  },

  async remove(userId: string, id: string) {
    await habitService.getById(userId, id);
    await prisma.habit.delete({ where: { id } });
  },
};
