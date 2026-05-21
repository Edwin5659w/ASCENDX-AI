import type { User, UserBadgeDto, UserStats } from '@/src/types/api';

export const XP_PER_LEVEL = 100;

export function xpProgress(xp: number) {
  const inLevel = xp % XP_PER_LEVEL;
  return {
    pct: inLevel,
    toNext: inLevel === 0 && xp > 0 ? XP_PER_LEVEL : XP_PER_LEVEL - inLevel,
  };
}

export function fallbackBadges(user: User, stats: UserStats | null): UserBadgeDto[] {
  const level = user.level;
  return [
    {
      slug: 'FIRST_TASK',
      title: 'En marcha',
      subtitle: 'Primera tarea completada',
      unlocked: (stats?.completedTasks ?? 0) >= 1,
      unlockedAt: null,
    },
    {
      slug: 'STREAK_7',
      title: 'Constancia',
      subtitle: 'Racha de 7 días o más',
      unlocked: (stats?.longestStreak ?? 0) >= 7,
      unlockedAt: null,
    },
    {
      slug: 'GOALS_3',
      title: 'Visionario',
      subtitle: '3+ objetivos creados',
      unlocked: (stats?.totalGoals ?? 0) >= 3,
      unlockedAt: null,
    },
    {
      slug: 'LEVEL_5',
      title: 'Ascenso',
      subtitle: 'Alcanza el nivel 5',
      unlocked: level >= 5,
      unlockedAt: null,
    },
    {
      slug: 'STEEL',
      title: 'Acero',
      subtitle: '3 hábitos y racha 3+',
      unlocked: (stats?.activeHabits ?? 0) >= 3 && (stats?.longestStreak ?? 0) >= 3,
      unlockedAt: null,
    },
    {
      slug: 'XP_500',
      title: 'Veterano',
      subtitle: '500 XP totales',
      unlocked: (stats?.totalXp ?? user.xp) >= 500,
      unlockedAt: null,
    },
  ];
}

export function resolveBadges(user: User, stats: UserStats | null): UserBadgeDto[] {
  if (stats?.badges && stats.badges.length > 0) return stats.badges;
  return fallbackBadges(user, stats);
}
