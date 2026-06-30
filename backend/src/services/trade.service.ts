import type { Trade } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';
import { planService } from './plan.service';
import { roundMoney, toMoneyNumber } from '../utils/money';
import type { z } from 'zod';
import type { createTradeSchema, updateTradeSchema } from '@ascendx/shared/validators/trade.validator';

type CreateTradeInput = z.infer<typeof createTradeSchema>;
type UpdateTradeInput = z.infer<typeof updateTradeSchema>;

function mapTrade(row: Trade) {
  return {
    ...row,
    quantity: toMoneyNumber(row.quantity),
    price: toMoneyNumber(row.price),
    pnl: row.pnl != null ? toMoneyNumber(row.pnl) : null,
  };
}

export const tradeService = {
  async list(userId: string) {
    await planService.assertTradingAccess(userId);
    const rows = await prisma.trade.findMany({
      where: { userId },
      orderBy: { tradedAt: 'desc' },
    });
    return rows.map(mapTrade);
  },

  async summary(userId: string) {
    await planService.assertTradingAccess(userId);
    const trades = await prisma.trade.findMany({
      where: { userId },
      select: { pnl: true, side: true },
    });
    let totalPnl = 0;
    let wins = 0;
    let losses = 0;
    for (const t of trades) {
      if (t.pnl == null) continue;
      const p = toMoneyNumber(t.pnl);
      totalPnl += p;
      if (p > 0) wins += 1;
      else if (p < 0) losses += 1;
    }
    return {
      totalTrades: trades.length,
      totalPnl: roundMoney(totalPnl),
      wins,
      losses,
      breakEven: trades.length - wins - losses,
    };
  },

  async getById(userId: string, id: string) {
    const row = await prisma.trade.findFirst({ where: { id, userId } });
    if (!row) throw new AppError(404, 'Operación no encontrada');
    return mapTrade(row);
  },

  async create(userId: string, data: CreateTradeInput) {
    await planService.assertTradingAccess(userId);
    const row = await prisma.trade.create({
      data: {
        userId,
        symbol: data.symbol.toUpperCase(),
        side: data.side,
        quantity: data.quantity,
        price: data.price,
        pnl: data.pnl != null ? roundMoney(data.pnl) : null,
        emotionTag: data.emotionTag ?? null,
        note: data.note ?? null,
        tradedAt: data.tradedAt ?? new Date(),
      },
    });
    return mapTrade(row);
  },

  async update(userId: string, id: string, data: UpdateTradeInput) {
    await tradeService.getById(userId, id);
    const row = await prisma.trade.update({
      where: { id },
      data: {
        ...data,
        symbol: data.symbol?.toUpperCase(),
        pnl: data.pnl !== undefined ? (data.pnl != null ? roundMoney(data.pnl) : null) : undefined,
      },
    });
    return mapTrade(row);
  },

  async remove(userId: string, id: string) {
    await tradeService.getById(userId, id);
    await prisma.trade.delete({ where: { id } });
  },
};
