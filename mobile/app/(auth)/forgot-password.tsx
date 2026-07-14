import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { authApi } from '@/src/api/services';
import { formatApiError } from '@/src/api/client';
import { Button } from '@/src/components/ui/Button';
import { ValidatedInput } from '@/src/components/auth/ValidatedInput';
import { AuthScreenShell } from '@/src/components/brand/AuthScreenShell';
import { validateLoginEmail } from '@/src/lib/auth.rules';
import { theme } from '@/constants/theme';

export default function ForgotPasswordScreen() {
  const router = useRouter();
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
      setError(formatApiError(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthScreenShell subtitle="Recuperar contraseña">
      {done ? (
        <View style={styles.box}>
          <Text style={styles.info}>
            Si existe una cuenta con ese correo, te enviamos un enlace para restablecer la contraseña.
            Revisa tu bandeja y la carpeta de spam.
          </Text>
          {__DEV__ ? (
            <Text style={styles.devHint}>
              Dev: si el email no está configurado, el token aparece en la consola del backend.
            </Text>
          ) : null}
          <Pressable onPress={() => router.replace('/(auth)/login')}>
            <Text style={styles.linkBold}>Volver al inicio de sesión</Text>
          </Pressable>
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

      <Pressable onPress={() => router.back()}>
        <Text style={styles.link}>Volver al inicio de sesión</Text>
      </Pressable>
    </AuthScreenShell>
  );
}

const styles = StyleSheet.create({
  form: { marginBottom: theme.spacing.lg },
  box: { padding: theme.spacing.md, marginBottom: theme.spacing.lg },
  info: { color: theme.colors.textMuted, fontSize: 14, lineHeight: 22, marginBottom: 12, textAlign: 'center' },
  devHint: {
    color: theme.colors.warning,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 16,
    textAlign: 'center',
  },
  error: { color: theme.colors.danger, marginBottom: theme.spacing.sm, textAlign: 'center' },
  link: { color: theme.colors.accent, textAlign: 'center', fontSize: 15 },
  linkBold: { color: theme.colors.accent, fontWeight: '600', textAlign: 'center' },
});
