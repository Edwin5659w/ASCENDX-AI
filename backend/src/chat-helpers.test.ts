import { describe, expect, it } from 'vitest';
import { decodeChatInsightMessage, encodeChatPair } from '@ascendx/shared/chat-helpers';

describe('chat-helpers', () => {
  it('round-trips chat pair encoding', () => {
    const raw = encodeChatPair('Hola', 'Respuesta');
    const msgs = decodeChatInsightMessage('id1', raw, '2025-01-01T00:00:00.000Z');
    expect(msgs).toHaveLength(2);
    expect(msgs[0].role).toBe('user');
    expect(msgs[0].content).toBe('Hola');
    expect(msgs[1].role).toBe('assistant');
    expect(msgs[1].content).toBe('Respuesta');
  });

  it('supports legacy assistant-only messages', () => {
    const msgs = decodeChatInsightMessage('id2', 'Solo respuesta antigua', '2025-01-02T00:00:00.000Z');
    expect(msgs).toHaveLength(1);
    expect(msgs[0].role).toBe('assistant');
  });
});
