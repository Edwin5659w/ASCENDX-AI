import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { AppText, Button, Screen, TextField } from '@/components/ui';
import { compareScenarios, type CompareResult, type RateType } from '@/features/simulator/api';
import { ComparisonResultView } from '@/features/simulator/ComparisonResultView';
import { ApiError } from '@/lib/api';
import { formatAmountInput, parseAmount, parsePercent } from '@/lib/format';
import { useTheme } from '@/theme/useTheme';

type Field = 'assetPrice' | 'downPayment' | 'interestRate' | 'termMonths' | 'monthlySavingAmount' | 'currentSavings';

function RateTypeToggle({ value, onChange }: { value: RateType; onChange: (value: RateType) => void }) {
  const { colors, radius, spacing } = useTheme();
  const options: { value: RateType; label: string }[] = [
    { value: 'EA', label: 'Efectiva anual (E.A.)' },
    { value: 'MV', label: 'Mensual (M.V.)' },
  ];
  return (
    <View
      accessibilityRole="radiogroup"
      style={{ flexDirection: 'row', backgroundColor: colors.surfaceAlt, borderRadius: radius.md, padding: 4 }}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            onPress={() => onChange(option.value)}
            style={{
              flex: 1,
              paddingVertical: spacing.sm,
              borderRadius: radius.sm,
              alignItems: 'center',
              backgroundColor: selected ? colors.surface : 'transparent',
            }}
          >
            <AppText variant="caption" color={selected ? 'primary' : 'textMuted'}>
              {option.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function SimulatorScreen() {
  const { spacing } = useTheme();
  const [values, setValues] = useState<Record<Field, string>>({
    assetPrice: '',
    downPayment: '',
    interestRate: '',
    termMonths: '',
    monthlySavingAmount: '',
    currentSavings: '',
  });
  const [rateType, setRateType] = useState<RateType>('EA');
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [result, setResult] = useState<CompareResult | null>(null);
  const [loading, setLoading] = useState(false);

  const setAmount = (field: Field) => (text: string) =>
    setValues((current) => ({ ...current, [field]: formatAmountInput(text) }));

  async function handleCompare() {
    const assetPrice = parseAmount(values.assetPrice);
    const downPayment = parseAmount(values.downPayment) ?? 0;
    const interestRate = parsePercent(values.interestRate);
    const termMonths = parseAmount(values.termMonths);
    const monthlySavingAmount = parseAmount(values.monthlySavingAmount);
    const currentSavings = parseAmount(values.currentSavings) ?? 0;

    const localErrors: Partial<Record<Field, string>> = {};
    if (!assetPrice) localErrors.assetPrice = 'Escribe el precio';
    if (assetPrice && downPayment > assetPrice) localErrors.downPayment = 'No puede superar el precio';
    if (interestRate === null) localErrors.interestRate = 'Escribe la tasa';
    if (!termMonths || termMonths > 360) localErrors.termMonths = 'Entre 1 y 360 meses';
    if (monthlySavingAmount === null) localErrors.monthlySavingAmount = 'Escribe cuánto puedes ahorrar';
    setErrors(localErrors);
    setFormError(null);
    if (Object.keys(localErrors).length > 0) return;

    setLoading(true);
    try {
      const response = await compareScenarios({
        price: assetPrice!,
        downPayment,
        rate: interestRate!,
        rateType,
        termMonths: termMonths!,
        monthlySaving: monthlySavingAmount!,
        currentSavings,
      });
      setResult(response);
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'No se pudo calcular la simulación.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen scroll>
      <View style={{ gap: spacing.xs }}>
        <AppText variant="title">¿Ahorrar o financiar?</AppText>
        <AppText color="textMuted">Compara los dos caminos para comprar un bien con los mismos supuestos.</AppText>
      </View>

      <TextField
        label="Precio del bien"
        prefix="$"
        keyboardType="number-pad"
        value={values.assetPrice}
        onChangeText={setAmount('assetPrice')}
        placeholder="60.000.000"
        error={errors.assetPrice}
      />
      <TextField
        label="Cuota inicial"
        prefix="$"
        keyboardType="number-pad"
        value={values.downPayment}
        onChangeText={setAmount('downPayment')}
        placeholder="0"
        error={errors.downPayment}
      />
      <TextField
        label="Tasa de interés"
        suffix="%"
        keyboardType="decimal-pad"
        value={values.interestRate}
        onChangeText={(text) => setValues((current) => ({ ...current, interestRate: text }))}
        placeholder="18,5"
        hint="Tal como te la da el banco"
        error={errors.interestRate}
      />
      <RateTypeToggle value={rateType} onChange={setRateType} />
      <TextField
        label="Plazo"
        suffix="meses"
        keyboardType="number-pad"
        value={values.termMonths}
        onChangeText={(text) => setValues((current) => ({ ...current, termMonths: text.replace(/\D/g, '') }))}
        placeholder="48"
        error={errors.termMonths}
      />
      <TextField
        label="¿Cuánto puedes ahorrar al mes?"
        prefix="$"
        keyboardType="number-pad"
        value={values.monthlySavingAmount}
        onChangeText={setAmount('monthlySavingAmount')}
        placeholder="1.500.000"
        error={errors.monthlySavingAmount}
      />
      <TextField
        label="Ahorro que ya tienes para esto"
        prefix="$"
        keyboardType="number-pad"
        value={values.currentSavings}
        onChangeText={setAmount('currentSavings')}
        placeholder="0"
        error={errors.currentSavings}
      />

      {formError ? <AppText color="danger">{formError}</AppText> : null}

      <Button title="Comparar" onPress={handleCompare} loading={loading} />

      {result ? <ComparisonResultView result={result} /> : null}
    </Screen>
  );
}
