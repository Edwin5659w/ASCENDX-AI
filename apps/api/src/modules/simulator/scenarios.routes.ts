import { ENGINE_VERSION, simulatePurchase } from '@ascendx/finance-core';
import { Router } from 'express';
import { z } from 'zod';
import type { Prisma } from '../../generated/prisma/client.js';
import { uuidSchema } from '../../lib/calendar.js';
import { HttpError } from '../../lib/http-error.js';
import { prisma } from '../../lib/prisma.js';
import { currentUserId, protectedRoute } from '../../middleware/require-auth.js';
import { parseBody, parseParams } from '../../middleware/validate.js';
import { getUsuryReference } from '../settings/settings.service.js';
import { simulationSchema } from './simulator.routes.js';

/** RF-22: escenarios guardados (entradas, resultados y versión del motor). */
export const scenariosRouter = Router();
scenariosRouter.use(protectedRoute);

const createSchema = z.object({
  name: z.string().trim().min(2, 'Ponle un nombre al escenario').max(80),
  goalId: uuidSchema.nullable().optional(),
  input: simulationSchema,
});

function summarize(results: ReturnType<typeof simulatePurchase>) {
  const { schedule: _credit, ...credit } = results.credit;
  const mixed = results.mixed ? (({ schedule: _mixed, ...rest }) => rest)(results.mixed) : null;
  return { ...results, credit, mixed };
}

scenariosRouter.post('/', async (req, res) => {
  const userId = currentUserId(req);
  const { name, goalId, input } = parseBody(createSchema, req);
  if (goalId) {
    const goal = await prisma.financialGoal.findFirst({ where: { id: goalId, userId, deletedAt: null } });
    if (!goal) throw HttpError.badRequest('La meta no existe');
  }
  let results;
  try {
    results = summarize(simulatePurchase({ ...input, usury: await getUsuryReference() }));
  } catch (error) {
    if (error instanceof RangeError) throw HttpError.badRequest(error.message);
    throw error;
  }
  const scenario = await prisma.creditScenario.create({
    data: {
      userId,
      goalId: goalId ?? null,
      name,
      inputs: input as Prisma.InputJsonValue,
      results: results as unknown as Prisma.InputJsonValue,
      engineVersion: ENGINE_VERSION,
    },
  });
  res.status(201).json({ scenario: present(scenario) });
});

function present(scenario: {
  id: string;
  name: string;
  goalId: string | null;
  inputs: unknown;
  results: unknown;
  engineVersion: string;
  createdAt: Date;
}) {
  return {
    id: scenario.id,
    name: scenario.name,
    goalId: scenario.goalId,
    input: scenario.inputs,
    results: scenario.results,
    engineVersion: scenario.engineVersion,
    createdAt: scenario.createdAt.toISOString(),
  };
}

scenariosRouter.get('/', async (req, res) => {
  const userId = currentUserId(req);
  const scenarios = await prisma.creditScenario.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 50 });
  res.json({ scenarios: scenarios.map(present) });
});

const idParams = z.object({ id: uuidSchema });

scenariosRouter.get('/:id', async (req, res) => {
  const userId = currentUserId(req);
  const { id } = parseParams(idParams, req);
  const scenario = await prisma.creditScenario.findFirst({ where: { id, userId } });
  if (!scenario) throw HttpError.notFound('Escenario no encontrado');
  res.json({ scenario: present(scenario) });
});

scenariosRouter.delete('/:id', async (req, res) => {
  const userId = currentUserId(req);
  const { id } = parseParams(idParams, req);
  const { count } = await prisma.creditScenario.deleteMany({ where: { id, userId } });
  if (count === 0) throw HttpError.notFound('Escenario no encontrado');
  res.status(204).end();
});
