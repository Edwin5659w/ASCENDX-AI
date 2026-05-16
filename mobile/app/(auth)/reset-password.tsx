import { useMemo, useState } from 'react';
import { StyleSheet, Text, View, Pressable, Alert } from 'react-native';
import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import { authApi } from '@/src/api/services';
import { Button } from '@/src/components/ui/Button';
import { ValidatedInput } from '@/src/components/auth/ValidatedInput';
import { AuthScreenShell } from '@/src/components/brand/AuthScreenShell';
import { validatePassword } from '@/src/lib/auth.rules';
import { theme } from '@/constants/theme';

export default function ResetPasswordScreen() {
  const { token: tokenParam } = useLocalSearchParams<{ token?: string }>();
  const token = typeof tokenParam === 'string' ? tokenParam : tokenParam?.[0] ?? '';
  const router = useRouter();

  const [password, setPassword] = useState('');
  const [touched, setTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const passwordVal = useMemo(() => validatePassword(password, touched), [password, touched]);
  const canSubmit = token.length >= 32 && passwordVal.status === 'valid';

  const submit = async () => {
    setTouched(true);
    setError('');
    if (!canSubmit) return;
    setLoading(true);
    try {
      await authApi.resetPassword(token, password);
      Alert.alert('Listo', 'Contraseña actualizada', [{ text: 'OK', onPress: () => router.replace('/(auth)/login') }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <AuthScreenShell subtitle="Enlace inválido">
        <Text style={styles.muted}>Enlace inválido (falta token).</Text>
        <Link href={'/(auth)/forgot-password' as any} asChild>
          <Text style={styles.link}>Solicitar nuevo enlace</Text>
        </Link>
      </AuthScreenShell>
    );
  }

  return (
    <AuthScreenShell subtitle="Nueva contraseña">
      <View style={styles.form}>
        <ValidatedInput
          label="Nueva contraseña"
          placeholder="••••••••"
          value={password}
          onChangeText={setPassword}
          onBlur={() => setTouched(true)}
          validation={passwordVal}
          secureTextEntry
          autoComplete="password-new"
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Button title="Guardar" onPress={submit} loading={loading} disabled={!canSubmit} />
      </View>

      <Link href="/(auth)/login" asChild>
        <Pressable>
          <Text style={styles.link}>Iniciar sesión</Text>
        </Pressable>
      </Link>
    </AuthScreenShell>
  );
}

const styles = StyleSheet.create({
  form: { marginBottom: theme.spacing.lg },
  muted: { color: theme.colors.textMuted, marginBottom: 16, textAlign: 'center' },
  error: { color: theme.colors.danger, marginBottom: theme.spacing.sm, textAlign: 'center' },
  link: { color: theme.colors.accent, textAlign: 'center', fontSize: 15, marginTop: 12 },
});
