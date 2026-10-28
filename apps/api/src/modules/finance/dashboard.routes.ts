import { Router } from 'express';
import { z } from 'zod';
import { monthSchema } from '../../lib/calendar.js';
import { prisma } from '../../lib/prisma.js';
import { currentUserId, protectedRoute } from '../../middleware/require-auth.js';
import { parseQuery } from '../../middleware/validate.js';
import { presentTransaction, transactionInclude } from '../transactions/transactions.service.js';
import { runDueRecurring } from '../recurring/recurring.service.js';
import { financialSnapshot } from './snapshot.service.js';

/** RF-13 a RF-15: panel del mes con capacidad de ahorro, gráficos, metas y deudas. */
export const dashboardRouter = Router();
dashboardRouter.use(protectedRoute);

const PRIORITY_ORDER = { alta: 0, media: 1, baja: 2 } as const;

dashboardRouter.get('/', async (req, res) => {
  const userId = currentUserId(req);
  const { month } = parseQuery(z.object({ month: monthSchema.optional() }), req);
  // RF-30: antes de calcular, se crean los movimientos recurrentes que vencieron.
  await runDueRecurring(userId);
  const [snapshot, recent] = await Promise.all([
    financialSnapshot(userId, { month }),
    prisma.transaction.findMany({
      where: { userId, deletedAt: null },
      include: transactionInclude,
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
      take: 5,
    }),
  ]);
  const priorityGoal =
    [...snapshot.goals]
      .filter((goal) => goal.status === 'activa')
      .sort(
        (a, b) =>
          PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority] ||
          (a.targetDate ?? '9999-12-31').localeCompare(b.targetDate ?? '9999-12-31'),
      )[0] ?? null;
  res.json({ ...snapshot, priorityGoal, recent: recent.map(presentTransaction) });
});
