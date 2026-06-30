export type AIContextLevel = 'empty' | 'partial' | 'ready';

export interface AIUsage {
  used: number;
  limit: number;
  remaining: number;
  plan: 'FREE' | 'PRO';
}

export function buildAIUsage(used: number, limit: number, plan: 'FREE' | 'PRO'): AIUsage {
  return {
    used,
    limit,
    remaining: Math.max(0, limit - used),
    plan,
  };
}

export const EMPTY_DAILY_PLAN = `Tu espacio ASCENDX aún está vacío — empecemos con bases sólidas:

1. Define UN objetivo claro (estudio, salud, finanzas o trabajo).
2. Añade 2 tareas pequeñas que puedas hacer hoy (máx. 30 min cada una).
3. Elige un hábito diario simple (agua, caminar, leer).
4. Cuando vuelvas aquí, generaré planes personalizados con tus datos reales.

Tip: usa el checklist «Configura ASCENDX» en el inicio o el asistente de bienvenida al registrarte.`;

export const PARTIAL_DAILY_PLAN_HINT =
  'Tienes datos parciales; completa objetivos, tareas y al menos un hábito para planes más precisos.';

export const AI_SUGGESTED_PROMPTS: Record<AIContextLevel, string[]> = {
  empty: [
    '¿Cómo empiezo a organizar mi semana en ASCENDX?',
    'Sugiere un objetivo y dos tareas para estudiar mejor',
    '¿Qué hábito diario es fácil de mantener?',
    'Ayúdame a crear mi primer plan en la app',
  ],
  partial: [
    'Prioriza mis tareas pendientes de hoy',
    '¿Qué hábito debería reforzar esta semana?',
    'Revisa mi progreso y dime el siguiente paso',
    'Dame un plan Pomodoro de 25 minutos para avanzar',
  ],
  ready: [
    'Planifica mi día con mis tareas actuales',
    'Detecta en qué estoy procrastinando',
    'Dame un plan Pomodoro de 25 min para mi tarea más urgente',
    '¿Qué debería priorizar para subir de nivel esta semana?',
  ],
};

/** Prompts que empujan valor Pro sin ser agresivos */
export const AI_UPSELL_PROMPTS = [
  'Resume mi semana y dime en qué mejorar (Pro)',
  'Analiza mis finanzas y hábitos juntos',
  'Crea un plan de 7 días basado en mis datos',
] as const;

export function getSuggestedPrompts(level: AIContextLevel): string[] {
  return AI_SUGGESTED_PROMPTS[level];
}
