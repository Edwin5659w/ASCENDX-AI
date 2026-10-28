import {
  fixedInstallment,
  MAX_TERM_MONTHS,
  nextPaymentDate,
  roundPesos,
  toEffectiveAnnualRate,
  toMonthlyRate,
  todayInBogota,
} from '@ascendx/finance-core';
import { Router } from 'express';
import { z } from 'zod';
import type { Debt } from '../../generated/prisma/client.js';
import { calendarDateSchema, pesosSchema, positivePesosSchema, uuidSchema } from '../../lib/calendar.js';
import { HttpError } from '../../lib/http-error.js';
import { prisma } from '../../lib/prisma.js';
import { currentUserId, protectedRoute } from '../../middleware/require-auth.js';
import { parseBody, parseParams } from '../../middleware/validate.js';
import { createMovement, presentTransaction, transactionInclude } from '../transactions/transactions.service.js';

/** RF-11 y RF-12: deudas y sus pagos. */
export const debtsRouter = Router();
debtsRouter.use(protectedRoute);

export function presentDebt(debt: Debt, today = todayInBogota()) {
  const rate = debt.rate === null ? null : Number(debt.rate);
  const original = Number(debt.originalAmount);
  const balance = Number(debt.balance);
  return {
    id: debt.id,
    creditor: debt.creditor,
    name: debt.name,
    originalAmount: original,
    balance,
    paidAmount: Math.max(0, original - balance),
    percentPaid: original > 0 ? Math.min(100, Math.floor(((original - balance) / original) * 1000) / 10) : 0,
    rate,
    rateType: debt.rateType,
    effectiveAnnualRate: rate !== null && debt.rateType ? toEffectiveAnnualRate(rate, debt.rateType) : null,
    installment: debt.installment === null ? null : Number(debt.installment),
    termMonths: debt.termMonths,
    paymentDay: debt.paymentDay,
    nextPaymentDate: debt.paymentDay && debt.status === 'activa' ? nextPaymentDate(debt.paymentDay, today) : null,
    status: debt.status,
    createdAt: debt.createdAt.toISOString(),
  };
}

const baseSchema = z.object({
  creditor: z.string().trim().min(2, 'Escribe a quién le debes').max(80),
  name: z.string().trim().max(80).nullable().optional(),
  originalAmount: positivePesosSchema,
  balance: pesosSchema.nonnegative().optional(),
  rate: z.number().min(0).max(1, 'La tasa va como fracción (0,25 = 25 %)').nullable().optional(),
  rateType: z.enum(['EA', 'MV']).nullable().optional(),
  installment: positivePesosSchema.nullable().optional(),
  termMonths: z.number().int().min(1).max(MAX_TERM_MONTHS).nullable().optional(),
  paymentDay: z.number().int().min(1).max(31).nullable().optional(),
});

const createSchema = baseSchema
  .refine((v) => v.balance === undefined || v.balance <= v.originalAmount, {
    path: ['balance'],
    message: 'El saldo no puede ser mayor que el monto original',
  })
  .refine((v) => v.rate == null || v.rateType != null, { path: ['rateType'], message: 'Indica si la tasa es E.A. o M.V.' });

/** Si no se conoce la cuota pero sí la tasa y el plazo, se calcula con el sistema francés. */
function estimateInstallment(amount: number, rate: number | null | undefined, rateType: 'EA' | 'MV' | null | undefined, term: number | null | undefined) {
  if (rate == null || !rateType || !term) return null;
  return roundPesos(fixedInstallment(amount, toMonthlyRate(rate, rateType), term));
}

debtsRouter.get('/', async (req, res) => {
  const userId = currentUserId(req);
  const debts = await prisma.debt.findMany({
    where: { userId, deletedAt: null },
    orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
  });
  const today = todayInBogota();
  const presented = debts.map((debt) => presentDebt(debt, today));
  const active = presented.filter((debt) => debt.status === 'activa');
  res.json({
    debts: presented,
    totals: {
      balance: active.reduce((total, debt) => total + debt.balance, 0),
      monthlyInstallments: active.reduce((total, debt) => total + (debt.installment ?? 0), 0),
      active: active.length,
    },
  });
});

debtsRouter.post('/', async (req, res) => {
  const userId = currentUserId(req);
  const data = parseBody(createSchema, req);
  const balance = data.balance ?? data.originalAmount;
  const installment = data.installment ?? estimateInstallment(balance, data.rate, data.rateType, data.termMonths);
  const debt = await prisma.debt.create({
    data: {
      userId,
      creditor: data.creditor,
      name: data.name || null,
      originalAmount: BigInt(data.originalAmount),
      balance: BigInt(balance),
      rate: data.rate ?? null,
      rateType: data.rate == null ? null : data.rateType,
      installment: installment === null ? null : BigInt(installment),
      termMonths: data.termMonths ?? null,
      paymentDay: data.paymentDay ?? null,
      status: balance === 0 ? 'pagada' : 'activa',
    },
  });
  res.status(201).json({ debt: presentDebt(debt) });
});

const idParams = z.object({ id: uuidSchema });

async function ownDebt(userId: string, id: string) {
  const debt = await prisma.debt.findFirst({ where: { id, userId, deletedAt: null } });
  if (!debt) throw HttpError.notFound('Deuda no encontrada');
  return debt;
}

debtsRouter.get('/:id', async (req, res) => {
  const userId = currentUserId(req);
  const { id } = parseParams(idParams, req);
  const debt = await ownDebt(userId, id);
  const payments = await prisma.transaction.findMany({
    where: { userId, debtId: id, deletedAt: null, type: 'pago_deuda' },
    include: transactionInclude,
    orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
  });
  res.json({
    debt: presentDebt(debt),
    payments: payments.map(presentTransaction),
    totals: {
      paid: payments.reduce((t, p) => t + Number(p.amount), 0),
      interest: payments.reduce((t, p) => t + Number(p.interestAmount ?? 0), 0),
      principal: payments.reduce((t, p) => t + Number(p.principalAmount ?? p.amount), 0),
    },
  });
});

const updateSchema = baseSchema
  .omit({ originalAmount: true, balance: true })
  .extend({ status: z.enum(['activa', 'cancelada']).optional() })
  .partial()
  .refine((value) => Object.keys(value).length > 0, 'No hay cambios para guardar');

debtsRouter.patch('/:id', async (req, res) => {
  const userId = currentUserId(req);
  const { id } = parseParams(idParams, req);
  const changes = parseBody(updateSchema, req);
  const debt = await ownDebt(userId, id);
  const rate = changes.rate !== undefined ? changes.rate : debt.rate === null ? null : Number(debt.rate);
  const rateType = changes.rateType !== undefined ? changes.rateType : debt.rateType;
  if (rate != null && !rateType) throw HttpError.badRequest('Indica si la tasa es E.A. o M.V.');
  const updated = await prisma.debt.update({
    where: { id },
    data: {
      ...changes,
      rate: rate ?? null,
      rateType: rate == null ? null : rateType,
      installment: changes.installment === undefined ? undefined : changes.installment === null ? null : BigInt(changes.installment),
    },
  });
  res.json({ debt: presentDebt(updated) });
});

debtsRouter.delete('/:id', async (req, res) => {
  const userId = currentUserId(req);
  const { id } = parseParams(idParams, req);
  await ownDebt(userId, id);
  await prisma.debt.update({ where: { id }, data: { deletedAt: new Date() } });
  res.status(204).end();
});

const paymentSchema = z.object({
  amount: positivePesosSchema,
  date: calendarDateSchema.optional(),
  description: z.string().trim().max(200).nullable().optional(),
  clientOpId: uuidSchema.optional(),
});

/** RF-12: registrar un pago. Crea el movimiento «pago_deuda» y actualiza el saldo. */
debtsRouter.post('/:id/payments', async (req, res) => {
  const userId = currentUserId(req);
  const { id } = parseParams(idParams, req);
  const payment = parseBody(paymentSchema, req);
  await ownDebt(userId, id);
  const { transaction, created } = await createMovement(userId, {
    type: 'pago_deuda',
    debtId: id,
    amount: payment.amount,
    date: payment.date ?? todayInBogota(),
    description: payment.description,
    clientOpId: payment.clientOpId,
    confirmDuplicate: true,
  });
  const debt = await ownDebt(userId, id);
  res.status(created ? 201 : 200).json({ transaction, debt: presentDebt(debt) });
});
