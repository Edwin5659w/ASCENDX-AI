import OpenAI from 'openai';
import { prisma } from '../../lib/prisma';
import { env } from '../../config/env';
import { startOfDayUTC } from '../../utils/date';
import {
  EMPTY_DAILY_PLAN,
  getSuggestedPrompts,
  buildAIUsage,
  type AIContextLevel,
} from '@ascendx/shared/ai-prompts';
import { getPlanLimits } from '@ascendx/shared/plans';
import { encodeChatPair, decodeChatInsightMessage } from '@ascendx/shared/chat-helpers';
import {
  buildUserAIContext,
  chatSystemPrompt,
  dailyPlanSystemPrompt,
  formatContextForPrompt,
} from './user-context';
import { planService } from '../plan.service';

const FALLBACK_DAILY_PLAN_PARTIAL =
  'Plan del día: 1) Revisa tus objetivos en la app. 2) Elige la tarea más pequeña y complétala. 3) Marca un hábito hoy (+15 XP). 4) Registra un movimiento si aplica. ¡Vamos paso a paso!';

const FALLBACK_DAILY_PLAN_READY =
  'Plan del día: 1) Revisa tus objetivos activos. 2) Completa 3 tareas prioritarias. 3) Registra un hábito clave. 4) Revisa tus finanzas. ¡Tú puedes!';

const FALLBACK_CHAT =
  'Soy tu mentor ASCENDX. En este momento no puedo conectar con la IA. Mientras tanto: abre Objetivos, crea una meta pequeña y añade una tarea de 15 minutos. ¿Cuál harías primero?';

export class OpenAIService {
  private client: OpenAI | null = null;

  constructor() {
    if (env.OPENAI_API_KEY) {
      this.client = new OpenAI({ apiKey: env.OPENAI_API_KEY });
    }
  }

  async getContextMeta(userId: string) {
    const ctx = await buildUserAIContext(userId);
    const plan = await planService.getUserPlan(userId);
    const used = await planService.getAiUsageToday(userId);
    const limits = getPlanLimits(plan);
    return {
      contextLevel: ctx.contextLevel,
      suggestedPrompts: getSuggestedPrompts(ctx.contextLevel),
      aiUsage: buildAIUsage(used, limits.aiChatPerDay, plan),
    };
  }

  async getUsage(userId: string) {
    const plan = await planService.getUserPlan(userId);
    const used = await planService.getAiUsageToday(userId);
    const limits = getPlanLimits(plan);
    return buildAIUsage(used, limits.aiChatPerDay, plan);
  }

  async generateDailyPlan(userId: string): Promise<{
    plan: string;
    contextLevel: AIContextLevel;
    suggestedPrompts: string[];
  }> {
    const ctx = await buildUserAIContext(userId);
    const meta = { contextLevel: ctx.contextLevel, suggestedPrompts: getSuggestedPrompts(ctx.contextLevel) };

    if (ctx.contextLevel === 'empty') {
      await this.saveDailyPlanIfNew(userId, EMPTY_DAILY_PLAN);
      return { plan: EMPTY_DAILY_PLAN, ...meta };
    }

    const todayStart = startOfDayUTC();
    const cached = await prisma.aIInsight.findFirst({
      where: { userId, type: 'DAILY_PLAN', createdAt: { gte: todayStart } },
      orderBy: { createdAt: 'desc' },
    });
    if (cached) {
      return { plan: cached.message, ...meta };
    }

    if (!this.client) {
      const fallback =
        ctx.contextLevel === 'partial' ? FALLBACK_DAILY_PLAN_PARTIAL : FALLBACK_DAILY_PLAN_READY;
      await this.saveInsight(userId, 'DAILY_PLAN', fallback);
      return { plan: fallback, ...meta };
    }

    try {
      const completion = await this.client.chat.completions.create({
        model: env.OPENAI_MODEL,
        messages: [
          { role: 'system', content: dailyPlanSystemPrompt(ctx) },
          { role: 'user', content: `Datos del usuario:\n${formatContextForPrompt(ctx)}` },
        ],
        max_tokens: 400,
        temperature: 0.65,
      });

      const plan =
        completion.choices[0]?.message?.content?.trim() ||
        (ctx.contextLevel === 'partial' ? FALLBACK_DAILY_PLAN_PARTIAL : FALLBACK_DAILY_PLAN_READY);

      await this.saveInsight(userId, 'DAILY_PLAN', plan);
      return { plan, ...meta };
    } catch (error) {
      console.error('[OpenAI] daily-plan error:', error);
      const fallback =
        ctx.contextLevel === 'partial' ? FALLBACK_DAILY_PLAN_PARTIAL : FALLBACK_DAILY_PLAN_READY;
      await this.saveInsight(userId, 'DAILY_PLAN', fallback);
      return { plan: fallback, ...meta };
    }
  }

  async chat(
    userId: string,
    message: string,
  ): Promise<{
    reply: string;
    contextLevel: AIContextLevel;
    suggestedPrompts: string[];
    aiUsage: ReturnType<typeof buildAIUsage>;
    action?: { type: 'CREATE_TASK' | 'CREATE_HABIT'; title: string };
  }> {
    const usage = await planService.assertCanChat(userId);
    const ctx = await buildUserAIContext(userId);
    const effectivePlan = await planService.getUserPlan(userId);
    const canAct = effectivePlan === 'PRO';
    const baseMeta = {
      contextLevel: ctx.contextLevel,
      suggestedPrompts: getSuggestedPrompts(ctx.contextLevel),
    };

    const sanitized = message.trim().slice(0, 2000);
    if (!sanitized) {
      return {
        reply: 'Escribe tu pregunta y te ayudo con el siguiente paso concreto.',
        ...baseMeta,
        aiUsage: buildAIUsage(usage.used, usage.limit, usage.plan),
      };
    }

    if (!this.client) {
      return { reply: FALLBACK_CHAT, ...baseMeta, aiUsage: buildAIUsage(usage.used, usage.limit, usage.plan) };
    }

    try {
      const history = await this.getChatHistory(userId, 12);
      const recentTurns = history.slice(-8).map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));

      const completion = await this.client.chat.completions.create({
        model: env.OPENAI_MODEL,
        messages: [
          { role: 'system', content: chatSystemPrompt(ctx, { canAct }) },
          ...recentTurns,
          {
            role: 'user',
            content: `Contexto actualizado:\n${formatContextForPrompt(ctx)}\n\nMensaje del usuario:\n${sanitized}`,
          },
        ],
        max_tokens: 400,
        temperature: 0.75,
      });

      let reply = completion.choices[0]?.message?.content?.trim() || FALLBACK_CHAT;
      let action: { type: 'CREATE_TASK' | 'CREATE_HABIT'; title: string } | undefined;

      if (canAct) {
        const parsed = parseAscendxAction(reply);
        if (parsed) {
          action = parsed.action;
          reply = parsed.cleanReply;
          try {
            if (action.type === 'CREATE_TASK') {
              await prisma.task.create({
                data: { title: action.title.slice(0, 120), userId },
              });
              reply = `${reply}\n\n✓ Tarea creada: «${action.title}»`;
            } else {
              const habitCount = await prisma.habit.count({ where: { userId } });
              const limits = getPlanLimits(effectivePlan);
              if (habitCount < limits.maxHabits) {
                await prisma.habit.create({
                  data: { name: action.title.slice(0, 80), frequency: 'DAILY', userId },
                });
                reply = `${reply}\n\n✓ Hábito creado: «${action.title}»`;
              }
            }
          } catch (err) {
            console.warn('[OpenAI] action create failed:', err);
          }
        }
      } else {
        reply = reply.replace(/ASCENDX_ACTION:[^\n]+/g, '').trim();
      }

      await this.saveChatExchange(userId, sanitized, reply);
      return {
        reply,
        ...baseMeta,
        aiUsage: buildAIUsage(usage.used + 1, usage.limit, usage.plan),
        action,
      };
    } catch (error) {
      console.error('[OpenAI] chat error:', error);
      return { reply: FALLBACK_CHAT, ...baseMeta, aiUsage: buildAIUsage(usage.used, usage.limit, usage.plan) };
    }
  }

  /** Enriquece el resumen semanal Pro con un párrafo corto de IA (fallback = heurística). */
  async enrichWeeklyRecap(
    userId: string,
    base: { headline: string; highlights: string[]; score: number; encouragement: string },
  ) {
    if (!this.client) return base;
    try {
      const completion = await this.client.chat.completions.create({
        model: env.OPENAI_MODEL,
        messages: [
          {
            role: 'system',
            content:
              'Eres el mentor ASCENDX. En español, reescribe SOLO el encouragement (1-2 frases motivadoras y concretas) a partir del resumen. No inventes métricas. Responde solo el texto del encouragement, sin comillas.',
          },
          {
            role: 'user',
            content: JSON.stringify({
              headline: base.headline,
              score: base.score,
              highlights: base.highlights,
              encouragement: base.encouragement,
            }),
          },
        ],
        max_tokens: 120,
        temperature: 0.7,
      });
      const encouragement = completion.choices[0]?.message?.content?.trim();
      if (encouragement && encouragement.length > 10) {
        return { ...base, encouragement };
      }
    } catch (err) {
      console.warn('[OpenAI] weekly recap enrich failed:', err);
    }
    return base;
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

  private async saveDailyPlanIfNew(userId: string, message: string) {
    const todayStart = startOfDayUTC();
    const existing = await prisma.aIInsight.findFirst({
      where: { userId, type: 'DAILY_PLAN', createdAt: { gte: todayStart } },
    });
    if (!existing) await this.saveInsight(userId, 'DAILY_PLAN', message);
  }

  async getChatHistory(userId: string, limit = 40) {
    const rows = await prisma.aIInsight.findMany({
      where: { userId, type: 'CHAT' },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    // Invertir para mostrar cronológicamente (más antiguo → más reciente)
    return [...rows]
      .reverse()
      .flatMap((row) => decodeChatInsightMessage(row.id, row.message, row.createdAt));
  }

  async clearChatHistory(userId: string) {
    await prisma.aIInsight.deleteMany({ where: { userId, type: 'CHAT' } });
  }

  private async saveChatExchange(userId: string, userMessage: string, assistantReply: string) {
    await prisma.aIInsight.create({
      data: { userId, type: 'CHAT', message: encodeChatPair(userMessage, assistantReply) },
    });
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

function parseAscendxAction(reply: string): {
  cleanReply: string;
  action: { type: 'CREATE_TASK' | 'CREATE_HABIT'; title: string };
} | null {
  const match = reply.match(/ASCENDX_ACTION:(CREATE_TASK|CREATE_HABIT):(.+)/i);
  if (!match) return null;
  const type = match[1].toUpperCase() as 'CREATE_TASK' | 'CREATE_HABIT';
  const title = match[2].trim().replace(/^["«]|["»]$/g, '');
  if (!title || title.length < 2) return null;
  const cleanReply = reply.replace(/ASCENDX_ACTION:[^\n]+/gi, '').trim();
  return { cleanReply, action: { type, title } };
}
