import { View } from 'react-native';
import { AppText, Card, Icon } from '@/components/ui';
import { formatCop, formatMonths } from '@/lib/format';
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

export function ComparisonResultView({ result }: { result: CompareResult }) {
  const { colors, radius, spacing } = useTheme();
  const { financing, saving, difference } = result;

  return (
    <View style={{ gap: spacing.lg }}>
      <Card highlighted>
        <AppText variant="overline" color="primary">
          Si financias
        </AppText>
        <View>
          <AppText variant="caption" color="textMuted">
            Cuota mensual
          </AppText>
          <AppText variant="amount">{formatCop(financing.loan.monthlyOutflow)}</AppText>
        </View>
        <Row label="Monto financiado" value={formatCop(financing.financedAmount)} />
        <Row label={`Intereses en ${financing.loan.termMonths} meses`} value={formatCop(financing.loan.totalInterest)} color="expense" />
        {financing.loan.totalFees > 0 ? <Row label="Seguros y cargos" value={formatCop(financing.loan.totalFees)} /> : null}
        <Row label="Pagas en total" value={formatCop(financing.totalCost)} />
        <Row
          label="Tendrías el bien"
          value={financing.monthsUntilOwnership === null ? 'Sin fecha estimada' : formatMonths(financing.monthsUntilOwnership)}
        />
        <AppText variant="caption" color="textSubtle">
          Tasa equivalente: {(financing.effectiveAnnualRate * 100).toFixed(2).replace(".", ",")} % E.A.
        </AppText>
      </Card>

      <Card>
        <AppText variant="overline" color="income">
          Si ahorras
        </AppText>
        <View>
          <AppText variant="caption" color="textMuted">
            Tiempo para ahorrarlo
          </AppText>
          <AppText variant="amount">
            {saving.monthsToSave === null ? 'No alcanzable' : formatMonths(saving.monthsToSave)}
          </AppText>
        </View>
        <Row label="Pagas en total" value={formatCop(saving.totalCost)} />
        <Row label="Intereses" value={formatCop(0)} color="income" />
      </Card>

      <Card>
        <AppText variant="heading">La diferencia</AppText>
        <AppText color="textMuted">
          Financiar cuesta{' '}
          <AppText variant="bodyStrong" color="text">
            {formatCop(Math.max(0, difference.extraCostOfFinancing))}
          </AppText>{' '}
          más
          {difference.monthsGainedByFinancing !== null && difference.monthsGainedByFinancing > 0 ? (
            <>
              {' '}
              y te da el bien{' '}
              <AppText variant="bodyStrong" color="text">
                {formatMonths(difference.monthsGainedByFinancing)}
              </AppText>{' '}
              antes.
            </>
          ) : (
            '.'
          )}
        </AppText>
      </Card>

      {result.warnings.map((warning) => (
        <View
          key={warning.code}
          style={{
            flexDirection: 'row',
            gap: spacing.md,
            padding: spacing.lg,
            borderRadius: radius.md,
            backgroundColor: colors.warningSoft,
          }}
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
