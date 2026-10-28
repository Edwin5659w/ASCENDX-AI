import type { MovementType } from '@ascendx/finance-core';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { AppText, Button, Card, Chip, ChipGroup, errorMessage, Header, Icon, LoadingView, NavRow, Screen, TextField } from '@/components/ui';
import {
  createTransaction,
  deleteTransaction,
  getAccounts,
  getCategories,
  getDebts,
  getGoals,
  getTransaction,
  updateTransaction,
  type Transaction,
} from '@/features/finance/api';
import { MOVEMENT_LABELS, newClientOpId, shiftDay, todayKey } from '@/features/finance/labels';
import { ApiError } from '@/lib/api';
import { enqueueMovement } from '@/lib/outbox';
import { formatAmountInput, formatCop, parseAmount } from '@/lib/format';
import { useQuery } from '@/lib/query';
import { useTheme } from '@/theme/useTheme';

const TYPES: MovementType[] = ['gasto', 'ingreso', 'pago_deuda', 'aporte_meta', 'retiro_meta'];

type Params = { id?: string; type?: MovementType; debtId?: string; goalId?: string; amount?: string; date?: string; description?: string; source?: 'ocr'; merchant?: string; receiptDate?: string; total?: string };

/**
 * RF-07: registrar o editar un movimiento. RF-09: si parece duplicado, se
 * pide confirmar antes de guardar. El mismo client_op_id se reutiliza en los
 * reintentos para no duplicar (RNF-12).
 */
export default function MovementFormScreen() {
  const params = useLocalSearchParams<Params>();
  const existing = useQuery(params.id ? `transaction:${params.id}` : null, () => getTransaction(params.id!));
  if (params.id && !existing.data) {
    return (
      <Screen edges={['top', 'bottom']}>
        <Header title="Editar movimiento" />
        {existing.error ? <AppText color="danger">{errorMessage(existing.error)}</AppText> : <LoadingView />}
      </Screen>
    );
  }
  return <MovementForm key={params.id ?? 'nuevo'} params={params} initial={existing.data?.transaction} />;
}

function MovementForm({ params, initial }: { params: Params; initial?: Transaction }) {
  const editingId = initial?.id;
  const { spacing } = useTheme();
  const today = todayKey();

  const [type, setType] = useState<MovementType>(initial?.type ?? params.type ?? 'gasto');
  const [amount, setAmount] = useState(
    initial ? formatAmountInput(String(initial.amount)) : params.amount ? formatAmountInput(params.amount) : '',
  );
  const [categoryId, setCategoryId] = useState<string | null>(initial?.category?.id ?? null);
  const [debtId, setDebtId] = useState<string | null>(initial?.debt?.id ?? params.debtId ?? null);
  const [goalId, setGoalId] = useState<string | null>(initial?.goal?.id ?? params.goalId ?? null);
  const initialDate = initial?.date ?? params.date ?? today;
  const [date, setDate] = useState(initialDate);
  const [customDate, setCustomDate] = useState(initialDate !== today && initialDate !== shiftDay(today, -1));
  const [description, setDescription] = useState(initial?.description ?? params.description ?? '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [duplicate, setDuplicate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [clientOpId] = useState(newClientOpId);
  const [accountId, setAccountId] = useState<string | null>(initial?.account?.id ?? null);
  const accounts = useQuery('accounts', getAccounts);
  const accountOptions = accounts.data?.accounts ?? [];

  const categories = useQuery('categories', getCategories);
  const debts = useQuery(type === 'pago_deuda' ? 'debts' : null, getDebts);
  const goals = useQuery(type === 'aporte_meta' || type === 'retiro_meta' ? 'goals' : null, getGoals);

  const kind = type === 'ingreso' ? 'ingreso' : 'gasto';
  const categoryOptions = useMemo(() => (categories.data?.categories ?? []).filter((c) => c.kind === kind), [categories.data, kind]);
  const activeDebts = (debts.data?.debts ?? []).filter((d) => d.status === 'activa' || d.id === debtId);
  const goalOptions = (goals.data?.goals ?? []).filter((g) => g.status === 'activa' || g.status === 'completada' || g.id === goalId);

  async function save(confirmDuplicate = false) {
    const value = parseAmount(amount);
    const local: Record<string, string> = {};
    if (!value) local.amount = 'Escribe el monto';
    if ((type === 'ingreso' || type === 'gasto') && !categoryId) local.category = 'Elige una categoría';
    if (type === 'pago_deuda' && !debtId) local.category = 'Elige la deuda';
    if ((type === 'aporte_meta' || type === 'retiro_meta') && !goalId) local.category = 'Elige la meta';
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) local.date = 'Usa el formato AAAA-MM-DD';
    else if (date > today) local.date = 'La fecha no puede ser futura';
    setErrors(local);
    setFormError(null);
    if (Object.keys(local).length) return;

    setSaving(true);
    try {
      if (editingId) {
        await updateTransaction(editingId, {
          amount: value!,
          date,
          description: description.trim() || null,
          accountId,
          ...(type === 'ingreso' || type === 'gasto' ? { categoryId } : {}),
        });
      } else {
        const body = {
          type,
          amount: value!,
          date,
          categoryId: type === 'ingreso' || type === 'gasto' ? categoryId : null,
          debtId: type === 'pago_deuda' ? debtId : null,
          goalId: type === 'aporte_meta' || type === 'retiro_meta' ? goalId : null,
          accountId,
          description: description.trim() || null,
          source: params.source === 'ocr' ? ('ocr' as const) : ('manual' as const),
          ...(params.source === 'ocr'
            ? { receipt: { merchant: params.merchant ?? null, date: params.receiptDate ?? null, total: params.total ? Number(params.total) : null } }
            : {}),
          clientOpId,
          confirmDuplicate,
        };
        try {
          await createTransaction(body);
        } catch (error) {
          // RF-29: sin conexión se guarda en el teléfono y se envía al volver la red.
          if (!(error instanceof ApiError && error.status === 0)) throw error;
          const category = categoryOptions.find((c) => c.id === categoryId)?.name;
          await enqueueMovement(body, `${MOVEMENT_LABELS[type]}${category ? ` · ${category}` : ''} · ${formatCop(value!)}`);
        }
      }
      router.back();
    } catch (error) {
      if (error instanceof ApiError && error.code === 'POSSIBLE_DUPLICATE') setDuplicate(true);
      else {
        const fields = error instanceof ApiError ? error.fieldErrors() : {};
        setErrors(fields);
        setFormError(errorMessage(error));
      }
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!editingId) return;
    setSaving(true);
    try {
      await deleteTransaction(editingId);
      router.back();
    } catch (error) {
      setFormError(errorMessage(error));
      setSaving(false);
    }
  }

  return (
    <Screen scroll edges={['top', 'bottom']} animateIn={false}>
      <Header title={editingId ? 'Editar movimiento' : 'Nuevo movimiento'} />

      {!editingId && params.source !== 'ocr' ? (
        <NavRow icon="camera" title="Escanear un recibo" subtitle="Lee el total, la fecha y el comercio; tú revisas antes de guardar" onPress={() => router.push('/scan-receipt')} />
      ) : null}
      {params.source === 'ocr' ? (
        <Card>
          <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'center' }}>
            <Icon name="camera" color="primary" />
            <AppText variant="bodyStrong" style={{ flex: 1 }}>
              Datos leídos del recibo
            </AppText>
          </View>
          <AppText variant="caption" color="textMuted">
            Revisa el monto, la fecha y la categoría antes de guardar. Nada se guarda sin tu confirmación.
          </AppText>
        </Card>
      ) : null}

      <View style={{ gap: spacing.sm }}>
        <AppText variant="label" color="textMuted">
          Tipo
        </AppText>
        {editingId ? (
          <AppText variant="bodyStrong">{MOVEMENT_LABELS[type]}</AppText>
        ) : (
          <ChipGroup>
            {TYPES.map((option) => (
              <Chip
                key={option}
                label={MOVEMENT_LABELS[option]}
                selected={type === option}
                onPress={() => {
                  setType(option);
                  setCategoryId(null);
                  setDuplicate(false);
                }}
              />
            ))}
          </ChipGroup>
        )}
      </View>

      <TextField
        label="Monto"
        prefix="$"
        keyboardType="number-pad"
        value={amount}
        onChangeText={(text) => {
          setAmount(formatAmountInput(text));
          setDuplicate(false);
        }}
        placeholder="0"
        error={errors.amount}
        autoFocus={!editingId && !params.amount}
      />

      {type === 'ingreso' || type === 'gasto' ? (
        <View style={{ gap: spacing.sm }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <AppText variant="label" color="textMuted">
              Categoría
            </AppText>
            <Button title="Administrar" variant="ghost" onPress={() => router.push('/categories')} />
          </View>
          {categories.loading ? <LoadingView label="Cargando categorías…" /> : null}
          <ChipGroup>
            {categoryOptions.map((category) => (
              <Chip
                key={category.id}
                label={category.name}
                dotColor={category.color}
                selected={categoryId === category.id}
                onPress={() => {
                  setCategoryId(category.id);
                  setDuplicate(false);
                }}
              />
            ))}
          </ChipGroup>
        </View>
      ) : null}

      {type === 'pago_deuda' && !editingId ? (
        <View style={{ gap: spacing.sm }}>
          <AppText variant="label" color="textMuted">
            ¿Qué deuda pagaste?
          </AppText>
          {debts.loading ? <LoadingView label="Cargando deudas…" /> : null}
          {debts.data && activeDebts.length === 0 ? (
            <Button title="Registrar una deuda primero" variant="secondary" onPress={() => router.push('/debt-form')} />
          ) : null}
          <ChipGroup>
            {activeDebts.map((debt) => (
              <Chip key={debt.id} label={`${debt.name ?? debt.creditor} · ${formatCop(debt.balance)}`} selected={debtId === debt.id} onPress={() => setDebtId(debt.id)} />
            ))}
          </ChipGroup>
          <AppText variant="caption" color="textMuted">
            El pago cubre primero los intereses del mes y el resto baja el saldo. No cuenta como gasto.
          </AppText>
        </View>
      ) : null}

      {(type === 'aporte_meta' || type === 'retiro_meta') && !editingId ? (
        <View style={{ gap: spacing.sm }}>
          <AppText variant="label" color="textMuted">
            ¿A qué meta?
          </AppText>
          {goals.loading ? <LoadingView label="Cargando metas…" /> : null}
          {goals.data && goalOptions.length === 0 ? (
            <Button title="Crear una meta primero" variant="secondary" onPress={() => router.push('/goal-form')} />
          ) : null}
          <ChipGroup>
            {goalOptions.map((goal) => (
              <Chip key={goal.id} label={`${goal.name} · ${formatCop(goal.savedAmount)}`} selected={goalId === goal.id} onPress={() => setGoalId(goal.id)} />
            ))}
          </ChipGroup>
        </View>
      ) : null}
      {errors.category ? (
        <AppText variant="caption" color="danger">
          {errors.category}
        </AppText>
      ) : null}

      <View style={{ gap: spacing.sm }}>
        <AppText variant="label" color="textMuted">
          Fecha
        </AppText>
        <ChipGroup>
          <Chip label="Hoy" selected={!customDate && date === today} onPress={() => { setCustomDate(false); setDate(today); }} />
          <Chip label="Ayer" selected={!customDate && date === shiftDay(today, -1)} onPress={() => { setCustomDate(false); setDate(shiftDay(today, -1)); }} />
          <Chip label="Otra fecha" selected={customDate} onPress={() => setCustomDate(true)} />
        </ChipGroup>
        {customDate ? (
          <TextField label="Fecha (AAAA-MM-DD)" value={date} onChangeText={setDate} placeholder={today} keyboardType="numbers-and-punctuation" error={errors.date} />
        ) : errors.date ? (
          <AppText variant="caption" color="danger">
            {errors.date}
          </AppText>
        ) : null}
      </View>

      {accountOptions.length ? (
        <View style={{ gap: spacing.sm }}>
          <AppText variant="label" color="textMuted">
            Cuenta (opcional)
          </AppText>
          <ChipGroup>
            <Chip label="Sin cuenta" selected={!accountId} onPress={() => setAccountId(null)} />
            {accountOptions.map((account) => (
              <Chip key={account.id} label={account.name} selected={accountId === account.id} onPress={() => setAccountId(account.id)} />
            ))}
          </ChipGroup>
        </View>
      ) : null}

      <TextField label="Descripción (opcional)" value={description} onChangeText={setDescription} placeholder="Ej.: mercado de la semana" maxLength={200} />

      {duplicate ? (
        <Card highlighted>
          <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'center' }}>
            <Icon name="warning" color="warning" />
            <AppText variant="bodyStrong" style={{ flex: 1 }}>
              ¿Es un movimiento repetido?
            </AppText>
          </View>
          <AppText color="textMuted">Acabas de registrar uno igual (mismo tipo, monto, categoría y fecha).</AppText>
          <Button title="Guardar de todas formas" onPress={() => save(true)} loading={saving} />
          <Button title="No, revisar" variant="secondary" onPress={() => setDuplicate(false)} />
        </Card>
      ) : null}

      {formError ? <AppText color="danger">{formError}</AppText> : null}

      {!duplicate ? <Button title={editingId ? 'Guardar cambios' : 'Guardar'} onPress={() => save(false)} loading={saving} /> : null}

      {editingId ? (
        confirmDelete ? (
          <Card>
            <AppText variant="bodyStrong">¿Borrar este movimiento?</AppText>
            <AppText variant="caption" color="textMuted">
              {type === 'pago_deuda'
                ? 'El saldo de la deuda volverá a su valor anterior.'
                : type === 'aporte_meta' || type === 'retiro_meta'
                  ? 'Lo ahorrado en la meta se ajustará.'
                  : 'Dejará de contar en tu panel y tus totales.'}
            </AppText>
            <Button title="Sí, borrar" variant="danger" onPress={remove} loading={saving} />
            <Button title="Cancelar" variant="secondary" onPress={() => setConfirmDelete(false)} />
          </Card>
        ) : (
          <Button title="Borrar movimiento" variant="ghost" onPress={() => setConfirmDelete(true)} />
        )
      ) : null}
    </Screen>
  );
}
