/**
 * Metas múltiples (sección 6.3): progreso, hitos y reparto de la capacidad
 * prudente entre metas por prioridad y fecha.
 */
import { addMonths, compareDates, monthsBetween, type CalendarDate } from './dates.js';
import { assertNonNegative, roundPesos } from './money.js';

export const GOAL_PRIORITIES = ['alta', 'media', 'baja'] as const;
export type GoalPriority = (typeof GOAL_PRIORITIES)[number];

/** Hitos de gamificación (sección 15): 25, 50, 75 y 100 %. */
export const GOAL_MILESTONES = [25, 50, 75, 100] as const;

export interface GoalProgress {
  saved: number;
  /** Faltante F = objetivo − ahorrado (nunca negativo) */
  remaining: number;
  /** 0–100, con un decimal, limitado a 100 */
  percent: number;
  completed: boolean;
  /** Hitos alcanzados (25/50/75/100) */
  milestones: number[];
}

export function goalProgress(targetAmount: number, savedAmount: number): GoalProgress {
  assertNonNegative(targetAmount, 'El valor objetivo');
  assertNonNegative(savedAmount, 'El ahorro de la meta');
  const saved = roundPesos(savedAmount);
  const remaining = roundPesos(Math.max(0, targetAmount - saved));
  const percent = targetAmount === 0 ? 100 : Math.min(100, Math.floor((saved / targetAmount) * 1000) / 10);
  return {
    saved,
    remaining,
    percent,
    completed: remaining === 0,
    milestones: GOAL_MILESTONES.filter((milestone) => percent >= milestone),
  };
}

/**
 * RF-17: un retiro no puede dejar la meta en negativo. Devuelve el nuevo
 * saldo o lanza un error.
 */
export function applyGoalMovement(savedAmount: number, amount: number, kind: 'aporte' | 'retiro'): number {
  assertNonNegative(savedAmount, 'El ahorro de la meta');
  if (!Number.isFinite(amount) || amount <= 0) throw new RangeError('El monto debe ser mayor que 0');
  const next = kind === 'aporte' ? savedAmount + amount : savedAmount - amount;
  if (next < 0) throw new RangeError('El retiro supera lo ahorrado en la meta');
  return roundPesos(next);
}

/** Aporte requerido = ⌈F ÷ n⌉ */
export function requiredMonthlyContribution(remaining: number, months: number): number {
  assertNonNegative(remaining, 'El faltante');
  if (remaining === 0) return 0;
  if (!Number.isInteger(months) || months <= 0) throw new RangeError('Los meses deben ser un entero mayor que 0');
  return Math.ceil(remaining / months);
}

export interface GoalInput {
  id: string;
  targetAmount: number;
  savedAmount: number;
  priority: GoalPriority;
  targetDate?: CalendarDate | null;
}

export type GoalPlanStatus =
  | 'completada' // ya se alcanzó
  | 'en_curso' // recibe su aporte requerido (o, sin fecha, algún aporte)
  | 'en_riesgo' // no recibe su aporte requerido
  | 'vencida'; // la fecha deseada ya pasó sin completarla

export interface GoalPlan {
  id: string;
  status: GoalPlanStatus;
  progress: GoalProgress;
  /** Meses hasta la fecha deseada (mínimo 1 si la fecha es futura) */
  monthsToTargetDate: number | null;
  /** Aporte mensual necesario para llegar en la fecha deseada */
  requiredMonthly: number | null;
  /** Parte de la capacidad prudente asignada a esta meta */
  assignedMonthly: number;
  /** hoy + ⌈F ÷ aporte asignado⌉ meses; null si no recibe aporte */
  projectedDate: CalendarDate | null;
  /** Solo para metas en riesgo o vencidas: las dos sugerencias del v2 */
  suggestions: {
    /** Fecha alcanzable con el aporte asignado (null si no recibe aporte) */
    reachableDate: CalendarDate | null;
    /** Aporte necesario para mantener la fecha deseada */
    contributionToKeepDate: number | null;
  } | null;
}

export interface GoalAllocation {
  plans: GoalPlan[];
  prudentCapacity: number;
  totalRequired: number;
  /** true si la capacidad prudente cubre todos los aportes requeridos */
  allOnTrack: boolean;
  /** Capacidad que sobró después de repartir */
  unassigned: number;
}

const PRIORITY_ORDER: Record<GoalPriority, number> = { alta: 0, media: 1, baja: 2 };

/**
 * Reparte la capacidad prudente (CP) entre las metas activas:
 * 1. Si la suma de aportes requeridos ≤ CP, todas están en curso.
 * 2. Si no, se reparte por prioridad (alta → baja) y, dentro de cada
 *    prioridad, por fecha más cercana. Las metas sin fecha van al final de su
 *    prioridad y reciben lo que quede, hasta su faltante.
 * 3. Las metas que no reciben su aporte requerido quedan «en riesgo» con dos
 *    sugerencias. Una meta con fecha vencida necesita todo su faltante ya.
 */
export function allocateGoals(goals: readonly GoalInput[], prudentCapacity: number, today: CalendarDate): GoalAllocation {
  assertNonNegative(prudentCapacity, 'La capacidad prudente');

  const prepared = goals.map((goal) => {
    const progress = goalProgress(goal.targetAmount, goal.savedAmount);
    const hasDate = Boolean(goal.targetDate);
    const overdue = hasDate && compareDates(goal.targetDate!, today) <= 0;
    const monthsToTargetDate = hasDate ? (overdue ? 0 : Math.max(1, monthsBetween(today, goal.targetDate!))) : null;
    const requiredMonthly = progress.completed
      ? 0
      : monthsToTargetDate === null
        ? null
        : requiredMonthlyContribution(progress.remaining, Math.max(1, monthsToTargetDate));
    return { goal, progress, overdue, monthsToTargetDate, requiredMonthly };
  });

  const pending = prepared
    .filter((item) => !item.progress.completed)
    .sort((a, b) => {
      const byPriority = PRIORITY_ORDER[a.goal.priority] - PRIORITY_ORDER[b.goal.priority];
      if (byPriority !== 0) return byPriority;
      const aDate = a.goal.targetDate ?? '9999-12-31';
      const bDate = b.goal.targetDate ?? '9999-12-31';
      return compareDates(aDate, bDate);
    });

  const totalRequired = pending.reduce((total, item) => total + (item.requiredMonthly ?? 0), 0);
  let remainingCapacity = prudentCapacity;
  const assigned = new Map<string, number>();

  // Primero, las metas con fecha reciben su aporte requerido en el orden de prioridad.
  for (const item of pending) {
    if (item.requiredMonthly === null) continue;
    const amount = Math.min(item.requiredMonthly, remainingCapacity);
    assigned.set(item.goal.id, amount);
    remainingCapacity -= amount;
  }
  // Luego, las metas sin fecha reciben lo que sobre, hasta su faltante.
  for (const item of pending) {
    if (item.requiredMonthly !== null) continue;
    const amount = Math.min(item.progress.remaining, remainingCapacity);
    assigned.set(item.goal.id, amount);
    remainingCapacity -= amount;
  }

  const plans: GoalPlan[] = prepared.map((item) => {
    const assignedMonthly = assigned.get(item.goal.id) ?? 0;
    const projectedDate =
      item.progress.completed
        ? today
        : assignedMonthly > 0
          ? addMonths(today, Math.ceil(item.progress.remaining / assignedMonthly))
          : null;

    let status: GoalPlanStatus;
    if (item.progress.completed) status = 'completada';
    else if (item.overdue) status = 'vencida';
    else if (item.requiredMonthly === null) status = assignedMonthly > 0 ? 'en_curso' : 'en_riesgo';
    else status = assignedMonthly >= item.requiredMonthly ? 'en_curso' : 'en_riesgo';

    const needsSuggestions = status === 'en_riesgo' || status === 'vencida';
    return {
      id: item.goal.id,
      status,
      progress: item.progress,
      monthsToTargetDate: item.monthsToTargetDate,
      requiredMonthly: item.requiredMonthly,
      assignedMonthly,
      projectedDate,
      suggestions: needsSuggestions
        ? { reachableDate: projectedDate, contributionToKeepDate: item.overdue ? null : item.requiredMonthly }
        : null,
    };
  });

  return {
    plans,
    prudentCapacity,
    totalRequired,
    allOnTrack: totalRequired <= prudentCapacity,
    unassigned: remainingCapacity,
  };
}
