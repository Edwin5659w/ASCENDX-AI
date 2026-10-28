import { Router } from 'express';
import { z } from 'zod';
import type { Category } from '../../generated/prisma/client.js';
import { uuidSchema } from '../../lib/calendar.js';
import { HttpError } from '../../lib/http-error.js';
import { prisma } from '../../lib/prisma.js';
import { currentUserId, protectedRoute } from '../../middleware/require-auth.js';
import { parseBody, parseParams, parseQuery } from '../../middleware/validate.js';

/** RF-10: categorías por defecto (user_id = null) y personalizadas del usuario. */
export const categoriesRouter = Router();
categoriesRouter.use(protectedRoute);

export function presentCategory(category: Category) {
  return {
    id: category.id,
    name: category.name,
    kind: category.kind,
    icon: category.icon,
    color: category.color,
    isDefault: category.userId === null,
  };
}

/** Categorías visibles para el usuario: las del sistema y las suyas sin archivar. */
export function visibleCategoriesWhere(userId: string) {
  return { archivedAt: null, OR: [{ userId: null }, { userId }] };
}

categoriesRouter.get('/', async (req, res) => {
  const userId = currentUserId(req);
  const { kind } = parseQuery(z.object({ kind: z.enum(['ingreso', 'gasto']).optional() }), req);
  const categories = await prisma.category.findMany({
    where: { ...visibleCategoriesWhere(userId), ...(kind ? { kind } : {}) },
    orderBy: [{ kind: 'asc' }, { isDefault: 'desc' }, { name: 'asc' }],
  });
  res.json({ categories: categories.map(presentCategory) });
});

const colorSchema = z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color en formato #RRGGBB');
const createSchema = z.object({
  name: z.string().trim().min(2, 'Mínimo 2 caracteres').max(60),
  kind: z.enum(['ingreso', 'gasto']),
  icon: z.string().trim().max(40).optional(),
  color: colorSchema.optional(),
});

async function assertNameAvailable(userId: string, name: string, kind: 'ingreso' | 'gasto', exceptId?: string) {
  const clash = await prisma.category.findFirst({
    where: {
      ...visibleCategoriesWhere(userId),
      kind,
      name: { equals: name, mode: 'insensitive' },
      ...(exceptId ? { NOT: { id: exceptId } } : {}),
    },
    select: { id: true },
  });
  if (clash) throw HttpError.conflict('CATEGORY_EXISTS', 'Ya tienes una categoría con ese nombre');
}

categoriesRouter.post('/', async (req, res) => {
  const userId = currentUserId(req);
  const data = parseBody(createSchema, req);
  await assertNameAvailable(userId, data.name, data.kind);
  // Si había una archivada con el mismo nombre, se reactiva en lugar de duplicarla.
  const archived = await prisma.category.findFirst({ where: { userId, kind: data.kind, name: data.name, NOT: { archivedAt: null } } });
  const category = archived
    ? await prisma.category.update({ where: { id: archived.id }, data: { archivedAt: null, icon: data.icon, color: data.color } })
    : await prisma.category.create({ data: { ...data, userId } });
  res.status(201).json({ category: presentCategory(category) });
});

const idParams = z.object({ id: uuidSchema });

async function ownCategory(userId: string, id: string) {
  const category = await prisma.category.findFirst({ where: { id, userId, archivedAt: null } });
  if (!category) throw HttpError.notFound('Categoría no encontrada');
  return category;
}

categoriesRouter.patch('/:id', async (req, res) => {
  const userId = currentUserId(req);
  const { id } = parseParams(idParams, req);
  const changes = parseBody(createSchema.omit({ kind: true }).partial(), req);
  const category = await ownCategory(userId, id);
  if (changes.name) await assertNameAvailable(userId, changes.name, category.kind, id);
  const updated = await prisma.category.update({ where: { id }, data: changes });
  res.json({ category: presentCategory(updated) });
});

/** Con movimientos se archiva (para no perder el historial); sin movimientos se borra. */
categoriesRouter.delete('/:id', async (req, res) => {
  const userId = currentUserId(req);
  const { id } = parseParams(idParams, req);
  await ownCategory(userId, id);
  const used = await prisma.transaction.count({ where: { categoryId: id, deletedAt: null } });
  if (used > 0) await prisma.category.update({ where: { id }, data: { archivedAt: new Date() } });
  else await prisma.category.delete({ where: { id } });
  res.status(204).end();
});
