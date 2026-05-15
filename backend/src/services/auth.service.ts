import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { env } from '../config/env';
import { AppError } from '../middleware/errorHandler';
import type { RegisterInput, LoginInput } from '@ascendx/shared/validators/auth.validator';
import type { AuthPayload } from '../middleware/auth';

const SALT_ROUNDS = 12;

const signAccessToken = (payload: AuthPayload): string =>
  jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn: env.JWT_ACCESS_EXPIRES_IN as jwt.SignOptions['expiresIn'] });

const signRefreshToken = (payload: AuthPayload): string =>
  jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn: env.JWT_REFRESH_EXPIRES_IN as jwt.SignOptions['expiresIn'] });

const storeRefreshToken = async (userId: string, token: string): Promise<void> => {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await prisma.refreshToken.create({
    data: { token, userId, expiresAt },
  });
};

export const authService = {
  async register(input: RegisterInput) {
    const existing = await prisma.user.findUnique({ where: { email: input.email } });
    if (existing) throw new AppError(409, 'El email ya está registrado');

    const hashed = await bcrypt.hash(input.password, SALT_ROUNDS);
    const user = await prisma.user.create({
      data: { name: input.name, email: input.email, password: hashed },
      select: { id: true, name: true, email: true, xp: true, level: true, createdAt: true },
    });

    const payload: AuthPayload = { userId: user.id, email: user.email };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);
    await storeRefreshToken(user.id, refreshToken);

    return { user, accessToken, refreshToken };
  },

  async login(input: LoginInput) {
    const user = await prisma.user.findUnique({ where: { email: input.email } });
    if (!user) throw new AppError(401, 'Credenciales inválidas');

    const valid = await bcrypt.compare(input.password, user.password);
    if (!valid) throw new AppError(401, 'Credenciales inválidas');

    const payload: AuthPayload = { userId: user.id, email: user.email };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);
    await storeRefreshToken(user.id, refreshToken);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        xp: user.xp,
        level: user.level,
        createdAt: user.createdAt,
      },
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
};
