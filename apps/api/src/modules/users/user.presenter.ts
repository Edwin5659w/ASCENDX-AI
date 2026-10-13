import type { Consent, FinancialProfile, User } from '../../generated/prisma/client.js';
import { summarizeConsents } from './consents.js';

type UserWithRelations = User & { consents: Consent[]; financialProfile: FinancialProfile | null };

/** Datos del usuario que se envían a la app (nunca el hash de la contraseña ni los contadores de bloqueo). */
export function presentUser(user: UserWithRelations) {
  const profile = user.financialProfile;
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    isAdult: user.isAdult,
    createdAt: user.createdAt.toISOString(),
    consents: summarizeConsents(user.consents),
    financialProfile: profile
      ? {
          estimatedIncome: profile.estimatedIncome === null ? null : Number(profile.estimatedIncome),
          estimatedFixedExpenses: profile.estimatedFixedExpenses === null ? null : Number(profile.estimatedFixedExpenses),
          payDay: profile.payDay,
          safetyMargin: Number(profile.safetyMargin),
        }
      : null,
  };
}

export type PublicUser = ReturnType<typeof presentUser>;

export const userInclude = { consents: true, financialProfile: true } as const;
