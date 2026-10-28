import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { AnimatedAmount, AppText, Button, Card, errorMessage, ErrorView, Header, LoadingView, ProgressBar, Screen, TextField } from '@/components/ui';
import { deleteDebt, getDebt, payDebt } from '@/features/finance/api';
import { MovementRow } from '@/features/finance/components';
import { formatDay, newClientOpId } from '@/features/finance/labels';
import { formatAmountInput, formatCop, parseAmount } from '@/lib/format';
import { useQuery } from '@/lib/query';
import { useTheme } from '@/theme/useTheme';

/** RF-12: detalle de la deuda, pagos con su reparto intereses/capital y registro de un pago. */
export default function DebtDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, spacing } = useTheme();
  const { data, error, loading, refetch } = useQuery(`debt:${id}`, () => getDebt(id));
  const [amount, setAmount] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [lastSplit, setLastSplit] = useState<{ interest: number; principal: number } | null>(null);
  const [clientOpId, setClientOpId] = useState(newClientOpId);
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function pay() {
    const value = parseAmount(amount);
    if (!value) {
      setMessage('Escribe el valor del pago.');
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      const result = await payDebt(id, { amount: value, clientOpId });
      setLastSplit({ interest: result.transaction.interestAmount ?? 0, principal: result.transaction.principalAmount ?? value });
      setAmount('');
      setClientOpId(newClientOpId());
    } catch (err) {
      setMessage(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    await deleteDebt(id);
    router.back();
  }

  const debt = data?.debt;

  return (
    <Screen scroll edges={['top', 'bottom']} animateIn={false}>
      <Header title={debt ? (debt.name ?? debt.creditor) : 'Deuda'} />
      {loading ? <LoadingView /> : null}
      {error && !data ? <ErrorView error={error} onRetry={refetch} /> : null}
      {debt ? (
        <>
          <Card highlighted={debt.status === 'activa'}>
            <AppText variant="overline" color="textMuted">
              {debt.status === 'pagada' ? 'Deuda pagada' : 'Saldo pendiente'}
            </AppText>
            <AnimatedAmount variant="amount" value={debt.balance} />
            <ProgressBar value={debt.percentPaid / 100} label={`Pagado ${debt.percentPaid} %`} />
            <AppText variant="caption" color="textMuted">
              Has pagado {formatCop(debt.paidAmount)} de {formatCop(debt.originalAmount)} ({String(debt.percentPaid).replace('.', ',')} %)
            </AppText>
            <View style={{ gap: spacing.xs, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border }}>
              <Row label="Acreedor" value={debt.creditor} />
              {debt.rate !== null ? (
                <Row
                  label="Tasa"
                  value={`${(debt.rate * 100).toFixed(2).replace('.', ',')} % ${debt.rateType === 'EA' ? 'E.A.' : 'M.V.'}${debt.rateType === 'MV' && debt.effectiveAnnualRate ? ` (${(debt.effectiveAnnualRate * 100).toFixed(2).replace('.', ',')} % E.A.)` : ''}`}
                />
              ) : (
                <Row label="Tasa" value="No registrada" />
              )}
              {debt.installment ? <Row label="Cuota" value={formatCop(debt.installment)} /> : null}
              {debt.termMonths ? <Row label="Plazo" value={`${debt.termMonths} meses`} /> : null}
              {debt.nextPaymentDate ? <Row label="Próximo pago" value={formatDay(debt.nextPaymentDate)} /> : null}
            </View>
          </Card>

          {debt.status === 'activa' ? (
            <Card>
              <AppText variant="heading">Registrar un pago</AppText>
              <TextField
                label="Valor pagado"
                prefix="$"
                keyboardType="number-pad"
                value={amount}
                onChangeText={(text) => setAmount(formatAmountInput(text))}
                placeholder={debt.installment ? formatAmountInput(String(debt.installment)) : '0'}
              />
              {debt.installment && !amount ? (
                <Button title={`Usar la cuota: ${formatCop(debt.installment)}`} variant="secondary" onPress={() => setAmount(formatAmountInput(String(debt.installment)))} />
              ) : null}
              {message ? <AppText color="danger">{message}</AppText> : null}
              <Button title="Registrar pago" onPress={pay} loading={saving} />
              {lastSplit ? (
                <AppText variant="caption" color="success">
                  Pago registrado: {formatCop(lastSplit.interest)} de intereses y {formatCop(lastSplit.principal)} a capital.
                </AppText>
              ) : (
                <AppText variant="caption" color="textMuted">
                  El pago cubre primero los intereses del mes ({debt.rate !== null ? 'según la tasa registrada' : 'sin tasa, todo va a capital'}) y el resto baja el saldo.
                </AppText>
              )}
            </Card>
          ) : null}

          {data.payments.length ? (
            <Card>
              <AppText variant="heading">Pagos</AppText>
              <AppText variant="caption" color="textMuted">
                Total pagado {formatCop(data.totals.paid)}: {formatCop(data.totals.principal)} a capital y {formatCop(data.totals.interest)} en intereses.
              </AppText>
              {data.payments.map((payment) => (
                <View key={payment.id}>
                  <MovementRow movement={payment} onPress={() => router.push({ pathname: '/new-movement', params: { id: payment.id } })} />
                  {payment.interestAmount !== null ? (
                    <AppText variant="caption" color="textMuted" style={{ marginLeft: 52 }}>
                      Intereses {formatCop(payment.interestAmount)} · capital {formatCop(payment.principalAmount ?? 0)}
                    </AppText>
                  ) : null}
                </View>
              ))}
            </Card>
          ) : null}

          {confirmDelete ? (
            <Card>
              <AppText variant="bodyStrong">¿Eliminar esta deuda?</AppText>
              <AppText variant="caption" color="textMuted">
                Sus pagos se conservan en tu historial de movimientos.
              </AppText>
              <Button title="Sí, eliminar" variant="danger" onPress={remove} />
              <Button title="Cancelar" variant="secondary" onPress={() => setConfirmDelete(false)} />
            </Card>
          ) : (
            <Button title="Eliminar deuda" variant="ghost" onPress={() => setConfirmDelete(true)} />
          )}
        </>
      ) : null}
    </Screen>
  );
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
