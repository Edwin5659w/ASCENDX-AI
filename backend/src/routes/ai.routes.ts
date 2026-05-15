import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { sendSuccess } from '../utils/response';
import { openaiService } from '../services/ai/openai.service';
import { chatSchema } from '@ascendx/shared/validators/ai.validator';
import { prisma } from '../lib/prisma';

const router = Router();

router.use(requireAuth);

router.get('/daily-plan', async (req, res, next) => {
  try {
    const plan = await openaiService.generateDailyPlan(req.user!.userId);
    const warning = await openaiService.detectProcrastination(req.user!.userId);
    sendSuccess(res, { plan, procrastinationWarning: warning });
  } catch (e) {
    next(e);
  }
});

router.post('/chat', validate(chatSchema), async (req, res, next) => {
  try {
    const reply = await openaiService.chat(req.user!.userId, req.body.message);
    sendSuccess(res, { reply });
  } catch (e) {
    next(e);
  }
});

router.get('/insights', async (req, res, next) => {
  try {
    const insights = await prisma.aIInsight.findMany({
      where: { userId: req.user!.userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    sendSuccess(res, insights);
  } catch (e) {
    next(e);
  }
});

export default router;
