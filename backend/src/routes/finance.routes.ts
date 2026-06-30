import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { sendSuccess, sendMessage } from '../utils/response';
import { financeService } from '../services/finance.service';
import { parseListQuery } from '../utils/pagination';
import {
  createFinanceSchema,
  updateFinanceSchema,
  financeIdSchema,
} from '@ascendx/shared/validators/finance.validator';

const router = Router();

router.use(requireAuth);

router.get('/', async (req, res, next) => {
  try {
    const pagination = parseListQuery(req.query as Record<string, unknown>);
    const records = await financeService.list(req.user!.userId, pagination ?? undefined);
    sendSuccess(res, records);
  } catch (e) {
    next(e);
  }
});

router.get('/summary', async (req, res, next) => {
  try {
    const summary = await financeService.summary(req.user!.userId);
    sendSuccess(res, summary);
  } catch (e) {
    next(e);
  }
});

router.get('/:id', validate(financeIdSchema, 'params'), async (req, res, next) => {
  try {
    const record = await financeService.getById(req.user!.userId, req.params.id);
    sendSuccess(res, record);
  } catch (e) {
    next(e);
  }
});

router.post('/', validate(createFinanceSchema), async (req, res, next) => {
  try {
    const record = await financeService.create(req.user!.userId, req.body);
    sendSuccess(res, record, 201);
  } catch (e) {
    next(e);
  }
});

router.patch('/:id', validate(financeIdSchema, 'params'), validate(updateFinanceSchema), async (req, res, next) => {
  try {
    const record = await financeService.update(req.user!.userId, req.params.id, req.body);
    sendSuccess(res, record);
  } catch (e) {
    next(e);
  }
});

router.delete('/:id', validate(financeIdSchema, 'params'), async (req, res, next) => {
  try {
    await financeService.remove(req.user!.userId, req.params.id);
    sendMessage(res, 'Registro eliminado');
  } catch (e) {
    next(e);
  }
});

export default router;
