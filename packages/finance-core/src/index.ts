/**
 * @ascendx/finance-core — reglas financieras de ASCENDX AI.
 *
 * Implementa la sección 6 del Documento Maestro v2 como funciones puras y
 * deterministas: mismas entradas → mismos resultados. La API y la app usan
 * este mismo paquete; la IA nunca calcula, solo explica estos resultados.
 */
export * from './ai-guard.js';
export * from './capacity.js';
export * from './dates.js';
export * from './debts.js';
export * from './goals.js';
export * from './habits.js';
export * from './loan.js';
export * from './money.js';
export * from './movements.js';
export * from './rates.js';
export * from './receipts.js';
export * from './simulator.js';
