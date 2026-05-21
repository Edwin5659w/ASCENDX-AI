import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { sendSuccess, sendMessage } from '../utils/response';
import { tradeService } from '../services/trade.service';
import {
  createTradeSchema,
  updateTradeSchema,
  tradeIdSchema,
} from '@ascendx/shared/validators/trade.validator';

const router = Router();

router.use(requireAuth);

router.get('/', async (req, res, next) => {
  try {
    const trades = await tradeService.list(req.user!.userId);
    sendSuccess(res, trades);
  } catch (e) {
    next(e);
  }
});

router.get('/summary', async (req, res, next) => {
  try {
    const summary = await tradeService.summary(req.user!.userId);
    sendSuccess(res, summary);
  } catch (e) {
    next(e);
  }
});

router.get('/:id', validate(tradeIdSchema, 'params'), async (req, res, next) => {
  try {
    const trade = await tradeService.getById(req.user!.userId, req.params.id);
    sendSuccess(res, trade);
  } catch (e) {
    next(e);
  }
});

router.post('/', validate(createTradeSchema), async (req, res, next) => {
  try {
    const trade = await tradeService.create(req.user!.userId, req.body);
    sendSuccess(res, trade, 201);
  } catch (e) {
    next(e);
  }
});

router.patch('/:id', validate(tradeIdSchema, 'params'), validate(updateTradeSchema), async (req, res, next) => {
  try {
    const trade = await tradeService.update(req.user!.userId, req.params.id, req.body);
    sendSuccess(res, trade);
  } catch (e) {
    next(e);
  }
});

router.delete('/:id', validate(tradeIdSchema, 'params'), async (req, res, next) => {
  try {
    await tradeService.remove(req.user!.userId, req.params.id);
    sendMessage(res, 'Operación eliminada');
  } catch (e) {
    next(e);
  }
});

export default router;
