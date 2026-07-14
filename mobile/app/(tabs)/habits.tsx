import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { habitsApi, userApi } from '@/src/api/services';
import { formatApiError } from '@/src/api/client';
import { Button } from '@/src/components/ui/Button';
import { EmptyState } from '@/src/components/EmptyState';
import { HabitWeekStrip } from '@/src/components/HabitWeekStrip';
import { LoadMoreFooter } from '@/src/components/LoadMoreFooter';
import { PlanUsageBar } from '@/src/components/PlanUsageBar';
import { MethodologyStrip } from '@/src/components/MethodologyStrip';
import { syncHabitReminders } from '@/src/lib/habit-reminders';
import { ensureNotificationPermission } from '@/src/lib/notifications';
import { useAuth } from '@/src/context/AuthContext';
import { useToast } from '@/src/context/ToastContext';
import { usePaginatedList } from '@/src/hooks/usePaginatedList';
import { useThrottledFocusEffect } from '@/src/hooks/useThrottledFocusEffect';
import { applyGamificationFeedback } from '@/src/lib/gamification-feedback';
import { celebrateHaptic } from '@/src/lib/haptics';
import { XpBurst } from '@/src/components/XpBurst';
import { XP } from '../../../shared/retention';
import type { Habit, PlanUsage } from '@/src/types/api';
import { theme } from '@/constants/theme';
function streakBadge(milestone: number | null | undefined, streak: number) {
  if (milestone === 30) return '🏆 Leyenda';
  if (milestone === 21) return '⭐ 3 semanas';
  if (milestone === 7) return '🔥 1 semana';
  if (milestone === 3) return '✨ En marcha';
  return `🔥 ${streak}`;
}

export default function HabitsScreen() {
  const { refreshUser } = useAuth();
  const { showToast } = useToast();
  const fetchHabits = useCallback((page: number, limit: number) => habitsApi.list(page, limit), []);
  const { items: habits, setItems: setHabits, loading: listLoading, loadingMore, hasMore, error, refresh, loadMore } =
    usePaginatedList<Habit>(fetchHabits);
  const [planUsage, setPlanUsage] = useState<PlanUsage | null>(null);
  const [name, setName] = useState('');
  const [frequency, setFrequency] = useState<'DAILY' | 'WEEKLY'>('DAILY');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [renameFor, setRenameFor] = useState<Habit | null>(null);
  const [renameText, setRenameText] = useState('');
  const [reminderFor, setReminderFor] = useState<Habit | null>(null);
  const [reminderHour, setReminderHour] = useState('8');
  const [reminderMinute, setReminderMinute] = useState('0');
  const [burstHabitId, setBurstHabitId] = useState<string | null>(null);

  const reload = useCallback(async () => {
    await refresh();
    try {
      setPlanUsage(await userApi.plan());
    } catch {
      /* ignore */
    }
  }, [refresh]);

  useThrottledFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload]),
  );

  useEffect(() => {
    void syncHabitReminders(habits);
  }, [habits]);

  const stats = useMemo(() => {
    const doneToday = habits.filter((h) => h.completedToday).length;
    const bestStreak = habits.reduce((m, h) => Math.max(m, h.streak), 0);
    const avgWeek =
      habits.length > 0
        ? Math.round(
            habits.reduce((s, h) => s + (h.weekCompletionRate ?? 0), 0) / habits.length,
          )
        : 0;
    return { doneToday, bestStreak, avgWeek, total: habits.length };
  }, [habits]);

  const onRefresh = async () => {
    setRefreshing(true);
    await reload();
    setRefreshing(false);
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert('Nombre requerido', 'Escribe el nombre del hábito');
      return;
    }
    setLoading(true);
    try {
      await habitsApi.create({ name: name.trim(), frequency });
      setName('');
      await reload();
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo crear');
    } finally {
      setLoading(false);
    }
  };

  const complete = async (habit: Habit) => {
    if (habit.completedToday) {
      Alert.alert('Listo', habit.frequency === 'WEEKLY' ? 'Ya completaste este hábito esta semana' : 'Ya completaste este hábito hoy');
      return;
    }
    const snapshot = habit;
    setHabits((prev) =>
      prev.map((h) => (h.id === habit.id ? { ...h, completedToday: true } : h)),
    );
    celebrateHaptic();
    setBurstHabitId(habit.id);

    try {
      const updated = await habitsApi.complete(habit.id);
      setHabits((prev) => prev.map((h) => (h.id === habit.id ? { ...h, ...updated } : h)));
      applyGamificationFeedback(updated.gamification, showToast, refreshUser, {
        skipXpToast: true,
      });
    } catch (e) {
      setHabits((prev) => prev.map((h) => (h.id === habit.id ? snapshot : h)));
      setBurstHabitId((id) => (id === habit.id ? null : id));
      Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo completar');
    }
  };

  const openRename = (habit: Habit) => {
    setRenameFor(habit);
    setRenameText(habit.name);
  };

  const saveRename = async () => {
    if (!renameFor || !renameText.trim()) return;
    try {
      await habitsApi.update(renameFor.id, { name: renameText.trim() });
      setRenameFor(null);
      await reload();
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo renombrar');
    }
  };

  const openReminder = (habit: Habit) => {
    setReminderFor(habit);
    setReminderHour(String(habit.reminderHour ?? 8));
    setReminderMinute(String(habit.reminderMinute ?? 0));
  };

  const saveReminder = async (enabled: boolean) => {
    if (!reminderFor) return;
    const h = parseInt(reminderHour, 10);
    const m = parseInt(reminderMinute, 10);
    if (enabled && (Number.isNaN(h) || h < 0 || h > 23 || Number.isNaN(m) || m < 0 || m > 59)) {
      Alert.alert('Hora inválida', 'Usa hora 0-23 y minutos 0-59');
      return;
    }
    try {
      if (enabled) {
        const granted = await ensureNotificationPermission();
        if (!granted) {
          Alert.alert(
            'Permisos necesarios',
            'Activa las notificaciones para ASCENDX en Ajustes del teléfono para recibir recordatorios.',
          );
          return;
        }
      }
      const updated = await habitsApi.update(reminderFor.id, {
        reminderEnabled: enabled,
        reminderHour: enabled ? h : null,
        reminderMinute: enabled ? m : null,
      });
      setReminderFor(null);
      const nextHabits = habits.map((item) => (item.id === updated.id ? { ...item, ...updated } : item));
      setHabits(nextHabits);
      const sync = await syncHabitReminders(nextHabits, { requestPermission: enabled });
      if (enabled) {
        if (sync.granted && sync.scheduled > 0) {
          Alert.alert(
            'Recordatorio activo',
            `Te avisaremos a las ${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')} cada día.`,
          );
        } else if (!sync.granted) {
          Alert.alert('Sin permiso', 'Se guardó la preferencia, pero no hay permiso de notificaciones.');
        } else {
          Alert.alert('Guardado', 'Preferencia guardada.');
        }
      }
    } catch (e) {
      Alert.alert('Error', formatApiError(e));
    }
  };

  const remove = (habit: Habit) => {
    Alert.alert('Eliminar hábito', `¿Eliminar "${habit.name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            await habitsApi.remove(habit.id);
            await reload();
          } catch (e) {
            Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo eliminar');
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <MethodologyStrip module="habits" />
      <PlanUsageBar usage={planUsage} metric="habits" />
      {stats.total > 0 ? (
        <View style={styles.statsBar}>
          <View style={styles.stat}>
            <Text style={styles.statNum}>{stats.doneToday}/{stats.total}</Text>
            <Text style={styles.statLbl}>Hoy</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statNum}>{stats.bestStreak}</Text>
            <Text style={styles.statLbl}>Mejor racha</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statNum}>{stats.avgWeek}%</Text>
            <Text style={styles.statLbl}>Semana media</Text>
          </View>
        </View>
      ) : null}
      <View style={styles.addSection}>
        <View style={styles.freqRow}>
          <Button
            title="Diario"
            variant={frequency === 'DAILY' ? 'primary' : 'secondary'}
            onPress={() => setFrequency('DAILY')}
            style={styles.freqBtn}
          />
          <Button
            title="Semanal"
            variant={frequency === 'WEEKLY' ? 'primary' : 'secondary'}
            onPress={() => setFrequency('WEEKLY')}
            style={styles.freqBtn}
          />
        </View>
        <View style={styles.addRow}>
          <TextInput
            style={styles.input}
            placeholder="Nuevo hábito..."
            placeholderTextColor={theme.colors.textMuted}
            value={name}
            onChangeText={setName}
            onSubmitEditing={handleCreate}
          />
          <Button title="+" onPress={handleCreate} loading={loading} style={styles.addBtn} />
        </View>
      </View>

      <FlatList
        data={habits}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />}
        ListEmptyComponent={
          listLoading ? (
            <ActivityIndicator style={{ marginTop: 40 }} color={theme.colors.primary} />
          ) : error ? (
            <EmptyState
              icon="exclamation-circle"
              title="No se pudo cargar"
              description={error}
            />
          ) : (
            <EmptyState
              icon="fire"
              title="Sin hábitos"
              description="Crea un hábito diario y marca tu racha."
            />
          )
        }
        onEndReached={() => loadMore()}
        onEndReachedThreshold={0.3}
        ListFooterComponent={<LoadMoreFooter loading={loadingMore} />}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <XpBurst
              amount={XP.HABIT_COMPLETE}
              visible={burstHabitId === item.id}
              onDone={() => setBurstHabitId((id) => (id === item.id ? null : id))}
            />
            <View style={styles.row}>
              <Pressable style={styles.rowMain} onPress={() => void complete(item)}>
                <FontAwesome
                  name={item.completedToday ? 'check-circle' : 'circle-o'}
                  size={24}
                  color={item.completedToday ? theme.colors.success : theme.colors.textMuted}
                />
                <View style={styles.content}>
                  <Text style={styles.title}>{item.name}</Text>
                  <Text style={styles.freq}>{item.frequency === 'DAILY' ? 'Diario' : 'Semanal'}</Text>
                </View>
                <Text style={styles.streak}>{streakBadge(item.streakMilestone, item.streak)}</Text>
              </Pressable>
              <Pressable onPress={() => openReminder(item)} hitSlop={8}>
                <FontAwesome
                  name="bell"
                  size={18}
                  color={item.reminderEnabled ? theme.colors.primaryLight : theme.colors.textMuted}
                />
              </Pressable>
              <Pressable onPress={() => openRename(item)} hitSlop={8}>
                <FontAwesome name="edit" size={18} color={theme.colors.textMuted} />
              </Pressable>
              <Pressable onPress={() => remove(item)} hitSlop={8}>
                <FontAwesome name="trash-o" size={20} color={theme.colors.textMuted} />
              </Pressable>
            </View>
            <HabitWeekStrip weekHistory={item.weekHistory} weekCompletionRate={item.weekCompletionRate} />
          </View>
        )}
      />

      <Modal visible={!!renameFor} transparent animationType="fade">
        <Pressable style={styles.modalBackdrop} onPress={() => setRenameFor(null)}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Renombrar hábito</Text>
            <TextInput
              style={styles.input}
              value={renameText}
              onChangeText={setRenameText}
              placeholder="Nombre"
              placeholderTextColor={theme.colors.textMuted}
              autoFocus
            />
            <View style={styles.modalActions}>
              <Button title="Cancelar" variant="secondary" onPress={() => setRenameFor(null)} style={styles.modalBtn} />
              <Button title="Guardar" onPress={() => void saveRename()} style={styles.modalBtn} />
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={!!reminderFor} transparent animationType="fade">
        <Pressable style={styles.modalBackdrop} onPress={() => setReminderFor(null)}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Recordatorio diario</Text>
            <Text style={styles.modalHint}>
              Notificación local diaria a la hora de tu dispositivo. Pediremos permiso al activar.
            </Text>
            <View style={styles.timeRow}>
              <TextInput
                style={[styles.input, styles.timeInput]}
                value={reminderHour}
                onChangeText={setReminderHour}
                keyboardType="number-pad"
                placeholder="Hora"
                placeholderTextColor={theme.colors.textMuted}
              />
              <Text style={styles.timeSep}>:</Text>
              <TextInput
                style={[styles.input, styles.timeInput]}
                value={reminderMinute}
                onChangeText={setReminderMinute}
                keyboardType="number-pad"
                placeholder="Min"
                placeholderTextColor={theme.colors.textMuted}
              />
            </View>
            <View style={styles.modalActions}>
              <Button title="Desactivar" variant="secondary" onPress={() => void saveReminder(false)} style={styles.modalBtn} />
              <Button title="Activar" onPress={() => void saveReminder(true)} style={styles.modalBtn} />
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  statsBar: {
    flexDirection: 'row',
    marginHorizontal: theme.spacing.md,
    marginTop: theme.spacing.sm,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  stat: { flex: 1, alignItems: 'center' },
  statNum: { color: theme.colors.text, fontSize: 18, fontWeight: '700' },
  statLbl: { color: theme.colors.textMuted, fontSize: 11, marginTop: 2 },
  addSection: {
    padding: theme.spacing.md,
    paddingBottom: 0,
    gap: 8,
  },
  freqRow: { flexDirection: 'row', gap: 8 },
  freqBtn: { flex: 1 },
  addRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
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
  list: { padding: theme.spacing.md, paddingTop: 8 },
  card: {
    position: 'relative',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    overflow: 'visible',
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  rowMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  content: { flex: 1 },
  title: { color: theme.colors.text, fontSize: 16 },
  freq: { color: theme.colors.textMuted, fontSize: 12, marginTop: 2 },
  streak: { fontSize: 13, color: theme.colors.warning, maxWidth: 100, textAlign: 'right' },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  modalCard: {
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  modalTitle: { color: theme.colors.text, fontSize: 18, fontWeight: '600', marginBottom: theme.spacing.md },
  modalHint: { color: theme.colors.textMuted, fontSize: 12, marginBottom: 12 },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  timeInput: { flex: 1, textAlign: 'center' },
  timeSep: { color: theme.colors.text, fontSize: 20 },
  modalActions: { flexDirection: 'row', gap: 8, marginTop: theme.spacing.md },
  modalBtn: { flex: 1 },
});
