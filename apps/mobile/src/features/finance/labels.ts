import type { MovementType } from '@ascendx/finance-core';
import type { IconName } from '@/components/ui';
import type { Palette } from '@/theme/tokens';

export const MOVEMENT_LABELS: Record<MovementType, string> = {
  ingreso: 'Ingreso',
  gasto: 'Gasto',
  pago_deuda: 'Pago de deuda',
  aporte_meta: 'Aporte a meta',
  retiro_meta: 'Retiro de meta',
};

export const MOVEMENT_ICONS: Record<MovementType, IconName> = {
  ingreso: 'income',
  gasto: 'expense',
  pago_deuda: 'debt',
  aporte_meta: 'savings',
  retiro_meta: 'wallet',
};

/** Signo con el que se muestra el monto (efecto sobre el dinero disponible). */
export function movementSign(type: MovementType): '+' | '−' {
  return type === 'ingreso' || type === 'retiro_meta' ? '+' : '−';
}

export function movementTone(type: MovementType): keyof Palette {
  return type === 'ingreso' || type === 'retiro_meta' ? 'success' : type === 'gasto' ? 'text' : 'textMuted';
}

const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const SHORT_MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

/** «2026-10» → «Octubre de 2026» */
export function monthLabel(month: string): string {
  const [year, m] = month.split('-').map(Number);
  const name = MONTHS[(m ?? 1) - 1] ?? '';
  return `${name.charAt(0).toUpperCase()}${name.slice(1)} de ${year}`;
}

/** «2026-10» → «oct» */
export function shortMonth(month: string): string {
  return SHORT_MONTHS[Number(month.split('-')[1]) - 1] ?? month;
}

/** «2026-10-27» → «27 oct 2026» (sin año si es el actual) */
export function formatDay(date: string, currentYear = new Date().getFullYear()): string {
  const [year, month, day] = date.split('-').map(Number);
  const base = `${day} ${SHORT_MONTHS[(month ?? 1) - 1]}`;
  return year === currentYear ? base : `${base} ${year}`;
}

/** Fecha de hoy en Bogotá como «AAAA-MM-DD». */
export function todayKey(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' }).format(new Date());
}

export function shiftMonth(month: string, delta: number): string {
  const [year, m] = month.split('-').map(Number);
  const date = new Date(Date.UTC(year!, m! - 1 + delta, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

export function shiftDay(date: string, delta: number): string {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().slice(0, 10);
}

export function dayHeading(date: string): string {
  const today = todayKey();
  if (date === today) return 'Hoy';
  if (date === shiftDay(today, -1)) return 'Ayer';
  return formatDay(date);
}

export const PRIORITY_LABELS = { alta: 'Alta', media: 'Media', baja: 'Baja' } as const;

export const PLAN_STATUS: Record<string, { label: string; tone: keyof Palette; icon: IconName }> = {
  completada: { label: 'Completada', tone: 'success', icon: 'trophy' },
  en_curso: { label: 'En curso', tone: 'success', icon: 'check' },
  en_riesgo: { label: 'En riesgo', tone: 'warning', icon: 'warning' },
  vencida: { label: 'Fecha vencida', tone: 'danger', icon: 'error' },
};

/** Identificador para que un reintento no duplique el movimiento (RNF-12). */
export function newClientOpId(): string {
  const bytes = Array.from({ length: 16 }, () => Math.floor(Math.random() * 256));
  bytes[6] = (bytes[6]! & 0x0f) | 0x40;
  bytes[8] = (bytes[8]! & 0x3f) | 0x80;
  const hex = bytes.map((b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
