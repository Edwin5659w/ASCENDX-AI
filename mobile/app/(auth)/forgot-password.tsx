import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Link } from 'expo-router';
import { authApi } from '@/src/api/services';
import { Button } from '@/src/components/ui/Button';
import { ValidatedInput } from '@/src/components/auth/ValidatedInput';
import { AuthScreenShell } from '@/src/components/brand/AuthScreenShell';
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
    <AuthScreenShell subtitle="Recuperar contraseña">
      {done ? (
        <View style={styles.box}>
          <Text style={styles.info}>
            Si existe una cuenta con ese correo, revisa la consola del servidor en desarrollo para el enlace con el
            token, o configura el envío de emails en producción.
          </Text>
          <Link href="/(auth)/login" asChild>
            <Text style={styles.linkBold}>Volver al inicio de sesión</Text>
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
    </AuthScreenShell>
  );
}

const styles = StyleSheet.create({
  form: { marginBottom: theme.spacing.lg },
  box: { padding: theme.spacing.md, marginBottom: theme.spacing.lg },
  info: { color: theme.colors.textMuted, fontSize: 14, lineHeight: 22, marginBottom: 20, textAlign: 'center' },
  error: { color: theme.colors.danger, marginBottom: theme.spacing.sm, textAlign: 'center' },
  link: { color: theme.colors.accent, textAlign: 'center', fontSize: 15 },
  linkBold: { color: theme.colors.accent, fontWeight: '600', textAlign: 'center' },
});
