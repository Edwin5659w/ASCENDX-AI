import bcrypt from 'bcrypt';
import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';
import { badgeService } from './badge.service';
import { pushService } from './push.service';
import type { OnboardingSetupInput } from '@ascendx/shared/validators/onboarding.validator';
import { startOfDayUTC } from '../utils/date';
import { roundMoney, toMoneyNumber } from '../utils/money';

export const userService = {
  async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        xp: true,
        level: true,
        onboardingDone: true,
        pushToken: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) throw new AppError(404, 'Usuario no encontrado');
    return user;
  },

  async getStats(userId: string) {
    const today = startOfDayUTC();
    const [user, goals, tasks, habits, finance, habitsCompletedToday] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, select: { xp: true, level: true } }),
      prisma.goal.count({ where: { userId } }),
      prisma.task.findMany({ where: { userId }, select: { completed: true, streakCount: true } }),
      prisma.habit.findMany({ where: { userId }, select: { streak: true } }),
      prisma.financeRecord.findMany({ where: { userId }, select: { type: true, amount: true } }),
      prisma.habitCompletion.count({ where: { userId, completedDate: today } }),
    ]);

    if (!user) throw new AppError(404, 'Usuario no encontrado');

    const completedTasks = tasks.filter((t) => t.completed).length;
    const longestStreak = Math.max(0, ...habits.map((h) => h.streak), ...tasks.map((t) => t.streakCount));

    const financeBalance = finance.reduce((acc, r) => {
      const amt = toMoneyNumber(r.amount);
      return r.type === 'INCOME' ? acc + amt : acc - amt;
    }, 0);

    const statsCore = {
      totalGoals: goals,
      completedTasks,
      totalTasks: tasks.length,
      activeHabits: habits.length,
      habitsCompletedToday,
      financeRecordsCount: finance.length,
      totalXp: user.xp,
      level: user.level,
      longestStreak,
      financeBalance: roundMoney(financeBalance),
    };

    const badges = await badgeService.syncAndList(userId, {
      totalGoals: statsCore.totalGoals,
      completedTasks: statsCore.completedTasks,
      totalTasks: statsCore.totalTasks,
      activeHabits: statsCore.activeHabits,
      totalXp: statsCore.totalXp,
      level: statsCore.level,
      longestStreak: statsCore.longestStreak,
    });

    return { ...statsCore, badges };
  },

  async sendTestPushNotification(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { pushToken: true },
    });
    if (!user?.pushToken) {
      throw new AppError(400, 'No hay token push. Regístralo desde Perfil en la app móvil.');
    }
    const { ok, tickets } = await pushService.send([
      {
        to: user.pushToken,
        title: 'ASCENDX',
        body: 'Notificación de prueba correcta ✓',
        sound: 'default',
        data: { type: 'test' },
      },
    ]);
    if (!ok) {
      const msg = tickets[0]?.message ?? tickets[0]?.details?.error ?? 'Expo rechazó el envío';
      throw new AppError(502, msg);
    }
    return { ok: true as const };
  },

  async addXp(userId: string, amount: number) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { xp: { increment: amount } },
    });

    const newLevel = Math.floor(user.xp / 100) + 1;
    if (newLevel > user.level) {
      const updated = await prisma.user.update({
        where: { id: userId },
        data: { level: newLevel },
        select: { id: true, xp: true, level: true },
      });
      return { ...updated, leveledUp: true };
    }

    return { id: user.id, xp: user.xp, level: user.level, leveledUp: false };
  },

  async setupOnboarding(userId: string, input: OnboardingSetupInput) {
    const existingGoals = await prisma.goal.count({ where: { userId } });
    if (existingGoals > 0) {
      throw new AppError(400, 'Ya tienes objetivos configurados. Usa la app para editarlos.');
    }

    const categoryMap: Record<OnboardingSetupInput['focus'], string> = {
      ESTUDIO: 'Estudio',
      SALUD: 'Salud',
      FINANZAS: 'Finanzas',
      TRABAJO: 'Trabajo',
      PERSONAL: 'Personal',
    };

    return prisma.$transaction(async (tx) => {
      const goal = await tx.goal.create({
        data: {
          title: input.goalTitle,
          category: categoryMap[input.focus],
          priority: 'MEDIUM',
          userId,
        },
      });

      const tasks = await Promise.all(
        input.taskTitles.map((title) =>
          tx.task.create({
            data: { title, userId, goalId: goal.id },
          }),
        ),
      );

      const habit = await tx.habit.create({
        data: { name: input.habitName, frequency: 'DAILY', userId },
      });

      if (input.focus === 'FINANZAS') {
        if (input.initialFinance) {
          await tx.financeRecord.create({
            data: {
              userId,
              type: 'EXPENSE',
              amount: roundMoney(input.initialFinance.amount),
              category: input.initialFinance.category,
              note: 'Primer gasto registrado en onboarding',
            },
          });
        } else {
          await tx.financeRecord.create({
            data: {
              userId,
              type: 'EXPENSE',
              amount: 0.01,
              category: 'Onboarding',
              note: 'Primer registro — edita o añade tus gastos reales',
            },
          });
        }
      }

      const user = await tx.user.update({
        where: { id: userId },
        data: { onboardingDone: true },
        select: {
          id: true,
          name: true,
          email: true,
          xp: true,
          level: true,
          onboardingDone: true,
          pushToken: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return { user, goal, tasks, habit };
    });
  },

  async updateProfile(userId: string, data: { name?: string; onboardingDone?: boolean; pushToken?: string | null }) {
    const payload: { name?: string; onboardingDone?: boolean; pushToken?: string | null } = { ...data };
    if (payload.pushToken !== undefined) {
      payload.pushToken = payload.pushToken && payload.pushToken.length > 0 ? payload.pushToken : null;
    }

    return prisma.user.update({
      where: { id: userId },
      data: payload,
      select: {
        id: true,
        name: true,
        email: true,
        xp: true,
        level: true,
        onboardingDone: true,
        pushToken: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  },

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { password: true },
    });
    if (!user) throw new AppError(404, 'Usuario no encontrado');
    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) throw new AppError(401, 'Contraseña actual incorrecta');

    const password = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: userId }, data: { password } });
    await prisma.refreshToken.deleteMany({ where: { userId } });
    return { message: 'Contraseña actualizada' };
  },
};
