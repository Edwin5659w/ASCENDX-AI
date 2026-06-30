import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { sendSuccess, sendMessage } from '../utils/response';
import { goalService } from '../services/goal.service';
import { parseListQuery } from '../utils/pagination';
import {
  createGoalSchema,
  updateGoalSchema,
  goalIdSchema,
} from '@ascendx/shared/validators/goal.validator';

const router = Router();

router.use(requireAuth);

router.get('/', async (req, res, next) => {
  try {
    const pagination = parseListQuery(req.query as Record<string, unknown>);
    const goals = await goalService.list(req.user!.userId, pagination ?? undefined);
    sendSuccess(res, goals);
  } catch (e) {
    next(e);
  }
});

router.get('/:id', validate(goalIdSchema, 'params'), async (req, res, next) => {
  try {
    const goal = await goalService.getById(req.user!.userId, req.params.id);
    sendSuccess(res, goal);
  } catch (e) {
    next(e);
  }
});

router.post('/', validate(createGoalSchema), async (req, res, next) => {
  try {
    const goal = await goalService.create(req.user!.userId, req.body);
    sendSuccess(res, goal, 201);
  } catch (e) {
    next(e);
  }
});

router.patch('/:id', validate(goalIdSchema, 'params'), validate(updateGoalSchema), async (req, res, next) => {
  try {
    const goal = await goalService.update(req.user!.userId, req.params.id, req.body);
    sendSuccess(res, goal);
  } catch (e) {
    next(e);
  }
});

router.delete('/:id', validate(goalIdSchema, 'params'), async (req, res, next) => {
  try {
    await goalService.remove(req.user!.userId, req.params.id);
    sendMessage(res, 'Objetivo eliminado');
  } catch (e) {
    next(e);
  }
});

export default router;
