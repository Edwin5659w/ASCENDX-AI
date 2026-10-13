/**
 * Dinero en ASCENDX AI: siempre pesos colombianos enteros (Documento Maestro
 * v2, sección 4: BIGINT en la base de datos, nunca float). Los cálculos
 * intermedios pueden tener decimales; lo que se muestra o guarda se redondea
 * al peso.
 */

/** Redondea al peso más cercano (evita -0). */
export function roundPesos(value: number): number {
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

export function assertIntegerInRange(value: number, min: number, max: number, field: string): void {
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new RangeError(`${field} debe ser un número entero entre ${min} y ${max}`);
  }
}

const copFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
});

/** RNF-13: montos con formato «$ 1.250.000». */
export function formatCop(value: number): string {
  return copFormatter.format(roundPesos(value));
}

/** 0.185 → «18,50 %» */
export function formatPercent(fraction: number, decimals = 2): string {
  const number = new Intl.NumberFormat('es-CO', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(fraction * 100);
  return `${number} %`;
}
