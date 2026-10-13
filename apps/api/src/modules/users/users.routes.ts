import { Router } from 'express';
import { z } from 'zod';
import { HttpError } from '../../lib/http-error.js';
import { prisma } from '../../lib/prisma.js';
import { currentUserId, requireAuth } from '../../middleware/require-auth.js';
import { parseBody } from '../../middleware/validate.js';
import { verifyPassword } from '../auth/password.js';
import { presentUser } from './user.presenter.js';

export const usersRouter = Router();

usersRouter.use(requireAuth);

usersRouter.get('/', async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: currentUserId(req) } });
  if (!user) throw HttpError.unauthorized();
  res.json({ user: presentUser(user) });
});

const consentsSchema = z
  .object({
    ai: z.boolean().optional(),
    ocr: z.boolean().optional(),
  })
  .refine((value) => value.ai !== undefined || value.ocr !== undefined, 'Indica al menos un consentimiento');

/** Otorga o retira el consentimiento para procesar datos con IA y OCR. */
usersRouter.patch('/consents', async (req, res) => {
  const { ai, ocr } = parseBody(consentsSchema, req);
  const now = new Date();
  const user = await prisma.user.update({
    where: { id: currentUserId(req) },
    data: {
      ...(ai !== undefined ? { aiConsentAt: ai ? now : null } : {}),
      ...(ocr !== undefined ? { ocrConsentAt: ocr ? now : null } : {}),
    },
  });
  res.json({ user: presentUser(user) });
});

const deleteAccountSchema = z.object({ password: z.string().min(1).max(72) });

/**
 * Elimina la cuenta y todos sus datos financieros (borrado en cascada).
 * Pide la contraseña para confirmar.
 */
usersRouter.delete('/', async (req, res) => {
  const { password } = parseBody(deleteAccountSchema, req);
  const user = await prisma.user.findUnique({ where: { id: currentUserId(req) } });
  if (!user) throw HttpError.unauthorized();
  if (!(await verifyPassword(password, user.passwordHash))) {
    throw new HttpError(401, 'INVALID_CREDENTIALS', 'La contraseña no es correcta');
  }
  await prisma.user.delete({ where: { id: user.id } });
  res.status(204).end();
});
