import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { AppText, Button, Chip, ChipGroup, errorMessage, Header, LoadingView, Screen, SegmentedControl, TextField, ToggleRow } from '@/components/ui';
import { createGoal, getGoal, updateGoal, type Goal } from '@/features/finance/api';
import { todayKey } from '@/features/finance/labels';
import { ApiError } from '@/lib/api';
import { formatAmountInput, parseAmount } from '@/lib/format';
import { useQuery } from '@/lib/query';
import { useTheme } from '@/theme/useTheme';

const QUICK_DATES = [6, 12, 24] as const;

function inMonths(months: number) {
  const d = new Date(`${todayKey()}T12:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() + months);
  return d.toISOString().slice(0, 10);
}

/** RF-16: crear o editar una meta con valor, fecha deseada y prioridad. */
export default function GoalFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const existing = useQuery(id ? `goal:${id}` : null, () => getGoal(id!));
  if (id && !existing.data) {
    return (
      <Screen edges={['top', 'bottom']}>
        <Header title="Editar meta" />
        {existing.error ? <AppText color="danger">{errorMessage(existing.error)}</AppText> : <LoadingView />}
      </Screen>
    );
  }
  return <GoalForm key={id ?? 'nueva'} initial={existing.data?.goal} />;
}

function GoalForm({ initial }: { initial?: Goal }) {
  const id = initial?.id;
  const { spacing } = useTheme();
  const [name, setName] = useState(initial?.name ?? '');
  const [target, setTarget] = useState(initial ? formatAmountInput(String(initial.targetAmount)) : '');
  const [date, setDate] = useState(initial?.targetDate ?? '');
  const [priority, setPriority] = useState<'alta' | 'media' | 'baja'>(initial?.priority ?? 'media');
  const [emergency, setEmergency] = useState(initial?.isEmergencyFund ?? false);
  const [saved, setSaved] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function save() {
    const targetAmount = parseAmount(target);
    const local: Record<string, string> = {};
    if (name.trim().length < 2) local.name = 'Ponle un nombre a tu meta';
    if (!targetAmount) local.targetAmount = 'Escribe cuánto necesitas';
    if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) local.targetDate = 'Usa el formato AAAA-MM-DD';
    else if (date && date <= todayKey()) local.targetDate = 'La fecha debe ser futura';
    setErrors(local);
    setFormError(null);
    if (Object.keys(local).length) return;
    setSaving(true);
    try {
      const input = { name: name.trim(), targetAmount: targetAmount!, targetDate: date || null, priority, isEmergencyFund: emergency };
      if (id) {
        await updateGoal(id, input);
        router.back();
      } else {
        const { goal } = await createGoal({ ...input, initialSavedAmount: parseAmount(saved) ?? 0 });
        router.replace({ pathname: '/goal/[id]', params: { id: goal.id } });
      }
    } catch (error) {
      setErrors(error instanceof ApiError ? error.fieldErrors() : {});
      setFormError(errorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen scroll edges={['top', 'bottom']}>
      <Header title={id ? 'Editar meta' : 'Nueva meta'} />
      <TextField label="¿Para qué estás ahorrando?" value={name} onChangeText={setName} placeholder="Ej.: moto, viaje, fondo de emergencia" maxLength={80} error={errors.name} />
      <TextField label="¿Cuánto necesitas?" prefix="$" keyboardType="number-pad" value={target} onChangeText={(t) => setTarget(formatAmountInput(t))} placeholder="8.000.000" error={errors.targetAmount} />
      {!id ? (
        <TextField
          label="¿Ya tienes algo ahorrado para esto? (opcional)"
          prefix="$"
          keyboardType="number-pad"
          value={saved}
          onChangeText={(t) => setSaved(formatAmountInput(t))}
          placeholder="0"
          hint="No cuenta como movimiento de este mes"
          error={errors.initialSavedAmount}
        />
      ) : null}
      <View style={{ gap: spacing.sm }}>
        <AppText variant="label" color="textMuted">
          ¿Para cuándo? (opcional)
        </AppText>
        <ChipGroup>
          <Chip label="Sin fecha" selected={!date} onPress={() => setDate('')} />
          {QUICK_DATES.map((months) => (
            <Chip key={months} label={`En ${months} meses`} selected={date === inMonths(months)} onPress={() => setDate(inMonths(months))} />
          ))}
        </ChipGroup>
        <TextField label="Fecha deseada (AAAA-MM-DD)" value={date} onChangeText={setDate} placeholder={inMonths(12)} keyboardType="numbers-and-punctuation" error={errors.targetDate} />
      </View>
      <View style={{ gap: spacing.sm }}>
        <AppText variant="label" color="textMuted">
          Prioridad
        </AppText>
        <SegmentedControl
          accessibilityLabel="Prioridad"
          value={priority}
          onChange={setPriority}
          options={[
            { value: 'alta', label: 'Alta' },
            { value: 'media', label: 'Media' },
            { value: 'baja', label: 'Baja' },
          ]}
        />
        <AppText variant="caption" color="textMuted">
          Si tu ahorro no alcanza para todas, las metas de prioridad alta reciben primero su aporte.
        </AppText>
      </View>
      <ToggleRow
        icon="shield"
        title="Es mi fondo de emergencia"
        description="Mostramos cuántos meses de gastos cubre. Solo una meta puede serlo."
        value={emergency}
        onChange={setEmergency}
      />
      {formError ? <AppText color="danger">{formError}</AppText> : null}
      <Button title={id ? 'Guardar cambios' : 'Crear meta'} onPress={save} loading={saving} />
    </Screen>
  );
}
