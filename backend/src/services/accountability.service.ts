import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';
import { computeAscensoScore } from '@ascendx/shared/ascenso-score';
import { computeSetupScore } from '@ascendx/shared/dashboard-helpers';
import { startOfDayUTC, daysAgoUTC } from '../utils/date';
import { generateAccountabilityCode } from '../utils/referral';

export const accountabilityService = {
  async ensureCode(userId: string): Promise<string> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { accountabilityCode: true },
    });
    if (!user) throw new AppError(404, 'Usuario no encontrado');
    if (user.accountabilityCode) return user.accountabilityCode;

    let code = generateAccountabilityCode();
    for (let i = 0; i < 5; i++) {
      const taken = await prisma.user.findUnique({ where: { accountabilityCode: code } });
      if (!taken) break;
      code = generateAccountabilityCode();
    }
    await prisma.user.update({ where: { id: userId }, data: { accountabilityCode: code } });
    return code;
  },

  async linkPartner(userId: string, partnerCode: string) {
    const code = partnerCode.trim().toUpperCase();
    const partner = await prisma.user.findUnique({
      where: { accountabilityCode: code },
      select: { id: true, name: true },
    });
    if (!partner) throw new AppError(404, 'Código de accountability no encontrado');
    if (partner.id === userId) throw new AppError(400, 'No puedes vincularte contigo mismo');

    const existing = await prisma.accountabilityLink.findFirst({
      where: {
        OR: [
          { userId, partnerId: partner.id },
          { userId: partner.id, partnerId: userId },
        ],
      },
    });
    if (existing) throw new AppError(409, 'Ya están vinculados');

    await prisma.accountabilityLink.create({
      data: { userId, partnerId: partner.id },
    });

    return { partnerName: partner.name, partnerId: partner.id };
  },

  async listPartners(userId: string) {
    const links = await prisma.accountabilityLink.findMany({
      where: { OR: [{ userId }, { partnerId: userId }] },
    });
    const partnerIds = links.map((l) => (l.userId === userId ? l.partnerId : l.userId));
    if (partnerIds.length === 0) return [];

    const partners = await prisma.user.findMany({
      where: { id: { in: partnerIds } },
      select: { id: true, name: true },
    });

    const today = startOfDayUTC();
    const weekStart = daysAgoUTC(7);

    return Promise.all(
      partners.map(async (p) => {
        const [tasksToday, habitsTotal, habitsDone, tasks] = await Promise.all([
          prisma.task.count({
            where: { userId: p.id, completed: true, updatedAt: { gte: today } },
          }),
          prisma.habit.count({ where: { userId: p.id } }),
          prisma.habitCompletion.count({ where: { userId: p.id, completedDate: today } }),
          prisma.task.findMany({ where: { userId: p.id }, select: { completed: true } }),
        ]);
        const setupScore = computeSetupScore({
          totalGoals: await prisma.goal.count({ where: { userId: p.id } }),
          totalTasks: tasks.length,
          completedTasks: tasks.filter((t) => t.completed).length,
          activeHabits: habitsTotal,
          habitsCompletedToday: habitsDone,
          financeRecordsCount: await prisma.financeRecord.count({
            where: { userId: p.id, createdAt: { gte: weekStart } },
          }),
        });
        const { score, label } = computeAscensoScore({
          tasksCompletedToday: tasksToday,
          tasksDueToday: 1,
          habitsTotal,
          habitsCompletedToday: habitsDone,
          longestStreak: 0,
          financeRecordsThisWeek: 0,
          hasDailyFocus: false,
          setupScore,
        });
        return { id: p.id, name: p.name, ascendScore: score, ascendLabel: label };
      }),
    );
  },

  async unlinkPartner(userId: string, partnerId: string) {
    const deleted = await prisma.accountabilityLink.deleteMany({
      where: {
        OR: [
          { userId, partnerId },
          { userId: partnerId, partnerId: userId },
        ],
      },
    });
    if (deleted.count === 0) throw new AppError(404, 'Vínculo no encontrado');
    return { ok: true };
  },
};
