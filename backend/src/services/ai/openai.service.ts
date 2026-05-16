import OpenAI from 'openai';
import { prisma } from '../../lib/prisma';
import { env } from '../../config/env';
import { AppError } from '../../middleware/errorHandler';
import { startOfDayUTC } from '../../utils/date';

const FALLBACK_DAILY_PLAN =
  'Plan del día: 1) Revisa tus objetivos activos. 2) Completa 3 tareas prioritarias. 3) Registra un hábito clave. 4) Revisa tus finanzas. ¡Tú puedes!';

const FALLBACK_CHAT =
  'Soy tu mentor ASCENDX. En este momento no puedo conectar con la IA, pero recuerda: la disciplina diaria vence a la motivación temporal. ¿Qué pequeña acción puedes hacer ahora?';

export class OpenAIService {
  private client: OpenAI | null = null;

  constructor() {
    if (env.OPENAI_API_KEY) {
      this.client = new OpenAI({ apiKey: env.OPENAI_API_KEY });
    }
  }

  private async buildUserContext(userId: string): Promise<string> {
    const [user, goals, tasks, habits, finance] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.goal.findMany({ where: { userId }, take: 5 }),
      prisma.task.findMany({ where: { userId, completed: false }, take: 10 }),
      prisma.habit.findMany({ where: { userId } }),
      prisma.financeRecord.findMany({ where: { userId }, take: 5, orderBy: { createdAt: 'desc' } }),
    ]);

    const pendingTasks = tasks.length;
    const overdueGoals = goals.filter((g) => g.deadline && g.deadline < new Date()).length;

    return JSON.stringify({
      user: { name: user?.name, level: user?.level, xp: user?.xp },
      goals: goals.map((g) => ({ title: g.title, progress: g.progress, priority: g.priority })),
      pendingTasks: tasks.map((t) => t.title),
      habits: habits.map((h) => ({ name: h.name, streak: h.streak })),
      recentFinance: finance.map((f) => ({ type: f.type, amount: f.amount, category: f.category })),
      metrics: { pendingTasks, overdueGoals },
    });
  }

  async generateDailyPlan(userId: string): Promise<string> {
    const context = await this.buildUserContext(userId);

    if (!this.client) {
      await this.saveInsight(userId, 'DAILY_PLAN', FALLBACK_DAILY_PLAN);
      return FALLBACK_DAILY_PLAN;
    }

    try {
      const completion = await this.client.chat.completions.create({
        model: env.OPENAI_MODEL,
        messages: [
          {
            role: 'system',
            content:
              'Eres ASCENDX AI, un mentor de vida personal. Genera un plan diario conciso en español (máx 200 palabras) con 4-6 acciones priorizadas basadas en los datos del usuario.',
          },
          { role: 'user', content: `Datos del usuario:\n${context}` },
        ],
        max_tokens: 400,
        temperature: 0.7,
      });

      const plan = completion.choices[0]?.message?.content?.trim() || FALLBACK_DAILY_PLAN;
      await this.saveInsight(userId, 'DAILY_PLAN', plan);
      return plan;
    } catch (error) {
      console.error('[OpenAI] daily-plan error:', error);
      await this.saveInsight(userId, 'DAILY_PLAN', FALLBACK_DAILY_PLAN);
      return FALLBACK_DAILY_PLAN;
    }
  }

  async chat(userId: string, message: string): Promise<string> {
    const context = await this.buildUserContext(userId);

    if (!this.client) {
      return FALLBACK_CHAT;
    }

    try {
      const completion = await this.client.chat.completions.create({
        model: env.OPENAI_MODEL,
        messages: [
          {
            role: 'system',
            content:
              'Eres ASCENDX AI, mentor personal empático y directo. Ayudas con objetivos, hábitos, productividad y finanzas. Responde en español, máximo 150 palabras. Detecta procrastinación y motiva con acciones concretas.',
          },
          { role: 'user', content: `Contexto:\n${context}\n\nMensaje: ${message}` },
        ],
        max_tokens: 300,
        temperature: 0.8,
      });

      const reply = completion.choices[0]?.message?.content?.trim() || FALLBACK_CHAT;
      await this.saveInsight(userId, 'CHAT', reply);
      return reply;
    } catch (error) {
      console.error('[OpenAI] chat error:', error);
      return FALLBACK_CHAT;
    }
  }

  async detectProcrastination(userId: string): Promise<string | null> {
    const incompleteTasks = await prisma.task.count({
      where: {
        userId,
        completed: false,
        dueDate: { lt: new Date() },
      },
    });

    if (incompleteTasks < 3) return null;

    const warning = `Detecté ${incompleteTasks} tareas vencidas. La procrastinación acumula presión — elige UNA tarea de 15 minutos y complétala ahora.`;

    const todayStart = startOfDayUTC();
    const existing = await prisma.aIInsight.findFirst({
      where: {
        userId,
        type: 'PROCRASTINATION',
        createdAt: { gte: todayStart },
      },
      orderBy: { createdAt: 'desc' },
    });
    if (existing) return existing.message;

    await this.saveInsight(userId, 'PROCRASTINATION', warning);
    return warning;
  }

  private async saveInsight(
    userId: string,
    type: 'DAILY_PLAN' | 'CHAT' | 'PROCRASTINATION' | 'MOTIVATION' | 'WARNING',
    message: string,
  ) {
    await prisma.aIInsight.create({ data: { userId, type, message } });
  }
}

export const openaiService = new OpenAIService();
