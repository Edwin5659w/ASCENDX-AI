import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { sendSuccess } from '../utils/response';
import { userService } from '../services/user.service';
import { updateProfileSchema, changePasswordSchema } from '@ascendx/shared/validators/user.validator';
import { onboardingSetupSchema } from '@ascendx/shared/validators/onboarding.validator';

const router = Router();

router.use(requireAuth);

router.get('/me', async (req, res, next) => {
  try {
    const user = await userService.getMe(req.user!.userId);
    sendSuccess(res, user);
  } catch (e) {
    next(e);
  }
});

router.get('/stats', async (req, res, next) => {
  try {
    const stats = await userService.getStats(req.user!.userId);
    sendSuccess(res, stats);
  } catch (e) {
    next(e);
  }
});

router.post('/change-password', validate(changePasswordSchema), async (req, res, next) => {
  try {
    const result = await userService.changePassword(
      req.user!.userId,
      req.body.currentPassword,
      req.body.newPassword,
    );
    sendSuccess(res, result);
  } catch (e) {
    next(e);
  }
});

router.patch('/me', validate(updateProfileSchema), async (req, res, next) => {
  try {
    const user = await userService.updateProfile(req.user!.userId, req.body);
    sendSuccess(res, user);
  } catch (e) {
    next(e);
  }
});

router.post('/onboarding-setup', validate(onboardingSetupSchema), async (req, res, next) => {
  try {
    const result = await userService.setupOnboarding(req.user!.userId, req.body);
    sendSuccess(res, result);
  } catch (e) {
    next(e);
  }
});

router.post('/onboarding-complete', async (req, res, next) => {
  try {
    const user = await userService.updateProfile(req.user!.userId, { onboardingDone: true });
    sendSuccess(res, user);
  } catch (e) {
    next(e);
  }
});

router.post('/push/test', async (req, res, next) => {
  try {
    const result = await userService.sendTestPushNotification(req.user!.userId);
    sendSuccess(res, result);
  } catch (e) {
    next(e);
  }
});

export default router;
