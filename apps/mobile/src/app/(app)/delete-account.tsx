import { useState } from 'react';
import { View } from 'react-native';
import { AppText, Button, Card, Header, Icon, Screen, TextField } from '@/components/ui';
import { deleteAccount } from '@/features/account/api';
import { useAuth } from '@/features/auth/AuthProvider';
import { FormError } from '@/features/auth/AuthShell';
import { ApiError, clearSession } from '@/lib/api';
import { useTheme } from '@/theme/useTheme';

/** RF-05: eliminar la cuenta y todos los datos (derecho de supresión, Ley 1581). */
export default function DeleteAccountScreen() {
  const { signOut } = useAuth();
  const { spacing } = useTheme();
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!password) {
      setError('Escribe tu contraseña para confirmar');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await deleteAccount(password);
      await clearSession();
      await signOut();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo eliminar la cuenta.');
      setLoading(false);
    }
  }

  return (
    <Screen scroll edges={['top', 'bottom']}>
      <Header title="Eliminar cuenta" />
      <Card>
        <View style={{ flexDirection: 'row', gap: spacing.md }}>
          <Icon name="warning" color="danger" />
          <AppText variant="bodyStrong" style={{ flex: 1 }}>
            Esta acción no se puede deshacer
          </AppText>
        </View>
        <AppText color="textMuted">
          Se borrarán tu cuenta, tu perfil financiero, tus movimientos, metas, deudas, simulaciones, conversaciones con
          la IA y tus autorizaciones. Se cerrarán todas tus sesiones.
        </AppText>
      </Card>
      <TextField
        label="Contraseña"
        icon="lock"
        revealable
        value={password}
        onChangeText={(text) => {
          setPassword(text);
          setError(null);
        }}
        autoCapitalize="none"
        autoComplete="current-password"
        placeholder="Confirma con tu contraseña"
      />
      {error ? <FormError message={error} /> : null}
      <Button title="Eliminar mi cuenta y mis datos" variant="danger" onPress={handleDelete} loading={loading} />
    </Screen>
  );
}
