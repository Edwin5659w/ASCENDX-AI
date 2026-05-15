import { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Pressable,
  Alert,
} from 'react-native';
import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { authApi } from '@/src/api/services';
import { Button } from '@/src/components/ui/Button';
import { ValidatedInput } from '@/src/components/auth/ValidatedInput';
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
      <LinearGradient colors={['#0a0a0f', '#1a1033', '#0a0a0f']} style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.muted}>Enlace inválido (falta token).</Text>
          <Link href={'/(auth)/forgot-password' as any} asChild>
            <Text style={styles.link}>Solicitar nuevo enlace</Text>
          </Link>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#0a0a0f', '#1a1033', '#0a0a0f']} style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={styles.logo}>ASCENDX</Text>
          <Text style={styles.subtitle}>Nueva contraseña</Text>

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
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: theme.spacing.lg },
  logo: {
    fontSize: 36,
    fontWeight: '800',
    color: theme.colors.text,
    letterSpacing: 4,
    textAlign: 'center',
  },
  subtitle: { color: theme.colors.textMuted, textAlign: 'center', marginBottom: 28, fontSize: 16 },
  form: { marginBottom: theme.spacing.lg },
  muted: { color: theme.colors.textMuted, marginBottom: 16 },
  error: { color: theme.colors.danger, marginBottom: theme.spacing.sm, textAlign: 'center' },
  link: { color: theme.colors.primaryLight, textAlign: 'center', fontSize: 15, marginTop: 12 },
});
