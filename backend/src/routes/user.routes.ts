import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { sendSuccess } from '../utils/response';
import { userService } from '../services/user.service';
import { updateProfileSchema } from '@ascendx/shared/validators/user.validator';

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

router.patch('/me', validate(updateProfileSchema), async (req, res, next) => {
  try {
    const user = await userService.updateProfile(req.user!.userId, req.body);
    sendSuccess(res, user);
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

export default router;
