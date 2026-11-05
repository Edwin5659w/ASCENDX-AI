import { Redirect, router, type Href } from 'expo-router';
import { View } from 'react-native';
import { PressableScale } from '@/components/motion';
import { MentorMark } from '@/components/brand/MentorMark';
import { AnimatedAmount, AppText, Card, ErrorView, GradientCard, Icon, LoadingView, OfflineBanner, OnGradient, ProgressRing, QuickAction, Screen, SectionHeader, StatTile, type IconName } from '@/components/ui';
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
  const { colors, radius, spacing } = useTheme();
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

  const todayRaw = new Intl.DateTimeFormat('es-CO', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'America/Bogota' }).format(new Date());
  const today = todayRaw.charAt(0).toUpperCase() + todayRaw.slice(1);
  const alert = Boolean(capacity?.alert);
  const noData = capacity?.base === 'sin_datos';

  return (
    <Screen scroll>
      {/* Encabezado */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
        <View style={{ flex: 1, gap: 2 }}>
          <AppText variant="caption" color="textMuted">
            {today}
          </AppText>
          <AppText variant="title" accessibilityRole="header">
            Hola, {firstName(user.name)}
          </AppText>
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
            backgroundColor: pressed ? colors.surfaceAlt : colors.primarySoft,
            borderWidth: 1.5,
            borderColor: colors.primary,
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
          {/* Ahorro prudente: el dato principal */}
          <GradientCard tone={alert ? 'danger' : 'brand'}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <OnGradient variant="label" soft>
                Ahorro prudente al mes
              </OnGradient>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.14)' }}>
                <Icon name={alert ? 'warning' : 'shield'} size={14} tint="#FFFFFF" />
                <OnGradient variant="caption" style={{ fontSize: 12 }}>
                  {noData ? 'Sin datos' : alert ? 'Revisa tus gastos' : 'Con margen'}
                </OnGradient>
              </View>
            </View>
            {noData ? (
              <OnGradient variant="display">—</OnGradient>
            ) : (
              <AnimatedAmount variant="display" value={capacity!.prudentCapacity} style={{ color: '#FFFFFF', fontSize: 40, lineHeight: 46 }} />
            )}
            <OnGradient variant="caption" soft>
              {summary}
            </OnGradient>
            {!noData ? (
              <View style={{ flexDirection: 'row', gap: spacing.md, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.16)' }}>
                <View style={{ flex: 1 }}>
                  <OnGradient variant="caption" soft>
                    Capacidad estimada
                  </OnGradient>
                  <OnGradient variant="label">{formatCop(capacity!.capacity)}</OnGradient>
                </View>
                <View style={{ flex: 1 }}>
                  <OnGradient variant="caption" soft>
                    Disponible este mes
                  </OnGradient>
                  <OnGradient variant="label">{formatCop(d.indicators.available)}</OnGradient>
                </View>
              </View>
            ) : null}
            <View style={{ flexDirection: 'row', marginTop: spacing.sm }}>
              <QuickAction icon="add" label="Registrar" onPress={() => router.push('/new-movement')} />
              <QuickAction icon="camera" label="Escanear" onPress={() => router.push('/scan-receipt')} />
              <QuickAction icon="simulator" label="Simular" onPress={() => router.push('/simulator')} />
              <QuickAction icon="sparkle" label="Mentor IA" onPress={() => router.push('/assistant')} />
            </View>
          </GradientCard>

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
                borderRadius: 22,
                borderWidth: 1,
                borderColor: colors.primary,
                backgroundColor: pressed ? colors.surfaceAlt : colors.primarySoft,
              })}
            >
              <View style={{ width: 46, height: 46, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary }}>
                <Icon name={action.icon} color="onPrimary" />
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <AppText variant="caption" color="primary">
                  Próxima acción
                </AppText>
                <AppText variant="bodyStrong">{action.title}</AppText>
                <AppText variant="caption" color="textMuted" numberOfLines={2}>
                  {action.detail}
                </AppText>
              </View>
              <Icon name="chevronRight" color="primary" />
            </PressableScale>
          ) : null}

          {/* Meta prioritaria */}
          <SectionHeader title="Tu meta prioritaria" action="Ver metas" onAction={() => router.push('/goals')} />
          <PressableScale
            scaleTo={0.98}
            accessibilityRole="button"
            accessibilityLabel={goal ? `Meta prioritaria ${goal.name}: ${Math.floor(goalPercent)} %` : 'Crear tu primera meta'}
            onPress={() => router.push(goal ? { pathname: '/goal/[id]', params: { id: goal.id } } : '/goal-form')}
          >
            <Card>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.lg }}>
                <ProgressRing value={goalPercent / 100} size={84} strokeWidth={9} milestones={[0.25, 0.5, 0.75]} accessibilityLabel={goal ? `${goalPercent} %` : 'Sin meta'}>
                  {goal ? <AppText variant="label">{Math.floor(goalPercent)} %</AppText> : <Icon name="goals" size={26} color="textSubtle" />}
                </ProgressRing>
                <View style={{ flex: 1, gap: spacing.xs }}>
                  {goal ? (
                    <>
                      <AppText variant="heading">{goal.name}</AppText>
                      <AppText variant="caption" color="textMuted">
                        {formatCop(goal.savedAmount)} de {formatCop(goal.targetAmount)}
                        {goal.plan?.projectedDate ? `\nLa lograrías el ${formatDay(goal.plan.projectedDate)}` : ''}
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

          {/* El mes */}
          {d.hasMovements ? (
            <>
              <SectionHeader title={monthLabel(d.month)} action="Ver todo" onAction={() => router.push('/movements')} />
              <View style={{ flexDirection: 'row', gap: spacing.md }}>
                <StatTile icon="income" label="Ingresos" value={formatCop(d.indicators.income)} tone="success" />
                <StatTile icon="expense" label="Gastos" value={formatCop(d.indicators.expenses)} />
                <StatTile icon="debt" label="Deudas" value={formatCop(d.indicators.debtPayments)} />
              </View>
            </>
          ) : null}

          {d.byCategory.length ? (
            <>
              <SectionHeader title="¿En qué se va tu dinero?" />
              <Card>
                <CategoryBars items={d.byCategory} />
              </Card>
            </>
          ) : null}

          {d.hasMovements ? (
            <>
              <SectionHeader title="Últimos seis meses" />
              <Card>
                <EvolutionChart months={d.evolution} />
              </Card>
            </>
          ) : null}

          {d.recent.length ? (
            <>
              <SectionHeader title="Movimientos recientes" action="Ver todo" onAction={() => router.push('/movements')} />
              <Card style={{ gap: 0, paddingVertical: spacing.sm }}>
                {d.recent.map((movement, index) => (
                  <View key={movement.id} style={index ? { borderTopWidth: 1, borderTopColor: colors.border } : undefined}>
                    <MovementRow movement={movement} onPress={() => router.push({ pathname: '/new-movement', params: { id: movement.id } })} />
                  </View>
                ))}
              </Card>
            </>
          ) : null}

          {d.emergency ? (
            <Card>
              <View style={{ flexDirection: 'row', gap: spacing.md, alignItems: 'center' }}>
                <View style={{ width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.successSoft }}>
                  <Icon name="shield" color="mint" />
                </View>
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
      <PressableScale accessibilityRole="button" accessibilityLabel="Tu mentor ASCENDX AI" onPress={() => router.push('/assistant')}>
        <GradientCard tone="violet">
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.lg }}>
            <MentorMark size={52} />
            <View style={{ flex: 1, gap: 2 }}>
              <OnGradient variant="bodyStrong">Tu mentor ASCENDX AI</OnGradient>
              <OnGradient variant="caption" soft>
                Te explica tu situación con tus propias cifras, sin inventar números.
              </OnGradient>
            </View>
            <Icon name="chevronRight" tint="#FFFFFF" />
          </View>
        </GradientCard>
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
