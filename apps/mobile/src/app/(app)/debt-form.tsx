import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { AppText, Button, errorMessage, Header, Screen, SegmentedControl, TextField } from '@/components/ui';
import { createDebt } from '@/features/finance/api';
import { ApiError } from '@/lib/api';
import { formatAmountInput, parseAmount, parsePercent } from '@/lib/format';
import { useTheme } from '@/theme/useTheme';

/** RF-11: registrar una deuda. Si no conoce la cuota, se calcula con la tasa y el plazo. */
export default function DebtFormScreen() {
  const { spacing } = useTheme();
  const [values, setValues] = useState({ creditor: '', name: '', original: '', balance: '', rate: '', term: '', installment: '', day: '' });
  const [rateType, setRateType] = useState<'EA' | 'MV'>('EA');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const set = (field: keyof typeof values, amount = false) => (text: string) =>
    setValues((current) => ({ ...current, [field]: amount ? formatAmountInput(text) : text }));

  async function save() {
    const originalAmount = parseAmount(values.original);
    const balance = values.balance ? parseAmount(values.balance) : undefined;
    const rate = values.rate ? parsePercent(values.rate) : null;
    const termMonths = values.term ? Number(values.term.replace(/\D/g, '')) : null;
    const installment = values.installment ? parseAmount(values.installment) : null;
    const paymentDay = values.day ? Number(values.day.replace(/\D/g, '')) : null;
    const local: Record<string, string> = {};
    if (values.creditor.trim().length < 2) local.creditor = 'Escribe a quién le debes';
    if (!originalAmount) local.originalAmount = 'Escribe el monto';
    if (balance != null && originalAmount && balance > originalAmount) local.balance = 'No puede superar el monto original';
    if (termMonths !== null && (termMonths < 1 || termMonths > 360)) local.termMonths = 'Entre 1 y 360 meses';
    if (paymentDay !== null && (paymentDay < 1 || paymentDay > 31)) local.paymentDay = 'Entre 1 y 31';
    setErrors(local);
    setFormError(null);
    if (Object.keys(local).length) return;
    setSaving(true);
    try {
      const { debt } = await createDebt({
        creditor: values.creditor.trim(),
        name: values.name.trim() || null,
        originalAmount: originalAmount!,
        balance: balance ?? undefined,
        rate,
        rateType: rate === null ? null : rateType,
        termMonths,
        installment,
        paymentDay,
      });
      router.replace({ pathname: '/debt/[id]', params: { id: debt.id } });
    } catch (error) {
      setErrors(error instanceof ApiError ? error.fieldErrors() : {});
      setFormError(errorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen scroll edges={['top', 'bottom']}>
      <Header title="Nueva deuda" />
      <TextField label="¿A quién le debes?" value={values.creditor} onChangeText={set('creditor')} placeholder="Banco, almacén o persona" error={errors.creditor} />
      <TextField label="Nombre (opcional)" value={values.name} onChangeText={set('name')} placeholder="Ej.: crédito de la moto" />
      <TextField label="Monto original" prefix="$" keyboardType="number-pad" value={values.original} onChangeText={set('original', true)} placeholder="5.000.000" error={errors.originalAmount} />
      <TextField
        label="Saldo actual (opcional)"
        prefix="$"
        keyboardType="number-pad"
        value={values.balance}
        onChangeText={set('balance', true)}
        placeholder="Igual al monto original"
        hint="Si ya pagaste una parte, escribe lo que debes hoy"
        error={errors.balance}
      />
      <View style={{ gap: spacing.sm }}>
        <TextField label="Tasa de interés (opcional)" suffix="%" keyboardType="decimal-pad" value={values.rate} onChangeText={set('rate')} placeholder="24" />
        <SegmentedControl
          accessibilityLabel="Tipo de tasa"
          value={rateType}
          onChange={setRateType}
          options={[
            { value: 'EA', label: 'Efectiva anual' },
            { value: 'MV', label: 'Mensual' },
          ]}
        />
      </View>
      <TextField label="Plazo (opcional)" suffix="meses" keyboardType="number-pad" value={values.term} onChangeText={set('term')} placeholder="36" error={errors.termMonths} />
      <TextField
        label="Cuota mensual (opcional)"
        prefix="$"
        keyboardType="number-pad"
        value={values.installment}
        onChangeText={set('installment', true)}
        placeholder="Se calcula con la tasa y el plazo"
        hint="Si la dejas vacía y diste tasa y plazo, la calculamos con cuota fija"
      />
      <TextField label="Día de pago (opcional)" keyboardType="number-pad" value={values.day} onChangeText={set('day')} placeholder="15" error={errors.paymentDay} />
      {formError ? <AppText color="danger">{formError}</AppText> : null}
      <Button title="Guardar deuda" onPress={save} loading={saving} />
      <AppText variant="caption" color="textMuted">
        ASCENDX AI no consulta ni reporta a centrales de riesgo. Estos datos solo sirven para tu planificación.
      </AppText>
    </Screen>
  );
}
