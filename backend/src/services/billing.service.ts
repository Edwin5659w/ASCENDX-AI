import Stripe from 'stripe';
import { env } from '../config/env';
import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';
import { USER_PROFILE_SELECT } from '../constants/user-select';
import { emailService } from './email.service';

let stripe: Stripe | null = null;

function getStripe(): Stripe {
  if (!env.STRIPE_SECRET_KEY) {
    throw new AppError(503, 'Pagos no configurados. Contacta soporte.');
  }
  if (!stripe) stripe = new Stripe(env.STRIPE_SECRET_KEY);
  return stripe;
}

function subscriptionPeriodEnd(sub: unknown): Date | null {
  const end = (sub as { current_period_end?: number | null }).current_period_end;
  return end ? new Date(end * 1000) : null;
}

function invoiceSubscriptionId(invoice: Stripe.Invoice): string | null {
  const sub = (invoice as Stripe.Invoice & { subscription?: string | Stripe.Subscription | null }).subscription;
  if (!sub) return null;
  return typeof sub === 'string' ? sub : sub.id;
}

function appOrigin(): string {
  return env.WEB_APP_ORIGIN.replace(/\/$/, '');
}

export const billingService = {
  isConfigured(): boolean {
    return Boolean(env.STRIPE_SECRET_KEY && env.STRIPE_PRO_PRICE_ID);
  },

  async getStatus(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        plan: true,
        subscriptionStatus: true,
        subscriptionPeriodEnd: true,
        stripeCustomerId: true,
      },
    });
    if (!user) throw new AppError(404, 'Usuario no encontrado');
    return {
      plan: user.plan,
      subscriptionStatus: user.subscriptionStatus,
      subscriptionPeriodEnd: user.subscriptionPeriodEnd,
      billingConfigured: this.isConfigured(),
      hasStripeCustomer: Boolean(user.stripeCustomerId),
    };
  },

  async createCheckoutSession(userId: string, email: string) {
    if (!this.isConfigured()) {
      throw new AppError(503, 'Stripe no está configurado en el servidor');
    }
    const client = getStripe();
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { stripeCustomerId: true, plan: true },
    });
    if (!user) throw new AppError(404, 'Usuario no encontrado');
    if (user.plan === 'PRO' && user.stripeCustomerId) {
      throw new AppError(400, 'Ya tienes Pro activo. Gestiona tu suscripción desde Perfil.');
    }

    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await client.customers.create({
        email,
        metadata: { userId },
      });
      customerId = customer.id;
      await prisma.user.update({
        where: { id: userId },
        data: { stripeCustomerId: customerId },
      });
    }

    const session = await client.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: env.STRIPE_PRO_PRICE_ID!, quantity: 1 }],
      success_url: `${appOrigin()}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appOrigin()}/pricing?canceled=1`,
      metadata: { userId },
      subscription_data: { metadata: { userId } },
      allow_promotion_codes: true,
    });

    if (!session.url) throw new AppError(500, 'No se pudo crear la sesión de pago');
    return { url: session.url };
  },

  async createPortalSession(userId: string) {
    if (!this.isConfigured()) {
      throw new AppError(503, 'Stripe no está configurado');
    }
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { stripeCustomerId: true },
    });
    if (!user?.stripeCustomerId) {
      throw new AppError(400, 'No tienes suscripción activa en Stripe');
    }
    const session = await getStripe().billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${appOrigin()}/profile`,
    });
    return { url: session.url };
  },

  async activatePro(userId: string, subscriptionId: string, periodEnd: Date | null) {
    const before = await prisma.user.findUnique({
      where: { id: userId },
      select: { plan: true, name: true, email: true, emailOptIn: true },
    });
    const wasPro = before?.plan === 'PRO';

    await prisma.user.update({
      where: { id: userId },
      data: {
        plan: 'PRO',
        stripeSubscriptionId: subscriptionId,
        subscriptionStatus: 'ACTIVE',
        subscriptionPeriodEnd: periodEnd,
        ...(wasPro ? {} : { streakShields: { increment: 2 } }),
      },
    });

    if (!wasPro && before?.emailOptIn) {
      void emailService.sendProWelcome(before.email, before.name);
    }
  },

  async deactivatePro(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true, emailOptIn: true, plan: true },
    });
    await prisma.user.update({
      where: { id: userId },
      data: {
        plan: 'FREE',
        subscriptionStatus: 'CANCELED',
        stripeSubscriptionId: null,
        subscriptionPeriodEnd: null,
      },
    });
    if (user?.emailOptIn && user.plan === 'PRO') {
      void emailService.sendProWinback(user.email, user.name);
    }
  },

  async handleWebhook(rawBody: Buffer, signature: string | undefined) {
    if (!env.STRIPE_WEBHOOK_SECRET) {
      throw new AppError(503, 'Webhook no configurado');
    }
    const client = getStripe();
    let event: Stripe.Event;
    try {
      event = client.webhooks.constructEvent(rawBody, signature ?? '', env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
      console.error('[stripe] Webhook signature error:', err);
      throw new AppError(400, 'Firma de webhook inválida');
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const subId = typeof session.subscription === 'string' ? session.subscription : session.subscription?.id;
        if (userId && subId) {
          const sub = await client.subscriptions.retrieve(subId);
          const periodEnd = subscriptionPeriodEnd(sub);
          await this.activatePro(userId, subId, periodEnd);
        }
        break;
      }
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription;
        const userId = sub.metadata?.userId;
        if (!userId) break;
        if (sub.status === 'active' || sub.status === 'trialing') {
          const periodEnd = subscriptionPeriodEnd(sub);
          await prisma.user.update({
            where: { id: userId },
            data: {
              plan: 'PRO',
              subscriptionStatus: 'ACTIVE',
              stripeSubscriptionId: sub.id,
              subscriptionPeriodEnd: periodEnd,
            },
          });
        } else if (sub.status === 'past_due') {
          await prisma.user.update({
            where: { id: userId },
            data: { subscriptionStatus: 'PAST_DUE' },
          });
        }
        break;
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        const userId = sub.metadata?.userId;
        if (userId) await this.deactivatePro(userId);
        break;
      }
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const subId = invoiceSubscriptionId(invoice);
        if (subId) {
          const user = await prisma.user.findFirst({ where: { stripeSubscriptionId: subId } });
          if (user) {
            await prisma.user.update({
              where: { id: user.id },
              data: { subscriptionStatus: 'PAST_DUE' },
            });
          }
        }
        break;
      }
      default:
        break;
    }

    return { received: true };
  },
};

export async function syncSubscriptionFromSession(userId: string, sessionId: string) {
  if (!billingService.isConfigured()) return null;
  const client = getStripe();
  const session = await client.checkout.sessions.retrieve(sessionId);
  if (session.metadata?.userId !== userId) {
    throw new AppError(403, 'Sesión no pertenece a este usuario');
  }
  const subId = typeof session.subscription === 'string' ? session.subscription : session.subscription?.id;
  if (subId && session.payment_status === 'paid') {
    const sub = await client.subscriptions.retrieve(subId);
    const periodEnd = subscriptionPeriodEnd(sub);
    await billingService.activatePro(userId, subId, periodEnd);
  }
  return prisma.user.findUnique({ where: { id: userId }, select: USER_PROFILE_SELECT });
}
