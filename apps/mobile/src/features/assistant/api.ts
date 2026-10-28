import { apiRequest } from '@/lib/api';
import { invalidate } from '@/lib/query';

export interface AiAnswer {
  resumen: string;
  recomendacion: string;
  pasos: string[];
  alternativas: string[];
  supuestos: string[];
}

export interface DataUsed {
  label: string;
  value: number;
  kind: 'money' | 'percent';
}

export interface Verification {
  ok: boolean;
  checked: number;
  fallback: boolean;
}

export interface AnalysisResult {
  answer: AiAnswer;
  dataUsed: DataUsed[];
  /** «reglas» o el proveedor de IA */
  source: string;
  external: boolean;
  verification: Verification;
  generatedAt: string;
}

export type AppFunction = 'simulador' | 'metas' | 'movimientos' | 'deudas' | 'perfil' | null;

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  meta?: { funcion?: AppFunction; source?: string; verification?: Verification; dataUsed?: DataUsed[] } | null;
  createdAt: string;
}

export interface AiStatus {
  consent: boolean;
  external: boolean;
  provider: string;
  limits: { chat: { used: number; limit: number }; analysis: { used: number; limit: number } };
}

const auth = true;

export const getAiStatus = () => apiRequest<AiStatus>('/ai/status', { auth });

export async function requestSummary() {
  const result = await apiRequest<AnalysisResult>('/ai/summary', { method: 'POST', body: {}, auth });
  invalidate('assistant:status');
  return result;
}

export async function requestPlan(goalId?: string | null) {
  const result = await apiRequest<AnalysisResult>('/ai/plan', { method: 'POST', body: { goalId: goalId ?? null }, auth });
  invalidate('assistant:status');
  return result;
}

export async function sendChat(message: string, conversationId?: string | null) {
  const result = await apiRequest<{ conversationId: string; message: ChatMessage; remaining: number }>('/ai/chat', {
    method: 'POST',
    body: { message, conversationId: conversationId ?? null },
    auth,
  });
  invalidate('assistant:status', 'assistant:conversations');
  return result;
}

export const getConversations = () =>
  apiRequest<{ conversations: { id: string; title: string; messages: number; updatedAt: string }[] }>('/ai/conversations', { auth });

export const getConversation = (id: string) =>
  apiRequest<{ conversation: { id: string; title: string }; messages: ChatMessage[] }>(`/ai/conversations/${id}`, { auth });

export async function clearConversations() {
  await apiRequest<void>('/ai/conversations', { method: 'DELETE', auth });
  invalidate('assistant:conversations');
}
