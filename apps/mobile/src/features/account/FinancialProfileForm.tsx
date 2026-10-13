import { useState } from 'react';
import { View } from 'react-native';
import { Button, TextField } from '@/components/ui';
import { FormError } from '@/features/auth/AuthShell';
import { ApiError, type FinancialProfile } from '@/lib/api';
import { formatAmountInput, parseAmount } from '@/lib/format';
import { useTheme } from '@/theme/useTheme';

export interface FinancialProfileValues {
  estimatedIncome: number | null;
  estimatedFixedExpenses: number | null;
  payDay: number | null;
}

interface Props {
  initial: FinancialProfile | null;
  submitLabel: string;
  onSubmit: (values: FinancialProfileValues) => Promise<void>;
  /** Acción secundaria opcional (p. ej. «Completar después») */
  secondary?: { label: string; onPress: () => void };
}

const toInput = (value: number | null | undefined) => (value == null ? '' : formatAmountInput(String(value)));

/**
 * Perfil financiero inicial (RF-04): ingreso y gastos fijos estimados y día
 * de pago. Sirve para estimar la capacidad de ahorro mientras no haya meses
 * completos registrados (sección 6.2).
 */
export function FinancialProfileForm({ initial, submitLabel, onSubmit, secondary }: Props) {
  const { spacing } = useTheme();
  const [income, setIncome] = useState(toInput(initial?.estimatedIncome));
  const [fixed, setFixed] = useState(toInput(initial?.estimatedFixedExpenses));
  const [payDay, setPayDay] = useState(initial?.payDay ? String(initial.payDay) : '');
  const [errors, setErrors] = useState<{ income?: string; fixed?: string; payDay?: string; form?: string }>({});
  const [saving, setSaving] = useState(false);

  async function handleSubmit() {
    const day = payDay ? Number(payDay) : null;
    const localErrors: typeof errors = {};
    if (day !== null && (!Number.isInteger(day) || day < 1 || day > 31)) localErrors.payDay = 'Escribe un día entre 1 y 31';
    setErrors(localErrors);
    if (Object.keys(localErrors).length > 0) return;

    setSaving(true);
    try {
      await onSubmit({ estimatedIncome: parseAmount(income), estimatedFixedExpenses: parseAmount(fixed), payDay: day });
    } catch (err) {
      setErrors({ form: err instanceof ApiError ? err.message : 'No se pudo guardar el perfil.' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={{ gap: spacing.xl }}>
      <TextField
        label="¿Cuánto recibes al mes, aproximadamente?"
        icon="wallet"
        prefix="$"
        keyboardType="number-pad"
        value={income}
        onChangeText={(text) => setIncome(formatAmountInput(text))}
        placeholder="2.500.000"
        hint="Salario, honorarios u otros ingresos fijos. Si varía, usa un promedio."
        error={errors.income}
      />
      <TextField
        label="¿Cuánto suman tus gastos fijos al mes?"
        icon="document"
        prefix="$"
        keyboardType="number-pad"
        value={fixed}
        onChangeText={(text) => setFixed(formatAmountInput(text))}
        placeholder="1.400.000"
        hint="Arriendo, servicios, transporte, mercado básico. Sin contar cuotas de deudas."
        error={errors.fixed}
      />
      <TextField
        label="Día del mes en que te pagan"
        icon="calendar"
        keyboardType="number-pad"
        value={payDay}
        onChangeText={(text) => setPayDay(text.replace(/\D/g, '').slice(0, 2))}
        placeholder="30"
        hint="Opcional. Lo usaremos para tus recordatorios."
        error={errors.payDay}
      />
      {errors.form ? <FormError message={errors.form} /> : null}
      <View style={{ gap: spacing.md }}>
        <Button title={submitLabel} onPress={handleSubmit} loading={saving} />
        {secondary ? <Button title={secondary.label} variant="ghost" onPress={secondary.onPress} /> : null}
      </View>
    </View>
  );
}
