export type PlanTier = 'FREE' | 'PRO';

export interface PlanLimits {
  aiChatPerDay: number;
  aiDailyPlan: boolean;
  maxGoals: number;
  maxHabits: number;
  streakShieldsPerMonth: number;
  tradingJournal: boolean;
  weeklyRecap: boolean;
  exportData: boolean;
}

export const PLAN_LIMITS: Record<PlanTier, PlanLimits> = {
  FREE: {
    aiChatPerDay: 5,
    aiDailyPlan: true,
    maxGoals: 5,
    maxHabits: 5,
    streakShieldsPerMonth: 1,
    tradingJournal: false,
    weeklyRecap: false,
    exportData: false,
  },
  PRO: {
    aiChatPerDay: 100,
    aiDailyPlan: true,
    maxGoals: 50,
    maxHabits: 30,
    streakShieldsPerMonth: 3,
    tradingJournal: true,
    weeklyRecap: true,
    exportData: true,
  },
};

export const PLAN_PRICING = {
  FREE: { price: 0, currency: 'USD', label: 'Gratis' },
  PRO: { price: 4.99, currency: 'USD', label: 'Pro', period: 'mes' },
  PRO_ANNUAL: { price: 39.99, currency: 'USD', label: 'Pro Anual', period: 'año', savings: '2 meses gratis' },
} as const;

export const REFERRAL_BONUS_XP = 50;
/** Días de Pro gratis al registrarse con código de referido */
export const REFERRAL_PRO_TRIAL_DAYS = 7;
/** Trial Pro sin tarjeta para nuevos usuarios (opcional backend) */
export const NEW_USER_PRO_TRIAL_DAYS = 0;

export function getPlanLimits(plan: PlanTier): PlanLimits {
  return PLAN_LIMITS[plan] ?? PLAN_LIMITS.FREE;
}
