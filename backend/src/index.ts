import { createApp } from './createApp';
import { env } from './config/env';
import { cleanupExpiredRefreshTokens } from './services/auth.service';

const app = createApp();

void cleanupExpiredRefreshTokens().catch((err) => {
  console.warn('[ascendx] Limpieza de refresh tokens:', err);
});

app.listen(env.PORT, '0.0.0.0', () => {
  console.log(`🚀 ASCENDX AI API en http://localhost:${env.PORT}`);
  console.log(`   Red local: usa tu IPv4 (ipconfig) con puerto ${env.PORT}`);
});
