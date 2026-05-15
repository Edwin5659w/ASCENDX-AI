import { useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { aiApi } from '@/src/api/services';
import { Button } from '@/src/components/ui/Button';
import type { ChatMessage } from '@/src/types/api';
import { theme } from '@/constants/theme';

export default function ChatScreen() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '0',
      role: 'assistant',
      content: 'Hola, soy tu mentor ASCENDX. ¿En qué puedo ayudarte hoy?',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const listRef = useRef<FlatList>(null);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const { reply } = await aiApi.chat(text);
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
  };

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
            style={[
              styles.bubble,
              item.role === 'user' ? styles.userBubble : styles.aiBubble,
            ]}>
            <Text style={styles.bubbleText}>{item.content}</Text>
          </View>
        )}
      />

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Escribe a tu mentor..."
          placeholderTextColor={theme.colors.textMuted}
          value={input}
          onChangeText={setInput}
          multiline
        />
        <Button title="→" onPress={send} loading={loading} style={styles.sendBtn} />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  list: { padding: theme.spacing.md, paddingBottom: 8 },
  bubble: {
    maxWidth: '85%',
    padding: 14,
    borderRadius: theme.radius.lg,
    marginBottom: 10,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: theme.colors.primary,
  },
  aiBubble: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.surfaceLight,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  bubbleText: {
    color: theme.colors.text,
    lineHeight: 20,
    fontSize: 15,
  },
  inputRow: {
    flexDirection: 'row',
    padding: theme.spacing.md,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: theme.radius.md,
    padding: 12,
    color: theme.colors.text,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  sendBtn: { width: 52, paddingHorizontal: 0 },
});
