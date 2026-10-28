import { Router } from 'express';
import { z } from 'zod';
import { uuidSchema } from '../../lib/calendar.js';
import { HttpError } from '../../lib/http-error.js';
import { prisma } from '../../lib/prisma.js';
import { currentUserId, protectedRoute } from '../../middleware/require-auth.js';
import { parseBody, parseParams } from '../../middleware/validate.js';
import { aiLimits, analyze, chat } from './ai.service.js';
import { currentProvider } from './providers.js';

/** RF-23 a RF-26: asistente con contexto controlado, límites y verificación de cifras. */
export const aiRouter = Router();
aiRouter.use(protectedRoute);

aiRouter.get('/status', async (req, res) => {
  const userId = currentUserId(req);
  const [limits, consent] = await Promise.all([
    aiLimits(userId),
    prisma.consent.findFirst({ where: { userId, type: 'ia', revokedAt: null } }),
  ]);
  const provider = currentProvider();
  res.json({
    consent: Boolean(consent),
    external: provider.external,
    provider: provider.external ? provider.name.split(':')[0] : 'reglas',
    limits: { chat: limits.chat, analysis: limits.analysis },
  });
});

/** RF-23: resumen financiero explicado. */
aiRouter.post('/summary', async (req, res) => {
  res.json(await analyze(currentUserId(req), 'resumen'));
});

/** RF-24: plan de acción (opcionalmente para una meta). */
aiRouter.post('/plan', async (req, res) => {
  const { goalId } = z.object({ goalId: uuidSchema.nullable().optional() }).parse(req.body ?? {});
  res.json(await analyze(currentUserId(req), 'plan', goalId));
});

/** RF-25: chat con límite diario. */
aiRouter.post('/chat', async (req, res) => {
  const { message, conversationId } = parseBody(
    z.object({ message: z.string().trim().min(2, 'Escribe tu pregunta').max(500, 'Máximo 500 caracteres'), conversationId: uuidSchema.nullable().optional() }),
    req,
  );
  res.json(await chat(currentUserId(req), message, conversationId));
});

aiRouter.get('/conversations', async (req, res) => {
  const userId = currentUserId(req);
  const conversations = await prisma.aiConversation.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
    take: 30,
    include: { _count: { select: { messages: true } } },
  });
  res.json({
    conversations: conversations.map((c) => ({ id: c.id, title: c.title, messages: c._count.messages, updatedAt: c.updatedAt.toISOString() })),
  });
});

const idParams = z.object({ id: uuidSchema });

aiRouter.get('/conversations/:id', async (req, res) => {
  const userId = currentUserId(req);
  const { id } = parseParams(idParams, req);
  const conversation = await prisma.aiConversation.findFirst({
    where: { id, userId },
    include: { messages: { orderBy: { createdAt: 'asc' } } },
  });
  if (!conversation) throw HttpError.notFound('Conversación no encontrada');
  res.json({
    conversation: { id: conversation.id, title: conversation.title },
    messages: conversation.messages.map((m) => ({ id: m.id, role: m.role, content: m.content, meta: m.meta, createdAt: m.createdAt.toISOString() })),
  });
});

/** RF-26: borrar todo el historial de conversaciones. */
aiRouter.delete('/conversations', async (req, res) => {
  await prisma.aiConversation.deleteMany({ where: { userId: currentUserId(req) } });
  res.status(204).end();
});

aiRouter.delete('/conversations/:id', async (req, res) => {
  const userId = currentUserId(req);
  const { id } = parseParams(idParams, req);
  const { count } = await prisma.aiConversation.deleteMany({ where: { id, userId } });
  if (count === 0) throw HttpError.notFound('Conversación no encontrada');
  res.status(204).end();
});
