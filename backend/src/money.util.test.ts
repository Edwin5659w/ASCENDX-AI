import { describe, it, expect } from 'vitest';
import { roundMoney, toMoneyNumber } from './utils/money';

describe('money utils', () => {
  it('roundMoney redondea a 2 decimales', () => {
    expect(roundMoney(10.126)).toBe(10.13);
    expect(roundMoney(0.1 + 0.2)).toBe(0.3);
  });

  it('toMoneyNumber acepta número y string', () => {
    expect(toMoneyNumber('45.5')).toBe(45.5);
    expect(toMoneyNumber(100)).toBe(100);
  });
});
