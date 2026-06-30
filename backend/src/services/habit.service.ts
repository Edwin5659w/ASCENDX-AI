import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';
import { userService } from './user.service';
import {
  startOfDayUTC,
  isSameDayUTC,
  yesterdayUTC,
  startOfWeekUTC,
  previousWeekStartUTC,
  daysAgoUTC,
} from '../utils/date';
import { pushService } from './push.service';
import { planService } from './plan.service';
import { getPlanLimits } from '@ascendx/shared/plans';
import { XP, RETENTION_MESSAGES } from '@ascendx/shared/retention';
import type { z } from 'zod';
import type { createHabitSchema, updateHabitSchema } from '@ascendx/shared/validators/habit.validator';

type CreateHabitInput = z.infer<typeof createHabitSchema>;
type UpdateHabitInput = z.infer<typeof updateHabitSchema>;

function last7DayStarts(): Date[] {
  const days: Date[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = startOfDayUTC();
    d.setUTCDate(d.getUTCDate() - i);
    days.push(d);
  }
  return days;
}

async function enrichHabits<T extends { id: string; frequency: string; streak: number }>(
  userId: string,
  habits: T[],
) {
  const today = startOfDayUTC();
  const weekStart = startOfWeekUTC();
  const dayStarts = last7DayStarts();
  const completions = await prisma.habitCompletion.findMany({
    where: {
      userId,
      completedDate: { gte: dayStarts[0] },
    },
  });
  const doneToday = new Set(
    completions.filter((c) => c.completedDate.getTime() === today.getTime()).map((c) => c.habitId),
  );
  const doneWeek = new Set(
    completions
      .filter((c) => c.completedDate.getTime() === weekStart.getTime())
      .map((c) => c.habitId),
  );
  const weekByHabit = new Map<string, boolean[]>();
  for (const h of habits) {
    weekByHabit.set(
      h.id,
      dayStarts.map((day) =>
        completions.some(
          (c) => c.habitId === h.id && c.completedDate.getTime() === day.getTime(),
        ),
      ),
    );
  }
  return habits.map((h) => {
    const weekHistory = weekByHabit.get(h.id) ?? dayStarts.map(() => false);
    const doneCount = weekHistory.filter(Boolean).length;
    return {
      ...h,
      completedToday: h.frequency === 'WEEKLY' ? doneWeek.has(h.id) : doneToday.has(h.id),
      weekHistory,
      weekCompletionRate: Math.round((doneCount / 7) * 100),
      streakMilestone:
        h.streak >= 30 ? 30 : h.streak >= 21 ? 21 : h.streak >= 7 ? 7 : h.streak >= 3 ? 3 : null,
    };
  });
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
    const plan = await planService.getUserPlan(userId);
    const limits = getPlanLimits(plan);
    const count = await prisma.habit.count({ where: { userId } });
    if (count >= limits.maxHabits) {
      throw new AppError(
        402,
        plan === 'FREE'
          ? `Límite de ${limits.maxHabits} hábitos en plan Gratis. Pasa a Pro para más.`
          : `Límite de ${limits.maxHabits} hábitos alcanzado.`,
      );
    }
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

    const periodStart =
      habit.frequency === 'WEEKLY' ? startOfWeekUTC() : startOfDayUTC();

    const already = await prisma.habitCompletion.findUnique({
      where: { habitId_completedDate: { habitId: id, completedDate: periodStart } },
    });
    if (already) {
      throw new AppError(
        400,
        habit.frequency === 'WEEKLY'
          ? 'Ya completaste este hábito esta semana'
          : 'Ya completaste este hábito hoy',
      );
    }

    let newStreak = 1;
    let streakShieldUsed = false;
    if (habit.lastCompletedAt) {
      if (habit.frequency === 'WEEKLY') {
        const lastWeek = startOfWeekUTC(habit.lastCompletedAt);
        const prevWeek = previousWeekStartUTC();
        if (lastWeek.getTime() === prevWeek.getTime()) {
          newStreak = habit.streak + 1;
        }
      } else {
        const lastDay = startOfDayUTC(habit.lastCompletedAt);
        const yday = yesterdayUTC();
        const twoDaysAgo = daysAgoUTC(2);
        if (isSameDayUTC(lastDay, yday)) {
          newStreak = habit.streak + 1;
        } else if (isSameDayUTC(lastDay, twoDaysAgo)) {
          const owner = await prisma.user.findUnique({
            where: { id: userId },
            select: { streakShields: true },
          });
          if (owner && owner.streakShields > 0) {
            await prisma.user.update({
              where: { id: userId },
              data: { streakShields: { decrement: 1 } },
            });
            newStreak = habit.streak + 1;
            streakShieldUsed = true;
          } else {
            newStreak = 1;
          }
        } else if (!isSameDayUTC(lastDay, periodStart)) {
          newStreak = 1;
        }
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      await tx.habitCompletion.create({
        data: { habitId: id, userId, completedDate: periodStart },
      });
      return tx.habit.update({
        where: { id },
        data: { streak: newStreak, lastCompletedAt: new Date() },
      });
    });

    const xpResult = await userService.addXp(userId, XP.HABIT_COMPLETE);

    void pushService
      .sendToUser(userId, {
        title: '¡Hábito listo!',
        body: `"${habit.name}" hecho · +15 XP · racha ${updated.streak}`,
        data: { type: 'habit_completed', habitId: id },
      })
      .catch((err) => console.warn('[ascendx] push hábito:', err));

    const xpState = await prisma.user.findUnique({
      where: { id: userId },
      select: { xp: true, level: true },
    });

    return {
      ...updated,
      completedToday: true,
      streakShieldUsed,
      gamification: {
        xpGained: XP.HABIT_COMPLETE,
        leveledUp: xpResult.leveledUp,
        level: xpResult.level,
        xp: xpResult.xp,
        streakShieldUsed,
        message: streakShieldUsed
          ? `${RETENTION_MESSAGES.habitComplete(XP.HABIT_COMPLETE, updated.streak)} · ${RETENTION_MESSAGES.streakShield}`
          : RETENTION_MESSAGES.habitComplete(XP.HABIT_COMPLETE, updated.streak),
      },
    };
  },

  async remove(userId: string, id: string) {
    await habitService.getById(userId, id);
    await prisma.habit.delete({ where: { id } });
  },
};
