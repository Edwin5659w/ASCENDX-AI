import { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Link } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { authApi } from '@/src/api/services';
import { Button } from '@/src/components/ui/Button';
import { ValidatedInput } from '@/src/components/auth/ValidatedInput';
import { validateLoginEmail } from '@/src/lib/auth.rules';
import { theme } from '@/constants/theme';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [touched, setTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const emailVal = useMemo(() => validateLoginEmail(email, touched), [email, touched]);

  const submit = async () => {
    setTouched(true);
    setError('');
    if (emailVal.status !== 'valid') return;
    setLoading(true);
    try {
      await authApi.forgotPassword(email.trim().toLowerCase());
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#0a0a0f', '#1a1033', '#0a0a0f']} style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={styles.logo}>ASCENDX</Text>
          <Text style={styles.subtitle}>Recuperar contraseña</Text>

          {done ? (
            <View style={styles.box}>
              <Text style={styles.info}>
                Si existe una cuenta con ese correo, revisa la consola del servidor en desarrollo para el enlace con el
                token, o configura el envío de emails en producción.
              </Text>
              <Link href="/(auth)/login" asChild>
                <Text style={styles.linkCenter}>
                  <Text style={styles.linkBold}>Volver al inicio de sesión</Text>
                </Text>
              </Link>
            </View>
          ) : (
            <View style={styles.form}>
              <ValidatedInput
                label="Correo electrónico"
                placeholder="nombre@gmail.com"
                value={email}
                onChangeText={setEmail}
                onBlur={() => setTouched(true)}
                validation={emailVal}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
              />
              {error ? <Text style={styles.error}>{error}</Text> : null}
              <Button title="Enviar" onPress={submit} loading={loading} disabled={emailVal.status !== 'valid'} />
            </View>
          )}

          <Link href="/(auth)/login" asChild>
            <Text style={styles.link}>Volver al inicio de sesión</Text>
          </Link>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
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
  box: { padding: theme.spacing.md },
  info: { color: theme.colors.textMuted, fontSize: 14, lineHeight: 22, marginBottom: 20 },
  error: { color: theme.colors.danger, marginBottom: theme.spacing.sm, textAlign: 'center' },
  link: { color: theme.colors.primaryLight, textAlign: 'center', fontSize: 15 },
  linkCenter: { textAlign: 'center' },
  linkBold: { color: theme.colors.primaryLight, fontWeight: '600' },
});
