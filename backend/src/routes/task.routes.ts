import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { sendSuccess, sendMessage } from '../utils/response';
import { taskService } from '../services/task.service';
import { parseListQuery } from '../utils/pagination';
import {
  createTaskSchema,
  updateTaskSchema,
  taskIdSchema,
} from '@ascendx/shared/validators/task.validator';

const router = Router();

router.use(requireAuth);

router.get('/', async (req, res, next) => {
  try {
    const goalId = typeof req.query.goalId === 'string' ? req.query.goalId : undefined;
    const pagination = parseListQuery(req.query as Record<string, unknown>);
    const tasks = await taskService.list(req.user!.userId, goalId, pagination ?? undefined);
    sendSuccess(res, tasks);
  } catch (e) {
    next(e);
  }
});

router.get('/:id', validate(taskIdSchema, 'params'), async (req, res, next) => {
  try {
    const task = await taskService.getById(req.user!.userId, req.params.id);
    sendSuccess(res, task);
  } catch (e) {
    next(e);
  }
});

router.post('/', validate(createTaskSchema), async (req, res, next) => {
  try {
    const task = await taskService.create(req.user!.userId, req.body);
    sendSuccess(res, task, 201);
  } catch (e) {
    next(e);
  }
});

router.patch('/:id', validate(taskIdSchema, 'params'), validate(updateTaskSchema), async (req, res, next) => {
  try {
    const task = await taskService.update(req.user!.userId, req.params.id, req.body);
    sendSuccess(res, task);
  } catch (e) {
    next(e);
  }
});

router.delete('/:id', validate(taskIdSchema, 'params'), async (req, res, next) => {
  try {
    await taskService.remove(req.user!.userId, req.params.id);
    sendMessage(res, 'Tarea eliminada');
  } catch (e) {
    next(e);
  }
});

export default router;
