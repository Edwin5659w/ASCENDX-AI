export type MethodologyModule = 'goals' | 'tasks' | 'habits' | 'finance' | 'ai';

export interface MethodologyInfo {
  name: string;
  tagline: string;
  howWeHelp: string;
  steps: string[];
}

export const METHODOLOGIES: Record<MethodologyModule, MethodologyInfo> = {
  goals: {
    name: 'SMART',
    tagline: 'Objetivos claros y alcanzables',
    howWeHelp:
      'Te ayudamos a definir metas con título concreto, prioridad y progreso automático según las tareas que completes.',
    steps: [
      'Específico: un título claro (qué quieres lograr)',
      'Medible: el % sube al completar tareas vinculadas',
      'Alcanzable: empieza con una meta principal',
      'Relevante: elige prioridad (baja, media, alta)',
      'Temporal: añade fecha límite cuando edites el objetivo',
    ],
  },
  tasks: {
    name: 'GTD + Eisenhower',
    tagline: 'De la meta a la acción de hoy',
    howWeHelp:
      'Desglosamos tus objetivos en tareas con fecha y vínculo a la meta. La IA detecta procrastinación si hay muchas tareas vencidas.',
    steps: [
      'Captura: anota cada tarea en la bandeja',
      'Vincula: así el objetivo avanza solo',
      'Prioriza: fecha límite = urgente para hoy',
      'Ejecuta: márcala hecha (+10 XP)',
      'Revisa: el mentor IA prioriza lo pendiente',
    ],
  },
  habits: {
    name: 'Habit stacking + Tracking',
    tagline: 'Constancia medida en rachas',
    howWeHelp:
      'Registras un hábito diario o semanal, lo completas una vez al día y ves tu racha. El seguimiento (tracking) hace visible tu progreso.',
    steps: [
      'Ancla: «Después de X, haré Y» (ej. después de café, 10 min estudio)',
      'Empieza pequeño: 5–10 minutos bastan al inicio',
      'Marca hoy: un tap al día (+15 XP)',
      'Mira la racha: la constancia importa más que la perfección',
      'Ajusta: renombra el hábito si necesitas afinarlo',
    ],
  },
  finance: {
    name: 'Regla 50/30/20',
    tagline: 'Control consciente del dinero',
    howWeHelp:
      'Registras ingresos y gastos por categoría. El resumen te muestra balance real para decidir, no para asesoría de inversión.',
    steps: [
      '50% necesidades: vivienda, comida, transporte',
      '30% deseos: ocio, suscripciones',
      '20% ahorro o deuda: meta financiera',
      'Registra cada movimiento el mismo día',
      'Revisa el balance semanal en el dashboard',
    ],
  },
  ai: {
    name: 'Coaching + Pomodoro',
    tagline: 'Mentor con tus datos reales',
    howWeHelp:
      'La IA lee objetivos, tareas, hábitos y finanzas que tú registras. Sugiere planes de 25 min (Pomodoro) y el siguiente paso concreto.',
    steps: [
      'Sin datos vacíos: te guía a configurar la app',
      'Con datos: prioriza tareas y detecta procrastinación',
      'Pomodoro: pide «plan de 25 minutos» en el chat',
      'Un solo paso: primer bloque de 15 min si estás bloqueado',
      'No inventa: solo usa lo que está en tu perfil',
    ],
  },
};
