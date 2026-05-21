export interface DashboardStatsInput {
  totalGoals: number;
  totalTasks: number;
  completedTasks: number;
  activeHabits: number;
  habitsCompletedToday: number;
  financeRecordsCount: number;
}

export function getTimeGreeting(name?: string): string {
  const first = name?.split(' ')[0]?.trim() || 'viajero';
  const hour = new Date().getHours();
  if (hour < 12) return `Buenos días, ${first}`;
  if (hour < 19) return `Buenas tardes, ${first}`;
  return `Buenas noches, ${first}`;
}

/** Puntuación 0–100 de qué tan configurado está el Life OS */
export function computeSetupScore(stats: DashboardStatsInput): number {
  let score = 0;
  if (stats.totalGoals >= 1) score += 20;
  if (stats.totalTasks >= 1) score += 15;
  if (stats.completedTasks >= 1) score += 15;
  if (stats.activeHabits >= 1) score += 20;
  if (stats.habitsCompletedToday >= 1) score += 15;
  if (stats.financeRecordsCount >= 1) score += 15;
  return Math.min(100, score);
}

export const QUICK_ACTIONS = [
  {
    id: 'tasks',
    label: 'Tareas',
    hint: 'Marca una hoy',
    webPath: '/tasks',
    mobilePath: '/(tabs)/tasks',
  },
  {
    id: 'habits',
    label: 'Hábitos',
    hint: 'Mantén la racha',
    webPath: '/habits',
    mobilePath: '/(tabs)/habits',
  },
  {
    id: 'goals',
    label: 'Objetivos',
    hint: 'Revisa progreso',
    webPath: '/goals',
    mobilePath: '/(tabs)/goals',
  },
  {
    id: 'finance',
    label: 'Finanzas',
    hint: 'Balance y gastos',
    webPath: '/finance',
    mobilePath: '/(tabs)/finance',
  },
  {
    id: 'chat',
    label: 'Mentor IA',
    hint: 'Plan del día',
    webPath: '/chat',
    mobilePath: '/(tabs)/chat',
  },
] as const;
