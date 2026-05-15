import { prisma } from '../lib/prisma';

export interface StatsForBadges {
  totalGoals: number;
  completedTasks: number;
  totalTasks: number;
  activeHabits: number;
  totalXp: number;
  level: number;
  longestStreak: number;
}

export interface BadgeWithStatus {
  slug: string;
  title: string;
  subtitle: string;
  unlocked: boolean;
  unlockedAt: string | null;
}

const RULES: Record<string, (c: StatsForBadges) => boolean> = {
  FIRST_TASK: (c) => c.completedTasks >= 1,
  STREAK_7: (c) => c.longestStreak >= 7,
  GOALS_3: (c) => c.totalGoals >= 3,
  LEVEL_5: (c) => c.level >= 5,
  STEEL: (c) => c.activeHabits >= 3 && c.longestStreak >= 3,
  XP_500: (c) => c.totalXp >= 500,
};

export const badgeService = {
  async syncAndList(userId: string, ctx: StatsForBadges): Promise<BadgeWithStatus[]> {
    const all = await prisma.badge.findMany({ orderBy: { sortOrder: 'asc' } });

    for (const b of all) {
      const rule = RULES[b.id];
      if (!rule || !rule(ctx)) continue;

      await prisma.userBadge.upsert({
        where: { userId_badgeId: { userId, badgeId: b.id } },
        create: { userId, badgeId: b.id },
        update: {},
      });
    }

    const unlockedRows = await prisma.userBadge.findMany({
      where: { userId },
      select: { badgeId: true, unlockedAt: true },
    });
    const unlockMap = new Map(unlockedRows.map((r) => [r.badgeId, r.unlockedAt]));

    return all.map((b) => ({
      slug: b.id,
      title: b.title,
      subtitle: b.subtitle,
      unlocked: unlockMap.has(b.id),
      unlockedAt: unlockMap.get(b.id)?.toISOString() ?? null,
    }));
  },
};
