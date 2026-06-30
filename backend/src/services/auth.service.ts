import crypto from 'crypto';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { env } from '../config/env';
import { AppError } from '../middleware/errorHandler';
import type { RegisterInput, LoginInput } from '@ascendx/shared/validators/auth.validator';
import type { AuthPayload } from '../middleware/auth';
import { emailService } from './email.service';
import { retentionService } from './retention.service';
import { USER_PROFILE_SELECT } from '../constants/user-select';
import { expiresAtFromJwt } from '../utils/jwt';
import { generateReferralCode } from '../utils/referral';
import { REFERRAL_BONUS_XP } from '@ascendx/shared/plans';

const SALT_ROUNDS = 12;

export async function cleanupExpiredRefreshTokens(): Promise<number> {
  const result = await prisma.refreshToken.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });
  return result.count;
}

const signAccessToken = (payload: AuthPayload): string =>
  jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn: env.JWT_ACCESS_EXPIRES_IN as jwt.SignOptions['expiresIn'] });

const signRefreshToken = (payload: AuthPayload): string =>
  jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn: env.JWT_REFRESH_EXPIRES_IN as jwt.SignOptions['expiresIn'] });

const revokeUserRefreshTokens = async (userId: string) => {
  await prisma.refreshToken.deleteMany({ where: { userId } });
};

const storeRefreshToken = async (userId: string, token: string): Promise<void> => {
  const expiresAt = expiresAtFromJwt(token);
  await prisma.refreshToken.create({
    data: { token, userId, expiresAt },
  });
};

export const authService = {
  async register(input: RegisterInput) {
    const existing = await prisma.user.findUnique({ where: { email: input.email } });
    if (existing) throw new AppError(409, 'El email ya está registrado');

    let referredById: string | undefined;
    const refCode = input.referralCode?.trim().toUpperCase();
    if (refCode) {
      const referrer = await prisma.user.findUnique({ where: { referralCode: refCode } });
      if (!referrer) throw new AppError(400, 'Código de referido inválido');
      referredById = referrer.id;
    }

    const hashed = await bcrypt.hash(input.password, SALT_ROUNDS);
    let referralCode = generateReferralCode(input.name);
    for (let attempt = 0; attempt < 5; attempt++) {
      const taken = await prisma.user.findUnique({ where: { referralCode } });
      if (!taken) break;
      referralCode = generateReferralCode(input.name);
    }

    const user = await prisma.user.create({
      data: {
        name: input.name,
        email: input.email,
        password: hashed,
        referralCode,
        referredById,
      },
      select: USER_PROFILE_SELECT,
    });

    if (referredById) {
      await prisma.user.update({
        where: { id: referredById },
        data: { xp: { increment: REFERRAL_BONUS_XP } },
      });
      await prisma.user.update({
        where: { id: user.id },
        data: { xp: { increment: REFERRAL_BONUS_XP } },
      });
    }

    const refreshed = await prisma.user.findUnique({
      where: { id: user.id },
      select: USER_PROFILE_SELECT,
    });

    const payload: AuthPayload = { userId: user.id, email: user.email };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);
    await cleanupExpiredRefreshTokens();
    await revokeUserRefreshTokens(user.id);
    await storeRefreshToken(user.id, refreshToken);

    void retentionService.sendWelcome(user.id, user.email, user.name);

    return {
      user: refreshed ?? user,
      accessToken,
      refreshToken,
      referralBonus: referredById ? REFERRAL_BONUS_XP : 0,
    };
  },

  async login(input: LoginInput) {
    const user = await prisma.user.findUnique({
      where: { email: input.email },
      select: { ...USER_PROFILE_SELECT, password: true },
    });
    if (!user) throw new AppError(401, 'Credenciales inválidas');

    const valid = await bcrypt.compare(input.password, user.password);
    if (!valid) throw new AppError(401, 'Credenciales inválidas');

    const payload: AuthPayload = { userId: user.id, email: user.email };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);
    await cleanupExpiredRefreshTokens();
    await revokeUserRefreshTokens(user.id);
    await storeRefreshToken(user.id, refreshToken);

    const { password: _pw, ...profile } = user;
    return {
      user: profile,
      accessToken,
      refreshToken,
    };
  },

  async refresh(refreshToken: string) {
    let payload: AuthPayload;
    try {
      payload = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as AuthPayload;
    } catch {
      throw new AppError(401, 'Refresh token inválido');
    }

    const stored = await prisma.refreshToken.findUnique({ where: { token: refreshToken } });
    if (!stored || stored.expiresAt < new Date()) {
      throw new AppError(401, 'Refresh token expirado');
    }

    await prisma.refreshToken.delete({ where: { id: stored.id } });

    const accessToken = signAccessToken(payload);
    const newRefreshToken = signRefreshToken(payload);
    await storeRefreshToken(payload.userId, newRefreshToken);

    return { accessToken, refreshToken: newRefreshToken };
  },

  async logout(refreshToken: string) {
    await prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
  },

  /** Siempre responde OK; en desarrollo imprime el enlace (sin servicio de email). */
  async forgotPassword(email: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return { ok: true as const };
    }

    await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    await prisma.passwordResetToken.create({
      data: { token, userId: user.id, expiresAt },
    });

    const base = env.WEB_APP_ORIGIN.replace(/\/$/, '');
    const link = `${base}/reset-password?token=${token}`;

    try {
      const sent = await emailService.sendPasswordReset(user.email, link, user.name);
      if (!sent) {
        if (env.NODE_ENV === 'development') {
          console.log('[ascendx] Email no enviado (configura RESEND_API_KEY y RESEND_FROM). Enlace:', link);
        }
      }
    } catch (e) {
      console.error('[ascendx] Error enviando email de recuperación:', e);
      if (env.NODE_ENV === 'development') {
        console.log('[ascendx] Enlace de respaldo:', link);
      }
    }

    return { ok: true as const };
  },

  async resetPassword(token: string, newPassword: string) {
    const row = await prisma.passwordResetToken.findUnique({ where: { token } });
    if (!row || row.usedAt || row.expiresAt < new Date()) {
      throw new AppError(400, 'El enlace es inválido o expiró. Solicita uno nuevo.');
    }

    const hashed = await bcrypt.hash(newPassword, SALT_ROUNDS);

    await prisma.$transaction(async (tx) => {
      await tx.user.update({ where: { id: row.userId }, data: { password: hashed } });
      await tx.passwordResetToken.update({ where: { id: row.id }, data: { usedAt: new Date() } });
      await tx.refreshToken.deleteMany({ where: { userId: row.userId } });
    });

    return { ok: true as const };
  },
};
