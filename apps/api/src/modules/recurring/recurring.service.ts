import { dueOccurrences, todayInBogota, type CalendarDate } from '@ascendx/finance-core';
import { createHash } from 'node:crypto';
import type { RecurringTransaction } from '../../generated/prisma/client.js';
import { fromCalendarDate, toCalendarDate } from '../../lib/calendar.js';
import { logger } from '../../lib/logger.js';
import { prisma } from '../../lib/prisma.js';
import { createMovement } from '../transactions/transactions.service.js';

/** UUID determinista (formato v5) para que cada fecha de una regla se cree una sola vez (RNF-12). */
export function occurrenceOpId(ruleId: string, date: CalendarDate) {
  const hex = createHash('sha1').update(`recurrente:${ruleId}:${date}`).digest('hex');
  const variant = ((parseInt(hex[16]!, 16) & 0x3) | 0x8).toString(16);
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-5${hex.slice(13, 16)}-${variant}${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
}

async function runRule(rule: RecurringTransaction, today: CalendarDate) {
  const { dates, next } = dueOccurrences(toCalendarDate(rule.nextDate), rule.frequency, today, rule.anchorDay);
  let created = 0;
  for (const date of dates) {
    try {
      const result = await createMovement(rule.userId, {
        type: rule.type as 'ingreso' | 'gasto',
        amount: Number(rule.amount),
        date,
        categoryId: rule.categoryId,
        description: rule.description,
        accountId: rule.accountId,
        source: 'recurrente',
        clientOpId: occurrenceOpId(rule.id, date),
        confirmDuplicate: true,
      });
      if (result.created) created += 1;
    } catch (error) {
      // Una regla con la categoría o la cuenta archivada no debe frenar las demás.
      logger.warn({ ruleId: rule.id, err: error }, 'No se pudo crear el movimiento recurrente');
      return created;
    }
  }
  // Solo avanza si nadie más lo hizo (dos peticiones a la vez no duplican: el opId es único).
  await prisma.recurringTransaction.updateMany({ where: { id: rule.id, nextDate: rule.nextDate }, data: { nextDate: fromCalendarDate(next) } });
  return created;
}

/** RF-30: crea los movimientos recurrentes vencidos hasta hoy. Devuelve cuántos creó. */
export async function runDueRecurring(userId: string, today: CalendarDate = todayInBogota()) {
  const due = await prisma.recurringTransaction.findMany({
    where: { userId, active: true, nextDate: { lte: fromCalendarDate(today) } },
  });
  let created = 0;
  for (const rule of due) created += await runRule(rule, today);
  return created;
}
