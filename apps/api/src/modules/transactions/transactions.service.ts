import {
  applyGoalMovement,
  DUPLICATE_WINDOW_MS,
  isPossibleDuplicate,
  splitDebtPayment,
  toMonthlyRate,
  type MovementType,
} from '@ascendx/finance-core';
import type { Prisma, Transaction } from '../../generated/prisma/client.js';
import { fromCalendarDate, toCalendarDate } from '../../lib/calendar.js';
import { HttpError } from '../../lib/http-error.js';
import { prisma } from '../../lib/prisma.js';
import { visibleCategoriesWhere } from '../categories/categories.routes.js';

type Tx = Prisma.TransactionClient;

export interface MovementInput {
  type: MovementType;
  amount: number;
  date: string;
  categoryId?: string | null;
  description?: string | null;
  debtId?: string | null;
  goalId?: string | null;
  accountId?: string | null;
  source?: 'manual' | 'ocr' | 'recurrente';
  clientOpId?: string | null;
  /** RF-09: el usuario ya vio el aviso de posible duplicado y quiere guardar igual */
  confirmDuplicate?: boolean;
}

export const transactionInclude = {
  category: { select: { id: true, name: true, icon: true, color: true, kind: true } },
  debt: { select: { id: true, creditor: true, name: true } },
  goal: { select: { id: true, name: true } },
  account: { select: { id: true, name: true, kind: true } },
} as const;

type TransactionWithRelations = Prisma.TransactionGetPayload<{ include: typeof transactionInclude }>;

export function presentTransaction(t: TransactionWithRelations) {
  return {
    id: t.id,
    type: t.type,
    amount: Number(t.amount),
    date: toCalendarDate(t.date),
    description: t.description,
    source: t.source,
    category: t.category ? { id: t.category.id, name: t.category.name, icon: t.category.icon, color: t.category.color } : null,
    debt: t.debt ? { id: t.debt.id, name: t.debt.name ?? t.debt.creditor } : null,
    goal: t.goal ? { id: t.goal.id, name: t.goal.name } : null,
    account: t.account ? { id: t.account.id, name: t.account.name } : null,
    principalAmount: t.principalAmount === null ? null : Number(t.principalAmount),
    interestAmount: t.interestAmount === null ? null : Number(t.interestAmount),
    clientOpId: t.clientOpId,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  };
}

export type PublicTransaction = ReturnType<typeof presentTransaction>;

const needsCategory = (type: MovementType) => type === 'ingreso' || type === 'gasto';
const isGoalMovement = (type: MovementType) => type === 'aporte_meta' || type === 'retiro_meta';

/** Valida que las referencias existan y sean del usuario (RNF-01) y coincidan con el tipo. */
async function validateReferences(tx: Tx, userId: string, input: MovementInput) {
  if (needsCategory(input.type)) {
    if (!input.categoryId) throw HttpError.badRequest('Elige una categoría');
    const category = await tx.category.findFirst({ where: { id: input.categoryId, ...visibleCategoriesWhere(userId) } });
    if (!category) throw HttpError.badRequest('La categoría no existe');
    if (category.kind !== input.type) {
      throw HttpError.badRequest(input.type === 'ingreso' ? 'Elige una categoría de ingreso' : 'Elige una categoría de gasto');
    }
  }
  if (input.type === 'pago_deuda') {
    if (!input.debtId) throw HttpError.badRequest('Elige la deuda que pagaste');
    const debt = await tx.debt.findFirst({ where: { id: input.debtId, userId, deletedAt: null } });
    if (!debt) throw HttpError.badRequest('La deuda no existe');
  }
  if (isGoalMovement(input.type)) {
    if (!input.goalId) throw HttpError.badRequest('Elige la meta');
    const goal = await tx.financialGoal.findFirst({ where: { id: input.goalId, userId, deletedAt: null } });
    if (!goal) throw HttpError.badRequest('La meta no existe');
  }
  if (input.accountId) {
    const account = await tx.account.findFirst({ where: { id: input.accountId, userId, archivedAt: null } });
    if (!account) throw HttpError.badRequest('La cuenta no existe');
  }
}

/**
 * Aplica (sign = 1) o revierte (sign = −1) el efecto de un movimiento sobre
 * su deuda o su meta. Devuelve el reparto capital/intereses de un pago.
 */
async function applyEffect(
  tx: Tx,
  userId: string,
  movement: { type: MovementType; amount: number; debtId?: string | null; goalId?: string | null; principalAmount?: number | null },
  sign: 1 | -1,
): Promise<{ principalAmount: bigint | null; interestAmount: bigint | null }> {
  if (movement.type === 'pago_deuda' && movement.debtId) {
    const debt = await tx.debt.findFirstOrThrow({ where: { id: movement.debtId, userId } });
    const balance = Number(debt.balance);
    if (sign === 1) {
      if (balance === 0) throw HttpError.badRequest('Esta deuda ya está pagada');
      const monthlyRate = debt.rate !== null && debt.rateType ? toMonthlyRate(Number(debt.rate), debt.rateType) : null;
      const split = splitDebtPayment(balance, monthlyRate, movement.amount);
      await tx.debt.update({
        where: { id: debt.id },
        data: { balance: BigInt(split.newBalance), status: split.paidOff ? 'pagada' : debt.status === 'pagada' ? 'activa' : debt.status },
      });
      return { principalAmount: BigInt(split.principal), interestAmount: BigInt(split.interest) };
    }
    const restored = balance + (movement.principalAmount ?? movement.amount);
    await tx.debt.update({
      where: { id: debt.id },
      data: { balance: BigInt(restored), status: debt.status === 'pagada' && restored > 0 ? 'activa' : debt.status },
    });
    return { principalAmount: null, interestAmount: null };
  }

  if (isGoalMovement(movement.type) && movement.goalId) {
    const goal = await tx.financialGoal.findFirstOrThrow({ where: { id: movement.goalId, userId } });
    const isDeposit = (movement.type === 'aporte_meta') === (sign === 1);
    let saved: number;
    try {
      saved = applyGoalMovement(Number(goal.savedAmount), movement.amount, isDeposit ? 'aporte' : 'retiro');
    } catch (error) {
      if (error instanceof RangeError) {
        throw HttpError.badRequest(sign === 1 ? error.message : 'No se puede deshacer: la meta ya no tiene ese ahorro');
      }
      throw error;
    }
    const reached = saved >= Number(goal.targetAmount);
    await tx.financialGoal.update({
      where: { id: goal.id },
      data: {
        savedAmount: BigInt(saved),
        status: reached ? 'completada' : goal.status === 'completada' ? 'activa' : goal.status,
        completedAt: reached ? (goal.completedAt ?? new Date()) : null,
      },
    });
  }
  return { principalAmount: null, interestAmount: null };
}

async function findWithRelations(tx: Tx, id: string) {
  return tx.transaction.findUniqueOrThrow({ where: { id }, include: transactionInclude });
}

export async function createMovement(userId: string, input: MovementInput) {
  // RNF-12: un reintento con el mismo client_op_id devuelve el movimiento ya guardado.
  if (input.clientOpId) {
    const existing = await prisma.transaction.findUnique({
      where: { userId_clientOpId: { userId, clientOpId: input.clientOpId } },
      include: transactionInclude,
    });
    if (existing) return { transaction: presentTransaction(existing), created: false };
  }

  // RF-09: posible duplicado (mismo tipo, monto, categoría y fecha, registrado hace menos de 2 minutos).
  if (!input.confirmDuplicate) {
    const recent = await prisma.transaction.findMany({
      where: {
        userId,
        deletedAt: null,
        date: fromCalendarDate(input.date),
        createdAt: { gte: new Date(Date.now() - DUPLICATE_WINDOW_MS) },
      },
      select: { type: true, amount: true, categoryId: true, createdAt: true },
    });
    const duplicate = isPossibleDuplicate(
      { type: input.type, amount: input.amount, categoryId: input.categoryId ?? null, createdAt: new Date() },
      recent.map((r) => ({ type: r.type, amount: Number(r.amount), categoryId: r.categoryId, createdAt: r.createdAt })),
    );
    if (duplicate) {
      throw new HttpError(409, 'POSSIBLE_DUPLICATE', 'Acabas de registrar un movimiento igual. ¿Quieres guardarlo de todas formas?');
    }
  }

  const transaction = await prisma.$transaction(async (tx) => {
    await validateReferences(tx, userId, input);
    const split = await applyEffect(tx, userId, input, 1);
    const created = await tx.transaction.create({
      data: {
        userId,
        type: input.type,
        amount: BigInt(input.amount),
        date: fromCalendarDate(input.date),
        categoryId: needsCategory(input.type) ? input.categoryId : null,
        description: input.description?.trim() || null,
        debtId: input.type === 'pago_deuda' ? input.debtId : null,
        goalId: isGoalMovement(input.type) ? input.goalId : null,
        accountId: input.accountId ?? null,
        source: input.source ?? 'manual',
        clientOpId: input.clientOpId ?? null,
        ...split,
      },
    });
    if (isGoalMovement(input.type) && input.goalId) {
      await tx.goalContribution.create({
        data: {
          goalId: input.goalId,
          userId,
          transactionId: created.id,
          amount: BigInt(input.type === 'aporte_meta' ? input.amount : -input.amount),
        },
      });
    }
    return findWithRelations(tx, created.id);
  });
  return { transaction: presentTransaction(transaction), created: true };
}

export async function ownTransaction(userId: string, id: string): Promise<Transaction> {
  const transaction = await prisma.transaction.findFirst({ where: { id, userId, deletedAt: null } });
  if (!transaction) throw HttpError.notFound('Movimiento no encontrado');
  return transaction;
}

function asMovement(t: Transaction) {
  return {
    type: t.type,
    amount: Number(t.amount),
    debtId: t.debtId,
    goalId: t.goalId,
    principalAmount: t.principalAmount === null ? null : Number(t.principalAmount),
  };
}

export type MovementChanges = Partial<Pick<MovementInput, 'amount' | 'date' | 'categoryId' | 'description' | 'accountId'>>;

/** Edita un movimiento. Si cambia el monto de un pago o aporte, se revierte y se vuelve a aplicar su efecto. */
export async function updateMovement(userId: string, id: string, changes: MovementChanges) {
  const current = await ownTransaction(userId, id);
  const transaction = await prisma.$transaction(async (tx) => {
    const merged: MovementInput = {
      ...asMovement(current),
      date: changes.date ?? toCalendarDate(current.date),
      amount: changes.amount ?? Number(current.amount),
      categoryId: changes.categoryId !== undefined ? changes.categoryId : current.categoryId,
      accountId: changes.accountId !== undefined ? changes.accountId : current.accountId,
    };
    await validateReferences(tx, userId, merged);
    let split: { principalAmount?: bigint | null; interestAmount?: bigint | null } = {};
    if (changes.amount !== undefined && changes.amount !== Number(current.amount) && (current.debtId || current.goalId)) {
      await applyEffect(tx, userId, asMovement(current), -1);
      split = await applyEffect(tx, userId, merged, 1);
      if (current.goalId) {
        await tx.goalContribution.updateMany({
          where: { transactionId: id },
          data: { amount: BigInt(current.type === 'aporte_meta' ? merged.amount : -merged.amount) },
        });
      }
    }
    await tx.transaction.update({
      where: { id },
      data: {
        amount: BigInt(merged.amount),
        date: fromCalendarDate(merged.date),
        categoryId: needsCategory(current.type) ? merged.categoryId : null,
        accountId: merged.accountId ?? null,
        ...(changes.description !== undefined ? { description: changes.description?.trim() || null } : {}),
        ...(current.debtId ? split : {}),
      },
    });
    return findWithRelations(tx, id);
  });
  return presentTransaction(transaction);
}

/** Borrado lógico (para sincronizar) y reversión del efecto en la deuda o la meta. */
export async function deleteMovement(userId: string, id: string) {
  const current = await ownTransaction(userId, id);
  await prisma.$transaction(async (tx) => {
    await applyEffect(tx, userId, asMovement(current), -1);
    await tx.goalContribution.deleteMany({ where: { transactionId: id } });
    await tx.transaction.update({ where: { id }, data: { deletedAt: new Date() } });
  });
}
