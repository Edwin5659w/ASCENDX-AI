import { describe, expect, it } from 'vitest';
import { extractFigures, parseLocaleNumber, parseReceiptText, verifyFigures } from './index.js';

describe('números en formato local', () => {
  it('entiende miles con punto o coma y decimales', () => {
    expect(parseLocaleNumber('1.234.567')).toBe(1_234_567);
    expect(parseLocaleNumber('1,234,567')).toBe(1_234_567);
    expect(parseLocaleNumber('12,5')).toBe(12.5);
    expect(parseLocaleNumber('1.234,56')).toBe(1234.56);
    expect(parseLocaleNumber('1,234.56')).toBe(1234.56);
    expect(parseLocaleNumber('abc')).toBeNull();
  });
});

describe('verificador de cifras de la IA (RF-23, OE4)', () => {
  const allowed = { money: [904_000, 1_130_000, 2_800_000, 666_667], percent: [71.5, 30] };

  it('extrae montos, millones y porcentajes', () => {
    const figures = extractFigures('Puedes ahorrar $ 904.000; tu ingreso es 2.800.000 pesos y la vivienda es el 71,5 % de tus gastos. Meta de $2 millones.');
    expect(figures.map((f) => [f.kind, f.value])).toEqual([
      ['money', 904_000],
      ['money', 2_800_000],
      ['money', 2_000_000],
      ['percent', 71.5],
    ]);
  });

  it('acepta una respuesta que solo usa cifras del contexto', () => {
    const check = verifyFigures('Tu ahorro prudente es $ 904.000 al mes y la vivienda pesa 71,5 %. Aporta $666.667 para llegar a tiempo.', allowed);
    expect(check).toMatchObject({ ok: true, checked: 3, unknown: [] });
  });

  it('rechaza cifras inventadas o redondeos engañosos', () => {
    const check = verifyFigures('Podrías ahorrar $ 1.500.000 y ganar 12 % de rentabilidad; tu capacidad es $1,1 millones.', allowed);
    expect(check.ok).toBe(false);
    expect(check.unknown.map((f) => f.raw)).toEqual(['$ 1.500.000', '$1,1 millones', '12 %']);
  });

  it('tolera el redondeo al peso y no cuenta años ni días', () => {
    expect(verifyFigures('Para octubre de 2027, en 10 meses, con $ 904.001.', allowed).ok).toBe(true);
  });
});

describe('lectura de recibos (RF-28)', () => {
  it('lee total, fecha y comercio de una factura típica', () => {
    const text = `SUPERMERCADO LA 14
NIT 890.300.346-1
Cra 1 # 20-30 Cali
FECHA: 12/10/2026 HORA 18:20
ARROZ 1KG        4.500
LECHE            3.900
SUBTOTAL        38.571
IVA 19%          7.329
TOTAL           45.900
EFECTIVO        50.000
CAMBIO           4.100`;
    expect(parseReceiptText(text)).toEqual({
      total: 45_900,
      totalConfidence: 'alta',
      date: '2026-10-12',
      dateConfidence: 'alta',
      merchant: 'SUPERMERCADO LA 14',
      merchantConfidence: 'alta',
    });
  });

  it('entiende «Total a pagar» con centavos y fechas con nombre de mes', () => {
    const text = `Droguería Salud Total
Fecha 5 oct 2026
Total a pagar $ 23.450,00`;
    const fields = parseReceiptText(text);
    expect(fields.total).toBe(23_450);
    expect(fields.date).toBe('2026-10-05');
    expect(fields.merchant).toBe('Droguería Salud Total');
  });

  it('busca el total en la línea siguiente y acepta fechas ISO', () => {
    const fields = parseReceiptText('RESTAURANTE EL PATIO\n2026-09-30\nVALOR TOTAL\n$ 87.000');
    expect(fields).toMatchObject({ total: 87_000, date: '2026-09-30', merchant: 'RESTAURANTE EL PATIO' });
  });

  it('sin etiqueta usa el monto mayor con confianza baja', () => {
    const fields = parseReceiptText('Tienda Don José\nGaseosa 3.000\nPan 2.500');
    expect(fields).toMatchObject({ total: 3_000, totalConfidence: 'baja', date: null, dateConfidence: 'baja' });
  });

  it('descarta fechas imposibles', () => {
    expect(parseReceiptText('FECHA 31/02/2026\nTOTAL 10.000').date).toBeNull();
  });

  it('un texto vacío no inventa nada', () => {
    expect(parseReceiptText('')).toMatchObject({ total: null, date: null, merchant: null });
  });
});
