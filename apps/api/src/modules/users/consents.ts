import type { ConsentType } from '../../generated/prisma/client.js';

/**
 * Versión vigente del texto de cada autorización (Ley 1581 de 2012).
 * Si un texto cambia, se sube la versión y se vuelve a pedir la autorización.
 */
export const CONSENT_VERSIONS: Record<ConsentType, string> = {
  terminos: '2026-10',
  datos: '2026-10',
  ia: '2026-10',
  ocr: '2026-10',
};

export interface ConsentState {
  granted: boolean;
  version: string | null;
  grantedAt: string | null;
}

export type ConsentSummary = Record<ConsentType, ConsentState>;

/** Resume las autorizaciones vigentes (no revocadas) de un usuario. */
export function summarizeConsents(
  consents: readonly { type: ConsentType; version: string; grantedAt: Date; revokedAt: Date | null }[],
): ConsentSummary {
  const summary = {} as ConsentSummary;
  for (const type of Object.keys(CONSENT_VERSIONS) as ConsentType[]) {
    const active = consents
      .filter((consent) => consent.type === type && consent.revokedAt === null)
      .sort((a, b) => b.grantedAt.getTime() - a.grantedAt.getTime())[0];
    summary[type] = active
      ? { granted: true, version: active.version, grantedAt: active.grantedAt.toISOString() }
      : { granted: false, version: null, grantedAt: null };
  }
  return summary;
}
