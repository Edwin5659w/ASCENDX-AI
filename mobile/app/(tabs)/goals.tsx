import { useCallback, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { goalsApi } from '@/src/api/services';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import type { Goal } from '@/src/types/api';
import { theme } from '@/constants/theme';

const priorityColors = {
  LOW: theme.colors.textMuted,
  MEDIUM: theme.colors.accent,
  HIGH: theme.colors.danger,
};

export default function GoalsScreen() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    try {
      setGoals(await goalsApi.list());
    } catch {
      /* ignore */
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handleCreate = async () => {
    if (title.trim().length < 3) {
      Alert.alert('Error', 'El título debe tener al menos 3 caracteres');
      return;
    }
    setLoading(true);
    try {
      await goalsApi.create({ title: title.trim(), priority: 'MEDIUM' });
      setTitle('');
      await load();
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo crear');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert('Eliminar', '¿Eliminar este objetivo?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          await goalsApi.remove(id);
          load();
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.addRow}>
        <TextInput
          style={styles.input}
          placeholder="Nuevo objetivo..."
          placeholderTextColor={theme.colors.textMuted}
          value={title}
          onChangeText={setTitle}
        />
        <Button title="+" onPress={handleCreate} loading={loading} style={styles.addBtn} />
      </View>

      <FlatList
        data={goals}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>Sin objetivos. ¡Crea el primero!</Text>}
        renderItem={({ item }) => (
          <Pressable onLongPress={() => handleDelete(item.id)}>
            <Card style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <View style={[styles.badge, { backgroundColor: priorityColors[item.priority] + '33' }]}>
                  <Text style={[styles.badgeText, { color: priorityColors[item.priority] }]}>
                    {item.priority}
                  </Text>
                </View>
              </View>
              <View style={styles.progressBg}>
                <View style={[styles.progressFill, { width: `${item.progress}%` }]} />
              </View>
              <Text style={styles.progressLabel}>{item.progress}% completado</Text>
            </Card>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  addRow: {
    flexDirection: 'row',
    padding: theme.spacing.md,
    gap: 8,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: theme.radius.md,
    padding: 12,
    color: theme.colors.text,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  addBtn: { width: 52, paddingHorizontal: 0 },
  list: { padding: theme.spacing.md, paddingTop: 0, gap: 12 },
  card: { marginBottom: 12 },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: { fontSize: 10, fontWeight: '700' },
  progressBg: {
    height: 6,
    backgroundColor: theme.colors.surface,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: 3,
  },
  progressLabel: {
    color: theme.colors.textMuted,
    fontSize: 12,
    marginTop: 6,
  },
  empty: {
    color: theme.colors.textMuted,
    textAlign: 'center',
    marginTop: 40,
  },
});
