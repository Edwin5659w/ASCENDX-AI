/**
 * Verificador de cifras de la IA (sección 7 del Documento Maestro v2).
 *
 * La IA solo puede mencionar cifras que existan en el contexto calculado por
 * el sistema. Esta función extrae los montos y porcentajes de una respuesta y
 * revisa que cada uno coincida con una cifra permitida. Si no coincide, la
 * respuesta se rechaza (RF-23, OE4: 100 % sin cifras inventadas).
 */

export type FigureKind = 'money' | 'percent';

export interface Figure {
  raw: string;
  kind: FigureKind;
  value: number;
}

/** «1.234.567», «1,234,567», «1234567», «12,5», «12.5» → número. */
export function parseLocaleNumber(raw: string): number | null {
  const cleaned = raw.replace(/\s/g, '');
  if (!/\d/.test(cleaned)) return null;
  // Separador de miles con puntos o comas en grupos de 3: 1.234.567 / 1,234,567
  if (/^\d{1,3}([.,]\d{3})+$/.test(cleaned)) return Number(cleaned.replace(/[.,]/g, ''));
  // Miles con punto y decimales con coma: 1.234,56
  if (/^\d{1,3}(\.\d{3})+,\d{1,2}$/.test(cleaned)) return Number(cleaned.replace(/\./g, '').replace(',', '.'));
  // Miles con coma y decimales con punto: 1,234.56
  if (/^\d{1,3}(,\d{3})+\.\d{1,2}$/.test(cleaned)) return Number(cleaned.replace(/,/g, ''));
  // Decimal simple con coma o punto: 12,5 / 12.5
  if (/^\d+([.,]\d+)?$/.test(cleaned)) return Number(cleaned.replace(',', '.'));
  return null;
}

const MONEY_PATTERN = /(?:\$|COP)\s?(\d[\d.,]*\d|\d)(\s?(?:millones|millón|mil)\b)?|(\d[\d.,]*\d)\s?(?:pesos|COP)\b/gi;
const PERCENT_PATTERN = /(\d+(?:[.,]\d+)?)\s?(?:%|por\s?ciento)/gi;
/** Números con separador de miles (≥ 1.000) sin signo de pesos: también se tratan como montos. */
const GROUPED_NUMBER = /(?<![\d.,$])(\d{1,3}(?:\.\d{3})+)(?![\d,])/g;

function multiplier(word: string | undefined): number {
  if (!word) return 1;
  const w = word.trim().toLowerCase();
  if (w.startsWith('mill')) return 1_000_000;
  if (w === 'mil') return 1_000;
  return 1;
}

export function extractFigures(text: string): Figure[] {
  const figures: Figure[] = [];
  const taken: [number, number][] = [];
  const overlaps = (start: number, end: number) => taken.some(([s, e]) => start < e && end > s);

  for (const match of text.matchAll(MONEY_PATTERN)) {
    const number = match[1] ?? match[3];
    const value = number ? parseLocaleNumber(number) : null;
    if (value === null) continue;
    figures.push({ raw: match[0].trim(), kind: 'money', value: Math.round(value * multiplier(match[2])) });
    taken.push([match.index!, match.index! + match[0].length]);
  }
  for (const match of text.matchAll(PERCENT_PATTERN)) {
    const value = parseLocaleNumber(match[1]!);
    if (value === null || overlaps(match.index!, match.index! + match[0].length)) continue;
    figures.push({ raw: match[0].trim(), kind: 'percent', value });
    taken.push([match.index!, match.index! + match[0].length]);
  }
  for (const match of text.matchAll(GROUPED_NUMBER)) {
    if (overlaps(match.index!, match.index! + match[0].length)) continue;
    const value = parseLocaleNumber(match[1]!);
    if (value === null || value < 1_000) continue;
    figures.push({ raw: match[0].trim(), kind: 'money', value });
  }
  return figures;
}

export interface AllowedFigures {
  /** Montos en pesos que existen en el contexto */
  money: readonly number[];
  /** Porcentajes (0–100) que existen en el contexto */
  percent: readonly number[];
}

export interface FigureCheck {
  ok: boolean;
  checked: number;
  /** Cifras que no existen en el contexto */
  unknown: Figure[];
}

/**
 * Un monto coincide si es igual a uno permitido o es su redondeo a miles o a
 * la décima de millón («$ 1,1 millones» por $ 1.130.000 NO coincide: 2,7 %).
 * Un porcentaje coincide con una diferencia de hasta 0,1 puntos.
 */
export function verifyFigures(text: string, allowed: AllowedFigures): FigureCheck {
  const figures = extractFigures(text);
  const money = allowed.money.map(Math.abs);
  const unknown = figures.filter((figure) => {
    if (figure.kind === 'percent') return !allowed.percent.some((p) => Math.abs(p - figure.value) <= 0.1 + 1e-9);
    const value = Math.abs(figure.value);
    return !money.some((m) => value === m || Math.abs(value - m) <= Math.max(1, m * 0.005));
  });
  return { ok: unknown.length === 0, checked: figures.length, unknown };
}
