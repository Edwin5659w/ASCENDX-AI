import { useCallback, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { goalsApi, tasksApi } from '@/src/api/services';
import { Button } from '@/src/components/ui/Button';
import { EmptyState } from '@/src/components/EmptyState';
import { LoadMoreFooter } from '@/src/components/LoadMoreFooter';
import { XpBurst } from '@/src/components/XpBurst';
import { useAuth } from '@/src/context/AuthContext';
import { useToast } from '@/src/context/ToastContext';
import { usePaginatedList } from '@/src/hooks/usePaginatedList';
import { applyGamificationFeedback } from '@/src/lib/gamification-feedback';
import { celebrateHaptic } from '@/src/lib/haptics';
import { XP } from '../../../shared/retention';
import type { Goal, Task } from '@/src/types/api';
import { theme } from '@/constants/theme';

export default function TasksScreen() {
  const { refreshUser } = useAuth();
  const { showToast } = useToast();
  const fetchTasks = useCallback((page: number, limit: number) => tasksApi.list(page, limit), []);
  const { items: tasks, setItems: setTasks, loadingMore, hasMore, refresh, loadMore } =
    usePaginatedList<Task>(fetchTasks);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [title, setTitle] = useState('');
  const [goalId, setGoalId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editGoalId, setEditGoalId] = useState('');
  const [editDueDate, setEditDueDate] = useState('');
  const [burstTaskId, setBurstTaskId] = useState<string | null>(null);

  const loadGoals = useCallback(async () => {
    const goalList = await goalsApi.list();
    setGoals(Array.isArray(goalList) ? goalList : goalList.items);
  }, []);

  const reload = useCallback(async () => {
    await Promise.all([refresh(), loadGoals()]);
  }, [refresh, loadGoals]);

  useFocusEffect(useCallback(() => { void reload(); }, [reload]));

  const onRefresh = async () => {
    setRefreshing(true);
    await reload();
    setRefreshing(false);
  };

  const handleCreate = async () => {
    if (!title.trim()) return;
    setLoading(true);
    try {
      await tasksApi.create({
        title: title.trim(),
        goalId: goalId || undefined,
        dueDate: dueDate || undefined,
      });
      setTitle('');
      setGoalId('');
      setDueDate('');
      await reload();
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo crear');
    } finally {
      setLoading(false);
    }
  };

  const toggleTask = async (task: Task) => {
    const nextCompleted = !task.completed;
    const snapshot = task;

    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, completed: nextCompleted } : t)),
    );

    if (nextCompleted) {
      celebrateHaptic();
      setBurstTaskId(task.id);
    }

    try {
      const updated = await tasksApi.update(task.id, { completed: nextCompleted });
      setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, ...updated } : t)));
      if (nextCompleted) {
        applyGamificationFeedback(updated.gamification, showToast, refreshUser, {
          skipXpToast: true,
        });
      }
    } catch (e) {
      setTasks((prev) => prev.map((t) => (t.id === task.id ? snapshot : t)));
      setBurstTaskId((id) => (id === task.id ? null : id));
      Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo actualizar la tarea');
    }
  };

  const openEdit = (task: Task) => {
    setEditTask(task);
    setEditTitle(task.title);
    setEditGoalId(task.goalId ?? '');
    setEditDueDate(task.dueDate ? task.dueDate.slice(0, 10) : '');
  };

  const saveEdit = async () => {
    if (!editTask || !editTitle.trim()) return;
    try {
      await tasksApi.update(editTask.id, {
        title: editTitle.trim(),
        goalId: editGoalId || null,
        dueDate: editDueDate || undefined,
      });
      setEditTask(null);
      await reload();
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo guardar');
    }
  };

  const confirmDelete = (task: Task) => {
    Alert.alert('Eliminar tarea', 'Esta acción no se puede deshacer.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            await tasksApi.remove(task.id);
            setTasks((prev) => prev.filter((t) => t.id !== task.id));
          } catch (e) {
            Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo eliminar');
          }
        },
      },
    ]);
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
      {goals.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.goalPicker}>
          <Pressable
            style={[styles.chip, !goalId && styles.chipActive]}
            onPress={() => setGoalId('')}>
            <Text style={styles.chipText}>Sin objetivo</Text>
          </Pressable>
          {goals.map((g) => (
            <Pressable
              key={g.id}
              style={[styles.chip, goalId === g.id && styles.chipActive]}
              onPress={() => setGoalId(g.id)}>
              <Text style={styles.chipText} numberOfLines={1}>
                {g.title}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      )}
      <TextInput
        style={styles.dateInput}
        placeholder="Fecha límite AAAA-MM-DD (opcional)"
        placeholderTextColor={theme.colors.textMuted}
        value={dueDate}
        onChangeText={setDueDate}
      />

      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />}
        onEndReached={() => loadMore()}
        onEndReachedThreshold={0.3}
        ListFooterComponent={<LoadMoreFooter loading={loadingMore} />}
        ListEmptyComponent={
          <EmptyState
            icon="check-square-o"
            title="Sin tareas"
            description="Vincula tareas a objetivos y añade fecha para priorizar con la IA."
          />
        }
        renderItem={({ item }) => (
          <View style={styles.taskRow}>
            <XpBurst
              amount={XP.TASK_COMPLETE}
              visible={burstTaskId === item.id}
              onDone={() => setBurstTaskId((id) => (id === item.id ? null : id))}
            />
            <Pressable style={styles.taskMain} onPress={() => void toggleTask(item)}>
              <FontAwesome
                name={item.completed ? 'check-circle' : 'circle-o'}
                size={24}
                color={item.completed ? theme.colors.success : theme.colors.textMuted}
              />
              <View style={styles.taskContent}>
                <Text style={[styles.taskTitle, item.completed && styles.completed]}>
                  {item.title}
                </Text>
                {item.goal ? <Text style={styles.goalTag}>{item.goal.title}</Text> : null}
                {item.dueDate ? (
                  <Text style={styles.dueTag}>
                    📅 {new Date(item.dueDate).toLocaleDateString('es')}
                  </Text>
                ) : null}
              </View>
              {item.streakCount > 0 ? (
                <Text style={styles.streak}>🔥 {item.streakCount}</Text>
              ) : null}
            </Pressable>
            <Pressable onPress={() => openEdit(item)} hitSlop={10}>
              <FontAwesome name="pencil" size={18} color={theme.colors.textMuted} />
            </Pressable>
            <Pressable onPress={() => confirmDelete(item)} hitSlop={10}>
              <FontAwesome name="trash-o" size={20} color={theme.colors.textMuted} />
            </Pressable>
          </View>
        )}
      />

      <Modal visible={!!editTask} transparent animationType="fade">
        <View style={styles.modalBg}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Editar tarea</Text>
            <TextInput
              style={styles.input}
              value={editTitle}
              onChangeText={setEditTitle}
              placeholderTextColor={theme.colors.textMuted}
            />
            <ScrollView horizontal style={styles.goalPicker}>
              <Pressable
                style={[styles.chip, !editGoalId && styles.chipActive]}
                onPress={() => setEditGoalId('')}>
                <Text style={styles.chipText}>Sin objetivo</Text>
              </Pressable>
              {goals.map((g) => (
                <Pressable
                  key={g.id}
                  style={[styles.chip, editGoalId === g.id && styles.chipActive]}
                  onPress={() => setEditGoalId(g.id)}>
                  <Text style={styles.chipText}>{g.title}</Text>
                </Pressable>
              ))}
            </ScrollView>
            <TextInput
              style={styles.dateInput}
              placeholder="Fecha AAAA-MM-DD"
              placeholderTextColor={theme.colors.textMuted}
              value={editDueDate}
              onChangeText={setEditDueDate}
            />
            <View style={styles.modalActions}>
              <Button title="Cancelar" variant="ghost" onPress={() => setEditTask(null)} />
              <Button title="Guardar" onPress={saveEdit} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  addRow: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.sm,
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
  dateInput: {
    marginHorizontal: theme.spacing.md,
    marginBottom: 8,
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: theme.radius.md,
    padding: 10,
    color: theme.colors.text,
    borderWidth: 1,
    borderColor: theme.colors.border,
    fontSize: 13,
  },
  addBtn: { width: 52, paddingHorizontal: 0 },
  goalPicker: {
    paddingHorizontal: theme.spacing.md,
    marginBottom: 8,
    maxHeight: 40,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: theme.colors.surfaceLight,
    marginRight: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  chipActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + '22',
  },
  chipText: { color: theme.colors.text, fontSize: 12, maxWidth: 140 },
  list: { padding: theme.spacing.md, paddingTop: 0 },
  taskRow: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    overflow: 'visible',
  },
  taskMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  taskContent: { flex: 1 },
  taskTitle: { color: theme.colors.text, fontSize: 16 },
  completed: {
    textDecorationLine: 'line-through',
    color: theme.colors.textMuted,
  },
  goalTag: { color: theme.colors.primaryLight, fontSize: 12, marginTop: 2 },
  dueTag: { color: theme.colors.textMuted, fontSize: 11, marginTop: 2 },
  streak: { fontSize: 12, color: theme.colors.warning },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    padding: 24,
  },
  modalBox: {
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: theme.radius.lg,
    padding: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  modalTitle: { color: theme.colors.text, fontSize: 18, fontWeight: '700', marginBottom: 12 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 12 },
});
