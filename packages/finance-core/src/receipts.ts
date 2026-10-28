/**
 * RF-28: interpretar el texto que el OCR lee de un recibo colombiano.
 * Extrae total, fecha y comercio. Es una ayuda: el usuario siempre revisa y
 * corrige antes de guardar, por eso cada campo trae su nivel de confianza.
 */
import { parseLocaleNumber } from './ai-guard.js';

export type Confidence = 'alta' | 'media' | 'baja';

export interface ReceiptFields {
  total: number | null;
  totalConfidence: Confidence;
  /** «AAAA-MM-DD» */
  date: string | null;
  dateConfidence: Confidence;
  merchant: string | null;
  merchantConfidence: Confidence;
}

const MONTHS: Record<string, number> = {
  ene: 1, enero: 1, feb: 2, febrero: 2, mar: 3, marzo: 3, abr: 4, abril: 4, may: 5, mayo: 5, jun: 6, junio: 6,
  jul: 7, julio: 7, ago: 8, agosto: 8, sep: 9, sept: 9, septiembre: 9, set: 9, oct: 10, octubre: 10,
  nov: 11, noviembre: 11, dic: 12, diciembre: 12,
};

const AMOUNT = /\$?\s?(\d{1,3}(?:[.,]\d{3})+(?:[.,]\d{2})?|\d{4,9}(?:[.,]\d{2})?)/g;

/** Monto en pesos enteros; los centavos se descartan. */
function amountsIn(line: string): number[] {
  const values: number[] = [];
  for (const match of line.matchAll(AMOUNT)) {
    const raw = match[1]!;
    // «45.900,00», «45,900.00» o «45900.00»: se quitan los centavos
    const withoutCents = /^(\d{1,3}(?:[.,]\d{3})+)[.,]\d{2}$/.exec(raw)?.[1] ?? /^(\d{4,9})[.,]\d{2}$/.exec(raw)?.[1] ?? raw;
    const value = parseLocaleNumber(withoutCents);
    if (value !== null && value >= 100) values.push(Math.round(value));
  }
  return values;
}

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function validDate(year: number, month: number, day: number): string | null {
  if (year < 100) year += 2000;
  if (month < 1 || month > 12 || day < 1 || day > 31 || year < 2000 || year > 2100) return null;
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCMonth() !== month - 1) return null;
  return `${year}-${pad(month)}-${pad(day)}`;
}

function findDate(lines: string[]): { date: string | null; confidence: Confidence } {
  for (const line of lines) {
    const lower = line.toLowerCase();
    const labeled = /fecha|date/.test(lower);
    let m = /(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/.exec(line);
    if (m) {
      const date = validDate(Number(m[1]), Number(m[2]), Number(m[3]));
      if (date) return { date, confidence: 'alta' };
    }
    m = /(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})/.exec(line);
    if (m) {
      // En Colombia el orden es día/mes/año
      const date = validDate(Number(m[3]), Number(m[2]), Number(m[1]));
      if (date) return { date, confidence: labeled ? 'alta' : 'media' };
    }
    m = /(\d{1,2})\s*(?:de\s+)?([a-záéíóú]{3,10})\.?\s*(?:de\s+)?(\d{2,4})/i.exec(line);
    if (m) {
      const month = MONTHS[m[2]!.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')];
      const date = month ? validDate(Number(m[3]), month, Number(m[1])) : null;
      if (date) return { date, confidence: labeled ? 'alta' : 'media' };
    }
  }
  return { date: null, confidence: 'baja' };
}

const TOTAL_LABELS = [/total\s+a\s+pagar/i, /valor\s+total/i, /total\s+factura/i, /neto\s+a\s+pagar/i, /^\s*total\b/i, /\btotal\b/i];
const NOT_TOTAL = /sub\s?-?total|total\s+items?|total\s+art|iva|impuesto|propina\s+sugerida|cambio|efectivo|recibido|base/i;

function findTotal(lines: string[]): { total: number | null; confidence: Confidence } {
  for (const [rank, label] of TOTAL_LABELS.entries()) {
    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i]!;
      if (!label.test(line) || NOT_TOTAL.test(line)) continue;
      const here = amountsIn(line);
      const value = here.at(-1) ?? amountsIn(lines[i + 1] ?? '').at(0);
      if (value) return { total: value, confidence: rank <= 4 ? 'alta' : 'media' };
    }
  }
  // Sin etiqueta: el monto más grande del recibo
  const all = lines.filter((line) => !NOT_TOTAL.test(line)).flatMap(amountsIn);
  return all.length ? { total: Math.max(...all), confidence: 'baja' } : { total: null, confidence: 'baja' };
}

const NOT_MERCHANT = /nit|factura|fecha|hora|tel|dir|cra|calle|carrera|cl\.|kr\.|www|http|régimen|regimen|resoluci|caja|cajero|ticket|pos\b|\d{5,}/i;

function findMerchant(lines: string[]): { merchant: string | null; confidence: Confidence } {
  const nitIndex = lines.findIndex((line) => /\bnit\b/i.test(line));
  const candidates = lines.slice(0, Math.max(5, nitIndex >= 0 ? nitIndex + 1 : 5));
  for (const line of candidates) {
    const clean = line.replace(/[^\p{L}\p{N}&.\s-]/gu, ' ').replace(/\s+/g, ' ').trim();
    const letters = clean.replace(/[^\p{L}]/gu, '').length;
    if (letters >= 3 && !NOT_MERCHANT.test(clean) && letters / Math.max(1, clean.length) > 0.5) {
      const name = clean.length > 60 ? clean.slice(0, 60).trim() : clean;
      return { merchant: name, confidence: nitIndex > 0 && lines.indexOf(line) < nitIndex ? 'alta' : 'media' };
    }
  }
  return { merchant: null, confidence: 'baja' };
}

export function parseReceiptText(text: string): ReceiptFields {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const total = findTotal(lines);
  const date = findDate(lines);
  const merchant = findMerchant(lines);
  return {
    total: total.total,
    totalConfidence: total.confidence,
    date: date.date,
    dateConfidence: date.confidence,
    merchant: merchant.merchant,
    merchantConfidence: merchant.confidence,
  };
}
