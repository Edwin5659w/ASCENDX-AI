import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { sendSuccess } from '../utils/response';
import { billingService } from '../services/billing.service';

const router = Router();

router.get('/stats', async (_req, res, next) => {
  try {
    const [users, tasksCompleted, habitsCompleted] = await Promise.all([
      prisma.user.count(),
      prisma.task.count({ where: { completed: true } }),
      prisma.habitCompletion.count(),
    ]);

    sendSuccess(res, {
      users: Math.max(users, 1),
      tasksCompleted: Math.max(tasksCompleted, 0),
      habitsCompleted: Math.max(habitsCompleted, 0),
      tagline: 'Life OS con mentor IA en español',
    });
  } catch (e) {
    next(e);
  }
});

/** Público: permite a Pricing/landing saber si Stripe está listo sin auth. */
router.get('/billing', (_req, res) => {
  sendSuccess(res, { billingConfigured: billingService.isConfigured() });
});

export default router;
