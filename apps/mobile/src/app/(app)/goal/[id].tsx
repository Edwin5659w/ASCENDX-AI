import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { AppText, Button, Card, errorMessage, ErrorView, Header, Icon, LoadingView, ProgressRing, Screen, SegmentedControl, TextField } from '@/components/ui';
import { deleteGoal, getGoal, moveGoal, updateGoal } from '@/features/finance/api';
import { MovementRow, StatusBadge } from '@/features/finance/components';
import { formatDay, newClientOpId, PRIORITY_LABELS } from '@/features/finance/labels';
import { formatAmountInput, formatCop, formatMonths, parseAmount } from '@/lib/format';
import { useQuery } from '@/lib/query';
import { useTheme } from '@/theme/useTheme';

/** RF-17 a RF-19: progreso, aporte asignado, fecha proyectada, riesgo con sugerencias y aportes/retiros. */
export default function GoalDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, spacing } = useTheme();
  const { data, error, loading, refetch } = useQuery(`goal:${id}`, () => getGoal(id));
  const [kind, setKind] = useState<'aporte' | 'retiro'>('aporte');
  const [amount, setAmount] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [clientOpId, setClientOpId] = useState(newClientOpId);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const goal = data?.goal;
  const plan = goal?.plan;

  async function move() {
    const value = parseAmount(amount);
    if (!value) {
      setMessage('Escribe el monto.');
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      await moveGoal(id, { kind, amount: value, clientOpId });
      setAmount('');
      setClientOpId(newClientOpId());
    } catch (err) {
      setMessage(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function setStatus(status: 'activa' | 'pausada') {
    try {
      await updateGoal(id, { status });
    } catch (err) {
      setMessage(errorMessage(err));
    }
  }

  async function remove() {
    await deleteGoal(id);
    router.back();
  }

  return (
    <Screen scroll edges={['top', 'bottom']} animateIn={false}>
      <Header title={goal?.name ?? 'Meta'} right={goal ? <Button title="Editar" variant="ghost" onPress={() => router.push({ pathname: '/goal-form', params: { id } })} /> : null} />
      {loading ? <LoadingView /> : null}
      {error && !data ? <ErrorView error={error} onRetry={refetch} /> : null}
      {goal ? (
        <>
          <Card elevated>
            <View style={{ alignItems: 'center', gap: spacing.md }}>
              <ProgressRing
                value={(plan?.progress.percent ?? (goal.savedAmount / goal.targetAmount) * 100) / 100}
                size={150}
                strokeWidth={12}
                milestones={[0.25, 0.5, 0.75]}
                accessibilityLabel={`${plan?.progress.percent ?? 0} % de la meta`}
              >
                <AppText variant="title">{Math.floor(plan?.progress.percent ?? (goal.savedAmount / goal.targetAmount) * 100)} %</AppText>
              </ProgressRing>
              <AppText variant="amountSmall">
                {formatCop(goal.savedAmount)} de {formatCop(goal.targetAmount)}
              </AppText>
              {goal.status === 'pausada' ? (
                <AppText variant="caption" color="textMuted">
                  Meta pausada: no recibe aportes del reparto.
                </AppText>
              ) : goal.status === 'completada' ? (
                <StatusBadge status="completada" />
              ) : plan ? (
                <StatusBadge status={plan.status} />
              ) : null}
              {plan?.progress.milestones.length ? (
                <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                  {plan.progress.milestones.map((milestone) => (
                    <View key={milestone} style={{ flexDirection: 'row', gap: 4, alignItems: 'center' }}>
                      <Icon name="trophy" size={14} color="achievement" />
                      <AppText variant="caption" color="textMuted">
                        {milestone} %
                      </AppText>
                    </View>
                  ))}
                </View>
              ) : null}
            </View>
            <View style={{ gap: spacing.xs, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border }}>
              <Row label="Prioridad" value={PRIORITY_LABELS[goal.priority]} />
              <Row label="Fecha deseada" value={goal.targetDate ? formatDay(goal.targetDate) : 'Sin fecha'} />
              {plan && goal.status === 'activa' ? (
                <>
                  <Row label="Falta" value={formatCop(plan.progress.remaining)} />
                  {plan.requiredMonthly !== null ? <Row label="Aporte requerido al mes" value={formatCop(plan.requiredMonthly)} /> : null}
                  <Row label="Aporte asignado al mes" value={formatCop(plan.assignedMonthly)} />
                  <Row label="Fecha proyectada" value={plan.projectedDate ? formatDay(plan.projectedDate) : 'Sin aporte asignado'} />
                </>
              ) : null}
            </View>
          </Card>

          {plan?.suggestions && goal.status === 'activa' ? (
            <Card>
              <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'center' }}>
                <Icon name="lightbulb" color="warning" />
                <AppText variant="heading" style={{ flex: 1 }}>
                  {plan.status === 'vencida' ? 'La fecha deseada ya pasó' : 'Esta meta está en riesgo'}
                </AppText>
              </View>
              <AppText color="textMuted">
                Tu ahorro prudente no alcanza para el aporte que necesita. Tienes dos caminos:
              </AppText>
              {plan.suggestions.reachableDate ? (
                <AppText>
                  • Mantener el aporte asignado ({formatCop(plan.assignedMonthly)}) y lograrla el {formatDay(plan.suggestions.reachableDate)}
                  {plan.monthsToTargetDate ? ` (${formatMonths(Math.max(0, monthsUntil(plan.suggestions.reachableDate)))})` : ''}.
                </AppText>
              ) : (
                <AppText>• Hoy no recibe aporte: sube su prioridad o libera ahorro de otra meta.</AppText>
              )}
              {plan.suggestions.contributionToKeepDate ? (
                <AppText>• Aportar {formatCop(plan.suggestions.contributionToKeepDate)} al mes para llegar en la fecha deseada.</AppText>
              ) : null}
            </Card>
          ) : null}

          {goal.status !== 'cancelada' ? (
            <Card>
              <AppText variant="heading">Mover dinero</AppText>
              <SegmentedControl
                accessibilityLabel="Aporte o retiro"
                value={kind}
                onChange={setKind}
                options={[
                  { value: 'aporte', label: 'Aportar' },
                  { value: 'retiro', label: 'Retirar' },
                ]}
              />
              <TextField label="Monto" prefix="$" keyboardType="number-pad" value={amount} onChangeText={(t) => setAmount(formatAmountInput(t))} placeholder="0" />
              {kind === 'aporte' && plan?.assignedMonthly && !amount ? (
                <Button title={`Usar el aporte asignado: ${formatCop(plan.assignedMonthly)}`} variant="secondary" onPress={() => setAmount(formatAmountInput(String(plan.assignedMonthly)))} />
              ) : null}
              {message ? <AppText color="danger">{message}</AppText> : null}
              <Button title={kind === 'aporte' ? 'Registrar aporte' : 'Registrar retiro'} onPress={move} loading={saving} />
              <AppText variant="caption" color="textMuted">
                Un aporte es ahorro, no gasto: baja tu disponible del mes pero no cuenta en tus gastos.
              </AppText>
            </Card>
          ) : null}

          {data.movements.length ? (
            <Card>
              <AppText variant="heading">Historial</AppText>
              {data.movements.map((movement) => (
                <MovementRow key={movement.id} movement={movement} onPress={() => router.push({ pathname: '/new-movement', params: { id: movement.id } })} />
              ))}
            </Card>
          ) : null}

          {goal.status === 'activa' ? (
            <Button title="Pausar meta" variant="secondary" onPress={() => setStatus('pausada')} />
          ) : goal.status === 'pausada' ? (
            <Button title="Reanudar meta" variant="secondary" onPress={() => setStatus('activa')} />
          ) : null}
          {confirmDelete ? (
            <Card>
              <AppText variant="bodyStrong">¿Eliminar esta meta?</AppText>
              <AppText variant="caption" color="textMuted">
                Sus aportes y retiros se conservan en tu historial de movimientos.
              </AppText>
              <Button title="Sí, eliminar" variant="danger" onPress={remove} />
              <Button title="Cancelar" variant="secondary" onPress={() => setConfirmDelete(false)} />
            </Card>
          ) : (
            <Button title="Eliminar meta" variant="ghost" onPress={() => setConfirmDelete(true)} />
          )}
        </>
      ) : null}
    </Screen>
  );
}

function monthsUntil(date: string) {
  const [y, m] = date.split('-').map(Number);
  const now = new Date();
  return (y! - now.getFullYear()) * 12 + (m! - (now.getMonth() + 1));
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
      <AppText variant="caption" color="textMuted">
        {label}
      </AppText>
      <AppText variant="label" style={{ flexShrink: 1, textAlign: 'right' }}>
        {value}
      </AppText>
    </View>
  );
}
