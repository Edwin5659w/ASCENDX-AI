import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { sendSuccess } from '../utils/response';
import { billingService, syncSubscriptionFromSession } from '../services/billing.service';
import { revenueCatService } from '../services/revenuecat.service';
import { AppError } from '../middleware/errorHandler';

const router = Router();

router.get('/status', requireAuth, async (req, res, next) => {
  try {
    sendSuccess(res, await billingService.getStatus(req.user!.userId));
  } catch (e) {
    next(e);
  }
});

router.post('/checkout', requireAuth, async (req, res, next) => {
  try {
    const interval = req.body?.interval === 'year' ? 'year' : 'month';
    const session = await billingService.createCheckoutSession(req.user!.userId, req.user!.email, interval);
    sendSuccess(res, session);
  } catch (e) {
    next(e);
  }
});

router.post('/portal', requireAuth, async (req, res, next) => {
  try {
    const session = await billingService.createPortalSession(req.user!.userId);
    sendSuccess(res, session);
  } catch (e) {
    next(e);
  }
});

router.post('/sync-session', requireAuth, async (req, res, next) => {
  try {
    const sessionId = typeof req.body?.sessionId === 'string' ? req.body.sessionId : '';
    if (!sessionId) throw new AppError(400, 'sessionId requerido');
    const user = await syncSubscriptionFromSession(req.user!.userId, sessionId);
    sendSuccess(res, { user });
  } catch (e) {
    next(e);
  }
});

router.post('/revenuecat/sync', requireAuth, async (req, res, next) => {
  try {
    const user = await revenueCatService.syncUserEntitlements(req.user!.userId);
    sendSuccess(res, { user });
  } catch (e) {
    next(e);
  }
});

export default router;

export async function handleStripeWebhook(rawBody: Buffer, signature: string | undefined) {
  return billingService.handleWebhook(rawBody, signature);
}

export async function handleRevenueCatWebhook(body: unknown, authHeader: string | undefined) {
  return revenueCatService.handleWebhook(body, authHeader);
}
