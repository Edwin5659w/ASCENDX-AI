import { env } from '../../config/env.js';
import { HttpError } from '../../lib/http-error.js';

/**
 * Proveedores de IA intercambiables (sección 3: cambiar de proveedor no
 * obliga a tocar las pantallas ni las reglas de cálculo).
 */
export interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
}

export interface ProviderReply {
  text: string;
  tokens: number;
}

export interface AiProvider {
  name: string;
  /** false = respuestas generadas con reglas en el servidor (sin terceros) */
  external: boolean;
  complete(system: string, turns: ChatTurn[]): Promise<ProviderReply>;
}

async function postJson(url: string, headers: Record<string, string>, body: unknown): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), env.AI_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new HttpError(502, 'AI_PROVIDER_ERROR', `El servicio de IA respondió con un error (${response.status}).`);
    }
    return await response.json();
  } catch (error) {
    if (error instanceof HttpError) throw error;
    if ((error as Error).name === 'AbortError') {
      throw new HttpError(504, 'AI_TIMEOUT', 'La IA tardó demasiado en responder. Inténtalo de nuevo.');
    }
    throw new HttpError(502, 'AI_PROVIDER_ERROR', 'No pudimos conectar con el servicio de IA.');
  } finally {
    clearTimeout(timer);
  }
}

/** Anthropic Messages API */
function anthropicProvider(apiKey: string, model: string): AiProvider {
  return {
    name: `anthropic:${model}`,
    external: true,
    async complete(system, turns) {
      const data = (await postJson(
        'https://api.anthropic.com/v1/messages',
        { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
        { model, max_tokens: 900, temperature: 0.2, system, messages: turns },
      )) as { content?: { type: string; text?: string }[]; usage?: { input_tokens?: number; output_tokens?: number } };
      const text = (data.content ?? []).filter((block) => block.type === 'text').map((block) => block.text ?? '').join('');
      return { text, tokens: (data.usage?.input_tokens ?? 0) + (data.usage?.output_tokens ?? 0) };
    },
  };
}

/** API de chat compatible con OpenAI (OpenAI, Groq, Gemini con su endpoint compatible, etc.) */
function openAiCompatibleProvider(apiKey: string, model: string, baseUrl: string): AiProvider {
  return {
    name: `openai:${model}`,
    external: true,
    async complete(system, turns) {
      const data = (await postJson(
        `${baseUrl.replace(/\/$/, '')}/chat/completions`,
        { Authorization: `Bearer ${apiKey}` },
        { model, temperature: 0.2, max_tokens: 900, messages: [{ role: 'system', content: system }, ...turns] },
      )) as { choices?: { message?: { content?: string } }[]; usage?: { total_tokens?: number } };
      return { text: data.choices?.[0]?.message?.content ?? '', tokens: data.usage?.total_tokens ?? 0 };
    },
  };
}

/** Sin IA externa: las respuestas las arma local-explainer.ts. */
const localProvider: AiProvider = {
  name: 'local',
  external: false,
  async complete() {
    throw new Error('El proveedor local no genera texto libre');
  },
};

let override: AiProvider | null = null;

/** Solo para pruebas: reemplaza el proveedor configurado. */
export function setProviderForTests(provider: AiProvider | null) {
  override = provider;
}

export function currentProvider(): AiProvider {
  if (override) return override;
  if (env.AI_PROVIDER === 'anthropic') return anthropicProvider(env.AI_API_KEY!, env.AI_MODEL ?? 'claude-haiku-4-5');
  if (env.AI_PROVIDER === 'openai') {
    return openAiCompatibleProvider(env.AI_API_KEY!, env.AI_MODEL ?? 'gpt-4o-mini', env.AI_BASE_URL ?? 'https://api.openai.com/v1');
  }
  return localProvider;
}
