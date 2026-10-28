import { router } from 'expo-router';
import { View } from 'react-native';
import { AppText, Button, Card, EmptyView, ErrorView, Icon, LoadingView, NavRow, OfflineBanner, Screen } from '@/components/ui';
import { getGoals } from '@/features/finance/api';
import { GoalCard } from '@/features/finance/components';
import { formatCop } from '@/lib/format';
import { useQuery } from '@/lib/query';
import { useTheme } from '@/theme/useTheme';

/** RF-16 a RF-19: metas, reparto de la capacidad prudente y metas en riesgo. */
export default function GoalsScreen() {
  const { spacing } = useTheme();
  const { data, error, loading, refetch, fromCache, updatedAt } = useQuery('goals', getGoals);
  const visible = (data?.goals ?? []).filter((goal) => goal.status !== 'cancelada');
  const active = visible.filter((goal) => goal.status === 'activa');
  const atRisk = active.filter((goal) => goal.plan?.status === 'en_riesgo' || goal.plan?.status === 'vencida');

  return (
    <Screen scroll>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <AppText variant="title" accessibilityRole="header">
          Metas
        </AppText>
        <Button title="Nueva meta" variant="ghost" onPress={() => router.push('/goal-form')} />
      </View>

      {fromCache ? <OfflineBanner updatedAt={updatedAt} /> : null}
      {loading ? <LoadingView /> : null}
      {error && !data ? <ErrorView error={error} onRetry={refetch} /> : null}

      {data && visible.length === 0 ? (
        <EmptyView
          icon="goals"
          title="Define tu primera meta"
          description="Una moto, un viaje o tu fondo de emergencia. Repartimos tu ahorro prudente entre tus metas por prioridad y fecha, y te avisamos si alguna está en riesgo."
          action={{ title: 'Crear meta', onPress: () => router.push('/goal-form') }}
        />
      ) : null}

      {data && visible.length > 0 ? (
        <Card highlighted={data.allocation.allOnTrack}>
          <AppText variant="overline" color="textMuted">
            Reparto de tu ahorro prudente
          </AppText>
          {data.capacity.base === 'sin_datos' ? (
            <AppText color="textMuted">{data.capacity.explanation}</AppText>
          ) : (
            <>
              <AppText variant="amount">{formatCop(data.allocation.prudentCapacity)}</AppText>
              <AppText variant="caption" color="textMuted">
                al mes · tus metas con fecha necesitan {formatCop(data.allocation.totalRequired)}
                {data.allocation.unassigned > 0 ? ` · sobran ${formatCop(data.allocation.unassigned)}` : ''}
              </AppText>
              <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'center' }}>
                <Icon name={data.allocation.allOnTrack ? 'check' : 'warning'} color={data.allocation.allOnTrack ? 'success' : 'warning'} size={18} />
                <AppText variant="caption" style={{ flex: 1 }}>
                  {data.allocation.allOnTrack
                    ? 'Tu ahorro alcanza para todas tus metas con fecha.'
                    : `${atRisk.length} ${atRisk.length === 1 ? 'meta está' : 'metas están'} en riesgo: el ahorro no alcanza para todas. Se reparte primero por prioridad y luego por fecha.`}
                </AppText>
              </View>
            </>
          )}
        </Card>
      ) : null}

      {visible.map((goal) => (
        <GoalCard key={goal.id} goal={goal} onPress={() => router.push({ pathname: '/goal/[id]', params: { id: goal.id } })} />
      ))}

      <View style={{ gap: spacing.xs }}>
        <NavRow icon="simulator" title="Simulador" subtitle="¿Ahorrar, financiar o combinar?" onPress={() => router.push('/simulator')} />
        <NavRow icon="debt" title="Deudas" subtitle="Saldos, cuotas y pagos" onPress={() => router.push('/debts')} />
      </View>
    </Screen>
  );
}
