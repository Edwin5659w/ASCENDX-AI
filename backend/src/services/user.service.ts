import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';

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
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) throw new AppError(404, 'Usuario no encontrado');
    return user;
  },

  async getStats(userId: string) {
    const [user, goals, tasks, habits, finance] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, select: { xp: true, level: true } }),
      prisma.goal.count({ where: { userId } }),
      prisma.task.findMany({ where: { userId }, select: { completed: true, streakCount: true } }),
      prisma.habit.findMany({ where: { userId }, select: { streak: true } }),
      prisma.financeRecord.findMany({ where: { userId }, select: { type: true, amount: true } }),
    ]);

    if (!user) throw new AppError(404, 'Usuario no encontrado');

    const completedTasks = tasks.filter((t) => t.completed).length;
    const longestStreak = Math.max(0, ...habits.map((h) => h.streak), ...tasks.map((t) => t.streakCount));

    const financeBalance = finance.reduce((acc, r) => {
      return r.type === 'INCOME' ? acc + r.amount : acc - r.amount;
    }, 0);

    return {
      totalGoals: goals,
      completedTasks,
      totalTasks: tasks.length,
      activeHabits: habits.length,
      totalXp: user.xp,
      level: user.level,
      longestStreak,
      financeBalance: Math.round(financeBalance * 100) / 100,
    };
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

  async updateProfile(userId: string, data: { name?: string; onboardingDone?: boolean }) {
    return prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        xp: true,
        level: true,
        onboardingDone: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  },
};
