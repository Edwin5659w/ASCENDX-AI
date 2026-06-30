import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { sendSuccess, sendMessage } from '../utils/response';
import { habitService } from '../services/habit.service';
import { parseListQuery } from '../utils/pagination';
import {
  createHabitSchema,
  updateHabitSchema,
  habitIdSchema,
} from '@ascendx/shared/validators/habit.validator';

const router = Router();

router.use(requireAuth);

router.get('/', async (req, res, next) => {
  try {
    const pagination = parseListQuery(req.query as Record<string, unknown>);
    const habits = await habitService.list(req.user!.userId, pagination ?? undefined);
    sendSuccess(res, habits);
  } catch (e) {
    next(e);
  }
});

router.get('/:id', validate(habitIdSchema, 'params'), async (req, res, next) => {
  try {
    const habit = await habitService.getById(req.user!.userId, req.params.id);
    sendSuccess(res, habit);
  } catch (e) {
    next(e);
  }
});

router.post('/', validate(createHabitSchema), async (req, res, next) => {
  try {
    const habit = await habitService.create(req.user!.userId, req.body);
    sendSuccess(res, habit, 201);
  } catch (e) {
    next(e);
  }
});

router.patch('/:id', validate(habitIdSchema, 'params'), validate(updateHabitSchema), async (req, res, next) => {
  try {
    const habit = await habitService.update(req.user!.userId, req.params.id, req.body);
    sendSuccess(res, habit);
  } catch (e) {
    next(e);
  }
});

router.post('/:id/complete', validate(habitIdSchema, 'params'), async (req, res, next) => {
  try {
    const habit = await habitService.complete(req.user!.userId, req.params.id);
    sendSuccess(res, habit);
  } catch (e) {
    next(e);
  }
});

router.delete('/:id', validate(habitIdSchema, 'params'), async (req, res, next) => {
  try {
    await habitService.remove(req.user!.userId, req.params.id);
    sendMessage(res, 'Hábito eliminado');
  } catch (e) {
    next(e);
  }
});

export default router;
