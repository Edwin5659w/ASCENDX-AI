import { Router } from 'express';
import { validate } from '../middleware/validate';
import { sendSuccess } from '../utils/response';
import { authService } from '../services/auth.service';
import {
  registerSchema,
  loginSchema,
  refreshSchema,
} from '@ascendx/shared/validators/auth.validator';

const router = Router();

router.post('/register', validate(registerSchema), async (req, res, next) => {
  try {
    const result = await authService.register(req.body);
    sendSuccess(res, result, 201);
  } catch (e) {
    next(e);
  }
});

router.post('/login', validate(loginSchema), async (req, res, next) => {
  try {
    const result = await authService.login(req.body);
    sendSuccess(res, result);
  } catch (e) {
    next(e);
  }
});

router.post('/refresh', validate(refreshSchema), async (req, res, next) => {
  try {
    const result = await authService.refresh(req.body.refreshToken);
    sendSuccess(res, result);
  } catch (e) {
    next(e);
  }
});

export default router;
