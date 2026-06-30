export interface WeeklyRecapInput {
  tasksCompleted: number;
  tasksCreated: number;
  habitsCompleted: number;
  activeHabits: number;
  xpGained: number;
  longestStreak: number;
  goalsProgress: number;
  financeBalance: number;
}

export interface WeeklyRecapResult {
  headline: string;
  highlights: string[];
  score: number;
  encouragement: string;
}

export function buildWeeklyRecap(data: WeeklyRecapInput): WeeklyRecapResult {
  const habitRate =
    data.activeHabits > 0
      ? Math.round((data.habitsCompleted / (data.activeHabits * 7)) * 100)
      : 0;

  const highlights: string[] = [];

  if (data.tasksCompleted > 0) {
    highlights.push(`${data.tasksCompleted} tarea${data.tasksCompleted === 1 ? '' : 's'} completada${data.tasksCompleted === 1 ? '' : 's'}`);
  }
  if (data.habitsCompleted > 0) {
    highlights.push(`${data.habitsCompleted} hábito${data.habitsCompleted === 1 ? '' : 's'} registrado${data.habitsCompleted === 1 ? '' : 's'}`);
  }
  if (data.xpGained > 0) {
    highlights.push(`+${data.xpGained} XP ganados`);
  }
  if (data.longestStreak >= 7) {
    highlights.push(`Racha máxima: ${data.longestStreak} días 🔥`);
  }
  if (data.goalsProgress > 0) {
    highlights.push(`+${data.goalsProgress}% de progreso en objetivos`);
  }

  if (highlights.length === 0) {
    highlights.push('Semana tranquila — ideal para reiniciar con un solo paso pequeño');
  }

  let score = 0;
  score += Math.min(data.tasksCompleted * 8, 40);
  score += Math.min(habitRate, 30);
  score += Math.min(data.xpGained / 10, 20);
  score += data.longestStreak >= 3 ? 10 : 0;
  score = Math.min(100, Math.round(score));

  let headline: string;
  let encouragement: string;

  if (score >= 75) {
    headline = '¡Semana excepcional!';
    encouragement = 'Mantén el ritmo. Tu constancia se nota en los datos.';
  } else if (score >= 45) {
    headline = 'Buen progreso esta semana';
    encouragement = 'Pequeños avances suman. Elige una meta para la próxima semana.';
  } else if (score >= 20) {
    headline = 'Semana de transición';
    encouragement = 'No pasa nada. Empieza hoy con una tarea de 15 minutos.';
  } else {
    headline = 'Nueva oportunidad';
    encouragement = 'Cada lunes es un reset. Configura un hábito mínimo y gana +15 XP hoy.';
  }

  return { headline, highlights, score, encouragement };
}
