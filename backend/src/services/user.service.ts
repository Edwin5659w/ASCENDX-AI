import bcrypt from 'bcrypt';
import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';
import { badgeService } from './badge.service';
import { pushService } from './push.service';
import type { OnboardingSetupInput } from '@ascendx/shared/validators/onboarding.validator';
import { startOfDayUTC, daysAgoUTC } from '../utils/date';
import { USER_PROFILE_SELECT } from '../constants/user-select';
import { roundMoney, toMoneyNumber } from '../utils/money';
import { buildWeeklyRecap } from '@ascendx/shared/weekly-recap';
import {
  getPlanLimits,
  REFERRAL_BONUS_XP,
  REFERRAL_PRO_TRIAL_DAYS,
  referralShareMessage,
} from '@ascendx/shared/plans';
import { XP, RETENTION_MESSAGES } from '@ascendx/shared/retention';
import { buildFirstSteps, isFirstStepsComplete } from '@ascendx/shared/first-steps';
import { planService } from './plan.service';
import { computeAscensoScore } from '@ascendx/shared/ascenso-score';
import { computeSetupScore } from '@ascendx/shared/dashboard-helpers';
import { openaiService } from './ai/openai.service';

export const userService = {
  async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: USER_PROFILE_SELECT,
    });

    if (!user) throw new AppError(404, 'Usuario no encontrado');

    const dailyBonus = await userService.claimDailyLoginBonus(userId);

    return dailyBonus ? { ...user, dailyBonus } : user;
  },

  async getStats(userId: string) {
    const today = startOfDayUTC();
    const weekStart = daysAgoUTC(7);
    const tomorrow = new Date(today);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

    const [user, goals, tasks, habits, finance, habitsCompletedToday, referralCount, userMeta] =
      await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, select: { xp: true, level: true } }),
      prisma.goal.count({ where: { userId } }),
      prisma.task.findMany({
        where: { userId },
        select: { completed: true, streakCount: true, dueDate: true, updatedAt: true },
      }),
      prisma.habit.findMany({ where: { userId }, select: { streak: true } }),
      prisma.financeRecord.findMany({ where: { userId }, select: { type: true, amount: true, createdAt: true } }),
      prisma.habitCompletion.count({ where: { userId, completedDate: today } }),
      prisma.user.count({ where: { referredById: userId } }),
      prisma.user.findUnique({
        where: { id: userId },
        select: { dailyFocus: true, dailyFocusDate: true, morningRitualDoneDate: true },
      }),
    ]);

    if (!user) throw new AppError(404, 'Usuario no encontrado');

    const completedTasks = tasks.filter((t) => t.completed).length;
    const longestStreak = Math.max(0, ...habits.map((h) => h.streak), ...tasks.map((t) => t.streakCount));

    const financeBalance = finance.reduce((acc, r) => {
      const amt = toMoneyNumber(r.amount);
      return r.type === 'INCOME' ? acc + amt : acc - amt;
    }, 0);

    const financeRecordsThisWeek = finance.filter((r) => r.createdAt >= weekStart).length;
    const tasksCompletedToday = tasks.filter(
      (t) => t.completed && t.updatedAt >= today,
    ).length;
    const tasksDueToday = tasks.filter(
      (t) =>
        !t.completed &&
        t.dueDate &&
        t.dueDate >= today &&
        t.dueDate < tomorrow,
    ).length;
    const hasDailyFocus = Boolean(
      userMeta?.dailyFocus &&
        userMeta.dailyFocusDate &&
        startOfDayUTC(userMeta.dailyFocusDate).getTime() === today.getTime(),
    );
    const setupScore = computeSetupScore({
      totalGoals: goals,
      totalTasks: tasks.length,
      completedTasks,
      activeHabits: habits.length,
      habitsCompletedToday,
      financeRecordsCount: finance.length,
    });
    const ascendScore = computeAscensoScore({
      tasksCompletedToday,
      tasksDueToday: Math.max(tasksDueToday, tasksCompletedToday > 0 ? 1 : 0),
      habitsTotal: habits.length,
      habitsCompletedToday,
      longestStreak,
      financeRecordsThisWeek,
      hasDailyFocus,
      setupScore,
    });

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
      ascendScore: ascendScore.score,
      ascendLabel: ascendScore.label,
      ascendTips: ascendScore.tips,
      morningRitualDone: Boolean(
        userMeta?.morningRitualDoneDate &&
          startOfDayUTC(userMeta.morningRitualDoneDate).getTime() === today.getTime(),
      ),
    };

    const badges = await badgeService.syncAndList(userId, {
      totalGoals: statsCore.totalGoals,
      completedTasks: statsCore.completedTasks,
      totalTasks: statsCore.totalTasks,
      activeHabits: statsCore.activeHabits,
      totalXp: statsCore.totalXp,
      level: statsCore.level,
      longestStreak: statsCore.longestStreak,
      financeRecordsCount: statsCore.financeRecordsCount,
      referralCount,
    });

    const planUsage = await planService.getUsageSummary(userId);

    let firstStepsBonus: { xpGained: number; message: string } | null = null;
    const userFlags = await prisma.user.findUnique({
      where: { id: userId },
      select: { firstStepsRewardClaimed: true },
    });
    if (userFlags && !userFlags.firstStepsRewardClaimed) {
      const steps = buildFirstSteps({
        totalGoals: statsCore.totalGoals,
        totalTasks: statsCore.totalTasks,
        completedTasks: statsCore.completedTasks,
        activeHabits: statsCore.activeHabits,
        habitsCompletedToday: statsCore.habitsCompletedToday,
        financeRecordsCount: statsCore.financeRecordsCount,
      });
      if (isFirstStepsComplete(steps)) {
        await userService.addXp(userId, XP.FIRST_STEPS_COMPLETE);
        await prisma.user.update({
          where: { id: userId },
          data: { firstStepsRewardClaimed: true },
        });
        firstStepsBonus = {
          xpGained: XP.FIRST_STEPS_COMPLETE,
          message: RETENTION_MESSAGES.firstStepsComplete(XP.FIRST_STEPS_COMPLETE),
        };
      }
    }

    return { ...statsCore, badges, planUsage, firstStepsBonus };
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
        data: { type: 'test', screen: 'profile' },
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
      EMPRENDEDOR: 'Emprendimiento',
      FITNESS: 'Fitness',
    };

    // Neon (remoto) suele superar el timeout default 5s; no usar Promise.all dentro de tx interactiva.
    return prisma.$transaction(
      async (tx) => {
        const goal = await tx.goal.create({
          data: {
            title: input.goalTitle,
            category: categoryMap[input.focus],
            priority: 'MEDIUM',
            userId,
          },
        });

        await tx.task.createMany({
          data: input.taskTitles.map((title) => ({
            title,
            userId,
            goalId: goal.id,
          })),
        });
        const tasks = await tx.task.findMany({
          where: { userId, goalId: goal.id },
          orderBy: { createdAt: 'asc' },
        });

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
          data: { onboardingDone: true, xp: { increment: XP.ONBOARDING_COMPLETE } },
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

        const leveled = Math.floor(user.xp / 100) + 1;
        const finalUser =
          leveled > user.level
            ? await tx.user.update({
                where: { id: userId },
                data: { level: leveled },
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
              })
            : user;

        return {
          user: finalUser,
          goal,
          tasks,
          habit,
          gamification: {
            xpGained: XP.ONBOARDING_COMPLETE,
            leveledUp: leveled > user.level,
            level: leveled > user.level ? leveled : user.level,
            xp: finalUser.xp,
            message: RETENTION_MESSAGES.onboardingDone(XP.ONBOARDING_COMPLETE),
          },
        };
      },
      { maxWait: 10_000, timeout: 30_000 },
    );
  },

  async updateProfile(
    userId: string,
    data: {
      name?: string;
      onboardingDone?: boolean;
      productTourDone?: boolean;
      pushToken?: string | null;
      preferredCurrency?: string;
      tradingJournalEnabled?: boolean;
      dailyFocus?: string;
      emailOptIn?: boolean;
      themePreference?: string;
    },
  ) {
    const payload: {
      name?: string;
      onboardingDone?: boolean;
      productTourDone?: boolean;
      pushToken?: string | null;
      preferredCurrency?: string;
      tradingJournalEnabled?: boolean;
      dailyFocus?: string;
      dailyFocusDate?: Date;
      emailOptIn?: boolean;
      themePreference?: string;
    } = { ...data };
    if (payload.pushToken !== undefined) {
      payload.pushToken = payload.pushToken && payload.pushToken.length > 0 ? payload.pushToken : null;
    }
    if (payload.dailyFocus !== undefined) {
      payload.dailyFocusDate = startOfDayUTC();
    }
    if (data.tradingJournalEnabled === true) {
      await planService.assertCanEnableTrading(userId);
    }

    return prisma.user.update({
      where: { id: userId },
      data: payload,
      select: USER_PROFILE_SELECT,
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

  async claimDailyLoginBonus(userId: string) {
    const today = startOfDayUTC();
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { lastDailyBonusDate: true, level: true },
    });
    if (!user) throw new AppError(404, 'Usuario no encontrado');

    const last = user.lastDailyBonusDate
      ? startOfDayUTC(user.lastDailyBonusDate)
      : null;
    if (last && last.getTime() === today.getTime()) {
      return null;
    }

    await prisma.user.update({
      where: { id: userId },
      data: { lastDailyBonusDate: today },
    });
    const result = await userService.addXp(userId, XP.DAILY_LOGIN);
    return {
      xpGained: XP.DAILY_LOGIN,
      leveledUp: result.leveledUp,
      level: result.level,
      xp: result.xp,
      dailyBonus: true,
      message: RETENTION_MESSAGES.dailyBonus(XP.DAILY_LOGIN),
    };
  },

  async getWeeklyRecap(userId: string) {
    const plan = await planService.getUserPlan(userId);
    const limits = getPlanLimits(plan);
    if (!limits.weeklyRecap) {
      throw new AppError(403, 'El resumen semanal es una función Pro. Mejora tu plan en Perfil.');
    }

    const weekStart = daysAgoUTC(7);
    const [tasksCompleted, tasksCreated, habitsCompleted, activeHabits, goals, finance, user] =
      await Promise.all([
        prisma.task.count({
          where: { userId, completed: true, updatedAt: { gte: weekStart } },
        }),
        prisma.task.count({ where: { userId, createdAt: { gte: weekStart } } }),
        prisma.habitCompletion.count({
          where: { userId, completedDate: { gte: weekStart } },
        }),
        prisma.habit.count({ where: { userId } }),
        prisma.goal.findMany({ where: { userId }, select: { progress: true } }),
        prisma.financeRecord.findMany({ where: { userId }, select: { type: true, amount: true } }),
        prisma.user.findUnique({ where: { id: userId }, select: { xp: true, level: true } }),
      ]);

    const habits = await prisma.habit.findMany({ where: { userId }, select: { streak: true } });
    const longestStreak = Math.max(0, ...habits.map((h) => h.streak));
    const goalsProgress = goals.reduce((sum, g) => sum + g.progress, 0);

    const financeBalance = finance.reduce((acc, r) => {
      const amt = toMoneyNumber(r.amount);
      return r.type === 'INCOME' ? acc + amt : acc - amt;
    }, 0);

    return openaiService.enrichWeeklyRecap(
      userId,
      buildWeeklyRecap({
        tasksCompleted,
        tasksCreated,
        habitsCompleted,
        activeHabits,
        xpGained: Math.min(user?.xp ?? 0, 200),
        longestStreak,
        goalsProgress,
        financeBalance: roundMoney(financeBalance),
      }),
    );
  },

  async getReferralInfo(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { referralCode: true },
    });
    if (!user) throw new AppError(404, 'Usuario no encontrado');

    const referralCount = await prisma.user.count({ where: { referredById: userId } });
    return {
      referralCode: user.referralCode,
      referralCount,
      bonusXp: REFERRAL_BONUS_XP,
      trialDays: REFERRAL_PRO_TRIAL_DAYS,
      shareMessage: referralShareMessage(user.referralCode),
    };
  },

  async upgradeToPro(userId: string) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { plan: 'PRO', streakShields: { increment: 2 } },
      select: USER_PROFILE_SELECT,
    });
    return user;
  },

  async deleteAccount(userId: string, password: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { password: true },
    });
    if (!user) throw new AppError(404, 'Usuario no encontrado');

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new AppError(401, 'Contraseña incorrecta');

    await prisma.user.delete({ where: { id: userId } });
    return { ok: true as const };
  },

  async exportUserData(userId: string) {
    const [profile, goals, tasks, habits, finance, trades, insights] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          xp: true,
          level: true,
          plan: true,
          referralCode: true,
          createdAt: true,
        },
      }),
      prisma.goal.findMany({ where: { userId } }),
      prisma.task.findMany({ where: { userId } }),
      prisma.habit.findMany({ where: { userId }, include: { completions: true } }),
      prisma.financeRecord.findMany({ where: { userId } }),
      prisma.trade.findMany({ where: { userId } }),
      prisma.aIInsight.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 500,
      }),
    ]);

    if (!profile) throw new AppError(404, 'Usuario no encontrado');

    return {
      exportedAt: new Date().toISOString(),
      profile,
      goals,
      tasks,
      habits,
      finance,
      trades,
      aiInsights: insights,
    };
  },

  async completeMorningRitual(userId: string) {
    const today = startOfDayUTC();
    await prisma.user.update({
      where: { id: userId },
      data: { morningRitualDoneDate: today },
    });
    return { ok: true };
  },

  async search(userId: string, q: string) {
    const query = q.trim();
    if (query.length < 2) return { goals: [], tasks: [], habits: [] };
    const [goals, tasks, habits] = await Promise.all([
      prisma.goal.findMany({
        where: { userId, title: { contains: query, mode: 'insensitive' } },
        take: 8,
        select: { id: true, title: true },
      }),
      prisma.task.findMany({
        where: { userId, title: { contains: query, mode: 'insensitive' } },
        take: 8,
        select: { id: true, title: true, completed: true },
      }),
      prisma.habit.findMany({
        where: { userId, name: { contains: query, mode: 'insensitive' } },
        take: 8,
        select: { id: true, name: true },
      }),
    ]);
    return { goals, tasks, habits };
  },
};
