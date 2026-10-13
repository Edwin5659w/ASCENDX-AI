import { formatCop, formatPercent } from '@ascendx/finance-core';
import { View } from 'react-native';
import { FadeIn } from '@/components/motion';
import { AnimatedAmount, AppText, Card, Icon } from '@/components/ui';
import { formatMonths } from '@/lib/format';
import type { Palette } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';
import type { CompareResult } from './api';

function Row({
  label,
  value,
  amount,
  color = 'text',
}: {
  label: string;
  value?: string;
  /** Monto en pesos: se muestra contando hasta su valor. */
  amount?: number;
  color?: keyof Palette;
}) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
      <AppText variant="caption" color="textMuted" style={{ flex: 1 }}>
        {label}
      </AppText>
      {amount !== undefined ? (
        <AnimatedAmount variant="bodyStrong" color={color} value={amount} format={formatCop} delay={200} />
      ) : (
        <AppText variant="bodyStrong" color={color} style={{ fontVariant: ['tabular-nums'] }}>
          {value}
        </AppText>
      )}
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
        <AnimatedAmount variant="amount" value={path.monthlyOutflow} format={formatCop} />
      </View>
      <Row label="Cuota inicial" amount={path.downPayment} />
      <Row label="Monto financiado" amount={path.financedAmount} />
      <Row label="Intereses" amount={path.totalInterest} color="danger" />
      <Row label="Pagas en total" amount={path.totalPaid} />
      <Row label="Costo extra frente a contado" amount={path.extraCost} color="danger" />
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
      <FadeIn>
        <CreditCard title="Crédito hoy" path={credit} highlighted />
      </FadeIn>
      {mixed ? (
        <FadeIn delay={90}>
          <CreditCard title="Mixto: ahorras la cuota inicial y financias el resto" path={mixed} />
        </FadeIn>
      ) : null}

      <FadeIn delay={180}>
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
        <Row label="Pagas en total" amount={saving.totalPaid} />
        <Row label="Intereses" amount={0} color="success" />
      </Card>
      </FadeIn>

      <FadeIn delay={270}>
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
      </FadeIn>

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
