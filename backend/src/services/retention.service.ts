import { prisma } from '../lib/prisma';
import { env } from '../config/env';
import { emailService } from './email.service';
import { planService } from './plan.service';
import { pushService } from './push.service';
import { startOfDayUTC } from '../utils/date';
import type { EmailTemplate } from '@ascendx/shared/retention-playbook';

const COOLDOWN_DAYS: Partial<Record<EmailTemplate, number>> = {
  streak_at_risk: 1,
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
    const today = startOfDayUTC();

    const habits = await prisma.habit.findMany({
      where: { streak: { gte: 2 }, frequency: 'DAILY' },
      include: {
        user: {
          select: { id: true, name: true, email: true, emailOptIn: true, pushToken: true },
        },
        completions: {
          where: { completedDate: today },
          take: 1,
        },
      },
    });

    const notifiedUsers = new Set<string>();

    for (const h of habits) {
      if (h.completions.length > 0) continue;
      if (notifiedUsers.has(h.user.id)) continue;
      if (await wasSentRecently(h.user.id, 'streak_at_risk', COOLDOWN_DAYS.streak_at_risk ?? 1)) {
        continue;
      }

      let sent = false;
      if (h.user.emailOptIn) {
        const ok = await emailService.sendStreakAtRisk(h.user.email, h.user.name, h.name, h.streak);
        if (ok) sent = true;
      }

      if (h.user.pushToken) {
        const push = await pushService.sendToUser(h.user.id, {
          title: 'Tu racha está en peligro 🔥',
          body: `"${h.name}" · ${h.streak} días. Márcalo hoy para no perderla.`,
          data: { type: 'streak_at_risk', habitId: h.id },
        });
        if (push.sent) sent = true;
      }

      if (sent) {
        await logSent(h.user.id, 'streak_at_risk');
        notifiedUsers.add(h.user.id);
      }
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

  // Empuje vespertino: rachas en peligro (20:00 UTC)
  cron.schedule('0 20 * * *', () => {
    void retentionService.sendStreakAtRiskEmails().catch((err) => {
      console.error('[retention] Error streak-at-risk:', err);
    });
  });
  console.log('[retention] Cron diario activo (09:00 UTC) + rachas 20:00 UTC');
}
