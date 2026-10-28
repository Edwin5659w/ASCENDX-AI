import { goalProgress, todayInBogota } from '@ascendx/finance-core';
import { Router } from 'express';
import { z } from 'zod';
import { calendarDateSchema, fromCalendarDate, positivePesosSchema, toCalendarDate, uuidSchema } from '../../lib/calendar.js';
import { HttpError } from '../../lib/http-error.js';
import { prisma } from '../../lib/prisma.js';
import { currentUserId, protectedRoute } from '../../middleware/require-auth.js';
import { parseBody, parseParams } from '../../middleware/validate.js';
import { financialSnapshot } from '../finance/snapshot.service.js';
import { createMovement, presentTransaction, transactionInclude } from '../transactions/transactions.service.js';

/** RF-16 a RF-19: metas múltiples, aportes y reparto de la capacidad prudente. */
export const goalsRouter = Router();
goalsRouter.use(protectedRoute);

/** Lista con el plan de cada meta (aporte asignado, fecha proyectada, riesgo y sugerencias). */
goalsRouter.get('/', async (req, res) => {
  const userId = currentUserId(req);
  const snapshot = await financialSnapshot(userId);
  res.json({ goals: snapshot.goals, allocation: snapshot.allocation, capacity: snapshot.capacity });
});

const futureDate = calendarDateSchema.refine((value) => value > todayInBogota(), 'La fecha debe ser futura');

const createSchema = z.object({
  name: z.string().trim().min(2, 'Ponle un nombre a tu meta').max(80),
  targetAmount: positivePesosSchema,
  targetDate: futureDate.nullable().optional(),
  priority: z.enum(['alta', 'media', 'baja']).default('media'),
  icon: z.string().trim().max(40).nullable().optional(),
  isEmergencyFund: z.boolean().default(false),
});

goalsRouter.post('/', async (req, res) => {
  const userId = currentUserId(req);
  const data = parseBody(createSchema, req);
  if (data.isEmergencyFund) {
    const existing = await prisma.financialGoal.findFirst({ where: { userId, isEmergencyFund: true, deletedAt: null } });
    if (existing) throw HttpError.conflict('EMERGENCY_FUND_EXISTS', 'Ya tienes una meta marcada como fondo de emergencia');
  }
  const goal = await prisma.financialGoal.create({
    data: {
      userId,
      name: data.name,
      targetAmount: BigInt(data.targetAmount),
      targetDate: data.targetDate ? fromCalendarDate(data.targetDate) : null,
      priority: data.priority,
      icon: data.icon ?? null,
      isEmergencyFund: data.isEmergencyFund,
    },
  });
  const snapshot = await financialSnapshot(userId);
  res.status(201).json({ goal: snapshot.goals.find((g) => g.id === goal.id) });
});

const idParams = z.object({ id: uuidSchema });

async function ownGoal(userId: string, id: string) {
  const goal = await prisma.financialGoal.findFirst({ where: { id, userId, deletedAt: null } });
  if (!goal) throw HttpError.notFound('Meta no encontrada');
  return goal;
}

goalsRouter.get('/:id', async (req, res) => {
  const userId = currentUserId(req);
  const { id } = parseParams(idParams, req);
  const goal = await ownGoal(userId, id);
  const [snapshot, movements] = await Promise.all([
    financialSnapshot(userId),
    prisma.transaction.findMany({
      where: { userId, goalId: id, deletedAt: null },
      include: transactionInclude,
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    }),
  ]);
  const fromSnapshot = snapshot.goals.find((g) => g.id === id);
  res.json({
    goal: fromSnapshot ?? {
      id: goal.id,
      name: goal.name,
      icon: goal.icon,
      priority: goal.priority,
      status: goal.status,
      targetAmount: Number(goal.targetAmount),
      savedAmount: Number(goal.savedAmount),
      targetDate: goal.targetDate ? toCalendarDate(goal.targetDate) : null,
      isEmergencyFund: goal.isEmergencyFund,
      plan: null,
    },
    progress: goalProgress(Number(goal.targetAmount), Number(goal.savedAmount)),
    movements: movements.map(presentTransaction),
  });
});

const updateSchema = z
  .object({
    name: z.string().trim().min(2).max(80),
    targetAmount: positivePesosSchema,
    targetDate: futureDate.nullable(),
    priority: z.enum(['alta', 'media', 'baja']),
    icon: z.string().trim().max(40).nullable(),
    status: z.enum(['activa', 'pausada', 'cancelada']),
    isEmergencyFund: z.boolean(),
  })
  .partial()
  .refine((value) => Object.keys(value).length > 0, 'No hay cambios para guardar');

goalsRouter.patch('/:id', async (req, res) => {
  const userId = currentUserId(req);
  const { id } = parseParams(idParams, req);
  const changes = parseBody(updateSchema, req);
  const goal = await ownGoal(userId, id);
  if (changes.isEmergencyFund) {
    const other = await prisma.financialGoal.findFirst({
      where: { userId, isEmergencyFund: true, deletedAt: null, NOT: { id } },
    });
    if (other) throw HttpError.conflict('EMERGENCY_FUND_EXISTS', 'Ya tienes una meta marcada como fondo de emergencia');
  }
  const target = changes.targetAmount ?? Number(goal.targetAmount);
  const reached = Number(goal.savedAmount) >= target;
  const status = changes.status ?? (goal.status === 'completada' && !reached ? 'activa' : goal.status);
  await prisma.financialGoal.update({
    where: { id },
    data: {
      ...changes,
      targetAmount: changes.targetAmount === undefined ? undefined : BigInt(changes.targetAmount),
      targetDate: changes.targetDate === undefined ? undefined : changes.targetDate ? fromCalendarDate(changes.targetDate) : null,
      status: reached && status === 'activa' ? 'completada' : status,
      completedAt: reached ? (goal.completedAt ?? new Date()) : null,
    },
  });
  const snapshot = await financialSnapshot(userId);
  res.json({ goal: snapshot.goals.find((g) => g.id === id) ?? null });
});

goalsRouter.delete('/:id', async (req, res) => {
  const userId = currentUserId(req);
  const { id } = parseParams(idParams, req);
  await ownGoal(userId, id);
  await prisma.financialGoal.update({ where: { id }, data: { deletedAt: new Date(), status: 'cancelada' } });
  res.status(204).end();
});

const movementSchema = z.object({
  kind: z.enum(['aporte', 'retiro']),
  amount: positivePesosSchema,
  date: calendarDateSchema.optional(),
  description: z.string().trim().max(200).nullable().optional(),
  clientOpId: uuidSchema.optional(),
});

/** RF-17: aporte o retiro. Crea el movimiento y actualiza lo ahorrado en la misma transacción. */
goalsRouter.post('/:id/movements', async (req, res) => {
  const userId = currentUserId(req);
  const { id } = parseParams(idParams, req);
  const movement = parseBody(movementSchema, req);
  const goal = await ownGoal(userId, id);
  if (goal.status === 'cancelada') throw HttpError.badRequest('La meta está cancelada');
  const { transaction, created } = await createMovement(userId, {
    type: movement.kind === 'aporte' ? 'aporte_meta' : 'retiro_meta',
    goalId: id,
    amount: movement.amount,
    date: movement.date ?? todayInBogota(),
    description: movement.description,
    clientOpId: movement.clientOpId,
    confirmDuplicate: true,
  });
  const snapshot = await financialSnapshot(userId);
  res.status(created ? 201 : 200).json({ transaction, goal: snapshot.goals.find((g) => g.id === id) ?? null });
});
