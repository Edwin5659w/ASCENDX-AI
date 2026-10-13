import type { User } from '../../generated/prisma/client.js';

/** Datos del usuario que se pueden enviar a la app (nunca el hash de la contraseña). */
export function presentUser(user: User) {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    createdAt: user.createdAt.toISOString(),
    consents: {
      privacyAcceptedAt: user.privacyAcceptedAt?.toISOString() ?? null,
      aiConsentAt: user.aiConsentAt?.toISOString() ?? null,
      ocrConsentAt: user.ocrConsentAt?.toISOString() ?? null,
    },
  };
}

export type PublicUser = ReturnType<typeof presentUser>;
