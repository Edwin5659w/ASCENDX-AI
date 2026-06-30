export function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn || import.meta.env.DEV) return;
  console.info('[sentry] DSN configurado — instala @sentry/react para captura automática');
}
