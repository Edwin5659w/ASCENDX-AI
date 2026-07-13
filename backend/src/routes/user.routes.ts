import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { billingService } from '../services/billing.service';
import { AppError } from '../middleware/errorHandler';
import { sendSuccess } from '../utils/response';
import { userService } from '../services/user.service';
import { planService } from '../services/plan.service';
import { accountabilityService } from '../services/accountability.service';
import { env } from '../config/env';
import { updateProfileSchema, changePasswordSchema, dailyFocusSchema, deleteAccountSchema } from '@ascendx/shared/validators/user.validator';
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

router.get('/weekly-recap', async (req, res, next) => {
  try {
    const recap = await userService.getWeeklyRecap(req.user!.userId);
    sendSuccess(res, recap);
  } catch (e) {
    next(e);
  }
});

router.get('/referral', async (req, res, next) => {
  try {
    const info = await userService.getReferralInfo(req.user!.userId);
    sendSuccess(res, info);
  } catch (e) {
    next(e);
  }
});

router.get('/plan', async (req, res, next) => {
  try {
    const summary = await planService.getUsageSummary(req.user!.userId);
    sendSuccess(res, summary);
  } catch (e) {
    next(e);
  }
});

router.post('/daily-focus', validate(dailyFocusSchema), async (req, res, next) => {
  try {
    const user = await userService.updateProfile(req.user!.userId, { dailyFocus: req.body.focus });
    sendSuccess(res, user);
  } catch (e) {
    next(e);
  }
});

router.post('/upgrade-pro', async (req, res, next) => {
  try {
    if (env.NODE_ENV === 'production' || billingService.isConfigured()) {
      throw new AppError(400, 'Usa el checkout de Stripe para activar Pro');
    }
    const user = await userService.upgradeToPro(req.user!.userId);
    sendSuccess(res, user);
  } catch (e) {
    next(e);
  }
});

router.post('/product-tour-complete', async (req, res, next) => {
  try {
    const user = await userService.updateProfile(req.user!.userId, { productTourDone: true });
    sendSuccess(res, user);
  } catch (e) {
    next(e);
  }
});

router.post('/morning-ritual-complete', async (req, res, next) => {
  try {
    sendSuccess(res, await userService.completeMorningRitual(req.user!.userId));
  } catch (e) {
    next(e);
  }
});

router.get('/search', async (req, res, next) => {
  try {
    const q = typeof req.query.q === 'string' ? req.query.q : '';
    sendSuccess(res, await userService.search(req.user!.userId, q));
  } catch (e) {
    next(e);
  }
});

router.get('/accountability/code', async (req, res, next) => {
  try {
    const code = await accountabilityService.ensureCode(req.user!.userId);
    sendSuccess(res, { code });
  } catch (e) {
    next(e);
  }
});

router.get('/accountability/partners', async (req, res, next) => {
  try {
    sendSuccess(res, await accountabilityService.listPartners(req.user!.userId));
  } catch (e) {
    next(e);
  }
});

router.post('/accountability/link', async (req, res, next) => {
  try {
    const code = typeof req.body?.code === 'string' ? req.body.code : '';
    if (!code) throw new AppError(400, 'Código requerido');
    sendSuccess(res, await accountabilityService.linkPartner(req.user!.userId, code));
  } catch (e) {
    next(e);
  }
});

router.delete('/accountability/partners/:partnerId', async (req, res, next) => {
  try {
    sendSuccess(res, await accountabilityService.unlinkPartner(req.user!.userId, req.params.partnerId));
  } catch (e) {
    next(e);
  }
});

router.get('/export', async (req, res, next) => {
  try {
    await planService.assertCanExport(req.user!.userId);
    const data = await userService.exportUserData(req.user!.userId);
    res.setHeader('Content-Type', 'application/json');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="ascendx-export-${new Date().toISOString().slice(0, 10)}.json"`,
    );
    res.send(JSON.stringify(data, null, 2));
  } catch (e) {
    next(e);
  }
});

router.delete('/account', validate(deleteAccountSchema), async (req, res, next) => {
  try {
    const result = await userService.deleteAccount(req.user!.userId, req.body.password);
    sendSuccess(res, result);
  } catch (e) {
    next(e);
  }
});

export default router;
