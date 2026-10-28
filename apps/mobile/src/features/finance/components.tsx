import { SymbolView } from 'expo-symbols';
import type { ComponentProps } from 'react';
import { Pressable, View } from 'react-native';
import Svg, { Line, Rect } from 'react-native-svg';
import { PressableScale } from '@/components/motion';
import { AppText, Icon, ProgressBar, ProgressRing } from '@/components/ui';
import { formatCop } from '@/lib/format';
import { useTheme } from '@/theme/useTheme';
import type { Dashboard, Debt, Goal, Transaction } from './api';
import {
  formatDay,
  monthLabel,
  MOVEMENT_ICONS,
  MOVEMENT_LABELS,
  movementSign,
  movementTone,
  PLAN_STATUS,
  PRIORITY_LABELS,
  shortMonth,
} from './labels';

/** Ícono de categoría (nombre de Material Symbols guardado en la base de datos). */
export function CategoryIcon({ icon, color, size = 40 }: { icon: string | null; color: string | null; size?: number }) {
  const { colors, radius } = useTheme();
  const tint = color ?? colors.textMuted;
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: radius.md,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: `${tint}22`,
      }}
    >
      <SymbolView
        name={{ android: icon ?? 'category', ios: 'circle.grid.2x2', web: icon ?? 'category' } as ComponentProps<typeof SymbolView>['name']}
        size={size * 0.5}
        tintColor={tint}
      />
    </View>
  );
}

export function MovementRow({ movement, onPress }: { movement: Transaction; onPress?: () => void }) {
  const { colors, radius, spacing } = useTheme();
  const title =
    movement.category?.name ??
    (movement.debt ? `Pago · ${movement.debt.name}` : movement.goal ? `${MOVEMENT_LABELS[movement.type]} · ${movement.goal.name}` : MOVEMENT_LABELS[movement.type]);
  const subtitle = [movement.description, formatDay(movement.date)].filter(Boolean).join(' · ');
  const sign = movementSign(movement.type);
  return (
    <PressableScale
      scaleTo={0.98}
      accessibilityRole="button"
      accessibilityLabel={`${MOVEMENT_LABELS[movement.type]}: ${title}, ${sign === '+' ? 'más' : 'menos'} ${formatCop(movement.amount)}, ${formatDay(movement.date)}`}
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        minHeight: 60,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.sm,
        marginHorizontal: -spacing.sm,
        borderRadius: radius.md,
        backgroundColor: pressed ? colors.surfaceAlt : 'transparent',
      })}
    >
      {movement.category ? (
        <CategoryIcon icon={movement.category.icon} color={movement.category.color} />
      ) : (
        <View style={{ width: 40, height: 40, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceAlt }}>
          <Icon name={MOVEMENT_ICONS[movement.type]} size={20} color="textMuted" />
        </View>
      )}
      <View style={{ flex: 1 }}>
        <AppText variant="bodyStrong" numberOfLines={1}>
          {title}
        </AppText>
        <AppText variant="caption" color="textMuted" numberOfLines={1}>
          {subtitle}
          {movement.source === 'ocr' ? ' · recibo' : movement.source === 'recurrente' ? ' · recurrente' : ''}
        </AppText>
      </View>
      <AppText variant="amountSmall" color={movementTone(movement.type)}>
        {sign} {formatCop(movement.amount)}
      </AppText>
    </PressableScale>
  );
}

export function MonthSwitcher({ month, onChange, canGoNext }: { month: string; onChange: (delta: number) => void; canGoNext: boolean }) {
  const { colors, radius, spacing } = useTheme();
  const arrow = (delta: number, label: string, disabled: boolean) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={() => onChange(delta)}
      style={({ pressed }) => ({
        width: 44,
        height: 44,
        borderRadius: radius.md,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: disabled ? 0.3 : 1,
        backgroundColor: pressed ? colors.surfaceAlt : 'transparent',
      })}
    >
      <View style={{ transform: [{ rotate: delta < 0 ? '180deg' : '0deg' }] }}>
        <Icon name="chevronRight" />
      </View>
    </Pressable>
  );
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
      {arrow(-1, 'Mes anterior', false)}
      <AppText variant="heading" align="center" style={{ flex: 1 }} accessibilityLiveRegion="polite">
        {monthLabel(month)}
      </AppText>
      {arrow(1, 'Mes siguiente', !canGoNext)}
    </View>
  );
}

/** RF-15: gastos por categoría como barras horizontales con porcentaje y monto. */
export function CategoryBars({ items }: { items: Dashboard['byCategory'] }) {
  const { colors, spacing } = useTheme();
  const max = Math.max(...items.map((item) => item.total), 1);
  return (
    <View style={{ gap: spacing.md }}>
      {items.slice(0, 6).map((item) => (
        <View key={item.category.id} style={{ gap: 6 }} accessibilityLabel={`${item.category.name}: ${formatCop(item.total)}, ${item.percent} %`}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm }}>
            <AppText variant="label" style={{ flex: 1 }} numberOfLines={1}>
              {item.category.name}
            </AppText>
            <AppText variant="label" color="textMuted">
              {formatCop(item.total)} · {String(item.percent).replace('.', ',')} %
            </AppText>
          </View>
          <View style={{ height: 8, borderRadius: 4, backgroundColor: colors.surfaceAlt, overflow: 'hidden' }}>
            <View style={{ width: `${(item.total / max) * 100}%`, height: 8, borderRadius: 4, backgroundColor: item.category.color ?? colors.primary }} />
          </View>
        </View>
      ))}
    </View>
  );
}

/** RF-15: evolución de seis meses (ingresos frente a gastos), con etiquetas de texto. */
export function EvolutionChart({ months }: { months: Dashboard['evolution'] }) {
  const { colors, spacing } = useTheme();
  const height = 120;
  const width = 300;
  const max = Math.max(...months.flatMap((m) => [m.income, m.expenses + m.debtPayments]), 1);
  const slot = width / months.length;
  const bar = Math.min(14, slot / 3);
  const summary = months.map((m) => `${shortMonth(m.month)}: ingresos ${formatCop(m.income)}, gastos ${formatCop(m.expenses)}`).join('; ');
  return (
    <View style={{ gap: spacing.sm }}>
      <View accessible accessibilityLabel={`Evolución de seis meses. ${summary}`}>
        <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
          <Line x1={0} y1={height - 1} x2={width} y2={height - 1} stroke={colors.border} strokeWidth={1} />
          {months.map((m, index) => {
            const x = index * slot + slot / 2;
            const incomeH = (m.income / max) * (height - 8);
            return (
              <Rect key={`i-${m.month}`} x={x - bar - 1} y={height - 1 - incomeH} width={bar} height={incomeH} rx={3} fill={colors.primary} />
            );
          })}
          {months.map((m, index) => {
            const x = index * slot + slot / 2;
            const expenseH = ((m.expenses + m.debtPayments) / max) * (height - 8);
            return <Rect key={`g-${m.month}`} x={x + 1} y={height - 1 - expenseH} width={bar} height={expenseH} rx={3} fill={colors.violetText} />;
          })}
        </Svg>
        <View style={{ flexDirection: 'row' }}>
          {months.map((m) => (
            <AppText key={m.month} variant="caption" color="textMuted" align="center" style={{ flex: 1 }}>
              {shortMonth(m.month)}
            </AppText>
          ))}
        </View>
      </View>
      <View style={{ flexDirection: 'row', gap: spacing.lg }}>
        <Legend color={colors.primary} label="Ingresos" />
        <Legend color={colors.violetText} label="Gastos y pagos de deuda" />
      </View>
    </View>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: color }} />
      <AppText variant="caption" color="textMuted">
        {label}
      </AppText>
    </View>
  );
}

export function StatusBadge({ status }: { status: keyof typeof PLAN_STATUS | string }) {
  const { colors, radius } = useTheme();
  const info = PLAN_STATUS[status] ?? { label: status, tone: 'textMuted' as const, icon: 'info' as const };
  const background = info.tone === 'warning' ? colors.warningSoft : info.tone === 'danger' ? colors.dangerSoft : colors.successSoft;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.pill, backgroundColor: background, alignSelf: 'flex-start' }}>
      <Icon name={info.icon} size={14} color={info.tone} />
      <AppText variant="caption" color={info.tone}>
        {info.label}
      </AppText>
    </View>
  );
}

export function GoalCard({ goal, onPress }: { goal: Goal; onPress?: () => void }) {
  const { colors, radius, spacing } = useTheme();
  const percent = goal.plan?.progress.percent ?? Math.min(100, (goal.savedAmount / Math.max(1, goal.targetAmount)) * 100);
  const status = goal.status === 'pausada' ? null : goal.status === 'completada' ? 'completada' : (goal.plan?.status ?? null);
  return (
    <PressableScale
      scaleTo={0.98}
      accessibilityRole="button"
      accessibilityLabel={`Meta ${goal.name}: ${formatCop(goal.savedAmount)} de ${formatCop(goal.targetAmount)}, ${Math.floor(percent)} %`}
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.lg,
        padding: spacing.lg,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: pressed ? colors.surfaceAlt : colors.surface,
        opacity: goal.status === 'pausada' ? 0.7 : 1,
      })}
    >
      <ProgressRing value={percent / 100} size={68} strokeWidth={7} milestones={[0.25, 0.5, 0.75]} accessibilityLabel={`${Math.floor(percent)} %`}>
        <AppText variant="label">{Math.floor(percent)} %</AppText>
      </ProgressRing>
      <View style={{ flex: 1, gap: 4 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <AppText variant="bodyStrong" numberOfLines={1} style={{ flexShrink: 1 }}>
            {goal.name}
          </AppText>
          {goal.isEmergencyFund ? <Icon name="shield" size={16} color="mint" /> : null}
        </View>
        <AppText variant="caption" color="textMuted">
          {formatCop(goal.savedAmount)} de {formatCop(goal.targetAmount)} · prioridad {PRIORITY_LABELS[goal.priority].toLowerCase()}
        </AppText>
        {goal.status === 'pausada' ? (
          <AppText variant="caption" color="textMuted">
            Pausada: no recibe aportes del reparto
          </AppText>
        ) : status ? (
          <StatusBadge status={status} />
        ) : null}
      </View>
      <Icon name="chevronRight" color="textSubtle" />
    </PressableScale>
  );
}

export function DebtCard({ debt, onPress }: { debt: Debt; onPress?: () => void }) {
  const { colors, radius, spacing } = useTheme();
  return (
    <PressableScale
      scaleTo={0.98}
      accessibilityRole="button"
      accessibilityLabel={`Deuda ${debt.name ?? debt.creditor}: saldo ${formatCop(debt.balance)}`}
      onPress={onPress}
      style={({ pressed }) => ({
        gap: spacing.sm,
        padding: spacing.lg,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: pressed ? colors.surfaceAlt : colors.surface,
      })}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
        <View style={{ width: 40, height: 40, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceAlt }}>
          <Icon name="debt" size={20} color="textMuted" />
        </View>
        <View style={{ flex: 1 }}>
          <AppText variant="bodyStrong" numberOfLines={1}>
            {debt.name ?? debt.creditor}
          </AppText>
          <AppText variant="caption" color="textMuted" numberOfLines={1}>
            {debt.name ? `${debt.creditor} · ` : ''}
            {debt.status === 'pagada' ? 'Pagada' : debt.nextPaymentDate ? `Próximo pago: ${formatDay(debt.nextPaymentDate)}` : 'Sin día de pago'}
          </AppText>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <AppText variant="amountSmall">{formatCop(debt.balance)}</AppText>
          {debt.installment ? (
            <AppText variant="caption" color="textMuted">
              Cuota {formatCop(debt.installment)}
            </AppText>
          ) : null}
        </View>
      </View>
      <ProgressBar value={debt.percentPaid / 100} label={`Pagado ${debt.percentPaid} %`} />
      <AppText variant="caption" color="textMuted">
        Pagado {String(debt.percentPaid).replace('.', ',')} % de {formatCop(debt.originalAmount)}
      </AppText>
    </PressableScale>
  );
}

export { monthLabel };
