import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { sendSuccess } from '../utils/response';
import { userService } from '../services/user.service';

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

export default router;
