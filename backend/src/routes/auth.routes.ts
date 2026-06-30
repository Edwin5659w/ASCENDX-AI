import { Router } from 'express';
import { validate } from '../middleware/validate';
import { sendSuccess } from '../utils/response';
import { authService } from '../services/auth.service';
import {
  registerSchema,
  loginSchema,
  refreshSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  googleAuthSchema,
  appleAuthSchema,
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

router.post('/logout', validate(refreshSchema), async (req, res, next) => {
  try {
    await authService.logout(req.body.refreshToken);
    sendSuccess(res, { ok: true });
  } catch (e) {
    next(e);
  }
});

router.post('/forgot-password', validate(forgotPasswordSchema), async (req, res, next) => {
  try {
    const result = await authService.forgotPassword(req.body.email);
    sendSuccess(res, result);
  } catch (e) {
    next(e);
  }
});

router.post('/reset-password', validate(resetPasswordSchema), async (req, res, next) => {
  try {
    const result = await authService.resetPassword(req.body.token, req.body.password);
    sendSuccess(res, result);
  } catch (e) {
    next(e);
  }
});

router.post('/google', validate(googleAuthSchema), async (req, res, next) => {
  try {
    const result = await authService.loginWithGoogle(req.body.idToken, req.body.referralCode);
    sendSuccess(res, result, 201);
  } catch (e) {
    next(e);
  }
});

router.post('/apple', validate(appleAuthSchema), async (req, res, next) => {
  try {
    const result = await authService.loginWithApple(
      req.body.identityToken,
      req.body.fullName,
      req.body.referralCode,
    );
    sendSuccess(res, result, 201);
  } catch (e) {
    next(e);
  }
});

export default router;
