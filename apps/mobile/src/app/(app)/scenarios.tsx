import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { AppText, Button, Card, EmptyView, ErrorView, Header, Icon, LoadingView, Screen } from '@/components/ui';
import { formatDay } from '@/features/finance/labels';
import { deleteScenario, getScenarios, type SavedScenario } from '@/features/simulator/api';
import { ComparisonResultView } from '@/features/simulator/ComparisonResultView';
import { formatCop, formatMonths } from '@/lib/format';
import { useQuery } from '@/lib/query';
import { useTheme } from '@/theme/useTheme';

/** RF-22: escenarios guardados. RF-34: comparar dos lado a lado. */
export default function ScenariosScreen() {
  const { colors, radius, spacing } = useTheme();
  const { data, error, loading, refetch } = useQuery('scenarios', getScenarios);
  const [selected, setSelected] = useState<string[]>([]);
  const [open, setOpen] = useState<string | null>(null);
  const scenarios = data?.scenarios ?? [];
  const picked = scenarios.filter((s) => selected.includes(s.id));

  const toggle = (id: string) =>
    setSelected((current) => (current.includes(id) ? current.filter((x) => x !== id) : [...current.slice(-1), id]));

  return (
    <Screen scroll edges={['top', 'bottom']} animateIn={false}>
      <Header title="Escenarios guardados" />
      {loading ? <LoadingView /> : null}
      {error && !data ? <ErrorView error={error} onRetry={refetch} /> : null}
      {data && scenarios.length === 0 ? (
        <EmptyView
          icon="bookmark"
          title="Aún no has guardado escenarios"
          description="En el simulador, después de comparar, toca «Guardar escenario» para revisarlo luego o compararlo con otro."
          action={{ title: 'Ir al simulador', onPress: () => router.push('/simulator') }}
        />
      ) : null}

      {scenarios.length >= 2 ? (
        <AppText variant="caption" color="textMuted">
          Marca dos escenarios para compararlos lado a lado.
        </AppText>
      ) : null}

      {picked.length === 2 ? <CompareTable a={picked[0]!} b={picked[1]!} /> : null}

      {scenarios.map((scenario) => {
        const isSelected = selected.includes(scenario.id);
        return (
          <Card key={scenario.id} highlighted={isSelected}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
              {scenarios.length >= 2 ? (
                <Pressable
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: isSelected }}
                  accessibilityLabel={`Comparar ${scenario.name}`}
                  onPress={() => toggle(scenario.id)}
                  style={{
                    width: 44,
                    height: 44,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: radius.md,
                    borderWidth: 1.5,
                    borderColor: isSelected ? colors.primary : colors.border,
                    backgroundColor: isSelected ? colors.primarySoft : 'transparent',
                  }}
                >
                  {isSelected ? <Icon name="checkSmall" color="primary" /> : null}
                </Pressable>
              ) : null}
              <View style={{ flex: 1 }}>
                <AppText variant="bodyStrong">{scenario.name}</AppText>
                <AppText variant="caption" color="textMuted">
                  {formatCop(scenario.input.price)} · {scenario.input.termMonths} meses · guardado el {formatDay(scenario.createdAt.slice(0, 10))}
                </AppText>
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: spacing.md }}>
              <Mini label="Cuota" value={formatCop(scenario.results.credit.installment)} />
              <Mini label="Pagarías de más" value={formatCop(scenario.results.credit.extraCost)} />
              <Mini label="Ahorrando" value={scenario.results.saving.months === null ? '—' : formatMonths(scenario.results.saving.months)} />
            </View>
            {open === scenario.id ? <ComparisonResultView result={scenario.results} /> : null}
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <View style={{ flex: 1 }}>
                <Button title={open === scenario.id ? 'Ocultar detalle' : 'Ver detalle'} variant="secondary" onPress={() => setOpen(open === scenario.id ? null : scenario.id)} />
              </View>
              <View style={{ flex: 1 }}>
                <Button title="Borrar" variant="ghost" onPress={() => deleteScenario(scenario.id)} />
              </View>
            </View>
          </Card>
        );
      })}
    </Screen>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flex: 1, gap: 2 }}>
      <AppText variant="caption" color="textMuted">
        {label}
      </AppText>
      <AppText variant="label">{value}</AppText>
    </View>
  );
}

function CompareTable({ a, b }: { a: SavedScenario; b: SavedScenario }) {
  const { colors, spacing } = useTheme();
  const rows: { label: string; a: number | null; b: number | null; money?: boolean; lowerIsBetter?: boolean }[] = [
    { label: 'Precio', a: a.input.price, b: b.input.price, money: true },
    { label: 'Cuota mensual', a: a.results.credit.monthlyOutflow, b: b.results.credit.monthlyOutflow, money: true, lowerIsBetter: true },
    { label: 'Intereses totales', a: a.results.credit.totalInterest, b: b.results.credit.totalInterest, money: true, lowerIsBetter: true },
    { label: 'Total pagado a crédito', a: a.results.credit.totalPaid, b: b.results.credit.totalPaid, money: true, lowerIsBetter: true },
    { label: 'Pagarías de más', a: a.results.credit.extraCost, b: b.results.credit.extraCost, money: true, lowerIsBetter: true },
    { label: 'Meses ahorrando', a: a.results.saving.months, b: b.results.saving.months, lowerIsBetter: true },
  ];
  const fmt = (value: number | null, money?: boolean) => (value === null ? '—' : money ? formatCop(value) : formatMonths(value));
  return (
    <Card elevated>
      <AppText variant="heading">Comparación</AppText>
      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        <View style={{ flex: 1.1 }} />
        <AppText variant="label" style={{ flex: 1 }} numberOfLines={2}>
          {a.name}
        </AppText>
        <AppText variant="label" style={{ flex: 1 }} numberOfLines={2}>
          {b.name}
        </AppText>
      </View>
      {rows.map((row) => {
        const better = row.lowerIsBetter && row.a !== null && row.b !== null && row.a !== row.b ? (row.a < row.b ? 'a' : 'b') : null;
        return (
          <View key={row.label} style={{ flexDirection: 'row', gap: spacing.sm, paddingVertical: 6, borderTopWidth: 1, borderTopColor: colors.border }}>
            <AppText variant="caption" color="textMuted" style={{ flex: 1.1 }}>
              {row.label}
            </AppText>
            <AppText variant="label" color={better === 'a' ? 'success' : 'text'} style={{ flex: 1 }}>
              {fmt(row.a, row.money)}
              {better === 'a' ? ' ✓' : ''}
            </AppText>
            <AppText variant="label" color={better === 'b' ? 'success' : 'text'} style={{ flex: 1 }}>
              {fmt(row.b, row.money)}
              {better === 'b' ? ' ✓' : ''}
            </AppText>
          </View>
        );
      })}
      <AppText variant="caption" color="textMuted">
        ✓ marca el valor más bajo en cada fila. Simulación educativa: no es una oferta ni una aprobación de crédito.
      </AppText>
    </Card>
  );
}
