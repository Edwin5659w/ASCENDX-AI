/** XP y mensajes de retención — fuente única web/móvil/backend */

export const XP = {
  TASK_COMPLETE: 10,
  HABIT_COMPLETE: 15,
  ONBOARDING_COMPLETE: 50,
  DAILY_LOGIN: 5,
  FIRST_STEPS_COMPLETE: 25,
  REFERRAL: 50,
} as const;

export const RETENTION_MESSAGES = {
  onboardingDone: (xp: number) =>
    `¡Tu espacio está listo! +${xp} XP de bienvenida. Completa tu primera tarea (+${XP.TASK_COMPLETE} XP) ahora.`,
  referralBonus: (xp: number) => `¡Código de referido aplicado! +${xp} XP para ti y tu invitador.`,
  dailyBonus: (xp: number) => `Bonus diario: +${xp} XP. ¡Bienvenido de vuelta!`,
  taskComplete: (xp: number) => `+${xp} XP · Tarea completada`,
  habitComplete: (xp: number, streak: number) => `+${xp} XP · Racha ${streak} días 🔥`,
  levelUp: (level: number) => `¡Subiste al nivel ${level}! 🚀`,
  firstStepsComplete: (xp: number) => `¡Configuración completa! +${xp} XP extra`,
  streakShield: 'Escudo de racha usado — tu racha sigue viva 🛡️',
} as const;

export interface GamificationPayload {
  xpGained: number;
  leveledUp: boolean;
  level: number;
  xp: number;
  streakShieldUsed?: boolean;
  dailyBonus?: boolean;
  firstStepsBonus?: boolean;
  message?: string;
}
