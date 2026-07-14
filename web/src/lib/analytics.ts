/** Analítica opcional — activa con VITE_POSTHOG_KEY o VITE_GA_MEASUREMENT_ID */

type Props = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    posthog?: { capture: (event: string, props?: Props) => void; init: (key: string, opts?: object) => void };
  }
}

const CONSENT_KEY = 'ascendx_cookie_consent';

export function hasAnalyticsConsent(): boolean {
  try {
    return localStorage.getItem(CONSENT_KEY) === '1';
  } catch {
    return false;
  }
}

export function loadAnalyticsScripts() {
  if (!hasAnalyticsConsent()) return;

  const phKey = import.meta.env.VITE_POSTHOG_KEY;
  if (phKey && !window.posthog?.capture) {
    const s = document.createElement('script');
    s.src = 'https://us.i.posthog.com/static/array.js';
    s.async = true;
    s.onload = () => {
      window.posthog?.init(phKey, { api_host: 'https://us.i.posthog.com', person_profiles: 'identified_only' });
    };
    document.head.appendChild(s);
  }

  const gaId = import.meta.env.VITE_GA_MEASUREMENT_ID;
  if (gaId && !window.gtag) {
    const s = document.createElement('script');
    s.async = true;
    s.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    function gtag(...args: unknown[]) {
      window.dataLayer?.push(args);
    }
    window.gtag = gtag;
    gtag('js', new Date());
    gtag('config', gaId);
  }
}

export function track(event: string, props?: Props) {
  if (import.meta.env.DEV) {
    console.debug('[analytics]', event, props);
  }
  if (!hasAnalyticsConsent()) return;
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
  PRICING_VIEW: 'pricing_view',
  AI_LIMIT_HIT: 'ai_limit_hit',
  UPGRADE_CTA: 'upgrade_cta_click',
  TASK_COMPLETE: 'task_complete',
  HABIT_COMPLETE: 'habit_complete',
  GOOGLE_AUTH: 'google_auth_complete',
  MORNING_RITUAL: 'morning_ritual_complete',
  FIRST_WIN: 'first_task_complete',
} as const;

declare global {
  interface Window {
    dataLayer?: unknown[];
  }
}
