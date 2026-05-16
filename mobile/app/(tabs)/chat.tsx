import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { aiApi, type AIContextLevel } from '@/src/api/services';
import { Button } from '@/src/components/ui/Button';
import { SuggestedPrompts } from '@/src/components/SuggestedPrompts';
import type { ChatMessage } from '@/src/types/api';
import { theme } from '@/constants/theme';

const INTRO: Record<AIContextLevel, string> = {
  empty:
    'Hola, soy tu mentor ASCENDX. Tu perfil está vacío: te ayudo a crear tu primer objetivo, tareas y hábito. Toca una sugerencia o escribe.',
  partial:
    'Hola, soy tu mentor ASCENDX. Ya empezaste a configurar tu espacio. Completa lo que falta y priorizamos tu día.',
  ready:
    'Hola, soy tu mentor ASCENDX. Tengo contexto de tus metas y hábitos. ¿Qué quieres mejorar hoy?',
};

export default function ChatScreen() {
  const { prefill } = useLocalSearchParams<{ prefill?: string }>();
  const prefillHandled = useRef(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [suggestedPrompts, setSuggestedPrompts] = useState<string[]>([]);
  const [bootLoading, setBootLoading] = useState(true);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    let alive = true;
    aiApi
      .context()
      .then((ctx) => {
        if (!alive) return;
        setSuggestedPrompts(ctx.suggestedPrompts);
        setMessages([{ id: '0', role: 'assistant', content: INTRO[ctx.contextLevel] }]);
      })
      .catch(() => {
        if (alive) {
          setMessages([
            {
              id: '0',
              role: 'assistant',
              content: 'Hola, soy tu mentor ASCENDX. ¿En qué puedo ayudarte hoy?',
            },
          ]);
        }
      })
      .finally(() => {
        if (alive) setBootLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const sendText = useCallback(
    async (text: string) => {
      if (!text.trim() || loading) return;

      const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content: text.trim() };
      setMessages((prev) => [...prev, userMsg]);
      setInput('');
      setLoading(true);

      try {
        const { reply, suggestedPrompts: next } = await aiApi.chat(text.trim());
        setSuggestedPrompts(next);
        setMessages((prev) => [
          ...prev,
          { id: (Date.now() + 1).toString(), role: 'assistant', content: reply },
        ]);
      } catch (e) {
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: e instanceof Error ? e.message : 'Error de conexión con el mentor',
          },
        ]);
      } finally {
        setLoading(false);
        setTimeout(() => listRef.current?.scrollToEnd(), 100);
      }
    },
    [loading],
  );

  useEffect(() => {
    const text = typeof prefill === 'string' ? prefill : prefill?.[0];
    if (!text || bootLoading || prefillHandled.current) return;
    prefillHandled.current = true;
    void sendText(text);
  }, [bootLoading, prefill, sendText]);

  const send = () => void sendText(input);

  if (bootLoading) {
    return (
      <View style={styles.boot}>
        <Text style={styles.bootText}>Cargando mentor...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}>
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        onContentSizeChange={() => listRef.current?.scrollToEnd()}
        renderItem={({ item }) => (
          <View
            style={[styles.bubble, item.role === 'user' ? styles.userBubble : styles.aiBubble]}>
            <Text style={styles.bubbleText}>{item.content}</Text>
          </View>
        )}
      />

      <View style={styles.footer}>
        <SuggestedPrompts
          prompts={suggestedPrompts}
          onSelect={(p) => void sendText(p)}
          disabled={loading}
        />
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Escribe a tu mentor..."
            placeholderTextColor={theme.colors.textMuted}
            editable={!loading}
            onSubmitEditing={send}
          />
          <Button title="Enviar" onPress={send} loading={loading} style={styles.sendBtn} />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  boot: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background },
  bootText: { color: theme.colors.textMuted },
  list: { padding: theme.spacing.md, paddingBottom: 8 },
  bubble: {
    maxWidth: '85%',
    padding: 14,
    borderRadius: 16,
    marginBottom: 10,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: theme.colors.primary,
  },
  aiBubble: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  bubbleText: { color: theme.colors.text, fontSize: 15, lineHeight: 22 },
  footer: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  inputRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-end' },
  input: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: theme.colors.text,
    fontSize: 16,
    maxHeight: 100,
  },
  sendBtn: { minWidth: 88 },
});
