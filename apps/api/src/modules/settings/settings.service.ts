import type { UsuryReference } from '@ascendx/finance-core';
import { prisma } from '../../lib/prisma.js';

/**
 * Tasa de usura de referencia (app_settings). Se actualiza a mano con su
 * fecha de vigencia; si no está registrada, el simulador no muestra el aviso.
 */
export async function getUsuryReference(): Promise<UsuryReference | null> {
  const settings = await prisma.appSettings.findUnique({ where: { id: 1 } });
  if (!settings?.usuryRateReference || !settings.usuryRateDate) return null;
  return {
    effectiveAnnualRate: Number(settings.usuryRateReference),
    validFrom: settings.usuryRateDate.toISOString().slice(0, 10),
  };
}
