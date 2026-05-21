import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { financeApi } from '@/src/api/services';
import { BarChartCard } from '@/src/components/charts/BarChartCard';
import { DonutChart } from '@/src/components/charts/DonutChart';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { EmptyState } from '@/src/components/EmptyState';
import { MethodologyHint } from '@/src/components/MethodologyHint';
import type { FinanceRecord, FinanceSummary } from '@/src/types/api';
import { theme } from '@/constants/theme';
import {
  CATEGORY_CHART_COLORS,
  EXPENSE_CATEGORIES,
  formatMoney,
  INCOME_CATEGORIES,
  isOnboardingFinanceRecord,
} from '../../../shared/finance-helpers';

type FilterType = 'ALL' | 'INCOME' | 'EXPENSE';

export default function FinanceScreen() {
  const [records, setRecords] = useState<FinanceRecord[]>([]);
  const [summary, setSummary] = useState<FinanceSummary | null>(null);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [note, setNote] = useState('');
  const [type, setType] = useState<'INCOME' | 'EXPENSE'>('EXPENSE');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [editing, setEditing] = useState<FinanceRecord | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editNote, setEditNote] = useState('');
  const [editType, setEditType] = useState<'INCOME' | 'EXPENSE'>('EXPENSE');
  const [filter, setFilter] = useState<FilterType>('ALL');
  const [search, setSearch] = useState('');

  const categoryPresets = type === 'INCOME' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  const editPresets = editType === 'INCOME' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  const load = useCallback(async () => {
    try {
      const [list, sum] = await Promise.all([financeApi.list(), financeApi.summary()]);
      setRecords(list);
      setSummary(sum);
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'No se pudieron cargar los datos');
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load().finally(() => setLoading(false));
    }, [load]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const handleAdd = async () => {
    const num = parseFloat(amount.replace(',', '.'));
    if (!num || num <= 0 || !category.trim()) {
      Alert.alert('Datos incompletos', 'Monto y categoría son obligatorios');
      return;
    }
    setSaving(true);
    try {
      await financeApi.create({
        type,
        amount: num,
        category: category.trim(),
        note: note.trim() || undefined,
      });
      setAmount('');
      setCategory('');
      setNote('');
      await load();
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo guardar');
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (r: FinanceRecord) => {
    setEditing(r);
    setEditAmount(String(r.amount));
    setEditCategory(r.category);
    setEditNote(r.note ?? '');
    setEditType(r.type);
  };

  const saveEdit = async () => {
    if (!editing) return;
    const num = parseFloat(editAmount.replace(',', '.'));
    if (!num || num <= 0 || !editCategory.trim()) {
      Alert.alert('Datos incompletos', 'Monto y categoría válidos, por favor');
      return;
    }
    try {
      await financeApi.update(editing.id, {
        type: editType,
        amount: num,
        category: editCategory.trim(),
        note: editNote.trim() || undefined,
      });
      setEditing(null);
      await load();
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo actualizar');
    }
  };

  const confirmRemove = (r: FinanceRecord) => {
    Alert.alert('Eliminar movimiento', `¿Quitar "${r.category}" (${formatMoney(r.amount)})?`, [
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

  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      if (filter !== 'ALL' && r.type !== filter) return false;
      if (search.trim() && !r.category.toLowerCase().includes(search.trim().toLowerCase())) return false;
      return true;
    });
  }, [records, filter, search]);

  const pieData = useMemo(
    () => [
      { name: 'Ingresos', value: summary?.income ?? 0, color: theme.colors.income },
      { name: 'Gastos', value: summary?.expense ?? 0, color: theme.colors.expense },
    ],
    [summary],
  );

  const expenseBarData = useMemo(
    () =>
      (summary?.expenseByCategory ?? []).slice(0, 6).map((c, i) => ({
        name: c.category.length > 8 ? `${c.category.slice(0, 7)}…` : c.category,
        value: c.total,
        color: CATEGORY_CHART_COLORS[i % CATEGORY_CHART_COLORS.length],
      })),
    [summary],
  );

  const monthlyBarData = useMemo(
    () =>
      (summary?.monthly ?? []).map((m, i) => ({
        name: m.label,
        value: m.expense,
        color: CATEGORY_CHART_COLORS[i % CATEGORY_CHART_COLORS.length],
      })),
    [summary],
  );

  const balancePositive = (summary?.balance ?? 0) >= 0;

  if (loading && !summary) {
    return (
      <View style={styles.boot}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.bootText}>Cargando finanzas...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
        }>
        <Text style={styles.disclaimer}>
          Control de flujo de caja. No es asesoría financiera ni de inversión.
        </Text>
        <MethodologyHint module="finance" />

        <View style={styles.kpiGrid}>
          <Card style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Ingresos</Text>
            <Text style={[styles.kpiValue, { color: theme.colors.income }]}>
              {formatMoney(summary?.income ?? 0)}
            </Text>
          </Card>
          <Card style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Gastos</Text>
            <Text style={[styles.kpiValue, { color: theme.colors.expense }]}>
              {formatMoney(summary?.expense ?? 0)}
            </Text>
          </Card>
        </View>

        <Card style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Balance neto</Text>
          <Text style={[styles.balanceValue, !balancePositive && styles.balanceNegative]}>
            {formatMoney(summary?.balance ?? 0)}
          </Text>
          <Text style={styles.metaLine}>
            Ahorro {summary?.savingsRate ?? 0}% · {summary?.totalRecords ?? 0} movimientos
            {summary?.topExpenseCategory ? ` · Top: ${summary.topExpenseCategory}` : ''}
          </Text>
        </Card>

        <Card style={styles.chartCard}>
          <Text style={styles.sectionTitle}>Ingresos vs gastos</Text>
          <DonutChart
            data={pieData}
            centerValue={formatMoney(summary?.balance ?? 0)}
            centerHint="balance"
          />
        </Card>

        {expenseBarData.length > 0 ? (
          <BarChartCard title="Gastos por categoría" data={expenseBarData} height={180} />
        ) : null}

        {monthlyBarData.some((d) => d.value > 0) ? (
          <BarChartCard title="Gastos por mes (6 meses)" data={monthlyBarData} height={160} />
        ) : null}

        {summary?.budget503020 ? (
          <Card style={styles.budgetCard}>
            <Text style={styles.sectionTitle}>Guía 50 / 30 / 20</Text>
            {[
              { label: '50% Necesidades', amt: summary.budget503020.needs, pct: 50, color: theme.colors.primary },
              { label: '30% Deseos', amt: summary.budget503020.wants, pct: 30, color: theme.colors.accent },
              { label: '20% Ahorro', amt: summary.budget503020.savings, pct: 20, color: theme.colors.success },
            ].map((row) => (
              <View key={row.label} style={styles.budgetRow}>
                <View style={styles.budgetHeader}>
                  <Text style={styles.budgetLabel}>{row.label}</Text>
                  <Text style={styles.budgetAmt}>{formatMoney(row.amt)}</Text>
                </View>
                <View style={styles.budgetTrack}>
                  <View
                    style={[styles.budgetFill, { width: `${row.pct}%`, backgroundColor: row.color }]}
                  />
                </View>
              </View>
            ))}
          </Card>
        ) : null}

        <Card style={styles.formCard}>
          <Text style={styles.sectionTitle}>Nuevo registro</Text>
          <View style={styles.typeRow}>
            <Button
              title="Gasto"
              variant={type === 'EXPENSE' ? 'primary' : 'secondary'}
              onPress={() => {
                setType('EXPENSE');
                setCategory('');
              }}
              style={styles.typeBtn}
            />
            <Button
              title="Ingreso"
              variant={type === 'INCOME' ? 'primary' : 'secondary'}
              onPress={() => {
                setType('INCOME');
                setCategory('');
              }}
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
            placeholder="Categoría"
            placeholderTextColor={theme.colors.textMuted}
            value={category}
            onChangeText={setCategory}
          />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
            {categoryPresets.map((c) => (
              <Pressable
                key={c}
                style={[styles.chip, category === c && styles.chipActive]}
                onPress={() => setCategory(c)}>
                <Text style={[styles.chipText, category === c && styles.chipTextActive]}>{c}</Text>
              </Pressable>
            ))}
          </ScrollView>
          <TextInput
            style={styles.input}
            placeholder="Nota opcional"
            placeholderTextColor={theme.colors.textMuted}
            value={note}
            onChangeText={setNote}
          />
          <Button title="Registrar movimiento" onPress={handleAdd} loading={saving} />
        </Card>

        <Text style={styles.historyTitle}>Historial</Text>
        <View style={styles.filterRow}>
          {(['ALL', 'INCOME', 'EXPENSE'] as FilterType[]).map((f) => (
            <Pressable
              key={f}
              style={[styles.filterChip, filter === f && styles.filterChipActive]}
              onPress={() => setFilter(f)}>
              <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
                {f === 'ALL' ? 'Todos' : f === 'INCOME' ? 'Ingresos' : 'Gastos'}
              </Text>
            </Pressable>
          ))}
        </View>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar categoría..."
          placeholderTextColor={theme.colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />

        {filteredRecords.length === 0 ? (
          <EmptyState
            icon="money"
            title={records.length === 0 ? 'Sin movimientos' : 'Sin resultados'}
            description="Registra ingresos y gastos para ver gráficos y balance."
          />
        ) : (
          filteredRecords.map((item) => {
            const isSeed = isOnboardingFinanceRecord(item.category, item.amount);
            return (
              <View key={item.id} style={styles.recordRow}>
                <Pressable style={styles.recordMain} onPress={() => openEdit(item)}>
                  <View style={styles.recordLeft}>
                    <View style={styles.recordTitleRow}>
                      <Text style={styles.recordCat}>{item.category}</Text>
                      {isSeed ? (
                        <Text style={styles.seedBadge}>Plantilla</Text>
                      ) : null}
                    </View>
                    {item.note ? (
                      <Text style={styles.recordNote} numberOfLines={1}>
                        {item.note}
                      </Text>
                    ) : null}
                    <Text style={styles.recordDate}>
                      {new Date(item.createdAt).toLocaleString('es', {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      })}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.recordAmount,
                      { color: item.type === 'INCOME' ? theme.colors.income : theme.colors.expense },
                    ]}>
                    {item.type === 'INCOME' ? '+' : '−'}
                    {formatMoney(item.amount)}
                  </Text>
                </Pressable>
                <Pressable onPress={() => confirmRemove(item)} hitSlop={10}>
                  <FontAwesome name="trash-o" size={20} color={theme.colors.textMuted} />
                </Pressable>
              </View>
            );
          })
        )}
      </ScrollView>

      <Modal visible={!!editing} transparent animationType="fade">
        <Pressable style={styles.modalBackdrop} onPress={() => setEditing(null)}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Editar movimiento</Text>
            <View style={styles.typeRow}>
              <Button
                title="Gasto"
                variant={editType === 'EXPENSE' ? 'primary' : 'secondary'}
                onPress={() => {
                  setEditType('EXPENSE');
                  setEditCategory('');
                }}
                style={styles.typeBtn}
              />
              <Button
                title="Ingreso"
                variant={editType === 'INCOME' ? 'primary' : 'secondary'}
                onPress={() => {
                  setEditType('INCOME');
                  setEditCategory('');
                }}
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
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
              {editPresets.map((c) => (
                <Pressable
                  key={c}
                  style={[styles.chip, editCategory === c && styles.chipActive]}
                  onPress={() => setEditCategory(c)}>
                  <Text style={[styles.chipText, editCategory === c && styles.chipTextActive]}>{c}</Text>
                </Pressable>
              ))}
            </ScrollView>
            <TextInput
              style={styles.input}
              value={editNote}
              onChangeText={setEditNote}
              placeholder="Nota opcional"
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
  scroll: { paddingBottom: 32 },
  boot: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    gap: 12,
  },
  bootText: { color: theme.colors.textMuted },
  disclaimer: {
    color: theme.colors.textMuted,
    fontSize: 11,
    marginHorizontal: theme.spacing.md,
    marginTop: theme.spacing.sm,
    lineHeight: 16,
  },
  kpiGrid: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: theme.spacing.md,
    marginTop: theme.spacing.sm,
  },
  kpiCard: { flex: 1 },
  kpiLabel: { color: theme.colors.textMuted, fontSize: 12 },
  kpiValue: { fontSize: 18, fontWeight: '800', marginTop: 4 },
  balanceCard: { margin: theme.spacing.md, marginTop: 12 },
  balanceLabel: { color: theme.colors.textMuted, fontSize: 13 },
  balanceValue: { color: theme.colors.text, fontSize: 30, fontWeight: '800', marginTop: 4 },
  balanceNegative: { color: theme.colors.expense },
  metaLine: { color: theme.colors.textMuted, fontSize: 11, marginTop: 8 },
  chartCard: { marginHorizontal: theme.spacing.md, marginTop: 12, alignItems: 'center' },
  sectionTitle: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '600',
    alignSelf: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  budgetCard: { marginHorizontal: theme.spacing.md, marginTop: 12, gap: 12 },
  budgetRow: { gap: 6 },
  budgetHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  budgetLabel: { color: theme.colors.textMuted, fontSize: 13 },
  budgetAmt: { color: theme.colors.text, fontWeight: '600', fontSize: 13 },
  budgetTrack: {
    height: 8,
    backgroundColor: theme.colors.surface,
    borderRadius: 4,
    overflow: 'hidden',
  },
  budgetFill: { height: '100%', borderRadius: 4 },
  formCard: { marginHorizontal: theme.spacing.md, marginTop: 12, gap: 8 },
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
  chipsScroll: { marginVertical: 4, maxHeight: 36 },
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
    backgroundColor: theme.colors.primary + '33',
    borderColor: theme.colors.primary,
  },
  chipText: { color: theme.colors.textMuted, fontSize: 12 },
  chipTextActive: { color: theme.colors.primaryLight, fontWeight: '600' },
  historyTitle: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '600',
    marginHorizontal: theme.spacing.md,
    marginTop: theme.spacing.lg,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginHorizontal: theme.spacing.md,
    marginTop: theme.spacing.sm,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: theme.colors.surfaceLight,
  },
  filterChipActive: { backgroundColor: theme.colors.primary },
  filterText: { color: theme.colors.textMuted, fontSize: 12 },
  filterTextActive: { color: '#fff', fontWeight: '600' },
  searchInput: {
    marginHorizontal: theme.spacing.md,
    marginTop: 8,
    marginBottom: 8,
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: theme.radius.md,
    padding: 10,
    color: theme.colors.text,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  recordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: theme.spacing.md,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    gap: 12,
  },
  recordMain: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  recordLeft: { flex: 1, marginRight: 8 },
  recordTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  recordCat: { color: theme.colors.text, fontWeight: '600', fontSize: 15 },
  seedBadge: {
    fontSize: 9,
    color: theme.colors.primaryLight,
    backgroundColor: theme.colors.primary + '22',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    overflow: 'hidden',
  },
  recordNote: { color: theme.colors.textMuted, fontSize: 12, marginTop: 2 },
  recordDate: { color: theme.colors.textMuted, fontSize: 11, marginTop: 4 },
  recordAmount: { fontSize: 15, fontWeight: '700' },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
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
  modalTitle: { color: theme.colors.text, fontSize: 18, fontWeight: '700', marginBottom: 4 },
  modalActions: { flexDirection: 'row', gap: 8, marginTop: theme.spacing.md },
  modalBtn: { flex: 1 },
});
