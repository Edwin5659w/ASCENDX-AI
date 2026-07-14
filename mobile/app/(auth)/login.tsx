import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Link } from 'expo-router';
import { formatApiError } from '@/src/api/client';
import { useAuth } from '@/src/context/AuthContext';
import { Button } from '@/src/components/ui/Button';
import { ValidatedInput } from '@/src/components/auth/ValidatedInput';
import { AuthScreenShell } from '@/src/components/brand/AuthScreenShell';
import { validateLoginEmail, validateLoginPassword } from '@/src/lib/auth.rules';
import { OAuthButtons } from '@/src/components/auth/OAuthButtons';
import type { AppTheme } from '@/constants/theme';
import { useThemedStyles } from '@/src/hooks/useThemedStyles';

function createStyles(theme: AppTheme) {
  return {
    form: { marginBottom: theme.spacing.md },
    forgot: {
      color: theme.colors.accent,
      textAlign: 'center' as const,
      fontSize: 14,
      marginBottom: theme.spacing.lg,
    },
    showBtn: { marginTop: -8, marginBottom: theme.spacing.md },
    showBtnText: {
      color: theme.colors.primaryLight,
      fontSize: 13,
      textAlign: 'right' as const,
    },
    error: {
      color: theme.colors.danger,
      marginBottom: theme.spacing.sm,
      textAlign: 'center' as const,
    },
    link: { color: theme.colors.textMuted, textAlign: 'center' as const, fontSize: 15 },
    linkBold: { color: theme.colors.accent, fontWeight: '600' as const },
  };
}

export default function LoginScreen() {
  const { login, loginWithGoogle, loginWithApple } = useAuth();
  const styles = useThemedStyles(createStyles);
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
      setSubmitError(formatApiError(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthScreenShell subtitle="Inicia sesión en tu cuenta">
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
        <OAuthButtons
          onGoogleSuccess={async (token) => {
            await loginWithGoogle(token);
          }}
          onAppleSuccess={async (token, name) => {
            await loginWithApple(token, name);
          }}
          onError={setSubmitError}
        />
      </View>

      <Link href={'/(auth)/forgot-password' as any} asChild>
        <Text style={styles.forgot}>¿Olvidaste tu contraseña?</Text>
      </Link>

      <Link href="/(auth)/register" asChild>
        <Text style={styles.link}>
          ¿No tienes cuenta? <Text style={styles.linkBold}>Regístrate</Text>
        </Text>
      </Link>
    </AuthScreenShell>
  );
}
