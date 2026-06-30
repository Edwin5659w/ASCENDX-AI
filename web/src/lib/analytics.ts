/** Analítica opcional — activa con VITE_POSTHOG_KEY o VITE_GA_MEASUREMENT_ID */

type Props = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    posthog?: { capture: (event: string, props?: Props) => void };
  }
}

export function track(event: string, props?: Props) {
  if (import.meta.env.DEV) {
    console.debug('[analytics]', event, props);
  }
  try {
    window.posthog?.capture(event, props);
  } catch {
    /* noop */
  }
  try {
    if (window.gtag && import.meta.env.VITE_GA_MEASUREMENT_ID) {
      window.gtag('event', event, props);
    }
  } catch {
    /* noop */
  }
}

export const AnalyticsEvents = {
  REGISTER: 'register_complete',
  TOUR_COMPLETE: 'product_tour_complete',
  TOUR_SKIP: 'product_tour_skip',
  CHECKOUT_START: 'checkout_start',
  TASK_COMPLETE: 'task_complete',
  HABIT_COMPLETE: 'habit_complete',
} as const;
