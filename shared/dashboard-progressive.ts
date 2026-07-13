/** Progressive disclosure del dashboard: día 1 enfocado en primera victoria. */

export interface ProgressiveStats {
  completedTasks: number;
  habitsCompletedToday?: number;
  firstStepsComplete?: boolean;
}

/**
 * Activación temprana: aún sin completar la primera tarea.
 * Oculta Pomodoro, score avanzado, teaser Pro agresivo y recap.
 */
export function isEarlyDashboard(stats: ProgressiveStats | null | undefined): boolean {
  if (!stats) return true;
  return (stats.completedTasks ?? 0) < 1;
}
