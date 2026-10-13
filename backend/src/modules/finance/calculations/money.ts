/**
 * Utilidades de dinero. Los montos se expresan en pesos colombianos y se
 * redondean al peso en los resultados que ve el usuario.
 */

/** Redondea al peso más cercano (evita -0). */
export function roundCop(value: number): number {
  const rounded = Math.round(value);
  return rounded === 0 ? 0 : rounded;
}

export function sum(values: readonly number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

export function assertNonNegative(value: number, field: string): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new RangeError(`${field} debe ser un número mayor o igual a 0`);
  }
}

export function assertPositive(value: number, field: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new RangeError(`${field} debe ser un número mayor que 0`);
  }
}

export function assertPositiveInteger(value: number, field: string): void {
  if (!Number.isInteger(value) || value <= 0) {
    throw new RangeError(`${field} debe ser un número entero mayor que 0`);
  }
}

/** Formato para mensajes: 1234567 → "$1.234.567" */
export function formatCop(value: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(value);
}
