import { useCallback, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { habitsApi } from '@/src/api/services';
import { Button } from '@/src/components/ui/Button';
import type { Habit } from '@/src/types/api';
import { theme } from '@/constants/theme';

export default function HabitsScreen() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      setHabits(await habitsApi.list());
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'No se pudieron cargar hábitos');
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const handleCreate = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      await habitsApi.create({ name: name.trim(), frequency: 'DAILY' });
      setName('');
      await load();
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo crear');
    } finally {
      setLoading(false);
    }
  };

  const complete = async (habit: Habit) => {
    if (habit.completedToday) {
      Alert.alert('Listo', 'Ya completaste este hábito hoy');
      return;
    }
    try {
      await habitsApi.complete(habit.id);
      Alert.alert('¡Bien!', 'Hábito completado. +15 XP');
      await load();
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo completar');
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

      <FlatList
        data={habits}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />}
        ListEmptyComponent={<Text style={styles.empty}>Sin hábitos. ¡Crea el primero!</Text>}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Pressable style={styles.rowMain} onPress={() => complete(item)}>
              <FontAwesome
                name={item.completedToday ? 'check-circle' : 'circle-o'}
                size={24}
                color={item.completedToday ? theme.colors.success : theme.colors.textMuted}
              />
              <View style={styles.content}>
                <Text style={styles.title}>{item.name}</Text>
                <Text style={styles.freq}>{item.frequency === 'DAILY' ? 'Diario' : 'Semanal'}</Text>
              </View>
              <Text style={styles.streak}>🔥 {item.streak}</Text>
            </Pressable>
            <Pressable onPress={() => remove(item)} hitSlop={8}>
              <FontAwesome name="trash-o" size={20} color={theme.colors.textMuted} />
            </Pressable>
          </View>
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  rowMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  content: { flex: 1 },
  title: { color: theme.colors.text, fontSize: 16 },
  freq: { color: theme.colors.textMuted, fontSize: 12, marginTop: 2 },
  streak: { fontSize: 14, color: theme.colors.warning },
  empty: { color: theme.colors.textMuted, textAlign: 'center', marginTop: 40 },
});
