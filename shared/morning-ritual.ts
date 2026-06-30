/** Ritual matutino — 2 min para arrancar con intención */

export type MorningRitualStepId = 'focus' | 'task' | 'habit' | 'mentor';

export interface MorningRitualStep {
  id: MorningRitualStepId;
  title: string;
  body: string;
  cta: string;
  webPath: string;
  mobilePath: string;
}

export const MORNING_RITUAL_STEPS: MorningRitualStep[] = [
  {
    id: 'focus',
    title: 'Tu foco de hoy',
    body: 'Una frase clara de qué importa hoy. Sin foco, todo parece urgente.',
    cta: 'Definir foco',
    webPath: '/dashboard',
    mobilePath: '/(tabs)',
  },
  {
    id: 'task',
    title: 'Una tarea que mueve la aguja',
    body: 'Elige la tarea más importante y complétala primero (+10 XP).',
    cta: 'Ir a tareas',
    webPath: '/tasks',
    mobilePath: '/(tabs)/tasks',
  },
  {
    id: 'habit',
    title: 'Marca tu hábito',
    body: 'Un tap al día construye identidad. Protege tu racha.',
    cta: 'Ir a hábitos',
    webPath: '/habits',
    mobilePath: '/(tabs)/habits',
  },
  {
    id: 'mentor',
    title: 'Plan con el mentor',
    body: 'Pide un plan de 25 minutos. La IA usa tus datos reales.',
    cta: 'Abrir mentor',
    webPath: '/chat',
    mobilePath: '/(tabs)/chat',
  },
];
