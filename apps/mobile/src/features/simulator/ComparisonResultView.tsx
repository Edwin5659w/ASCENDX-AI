import { formatCop, formatPercent } from '@ascendx/finance-core';
import { View } from 'react-native';
import { AppText, Card, Icon } from '@/components/ui';
import { formatMonths } from '@/lib/format';
import type { Palette } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';
import type { CompareResult } from './api';

function Row({ label, value, color = 'text' }: { label: string; value: string; color?: keyof Palette }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
      <AppText variant="caption" color="textMuted" style={{ flex: 1 }}>
        {label}
      </AppText>
      <AppText variant="bodyStrong" color={color} style={{ fontVariant: ['tabular-nums'] }}>
        {value}
      </AppText>
    </View>
  );
}

function CreditCard({ title, path, highlighted }: { title: string; path: CompareResult['credit']; highlighted?: boolean }) {
  return (
    <Card highlighted={highlighted}>
      <AppText variant="overline" color="primary">
        {title}
      </AppText>
      <View>
        <AppText variant="caption" color="textMuted">
          Pago mensual
        </AppText>
        <AppText variant="amount">{formatCop(path.monthlyOutflow)}</AppText>
      </View>
      <Row label="Cuota inicial" value={formatCop(path.downPayment)} />
      <Row label="Monto financiado" value={formatCop(path.financedAmount)} />
      <Row label="Intereses" value={formatCop(path.totalInterest)} color="danger" />
      <Row label="Pagas en total" value={formatCop(path.totalPaid)} />
      <Row label="Costo extra frente a contado" value={formatCop(path.extraCost)} color="danger" />
      <Row
        label="Tendrías el bien"
        value={path.monthsToOwnership === null ? 'Sin fecha estimada' : formatMonths(path.monthsToOwnership)}
      />
    </Card>
  );
}

export function ComparisonResultView({ result }: { result: CompareResult }) {
  const { colors, radius, spacing } = useTheme();
  const { credit, saving, mixed } = result;
  const extra = credit.totalPaid - saving.totalPaid;

  return (
    <View style={{ gap: spacing.lg }}>
      <CreditCard title="Crédito hoy" path={credit} highlighted />
      {mixed ? <CreditCard title="Mixto: ahorras la cuota inicial y financias el resto" path={mixed} /> : null}

      <Card>
        <AppText variant="overline" color="success">
          Ahorrando
        </AppText>
        <View>
          <AppText variant="caption" color="textMuted">
            Tiempo para reunir el precio
          </AppText>
          <AppText variant="amount">{saving.months === null ? 'Sin calcular' : formatMonths(saving.months)}</AppText>
        </View>
        <Row label="Pagas en total" value={formatCop(saving.totalPaid)} />
        <Row label="Intereses" value={formatCop(0)} color="success" />
      </Card>

      <Card>
        <AppText variant="heading">La diferencia</AppText>
        <AppText color="textMuted">
          El crédito de hoy cuesta {formatCop(Math.max(0, extra))} más que ahorrar
          {saving.months ? ` y te da el bien ${formatMonths(saving.months)} antes.` : '.'}
        </AppText>
        <AppText variant="caption" color="textSubtle">
          Tasa equivalente: {formatPercent(result.effectiveAnnualRate)} E.A.
        </AppText>
      </Card>

      {result.warnings.map((warning) => (
        <View
          key={warning.code}
          style={{ flexDirection: 'row', gap: spacing.md, padding: spacing.lg, borderRadius: radius.md, backgroundColor: colors.warningSoft }}
        >
          <Icon name="warning" color="warning" size={20} />
          <AppText variant="caption" style={{ flex: 1 }}>
            {warning.message}
          </AppText>
        </View>
      ))}

      <Card>
        <AppText variant="overline" color="textMuted">
          Supuestos del cálculo
        </AppText>
        {result.assumptions.map((assumption) => (
          <AppText key={assumption} variant="caption" color="textMuted">
            • {assumption}
          </AppText>
        ))}
      </Card>

      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        <Icon name="info" color="textSubtle" size={16} />
        <AppText variant="caption" color="textSubtle" style={{ flex: 1 }}>
          {result.disclaimer}
        </AppText>
      </View>
    </View>
  );
}
