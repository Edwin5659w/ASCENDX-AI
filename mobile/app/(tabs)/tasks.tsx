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
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { tasksApi } from '@/src/api/services';
import { Button } from '@/src/components/ui/Button';
import type { Task } from '@/src/types/api';
import { theme } from '@/constants/theme';

export default function TasksScreen() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    try {
      setTasks(await tasksApi.list());
    } catch {
      /* ignore */
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handleCreate = async () => {
    if (!title.trim()) return;
    setLoading(true);
    try {
      await tasksApi.create({ title: title.trim() });
      setTitle('');
      await load();
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo crear');
    } finally {
      setLoading(false);
    }
  };

  const toggleTask = async (task: Task) => {
    await tasksApi.update(task.id, { completed: !task.completed });
    load();
  };

  return (
    <View style={styles.container}>
      <View style={styles.addRow}>
        <TextInput
          style={styles.input}
          placeholder="Nueva tarea..."
          placeholderTextColor={theme.colors.textMuted}
          value={title}
          onChangeText={setTitle}
          onSubmitEditing={handleCreate}
        />
        <Button title="+" onPress={handleCreate} loading={loading} style={styles.addBtn} />
      </View>

      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>Sin tareas pendientes</Text>}
        renderItem={({ item }) => (
          <Pressable style={styles.taskRow} onPress={() => toggleTask(item)}>
            <FontAwesome
              name={item.completed ? 'check-circle' : 'circle-o'}
              size={24}
              color={item.completed ? theme.colors.success : theme.colors.textMuted}
            />
            <View style={styles.taskContent}>
              <Text style={[styles.taskTitle, item.completed && styles.completed]}>
                {item.title}
              </Text>
              {item.goal && (
                <Text style={styles.goalTag}>{item.goal.title}</Text>
              )}
            </View>
            {item.streakCount > 0 && (
              <Text style={styles.streak}>🔥 {item.streakCount}</Text>
            )}
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
  list: { padding: theme.spacing.md, paddingTop: 0 },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  taskContent: { flex: 1 },
  taskTitle: {
    color: theme.colors.text,
    fontSize: 16,
  },
  completed: {
    textDecorationLine: 'line-through',
    color: theme.colors.textMuted,
  },
  goalTag: {
    color: theme.colors.primaryLight,
    fontSize: 12,
    marginTop: 2,
  },
  streak: { fontSize: 12, color: theme.colors.warning },
  empty: {
    color: theme.colors.textMuted,
    textAlign: 'center',
    marginTop: 40,
  },
});
