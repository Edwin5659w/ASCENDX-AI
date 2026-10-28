import { Redirect, router, type Href } from 'expo-router';
import { View } from 'react-native';
import { PressableScale } from '@/components/motion';
import { MentorMark } from '@/components/brand/MentorMark';
import { AnimatedAmount, AppText, Button, Card, ErrorView, Icon, LoadingView, OfflineBanner, ProgressRing, Screen, type IconName } from '@/components/ui';
import { useAuth } from '@/features/auth/AuthProvider';
import { getDashboard, type Dashboard } from '@/features/finance/api';
import { CategoryBars, EvolutionChart, MovementRow, StatusBadge } from '@/features/finance/components';
import { formatDay, monthLabel } from '@/features/finance/labels';
import { firstName, formatCop } from '@/lib/format';
import { HabitsRow } from '@/features/habits/components';
import { PendingSyncBanner } from '@/features/sync/SyncManager';
import { useQuery } from '@/lib/query';
import { useTheme } from '@/theme/useTheme';

type NextAction = { icon: IconName; title: string; detail: string; href: Href };

/** Próxima acción recomendada según los datos reales (sección 15.4). */
function nextActionFor(d: Dashboard): NextAction {
  if (!d.profile && !d.hasMovements) {
    return { icon: 'wallet', title: 'Completa tu perfil financiero', detail: 'Con tu ingreso y tus gastos fijos estimamos cuánto puedes ahorrar.', href: '/financial-profile' };
  }
  if (d.capacity.alert) {
    return { icon: 'edit', title: 'Revisa tus gastos del mes', detail: 'Tus gastos y cuotas igualan o superan tus ingresos.', href: '/movements' };
  }
  if (!d.hasMovements) {
    return { icon: 'add', title: 'Registra tu primer movimiento', detail: 'Con tus ingresos y gastos reales el panel se vuelve exacto.', href: '/new-movement' };
  }
  const risky = d.goals.find((g) => g.status === 'activa' && (g.plan?.status === 'en_riesgo' || g.plan?.status === 'vencida'));
  if (risky) {
    return { icon: 'warning', title: `Ajusta la meta «${risky.name}»`, detail: 'Tu ahorro prudente no alcanza para su fecha deseada.', href: { pathname: '/goal/[id]', params: { id: risky.id } } };
  }
  if (!d.goals.some((g) => g.status === 'activa')) {
    return { icon: 'goals', title: 'Define tu primera meta', detail: 'Repartimos tu ahorro prudente entre tus metas.', href: '/goal-form' };
  }
  const upcoming = d.debts.upcoming[0];
  if (upcoming && upcoming.nextPaymentDate.slice(0, 7) === d.today.slice(0, 7)) {
    return { icon: 'calendar', title: `Pago de ${upcoming.name} el ${formatDay(upcoming.nextPaymentDate)}`, detail: upcoming.installment ? `Cuota de ${formatCop(upcoming.installment)}.` : 'Regístralo cuando lo hagas.', href: { pathname: '/debt/[id]', params: { id: upcoming.id } } };
  }
  return { icon: 'simulator', title: 'Simula la compra que tienes en mente', detail: 'Compara ahorrar, financiar o combinar con el costo total.', href: '/simulator' };
}

/**
 * Panel principal (sección 15.4): saludo y resumen → meta prioritaria →
 * ahorro prudente y su explicación → próxima acción → evolución y gastos →
 * movimientos recientes → mentor. Sin datos, estados vacíos honestos.
 */
export default function HomeScreen() {
  const { user, isNewAccount } = useAuth();
  const { colors, isDark, radius, spacing } = useTheme();
  const { data, error, loading, refetch, fromCache, updatedAt } = useQuery(user ? 'dashboard:actual' : null, () => getDashboard());

  if (isNewAccount) return <Redirect href="/onboarding" />;
  if (!user) return null;

  const d = data;
  const capacity = d?.capacity;
  const summary = !d
    ? ''
    : capacity?.base === 'sin_datos'
      ? 'Empecemos por lo básico: cuéntanos cuánto recibes y cuánto gastas al mes.'
      : capacity?.alert
        ? 'Este periodo tus gastos y cuotas igualan o superan tus ingresos.'
        : `Podrías apartar ${formatCop(capacity!.prudentCapacity)} al mes sin quedarte corto.`;
  const action = d ? nextActionFor(d) : null;
  const goal = d?.priorityGoal;
  const goalPercent = goal?.plan?.progress.percent ?? 0;

  return (
    <Screen scroll>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md }}>
        <View style={{ flex: 1, gap: spacing.xs }}>
          <AppText variant="title" accessibilityRole="header">
            Hola, {firstName(user.name)}
          </AppText>
          {summary ? <AppText color="textMuted">{summary}</AppText> : null}
        </View>
        <PressableScale
          scaleTo={0.9}
          accessibilityRole="button"
          accessibilityLabel="Perfil y ajustes"
          onPress={() => router.push('/profile')}
          style={({ pressed }) => ({
            width: 48,
            height: 48,
            borderRadius: radius.pill,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: pressed ? colors.surfaceAlt : colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
          })}
        >
          <AppText variant="heading" color="mint">
            {firstName(user.name).charAt(0).toUpperCase()}
          </AppText>
        </PressableScale>
      </View>

      {fromCache ? <OfflineBanner updatedAt={updatedAt} /> : null}
      <PendingSyncBanner />
      {loading ? <LoadingView label="Calculando tu panel…" /> : null}
      {error && !d ? <ErrorView error={error} onRetry={refetch} /> : null}

      {d ? (
        <>
          {/* Meta prioritaria */}
          <PressableScale
            scaleTo={0.98}
            accessibilityRole="button"
            accessibilityLabel={goal ? `Meta prioritaria ${goal.name}: ${Math.floor(goalPercent)} %` : 'Crear tu primera meta'}
            onPress={() => router.push(goal ? { pathname: '/goal/[id]', params: { id: goal.id } } : '/goal-form')}
          >
            <Card elevated>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.lg }}>
                <ProgressRing value={goalPercent / 100} size={88} strokeWidth={8} milestones={[0.25, 0.5, 0.75]} accessibilityLabel={goal ? `${goalPercent} %` : 'Sin meta'}>
                  {goal ? <AppText variant="label">{Math.floor(goalPercent)} %</AppText> : <Icon name="goals" size={26} color="textSubtle" />}
                </ProgressRing>
                <View style={{ flex: 1, gap: spacing.xs }}>
                  <AppText variant="overline" color="textMuted">
                    Tu meta prioritaria
                  </AppText>
                  {goal ? (
                    <>
                      <AppText variant="heading">{goal.name}</AppText>
                      <AppText variant="caption" color="textMuted">
                        {formatCop(goal.savedAmount)} de {formatCop(goal.targetAmount)}
                        {goal.plan?.projectedDate ? ` · la lograrías el ${formatDay(goal.plan.projectedDate)}` : ''}
                      </AppText>
                      {goal.plan ? <StatusBadge status={goal.plan.status} /> : null}
                    </>
                  ) : (
                    <>
                      <AppText variant="heading">Aún no has definido una meta</AppText>
                      <AppText variant="caption" color="textMuted">
                        Toca para crearla. Verás cuánto llevas, cuánto falta y cuándo la alcanzarías.
                      </AppText>
                    </>
                  )}
                </View>
              </View>
            </Card>
          </PressableScale>

          <HabitsRow />

          {/* Ahorro prudente */}
          <Card highlighted={!capacity!.alert && capacity!.base !== 'sin_datos'}>
            <AppText variant="overline" color="textMuted">
              Ahorro prudente al mes
            </AppText>
            {capacity!.base === 'sin_datos' ? (
              <>
                <AppText variant="amount" color="textSubtle" accessibilityLabel="Sin datos">
                  —
                </AppText>
                <AppText variant="caption" color="textMuted">
                  {capacity!.explanation}
                </AppText>
              </>
            ) : (
              <>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                  {capacity!.alert ? <Icon name="warning" color="danger" size={22} /> : null}
                  <AnimatedAmount variant="amount" color={capacity!.alert ? 'danger' : 'text'} value={capacity!.prudentCapacity} />
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border }}>
                  <AppText variant="caption" color="textMuted">
                    Capacidad estimada
                  </AppText>
                  <AnimatedAmount variant="label" value={capacity!.capacity} delay={150} />
                </View>
                <AppText variant="caption" color="textMuted">
                  {capacity!.alert ? 'No proponemos aportes mientras tus gastos superen tus ingresos. ' : 'Reservamos un margen para imprevistos. '}
                  {capacity!.explanation}
                </AppText>
              </>
            )}
          </Card>

          {/* Próxima acción */}
          {action ? (
            <PressableScale
              hapticKind="light"
              accessibilityRole="button"
              accessibilityLabel={`Próxima acción: ${action.title}`}
              accessibilityHint={action.detail}
              onPress={() => router.push(action.href)}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.md,
                padding: spacing.lg,
                borderRadius: radius.lg,
                backgroundColor: pressed ? colors.primaryPressed : colors.primary,
              })}
            >
              <View style={{ width: 44, height: 44, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', backgroundColor: isDark ? 'rgba(11, 16, 32, 0.14)' : 'rgba(255, 255, 255, 0.16)' }}>
                <Icon name={action.icon} color="onPrimary" />
              </View>
              <View style={{ flex: 1 }}>
                <AppText variant="caption" color="onPrimary" style={{ opacity: 0.85 }}>
                  Próxima acción
                </AppText>
                <AppText variant="bodyStrong" color="onPrimary">
                  {action.title}
                </AppText>
              </View>
              <Icon name="chevronRight" color="onPrimary" />
            </PressableScale>
          ) : null}

          {/* El mes */}
          {d.hasMovements ? (
            <Card>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <AppText variant="heading">{monthLabel(d.month)}</AppText>
                <Button title="Ver todo" variant="ghost" onPress={() => router.push('/movements')} />
              </View>
              <View style={{ flexDirection: 'row', gap: spacing.md }}>
                <Stat label="Ingresos" value={d.indicators.income} tone="success" />
                <Stat label="Gastos" value={d.indicators.expenses} />
                <Stat label="Disponible" value={d.indicators.available} tone={d.indicators.available < 0 ? 'danger' : 'text'} />
              </View>
              {d.indicators.debtPayments || d.indicators.netGoalContributions ? (
                <AppText variant="caption" color="textMuted">
                  Pagos de deuda {formatCop(d.indicators.debtPayments)} · ahorro en metas {formatCop(d.indicators.netGoalContributions)}
                </AppText>
              ) : null}
            </Card>
          ) : null}

          {d.byCategory.length ? (
            <Card>
              <AppText variant="heading">¿En qué se va tu dinero?</AppText>
              <CategoryBars items={d.byCategory} />
            </Card>
          ) : null}

          {d.hasMovements ? (
            <Card>
              <AppText variant="heading">Últimos seis meses</AppText>
              <EvolutionChart months={d.evolution} />
            </Card>
          ) : null}

          {d.recent.length ? (
            <Card>
              <AppText variant="heading">Movimientos recientes</AppText>
              {d.recent.map((movement) => (
                <MovementRow key={movement.id} movement={movement} onPress={() => router.push({ pathname: '/new-movement', params: { id: movement.id } })} />
              ))}
            </Card>
          ) : null}

          {d.emergency ? (
            <Card>
              <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'center' }}>
                <Icon name="shield" color="mint" />
                <AppText variant="heading" style={{ flex: 1 }}>
                  Fondo de emergencia
                </AppText>
              </View>
              <AppText color="textMuted">
                {d.emergency.months === null
                  ? `Llevas ${formatCop(d.emergency.saved)}.`
                  : `Llevas ${formatCop(d.emergency.saved)}: cubre ${String(d.emergency.months).replace('.', ',')} meses de gastos. Una referencia común es entre 3 y 6 meses.`}
              </AppText>
            </Card>
          ) : null}
        </>
      ) : null}

      {/* Mentor */}
      <PressableScale
        accessibilityRole="button"
        accessibilityLabel="Tu mentor ASCENDX AI"
        onPress={() => router.push('/assistant')}
        style={({ pressed }) => ({
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.lg,
          padding: spacing.lg,
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: pressed ? colors.surfaceAlt : colors.violetSoft,
        })}
      >
        <MentorMark size={48} />
        <View style={{ flex: 1, gap: 2 }}>
          <AppText variant="bodyStrong">Tu mentor ASCENDX AI</AppText>
          <AppText variant="caption" color="textMuted">
            Te explica tu situación con tus propias cifras.
          </AppText>
        </View>
        <Icon name="chevronRight" color="textSubtle" />
      </PressableScale>

      <View style={{ flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.xs }}>
        <Icon name="shield" color="textSubtle" size={16} />
        <AppText variant="caption" color="textMuted" style={{ flex: 1 }}>
          Herramienta educativa de apoyo a tus decisiones. No reemplaza la asesoría financiera profesional.
        </AppText>
      </View>
    </Screen>
  );
}

function Stat({ label, value, tone = 'text' }: { label: string; value: number; tone?: 'text' | 'success' | 'danger' }) {
  return (
    <View style={{ flex: 1, gap: 2 }}>
      <AppText variant="caption" color="textMuted">
        {label}
      </AppText>
      <AppText variant="label" color={tone}>
        {formatCop(value)}
      </AppText>
    </View>
  );
}
