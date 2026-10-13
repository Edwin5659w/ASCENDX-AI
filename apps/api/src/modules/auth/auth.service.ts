import { Prisma } from '../../generated/prisma/client.js';
import { HttpError } from '../../lib/http-error.js';
import { logger } from '../../lib/logger.js';
import { prisma } from '../../lib/prisma.js';
import { presentUser, type PublicUser } from '../users/user.presenter.js';
import type { LoginInput, RegisterInput } from './auth.schemas.js';
import { DUMMY_PASSWORD_HASH, hashPassword, verifyPassword } from './password.js';
import {
  generateRefreshToken,
  hashRefreshToken,
  refreshTokenExpiry,
  signAccessToken,
} from './tokens.js';

export interface AuthSession {
  user: PublicUser;
  accessToken: string;
  refreshToken: string;
}

const INVALID_CREDENTIALS = new HttpError(401, 'INVALID_CREDENTIALS', 'Correo o contraseña incorrectos');
const INVALID_SESSION = new HttpError(401, 'INVALID_SESSION', 'Tu sesión expiró. Inicia sesión de nuevo.');

export async function register(input: RegisterInput): Promise<AuthSession> {
  const passwordHash = await hashPassword(input.password);
  try {
    const user = await prisma.user.create({
      data: {
        email: input.email,
        passwordHash,
        fullName: input.fullName,
        privacyAcceptedAt: new Date(),
        financialProfile: { create: {} },
      },
    });
    return createSession(user);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw HttpError.conflict('EMAIL_IN_USE', 'Ya existe una cuenta con ese correo');
    }
    throw error;
  }
}

export async function login(input: LoginInput): Promise<AuthSession> {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  // Se compara siempre (aunque el usuario no exista) para no revelar qué correos están registrados.
  const valid = await verifyPassword(input.password, user?.passwordHash ?? DUMMY_PASSWORD_HASH);
  if (!user || !valid) throw INVALID_CREDENTIALS;
  return createSession(user);
}

/**
 * Renueva la sesión con rotación: el token usado se revoca y se emite uno nuevo.
 * Si alguien reutiliza un token ya revocado (posible robo), se cierran todas
 * las sesiones del usuario.
 */
export async function refresh(refreshToken: string): Promise<AuthSession> {
  const tokenHash = hashRefreshToken(refreshToken);
  const stored = await prisma.refreshToken.findUnique({ where: { tokenHash }, include: { user: true } });

  if (!stored) throw INVALID_SESSION;

  if (stored.revokedAt) {
    await prisma.refreshToken.updateMany({
      where: { userId: stored.userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    logger.warn({ userId: stored.userId }, 'Reutilización de refresh token: se revocaron todas las sesiones');
    throw INVALID_SESSION;
  }

  if (stored.expiresAt.getTime() <= Date.now()) throw INVALID_SESSION;

  const newToken = generateRefreshToken();
  const now = new Date();
  // Revocación condicional: si dos peticiones usan el mismo token a la vez, solo una gana.
  const rotated = await prisma.$transaction(async (tx) => {
    const created = await tx.refreshToken.create({
      data: { userId: stored.userId, tokenHash: hashRefreshToken(newToken), expiresAt: refreshTokenExpiry(now) },
    });
    const revoked = await tx.refreshToken.updateMany({
      where: { id: stored.id, revokedAt: null },
      data: { revokedAt: now, replacedById: created.id },
    });
    if (revoked.count !== 1) throw INVALID_SESSION;
    return created;
  });

  return {
    user: presentUser(stored.user),
    accessToken: signAccessToken(rotated.userId),
    refreshToken: newToken,
  };
}

export async function logout(refreshToken: string): Promise<void> {
  await prisma.refreshToken.updateMany({
    where: { tokenHash: hashRefreshToken(refreshToken), revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

async function createSession(user: Parameters<typeof presentUser>[0]): Promise<AuthSession> {
  const refreshToken = generateRefreshToken();
  await prisma.refreshToken.create({
    data: { userId: user.id, tokenHash: hashRefreshToken(refreshToken), expiresAt: refreshTokenExpiry() },
  });
  return { user: presentUser(user), accessToken: signAccessToken(user.id), refreshToken };
}
