export interface FirstStep {
  id: string;
  label: string;
  hint: string;
  done: boolean;
  webPath: string;
  mobilePath: string;
}

export interface FirstStepsStats {
  totalGoals: number;
  totalTasks: number;
  completedTasks: number;
  activeHabits: number;
  habitsCompletedToday: number;
  financeRecordsCount: number;
}

export function buildFirstSteps(stats: FirstStepsStats): FirstStep[] {
  return [
    {
      id: 'goal',
      label: 'Crea tu primer objetivo',
      hint: 'Define hacia dónde vas',
      done: stats.totalGoals >= 1,
      webPath: '/goals',
      mobilePath: '/(tabs)/goals',
    },
    {
      id: 'task',
      label: 'Añade una tarea',
      hint: 'Desglosa tu meta en acciones',
      done: stats.totalTasks >= 1,
      webPath: '/tasks',
      mobilePath: '/(tabs)/tasks',
    },
    {
      id: 'complete-task',
      label: 'Completa una tarea',
      hint: '+10 XP al marcarla hecha',
      done: stats.completedTasks >= 1,
      webPath: '/tasks',
      mobilePath: '/(tabs)/tasks',
    },
    {
      id: 'habit',
      label: 'Registra un hábito diario',
      hint: 'Construye constancia',
      done: stats.activeHabits >= 1,
      webPath: '/habits',
      mobilePath: '/(tabs)/habits',
    },
    {
      id: 'habit-today',
      label: 'Marca un hábito hoy',
      hint: '+15 XP y suma a tu racha',
      done: stats.habitsCompletedToday >= 1,
      webPath: '/habits',
      mobilePath: '/(tabs)/habits',
    },
    {
      id: 'finance',
      label: 'Registra un movimiento financiero',
      hint: 'Controla ingresos y gastos',
      done: stats.financeRecordsCount >= 1,
      webPath: '/finance',
      mobilePath: '/(tabs)/finance',
    },
  ];
}

export function firstStepsProgress(steps: FirstStep[]) {
  const done = steps.filter((s) => s.done).length;
  return { done, total: steps.length, percent: steps.length ? Math.round((done / steps.length) * 100) : 0 };
}

export function isFirstStepsComplete(steps: FirstStep[]) {
  return steps.length > 0 && steps.every((s) => s.done);
}

export function nextLockedBadgeHint(
  badges: { unlocked: boolean; title: string; subtitle: string }[] | undefined,
): string | null {
  if (!badges?.length) return 'Completa tu primera tarea para desbloquear «En marcha»';
  const next = badges.find((b) => !b.unlocked);
  return next ? `${next.title}: ${next.subtitle}` : null;
}
