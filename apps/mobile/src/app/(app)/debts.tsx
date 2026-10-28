import { router } from 'expo-router';
import { View } from 'react-native';
import { AnimatedAmount, AppText, Button, Card, EmptyView, ErrorView, Header, Icon, LoadingView, Screen } from '@/components/ui';
import { getDashboard, getDebts } from '@/features/finance/api';
import { DebtCard } from '@/features/finance/components';
import { formatCop } from '@/lib/format';
import { useQuery } from '@/lib/query';
import { useTheme } from '@/theme/useTheme';

const LOAD_LEVEL = {
  verde: { label: 'Carga de deuda saludable', tone: 'success', icon: 'check' },
  amarillo: { label: 'Carga de deuda para vigilar', tone: 'warning', icon: 'warning' },
  rojo: { label: 'Carga de deuda alta', tone: 'danger', icon: 'error' },
} as const;

/** RF-11: deudas activas y pagadas, con el total y la carga de deuda. */
export default function DebtsScreen() {
  const { spacing } = useTheme();
  const { data, error, loading, refetch } = useQuery('debts', getDebts);
  const dashboard = useQuery('dashboard:actual', () => getDashboard());
  const load = dashboard.data?.debtLoad;

  return (
    <Screen scroll edges={['top', 'bottom']}>
      <Header title="Deudas" right={<Button title="Nueva" variant="ghost" onPress={() => router.push('/debt-form')} />} />
      {loading ? <LoadingView /> : null}
      {error && !data ? <ErrorView error={error} onRetry={refetch} /> : null}

      {data && data.debts.length === 0 ? (
        <EmptyView
          icon="debt"
          title="No tienes deudas registradas"
          description="Registra tus créditos, tarjetas o préstamos para ver tu saldo total, tus cuotas del mes y cómo baja cada deuda con tus pagos."
          action={{ title: 'Registrar una deuda', onPress: () => router.push('/debt-form') }}
        />
      ) : null}

      {data && data.debts.length > 0 ? (
        <Card highlighted>
          <AppText variant="overline" color="textMuted">
            Saldo total de deudas activas
          </AppText>
          <AnimatedAmount variant="amount" value={data.totals.balance} />
          <AppText variant="caption" color="textMuted">
            Cuotas del mes: {formatCop(data.totals.monthlyInstallments)} · {data.totals.active} {data.totals.active === 1 ? 'deuda activa' : 'deudas activas'}
          </AppText>
          {load ? (
            <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'center' }}>
              <Icon name={LOAD_LEVEL[load.level].icon} size={18} color={LOAD_LEVEL[load.level].tone} />
              <AppText variant="caption" style={{ flex: 1 }}>
                {LOAD_LEVEL[load.level].label}: las cuotas son el {Math.round(load.ratio * 100)} % de tu ingreso (referencia: menos de 30 %).
              </AppText>
            </View>
          ) : null}
        </Card>
      ) : null}

      {data?.debts.map((debt) => (
        <DebtCard key={debt.id} debt={debt} onPress={() => router.push({ pathname: '/debt/[id]', params: { id: debt.id } })} />
      ))}

      {data && data.debts.length > 0 ? (
        <AppText variant="caption" color="textMuted">
          La carga de deuda es una referencia educativa, no un diagnóstico ni una evaluación de crédito.
        </AppText>
      ) : null}
    </Screen>
  );
}
