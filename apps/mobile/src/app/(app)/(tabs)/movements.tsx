import type { MovementType } from '@ascendx/finance-core';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { AppText, Button, Card, Chip, ChipGroup, EmptyView, ErrorView, Icon, LoadingView, OfflineBanner, Screen, TextField } from '@/components/ui';
import { getTransactions, type Transaction } from '@/features/finance/api';
import { MonthSwitcher, MovementRow } from '@/features/finance/components';
import { dayHeading, shiftMonth, todayKey } from '@/features/finance/labels';
import { formatCop } from '@/lib/format';
import { useQuery } from '@/lib/query';
import { useTheme } from '@/theme/useTheme';

const FILTERS: { value: MovementType | 'todos'; label: string }[] = [
  { value: 'todos', label: 'Todos' },
  { value: 'gasto', label: 'Gastos' },
  { value: 'ingreso', label: 'Ingresos' },
  { value: 'pago_deuda', label: 'Pagos de deuda' },
  { value: 'aporte_meta', label: 'Aportes' },
  { value: 'retiro_meta', label: 'Retiros' },
];

/** RF-07 y RF-08: historial del mes con filtros, búsqueda y totales del filtro. */
export default function MovementsScreen() {
  const { colors, spacing } = useTheme();
  const currentMonth = todayKey().slice(0, 7);
  const [month, setMonth] = useState(currentMonth);
  const [type, setType] = useState<MovementType | 'todos'>('todos');
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [extra, setExtra] = useState<Transaction[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  const filters = { month, type: type === 'todos' ? undefined : type, q: query || undefined };
  const key = `transactions:${month}:${type}:${query}`;
  const { data, error, loading, refetch, fromCache, updatedAt } = useQuery(key, () => getTransactions(filters));

  const items = useMemo(() => [...(data?.transactions ?? []), ...extra], [data, extra]);
  const groups = useMemo(() => {
    const map = new Map<string, Transaction[]>();
    for (const item of items) map.set(item.date, [...(map.get(item.date) ?? []), item]);
    return [...map.entries()];
  }, [items]);
  const nextCursor = extra.length ? cursor : (data?.nextCursor ?? null);

  const resetPaging = () => {
    setExtra([]);
    setCursor(null);
  };

  async function loadMore() {
    if (!nextCursor) return;
    setLoadingMore(true);
    try {
      const more = await getTransactions({ ...filters, cursor: nextCursor });
      setExtra((current) => [...current, ...more.transactions]);
      setCursor(more.nextCursor);
    } finally {
      setLoadingMore(false);
    }
  }

  const totals = data?.totals;

  return (
    <Screen scroll animateIn={false}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <AppText variant="title" accessibilityRole="header">
          Movimientos
        </AppText>
        <Button title="Categorías" variant="ghost" onPress={() => router.push('/categories')} />
      </View>

      <MonthSwitcher
        month={month}
        canGoNext={month < currentMonth}
        onChange={(delta) => {
          setMonth((m) => shiftMonth(m, delta));
          resetPaging();
        }}
      />

      <ChipGroup scroll>
        {FILTERS.map((filter) => (
          <Chip
            key={filter.value}
            label={filter.label}
            selected={type === filter.value}
            onPress={() => {
              setType(filter.value);
              resetPaging();
            }}
          />
        ))}
      </ChipGroup>

      <TextField
        label="Buscar en la descripción"
        icon="search"
        value={search}
        onChangeText={setSearch}
        placeholder="Ej.: arriendo"
        returnKeyType="search"
        onSubmitEditing={() => {
          setQuery(search.trim());
          resetPaging();
        }}
        onBlur={() => {
          if (search.trim() !== query) {
            setQuery(search.trim());
            resetPaging();
          }
        }}
      />

      {fromCache ? <OfflineBanner updatedAt={updatedAt} /> : null}

      {totals ? (
        <Card>
          <View style={{ flexDirection: 'row', gap: spacing.lg }}>
            <Total label="Ingresos" value={totals.income} tone="success" />
            <Total label="Gastos" value={totals.expenses} />
            <Total label="Pagos de deuda" value={totals.debtPayments} />
          </View>
          <View style={{ height: 1, backgroundColor: colors.border }} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <AppText variant="label" color="textMuted">
              Flujo neto del filtro
            </AppText>
            <AppText variant="amountSmall" color={totals.netFlow < 0 ? 'danger' : 'text'}>
              {formatCop(totals.netFlow)}
            </AppText>
          </View>
        </Card>
      ) : null}

      {loading ? <LoadingView /> : null}
      {error && !data ? <ErrorView error={error} onRetry={refetch} /> : null}

      {data && items.length === 0 ? (
        <EmptyView
          icon="movements"
          title={query || type !== 'todos' ? 'Nada con ese filtro' : 'Aún no hay movimientos este mes'}
          description={query || type !== 'todos' ? 'Prueba con otro filtro o búsqueda.' : 'Registra tus ingresos y gastos para ver tu panel con datos reales.'}
          action={{ title: 'Registrar movimiento', onPress: () => router.push('/new-movement') }}
        />
      ) : null}

      {groups.map(([date, list]) => (
        <View key={date} style={{ gap: spacing.xs }}>
          <AppText variant="overline" color="textMuted">
            {dayHeading(date)}
          </AppText>
          {list.map((movement) => (
            <MovementRow key={movement.id} movement={movement} onPress={() => router.push({ pathname: '/new-movement', params: { id: movement.id } })} />
          ))}
        </View>
      ))}

      {nextCursor ? <Button title="Ver más" variant="secondary" loading={loadingMore} onPress={loadMore} /> : null}

      {data && items.length > 0 ? (
        <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'center' }}>
          <Icon name="info" size={16} color="textSubtle" />
          <AppText variant="caption" color="textMuted" style={{ flex: 1 }}>
            {data.count} {data.count === 1 ? 'movimiento' : 'movimientos'}. Toca uno para editarlo o borrarlo.
          </AppText>
        </View>
      ) : null}
    </Screen>
  );
}

function Total({ label, value, tone = 'text' }: { label: string; value: number; tone?: 'text' | 'success' }) {
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
