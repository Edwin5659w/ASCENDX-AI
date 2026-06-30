import { prisma } from '../../lib/prisma';
import { toMoneyNumber } from '../../utils/money';
import { startOfDayUTC } from '../../utils/date';
import type { AIContextLevel } from '@ascendx/shared/ai-prompts';

export interface UserAIContext {
  userName: string;
  level: number;
  xp: number;
  dailyFocus: string | null;
  goals: { title: string; progress: number; priority: string }[];
  pendingTasks: string[];
  totalTasks: number;
  completedTasks: number;
  habits: { name: string; streak: number }[];
  recentFinance: { type: string; amount: number; category: string }[];
  pendingTasksCount: number;
  overdueGoals: number;
  contextLevel: AIContextLevel;
}

export async function buildUserAIContext(userId: string): Promise<UserAIContext> {
  const [user, goals, allTasks, pendingTasks, habits, finance] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, level: true, xp: true, dailyFocus: true, dailyFocusDate: true },
    }),
    prisma.goal.findMany({ where: { userId }, take: 5, orderBy: { updatedAt: 'desc' } }),
    prisma.task.findMany({ where: { userId }, select: { completed: true } }),
    prisma.task.findMany({
      where: { userId, completed: false },
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: { title: true },
    }),
    prisma.habit.findMany({ where: { userId }, select: { name: true, streak: true } }),
    prisma.financeRecord.findMany({
      where: { userId },
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: { type: true, amount: true, category: true },
    }),
  ]);

  const completedTasks = allTasks.filter((t) => t.completed).length;
  const totalGoals = goals.length;
  const totalTasks = allTasks.length;
  const activeHabits = habits.length;
  const financeRecordsCount = finance.length;

  const contextLevel = resolveContextLevel({
    totalGoals,
    totalTasks,
    activeHabits,
    completedTasks,
    financeRecordsCount,
  });

  const overdueGoals = goals.filter((g) => g.deadline && g.deadline < new Date()).length;

  const today = startOfDayUTC();
  const dailyFocus =
    user?.dailyFocus &&
    user.dailyFocusDate &&
    startOfDayUTC(user.dailyFocusDate).getTime() === today.getTime()
      ? user.dailyFocus
      : null;

  return {
    userName: user?.name?.split(' ')[0] ?? 'viajero',
    level: user?.level ?? 1,
    xp: user?.xp ?? 0,
    dailyFocus,
    goals: goals.map((g) => ({ title: g.title, progress: g.progress, priority: g.priority })),
    pendingTasks: pendingTasks.map((t) => t.title),
    totalTasks,
    completedTasks,
    habits: habits.map((h) => ({ name: h.name, streak: h.streak })),
    recentFinance: finance.map((f) => ({
      type: f.type,
      amount: toMoneyNumber(f.amount),
      category: f.category,
    })),
    pendingTasksCount: pendingTasks.length,
    overdueGoals,
    contextLevel,
  };
}

export function resolveContextLevel(stats: {
  totalGoals: number;
  totalTasks: number;
  activeHabits: number;
  completedTasks: number;
  financeRecordsCount: number;
}): AIContextLevel {
  const hasCore =
    stats.totalGoals >= 1 && stats.totalTasks >= 1 && stats.activeHabits >= 1 && stats.completedTasks >= 1;
  if (hasCore) return 'ready';

  const hasAnything =
    stats.totalGoals > 0 ||
    stats.totalTasks > 0 ||
    stats.activeHabits > 0 ||
    stats.financeRecordsCount > 0;
  if (!hasAnything) return 'empty';

  return 'partial';
}

export function formatContextForPrompt(ctx: UserAIContext): string {
  return JSON.stringify(
    {
      perfil: { nombre: ctx.userName, nivel: ctx.level, xp: ctx.xp, nivelContexto: ctx.contextLevel },
      focoDelDia: ctx.dailyFocus,
      objetivos: ctx.goals,
      tareasPendientes: ctx.pendingTasks,
      resumenTareas: { total: ctx.totalTasks, completadas: ctx.completedTasks },
      habitos: ctx.habits,
      finanzasRecientes: ctx.recentFinance,
      metricas: { tareasPendientes: ctx.pendingTasksCount, objetivosVencidos: ctx.overdueGoals },
    },
    null,
    0,
  );
}

export function dailyPlanSystemPrompt(ctx: UserAIContext): string {
  const base =
    'Eres ASCENDX AI, mentor de vida personal. Responde en español, máximo 200 palabras, con 4-6 acciones numeradas y concretas.';

  if (ctx.contextLevel === 'empty') {
    return `${base} El usuario NO tiene objetivos, tareas ni hábitos registrados. NO inventes datos. Guíalo a crear su primer objetivo, 2 tareas y 1 hábito en la app. Sé breve y motivador.`;
  }
  if (ctx.contextLevel === 'partial') {
    return `${base} El perfil está incompleto (faltan objetivos, tareas o hábitos). Usa solo los datos del JSON. Sugiere completar lo que falte y una acción inmediata para hoy.`;
  }
  return `${base} Usa exclusivamente los datos del JSON. Si hay focoDelDia, priorízalo en el plan. Prioriza tareas pendientes, hábitos con racha y objetivos con mayor progreso pendiente. Puedes citar metodologías cuando ayuden: SMART (objetivos), GTD/Eisenhower (tareas), habit stacking (hábitos), 50/30/20 (finanzas), Pomodoro 25 min (enfoque).`;
}

export function chatSystemPrompt(ctx: UserAIContext): string {
  const base =
    'Eres ASCENDX AI, mentor empático y directo. Español, máximo 150 palabras. Acciones concretas, sin rodeos. No des consejos médicos, legales ni financieros profesionales.';

  if (ctx.contextLevel === 'empty') {
    return `${base} El usuario aún no configuró la app. Ayúdale a dar los primeros pasos (objetivo, tareas, hábito). No inventes metas que no aparecen en el contexto.`;
  }
  if (ctx.contextLevel === 'partial') {
    return `${base} Perfil parcial: motiva a completar objetivos, tareas y hábitos en la app antes de planes complejos.`;
  }
  return `${base} Usa el contexto JSON. Detecta procrastinación si hay muchas tareas pendientes y propón UN primer paso de 15 minutos. Menciona la metodología cuando encaje (SMART, GTD, Pomodoro, rachas de hábitos, 50/30/20). Termina con una pregunta concreta o acción única. No des asesoría de inversión ni trading bursátil.`;
}
