import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { AppText, Button, Card, Chip, ChipGroup, EmptyView, errorMessage, ErrorView, Header, Icon, LoadingView, OfflineBanner, Screen, SegmentedControl, TextField } from '@/components/ui';
import { getAccounts, getCategories } from '@/features/finance/api';
import { formatDay, todayKey } from '@/features/finance/labels';
import { createRecurring, deleteRecurring, FREQUENCY_LABELS, getRecurring, updateRecurring, type Frequency, type RecurringRule } from '@/features/habits/api';
import { formatAmountInput, formatCop, parseAmount } from '@/lib/format';
import { useQuery } from '@/lib/query';
import { useTheme } from '@/theme/useTheme';

/** RF-30: arriendo, salario, suscripciones… se registran solos en su fecha. */
export default function RecurringScreen() {
  const { spacing } = useTheme();
  const { data, error, loading, refetch, fromCache, updatedAt } = useQuery('recurring', getRecurring);
  const [creating, setCreating] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const rules = data?.rules ?? [];

  return (
    <Screen scroll edges={['top', 'bottom']} animateIn={false}>
      <Header title="Movimientos recurrentes" />
      {fromCache ? <OfflineBanner updatedAt={updatedAt} /> : null}
      {loading ? <LoadingView /> : null}
      {error && !data ? <ErrorView error={error} onRetry={refetch} /> : null}

      {data && rules.length ? (
        <Card elevated>
          <View style={{ flexDirection: 'row', gap: spacing.lg }}>
            <View style={{ flex: 1 }}>
              <AppText variant="caption" color="textMuted">
                Ingresos fijos al mes
              </AppText>
              <AppText variant="heading" color="success">
                {formatCop(data.monthly.income)}
              </AppText>
            </View>
            <View style={{ flex: 1 }}>
              <AppText variant="caption" color="textMuted">
                Gastos fijos al mes
              </AppText>
              <AppText variant="heading">{formatCop(data.monthly.expenses)}</AppText>
            </View>
          </View>
          <AppText variant="caption" color="textMuted">
            Se registran automáticamente en su fecha. Puedes editarlos o borrarlos como cualquier movimiento.
          </AppText>
        </Card>
      ) : null}

      {data && !rules.length && !creating ? (
        <EmptyView
          icon="repeat"
          title="Automatiza lo que se repite"
          description="El arriendo, tu salario o una suscripción se registran solos cada semana, quincena o mes."
          action={{ title: 'Programar un movimiento', onPress: () => setCreating(true) }}
        />
      ) : null}

      {rules.map((rule) => (
        <RuleCard key={rule.id} rule={rule} />
      ))}

      {creating ? (
        <RuleForm
          onDone={(created) => {
            setCreating(false);
            setNotice(created ? (created === 1 ? 'Ya se registró 1 movimiento porque su fecha llegó.' : `Ya se registraron ${created} movimientos porque sus fechas llegaron.`) : null);
          }}
          onCancel={() => setCreating(false)}
        />
      ) : rules.length ? (
        <Button title="Programar otro" variant="secondary" onPress={() => setCreating(true)} />
      ) : null}
      {notice ? (
        <AppText variant="caption" color="textMuted">
          {notice}
        </AppText>
      ) : null}
    </Screen>
  );
}

function RuleCard({ rule }: { rule: RecurringRule }) {
  const { spacing } = useTheme();
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function act(action: () => Promise<unknown>) {
    setBusy(true);
    setMessage(null);
    try {
      await action();
    } catch (err) {
      setMessage(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
        <Icon name={rule.type === 'ingreso' ? 'income' : 'expense'} color={rule.type === 'ingreso' ? 'success' : 'textMuted'} />
        <View style={{ flex: 1 }}>
          <AppText variant="bodyStrong">{rule.description || rule.category?.name || 'Movimiento'}</AppText>
          <AppText variant="caption" color="textMuted">
            {FREQUENCY_LABELS[rule.frequency]} · {rule.active ? `próximo: ${formatDay(rule.nextDate)}` : 'en pausa'}
            {rule.account ? ` · ${rule.account.name}` : ''}
          </AppText>
        </View>
        <AppText variant="bodyStrong" color={rule.type === 'ingreso' ? 'success' : 'text'}>
          {rule.type === 'ingreso' ? '+' : '−'}
          {formatCop(rule.amount)}
        </AppText>
      </View>
      {confirm ? (
        <>
          <AppText variant="caption" color="textMuted">
            Dejará de registrarse. Los movimientos que ya se crearon se conservan.
          </AppText>
          <Button title="Sí, borrar" variant="danger" onPress={() => act(() => deleteRecurring(rule.id))} loading={busy} />
          <Button title="Cancelar" variant="secondary" onPress={() => setConfirm(false)} />
        </>
      ) : (
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <View style={{ flex: 1 }}>
            <Button
              title={rule.active ? 'Pausar' : 'Reanudar'}
              variant="secondary"
              onPress={() => act(() => updateRecurring(rule.id, { active: !rule.active }))}
              loading={busy}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Button title="Borrar" variant="ghost" onPress={() => setConfirm(true)} />
          </View>
        </View>
      )}
      {message ? <AppText color="danger">{message}</AppText> : null}
    </Card>
  );
}

function RuleForm({ onDone, onCancel }: { onDone: (created: number) => void; onCancel: () => void }) {
  const categories = useQuery('categories', getCategories);
  const accounts = useQuery('accounts', getAccounts);
  const [type, setType] = useState<'gasto' | 'ingreso'>('gasto');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [frequency, setFrequency] = useState<Frequency>('mensual');
  const [startDate, setStartDate] = useState(todayKey());
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const options = useMemo(() => (categories.data?.categories ?? []).filter((c) => c.kind === type), [categories.data, type]);

  async function save() {
    const value = parseAmount(amount);
    if (!value) return setMessage('Escribe el monto.');
    if (!categoryId) return setMessage('Elige una categoría.');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate)) return setMessage('La fecha va como AAAA-MM-DD.');
    setSaving(true);
    setMessage(null);
    try {
      const { created } = await createRecurring({ type, amount: value, categoryId, frequency, startDate, accountId, description: description.trim() || null });
      onDone(created);
    } catch (err) {
      setMessage(errorMessage(err));
      setSaving(false);
    }
  }

  return (
    <Card>
      <AppText variant="heading">Nuevo movimiento recurrente</AppText>
      <SegmentedControl
        accessibilityLabel="Tipo"
        value={type}
        onChange={(value) => {
          setType(value);
          setCategoryId(null);
        }}
        options={[
          { value: 'gasto', label: 'Gasto' },
          { value: 'ingreso', label: 'Ingreso' },
        ]}
      />
      <TextField label="Monto" prefix="$" keyboardType="number-pad" value={amount} onChangeText={(t) => setAmount(formatAmountInput(t))} placeholder="0" />
      <AppText variant="label" color="textMuted">
        Categoría
      </AppText>
      <ChipGroup>
        {options.map((c) => (
          <Chip key={c.id} label={c.name} dotColor={c.color} selected={categoryId === c.id} onPress={() => setCategoryId(c.id)} />
        ))}
      </ChipGroup>
      <AppText variant="label" color="textMuted">
        ¿Cada cuánto?
      </AppText>
      <ChipGroup>
        {(Object.keys(FREQUENCY_LABELS) as Frequency[]).map((f) => (
          <Chip key={f} label={FREQUENCY_LABELS[f]} selected={frequency === f} onPress={() => setFrequency(f)} />
        ))}
      </ChipGroup>
      <TextField
        label="Primera fecha (AAAA-MM-DD)"
        value={startDate}
        onChangeText={setStartDate}
        keyboardType="numbers-and-punctuation"
        hint={frequency === 'quincenal' ? 'Dos veces al mes: este día y 15 días después (p. ej. el 15 y el 30).' : undefined}
      />
      {accounts.data?.accounts.length ? (
        <>
          <AppText variant="label" color="textMuted">
            Cuenta (opcional)
          </AppText>
          <ChipGroup>
            <Chip label="Sin cuenta" selected={!accountId} onPress={() => setAccountId(null)} />
            {accounts.data.accounts.map((a) => (
              <Chip key={a.id} label={a.name} selected={accountId === a.id} onPress={() => setAccountId(a.id)} />
            ))}
          </ChipGroup>
        </>
      ) : null}
      <TextField label="Descripción (opcional)" value={description} onChangeText={setDescription} placeholder={type === 'gasto' ? 'Ej.: Arriendo' : 'Ej.: Salario'} maxLength={200} />
      {message ? <AppText color="danger">{message}</AppText> : null}
      <Button title="Programar" onPress={save} loading={saving} />
      <Button title="Cancelar" variant="secondary" onPress={onCancel} />
    </Card>
  );
}
