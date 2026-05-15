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
import { financeApi } from '@/src/api/services';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import type { FinanceRecord, FinanceSummary } from '@/src/types/api';
import { theme } from '@/constants/theme';

export default function FinanceScreen() {
  const [records, setRecords] = useState<FinanceRecord[]>([]);
  const [summary, setSummary] = useState<FinanceSummary | null>(null);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [type, setType] = useState<'INCOME' | 'EXPENSE'>('EXPENSE');
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<FinanceRecord | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editType, setEditType] = useState<'INCOME' | 'EXPENSE'>('EXPENSE');

  const load = useCallback(async () => {
    try {
      const [list, sum] = await Promise.all([financeApi.list(), financeApi.summary()]);
      setRecords(list);
      setSummary(sum);
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'No se pudieron cargar los datos');
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handleAdd = async () => {
    const num = parseFloat(amount);
    if (!num || num <= 0 || !category.trim()) {
      Alert.alert('Error', 'Monto y categoría son obligatorios');
      return;
    }
    setLoading(true);
    try {
      await financeApi.create({ type, amount: num, category: category.trim() });
      setAmount('');
      setCategory('');
      await load();
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo guardar');
    } finally {
      setLoading(false);
    }
  };

  const openEdit = (r: FinanceRecord) => {
    setEditing(r);
    setEditAmount(String(r.amount));
    setEditCategory(r.category);
    setEditType(r.type);
  };

  const saveEdit = async () => {
    if (!editing) return;
    const num = parseFloat(editAmount);
    if (!num || num <= 0 || !editCategory.trim()) {
      Alert.alert('Error', 'Monto y categoría válidos, por favor');
      return;
    }
    try {
      await financeApi.update(editing.id, { type: editType, amount: num, category: editCategory.trim() });
      setEditing(null);
      await load();
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo actualizar');
    }
  };

  const confirmRemove = (r: FinanceRecord) => {
    Alert.alert('Eliminar', `¿Quitar "${r.category}" ($${r.amount})?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            await financeApi.remove(r.id);
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
      <View style={styles.summaryRow}>
        <Card style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Ingresos</Text>
          <Text style={[styles.summaryValue, { color: theme.colors.income }]}>
            +${summary?.income ?? 0}
          </Text>
        </Card>
        <Card style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Gastos</Text>
          <Text style={[styles.summaryValue, { color: theme.colors.expense }]}>
            -${summary?.expense ?? 0}
          </Text>
        </Card>
      </View>
      <Card style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Balance</Text>
        <Text style={styles.balanceValue}>${summary?.balance ?? 0}</Text>
      </Card>

      <View style={styles.form}>
        <View style={styles.typeRow}>
          <Button
            title="Gasto"
            variant={type === 'EXPENSE' ? 'primary' : 'secondary'}
            onPress={() => setType('EXPENSE')}
            style={styles.typeBtn}
          />
          <Button
            title="Ingreso"
            variant={type === 'INCOME' ? 'primary' : 'secondary'}
            onPress={() => setType('INCOME')}
            style={styles.typeBtn}
          />
        </View>
        <TextInput
          style={styles.input}
          placeholder="Monto"
          placeholderTextColor={theme.colors.textMuted}
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
        />
        <TextInput
          style={styles.input}
          placeholder="Categoría (ej. Comida)"
          placeholderTextColor={theme.colors.textMuted}
          value={category}
          onChangeText={setCategory}
        />
        <Button title="Registrar" onPress={handleAdd} loading={loading} />
      </View>

      <FlatList
        data={records}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.recordRow}>
            <Pressable style={styles.recordMain} onPress={() => openEdit(item)}>
              <View>
                <Text style={styles.recordCat}>{item.category}</Text>
                <Text style={styles.recordDate}>
                  {new Date(item.createdAt).toLocaleDateString('es')}
                </Text>
              </View>
              <Text
                style={[
                  styles.recordAmount,
                  { color: item.type === 'INCOME' ? theme.colors.income : theme.colors.expense },
                ]}>
                {item.type === 'INCOME' ? '+' : '-'}${item.amount}
              </Text>
            </Pressable>
            <Pressable onPress={() => confirmRemove(item)} hitSlop={10} accessibilityLabel="Eliminar movimiento">
              <FontAwesome name="trash-o" size={20} color={theme.colors.textMuted} />
            </Pressable>
          </View>
        )}
      />
      <Modal visible={!!editing} transparent animationType="fade">
        <Pressable style={styles.modalBackdrop} onPress={() => setEditing(null)}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Editar movimiento</Text>
            <View style={styles.typeRow}>
              <Button
                title="Gasto"
                variant={editType === 'EXPENSE' ? 'primary' : 'secondary'}
                onPress={() => setEditType('EXPENSE')}
                style={styles.typeBtn}
              />
              <Button
                title="Ingreso"
                variant={editType === 'INCOME' ? 'primary' : 'secondary'}
                onPress={() => setEditType('INCOME')}
                style={styles.typeBtn}
              />
            </View>
            <TextInput
              style={styles.input}
              value={editAmount}
              onChangeText={setEditAmount}
              placeholder="Monto"
              placeholderTextColor={theme.colors.textMuted}
              keyboardType="decimal-pad"
            />
            <TextInput
              style={styles.input}
              value={editCategory}
              onChangeText={setEditCategory}
              placeholder="Categoría"
              placeholderTextColor={theme.colors.textMuted}
            />
            <View style={styles.modalActions}>
              <Button title="Cancelar" variant="secondary" onPress={() => setEditing(null)} style={styles.modalBtn} />
              <Button title="Guardar" onPress={() => void saveEdit()} style={styles.modalBtn} />
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
    padding: theme.spacing.md,
    paddingBottom: 0,
  },
  summaryCard: { flex: 1 },
  summaryLabel: { color: theme.colors.textMuted, fontSize: 12 },
  summaryValue: { fontSize: 20, fontWeight: '700', marginTop: 4 },
  balanceCard: { margin: theme.spacing.md, marginTop: 12 },
  balanceLabel: { color: theme.colors.textMuted, fontSize: 13 },
  balanceValue: {
    color: theme.colors.text,
    fontSize: 32,
    fontWeight: '800',
    marginTop: 4,
  },
  form: { paddingHorizontal: theme.spacing.md, gap: 8 },
  typeRow: { flexDirection: 'row', gap: 8 },
  typeBtn: { flex: 1 },
  input: {
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: theme.radius.md,
    padding: 12,
    color: theme.colors.text,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  list: { padding: theme.spacing.md },
  recordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    gap: 12,
  },
  recordMain: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  recordCat: { color: theme.colors.text, fontWeight: '500' },
  recordDate: { color: theme.colors.textMuted, fontSize: 12, marginTop: 2 },
  recordAmount: { fontSize: 16, fontWeight: '700' },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: theme.spacing.md,
  },
  modalCard: {
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: 8,
  },
  modalTitle: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: theme.spacing.sm,
  },
  modalActions: { flexDirection: 'row', gap: 8, marginTop: theme.spacing.md },
  modalBtn: { flex: 1 },
});
