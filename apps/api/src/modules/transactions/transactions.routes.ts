import { monthlyIndicators, MOVEMENT_TYPES } from '@ascendx/finance-core';
import { Router } from 'express';
import { z } from 'zod';
import type { Prisma } from '../../generated/prisma/client.js';
import { calendarDateSchema, fromCalendarDate, monthRange, monthSchema, positivePesosSchema, uuidSchema } from '../../lib/calendar.js';
import { prisma } from '../../lib/prisma.js';
import { currentUserId, protectedRoute } from '../../middleware/require-auth.js';
import { parseBody, parseParams, parseQuery } from '../../middleware/validate.js';
import {
  createMovement,
  deleteMovement,
  ownTransaction,
  presentTransaction,
  transactionInclude,
  updateMovement,
} from './transactions.service.js';

/** RF-07 a RF-09: movimientos del usuario. */
export const transactionsRouter = Router();
transactionsRouter.use(protectedRoute);

const description = z.string().trim().max(200).nullable().optional();

export const createMovementSchema = z.object({
  type: z.enum(MOVEMENT_TYPES),
  amount: positivePesosSchema,
  date: calendarDateSchema,
  categoryId: uuidSchema.nullable().optional(),
  description,
  debtId: uuidSchema.nullable().optional(),
  goalId: uuidSchema.nullable().optional(),
  accountId: uuidSchema.nullable().optional(),
  source: z.enum(['manual', 'ocr', 'recurrente']).optional(),
  clientOpId: uuidSchema.nullable().optional(),
  confirmDuplicate: z.boolean().optional(),
});

transactionsRouter.post('/', async (req, res) => {
  const userId = currentUserId(req);
  const input = parseBody(createMovementSchema, req);
  const { transaction, created } = await createMovement(userId, input);
  res.status(created ? 201 : 200).json({ transaction });
});

const listSchema = z.object({
  month: monthSchema.optional(),
  from: calendarDateSchema.optional(),
  to: calendarDateSchema.optional(),
  type: z.enum(MOVEMENT_TYPES).optional(),
  categoryId: uuidSchema.optional(),
  debtId: uuidSchema.optional(),
  goalId: uuidSchema.optional(),
  q: z.string().trim().max(60).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  /** Paginación: id del último movimiento recibido */
  cursor: uuidSchema.optional(),
});

/** RF-08: historial con filtros y totales del filtro. */
transactionsRouter.get('/', async (req, res) => {
  const userId = currentUserId(req);
  const query = parseQuery(listSchema, req);
  const dateFilter: Prisma.DateTimeFilter = query.month
    ? monthRange(query.month)
    : {
        ...(query.from ? { gte: fromCalendarDate(query.from) } : {}),
        ...(query.to ? { lte: fromCalendarDate(query.to) } : {}),
      };
  const where: Prisma.TransactionWhereInput = {
    userId,
    deletedAt: null,
    ...(Object.keys(dateFilter).length ? { date: dateFilter } : {}),
    ...(query.type ? { type: query.type } : {}),
    ...(query.categoryId ? { categoryId: query.categoryId } : {}),
    ...(query.debtId ? { debtId: query.debtId } : {}),
    ...(query.goalId ? { goalId: query.goalId } : {}),
    ...(query.q ? { description: { contains: query.q, mode: 'insensitive' } } : {}),
  };

  const [items, grouped] = await Promise.all([
    prisma.transaction.findMany({
      where,
      include: transactionInclude,
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }, { id: 'desc' }],
      take: query.limit + 1,
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
    }),
    prisma.transaction.groupBy({ by: ['type'], where, _sum: { amount: true }, _count: true }),
  ]);

  const hasMore = items.length > query.limit;
  const page = hasMore ? items.slice(0, query.limit) : items;
  const totals = monthlyIndicators(
    grouped.filter((g) => (g._sum.amount ?? 0n) > 0n).map((g) => ({ type: g.type, amount: Number(g._sum.amount) })),
  );
  res.json({
    transactions: page.map(presentTransaction),
    totals,
    count: grouped.reduce((total, g) => total + g._count, 0),
    nextCursor: hasMore ? page.at(-1)!.id : null,
  });
});

const idParams = z.object({ id: uuidSchema });

transactionsRouter.get('/:id', async (req, res) => {
  const userId = currentUserId(req);
  const { id } = parseParams(idParams, req);
  await ownTransaction(userId, id);
  const transaction = await prisma.transaction.findUniqueOrThrow({ where: { id }, include: transactionInclude });
  res.json({ transaction: presentTransaction(transaction) });
});

const updateSchema = z
  .object({
    amount: positivePesosSchema.optional(),
    date: calendarDateSchema.optional(),
    categoryId: uuidSchema.optional(),
    description,
    accountId: uuidSchema.nullable().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, 'No hay cambios para guardar');

transactionsRouter.patch('/:id', async (req, res) => {
  const userId = currentUserId(req);
  const { id } = parseParams(idParams, req);
  const changes = parseBody(updateSchema, req);
  res.json({ transaction: await updateMovement(userId, id, changes) });
});

transactionsRouter.delete('/:id', async (req, res) => {
  const userId = currentUserId(req);
  const { id } = parseParams(idParams, req);
  await deleteMovement(userId, id);
  res.status(204).end();
});
