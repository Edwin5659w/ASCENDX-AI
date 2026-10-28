import { addMonths, todayInBogota, type CalendarDate } from '@ascendx/finance-core';
import { z } from 'zod';

/**
 * Fechas de calendario (columnas @db.Date) ↔ texto «AAAA-MM-DD».
 * PostgreSQL guarda solo el día; Prisma lo entrega como medianoche UTC.
 */
export function toCalendarDate(date: Date): CalendarDate {
  return date.toISOString().slice(0, 10);
}

export function fromCalendarDate(date: CalendarDate): Date {
  return new Date(`${date}T00:00:00.000Z`);
}

/** Rango [inicio, fin) de un mes «AAAA-MM». */
export function monthRange(month: string): { gte: Date; lt: Date } {
  const first = `${month}-01`;
  return { gte: fromCalendarDate(first), lt: fromCalendarDate(addMonths(first, 1)) };
}

export function currentMonth(): string {
  return todayInBogota().slice(0, 7);
}

export const calendarDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Usa el formato AAAA-MM-DD')
  .refine((value) => !Number.isNaN(Date.parse(`${value}T00:00:00Z`)) && toCalendarDate(fromCalendarDate(value)) === value, {
    message: 'La fecha no existe',
  });

export const monthSchema = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Usa el formato AAAA-MM');

/** Pesos enteros (BIGINT); tope para detectar errores de digitación. */
export const pesosSchema = z.number().int('Los montos van en pesos enteros').max(100_000_000_000, 'El monto es demasiado alto');
export const positivePesosSchema = pesosSchema.positive('El monto debe ser mayor que 0');

export const uuidSchema = z.uuid('Identificador inválido');
