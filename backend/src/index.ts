import { createApp } from './createApp';
import { env } from './config/env';
import { cleanupExpiredRefreshTokens } from './services/auth.service';
import { startRetentionScheduler } from './services/retention.service';

const app = createApp();

void cleanupExpiredRefreshTokens().catch((err) => {
  console.warn('[ascendx] Limpieza de refresh tokens:', err);
});

startRetentionScheduler();

app.listen(env.PORT, '0.0.0.0', () => {
  console.log(`🚀 ASCENDX AI API en http://localhost:${env.PORT}`);
  console.log(`   Red local: usa tu IPv4 (ipconfig) con puerto ${env.PORT}`);
  if (billingConfigured()) {
    console.log('   💳 Stripe billing activo');
  }
  if (env.RETENTION_CRON_ENABLED) {
    console.log('   📧 Cron de retención activo (09:00 UTC)');
  }
});

function billingConfigured() {
  return Boolean(env.STRIPE_SECRET_KEY && env.STRIPE_PRO_PRICE_ID);
}
