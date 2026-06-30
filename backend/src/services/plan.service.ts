import { prisma } from '../lib/prisma';
import { startOfDayUTC } from '../utils/date';
import { getPlanLimits, type PlanTier } from '@ascendx/shared/plans';
import { AppError } from '../middleware/errorHandler';

export const planService = {
  async assertTradingAccess(userId: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { plan: true, tradingJournalEnabled: true },
    });
    if (!user) throw new AppError(404, 'Usuario no encontrado');
    const limits = getPlanLimits(user.plan as PlanTier);
    if (!limits.tradingJournal) {
      throw new AppError(403, 'El diario de trading requiere plan Pro.');
    }
    if (!user.tradingJournalEnabled) {
      throw new AppError(403, 'Activa el diario de trading en Perfil (solo Pro).');
    }
  },

  async assertCanEnableTrading(userId: string): Promise<void> {
    const plan = await this.getUserPlan(userId);
    const limits = getPlanLimits(plan);
    if (!limits.tradingJournal) {
      throw new AppError(402, 'El diario de trading es exclusivo de Pro. Mejora tu plan en Perfil.');
    }
  },

  async refillMonthlyShields(): Promise<number> {
    const now = new Date();
    if (now.getUTCDate() !== 1) return 0;

    const monthKey = `shield_refill_${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
    const users = await prisma.user.findMany({
      select: { id: true, plan: true, streakShields: true },
    });

    let refilled = 0;
    for (const u of users) {
      const already = await prisma.emailLog.findFirst({
        where: { userId: u.id, template: monthKey },
      });
      if (already) continue;

      const allowance = getPlanLimits(u.plan as PlanTier).streakShieldsPerMonth;
      const next = Math.max(u.streakShields, allowance);
      if (next !== u.streakShields) {
        await prisma.user.update({
          where: { id: u.id },
          data: { streakShields: next },
        });
      }
      await prisma.emailLog.create({ data: { userId: u.id, template: monthKey } });
      refilled += 1;
    }
    return refilled;
  },
  async getUserPlan(userId: string): Promise<PlanTier> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { plan: true },
    });
    return (user?.plan as PlanTier) ?? 'FREE';
  },

  async getAiUsageToday(userId: string): Promise<number> {
    const todayStart = startOfDayUTC();
    return prisma.aIInsight.count({
      where: {
        userId,
        type: 'CHAT',
        createdAt: { gte: todayStart },
      },
    });
  },

  async assertCanChat(userId: string): Promise<{ plan: PlanTier; used: number; limit: number }> {
    const plan = await this.getUserPlan(userId);
    const limits = getPlanLimits(plan);
    const used = await this.getAiUsageToday(userId);

    if (used >= limits.aiChatPerDay) {
      throw new AppError(
        402,
        plan === 'FREE'
          ? `Límite diario alcanzado (${limits.aiChatPerDay} mensajes). Pasa a Pro para 100/día + resumen semanal.`
          : `Límite diario alcanzado (${limits.aiChatPerDay} mensajes). Vuelve mañana.`,
        'AI_LIMIT_REACHED',
        { used, limit: limits.aiChatPerDay, plan, upgrade: plan === 'FREE' },
      );
    }

    return { plan, used, limit: limits.aiChatPerDay };
  },

  async getUsageSummary(userId: string) {
    const plan = await this.getUserPlan(userId);
    const limits = getPlanLimits(plan);
    const aiChatUsed = await this.getAiUsageToday(userId);
    const [goals, habits, referrals] = await Promise.all([
      prisma.goal.count({ where: { userId } }),
      prisma.habit.count({ where: { userId } }),
      prisma.user.count({ where: { referredById: userId } }),
    ]);

    return {
      plan,
      limits,
      usage: {
        aiChatToday: aiChatUsed,
        goals,
        habits,
        referrals,
      },
    };
  },
};
