import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { aiApi, type AIContextLevel } from '@/src/api/services';
import { isAiLimitError } from '@/src/api/client';
import { Button } from '@/src/components/ui/Button';
import { Card } from '@/src/components/ui/Card';
import { SuggestedPrompts } from '@/src/components/SuggestedPrompts';
import { AIUsageBar } from '@/src/components/ai/AIUsageBar';
import { AILimitModal } from '@/src/components/ai/AILimitModal';
import { MethodologyStrip } from '@/src/components/MethodologyStrip';
import { billingApi } from '@/src/api/services';
import type { AIInsight, ChatMessage } from '@/src/types/api';
import type { AIUsage } from '../../../shared/ai-prompts';
import { theme } from '@/constants/theme';
import { CONTEXT_LEVEL_LABELS, insightTypeLabel } from '../../../shared/chat-helpers';
import { useRouter } from 'expo-router';

const INTRO: Record<AIContextLevel, string> = {
  empty:
    'Hola, soy tu mentor ASCENDX. Tu perfil está vacío: te ayudo a crear tu primer objetivo, tareas y hábito. Toca una sugerencia o escribe.',
  partial:
    'Hola, soy tu mentor ASCENDX. Ya empezaste a configurar tu espacio. Completa lo que falta y priorizamos tu día.',
  ready:
    'Hola, soy tu mentor ASCENDX. Tengo contexto de tus metas y hábitos. ¿Qué quieres mejorar hoy?',
};

const CONTEXT_COLORS: Record<AIContextLevel, string> = {
  empty: theme.colors.textMuted,
  partial: theme.colors.warning,
  ready: theme.colors.success,
};

function TypingIndicator() {
  return (
    <View style={[styles.bubble, styles.aiBubble, styles.typingRow]}>
      <ActivityIndicator size="small" color={theme.colors.primaryLight} />
      <Text style={styles.typingText}>Mentor escribiendo...</Text>
    </View>
  );
}

export default function ChatScreen() {
  const { prefill } = useLocalSearchParams<{ prefill?: string }>();
  const router = useRouter();
  const prefillHandled = useRef(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [suggestedPrompts, setSuggestedPrompts] = useState<string[]>([]);
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [contextLevel, setContextLevel] = useState<AIContextLevel>('empty');
  const [aiUsage, setAiUsage] = useState<AIUsage | null>(null);
  const [bootLoading, setBootLoading] = useState(true);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [limitModalOpen, setLimitModalOpen] = useState(false);
  const [upgrading, setUpgrading] = useState(false);
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    let alive = true;
    Promise.all([aiApi.insights(), aiApi.context(), aiApi.chatHistory()])
      .then(([ins, ctx, history]) => {
        if (!alive) return;
        setInsights(ins.slice(0, 5));
        setSuggestedPrompts(ctx.suggestedPrompts);
        setContextLevel(ctx.contextLevel);
        if (ctx.aiUsage) setAiUsage(ctx.aiUsage);
        if (history.length > 0) {
          setMessages(history);
        } else {
          setMessages([{ id: 'intro', role: 'assistant', content: INTRO[ctx.contextLevel] }]);
        }
      })
      .catch(() => {
        if (alive) {
          setMessages([
            { id: '0', role: 'assistant', content: 'Hola, soy tu mentor ASCENDX. ¿En qué puedo ayudarte hoy?' },
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

      const userMsg: ChatMessage = {
        id: `u-${Date.now()}`,
        role: 'user',
        content: text.trim(),
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setInput('');
      setLoading(true);

      try {
        const { reply, suggestedPrompts: next, contextLevel: level, aiUsage: nextUsage } =
          await aiApi.chat(text.trim());
        setSuggestedPrompts(next);
        setContextLevel(level);
        if (nextUsage) setAiUsage(nextUsage);
        setMessages((prev) => [
          ...prev,
          {
            id: `a-${Date.now()}`,
            role: 'assistant',
            content: reply,
            createdAt: new Date().toISOString(),
          },
        ]);
      } catch (e) {
        if (isAiLimitError(e)) {
          setMessages((prev) => prev.filter((m) => m.id !== userMsg.id));
          if (e.details && typeof e.details.used === 'number') {
            setAiUsage({
              used: e.details.used as number,
              limit: e.details.limit as number,
              remaining: 0,
              plan: (e.details.plan as 'FREE' | 'PRO') ?? 'FREE',
            });
          }
          setLimitModalOpen(true);
          return;
        }
        setMessages((prev) => [
          ...prev,
          {
            id: `err-${Date.now()}`,
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

  const clearChat = () => {
    Alert.alert('Nueva conversación', '¿Borrar el historial de chat guardado?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Borrar',
        style: 'destructive',
        onPress: async () => {
          try {
            await aiApi.clearChatHistory();
            setMessages([{ id: 'intro', role: 'assistant', content: INTRO[contextLevel] }]);
          } catch (e) {
            Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo limpiar');
          }
        },
      },
    ]);
  };

  const ctxLabel = CONTEXT_LEVEL_LABELS[contextLevel]?.label ?? contextLevel;
  const atLimit = aiUsage ? aiUsage.remaining <= 0 : false;

  const startProCheckout = async () => {
    setUpgrading(true);
    try {
      const { url } = await billingApi.checkout();
      const { default: WebBrowser } = await import('expo-web-browser');
      await WebBrowser.openBrowserAsync(url);
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo abrir checkout');
    } finally {
      setUpgrading(false);
      setLimitModalOpen(false);
    }
  };

  if (bootLoading) {
    return (
      <View style={styles.boot}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.bootText}>Cargando mentor...</Text>
      </View>
    );
  }

  const listData = loading ? [...messages, { id: 'typing', role: 'assistant' as const, content: '' }] : messages;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
      <AILimitModal
        visible={limitModalOpen}
        onClose={() => setLimitModalOpen(false)}
        onUpgrade={() => void startProCheckout()}
        upgrading={upgrading}
      />
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Mentor IA</Text>
          <View style={[styles.badge, { borderColor: CONTEXT_COLORS[contextLevel] + '66' }]}>
            <View style={[styles.badgeDot, { backgroundColor: CONTEXT_COLORS[contextLevel] }]} />
            <Text style={[styles.badgeText, { color: CONTEXT_COLORS[contextLevel] }]}>{ctxLabel}</Text>
          </View>
        </View>
        <Pressable onPress={clearChat} style={styles.clearBtn} hitSlop={8}>
          <FontAwesome name="refresh" size={16} color={theme.colors.textMuted} />
          <Text style={styles.clearText}>Nueva</Text>
        </Pressable>
      </View>

      <MethodologyStrip module="ai" />

      <AIUsageBar
        usage={aiUsage}
        compact
        onUpgrade={() => router.push('/(tabs)/profile' as never)}
      />

      {insights.length > 0 ? (
        <Card style={styles.insightsCard}>
          <Text style={styles.insightsTitle}>✨ Insights del mentor</Text>
          {insights.map((ins) => (
            <View key={ins.id} style={styles.insightRow}>
              <Text style={styles.insightType}>{insightTypeLabel(ins.type)}</Text>
              <Text style={styles.insightMsg} numberOfLines={3}>
                {ins.message}
              </Text>
            </View>
          ))}
        </Card>
      ) : null}

      <FlatList
        ref={listRef}
        data={listData}
        keyExtractor={(item) => item.id}
        style={styles.messagesList}
        contentContainerStyle={styles.list}
        onContentSizeChange={() => listRef.current?.scrollToEnd()}
        renderItem={({ item }) => {
          if (item.id === 'typing') return <TypingIndicator />;
          const isUser = item.role === 'user';
          return (
            <View style={[styles.bubble, isUser ? styles.userBubble : styles.aiBubble]}>
              <Text style={styles.bubbleText}>{item.content}</Text>
              {item.createdAt ? (
                <Text style={styles.bubbleTime}>
                  {new Date(item.createdAt).toLocaleString('es', {
                    dateStyle: 'short',
                    timeStyle: 'short',
                  })}
                </Text>
              ) : null}
            </View>
          );
        }}
      />

      <View style={styles.footer}>
        <SuggestedPrompts prompts={suggestedPrompts} onSelect={(p) => void sendText(p)} disabled={loading || atLimit} />
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder={atLimit ? 'Límite alcanzado — activa Pro' : 'Escribe a tu mentor...'}
            placeholderTextColor={theme.colors.textMuted}
            editable={!loading && !atLimit}
            multiline
            maxLength={4000}
          />
          <Button title="↑" onPress={send} loading={loading} disabled={!input.trim() || atLimit} style={styles.sendBtn} />
        </View>
        <Text style={styles.disclaimer}>No sustituye asesoría profesional.</Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  boot: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background, gap: 12 },
  bootText: { color: theme.colors.textMuted },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.sm,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap', flex: 1 },
  headerTitle: { color: theme.colors.text, fontSize: 18, fontWeight: '700' },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  badgeDot: { width: 6, height: 6, borderRadius: 3 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  clearBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 8 },
  clearText: { color: theme.colors.textMuted, fontSize: 12 },
  insightsCard: {
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    maxHeight: 150,
  },
  insightsTitle: { color: theme.colors.text, fontSize: 14, fontWeight: '600', marginBottom: 8 },
  insightRow: {
    borderLeftWidth: 2,
    borderLeftColor: 'rgba(139, 92, 246, 0.5)',
    paddingLeft: 8,
    marginBottom: 8,
  },
  insightType: {
    color: theme.colors.primaryLight,
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  insightMsg: { color: theme.colors.textMuted, fontSize: 12, marginTop: 2, lineHeight: 17 },
  messagesList: { flex: 1 },
  list: { padding: theme.spacing.md, paddingBottom: 8 },
  bubble: {
    maxWidth: '88%',
    padding: 14,
    borderRadius: 16,
    marginBottom: 10,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: theme.colors.primary,
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderBottomLeftRadius: 4,
  },
  bubbleText: { color: theme.colors.text, fontSize: 15, lineHeight: 22 },
  bubbleTime: { color: theme.colors.textMuted, fontSize: 10, marginTop: 8 },
  typingRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  typingText: { color: theme.colors.textMuted, fontSize: 13 },
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
  sendBtn: { minWidth: 48, paddingHorizontal: 0 },
  disclaimer: { color: theme.colors.textMuted, fontSize: 10, textAlign: 'center', marginTop: 8 },
});

