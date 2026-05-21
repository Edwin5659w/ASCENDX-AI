export interface ChatHistoryMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

export interface StoredChatPair {
  user: string;
  assistant: string;
}

export function encodeChatPair(user: string, assistant: string): string {
  return JSON.stringify({ user, assistant });
}

export function decodeChatInsightMessage(
  id: string,
  message: string,
  createdAt: Date | string,
): ChatHistoryMessage[] {
  const at = typeof createdAt === 'string' ? createdAt : createdAt.toISOString();
  try {
    const parsed = JSON.parse(message) as Partial<StoredChatPair>;
    if (parsed.user && parsed.assistant) {
      return [
        { id: `${id}-u`, role: 'user', content: parsed.user, createdAt: at },
        { id: `${id}-a`, role: 'assistant', content: parsed.assistant, createdAt: at },
      ];
    }
  } catch {
    /* legacy: solo respuesta del asistente */
  }
  return [{ id, role: 'assistant', content: message, createdAt: at }];
}

export const INSIGHT_TYPE_LABELS: Record<string, string> = {
  DAILY_PLAN: 'Plan del día',
  CHAT: 'Mentor',
  PROCRASTINATION: 'Procrastinación',
  MOTIVATION: 'Motivación',
  WARNING: 'Aviso',
};

export function insightTypeLabel(type: string): string {
  return INSIGHT_TYPE_LABELS[type] ?? type;
}

export const CONTEXT_LEVEL_LABELS: Record<string, { label: string; color: string }> = {
  empty: { label: 'Perfil vacío', color: 'zinc' },
  partial: { label: 'Perfil en progreso', color: 'amber' },
  ready: { label: 'Perfil completo', color: 'emerald' },
};
