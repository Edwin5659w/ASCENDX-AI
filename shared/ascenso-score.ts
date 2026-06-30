/** Ascenso Score™ — salud diaria del Life OS (0–100) */

export interface AscensoScoreInput {
  tasksCompletedToday: number;
  tasksDueToday: number;
  habitsTotal: number;
  habitsCompletedToday: number;
  longestStreak: number;
  financeRecordsThisWeek: number;
  hasDailyFocus: boolean;
  setupScore: number;
}

export interface AscensoScoreResult {
  score: number;
  label: string;
  tips: string[];
}

export function computeAscensoScore(input: AscensoScoreInput): AscensoScoreResult {
  let score = 0;

  // Tareas de hoy (30 pts)
  if (input.tasksDueToday > 0) {
    score += Math.round(30 * Math.min(1, input.tasksCompletedToday / input.tasksDueToday));
  } else if (input.tasksCompletedToday > 0) {
    score += 20;
  }

  // Hábitos (25 pts)
  if (input.habitsTotal > 0) {
    score += Math.round(25 * Math.min(1, input.habitsCompletedToday / input.habitsTotal));
  }

  // Rachas (15 pts)
  if (input.longestStreak >= 30) score += 15;
  else if (input.longestStreak >= 7) score += 12;
  else if (input.longestStreak >= 3) score += 8;
  else if (input.longestStreak >= 1) score += 4;

  // Finanzas semanales (10 pts)
  if (input.financeRecordsThisWeek >= 3) score += 10;
  else if (input.financeRecordsThisWeek >= 1) score += 5;

  // Foco del día (10 pts)
  if (input.hasDailyFocus) score += 10;

  // Setup base (10 pts max from setup score)
  score += Math.round((input.setupScore / 100) * 10);

  const final = Math.min(100, Math.max(0, score));

  let label = 'Arrancando';
  if (final >= 90) label = 'Leyenda';
  else if (final >= 75) label = 'En ascenso';
  else if (final >= 50) label = 'En marcha';
  else if (final >= 25) label = 'Construyendo';

  const tips: string[] = [];
  if (!input.hasDailyFocus) tips.push('Define tu foco del día en el dashboard');
  if (input.habitsTotal > 0 && input.habitsCompletedToday < input.habitsTotal) {
    tips.push('Completa tus hábitos pendientes (+15 XP c/u)');
  }
  if (input.tasksDueToday > input.tasksCompletedToday) {
    tips.push('Tienes tareas de hoy sin completar');
  }
  if (input.financeRecordsThisWeek === 0) tips.push('Registra un movimiento en Finanzas esta semana');

  return { score: final, label, tips: tips.slice(0, 3) };
}
