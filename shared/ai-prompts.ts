export type AIContextLevel = 'empty' | 'partial' | 'ready';

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
    '¿Cómo equilibro estudio y finanzas esta semana?',
    'Motívame para completar lo más importante hoy',
  ],
};

export function getSuggestedPrompts(level: AIContextLevel): string[] {
  return AI_SUGGESTED_PROMPTS[level];
}
