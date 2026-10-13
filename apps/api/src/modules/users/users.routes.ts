import { Router } from 'express';
import { z } from 'zod';
import { HttpError } from '../../lib/http-error.js';
import { prisma } from '../../lib/prisma.js';
import { currentUserId, protectedRoute } from '../../middleware/require-auth.js';
import { parseBody } from '../../middleware/validate.js';
import { verifyPassword } from '../auth/password.js';
import { CONSENT_VERSIONS } from './consents.js';
import { presentUser, userInclude } from './user.presenter.js';

export const usersRouter = Router();

usersRouter.use(protectedRoute);

async function loadUser(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, include: userInclude });
  if (!user) throw HttpError.unauthorized();
  return user;
}

usersRouter.get('/', async (req, res) => {
  res.json({ user: presentUser(await loadUser(currentUserId(req))) });
});

const pesos = z.number().int('Los montos van en pesos enteros').min(0, 'El monto no puede ser negativo').max(100_000_000_000);

/** RF-04: editar perfil y perfil financiero (montos ≥ 0). */
const profileSchema = z
  .object({
    name: z.string().trim().min(2).max(80).optional(),
    estimatedIncome: pesos.nullable().optional(),
    estimatedFixedExpenses: pesos.nullable().optional(),
    payDay: z.number().int().min(1).max(31).nullable().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, 'No hay cambios para guardar');

usersRouter.patch('/profile', async (req, res) => {
  const userId = currentUserId(req);
  const { name, estimatedIncome, estimatedFixedExpenses, payDay } = parseBody(profileSchema, req);
  const toBigInt = (value: number | null | undefined) =>
    value === undefined ? undefined : value === null ? null : BigInt(value);
  await prisma.$transaction([
    ...(name ? [prisma.user.update({ where: { id: userId }, data: { name } })] : []),
    prisma.financialProfile.upsert({
      where: { userId },
      create: {
        userId,
        estimatedIncome: toBigInt(estimatedIncome) ?? null,
        estimatedFixedExpenses: toBigInt(estimatedFixedExpenses) ?? null,
        payDay: payDay ?? null,
      },
      update: {
        estimatedIncome: toBigInt(estimatedIncome),
        estimatedFixedExpenses: toBigInt(estimatedFixedExpenses),
        payDay,
      },
    }),
  ]);
  res.json({ user: presentUser(await loadUser(userId)) });
});

/** RF-06: autorizar o revocar por separado el uso de IA y de OCR. */
const consentsSchema = z
  .object({ ia: z.boolean().optional(), ocr: z.boolean().optional() })
  .refine((value) => value.ia !== undefined || value.ocr !== undefined, 'Indica al menos un permiso');

usersRouter.patch('/consents', async (req, res) => {
  const userId = currentUserId(req);
  const changes = parseBody(consentsSchema, req);
  const now = new Date();
  for (const type of ['ia', 'ocr'] as const) {
    const grant = changes[type];
    if (grant === undefined) continue;
    const active = await prisma.consent.findFirst({ where: { userId, type, revokedAt: null } });
    if (grant && !active) {
      await prisma.consent.create({ data: { userId, type, version: CONSENT_VERSIONS[type] } });
    } else if (!grant && active) {
      await prisma.consent.updateMany({ where: { userId, type, revokedAt: null }, data: { revokedAt: now } });
    }
  }
  res.json({ user: presentUser(await loadUser(userId)) });
});

/** RF-05: eliminar la cuenta y todos sus datos (borrado en cascada). Pide la contraseña. */
const deleteAccountSchema = z.object({ password: z.string().min(1).max(72) });

usersRouter.delete('/', async (req, res) => {
  const { password } = parseBody(deleteAccountSchema, req);
  const user = await loadUser(currentUserId(req));
  if (!(await verifyPassword(password, user.passwordHash))) {
    throw new HttpError(401, 'INVALID_CREDENTIALS', 'La contraseña no es correcta');
  }
  await prisma.user.delete({ where: { id: user.id } });
  res.status(204).end();
});
