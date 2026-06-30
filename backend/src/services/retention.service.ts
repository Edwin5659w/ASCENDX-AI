import { prisma } from '../lib/prisma';
import { env } from '../config/env';
import { emailService } from './email.service';
import { planService } from './plan.service';
import type { EmailTemplate } from '@ascendx/shared/retention-playbook';

const COOLDOWN_DAYS: Partial<Record<EmailTemplate, number>> = {
  streak_at_risk: 6,
  dormant_7d: 14,
  day3_upgrade: 999,
  day1_nudge: 999,
  welcome: 999,
  pro_welcome: 999,
  pro_winback: 999,
};

function appUrl(): string {
  return env.WEB_APP_ORIGIN.replace(/\/$/, '');
}

async function wasSentRecently(userId: string, template: string, withinDays: number): Promise<boolean> {
  const since = new Date();
  since.setDate(since.getDate() - withinDays);
  const existing = await prisma.emailLog.findFirst({
    where: { userId, template, sentAt: { gte: since } },
  });
  return Boolean(existing);
}

async function logSent(userId: string, template: string) {
  await prisma.emailLog.create({ data: { userId, template } });
}

export const retentionService = {
  async sendWelcome(userId: string, email: string, name: string) {
    if (await wasSentRecently(userId, 'welcome', COOLDOWN_DAYS.welcome ?? 365)) return;
    const ok = await emailService.sendWelcome(email, name);
    if (ok) await logSent(userId, 'welcome');
  },

  async sendDay1Nudges() {
    const dayAgo = new Date();
    dayAgo.setDate(dayAgo.getDate() - 1);
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    const users = await prisma.user.findMany({
      where: {
        emailOptIn: true,
        createdAt: { gte: twoDaysAgo, lte: dayAgo },
        onboardingDone: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        tasks: { where: { completed: true }, take: 1 },
      },
    });

    for (const u of users) {
      if (u.tasks.length > 0) continue;
      if (await wasSentRecently(u.id, 'day1_nudge', COOLDOWN_DAYS.day1_nudge ?? 365)) continue;
      const ok = await emailService.sendDay1Nudge(u.email, u.name);
      if (ok) await logSent(u.id, 'day1_nudge');
    }
  },

  async sendDay3UpgradeNudges() {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    const fourDaysAgo = new Date();
    fourDaysAgo.setDate(fourDaysAgo.getDate() - 4);

    const users = await prisma.user.findMany({
      where: {
        emailOptIn: true,
        plan: 'FREE',
        createdAt: { gte: fourDaysAgo, lte: threeDaysAgo },
        xp: { gte: 30 },
      },
      select: { id: true, name: true, email: true },
    });

    for (const u of users) {
      if (await wasSentRecently(u.id, 'day3_upgrade', COOLDOWN_DAYS.day3_upgrade ?? 365)) continue;
      const ok = await emailService.sendDay3Upgrade(u.email, u.name);
      if (ok) await logSent(u.id, 'day3_upgrade');
    }
  },

  async sendStreakAtRiskEmails() {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const habits = await prisma.habit.findMany({
      where: { streak: { gte: 3 }, frequency: 'DAILY' },
      include: {
        user: { select: { id: true, name: true, email: true, emailOptIn: true } },
        completions: {
          where: { completedDate: yesterday },
          take: 1,
        },
      },
    });

    for (const h of habits) {
      if (!h.user.emailOptIn || h.completions.length > 0) continue;
      if (await wasSentRecently(h.user.id, 'streak_at_risk', COOLDOWN_DAYS.streak_at_risk ?? 6)) continue;
      const ok = await emailService.sendStreakAtRisk(h.user.email, h.user.name, h.name, h.streak);
      if (ok) await logSent(h.user.id, 'streak_at_risk');
    }
  },

  async sendDormantEmails() {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const users = await prisma.user.findMany({
      where: {
        emailOptIn: true,
        OR: [
          { lastDailyBonusDate: { lt: sevenDaysAgo } },
          { lastDailyBonusDate: null, updatedAt: { lt: sevenDaysAgo } },
        ],
      },
      select: { id: true, name: true, email: true },
      take: 200,
    });

    for (const u of users) {
      if (await wasSentRecently(u.id, 'dormant_7d', COOLDOWN_DAYS.dormant_7d ?? 14)) continue;
      const ok = await emailService.sendDormant(u.email, u.name);
      if (ok) await logSent(u.id, 'dormant_7d');
    }
  },

  async runDailyJobs() {
    const shields = await planService.refillMonthlyShields();
    if (shields > 0) {
      console.log(`[retention] Escudos recargados para ${shields} usuario(s)`);
    }

    if (!emailService.isConfigured()) {
      console.log('[retention] Emails omitidos — Resend no configurado');
      return;
    }
    console.log('[retention] Ejecutando jobs diarios...');
    await this.sendDay1Nudges();
    await this.sendDay3UpgradeNudges();
    await this.sendStreakAtRiskEmails();
    await this.sendDormantEmails();
    console.log('[retention] Jobs diarios completados');
  },
};

export function startRetentionScheduler() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const cron = require('node-cron') as typeof import('node-cron');

  cron.schedule('5 0 1 * *', () => {
    void planService.refillMonthlyShields().catch((err) => {
      console.error('[retention] Error recargando escudos:', err);
    });
  });

  if (!env.RETENTION_CRON_ENABLED) return;

  cron.schedule('0 9 * * *', () => {
    void retentionService.runDailyJobs().catch((err) => {
      console.error('[retention] Error en cron:', err);
    });
  });
  console.log('[retention] Cron diario activo (09:00 UTC)');
}
