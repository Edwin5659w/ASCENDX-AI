import { useCallback, useEffect, useState } from 'react';
import { Modal, Pressable, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { userApi } from '@/src/api/services';
import type { AppTheme } from '@/constants/theme';
import { useAppTheme } from '@/src/context/AppThemeContext';
import { useThemedStyles } from '@/src/hooks/useThemedStyles';

interface QuickSearchModalProps {
  visible: boolean;
  onClose: () => void;
}

function createStyles(theme: AppTheme) {
  return {
    sheet: { flex: 1, backgroundColor: theme.colors.background, paddingTop: 56, paddingHorizontal: 16 },
    header: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 10, marginBottom: 16 },
    input: { flex: 1, color: theme.colors.text, fontSize: 16, paddingVertical: 10 },
    cancel: { color: theme.colors.accent, fontWeight: '600' as const },
    hint: { color: theme.colors.textMuted, fontSize: 14, marginTop: 8 },
    row: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
    rowTitle: { color: theme.colors.text, fontWeight: '600' as const },
  };
}

export function QuickSearchModal({ visible, onClose }: QuickSearchModalProps) {
  const router = useRouter();
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const [q, setQ] = useState('');
  const [results, setResults] = useState<{
    goals: { id: string; title: string }[];
    tasks: { id: string; title: string; completed: boolean }[];
    habits: { id: string; name: string }[];
  } | null>(null);

  const search = useCallback(async (term: string) => {
    if (term.trim().length < 2) {
      setResults(null);
      return;
    }
    try {
      setResults(await userApi.search(term.trim()));
    } catch {
      setResults({ goals: [], tasks: [], habits: [] });
    }
  }, []);

  useEffect(() => {
    if (!visible) return;
    const id = setTimeout(() => void search(q), 250);
    return () => clearTimeout(id);
  }, [q, visible, search]);

  const go = (path: string) => {
    onClose();
    setQ('');
    router.push(path as never);
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.sheet}>
        <View style={styles.header}>
          <FontAwesome name="search" size={18} color={theme.colors.textMuted} />
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder="Buscar objetivos, tareas, hábitos..."
            placeholderTextColor={theme.colors.textMuted}
            style={styles.input}
            autoFocus
          />
          <Pressable onPress={onClose}>
            <Text style={styles.cancel}>Cerrar</Text>
          </Pressable>
        </View>
        {!results ? (
          <Text style={styles.hint}>Escribe al menos 2 caracteres</Text>
        ) : (
          <>
            {results.goals.map((g) => (
              <Pressable key={g.id} style={styles.row} onPress={() => go('/(tabs)/goals')}>
                <Text style={styles.rowTitle}>🎯 {g.title}</Text>
              </Pressable>
            ))}
            {results.tasks.map((t) => (
              <Pressable key={t.id} style={styles.row} onPress={() => go('/(tabs)/tasks')}>
                <Text style={styles.rowTitle}>
                  {t.completed ? '✓' : '○'} {t.title}
                </Text>
              </Pressable>
            ))}
            {results.habits.map((h) => (
              <Pressable key={h.id} style={styles.row} onPress={() => go('/(tabs)/habits')}>
                <Text style={styles.rowTitle}>🔥 {h.name}</Text>
              </Pressable>
            ))}
            {results.goals.length + results.tasks.length + results.habits.length === 0 ? (
              <Text style={styles.hint}>Sin resultados</Text>
            ) : null}
          </>
        )}
      </View>
    </Modal>
  );
}
