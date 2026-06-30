import type { OnboardingFocus } from './validators/onboarding.validator';

export interface OnboardingFocusMeta {
  label: string;
  description: string;
  icon: string;
  color: string;
  methodology: string;
  goalHint: string;
  habitHint: string;
}

export const ONBOARDING_FOCUS_META: Record<OnboardingFocus, OnboardingFocusMeta> = {
  ESTUDIO: {
    label: 'Estudio',
    description: 'Organiza materias, tareas y constancia diaria.',
    icon: 'graduation-cap',
    color: '#8b5cf6',
    methodology: 'SMART + Pomodoro',
    goalHint: 'Objetivo específico y medible (ej. aprobar cálculo)',
    habitHint: 'Bloque de estudio sin distracciones',
  },
  SALUD: {
    label: 'Salud',
    description: 'Hábitos de movimiento, alimentación y descanso.',
    icon: 'heartbeat',
    color: '#34d399',
    methodology: 'Habit stacking',
    goalHint: 'Meta alcanzable en 4–8 semanas',
    habitHint: 'Ancla el hábito a algo que ya haces',
  },
  FINANZAS: {
    label: 'Finanzas',
    description: 'Control de gastos, ingresos y balance real.',
    icon: 'money',
    color: '#22d3ee',
    methodology: 'Regla 50/30/20',
    goalHint: 'Ordenar flujo de caja, no trading bursátil',
    habitHint: 'Registrar cada gasto el mismo día',
  },
  TRABAJO: {
    label: 'Trabajo',
    description: 'Prioriza proyectos y cierra tareas clave.',
    icon: 'briefcase',
    color: '#fbbf24',
    methodology: 'GTD / Eisenhower',
    goalHint: 'Un resultado visible esta semana',
    habitHint: '5 min de planificación cada mañana',
  },
  PERSONAL: {
    label: 'Crecimiento personal',
    description: 'Lectura, reflexión y bienestar mental.',
    icon: 'sun-o',
    color: '#f472b6',
    methodology: 'Constancia + tracking',
    goalHint: 'Pequeño pero diario',
    habitHint: 'Empieza con 5–10 minutos',
  },
  EMPRENDEDOR: {
    label: 'Emprendedor',
    description: 'Lanza y haz crecer tu proyecto o negocio.',
    icon: 'rocket',
    color: '#a78bfa',
    methodology: 'OKR + deep work',
    goalHint: 'Resultado medible este trimestre',
    habitHint: 'Bloque de trabajo profundo diario',
  },
  FITNESS: {
    label: 'Fitness',
    description: 'Energía física y constancia en el movimiento.',
    icon: 'heartbeat',
    color: '#fb923c',
    methodology: 'Habit stacking + tracking',
    goalHint: 'Meta de 90 días alcanzable',
    habitHint: '30 min de movimiento al día',
  },
};

export const ONBOARDING_STEPS = ['welcome', 'focus', 'setup'] as const;
export type OnboardingStepId = (typeof ONBOARDING_STEPS)[number];

export function onboardingStepIndex(step: OnboardingStepId): number {
  return ONBOARDING_STEPS.indexOf(step) + 1;
}

export const FINANCE_ONBOARDING_CATEGORIES = ['Comida', 'Transporte', 'Ocio', 'Servicios', 'Otros'] as const;
