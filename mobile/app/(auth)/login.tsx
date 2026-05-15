import { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Link } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/src/context/AuthContext';
import { Button } from '@/src/components/ui/Button';
import { ValidatedInput } from '@/src/components/auth/ValidatedInput';
import { validateLoginEmail, validateLoginPassword } from '@/src/lib/auth.rules';
import { theme } from '@/constants/theme';

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState({ email: false, password: false });
  const [submitError, setSubmitError] = useState('');
  const [loading, setLoading] = useState(false);

  const emailVal = useMemo(() => validateLoginEmail(email, touched.email), [email, touched.email]);
  const passwordVal = useMemo(
    () => validateLoginPassword(password, touched.password),
    [password, touched.password],
  );

  const isFormValid = emailVal.status === 'valid' && passwordVal.status === 'valid';

  const handleLogin = async () => {
    setTouched({ email: true, password: true });
    setSubmitError('');
    if (!isFormValid) return;

    setLoading(true);
    try {
      await login(email.trim().toLowerCase(), password);
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : 'Correo o contraseña incorrectos');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#0a0a0f', '#1a1033', '#0a0a0f']} style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={styles.logo}>ASCENDX</Text>
          <Text style={styles.subtitle}>Inicia sesión en tu cuenta</Text>

          <View style={styles.form}>
            <ValidatedInput
              label="Correo electrónico"
              placeholder="nombre@gmail.com"
              value={email}
              onChangeText={setEmail}
              onBlur={() => setTouched((t) => ({ ...t, email: true }))}
              validation={emailVal}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
            />
            <ValidatedInput
              label="Contraseña"
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              onBlur={() => setTouched((t) => ({ ...t, password: true }))}
              validation={passwordVal}
              secureTextEntry={!showPassword}
              autoComplete="password"
            />
            <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.showBtn}>
              <Text style={styles.showBtnText}>{showPassword ? 'Ocultar' : 'Mostrar'} contraseña</Text>
            </Pressable>
            {submitError ? <Text style={styles.error}>{submitError}</Text> : null}
            <Button title="Iniciar sesión" onPress={handleLogin} loading={loading} disabled={!isFormValid} />
          </View>

          <Link href="/(auth)/register" asChild>
            <Text style={styles.link}>
              ¿No tienes cuenta? <Text style={styles.linkBold}>Regístrate</Text>
            </Text>
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
    fontSize: 42,
    fontWeight: '800',
    color: theme.colors.text,
    letterSpacing: 4,
    textAlign: 'center',
  },
  subtitle: { color: theme.colors.textMuted, textAlign: 'center', marginBottom: 40, fontSize: 16 },
  form: { marginBottom: theme.spacing.lg },
  showBtn: { marginTop: -8, marginBottom: theme.spacing.md },
  showBtnText: { color: theme.colors.primaryLight, fontSize: 13, textAlign: 'right' },
  error: { color: theme.colors.danger, marginBottom: theme.spacing.sm, textAlign: 'center' },
  link: { color: theme.colors.textMuted, textAlign: 'center', fontSize: 15 },
  linkBold: { color: theme.colors.primaryLight, fontWeight: '600' },
});
