import { availableEffect, type MovementType } from '@ascendx/finance-core';
import { Router } from 'express';
import { z } from 'zod';
import type { Account } from '../../generated/prisma/client.js';
import { pesosSchema, uuidSchema } from '../../lib/calendar.js';
import { HttpError } from '../../lib/http-error.js';
import { prisma } from '../../lib/prisma.js';
import { currentUserId, protectedRoute } from '../../middleware/require-auth.js';
import { parseBody, parseParams } from '../../middleware/validate.js';

/** RF-31: cuentas (efectivo, banco, billetera digital). El saldo se calcula con los movimientos. */
export const accountsRouter = Router();
accountsRouter.use(protectedRoute);

const KINDS = ['efectivo', 'banco', 'billetera'] as const;

async function balances(userId: string, accountIds: string[]) {
  if (!accountIds.length) return new Map<string, { balance: bigint; movements: number }>();
  const grouped = await prisma.transaction.groupBy({
    by: ['accountId', 'type'],
    where: { userId, deletedAt: null, accountId: { in: accountIds } },
    _sum: { amount: true },
    _count: true,
  });
  const result = new Map<string, { balance: bigint; movements: number }>();
  for (const group of grouped) {
    const current = result.get(group.accountId!) ?? { balance: 0n, movements: 0 };
    current.balance += BigInt(availableEffect(group.type as MovementType)) * (group._sum.amount ?? 0n);
    current.movements += group._count;
    result.set(group.accountId!, current);
  }
  return result;
}

function presentAccount(account: Account, totals?: { balance: bigint; movements: number }) {
  return {
    id: account.id,
    name: account.name,
    kind: account.kind,
    initialBalance: Number(account.initialBalance),
    balance: Number(account.initialBalance + (totals?.balance ?? 0n)),
    movements: totals?.movements ?? 0,
    archived: account.archivedAt !== null,
  };
}

async function ownAccount(userId: string, id: string) {
  const account = await prisma.account.findFirst({ where: { id, userId } });
  if (!account) throw HttpError.notFound('Cuenta no encontrada');
  return account;
}

accountsRouter.get('/', async (req, res) => {
  const userId = currentUserId(req);
  const accounts = await prisma.account.findMany({ where: { userId, archivedAt: null }, orderBy: { createdAt: 'asc' } });
  const totals = await balances(userId, accounts.map((a) => a.id));
  const presented = accounts.map((account) => presentAccount(account, totals.get(account.id)));
  res.json({ accounts: presented, total: presented.reduce((sum, a) => sum + a.balance, 0) });
});

const accountSchema = z.object({
  name: z.string().trim().min(2, 'Ponle un nombre a la cuenta').max(60),
  kind: z.enum(KINDS),
  initialBalance: pesosSchema.optional(),
});

accountsRouter.post('/', async (req, res) => {
  const userId = currentUserId(req);
  const input = parseBody(accountSchema, req);
  const duplicate = await prisma.account.findFirst({ where: { userId, archivedAt: null, name: { equals: input.name, mode: 'insensitive' } } });
  if (duplicate) throw new HttpError(409, 'ACCOUNT_EXISTS', 'Ya tienes una cuenta con ese nombre');
  const account = await prisma.account.create({
    data: { userId, name: input.name, kind: input.kind, initialBalance: BigInt(input.initialBalance ?? 0) },
  });
  res.status(201).json({ account: presentAccount(account) });
});

const idParams = z.object({ id: uuidSchema });

accountsRouter.patch('/:id', async (req, res) => {
  const userId = currentUserId(req);
  const { id } = parseParams(idParams, req);
  const changes = parseBody(accountSchema.partial().refine((v) => Object.keys(v).length > 0, 'No hay cambios para guardar'), req);
  await ownAccount(userId, id);
  const account = await prisma.account.update({
    where: { id },
    data: {
      ...(changes.name ? { name: changes.name } : {}),
      ...(changes.kind ? { kind: changes.kind } : {}),
      ...(changes.initialBalance !== undefined ? { initialBalance: BigInt(changes.initialBalance) } : {}),
    },
  });
  const totals = await balances(userId, [id]);
  res.json({ account: presentAccount(account, totals.get(id)) });
});

/** Se archiva: los movimientos conservan su historia. */
accountsRouter.delete('/:id', async (req, res) => {
  const userId = currentUserId(req);
  const { id } = parseParams(idParams, req);
  await ownAccount(userId, id);
  await prisma.account.update({ where: { id }, data: { archivedAt: new Date() } });
  res.status(204).end();
});
