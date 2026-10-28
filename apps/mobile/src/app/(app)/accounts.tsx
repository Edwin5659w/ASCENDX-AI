import { useState } from 'react';
import { View } from 'react-native';
import { AppText, Button, Card, ChipGroup, Chip, EmptyView, errorMessage, ErrorView, Header, Icon, LoadingView, OfflineBanner, Screen, TextField, type IconName } from '@/components/ui';
import { archiveAccount, createAccount, getAccounts, type Account, type AccountKind } from '@/features/finance/api';
import { formatAmountInput, formatCop, parseAmount } from '@/lib/format';
import { useQuery } from '@/lib/query';
import { useTheme } from '@/theme/useTheme';

const KINDS: { value: AccountKind; label: string; icon: IconName; example: string }[] = [
  { value: 'efectivo', label: 'Efectivo', icon: 'wallet', example: 'Billetera' },
  { value: 'banco', label: 'Banco', icon: 'bank', example: 'Cuenta de ahorros' },
  { value: 'billetera', label: 'Billetera digital', icon: 'phone', example: 'Nequi' },
];

/** RF-31: cuentas. El saldo sale del saldo inicial más los movimientos asociados. */
export default function AccountsScreen() {
  const { spacing } = useTheme();
  const { data, error, loading, refetch, fromCache, updatedAt } = useQuery('accounts', getAccounts);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [kind, setKind] = useState<AccountKind>('billetera');
  const [initial, setInitial] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [pendingArchive, setPendingArchive] = useState<string | null>(null);

  async function add() {
    if (name.trim().length < 2) {
      setMessage('Ponle un nombre a la cuenta.');
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      await createAccount({ name: name.trim(), kind, initialBalance: parseAmount(initial) ?? 0 });
      setName('');
      setInitial('');
      setCreating(false);
    } catch (err) {
      setMessage(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function archive(account: Account) {
    try {
      await archiveAccount(account.id);
      setPendingArchive(null);
    } catch (err) {
      setMessage(errorMessage(err));
    }
  }

  const accounts = data?.accounts ?? [];
  const selected = KINDS.find((k) => k.value === kind)!;

  return (
    <Screen scroll edges={['top', 'bottom']} animateIn={false}>
      <Header title="Mis cuentas" />
      {fromCache ? <OfflineBanner updatedAt={updatedAt} /> : null}
      {loading ? <LoadingView /> : null}
      {error && !data ? <ErrorView error={error} onRetry={refetch} /> : null}

      {data && accounts.length ? (
        <Card elevated>
          <AppText variant="caption" color="textMuted">
            Total en tus cuentas
          </AppText>
          <AppText variant="display">{formatCop(data.total)}</AppText>
          <AppText variant="caption" color="textMuted">
            Incluye solo los movimientos que asociaste a una cuenta.
          </AppText>
        </Card>
      ) : null}

      {data && !accounts.length && !creating ? (
        <EmptyView
          icon="wallet"
          title="Organiza tu dinero por cuentas"
          description="Separa el efectivo, tu cuenta de banco y tu billetera digital para saber dónde está cada peso. Es opcional."
          action={{ title: 'Agregar una cuenta', onPress: () => setCreating(true) }}
        />
      ) : null}

      {accounts.map((account) => {
        const info = KINDS.find((k) => k.value === account.kind)!;
        return (
          <Card key={account.id}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
              <Icon name={info.icon} color="primary" />
              <View style={{ flex: 1 }}>
                <AppText variant="bodyStrong">{account.name}</AppText>
                <AppText variant="caption" color="textMuted">
                  {info.label} · {account.movements} {account.movements === 1 ? 'movimiento' : 'movimientos'}
                </AppText>
              </View>
              <AppText variant="bodyStrong" color={account.balance < 0 ? 'danger' : 'text'}>
                {formatCop(account.balance)}
              </AppText>
            </View>
            {pendingArchive === account.id ? (
              <>
                <AppText variant="caption" color="textMuted">
                  La cuenta deja de aparecer, pero sus movimientos se conservan.
                </AppText>
                <Button title="Sí, archivar" variant="danger" onPress={() => archive(account)} />
                <Button title="Cancelar" variant="secondary" onPress={() => setPendingArchive(null)} />
              </>
            ) : (
              <Button title="Archivar" variant="ghost" onPress={() => setPendingArchive(account.id)} />
            )}
          </Card>
        );
      })}

      {creating ? (
        <Card>
          <AppText variant="heading">Nueva cuenta</AppText>
          <ChipGroup>
            {KINDS.map((option) => (
              <Chip key={option.value} label={option.label} selected={kind === option.value} onPress={() => setKind(option.value)} />
            ))}
          </ChipGroup>
          <TextField label="Nombre" value={name} onChangeText={setName} placeholder={`Ej.: ${selected.example}`} maxLength={60} />
          <TextField
            label="Saldo actual (opcional)"
            prefix="$"
            keyboardType="number-pad"
            value={initial}
            onChangeText={(text) => setInitial(formatAmountInput(text))}
            placeholder="0"
          />
          <Button title="Guardar cuenta" onPress={add} loading={saving} />
          <Button title="Cancelar" variant="secondary" onPress={() => setCreating(false)} />
        </Card>
      ) : accounts.length ? (
        <Button title="Agregar otra cuenta" variant="secondary" onPress={() => setCreating(true)} />
      ) : null}
      {message ? <AppText color="danger">{message}</AppText> : null}
    </Screen>
  );
}
