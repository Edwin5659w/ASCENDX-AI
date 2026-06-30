import { billingService } from './billing.service';
import { AppError } from '../middleware/errorHandler';
import { env } from '../config/env';
import { prisma } from '../lib/prisma';
import { USER_PROFILE_SELECT } from '../constants/user-select';

const PRO_ENTITLEMENT = 'pro';

interface RCSubscriberResponse {
  subscriber?: {
    entitlements?: Record<
      string,
      { expires_date: string | null; product_identifier?: string }
    >;
  };
}

export const revenueCatService = {
  isConfigured(): boolean {
    return Boolean(env.REVENUECAT_SECRET_API_KEY);
  },

  async fetchSubscriber(userId: string): Promise<RCSubscriberResponse | null> {
    if (!env.REVENUECAT_SECRET_API_KEY) return null;
    const res = await fetch(`https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(userId)}`, {
      headers: {
        Authorization: `Bearer ${env.REVENUECAT_SECRET_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });
    if (!res.ok) return null;
    return (await res.json()) as RCSubscriberResponse;
  },

  async syncUserEntitlements(userId: string) {
    if (!this.isConfigured()) {
      throw new AppError(503, 'RevenueCat no configurado en el servidor');
    }
    const data = await this.fetchSubscriber(userId);
    const ent = data?.subscriber?.entitlements?.[PRO_ENTITLEMENT];
    if (ent?.expires_date) {
      const expires = new Date(ent.expires_date);
      if (expires > new Date()) {
        await billingService.activatePro(userId, `rc_${userId}`, expires, 'REVENUECAT');
      } else {
        await billingService.deactivateProIfProvider(userId, 'REVENUECAT');
      }
    } else {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { subscriptionProvider: true },
      });
      if (user?.subscriptionProvider === 'REVENUECAT') {
        await billingService.deactivateProIfProvider(userId, 'REVENUECAT');
      }
    }
    return prisma.user.findUnique({ where: { id: userId }, select: USER_PROFILE_SELECT });
  },

  async handleWebhook(body: unknown, authHeader: string | undefined) {
    if (!env.REVENUECAT_WEBHOOK_SECRET) {
      throw new AppError(503, 'Webhook RevenueCat no configurado');
    }
    const expected = `Bearer ${env.REVENUECAT_WEBHOOK_SECRET}`;
    if (authHeader !== expected) {
      throw new AppError(401, 'No autorizado');
    }

    const payload = body as {
      event?: {
        type?: string;
        app_user_id?: string;
        expiration_at_ms?: number;
        id?: string;
      };
    };
    const event = payload.event;
    if (!event?.app_user_id || !event.type) {
      throw new AppError(400, 'Evento inválido');
    }

    const userId = event.app_user_id;
    const periodEnd = event.expiration_at_ms ? new Date(event.expiration_at_ms) : null;
    const subId = event.id ? `rc_${event.id}` : `rc_${userId}`;

    switch (event.type) {
      case 'INITIAL_PURCHASE':
      case 'RENEWAL':
      case 'UNCANCELLATION':
      case 'PRODUCT_CHANGE':
        await billingService.activatePro(userId, subId, periodEnd, 'REVENUECAT');
        break;
      case 'CANCELLATION':
      case 'EXPIRATION':
        await billingService.deactivateProIfProvider(userId, 'REVENUECAT');
        break;
      case 'BILLING_ISSUE':
        await prisma.user.update({
          where: { id: userId },
          data: { subscriptionStatus: 'PAST_DUE' },
        });
        break;
      default:
        break;
    }

    return { received: true };
  },
};
