import { Prisma } from '../../generated/prisma/client.js';
import { HttpError } from '../../lib/http-error.js';
import { logger } from '../../lib/logger.js';
import { mailer } from '../../lib/mailer.js';
import { prisma } from '../../lib/prisma.js';
import { CONSENT_VERSIONS } from '../users/consents.js';
import { presentUser, userInclude, type PublicUser } from '../users/user.presenter.js';
import type { LoginInput, RegisterInput, ResetPasswordInput } from './auth.schemas.js';
import { getDummyHash, hashPassword, verifyPassword } from './password.js';
import {
  generateRefreshToken,
  generateResetCode,
  hashRefreshToken,
  hashResetCode,
  refreshTokenExpiry,
  resetCodeMatches,
  signAccessToken,
} from './tokens.js';

export interface AuthSession {
  user: PublicUser;
  accessToken: string;
  refreshToken: string;
}

/** RF-02: 5 intentos fallidos seguidos bloquean la cuenta 15 minutos. */
export const MAX_FAILED_LOGINS = 5;
export const LOCK_MINUTES = 15;
/** RF-03: el código de recuperación vale 15 minutos y admite 5 intentos. */
export const RESET_CODE_MINUTES = 15;
export const MAX_RESET_ATTEMPTS = 5;

const INVALID_CREDENTIALS = () => new HttpError(401, 'INVALID_CREDENTIALS', 'El correo o la contraseña no coinciden');
const INVALID_SESSION = () => new HttpError(401, 'INVALID_SESSION', 'Tu sesión expiró. Inicia sesión de nuevo.');

export async function register(input: RegisterInput): Promise<AuthSession> {
  const passwordHash = await hashPassword(input.password);
  try {
    const user = await prisma.user.create({
      data: {
        email: input.email,
        passwordHash,
        name: input.name,
        isAdult: input.isAdult,
        financialProfile: { create: {} },
        consents: {
          create: [
            { type: 'terminos', version: CONSENT_VERSIONS.terminos },
            { type: 'datos', version: CONSENT_VERSIONS.datos },
          ],
        },
      },
      include: userInclude,
    });
    return createSession(user, input.deviceName);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw HttpError.conflict('EMAIL_IN_USE', 'Ya existe una cuenta con ese correo');
    }
    throw error;
  }
}

export async function login(input: LoginInput): Promise<AuthSession> {
  const user = await prisma.user.findUnique({ where: { email: input.email }, include: userInclude });

  if (!user) {
    // Se compara igual para que el tiempo de respuesta no revele si el correo existe.
    await verifyPassword(input.password, await getDummyHash());
    throw INVALID_CREDENTIALS();
  }

  if (user.lockedUntil && user.lockedUntil.getTime() > Date.now()) {
    throw accountLocked(user.lockedUntil);
  }

  if (!(await verifyPassword(input.password, user.passwordHash))) {
    const attempts = user.failedLoginAttempts + 1;
    const lock = attempts >= MAX_FAILED_LOGINS;
    const lockedUntil = lock ? new Date(Date.now() + LOCK_MINUTES * 60_000) : null;
    await prisma.user.update({
      where: { id: user.id },
      data: { failedLoginAttempts: lock ? 0 : attempts, lockedUntil },
    });
    if (lock) {
      logger.warn({ userId: user.id }, 'Cuenta bloqueada temporalmente por intentos fallidos');
      throw accountLocked(lockedUntil!);
    }
    throw INVALID_CREDENTIALS();
  }

  if (user.failedLoginAttempts > 0 || user.lockedUntil) {
    await prisma.user.update({ where: { id: user.id }, data: { failedLoginAttempts: 0, lockedUntil: null } });
  }
  return createSession(user, input.deviceName);
}

function accountLocked(until: Date) {
  const minutes = Math.max(1, Math.ceil((until.getTime() - Date.now()) / 60_000));
  return new HttpError(
    423,
    'ACCOUNT_LOCKED',
    `Por seguridad bloqueamos el inicio de sesión. Inténtalo de nuevo en ${minutes} ${minutes === 1 ? 'minuto' : 'minutos'} o recupera tu contraseña.`,
    { retryAfterMinutes: minutes },
  );
}

/**
 * Renueva la sesión con rotación: el token usado se revoca y se emite uno nuevo.
 * Si alguien reutiliza un token ya revocado (posible robo), se cierran todas
 * las sesiones del usuario.
 */
export async function refresh(refreshToken: string): Promise<AuthSession> {
  const stored = await prisma.session.findUnique({
    where: { refreshTokenHash: hashRefreshToken(refreshToken) },
    include: { user: { include: userInclude } },
  });
  if (!stored) throw INVALID_SESSION();

  if (stored.revokedAt) {
    await revokeAllSessions(stored.userId);
    logger.warn({ userId: stored.userId }, 'Reutilización de refresh token: se cerraron todas las sesiones');
    throw INVALID_SESSION();
  }
  if (stored.expiresAt.getTime() <= Date.now()) throw INVALID_SESSION();

  const newToken = generateRefreshToken();
  const now = new Date();
  const created = await prisma.$transaction(async (tx) => {
    const next = await tx.session.create({
      data: {
        userId: stored.userId,
        refreshTokenHash: hashRefreshToken(newToken),
        deviceName: stored.deviceName,
        expiresAt: refreshTokenExpiry(now),
      },
    });
    // Revocación condicional: si dos peticiones usan el mismo token a la vez, solo una gana.
    const revoked = await tx.session.updateMany({
      where: { id: stored.id, revokedAt: null },
      data: { revokedAt: now, replacedById: next.id },
    });
    if (revoked.count !== 1) throw INVALID_SESSION();
    return next;
  });

  return { user: presentUser(stored.user), accessToken: signAccessToken(stored.userId, created.id), refreshToken: newToken };
}

/** Cerrar sesión invalida el token de renovación (RF-02). */
export async function logout(refreshToken: string): Promise<void> {
  await prisma.session.updateMany({
    where: { refreshTokenHash: hashRefreshToken(refreshToken), revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function revokeAllSessions(userId: string): Promise<void> {
  await prisma.session.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } });
}

/**
 * RF-03, paso 1: envía un código de 6 dígitos al correo. Responde igual
 * exista o no la cuenta, para no revelar qué correos están registrados.
 */
export async function requestPasswordReset(email: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { email }, select: { id: true, email: true } });
  if (!user) return;

  const code = generateResetCode();
  await prisma.$transaction([
    // Solo vale el código más reciente.
    prisma.passwordReset.updateMany({ where: { userId: user.id, usedAt: null }, data: { usedAt: new Date() } }),
    prisma.passwordReset.create({
      data: {
        userId: user.id,
        codeHash: hashResetCode(code),
        expiresAt: new Date(Date.now() + RESET_CODE_MINUTES * 60_000),
      },
    }),
  ]);
  await mailer.send({
    to: user.email,
    subject: 'Tu código para recuperar la contraseña de ASCENDX AI',
    text: `Tu código es ${code}. Vence en ${RESET_CODE_MINUTES} minutos. Si no lo pediste, ignora este mensaje.`,
  });
}

/** RF-03, paso 2: valida el código (un solo uso, 15 min, 5 intentos) y cambia la contraseña. */
export async function resetPassword(input: ResetPasswordInput): Promise<void> {
  const invalid = (message = 'El código no es válido o ya venció. Pide uno nuevo.') =>
    new HttpError(400, 'INVALID_RESET_CODE', message);

  const user = await prisma.user.findUnique({ where: { email: input.email }, select: { id: true } });
  if (!user) throw invalid();

  const reset = await prisma.passwordReset.findFirst({
    where: { userId: user.id, usedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: 'desc' },
  });
  if (!reset || reset.attempts >= MAX_RESET_ATTEMPTS) throw invalid();

  if (!resetCodeMatches(input.code, reset.codeHash)) {
    const attempts = reset.attempts + 1;
    await prisma.passwordReset.update({
      where: { id: reset.id },
      data: { attempts, ...(attempts >= MAX_RESET_ATTEMPTS ? { usedAt: new Date() } : {}) },
    });
    const left = MAX_RESET_ATTEMPTS - attempts;
    throw invalid(
      left > 0
        ? `El código no coincide. Te ${left === 1 ? 'queda 1 intento' : `quedan ${left} intentos`}.`
        : 'Agotaste los intentos. Pide un código nuevo.',
    );
  }

  const passwordHash = await hashPassword(input.newPassword);
  await prisma.$transaction([
    prisma.passwordReset.update({ where: { id: reset.id }, data: { usedAt: new Date() } }),
    prisma.user.update({ where: { id: user.id }, data: { passwordHash, failedLoginAttempts: 0, lockedUntil: null } }),
    // Por seguridad, cambiar la contraseña cierra todas las sesiones abiertas.
    prisma.session.updateMany({ where: { userId: user.id, revokedAt: null }, data: { revokedAt: new Date() } }),
  ]);
}

async function createSession(
  user: Parameters<typeof presentUser>[0],
  deviceName?: string,
): Promise<AuthSession> {
  const refreshToken = generateRefreshToken();
  const session = await prisma.session.create({
    data: {
      userId: user.id,
      refreshTokenHash: hashRefreshToken(refreshToken),
      deviceName: deviceName ?? null,
      expiresAt: refreshTokenExpiry(),
    },
  });
  return { user: presentUser(user), accessToken: signAccessToken(user.id, session.id), refreshToken };
}
