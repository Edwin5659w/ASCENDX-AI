import { describe, expect, it } from 'vitest';
import { nextPaymentDate, splitDebtPayment } from './index.js';

describe('pagos de deuda (RF-12)', () => {
  it('cubre primero los intereses del mes y el resto abona a capital', () => {
    // Saldo $1.000.000 al 2 % MV: intereses $20.000; pago $100.000 → capital $80.000
    expect(splitDebtPayment(1_000_000, 0.02, 100_000)).toEqual({
      interest: 20_000,
      principal: 80_000,
      newBalance: 920_000,
      paidOff: false,
    });
  });

  it('sin tasa conocida todo el pago es capital', () => {
    expect(splitDebtPayment(500_000, null, 200_000).principal).toBe(200_000);
  });

  it('no abona más capital que el saldo y marca la deuda como pagada', () => {
    const split = splitDebtPayment(50_000, 0.01, 80_000);
    expect(split.interest).toBe(500);
    expect(split.principal).toBe(50_000);
    expect(split.newBalance).toBe(0);
    expect(split.paidOff).toBe(true);
  });

  it('si el pago no alcanza para los intereses, no abona capital', () => {
    const split = splitDebtPayment(1_000_000, 0.03, 10_000);
    expect(split).toMatchObject({ interest: 10_000, principal: 0, newBalance: 1_000_000 });
  });

  it('rechaza pagos no positivos', () => {
    expect(() => splitDebtPayment(1_000, 0.01, 0)).toThrow(RangeError);
  });
});

describe('próxima fecha de pago', () => {
  it('usa el día de este mes si aún no ha pasado', () => {
    expect(nextPaymentDate(20, '2026-10-13')).toBe('2026-10-20');
    expect(nextPaymentDate(13, '2026-10-13')).toBe('2026-10-13');
  });

  it('pasa al mes siguiente si ya pasó', () => {
    expect(nextPaymentDate(5, '2026-10-13')).toBe('2026-11-05');
    expect(nextPaymentDate(10, '2026-12-28')).toBe('2027-01-10');
  });

  it('ajusta al último día en meses cortos', () => {
    expect(nextPaymentDate(31, '2027-02-10')).toBe('2027-02-28');
    expect(nextPaymentDate(31, '2026-09-05')).toBe('2026-09-30');
  });

  it('rechaza días inválidos', () => {
    expect(() => nextPaymentDate(0, '2026-10-13')).toThrow(RangeError);
  });
});
