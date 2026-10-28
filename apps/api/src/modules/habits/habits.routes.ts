import { evaluateAchievements, monthKey, todayInBogota, weeklyStreak } from '@ascendx/finance-core';
import { Router } from 'express';
import { toCalendarDate } from '../../lib/calendar.js';
import { prisma } from '../../lib/prisma.js';
import { currentUserId, protectedRoute } from '../../middleware/require-auth.js';
import { financialSnapshot } from '../finance/snapshot.service.js';

/**
 * RF-32: racha semanal, hitos e insignias. Solo cuentan los registros que
 * hace el usuario (no los recurrentes automáticos), los aportes, las metas
 * cumplidas, el fondo de emergencia y las deudas terminadas de pagar.
 */
export const habitsRouter = Router();
habitsRouter.use(protectedRoute);

habitsRouter.get('/', async (req, res) => {
  const userId = currentUserId(req);
  const today = todayInBogota();
  const [activity, movements, goals, contributions, goalsCompleted, debtsPaidOff, snapshot, stored] = await Promise.all([
    prisma.$queryRaw<{ day: Date }[]>`
      SELECT DISTINCT (created_at AT TIME ZONE 'America/Bogota')::date AS day
      FROM transactions
      WHERE user_id = ${userId}::uuid AND deleted_at IS NULL AND source <> 'recurrente'
        AND created_at > now() - interval '2 years'`,
    prisma.transaction.count({ where: { userId, deletedAt: null, source: { not: 'recurrente' } } }),
    prisma.financialGoal.count({ where: { userId, deletedAt: null } }),
    prisma.goalContribution.count({ where: { userId, amount: { gt: 0 } } }),
    prisma.financialGoal.count({ where: { userId, deletedAt: null, status: 'completada' } }),
    prisma.debt.count({ where: { userId, deletedAt: null, status: 'pagada' } }),
    financialSnapshot(userId, { today }),
    prisma.userAchievement.findMany({ where: { userId } }),
  ]);

  const streak = weeklyStreak(
    activity.map((row) => toCalendarDate(row.day)),
    today,
  );
  const currentMonth = monthKey(today);
  // Meses ya cerrados en los que registró ingresos y le sobró dinero.
  const positiveMonths = snapshot.evolution.filter((m) => m.month < currentMonth && m.income > 0 && m.netFlow > 0).length;

  const progress = evaluateAchievements({
    movements,
    bestWeeklyStreak: streak.best,
    goals,
    contributions,
    goalsCompleted,
    emergencyMonths: snapshot.emergency?.months ?? 0,
    positiveMonths,
    debtsPaidOff,
  });

  // Un logro ganado se conserva aunque luego cambien los datos.
  const earnedAt = new Map(stored.map((a) => [a.achievementCode, a.earnedAt]));
  const newlyEarned = progress.filter((p) => p.earned && !earnedAt.has(p.code));
  if (newlyEarned.length) {
    await prisma.userAchievement.createMany({
      data: newlyEarned.map((p) => ({ userId, achievementCode: p.code })),
      skipDuplicates: true,
    });
    const now = new Date();
    newlyEarned.forEach((p) => earnedAt.set(p.code, now));
  }

  const achievements = progress.map((p) => {
    const date = earnedAt.get(p.code);
    return { ...p, earned: Boolean(date), current: date ? p.target : p.current, earnedAt: date ? date.toISOString() : null };
  });
  res.json({
    streak,
    achievements,
    earnedCount: achievements.filter((a) => a.earned).length,
    newlyEarned: newlyEarned.map((p) => p.code),
  });
});
