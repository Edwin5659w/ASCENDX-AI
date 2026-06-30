import { PLAN_LIMITS, PLAN_PRICING, type PlanTier } from './plans';

export interface PlanFeatureRow {
  label: string;
  free: string;
  pro: string;
  highlight?: boolean;
}

export const PLAN_COMPARISON_ROWS: PlanFeatureRow[] = [
  {
    label: 'Mensajes IA al día',
    free: `${PLAN_LIMITS.FREE.aiChatPerDay}`,
    pro: `${PLAN_LIMITS.PRO.aiChatPerDay}`,
    highlight: true,
  },
  {
    label: 'Plan diario personalizado',
    free: '✓',
    pro: '✓',
  },
  {
    label: 'Objetivos',
    free: `${PLAN_LIMITS.FREE.maxGoals}`,
    pro: `${PLAN_LIMITS.PRO.maxGoals}`,
  },
  {
    label: 'Hábitos',
    free: `${PLAN_LIMITS.FREE.maxHabits}`,
    pro: `${PLAN_LIMITS.PRO.maxHabits}`,
  },
  {
    label: 'Resumen semanal IA',
    free: '—',
    pro: '✓',
    highlight: true,
  },
  {
    label: 'Escudos de racha / mes',
    free: `${PLAN_LIMITS.FREE.streakShieldsPerMonth}`,
    pro: `${PLAN_LIMITS.PRO.streakShieldsPerMonth}`,
  },
  {
    label: 'Exportar tus datos',
    free: '—',
    pro: '✓',
  },
  {
    label: 'Diario de trading',
    free: '—',
    pro: '✓',
  },
];

export const FREE_VALUE_PITCH = [
  'Objetivos, tareas, hábitos y finanzas — gratis para siempre',
  `${PLAN_LIMITS.FREE.aiChatPerDay} mensajes IA/día con contexto de tus datos reales`,
  'XP, niveles, logros y escudo de racha incluidos',
  'Web + app móvil sincronizados',
] as const;

export const PRO_VALUE_PITCH = [
  `${PLAN_LIMITS.PRO.aiChatPerDay} mensajes IA/día — tu mentor siempre disponible`,
  'Resumen semanal inteligente de tu progreso real',
  'Más objetivos y hábitos para quien va en serio',
  `${PLAN_LIMITS.PRO.streakShieldsPerMonth} escudos/mes + exportación + trading journal`,
] as const;

export function planPriceLabel(tier: PlanTier): string {
  if (tier === 'FREE') return 'Gratis';
  return `$${PLAN_PRICING.PRO.price}/${PLAN_PRICING.PRO.period}`;
}
