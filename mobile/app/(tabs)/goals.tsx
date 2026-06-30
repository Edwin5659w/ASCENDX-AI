import { useCallback, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { goalsApi, userApi } from '@/src/api/services';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { EmptyState } from '@/src/components/EmptyState';
import { PlanUsageBar } from '@/src/components/PlanUsageBar';
import { MethodologyStrip } from '@/src/components/MethodologyStrip';
import type { Goal, PlanUsage } from '@/src/types/api';
import { theme } from '@/constants/theme';

const priorityColors = {
  LOW: theme.colors.textMuted,
  MEDIUM: theme.colors.accent,
  HIGH: theme.colors.danger,
};

export default function GoalsScreen() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [planUsage, setPlanUsage] = useState<PlanUsage | null>(null);
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM');
  const [loading, setLoading] = useState(false);
  const [editGoal, setEditGoal] = useState<Goal | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editPriority, setEditPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM');
  const [editDeadline, setEditDeadline] = useState('');

  const load = useCallback(async () => {
    try {
      const [list, usage] = await Promise.all([goalsApi.list(), userApi.plan()]);
      setGoals(list);
      setPlanUsage(usage);
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'No se pudieron cargar los objetivos');
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
      await goalsApi.create({ title: title.trim(), priority });
      setTitle('');
      await load();
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo crear');
    } finally {
      setLoading(false);
    }
  };

  const openEdit = (g: Goal) => {
    setEditGoal(g);
    setEditTitle(g.title);
    setEditPriority(g.priority);
    setEditDeadline(g.deadline ? g.deadline.slice(0, 10) : '');
  };

  const saveEdit = async () => {
    if (!editGoal || editTitle.trim().length < 3) return;
    try {
      await goalsApi.update(editGoal.id, {
        title: editTitle.trim(),
        priority: editPriority,
        deadline: editDeadline || undefined,
      });
      setEditGoal(null);
      await load();
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo guardar');
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert('Eliminar', '¿Eliminar este objetivo?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            await goalsApi.remove(id);
            await load();
          } catch (e) {
            Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo eliminar');
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <MethodologyStrip module="goals" />
      <PlanUsageBar usage={planUsage} metric="goals" />
      <View style={styles.addRow}>
        <TextInput
          style={styles.input}
          placeholder="Nuevo objetivo (SMART)..."
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
        ListEmptyComponent={
          <EmptyState
            icon="bullseye"
            title="Sin objetivos"
            description="Crea tu primera meta SMART y vincula tareas."
          />
        }
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <View style={styles.cardActions}>
                <View style={[styles.badge, { backgroundColor: priorityColors[item.priority] + '33' }]}>
                  <Text style={[styles.badgeText, { color: priorityColors[item.priority] }]}>
                    {item.priority}
                  </Text>
                </View>
                <Pressable onPress={() => openEdit(item)} hitSlop={10}>
                  <FontAwesome name="pencil" size={18} color={theme.colors.textMuted} />
                </Pressable>
                <Pressable onPress={() => handleDelete(item.id)} hitSlop={10}>
                  <FontAwesome name="trash-o" size={18} color={theme.colors.textMuted} />
                </Pressable>
              </View>
            </View>
            <View style={styles.progressBg}>
              <View style={[styles.progressFill, { width: `${item.progress}%` }]} />
            </View>
            <Text style={styles.progressLabel}>
              {item.progress}% · {item.deadline ? `📅 ${new Date(item.deadline).toLocaleDateString('es')}` : 'Sin fecha límite'}
            </Text>
          </Card>
        )}
      />

      <Modal visible={!!editGoal} transparent animationType="fade">
        <View style={styles.modalBg}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Editar objetivo</Text>
            <TextInput
              style={styles.input}
              value={editTitle}
              onChangeText={setEditTitle}
              placeholderTextColor={theme.colors.textMuted}
            />
            <View style={styles.priorityRow}>
              {(['LOW', 'MEDIUM', 'HIGH'] as const).map((p) => (
                <Pressable
                  key={p}
                  style={[styles.chip, editPriority === p && styles.chipActive]}
                  onPress={() => setEditPriority(p)}>
                  <Text style={styles.chipText}>{p}</Text>
                </Pressable>
              ))}
            </View>
            <TextInput
              style={styles.input}
              placeholder="Fecha límite AAAA-MM-DD"
              placeholderTextColor={theme.colors.textMuted}
              value={editDeadline}
              onChangeText={setEditDeadline}
            />
            <View style={styles.modalActions}>
              <Button title="Cancelar" variant="ghost" onPress={() => setEditGoal(null)} />
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
    marginBottom: 8,
  },
  addBtn: { width: 52, paddingHorizontal: 0 },
  list: { padding: theme.spacing.md, paddingTop: 0, gap: 12 },
  card: { marginBottom: 12 },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 8,
  },
  cardActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cardTitle: { color: theme.colors.text, fontSize: 16, fontWeight: '600', flex: 1 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
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
  progressLabel: { color: theme.colors.textMuted, fontSize: 12, marginTop: 6 },
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
  priorityRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  chipActive: { borderColor: theme.colors.primary, backgroundColor: theme.colors.primary + '22' },
  chipText: { color: theme.colors.text, fontSize: 11 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 8 },
});

