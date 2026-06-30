/**
 * Tour guiado post-onboarding — estilo Duolingo.
 * Fuente única web + móvil.
 */

export type ProductTourIcon =
  | 'wave'
  | 'home'
  | 'tasks'
  | 'habits'
  | 'brain'
  | 'trophy'
  | 'compare'
  | 'rocket';

export interface ProductTourStep {
  id: string;
  icon: ProductTourIcon;
  title: string;
  /** Texto principal — tono cercano, segunda persona */
  body: string;
  /** Metodología que respalda este módulo (SMART, GTD, etc.) */
  methodology?: string;
  bullets?: string[];
  /** Etiqueta del botón principal (último paso usa ctaFinish) */
  cta?: string;
  accent: 'violet' | 'cyan' | 'amber' | 'emerald';
}

export const PRODUCT_TOUR_STEPS: ProductTourStep[] = [
  {
    id: 'welcome',
    icon: 'wave',
    title: '¡Hola! Soy tu guía ASCENDX',
    body: 'En 1 minuto te enseño cómo funciona tu Life OS. Así arrancas con ventaja desde el día uno.',
    bullets: ['Sin aburrirte con manuales', 'Todo explicado paso a paso', 'Gratis para empezar — Pro cuando quieras más'],
    cta: 'Empezar el tour',
    accent: 'violet',
  },
  {
    id: 'dashboard',
    icon: 'home',
    title: 'Tu centro de mando',
    body: 'El Inicio concentra foco del día, KPIs y el plan que genera la IA con tus datos reales — no inventa nada.',
    bullets: ['Foco diario editable', 'Progreso de tareas y hábitos', 'Alertas si procrastinas'],
    cta: 'Entendido',
    accent: 'cyan',
  },
  {
    id: 'tasks',
    icon: 'tasks',
    title: 'Tareas que mueven la aguja',
    body: 'Cada tarea completada suma XP y puede vincularse a un objetivo. La IA prioriza lo que vence hoy.',
    bullets: ['+10 XP por tarea completada', 'Vincula a objetivos → progreso automático', 'Fechas para que el mentor te empuje'],
    methodology: 'GTD + Eisenhower — de la meta a la acción de hoy',
    cta: 'Siguiente',
    accent: 'emerald',
  },
  {
    id: 'habits',
    icon: 'habits',
    title: 'Hábitos con racha 🔥',
    body: 'Marca tu hábito una vez al día. Las rachas construyen identidad — y los escudos protegen un día perdido.',
    bullets: ['+15 XP por hábito del día', 'Racha visible en el dashboard', '1 escudo/mes en Gratis · 3 en Pro'],
    methodology: 'Habit stacking — constancia medida en rachas',
    cta: 'Me encanta',
    accent: 'amber',
  },
  {
    id: 'ai',
    icon: 'brain',
    title: 'Mentor IA que te conoce',
    body: 'No es un chat genérico: lee tus objetivos, tareas pendientes, rachas y finanzas. Te da el siguiente paso concreto.',
    bullets: ['Plan del día automático', '5 mensajes/día en Gratis', '100/día en Pro + resumen semanal'],
    methodology: 'Coaching + Pomodoro — mentor con tus datos reales',
    cta: 'Quiero probarlo',
    accent: 'violet',
  },
  {
    id: 'xp',
    icon: 'trophy',
    title: 'Gamificación que engancha',
    body: 'XP, niveles y logros refuerzan cada micro-victoria. Es la misma psicología que hace adictivo Duolingo — pero para tu vida.',
    bullets: ['Bonus diario al entrar (+5 XP)', '+25 XP al completar primeros pasos', '12 logros desbloqueables'],
    cta: 'Seguir',
    accent: 'amber',
  },
  {
    id: 'plans',
    icon: 'compare',
    title: 'Gratis vs Pro — tú eliges',
    body: 'Gratis es generoso: todo el núcleo sin tarjeta. Pro es para quien quiere más IA, más límites y resumen semanal.',
    bullets: [
      'Gratis: 5 IA/día · 5 objetivos · 5 hábitos',
      'Pro: 100 IA/día · 50 objetivos · resumen semanal',
      'Cancela Pro cuando quieras desde Perfil',
    ],
    cta: 'Ver la diferencia',
    accent: 'cyan',
  },
  {
    id: 'finish',
    icon: 'rocket',
    title: '¡Listo para ascender!',
    body: 'Ya tienes objetivo, tareas y hábito del onboarding. Completa tu primera tarea ahora y siente el primer +10 XP.',
    bullets: ['Tu mentor IA ya puede planificar tu día', 'Vuelve mañana por el bonus diario', 'Invita amigos con tu código en Perfil'],
    cta: 'Completar mi primera tarea',
    accent: 'violet',
  },
];

export const PRODUCT_TOUR_FINISH_CTA = 'Ir al dashboard';
