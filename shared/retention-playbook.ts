/**
 * Playbook de retención ASCENDX — metodologías aplicadas por feature.
 * Fuente única para landing, emails y copy de producto.
 */

export interface RetentionPillar {
  id: string;
  methodology: string;
  psychology: string;
  feature: string;
  outcome: string;
  icon: 'target' | 'check' | 'flame' | 'brain' | 'trophy' | 'shield';
}

/** Pilares que explican POR QUÉ el usuario se queda (sin testimonios inventados). */
export const RETENTION_PILLARS: RetentionPillar[] = [
  {
    id: 'smart',
    methodology: 'SMART Goals',
    psychology: 'Claridad + progreso visible',
    feature: 'Objetivos con barra de avance automática',
    outcome: 'Sabes exactamente hacia dónde vas y cuánto falta.',
    icon: 'target',
  },
  {
    id: 'gtd',
    methodology: 'GTD (Getting Things Done)',
    psychology: 'Reducción de carga cognitiva',
    feature: 'Tareas concretas vinculadas a metas',
    outcome: 'Tu mente deja de “recordar” y empieza a ejecutar.',
    icon: 'check',
  },
  {
    id: 'atomic',
    methodology: 'Atomic Habits + rachas',
    psychology: 'Identidad + pérdida aversiva',
    feature: 'Hábitos diarios, rachas y escudos',
    outcome: 'Un día sin marcar duele — y eso te mantiene constante.',
    icon: 'flame',
  },
  {
    id: 'variable',
    methodology: 'Recompensa variable (XP)',
    psychology: 'Dopamina por micro-victorias',
    feature: 'XP instantáneo al completar acciones',
    outcome: 'Cada tarea se siente como un mini-logro.',
    icon: 'trophy',
  },
  {
    id: 'contextual-ai',
    methodology: 'Coaching contextual',
    psychology: 'Relevancia personal (no chat genérico)',
    feature: 'IA que lee tus objetivos, tareas y rachas reales',
    outcome: 'El plan del día es tuyo, no un discurso motivacional vacío.',
    icon: 'brain',
  },
  {
    id: 'endowed',
    methodology: 'Endowed progress effect',
    psychology: '“Ya empecé, no quiero perderlo”',
    feature: 'Onboarding en 30s + +50 XP + primera tarea guiada',
    outcome: 'Entras con momentum; abandonar duele más que quedarse.',
    icon: 'shield',
  },
];

/** Secuencia de emails de retención (lifecycle). */
export const EMAIL_LIFECYCLE = {
  welcome: { day: 0, trigger: 'register' as const },
  day1_nudge: { day: 1, trigger: 'no_task_completed' as const },
  day3_upgrade: { day: 3, trigger: 'free_engaged' as const },
  streak_at_risk: { day: 0, trigger: 'habit_streak_3plus_missed_yesterday' as const },
  dormant_7d: { day: 7, trigger: 'inactive_7_days' as const },
  pro_welcome: { day: 0, trigger: 'stripe_checkout' as const },
  pro_winback: { day: 0, trigger: 'stripe_cancel' as const },
} as const;

export type EmailTemplate = keyof typeof EMAIL_LIFECYCLE;

/** Copy Pro — enfoque en valor, no presión. */
export const PRO_VALUE_PROPS = [
  '100 mensajes IA/día vs 5 en Gratis',
  'Resumen semanal con insights de tu semana real',
  '3 escudos de racha/mes (vs 1)',
  'Diario de trading + exportación de datos',
] as const;
