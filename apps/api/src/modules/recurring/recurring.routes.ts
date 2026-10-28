import { nextOccurrence, parseCalendarDate, RECURRENCE_FREQUENCIES, todayInBogota } from '@ascendx/finance-core';
import { Router } from 'express';
import { z } from 'zod';
import type { Prisma } from '../../generated/prisma/client.js';
import { calendarDateSchema, fromCalendarDate, positivePesosSchema, toCalendarDate, uuidSchema } from '../../lib/calendar.js';
import { HttpError } from '../../lib/http-error.js';
import { prisma } from '../../lib/prisma.js';
import { currentUserId, protectedRoute } from '../../middleware/require-auth.js';
import { parseBody, parseParams } from '../../middleware/validate.js';
import { visibleCategoriesWhere } from '../categories/categories.routes.js';
import { runDueRecurring } from './recurring.service.js';

/** RF-30: movimientos recurrentes (arriendo, salario, suscripciones…). */
export const recurringRouter = Router();
recurringRouter.use(protectedRoute);

const include = {
  category: { select: { id: true, name: true, icon: true, color: true } },
  account: { select: { id: true, name: true } },
} as const;

type RuleWithRelations = Prisma.RecurringTransactionGetPayload<{ include: typeof include }>;

function presentRule(rule: RuleWithRelations) {
  return {
    id: rule.id,
    type: rule.type,
    amount: Number(rule.amount),
    description: rule.description,
    frequency: rule.frequency,
    anchorDay: rule.anchorDay,
    nextDate: toCalendarDate(rule.nextDate),
    active: rule.active,
    category: rule.category,
    account: rule.account,
  };
}

async function ownRule(userId: string, id: string) {
  const rule = await prisma.recurringTransaction.findFirst({ where: { id, userId } });
  if (!rule) throw HttpError.notFound('Movimiento recurrente no encontrado');
  return rule;
}

async function checkReferences(userId: string, categoryId?: string, accountId?: string | null) {
  if (categoryId) {
    const category = await prisma.category.findFirst({ where: { id: categoryId, ...visibleCategoriesWhere(userId) } });
    if (!category) throw HttpError.badRequest('La categoría no existe');
  }
  if (accountId) {
    const account = await prisma.account.findFirst({ where: { id: accountId, userId, archivedAt: null } });
    if (!account) throw HttpError.badRequest('La cuenta no existe');
  }
}

recurringRouter.get('/', async (req, res) => {
  const userId = currentUserId(req);
  const rules = await prisma.recurringTransaction.findMany({ where: { userId }, include, orderBy: [{ active: 'desc' }, { nextDate: 'asc' }] });
  const presented = rules.map(presentRule);
  const monthly = presented
    .filter((r) => r.active)
    .reduce(
      (acc, r) => {
        const perMonth = r.frequency === 'mensual' ? r.amount : r.frequency === 'quincenal' ? r.amount * 2 : Math.round((r.amount * 52) / 12);
        acc[r.type === 'ingreso' ? 'income' : 'expenses'] += perMonth;
        return acc;
      },
      { income: 0, expenses: 0 },
    );
  res.json({ rules: presented, monthly });
});

const createSchema = z.object({
  type: z.enum(['ingreso', 'gasto']),
  amount: positivePesosSchema,
  categoryId: uuidSchema,
  description: z.string().trim().max(200).nullable().optional(),
  frequency: z.enum(RECURRENCE_FREQUENCIES),
  /** Primera fecha en que se crea el movimiento */
  startDate: calendarDateSchema,
  accountId: uuidSchema.nullable().optional(),
});

recurringRouter.post('/', async (req, res) => {
  const userId = currentUserId(req);
  const input = parseBody(createSchema, req);
  await checkReferences(userId, input.categoryId, input.accountId);
  const rule = await prisma.recurringTransaction.create({
    data: {
      userId,
      type: input.type,
      amount: BigInt(input.amount),
      categoryId: input.categoryId,
      description: input.description?.trim() || null,
      frequency: input.frequency,
      anchorDay: input.frequency === 'semanal' ? null : parseCalendarDate(input.startDate).day,
      accountId: input.accountId ?? null,
      nextDate: fromCalendarDate(input.startDate),
    },
  });
  // Si la primera fecha ya llegó, el movimiento se crea de una vez.
  const created = await runDueRecurring(userId);
  const fresh = await prisma.recurringTransaction.findUniqueOrThrow({ where: { id: rule.id }, include });
  res.status(201).json({ rule: presentRule(fresh), created });
});

const idParams = z.object({ id: uuidSchema });

const updateSchema = z
  .object({
    amount: positivePesosSchema.optional(),
    categoryId: uuidSchema.optional(),
    description: z.string().trim().max(200).nullable().optional(),
    accountId: uuidSchema.nullable().optional(),
    active: z.boolean().optional(),
    /** Cambia la próxima fecha (y con ella el día ancla) */
    nextDate: calendarDateSchema.optional(),
  })
  .refine((v) => Object.keys(v).length > 0, 'No hay cambios para guardar');

recurringRouter.patch('/:id', async (req, res) => {
  const userId = currentUserId(req);
  const { id } = parseParams(idParams, req);
  const changes = parseBody(updateSchema, req);
  const current = await ownRule(userId, id);
  await checkReferences(userId, changes.categoryId, changes.accountId);
  const today = todayInBogota();
  let nextDate = changes.nextDate;
  // Al reactivar una regla pausada no se crean de golpe las fechas que pasaron.
  if (changes.active && !current.active && !nextDate) {
    nextDate = toCalendarDate(current.nextDate);
    while (nextDate < today) nextDate = nextOccurrence(nextDate, current.frequency, current.anchorDay);
  }
  await prisma.recurringTransaction.update({
    where: { id },
    data: {
      ...(changes.amount ? { amount: BigInt(changes.amount) } : {}),
      ...(changes.categoryId ? { categoryId: changes.categoryId } : {}),
      ...(changes.description !== undefined ? { description: changes.description?.trim() || null } : {}),
      ...(changes.accountId !== undefined ? { accountId: changes.accountId } : {}),
      ...(changes.active !== undefined ? { active: changes.active } : {}),
      ...(nextDate
        ? { nextDate: fromCalendarDate(nextDate), ...(current.frequency !== 'semanal' && changes.nextDate ? { anchorDay: parseCalendarDate(nextDate).day } : {}) }
        : {}),
    },
  });
  const created = await runDueRecurring(userId);
  const fresh = await prisma.recurringTransaction.findUniqueOrThrow({ where: { id }, include });
  res.json({ rule: presentRule(fresh), created });
});

/** Borrar la regla no borra los movimientos que ya creó. */
recurringRouter.delete('/:id', async (req, res) => {
  const userId = currentUserId(req);
  const { id } = parseParams(idParams, req);
  await ownRule(userId, id);
  await prisma.recurringTransaction.delete({ where: { id } });
  res.status(204).end();
});

/** La app lo llama al abrirse; también se ejecuta al pedir el panel. */
recurringRouter.post('/run', async (req, res) => {
  res.json({ created: await runDueRecurring(currentUserId(req)) });
});
